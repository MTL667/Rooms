import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Update a floor plan
 * PATCH /api/admin/floor-plans/[id]
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, building, floor, imageUrl, active } = body;

    // Validate required fields
    if (!name || !imageUrl) {
      return NextResponse.json(
        { error: 'Name and image are required' },
        { status: 400 }
      );
    }

    // Update floor plan
    const floorPlan = await prisma.floorPlan.update({
      where: { id },
      data: {
        name,
        building: building || null,
        floor: floor || null,
        imageUrl,
        active: active ?? true,
      },
      include: {
        _count: {
          select: { rooms: true },
        },
      },
    });

    return NextResponse.json({ floorPlan });
  } catch (error) {
    console.error('Error updating floor plan:', error);
    return NextResponse.json(
      { error: 'Failed to update floor plan' },
      { status: 500 }
    );
  }
}

/**
 * Delete a floor plan
 * DELETE /api/admin/floor-plans/[id]
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete floor plan (this will unlink rooms but not delete them)
    await prisma.floorPlan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting floor plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete floor plan' },
      { status: 500 }
    );
  }
}
