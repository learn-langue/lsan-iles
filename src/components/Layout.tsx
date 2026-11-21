import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LANG_META } from '../content';
import { visibleStreak } from '../domain/progress';
import { dayKey } from '../domain/dates';
import { useApp } from '../store/useApp';
import { ScriptGuide } from '../features/guide/ScriptGuide';

const NAV = [
  { to: '/', label: 'Accueil', icon: '🏠' },
  { to: '/parcours', label: 'Parcours', icon: '🗺️' },
  { to: '/reviser', label: 'Réviser', icon: '🃏' },
  { to: '/tests', label: 'Tests', icon: '🎯' },
  { to: '/tuteur', label: 'Tuteur', icon: '💬' },
];

export function Layout() {
  const lang = useApp((s) => s.activeLang)!;
  const p = useApp((s) => s.langs[lang]);
  const [guide, setGuide] = useState(false);
  const nav = useNavigate();
  const meta = LANG_META[lang];
  return (
    <div className="mx-auto min-h-screen max-w-xl">
      <header className="sticky top-0 z-20 flex items-center gap-2 bg-sand-50/95 px-4 py-3 backdrop-blur dark:bg-stone-950/95">
        <button onClick={() => nav('/langue')} className="chip flex items-center gap-2 py-1.5">
          <span className="text-lg">{meta.flag}</span><span className="text-sm">{meta.name}</span><span className="text-xs opacity-50">▾</span>
        </button>
        <div className="ml-auto flex items-center gap-3 text-sm font-extrabold">
          <span title="Série de jours">🔥 {visibleStreak(p.streak, dayKey())}</span>
          <span title="XP total" className="text-accent">⚡ {p.xp}</span>
          <button aria-label="Guide de lecture" onClick={() => setGuide(true)} className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent-dark dark:text-white">?</button>
          <NavLink to="/reglages" aria-label="Réglages" className="text-lg">⚙️</NavLink>
        </div>
      </header>
      <main className="px-4 pb-28 pt-2"><Outlet /></main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 pb-safe backdrop-blur dark:border-stone-800 dark:bg-stone-900/95">
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `flex flex-col items-center py-2 text-[11px] font-bold ${isActive ? 'text-accent' : 'text-stone-400'}`}>
              <span className="text-xl">{n.icon}</span>{n.label}
            </NavLink>
          ))}
        </div>
      </nav>
      {guide && <Sheet onClose={() => setGuide(false)}><ScriptGuide lang={lang} /></Sheet>}
    </div>
  );
}

export function Sheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40" onClick={onClose}>
      <div className="mx-auto max-h-[85vh] w-full max-w-xl animate-pop overflow-y-auto rounded-t-3xl bg-sand-50 p-5 pb-10 dark:bg-stone-950" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex justify-end"><button onClick={onClose} className="text-2xl text-stone-400" aria-label="Fermer">✕</button></div>
        {children}
      </div>
    </div>
  );
}
