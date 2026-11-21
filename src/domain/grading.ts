import type { Lang } from './types';

export type GradeStatus = 'exact' | 'accepted' | 'almost' | 'wrong';
export interface GradeResult { status: GradeStatus; expected: string; hint?: string }

/** Normalisation légère : casse, ponctuation, espaces, tirets, apostrophes. */
export function basic(s: string): string {
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/ε/g, 'ɛ')
    .replace(/[’`´]/g, "'")
    .replace(/[.,!?;:…«»"()]/g, ' ')
    .replace(/[\s\-']+/g, '')
    .trim();
}

const DARIJA_FOLD: [RegExp, string][] = [
  [/ḥ/g, 'h'], [/7/g, 'h'], [/ʿ/g, 'a'], [/3/g, 'a'], [/9/g, 'q'], [/ṣ/g, 's'], [/ṭ/g, 't'], [/ḍ/g, 'd'],
  [/5/g, 'kh'], [/8/g, 'gh'], [/sh/g, 'ch'], [/ou/g, 'u'], [/o/g, 'u'], [/é|è|ê/g, 'e'], [/ʾ|2/g, ''],
];
const KABYLE_FOLD: [RegExp, string][] = [
  [/ɣ/g, 'gh'], [/ɛ/g, '3'], [/tch/g, 'c'], [/č/g, 'c'], [/ǧ/g, 'j'], [/dj/g, 'j'],
  [/ḍ/g, 'd'], [/ṭ/g, 't'], [/ṣ/g, 's'], [/ẓ/g, 'z'], [/ṛ/g, 'r'], [/ḥ/g, 'h'], [/ţ/g, 't'], [/é|è|ê/g, 'e'],
];

/** Normalisation tolérante : chiffres/lettres spéciales repliés, lettres doublées réduites. */
export function fold(lang: Lang, s: string): string {
  let out = basic(s);
  for (const [re, rep] of lang === 'darija' ? DARIJA_FOLD : KABYLE_FOLD) out = out.replace(re, rep);
  return out.replace(/(.)\1+/g, '$1');
}

export function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

function foldWords(lang: Lang, s: string): string[] {
  return s.split(/[\s\-']+/).map((x) => fold(lang, x)).filter(Boolean);
}

/**
 * Faute de frappe tolérée : un seul mot diffère, d'une seule lettre, et pas dans ses 3 dernières lettres.
 * La fin des mots porte le genre (isem-ik / isem-im, smahli / smahili) : on ne la « pardonne » jamais.
 */
export function isTypo(lang: Lang, input: string, target: string): boolean {
  const a = foldWords(lang, input);
  const b = foldWords(lang, target);
  if (a.length !== b.length) return false;
  const diff = a.map((w, i) => [w, b[i]] as const).filter(([x, y]) => x !== y);
  if (diff.length !== 1) return false;
  const [x, y] = diff[0];
  if (Math.min(x.length, y.length) < 4 || levenshtein(x, y) !== 1) return false;
  let suffix = 0;
  while (suffix < Math.min(x.length, y.length) && x[x.length - 1 - suffix] === y[y.length - 1 - suffix]) suffix++;
  return suffix >= 3;
}

/** Compare une réponse libre à une liste de formes acceptées. */
export function gradeAnswer(lang: Lang, input: string, accept: string[]): GradeResult {
  const expected = accept[0] ?? '';
  const raw = basic(input);
  if (!raw) return { status: 'wrong', expected };
  if (accept.some((a) => basic(a) === raw)) return { status: 'exact', expected };
  const folded = fold(lang, input);
  if (accept.some((a) => fold(lang, a) === folded)) {
    return {
      status: 'accepted',
      expected,
      hint: lang === 'kabyle' ? `Accepté ! Forme soignée : « ${expected} ».` : `Accepté ! On l'écrit souvent « ${expected} ».`,
    };
  }
  if (accept.some((a) => isTypo(lang, input, a))) {
    return { status: 'almost', expected, hint: `Presque ! Une petite faute : « ${expected} ».` };
  }
  return { status: 'wrong', expected };
}

/** Compare deux suites de tuiles (constructeur de phrases), ponctuation ignorée. */
export function sameTiles(a: string[], b: string[]): boolean {
  const clean = (t: string[]) => t.filter((x) => !/^[.,!?;:]$/.test(x)).map(basic);
  const ca = clean(a);
  const cb = clean(b);
  return ca.length === cb.length && ca.every((x, i) => x === cb[i]);
}
