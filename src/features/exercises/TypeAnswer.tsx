import { useState } from 'react';
import { gradeAnswer, type GradeResult } from '../../domain/grading';
import { XP } from '../../domain/progress';
import { BottomAction, Feedback, Instruction } from '../../components/ui';
import type { ExerciseProps, Of } from './types';

const KAB_KEYS = ['ɣ', 'ɛ', 'č', 'ḍ', 'ṭ', 'ṣ', 'ẓ', 'ḥ', 'ǧ', 'ṛ'];

export function TypeAnswer({ exercise, lang, onDone }: ExerciseProps<Of<'typeAnswer'>>) {
  const [value, setValue] = useState('');
  const [res, setRes] = useState<GradeResult | null>(null);
  const ok = res && res.status !== 'wrong';
  return (
    <div>
      <Instruction>{exercise.instruction}</Instruction>
      <textarea autoFocus rows={3} value={value} disabled={!!res} onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && value.trim() && !res) { e.preventDefault(); setRes(gradeAnswer(lang, value, exercise.accept)); } }}
        autoCapitalize="off" autoCorrect="off" spellCheck={false}
        className="card w-full resize-none p-4 text-lg outline-none focus:ring-2 focus:ring-accent" placeholder={lang === 'darija' ? 'Écris en darija (les chiffres 3, 7, 9 sont acceptés)…' : 'Écris en kabyle…'} />
      {lang === 'kabyle' && !res && (
        <div className="mt-3 flex flex-wrap gap-2">
          {KAB_KEYS.map((k) => <button key={k} className="chip px-3 py-1 text-lg" onClick={() => setValue((v) => v + k)}>{k}</button>)}
        </div>
      )}
      {!res && <BottomAction disabled={!value.trim()} onClick={() => setRes(gradeAnswer(lang, value, exercise.accept))}>Vérifier</BottomAction>}
      {res && (
        <Feedback tone={res.status === 'exact' ? 'good' : ok ? 'ok' : 'bad'} title={res.status === 'exact' ? 'Parfait !' : ok ? 'Accepté !' : 'Pas tout à fait…'}
          onContinue={() => onDone({ correct: !!ok, xp: ok ? XP.correct : 0 })}>
          {res.hint && <p>{res.hint}</p>}
          {!ok && <p>Réponse attendue : <b>{res.expected}</b></p>}
          {exercise.explanation && <p>{exercise.explanation}</p>}
        </Feedback>
      )}
    </div>
  );
}
