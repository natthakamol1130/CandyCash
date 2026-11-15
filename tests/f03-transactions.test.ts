import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { signSessionToken } from '../src/lib/auth';
import { POST as createTransactionRoute, GET as listTransactionsRoute } from '../src/app/api/transactions/route';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

describe('F-03: Atomic Income & Expense Transaction Logging', () => {
  let user1Token: string;
  let user2Token: string;
  let user1WalletId: string;
  let user2WalletId: string;
  let foodCategoryId: string;
  let salaryCategoryId: string;

  beforeAll(async () => {
    const hash = await bcrypt.hash('password123', 10);
    const user1 = await prisma.user.upsert({
      where: { email: 'f03_user1@candycash.local' },
      update: { passwordHash: hash },
      create: {
        id: 'u03-1111-1111-1111-111111111111',
        email: 'f03_user1@candycash.local',
        passwordHash: hash,
        fullName: 'F03 User One',
        role: 'USER',
      },
    });

    const user2 = await prisma.user.upsert({
      where: { email: 'f03_user2@candycash.local' },
      update: { passwordHash: hash },
      create: {
        id: 'u03-2222-2222-2222-222222222222',
        email: 'f03_user2@candycash.local',
        passwordHash: hash,
        fullName: 'F03 User Two',
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

    // Create wallet for user1 with initial balance 1000.00
    const w1 = await prisma.wallet.create({
      data: {
        ownerId: user1.id,
        name: 'Main Wallet',
        walletType: 'CASH',
        color: '#3b82f6',
        icon: 'wallet',
        balance: 1000.0,
      },
    });
    user1WalletId = w1.id;

    // Create wallet for user2 with initial balance 500.00
    const w2 = await prisma.wallet.create({
      data: {
        ownerId: user2.id,
        name: 'User 2 Wallet',
        walletType: 'BANK',
        color: '#10b981',
        icon: 'landmark',
        balance: 500.0,
      },
    });
    user2WalletId = w2.id;

    // Fetch or create categories
    let foodCat = await prisma.category.findFirst({ where: { name: { contains: 'อาหาร' } } });
    if (!foodCat) {
      foodCat = await prisma.category.create({
        data: { name: 'Food Expense', type: 'EXPENSE', icon: 'utensils', isSystem: true },
      });
    }
    foodCategoryId = foodCat.id;

    let salaryCat = await prisma.category.findFirst({ where: { name: { contains: 'เงินเดือน' } } });
    if (!salaryCat) {
      salaryCat = await prisma.category.create({
        data: { name: 'Salary Income', type: 'INCOME', icon: 'banknote', isSystem: true },
      });
    }
    salaryCategoryId = salaryCat.id;
  });

  describe('TEST-05: Record valid expense updates wallet balance atomically', () => {
    it('should deduct expense amount from wallet atomically and create transaction record', async () => {
      const initialWallet = await prisma.wallet.findUnique({ where: { id: user1WalletId } });
      expect(initialWallet?.balance).toBe(1000.0);

      const req = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({
          walletId: user1WalletId,
          categoryId: foodCategoryId,
          type: 'EXPENSE',
          amount: 250.0,
          note: 'Lunch with team',
        }),
      });

      const res = await createTransactionRoute(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.amount).toBe(250.0);
      expect(json.data.type).toBe('EXPENSE');

      // Verify wallet balance in DB is updated atomically to 750.00
      const updatedWallet = await prisma.wallet.findUnique({ where: { id: user1WalletId } });
      expect(updatedWallet?.balance).toBe(750.0);
    });
  });

  describe('TEST-06: Overdraft Protection & Race Condition Prevention (BR-01, BR-02)', () => {
    it('should reject expense exceeding wallet balance with 422 and keep wallet balance unchanged', async () => {
      const beforeWallet = await prisma.wallet.findUnique({ where: { id: user1WalletId } });
      const currentBalance = beforeWallet?.balance; // 750.0

      const req = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({
          walletId: user1WalletId,
          categoryId: foodCategoryId,
          type: 'EXPENSE',
          amount: 1000.0, // Exceeds available balance (750.0)
          note: 'Expensive luxury item',
        }),
      });

      const res = await createTransactionRoute(req);
      expect(res.status).toBe(422);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('INSUFFICIENT_BALANCE');

      // Verify balance did NOT change
      const afterWallet = await prisma.wallet.findUnique({ where: { id: user1WalletId } });
      expect(afterWallet?.balance).toBe(currentBalance);
    });

    it('should prevent race condition overdraft when 2 concurrent expenses exceed balance via Promise.all (BR-02)', async () => {
      // Create a dedicated wallet with exactly 500.00 balance
      const user = await prisma.user.findUnique({ where: { email: 'f03_user1@candycash.local' } });
      const raceWallet = await prisma.wallet.create({
        data: {
          ownerId: user!.id,
          name: 'Race Condition Test Wallet',
          walletType: 'CASH',
          color: '#ef4444',
          balance: 500.0,
        },
      });

      // Fire 2 concurrent expense requests of 400.00 each simultaneously
      const makeRequest = () =>
        createTransactionRoute(
          new NextRequest('http://localhost:3000/api/transactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              cookie: `candycash_session=${user1Token}`,
            },
            body: JSON.stringify({
              walletId: raceWallet.id,
              type: 'EXPENSE',
              amount: 400.0,
              note: 'Concurrent test',
            }),
          })
        );

      const [res1, res2] = await Promise.all([makeRequest(), makeRequest()]);
      const statuses = [res1.status, res2.status].sort();

      // Exactly ONE request must succeed (201) and ONE must be blocked (422)
      expect(statuses).toEqual([201, 422]);

      // Final balance must be 500 - 400 = 100, NEVER negative
      const finalWallet = await prisma.wallet.findUnique({ where: { id: raceWallet.id } });
      expect(finalWallet?.balance).toBe(100.0);
    });
  });

  describe('TEST-07: Category Validation & Atomic Income', () => {
    it('should reject transaction when category type does not match transaction type with 422 CATEGORY_TYPE_MISMATCH (BR-01)', async () => {
      // Attempt to log EXPENSE with Salary Category (which has type INCOME)
      const req = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({
          walletId: user1WalletId,
          categoryId: salaryCategoryId, // INCOME category
          type: 'EXPENSE', // EXPENSE transaction
          amount: 100.0,
        }),
      });

      const res = await createTransactionRoute(req);
      expect(res.status).toBe(422);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('CATEGORY_TYPE_MISMATCH');
    });

    it('should add income amount to wallet balance atomically when matching category is used', async () => {
      const beforeWallet = await prisma.wallet.findUnique({ where: { id: user1WalletId } });
      const currentBalance = beforeWallet?.balance!; // 750.0

      const req = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({
          walletId: user1WalletId,
          categoryId: salaryCategoryId,
          type: 'INCOME',
          amount: 500.0,
          note: 'Bonus payout',
        }),
      });

      const res = await createTransactionRoute(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.amount).toBe(500.0);
      expect(json.data.type).toBe('INCOME');

      // Balance must increase atomically: 750.0 + 500.0 = 1250.0
      const afterWallet = await prisma.wallet.findUnique({ where: { id: user1WalletId } });
      expect(afterWallet?.balance).toBe(currentBalance + 500.0);
    });
  });

  describe('Privacy and Validation Guards', () => {
    it('should prevent user from recording transactions into another user wallet with 403 Forbidden', async () => {
      const req = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({
          walletId: user2WalletId, // user2 wallet
          type: 'INCOME',
          amount: 100.0,
        }),
      });

      const res = await createTransactionRoute(req);
      expect(res.status).toBe(403);
    });

    it('should reject invalid amount <= 0 with 400 INVALID_AMOUNT', async () => {
      const req = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `candycash_session=${user1Token}`,
        },
        body: JSON.stringify({
          walletId: user1WalletId,
          type: 'EXPENSE',
          amount: -50.0,
        }),
      });

      const res = await createTransactionRoute(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe('INVALID_AMOUNT');
    });

    it('should list only the authenticated user transactions via GET /api/transactions', async () => {
      const req = new NextRequest('http://localhost:3000/api/transactions', {
        headers: { cookie: `candycash_session=${user1Token}` },
      });

      const res = await listTransactionsRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data.transactions)).toBe(true);
      expect(json.data.transactions.length).toBeGreaterThan(0);
      expect(typeof json.data.totalIncome).toBe('number');
      expect(typeof json.data.totalExpense).toBe('number');
    });
  });
});
