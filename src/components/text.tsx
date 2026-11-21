import type { Lang, Written } from '../domain/types';
import { useApp, type Settings } from '../store/useApp';

/** Choisit la forme à afficher selon la langue et les réglages. */
export function wtext(w: Written, lang: Lang, s: Pick<Settings, 'darijaScript'>): string {
  if (lang === 'kabyle') return w.text ?? w.ascii ?? w.latin ?? w.chat ?? '';
  return (s.darijaScript === 'latin' ? w.latin ?? w.chat : w.chat ?? w.latin) ?? w.text ?? '';
}

export function useW() {
  const settings = useApp((s) => s.settings);
  return (w: Written, lang: Lang) => wtext(w, lang, settings);
}

/** Affiche un texte cible, avec l'arabe en dessous si demandé (darija). */
export function W({ w, lang, className = '', arClass = '' }: { w: Written; lang: Lang; className?: string; arClass?: string }) {
  const settings = useApp((s) => s.settings);
  const showAr = lang === 'darija' && settings.showArabic && w.ar;
  return (
    <span className="inline-flex flex-col">
      <span className={className}>{wtext(w, lang, settings)}</span>
      {showAr && <span dir="rtl" lang="ar" className={`text-[0.85em] opacity-70 ${arClass}`}>{w.ar}</span>}
    </span>
  );
}

const REG: Record<string, string> = {
  poli: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
  neutre: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
  familier: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  affectueux: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200',
};
export function RegisterBadge({ r }: { r: string }) {
  return <span className={`badge ${REG[r] ?? REG.neutre}`}>{r}</span>;
}
