import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const room = await prisma.room.findUnique({ where: { id } });
    return NextResponse.json({ room });
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json({ error: "Failed to fetch room" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const room = await prisma.room.update({
      where: { id },
      data,
    });
    return NextResponse.json({ room });
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // Clear all bookings for this room
    if (action === 'clear-bookings') {
      const deletedBookings = await prisma.booking.deleteMany({
        where: { roomId: id },
      });
      return NextResponse.json({
        success: true,
        message: `Cleared ${deletedBookings.count} bookings`,
        count: deletedBookings.count,
      });
    }

    // Delete the room itself
    await prisma.room.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
  }
}
