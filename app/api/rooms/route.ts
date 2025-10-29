import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // Get date from query params (defaults to today)
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    
    let targetDate: Date;
    if (dateParam) {
      targetDate = new Date(dateParam);
    } else {
      targetDate = new Date();
    }
    
    // Set to start and end of the target date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const rooms = await prisma.room.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: {
        bookings: {
          where: {
            start: {
              gte: startOfDay,
              lt: endOfDay,
            },
            status: { not: 'CANCELLED' },
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

