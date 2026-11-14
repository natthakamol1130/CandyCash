import { NextRequest, NextResponse } from 'next/server';
import { requireUserSession } from '@/lib/request-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await requireUserSession(req);
  if (auth.errorResponse) return auth.errorResponse;

  const user = await prisma.user.findUnique({
    where: { id: auth.session.userId },
    select: { monthlyBudgetTarget: true },
  });

  const monthlyBudgetTarget = Number(user?.monthlyBudgetTarget ?? 10000);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDaysInMonth = Math.max(1, totalDaysInMonth - now.getDate() + 1);

  const monthExpenses = await prisma.transaction.findMany({
    where: {
      createdById: auth.session.userId,
      isCancelled: false,
      type: 'EXPENSE',
      transactionDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    include: { category: true },
  });

  const spentThisMonth = Number(
    monthExpenses.reduce((sum, t) => sum + Number(t.amount), 0).toFixed(2)
  );
  const remainingBudget = Number((monthlyBudgetTarget - spentThisMonth).toFixed(2));
  const dailySafeToSpend =
    remainingBudget > 0 ? Number((remainingBudget / remainingDaysInMonth).toFixed(2)) : 0;

  // Compute category breakdown
  const breakdownMap = new Map<string, number>();
  for (const tx of monthExpenses) {
    const label = tx.category?.name || 'ไม่ระบุหมวดหมู่';
    breakdownMap.set(label, (breakdownMap.get(label) || 0) + Number(tx.amount));
  }

  const categoryBreakdown = Array.from(breakdownMap.entries())
    .map(([categoryName, amount]) => ({
      categoryName,
      amount: Number(amount.toFixed(2)),
      percentage: spentThisMonth > 0 ? Number(((amount / spentThisMonth) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return NextResponse.json({
    success: true,
    data: {
      monthlyBudgetTarget,
      spentThisMonth,
      remainingBudget,
      remainingDaysInMonth,
      dailySafeToSpend,
      categoryBreakdown,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireUserSession(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const target = Number(body.monthlyBudgetTarget);

    if (!Number.isFinite(target) || target < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Monthly budget target must be >= 0',
          code: 'INVALID_BUDGET_TARGET',
        },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: auth.session.userId },
      data: { monthlyBudgetTarget: Number(target.toFixed(2)) },
      select: { id: true, monthlyBudgetTarget: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update budget target', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }
}
