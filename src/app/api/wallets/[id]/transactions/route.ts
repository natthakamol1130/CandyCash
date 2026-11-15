import { NextRequest, NextResponse } from 'next/server';
import { requireUserSession } from '@/lib/request-auth';
import { getWalletTransactions, ServiceError } from '@/services/wallet-service';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireUserSession(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const transactions = await getWalletTransactions(auth.session.userId, params.id);
    return NextResponse.json({ success: true, data: transactions });
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to load wallet transactions', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
