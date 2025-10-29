import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // Get user email from query params
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('email');
    
    if (!userEmail) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all bookings for this user
    const bookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
        status: { not: 'CANCELLED' },
      },
      include: {
        room: {
          select: {
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        start: 'asc',
      },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

