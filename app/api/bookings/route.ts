import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRoomBooking } from "@/lib/microsoft-graph";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { roomId, title, description, start, end, userEmail } = data;

    // Validate user email
    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 401 });
    }

    // Validate required fields
    if (!roomId || !title || !start || !end) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate dates
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (startDate >= endDate) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    // Check for conflicts
    const conflicts = await prisma.booking.findMany({
      where: {
        roomId,
        status: { not: 'CANCELLED' },
        OR: [
          {
            AND: [
              { start: { lte: startDate } },
              { end: { gt: startDate } },
            ],
          },
          {
            AND: [
              { start: { lt: endDate } },
              { end: { gte: endDate } },
            ],
          },
          {
            AND: [
              { start: { gte: startDate } },
              { end: { lte: endDate } },
            ],
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      return NextResponse.json({ error: "Room is already booked for this time slot" }, { status: 409 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get room details
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    let msEventId: string | null = null;
    let msICalUid: string | null = null;

    // Sync with Microsoft Calendar if room has resource email
    if (room.msResourceEmail) {
      try {
        console.log(`Syncing booking to Microsoft Calendar for room: ${room.msResourceEmail}`);
        const msEvent = await createRoomBooking(
          room.msResourceEmail,
          title,
          description || '',
          startDate,
          endDate,
          userEmail
        );
        msEventId = msEvent.id;
        msICalUid = msEvent.iCalUId || null;
        console.log(`Microsoft event created: ${msEventId}`);
      } catch (msError) {
        console.error('Failed to create Microsoft Calendar event:', msError);
        // Continue with local booking even if MS sync fails
      }
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        roomId,
        userId: user.id,
        title,
        description: description || null,
        start: startDate,
        end: endDate,
        status: 'CONFIRMED',
        msEventId: msEventId,
        msICalUid: msICalUid,
      },
      include: {
        room: true,
        user: true,
      },
    });

    return NextResponse.json({ 
      booking,
      microsoftSynced: !!msEventId,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}

