import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Get all locations
 * GET /api/admin/locations
 */
export async function GET(req: Request) {
  try {
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

    const locations = await prisma.location.findMany({
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
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

/**
 * Create a new location
 * POST /api/admin/locations
 */
export async function POST(req: Request) {
  try {
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

    // Create location with tenant relations
    const location = await prisma.location.create({
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

    return NextResponse.json({ location }, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    );
  }
}

