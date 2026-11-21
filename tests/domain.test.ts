import { describe, expect, it } from 'vitest';
import { fold, gradeAnswer, sameTiles } from '../src/domain/grading';
import { isFragile, newCard, review, strength } from '../src/domain/srs';
import { bumpStreak, starsFor, visibleStreak } from '../src/domain/progress';
import { addDays } from '../src/domain/dates';

describe('correction tolérante', () => {
  it('accepte les chiffres et leurs équivalents en darija', () => {
    expect(gradeAnswer('darija', 'Ana smiti Lina !', ['ana smiti lina']).status).toBe('exact');
    expect(gradeAnswer('darija', 'ya3tik sa7a', ['ya3tik saha']).status).toBe('accepted');
    expect(gradeAnswer('darija', 'yatik saha', ['ya3tik saha']).status).toBe('accepted');
    expect(gradeAnswer('darija', 'ki rak', ['kirak']).status).toBe('exact');
    expect(fold('darija', 'choukran')).toBe(fold('darija', 'chokran'));
  });
  it('accepte les lettres kabyles saisies sans clavier spécial', () => {
    expect(gradeAnswer('kabyle', 'ur fhimegh ara', ['ur fhimeɣ ara']).status).toBe('accepted');
    expect(gradeAnswer('kabyle', 'ma d kecc ?', ['ma d kečč ?']).status).toBe('accepted');
    expect(gradeAnswer('kabyle', 'ma d tchetch', ['ma d kečč ?']).status).toBe('wrong');
  });
  it('signale une faute de frappe sans la refuser', () => {
    expect(gradeAnswer('kabyle', 'tanemirtt', ['tanemmirt']).status).toBe('accepted');
    expect(gradeAnswer('kabyle', 'tanimmirt', ['tanemmirt']).status).toBe('almost');
    expect(gradeAnswer('kabyle', 'tanemmirk', ['tanemmirt']).status).toBe('wrong');
  });
  it('garde la distinction de genre', () => {
    expect(gradeAnswer('darija', 'smahli', ['smahili']).status).toBe('wrong');
    expect(gradeAnswer('kabyle', 'isem-ik', ['isem-im']).status).toBe('wrong');
  });
  it('compare les tuiles en ignorant la ponctuation', () => {
    expect(sameTiles(['wesh', 'khouya', 'kirak'], ['wesh', 'khouya', ',', 'kirak', '?'])).toBe(true);
    expect(sameTiles(['khouya', 'wesh', 'kirak'], ['wesh', 'khouya', 'kirak'])).toBe(false);
  });
});

describe('répétition espacée', () => {
  const today = '2026-11-21';
  it('fait grandir les intervalles', () => {
    let c = review(newCard(today), 'good', today);
    expect(c.interval).toBe(1);
    expect(c.due).toBe('2026-11-22');
    c = review(c, 'good', today);
    expect(c.interval).toBe(2);
    c = review(c, 'easy', today);
    expect(c.interval).toBeGreaterThanOrEqual(5);
  });
  it('« À revoir » remet à 1 jour et baisse la facilité', () => {
    let c = review(newCard(today), 'easy', today);
    c = review(c, 'again', today);
    expect(c.interval).toBe(1);
    expect(c.ease).toBeLessThan(2.65);
    expect(c.lapses).toBe(1);
  });
  it('détecte les mots fragiles', () => {
    let c = newCard(today);
    c = review(review(c, 'again', today), 'again', today);
    expect(isFragile(c)).toBe(true);
    expect(strength(undefined)).toBe(0);
  });
});

describe('série et étoiles', () => {
  it('compte les jours consécutifs', () => {
    let s = { current: 0, best: 0, lastDay: null as string | null };
    s = bumpStreak(s, '2026-11-20');
    s = bumpStreak(s, '2026-11-21');
    s = bumpStreak(s, '2026-11-21');
    expect(s.current).toBe(2);
    expect(visibleStreak(s, '2026-11-22')).toBe(2);
    expect(visibleStreak(s, '2026-11-24')).toBe(0);
    expect(bumpStreak(s, '2026-11-25').current).toBe(1);
  });
  it('gère les changements de mois', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
  });
  it('attribue les étoiles', () => {
    expect(starsFor(1)).toBe(3);
    expect(starsFor(0.85)).toBe(2);
    expect(starsFor(0.3)).toBe(1);
  });
});
