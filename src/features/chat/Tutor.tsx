import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LANG_META, vocabIndex } from '../../content';
import { chatKey, useChat } from '../../store/chat';
import { useApp, type ChatMessage } from '../../store/useApp';
import { useW } from '../../components/text';
import { Empty } from '../../components/ui';
import { SCENARIOS, type Scenario } from './scenarios';
import { parseReply, systemPrompt, type TutorReply } from './prompt';
import { complete, type ChatTurnMsg } from './providers';

const KAB_KEYS = ['ɣ', 'ɛ', 'č', 'ḍ', 'ṭ', 'ṣ', 'ẓ', 'ḥ', 'ǧ'];
const START = '(Commence la conversation selon le scénario, avec une première réplique simple.)';

function BotBubble({ m }: { m: ChatMessage }) {
  const [tr, setTr] = useState(false);
  const [words, setWords] = useState(false);
  const d = m.data as TutorReply | undefined;
  return (
    <div className="flex animate-pop">
      <div className="max-w-[85%]">
        <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-2 text-[16px] shadow-sm dark:bg-stone-800">{m.text}</div>
        {d && (
          <div className="mt-1 flex gap-2 pl-1">
            <button className="text-xs font-bold text-accent" onClick={() => setTr((v) => !v)}>🇫🇷 Traduire</button>
            {d.words.length > 0 && <button className="text-xs font-bold text-accent" onClick={() => setWords((v) => !v)}>🔍 Mot à mot</button>}
          </div>
        )}
        {tr && d && <p className="mt-1 rounded-xl bg-stone-100 px-3 py-2 text-sm italic dark:bg-stone-900">{d.translation}</p>}
        {words && d && (
          <ul className="mt-1 grid gap-1 rounded-xl bg-stone-100 px-3 py-2 text-sm dark:bg-stone-900">
            {d.words.map((x, i) => <li key={i}><b>{x.w}</b> — {x.fr}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

function UserBubble({ m, correction }: { m: ChatMessage; correction?: TutorReply['correction'] }) {
  return (
    <div className="flex flex-col items-end animate-pop">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-accent px-4 py-2 text-[16px] text-white shadow-sm">{m.text}</div>
      {correction && (
        <div className={`mt-1 max-w-[85%] rounded-xl px-3 py-2 text-sm ${correction.ok ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100' : 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100'}`}>
          {correction.ok ? <p>✅ Nickel !{correction.explanation ? ` ${correction.explanation}` : ''}</p> : (
            <>
              <p>✍️ <b>{correction.corrected}</b></p>
              <p className="mt-0.5">{correction.explanation}</p>
            </>
          )}
          {correction.natural && <p className="mt-1">💡 Plus naturel : <b>{correction.natural}</b></p>}
        </div>
      )}
    </div>
  );
}

function Conversation({ scenario, onBack }: { scenario: Scenario; onBack: () => void }) {
  const lang = useApp((s) => s.activeLang)!;
  const settings = useApp((s) => s.settings);
  const p = useApp((s) => s.langs[lang]);
  const key = chatKey(lang, scenario.id);
  const thread = useChat((s) => s.threads[key]) ?? [];
  const { push, clear } = useChat.getState();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const w = useW();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [thread.length, busy]);

  async function ask(history: ChatMessage[]) {
    setBusy(true);
    setError(null);
    try {
      const idx = vocabIndex(lang);
      const known = Object.keys(p.srs).map((id) => idx.get(id)).filter((v) => !!v).map((v) => `${w(v, lang)} (${v.fr})`);
      const sys = systemPrompt(lang, p.unlockedLevel, scenario, known, settings.learnerGender);
      const turns: ChatTurnMsg[] = [{ role: 'user', content: START }, ...history.map((m): ChatTurnMsg => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }))];
      const raw = await complete(settings.ai, sys, turns);
      const data = parseReply(raw);
      push(key, { role: 'bot', text: data.reply, data, at: new Date().toISOString() });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (thread.length === 0 && settings.ai.apiKey) ask([]);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  function send() {
    const text = input.trim();
    if (!text || busy) return;
    const m: ChatMessage = { role: 'user', text, at: new Date().toISOString() };
    push(key, m);
    setInput('');
    ask([...thread, m]);
  }

  // La correction d'un message utilisateur arrive avec la réponse suivante du bot.
  const correctionFor = (i: number) => (thread[i + 1]?.data as TutorReply | undefined)?.correction ?? undefined;

  return (
    <div className="-mx-4 -mt-2 flex min-h-[calc(100vh-8rem)] flex-col">
      <div className="flex items-center gap-3 border-b border-stone-200 px-4 py-2 dark:border-stone-800">
        <button onClick={onBack} className="text-xl" aria-label="Retour">←</button>
        <span className="text-2xl">{scenario.icon}</span>
        <div className="leading-tight"><p className="font-bold">{scenario.title}</p><p className="text-xs text-stone-500">{LANG_META[lang].name} · niveau {p.unlockedLevel}</p></div>
        <button className="ml-auto text-xs font-bold text-stone-400" onClick={() => { if (confirm('Recommencer cette conversation ?')) { clear(key); setTimeout(() => ask([]), 0); } }}>Recommencer</button>
      </div>
      <div className="flex-1 space-y-3 px-4 py-4 pb-44">
        {thread.map((m, i) => (m.role === 'bot' ? <BotBubble key={i} m={m} /> : <UserBubble key={i} m={m} correction={correctionFor(i)} />))}
        {busy && <div className="w-fit rounded-2xl rounded-tl-sm bg-white px-4 py-3 dark:bg-stone-800"><span className="animate-pulse tracking-widest">•••</span></div>}
        {error && (
          <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-100">
            ⚠️ {error}
            <button className="ml-2 font-bold underline" onClick={() => ask(thread)}>Réessayer</button>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="fixed inset-x-0 bottom-16 z-10 border-t border-stone-200 bg-sand-50/95 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
        <div className="mx-auto max-w-xl px-3 py-2">
          {lang === 'kabyle' && (
            <div className="mb-2 flex gap-1 overflow-x-auto">
              {KAB_KEYS.map((k) => <button key={k} className="chip shrink-0 px-2.5 py-0.5" onClick={() => setInput((v) => v + k)}>{k}</button>)}
            </div>
          )}
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} autoCapitalize="off" autoCorrect="off" spellCheck={false}
              placeholder={lang === 'darija' ? 'Écris en darija… (ou en français si tu bloques)' : 'Aru s teqbaylit… (ou en français)'} className="card flex-1 px-4 py-3 outline-none focus:ring-2 focus:ring-accent" />
            <button className="btn-primary px-4" disabled={busy || !input.trim()} onClick={send}>➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Tutor() {
  const lang = useApp((s) => s.activeLang)!;
  const ai = useApp((s) => s.settings.ai);
  const level = useApp((s) => s.langs[lang].unlockedLevel);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  if (scenario) return <Conversation scenario={scenario} onBack={() => setScenario(null)} />;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Tuteur IA</h1>
      {!ai.apiKey && (
        <Empty icon="🔑" title="Ajoute ta clé API pour discuter">
          Colle ta clé Gemini ou OpenAI dans les <Link to="/reglages" className="font-bold text-accent underline">réglages</Link>. Elle reste sur cet appareil.
        </Empty>
      )}
      {lang === 'kabyle' && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">⚠️ Les IA font plus d'erreurs en kabyle qu'en darija. En cas de doute, fie-toi aux leçons et demande à un proche.</p>}
      <div className="grid gap-3">
        {SCENARIOS.map((s) => {
          const locked = s.minLevel > level;
          return (
            <button key={s.id} disabled={locked || !ai.apiKey} onClick={() => setScenario(s)} className="card flex items-center gap-4 p-4 text-left disabled:opacity-50">
              <span className="text-3xl">{s.icon}</span>
              <span><span className="block font-extrabold">{s.title}</span><span className="block text-sm text-stone-500">{locked ? `🔒 À partir du niveau ${s.minLevel}` : s.brief}</span></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
