import { useNavigate } from 'react-router-dom';
import { LANG_META } from '../../content';
import type { Lang } from '../../domain/types';
import { useApp } from '../../store/useApp';

export function LanguagePicker() {
  const setLang = useApp((s) => s.setLang);
  const langs = useApp((s) => s.langs);
  const nav = useNavigate();
  const pick = (l: Lang) => {
    setLang(l);
    nav(langs[l].history.some((h) => h.kind === 'placement') || Object.keys(langs[l].lessons).length ? '/' : '/bienvenue');
  };
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
      <h1 className="text-center text-4xl font-extrabold">Lsan</h1>
      <p className="mt-2 text-center text-stone-500">Quelle langue veux-tu pratiquer aujourd'hui ?</p>
      <div className="mt-8 grid gap-4">
        {(Object.keys(LANG_META) as Lang[]).map((l) => {
          const m = LANG_META[l];
          return (
            <button key={l} onClick={() => pick(l)} className={`theme-${m.color} card flex items-center gap-4 p-5 text-left ring-2 ring-transparent transition hover:ring-accent`}>
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent text-3xl text-white">{m.flag}</span>
              <span>
                <span className="block text-xl font-extrabold">{m.name}</span>
                <span className="block text-sm text-accent">{m.native}</span>
                <span className="mt-1 block text-sm text-stone-500">{m.tagline}</span>
                <span className="mt-1 block text-xs font-bold text-stone-400">⚡ {langs[l].xp} XP · niveau {langs[l].unlockedLevel}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-8 text-center text-xs text-stone-400">Tout reste sur cet appareil. Progressions séparées, bascule libre.</p>
    </div>
  );
}
