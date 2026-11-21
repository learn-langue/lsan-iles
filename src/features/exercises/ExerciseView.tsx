import type { Exercise } from '../../domain/types';
import { Mcq } from './Mcq';
import { MatchPairs } from './MatchPairs';
import { SentenceBuilder } from './SentenceBuilder';
import { Cloze } from './Cloze';
import { Hunt } from './Hunt';
import { RegisterSort } from './RegisterSort';
import { LetterHunt } from './LetterHunt';
import { TypeAnswer } from './TypeAnswer';
import { ChatSim } from './ChatSim';
import type { ExerciseProps } from './types';

/** Aiguille vers le bon composant selon le type d'exercice. */
export function ExerciseView(props: ExerciseProps<Exercise>) {
  const e = props.exercise;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = props as any;
  switch (e.type) {
    case 'mcq': return <Mcq {...p} />;
    case 'matchPairs': return <MatchPairs {...p} />;
    case 'sentenceBuilder': return <SentenceBuilder {...p} />;
    case 'cloze': return <Cloze {...p} />;
    case 'registerHunt':
    case 'genreHunt': return <Hunt {...p} />;
    case 'registerSort': return <RegisterSort {...p} />;
    case 'letterHunt':
    case 'hiddenDigit': return <LetterHunt {...p} />;
    case 'typeAnswer': return <TypeAnswer {...p} />;
    case 'dialogue': return <ChatSim {...p} />;
    default: return <p>Exercice inconnu : {e.type}</p>;
  }
}
