import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/services/auth-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await registerUser(email, password, fullName);

    const response = NextResponse.json(
      {
        success: true,
        user: result.user,
      },
      { status: 201 }
    );

    response.cookies.set('candycash_session', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    const message = error.message || 'Registration failed';
    const status = message.includes('already registered') ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
