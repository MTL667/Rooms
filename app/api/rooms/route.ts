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
    const date = searchParams.get('date');

    if (!userEmail || !tenantId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Parse date range for filtering bookings
    let startOfDay: Date | undefined;
    let endOfDay: Date | undefined;
    
    if (date) {
      startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
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
            where: startOfDay && endOfDay ? {
              OR: [
                { start: { gte: startOfDay, lte: endOfDay } },
                { end: { gte: startOfDay, lte: endOfDay } },
                { AND: [{ start: { lte: startOfDay } }, { end: { gte: endOfDay } }] },
              ],
            } : undefined,
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
          where: startOfDay && endOfDay ? {
            OR: [
              { start: { gte: startOfDay, lte: endOfDay } },
              { end: { gte: startOfDay, lte: endOfDay } },
              { AND: [{ start: { lte: startOfDay } }, { end: { gte: endOfDay } }] },
            ],
          } : undefined,
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
