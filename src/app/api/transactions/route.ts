import { NextRequest, NextResponse } from 'next/server';
import { requireUserSession } from '@/lib/request-auth';
import {
  createTransaction,
  listUserTransactions,
  TransactionServiceError,
} from '@/services/transaction-service';

export async function GET(req: NextRequest) {
  const auth = await requireUserSession(req);
  if (auth.errorResponse) return auth.errorResponse;

  const url = req.nextUrl;
  const walletId = url.searchParams.get('walletId') || undefined;
  const categoryId = url.searchParams.get('categoryId') || undefined;
  const search = url.searchParams.get('search') || undefined;
  const typeParam = url.searchParams.get('type');
  const type = typeParam === 'INCOME' || typeParam === 'EXPENSE' ? typeParam : undefined;
  const startDate = url.searchParams.get('startDate') || undefined;
  const endDate = url.searchParams.get('endDate') || undefined;

  const data = await listUserTransactions(auth.session.userId, {
    walletId,
    categoryId,
    type,
    search,
    startDate,
    endDate,
  });

  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const auth = await requireUserSession(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const transaction = await createTransaction(auth.session.userId, {
      walletId: body.walletId,
      categoryId: body.categoryId,
      type: body.type,
      amount: parseFloat(body.amount),
      note: body.note,
      transactionDate: body.transactionDate,
    });

    return NextResponse.json({ success: true, data: transaction }, { status: 201 });
  } catch (err) {
    if (err instanceof TransactionServiceError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Invalid transaction request', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }
}
