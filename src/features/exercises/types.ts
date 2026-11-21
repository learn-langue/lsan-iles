import type { Exercise, Lang, Lesson } from '../../domain/types';

export interface ExerciseResult {
  correct: boolean;
  /** 0..1 pour les exercices à plusieurs items */
  score?: number;
  xp: number;
  vocabOk?: string[];
  vocabFailed?: string[];
}

export interface ExerciseProps<E extends Exercise = Exercise> {
  exercise: E;
  lang: Lang;
  lesson?: Lesson;
  onDone: (r: ExerciseResult) => void;
}

export type Of<T extends Exercise['type']> = Extract<Exercise, { type: T }>;
