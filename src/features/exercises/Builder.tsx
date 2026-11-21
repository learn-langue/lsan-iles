import { useMemo, useState } from 'react';
import { shuffle } from '../../domain/session';
import { sameTiles } from '../../domain/grading';

interface Tile { key: string; text: string }

/** Zone de construction de phrase réutilisable (exercice et dialogue). */
export function useBuilder(answer: string[], distractors: string[], alternatives: string[][] = []) {
  const bank = useMemo<Tile[]>(
    () => shuffle([...answer.filter((t) => !/^[.,!?;:]$/.test(t)), ...distractors].map((text, i) => ({ key: `${i}-${text}`, text }))),
    [answer, distractors],
  );
  const [line, setLine] = useState<Tile[]>([]);
  const isCorrect = () => [answer, ...alternatives].some((a) => sameTiles(line.map((t) => t.text), a));
  const reset = () => setLine([]);
  return { bank, line, setLine, isCorrect, reset };
}

export function BuilderArea({ bank, line, setLine, locked }: { bank: Tile[]; line: Tile[]; setLine: (f: (l: Tile[]) => Tile[]) => void; locked?: boolean }) {
  const used = new Set(line.map((t) => t.key));
  return (
    <div>
      <div className="flex min-h-[7rem] flex-wrap content-start gap-2 border-b-2 border-dashed border-stone-300 pb-3 dark:border-stone-700">
        {line.map((t) => (
          <button key={t.key} disabled={locked} className="chip animate-pop" onClick={() => setLine((l) => l.filter((x) => x.key !== t.key))}>{t.text}</button>
        ))}
        {line.length === 0 && <span className="self-center text-stone-400">Touche les mots dans l'ordre…</span>}
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {bank.map((t) => (
          <button key={t.key} disabled={locked || used.has(t.key)} onClick={() => setLine((l) => [...l, t])}
            className={`chip ${used.has(t.key) ? 'border-transparent bg-stone-200 text-transparent shadow-none dark:bg-stone-800' : ''}`}>{t.text}</button>
        ))}
      </div>
    </div>
  );
}
