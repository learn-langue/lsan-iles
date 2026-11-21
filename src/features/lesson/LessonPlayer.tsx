import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { lessonById } from '../../content';
import { buildLessonSteps, type Step } from '../../domain/session';
import { starsFor, XP } from '../../domain/progress';
import { useApp } from '../../store/useApp';
import { ProgressBar } from '../../components/ui';
import { useW } from '../../components/text';
import { ExerciseView } from '../exercises/ExerciseView';
import type { ExerciseResult } from '../exercises/types';
import { ContextCard, IntroCard, NoteCard } from './Cards';

export function LessonPlayer() {
  const { id = '' } = useParams();
  const lesson = lessonById(id);
  const nav = useNavigate();
  const { addXp, reviewItem, introduceItems, completeLesson } = useApp.getState();
  const initial = useMemo(() => (lesson ? buildLessonSteps(lesson) : []), [lesson]);
  const [steps, setSteps] = useState<Step[]>(initial);
  const [i, setI] = useState(0);
  const [score, setScore] = useState({ total: 0, ok: 0, xp: 0 });
  const [finished, setFinished] = useState<null | { accuracy: number; stars: 1 | 2 | 3; xp: number }>(null);
  const w = useW();

  if (!lesson) return <p className="p-6">Leçon introuvable. <Link to="/parcours" className="text-accent underline">Retour</Link></p>;
  const lang = lesson.language;
  const step = steps[i];

  function advance(nextSteps = steps, s = score) {
    if (i + 1 < nextSteps.length) { setI(i + 1); return; }
    const accuracy = s.total ? s.ok / s.total : 1;
    const stars = starsFor(accuracy);
    const xp = s.xp + XP.lessonBonus;
    introduceItems(lang, [...lesson!.srs.introduce, ...lesson!.srs.bonus]);
    addXp(lang, xp);
    completeLesson(lang, lesson!.id, accuracy, stars);
    setFinished({ accuracy, stars, xp });
  }

  function onExercise(r: ExerciseResult) {
    const cur = step as Extract<Step, { kind: 'exercise' }>;
    r.vocabOk?.forEach((v) => reviewItem(lang, v, 'good'));
    r.vocabFailed?.forEach((v) => reviewItem(lang, v, 'again'));
    let s = score;
    let next = steps;
    if (!cur.retry) {
      s = { total: score.total + 1, ok: score.ok + (r.correct ? 1 : 0), xp: score.xp + r.xp };
      if (!r.correct && cur.exercise.type !== 'dialogue') next = [...steps, { ...cur, retry: true }];
    } else {
      s = { ...score, xp: score.xp + Math.round(r.xp / 2) };
    }
    setScore(s);
    setSteps(next);
    advance(next, s);
  }

  if (finished) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 py-10 text-center">
        <div className="text-6xl">{'⭐'.repeat(finished.stars)}{'☆'.repeat(3 - finished.stars)}</div>
        <h1 className="mt-4 text-3xl font-extrabold">{lang === 'darija' ? 'Saha !' : 'Ayuz !'}</h1>
        <p className="mt-1 text-stone-500">Leçon « {lesson.title} » terminée</p>
        <div className="mt-6 grid w-full grid-cols-2 gap-3">
          <div className="card p-4"><p className="text-3xl font-extrabold text-accent">+{finished.xp}</p><p className="text-sm text-stone-500">XP</p></div>
          <div className="card p-4"><p className="text-3xl font-extrabold text-accent">{Math.round(finished.accuracy * 100)}%</p><p className="text-sm text-stone-500">du premier coup</p></div>
        </div>
        <details className="card mt-4 w-full p-4 text-left">
          <summary className="cursor-pointer font-bold">📒 Lexique de la leçon ({lesson.vocabulary.length} mots, ajoutés aux révisions)</summary>
          <ul className="mt-3 divide-y divide-stone-100 dark:divide-stone-800">
            {lesson.vocabulary.map((v) => <li key={v.id} className="flex justify-between gap-3 py-2"><b>{w(v, lang)}</b><span className="text-right text-stone-500">{v.fr}</span></li>)}
          </ul>
        </details>
        <button className="btn-primary mt-6 w-full" onClick={() => nav('/')}>Continuer</button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-xl px-4 pb-40">
      <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center gap-3 bg-sand-50/95 px-4 py-3 backdrop-blur dark:bg-stone-950/95">
        <button aria-label="Quitter" className="text-2xl text-stone-400" onClick={() => { if (confirm('Quitter la leçon ? La progression de cette session sera perdue.')) nav(-1); }}>✕</button>
        <ProgressBar value={i / steps.length} />
        <span className="shrink-0 whitespace-nowrap text-sm font-bold text-accent">{score.xp} XP</span>
      </header>
      {step.kind === 'exercise' && step.retry && <p className="mb-2 text-sm font-bold text-amber-600">🔁 On reprend une erreur</p>}
      <div key={i}>
        {step.kind === 'intro' && <IntroCard vocab={step.vocab} lang={lang} onNext={() => advance()} />}
        {step.kind === 'note' && <NoteCard note={step.note} lang={lang} onNext={() => advance()} />}
        {step.kind === 'context' && <ContextCard phrase={step.phrase} lang={lang} onNext={() => advance()} />}
        {step.kind === 'exercise' && <ExerciseView exercise={step.exercise} lang={lang} lesson={lesson} onDone={onExercise} />}
      </div>
    </div>
  );
}
