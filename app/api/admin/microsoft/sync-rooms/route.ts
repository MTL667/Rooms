import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMicrosoftRooms } from '@/lib/microsoft-graph';

/**
 * Sync rooms from Microsoft Entra to database
 */
export async function POST(req: Request) {
  try {
    const { userEmail } = await req.json();

    // Verify admin user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting Microsoft Rooms sync...');

    // Get rooms from Microsoft
    const msRooms = await getMicrosoftRooms();
    console.log(`Found ${msRooms.length} rooms in Microsoft Entra`);

    const syncResults = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    for (const msRoom of msRooms) {
      try {
        // Check if room already exists by email
        const existingRoom = await prisma.room.findFirst({
          where: { msResourceEmail: msRoom.emailAddress },
        });

        if (existingRoom) {
          // Update existing room
          await prisma.room.update({
            where: { id: existingRoom.id },
            data: {
              name: msRoom.displayName,
              capacity: msRoom.capacity || existingRoom.capacity,
              location: msRoom.building || existingRoom.location,
            },
          });
          syncResults.updated++;
          console.log(`Updated room: ${msRoom.displayName}`);
        } else {
          // Create new room
          await prisma.room.create({
            data: {
              name: msRoom.displayName,
              capacity: msRoom.capacity || 0,
              location: msRoom.building || null,
              msResourceEmail: msRoom.emailAddress,
              hourlyRateCents: 0,
              active: true,
            },
          });
          syncResults.created++;
          console.log(`Created room: ${msRoom.displayName}`);
        }
      } catch (error) {
        const errorMsg = `Error syncing room ${msRoom.displayName}: ${error}`;
        console.error(errorMsg);
        syncResults.errors.push(errorMsg);
      }
    }

    console.log('Sync completed:', syncResults);

    return NextResponse.json({
      success: true,
      totalRooms: msRooms.length,
      created: syncResults.created,
      updated: syncResults.updated,
      errors: syncResults.errors,
    });
  } catch (error) {
    console.error('Error syncing Microsoft rooms:', error);
    return NextResponse.json(
      { error: 'Failed to sync rooms', details: String(error) },
      { status: 500 }
    );
  }
}

