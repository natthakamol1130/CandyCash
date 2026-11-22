import { SignJWT, jwtVerify } from 'jose';
import { AuthSession } from './types';

function getSecretKey(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === 'production' ? process.env.DATABASE_URL : undefined);
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET or DATABASE_URL environment variable is required in production');
  }
  return new TextEncoder().encode(secret || 'candycash-dev-only-jwt-secret');
}

export async function signSessionToken(session: AuthSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
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
