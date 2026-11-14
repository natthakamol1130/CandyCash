import { describe, it, expect, beforeAll } from 'vitest';
import { loginUser, verifySession, checkAdminAccess } from '../src/services/auth-service';
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

describe('F-01: Authentication & Role-Based Session Guard', () => {
  beforeAll(async () => {
    // Ensure test users exist in DB
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

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('user1@candycash.local');
      expect(result.user?.role).toBe('USER');
      expect(result.user?.fullName).toBe('Alice Walker');

      // Verify the token payload matches session expectations
      const session = await verifySession(result.token!);
      expect(session).not.toBeNull();
      expect(session?.userId).toBe('11111111-1111-1111-1111-111111111111');
      expect(session?.role).toBe('USER');
    });

    it('should reject invalid password with 401 Unauthorized equivalent', async () => {
      await expect(
        loginUser('user1@candycash.local', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should reject non-existent user with 401 Unauthorized equivalent', async () => {
      await expect(
        loginUser('nobody@candycash.local', 'password123')
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('TEST-02: Route Guards (401 Unauthorized & 403 Forbidden)', () => {
    it('should reject missing or invalid token with null session (401 guard)', async () => {
      const emptySession = await verifySession('');
      expect(emptySession).toBeNull();

      const invalidSession = await verifySession('invalid.jwt.token');
      expect(invalidSession).toBeNull();
    });

    it('should allow ADMIN to pass admin check but block regular USER with 403 Forbidden', async () => {
      // 1. Authenticate regular user
      const userResult = await loginUser('user1@candycash.local', 'password123');
      const userSession = await verifySession(userResult.token!);
      expect(userSession?.role).toBe('USER');

      // Regular user accessing admin resource must be rejected
      expect(() => checkAdminAccess(userSession)).toThrow('Forbidden: Admin access required');

      // 2. Authenticate admin user
      const adminResult = await loginUser('admin@candycash.local', 'password123');
      const adminSession = await verifySession(adminResult.token!);
      expect(adminSession?.role).toBe('ADMIN');

      // Admin user must pass admin check without throwing
      expect(() => checkAdminAccess(adminSession)).not.toThrow();
    });
  });
});
