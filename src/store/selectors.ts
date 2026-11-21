import { useMemo } from 'react';
import { LESSONS, vocabIndex } from '../content';
import { dayKey } from '../domain/dates';
import { isDue, isFragile, strength } from '../domain/srs';
import type { Lang } from '../domain/types';
import { useApp } from './useApp';

/** Statistiques dérivées pour la langue active (maîtrise, cartes dues, mots fragiles…). */
export function useLangStats(lang: Lang) {
  const p = useApp((s) => s.langs[lang]);
  return useMemo(() => {
    const today = dayKey();
    const idx = vocabIndex(lang);
    const all = [...idx.values()];
    const level = p.unlockedLevel;
    const levelItems = all.filter((v) => v.level === Math.min(level, Math.max(...all.map((x) => x.level), 1)));
    const mastery = levelItems.length ? levelItems.reduce((a, v) => a + strength(p.srs[v.id]), 0) / levelItems.length : 0;
    const known = all.filter((v) => p.srs[v.id]);
    const due = known.filter((v) => isDue(p.srs[v.id], today));
    const fragile = known.filter((v) => isFragile(p.srs[v.id])).sort((a, b) => p.srs[b.id].lapses - p.srs[a.id].lapses);
    const lessons = LESSONS[lang];
    const nextLesson = lessons.find((l) => l.level <= level && !p.lessons[l.id]) ?? lessons.find((l) => l.level <= level);
    return { p, today, idx, all, known, due, fragile, mastery, lessons, nextLesson, xpToday: p.xpByDay[today] ?? 0 };
  }, [p, lang]);
}
