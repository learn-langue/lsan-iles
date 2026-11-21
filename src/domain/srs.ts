import { addDays } from './dates';

export type SrsGrade = 'again' | 'good' | 'easy';

export interface SrsCard {
  ease: number;
  interval: number; // en jours
  due: string; // YYYY-MM-DD
  reps: number;
  lapses: number;
  seen: number;
  correct: number;
}

export const MAX_INTERVAL = 180;
export const MASTERY_INTERVAL = 30;

export function newCard(today: string): SrsCard {
  return { ease: 2.5, interval: 0, due: today, reps: 0, lapses: 0, seen: 0, correct: 0 };
}

/**
 * SM-2 simplifié à trois boutons.
 * - again (« À revoir ») : retour le lendemain, facilité −0,2.
 * - good (« Moyen ») : 1 j au premier passage, puis ×1,2 (au moins +1 j).
 * - easy (« Facile ») : 3 j au premier passage, puis ×facilité, facilité +0,15.
 */
export function review(card: SrsCard, grade: SrsGrade, today: string): SrsCard {
  const c = { ...card, seen: card.seen + 1 };
  if (grade === 'again') {
    c.lapses += 1;
    c.reps = 0;
    c.ease = Math.max(1.3, +(c.ease - 0.2).toFixed(2));
    c.interval = 1;
  } else if (grade === 'good') {
    c.correct += 1;
    c.interval = c.reps === 0 ? 1 : Math.max(c.interval + 1, Math.round(c.interval * 1.2));
    c.reps += 1;
  } else {
    c.correct += 1;
    c.interval = c.reps === 0 ? 3 : Math.max(c.interval + 1, Math.round(c.interval * c.ease));
    c.ease = Math.min(3.2, +(c.ease + 0.15).toFixed(2));
    c.reps += 1;
  }
  c.interval = Math.min(MAX_INTERVAL, c.interval);
  c.due = addDays(today, c.interval);
  return c;
}

export function isDue(card: SrsCard, today: string): boolean {
  return card.due <= today;
}

export function strength(card?: SrsCard): number {
  if (!card || card.seen === 0) return 0;
  return Math.min(1, Math.max(0.05, card.interval / MASTERY_INTERVAL));
}

export function isFragile(card?: SrsCard): boolean {
  if (!card) return false;
  return card.lapses >= 2 || (card.seen >= 3 && card.correct / card.seen < 0.6);
}
