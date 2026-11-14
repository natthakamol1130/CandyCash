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

  // Category Validation (BR-01 / TEST-07): Check category type matches transaction type
  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new TransactionServiceError('Category not found', 'CATEGORY_NOT_FOUND', 404);
    }

    if (!category.isSystem && category.createdById !== userId) {
      throw new TransactionServiceError('Forbidden: Access denied to category', 'FORBIDDEN', 403);
    }

    if (category.type !== type) {
      throw new TransactionServiceError(
        `Category type (${category.type}) does not match transaction type (${type})`,
        'CATEGORY_TYPE_MISMATCH',
        422
      );
    }
  }

  const finalDate = transactionDate ? new Date(transactionDate) : new Date();

  // BR-02: Interactive Transaction preventing Race Condition & Overdraft
  return await prisma.$transaction(async (tx) => {
    if (type === 'EXPENSE') {
      // Atomic condition: balance must be >= amount at the exact moment of execution
      const updateResult = await tx.wallet.updateMany({
        where: {
          id: walletId,
          balance: { gte: amount },
        },
        data: {
          balance: { decrement: amount },
        },
      });

      if (updateResult.count === 0) {
        throw new TransactionServiceError(
          'Insufficient balance in wallet',
          'INSUFFICIENT_BALANCE',
          422
        );
      }
    } else {
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: { increment: amount },
        },
      });
    }

    const createdTransaction = await tx.transaction.create({
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
    });

    const updatedWallet = await tx.wallet.findUnique({
      where: { id: walletId },
    });

    return {
      ...createdTransaction,
      walletBalanceAfter: updatedWallet?.balance ?? 0,
    };
  });
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

/**
 * Moves a posted transaction from its source wallet to another wallet of the same user (BR-04).
 * Requires confirmed: true and atomically checks two-way balance sufficiency.
 */
export async function moveTransaction(
  userId: string,
  transactionId: string,
  targetWalletId: string,
  confirmed?: boolean
) {
  if (confirmed !== true) {
    throw new TransactionServiceError(
      'Double-check confirmation is required to move a transaction',
      'CONFIRMATION_REQUIRED',
      400
    );
  }

  if (!targetWalletId) {
    throw new TransactionServiceError('Target wallet is required', 'INVALID_TARGET_WALLET', 400);
  }

  return await prisma.$transaction(async (tx) => {
    const txRecord = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });

    if (!txRecord) {
      throw new TransactionServiceError('Transaction not found', 'TRANSACTION_NOT_FOUND', 404);
    }

    if (txRecord.createdById !== userId || txRecord.wallet.ownerId !== userId) {
      throw new TransactionServiceError('Forbidden: Access denied to transaction', 'FORBIDDEN', 403);
    }

    if (txRecord.isCancelled) {
      throw new TransactionServiceError(
        'Cannot move a canceled transaction',
        'INVALID_TRANSACTION_STATE',
        409
      );
    }

    if (txRecord.walletId === targetWalletId) {
      throw new TransactionServiceError(
        'Target wallet must be different from source wallet',
        'SAME_WALLET_MOVE',
        400
      );
    }

    const targetWallet = await tx.wallet.findUnique({
      where: { id: targetWalletId },
    });

    if (!targetWallet) {
      throw new TransactionServiceError('Target wallet not found', 'WALLET_NOT_FOUND', 404);
    }

    if (targetWallet.ownerId !== userId) {
      throw new TransactionServiceError(
        'Forbidden: Cannot move transaction to another user wallet',
        'FORBIDDEN',
        403
      );
    }

    if (txRecord.wallet.isArchived || targetWallet.isArchived) {
      throw new TransactionServiceError(
        'Cannot move transaction involving an archived wallet',
        'WALLET_ARCHIVED',
        400
      );
    }

    if (txRecord.type === 'EXPENSE') {
      // Target wallet B must have >= amount to absorb the expense
      const deductTarget = await tx.wallet.updateMany({
        where: { id: targetWalletId, balance: { gte: txRecord.amount } },
        data: { balance: { decrement: txRecord.amount } },
      });

      if (deductTarget.count === 0) {
        throw new TransactionServiceError(
          'Target wallet does not have sufficient balance to absorb this expense',
          'INSUFFICIENT_TARGET_BALANCE',
          422
        );
      }

      // Refund source wallet A
      await tx.wallet.update({
        where: { id: txRecord.walletId },
        data: { balance: { increment: txRecord.amount } },
      });
    } else if (txRecord.type === 'INCOME') {
      // Source wallet A must have >= amount to deduct the income
      const deductSource = await tx.wallet.updateMany({
        where: { id: txRecord.walletId, balance: { gte: txRecord.amount } },
        data: { balance: { decrement: txRecord.amount } },
      });

      if (deductSource.count === 0) {
        throw new TransactionServiceError(
          'Source wallet does not have sufficient balance to move this income',
          'INSUFFICIENT_SOURCE_BALANCE',
          422
        );
      }

      // Credit target wallet B
      await tx.wallet.update({
        where: { id: targetWalletId },
        data: { balance: { increment: txRecord.amount } },
      });
    }

    return tx.transaction.update({
      where: { id: transactionId },
      data: { walletId: targetWalletId },
      include: { category: true, wallet: true },
    });
  });
}

/**
 * Cancels a posted transaction into trash (isCancelled: true) with Double-Check (BR-05).
 * Atomically refunds EXPENSE or deducts INCOME (rejecting if balance would go negative).
 */
export async function cancelTransaction(
  userId: string,
  transactionId: string,
  confirmed?: boolean
) {
  if (confirmed !== true) {
    throw new TransactionServiceError(
      'Double-check confirmation is required to cancel a transaction',
      'CONFIRMATION_REQUIRED',
      400
    );
  }

  return await prisma.$transaction(async (tx) => {
    const txRecord = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });

    if (!txRecord) {
      throw new TransactionServiceError('Transaction not found', 'TRANSACTION_NOT_FOUND', 404);
    }

    if (txRecord.createdById !== userId || txRecord.wallet.ownerId !== userId) {
      throw new TransactionServiceError('Forbidden: Access denied to transaction', 'FORBIDDEN', 403);
    }

    if (txRecord.isCancelled) {
      throw new TransactionServiceError(
        'Transaction is already canceled',
        'INVALID_TRANSACTION_STATE',
        409
      );
    }

    if (txRecord.type === 'EXPENSE') {
      await tx.wallet.update({
        where: { id: txRecord.walletId },
        data: { balance: { increment: txRecord.amount } },
      });
    } else if (txRecord.type === 'INCOME') {
      const deductWallet = await tx.wallet.updateMany({
        where: { id: txRecord.walletId, balance: { gte: txRecord.amount } },
        data: { balance: { decrement: txRecord.amount } },
      });

      if (deductWallet.count === 0) {
        throw new TransactionServiceError(
          'Insufficient balance in wallet to cancel this income',
          'INSUFFICIENT_BALANCE_TO_CANCEL',
          422
        );
      }
    }

    const updatedCount = await tx.transaction.updateMany({
      where: { id: transactionId, isCancelled: false },
      data: {
        isCancelled: true,
        cancelledAt: new Date(),
      },
    });

    if (updatedCount.count === 0) {
      throw new TransactionServiceError(
        'Transaction is already canceled',
        'INVALID_TRANSACTION_STATE',
        409
      );
    }

    return tx.transaction.findUnique({
      where: { id: transactionId },
      include: { category: true, wallet: true },
    });
  });
}


export async function listTrashTransactions(userId: string) {
  const trashItems = await prisma.transaction.findMany({
    where: {
      createdById: userId,
      isCancelled: true,
    },
    orderBy: { cancelledAt: 'desc' },
    include: {
      category: true,
      wallet: true,
    },
  });

  const totalCancelledIncome = trashItems
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCancelledExpense = trashItems
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    trashItems,
    totalCount: trashItems.length,
    totalCancelledIncome,
    totalCancelledExpense,
  };
}

export async function restoreTransaction(userId: string, transactionId: string, confirmed?: boolean) {
  if (!confirmed) {
    throw new TransactionServiceError(
      'Confirmation required to restore transaction',
      'CONFIRMATION_REQUIRED',
      400
    );
  }

  return await prisma.$transaction(async (tx) => {
    const txRecord = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });

    if (!txRecord) {
      throw new TransactionServiceError('Transaction not found', 'TRANSACTION_NOT_FOUND', 404);
    }

    if (txRecord.createdById !== userId || txRecord.wallet.ownerId !== userId) {
      throw new TransactionServiceError('Forbidden: Access denied to transaction', 'FORBIDDEN', 403);
    }

    if (!txRecord.isCancelled) {
      throw new TransactionServiceError(
        'Transaction is not in cancelled state',
        'TRANSACTION_NOT_CANCELLED',
        400
      );
    }

    if (txRecord.wallet.isArchived) {
      throw new TransactionServiceError(
        'Cannot restore transaction into an archived wallet',
        'WALLET_ARCHIVED',
        400
      );
    }

    if (txRecord.type === 'EXPENSE') {
      // Re-deduct balance with overdraft protection (BR-05)
      const deductWallet = await tx.wallet.updateMany({
        where: { id: txRecord.walletId, balance: { gte: txRecord.amount } },
        data: { balance: { decrement: txRecord.amount } },
      });

      if (deductWallet.count === 0) {
        throw new TransactionServiceError(
          'Insufficient balance in wallet to restore this expense',
          'INSUFFICIENT_BALANCE_TO_RESTORE',
          422
        );
      }
    } else if (txRecord.type === 'INCOME') {
      // Re-credit balance
      await tx.wallet.update({
        where: { id: txRecord.walletId },
        data: { balance: { increment: txRecord.amount } },
      });
    }

    const updated = await tx.transaction.update({
      where: { id: transactionId },
      data: {
        isCancelled: false,
        cancelledAt: null,
      },
      include: { category: true, wallet: true },
    });

    const updatedWallet = await tx.wallet.findUnique({
      where: { id: txRecord.walletId },
    });

    return {
      ...updated,
      walletBalanceAfter: updatedWallet?.balance ?? 0,
    };
  });
}
