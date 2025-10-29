import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: {
        bookings: {
          where: {
            start: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today
              lt: new Date(new Date().setHours(23, 59, 59, 999)), // End of today
            },
          },
          select: {
            id: true,
            start: true,
            end: true,
            title: true,
          },
        },
      },
    });
    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}

