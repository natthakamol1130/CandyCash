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
  Search,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import { Language, translations } from '@/lib/i18n';
import {
  CandyIcon,
  LollipopIcon,
  SparkleIcon,
  BonbonIcon,
  LanguageToggle,
  ThemeToggle,
  ThemeMode,
} from '@/components/CandyIcons';

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

interface BudgetTemplateItem {
  id: string;
  name: string;
  description: string | null;
  rulesJson: string;
}

interface BudgetSummary {
  monthlyBudgetTarget: number;
  spentThisMonth: number;
  remainingBudget: number;
  remainingDaysInMonth: number;
  dailySafeToSpend: number;
  categoryBreakdown: { categoryName: string; amount: number; percentage: number }[];
}

const COLOR_PRESETS = ['#f472b6', '#34d399', '#60a5fa', '#fbbf24', '#a78bfa', '#fb7185'];

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
  const [lang, setLang] = useState<Language>('en');
  const [user, setUser] = useState<UserSession | null>(null);
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    const saved = localStorage.getItem('candycash_lang') as Language;
    if (saved === 'en' || saved === 'th') {
      setLang(saved);
    }
    const savedTheme = localStorage.getItem('candycash_theme') as ThemeMode;
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const handleLangChange = (l: Language) => {
    setLang(l);
    localStorage.setItem('candycash_lang', l);
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem('candycash_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const t = translations[lang];

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
  const [color, setColor] = useState('#f472b6');
  const [icon, setIcon] = useState('wallet');
  const [initialBalance, setInitialBalance] = useState('0');

  // Form states - Create Transaction
  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [txWalletId, setTxWalletId] = useState('');
  const [txCategoryId, setTxCategoryId] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txNote, setTxNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // F-06 states (Budget, Templates, Search/Filter, Admin Catalog)
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [templates, setTemplates] = useState<BudgetTemplateItem[]>([]);
  const [budgetInput, setBudgetInput] = useState('10000');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [filterWalletId, setFilterWalletId] = useState('');

  // Admin forms
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [newTplName, setNewTplName] = useState('');
  const [newTplDesc, setNewTplDesc] = useState('');
  const [newTplBudget, setNewTplBudget] = useState('12000');

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

  const fetchBudget = useCallback(async () => {
    try {
      const res = await fetch('/api/budget');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setBudgetSummary(data.data);
        setBudgetInput(String(data.data.monthlyBudgetTarget));
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/budget-templates');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetchSession(),
      fetchWallets(),
      fetchTransactions(),
      fetchCategories(),
      fetchTrash(),
      fetchBudget(),
      fetchTemplates(),
    ]).finally(() => setLoading(false));
  }, [fetchSession, fetchWallets, fetchTransactions, fetchCategories, fetchTrash, fetchBudget, fetchTemplates]);

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
      await Promise.all([fetchWallets(), fetchTransactions(), fetchBudget()]);
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
      await Promise.all([fetchWallets(), fetchTransactions(), fetchTrash(), fetchBudget()]);
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
      await Promise.all([fetchWallets(), fetchTransactions(), fetchTrash(), fetchBudget()]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBudget = async (targetAmount: number) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/budget', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyBudgetTarget: targetAmount }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update budget');
      await fetchBudget();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSystemCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName, type: newCatType, icon: 'tag' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create category');
      setNewCatName('');
      await fetchCategories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBudgetTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/budget-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTplName,
          description: newTplDesc,
          rulesJson: JSON.stringify({
            needs: 50,
            wants: 30,
            savings: 20,
            recommendedMonthlyBudget: Number(newTplBudget) || 10000,
          }),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create template');
      setNewTplName('');
      setNewTplDesc('');
      await fetchTemplates();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType !== 'ALL' && tx.type !== filterType) return false;
    if (filterWalletId && tx.walletId !== filterWalletId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchNote = (tx.note || '').toLowerCase().includes(q);
      const matchCat = (tx.category?.name || '').toLowerCase().includes(q);
      const matchWallet = (tx.wallet?.name || '').toLowerCase().includes(q);
      if (!matchNote && !matchCat && !matchWallet) return false;
    }
    return true;
  });

  const selectedWalletForTx = wallets.find((w) => w.id === txWalletId);
  const isOverdraft =
    txType === 'EXPENSE' &&
    selectedWalletForTx &&
    parseFloat(txAmount || '0') > selectedWalletForTx.balance;

  const formatCategoryName = useCallback((name: string | null | undefined): string => {
    if (!name || name === 'Uncategorized' || name === 'ไม่ระบุหมวดหมู่') {
      return t.uncategorized;
    }
    if (lang === 'en') {
      const match = name.match(/\(([^)]+)\)$/);
      if (match) return match[1];
    } else if (lang === 'th') {
      const match = name.match(/^(.+?)\s*\([^)]+\)$/);
      if (match) return match[1];
    }
    return name;
  }, [lang, t.uncategorized]);

  const formatTemplateName = useCallback((name: string): string => {
    if (lang === 'en') {
      if (name.includes('50/30/20')) return '50/30/20 Rule (Needs / Wants / Savings)';
      const match = name.match(/\(([^)]+)\)$/);
      if (match) return match[1];
    }
    return name;
  }, [lang]);

  const iconPresets = [
    { id: 'wallet', label: lang === 'th' ? 'กระเป๋า' : 'Wallet' },
    { id: 'utensils', label: lang === 'th' ? 'อาหาร' : 'Food' },
    { id: 'shopping-bag', label: lang === 'th' ? 'ช้อปปิ้ง' : 'Shopping' },
    { id: 'piggy-bank', label: lang === 'th' ? 'ออมเงิน' : 'Savings' },
    { id: 'credit-card', label: lang === 'th' ? 'ธนาคาร' : 'Bank' },
    { id: 'smartphone', label: 'E-Wallet' },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pink-50/50 text-slate-500 text-sm">
        {t.loading}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-pink-50/80 via-white to-pink-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 pb-16 overflow-x-hidden transition-colors duration-300">
      {/* Decorative Soft Candy Pastel Blobs */}
      <div className="pointer-events-none fixed -top-32 -left-32 w-96 h-96 rounded-full bg-pink-200/25 dark:bg-pink-900/15 blur-3xl animate-pulse" />
      <div className="pointer-events-none fixed -bottom-32 -right-32 w-96 h-96 rounded-full bg-teal-100/20 dark:bg-teal-900/15 blur-3xl" />
      <div className="pointer-events-none fixed top-1/3 -right-20 w-80 h-80 rounded-full bg-rose-100/25 dark:bg-purple-900/10 blur-2xl" />

      {/* Very faint candy dots pattern */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.12] dark:opacity-[0.05] [background-image:radial-gradient(#f472b6_1px,transparent_1px)] [background-size:28px_28px]" />

      {/* Twinkling & Floating Stars / Sparkles & Candies scattered across Dashboard background */}
      {/* Top Left */}
      <div className="pointer-events-none fixed top-20 left-6 z-0 hidden md:flex items-center gap-2 animate-pulse">
        <SparkleIcon size={24} color="#fde047" />
        <CandyIcon size={20} className="-rotate-12" />
        <SparkleIcon size={14} color="#f472b6" />
      </div>
      {/* Top Right */}
      <div className="pointer-events-none fixed top-24 right-8 z-0 hidden md:flex items-center gap-2 opacity-85">
        <SparkleIcon size={20} color="#6ee7b7" />
        <LollipopIcon size={22} className="rotate-12" />
        <SparkleIcon size={12} color="#fbcfe8" />
      </div>
      {/* Mid Left */}
      <div className="pointer-events-none fixed top-1/3 left-4 z-0 hidden lg:flex flex-col items-center gap-3 opacity-80">
        <SparkleIcon size={18} color="#fde047" />
        <BonbonIcon size={28} className="-rotate-12" />
        <SparkleIcon size={12} color="#a7f3d0" className="animate-pulse" />
        <CandyIcon size={24} className="rotate-45" />
      </div>
      {/* Mid Right */}
      <div className="pointer-events-none fixed top-1/2 right-4 z-0 hidden lg:flex flex-col items-center gap-3 opacity-80">
        <SparkleIcon size={15} color="#f472b6" />
        <LollipopIcon size={28} className="-rotate-12" />
        <SparkleIcon size={20} color="#6ee7b7" className="animate-pulse" />
        <BonbonIcon size={22} className="rotate-12" />
      </div>
      {/* Bottom Left */}
      <div className="pointer-events-none fixed bottom-16 left-6 z-0 hidden sm:flex items-center gap-2 opacity-85">
        <SparkleIcon size={24} color="#f472b6" />
        <CandyIcon size={22} className="rotate-12" />
        <SparkleIcon size={14} color="#fde047" className="animate-pulse" />
      </div>
      {/* Bottom Right */}
      <div className="pointer-events-none fixed bottom-12 right-8 z-0 hidden sm:flex items-center gap-2 opacity-85">
        <SparkleIcon size={26} color="#6ee7b7" />
        <LollipopIcon size={24} className="-rotate-12" />
        <SparkleIcon size={15} color="#fbcfe8" />
        <SparkleIcon size={12} color="#fde047" />
      </div>

      <header className="border-b border-pink-100/70 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-20 shadow-sm shadow-pink-100/40 dark:shadow-slate-950/40 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-200 via-pink-100 to-teal-100 dark:from-slate-800 dark:via-pink-950/40 dark:to-slate-800 flex items-center justify-center shadow-sm shadow-pink-100 dark:shadow-slate-950 border border-pink-200/60 dark:border-slate-700 ring-2 ring-pink-50 dark:ring-slate-800">
              <CandyIcon className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-pink-500">
              {t.brandName}
            </span>
            {user && (
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  user.role === 'ADMIN'
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200/60 dark:border-teal-800'
                    : 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border-pink-200/60 dark:border-pink-800'
                }`}
              >
                {user.role}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle theme={theme} onChange={handleThemeChange} />
            <LanguageToggle lang={lang} onChange={handleLangChange} />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">{user?.fullName}</span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-950/40 transition font-medium border border-transparent hover:border-rose-100 dark:hover:border-rose-900"
            >
              <LogOut className="w-4 h-4" />
              {t.signOut}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto p-6 space-y-6">
        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-700 shadow-sm">
            {error}
          </div>
        )}

        {user?.role === 'ADMIN' ? (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white/95 p-6 border border-teal-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-200/60">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">{t.adminBannerTitle}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{t.adminBannerDesc}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Categories Manager */}
              <section className="rounded-3xl bg-white/95 p-6 border border-pink-100 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <LollipopIcon className="w-4 h-4" />
                  {t.manageSystemCategories} ({categories.length})
                </h3>
                <form onSubmit={handleCreateSystemCategory} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder={t.categoryNamePlaceholder}
                    className="flex-1 rounded-2xl border border-pink-200 bg-pink-50/20 px-3 py-2 text-xs focus:border-pink-400 focus:outline-none"
                  />
                  <select
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value as 'EXPENSE' | 'INCOME')}
                    className="rounded-2xl border border-pink-200 bg-pink-50/20 px-2 py-2 text-xs text-slate-700 focus:border-pink-400 focus:outline-none"
                  >
                    <option value="EXPENSE">EXPENSE</option>
                    <option value="INCOME">INCOME</option>
                  </select>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-2xl bg-pink-400 px-4 py-2 text-xs font-semibold text-white hover:bg-pink-500 disabled:opacity-50 shadow-sm shadow-pink-200"
                  >
                    {t.add}
                  </button>
                </form>
                <div className="divide-y divide-pink-50 max-h-64 overflow-y-auto">
                  {categories.map((cat) => (
                    <div key={cat.id} className="py-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{formatCategoryName(cat.name)}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          cat.type === 'INCOME'
                            ? 'bg-teal-50 text-teal-700 border border-teal-200/60'
                            : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                        }`}
                      >
                        {cat.type}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Starter Budget Templates Manager */}
              <section className="rounded-3xl bg-white/95 p-6 border border-pink-100 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <CandyIcon className="w-4 h-4" />
                  {t.manageBudgetTemplates} ({templates.length})
                </h3>
                <form onSubmit={handleCreateBudgetTemplate} className="space-y-2">
                  <input
                    type="text"
                    required
                    value={newTplName}
                    onChange={(e) => setNewTplName(e.target.value)}
                    placeholder={t.templateNamePlaceholder}
                    className="w-full rounded-2xl border border-pink-200 bg-pink-50/20 px-3 py-2 text-xs focus:border-pink-400 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTplDesc}
                      onChange={(e) => setNewTplDesc(e.target.value)}
                      placeholder={t.templateDescPlaceholder}
                      className="flex-1 rounded-2xl border border-pink-200 bg-pink-50/20 px-3 py-2 text-xs focus:border-pink-400 focus:outline-none"
                    />
                    <input
                      type="number"
                      min="100"
                      value={newTplBudget}
                      onChange={(e) => setNewTplBudget(e.target.value)}
                      placeholder={t.templateBudgetPlaceholder}
                      className="w-28 rounded-2xl border border-pink-200 bg-pink-50/20 px-3 py-2 text-xs focus:border-pink-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-2xl bg-teal-400 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-500 disabled:opacity-50 shadow-sm shadow-teal-200"
                    >
                      {t.create}
                    </button>
                  </div>
                </form>
                <div className="divide-y divide-pink-50 max-h-64 overflow-y-auto">
                  {templates.map((tpl) => (
                    <div key={tpl.id} className="py-2.5 text-xs">
                      <p className="font-semibold text-slate-800">{tpl.name}</p>
                      {tpl.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{tpl.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        ) : (
          <>
            {/* Top Summary Banner */}
            <section className="rounded-3xl bg-gradient-to-r from-pink-400 via-pink-400 to-rose-300 dark:from-slate-900 dark:via-purple-950/70 dark:to-slate-900 dark:border dark:border-purple-900/40 p-7 text-white shadow-lg shadow-pink-200/50 dark:shadow-slate-950/60 relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-300">
              <div className="pointer-events-none absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-white/15 blur-xl" />
              <div className="pointer-events-none absolute top-0 right-1/4 w-32 h-32 rounded-full bg-teal-100/20 blur-lg" />
              {/* Sparkles on Banner */}
              <div className="pointer-events-none absolute top-3.5 right-6 opacity-80 animate-pulse hidden sm:block">
                <SparkleIcon size={18} color="#fef08a" />
              </div>
              <div className="pointer-events-none absolute bottom-3 left-1/3 opacity-70 hidden sm:block">
                <SparkleIcon size={14} color="#ffffff" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/25 dark:bg-white/10 backdrop-blur-md text-[11px] font-medium text-white mb-1.5 border border-white/30 dark:border-white/15">
                  <LollipopIcon className="w-3.5 h-3.5" />
                  <span>{t.totalNetBalance}</span>
                </div>
                <p className="text-3xl sm:text-4xl font-bold mt-1 tracking-tight">
                  ฿{totalBalance.toLocaleString(lang === 'th' ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="relative z-10 flex items-center gap-2.5">
                <button
                  onClick={() => setShowCreateTx(true)}
                  disabled={wallets.length === 0}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/25 dark:bg-white/10 backdrop-blur-md px-4 py-2.5 text-sm font-semibold text-white border border-white/40 dark:border-white/20 hover:bg-white/35 dark:hover:bg-white/20 transition shadow-sm disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {t.recordTransaction}
                </button>
                <button
                  onClick={() => setShowCreateWallet(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-teal-500 px-4 py-2.5 text-sm font-semibold text-pink-500 dark:text-slate-950 shadow-md hover:bg-pink-50 dark:hover:bg-teal-400 transition"
                >
                  <Plus className="w-4 h-4" />
                  {t.createFolder}
                </button>
              </div>
            </section>

            {/* Daily Safe-to-Spend & Expense Breakdown (F-06) */}
            {budgetSummary && (
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-md p-6 border border-pink-100 dark:border-slate-800 shadow-sm shadow-pink-100/40 dark:shadow-slate-950/40 space-y-3 transition-colors">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-pink-100 dark:bg-pink-950/40 text-pink-500 dark:text-pink-400 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      {t.dailySafeToSpend}
                    </h2>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200/50 dark:border-teal-800/60">
                      {budgetSummary.remainingDaysInMonth} {t.daysLeft}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-pink-500 dark:text-pink-400">
                    ฿{budgetSummary.dailySafeToSpend.toLocaleString(lang === 'th' ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}
                    <span className="text-xs font-medium text-slate-400"> {t.perDay}</span>
                  </p>
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 min-w-0">
                        <input
                          type="number"
                          min="0"
                          value={budgetInput}
                          onChange={(e) => setBudgetInput(e.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-2xl border border-pink-200/80 dark:border-slate-700 bg-pink-50/20 dark:bg-slate-800 px-3.5 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-pink-400 dark:focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:focus:ring-teal-950 transition"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleUpdateBudget(Number(budgetInput))}
                        className="shrink-0 whitespace-nowrap rounded-2xl bg-gradient-to-r from-pink-400 to-rose-300 dark:from-pink-500 dark:to-teal-500 hover:from-pink-500 hover:to-rose-400 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-pink-200 dark:shadow-slate-950 active:scale-[0.98] transition disabled:opacity-50"
                      >
                        {t.setBudgetButton}
                      </button>
                    </div>

                    {templates.length > 0 && (
                      <div className="w-full">
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            const tpl = templates.find((t) => t.id === e.target.value);
                            if (!tpl) return;
                            try {
                              const parsed = JSON.parse(tpl.rulesJson);
                              const rec = Number(parsed.recommendedMonthlyBudget || 10000);
                              setBudgetInput(String(rec));
                              handleUpdateBudget(rec);
                            } catch {
                              handleUpdateBudget(10000);
                            }
                          }}
                          className="w-full rounded-2xl border border-pink-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:border-pink-400 dark:focus:border-teal-400 focus:outline-none shadow-sm cursor-pointer hover:border-pink-300 dark:hover:border-slate-600 transition"
                        >
                          <option value="">{t.useTemplateOption}</option>
                          {templates.map((tplItem) => (
                            <option key={tplItem.id} value={tplItem.id}>
                              {formatTemplateName(tplItem.name)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-md p-6 border border-pink-100 dark:border-slate-800 shadow-sm shadow-pink-100/40 dark:shadow-slate-950/40 space-y-3 transition-colors">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 flex items-center justify-center">
                        <TrendingDown className="w-4 h-4" />
                      </div>
                      {t.monthlyExpenseBreakdown}
                    </h2>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/60">
                      {t.spentSoFar} ฿{budgetSummary.spentThisMonth.toLocaleString(lang === 'th' ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {budgetSummary.categoryBreakdown.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">{t.noExpensesThisMonth}</p>
                  ) : (
                    <div className="space-y-2 max-h-28 overflow-y-auto">
                      {budgetSummary.categoryBreakdown.map((item) => (
                        <div key={item.categoryName} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCategoryName(item.categoryName)}</span>
                            <span className="text-slate-400 dark:text-slate-400">
                              ฿{item.amount.toLocaleString(lang === 'th' ? 'th-TH' : 'en-US')} ({item.percentage}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-pink-50 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-pink-400 to-rose-300 dark:from-pink-500 dark:to-teal-400 rounded-full"
                              style={{ width: `${Math.min(100, item.percentage)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Wallets Grid */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-pink-400" />
                  {t.yourFolders} ({wallets.length})
                </h2>
              </div>

              {wallets.length === 0 ? (
                <div className="rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-dashed border-pink-200 dark:border-slate-800 p-10 text-center text-slate-500 dark:text-slate-400 text-sm">
                  {t.noFoldersYet}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wallets.map((wallet) => (
                    <div
                      key={wallet.id}
                      className="rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-md p-5 border border-pink-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-pink-200 dark:hover:border-slate-700 hover:-translate-y-0.5 transition-all flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-800"
                            style={{ backgroundColor: wallet.color }}
                          >
                            {renderWalletIcon(wallet.icon)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">{wallet.name}</h3>
                            <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-pink-50 dark:bg-slate-800 text-pink-700 dark:text-pink-300 border border-pink-200/60 dark:border-slate-700 mt-0.5">
                              {wallet.walletType}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setArchiveTarget(wallet)}
                          title={t.archiveModalTitle}
                          className="text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="border-t border-pink-50 dark:border-slate-800 pt-3">
                        <p className="text-xs text-slate-400 font-medium">{t.folderBalance}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                          ฿{Number(wallet.balance).toLocaleString(lang === 'th' ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Transactions & Trash Section (F-03, F-04, F-05) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-pink-100/80 dark:border-slate-800 pb-3">
                <div className="inline-flex p-1 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-pink-100/80 dark:border-slate-800 shadow-sm gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ACTIVE')}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === 'ACTIVE'
                        ? 'bg-pink-400 dark:bg-pink-500 text-white shadow-sm shadow-pink-200 dark:shadow-none'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
                    }`}
                  >
                    <ReceiptText className="w-4 h-4" />
                    {t.recentTab} ({transactions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('TRASH')}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === 'TRASH'
                        ? 'bg-teal-400 dark:bg-teal-500 text-white shadow-sm shadow-teal-200 dark:shadow-none'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    {t.trashTab} ({trashItems.length})
                  </button>
                </div>
              </div>

              {activeTab === 'ACTIVE' ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-pink-300 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.searchPlaceholder}
                        className="w-full rounded-2xl border border-pink-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 pl-10 pr-4 py-2 text-sm focus:border-pink-400 dark:focus:border-pink-500 focus:outline-none focus:ring-4 focus:ring-pink-100/70 dark:focus:ring-pink-900/30 transition-all font-normal"
                      />
                    </div>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as 'ALL' | 'INCOME' | 'EXPENSE')}
                      className="rounded-2xl border border-pink-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-pink-400 dark:focus:border-pink-500 focus:outline-none font-normal"
                    >
                      <option value="ALL">{t.allTypes}</option>
                      <option value="INCOME">{t.incomeType}</option>
                      <option value="EXPENSE">{t.expenseType}</option>
                    </select>
                    <select
                      value={filterWalletId}
                      onChange={(e) => setFilterWalletId(e.target.value)}
                      className="rounded-2xl border border-teal-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-teal-400 dark:focus:border-teal-500 focus:outline-none font-normal"
                    >
                      <option value="">{t.allFolders}</option>
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {filteredTransactions.length === 0 ? (
                    <div className="rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-pink-100 dark:border-slate-800 p-8 text-center text-slate-500 dark:text-slate-400 text-sm shadow-sm font-normal">
                      {transactions.length === 0 ? t.emptyRecentEntries : t.noMatchingEntries}
                    </div>
                  ) : (
                    <div className="rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-pink-100/80 dark:border-slate-800 shadow-md shadow-pink-500/5 divide-y divide-pink-50/80 dark:divide-slate-800/80 overflow-hidden">
                      {filteredTransactions.slice(0, 15).map((tx) => (
                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-pink-50/30 dark:hover:bg-slate-800/40 transition">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
                                tx.type === 'INCOME'
                                  ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200/50 dark:border-teal-800/40'
                                  : 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-200/50 dark:border-pink-800/40'
                              }`}
                            >
                              {tx.type === 'INCOME' ? (
                                <ArrowDownLeft className="w-5 h-5" />
                              ) : (
                                <ArrowUpRight className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {tx.note || formatCategoryName(tx.category?.name) || (tx.type === 'INCOME' ? (lang === 'th' ? 'รายรับ' : 'Income') : (lang === 'th' ? 'รายจ่าย' : 'Expense'))}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                                {tx.wallet?.name} • {new Date(tx.transactionDate).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p
                                className={`text-sm font-bold ${
                                  tx.type === 'INCOME' ? 'text-teal-600 dark:text-teal-400' : 'text-pink-600 dark:text-pink-400'
                                }`}
                              >
                                {tx.type === 'INCOME' ? '+' : '-'}฿
                                {Number(tx.amount).toLocaleString(lang === 'th' ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}
                              </p>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t.successBadge}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {wallets.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => openMoveModal(tx)}
                                  title={t.moveModalTitle}
                                  className="p-2 rounded-xl text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition"
                                >
                                  <ArrowLeftRight className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setCancelTarget(tx)}
                                title={t.cancelModalTitle}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                trashItems.length === 0 ? (
                  <div className="rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-pink-100 dark:border-slate-800 p-8 text-center text-slate-500 dark:text-slate-400 text-sm shadow-sm font-normal">
                    {t.emptyTrash}
                  </div>
                ) : (
                  <div className="rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-pink-100/80 dark:border-slate-800 shadow-md shadow-pink-500/5 divide-y divide-pink-50/80 dark:divide-slate-800/80 overflow-hidden">
                    {trashItems.map((tx) => (
                      <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-pink-50/30 dark:hover:bg-slate-800/40 transition bg-slate-50/40 dark:bg-slate-950/40">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                            <Trash2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 line-through">
                              {tx.note || formatCategoryName(tx.category?.name) || (tx.type === 'INCOME' ? (lang === 'th' ? 'รายรับ' : 'Income') : (lang === 'th' ? 'รายจ่าย' : 'Expense'))}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                              {tx.wallet?.name} • {new Date(tx.transactionDate).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 line-through">
                              {tx.type === 'INCOME' ? '+' : '-'}฿
                              {Number(tx.amount).toLocaleString(lang === 'th' ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}
                            </p>
                            <span className="text-[10px] text-rose-500 font-semibold">{t.cancelledBadge}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setRestoreTarget(tx)}
                            title={t.restoreModalTitle}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition border border-teal-200 dark:border-teal-800 shadow-sm"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            {t.restoreButton}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-7 shadow-2xl shadow-pink-500/15 dark:shadow-none border border-pink-100 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{t.createTxModalTitle}</h3>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-pink-50/60 dark:bg-slate-800/80 rounded-2xl text-xs font-semibold border border-pink-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setTxType('EXPENSE')}
                  className={`py-2 rounded-xl transition ${
                    txType === 'EXPENSE'
                      ? 'bg-pink-400 dark:bg-pink-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {t.expenseType}
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('INCOME')}
                  className={`py-2 rounded-xl transition ${
                    txType === 'INCOME'
                      ? 'bg-teal-400 dark:bg-teal-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {t.incomeType}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">{t.folderLabel}</label>
                <select
                  value={txWalletId}
                  onChange={(e) => setTxWalletId(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-pink-200 dark:border-slate-700 bg-pink-50/20 dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:border-pink-400 dark:focus:border-pink-500 focus:outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (฿{w.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">{t.categoryLabel}</label>
                <select
                  value={txCategoryId}
                  onChange={(e) => setTxCategoryId(e.target.value)}
                  className="w-full rounded-2xl border border-pink-200 dark:border-slate-700 bg-pink-50/20 dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:border-pink-400 dark:focus:border-pink-500 focus:outline-none"
                >
                  <option value="">{t.uncategorized}</option>
                  {categories
                    .filter((c) => c.type === txType)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {formatCategoryName(c.name)}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">{t.amountLabel}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-2xl border border-pink-200 dark:border-slate-700 bg-pink-50/20 dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:border-pink-400 dark:focus:border-pink-500 focus:outline-none"
                />
              </div>

              {/* Overdraft Warning Banner (BR-01) */}
              {isOverdraft && (
                <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3 text-xs text-rose-700 dark:text-rose-300">
                  {t.overdraftWarning}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">{t.noteLabel}</label>
                <input
                  type="text"
                  value={txNote}
                  onChange={(e) => setTxNote(e.target.value)}
                  placeholder={t.notePlaceholder}
                  className="w-full rounded-2xl border border-pink-200 dark:border-slate-700 bg-pink-50/20 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 text-sm focus:border-pink-400 dark:focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTx(false)}
                  className="rounded-2xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !!isOverdraft}
                  className="rounded-2xl bg-pink-400 dark:bg-pink-500 px-4 py-2 text-xs font-semibold text-white hover:bg-pink-500 dark:hover:bg-pink-600 disabled:opacity-50 shadow-sm shadow-pink-200 dark:shadow-none"
                >
                  {submitting ? t.recordingButton : t.recordButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Wallet Modal (F-02) */}
      {showCreateWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-7 shadow-2xl shadow-pink-500/15 dark:shadow-none border border-pink-100 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{t.createWalletModalTitle}</h3>

            <form onSubmit={handleCreateWallet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">{t.walletNameLabel}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.walletNamePlaceholder}
                  className="w-full rounded-2xl border border-pink-200 dark:border-slate-700 bg-pink-50/20 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 text-sm focus:border-pink-400 dark:focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">{t.walletTypeLabel}</label>
                <select
                  value={walletType}
                  onChange={(e) => setWalletType(e.target.value as any)}
                  className="w-full rounded-2xl border border-pink-200 dark:border-slate-700 bg-pink-50/20 dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:border-pink-400 dark:focus:border-pink-500 focus:outline-none"
                >
                  <option value="CASH">CASH</option>
                  <option value="BANK">BANK</option>
                  <option value="EWALLET">EWALLET</option>
                  <option value="POCKET">POCKET</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">{t.initialBalanceLabel}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="w-full rounded-2xl border border-pink-200 dark:border-slate-700 bg-pink-50/20 dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:border-pink-400 dark:focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">{t.walletColorLabel}</label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        color === c ? 'border-pink-600 dark:border-pink-400 scale-110 shadow-sm' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">{t.walletIconLabel}</label>
                <div className="grid grid-cols-3 gap-2">
                  {iconPresets.map((ic) => (
                    <button
                      type="button"
                      key={ic.id}
                      onClick={() => setIcon(ic.id)}
                      className={`px-2 py-1.5 rounded-2xl border text-xs font-medium transition ${
                        icon === ic.id
                          ? 'border-pink-400 dark:border-pink-500 bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
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
                  className="rounded-2xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-pink-400 dark:bg-pink-500 px-4 py-2 text-xs font-semibold text-white hover:bg-pink-500 dark:hover:bg-pink-600 disabled:opacity-50 shadow-sm shadow-pink-200 dark:shadow-none"
                >
                  {submitting ? t.recordingButton : t.createFolderSubmit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Double-Check Move Transaction Modal (F-04 / BR-04) */}
      {moveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-7 shadow-2xl shadow-pink-500/15 dark:shadow-none border border-pink-100 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{t.moveModalTitle}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {t.moveModalDesc}{' '}
              <strong className="text-pink-600 dark:text-pink-400">
                ฿{Number(moveTarget.amount).toLocaleString(lang === 'th' ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}
              </strong>{' '}
              {t.fromFolder} <strong>{moveTarget.wallet?.name}</strong> {t.toFolder}
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">{t.targetFolderLabel}</label>
              <select
                value={moveTargetWalletId}
                onChange={(e) => setMoveTargetWalletId(e.target.value)}
                className="w-full rounded-2xl border border-pink-200 dark:border-slate-700 bg-pink-50/20 dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:border-pink-400 dark:focus:border-pink-500 focus:outline-none"
              >
                {wallets
                  .filter((w) => w.id !== moveTarget.walletId)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (฿{w.balance.toFixed(2)})
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
                <div className="rounded-2xl bg-pink-50 dark:bg-slate-800 border border-pink-100 dark:border-slate-700 p-3 text-xs text-pink-900 dark:text-slate-200 space-y-1">
                  <p>
                    <strong>{sourceW.name}:</strong> ฿{sourceW.balance.toFixed(2)} &rarr; ฿{sourceAfter.toFixed(2)}
                  </p>
                  <p>
                    <strong>{targetW.name}:</strong> ฿{targetW.balance.toFixed(2)} &rarr; ฿{targetAfter.toFixed(2)}
                  </p>
                </div>
              );
            })()}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMoveTarget(null)}
                className="rounded-2xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={submitting || !moveTargetWalletId}
                onClick={handleConfirmMove}
                className="rounded-2xl bg-teal-400 dark:bg-teal-500 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-500 dark:hover:bg-teal-600 disabled:opacity-50 shadow-sm shadow-teal-200 dark:shadow-none"
              >
                {submitting ? t.movingButton : t.confirmMoveButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Double-Check Cancel Transaction Modal (F-04 / BR-05) */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-7 shadow-2xl shadow-pink-500/15 dark:shadow-none border border-pink-100 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{t.cancelModalTitle}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {t.cancelModalDesc}{' '}
              <strong className="text-rose-600 dark:text-rose-400">
                ฿{Number(cancelTarget.amount).toLocaleString(lang === 'th' ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}
              </strong>{' '}
              {t.cancelModalSub}
            </p>
            {(() => {
              const sourceW = wallets.find((w) => w.id === cancelTarget.walletId);
              if (!sourceW) return null;
              const after =
                cancelTarget.type === 'EXPENSE'
                  ? sourceW.balance + cancelTarget.amount
                  : sourceW.balance - cancelTarget.amount;
              return (
                <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3 text-xs text-rose-800 dark:text-rose-300">
                  <strong>{sourceW.name}:</strong> ฿{sourceW.balance.toFixed(2)} &rarr; ฿{after.toFixed(2)}
                </div>
              );
            })()}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="rounded-2xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t.doNotCancel}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmCancel}
                className="rounded-2xl bg-rose-500 dark:bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 dark:hover:bg-rose-700 disabled:opacity-50 shadow-sm shadow-rose-200 dark:shadow-none"
              >
                {submitting ? t.cancellingButton : t.confirmCancelButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Double-Check Archive Modal (BR-06) */}
      {archiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-7 shadow-2xl shadow-pink-500/15 dark:shadow-none border border-pink-100 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{t.archiveModalTitle}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {t.archiveModalDesc} <strong>{archiveTarget.name}</strong>? {t.archiveModalSub}
            </p>
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3 text-xs text-amber-800 dark:text-amber-300">
              {t.currentBalanceLabel}{' '}
              <strong>
                ฿{Number(archiveTarget.balance).toLocaleString(lang === 'th' ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setArchiveTarget(null)}
                className="rounded-2xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmArchive}
                className="rounded-2xl bg-amber-500 dark:bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600 dark:hover:bg-amber-700 disabled:opacity-50 shadow-sm shadow-amber-200 dark:shadow-none"
              >
                {submitting ? t.archivingButton : t.confirmArchiveButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Double-Check Restore Modal (F-05 / BR-05 / TEST-10) */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-7 shadow-2xl shadow-pink-500/15 dark:shadow-none border border-pink-100 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{t.restoreModalTitle}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {t.restoreModalDesc}{' '}
              <strong className="text-teal-600 dark:text-teal-400">
                ฿{Number(restoreTarget.amount).toLocaleString(lang === 'th' ? 'th-TH' : 'en-US', { minimumFractionDigits: 2 })}
              </strong>{' '}
              {t.backToFolder} <strong>{restoreTarget.wallet?.name}</strong>?
            </p>
            {(() => {
              const sourceW = wallets.find((w) => w.id === restoreTarget.walletId);
              if (!sourceW) return null;
              const after =
                restoreTarget.type === 'EXPENSE'
                  ? sourceW.balance - restoreTarget.amount
                  : sourceW.balance + restoreTarget.amount;
              const isOverdraftState = restoreTarget.type === 'EXPENSE' && sourceW.balance < restoreTarget.amount;
              return (
                <div
                  className={`rounded-2xl p-3 text-xs space-y-1 ${
                    isOverdraftState
                      ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
                      : 'bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 text-teal-800 dark:text-teal-300'
                  }`}
                >
                  <p>
                    <strong>{sourceW.name}:</strong> ฿{sourceW.balance.toFixed(2)} &rarr; ฿{after.toFixed(2)}
                  </p>
                  {isOverdraftState && (
                    <p className="font-semibold text-rose-600 dark:text-rose-400">{t.restoreOverdraftWarning}</p>
                  )}
                </div>
              );
            })()}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestoreTarget(null)}
                className="rounded-2xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmRestore}
                className="rounded-2xl bg-teal-400 dark:bg-teal-500 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-500 dark:hover:bg-teal-600 disabled:opacity-50 shadow-sm shadow-teal-200 dark:shadow-none"
              >
                {submitting ? t.restoringButton : t.confirmRestoreButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
