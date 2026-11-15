import { prisma } from '../lib/prisma';
import { verifyPassword } from '../lib/password';
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
