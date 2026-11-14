import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';
import { loginUser } from '../src/services/auth-service';
import { middleware } from '../src/middleware';
import { GET as listWalletsRoute, POST as createWalletRoute } from '../src/app/api/wallets/route';
import { GET as walletTransactionsRoute } from '../src/app/api/wallets/[id]/transactions/route';
import { POST as archiveWalletRoute } from '../src/app/api/wallets/[id]/archive/route';

describe('F-02: Custom Expense Folders / Wallets & Archive Guard', () => {
  let user1Token = '';
  let user2Token = '';
  let adminToken = '';
  let user1WalletId = '';

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
      where: { email: 'user2@candycash.local' },
      update: { passwordHash: hash },
      create: {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'user2@candycash.local',
        passwordHash: hash,
        fullName: 'Bob Builder',
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

    user1Token = (await loginUser('user1@candycash.local', 'password123')).token!;
    user2Token = (await loginUser('user2@candycash.local', 'password123')).token!;
    adminToken = (await loginUser('admin@candycash.local', 'password123')).token!;
  });

  describe('TEST-03: Create custom folder & reject negative initial balance', () => {
    it('should create a folder with initialBalance 1000.00 and return 201', async () => {
      const req = new NextRequest('http://localhost:3000/api/wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({
          name: 'Daily Food Pocket',
          walletType: 'POCKET',
          color: '#ec4899',
          icon: 'utensils',
          initialBalance: 1000,
        }),
      });

      const res = await createWalletRoute(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.name).toBe('Daily Food Pocket');
      expect(json.data.balance).toBe(1000);
      expect(json.data.walletType).toBe('POCKET');
      expect(json.data.color).toBe('#ec4899');
      expect(json.data.icon).toBe('utensils');

      user1WalletId = json.data.id;
    });

    it('should reject negative initialBalance (-50) with 400 INVALID_INITIAL_BALANCE', async () => {
      const req = new NextRequest('http://localhost:3000/api/wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({
          name: 'Negative Wallet',
          walletType: 'CASH',
          initialBalance: -50,
        }),
      });

      const res = await createWalletRoute(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('INVALID_INITIAL_BALANCE');
    });

    it('should list only the authenticated user wallets and calculate totalBalance', async () => {
      const req = new NextRequest('http://localhost:3000/api/wallets', {
        headers: { cookie: `candycash_session=${user1Token}` },
      });

      const res = await listWalletsRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data.wallets)).toBe(true);
      expect(json.data.wallets.some((w: { id: string }) => w.id === user1WalletId)).toBe(true);
      expect(typeof json.data.totalBalance).toBe('number');
    });
  });

  describe('TEST-04: Strict Privacy Isolation (403 FORBIDDEN for other USER & ADMIN)', () => {
    it('should block user2 from reading user1 wallet transactions with 403 FORBIDDEN', async () => {
      const req = new NextRequest(`http://localhost:3000/api/wallets/${user1WalletId}/transactions`, {
        headers: { cookie: `candycash_session=${user2Token}` },
      });

      const res = await walletTransactionsRoute(req, { params: { id: user1WalletId } });
      expect(res.status).toBe(403);
    });

    it('should block ADMIN from reading user1 wallet transactions (middleware & route 403 FORBIDDEN)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/wallets/${user1WalletId}/transactions`, {
        headers: { cookie: `candycash_session=${adminToken}` },
      });

      const mwRes = await middleware(req);
      expect(mwRes.status).toBe(403);

      const routeRes = await walletTransactionsRoute(req, { params: { id: user1WalletId } });
      expect(routeRes.status).toBe(403);
    });

    it('should allow user1 to read their own wallet transactions with 200 OK', async () => {
      const req = new NextRequest(`http://localhost:3000/api/wallets/${user1WalletId}/transactions`, {
        headers: { cookie: `candycash_session=${user1Token}` },
      });

      const res = await walletTransactionsRoute(req, { params: { id: user1WalletId } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });
  });

  describe('BR-06: Double-Check Folder Archive Guard', () => {
    it('should require confirmed: true before archiving a folder (400 CONFIRMATION_REQUIRED)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/wallets/${user1WalletId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({}),
      });

      const res = await archiveWalletRoute(req, { params: { id: user1WalletId } });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe('CONFIRMATION_REQUIRED');
    });

    it('should prevent user2 from archiving user1 folder (403 FORBIDDEN)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/wallets/${user1WalletId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user2Token}`,
        },
        body: JSON.stringify({ confirmed: true }),
      });

      const res = await archiveWalletRoute(req, { params: { id: user1WalletId } });
      expect(res.status).toBe(403);
    });

    it('should archive user1 folder when confirmed: true is provided (200 OK)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/wallets/${user1WalletId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({ confirmed: true }),
      });

      const res = await archiveWalletRoute(req, { params: { id: user1WalletId } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.isArchived).toBe(true);
    });
  });
});
