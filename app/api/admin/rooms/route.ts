import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { bookings: true },
        },
        locationRef: {
          select: {
            name: true,
            city: true,
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

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const room = await prisma.room.create({
      data: {
        name: data.name,
        capacity: data.capacity,
        location: data.location || null,
        locationId: data.locationId || null,
        msResourceEmail: data.msResourceEmail || null,
        hourlyRateCents: data.hourlyRateCents || 0,
        active: data.active ?? true,
        floorPlanId: data.floorPlanId || null,
        positionX: data.positionX ?? null,
        positionY: data.positionY ?? null,
        areaWidth: data.areaWidth ?? null,
        areaHeight: data.areaHeight ?? null,
      },
    });
    return NextResponse.json({ room });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
