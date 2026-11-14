import { NextRequest, NextResponse } from 'next/server';
import { requireUserSession } from '@/lib/request-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await requireUserSession(req);
  if (auth.errorResponse) return auth.errorResponse;

  const typeParam = req.nextUrl.searchParams.get('type');
  const whereClause: any = {
    OR: [
      { isSystem: true },
      { createdById: auth.session.userId },
    ],
  };

  if (typeParam === 'INCOME' || typeParam === 'EXPENSE') {
    whereClause.type = typeParam;
  }

  const categories = await prisma.category.findMany({
    where: whereClause,
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ success: true, data: categories });
}
