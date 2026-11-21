import { useMemo, useState } from 'react';
import { vocabIndex } from '../../content';
import { shuffle } from '../../domain/session';
import { XP } from '../../domain/progress';
import { Feedback, Instruction } from '../../components/ui';
import { useW } from '../../components/text';
import type { ExerciseProps, Of } from './types';

export function MatchPairs({ exercise, lang, onDone }: ExerciseProps<Of<'matchPairs'>>) {
  const w = useW();
  const idx = useMemo(() => vocabIndex(lang), [lang]);
  const items = exercise.pairs.map((id) => idx.get(id)).filter((v) => !!v);
  const left = useMemo(() => shuffle(items), [exercise]); // eslint-disable-line react-hooks/exhaustive-deps
  const right = useMemo(() => shuffle(items), [exercise]); // eslint-disable-line react-hooks/exhaustive-deps
  const [sel, setSel] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [failed, setFailed] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);
  const finished = done.length === items.length;

  function pickRight(id: string) {
    if (!sel || done.includes(id)) return;
    if (sel === id) {
      setDone((d) => [...d, id]);
    } else {
      setFailed((f) => (f.includes(sel) ? f : [...f, sel]));
      setShake(id);
      setTimeout(() => setShake(null), 350);
    }
    setSel(null);
  }

  const cls = (id: string, side: 'l' | 'r') =>
    `chip min-h-[3.25rem] w-full text-[15px] leading-tight ${done.includes(id) ? 'opacity-30 border-emerald-400' : ''} ${side === 'l' && sel === id ? 'chip-on' : ''} ${side === 'r' && shake === id ? 'animate-shake border-rose-500' : ''}`;

  return (
    <div>
      <Instruction>{exercise.instruction}</Instruction>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-3">
          {left.map((v) => (
            <button key={v.id} disabled={done.includes(v.id)} className={cls(v.id, 'l')} onClick={() => setSel(v.id)}>{w(v, lang)}</button>
          ))}
        </div>
        <div className="grid gap-3">
          {right.map((v) => (
            <button key={v.id} disabled={done.includes(v.id)} className={cls(v.id, 'r')} onClick={() => pickRight(v.id)}>{v.fr}</button>
          ))}
        </div>
      </div>
      {finished && (
        <Feedback tone={failed.length === 0 ? 'good' : failed.length <= 1 ? 'ok' : 'bad'} title={failed.length === 0 ? 'Sans faute !' : `${failed.length} erreur${failed.length > 1 ? 's' : ''}`}
          onContinue={() => onDone({ correct: failed.length <= 1, score: 1 - failed.length / items.length, xp: XP.correct, vocabOk: items.map((v) => v.id).filter((id) => !failed.includes(id)), vocabFailed: failed })}>
          {failed.length > 0 && <p>À revoir : {failed.map((id) => w(idx.get(id)!, lang)).join(' · ')}</p>}
        </Feedback>
      )}
    </div>
  );
}
