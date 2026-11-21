import { Link } from 'react-router-dom';
import { LEVELS } from '../../content';
import { useApp } from '../../store/useApp';
import { useLangStats } from '../../store/selectors';
import { ScoreChart } from '../../components/ScoreChart';

export function TestsHome() {
  const lang = useApp((s) => s.activeLang)!;
  const st = useLangStats(lang);
  const placed = st.p.history.find((h) => h.kind === 'placement');
  const levelsWithContent = LEVELS.filter((l) => st.lessons.some((x) => x.level === l.level));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Tests</h1>
      <Link to="/tests/bilan" className="card block p-5">
        <p className="text-2xl">📊</p>
        <p className="text-lg font-extrabold">Bilan d'évolution</p>
        <p className="text-sm text-stone-500">12 questions sur tout ce que tu as débloqué. Rejouable à volonté : chaque score est enregistré pour suivre tes progrès.</p>
      </Link>
      <div className="grid gap-2">
        <h2 className="mt-2 font-extrabold">🎓 Examens de palier</h2>
        {levelsWithContent.map((l) => {
          const locked = l.level > st.p.unlockedLevel;
          const best = Math.max(0, ...st.p.history.filter((h) => h.kind === 'exam' && h.level === l.level).map((h) => h.score));
          return locked ? (
            <div key={l.level} className="card p-4 opacity-50">🔒 Niveau {l.level} · {l.title}</div>
          ) : (
            <Link key={l.level} to={`/tests/examen/${l.level}`} className="card flex justify-between p-4">
              <span>Niveau {l.level} · {l.title}</span>
              <span className="font-bold">{best ? `${Math.round(best * 100)} %` : '→'}</span>
            </Link>
          );
        })}
      </div>
      <Link to="/tests/positionnement" className="card block p-4">
        <p className="font-extrabold">🧭 Test de positionnement</p>
        <p className="text-sm text-stone-500">{placed ? `Fait le ${new Date(placed.date).toLocaleDateString('fr-FR')} : niveau ${placed.level}. Tu peux le refaire.` : 'Pour démarrer directement au bon niveau.'}</p>
      </Link>
      {st.p.history.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-2 font-extrabold">📈 Historique</h2>
          <ScoreChart history={st.p.history} />
        </section>
      )}
    </div>
  );
}
