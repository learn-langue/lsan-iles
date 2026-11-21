import { useEffect, useMemo, useRef, useState } from 'react';
import type { BuildSpec, ChatTurn, Dialogue, ReplyOption, Written } from '../../domain/types';
import { shuffle } from '../../domain/session';
import { XP } from '../../domain/progress';
import { useW } from '../../components/text';
import { BuilderArea, useBuilder } from './Builder';
import type { ExerciseProps, Of } from './types';

interface Bubble { side: 'them' | 'me'; w: Written; fr: string; ticks?: 'natural' | 'ok' | 'wrong' }

const TICKS = { natural: <span className="text-sky-500">✓✓</span>, ok: <span className="text-stone-400">✓✓</span>, wrong: <span className="text-stone-400">✓</span> };

function BubbleView({ b, lang }: { b: Bubble; lang: 'darija' | 'kabyle' }) {
  const w = useW();
  const [showFr, setShowFr] = useState(false);
  const me = b.side === 'me';
  return (
    <div className={`flex animate-pop ${me ? 'justify-end' : ''}`}>
      <button onClick={() => setShowFr((s) => !s)} className={`max-w-[82%] rounded-2xl px-3 py-2 text-left shadow-sm ${me ? 'rounded-tr-sm bg-[#d9fdd3] text-stone-900 dark:bg-[#005c4b] dark:text-white' : 'rounded-tl-sm bg-white dark:bg-stone-800'}`}>
        <span className="text-[16px]">{w(b.w, lang)}</span>
        {lang === 'darija' && b.w.ar && <ArabicLine ar={b.w.ar} />}
        {showFr && <span className="mt-1 block border-t border-black/10 pt-1 text-sm italic opacity-80 dark:border-white/10">🇫🇷 {b.fr}</span>}
        <span className="ml-2 float-right mt-1 text-[11px] opacity-60">{me && b.ticks ? TICKS[b.ticks] : 'traduire'}</span>
      </button>
    </div>
  );
}

function ArabicLine({ ar }: { ar: string }) {
  return <span dir="rtl" lang="ar" className="block text-sm opacity-70">{ar}</span>;
}

function BuildReply({ spec, onSend }: { spec: BuildSpec; onSend: (ok: boolean) => void }) {
  const b = useBuilder(spec.answer, spec.distractors, spec.alternatives);
  const [wrong, setWrong] = useState(false);
  return (
    <div>
      <p className="mb-2 text-sm text-stone-500 dark:text-stone-400">🇫🇷 « {spec.fr} »</p>
      <BuilderArea {...b} />
      {wrong && <p className="mt-3 text-center text-sm text-rose-600">Ce n'est pas encore ça. Réponse : <b>{spec.answer.join(' ').replace(/ ([.,!?])/g, '$1')}</b></p>}
      <button className="btn-primary mt-4 w-full" disabled={b.line.length === 0} onClick={() => {
        const ok = b.isCorrect();
        if (!ok && !wrong) { setWrong(true); return; }
        onSend(ok && !wrong);
      }}>{wrong ? 'Envoyer la bonne réponse' : 'Envoyer ➤'}</button>
    </div>
  );
}

/** Simulateur WhatsApp : réponses notées naturel / ok / à côté, avec réactions en personnage. */
export function ChatSim({ exercise, lang, lesson, onDone }: ExerciseProps<Of<'dialogue'>>) {
  const dialogue = lesson?.dialogues.find((d) => d.id === exercise.dialogueId) as Dialogue;
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [turn, setTurn] = useState(0);
  const [typing, setTyping] = useState(false);
  const [feedback, setFeedback] = useState<{ opt: ReplyOption } | null>(null);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [stats, setStats] = useState({ natural: 0, ok: 0, wrong: 0, firstTry: 0, prompts: 0 });
  const [firstAttempt, setFirstAttempt] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const current: ChatTurn | undefined = dialogue.turns[turn];
  const finished = turn >= dialogue.turns.length;

  // Les messages de l'interlocuteur arrivent avec « en train d'écrire… ».
  useEffect(() => {
    if (current?.from !== 'them') return;
    setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      setBubbles((b) => [...b, { side: 'them', w: current, fr: current.fr }]);
      setTurn((x) => x + 1);
    }, turn === 0 ? 500 : 1100);
    return () => clearTimeout(t);
  }, [turn, current]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [bubbles, typing, feedback, turn]);

  const options = useMemo(() => (current && 'options' in current ? shuffle(current.options) : []), [current]);

  function choose(opt: ReplyOption) {
    const r = opt.reaction;
    setBubbles((b) => [...b, { side: 'me', w: opt, fr: opt.fr, ticks: opt.score }, ...(r ? [{ side: 'them' as const, w: r, fr: r.fr }] : [])]);
    setStats((s) => ({ ...s, [opt.score]: s[opt.score] + 1, prompts: firstAttempt ? s.prompts + 1 : s.prompts, firstTry: firstAttempt && opt.score !== 'wrong' ? s.firstTry + 1 : s.firstTry }));
    setFeedback({ opt });
  }

  function next() {
    const opt = feedback!.opt;
    setFeedback(null);
    if (opt.score === 'wrong') {
      // On retire la mauvaise bulle et on laisse réessayer.
      setBubbles((b) => b.filter((x) => x.w !== opt && x.w !== opt.reaction));
      setExcluded((e) => [...e, opt.fr]);
      setFirstAttempt(false);
      return;
    }
    setExcluded([]);
    setFirstAttempt(true);
    setTurn((x) => x + 1);
  }

  function sendBuild(spec: BuildSpec, ok: boolean) {
    const w: Written = spec.text ? { text: spec.text } : { chat: spec.answer.join(' ').replace(/ ([.,!?])/g, '$1') };
    setBubbles((b) => [...b, { side: 'me', w, fr: spec.fr, ticks: ok ? 'natural' : 'ok' }]);
    setStats((s) => ({ ...s, prompts: s.prompts + 1, firstTry: ok ? s.firstTry + 1 : s.firstTry, natural: ok ? s.natural + 1 : s.natural, ok: ok ? s.ok : s.ok + 1 }));
    setTurn((x) => x + 1);
  }

  const toneCls = { natural: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100', ok: 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100', wrong: 'bg-rose-50 text-rose-900 dark:bg-rose-950 dark:text-rose-100' };
  const toneTitle = { natural: '✓✓ Naturel !', ok: '✓✓ Compréhensible', wrong: '✓ À côté…' };

  return (
    <div className="-mx-4 -mt-2">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-[#075e54] px-4 py-2 text-white dark:bg-[#1f2c34]">
        <span className="text-3xl">{dialogue.contact.avatar}</span>
        <div className="leading-tight">
          <p className="font-bold">{dialogue.contact.name}</p>
          <p className="text-xs opacity-80">{typing ? "en train d'écrire…" : dialogue.contact.relation}</p>
        </div>
      </div>
      <div className="min-h-[55vh] space-y-2 bg-[#efeae2] px-3 py-4 pb-72 dark:bg-[#0b141a]">
        <p className="mx-auto mb-3 w-fit rounded-lg bg-[#fff3c4] px-3 py-1 text-center text-xs text-stone-700 dark:bg-[#182229] dark:text-stone-300">{dialogue.title} · touche une bulle pour la traduire</p>
        {bubbles.map((b, i) => <BubbleView key={i} b={b} lang={lang} />)}
        {typing && <div className="w-fit rounded-2xl rounded-tl-sm bg-white px-4 py-3 dark:bg-stone-800"><span className="animate-pulse tracking-widest">•••</span></div>}
        <div ref={endRef} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 pb-safe">
        <div className={`mx-auto max-w-xl rounded-t-2xl px-4 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,.08)] ${feedback ? toneCls[feedback.opt.score] : 'bg-sand-50 dark:bg-stone-950'}`}>
          {feedback ? (
            <div className="animate-pop">
              <p className="text-lg font-extrabold">{toneTitle[feedback.opt.score]}</p>
              <p className="mt-1">{feedback.opt.feedback}</p>
              <button autoFocus className="btn mb-2 mt-3 w-full bg-stone-800 text-white dark:bg-white dark:text-stone-900" onClick={next}>{feedback.opt.score === 'wrong' ? 'Réessayer' : 'Continuer'}</button>
            </div>
          ) : finished ? (
            <div className="animate-pop">
              <p className="text-lg font-extrabold">Conversation terminée 🎉</p>
              <p>{stats.natural} réponse(s) naturelle(s), {stats.ok} compréhensible(s), {stats.wrong} à côté.</p>
              <button autoFocus className="btn-primary mb-2 mt-3 w-full" onClick={() => onDone({
                correct: stats.wrong === 0, score: stats.prompts ? stats.firstTry / stats.prompts : 1,
                xp: stats.natural * XP.correct + stats.ok * XP.okReply,
              })}>Continuer</button>
            </div>
          ) : current?.from === 'me' ? (
            <div className="pb-2">
              <p className="mb-3 text-sm font-bold text-stone-500 dark:text-stone-400">💬 {current.prompt}</p>
              {'options' in current ? (
                <div className="grid gap-2">
                  {options.filter((o) => !excluded.includes(o.fr)).map((o, i) => (
                    <OptionButton key={i} opt={o} lang={lang} onClick={() => choose(o)} />
                  ))}
                </div>
              ) : (
                <BuildReply key={turn} spec={current.build} onSend={(ok) => sendBuild(current.build, ok)} />
              )}
            </div>
          ) : (
            <p className="pb-4 text-center text-sm text-stone-400">…</p>
          )}
        </div>
      </div>
    </div>
  );
}

function OptionButton({ opt, lang, onClick }: { opt: ReplyOption; lang: 'darija' | 'kabyle'; onClick: () => void }) {
  const w = useW();
  return <button onClick={onClick} className="chip text-left">{w(opt, lang)}</button>;
}
