import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from './auth';
import { AuthSession, UserRole } from './types';

type AuthResult =
  | { session: AuthSession; errorResponse?: never }
  | { session?: never; errorResponse: NextResponse };

async function verifyCookieSession(req: NextRequest): Promise<AuthResult> {
  const token = req.cookies.get('candycash_session')?.value;
  if (!token) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized: Session token required', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    };
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or expired token', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    };
  }

  return { session };
}

function requireRole(session: AuthSession, role: UserRole, message: string): AuthResult {
  if (session.role !== role) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: message, code: 'FORBIDDEN' },
        { status: 403 }
      ),
    };
  }
  return { session };
}

/**
 * Extracts and verifies the session cookie for any authenticated role (USER or ADMIN).
 */
export async function requireAnySession(req: NextRequest): Promise<AuthResult> {
  return verifyCookieSession(req);
}

/**
 * Extracts and verifies the session cookie, enforcing that the caller has the USER role.
 */
export async function requireUserSession(req: NextRequest): Promise<AuthResult> {
  const res = await verifyCookieSession(req);
  if (res.errorResponse) return res;
  return requireRole(
    res.session,
    'USER',
    'Forbidden: Personal financial access restricted to USER role'
  );
}

/**
 * Extracts and verifies the session cookie, enforcing that the caller has the ADMIN role.
 */
export async function requireAdminSession(req: NextRequest): Promise<AuthResult> {
  const res = await verifyCookieSession(req);
  if (res.errorResponse) return res;
  return requireRole(res.session, 'ADMIN', 'Forbidden: Admin access required');
}
