'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Language } from '@/lib/i18n';

export function CandyIcon({ className = 'w-6 h-6', size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', maxWidth: `${size}px`, maxHeight: `${size}px` }}
    >
      {/* Left twist */}
      <path
        d="M7.5 12L2.5 8.5C1.8 8.0 1.0 8.5 1.0 9.4V14.6C1.0 15.5 1.8 16.0 2.5 15.5L7.5 12Z"
        fill="#a7f3d0"
        stroke="#6ee7b7"
        strokeWidth="0.8"
      />
      {/* Right twist */}
      <path
        d="M16.5 12L21.5 8.5C22.2 8.0 23.0 8.5 23.0 9.4V14.6C23.0 15.5 22.2 16.0 21.5 15.5L16.5 12Z"
        fill="#a7f3d0"
        stroke="#6ee7b7"
        strokeWidth="0.8"
      />
      {/* Center candy body */}
      <ellipse cx="12" cy="12" rx="6.5" ry="5.5" fill="#fbcfe8" stroke="#f472b6" strokeWidth="1" />
      {/* Candy stripes */}
      <path
        d="M10 7.2C11.3 9.8 11.3 14.2 10 16.8"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14 7.2C15.3 9.8 15.3 14.2 14 16.8"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Glossy shine */}
      <ellipse cx="9.8" cy="9.5" rx="1.5" ry="0.8" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}

export function LollipopIcon({ className = 'w-5 h-5', size = 20 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', maxWidth: `${size}px`, maxHeight: `${size}px` }}
    >
      <circle cx="12" cy="9" r="6.5" fill="#fce7f3" stroke="#f472b6" strokeWidth="1" />
      <path
        d="M12 9C12 7.6 10.9 6.5 9.5 6.5"
        stroke="#6ee7b7"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 9C12 10.4 13.1 11.5 14.5 11.5"
        stroke="#f472b6"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line x1="12" y1="15.5" x2="12" y2="22.5" stroke="#f9a8d4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SparkleIcon({
  className = 'w-4 h-4',
  size = 16,
  color = '#fbbf24',
  spin = true,
  reverse = false,
  speedSeconds = 3.5,
}: {
  className?: string;
  size?: number;
  color?: string;
  spin?: boolean;
  reverse?: boolean;
  speedSeconds?: number;
}) {
  const animClass = spin
    ? reverse
      ? 'star-spin-reverse'
      : 'star-spin-normal'
    : '';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${animClass} ${className}`.trim()}
      style={{
        display: 'inline-block',
        maxWidth: `${size}px`,
        maxHeight: `${size}px`,
        transformOrigin: '50% 50%',
        ...(spin
          ? {
              animation: `${reverse ? 'starSpinCcw' : 'starSpinCw'} ${speedSeconds}s linear infinite`,
            }
          : {}),
      }}
    >
      <path
        d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z"
        fill={color}
      />
    </svg>
  );
}

export function CandyJarIcon({ className = 'w-12 h-12', size = 48 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', maxWidth: `${size}px`, maxHeight: `${size}px` }}
    >
      {/* Jar lid */}
      <rect x="16" y="6" width="16" height="4" rx="2" fill="#f472b6" />
      <path d="M14 10H34V13C34 14.1 33.1 15 32 15H16C14.9 15 14 14.1 14 13V10Z" fill="#fbcfe8" stroke="#f472b6" strokeWidth="1" />
      {/* Jar body */}
      <rect x="10" y="15" width="28" height="26" rx="8" fill="#ffffff" fillOpacity="0.85" stroke="#fbcfe8" strokeWidth="1.5" />
      {/* Candies inside */}
      <circle cx="18" cy="24" r="4" fill="#a7f3d0" stroke="#6ee7b7" strokeWidth="0.8" />
      <circle cx="28" cy="23" r="3.5" fill="#fbcfe8" stroke="#f472b6" strokeWidth="0.8" />
      <circle cx="23" cy="30" r="4.5" fill="#fef08a" stroke="#fde047" strokeWidth="0.8" />
      <circle cx="31" cy="32" r="3" fill="#fed7aa" stroke="#fb923c" strokeWidth="0.8" />
      <circle cx="16" cy="33" r="3.5" fill="#bae6fd" stroke="#38bdf8" strokeWidth="0.8" />
      {/* Glass highlights */}
      <path d="M14 19C14 17.5 15.5 17 18 17" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="23" x2="14" y2="34" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

export function BonbonIcon({ className = 'w-8 h-8', size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', maxWidth: `${size}px`, maxHeight: `${size}px` }}
    >
      <circle cx="16" cy="16" r="8" fill="#fce7f3" stroke="#f472b6" strokeWidth="1" />
      <path d="M11 13C13 16 16 19 21 19" stroke="#6ee7b7" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M13 10C15 13 18 16 20 14" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
      {/* Little wrapper wings */}
      <path d="M8 16L4 13V19L8 16Z" fill="#a7f3d0" stroke="#6ee7b7" strokeWidth="0.8" />
      <path d="M24 16L28 13V19L24 16Z" fill="#a7f3d0" stroke="#6ee7b7" strokeWidth="0.8" />
      <circle cx="14" cy="13" r="1.2" fill="#ffffff" />
    </svg>
  );
}

export type ThemeMode = 'light' | 'dark';

export function LanguageToggle({
  lang,
  onChange,
}: {
  lang: Language;
  onChange: (l: Language) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-2xl bg-pink-50/80 dark:bg-slate-800 p-0.5 border border-pink-200/70 dark:border-slate-700 shadow-sm transition-colors">
      <button
        type="button"
        onClick={() => onChange('en')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-xl transition-all ${
          lang === 'en'
            ? 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-sm font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-400'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onChange('th')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-xl transition-all ${
          lang === 'th'
            ? 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-sm font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-400'
        }`}
      >
        TH
      </button>
    </div>
  );
}

export function ThemeToggle({
  theme,
  onChange,
}: {
  theme: ThemeMode;
  onChange: (t: ThemeMode) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-2xl bg-pink-50/80 dark:bg-slate-800 p-0.5 border border-pink-200/70 dark:border-slate-700 shadow-sm transition-colors">
      <button
        type="button"
        title="Light Mode (Sweet Pastel)"
        onClick={() => onChange('light')}
        className={`px-2 py-1 text-xs font-semibold rounded-xl flex items-center gap-1 transition-all ${
          theme === 'light'
            ? 'bg-white text-pink-600 shadow-sm font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-pink-600 dark:hover:text-slate-200'
        }`}
      >
        <Sun className="w-3.5 h-3.5 text-amber-500" />
        <span className="hidden sm:inline">Light</span>
      </button>
      <button
        type="button"
        title="Dark Mode (Cool Midnight)"
        onClick={() => onChange('dark')}
        className={`px-2 py-1 text-xs font-semibold rounded-xl flex items-center gap-1 transition-all ${
          theme === 'dark'
            ? 'bg-slate-900 text-teal-400 shadow-sm font-bold border border-slate-700'
            : 'text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400'
        }`}
      >
        <Moon className="w-3.5 h-3.5 text-teal-400" />
        <span className="hidden sm:inline">Dark</span>
      </button>
    </div>
  );
}

export function GlitterGlint({
  className = '',
  size = 12,
  color = '#ffffff',
  duration = 3,
  delay = 0,
}: {
  className?: string;
  size?: number;
  color?: string;
  duration?: number;
  delay?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 pointer-events-none ${className}`}
      style={{
        display: 'inline-block',
        maxWidth: `${size}px`,
        maxHeight: `${size}px`,
        animation: `glitterTwinklePulse ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        transformOrigin: '50% 50%',
      }}
    >
      <path
        d="M12 0L13.5 9L21 12L13.5 15L12 24L10.5 15L3 12L10.5 9L12 0Z"
        fill={color}
      />
      <circle cx="12" cy="12" r="2.5" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}

export function GlitterOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Repeating fine glitter shimmer texture */}
      <div className="absolute inset-0 opacity-85 dark:opacity-0 glitter-bg-light transition-opacity duration-500" />
      <div className="absolute inset-0 opacity-0 dark:opacity-90 glitter-bg-dark transition-opacity duration-500" />

      {/* Floating micro diamond glints that twinkle like real glitter */}
      <div className="absolute top-[8%] left-[12%]">
        <GlitterGlint size={14} color="#fde047" duration={2.4} delay={0.2} />
      </div>
      <div className="absolute top-[18%] right-[18%]">
        <GlitterGlint size={16} color="#ffffff" duration={3.1} delay={0.8} />
      </div>
      <div className="absolute top-[28%] left-[25%] hidden sm:block">
        <GlitterGlint size={11} color="#f472b6" duration={2.8} delay={1.4} />
      </div>
      <div className="absolute top-[42%] right-[8%]">
        <GlitterGlint size={15} color="#34d399" duration={3.5} delay={0.5} />
      </div>
      <div className="absolute top-[55%] left-[8%] hidden sm:block">
        <GlitterGlint size={13} color="#ffffff" duration={2.6} delay={1.8} />
      </div>
      <div className="absolute top-[68%] right-[22%]">
        <GlitterGlint size={17} color="#fbbf24" duration={3.2} delay={1.1} />
      </div>
      <div className="absolute top-[82%] left-[16%]">
        <GlitterGlint size={12} color="#a78bfa" duration={2.9} delay={0.7} />
      </div>
      <div className="absolute top-[90%] right-[12%] hidden sm:block">
        <GlitterGlint size={15} color="#ffffff" duration={3.6} delay={1.5} />
      </div>
      <div className="absolute top-[35%] left-[45%] hidden md:block">
        <GlitterGlint size={10} color="#fef08a" duration={2.2} delay={0.3} />
      </div>
      <div className="absolute top-[75%] left-[60%] hidden md:block">
        <GlitterGlint size={12} color="#38bdf8" duration={3.0} delay={1.9} />
      </div>
    </div>
  );
}
