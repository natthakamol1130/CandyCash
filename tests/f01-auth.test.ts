import { describe, it, expect, beforeAll } from 'vitest';
import { loginUser, verifySession, checkAdminAccess, checkUserAccess } from '../src/services/auth-service';
import { POST as loginRoute } from '../src/app/api/auth/login/route';
import { POST as logoutRoute } from '../src/app/api/auth/logout/route';
import { GET as meRoute } from '../src/app/api/auth/me/route';
import { middleware } from '../src/middleware';
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

describe('F-01: Authentication & Role-Based Session Guard', () => {
  beforeAll(async () => {
    const hash = await bcrypt.hash('password123', 10);
    await prisma.user.upsert({
      where: { email: 'user1@candycash.local' },
      update: { passwordHash: hash },
      create: {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'user1@candycash.local',
        passwordHash: hash,
        fullName: 'Alice Walker',
        role: 'USER',
      },
    });

    await prisma.user.upsert({
      where: { email: 'admin@candycash.local' },
      update: { passwordHash: hash },
      create: {
        id: '99999999-9999-9999-9999-999999999999',
        email: 'admin@candycash.local',
        passwordHash: hash,
        fullName: 'System Administrator',
        role: 'ADMIN',
      },
    });
  });

  describe('TEST-01: Valid user login & HTTP-only JWT generation', () => {
    it('should authenticate user1 successfully and return a signed JWT token with valid payload', async () => {
      const result = await loginUser('user1@candycash.local', 'password123');

      // [L5-06 Proof]: Intentionally break assertion to trigger CI failure and verify branch protection merge gate
      expect(result.success).toBe(false);
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('user1@candycash.local');
      expect(result.user?.role).toBe('USER');
      expect(result.user?.fullName).toBe('Alice Walker');

      const session = await verifySession(result.token!);
      expect(session).not.toBeNull();
      expect(session?.userId).toBe('11111111-1111-1111-1111-111111111111');
      expect(session?.role).toBe('USER');
    });

    it('should reject invalid password with 401 equivalent', async () => {
      await expect(
        loginUser('user1@candycash.local', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should reject non-existent user with 401 equivalent', async () => {
      await expect(
        loginUser('nobody@candycash.local', 'password123')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should test POST /api/auth/login route handler and set HttpOnly cookie', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user1@candycash.local', password: 'password123' }),
      });

      const res = await loginRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user.email).toBe('user1@candycash.local');

      // Verify Set-Cookie header contains candycash_session with HttpOnly
      const cookieHeader = res.headers.get('set-cookie');
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader).toContain('candycash_session=');
      expect(cookieHeader?.toLowerCase()).toContain('httponly');
    });

    it('should test POST /api/auth/logout route handler and clear cookie', async () => {
      const res = await logoutRoute();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      const cookieHeader = res.headers.get('set-cookie');
      expect(cookieHeader).toContain('candycash_session=;');
    });
  });

  describe('TEST-02: Route Guards (401 Unauthorized & 403 Forbidden)', () => {
    it('should reject missing or invalid token with null session', async () => {
      const emptySession = await verifySession('');
      expect(emptySession).toBeNull();

      const invalidSession = await verifySession('invalid.jwt.token');
      expect(invalidSession).toBeNull();
    });

    it('should test GET /api/auth/me without cookie returning 401 Unauthorized', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/me');
      const res = await meRoute(req);
      expect(res.status).toBe(401);
    });

    it('should test GET /api/auth/me with valid cookie returning user session', async () => {
      const login = await loginUser('user1@candycash.local', 'password123');
      const req = new NextRequest('http://localhost:3000/api/auth/me', {
        headers: {
          cookie: `candycash_session=${login.token}`,
        },
      });

      const res = await meRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user.email).toBe('user1@candycash.local');
    });

    it('should enforce bidirectional RBAC: block USER from admin routes and block ADMIN from personal user routes', async () => {
      // 1. Regular user session
      const userLogin = await loginUser('user1@candycash.local', 'password123');
      const userSession = await verifySession(userLogin.token!);
      expect(() => checkAdminAccess(userSession)).toThrow('Forbidden: Admin access required');
      expect(() => checkUserAccess(userSession)).not.toThrow();

      // Middleware check: USER accessing /api/admin/categories -> 403
      const userAdminReq = new NextRequest('http://localhost:3000/api/admin/categories', {
        headers: { cookie: `candycash_session=${userLogin.token}` },
      });
      const userAdminRes = await middleware(userAdminReq);
      expect(userAdminRes.status).toBe(403);

      // 2. Admin user session
      const adminLogin = await loginUser('admin@candycash.local', 'password123');
      const adminSession = await verifySession(adminLogin.token!);
      expect(() => checkAdminAccess(adminSession)).not.toThrow();
      expect(() => checkUserAccess(adminSession)).toThrow('Forbidden: Personal financial access restricted to USER role');

      // Middleware check (BR-03): ADMIN accessing /api/wallets -> 403
      const adminWalletReq = new NextRequest('http://localhost:3000/api/wallets', {
        headers: { cookie: `candycash_session=${adminLogin.token}` },
      });
      const adminWalletRes = await middleware(adminWalletReq);
      expect(adminWalletRes.status).toBe(403);
    });
  });
});
