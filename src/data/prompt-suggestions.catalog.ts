/**
 * [L1] EXW.L1.PROMPT_SUGGESTIONS | v5.0.0 | SADT A2.1
 * Clickable suggestion bubbles for instant text injection across Scenario Generator,
 * Freeform Directives, Diplomacy Chat, and Next Colonist Arrival prompts.
 */
export type SuggestionDomain = 'ARRIVAL' | 'DIRECTIVE' | 'DIPLOMACY' | 'SCENARIO';

export const PROMPT_SUGGESTION_CHIPS: Readonly<Record<SuggestionDomain, readonly string[]>> = Object.freeze({
  ARRIVAL: [
    'Ingénieur atmosphérique spécialisé en capture carbone et maintenance Maglev',
    'Médecin biologiste formé en santé communautaire et résilience respiratoire',
    'Agronome hydroponique issu des cités côtières pour stabiliser les vivres',
    'Diplomate humaniste capable d’apaiser la pression civile inter-quartiers',
  ],
  DIRECTIVE: [
    'Déployer un plan d’urgence air pur et distribution de kits O₂ dans les quartiers industriels',
    'Réorienter 20% du surplus énergétique vers les datacenters et la recherche Éden',
    'Ouvrir un pacte civique de transparence budgétaire pour renforcer l’approbation',
    'Mobiliser les drones de construction pour restaurer les secteurs sous 80% d’intégrité',
  ],
  DIPLOMACY: [
    'Proposer un couloir commercial eau & matériaux avec garantie de non-agression',
    'Demander une médiation privée pour réduire la tension frontalière sur le secteur #18',
    'Partager nos relevés atmosphériques en échange d’un transfert technologique',
    'Exiger le retrait immédiat des drones de reconnaissance hors de notre orbite',
  ],
  SCENARIO: [
    'Crise solaire majeure en 2054 : maintenir le réseau électrique sous tempête magnétique',
    'Renaissance Éden : coopération pacifique des 5 puissances vers une biosphère respirable',
    'Blocus orbital commercial : survivre en autarcie grâce au Maglev et aux cités autonomes',
    'Éveil des polities locales : diplomatie éthique face aux communautés pré-spatiales',
  ],
});
