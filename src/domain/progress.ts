import { addDays, diffDays } from './dates';

export interface Streak { current: number; best: number; lastDay: string | null }

export function bumpStreak(s: Streak, today: string): Streak {
  if (s.lastDay === today) return s;
  const current = s.lastDay && addDays(s.lastDay, 1) === today ? s.current + 1 : 1;
  return { current, best: Math.max(s.best, current), lastDay: today };
}

/** Série affichée : retombe à 0 si on a sauté plus d'une journée. */
export function visibleStreak(s: Streak, today: string): number {
  if (!s.lastDay) return 0;
  return diffDays(today, s.lastDay) <= 1 ? s.current : 0;
}

export function starsFor(accuracy: number): 1 | 2 | 3 {
  if (accuracy >= 0.95) return 3;
  if (accuracy >= 0.8) return 2;
  return 1;
}

export const XP = { correct: 10, okReply: 5, lessonBonus: 20, flashcard: 2, sprintPair: 3 } as const;
export const EXAM_PASS = 0.8;
