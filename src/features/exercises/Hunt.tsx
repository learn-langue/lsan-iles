import { useState } from 'react';
import { XP } from '../../domain/progress';
import { Feedback, Instruction } from '../../components/ui';
import type { ExerciseProps, Of } from './types';

/** Détecteur de nuances (registre) et chasse aux erreurs de genre. */
export function Hunt({ exercise, onDone }: ExerciseProps<Of<'registerHunt' | 'genreHunt'>>) {
  const [picked, setPicked] = useState<number | null>(null);
  const ok = picked === exercise.intruderIndex;
  const icon = exercise.type === 'registerHunt' ? '🕵️' : '⚖️';
  return (
    <div>
      <Instruction sub={exercise.context}>{icon} {exercise.instruction}</Instruction>
      <div className="card flex flex-wrap items-center gap-x-1 gap-y-3 p-5 text-xl">
        {exercise.tokens.map((t, i) => {
          if (/^[.,!?;:]$/.test(t)) return <span key={i} className="-ml-1">{t}</span>;
          const state = picked == null ? 'hover:bg-accent-soft' : i === exercise.intruderIndex ? 'bg-emerald-100 ring-2 ring-emerald-500 dark:bg-emerald-900' : i === picked ? 'bg-rose-100 ring-2 ring-rose-500 animate-shake dark:bg-rose-900' : '';
          return (
            <button key={i} disabled={picked != null} onClick={() => setPicked(i)} className={`rounded-lg px-1.5 py-0.5 font-semibold underline decoration-stone-300 decoration-dotted underline-offset-4 ${state}`}>{t}</button>
          );
        })}
      </div>
      {picked != null && (
        <div className="mt-4 text-center text-lg">
          ✅ <s className="text-rose-500">{exercise.tokens[exercise.intruderIndex]}</s> → <b className="text-emerald-600">{exercise.fix}</b>
        </div>
      )}
      {picked != null && (
        <Feedback tone={ok ? 'good' : 'bad'} title={ok ? 'Bien repéré !' : "Ce n'était pas celui-là"} onContinue={() => onDone({ correct: ok, xp: ok ? XP.correct : 0 })}>
          <p>{exercise.explanation}</p>
        </Feedback>
      )}
    </div>
  );
}
