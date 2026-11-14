import { NextRequest, NextResponse } from 'next/server';
import { requireUserSession } from '@/lib/request-auth';
import { listTrashTransactions } from '@/services/transaction-service';

export async function GET(req: NextRequest) {
  const auth = await requireUserSession(req);
  if (auth.errorResponse) return auth.errorResponse;

  const data = await listTrashTransactions(auth.session.userId);
  return NextResponse.json({ success: true, data });
}
