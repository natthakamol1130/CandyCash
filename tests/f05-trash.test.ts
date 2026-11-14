import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { signSessionToken } from '../src/lib/auth';
import { GET as trashRoute } from '../src/app/api/trash/route';
import { POST as restoreRoute } from '../src/app/api/transactions/[id]/restore/route';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

describe('F-05: Trash History & Double-Check Restore', () => {
  let user1Token: string;
  let user2Token: string;
  let user1WalletId: string;
  let user2WalletId: string;
  let cancelledExpenseTxId: string;
  let cancelledIncomeTxId: string;
  let activeTxId: string;

  beforeAll(async () => {
    const hash = await bcrypt.hash('password123', 10);
    const user1 = await prisma.user.upsert({
      where: { email: 'f05_user1@candycash.local' },
      update: { passwordHash: hash },
      create: {
        id: 'u05-1111-1111-1111-111111111111',
        email: 'f05_user1@candycash.local',
        passwordHash: hash,
        fullName: 'F05 User One',
        role: 'USER',
      },
    });

    const user2 = await prisma.user.upsert({
      where: { email: 'f05_user2@candycash.local' },
      update: { passwordHash: hash },
      create: {
        id: 'u05-2222-2222-2222-222222222222',
        email: 'f05_user2@candycash.local',
        passwordHash: hash,
        fullName: 'F05 User Two',
        role: 'USER',
      },
    });

    user1Token = await signSessionToken({
      userId: user1.id,
      email: user1.email,
      fullName: user1.fullName,
      role: 'USER',
    });

    user2Token = await signSessionToken({
      userId: user2.id,
      email: user2.email,
      fullName: user2.fullName,
      role: 'USER',
    });

    // Wallet with 200 balance
    const w1 = await prisma.wallet.create({
      data: {
        ownerId: user1.id,
        name: 'User 1 Trash Test Wallet',
        walletType: 'CASH',
        color: '#6366f1',
        balance: 200.0,
      },
    });
    user1WalletId = w1.id;

    const w2 = await prisma.wallet.create({
      data: {
        ownerId: user2.id,
        name: 'User 2 Wallet',
        walletType: 'BANK',
        color: '#10b981',
        balance: 500.0,
      },
    });
    user2WalletId = w2.id;

    // Create cancelled expense transaction (300.00) - Note: wallet only has 200 balance!
    const txExpense = await prisma.transaction.create({
      data: {
        walletId: user1WalletId,
        createdById: user1.id,
        type: 'EXPENSE',
        amount: 300.0,
        note: 'Cancelled Team Lunch',
        isCancelled: true,
        cancelledAt: new Date(),
      },
    });
    cancelledExpenseTxId = txExpense.id;

    // Create cancelled income transaction (150.00)
    const txIncome = await prisma.transaction.create({
      data: {
        walletId: user1WalletId,
        createdById: user1.id,
        type: 'INCOME',
        amount: 150.0,
        note: 'Cancelled Reimbursement',
        isCancelled: true,
        cancelledAt: new Date(),
      },
    });
    cancelledIncomeTxId = txIncome.id;

    // Create active transaction
    const txActive = await prisma.transaction.create({
      data: {
        walletId: user1WalletId,
        createdById: user1.id,
        type: 'EXPENSE',
        amount: 50.0,
        note: 'Active Coffee',
        isCancelled: false,
      },
    });
    activeTxId = txActive.id;
  });

  describe('Trash History View (GET /api/trash)', () => {
    it('should list only cancelled transactions for the authenticated user ordered by cancelledAt desc', async () => {
      const req = new NextRequest('http://localhost:3000/api/trash', {
        headers: { cookie: `candycash_session=${user1Token}` },
      });

      const res = await trashRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data.trashItems)).toBe(true);
      expect(json.data.trashItems.length).toBe(2);
      expect(json.data.trashItems.every((item: any) => item.isCancelled === true)).toBe(true);
      expect(json.data.trashItems.some((item: any) => item.id === activeTxId)).toBe(false);
    });

    it('should return empty trash for user without cancelled transactions', async () => {
      const req = new NextRequest('http://localhost:3000/api/trash', {
        headers: { cookie: `candycash_session=${user2Token}` },
      });

      const res = await trashRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.trashItems.length).toBe(0);
    });
  });

  describe('TEST-10: Double-Check Restore & Overdraft Guard (BR-05)', () => {
    it('should reject restore without confirmed: true (400 CONFIRMATION_REQUIRED)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/transactions/${cancelledExpenseTxId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({}),
      });

      const res = await restoreRoute(req, { params: { id: cancelledExpenseTxId } });
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('CONFIRMATION_REQUIRED');
    });

    it('should reject restoring transaction that is not cancelled with 400 TRANSACTION_NOT_CANCELLED', async () => {
      const req = new NextRequest(`http://localhost:3000/api/transactions/${activeTxId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({ confirmed: true }),
      });

      const res = await restoreRoute(req, { params: { id: activeTxId } });
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.code).toBe('TRANSACTION_NOT_CANCELLED');
    });

    it('should block user2 from restoring user1 cancelled transaction with 403 FORBIDDEN', async () => {
      const req = new NextRequest(`http://localhost:3000/api/transactions/${cancelledExpenseTxId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user2Token}`,
        },
        body: JSON.stringify({ confirmed: true }),
      });

      const res = await restoreRoute(req, { params: { id: cancelledExpenseTxId } });
      expect(res.status).toBe(403);
    });

    it('should reject restoring EXPENSE 300.00 when wallet only has 200.00 balance (422 INSUFFICIENT_BALANCE_TO_RESTORE)', async () => {
      const wBefore = await prisma.wallet.findUnique({ where: { id: user1WalletId } });
      expect(wBefore?.balance).toBe(200.0);

      const req = new NextRequest(`http://localhost:3000/api/transactions/${cancelledExpenseTxId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({ confirmed: true }),
      });

      const res = await restoreRoute(req, { params: { id: cancelledExpenseTxId } });
      expect(res.status).toBe(422);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('INSUFFICIENT_BALANCE_TO_RESTORE');

      // Verify wallet balance remains unchanged
      const wAfter = await prisma.wallet.findUnique({ where: { id: user1WalletId } });
      expect(wAfter?.balance).toBe(200.0);
    });

    it('should restore cancelled INCOME 150.00 atomically, re-crediting wallet balance (200.0 -> 350.0)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/transactions/${cancelledIncomeTxId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({ confirmed: true }),
      });

      const res = await restoreRoute(req, { params: { id: cancelledIncomeTxId } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.isCancelled).toBe(false);
      expect(json.data.cancelledAt).toBeNull();

      // Wallet balance must increase: 200 + 150 = 350
      const wUpdated = await prisma.wallet.findUnique({ where: { id: user1WalletId } });
      expect(wUpdated?.balance).toBe(350.0);
    });

    it('should now successfully restore EXPENSE 300.00 since balance is 350.00, deducting balance to 50.00', async () => {
      const req = new NextRequest(`http://localhost:3000/api/transactions/${cancelledExpenseTxId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({ confirmed: true }),
      });

      const res = await restoreRoute(req, { params: { id: cancelledExpenseTxId } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.isCancelled).toBe(false);

      // Wallet balance must decrease: 350 - 300 = 50
      const wFinal = await prisma.wallet.findUnique({ where: { id: user1WalletId } });
      expect(wFinal?.balance).toBe(50.0);
    });
  });
});
