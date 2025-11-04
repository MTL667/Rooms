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

  async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token;
    }

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
    
    // Get all room lists
    const roomLists = await client
      .api('/places/microsoft.graph.roomlist')
      .get();

    const allRooms: RoomResource[] = [];

    // Get rooms from each room list
    for (const roomList of roomLists.value || []) {
      try {
        const rooms = await client
          .api(`/places/${roomList.id}/microsoft.graph.roomlist/rooms`)
          .get();

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
      } catch (error) {
        console.error(`Error getting rooms from list ${roomList.displayName}:`, error);
      }
    }

    return allRooms;
  } catch (error) {
    console.error('Error getting Microsoft rooms:', error);
    throw error;
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
        {
          emailAddress: {
            address: roomEmail,
            name: roomEmail,
          },
          type: 'resource',
        },
      ],
    };

    // Create event on the organizer's calendar
    const createdEvent = await client
      .api(`/users/${organizerEmail}/calendar/events`)
      .post(event);

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

