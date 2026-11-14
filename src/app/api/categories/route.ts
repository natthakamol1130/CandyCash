import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, requireAnySession } from '@/lib/request-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await requireAnySession(req);
  if (auth.errorResponse) return auth.errorResponse;

  const typeParam = req.nextUrl.searchParams.get('type');
  const whereClause: any = {
    OR: [{ isSystem: true }, { createdById: auth.session.userId }],
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

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const name = body.name?.trim();
    const type = body.type;
    const icon = body.icon?.trim() || 'tag';

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required', code: 'INVALID_CATEGORY_NAME' },
        { status: 400 }
      );
    }

    if (type !== 'INCOME' && type !== 'EXPENSE') {
      return NextResponse.json(
        { success: false, error: 'Category type must be INCOME or EXPENSE', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        type,
        icon,
        isSystem: true,
        createdById: auth.session.userId,
      },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create system category', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }
}
