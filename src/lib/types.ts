export type UserRole = 'USER' | 'ADMIN';

export type WalletType = 'CASH' | 'BANK' | 'EWALLET' | 'POCKET';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface AuthSession {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}
