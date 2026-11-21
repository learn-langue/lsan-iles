import type { Lang, Lesson, LevelMeta, VocabItem } from '../domain/types';

const files = import.meta.glob<Lesson>('./*/n*/*.json', { eager: true, import: 'default' });

export const LESSONS: Record<Lang, Lesson[]> = { darija: [], kabyle: [] };
for (const lesson of Object.values(files)) LESSONS[lesson.language].push(lesson);
for (const l of Object.values(LESSONS)) l.sort((a, b) => a.level - b.level || a.order - b.order);

export const LEVELS: LevelMeta[] = [
  { level: 1, title: 'Bases & salutations', subtitle: 'Saluer, se présenter, remercier' },
  { level: 2, title: 'Famille & quotidien', subtitle: 'La maison, les proches, le marché' },
  { level: 3, title: 'Discussions & expressions', subtitle: 'Raconter, donner son avis, plaisanter' },
  { level: 4, title: 'Aisance & nuances culturelles', subtitle: 'Proverbes, fêtes, registres fins' },
];

export const LANG_META: Record<Lang, { name: string; native: string; flag: string; color: 'dz' | 'kab'; tagline: string }> = {
  darija: { name: 'Darija algérienne', native: 'الدارجة · Derja', flag: '🇩🇿', color: 'dz', tagline: 'Wesh, kirak ? L’arabe du quotidien en Algérie' },
  kabyle: { name: 'Kabyle', native: 'Taqbaylit · ⵜⴰⵇⴱⴰⵢⵍⵉⵜ', flag: 'ⵣ', color: 'kab', tagline: 'Azul ! La langue de la Kabylie' },
};

/** Index de tout le vocabulaire d'une langue, par id. */
export function vocabIndex(lang: Lang): Map<string, VocabItem & { lessonId: string; level: number }> {
  const map = new Map<string, VocabItem & { lessonId: string; level: number }>();
  for (const lesson of LESSONS[lang]) for (const v of lesson.vocabulary) map.set(v.id, { ...v, lessonId: lesson.id, level: lesson.level });
  return map;
}

export function lessonById(id: string): Lesson | undefined {
  return [...LESSONS.darija, ...LESSONS.kabyle].find((l) => l.id === id);
}
