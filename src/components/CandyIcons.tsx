'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Language } from '@/lib/i18n';

export function CandyIcon({ className = '', size }: { className?: string; size?: number }) {
  const iconSize = size ?? 24;
  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className || (!size ? 'w-6 h-6' : '')}
      style={{
        display: 'inline-block',
        ...(size ? { width: `${size}px`, height: `${size}px` } : {}),
        maxWidth: '100%',
        maxHeight: '100%',
      }}
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

export function LollipopIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', width: `${size}px`, height: `${size}px`, maxWidth: '100%', maxHeight: '100%' }}
    >
      {/* Lollipop Candy Head */}
      <circle cx="12" cy="9" r="6.8" fill="#fce7f3" stroke="#f472b6" strokeWidth="1.2" />
      {/* Candy Swirls */}
      <path
        d="M12 9C12 7.2 10.5 5.8 8.8 5.8"
        stroke="#6ee7b7"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 9C12 10.8 13.5 12.2 15.2 12.2"
        stroke="#f472b6"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M9.2 11.8C10.5 12.8 12.5 12.8 13.8 11.5"
        stroke="#a7f3d0"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Glossy shine */}
      <ellipse cx="9.8" cy="6.8" rx="1.6" ry="0.9" fill="#ffffff" opacity="0.9" />
      {/* Stick */}
      <line x1="12" y1="15.8" x2="12" y2="23" stroke="#f9a8d4" strokeWidth="2.2" strokeLinecap="round" />
      {/* Cute Little Bow on the Stick */}
      <path d="M12 16L9.5 14.5V17.5L12 16Z" fill="#a7f3d0" stroke="#6ee7b7" strokeWidth="0.6" />
      <path d="M12 16L14.5 14.5V17.5L12 16Z" fill="#a7f3d0" stroke="#6ee7b7" strokeWidth="0.6" />
      <circle cx="12" cy="16" r="1.1" fill="#f472b6" />
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

export function CandyJarIcon({ className = '', size = 48 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', width: `${size}px`, height: `${size}px`, maxWidth: '100%', maxHeight: '100%' }}
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

export function CrystalDiamondGlint({
  className = '',
  size = 20,
  color = '#ffffff',
  glowColor = 'rgba(244, 114, 182, 0.7)',
  duration = 3.6,
  delay = 0,
  alt = false,
}: {
  className?: string;
  size?: number;
  color?: string;
  glowColor?: string;
  duration?: number;
  delay?: number;
  alt?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 pointer-events-none ${className}`}
      style={{
        display: 'inline-block',
        maxWidth: `${size}px`,
        maxHeight: `${size}px`,
        animation: `${alt ? 'crystalStarburstAlt' : 'crystalStarburst'} ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        transformOrigin: '50% 50%',
      }}
    >
      {/* Soft halo glow */}
      <circle cx="16" cy="16" r="7" fill={glowColor} />
      {/* 4 Primary Crystal Spikes */}
      <path
        d="M16 1L17.8 13.8L31 16L17.8 18.2L16 31L14.2 18.2L1 16L14.2 13.8L16 1Z"
        fill={color}
      />
      {/* 4 Secondary Diagonal Facets */}
      <path
        d="M16 6.5L18.2 13.8L25.5 16L18.2 18.2L16 25.5L13.8 18.2L6.5 16L13.8 13.8L16 6.5Z"
        fill="#ffffff"
        opacity="0.9"
      />
      {/* Prismatic Diamond Core */}
      <circle cx="16" cy="16" r="2.8" fill="#ffffff" />
    </svg>
  );
}

export function GlitterOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Layer 1: Dreamy Liquid Pearl Aurora Mesh Clouds */}
      <div className="absolute -top-36 -left-36 w-[34rem] h-[34rem] rounded-full bg-gradient-to-tr from-pink-300/30 via-rose-200/25 to-amber-200/30 dark:from-pink-950/25 dark:via-purple-950/30 dark:to-teal-950/20 blur-3xl aurora-mesh-slow" />
      <div className="absolute -bottom-36 -right-36 w-[36rem] h-[36rem] rounded-full bg-gradient-to-bl from-purple-200/25 via-sky-200/20 to-teal-100/30 dark:from-indigo-950/35 dark:via-cyan-950/25 dark:to-slate-950 blur-3xl aurora-mesh-alt" />
      <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-gradient-to-l from-rose-200/25 via-amber-100/20 to-pink-100/20 dark:from-fuchsia-950/20 dark:via-purple-950/20 dark:to-transparent blur-3xl aurora-mesh-slow" />
      <div className="absolute bottom-1/4 -left-24 w-96 h-96 rounded-full bg-gradient-to-r from-teal-100/25 via-emerald-100/20 to-sky-100/20 dark:from-teal-950/25 dark:via-slate-900/30 dark:to-transparent blur-3xl aurora-mesh-alt" />

      {/* Layer 2: Floating Bokeh Orbs */}
      <div className="absolute top-[14%] left-[22%] w-10 h-10 rounded-full bg-pink-200/40 dark:bg-pink-500/20 blur-md bokeh-pulse" />
      <div className="absolute top-[48%] right-[16%] w-14 h-14 rounded-full bg-amber-200/35 dark:bg-amber-400/15 blur-lg bokeh-pulse" style={{ animationDelay: '1.5s' }} />
      <div className="absolute bottom-[22%] left-[12%] w-12 h-12 rounded-full bg-teal-200/35 dark:bg-teal-400/20 blur-md bokeh-pulse" style={{ animationDelay: '3s' }} />
      <div className="absolute top-[72%] right-[28%] w-8 h-8 rounded-full bg-purple-200/40 dark:bg-purple-500/20 blur-md bokeh-pulse" style={{ animationDelay: '2.2s' }} />

      {/* Layer 3: Fine Glitter Stardust Sheen */}
      <div className="absolute inset-0 opacity-70 dark:opacity-0 glitter-bg-light transition-opacity duration-700" />
      <div className="absolute inset-0 opacity-0 dark:opacity-85 glitter-bg-dark transition-opacity duration-700" />

      {/* Layer 4: Radiant Faceted Crystal Starbursts with Prismatic Flares */}
      {/* Top Left Area */}
      <div className="absolute top-[7%] left-[9%]">
        <CrystalDiamondGlint size={24} color="#ffffff" glowColor="rgba(253, 224, 71, 0.75)" duration={3.4} delay={0.2} />
      </div>
      <div className="absolute top-[15%] left-[26%] hidden sm:block">
        <CrystalDiamondGlint size={16} color="#ffffff" glowColor="rgba(244, 114, 182, 0.7)" duration={2.8} delay={1.2} alt />
      </div>

      {/* Top Right Area */}
      <div className="absolute top-[11%] right-[14%]">
        <CrystalDiamondGlint size={26} color="#ffffff" glowColor="rgba(110, 231, 183, 0.7)" duration={3.8} delay={0.7} />
      </div>
      <div className="absolute top-[22%] right-[24%] hidden sm:block">
        <CrystalDiamondGlint size={18} color="#ffffff" glowColor="rgba(251, 191, 36, 0.75)" duration={3.1} delay={1.9} alt />
      </div>

      {/* Middle Flanks */}
      <div className="absolute top-[38%] left-[5%]">
        <CrystalDiamondGlint size={22} color="#ffffff" glowColor="rgba(244, 114, 182, 0.8)" duration={3.2} delay={1.5} />
      </div>
      <div className="absolute top-[52%] left-[14%] hidden md:block">
        <CrystalDiamondGlint size={15} color="#ffffff" glowColor="rgba(167, 139, 250, 0.7)" duration={2.6} delay={0.4} alt />
      </div>
      <div className="absolute top-[44%] right-[6%]">
        <CrystalDiamondGlint size={24} color="#ffffff" glowColor="rgba(56, 189, 248, 0.75)" duration={3.6} delay={0.9} alt />
      </div>
      <div className="absolute top-[58%] right-[15%] hidden md:block">
        <CrystalDiamondGlint size={16} color="#ffffff" glowColor="rgba(253, 224, 71, 0.7)" duration={3.0} delay={2.1} />
      </div>

      {/* Bottom Area */}
      <div className="absolute bottom-[16%] left-[8%]">
        <CrystalDiamondGlint size={28} color="#ffffff" glowColor="rgba(244, 114, 182, 0.85)" duration={4.0} delay={0.5} />
      </div>
      <div className="absolute bottom-[28%] left-[22%] hidden sm:block">
        <CrystalDiamondGlint size={16} color="#ffffff" glowColor="rgba(52, 211, 153, 0.7)" duration={2.7} delay={1.7} alt />
      </div>
      <div className="absolute bottom-[12%] right-[10%]">
        <CrystalDiamondGlint size={26} color="#ffffff" glowColor="rgba(251, 191, 36, 0.8)" duration={3.5} delay={1.1} />
      </div>
      <div className="absolute bottom-[25%] right-[26%] hidden sm:block">
        <CrystalDiamondGlint size={18} color="#ffffff" glowColor="rgba(192, 132, 252, 0.75)" duration={3.3} delay={0.3} alt />
      </div>

      {/* Ambient Center Highlights */}
      <div className="absolute top-[30%] left-[50%] -translate-x-1/2 hidden lg:block">
        <CrystalDiamondGlint size={15} color="#ffffff" glowColor="rgba(253, 224, 71, 0.65)" duration={2.5} delay={1.8} />
      </div>
      <div className="absolute bottom-[35%] left-[48%] -translate-x-1/2 hidden lg:block">
        <CrystalDiamondGlint size={14} color="#ffffff" glowColor="rgba(244, 114, 182, 0.65)" duration={3.1} delay={0.6} alt />
      </div>
    </div>
  );
}
