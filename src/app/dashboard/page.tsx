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
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create Folder Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [walletType, setWalletType] = useState<'CASH' | 'BANK' | 'EWALLET' | 'POCKET'>('POCKET');
  const [color, setColor] = useState('#ec4899');
  const [icon, setIcon] = useState('wallet');
  const [initialBalance, setInitialBalance] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  // Double-Check Archive Modal state
  const [archiveTarget, setArchiveTarget] = useState<WalletItem | null>(null);

  const loadWallets = useCallback(async () => {
    const res = await fetch('/api/wallets');
    const json = await res.json();
    if (res.ok && json.success) {
      setWallets(json.data.wallets);
      setTotalBalance(json.data.totalBalance);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/login');
          return;
        }
        const meJson = await meRes.json();
        setUser(meJson.user);

        if (meJson.user.role === 'USER') {
          await loadWallets();
        }
      } catch {
        setError('ไม่สามารถโหลดข้อมูลระบบได้');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router, loadWallets]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          walletType,
          color,
          icon,
          initialBalance: Number(initialBalance),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'สร้างโฟลเดอร์ไม่สำเร็จ');
      }

      setName('');
      setInitialBalance('0');
      setShowCreate(false);
      await loadWallets();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/wallets/${archiveTarget.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'เก็บโฟลเดอร์เข้ากรุไม่สำเร็จ');
      }
      setArchiveTarget(null);
      await loadWallets();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        กำลังโหลดข้อมูล CandyCash...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-pink-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">CandyCash</h1>
            <p className="text-xs text-slate-500">
              {user?.fullName} ({user?.role})
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
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
            <h2 className="text-lg font-bold text-slate-800">
              Admin Privacy Guard Active (BR-03)
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              บัญชีผู้ดูแลระบบ (ADMIN) ถูกจำกัดสิทธิ์ไม่ให้เข้าถึงโฟลเดอร์และรายการเงินส่วนตัวของ USER (100% Privacy)
            </p>
          </div>
        ) : (
          <>
            <section className="rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-pink-100 font-semibold">
                  ยอดเงินคงเหลือรวมสุทธิ (Total Net Balance)
                </p>
                <p className="text-3xl font-bold mt-1">
                  ฿{totalBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-pink-600 shadow hover:bg-pink-50 transition"
              >
                <Plus className="w-4 h-4" />
                สร้างโฟลเดอร์ใหม่
              </button>
            </section>

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

                      <div>
                        <p className="text-xs text-slate-500">ยอดคงเหลือ</p>
                        <p className="text-2xl font-bold text-slate-900">
                          ฿{Number(wallet.balance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Create Folder Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">สร้างโฟลเดอร์เก็บเงินใหม่</h3>
            <form onSubmit={handleCreateWallet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อโฟลเดอร์</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ค่ากินรายวัน, เงินเก็บเที่ยว"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ประเภท</label>
                  <select
                    value={walletType}
                    onChange={(e) =>
                      setWalletType(e.target.value as 'CASH' | 'BANK' | 'EWALLET' | 'POCKET')
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="CASH">CASH (เงินสด)</option>
                    <option value="BANK">BANK (ธนาคาร)</option>
                    <option value="EWALLET">EWALLET</option>
                    <option value="POCKET">POCKET (โฟลเดอร์ย่อย)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    ยอดเงินตั้งต้น (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
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
                  onClick={() => setShowCreate(false)}
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

      {/* Double-Check Archive Modal (BR-06) */}
      {archiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">
              ยืนยันการเก็บโฟลเดอร์เข้ากรุ (Double-Check)
            </h3>
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
    </div>
  );
}
