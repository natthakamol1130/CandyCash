'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Archive,
  CreditCard,
  FolderOpen,
  LogOut,
  PiggyBank,
  Plus,
  ShieldAlert,
  ShoppingBag,
  Smartphone,
  Utensils,
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ReceiptText,
  Trash2,
  RotateCcw,
} from 'lucide-react';

interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN';
}

interface WalletItem {
  id: string;
  name: string;
  walletType: 'CASH' | 'BANK' | 'EWALLET' | 'POCKET';
  color: string;
  icon: string;
  balance: number;
  isArchived: boolean;
}

interface CategoryItem {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
}

interface TransactionItem {
  id: string;
  walletId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  note: string | null;
  transactionDate: string;
  wallet?: { name: string; color: string };
  category?: { name: string } | null;
}

const COLOR_PRESETS = ['#ec4899', '#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6'];
const ICON_PRESETS = [
  { id: 'wallet', label: 'กระเป๋า' },
  { id: 'utensils', label: 'อาหาร' },
  { id: 'shopping-bag', label: 'ช้อปปิ้ง' },
  { id: 'piggy-bank', label: 'ออมเงิน' },
  { id: 'credit-card', label: 'ธนาคาร' },
  { id: 'smartphone', label: 'E-Wallet' },
];

function renderWalletIcon(icon: string) {
  const cls = 'w-5 h-5 text-white';
  switch (icon) {
    case 'utensils':
      return <Utensils className={cls} />;
    case 'shopping-bag':
      return <ShoppingBag className={cls} />;
    case 'piggy-bank':
      return <PiggyBank className={cls} />;
    case 'credit-card':
      return <CreditCard className={cls} />;
    case 'smartphone':
      return <Smartphone className={cls} />;
    default:
      return <WalletIcon className={cls} />;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Modals
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [showCreateTx, setShowCreateTx] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<WalletItem | null>(null);
  const [moveTarget, setMoveTarget] = useState<TransactionItem | null>(null);
  const [moveTargetWalletId, setMoveTargetWalletId] = useState('');
  const [cancelTarget, setCancelTarget] = useState<TransactionItem | null>(null);
  const [trashItems, setTrashItems] = useState<TransactionItem[]>([]);
  const [restoreTarget, setRestoreTarget] = useState<TransactionItem | null>(null);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'TRASH'>('ACTIVE');

  // Form states - Create Wallet
  const [name, setName] = useState('');
  const [walletType, setWalletType] = useState<'CASH' | 'BANK' | 'EWALLET' | 'POCKET'>('CASH');
  const [color, setColor] = useState('#ec4899');
  const [icon, setIcon] = useState('wallet');
  const [initialBalance, setInitialBalance] = useState('0');

  // Form states - Create Transaction
  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [txWalletId, setTxWalletId] = useState('');
  const [txCategoryId, setTxCategoryId] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txNote, setTxNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch {
      router.push('/login');
    }
  }, [router]);

  const fetchWallets = useCallback(async () => {
    try {
      const res = await fetch('/api/wallets');
      if (res.status === 403) return;
      if (!res.ok) throw new Error('Failed to load wallets');
      const data = await res.json();
      if (data.success) {
        setWallets(data.data.wallets);
        setTotalBalance(data.data.totalBalance);
        if (data.data.wallets.length > 0 && !txWalletId) {
          setTxWalletId(data.data.wallets[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching wallets');
    }
  }, [txWalletId]);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch('/api/transactions');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data.transactions);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchTrash = useCallback(async () => {
    try {
      const res = await fetch('/api/trash');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setTrashItems(data.data.trashItems);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchSession(), fetchWallets(), fetchTransactions(), fetchCategories(), fetchTrash()]).finally(() =>
      setLoading(false)
    );
  }, [fetchSession, fetchWallets, fetchTransactions, fetchCategories, fetchTrash]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          walletType,
          color,
          icon,
          initialBalance: parseFloat(initialBalance) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create wallet');
      }

      setShowCreateWallet(false);
      setName('');
      setInitialBalance('0');
      await fetchWallets();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: txWalletId,
          categoryId: txCategoryId || undefined,
          type: txType,
          amount: parseFloat(txAmount),
          note: txNote,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record transaction');
      }

      setShowCreateTx(false);
      setTxAmount('');
      setTxNote('');
      await Promise.all([fetchWallets(), fetchTransactions()]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/wallets/${archiveTarget.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to archive wallet');
      }

      setArchiveTarget(null);
      await fetchWallets();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openMoveModal = (tx: TransactionItem) => {
    const otherWallet = wallets.find((w) => w.id !== tx.walletId);
    setMoveTargetWalletId(otherWallet?.id || '');
    setMoveTarget(tx);
  };

  const handleConfirmMove = async () => {
    if (!moveTarget || !moveTargetWalletId) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/transactions/${moveTarget.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetWalletId: moveTargetWalletId, confirmed: true }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to move transaction');
      }

      setMoveTarget(null);
      await Promise.all([fetchWallets(), fetchTransactions()]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/transactions/${cancelTarget.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to cancel transaction');
      }

      setCancelTarget(null);
      await Promise.all([fetchWallets(), fetchTransactions(), fetchTrash()]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/transactions/${restoreTarget.id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to restore transaction');
      }

      setRestoreTarget(null);
      await Promise.all([fetchWallets(), fetchTransactions(), fetchTrash()]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedWalletForTx = wallets.find((w) => w.id === txWalletId);
  const isOverdraft =
    txType === 'EXPENSE' &&
    selectedWalletForTx &&
    parseFloat(txAmount || '0') > selectedWalletForTx.balance;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 text-sm">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-slate-900">CandyCash</span>
            {user && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                {user.role}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-600 hidden sm:inline">{user?.fullName}</span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-rose-600 transition font-medium"
            >
              <LogOut className="w-4 h-4" />
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {user?.role === 'ADMIN' ? (
          <div className="rounded-2xl bg-white p-8 border border-indigo-100 shadow-sm text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-indigo-500 mx-auto" />
            <h2 className="text-lg font-bold text-slate-800">Admin Privacy Guard Active (BR-03)</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              บัญชีผู้ดูแลระบบ (ADMIN) ถูกจำกัดสิทธิ์ไม่ให้เข้าถึงโฟลเดอร์และรายการเงินส่วนตัวของ USER (100% Privacy)
            </p>
          </div>
        ) : (
          <>
            {/* Top Summary Banner */}
            <section className="rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-pink-100 font-semibold">
                  ยอดเงินคงเหลือรวมสุทธิ (Total Net Balance)
                </p>
                <p className="text-3xl font-bold mt-1">
                  ฿{totalBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateTx(true)}
                  disabled={wallets.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2.5 text-sm font-semibold text-white border border-white/30 hover:bg-white/30 transition disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  จดรายรับ-รายจ่าย
                </button>
                <button
                  onClick={() => setShowCreateWallet(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-pink-600 shadow hover:bg-pink-50 transition"
                >
                  <Plus className="w-4 h-4" />
                  สร้างโฟลเดอร์ใหม่
                </button>
              </div>
            </section>

            {/* Wallets Grid */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-pink-500" />
                  โฟลเดอร์เก็บเงินของคุณ ({wallets.length})
                </h2>
              </div>

              {wallets.length === 0 ? (
                <div className="rounded-2xl bg-white border border-dashed border-slate-300 p-10 text-center text-slate-500 text-sm">
                  ยังไม่มีโฟลเดอร์เก็บเงิน กดปุ่ม &ldquo;สร้างโฟลเดอร์ใหม่&rdquo; เพื่อเริ่มต้นจดบันทึกได้เลย
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wallets.map((wallet) => (
                    <div
                      key={wallet.id}
                      className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: wallet.color }}
                          >
                            {renderWalletIcon(wallet.icon)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800">{wallet.name}</h3>
                            <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {wallet.walletType}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setArchiveTarget(wallet)}
                          title="เก็บเข้ากรุ (Archive)"
                          className="text-slate-400 hover:text-amber-600 p-1.5 rounded-lg hover:bg-amber-50 transition"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="border-t border-slate-100 pt-3">
                        <p className="text-xs text-slate-500">ยอดเงินในโฟลเดอร์</p>
                        <p className="text-xl font-bold text-slate-900 mt-0.5">
                          ฿{Number(wallet.balance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Transactions & Trash Section (F-03, F-04, F-05) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ACTIVE')}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                      activeTab === 'ACTIVE'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ReceiptText className="w-4 h-4 text-indigo-500" />
                    ประวัติรายการล่าสุด ({transactions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('TRASH')}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                      activeTab === 'TRASH'
                        ? 'bg-rose-50 text-rose-700'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    ถังขยะ / รายการที่ยกเลิก ({trashItems.length})
                  </button>
                </div>
              </div>

              {activeTab === 'ACTIVE' ? (
                transactions.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-slate-500 text-sm shadow-sm">
                    ยังไม่มีประวัติรายการ กดปุ่ม &ldquo;จดรายรับ-รายจ่าย&rdquo; ด้านบนเพื่อบันทึกรายการแรก
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
                    {transactions.slice(0, 10).map((tx) => (
                      <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                            }`}
                          >
                            {tx.type === 'INCOME' ? (
                              <ArrowDownLeft className="w-5 h-5" />
                            ) : (
                              <ArrowUpRight className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {tx.note || tx.category?.name || (tx.type === 'INCOME' ? 'รายรับ' : 'รายจ่าย')}
                            </p>
                            <p className="text-xs text-slate-400">
                              {tx.wallet?.name} • {new Date(tx.transactionDate).toLocaleDateString('th-TH')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p
                              className={`text-sm font-bold ${
                                tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {tx.type === 'INCOME' ? '+' : '-'}฿
                              {Number(tx.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium">สำเร็จ</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {wallets.length > 1 && (
                              <button
                                type="button"
                                onClick={() => openMoveModal(tx)}
                                title="ย้ายโฟลเดอร์ (Double-Check Move)"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              >
                                <ArrowLeftRight className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setCancelTarget(tx)}
                              title="ยกเลิกรายการลงถังขยะ (Double-Check Cancel)"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                trashItems.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-slate-500 text-sm shadow-sm">
                    ถังขยะว่างเปล่า ไม่มีรายการที่ถูกยกเลิก
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
                    {trashItems.map((tx) => (
                      <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-200 text-slate-500">
                            <Trash2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700 line-through">
                              {tx.note || tx.category?.name || (tx.type === 'INCOME' ? 'รายรับ' : 'รายจ่าย')}
                            </p>
                            <p className="text-xs text-slate-400">
                              {tx.wallet?.name} • วันที่ทำรายการ {new Date(tx.transactionDate).toLocaleDateString('th-TH')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-400 line-through">
                              {tx.type === 'INCOME' ? '+' : '-'}฿
                              {Number(tx.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </p>
                            <span className="text-[10px] text-rose-500 font-medium">ยกเลิกแล้ว</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setRestoreTarget(tx)}
                            title="กู้คืนรายการ (Double-Check Restore)"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            กู้คืน
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </section>
          </>
        )}
      </main>

      {/* Create Transaction Modal (F-03) */}
      {showCreateTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">บันทึกรายการ (Income / Expense)</h3>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTxType('EXPENSE')}
                  className={`py-2 rounded-lg transition ${
                    txType === 'EXPENSE' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  รายจ่าย (EXPENSE)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('INCOME')}
                  className={`py-2 rounded-lg transition ${
                    txType === 'INCOME' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  รายรับ (INCOME)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">เลือกโฟลเดอร์</label>
                <select
                  value={txWalletId}
                  onChange={(e) => setTxWalletId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (คงเหลือ: ฿{w.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">หมวดหมู่</label>
                <select
                  value={txCategoryId}
                  onChange={(e) => setTxCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                >
                  <option value="">ไม่ระบุหมวดหมู่</option>
                  {categories
                    .filter((c) => c.type === txType)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">จำนวนเงิน (บาท)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                />
              </div>

              {/* Overdraft Warning Banner (BR-01) */}
              {isOverdraft && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                  <strong>เตือนยอดเงินไม่พอ (BR-01):</strong> ยอดเงินในโฟลเดอร์นี้มีเพียง ฿
                  {selectedWalletForTx?.balance.toFixed(2)} การจ่าย ฿{parseFloat(txAmount).toFixed(2)}{' '}
                  จะถูกระบบบล็อกทันที
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">บันทึกข้อความ (Note)</label>
                <input
                  type="text"
                  value={txNote}
                  onChange={(e) => setTxNote(e.target.value)}
                  placeholder="เช่น ค่าข้าวกลางวัน, เงินเดือน"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTx(false)}
                  className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting || !!isOverdraft}
                  className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600 disabled:opacity-50"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Wallet Modal (F-02) */}
      {showCreateWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">สร้างโฟลเดอร์เก็บเงินใหม่</h3>

            <form onSubmit={handleCreateWallet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อโฟลเดอร์</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น ค่ากินรายสัปดาห์, ออมซื้อคอนโด"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ประเภทโฟลเดอร์</label>
                <select
                  value={walletType}
                  onChange={(e) => setWalletType(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                >
                  <option value="CASH">CASH (เงินสด)</option>
                  <option value="BANK">BANK (บัญชีธนาคาร)</option>
                  <option value="EWALLET">EWALLET (กระเป๋าเงินดิจิทัล)</option>
                  <option value="POCKET">POCKET (พ็อกเก็ต/ซองเก็บเงิน)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ยอดเงินเริ่มต้น (บาท)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">สีโฟลเดอร์</label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 ${
                        color === c ? 'border-slate-900 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">ไอคอน</label>
                <div className="grid grid-cols-3 gap-2">
                  {ICON_PRESETS.map((ic) => (
                    <button
                      type="button"
                      key={ic.id}
                      onClick={() => setIcon(ic.id)}
                      className={`px-2 py-1.5 rounded-lg border text-xs font-medium ${
                        icon === ic.id
                          ? 'border-pink-500 bg-pink-50 text-pink-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {ic.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateWallet(false)}
                  className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600 disabled:opacity-50"
                >
                  {submitting ? 'กำลังบันทึก...' : 'สร้างโฟลเดอร์'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Double-Check Move Transaction Modal (F-04 / BR-04) */}
      {moveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">
              ยืนยันการย้ายรายการข้ามโฟลเดอร์ (Double-Check)
            </h3>
            <p className="text-sm text-slate-600">
              ย้ายรายการ{' '}
              <strong>
                {moveTarget.type === 'INCOME' ? 'รายรับ' : 'รายจ่าย'} ฿
                {Number(moveTarget.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </strong>{' '}
              จากโฟลเดอร์ <strong>{moveTarget.wallet?.name}</strong> ไปยัง:
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                โฟลเดอร์ปลายทาง
              </label>
              <select
                value={moveTargetWalletId}
                onChange={(e) => setMoveTargetWalletId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                {wallets
                  .filter((w) => w.id !== moveTarget.walletId)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (คงเหลือ: ฿{w.balance.toFixed(2)})
                    </option>
                  ))}
              </select>
            </div>
            {(() => {
              const sourceW = wallets.find((w) => w.id === moveTarget.walletId);
              const targetW = wallets.find((w) => w.id === moveTargetWalletId);
              if (!sourceW || !targetW) return null;
              const delta = moveTarget.type === 'EXPENSE' ? moveTarget.amount : -moveTarget.amount;
              const sourceAfter = sourceW.balance + delta;
              const targetAfter = targetW.balance - delta;
              return (
                <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3 text-xs text-indigo-900 space-y-1">
                  <p>
                    <strong>{sourceW.name}:</strong> ฿{sourceW.balance.toFixed(2)} &rarr; ฿
                    {sourceAfter.toFixed(2)}
                  </p>
                  <p>
                    <strong>{targetW.name}:</strong> ฿{targetW.balance.toFixed(2)} &rarr; ฿
                    {targetAfter.toFixed(2)}
                  </p>
                </div>
              );
            })()}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMoveTarget(null)}
                className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={submitting || !moveTargetWalletId}
                onClick={handleConfirmMove}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'กำลังย้าย...' : 'ยืนยันย้ายโฟลเดอร์'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Double-Check Cancel Transaction Modal (F-04 / BR-05) */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">
              ยืนยันการยกเลิกรายการลงถังขยะ (Double-Check)
            </h3>
            <p className="text-sm text-slate-600">
              คุณต้องการยกเลิกรายการ{' '}
              <strong>
                {cancelTarget.type === 'INCOME' ? 'รายรับ' : 'รายจ่าย'} ฿
                {Number(cancelTarget.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </strong>{' '}
              ใช่หรือไม่? รายการจะถูกย้ายไปที่ถังขยะและปรับยอดเงินให้อัตโนมัติ
            </p>
            {(() => {
              const sourceW = wallets.find((w) => w.id === cancelTarget.walletId);
              if (!sourceW) return null;
              const after =
                cancelTarget.type === 'EXPENSE'
                  ? sourceW.balance + cancelTarget.amount
                  : sourceW.balance - cancelTarget.amount;
              return (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                  <strong>{sourceW.name}:</strong> ฿{sourceW.balance.toFixed(2)} &rarr; ฿
                  {after.toFixed(2)}
                </div>
              );
            })()}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                ไม่ยกเลิก
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmCancel}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {submitting ? 'กำลังยกเลิก...' : 'ยืนยันยกเลิกลงถังขยะ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Double-Check Archive Modal (BR-06) */}
      {archiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">ยืนยันการเก็บโฟลเดอร์เข้ากรุ (Double-Check)</h3>
            <p className="text-sm text-slate-600">
              คุณต้องการเก็บโฟลเดอร์ <strong>{archiveTarget.name}</strong> เข้ากรุ (Archive) ใช่หรือไม่?
              ข้อมูลรายการเดิมจะถูกเก็บรักษาไว้เพื่อความถูกต้องทางบัญชี
            </p>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              ยอดคงเหลือปัจจุบัน:{' '}
              <strong>
                ฿{Number(archiveTarget.balance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setArchiveTarget(null)}
                className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmArchive}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {submitting ? 'กำลังดำเนินการ...' : 'ยืนยันเก็บเข้ากรุ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Double-Check Restore Modal (F-05 / BR-05 / TEST-10) */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">
              ยืนยันการกู้คืนรายการจากถังขยะ (Double-Check Restore)
            </h3>
            <p className="text-sm text-slate-600">
              คุณต้องการกู้คืนรายการ{' '}
              <strong>
                {restoreTarget.type === 'INCOME' ? 'รายรับ' : 'รายจ่าย'} ฿
                {Number(restoreTarget.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </strong>{' '}
              กลับคืนสู่โฟลเดอร์ <strong>{restoreTarget.wallet?.name}</strong> ใช่หรือไม่?
            </p>
            {(() => {
              const sourceW = wallets.find((w) => w.id === restoreTarget.walletId);
              if (!sourceW) return null;
              const after =
                restoreTarget.type === 'EXPENSE'
                  ? sourceW.balance - restoreTarget.amount
                  : sourceW.balance + restoreTarget.amount;
              const isOverdraft = restoreTarget.type === 'EXPENSE' && sourceW.balance < restoreTarget.amount;
              return (
                <div
                  className={`rounded-xl p-3 text-xs space-y-1 ${
                    isOverdraft
                      ? 'bg-rose-50 border border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  }`}
                >
                  <p>
                    <strong>{sourceW.name}:</strong> ฿{sourceW.balance.toFixed(2)} &rarr; ฿
                    {after.toFixed(2)}
                  </p>
                  {isOverdraft && (
                    <p className="font-semibold text-rose-600">
                      คำเตือน: โฟลเดอร์มียอดเงินไม่เพียงพอสำหรับการกู้คืนรายจ่ายนี้ (ห้ามยอดติดลบ BR-02 / BR-05)
                    </p>
                  )}
                </div>
              );
            })()}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestoreTarget(null)}
                className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmRestore}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? 'กำลังกู้คืน...' : 'ยืนยันกู้คืนรายการ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
