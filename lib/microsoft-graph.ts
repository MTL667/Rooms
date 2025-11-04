import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

interface GraphAuthProvider {
  getAccessToken(): Promise<string>;
}

class ClientCredentialsAuthProvider implements GraphAuthProvider {
  private clientId: string;
  private clientSecret: string;
  private tenantId: string;
  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor(clientId: string, clientSecret: string, tenantId: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.tenantId = tenantId;
  }

  clearCache() {
    this.tokenCache = null;
  }

  async getAccessToken(): Promise<string> {
    // Return cached token if still valid (but not if too old - force refresh every 30 min)
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      console.log('Using cached token');
      return this.tokenCache.token;
    }

    console.log('Fetching new access token...');

    const tokenEndpoint = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });

    try {
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get access token: ${error}`);
      }

      const data = await response.json();
      
      console.log('Token received, expires in:', data.expires_in, 'seconds');
      console.log('Token type:', data.token_type);
      
      // Decode token to see permissions (for debugging)
      try {
        const tokenParts = data.access_token.split('.');
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log('Token permissions (roles):', payload.roles || 'None');
        console.log('Token scopes (scp):', payload.scp || 'None');
      } catch (e) {
        console.log('Could not decode token for debugging');
      }
      
      // Cache token (subtract 5 minutes for safety)
      this.tokenCache = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 300) * 1000,
      };

      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }
}

export function createGraphClient(): Client {
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenantId = process.env.AZURE_TENANT_ID;

  if (!clientId || !clientSecret || !tenantId) {
    throw new Error('Missing Azure AD credentials');
  }

  const authProvider = new ClientCredentialsAuthProvider(clientId, clientSecret, tenantId);

  return Client.init({
    authProvider: (done) => {
      authProvider
        .getAccessToken()
        .then((token) => done(null, token))
        .catch((error) => done(error, null));
    },
  });
}

export interface RoomResource {
  id: string;
  displayName: string;
  emailAddress: string;
  capacity?: number;
  building?: string;
  floorLabel?: string;
  phone?: string;
}

export interface CalendarEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  organizer?: { emailAddress: { name?: string; address: string } };
  location?: { displayName: string };
  iCalUId?: string;
}

export interface RoomAvailability {
  roomEmail: string;
  availability: 'free' | 'busy' | 'tentative' | 'away' | 'unknown';
  events: CalendarEvent[];
}

/**
 * Get all room resources from Microsoft Entra
 */
export async function getMicrosoftRooms(): Promise<RoomResource[]> {
  try {
    const client = createGraphClient();
    
    console.log('Attempting to fetch room lists from Microsoft Graph...');
    
    try {
      // Try to get all room lists
      console.log('Calling Graph API: GET /places/microsoft.graph.roomlist');
      const roomLists = await client
        .api('/places/microsoft.graph.roomlist')
        .get();

      console.log(`✅ Found ${roomLists.value?.length || 0} room lists`);

      const allRooms: RoomResource[] = [];

      // Get rooms from each room list
      for (const roomList of roomLists.value || []) {
        try {
          console.log(`Fetching rooms from list: ${roomList.displayName}`);
          const rooms = await client
            .api(`/places/${roomList.id}/microsoft.graph.roomlist/rooms`)
            .get();

          console.log(`Found ${rooms.value?.length || 0} rooms in ${roomList.displayName}`);

          for (const room of rooms.value || []) {
            allRooms.push({
              id: room.id,
              displayName: room.displayName,
              emailAddress: room.emailAddress,
              capacity: room.capacity,
              building: room.building,
              floorLabel: room.floorLabel,
              phone: room.phone,
            });
          }
        } catch (error: any) {
          console.error(`Error getting rooms from list ${roomList.displayName}:`, error);
          console.error('Error details:', error.message, error.statusCode);
        }
      }

      console.log(`Total rooms from lists: ${allRooms.length}`);
      
      // If no rooms from lists, try direct /places/microsoft.graph.room endpoint
      if (allRooms.length === 0) {
        console.log('⚠️ No rooms found in lists, trying /places/microsoft.graph.room endpoint...');
        try {
          const directRooms = await client
            .api('/places/microsoft.graph.room')
            .get();

          console.log(`✅ Found ${directRooms.value?.length || 0} rooms via direct room endpoint`);

          for (const room of directRooms.value || []) {
            allRooms.push({
              id: room.id,
              displayName: room.displayName,
              emailAddress: room.emailAddress,
              capacity: room.capacity,
              building: room.building,
              floorLabel: room.floorLabel,
              phone: room.phone,
            });
          }
        } catch (directError: any) {
          console.error('Direct room endpoint also failed:', directError.message);
          throw new Error(`Failed to fetch rooms from Microsoft Graph.\n\nTried:\n1. /places/microsoft.graph.roomlist\n2. /places/microsoft.graph.room\n\nBoth failed. Please ensure Place.Read.All permission is granted.`);
        }
      }
      
      // Additional: Try /places endpoint without type filter to catch all mailbox types
      if (allRooms.length < 10) {
        console.log('⚠️ Found fewer than 10 rooms, trying generic /places endpoint...');
        try {
          const allPlaces = await client
            .api('/places')
            .get();

          console.log(`✅ Found ${allPlaces.value?.length || 0} total places`);

          // Filter for room-like resources (those with emailAddress)
          for (const place of allPlaces.value || []) {
            if (place.emailAddress && !allRooms.find(r => r.emailAddress === place.emailAddress)) {
              allRooms.push({
                id: place.id,
                displayName: place.displayName,
                emailAddress: place.emailAddress,
                capacity: place.capacity,
                building: place.building,
                floorLabel: place.floorLabel,
                phone: place.phone,
              });
            }
          }
          console.log(`✅ Total rooms after places check: ${allRooms.length}`);
        } catch (placesError: any) {
          console.log('⚠️ Generic /places endpoint not available or failed');
        }
      }
      
      return allRooms;
    } catch (placesError: any) {
      // If Places API fails, log error and throw
      console.log('❌ Places API failed');
      console.error('Places API error details:', {
        message: placesError.message,
        statusCode: placesError.statusCode,
        code: placesError.code,
      });
      
      throw new Error(
        `Failed to fetch rooms from Microsoft Graph.\n\n` +
        `Error Code: ${placesError.statusCode || placesError.code || 'Unknown'}\n` +
        `Error: ${placesError.message || 'Unknown error'}\n\n` +
        `Required Permissions:\n` +
        `- Place.Read.All (Application)\n\n` +
        `Please verify:\n` +
        `1. Place.Read.All permission is added as "Application"\n` +
        `2. Admin consent is granted\n` +
        `3. Wait 5-10 minutes after granting consent`
      );
    }
  } catch (error: any) {
    console.error('Error getting Microsoft rooms:', error);
    throw new Error(`Microsoft Graph API error: ${error.message || 'Unknown error'}. Please check Azure AD app permissions.`);
  }
}

/**
 * Get room availability for a specific time range
 */
export async function getRoomAvailability(
  roomEmails: string[],
  startTime: Date,
  endTime: Date
): Promise<RoomAvailability[]> {
  try {
    const client = createGraphClient();

    const schedules = roomEmails.map((email) => ({
      scheduleId: email,
      scheduleItems: [],
    }));

    const response = await client
      .api('/users/me/calendar/getSchedule')
      .post({
        schedules: schedules.map((s) => s.scheduleId),
        startTime: {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC',
        },
        endTime: {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC',
        },
        availabilityViewInterval: 15,
      });

    return response.value.map((schedule: any) => ({
      roomEmail: schedule.scheduleId,
      availability: schedule.availabilityView === '0' ? 'free' : 'busy',
      events: schedule.scheduleItems || [],
    }));
  } catch (error) {
    console.error('Error getting room availability:', error);
    throw error;
  }
}

/**
 * Create a calendar event in a room's calendar
 */
export async function createRoomBooking(
  roomEmail: string,
  subject: string,
  description: string,
  startTime: Date,
  endTime: Date,
  organizerEmail: string
): Promise<CalendarEvent> {
  try {
    const client = createGraphClient();

    const event = {
      subject,
      body: {
        contentType: 'text',
        content: description,
      },
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'UTC',
      },
      location: {
        displayName: roomEmail,
      },
      attendees: [
        // Add the room as a resource attendee
        {
          emailAddress: {
            address: roomEmail,
            name: roomEmail,
          },
          type: 'resource',
        },
        // Add the organizer as a required attendee
        {
          emailAddress: {
            address: organizerEmail,
            name: organizerEmail,
          },
          type: 'required',
        },
      ],
      isReminderOn: true,
      reminderMinutesBeforeStart: 15,
    };

    console.log(`Creating calendar event for room: ${roomEmail}`);
    console.log(`Organizer: ${organizerEmail}`);
    console.log(`Time: ${startTime.toISOString()} - ${endTime.toISOString()}`);

    // Create event on the organizer's calendar with send notifications
    // This will trigger Microsoft to send meeting invitations to attendees
    const createdEvent = await client
      .api(`/users/${organizerEmail}/calendar/events`)
      .post(event);

    console.log(`✅ Calendar event created: ${createdEvent.id}`);

    // Also create the event in the room's calendar so it shows up in their availability
    // This helps with double-booking prevention
    try {
      console.log(`Adding event to room calendar: ${roomEmail}`);
      await client
        .api(`/users/${roomEmail}/calendar/events`)
        .post({
          ...event,
          attendees: [
            {
              emailAddress: {
                address: organizerEmail,
                name: organizerEmail,
              },
              type: 'required',
            },
          ],
        });
      console.log(`✅ Event added to room calendar`);
    } catch (roomCalendarError: any) {
      console.log(`⚠️ Could not add to room calendar (this is okay):`, roomCalendarError.message);
      // This is optional - the invitation will still work if organizer's event is created
    }

    return {
      id: createdEvent.id,
      subject: createdEvent.subject,
      start: createdEvent.start,
      end: createdEvent.end,
      organizer: createdEvent.organizer,
      location: createdEvent.location,
      iCalUId: createdEvent.iCalUId,
    };
  } catch (error) {
    console.error('Error creating room booking:', error);
    throw error;
  }
}

/**
 * Update an existing calendar event
 */
export async function updateRoomBooking(
  eventId: string,
  organizerEmail: string,
  updates: {
    subject?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
  }
): Promise<CalendarEvent> {
  try {
    const client = createGraphClient();

    const event: any = {};
    
    if (updates.subject) event.subject = updates.subject;
    if (updates.description) {
      event.body = {
        contentType: 'text',
        content: updates.description,
      };
    }
    if (updates.startTime) {
      event.start = {
        dateTime: updates.startTime.toISOString(),
        timeZone: 'UTC',
      };
    }
    if (updates.endTime) {
      event.end = {
        dateTime: updates.endTime.toISOString(),
        timeZone: 'UTC',
      };
    }

    const updatedEvent = await client
      .api(`/users/${organizerEmail}/calendar/events/${eventId}`)
      .patch(event);

    return {
      id: updatedEvent.id,
      subject: updatedEvent.subject,
      start: updatedEvent.start,
      end: updatedEvent.end,
      organizer: updatedEvent.organizer,
      location: updatedEvent.location,
      iCalUId: updatedEvent.iCalUId,
    };
  } catch (error) {
    console.error('Error updating room booking:', error);
    throw error;
  }
}

/**
 * Delete a calendar event
 */
export async function deleteRoomBooking(
  eventId: string,
  organizerEmail: string
): Promise<void> {
  try {
    const client = createGraphClient();

    await client
      .api(`/users/${organizerEmail}/calendar/events/${eventId}`)
      .delete();
  } catch (error) {
    console.error('Error deleting room booking:', error);
    throw error;
  }
}

/**
 * Get room calendar events for a specific date range
 */
export async function getRoomEvents(
  roomEmail: string,
  startTime: Date,
  endTime: Date
): Promise<CalendarEvent[]> {
  try {
    const client = createGraphClient();

    const response = await client
      .api(`/users/${roomEmail}/calendar/calendarView`)
      .query({
        startDateTime: startTime.toISOString(),
        endDateTime: endTime.toISOString(),
      })
      .select('id,subject,start,end,organizer,location,iCalUId')
      .get();

    return response.value.map((event: any) => ({
      id: event.id,
      subject: event.subject,
      start: event.start,
      end: event.end,
      organizer: event.organizer,
      location: event.location,
      iCalUId: event.iCalUId,
    }));
  } catch (error) {
    console.error('Error getting room events:', error);
    return [];
  }
}

