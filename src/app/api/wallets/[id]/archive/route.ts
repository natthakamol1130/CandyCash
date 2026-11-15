import { NextRequest, NextResponse } from 'next/server';
import { requireUserSession } from '@/lib/request-auth';
import { archiveUserWallet, ServiceError } from '@/services/wallet-service';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireUserSession(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const wallet = await archiveUserWallet(auth.session.userId, params.id, body.confirmed);
    return NextResponse.json({ success: true, data: wallet });
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to archive wallet', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
