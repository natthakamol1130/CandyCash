import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, requireAnySession } from '@/lib/request-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await requireAnySession(req);
  if (auth.errorResponse) return auth.errorResponse;

  const templates = await prisma.budgetTemplate.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, data: templates });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const name = body.name?.trim();
    const description = body.description?.trim() || null;
    const rulesJson =
      typeof body.rulesJson === 'string'
        ? body.rulesJson
        : JSON.stringify(body.rulesJson || { needs: 50, wants: 30, savings: 20 });

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Template name is required', code: 'INVALID_TEMPLATE_NAME' },
        { status: 400 }
      );
    }

    const template = await prisma.budgetTemplate.create({
      data: {
        name,
        description,
        rulesJson,
        isSystem: true,
      },
    });

    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create budget template', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }
}
