import { prisma } from '../lib/prisma';

export class TransactionServiceError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'TransactionServiceError';
    this.code = code;
    this.status = status;
  }
}

export interface CreateTransactionInput {
  walletId: string;
  categoryId?: string | null;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  note?: string | null;
  transactionDate?: Date | string;
}

export interface TransactionFilterInput {
  walletId?: string;
  type?: 'INCOME' | 'EXPENSE';
  startDate?: string;
  endDate?: string;
}

export async function createTransaction(userId: string, input: CreateTransactionInput) {
  const { walletId, categoryId, type, amount, note, transactionDate } = input;

  // Validation: Amount must be positive number
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    throw new TransactionServiceError('Amount must be greater than zero', 'INVALID_AMOUNT', 400);
  }

  // Validation: Transaction type
  if (type !== 'INCOME' && type !== 'EXPENSE') {
    throw new TransactionServiceError('Transaction type must be INCOME or EXPENSE', 'INVALID_TYPE', 400);
  }

  // Verify wallet existence and ownership
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) {
    throw new TransactionServiceError('Wallet not found', 'WALLET_NOT_FOUND', 404);
  }

  if (wallet.ownerId !== userId) {
    throw new TransactionServiceError('Forbidden: Access denied to wallet', 'FORBIDDEN', 403);
  }

  if (wallet.isArchived) {
    throw new TransactionServiceError('Cannot record transaction into an archived wallet', 'WALLET_ARCHIVED', 400);
  }

  // BR-01: Overdraft Protection (422 INSUFFICIENT_BALANCE)
  if (type === 'EXPENSE' && wallet.balance < amount) {
    throw new TransactionServiceError(
      `Insufficient balance. Available: ${wallet.balance.toFixed(2)}, required: ${amount.toFixed(2)}`,
      'INSUFFICIENT_BALANCE',
      422
    );
  }

  const finalDate = transactionDate ? new Date(transactionDate) : new Date();

  // ACID Atomic Transaction via prisma.$transaction
  const [createdTransaction, updatedWallet] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        walletId,
        categoryId: categoryId || null,
        createdById: userId,
        type,
        amount,
        note: note || null,
        transactionDate: finalDate,
      },
      include: {
        category: true,
        wallet: true,
      },
    }),
    prisma.wallet.update({
      where: { id: walletId },
      data: {
        balance: type === 'INCOME' ? { increment: amount } : { decrement: amount },
      },
    }),
  ]);

  return {
    ...createdTransaction,
    walletBalanceAfter: updatedWallet.balance,
  };
}

export async function listUserTransactions(userId: string, filters: TransactionFilterInput = {}) {
  const whereClause: any = {
    createdById: userId,
    isCancelled: false,
  };

  if (filters.walletId) {
    whereClause.walletId = filters.walletId;
  }

  if (filters.type) {
    whereClause.type = filters.type;
  }

  if (filters.startDate || filters.endDate) {
    whereClause.transactionDate = {};
    if (filters.startDate) whereClause.transactionDate.gte = new Date(filters.startDate);
    if (filters.endDate) whereClause.transactionDate.lte = new Date(filters.endDate);
  }

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    orderBy: { transactionDate: 'desc' },
    include: {
      category: true,
      wallet: true,
    },
  });

  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    transactions,
    totalCount: transactions.length,
    totalIncome,
    totalExpense,
    netTotal: totalIncome - totalExpense,
  };
}
