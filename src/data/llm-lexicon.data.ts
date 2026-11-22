/**
 * [L1] EXW.L1.LLM_LEXICON | v4.0.0-rc.1 | SADT A1.2
 * Canonical LLM Lexicon & RPG / Citybuilder / 4X 2050 Glossary.
 * Translates arcane, archaic, legalistic, or technical jargon (e.g. "affermer",
 * "péréquation", "emphytéose", "stochastique") into crystal-clear RPG / Citybuilder
 * game terminology, and defines preferred 2050 domain vocabulary for Gemini prompts.
 */

export type LlmLexiconCategory = 'CITYBUILDER' | 'RPG' | 'STRATEGY_4X' | 'TECH_CLEAN';

export interface LlmLexiconRule {
  readonly id: string;
  readonly category: LlmLexiconCategory;
  readonly sourceLabel: string;
  readonly patterns: readonly string[];
  readonly replacement: string;
  readonly note: string;
}

export interface PreferredGameTerm {
  readonly term: string;
  readonly category: LlmLexiconCategory;
  readonly meaning: string;
}

export const LEXICON_CATEGORY_LABELS: Record<LlmLexiconCategory, string> = {
  CITYBUILDER: 'Citybuilder & Urbanisme',
  RPG: 'RPG, Colons & Quêtes',
  STRATEGY_4X: '4X, Flotte & Diplomatie',
  TECH_CLEAN: 'Anti-Jargon Technique',
};

export const LLM_LEXICON_RULES: readonly LlmLexiconRule[] = [
  // === CITYBUILDER & URBANISME ===
  {
    id: 'cb-affermer-inf',
    category: 'CITYBUILDER',
    sourceLabel: 'affermer',
    patterns: ['affermer'],
    replacement: 'mettre en concession',
    note: 'Remplace le vieux terme fiscal par une mécanique lisible de Citybuilder.',
  },
  {
    id: 'cb-affermage',
    category: 'CITYBUILDER',
    sourceLabel: 'affermage / affermages',
    patterns: ['affermages', 'affermage'],
    replacement: 'concession de quartier',
    note: 'Contrat de gestion d’un quartier ou d’une infrastructure.',
  },
  {
    id: 'cb-afferme',
    category: 'CITYBUILDER',
    sourceLabel: 'affermé(e)(s)',
    patterns: ['affermées', 'affermés', 'affermée', 'affermé'],
    replacement: 'placé sous concession',
    note: 'Participe passé lisible pour les bâtiments et ressources.',
  },
  {
    id: 'cb-emphyteose',
    category: 'CITYBUILDER',
    sourceLabel: 'emphytéose / emphytéotique',
    patterns: ['emphytéotiques', 'emphytéotique', 'emphytéoses', 'emphytéose'],
    replacement: 'bail longue durée',
    note: 'Terme clair de gestion foncière de colonie.',
  },
  {
    id: 'cb-perequation',
    category: 'CITYBUILDER',
    sourceLabel: 'péréquation',
    patterns: ['péréquations', 'péréquation'],
    replacement: 'redistribution budgétaire',
    note: 'Redistribution directe entre quartiers excédentaires et déficitaires.',
  },
  {
    id: 'cb-contingenter',
    category: 'CITYBUILDER',
    sourceLabel: 'contingenter / contingentement',
    patterns: ['contingentements', 'contingentement', 'contingenter'],
    replacement: 'rationner',
    note: 'Action immédiate de gestion de stocks en Citybuilder.',
  },
  {
    id: 'cb-oberer',
    category: 'CITYBUILDER',
    sourceLabel: 'obérer / obère / obéré',
    patterns: ['obérées', 'obérés', 'obérée', 'obéré', 'obèrent', 'obère', 'obérer'],
    replacement: 'alourdir le budget',
    note: 'Impact compréhensible sur les Crédits Fédéraux.',
  },
  {
    id: 'cb-octroi',
    category: 'CITYBUILDER',
    sourceLabel: 'octroi',
    patterns: ['octrois', 'octroi'],
    replacement: 'taxe de transit',
    note: 'Prélèvement clair sur les échanges entre secteurs.',
  },
  {
    id: 'cb-dime',
    category: 'CITYBUILDER',
    sourceLabel: 'dîme',
    patterns: ['dîmes', 'dîme'],
    replacement: 'prélèvement de production',
    note: 'Évite l’anachronisme médiéval dans un univers 2050.',
  },
  {
    id: 'cb-corvee',
    category: 'CITYBUILDER',
    sourceLabel: 'corvée',
    patterns: ['corvées', 'corvée'],
    replacement: 'réquisition de main-d’œuvre',
    note: 'Relie directement au bassin de main-d’œuvre des colons.',
  },
  {
    id: 'cb-caduque',
    category: 'CITYBUILDER',
    sourceLabel: 'caduc / caduque',
    patterns: ['caduques', 'caduque', 'caducs', 'caduc'],
    replacement: 'expiré',
    note: 'Indique clairement la fin de validité d’un contrat ou dossier.',
  },
  {
    id: 'cb-voirie',
    category: 'CITYBUILDER',
    sourceLabel: 'voirie',
    patterns: ['voiries', 'voirie'],
    replacement: 'réseau de liaison urbain',
    note: 'Vocabulaire Citybuilder futuriste (viaduc, transit, logistique).',
  },
  {
    id: 'cb-prebende',
    category: 'CITYBUILDER',
    sourceLabel: 'prébende / sinécure',
    patterns: ['prébendes', 'prébende', 'sinécures', 'sinécure'],
    replacement: 'rente administrative',
    note: 'Évite les archaïsmes littéraires peu parlants en jeu.',
  },
  {
    id: 'cb-allodial',
    category: 'CITYBUILDER',
    sourceLabel: 'allodial / franc-alleu',
    patterns: ['franc-alleu', 'allodiales', 'allodiaux', 'allodiale', 'allodial'],
    replacement: 'zone franche',
    note: 'Terme économique moderne compréhensible immédiatement.',
  },

  // === RPG, COLONS & QUÊTES ===
  {
    id: 'rpg-subroger',
    category: 'RPG',
    sourceLabel: 'subroger / subrogation',
    patterns: ['subrogations', 'subrogation', 'subrogé', 'subroger'],
    replacement: 'assigner un remplaçant',
    note: 'Action RPG claire pour les créneaux de spécialistes.',
  },
  {
    id: 'rpg-delegataire',
    category: 'RPG',
    sourceLabel: 'délégataire',
    patterns: ['délégataires', 'délégataire'],
    replacement: 'chef de secteur',
    note: 'Rôle incarné compréhensible pour le joueur.',
  },
  {
    id: 'rpg-ressortissant',
    category: 'RPG',
    sourceLabel: 'ressortissant',
    patterns: ['ressortissantes', 'ressortissants', 'ressortissante', 'ressortissant'],
    replacement: 'colon',
    note: 'Uniformise le vocabulaire sur les colons RPG de la colonie.',
  },
  {
    id: 'rpg-morigener',
    category: 'RPG',
    sourceLabel: 'morigéner',
    patterns: ['morigéné', 'morigéner'],
    replacement: 'recadrer le moral',
    note: 'Relie directement à la jauge de moral et d’approbation.',
  },
  {
    id: 'rpg-mandant',
    category: 'RPG',
    sourceLabel: 'mandant',
    patterns: ['mandants', 'mandant'],
    replacement: 'commandant',
    note: 'S’adresse directement au rôle du joueur.',
  },
  {
    id: 'rpg-prevarication',
    category: 'RPG',
    sourceLabel: 'prévarication / concussion',
    patterns: ['prévarications', 'prévarication', 'concussions', 'concussion'],
    replacement: 'détournement de crédits',
    note: 'Formule directe et concrète pour une quête ou crise interne.',
  },
  {
    id: 'rpg-compagnonnage',
    category: 'RPG',
    sourceLabel: 'compagnonnage',
    patterns: ['compagnonnages', 'compagnonnage'],
    replacement: 'formation de spécialistes',
    note: 'Fait écho à la montée de niveau RPG des colons.',
  },

  // === 4X, FLOTTE & DIPLOMATIE ===
  {
    id: '4x-regalien',
    category: 'STRATEGY_4X',
    sourceLabel: 'régalien(ne)',
    patterns: ['régaliennes', 'régaliens', 'régalienne', 'régalien'],
    replacement: 'souverain',
    note: 'Vocabulaire 4X limpide pour la gouvernance et la défense.',
  },
  {
    id: '4x-suzerainete',
    category: 'STRATEGY_4X',
    sourceLabel: 'suzeraineté',
    patterns: ['suzerainetés', 'suzeraineté'],
    replacement: 'contrôle de secteur',
    note: 'Terme territorial 4X concret.',
  },
  {
    id: '4x-vassaliser',
    category: 'STRATEGY_4X',
    sourceLabel: 'vassaliser / vassalité',
    patterns: ['vassalités', 'vassalité', 'vassalisé', 'vassaliser'],
    replacement: 'placer sous protectorat',
    note: 'Action diplomatique 2050 cohérente.',
  },
  {
    id: '4x-casus-belli',
    category: 'STRATEGY_4X',
    sourceLabel: 'casus belli',
    patterns: ['casus belli'],
    replacement: 'motif de conflit',
    note: 'Évite les locutions latines abstraites.',
  },
  {
    id: '4x-belligérance',
    category: 'STRATEGY_4X',
    sourceLabel: 'belligérance',
    patterns: ['belligérances', 'belligérance'],
    replacement: 'état de conflit',
    note: 'Clarifie immédiatement la posture militaire.',
  },
  {
    id: '4x-exogene',
    category: 'STRATEGY_4X',
    sourceLabel: 'exogène',
    patterns: ['exogènes', 'exogène'],
    replacement: 'externe',
    note: 'Plus fluide et direct dans un briefing de crise.',
  },
  {
    id: '4x-endogene',
    category: 'STRATEGY_4X',
    sourceLabel: 'endogène',
    patterns: ['endogènes', 'endogène'],
    replacement: 'interne',
    note: 'Plus lisible pour les crises de colonie.',
  },

  // === ANTI-JARGON TECHNIQUE / INFORMATIQUE ===
  {
    id: 'tech-stochastique',
    category: 'TECH_CLEAN',
    sourceLabel: 'stochastique',
    patterns: ['stochastiques', 'stochastique'],
    replacement: 'aléatoire',
    note: 'Remplace le jargon mathématique dans les textes narratifs.',
  },
  {
    id: 'tech-heuristique',
    category: 'TECH_CLEAN',
    sourceLabel: 'heuristique',
    patterns: ['heuristiques', 'heuristique'],
    replacement: 'estimation tactique',
    note: 'Vocabulaire naturel de commandement.',
  },
  {
    id: 'tech-idempotent',
    category: 'TECH_CLEAN',
    sourceLabel: 'idempotent',
    patterns: ['idempotentes', 'idempotents', 'idempotente', 'idempotent'],
    replacement: 'stable',
    note: 'Évite le vocabulaire d’ingénierie logicielle dans le jeu.',
  },
  {
    id: 'tech-ontologie',
    category: 'TECH_CLEAN',
    sourceLabel: 'ontologie',
    patterns: ['ontologies', 'ontologie'],
    replacement: 'architecture',
    note: 'Reste concret pour le joueur.',
  },
  {
    id: 'tech-pipeline',
    category: 'TECH_CLEAN',
    sourceLabel: 'pipeline',
    patterns: ['pipelines', 'pipeline'],
    replacement: 'circuit de production',
    note: 'Traduit l’anglicisme technique en langage Citybuilder.',
  },
  {
    id: 'tech-fallback',
    category: 'TECH_CLEAN',
    sourceLabel: 'fallback',
    patterns: ['fallbacks', 'fallback'],
    replacement: 'plan de secours',
    note: 'Évite les anglicismes techniques dans les dialogues.',
  },
  {
    id: 'tech-payload',
    category: 'TECH_CLEAN',
    sourceLabel: 'payload',
    patterns: ['payloads', 'payload'],
    replacement: 'cargaison de données',
    note: 'Immersion spatiale 2050 sans jargon API.',
  },
  {
    id: 'tech-snapshot',
    category: 'TECH_CLEAN',
    sourceLabel: 'snapshot',
    patterns: ['snapshots', 'snapshot'],
    replacement: 'archive de tour',
    note: 'Langage naturel de chronique historique.',
  },
];

export const PREFERRED_GAME_TERMS: readonly PreferredGameTerm[] = [
  { term: 'Quartier', category: 'CITYBUILDER', meaning: 'Bâtiment ou district constructible de la cité (Échelle 3).' },
  { term: 'Extension modulaire', category: 'CITYBUILDER', meaning: 'Annexe greffée sur un quartier (0 à 3) pour booster sa production.' },
  { term: 'Concession de quartier', category: 'CITYBUILDER', meaning: 'Contrat de gestion déléguée (à la place d’affermage / emphytéose).' },
  { term: 'Intégrité & Usure', category: 'CITYBUILDER', meaning: 'État structurel des infrastructures nécessitant de la maintenance.' },
  { term: 'Flux (+Δ/tour)', category: 'CITYBUILDER', meaning: 'Bilan net des ressources produites et consommées chaque tour.' },
  { term: 'Colon RPG / Spécialiste', category: 'RPG', meaning: 'Personnage affectable à un poste avec traits, niveau et bonus.' },
  { term: 'Moral & Approbation', category: 'RPG', meaning: 'Confiance populaire de la colonie (0 à 100 %).' },
  { term: 'Charte de Genèse', category: 'RPG', meaning: 'Doctrine fondatrice et promesses tenues par le Commandant.' },
  { term: 'PA / Sous-PA', category: 'RPG', meaning: 'Points d’Action généraux et spécialisés dépensés à chaque tour.' },
  { term: 'Secteur (0–71)', category: 'STRATEGY_4X', meaning: 'Territoire géodésique de la planète à explorer, défendre ou conquérir.' },
  { term: 'Escadrille & Garnison', category: 'STRATEGY_4X', meaning: 'Unités de drones/vaisseaux et forces de défense planétaire.' },
  { term: 'Étoiles d’Ère', category: 'STRATEGY_4X', meaning: 'Jalons de progression permettant de franchir les 6 Ères.' },
  { term: 'Atmosphère P1 → P4', category: 'STRATEGY_4X', meaning: 'Stades progressifs de terraformation planétaire.' },
  { term: 'Arbitrage exécutif', category: 'STRATEGY_4X', meaning: 'Dossier de crise ou d’opportunité à trancher avant la fin du tour.' },
  { term: 'Plan de secours', category: 'TECH_CLEAN', meaning: 'Solution de repli fiable (à la place de fallback).' },
  { term: 'Circuit de production', category: 'TECH_CLEAN', meaning: 'Flux industriel de transformation (à la place de pipeline).' },
];
