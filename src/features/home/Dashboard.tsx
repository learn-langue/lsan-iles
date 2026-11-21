import { Link } from 'react-router-dom';
import { LANG_META, LEVELS } from '../../content';
import { visibleStreak } from '../../domain/progress';
import { useApp } from '../../store/useApp';
import { useLangStats } from '../../store/selectors';
import { ProgressBar, Ring } from '../../components/ui';
import { useW } from '../../components/text';
import { ScoreChart } from '../../components/ScoreChart';

export function Dashboard() {
  const lang = useApp((s) => s.activeLang)!;
  const goal = useApp((s) => s.settings.dailyGoalXp);
  const st = useLangStats(lang);
  const w = useW();
  const lvl = LEVELS.find((l) => l.level === st.p.unlockedLevel) ?? LEVELS[0];
  const next = st.nextLesson;
  const nextDone = next && st.p.lessons[next.id];
  const lastTests = [...st.p.history].reverse().slice(0, 5);

  return (
    <div className="space-y-4">
      <section className="card overflow-hidden">
        <div className="bg-accent p-5 text-white">
          <p className="text-sm font-bold opacity-80">Niveau {lvl.level} · {LANG_META[lang].name}</p>
          <h1 className="text-2xl font-extrabold">{lvl.title}</h1>
          <p className="text-sm opacity-90">{lvl.subtitle}</p>
        </div>
        <div className="p-5">
          {next ? (
            <>
              <p className="text-sm text-stone-500">{nextDone ? 'Rejouer pour gagner des étoiles' : 'Prochaine leçon'}</p>
              <p className="text-lg font-extrabold">{next.title}</p>
              <Link to={`/lecon/${next.id}`} className="btn-primary mt-3 w-full">{nextDone ? 'Rejouer' : 'Commencer'} · {next.estimatedMinutes} min</Link>
            </>
          ) : <p>Aucune leçon disponible pour ce niveau pour l'instant.</p>}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <div className="card flex flex-col items-center p-3"><Ring value={st.mastery} /><p className="mt-1 text-xs font-bold text-stone-500">Maîtrise N{lvl.level}</p></div>
        <div className="card flex flex-col items-center justify-center p-3"><p className="text-3xl font-extrabold">🔥{visibleStreak(st.p.streak, st.today)}</p><p className="text-xs font-bold text-stone-500">jours · record {st.p.streak.best}</p></div>
        <div className="card flex flex-col justify-center p-3">
          <p className="text-center text-2xl font-extrabold">{st.xpToday}<span className="text-sm text-stone-400">/{goal}</span></p>
          <ProgressBar value={st.xpToday / goal} className="mt-1 h-2" />
          <p className="mt-1 text-center text-xs font-bold text-stone-500">XP du jour</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link to="/reviser" className="card p-4 transition hover:ring-accent">
          <p className="text-2xl">🃏</p>
          <p className="font-extrabold">Réviser</p>
          <p className="text-sm text-stone-500">{st.due.length ? `${st.due.length} carte${st.due.length > 1 ? 's' : ''} à revoir` : 'Rien d’urgent'}</p>
        </Link>
        <Link to="/sprint" className="card p-4 transition hover:ring-accent">
          <p className="text-2xl">⏱️</p>
          <p className="font-extrabold">Sprint 60 s</p>
          <p className="text-sm text-stone-500">Record : {st.p.sprintBest}</p>
        </Link>
      </section>

      <section className="card p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-extrabold">🩹 Mots fragiles</h2>
          {st.fragile.length > 0 && <Link to="/reviser?mode=fragiles" className="text-sm font-bold text-accent">Réviser</Link>}
        </div>
        {st.fragile.length === 0 ? (
          <p className="mt-1 text-sm text-stone-500">Aucun pour l'instant. Les mots que tu rates souvent apparaîtront ici.</p>
        ) : (
          <ul className="mt-2 divide-y divide-stone-100 dark:divide-stone-800">
            {st.fragile.slice(0, 6).map((v) => (
              <li key={v.id} className="flex justify-between gap-3 py-2 text-[15px]"><b>{w(v, lang)}</b><span className="text-right text-stone-500">{v.fr}</span></li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-extrabold">📈 Mes scores aux tests</h2>
          <Link to="/tests/bilan" className="text-sm font-bold text-accent">Faire un bilan</Link>
        </div>
        {st.p.history.length === 0 ? (
          <p className="mt-1 text-sm text-stone-500">Fais un bilan d'évolution pour voir ta courbe de progrès ici.</p>
        ) : (
          <>
            <ScoreChart history={st.p.history} />
            <table className="mt-2 w-full text-sm">
              <caption className="sr-only">Derniers tests</caption>
              <tbody>
                {lastTests.map((h, i) => (
                  <tr key={i} className="border-t border-stone-100 dark:border-stone-800">
                    <td className="py-1.5">{new Date(h.date).toLocaleDateString('fr-FR')}</td>
                    <td>{h.kind === 'placement' ? 'Positionnement' : h.kind === 'exam' ? `Examen N${h.level}` : 'Bilan'}</td>
                    <td className="text-right font-bold">{Math.round(h.score * 100)} %{h.kind === 'exam' ? (h.passed ? ' ✅' : ' ❌') : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </div>
  );
}
