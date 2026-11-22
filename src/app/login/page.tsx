'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { Language, translations } from '@/lib/i18n';
import {
  CandyIcon,
  LollipopIcon,
  SparkleIcon,
  CandyJarIcon,
  BonbonIcon,
  LanguageToggle,
  ThemeToggle,
  ThemeMode,
  GlitterOverlay,
} from '@/components/CandyIcons';

export default function LoginPage() {
  const router = useRouter();
  const isProd = process.env.NODE_ENV === 'production';
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [email, setEmail] = useState(isProd ? '' : 'user1@candycash.local');
  const [password, setPassword] = useState(isProd ? '' : 'password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillAccount = (accountEmail: string) => {
    if (isProd) return;
    setEmail(accountEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-pink-50/90 via-white to-pink-100/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Decorative Soft Pastel Candy Blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-pink-200/35 dark:bg-pink-900/15 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-teal-100/30 dark:bg-teal-900/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/4 -right-16 w-72 h-72 rounded-full bg-pink-100/40 dark:bg-purple-900/10 blur-2xl" />
      <div className="pointer-events-none absolute bottom-1/4 -left-16 w-72 h-72 rounded-full bg-emerald-100/25 dark:bg-emerald-900/10 blur-2xl" />

      {/* Top Controls Bar: Theme & Language Switchers */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <ThemeToggle theme={theme} onChange={handleThemeChange} />
        <LanguageToggle lang={lang} onChange={handleLangChange} />
      </div>

      {/* Shimmering Glitter Background Overlay */}
      <GlitterOverlay />

      {/* Twinkling & Rotating Stars / Sparkles & Candies scattered generously across background */}
      {/* Top Left Cluster */}
      <div className="pointer-events-none absolute top-8 left-10 flex items-center gap-2">
        <SparkleIcon size={26} color="#fde047" />
        <CandyIcon size={22} className="-rotate-12" />
        <SparkleIcon size={14} color="#f472b6" reverse />
      </div>
      <div className="pointer-events-none absolute top-20 left-28 hidden sm:flex items-center gap-1.5 opacity-80">
        <SparkleIcon size={14} color="#6ee7b7" />
        <BonbonIcon size={20} className="rotate-12" />
      </div>

      {/* Top Center-Left */}
      <div className="pointer-events-none absolute top-6 left-1/3 hidden md:flex items-center gap-2 opacity-75">
        <SparkleIcon size={16} color="#fde047" reverse />
        <SparkleIcon size={10} color="#a7f3d0" />
      </div>

      {/* Top Right Cluster */}
      <div className="pointer-events-none absolute top-10 right-36 hidden sm:flex items-center gap-2 opacity-85">
        <SparkleIcon size={22} color="#6ee7b7" />
        <LollipopIcon size={24} className="rotate-12" />
        <SparkleIcon size={14} color="#fde047" reverse />
      </div>
      <div className="pointer-events-none absolute top-24 right-16 hidden md:flex items-center gap-1.5 opacity-80">
        <CandyIcon size={20} className="rotate-45" />
        <SparkleIcon size={15} color="#fbcfe8" />
      </div>

      {/* Mid Left Area */}
      <div className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 hidden xl:flex flex-col items-center gap-3 opacity-85">
        <SparkleIcon size={22} color="#fde047" />
        <BonbonIcon size={32} className="-rotate-12" />
        <SparkleIcon size={14} color="#a7f3d0" reverse />
        <CandyIcon size={26} className="rotate-45" />
        <SparkleIcon size={18} color="#f472b6" />
      </div>

      {/* Mid Right Area */}
      <div className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 hidden xl:flex flex-col items-center gap-3 opacity-85">
        <SparkleIcon size={18} color="#f472b6" reverse />
        <LollipopIcon size={32} className="-rotate-12" />
        <SparkleIcon size={24} color="#6ee7b7" />
        <BonbonIcon size={24} className="rotate-12" />
        <SparkleIcon size={15} color="#fde047" reverse />
      </div>

      {/* Bottom Left Cluster */}
      <div className="pointer-events-none absolute bottom-8 left-10 flex items-center gap-2 opacity-85">
        <SparkleIcon size={24} color="#f472b6" reverse />
        <CandyIcon size={24} className="rotate-12" />
        <SparkleIcon size={16} color="#fde047" />
        <SparkleIcon size={12} color="#6ee7b7" reverse />
      </div>
      <div className="pointer-events-none absolute bottom-24 left-24 hidden sm:flex items-center gap-1.5 opacity-75">
        <BonbonIcon size={20} className="-rotate-12" />
        <SparkleIcon size={14} color="#c084fc" />
      </div>

      {/* Bottom Center */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-3 opacity-75">
        <SparkleIcon size={14} color="#fde047" />
        <CandyIcon size={18} className="rotate-12" />
        <SparkleIcon size={16} color="#6ee7b7" reverse />
      </div>

      {/* Bottom Right Cluster */}
      <div className="pointer-events-none absolute bottom-10 right-16 flex items-center gap-2 opacity-85">
        <SparkleIcon size={26} color="#6ee7b7" />
        <LollipopIcon size={24} className="-rotate-12" />
        <SparkleIcon size={18} color="#fbcfe8" reverse />
        <SparkleIcon size={14} color="#fde047" />
      </div>
      <div className="pointer-events-none absolute bottom-24 right-32 hidden sm:flex items-center gap-1.5 opacity-75">
        <CandyIcon size={22} className="-rotate-45" />
        <SparkleIcon size={14} color="#f472b6" reverse />
      </div>

      {/* Three Column Container for Desktop, neatly centered */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-center gap-8 lg:gap-14">
        {/* Left Cute Floating Candy Cluster (No white card container) */}
        <div className="hidden lg:flex flex-col items-center justify-center w-64 shrink-0 space-y-5 select-none pointer-events-none">
          {/* Main Candy Jar Illustration Floating */}
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-pink-200/40 via-white/80 to-teal-100/40 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 flex items-center justify-center shadow-lg shadow-pink-100/40 dark:shadow-slate-950 border border-pink-200/60 dark:border-slate-700 backdrop-blur-sm">
              <CandyJarIcon size={48} />
            </div>
            {/* Sparkles around Jar */}
            <div className="absolute -top-3 -right-2 animate-pulse">
              <SparkleIcon size={22} color="#fde047" />
            </div>
            <div className="absolute -bottom-2 -left-2">
              <SparkleIcon size={18} color="#6ee7b7" />
            </div>
          </div>

          {/* Minimal Floating Feature Badges */}
          <div className="flex flex-col items-center gap-2.5 w-full">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-pink-200/60 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm shadow-pink-100/50 dark:shadow-slate-950/40 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-pink-400 shrink-0" />
              <span>{t.featSafeToSpend}</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-teal-200/60 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm shadow-teal-100/50 dark:shadow-slate-950/40 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
              <span>{t.featZeroOverdraft}</span>
            </div>
          </div>

          {/* Floating Bonbon */}
          <div className="flex items-center gap-1.5 opacity-80 pt-1">
            <BonbonIcon size={28} />
            <SparkleIcon size={14} color="#f472b6" />
          </div>
        </div>

        {/* Center Main Login Card */}
        <div className="relative z-10 w-full max-w-md shrink-0 rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl p-8 sm:p-9 shadow-2xl shadow-pink-200/50 dark:shadow-slate-950/80 border border-pink-100/80 dark:border-slate-800 transition-colors duration-300">
          {/* Subtle sparkles on login card header */}
          <div className="absolute top-4 right-5 opacity-70">
            <SparkleIcon size={16} color="#fde047" />
          </div>
          <div className="absolute top-4 left-5 opacity-70">
            <SparkleIcon size={14} color="#6ee7b7" />
          </div>

          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-[72px] h-[72px] rounded-2xl bg-gradient-to-tr from-pink-200 via-pink-100 to-teal-100 dark:from-slate-800 dark:via-pink-950/40 dark:to-slate-800 flex items-center justify-center shadow-md shadow-pink-100 dark:shadow-slate-950 mb-3 ring-4 ring-pink-50 dark:ring-slate-800 border border-pink-200/70 dark:border-slate-700">
              <CandyIcon size={46} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 dark:bg-slate-800 border border-pink-200/60 dark:border-slate-700 text-[11px] font-medium text-pink-600 dark:text-pink-400 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              {t.sweetBadge} • Release 2
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {t.loginTitle} <span className="text-pink-500 font-extrabold">{t.brandName}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-normal">{t.loginSubtitle}</p>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                {t.emailLabel}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-pink-300 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full rounded-2xl border border-pink-200/70 dark:border-slate-700 bg-pink-50/20 dark:bg-slate-800/60 pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-pink-400 dark:focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-pink-100/70 dark:focus:ring-teal-950 transition-all font-normal"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-pink-300 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full rounded-2xl border border-pink-200/70 dark:border-slate-700 bg-pink-50/20 dark:bg-slate-800/60 pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-pink-400 dark:focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-pink-100/70 dark:focus:ring-teal-950 transition-all font-normal"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-400 via-pink-400 to-rose-300 dark:from-pink-500 dark:to-teal-500 py-3 text-sm font-semibold text-white shadow-md shadow-pink-200 dark:shadow-slate-950 hover:from-pink-500 hover:to-rose-400 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {loading ? t.signingIn : t.signInButton}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick-fill Account Selector (Development Only — hidden in production) */}
          {!isProd && (
          <div className="mt-6 pt-5 border-t border-pink-50 dark:border-slate-800 space-y-2">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 text-center flex items-center justify-center gap-1">
              <LollipopIcon className="w-3.5 h-3.5" size={14} />
              {t.quickFillTitle}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillAccount('user1@candycash.local')}
                className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1 ${
                  email === 'user1@candycash.local'
                    ? 'border-pink-300 bg-pink-50/90 dark:bg-pink-950/30 dark:border-pink-800 ring-2 ring-pink-100 dark:ring-pink-900/50'
                    : 'border-pink-100 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-pink-50/40 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-pink-600 dark:text-pink-400">
                  <UserCheck className="w-3.5 h-3.5 text-pink-400" />
                  <span>USER Role</span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">user1@candycash.local</p>
              </button>

              <button
                type="button"
                onClick={() => fillAccount('admin@candycash.local')}
                className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1 ${
                  email === 'admin@candycash.local'
                    ? 'border-teal-200 bg-teal-50/70 dark:bg-teal-950/30 dark:border-teal-800 ring-2 ring-teal-100 dark:ring-teal-900/50'
                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-teal-50/30 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>ADMIN Role</span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">admin@candycash.local</p>
              </button>
            </div>
          </div>
          )}
        </div>

        {/* Right Cute Floating Candy Cluster (No white card container) */}
        <div className="hidden lg:flex flex-col items-center justify-center w-64 shrink-0 space-y-5 select-none pointer-events-none">
          {/* Main Lollipop Illustration Floating */}
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-teal-100/40 via-white/80 to-pink-200/40 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 flex items-center justify-center shadow-lg shadow-teal-100/40 dark:shadow-slate-950 border border-teal-200/60 dark:border-slate-700 backdrop-blur-sm">
              <LollipopIcon size={48} />
            </div>
            {/* Sparkles around Lollipop */}
            <div className="absolute -top-3 -left-2 animate-pulse">
              <SparkleIcon size={22} color="#f472b6" />
            </div>
            <div className="absolute -bottom-2 -right-2">
              <SparkleIcon size={18} color="#fde047" />
            </div>
          </div>

          {/* Minimal Floating Feature Badges */}
          <div className="flex flex-col items-center gap-2.5 w-full">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-purple-200/60 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm shadow-purple-100/50 dark:shadow-slate-950/40 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
              <span>{t.featDoubleCheck}</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-amber-200/60 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm shadow-amber-100/50 dark:shadow-slate-950/40 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span>{t.featFolders}</span>
            </div>
          </div>

          {/* Floating Candy */}
          <div className="flex items-center gap-1.5 opacity-80 pt-1">
            <SparkleIcon size={14} color="#6ee7b7" />
            <CandyIcon size={30} />
          </div>
        </div>
      </div>
    </div>
  );
}
