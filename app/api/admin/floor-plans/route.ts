import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const floorPlans = await prisma.floorPlan.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { rooms: true },
        },
      },
    });
    return NextResponse.json({ floorPlans });
  } catch (error) {
    console.error("Error fetching floor plans:", error);
    return NextResponse.json({ error: "Failed to fetch floor plans" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const floorPlan = await prisma.floorPlan.create({
      data: {
        name: data.name,
        building: data.building || null,
        floor: data.floor || null,
        imageUrl: data.imageUrl,
        active: data.active ?? true,
      },
    });
    return NextResponse.json({ floorPlan });
  } catch (error) {
    console.error("Error creating floor plan:", error);
    return NextResponse.json({ error: "Failed to create floor plan" }, { status: 500 });
  }
}

