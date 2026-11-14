import { NextRequest, NextResponse } from 'next/server';
import { requireUserSession } from '@/lib/request-auth';
import { createUserWallet, listUserWallets, ServiceError } from '@/services/wallet-service';

export async function GET(req: NextRequest) {
  const auth = await requireUserSession(req);
  if (auth.errorResponse) return auth.errorResponse;

  const includeArchived = req.nextUrl.searchParams.get('includeArchived') === 'true';
  const data = await listUserWallets(auth.session.userId, includeArchived);

  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const auth = await requireUserSession(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const wallet = await createUserWallet(auth.session.userId, {
      name: body.name,
      walletType: body.walletType,
      color: body.color,
      icon: body.icon,
      initialBalance: body.initialBalance ?? body.balance,
    });

    return NextResponse.json({ success: true, data: wallet }, { status: 201 });
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Invalid request payload', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }
}
