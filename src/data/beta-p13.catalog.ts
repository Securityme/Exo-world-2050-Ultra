import type {
  BetaCriterionId,
  BetaQuestionnaireSubmission,
  BetaTesterProfileId,
} from '../contracts/beta-p13.schema.ts';

/**
 * [L1] EXW.L1.BETA_P13_CATALOG | v5.0.0 | SADT A5.3
 * Frozen catalog of the 10 improvement questionnaire criteria, the 5 virtual beta-tester
 * personas from BETA_FEEDBACK_REPORT.md, and clickable suggestion chips for community testers.
 */
export interface BetaCriterionSpec {
  readonly id: BetaCriterionId;
  readonly shortLabel: string;
  readonly label: string;
  readonly category: 'GAMEPLAY' | 'UX_MOBILE' | 'ETHIQUE_IA' | '3D_AUDIO' | 'GOUVERNANCE';
  readonly v51Action: string;
}

export interface BetaProfileOption {
  readonly id: BetaTesterProfileId;
  readonly label: string;
  readonly focus: string;
}

export const BETA_PROFILE_OPTIONS: readonly BetaProfileOption[] = Object.freeze([
  { id: 'COMMUNITY_PLAYER', label: 'Joueur Communauté', focus: 'Expérience globale & fun' },
  { id: 'STRATEGIST_4X', label: 'Stratège 4X / Grand Strategy', focus: 'Boucle PA, Monde, 4 Théâtres' },
  { id: 'MOBILE_SAFARI', label: 'Testeur Mobile & Safari iOS', focus: 'Responsive 390×844, tactile 44px' },
  { id: 'NARRATIVE_ETHICS', label: 'Analyste Narratif & Éthique', focus: 'Badges 3 niveaux, Pax Historia' },
  { id: 'ENGINEER_3D', label: 'Ingénieur 3D / WebGL / Audio', focus: 'Cité 24-Hex, Maglev, FIP Radio' },
  { id: 'DISCOVERY_SOLARPUNK', label: 'Découverte Solarpunk', focus: 'Onboarding, lisibilité & thème' },
]);

export const BETA_CRITERIA_CATALOG: readonly BetaCriterionSpec[] = Object.freeze([
  {
    id: 'LOOP_PA',
    shortLabel: 'Boucle & PA',
    label: '1. Clarté de la boucle Tour par Tour & PA / Sous-PA',
    category: 'GAMEPLAY',
    v51Action: 'Ajouter un raccourci clavier rapide pour dépenser les PA restants depuis Monde',
  },
  {
    id: 'HUD_DESKTOP',
    shortLabel: 'HUD Desktop',
    label: '2. Lisibilité HUD Desktop (1440×900) & absence de collision',
    category: 'UX_MOBILE',
    v51Action: 'Conserver les gardes de boîte englobante et le mode Masquer HUD 100 %',
  },
  {
    id: 'MOBILE_SAFARI',
    shortLabel: 'Mobile & Safari',
    label: '3. Ergonomie Mobile / Safari / iPhone (390×844)',
    category: 'UX_MOBILE',
    v51Action: 'Ajouter un geste swipe entre Monde / Événements / Journal sur écran étroit',
  },
  {
    id: 'THEME_ASTRALIS',
    shortLabel: 'Thème Astralis',
    label: '4. Identité Visuelle Rose Astralis & Studio Thèmes',
    category: 'UX_MOBILE',
    v51Action: 'Proposer un preset « Plein Soleil Contraste Élevé » pour iPhone extérieur',
  },
  {
    id: 'BADGES_ETHICS',
    shortLabel: 'Badges & Éthique',
    label: '5. Profondeur Badges 3 Niveaux & Taxonomie Éthique',
    category: 'ETHIQUE_IA',
    v51Action: 'Ajouter un radar des 5 Pôles Éthiques sur l’ensemble des 6 Ères en fin de campagne',
  },
  {
    id: 'SCENARIO_MATRIX',
    shortLabel: 'Scénario Pax',
    label: '6. Générateur de Scénario Matriciel & Couplage Moteur',
    category: 'GAMEPLAY',
    v51Action: 'Permettre l’export/import JSON signé de scénarios communautaires',
  },
  {
    id: 'HONORS_2TIER',
    shortLabel: 'Honneurs 2 Étages',
    label: '7. Séparation Honneurs 2 Étages (Lobby vs Campagne)',
    category: 'GAMEPLAY',
    v51Action: 'Ajouter un comparateur d’historique multi-campagnes dans le profil',
  },
  {
    id: 'CITY_3D_CLIMATE',
    shortLabel: '3D 24-Hex & Audio',
    label: '8. Qualité 3D (24-Hex, Dual Maglev, Piétons), Climat & Radio FIP',
    category: '3D_AUDIO',
    v51Action: 'Profil qualité adaptatif mobile (Éco / Standard / Ultra) + caméra libre Maglev',
  },
  {
    id: 'GEMINI_FREE_TIER',
    shortLabel: 'IA Free Tier',
    label: '9. Transparence IA Free Tier Strict (6 Canaux & Ledger)',
    category: 'ETHIQUE_IA',
    v51Action: 'Maintien strict 0 $ facturé et enrichissement du repli Catalogue Vivant',
  },
  {
    id: 'DOC_GOVERNANCE',
    shortLabel: 'Gouvernance Docs',
    label: '10. Gouvernance Documentaire (doc-mesh, GitHub & Notebook)',
    category: 'GOUVERNANCE',
    v51Action: 'Synchronisation automatisée CI + suivi continu GitHub Ultra & Notebook',
  },
]);

export const VIRTUAL_BETA_PERSONAS_CATALOG: readonly BetaQuestionnaireSubmission[] = Object.freeze([
  {
    id: 'p13-persona-kaelen',
    authorName: 'Kaelen',
    profileId: 'STRATEGIST_4X',
    profileLabel: 'Stratège 4X & Grand Strategy (Humankind / CK3 / Call of War)',
    source: 'VIRTUAL_PERSONA',
    ratings: {
      LOOP_PA: 5,
      HUD_DESKTOP: 5,
      MOBILE_SAFARI: 4,
      THEME_ASTRALIS: 5,
      BADGES_ETHICS: 5,
      SCENARIO_MATRIX: 5,
      HONORS_2TIER: 5,
      CITY_3D_CLIMATE: 4,
      GEMINI_FREE_TIER: 5,
      DOC_GOVERNANCE: 5,
    },
    priorityCriterionId: 'LOOP_PA',
    strengths: [
      '5 domaines purs dans Monde sans intitulés hybrides et séparation claire Stats vs Gestion.',
      'Fiche Technique Souveraine dynamique et dépenses des PA restants directement depuis Monde.',
    ],
    recommendations: [
      'Ajouter un raccourci Shift+M vers Militaire → 4 Théâtres lors d’une crise P0.',
      'Sauvegarder plusieurs modèles nommés de Taskforces entre les tours.',
    ],
    comment:
      'Excellente profondeur stratégique : les 2 étages d’Honneurs et le couplage entre PA restants et gestionnaires territoriaux rendent chaque tour décisif.',
    submittedAtIso: '2026-11-22T15:30:00Z',
  },
  {
    id: 'p13-persona-chloe',
    authorName: 'Chloé',
    profileId: 'MOBILE_SAFARI',
    profileLabel: 'Testeuse UX Mobile, Safari & iPhone (Responsive & Accessibilité)',
    source: 'VIRTUAL_PERSONA',
    ratings: {
      LOOP_PA: 5,
      HUD_DESKTOP: 5,
      MOBILE_SAFARI: 5,
      THEME_ASTRALIS: 5,
      BADGES_ETHICS: 4,
      SCENARIO_MATRIX: 4,
      HONORS_2TIER: 5,
      CITY_3D_CLIMATE: 5,
      GEMINI_FREE_TIER: 5,
      DOC_GOVERNANCE: 5,
    },
    priorityCriterionId: 'MOBILE_SAFARI',
    strengths: [
      'Rendu 390×844 propre sans dépassement horizontal, cibles tactiles >= 44×44 px et synchro taille texte Safari.',
      'Mode Masquer 100 % le HUD très appréciable pour admirer la cité 3D sur iPhone.',
    ],
    recommendations: [
      'Ajouter un balayage horizontal (swipe) entre Monde, Événements et Journal.',
      'Proposer un preset « Contraste Élevé Plein Soleil » dans le Studio Thèmes.',
    ],
    comment:
      'Navigation tactile fluide sur iPhone Safari, aucune collision d’en-tête après correction R2 et confort de lecture remarquable.',
    submittedAtIso: '2026-11-22T15:31:00Z',
  },
  {
    id: 'p13-persona-thomas',
    authorName: 'Maître Thomas',
    profileId: 'NARRATIVE_ETHICS',
    profileLabel: 'Analyste Narratif & Éthique (Pax Historia / Philosophie Politique)',
    source: 'VIRTUAL_PERSONA',
    ratings: {
      LOOP_PA: 5,
      HUD_DESKTOP: 5,
      MOBILE_SAFARI: 4,
      THEME_ASTRALIS: 5,
      BADGES_ETHICS: 5,
      SCENARIO_MATRIX: 5,
      HONORS_2TIER: 5,
      CITY_3D_CLIMATE: 4,
      GEMINI_FREE_TIER: 5,
      DOC_GOVERNANCE: 5,
    },
    priorityCriterionId: 'BADGES_ETHICS',
    strengths: [
      'Badges imbriqués 3 niveaux (Maître ▸ N1 ▸ N2) avec légende couleur (i) et cumul éthique clair.',
      'Générateur Matriciel Pax Historia couplé au moteur réel + Module Monde Contextuel en fin de choix.',
    ],
    recommendations: [
      'Graphique radar des 5 Pôles Éthiques sur les 6 Ères en bilan de fin de campagne.',
      'Filtre rapide « Filtrer par école éthique » dans l’onglet Événements.',
    ],
    comment:
      'La traçabilité philosophique et la liaison matricielle des scénarios répondent précisément aux limites habituelles des jeux narratifs IA.',
    submittedAtIso: '2026-11-22T15:32:00Z',
  },
  {
    id: 'p13-persona-driss',
    authorName: 'Driss',
    profileId: 'ENGINEER_3D',
    profileLabel: 'Ingénieur 3D, WebGL & Performance (Three.js / OpenRW)',
    source: 'VIRTUAL_PERSONA',
    ratings: {
      LOOP_PA: 4,
      HUD_DESKTOP: 5,
      MOBILE_SAFARI: 5,
      THEME_ASTRALIS: 5,
      BADGES_ETHICS: 5,
      SCENARIO_MATRIX: 5,
      HONORS_2TIER: 5,
      CITY_3D_CLIMATE: 5,
      GEMINI_FREE_TIER: 5,
      DOC_GOVERNANCE: 5,
    },
    priorityCriterionId: 'CITY_3D_CLIMATE',
    strengths: [
      'Cité 24-Hex vivante (Double Maglev + 18 piétons sur waypoints + cycle solaire) fluide sans erreur WebGL.',
      'Studio Vidéo 3D Free-Tier WebM + démarrage radio FIP lissé sans bruit sourd.',
    ],
    recommendations: [
      'Sélecteur de qualité graphique (Éco Mobile / Standard / Ultra 60 fps) pour iPhone anciens.',
      'Mode Caméra Orbitale Libre temporaire pour suivre une rame Maglev en Échelle 3.',
    ],
    comment:
      'Architecture Three.js solide avec zéro fuite mémoire en rendu logiciel et enchaînement audio propre au démarrage de la radio.',
    submittedAtIso: '2026-11-22T15:33:00Z',
  },
  {
    id: 'p13-persona-lea',
    authorName: 'Léa',
    profileId: 'DISCOVERY_SOLARPUNK',
    profileLabel: 'Joueuse Découverte Solarpunk & Fiction Interactive',
    source: 'VIRTUAL_PERSONA',
    ratings: {
      LOOP_PA: 5,
      HUD_DESKTOP: 4,
      MOBILE_SAFARI: 5,
      THEME_ASTRALIS: 5,
      BADGES_ETHICS: 5,
      SCENARIO_MATRIX: 5,
      HONORS_2TIER: 4,
      CITY_3D_CLIMATE: 5,
      GEMINI_FREE_TIER: 5,
      DOC_GOVERNANCE: 4,
    },
    priorityCriterionId: 'THEME_ASTRALIS',
    strengths: [
      'Direction visuelle Rose Astralis chaleureuse et zéro jargon technique à l’écran (Atmosphère Hostile → Éden).',
      'Bulles de suggestions cliquables qui suppriment le syndrome de la page blanche dans les champs libres.',
    ],
    recommendations: [
      'Option de narration vocale synthétique locale (Web Speech API) pour les titres de crises P0.',
      'Mini-guide contextuel illustré lors de la première ouverture du Studio Vidéo.',
    ],
    comment:
      'Prise en main accueillante et poétique dès l’écran titre : on comprend l’évolution du climat et des citoyens sans se perdre dans les chiffres.',
    submittedAtIso: '2026-11-22T15:34:00Z',
  },
]);

export const BETA_SUGGESTION_CHIPS: readonly string[] = Object.freeze([
  'Ajouter le swipe tactile entre Monde, Événements et Journal sur iPhone.',
  'Proposer un comparateur graphique multi-campagnes sur 6 ères.',
  'Permettre d’exporter et partager mes scénarios matriciels en JSON.',
  'Ajouter un mode qualité graphique Éco / Standard / Ultra pour la cité 24-Hex.',
  'Excellente fluidité globale et identité Rose Astralis très lisible.',
]);
