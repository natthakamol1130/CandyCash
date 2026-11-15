import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';
import { loginUser } from '../src/services/auth-service';
import { POST as moveTransactionRoute } from '../src/app/api/transactions/[id]/move/route';
import { POST as cancelTransactionRoute } from '../src/app/api/transactions/[id]/cancel/route';

describe('F-04: Self-Service Double-Check Move & Cancel Transaction', () => {
  let user1Token = '';
  let user2Token = '';
  let user1Id = '11111111-1111-1111-1111-111111111111';
  let user2Id = '22222222-2222-2222-2222-222222222222';

  let walletAId = '';
  let walletBId = '';
  let walletCId = '';
  let user2WalletId = '';

  let expenseTxId = '';
  let incomeTxId = '';

  beforeAll(async () => {
    const hash = await bcrypt.hash('password123', 10);

    await prisma.user.upsert({
      where: { email: 'user1@candycash.local' },
      update: { passwordHash: hash },
      create: {
        id: user1Id,
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
        id: user2Id,
        email: 'user2@candycash.local',
        passwordHash: hash,
        fullName: 'Bob Builder',
        role: 'USER',
      },
    });

    user1Token = (await loginUser('user1@candycash.local', 'password123')).token!;
    user2Token = (await loginUser('user2@candycash.local', 'password123')).token!;

    // Wallet A: 700.00 (after spending 300.00), Wallet B: 1000.00, Wallet C: 100.00
    const walletA = await prisma.wallet.create({
      data: { ownerId: user1Id, name: 'F04 Wallet A', walletType: 'CASH', balance: 700.0 },
    });
    const walletB = await prisma.wallet.create({
      data: { ownerId: user1Id, name: 'F04 Wallet B', walletType: 'BANK', balance: 1000.0 },
    });
    const walletC = await prisma.wallet.create({
      data: { ownerId: user1Id, name: 'F04 Wallet C', walletType: 'POCKET', balance: 100.0 },
    });
    const u2Wallet = await prisma.wallet.create({
      data: { ownerId: user2Id, name: 'F04 User2 Wallet', walletType: 'CASH', balance: 500.0 },
    });

    walletAId = walletA.id;
    walletBId = walletB.id;
    walletCId = walletC.id;
    user2WalletId = u2Wallet.id;

    const expTx = await prisma.transaction.create({
      data: {
        walletId: walletAId,
        createdById: user1Id,
        type: 'EXPENSE',
        amount: 300.0,
        note: 'Lunch to move or cancel',
      },
    });
    expenseTxId = expTx.id;

    const incTx = await prisma.transaction.create({
      data: {
        walletId: walletCId,
        createdById: user1Id,
        type: 'INCOME',
        amount: 500.0,
        note: 'Income larger than Wallet C current balance (100.00)',
      },
    });
    incomeTxId = incTx.id;
  });

  describe('TEST-08: Double-Check Move Transaction (BR-04)', () => {
    it('should reject move without confirmed: true (400 CONFIRMATION_REQUIRED)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/transactions/${expenseTxId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({ targetWalletId: walletBId }),
      });

      const res = await moveTransactionRoute(req, { params: { id: expenseTxId } });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe('CONFIRMATION_REQUIRED');
    });

    it('should reject moving EXPENSE A -> C when target wallet C lacks balance (422 INSUFFICIENT_TARGET_BALANCE)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/transactions/${expenseTxId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({ targetWalletId: walletCId, confirmed: true }),
      });

      const res = await moveTransactionRoute(req, { params: { id: expenseTxId } });
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.code).toBe('INSUFFICIENT_TARGET_BALANCE');

      const wA = await prisma.wallet.findUnique({ where: { id: walletAId } });
      const wC = await prisma.wallet.findUnique({ where: { id: walletCId } });
      expect(wA?.balance).toBe(700.0);
      expect(wC?.balance).toBe(100.0);
    });

    it('should reject moving INCOME C -> B when source wallet C lacks balance (422 INSUFFICIENT_SOURCE_BALANCE)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/transactions/${incomeTxId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({ targetWalletId: walletBId, confirmed: true }),
      });

      const res = await moveTransactionRoute(req, { params: { id: incomeTxId } });
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.code).toBe('INSUFFICIENT_SOURCE_BALANCE');
    });

    it('should block user2 from moving user1 transaction (403 FORBIDDEN) or moving to another user wallet', async () => {
      const req1 = new NextRequest(`http://localhost:3000/api/transactions/${expenseTxId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user2Token}`,
        },
        body: JSON.stringify({ targetWalletId: user2WalletId, confirmed: true }),
      });
      const res1 = await moveTransactionRoute(req1, { params: { id: expenseTxId } });
      expect(res1.status).toBe(403);

      const req2 = new NextRequest(`http://localhost:3000/api/transactions/${expenseTxId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({ targetWalletId: user2WalletId, confirmed: true }),
      });
      const res2 = await moveTransactionRoute(req2, { params: { id: expenseTxId } });
      expect(res2.status).toBe(403);
    });

    it('should move EXPENSE 300.00 from A (700) -> B (1000) atomically when confirmed: true', async () => {
      const req = new NextRequest(`http://localhost:3000/api/transactions/${expenseTxId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({ targetWalletId: walletBId, confirmed: true }),
      });

      const res = await moveTransactionRoute(req, { params: { id: expenseTxId } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.walletId).toBe(walletBId);

      const wA = await prisma.wallet.findUnique({ where: { id: walletAId } });
      const wB = await prisma.wallet.findUnique({ where: { id: walletBId } });
      expect(wA?.balance).toBe(1000.0);
      expect(wB?.balance).toBe(700.0);
    });
  });

  describe('TEST-09: Double-Check Cancel Transaction to Trash (BR-05)', () => {
    it('should reject cancel without confirmed: true (400 CONFIRMATION_REQUIRED)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/transactions/${expenseTxId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({}),
      });

      const res = await cancelTransactionRoute(req, { params: { id: expenseTxId } });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe('CONFIRMATION_REQUIRED');
    });

    it('should reject canceling INCOME when wallet lacks balance to deduct (422 INSUFFICIENT_BALANCE_TO_CANCEL)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/transactions/${incomeTxId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({ confirmed: true }),
      });

      const res = await cancelTransactionRoute(req, { params: { id: incomeTxId } });
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.code).toBe('INSUFFICIENT_BALANCE_TO_CANCEL');
    });

    it('should cancel EXPENSE 300.00 in Wallet B (700 -> 1000), mark isCancelled: true, and block duplicate cancel (409)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/transactions/${expenseTxId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({ confirmed: true }),
      });

      const res = await cancelTransactionRoute(req, { params: { id: expenseTxId } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.isCancelled).toBe(true);
      expect(json.data.cancelledAt).toBeTruthy();

      const wB = await prisma.wallet.findUnique({ where: { id: walletBId } });
      expect(wB?.balance).toBe(1000.0);

      // Duplicate cancel must return 409 INVALID_TRANSACTION_STATE
      const dupReq = new NextRequest(`http://localhost:3000/api/transactions/${expenseTxId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({ confirmed: true }),
      });
      const dupRes = await cancelTransactionRoute(dupReq, { params: { id: expenseTxId } });
      expect(dupRes.status).toBe(409);
      const dupJson = await dupRes.json();
      expect(dupJson.code).toBe('INVALID_TRANSACTION_STATE');
    });

    it('should block user2 from canceling user1 transaction (403 FORBIDDEN)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/transactions/${incomeTxId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user2Token}`,
        },
        body: JSON.stringify({ confirmed: true }),
      });

      const res = await cancelTransactionRoute(req, { params: { id: incomeTxId } });
      expect(res.status).toBe(403);
    });
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany({
      where: { walletId: { in: [walletAId, walletBId, walletCId, user2WalletId] } },
    });
    await prisma.wallet.deleteMany({
      where: { id: { in: [walletAId, walletBId, walletCId, user2WalletId] } },
    });
  });
});
