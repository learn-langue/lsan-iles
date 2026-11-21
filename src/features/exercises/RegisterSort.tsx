import { useMemo, useState } from 'react';
import { shuffle } from '../../domain/session';
import { XP } from '../../domain/progress';
import { Feedback, Instruction } from '../../components/ui';
import { useW } from '../../components/text';
import type { ExerciseProps, Of } from './types';

/** « À qui tu dis ça ? » : classer des phrases selon l'interlocuteur. */
export function RegisterSort({ exercise, lang, onDone }: ExerciseProps<Of<'registerSort'>>) {
  const w = useW();
  const items = useMemo(() => shuffle(exercise.items), [exercise]);
  const [i, setI] = useState(0);
  const [errors, setErrors] = useState(0);
  const [flash, setFlash] = useState<{ bin: string; ok: boolean } | null>(null);
  const done = i >= items.length;

  function drop(bin: string) {
    if (flash) return;
    const ok = items[i].bin === bin;
    if (!ok) setErrors((e) => e + 1);
    setFlash({ bin, ok });
    setTimeout(() => { setFlash(null); setI((x) => x + 1); }, ok ? 450 : 1100);
  }

  return (
    <div>
      <Instruction>{exercise.instruction}</Instruction>
      <div className="flex min-h-[8rem] items-center justify-center">
        {!done && (
          <div key={i} className={`card animate-pop px-5 py-4 text-center text-xl font-semibold ${flash ? (flash.ok ? 'ring-2 ring-emerald-500' : 'ring-2 ring-rose-500 animate-shake') : ''}`}>
            💬 {w(items[i], lang)}
            {flash && !flash.ok && <p className="mt-2 text-sm text-rose-600">Plutôt pour : {exercise.bins.find((b) => b.id === items[i].bin)?.label}</p>}
          </div>
        )}
      </div>
      <p className="my-3 text-center text-sm text-stone-400">{Math.min(i + 1, items.length)} / {items.length}</p>
      <div className="grid grid-cols-2 gap-3">
        {exercise.bins.map((b) => (
          <button key={b.id} disabled={done} onClick={() => drop(b.id)} className={`chip flex flex-col items-center gap-1 py-5 ${flash?.bin === b.id ? (flash.ok ? 'border-emerald-500' : 'border-rose-500') : ''}`}>
            <span className="text-4xl">{b.avatar}</span>
            <span className="text-sm">{b.label}</span>
          </button>
        ))}
      </div>
      {done && (
        <Feedback tone={errors === 0 ? 'good' : errors === 1 ? 'ok' : 'bad'} title={errors === 0 ? 'Tu as le bon feeling !' : `${errors} erreur${errors > 1 ? 's' : ''}`}
          onContinue={() => onDone({ correct: errors <= 1, score: 1 - errors / items.length, xp: XP.correct })}>
          {exercise.explanation && <p>{exercise.explanation}</p>}
        </Feedback>
      )}
    </div>
  );
}
