import { useState } from 'react';
import type { TestRecord } from '../store/useApp';

const KIND: Record<TestRecord['kind'], string> = { placement: 'Positionnement', exam: 'Examen', checkup: 'Bilan' };

/** Courbe des scores aux tests dans le temps (une seule série, survol = détail). */
export function ScoreChart({ history }: { history: TestRecord[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const data = history.slice(-20);
  if (data.length === 0) return null;
  const W = 320, H = 150, L = 30, R = 10, T = 12, B = 22;
  const x = (i: number) => (data.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (data.length - 1));
  const y = (v: number) => T + (1 - v) * (H - T - B);
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.score)}`).join(' ');
  const h = hover != null ? data[hover] : null;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Évolution des scores aux tests">
        {[0, 0.5, 0.8, 1].map((g) => (
          <g key={g}>
            <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} strokeWidth={1} strokeDasharray={g === 0.8 ? '3 3' : undefined} className="stroke-stone-200 dark:stroke-stone-800" />
            <text x={L - 6} y={y(g) + 4} textAnchor="end" className="fill-stone-400 text-[10px]">{Math.round(g * 100)}</text>
          </g>
        ))}
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} strokeWidth={1} className="stroke-stone-300 dark:stroke-stone-600" />}
        {data.map((d, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(hover === i ? null : i)}>
            <circle cx={x(i)} cy={y(d.score)} r={14} fill="transparent" />
            <circle cx={x(i)} cy={y(d.score)} r={hover === i ? 5.5 : 4} fill="var(--accent)" strokeWidth={2} className="stroke-white dark:stroke-stone-900" />
          </g>
        ))}
        <text x={L} y={H - 6} className="fill-stone-400 text-[10px]">{new Date(data[0].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</text>
        {data.length > 1 && <text x={W - R} y={H - 6} textAnchor="end" className="fill-stone-400 text-[10px]">{new Date(data[data.length - 1].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</text>}
      </svg>
      {h && (
        <div className="pointer-events-none absolute top-0 rounded-lg bg-stone-900 px-2 py-1 text-xs text-white shadow dark:bg-white dark:text-stone-900"
          style={{ left: `clamp(0px, calc(${(x(hover!) / W) * 100}% - 60px), calc(100% - 130px))` }}>
          <b>{Math.round(h.score * 100)} %</b> · {KIND[h.kind]}{h.level ? ` N${h.level}` : ''}<br />{new Date(h.date).toLocaleDateString('fr-FR')}
        </div>
      )}
    </div>
  );
}
