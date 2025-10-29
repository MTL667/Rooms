import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const logoSetting = await prisma.settings.findUnique({
      where: { key: 'logo_url' },
    });

    return NextResponse.json({ logoUrl: logoSetting?.value || null });
  } catch (error) {
    console.error('Failed to fetch logo:', error);
    return NextResponse.json({ logoUrl: null });
  }
}

