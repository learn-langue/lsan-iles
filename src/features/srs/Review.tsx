import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { shuffle } from '../../domain/session';
import { XP } from '../../domain/progress';
import type { SrsGrade } from '../../domain/srs';
import { useApp } from '../../store/useApp';
import { useLangStats } from '../../store/selectors';
import { Empty, ProgressBar } from '../../components/ui';
import { RegisterBadge, W, useW } from '../../components/text';

const GRADES: { g: SrsGrade; label: string; cls: string }[] = [
  { g: 'again', label: 'À revoir', cls: 'bg-rose-600 shadow-[0_4px_0_0_#be123c]' },
  { g: 'good', label: 'Moyen', cls: 'bg-amber-500 shadow-[0_4px_0_0_#b45309]' },
  { g: 'easy', label: 'Facile', cls: 'bg-emerald-600 shadow-[0_4px_0_0_#047857]' },
];

export function Review() {
  const lang = useApp((s) => s.activeLang)!;
  const { reviewItem, addXp } = useApp.getState();
  const st = useLangStats(lang);
  const [params] = useSearchParams();
  const mode = params.get('mode') ?? 'dues';
  const w = useW();
  const [reverse, setReverse] = useState(false);
  // La file est figée au démarrage de la session ; « À revoir » remet la carte en fin de file.
  const [queue, setQueue] = useState(() => {
    const base = mode === 'fragiles' ? st.fragile : mode === 'tout' ? st.known : st.due;
    return shuffle(base).slice(0, 20).map((v) => v.id);
  });
  const [flipped, setFlipped] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const card = queue[0] ? st.idx.get(queue[0]) : undefined;

  if (!card) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold">Révisions</h1>
        <Empty icon={doneCount ? '🎉' : '😌'} title={doneCount ? `${doneCount} carte(s) révisée(s) !` : 'Rien à réviser pour le moment'}>
          {st.known.length === 0 ? 'Termine une leçon pour remplir ton paquet de cartes.' : 'Reviens demain, ou entraîne-toi quand même :'}
        </Empty>
        {st.known.length > 0 && (
          <div className="grid gap-2">
            <Link to="/reviser?mode=tout" className="btn-ghost">Tout réviser ({st.known.length})</Link>
            {st.fragile.length > 0 && <Link to="/reviser?mode=fragiles" className="btn-ghost">Mots fragiles ({st.fragile.length})</Link>}
            <Link to="/sprint" className="btn-primary">Sprint 60 s ⏱️</Link>
          </div>
        )}
      </div>
    );
  }

  function grade(g: SrsGrade) {
    reviewItem(lang, card!.id, g);
    addXp(lang, XP.flashcard);
    setFlipped(false);
    setDoneCount((c) => c + 1);
    setQueue((q) => (g === 'again' ? [...q.slice(1), q[0]] : q.slice(1)));
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <ProgressBar value={doneCount / (doneCount + queue.length)} />
        <button className="chip shrink-0 px-2 py-1 text-xs" onClick={() => setReverse((r) => !r)}>{reverse ? 'FR → cible' : 'cible → FR'}</button>
      </div>
      <button onClick={() => setFlipped(true)} className="card flex min-h-[18rem] w-full flex-col items-center justify-center p-6 text-center">
        {!reverse ? <W w={card} lang={lang} className="text-3xl font-extrabold text-accent" arClass="text-2xl" /> : <p className="text-2xl font-extrabold">{card.fr}</p>}
        {flipped ? (
          <div className="mt-6 animate-pop border-t border-stone-200 pt-4 dark:border-stone-800">
            {reverse ? <p className="text-2xl font-extrabold text-accent">{w(card, lang)}</p> : <p className="text-xl font-semibold">{card.fr}</p>}
            <div className="mt-2"><RegisterBadge r={card.register} /></div>
            {card.mnemonic && <p className="mt-3 text-sm text-stone-500">💡 {card.mnemonic}</p>}
          </div>
        ) : <p className="mt-6 text-sm text-stone-400">Touche pour retourner</p>}
      </button>
      <div className="fixed inset-x-0 bottom-20 z-10 mx-auto max-w-xl px-4">
        {flipped ? (
          <div className="grid grid-cols-3 gap-2">
            {GRADES.map((g) => <button key={g.g} onClick={() => grade(g.g)} className={`btn text-white active:translate-y-[2px] ${g.cls}`}>{g.label}</button>)}
          </div>
        ) : <button className="btn-primary w-full" onClick={() => setFlipped(true)}>Voir la réponse</button>}
      </div>
    </div>
  );
}
