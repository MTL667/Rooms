import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRoomEvents } from '@/lib/microsoft-graph';

/**
 * Sync external calendar bookings from Microsoft to local database
 * GET /api/admin/microsoft/sync-calendar
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail');
    const roomId = searchParams.get('roomId'); // Optional: sync specific room only

    // Check authentication
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    console.log('🔄 Starting calendar sync from Microsoft...');

    // Get rooms to sync
    const rooms = await prisma.room.findMany({
      where: roomId ? { id: roomId } : { msResourceEmail: { not: null } },
    });

    const roomsToSync = rooms.filter((r) => r.msResourceEmail);

    if (roomsToSync.length === 0) {
      return NextResponse.json({
        message: 'No rooms with Microsoft resource emails found',
        synced: 0,
      });
    }

    console.log(`📅 Found ${roomsToSync.length} rooms to sync`);

    const syncResults = {
      totalRooms: roomsToSync.length,
      totalEvents: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90); // Sync next 90 days

    for (const room of roomsToSync) {
      try {
        console.log(`\n📍 Syncing room: ${room.name} (${room.msResourceEmail})`);

        // Get events from Microsoft Calendar
        const msEvents = await getRoomEvents(room.msResourceEmail!, now, futureDate);

        console.log(`   Found ${msEvents.length} events in Microsoft Calendar`);
        syncResults.totalEvents += msEvents.length;

        for (const msEvent of msEvents) {
          try {
            // Parse dates
            const startDate = new Date(msEvent.start.dateTime);
            const endDate = new Date(msEvent.end.dateTime);

            // Check if event already exists in our database
            // Match by iCalUId (unique identifier across systems)
            const existingBooking = await prisma.booking.findFirst({
              where: {
                OR: [
                  { msICalUid: msEvent.iCalUId },
                  {
                    AND: [
                      { roomId: room.id },
                      { start: startDate },
                      { end: endDate },
                    ],
                  },
                ],
              },
            });

            if (existingBooking) {
              console.log(`   ⏭️  Skipping existing event: ${msEvent.subject}`);
              syncResults.skipped++;
              continue;
            }

            // Get or create user for organizer
            const organizerEmail = msEvent.organizer?.emailAddress?.address;
            if (!organizerEmail) {
              console.log(`   ⚠️  No organizer email for event: ${msEvent.subject}`);
              syncResults.skipped++;
              continue;
            }

            let eventUser = await prisma.user.findUnique({
              where: { email: organizerEmail },
            });

            if (!eventUser) {
              // Create user from organizer info
              const organizerName = msEvent.organizer?.emailAddress?.name || organizerEmail;
              eventUser = await prisma.user.create({
                data: {
                  email: organizerEmail,
                  name: organizerName,
                  role: 'EXTERNAL', // External users who book via Outlook
                },
              });
              console.log(`   👤 Created user: ${organizerEmail}`);
            }

            // Create booking in database
            await prisma.booking.create({
              data: {
                roomId: room.id,
                userId: eventUser.id,
                title: msEvent.subject || 'Untitled Event',
                description: msEvent.bodyPreview || null,
                start: startDate,
                end: endDate,
                status: 'CONFIRMED',
                msEventId: msEvent.id,
                msICalUid: msEvent.iCalUId || null,
              },
            });

            console.log(`   ✅ Imported: ${msEvent.subject} (${startDate.toLocaleString()})`);
            syncResults.imported++;
          } catch (eventError: any) {
            const errorMsg = `Error importing event ${msEvent.subject}: ${eventError.message}`;
            console.error(`   ❌ ${errorMsg}`);
            syncResults.errors.push(errorMsg);
          }
        }
      } catch (roomError: any) {
        const errorMsg = `Error syncing room ${room.name}: ${roomError.message}`;
        console.error(`   ❌ ${errorMsg}`);
        syncResults.errors.push(errorMsg);
      }
    }

    console.log('\n✅ Calendar sync completed');
    console.log(`   Total events: ${syncResults.totalEvents}`);
    console.log(`   Imported: ${syncResults.imported}`);
    console.log(`   Skipped: ${syncResults.skipped}`);
    console.log(`   Errors: ${syncResults.errors.length}`);

    return NextResponse.json({
      success: true,
      message: 'Calendar sync completed',
      results: syncResults,
    });
  } catch (error: any) {
    console.error('Calendar sync error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync calendar',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

