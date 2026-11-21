export interface Scenario { id: string; icon: string; title: string; brief: string; minLevel: number }

export const SCENARIOS: Scenario[] = [
  { id: 'cafe', icon: '☕', title: 'Commander au café', brief: "Tu es le serveur d'un café de quartier. L'apprenant vient commander un café, un thé ou un jus, puis payer.", minLevel: 1 },
  { id: 'famille', icon: '🏡', title: 'Rendre visite à la famille', brief: "Tu es une tante âgée qui accueille l'apprenant chez elle : salutations longues, nouvelles de la famille, on propose à manger.", minLevel: 1 },
  { id: 'journee', icon: '🗓️', title: 'Parler de sa journée', brief: "Tu es un cousin du même âge qui demande à l'apprenant comment s'est passée sa journée et ce qu'il a fait.", minLevel: 2 },
  { id: 'marche', icon: '🍅', title: 'Au marché', brief: "Tu es un vendeur de fruits et légumes. L'apprenant demande les prix et négocie gentiment.", minLevel: 2 },
  { id: 'libre', icon: '💬', title: 'Discussion libre', brief: "Discussion amicale et libre. Tu suis les sujets que l'apprenant propose et tu en proposes si besoin.", minLevel: 1 },
];
