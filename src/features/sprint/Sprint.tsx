import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { shuffle } from '../../domain/session';
import { XP } from '../../domain/progress';
import { useApp } from '../../store/useApp';
import { useLangStats } from '../../store/selectors';
import { useW } from '../../components/text';
import type { VocabItem } from '../../domain/types';

const DURATION = 60;
const ON_SCREEN = 4;

/** Sprint chrono : relier un maximum de paires en 60 s, combo multiplicateur, mots fragiles en priorité. */
export function Sprint() {
  const lang = useApp((s) => s.activeLang)!;
  const st = useLangStats(lang);
  const { addXp, setSprintBest, reviewItem } = useApp.getState();
  const w = useW();
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [time, setTime] = useState(DURATION);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [pairs, setPairs] = useState(0);
  const [board, setBoard] = useState<VocabItem[]>([]);
  const [right, setRight] = useState<VocabItem[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [bad, setBad] = useState<string | null>(null);
  const pool = useRef<VocabItem[]>([]);
  const missed = useRef(new Set<string>());

  function draw(exclude: VocabItem[]): VocabItem {
    if (pool.current.length === 0) {
      const base = st.known.length >= ON_SCREEN ? st.known : st.all.filter((v) => v.level === 1);
      pool.current = [...st.fragile, ...shuffle(base)];
    }
    let v = pool.current.shift()!;
    let guard = 0;
    while (exclude.some((e) => e.id === v.id) && guard++ < 50) { pool.current.push(v); v = pool.current.shift()!; }
    return v;
  }

  function start() {
    pool.current = [];
    missed.current.clear();
    const b: VocabItem[] = [];
    for (let i = 0; i < ON_SCREEN; i++) b.push(draw(b));
    setBoard(b); setRight(shuffle(b)); setScore(0); setCombo(0); setPairs(0); setTime(DURATION); setPhase('play');
  }

  useEffect(() => {
    if (phase !== 'play') return;
    if (time <= 0) {
      setPhase('over');
      addXp(lang, pairs * XP.sprintPair);
      setSprintBest(lang, score);
      missed.current.forEach((id) => reviewItem(lang, id, 'again'));
      return;
    }
    const t = setTimeout(() => setTime((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, time]); // eslint-disable-line react-hooks/exhaustive-deps

  function pickRight(v: VocabItem) {
    if (!sel) return;
    if (sel === v.id) {
      const c = combo + 1;
      setCombo(c);
      setScore((s) => s + 10 * Math.min(5, 1 + Math.floor(c / 3)));
      setPairs((p) => p + 1);
      const replacement = draw(board);
      setBoard((b) => b.map((x) => (x.id === v.id ? replacement : x)));
      setRight((r) => r.map((x) => (x.id === v.id ? replacement : x)));
    } else {
      missed.current.add(sel);
      setCombo(0);
      setBad(v.id);
      setTimeout(() => setBad(null), 300);
    }
    setSel(null);
  }

  if (st.all.length < ON_SCREEN) return <p>Pas assez de vocabulaire pour un sprint.</p>;
  const mult = Math.min(5, 1 + Math.floor(combo / 3));

  if (phase !== 'play') {
    return (
      <div className="card mt-6 p-6 text-center">
        <div className="text-5xl">{phase === 'over' ? (score >= st.p.sprintBest && score > 0 ? '🏆' : '⏱️') : '⚡'}</div>
        <h1 className="mt-3 text-2xl font-extrabold">{phase === 'over' ? `${score} points` : 'Sprint de vocabulaire'}</h1>
        <p className="mt-1 text-stone-500">{phase === 'over' ? `${pairs} paires · record ${Math.max(st.p.sprintBest, score)}` : '60 secondes pour relier un maximum de paires. Enchaîne les bonnes réponses pour monter le multiplicateur (jusqu’à ×5).'}</p>
        <button className="btn-primary mt-6 w-full" onClick={start}>{phase === 'over' ? 'Rejouer' : 'Go !'}</button>
        {phase === 'over' && <Link to="/" className="btn-ghost mt-2 w-full">Retour</Link>}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-lg font-extrabold">
        <span className={time <= 10 ? 'animate-pulse text-rose-600' : ''}>⏱️ {time}s</span>
        <span className="text-accent">{score} pts</span>
        <span className={`badge bg-accent-soft text-base ${mult > 1 ? 'animate-pop' : ''}`}>×{mult}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-3">
          {board.map((v) => <button key={v.id} onClick={() => setSel(v.id)} className={`chip min-h-[3.5rem] ${sel === v.id ? 'chip-on' : ''}`}>{w(v, lang)}</button>)}
        </div>
        <div className="grid gap-3">
          {right.map((v) => <button key={v.id} onClick={() => pickRight(v)} className={`chip min-h-[3.5rem] text-sm ${bad === v.id ? 'animate-shake border-rose-500' : ''}`}>{v.fr}</button>)}
        </div>
      </div>
    </div>
  );
}
