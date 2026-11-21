import alphabet from '../../content/kabyle/alphabet.json';
import transcription from '../../content/darija/transcription.json';
import type { Lang } from '../../domain/types';
import { useApp } from '../../store/useApp';

export function ScriptGuide({ lang }: { lang: Lang }) {
  const settings = useApp((s) => s.settings);
  const update = useApp((s) => s.updateSettings);
  if (lang === 'kabyle') {
    return (
      <div>
        <h2 className="text-2xl font-extrabold">{alphabet.title}</h2>
        <p className="mt-1 text-stone-500">Le kabyle s'écrit en alphabet latin, avec quelques lettres en plus.</p>
        <ul className="mt-4 grid gap-2">
          {alphabet.letters.map((l) => (
            <li key={l.letter} className="card flex gap-4 p-3">
              <span className="w-16 shrink-0 text-center text-3xl font-extrabold text-accent">{l.letter}</span>
              <div className="text-[15px]">
                <p className="font-semibold">{l.sound}</p>
                <p className="text-stone-500">ex. {l.example}{l.ascii && <> · au clavier : <code>{l.ascii}</code></>}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div>
      <h2 className="text-2xl font-extrabold">{transcription.title}</h2>
      <p className="mt-1 text-stone-500">{transcription.intro}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className={`chip ${settings.darijaScript === 'chat' ? 'chip-on' : ''}`} onClick={() => update({ darijaScript: 'chat' })}>Avec chiffres (sa7a)</button>
        <button className={`chip ${settings.darijaScript === 'latin' ? 'chip-on' : ''}`} onClick={() => update({ darijaScript: 'latin' })}>Sans chiffres (ṣaḥḥa)</button>
        <button className={`chip ${settings.showArabic ? 'chip-on' : ''}`} onClick={() => update({ showArabic: !settings.showArabic })}>Arabe : {settings.showArabic ? 'affiché' : 'masqué'}</button>
      </div>
      <ul className="mt-4 grid gap-2">
        {transcription.map.map((m) => (
          <li key={m.digit} className="card flex items-center gap-4 p-3">
            <span className="w-14 shrink-0 text-center text-3xl font-extrabold text-accent">{m.digit}</span>
            <span dir="rtl" lang="ar" className="w-8 text-2xl">{m.ar}</span>
            <div className="text-[15px]">
              <p className="font-semibold">{m.sound} <span className="text-stone-400">({m.latin})</span></p>
              <p className="text-stone-500">ex. {m.example}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
