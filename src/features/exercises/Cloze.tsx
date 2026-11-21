import { useState } from 'react';
import { XP } from '../../domain/progress';
import { BottomAction, Feedback, Instruction } from '../../components/ui';
import { useW } from '../../components/text';
import type { ExerciseProps, Of } from './types';

export function Cloze({ exercise, lang, onDone }: ExerciseProps<Of<'cloze'>>) {
  const w = useW();
  const keys = Object.keys(exercise.blanks);
  const [values, setValues] = useState<Record<string, string>>({});
  const [active, setActive] = useState(keys[0]);
  const [checked, setChecked] = useState(false);
  const allOk = keys.every((k) => values[k] === exercise.blanks[k].answer);

  function choose(opt: string) {
    const next = { ...values, [active]: opt };
    setValues(next);
    const nextEmpty = keys.find((k) => !next[k]);
    if (nextEmpty) setActive(nextEmpty);
  }

  return (
    <div>
      <Instruction>{exercise.instruction}</Instruction>
      <div className="space-y-3">
        {exercise.lines.map((line, i) => (
          <div key={i} className={`flex ${i % 2 ? 'justify-end' : ''}`}>
            <div className="card max-w-[90%] px-4 py-3">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-stone-400">{line.who}</p>
              <p className="text-lg leading-relaxed">
                {w(line, lang).split(/(\{\{\d+\}\})/).map((part, j) => {
                  const m = part.match(/\{\{(\d+)\}\}/);
                  if (!m) return <span key={j}>{part}</span>;
                  const k = m[1];
                  const v = values[k];
                  const state = checked ? (v === exercise.blanks[k].answer ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'border-rose-500 text-rose-700 dark:text-rose-300') : active === k ? 'border-accent bg-accent-soft' : 'border-stone-300';
                  return (
                    <button key={j} disabled={checked} onClick={() => setActive(k)} className={`mx-1 inline-block min-w-[4.5rem] rounded-lg border-b-4 px-2 font-bold ${state}`}>
                      {v ?? ' '}
                    </button>
                  );
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
      {!checked && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {exercise.blanks[active].options.map((o) => (
            <button key={o} className={`chip ${values[active] === o ? 'chip-on' : ''}`} onClick={() => choose(o)}>{o}</button>
          ))}
        </div>
      )}
      {!checked && <BottomAction disabled={keys.some((k) => !values[k])} onClick={() => setChecked(true)}>Vérifier</BottomAction>}
      {checked && (
        <Feedback tone={allOk ? 'good' : 'bad'} onContinue={() => onDone({ correct: allOk, xp: allOk ? XP.correct : 0 })}>
          {!allOk && <p>Réponses : {keys.map((k) => <b key={k} className="mr-2">{exercise.blanks[k].answer}</b>)}</p>}
          {!allOk && keys.map((k) => exercise.blanks[k].hint && values[k] !== exercise.blanks[k].answer && <p key={k}>💡 {exercise.blanks[k].hint}</p>)}
          {exercise.explanation && <p>{exercise.explanation}</p>}
        </Feedback>
      )}
    </div>
  );
}
