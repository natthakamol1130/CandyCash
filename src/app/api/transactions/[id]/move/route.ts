import { NextRequest, NextResponse } from 'next/server';
import { requireUserSession } from '@/lib/request-auth';
import { moveTransaction, TransactionServiceError } from '@/services/transaction-service';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireUserSession(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const updated = await moveTransaction(
      auth.session.userId,
      params.id,
      body.targetWalletId,
      body.confirmed
    );
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof TransactionServiceError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to move transaction', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
