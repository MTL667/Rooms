import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Get rooms with location-based tenant filtering
 * GET /api/rooms?userEmail=...&tenantId=...
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail');
    const tenantId = searchParams.get('tenantId');

    if (!userEmail || !tenantId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Admins can see all rooms
    if (user.role === 'ADMIN') {
      const rooms = await prisma.room.findMany({
        where: { active: true },
        include: {
          bookings: {
            orderBy: { start: 'asc' },
          },
          locationRef: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
        orderBy: [
          { locationId: { sort: 'asc', nulls: 'last' } },
          { name: 'asc' },
        ],
      });
      return NextResponse.json({ rooms });
    }

    // Non-admin users: filter by location-tenant access
    // Get all locations accessible to this tenant
    const accessibleLocationIds = await prisma.locationTenant.findMany({
      where: { tenantId },
      select: { locationId: true },
    });

    const locationIds = accessibleLocationIds.map((lt) => lt.locationId);

    // Get rooms that either:
    // 1. Have no location assigned (legacy/unassigned rooms - show to everyone)
    // 2. Have a location that the tenant has access to
    const rooms = await prisma.room.findMany({
      where: {
        active: true,
        OR: [
          { locationId: null }, // Unassigned rooms visible to all
          { locationId: { in: locationIds } }, // Rooms in accessible locations
        ],
      },
      include: {
        bookings: {
          orderBy: { start: 'asc' },
        },
        locationRef: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
      orderBy: [
        { locationId: { sort: 'asc', nulls: 'last' } },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}
