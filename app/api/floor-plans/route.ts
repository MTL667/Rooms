import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const floorPlans = await prisma.floorPlan.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: {
        rooms: {
          where: { active: true },
          include: {
            bookings: {
              where: {
                start: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  lt: new Date(new Date().setHours(23, 59, 59, 999)),
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
        },
      },
    });
    return NextResponse.json({ floorPlans });
  } catch (error) {
    console.error("Error fetching floor plans:", error);
    return NextResponse.json({ error: "Failed to fetch floor plans" }, { status: 500 });
  }
}

