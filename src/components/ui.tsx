import type { ReactNode } from 'react';

export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`h-3 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800 ${className}`}>
      <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }} />
    </div>
  );
}

export function Ring({ value, size = 64, label }: { value: number; size?: number; label?: ReactNode }) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={7} className="fill-none stroke-stone-200 dark:stroke-stone-800" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={7} strokeLinecap="round" fill="none" stroke="var(--accent)"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, value))} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-extrabold">{label ?? `${Math.round(value * 100)}%`}</div>
    </div>
  );
}

export type FeedbackTone = 'good' | 'ok' | 'bad';
const TONES: Record<FeedbackTone, { box: string; title: string; btn: string }> = {
  good: { box: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100', title: 'Bravo !', btn: 'bg-emerald-600 shadow-[0_4px_0_0_#047857]' },
  ok: { box: 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100', title: 'Pas mal !', btn: 'bg-amber-500 shadow-[0_4px_0_0_#b45309]' },
  bad: { box: 'bg-rose-50 text-rose-900 dark:bg-rose-950 dark:text-rose-100', title: 'Pas tout à fait…', btn: 'bg-rose-600 shadow-[0_4px_0_0_#be123c]' },
};

/** Bandeau de correction en bas d'écran, avec bouton Continuer. */
export function Feedback({ tone, title, children, onContinue, label = 'Continuer' }: { tone: FeedbackTone; title?: string; children?: ReactNode; onContinue: () => void; label?: string }) {
  const t = TONES[tone];
  return (
    <div className={`fixed inset-x-0 bottom-0 z-30 animate-pop pb-safe ${t.box}`}>
      <div className="mx-auto max-w-xl px-4 pt-4">
        <p className="text-lg font-extrabold">{title ?? t.title}</p>
        {children && <div className="mt-1 space-y-1 text-[15px] leading-snug">{children}</div>}
        <button autoFocus className={`btn mt-3 mb-2 w-full text-white active:translate-y-[2px] ${t.btn}`} onClick={onContinue}>{label}</button>
      </div>
    </div>
  );
}

/** Bouton d'action fixé en bas (Vérifier…). */
export function BottomAction({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-sand-50/95 pb-safe backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
      <div className="mx-auto max-w-xl px-4 pt-3">
        <button className="btn-primary mb-2 w-full" disabled={disabled} onClick={onClick}>{children}</button>
      </div>
    </div>
  );
}

export function Instruction({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-extrabold leading-tight">{children}</h2>
      {sub && <p className="mt-1 text-stone-500 dark:text-stone-400">{sub}</p>}
    </div>
  );
}

export function Empty({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="card p-6 text-center">
      <div className="text-4xl">{icon}</div>
      <p className="mt-2 font-extrabold">{title}</p>
      {children && <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">{children}</div>}
    </div>
  );
}
