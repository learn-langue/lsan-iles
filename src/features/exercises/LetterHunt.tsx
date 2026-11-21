import { useState } from 'react';
import { XP } from '../../domain/progress';
import { Feedback, Instruction } from '../../components/ui';
import type { ExerciseProps, Of } from './types';

/** Lettre mystère (kabyle) / chiffre caché (darija). */
export function LetterHunt({ exercise, onDone }: ExerciseProps<Of<'letterHunt' | 'hiddenDigit'>>) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [errors, setErrors] = useState(0);
  const item = exercise.items[i];
  const done = i >= exercise.items.length;

  function pick(o: string) {
    if (picked) return;
    setPicked(o);
    if (o !== item.answer) setErrors((e) => e + 1);
    setTimeout(() => { setPicked(null); setI((x) => x + 1); }, o === item.answer ? 700 : 1400);
  }

  return (
    <div>
      <Instruction>{exercise.instruction}</Instruction>
      {!done && (
        <>
          <div key={i} className="card animate-pop py-8 text-center text-3xl font-extrabold tracking-wide">
            {picked ? (
              <span className={picked === item.answer ? 'text-emerald-600' : 'text-rose-600'}>{item.full}</span>
            ) : (
              item.masked.split('_').map((p, j, arr) => (
                <span key={j}>{p}{j < arr.length - 1 && <span className="mx-0.5 inline-block w-8 border-b-4 border-accent">&nbsp;</span>}</span>
              ))
            )}
          </div>
          <p className="my-3 text-center text-sm text-stone-400">{i + 1} / {exercise.items.length}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {exercise.options.map((o) => (
              <button key={o} onClick={() => pick(o)} className={`chip h-16 min-w-[4rem] text-2xl ${picked === o ? (o === item.answer ? 'border-emerald-500' : 'border-rose-500 animate-shake') : ''}`}>{o}</button>
            ))}
          </div>
        </>
      )}
      {done && (
        <Feedback tone={errors === 0 ? 'good' : errors === 1 ? 'ok' : 'bad'} title={errors === 0 ? 'Œil de lynx !' : `${errors} erreur${errors > 1 ? 's' : ''}`}
          onContinue={() => onDone({ correct: errors <= 1, score: 1 - errors / exercise.items.length, xp: XP.correct })}>
          <p>Le guide de lecture est accessible à tout moment avec le bouton « ? » en haut.</p>
        </Feedback>
      )}
    </div>
  );
}
