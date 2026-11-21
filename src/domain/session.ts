import type { ContextPhrase, Exercise, GrammarNote, Lesson, VocabItem } from './types';

export type Step =
  | { kind: 'intro'; vocab: VocabItem }
  | { kind: 'note'; note: GrammarNote }
  | { kind: 'context'; phrase: ContextPhrase }
  | { kind: 'exercise'; exercise: Exercise; retry?: boolean };

const RECO = ['matchPairs', 'mcq', 'hiddenDigit', 'letterHunt'];
const MID = ['cloze', 'registerHunt', 'genreHunt', 'registerSort'];
const PROD = ['sentenceBuilder', 'typeAnswer'];

/** Construit le déroulé d'une leçon : découverte → reconnaissance → contexte → production. */
export function buildLessonSteps(lesson: Lesson): Step[] {
  const byId = new Map(lesson.vocabulary.map((v) => [v.id, v]));
  const intro = lesson.srs.introduce.map((id) => byId.get(id)).filter((v): v is VocabItem => !!v);
  const half = Math.ceil(intro.length / 2);
  const ex = (types: string[]) => lesson.exercises.filter((e) => types.includes(e.type));
  const dialogues: Exercise[] = lesson.dialogues.map((d) => ({ id: `${d.id}-play`, type: 'dialogue', dialogueId: d.id }));
  const [n0, n1, ...nRest] = lesson.grammarNotes;
  const [c0, c1, ...cRest] = lesson.contextPhrases;
  const steps: Step[] = [];
  const push = (...s: (Step | false | undefined)[]) => s.forEach((x) => x && steps.push(x));
  const exo = (e: Exercise): Step => ({ kind: 'exercise', exercise: e });

  push(n0 && { kind: 'note', note: n0 });
  intro.slice(0, half).forEach((v) => push({ kind: 'intro', vocab: v }));
  ex(RECO).slice(0, 2).forEach((e) => push(exo(e)));
  push(n1 && { kind: 'note', note: n1 });
  intro.slice(half).forEach((v) => push({ kind: 'intro', vocab: v }));
  ex(RECO).slice(2).forEach((e) => push(exo(e)));
  push(c0 && { kind: 'context', phrase: c0 }, c1 && { kind: 'context', phrase: c1 });
  ex(MID).forEach((e, i) => {
    push(exo(e));
    if (i === 1 && dialogues[0]) push(exo(dialogues[0]));
  });
  if (ex(MID).length < 2 && dialogues[0]) push(exo(dialogues[0]));
  nRest.forEach((n) => push({ kind: 'note', note: n }));
  cRest.forEach((c) => push({ kind: 'context', phrase: c }));
  ex(PROD).forEach((e) => push(exo(e)));
  dialogues.slice(1).forEach((d) => push(exo(d)));
  return steps;
}

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
