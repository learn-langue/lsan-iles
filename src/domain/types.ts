export type Lang = 'darija' | 'kabyle';
export type Register = 'poli' | 'neutre' | 'familier' | 'affectueux';

/** Un texte affichable : darija (chat/latin/ar) ou kabyle (text/ascii). */
export interface Written {
  chat?: string;
  latin?: string;
  ar?: string;
  text?: string;
  ascii?: string;
}

export interface VocabItem extends Written {
  id: string;
  fr: string;
  pos: string;
  register: Register;
  mnemonic?: string;
  note?: string;
  variants?: string[];
  answer?: Written & { fr: string };
}

export interface GrammarNote {
  id: string;
  title: string;
  body: string;
  examples: (Written & { fr: string })[];
}

export interface ContextPhrase extends Written {
  id: string;
  fr: string;
  when: string;
  with: string;
  register: Register;
  culturalNote: string;
}

export type ReplyScore = 'natural' | 'ok' | 'wrong';
export interface ReplyOption extends Written {
  fr: string;
  score: ReplyScore;
  feedback: string;
  reaction?: Written & { fr: string };
}
export interface BuildSpec extends Written {
  answer: string[];
  distractors: string[];
  alternatives?: string[][];
  fr: string;
}
export type ChatTurn =
  | ({ from: 'them'; fr: string } & Written)
  | { from: 'me'; prompt: string; options: ReplyOption[] }
  | { from: 'me'; prompt: string; build: BuildSpec };

export interface Dialogue {
  id: string;
  type: 'chatSim';
  title: string;
  contact: { name: string; avatar: string; relation: string; register: string };
  turns: ChatTurn[];
}

export interface ClozeBlank { options: string[]; answer: string; hint?: string }

export type Exercise =
  | { id: string; type: 'matchPairs'; instruction: string; pairs: string[] }
  | { id: string; type: 'sentenceBuilder'; instruction: string; fr: string; answer: string[]; alternatives?: string[][]; distractors: string[]; explanation?: string }
  | { id: string; type: 'cloze'; instruction: string; lines: ({ who: string } & Written)[]; blanks: Record<string, ClozeBlank>; explanation?: string }
  | { id: string; type: 'registerHunt' | 'genreHunt'; instruction: string; context?: string; tokens: string[]; intruderIndex: number; fix: string; explanation: string }
  | { id: string; type: 'registerSort'; instruction: string; bins: { id: string; label: string; avatar: string }[]; items: (Written & { bin: string })[]; explanation?: string }
  | { id: string; type: 'hiddenDigit' | 'letterHunt'; instruction: string; items: { masked: string; answer: string; full: string }[]; options: string[] }
  | { id: string; type: 'typeAnswer'; instruction: string; fr: string; accept: string[]; asciiTolerance?: boolean; explanation?: string }
  | { id: string; type: 'mcq'; instruction: string; options: string[]; answer: string; explanation?: string }
  | { id: string; type: 'flashcard'; vocabId: string }
  | { id: string; type: 'dialogue'; dialogueId: string };

export interface Lesson {
  id: string;
  language: Lang;
  level: number;
  order: number;
  title: string;
  goal: string;
  estimatedMinutes: number;
  regionNote?: string;
  grammarNotes: GrammarNote[];
  vocabulary: VocabItem[];
  contextPhrases: ContextPhrase[];
  dialogues: Dialogue[];
  exercises: Exercise[];
  srs: { introduce: string[]; bonus: string[] };
}

export interface LevelMeta { level: number; title: string; subtitle: string }
