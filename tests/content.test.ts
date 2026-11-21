import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Lesson, Written } from '../src/domain/types';
import { buildLessonSteps } from '../src/domain/session';
import { generateTest } from '../src/domain/testgen';
import { basic } from '../src/domain/grading';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\/n\d+\/.*\.json$/.test(p) ? [p] : [];
  });
}

const lessons: Lesson[] = walk('src/content').map((f) => JSON.parse(readFileSync(f, 'utf8')));

describe('corpus', () => {
  it('contient au moins une leçon par langue', () => {
    expect(lessons.some((l) => l.language === 'darija')).toBe(true);
    expect(lessons.some((l) => l.language === 'kabyle')).toBe(true);
  });

  it('a des identifiants uniques', () => {
    const ids = lessons.flatMap((l) => [l.id, ...l.vocabulary.map((v) => v.id), ...l.exercises.map((e) => e.id), ...l.dialogues.map((d) => d.id)]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const lesson of lessons) {
    describe(lesson.id, () => {
      const vocab = new Set(lesson.vocabulary.map((v) => v.id));
      const key = lesson.language === 'darija' ? 'chat' : 'text';

      it('chaque mot a sa forme écrite et sa traduction', () => {
        for (const v of lesson.vocabulary) {
          expect(v[key], v.id).toBeTruthy();
          expect(v.fr, v.id).toBeTruthy();
        }
      });

      it('les listes SRS pointent vers des mots existants', () => {
        for (const id of [...lesson.srs.introduce, ...lesson.srs.bonus]) expect(vocab.has(id), id).toBe(true);
      });

      it('les exercices sont cohérents', () => {
        for (const e of lesson.exercises) {
          switch (e.type) {
            case 'matchPairs': e.pairs.forEach((id) => expect(vocab.has(id), `${e.id}:${id}`).toBe(true)); break;
            case 'mcq': expect(e.options, e.id).toContain(e.answer); break;
            case 'registerHunt':
            case 'genreHunt': expect(e.tokens[e.intruderIndex], e.id).toBeTruthy(); break;
            case 'registerSort': e.items.forEach((it) => expect(e.bins.map((b) => b.id), e.id).toContain(it.bin)); break;
            case 'letterHunt':
            case 'hiddenDigit':
              e.items.forEach((it) => {
                expect(e.options, e.id).toContain(it.answer);
                expect(it.masked.replace('_', it.answer), e.id).toBe(it.full);
              });
              break;
            case 'cloze': {
              const text = e.lines.map((l) => l[key] ?? '').join(' ');
              const holes = [...text.matchAll(/\{\{(\d+)\}\}/g)].map((m) => m[1]).sort();
              expect(holes, e.id).toEqual(Object.keys(e.blanks).sort());
              Object.values(e.blanks).forEach((b) => expect(b.options, e.id).toContain(b.answer));
              break;
            }
            case 'sentenceBuilder':
              expect(e.answer.length, e.id).toBeGreaterThan(0);
              e.distractors.forEach((d) => expect(e.answer.map(basic), `${e.id} : l'intrus « ${d} » est aussi dans la réponse`).not.toContain(basic(d)));
              break;
            case 'typeAnswer': expect(e.accept.length, e.id).toBeGreaterThan(0); break;
          }
        }
      });

      it('les dialogues ont toujours une réponse naturelle', () => {
        for (const d of lesson.dialogues) {
          for (const t of d.turns) {
            if ('options' in t) expect(t.options.some((o) => o.score === 'natural'), d.id).toBe(true);
            if ('build' in t) expect(t.build.answer.length, d.id).toBeGreaterThan(0);
            if (t.from === 'them') expect(t[key], d.id).toBeTruthy();
          }
        }
      });

      it('le déroulé de leçon inclut tous les exercices et dialogues', () => {
        const steps = buildLessonSteps(lesson);
        const ids = steps.flatMap((s) => (s.kind === 'exercise' ? [s.exercise.id] : []));
        lesson.exercises.forEach((e) => expect(ids, e.id).toContain(e.id));
        lesson.dialogues.forEach((d) => expect(ids, d.id).toContain(`${d.id}-play`));
      });

      it('permet de générer un examen complet', () => {
        const display = (w: Written) => w[key] ?? '';
        const qs = generateTest([lesson], lessons.filter((l) => l.language === lesson.language), display);
        expect(qs.length).toBe(12);
        qs.filter((q) => q.exercise.type === 'mcq').forEach((q) => {
          const e = q.exercise as { options: string[]; answer: string };
          expect(e.options).toContain(e.answer);
          expect(new Set(e.options).size).toBe(e.options.length);
        });
      });
    });
  }
});
