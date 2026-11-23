import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword } from '../lib/password';
import { signSessionToken, verifySessionToken } from '../lib/auth';
import { AuthSession } from '../lib/types';

export interface LoginResult {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  const sessionPayload: AuthSession = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role as 'USER' | 'ADMIN',
  };

  const token = await signSessionToken(sessionPayload);

  return {
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  };
}

export async function registerUser(
  email: string,
  password: string,
  fullName?: string
): Promise<LoginResult> {
  const normalizedEmail = email.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Please enter a valid email address (e.g. you@gmail.com)');
  }
  if (!password || password.length < 4) {
    throw new Error('Password must be at least 4 characters');
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    throw new Error('Email is already registered. Please sign in instead.');
  }

  const passwordHash = await hashPassword(password);
  const displayName =
    fullName && fullName.trim().length > 0
      ? fullName.trim()
      : normalizedEmail.split('@')[0];

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName: displayName,
        role: 'USER',
        monthlyBudgetTarget: 12000,
      },
    });

    await tx.wallet.createMany({
      data: [
        {
          ownerId: created.id,
          name: 'กระเป๋าเงินสด (Daily Cash)',
          walletType: 'CASH',
          color: '#10b981',
          icon: 'wallet',
          balance: 5000,
        },
        {
          ownerId: created.id,
          name: 'บัญชีธนาคารหลัก (Main Bank)',
          walletType: 'BANK',
          color: '#3b82f6',
          icon: 'landmark',
          balance: 15000,
        },
      ],
    });

    return created;
  });

  const sessionPayload: AuthSession = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: 'USER',
  };

  const token = await signSessionToken(sessionPayload);

  return {
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  };
}

export async function verifySession(token: string): Promise<AuthSession | null> {
  if (!token) return null;
  return verifySessionToken(token);
}

export function checkAdminAccess(session: AuthSession | null): void {
  if (!session) {
    throw new Error('Unauthorized: Session required');
  }
  if (session.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required');
  }
}

export function checkUserAccess(session: AuthSession | null): void {
  if (!session) {
    throw new Error('Unauthorized: Session required');
  }
  if (session.role !== 'USER') {
    throw new Error('Forbidden: Personal financial access restricted to USER role');
  }
}
