import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';
import { loginUser } from '../src/services/auth-service';
import { POST as createWalletRoute } from '../src/app/api/wallets/route';
import { GET as listTransactionsRoute, POST as createTransactionRoute } from '../src/app/api/transactions/route';
import { POST as cancelTransactionRoute } from '../src/app/api/transactions/[id]/cancel/route';
import { GET as getCategoriesRoute, POST as createCategoryRoute } from '../src/app/api/categories/route';
import { GET as getTemplatesRoute, POST as createTemplateRoute } from '../src/app/api/budget-templates/route';
import { GET as getBudgetSummaryRoute, PATCH as updateBudgetRoute } from '../src/app/api/budget/route';

describe('F-06: Daily Safe-to-Spend, Search/Filter & Admin Catalog/Templates', () => {
  let user1Token = '';
  let adminToken = '';
  const user1Id = '11111111-1111-1111-1111-111111111111';
  const adminId = '99999999-9999-9999-9999-999999999999';
  let user1WalletId = '';
  let user1TxId = '';

  beforeAll(async () => {
    const hash = await bcrypt.hash('password123', 10);

    await prisma.user.upsert({
      where: { email: 'user1@candycash.local' },
      update: { passwordHash: hash, monthlyBudgetTarget: 10000 },
      create: {
        id: user1Id,
        email: 'user1@candycash.local',
        passwordHash: hash,
        fullName: 'Alice Walker',
        role: 'USER',
        monthlyBudgetTarget: 10000,
      },
    });

    await prisma.user.upsert({
      where: { email: 'admin@candycash.local' },
      update: { passwordHash: hash },
      create: {
        id: adminId,
        email: 'admin@candycash.local',
        passwordHash: hash,
        fullName: 'System Administrator',
        role: 'ADMIN',
      },
    });

    user1Token = (await loginUser('user1@candycash.local', 'password123')).token!;
    adminToken = (await loginUser('admin@candycash.local', 'password123')).token!;

    const w = await prisma.wallet.create({
      data: {
        ownerId: user1Id,
        name: 'F06 Test Wallet',
        walletType: 'CASH',
        balance: 5000.0,
      },
    });
    user1WalletId = w.id;

    const tx = await prisma.transaction.create({
      data: {
        walletId: user1WalletId,
        createdById: user1Id,
        type: 'EXPENSE',
        amount: 350.0,
        note: 'F06 Matcha Latte',
        transactionDate: new Date(),
      },
    });
    user1TxId = tx.id;
  });

  describe('TEST-11: ADMIN Blocked from Personal Financial Endpoints (403 FORBIDDEN)', () => {
    it('should block ADMIN from POST /api/wallets with 403 FORBIDDEN', async () => {
      const req = new NextRequest('http://localhost:3000/api/wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${adminToken}`,
        },
        body: JSON.stringify({ name: 'Admin Wallet', initialBalance: 100 }),
      });

      const res = await createWalletRoute(req);
      expect(res.status).toBe(403);
    });

    it('should block ADMIN from POST /api/transactions with 403 FORBIDDEN', async () => {
      const req = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${adminToken}`,
        },
        body: JSON.stringify({ walletId: user1WalletId, type: 'EXPENSE', amount: 50 }),
      });

      const res = await createTransactionRoute(req);
      expect(res.status).toBe(403);
    });

    it('should block ADMIN from POST /api/transactions/:id/cancel with 403 FORBIDDEN', async () => {
      const req = new NextRequest(`http://localhost:3000/api/transactions/${user1TxId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${adminToken}`,
        },
        body: JSON.stringify({ confirmed: true }),
      });

      const res = await cancelTransactionRoute(req, { params: { id: user1TxId } });
      expect(res.status).toBe(403);
    });
  });

  describe('TEST-12: Bidirectional RBAC, Admin Catalog/Templates & Daily Safe-to-Spend', () => {
    it('should block USER from creating system categories (403 FORBIDDEN)', async () => {
      const req = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({ name: 'Unauthorized Cat', type: 'EXPENSE', icon: 'tag' }),
      });

      const res = await createCategoryRoute(req);
      expect(res.status).toBe(403);
    });

    it('should block USER from creating budget templates (403 FORBIDDEN)', async () => {
      const req = new NextRequest('http://localhost:3000/api/budget-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({ name: 'Unauthorized Template', rulesJson: '{"needs":50}' }),
      });

      const res = await createTemplateRoute(req);
      expect(res.status).toBe(403);
    });

    it('should allow ADMIN to create system category (201) and budget template (201)', async () => {
      const catReq = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${adminToken}`,
        },
        body: JSON.stringify({
          name: `Travel & Commute ${Date.now()}`,
          type: 'EXPENSE',
          icon: 'car',
        }),
      });

      const catRes = await createCategoryRoute(catReq);
      expect(catRes.status).toBe(201);
      const catJson = await catRes.json();
      expect(catJson.success).toBe(true);
      expect(catJson.data.isSystem).toBe(true);

      const tplReq = new NextRequest('http://localhost:3000/api/budget-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${adminToken}`,
        },
        body: JSON.stringify({
          name: `Student Saver 60/20/20 ${Date.now()}`,
          description: 'Recommended student budget split',
          rulesJson: JSON.stringify({ needs: 60, wants: 20, savings: 20, recommendedMonthlyBudget: 12000 }),
        }),
      });

      const tplRes = await createTemplateRoute(tplReq);
      expect(tplRes.status).toBe(201);
      const tplJson = await tplRes.json();
      expect(tplJson.success).toBe(true);
      expect(tplJson.data.isSystem).toBe(true);
    });

    it('should allow both USER and ADMIN to read categories and budget templates (200 OK)', async () => {
      const adminCatRes = await getCategoriesRoute(
        new NextRequest('http://localhost:3000/api/categories', {
          headers: { cookie: `candycash_session=${adminToken}` },
        })
      );
      expect(adminCatRes.status).toBe(200);

      const userTplRes = await getTemplatesRoute(
        new NextRequest('http://localhost:3000/api/budget-templates', {
          headers: { cookie: `candycash_session=${user1Token}` },
        })
      );
      expect(userTplRes.status).toBe(200);
      const tplJson = await userTplRes.json();
      expect(Array.isArray(tplJson.data)).toBe(true);
      expect(tplJson.data.length).toBeGreaterThan(0);
    });

    it('should update USER monthly budget and compute Daily Safe-to-Spend accurately', async () => {
      const patchReq = new NextRequest('http://localhost:3000/api/budget', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({ monthlyBudgetTarget: 15000 }),
      });

      const patchRes = await updateBudgetRoute(patchReq);
      expect(patchRes.status).toBe(200);

      const getReq = new NextRequest('http://localhost:3000/api/budget', {
        headers: { cookie: `candycash_session=${user1Token}` },
      });
      const getRes = await getBudgetSummaryRoute(getReq);
      expect(getRes.status).toBe(200);

      const json = await getRes.json();
      expect(json.success).toBe(true);
      expect(json.data.monthlyBudgetTarget).toBe(15000);
      expect(typeof json.data.spentThisMonth).toBe('number');
      expect(json.data.remainingDaysInMonth).toBeGreaterThanOrEqual(1);
      expect(typeof json.data.dailySafeToSpend).toBe('number');
      expect(Array.isArray(json.data.categoryBreakdown)).toBe(true);
    });

    it('should support searching transactions by keyword via GET /api/transactions?search=Matcha', async () => {
      const req = new NextRequest('http://localhost:3000/api/transactions?search=Matcha', {
        headers: { cookie: `candycash_session=${user1Token}` },
      });

      const res = await listTransactionsRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.transactions.length).toBeGreaterThan(0);
      expect(
        json.data.transactions.every((t: { note?: string | null }) =>
          (t.note || '').toLowerCase().includes('matcha')
        )
      ).toBe(true);
    });
  });
});
