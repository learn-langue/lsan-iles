import { Link } from 'react-router-dom';
import { LEVELS } from '../../content';
import { useApp } from '../../store/useApp';
import { useLangStats } from '../../store/selectors';

export function Path() {
  const lang = useApp((s) => s.activeLang)!;
  const st = useLangStats(lang);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Parcours</h1>
      {LEVELS.map((lvl) => {
        const locked = lvl.level > st.p.unlockedLevel;
        const lessons = st.lessons.filter((l) => l.level === lvl.level);
        const exam = st.p.history.filter((h) => h.kind === 'exam' && h.level === lvl.level);
        const passed = exam.some((h) => h.passed);
        return (
          <section key={lvl.level} className={locked ? 'opacity-50' : ''}>
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-extrabold text-white">{locked ? '🔒' : lvl.level}</span>
              <div>
                <p className="font-extrabold">Niveau {lvl.level} · {lvl.title}</p>
                <p className="text-sm text-stone-500">{lvl.subtitle}</p>
              </div>
            </div>
            <div className="grid gap-2 pl-5">
              {lessons.length === 0 && <p className="card p-3 text-sm text-stone-500">Leçons à venir.</p>}
              {lessons.map((l) => {
                const rec = st.p.lessons[l.id];
                const body = (
                  <div className="card flex items-center justify-between p-4">
                    <div><p className="font-bold">{l.order}. {l.title}</p><p className="text-sm text-stone-500">{l.goal}</p></div>
                    <span className="ml-3 shrink-0 text-lg">{rec ? '⭐'.repeat(rec.stars) : '▶️'}</span>
                  </div>
                );
                return locked ? <div key={l.id}>{body}</div> : <Link key={l.id} to={`/lecon/${l.id}`}>{body}</Link>;
              })}
              {lessons.length > 0 && !locked && (
                <Link to={`/tests/examen/${lvl.level}`} className="card flex items-center justify-between border-2 border-dashed border-accent p-4">
                  <div><p className="font-bold">🎓 Examen du niveau {lvl.level}</p><p className="text-sm text-stone-500">80 % pour débloquer le niveau suivant</p></div>
                  <span>{passed ? '✅' : '→'}</span>
                </Link>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
