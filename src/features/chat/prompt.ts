import type { Lang } from '../../domain/types';
import type { Scenario } from './scenarios';

export interface TutorReply {
  reply: string;
  translation: string;
  words: { w: string; fr: string }[];
  correction: null | { ok: boolean; corrected: string; explanation: string; natural?: string };
}

const LANG_RULES: Record<Lang, string> = {
  darija: `Tu parles UNIQUEMENT en darija ALGÉRIENNE (dialecte du centre, Alger), jamais en arabe littéraire (pas de « kayfa haluk », « laysa », « sawfa »), et pas en darija marocaine (pas de « bghit », « daba », « 3afak »). Écris en alphabet latin façon WhatsApp algérien, avec les chiffres 3 (ع), 7 (ح), 9 (ق) : « wach rak ? », « l7amdoulah », « ya3tik saha ». Les mots français courants que les Algériens utilisent sont permis, avec modération.`,
  kabyle: `Tu parles UNIQUEMENT en kabyle (taqbaylit, Grande Kabylie), en orthographe latine standard avec les lettres ɣ ɛ č ǧ ḥ ḍ ṭ ṣ ẓ ṛ : « amek telliḍ ? », « tanemmirt », « ulac aɣilif ». Respecte l'accord en genre (-k/-ik pour un homme, -m/-im pour une femme). Si tu n'es pas sûr d'une forme, choisis une phrase plus simple que tu maîtrises.`,
};

const LEVEL_RULES = [
  '',
  'Niveau 1 (grand débutant) : phrases très courtes (5 à 8 mots), vocabulaire des salutations et de la politesse, une seule question à la fois.',
  'Niveau 2 : phrases courtes, présent et passé simple, famille, maison, nourriture, chiffres.',
  'Niveau 3 : phrases naturelles avec expressions idiomatiques courantes, on peut raconter et donner son avis.',
  'Niveau 4 : parle naturellement, avec proverbes et nuances culturelles occasionnels.',
];

export function systemPrompt(lang: Lang, level: number, scenario: Scenario, knownWords: string[], learnerGender: 'f' | 'm' | 'x'): string {
  const gender = learnerGender === 'f' ? "L'apprenant est une femme : accorde au féminin quand tu lui parles." : learnerGender === 'm' ? "L'apprenant est un homme : accorde au masculin quand tu lui parles." : "Le genre de l'apprenant n'est pas connu : demande-le gentiment s'il le faut pour accorder correctement.";
  return `Tu es un tuteur de langue bienveillant qui joue un rôle dans une mise en situation, pour un francophone qui apprend.

LANGUE : ${LANG_RULES[lang]}
NIVEAU : ${LEVEL_RULES[Math.min(4, Math.max(1, level))]}
${gender}
SCÉNARIO : ${scenario.brief}
MOTS DÉJÀ VUS PAR L'APPRENANT (à réutiliser en priorité) : ${knownWords.slice(0, 80).join(', ') || '(aucun)'}

RÈGLES :
- Reste dans ton rôle, réponds en 1 ou 2 phrases maximum, et termine souvent par une question pour relancer.
- Corrige le DERNIER message de l'apprenant avec bienveillance. S'il a écrit en français, propose la version dans la langue cible.
- N'utilise ni audio ni phonétique API : uniquement l'écriture décrite ci-dessus.

RÉPONDS UNIQUEMENT avec un objet JSON valide, sans texte autour, de la forme :
{
  "reply": "ta réplique dans la langue cible",
  "translation": "traduction française de ta réplique",
  "words": [{ "w": "mot ou groupe de mots de ta réplique", "fr": "sens en français" }],
  "correction": null ou {
    "ok": true si le message de l'apprenant était correct et naturel,
    "corrected": "son message corrigé dans la langue cible",
    "explanation": "explication courte en français, encourageante",
    "natural": "facultatif : une formulation encore plus naturelle"
  }
}
Pour le tout premier message (pas encore de message de l'apprenant), "correction" vaut null.`;
}

/** Extrait le JSON même si le modèle l'entoure de ```json … ```. */
export function parseReply(raw: string): TutorReply {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const obj = JSON.parse(start >= 0 ? cleaned.slice(start, end + 1) : cleaned);
  return {
    reply: String(obj.reply ?? ''),
    translation: String(obj.translation ?? ''),
    words: Array.isArray(obj.words) ? obj.words.filter((x: { w?: unknown }) => x && x.w).map((x: { w: unknown; fr?: unknown }) => ({ w: String(x.w), fr: String(x.fr ?? '') })) : [],
    correction: obj.correction && typeof obj.correction === 'object' ? { ok: !!obj.correction.ok, corrected: String(obj.correction.corrected ?? ''), explanation: String(obj.correction.explanation ?? ''), natural: obj.correction.natural ? String(obj.correction.natural) : undefined } : null,
  };
}
