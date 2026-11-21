import type { Exercise, Lesson, Written } from './types';
import { shuffle } from './session';

export type Category = 'vocab' | 'build' | 'context';
export interface Question { category: Category; level: number; lesson: Lesson; exercise: Exercise }
export type Display = (w: Written) => string;

export const MIX = { vocab: 6, build: 3, context: 3 } as const;

/** Questions de vocabulaire : QCM dans les deux sens, distracteurs pris dans la même langue. */
function vocabQuestions(lessons: Lesson[], pool: Lesson[], display: Display): Question[] {
  const all = pool.flatMap((l) => l.vocabulary);
  return lessons.flatMap((lesson) =>
    lesson.vocabulary.map((v, i): Question => {
      const seen = new Set([display(v), v.fr]);
      const others = shuffle(all.filter((o) => o.id !== v.id)).filter((o) => {
        const k = [display(o), o.fr];
        if (k.some((x) => seen.has(x))) return false;
        k.forEach((x) => seen.add(x));
        return true;
      }).slice(0, 3);
      const toTarget = i % 2 === 0;
      const exercise: Exercise = toTarget
        ? { id: `t-${v.id}`, type: 'mcq', instruction: `Comment dit-on « ${v.fr} » ?`, options: [display(v), ...others.map(display)], answer: display(v) }
        : { id: `t-${v.id}`, type: 'mcq', instruction: `Que veut dire « ${display(v)} » ?`, options: [v.fr, ...others.map((o) => o.fr)], answer: v.fr };
      return { category: 'vocab', level: lesson.level, lesson, exercise };
    }),
  );
}

function buildQuestions(lessons: Lesson[]): Question[] {
  return lessons.flatMap((lesson) => {
    const own = lesson.exercises.filter((e) => e.type === 'sentenceBuilder' || e.type === 'typeAnswer');
    const fromDialogues: Exercise[] = lesson.dialogues.flatMap((d) =>
      d.turns.flatMap((t, i) => ('build' in t ? [{ id: `t-${d.id}-${i}`, type: 'sentenceBuilder' as const, instruction: `Traduis : « ${t.build.fr} »`, fr: t.build.fr, answer: t.build.answer, distractors: t.build.distractors, alternatives: t.build.alternatives }] : [])),
    );
    return [...own, ...fromDialogues].map((exercise): Question => ({ category: 'build', level: lesson.level, lesson, exercise }));
  });
}

function contextQuestions(lessons: Lesson[], display: Display): Question[] {
  return lessons.flatMap((lesson) => {
    const own = lesson.exercises.filter((e) => ['cloze', 'registerHunt', 'genreHunt', 'registerSort'].includes(e.type));
    const fromDialogues: Exercise[] = lesson.dialogues.flatMap((d) =>
      d.turns.flatMap((t, i) => {
        if (!('options' in t)) return [];
        const prev = d.turns[i - 1];
        const said = prev && prev.from === 'them' ? ` ${d.contact.name} : « ${display(prev)} »` : '';
        const natural = t.options.find((o) => o.score === 'natural');
        if (!natural) return [];
        return [{ id: `t-${d.id}-${i}`, type: 'mcq' as const, instruction: `${d.contact.avatar} ${d.title}.${said} ${t.prompt} : quelle réponse est la plus naturelle ?`, options: t.options.map(display), answer: display(natural), explanation: natural.feedback }];
      }),
    );
    return [...own, ...fromDialogues].map((exercise): Question => ({ category: 'context', level: lesson.level, lesson, exercise }));
  });
}

/** Tire un mélange vocabulaire / construction / mise en situation. */
export function generateTest(lessons: Lesson[], pool: Lesson[], display: Display, mix: Record<Category, number> = MIX): Question[] {
  const pick = (qs: Question[], n: number) => shuffle(qs).slice(0, n);
  const vocab = pick(vocabQuestions(lessons, pool, display), mix.vocab);
  const build = pick(buildQuestions(lessons), mix.build);
  const context = pick(contextQuestions(lessons, display), mix.context);
  // Ordre : on alterne pour garder du rythme.
  const out: Question[] = [];
  const max = Math.max(vocab.length, build.length, context.length);
  for (let i = 0; i < max; i++) [vocab[i * 2], vocab[i * 2 + 1], build[i], context[i]].forEach((q) => q && out.push(q));
  return out;
}

export function breakdown(results: { category: Category; score: number }[]) {
  const avg = (c: Category) => {
    const r = results.filter((x) => x.category === c);
    return r.length ? r.reduce((a, x) => a + x.score, 0) / r.length : 0;
  };
  const total = results.length ? results.reduce((a, x) => a + x.score, 0) / results.length : 0;
  return { total, vocab: avg('vocab'), build: avg('build'), context: avg('context') };
}
