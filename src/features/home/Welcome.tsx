import { Link } from 'react-router-dom';
import { LANG_META } from '../../content';
import { useApp } from '../../store/useApp';

export function Welcome() {
  const lang = useApp((s) => s.activeLang)!;
  const m = LANG_META[lang];
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10 text-center">
      <div className="text-6xl">{m.flag}</div>
      <h1 className="mt-4 text-3xl font-extrabold">{lang === 'darija' ? 'Marhba bik !' : 'Ansuf !'}</h1>
      <p className="mt-2 text-stone-500">Tu pars de zéro en {m.name.toLowerCase()}, ou tu connais déjà un peu ?</p>
      <div className="mt-8 grid gap-3">
        <Link to="/" className="btn-primary">Je débute : niveau 1</Link>
        <Link to="/tests/positionnement" className="btn-ghost">J'ai des bases : test de positionnement (3 min)</Link>
      </div>
    </div>
  );
}
