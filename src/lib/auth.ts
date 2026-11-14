import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { AuthSession } from './types';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'candycash-super-secret-jwt-key-2026-cpe334'
);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(session: AuthSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(SECRET_KEY, token);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      fullName: payload.fullName as string,
      role: payload.role as 'USER' | 'ADMIN',
    };
  } catch {
    return null;
  }
}
