import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from './auth';
import { AuthSession } from './types';

type AuthResult =
  | { session: AuthSession; errorResponse?: never }
  | { session?: never; errorResponse: NextResponse };

/**
 * Extracts and verifies the session cookie, enforcing that the caller has the USER role.
 */
export async function requireUserSession(req: NextRequest): Promise<AuthResult> {
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

  if (session.role !== 'USER') {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Personal financial access restricted to USER role',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      ),
    };
  }

  return { session };
}
