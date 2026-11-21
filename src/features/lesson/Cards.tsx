import type { ContextPhrase, GrammarNote, Lang, VocabItem } from '../../domain/types';
import { RegisterBadge, W, useW } from '../../components/text';
import { BottomAction } from '../../components/ui';

export function IntroCard({ vocab, lang, onNext }: { vocab: VocabItem; lang: Lang; onNext: () => void }) {
  const w = useW();
  return (
    <div className="animate-pop">
      <p className="mb-3 text-sm font-bold uppercase tracking-wide text-accent">✨ Nouveau mot</p>
      <div className="card p-6">
        <div className="flex items-start justify-between gap-3">
          <W w={vocab} lang={lang} className="text-3xl font-extrabold text-accent" arClass="text-2xl mt-1" />
          <RegisterBadge r={vocab.register} />
        </div>
        <p className="mt-3 text-xl font-semibold">{vocab.fr}</p>
        {vocab.answer && (
          <p className="mt-3 rounded-xl bg-stone-100 px-3 py-2 dark:bg-stone-800">
            ↩️ On te répond : <b>{w(vocab.answer, lang)}</b> <span className="text-stone-500">({vocab.answer.fr})</span>
          </p>
        )}
        {vocab.mnemonic && <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-amber-900 dark:bg-amber-950 dark:text-amber-100">💡 {vocab.mnemonic}</p>}
        {vocab.note && <p className="mt-3 text-stone-600 dark:text-stone-300">🌍 {vocab.note}</p>}
        {vocab.variants && vocab.variants.length > 0 && (
          <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">Aussi : {vocab.variants.join(' · ')}</p>
        )}
      </div>
      <BottomAction onClick={onNext}>Compris !</BottomAction>
    </div>
  );
}

export function NoteCard({ note, lang, onNext }: { note: GrammarNote; lang: Lang; onNext: () => void }) {
  const w = useW();
  return (
    <div className="animate-pop">
      <p className="mb-3 text-sm font-bold uppercase tracking-wide text-accent">🧭 Le truc à savoir</p>
      <div className="card p-6">
        <h2 className="text-xl font-extrabold">{note.title}</h2>
        <p className="mt-3 leading-relaxed">{note.body}</p>
        <ul className="mt-4 space-y-2">
          {note.examples.map((ex, i) => (
            <li key={i} className="rounded-xl bg-accent-soft px-3 py-2">
              <b>{w(ex, lang)}</b> <span className="text-stone-600 dark:text-stone-300">— {ex.fr}</span>
            </li>
          ))}
        </ul>
      </div>
      <BottomAction onClick={onNext}>Continuer</BottomAction>
    </div>
  );
}

export function ContextCard({ phrase, lang, onNext }: { phrase: ContextPhrase; lang: Lang; onNext: () => void }) {
  return (
    <div className="animate-pop">
      <p className="mb-3 text-sm font-bold uppercase tracking-wide text-accent">🎬 En situation</p>
      <div className="card p-6">
        <W w={phrase} lang={lang} className="text-2xl font-extrabold leading-snug" />
        <p className="mt-2 text-lg text-stone-600 dark:text-stone-300">{phrase.fr}</p>
        <dl className="mt-4 grid gap-2 text-[15px]">
          <div className="flex gap-2"><dt>🕐</dt><dd><b>Quand :</b> {phrase.when}</dd></div>
          <div className="flex gap-2"><dt>👥</dt><dd><b>Avec qui :</b> {phrase.with} <RegisterBadge r={phrase.register} /></dd></div>
        </dl>
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-amber-900 dark:bg-amber-950 dark:text-amber-100">🌍 {phrase.culturalNote}</p>
      </div>
      <BottomAction onClick={onNext}>Continuer</BottomAction>
    </div>
  );
}
