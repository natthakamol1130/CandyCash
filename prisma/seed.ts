import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Seeding CandyCash database...');

  // Clean existing data for clean baseline
  await prisma.transaction.deleteMany();
  await prisma.budgetEnvelope.deleteMany();
  await prisma.savingsJar.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.category.deleteMany();
  await prisma.budgetTemplate.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // 1. Create Standard Users & Admin
  const user1 = await prisma.user.create({
    data: {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'user1@candycash.local',
      passwordHash: defaultPasswordHash,
      fullName: 'Alice Walker',
      role: 'USER',
      monthlyBudgetTarget: 12000.0,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      id: '22222222-2222-2222-2222-222222222222',
      email: 'user2@candycash.local',
      passwordHash: defaultPasswordHash,
      fullName: 'Bob Smith',
      role: 'USER',
      monthlyBudgetTarget: 15000.0,
    },
  });

  const admin = await prisma.user.create({
    data: {
      id: '99999999-9999-9999-9999-999999999999',
      email: 'admin@candycash.local',
      passwordHash: defaultPasswordHash,
      fullName: 'System Administrator',
      role: 'ADMIN',
      monthlyBudgetTarget: 20000.0,
    },
  });

  console.log('[SEED] Created users: user1, user2, admin');

  // 2. Create System Standard Categories
  const categories = await prisma.$transaction([
    prisma.category.create({ data: { name: 'เงินเดือน (Salary)', type: 'INCOME', icon: 'banknote', isSystem: true } }),
    prisma.category.create({ data: { name: 'อาหาร & เครื่องดื่ม (Food)', type: 'EXPENSE', icon: 'utensils', isSystem: true } }),
    prisma.category.create({ data: { name: 'เดินทาง (Transport)', type: 'EXPENSE', icon: 'car', isSystem: true } }),
    prisma.category.create({ data: { name: 'ที่พัก & บิล (Housing)', type: 'EXPENSE', icon: 'home', isSystem: true } }),
    prisma.category.create({ data: { name: 'ช้อปปิ้ง & บันเทิง (Leisure)', type: 'EXPENSE', icon: 'shopping-bag', isSystem: true } }),
    prisma.category.create({ data: { name: 'สุขภาพ & ยา (Health)', type: 'EXPENSE', icon: 'heart', isSystem: true } }),
  ]);

  console.log(`[SEED] Created ${categories.length} system categories`);

  // 3. Create Default Wallets for User 1 (Showcasing all 4 types, icons & colors)
  const cashWallet = await prisma.wallet.create({
    data: {
      id: 'w1111111-1111-1111-1111-111111111111',
      ownerId: user1.id,
      name: 'กระเป๋าเงินสด (Daily Cash)',
      walletType: 'CASH',
      color: '#34d399', // Mint Green
      icon: 'wallet',
      balance: 2500.0,
    },
  });

  const bankWallet = await prisma.wallet.create({
    data: {
      id: 'w2222222-2222-2222-2222-222222222222',
      ownerId: user1.id,
      name: 'บัญชีธนาคารหลัก (Main Bank)',
      walletType: 'BANK',
      color: '#60a5fa', // Sky Blue
      icon: 'landmark',
      balance: 35000.0,
    },
  });

  const ewallet = await prisma.wallet.create({
    data: {
      id: 'w3333333-3333-3333-3333-333333333333',
      ownerId: user1.id,
      name: 'กระเป๋า E-Wallet (TrueMoney)',
      walletType: 'EWALLET',
      color: '#fbbf24', // Amber Orange
      icon: 'smartphone',
      balance: 3200.0,
    },
  });

  const shoppingPocket = await prisma.wallet.create({
    data: {
      id: 'w4444444-4444-4444-4444-444444444444',
      ownerId: user1.id,
      name: 'กระเป๋าช้อปปิ้ง & แฟชั่น (Shopping Pocket)',
      walletType: 'POCKET',
      color: '#f472b6', // Candy Pink
      icon: 'shopping-bag',
      balance: 4500.0,
    },
  });

  const vacationSavings = await prisma.wallet.create({
    data: {
      id: 'w5555555-5555-5555-5555-555555555555',
      ownerId: user1.id,
      name: 'กระเป๋าออมเงินเที่ยว (Vacation Savings)',
      walletType: 'POCKET',
      color: '#a78bfa', // Lavender Purple
      icon: 'piggy-bank',
      balance: 8000.0,
    },
  });

  const treatsPocket = await prisma.wallet.create({
    data: {
      id: 'w6666666-6666-6666-6666-666666666666',
      ownerId: user1.id,
      name: 'งบขนม & คาเฟ่ (Treats & Cafe)',
      walletType: 'POCKET',
      color: '#fb7185', // Rose Red
      icon: 'utensils',
      balance: 900.0,
    },
  });

  console.log('[SEED] Created 6 diverse showcase wallets for user1');

  // Sample transactions for User 1
  const salaryCat = categories.find((c) => c.name.includes('Salary'));
  const foodCat = categories.find((c) => c.name.includes('Food'));
  const leisureCat = categories.find((c) => c.name.includes('Leisure'));

  if (salaryCat) {
    await prisma.transaction.create({
      data: {
        createdById: user1.id,
        walletId: bankWallet.id,
        categoryId: salaryCat.id,
        amount: 35000.0,
        type: 'INCOME',
        note: 'เงินเดือนประจำเดือน (Monthly Salary)',
        transactionDate: new Date(),
      },
    });
  }

  if (foodCat) {
    await prisma.transaction.create({
      data: {
        createdById: user1.id,
        walletId: cashWallet.id,
        categoryId: foodCat.id,
        amount: 350.0,
        type: 'EXPENSE',
        note: 'มื้อกลางวันร้านโปรด (Lunch Treat)',
        transactionDate: new Date(),
      },
    });
    await prisma.transaction.create({
      data: {
        createdById: user1.id,
        walletId: treatsPocket.id,
        categoryId: foodCat.id,
        amount: 120.0,
        type: 'EXPENSE',
        note: 'ชาไข่มุกและมาการอง (Boba & Macarons)',
        transactionDate: new Date(),
      },
    });
  }

  if (leisureCat) {
    await prisma.transaction.create({
      data: {
        createdById: user1.id,
        walletId: shoppingPocket.id,
        categoryId: leisureCat.id,
        amount: 1980.0,
        type: 'EXPENSE',
        note: 'เสื้อผ้าและของใช้ส่วนตัว (New Outfit)',
        transactionDate: new Date(),
      },
    });
  }

  console.log('[SEED] Created sample transactions for user1');

  // 4. Create Standard Budget Templates
  await prisma.budgetTemplate.create({
    data: {
      name: 'สูตรจัดงบ 50/30/20 (Needs / Wants / Savings)',
      description: 'แบ่ง 50% สำหรับของจำเป็น, 30% สำหรับความสุข, 20% สำหรับเก็บออม',
      rulesJson: JSON.stringify({ needs: 50, wants: 30, savings: 20 }),
      isSystem: true,
    },
  });

  console.log('[SEED] Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('[SEED_ERROR] Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
