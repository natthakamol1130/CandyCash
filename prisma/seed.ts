import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CandyCash database...');

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

  console.log('✅ Created users: user1, user2, admin');

  // 2. Create System Standard Categories
  const categories = await prisma.$transaction([
    prisma.category.create({ data: { name: 'เงินเดือน (Salary)', type: 'INCOME', icon: 'banknote', isSystem: true } }),
    prisma.category.create({ data: { name: 'อาหาร & เครื่องดื่ม (Food)', type: 'EXPENSE', icon: 'utensils', isSystem: true } }),
    prisma.category.create({ data: { name: 'เดินทาง (Transport)', type: 'EXPENSE', icon: 'car', isSystem: true } }),
    prisma.category.create({ data: { name: 'ที่พัก & บิล (Housing)', type: 'EXPENSE', icon: 'home', isSystem: true } }),
    prisma.category.create({ data: { name: 'ช้อปปิ้ง & บันเทิง (Leisure)', type: 'EXPENSE', icon: 'shopping-bag', isSystem: true } }),
    prisma.category.create({ data: { name: 'สุขภาพ & ยา (Health)', type: 'EXPENSE', icon: 'heart', isSystem: true } }),
  ]);

  console.log(`✅ Created ${categories.length} system categories`);

  // 3. Create Default Wallets for User 1
  const cashWallet = await prisma.wallet.create({
    data: {
      id: 'w1111111-1111-1111-1111-111111111111',
      ownerId: user1.id,
      name: 'กระเป๋าเงินสด (Daily Cash)',
      walletType: 'CASH',
      color: '#ec4899', // Pink
      icon: 'wallet',
      balance: 1500.0,
    },
  });

  const bankWallet = await prisma.wallet.create({
    data: {
      id: 'w2222222-2222-2222-2222-222222222222',
      ownerId: user1.id,
      name: 'บัญชีธนาคาร (Main Bank)',
      walletType: 'BANK',
      color: '#8b5cf6', // Purple
      icon: 'landmark',
      balance: 10000.0,
    },
  });

  console.log('✅ Created default wallets for user1');

  // 4. Create Standard Budget Templates
  await prisma.budgetTemplate.create({
    data: {
      name: 'สูตรจัดงบ 50/30/20 (Needs / Wants / Savings)',
      description: 'แบ่ง 50% สำหรับของจำเป็น, 30% สำหรับความสุข, 20% สำหรับเก็บออม',
      rulesJson: JSON.stringify({ needs: 50, wants: 30, savings: 20 }),
      isSystem: true,
    },
  });

  console.log('🌱 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
