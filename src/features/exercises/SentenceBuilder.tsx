import { useState } from 'react';
import { XP } from '../../domain/progress';
import { BottomAction, Feedback, Instruction } from '../../components/ui';
import { BuilderArea, useBuilder } from './Builder';
import type { ExerciseProps, Of } from './types';

export function SentenceBuilder({ exercise, onDone }: ExerciseProps<Of<'sentenceBuilder'>>) {
  const b = useBuilder(exercise.answer, exercise.distractors, exercise.alternatives);
  const [checked, setChecked] = useState<boolean | null>(null);
  return (
    <div>
      <Instruction sub="Attention, des mots pièges se cachent dans la liste.">{exercise.instruction}</Instruction>
      <BuilderArea {...b} locked={checked != null} />
      {checked == null && <BottomAction disabled={b.line.length === 0} onClick={() => setChecked(b.isCorrect())}>Vérifier</BottomAction>}
      {checked != null && (
        <Feedback tone={checked ? 'good' : 'bad'} onContinue={() => onDone({ correct: checked, xp: checked ? XP.correct : 0 })}>
          {!checked && <p>Réponse : <b>{exercise.answer.join(' ').replace(/ ([.,!?])/g, '$1')}</b></p>}
          {exercise.explanation && <p>{exercise.explanation}</p>}
        </Feedback>
      )}
    </div>
  );
}
