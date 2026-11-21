import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LESSONS } from '../../content';
import { breakdown, generateTest, type Category, type Question } from '../../domain/testgen';
import { EXAM_PASS } from '../../domain/progress';
import { useApp, type TestKind } from '../../store/useApp';
import { useW } from '../../components/text';
import { ProgressBar } from '../../components/ui';
import { ExerciseView } from '../exercises/ExerciseView';
import type { ExerciseResult } from '../exercises/types';

const TITLES: Record<TestKind, string> = { placement: 'Test de positionnement', exam: 'Examen de palier', checkup: "Bilan d'évolution" };
const PLACEMENT_BLOCK = { vocab: 4, build: 2, context: 2 };
const PLACEMENT_PASS = 0.7;

export function TestRunner({ kind }: { kind: TestKind }) {
  const lang = useApp((s) => s.activeLang)!;
  const unlocked = useApp((s) => s.langs[lang].unlockedLevel);
  const recordTest = useApp((s) => s.recordTest);
  const params = useParams();
  const nav = useNavigate();
  const wt = useW();
  const display = (w: Parameters<typeof wt>[0]) => wt(w, lang);
  const pool = LESSONS[lang];
  const contentLevels = [...new Set(pool.map((l) => l.level))].sort();
  const examLevel = Number(params.level ?? 1);

  const makeBlock = (level: number) => generateTest(pool.filter((l) => l.level === level), pool, display, PLACEMENT_BLOCK);
  const initial = useMemo<Question[]>(() => {
    if (kind === 'placement') return makeBlock(contentLevels[0] ?? 1);
    if (kind === 'exam') return generateTest(pool.filter((l) => l.level === examLevel), pool, display);
    return generateTest(pool.filter((l) => l.level <= unlocked), pool, display);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [questions, setQuestions] = useState(initial);
  const [i, setI] = useState(0);
  const [results, setResults] = useState<{ category: Category; level: number; score: number }[]>([]);
  const [placementLevel, setPlacementLevel] = useState(contentLevels[0] ?? 1);
  const [summary, setSummary] = useState<null | { total: number; vocab: number; build: number; context: number; passed?: boolean; level?: number }>(null);

  function finish(res: typeof results, placed?: number) {
    const b = breakdown(res);
    const passed = kind === 'exam' ? b.total >= EXAM_PASS : undefined;
    const level = kind === 'exam' ? examLevel : placed;
    recordTest(lang, { kind, level, date: new Date().toISOString(), score: b.total, breakdown: { vocab: b.vocab, build: b.build, context: b.context }, passed });
    setSummary({ ...b, passed, level });
  }

  function onDone(r: ExerciseResult) {
    const q = questions[i];
    const res = [...results, { category: q.category, level: q.level, score: r.score ?? (r.correct ? 1 : 0) }];
    setResults(res);
    if (i + 1 < questions.length) { setI(i + 1); return; }
    if (kind !== 'placement') return finish(res);
    // Positionnement adaptatif : on monte d'un niveau tant que le bloc est réussi.
    const block = res.filter((x) => x.level === placementLevel);
    const ok = block.reduce((a, x) => a + x.score, 0) / Math.max(1, block.length) >= PLACEMENT_PASS;
    const nextLevel = contentLevels.find((l) => l > placementLevel);
    if (ok && nextLevel) {
      setPlacementLevel(nextLevel);
      setQuestions([...questions, ...makeBlock(nextLevel)]);
      setI(i + 1);
      return;
    }
    finish(res, Math.min(4, ok ? placementLevel + 1 : placementLevel));
  }

  if (questions.length === 0) return <p className="p-6">Pas assez de contenu pour ce test. <Link className="text-accent underline" to="/tests">Retour</Link></p>;

  if (summary) {
    const bars: [string, number][] = [['Vocabulaire', summary.vocab], ['Construction', summary.build], ['Mise en situation', summary.context]];
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
        <p className="text-center text-sm font-bold text-stone-500">{TITLES[kind]}</p>
        <p className="mt-2 text-center text-6xl font-extrabold text-accent">{Math.round(summary.total * 100)} %</p>
        <p className="mt-2 text-center text-lg font-bold">
          {kind === 'exam' && (summary.passed ? `🎉 Niveau ${examLevel} validé ! Le niveau ${examLevel + 1} est débloqué.` : `Il faut ${EXAM_PASS * 100} % pour valider. Révise et retente !`)}
          {kind === 'placement' && `🧭 Tu commences au niveau ${summary.level}.`}
          {kind === 'checkup' && 'Score enregistré dans ton historique 📈'}
        </p>
        <div className="card mt-6 space-y-3 p-5">
          {bars.map(([label, v]) => (
            <div key={label}>
              <div className="flex justify-between text-sm font-bold"><span>{label}</span><span>{Math.round(v * 100)} %</span></div>
              <ProgressBar value={v} className="mt-1" />
            </div>
          ))}
        </div>
        <button className="btn-primary mt-6" onClick={() => nav('/')}>Retour à l'accueil</button>
        <button className="btn-ghost mt-2" onClick={() => nav('/tests')}>Autres tests</button>
      </div>
    );
  }

  const q = questions[i];
  return (
    <div className="mx-auto min-h-screen max-w-xl px-4 pb-40">
      <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center gap-3 bg-sand-50/95 px-4 py-3 backdrop-blur dark:bg-stone-950/95">
        <button aria-label="Quitter" className="text-2xl text-stone-400" onClick={() => { if (confirm('Abandonner le test ?')) nav(-1); }}>✕</button>
        <ProgressBar value={i / questions.length} />
        <span className="shrink-0 text-xs font-bold text-stone-500">{TITLES[kind]}{kind === 'placement' ? ` · N${placementLevel}` : ''}</span>
      </header>
      <div key={i}><ExerciseView exercise={q.exercise} lang={lang} lesson={q.lesson} onDone={onDone} /></div>
    </div>
  );
}
