import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Lang } from '../domain/types';
import { dayKey } from '../domain/dates';
import { newCard, review, type SrsCard, type SrsGrade } from '../domain/srs';
import { bumpStreak, type Streak } from '../domain/progress';

export type TestKind = 'placement' | 'exam' | 'checkup';
export interface TestRecord {
  kind: TestKind;
  level?: number;
  date: string; // ISO
  score: number; // 0..1
  breakdown: { vocab: number; build: number; context: number };
  passed?: boolean;
}

export interface LessonRecord { stars: 0 | 1 | 2 | 3; best: number; attempts: number; doneAt?: string }

export interface LangProgress {
  placedLevel: number | null;
  unlockedLevel: number;
  lessons: Record<string, LessonRecord>;
  srs: Record<string, SrsCard>;
  xp: number;
  xpByDay: Record<string, number>;
  streak: Streak;
  history: TestRecord[];
  sprintBest: number;
}

export interface ChatMessage { role: 'user' | 'bot'; text: string; data?: unknown; at: string }

export interface Settings {
  darijaScript: 'chat' | 'latin';
  showArabic: boolean;
  dailyGoalXp: number;
  /** Pour accorder correctement (rani mli7 / mli7a, -k / -m). */
  learnerGender: 'f' | 'm' | 'x';
  ai: { provider: 'gemini' | 'openai'; model: string; apiKey: string };
}

export interface AppState {
  version: 1;
  activeLang: Lang | null;
  settings: Settings;
  langs: Record<Lang, LangProgress>;
}

interface Actions {
  setLang: (lang: Lang) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  updateAi: (patch: Partial<Settings['ai']>) => void;
  addXp: (lang: Lang, xp: number) => void;
  reviewItem: (lang: Lang, id: string, grade: SrsGrade) => void;
  introduceItems: (lang: Lang, ids: string[]) => void;
  completeLesson: (lang: Lang, lessonId: string, accuracy: number, stars: 1 | 2 | 3) => void;
  recordTest: (lang: Lang, rec: TestRecord) => void;
  setSprintBest: (lang: Lang, score: number) => void;
  importState: (data: unknown) => void;
  resetLang: (lang: Lang) => void;
}

export function emptyProgress(): LangProgress {
  return { placedLevel: null, unlockedLevel: 1, lessons: {}, srs: {}, xp: 0, xpByDay: {}, streak: { current: 0, best: 0, lastDay: null }, history: [], sprintBest: 0 };
}

export const DEFAULT_MODELS = { gemini: 'gemini-2.5-flash', openai: 'gpt-4.1-mini' } as const;

const initial: AppState = {
  version: 1,
  activeLang: null,
  settings: { darijaScript: 'chat', showArabic: false, dailyGoalXp: 50, learnerGender: 'x', ai: { provider: 'gemini', model: DEFAULT_MODELS.gemini, apiKey: '' } },
  langs: { darija: emptyProgress(), kabyle: emptyProgress() },
};

/** Vérifie grossièrement un fichier de sauvegarde importé et le fusionne avec les valeurs par défaut. */
export function sanitizeImport(data: unknown): AppState {
  const d = data as Partial<AppState> | null;
  if (!d || typeof d !== 'object' || d.version !== 1 || !d.langs) throw new Error('Fichier de sauvegarde non reconnu.');
  return {
    version: 1,
    activeLang: d.activeLang === 'kabyle' || d.activeLang === 'darija' ? d.activeLang : null,
    settings: { ...initial.settings, ...d.settings, ai: { ...initial.settings.ai, ...d.settings?.ai } },
    langs: {
      darija: { ...emptyProgress(), ...d.langs.darija },
      kabyle: { ...emptyProgress(), ...d.langs.kabyle },
    },
  };
}

export const useApp = create<AppState & Actions>()(
  persist(
    (set) => {
      const patchLang = (lang: Lang, fn: (p: LangProgress) => LangProgress) =>
        set((s) => ({ langs: { ...s.langs, [lang]: fn(s.langs[lang]) } }));
      const touch = (p: LangProgress, xp = 0): LangProgress => {
        const today = dayKey();
        return { ...p, xp: p.xp + xp, xpByDay: { ...p.xpByDay, [today]: (p.xpByDay[today] ?? 0) + xp }, streak: bumpStreak(p.streak, today) };
      };
      return {
        ...initial,
        setLang: (lang) => set({ activeLang: lang }),
        updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
        updateAi: (patch) => set((s) => ({ settings: { ...s.settings, ai: { ...s.settings.ai, ...patch } } })),
        addXp: (lang, xp) => patchLang(lang, (p) => touch(p, xp)),
        reviewItem: (lang, id, grade) =>
          patchLang(lang, (p) => {
            const today = dayKey();
            return { ...p, srs: { ...p.srs, [id]: review(p.srs[id] ?? newCard(today), grade, today) } };
          }),
        introduceItems: (lang, ids) =>
          patchLang(lang, (p) => {
            const today = dayKey();
            const srs = { ...p.srs };
            for (const id of ids) if (!srs[id]) srs[id] = review(newCard(today), 'good', today);
            return { ...p, srs };
          }),
        completeLesson: (lang, lessonId, accuracy, stars) =>
          patchLang(lang, (p) => {
            const prev = p.lessons[lessonId];
            const rec: LessonRecord = {
              stars: Math.max(prev?.stars ?? 0, stars) as LessonRecord['stars'],
              best: Math.max(prev?.best ?? 0, accuracy),
              attempts: (prev?.attempts ?? 0) + 1,
              doneAt: new Date().toISOString(),
            };
            return touch({ ...p, lessons: { ...p.lessons, [lessonId]: rec } });
          }),
        recordTest: (lang, rec) =>
          patchLang(lang, (p) => {
            let { unlockedLevel, placedLevel } = p;
            if (rec.kind === 'placement' && rec.level) {
              placedLevel = rec.level;
              unlockedLevel = Math.max(unlockedLevel, rec.level);
            }
            if (rec.kind === 'exam' && rec.passed && rec.level) unlockedLevel = Math.max(unlockedLevel, rec.level + 1);
            return touch({ ...p, placedLevel, unlockedLevel, history: [...p.history, rec] });
          }),
        setSprintBest: (lang, score) => patchLang(lang, (p) => ({ ...p, sprintBest: Math.max(p.sprintBest, score) })),
        importState: (data) => set(sanitizeImport(data)),
        resetLang: (lang) => patchLang(lang, () => emptyProgress()),
      };
    },
    {
      name: 'lsan-iles',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ version: s.version, activeLang: s.activeLang, settings: s.settings, langs: s.langs }),
    },
  ),
);

/** Sauvegarde exportable (sans la clé API, par sécurité). */
export function exportState(includeKey = false): string {
  const { version, activeLang, settings, langs } = useApp.getState();
  const safe = includeKey ? settings : { ...settings, ai: { ...settings.ai, apiKey: '' } };
  return JSON.stringify({ version, activeLang, settings: safe, langs, exportedAt: new Date().toISOString() }, null, 2);
}
