import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        status: 'ready',
        db: 'connected',
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        status: 'not_ready',
        db: 'disconnected',
      },
      { status: 503 }
    );
  }
}
