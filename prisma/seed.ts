import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const IDS = {
  user1: '11111111-1111-1111-1111-111111111111',
  user2: '22222222-2222-2222-2222-222222222222',
  admin: '99999999-9999-9999-9999-999999999999',
  catSalary: 'c1111111-1111-1111-1111-111111111111',
  catFood: 'c2222222-2222-2222-2222-222222222222',
  catTransport: 'c3333333-3333-3333-3333-333333333333',
  catHousing: 'c4444444-4444-4444-4444-444444444444',
  catLeisure: 'c5555555-5555-5555-5555-555555555555',
  catHealth: 'c6666666-6666-6666-6666-666666666666',
  wCash: 'w1111111-1111-1111-1111-111111111111',
  wBank: 'w2222222-2222-2222-2222-222222222222',
  wEwallet: 'w3333333-3333-3333-3333-333333333333',
  wShopping: 'w4444444-4444-4444-4444-444444444444',
  wVacation: 'w5555555-5555-5555-5555-555555555555',
  wTreats: 'w6666666-6666-6666-6666-666666666666',
  txSalary: 't1111111-1111-1111-1111-111111111111',
  txLunch: 't2222222-2222-2222-2222-222222222222',
  txBoba: 't3333333-3333-3333-3333-333333333333',
  txOutfit: 't4444444-4444-4444-4444-444444444444',
  tpl503020: 'b1111111-1111-1111-1111-111111111111',
};

async function main() {
  const isProd = process.env.NODE_ENV === 'production';
  const seedDemoData =
    process.env.SEED_DEMO_DATA !== undefined
      ? process.env.SEED_DEMO_DATA === 'true'
      : !isProd;

  const adminPassword = process.env.ADMIN_PASSWORD || (isProd ? '' : 'password123');
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is required when NODE_ENV=production');
  }

  const demoPassword = process.env.DEMO_USER_PASSWORD || (isProd ? '' : 'password123');
  if (seedDemoData && !demoPassword) {
    throw new Error(
      'DEMO_USER_PASSWORD environment variable is required when SEED_DEMO_DATA=true in production'
    );
  }

  console.log(`[SEED] Seeding CandyCash database (non-destructive, demo=${seedDemoData})...`);

  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  // 1. Always upsert initial System Administrator
  await prisma.user.upsert({
    where: { email: 'admin@candycash.local' },
    update: {},
    create: {
      id: IDS.admin,
      email: 'admin@candycash.local',
      passwordHash: adminPasswordHash,
      fullName: 'System Administrator',
      role: 'ADMIN',
      monthlyBudgetTarget: 20000.0,
    },
  });

  // 2. Always upsert System Standard Categories (idempotent)
  const systemCategories = [
    { id: IDS.catSalary, name: 'เงินเดือน (Salary)', type: 'INCOME', icon: 'banknote' },
    { id: IDS.catFood, name: 'อาหาร & เครื่องดื่ม (Food)', type: 'EXPENSE', icon: 'utensils' },
    { id: IDS.catTransport, name: 'เดินทาง (Transport)', type: 'EXPENSE', icon: 'car' },
    { id: IDS.catHousing, name: 'ที่พัก & บิล (Housing)', type: 'EXPENSE', icon: 'home' },
    { id: IDS.catLeisure, name: 'ช้อปปิ้ง & บันเทิง (Leisure)', type: 'EXPENSE', icon: 'shopping-bag' },
    { id: IDS.catHealth, name: 'สุขภาพ & ยา (Health)', type: 'EXPENSE', icon: 'heart' },
  ];

  for (const cat of systemCategories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: {
        id: cat.id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        isSystem: true,
      },
    });
  }

  // 3. Always upsert Standard Budget Template (idempotent)
  await prisma.budgetTemplate.upsert({
    where: { id: IDS.tpl503020 },
    update: {},
    create: {
      id: IDS.tpl503020,
      name: 'สูตรจัดงบ 50/30/20 (Needs / Wants / Savings)',
      description: 'แบ่ง 50% สำหรับของจำเป็น, 30% สำหรับความสุข, 20% สำหรับเก็บออม',
      rulesJson: JSON.stringify({ needs: 50, wants: 30, savings: 20 }),
      isSystem: true,
    },
  });

  console.log('[SEED] Upserted admin account, 6 system categories, and default budget template');

  // 4. Optional Demo Accounts & Showcase Data (controlled by SEED_DEMO_DATA)
  if (seedDemoData) {
    const demoPasswordHash = await bcrypt.hash(demoPassword, 10);

    const user1 = await prisma.user.upsert({
      where: { email: 'user1@candycash.local' },
      update: {},
      create: {
        id: IDS.user1,
        email: 'user1@candycash.local',
        passwordHash: demoPasswordHash,
        fullName: 'Alice Walker',
        role: 'USER',
        monthlyBudgetTarget: 12000.0,
      },
    });

    await prisma.user.upsert({
      where: { email: 'user2@candycash.local' },
      update: {},
      create: {
        id: IDS.user2,
        email: 'user2@candycash.local',
        passwordHash: demoPasswordHash,
        fullName: 'Bob Smith',
        role: 'USER',
        monthlyBudgetTarget: 15000.0,
      },
    });

    const showcaseWallets = [
      { id: IDS.wCash, name: 'กระเป๋าเงินสด (Daily Cash)', walletType: 'CASH', color: '#34d399', icon: 'wallet', balance: 2500.0 },
      { id: IDS.wBank, name: 'บัญชีธนาคารหลัก (Main Bank)', walletType: 'BANK', color: '#60a5fa', icon: 'landmark', balance: 35000.0 },
      { id: IDS.wEwallet, name: 'กระเป๋า E-Wallet (TrueMoney)', walletType: 'EWALLET', color: '#fbbf24', icon: 'smartphone', balance: 3200.0 },
      { id: IDS.wShopping, name: 'กระเป๋าช้อปปิ้ง & แฟชั่น (Shopping Pocket)', walletType: 'POCKET', color: '#f472b6', icon: 'shopping-bag', balance: 4500.0 },
      { id: IDS.wVacation, name: 'กระเป๋าออมเงินเที่ยว (Vacation Savings)', walletType: 'POCKET', color: '#a78bfa', icon: 'piggy-bank', balance: 8000.0 },
      { id: IDS.wTreats, name: 'งบขนม & คาเฟ่ (Treats & Cafe)', walletType: 'POCKET', color: '#fb7185', icon: 'utensils', balance: 900.0 },
    ];

    for (const w of showcaseWallets) {
      await prisma.wallet.upsert({
        where: { id: w.id },
        update: {},
        create: {
          id: w.id,
          ownerId: user1.id,
          name: w.name,
          walletType: w.walletType,
          color: w.color,
          icon: w.icon,
          balance: w.balance,
        },
      });
    }

    const sampleTxs = [
      { id: IDS.txSalary, walletId: IDS.wBank, categoryId: IDS.catSalary, amount: 35000.0, type: 'INCOME', note: 'เงินเดือนประจำเดือน (Monthly Salary)' },
      { id: IDS.txLunch, walletId: IDS.wCash, categoryId: IDS.catFood, amount: 350.0, type: 'EXPENSE', note: 'มื้อกลางวันร้านโปรด (Lunch Treat)' },
      { id: IDS.txBoba, walletId: IDS.wTreats, categoryId: IDS.catFood, amount: 120.0, type: 'EXPENSE', note: 'ชาไข่มุกและมาการอง (Boba & Macarons)' },
      { id: IDS.txOutfit, walletId: IDS.wShopping, categoryId: IDS.catLeisure, amount: 1980.0, type: 'EXPENSE', note: 'เสื้อผ้าและของใช้ส่วนตัว (New Outfit)' },
    ];

    for (const tx of sampleTxs) {
      await prisma.transaction.upsert({
        where: { id: tx.id },
        update: {},
        create: {
          id: tx.id,
          createdById: user1.id,
          walletId: tx.walletId,
          categoryId: tx.categoryId,
          amount: tx.amount,
          type: tx.type,
          note: tx.note,
          transactionDate: new Date(),
        },
      });
    }

    console.log('[SEED] Upserted demo users, 6 showcase wallets, and sample transactions');
  }

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
