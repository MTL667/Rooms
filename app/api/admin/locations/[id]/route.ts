import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Update a location
 * PATCH /api/admin/locations/[id]
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, address, city, country, active, tenantIds, userEmail } = body;

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Delete existing tenant relations
    await prisma.locationTenant.deleteMany({
      where: { locationId: id },
    });

    // Update location with new tenant relations
    const location = await prisma.location.update({
      where: { id },
      data: {
        name,
        address: address || null,
        city: city || null,
        country: country || null,
        active: active ?? true,
        allowedTenants: {
          create: (tenantIds || []).map((tenantId: string) => ({
            tenantId,
          })),
        },
      },
      include: {
        _count: {
          select: { rooms: true, allowedTenants: true },
        },
        allowedTenants: {
          select: {
            tenantId: true,
          },
        },
      },
    });

    return NextResponse.json({ location });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

/**
 * Delete a location
 * DELETE /api/admin/locations/[id]
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if location has rooms
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        _count: {
          select: { rooms: true },
        },
      },
    });

    if (location && location._count.rooms > 0) {
      return NextResponse.json(
        { error: 'Cannot delete location with rooms. Please unlink rooms first.' },
        { status: 400 }
      );
    }

    // Delete location (cascade will delete tenant relations)
    await prisma.location.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    );
  }
}

