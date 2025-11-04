import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateRoomBooking, deleteRoomBooking } from "@/lib/microsoft-graph";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const { title, description, start, end, roomId, userEmail } = data;

    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if booking belongs to user
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (existingBooking.userId !== user.id) {
      return NextResponse.json({ error: "Not authorized to edit this booking" }, { status: 403 });
    }

    // Validate dates if provided
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (startDate >= endDate) {
        return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
      }

      // Check for conflicts (excluding this booking)
      const conflicts = await prisma.booking.findMany({
        where: {
          id: { not: id },
          roomId: roomId || existingBooking.roomId,
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
    }

    // Sync with Microsoft Calendar if event exists
    if (existingBooking.msEventId && existingBooking.room.msResourceEmail) {
      try {
        console.log(`Updating Microsoft Calendar event: ${existingBooking.msEventId}`);
        await updateRoomBooking(
          existingBooking.msEventId,
          userEmail,
          {
            subject: title,
            description: description,
            startTime: start ? new Date(start) : undefined,
            endTime: end ? new Date(end) : undefined,
          }
        );
        console.log('Microsoft event updated successfully');
      } catch (msError) {
        console.error('Failed to update Microsoft Calendar event:', msError);
        // Continue with local update even if MS sync fails
      }
    }

    // Update booking
    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(start && { start: new Date(start) }),
        ...(end && { end: new Date(end) }),
        ...(roomId && { roomId }),
      },
      include: {
        room: true,
        user: true,
      },
    });

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if booking belongs to user
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (existingBooking.userId !== user.id) {
      return NextResponse.json({ error: "Not authorized to delete this booking" }, { status: 403 });
    }

    // Delete from Microsoft Calendar if event exists
    if (existingBooking.msEventId && existingBooking.room.msResourceEmail) {
      try {
        console.log(`Deleting Microsoft Calendar event: ${existingBooking.msEventId}`);
        await deleteRoomBooking(existingBooking.msEventId, userEmail);
        console.log('Microsoft event deleted successfully');
      } catch (msError) {
        console.error('Failed to delete Microsoft Calendar event:', msError);
        // Continue with local delete even if MS sync fails
      }
    }

    // Soft delete by setting status to CANCELLED
    await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
  }
}

