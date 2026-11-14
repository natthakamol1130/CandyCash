import { SignJWT, jwtVerify } from 'jose';
import { AuthSession } from './types';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'candycash-super-secret-jwt-key-2026-cpe334'
);

export async function signSessionToken(session: AuthSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
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
