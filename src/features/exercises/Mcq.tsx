import { useMemo, useState } from 'react';
import { shuffle } from '../../domain/session';
import { XP } from '../../domain/progress';
import { Feedback, Instruction } from '../../components/ui';
import type { ExerciseProps, Of } from './types';

export function Mcq({ exercise, onDone }: ExerciseProps<Of<'mcq'>>) {
  const options = useMemo(() => shuffle(exercise.options), [exercise]);
  const [picked, setPicked] = useState<string | null>(null);
  const ok = picked === exercise.answer;
  return (
    <div>
      <Instruction>{exercise.instruction}</Instruction>
      <div className="grid gap-3">
        {options.map((o) => {
          const state = picked == null ? '' : o === exercise.answer ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950' : o === picked ? 'border-rose-500 bg-rose-50 animate-shake dark:bg-rose-950' : 'opacity-50';
          return (
            <button key={o} disabled={picked != null} onClick={() => setPicked(o)} className={`chip py-4 text-left text-lg ${state}`}>{o}</button>
          );
        })}
      </div>
      {picked != null && (
        <Feedback tone={ok ? 'good' : 'bad'} onContinue={() => onDone({ correct: ok, xp: ok ? XP.correct : 0 })}>
          {!ok && <p>Bonne réponse : <b>{exercise.answer}</b></p>}
          {exercise.explanation && <p>{exercise.explanation}</p>}
        </Feedback>
      )}
    </div>
  );
}
