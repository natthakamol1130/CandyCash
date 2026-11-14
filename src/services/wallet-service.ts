import { prisma } from '../lib/prisma';
import { WalletType } from '../lib/types';

const ALLOWED_WALLET_TYPES: WalletType[] = ['CASH', 'BANK', 'EWALLET', 'POCKET'];

export class ServiceError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface CreateWalletInput {
  name: string;
  walletType?: string;
  color?: string;
  icon?: string;
  initialBalance?: number;
}

/**
 * Lists wallets owned by the user and computes total active balance.
 */
export async function listUserWallets(userId: string, includeArchived = false) {
  const wallets = await prisma.wallet.findMany({
    where: {
      ownerId: userId,
      ...(includeArchived ? {} : { isArchived: false }),
    },
    orderBy: { createdAt: 'asc' },
  });

  const totalBalance = wallets
    .filter((w) => !w.isArchived)
    .reduce((sum, w) => sum + Number(w.balance), 0);

  return {
    wallets,
    totalBalance: Number(totalBalance.toFixed(2)),
  };
}

/**
 * Creates a new custom expense folder/wallet after validating initial balance >= 0.
 */
export async function createUserWallet(userId: string, input: CreateWalletInput) {
  const trimmedName = input.name?.trim();
  if (!trimmedName) {
    throw new ServiceError('Folder name is required', 400, 'INVALID_WALLET_NAME');
  }

  const rawBalance = input.initialBalance ?? 0;
  const numericBalance = Number(rawBalance);
  if (!Number.isFinite(numericBalance) || numericBalance < 0) {
    throw new ServiceError(
      'Initial balance must be greater than or equal to 0.00',
      400,
      'INVALID_INITIAL_BALANCE'
    );
  }

  const walletType = (input.walletType || 'CASH').toUpperCase() as WalletType;
  if (!ALLOWED_WALLET_TYPES.includes(walletType)) {
    throw new ServiceError('Invalid wallet type', 400, 'INVALID_WALLET_TYPE');
  }

  return prisma.wallet.create({
    data: {
      ownerId: userId,
      name: trimmedName,
      walletType,
      color: input.color || '#ec4899',
      icon: input.icon || 'wallet',
      balance: Number(numericBalance.toFixed(2)),
      isArchived: false,
    },
  });
}

/**
 * Fetches transactions for a specific wallet, enforcing strict owner-only access.
 */
export async function getWalletTransactions(userId: string, walletId: string) {
  const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
  if (!wallet) {
    throw new ServiceError('Wallet not found', 404, 'WALLET_NOT_FOUND');
  }
  if (wallet.ownerId !== userId) {
    throw new ServiceError('Forbidden: You do not own this wallet', 403, 'FORBIDDEN');
  }

  return prisma.transaction.findMany({
    where: { walletId },
    include: { category: true },
    orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
  });
}

/**
 * Archives a wallet (soft-hide) only when confirmed: true is explicitly supplied (BR-06).
 */
export async function archiveUserWallet(userId: string, walletId: string, confirmed?: boolean) {
  if (confirmed !== true) {
    throw new ServiceError(
      'Double-check confirmation is required to archive this folder',
      400,
      'CONFIRMATION_REQUIRED'
    );
  }

  const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
  if (!wallet) {
    throw new ServiceError('Wallet not found', 404, 'WALLET_NOT_FOUND');
  }
  if (wallet.ownerId !== userId) {
    throw new ServiceError('Forbidden: You do not own this wallet', 403, 'FORBIDDEN');
  }

  return prisma.wallet.update({
    where: { id: walletId },
    data: { isArchived: true },
  });
}
