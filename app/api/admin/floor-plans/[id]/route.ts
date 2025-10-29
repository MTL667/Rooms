import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const floorPlan = await prisma.floorPlan.update({
      where: { id },
      data: {
        name: data.name,
        building: data.building || null,
        floor: data.floor || null,
        imageUrl: data.imageUrl,
        active: data.active,
      },
    });
    return NextResponse.json({ floorPlan });
  } catch (error) {
    console.error("Error updating floor plan:", error);
    return NextResponse.json({ error: "Failed to update floor plan" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.floorPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting floor plan:", error);
    return NextResponse.json({ error: "Failed to delete floor plan" }, { status: 500 });
  }
}

