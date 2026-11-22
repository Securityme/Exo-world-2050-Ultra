import type { AiPersonality, FleetShip, HkStarDomain } from '../contracts/v4-systems.schema.ts';

/**
 * [L1] EXW.L1.V4_CATALOG | v4.0.0-rc.1 | SADT A1.1
 * Complete V4 2050 Geopolitical, Humankind, Genèse 2050 & Shared Tech Catalog:
 * - 5 Superpowers 2050 (UEA, CPA, AAS, FNE, PSA) x 6 dynamic Faction Eras
 * - 5 AI Co-pilot Personalities (AI-P)
 * - 30 Shared & Cyber Technologies (5 per Era, E1..E6)
 * - Evolutive / Common / Transcendence Doctrines
 * - 5 Fixed Calendar Events (CalEvents E2..E6)
 * - Protocole Genèse 2050 Act 0 Founding Doctrines
 */

export interface FactionEraIdentity {
  readonly era: number;
  readonly factionName: string;
  readonly evolutiveDoctrineId: string;
  readonly evolutiveDoctrineName: string;
  readonly bonusSummary: string;
}

export interface SuperpowerV4Spec {
  readonly id: string;
  readonly code: 'UEA' | 'CPA' | 'AAS' | 'FNE' | 'PSA';
  readonly name: string;
  readonly legacyCatalogId: string;
  readonly colorHex: string;
  readonly allianceName: string;
  readonly motto: string;
  readonly startingBonus: string;
  readonly eraIdentities: readonly FactionEraIdentity[];
}

export const SUPERPOWERS_V4_CATALOG: readonly SuperpowerV4Spec[] = Object.freeze([
  {
    id: 'sp-uea',
    code: 'UEA',
    name: 'Union Euro-Atlantique',
    legacyCatalogId: 'eurasia-solar',
    colorHex: '#e11d48',
    allianceName: 'Pacte Euro-Solaire',
    motto: 'Gouvernance civique, architecture bioclimatique & droit spatial.',
    startingBonus: '+10% Approbation civique · +1 Étoile Esthète en Ère I',
    eraIdentities: [
      { era: 1, factionName: 'Consortium Atlantique 2050', evolutiveDoctrineId: 'doc-uea-1', evolutiveDoctrineName: 'Charte des Quartiers Ouverts', bonusSummary: '+15% Terraformation initiale' },
      { era: 2, factionName: 'Fédération Solarpunk d’Europe', evolutiveDoctrineId: 'doc-uea-2', evolutiveDoctrineName: 'Droit Urbain Modulaire', bonusSummary: '-15% coût d’entretien des quartiers' },
      { era: 3, factionName: 'Ligue Symbiotique Boréale', evolutiveDoctrineId: 'doc-uea-3', evolutiveDoctrineName: 'Parcs Atmosphériques', bonusSummary: '+20% production Eau & Kits O₂' },
      { era: 4, factionName: 'Directoire Biosphérique', evolutiveDoctrineId: 'doc-uea-4', evolutiveDoctrineName: 'Économie Circulaire Intégrale', bonusSummary: '+18% recettes fiscales & +4 Moral' },
      { era: 5, factionName: 'Sénat Orbital Atlantique', evolutiveDoctrineId: 'doc-uea-5', evolutiveDoctrineName: 'Ascenseur Équatorial', bonusSummary: '+25% vitesse de flotte & Calcul' },
      { era: 6, factionName: 'Concorde Transcendante', evolutiveDoctrineId: 'doc-uea-6', evolutiveDoctrineName: 'Hégémonie Éden', bonusSummary: '+20% Gloire par tour' },
    ],
  },
  {
    id: 'sp-cpa',
    code: 'CPA',
    name: 'Confédération Pacifique-Asie',
    legacyCatalogId: 'pacifica-nexus',
    colorHex: '#059669',
    allianceName: 'Réseau Trans-Pacifique',
    motto: 'Calcul souverain, robotique de précision & logistique orbitale.',
    startingBonus: '+25% Calcul souverain · +2 Drones de construction initiaux',
    eraIdentities: [
      { era: 1, factionName: 'Archipel Quantique 2050', evolutiveDoctrineId: 'doc-cpa-1', evolutiveDoctrineName: 'Maillage Drone Autonome', bonusSummary: '-20% usure des infrastructures' },
      { era: 2, factionName: 'Nexus Cyber-Pacifique', evolutiveDoctrineId: 'doc-cpa-2', evolutiveDoctrineName: 'Brevets de Calcul Partagés', bonusSummary: '+20% osmose technologique' },
      { era: 3, factionName: 'Cités Hydro-Pélagiques', evolutiveDoctrineId: 'doc-cpa-3', evolutiveDoctrineName: 'Fermes Marines Verticales', bonusSummary: '+25% Vivres & Eau' },
      { era: 4, factionName: 'Syndicat Nano-Industriel', evolutiveDoctrineId: 'doc-cpa-4', evolutiveDoctrineName: 'Fonderies Zéro Rebut', bonusSummary: '+30% Matériaux & Électronique' },
      { era: 5, factionName: 'Flotte Marchande Solaire', evolutiveDoctrineId: 'doc-cpa-5', evolutiveDoctrineName: 'Transit Hélium-3 Express', bonusSummary: '+25% revenus commerciaux' },
      { era: 6, factionName: 'Matrice Harmonie', evolutiveDoctrineId: 'doc-cpa-6', evolutiveDoctrineName: 'Singulariat Civique', bonusSummary: '+2 PA généraux max & +15% Gloire' },
    ],
  },
  {
    id: 'sp-aas',
    code: 'AAS',
    name: 'Alliance Afro-Solaire',
    legacyCatalogId: 'afro-helios',
    colorHex: '#d97706',
    allianceName: 'Ligue Hélios Sud',
    motto: 'Puissance photovoltaïque orbitale, démographie dynamique & résilience.',
    startingBonus: '+25% Énergie solaire · Arrivées de colons accélérées (-1 tour)',
    eraIdentities: [
      { era: 1, factionName: 'Pionniers Hélios 2050', evolutiveDoctrineId: 'doc-aas-1', evolutiveDoctrineName: 'Collecteurs de Haute Crête', bonusSummary: '+25% Énergie solaire' },
      { era: 2, factionName: 'Fédération du Zénith', evolutiveDoctrineId: 'doc-aas-2', evolutiveDoctrineName: 'Coopératives de Colons', bonusSummary: '+6 Moral & -15% Fatigue' },
      { era: 3, factionName: 'Oasis Continentale', evolutiveDoctrineId: 'doc-aas-3', evolutiveDoctrineName: 'Aquifères Solaires', bonusSummary: '+20% Hydro & Bio terraformation' },
      { era: 4, factionName: 'Métropoles d’Or', evolutiveDoctrineId: 'doc-aas-4', evolutiveDoctrineName: 'Crédit Fédéral Solidaire', bonusSummary: '+20% Taxes urbaines' },
      { era: 5, factionName: 'Chantiers Solaires Orbitaux', evolutiveDoctrineId: 'doc-aas-5', evolutiveDoctrineName: 'Voiles Photoniques', bonusSummary: '+25% puissance de flotte' },
      { era: 6, factionName: 'Soleil Éternel', evolutiveDoctrineId: 'doc-aas-6', evolutiveDoctrineName: 'Couronne Stellaire', bonusSummary: '+20% Gloire & +10 Approbation' },
    ],
  },
  {
    id: 'sp-fne',
    code: 'FNE',
    name: 'Fédération Nord-Eurasienne',
    legacyCatalogId: 'nordic-cryo',
    colorHex: '#2563eb',
    allianceName: 'Pacte Boréal Cryo',
    motto: 'Ingénierie extrême, défense magnétosphérique & discipline logistique.',
    startingBonus: '+20% Blindage radiatif · -25% pénalités de tempêtes',
    eraIdentities: [
      { era: 1, factionName: 'Avant-Postes Boréaux 2050', evolutiveDoctrineId: 'doc-fne-1', evolutiveDoctrineName: 'Architecture Cryo-Blindée', bonusSummary: '-25% usure tempêtes' },
      { era: 2, factionName: 'Garde Magnétosphérique', evolutiveDoctrineId: 'doc-fne-2', evolutiveDoctrineName: 'Boucliers Polaires', bonusSummary: '+20% RadShield & Défense' },
      { era: 3, factionName: 'Académies Boréales', evolutiveDoctrineId: 'doc-fne-3', evolutiveDoctrineName: 'Formation Polytechnique', bonusSummary: '+25% XP Colons & Cabinet' },
      { era: 4, factionName: 'Arsenal Stratégique', evolutiveDoctrineId: 'doc-fne-4', evolutiveDoctrineName: 'Exosquelettes T3', bonusSummary: '+25% puissance militaire' },
      { era: 5, factionName: 'Amirauté Circum-Planétaire', evolutiveDoctrineId: 'doc-fne-5', evolutiveDoctrineName: 'Croiseurs d’Escorte', bonusSummary: '+1 Corvette gratuite par ère' },
      { era: 6, factionName: 'Bastion Galactique', evolutiveDoctrineId: 'doc-fne-6', evolutiveDoctrineName: 'Souveraineté Absolue', bonusSummary: '+18% Gloire & immunité pénurie' },
    ],
  },
  {
    id: 'sp-psa',
    code: 'PSA',
    name: 'Pacte Sud-Américain & Biosphère',
    legacyCatalogId: 'andina-bio',
    colorHex: '#7c3aed',
    allianceName: 'Cordillère Bio-Souveraine',
    motto: 'Exobiologie symbiotique, agroforesterie verticale & diplomatie culturelle.',
    startingBonus: '+20% Bio-Terraformation · +15% rendement Kits O₂ & Vivres',
    eraIdentities: [
      { era: 1, factionName: 'Jardins de la Cordillère 2050', evolutiveDoctrineId: 'doc-psa-1', evolutiveDoctrineName: 'Ensemencement Symbiotique', bonusSummary: '+20% Bio & Vivres' },
      { era: 2, factionName: 'Confédération Canopée', evolutiveDoctrineId: 'doc-psa-2', evolutiveDoctrineName: 'Échanges Culturels Fédéraux', bonusSummary: '+15% Gloire Esthète' },
      { era: 3, factionName: 'Sanctuaires Émeraude', evolutiveDoctrineId: 'doc-psa-3', evolutiveDoctrineName: 'Bio-Enzymes Atmosphériques', bonusSummary: '+25% vitesse vers l’Atmosphère Éden' },
      { era: 4, factionName: 'République Éden', evolutiveDoctrineId: 'doc-psa-4', evolutiveDoctrineName: 'Bien-Être Universel', bonusSummary: '+10 Bonheur & -20% Burnout' },
      { era: 5, factionName: 'Arches Vivantes', evolutiveDoctrineId: 'doc-psa-5', evolutiveDoctrineName: 'Vaisseaux-Biosphères', bonusSummary: '+2 slots colons par habitat' },
      { era: 6, factionName: 'Floraison Stellaire', evolutiveDoctrineId: 'doc-psa-6', evolutiveDoctrineName: 'Symbiose Cosmique', bonusSummary: '+22% Gloire & P4 garanti' },
    ],
  },
]);

export interface AiPersonalitySpec {
  readonly id: AiPersonality;
  readonly label: string;
  readonly tagline: string;
  readonly voicePrefix: string;
}

export const AI_PERSONALITIES_CATALOG: readonly AiPersonalitySpec[] = Object.freeze([
  { id: 'ANALYTIQUE', label: 'Analytique', tagline: 'Priorité aux projections chiffrées, bilans de flux et prévention de pénuries.', voicePrefix: '[Analyse]' },
  { id: 'BIENVEILLANT', label: 'Bienveillant', tagline: 'Protège le moral, la santé des colons et la tenue des promesses civiques.', voicePrefix: '[Veille Civique]' },
  { id: 'PRAGMATIQUE', label: 'Pragmatique', tagline: 'Optimise la rentabilité en PA, la trésorerie et les arbitrages rapides.', voicePrefix: '[Optimisation]' },
  { id: 'SOUVERAIN', label: 'Souverain', tagline: 'Focus sécurité orbitale, défense cyber et avance stratégique sur les rivaux.', voicePrefix: '[Stratégie]' },
  { id: 'AVANT_GARDE', label: 'Avant-Garde', tagline: 'Accélère la terraformation P4, la recherche partagée et les percées scientifiques.', voicePrefix: '[Prospective]' },
]);

export interface SharedTechSpec {
  readonly id: string;
  readonly era: 1 | 2 | 3 | 4 | 5 | 6;
  readonly name: string;
  readonly domain: 'ECO' | 'BIO' | 'CYBER' | 'FLEET' | 'CIVIC';
  readonly costCompute: number;
  readonly turnsBase: number;
  readonly effectLabel: string;
}

export const SHARED_TECHS_30: readonly SharedTechSpec[] = Object.freeze([
  // Era 1 (5)
  { id: 'tech-e1-solar-grid', era: 1, name: 'Micro-Réseaux Solaires 2050', domain: 'ECO', costCompute: 25, turnsBase: 3, effectLabel: '+12% Énergie' },
  { id: 'tech-e1-modular-fab', era: 1, name: 'Préfabrication Modulaire L2', domain: 'ECO', costCompute: 30, turnsBase: 3, effectLabel: '-15% coût extensions' },
  { id: 'tech-e1-o2-membranes', era: 1, name: 'Membranes O₂ Haute Densité', domain: 'BIO', costCompute: 30, turnsBase: 3, effectLabel: '+20% Kits O₂' },
  { id: 'tech-e1-cyber-vault', era: 1, name: 'Pare-Feu Fédéral Quantique', domain: 'CYBER', costCompute: 35, turnsBase: 3, effectLabel: '+15 Défense Cyber' },
  { id: 'tech-e1-civic-charter', era: 1, name: 'Assemblées de Quartier', domain: 'CIVIC', costCompute: 28, turnsBase: 3, effectLabel: '+5 Approbation max' },
  // Era 2 (5)
  { id: 'tech-e2-hydro-loop', era: 2, name: 'Aquifères Fermés & Filtrés', domain: 'BIO', costCompute: 45, turnsBase: 3, effectLabel: '+18% Eau & Hydro' },
  { id: 'tech-e2-drone-swarm', era: 2, name: 'Orchestration Drones Autonomes', domain: 'ECO', costCompute: 50, turnsBase: 3, effectLabel: '-20% Usure bâtiments' },
  { id: 'tech-e2-patent-osmosis', era: 2, name: 'Brevets Congrès (Osmose +20%)', domain: 'CYBER', costCompute: 55, turnsBase: 3, effectLabel: '+20% vitesse recherche alliée' },
  { id: 'tech-e2-corvette-dock', era: 2, name: 'Cales Orbitales Légères', domain: 'FLEET', costCompute: 55, turnsBase: 3, effectLabel: 'Débloque Corvette Orbitale' },
  { id: 'tech-e2-exo-gear-t2', era: 2, name: 'Équipement Colons Série T2', domain: 'CIVIC', costCompute: 48, turnsBase: 3, effectLabel: '+12% rendement Colons RPG' },
  // Era 3 (5)
  { id: 'tech-e3-bio-enzymes', era: 3, name: 'Bio-Enzymes Atmosphériques', domain: 'BIO', costCompute: 75, turnsBase: 3, effectLabel: '+4 Atmo/tour' },
  { id: 'tech-e3-maglev-grid', era: 3, name: 'Liaisons Maglev Inter-Quartiers', domain: 'ECO', costCompute: 80, turnsBase: 3, effectLabel: '+15% Taxes & Logistique' },
  { id: 'tech-e3-cyber-audit', era: 3, name: 'Contre-Espionnage Spectral', domain: 'CYBER', costCompute: 85, turnsBase: 3, effectLabel: 'Espionnage Tech actif' },
  { id: 'tech-e3-frigate-solar', era: 3, name: 'Propulsion Solaire Frégate', domain: 'FLEET', costCompute: 88, turnsBase: 3, effectLabel: 'Débloque Frégate Solaire' },
  { id: 'tech-e3-wellbeing-act', era: 3, name: 'Cliniques Anti-Burnout', domain: 'CIVIC', costCompute: 72, turnsBase: 3, effectLabel: '-25% Fatigue colons' },
  // Era 4 (5)
  { id: 'tech-e4-magnetosphere', era: 4, name: 'Anneau Magnétosphérique', domain: 'BIO', costCompute: 110, turnsBase: 3, effectLabel: '+6 RadShield/tour' },
  { id: 'tech-e4-fusion-core', era: 4, name: 'Réacteurs Hélium-3 Compacts', domain: 'ECO', costCompute: 115, turnsBase: 3, effectLabel: '+30% Énergie nette' },
  { id: 'tech-e4-neural-mesh', era: 4, name: 'Maillage Calcul Souverain', domain: 'CYBER', costCompute: 120, turnsBase: 3, effectLabel: '+35% Calcul & +1 PA' },
  { id: 'tech-e4-exo-gear-t3', era: 4, name: 'Exosquelettes Colons T3', domain: 'CIVIC', costCompute: 108, turnsBase: 3, effectLabel: '+20% synergie créneaux' },
  { id: 'tech-e4-terra-seeders', era: 4, name: 'Vaisseaux Semeurs Atmosphère', domain: 'FLEET', costCompute: 118, turnsBase: 3, effectLabel: '+5 Bio & Hydro/tour' },
  // Era 5 (5)
  { id: 'tech-e5-eden-canopy', era: 5, name: 'Canopée Planétaire Éden', domain: 'BIO', costCompute: 155, turnsBase: 3, effectLabel: 'Stabilise Atmosphère Éden' },
  { id: 'tech-e5-orbital-ring', era: 5, name: 'Anneau de Transit Orbital', domain: 'ECO', costCompute: 160, turnsBase: 3, effectLabel: '+35% Crédits & Matériaux' },
  { id: 'tech-e5-quantum-diplomacy', era: 5, name: 'Sénat Quantique Fédéral', domain: 'CIVIC', costCompute: 150, turnsBase: 3, effectLabel: '+25% Gloire diplomatique' },
  { id: 'tech-e5-colony-ark', era: 5, name: 'Arches Inter-Planétaires', domain: 'FLEET', costCompute: 165, turnsBase: 3, effectLabel: 'Débloque Arche Coloniale' },
  { id: 'tech-e5-ai-symbiosis', era: 5, name: 'Co-Gouvernance IA Éthique', domain: 'CYBER', costCompute: 158, turnsBase: 3, effectLabel: '+2 Sous-PA par tour' },
  // Era 6 (5)
  { id: 'tech-e6-stellar-gate', era: 6, name: 'Balises Interstellaires', domain: 'FLEET', costCompute: 220, turnsBase: 3, effectLabel: '+150 Gloire immédiate' },
  { id: 'tech-e6-zero-wear', era: 6, name: 'Matériaux Auto-Cicatrisants', domain: 'ECO', costCompute: 210, turnsBase: 3, effectLabel: 'Usure bâtiments divisée par 2' },
  { id: 'tech-e6-biosphere-zenith', era: 6, name: 'Zénith Biosphérique', domain: 'BIO', costCompute: 205, turnsBase: 3, effectLabel: 'Score Terraformation 100%' },
  { id: 'tech-e6-civic-utopia', era: 6, name: 'Charte Universelle 2100', domain: 'CIVIC', costCompute: 215, turnsBase: 3, effectLabel: 'Approbation verrouillée ≥85%' },
  { id: 'tech-e6-post-cyber', era: 6, name: 'Souveraineté Cryptographique', domain: 'CYBER', costCompute: 225, turnsBase: 3, effectLabel: 'Immunité cyber totale' },
]);

export const COMMON_DOCTRINES_CATALOG = Object.freeze([
  { id: 'DOC_SOLAR_CHARTER', name: 'Charte Solaire Commune', bonus: '+10% Énergie & +5% Terraformation' },
  { id: 'DOC_CIVIC_SOLIDARITY', name: 'Solidarité des Colons', bonus: '+6 Moral & -15% Fatigue' },
  { id: 'DOC_FEDERAL_MARKET', name: 'Libre-Échange Fédéral', bonus: '+15% Crédits nets par tour' },
  { id: 'DOC_ORBITAL_SHIELD', name: 'Bouclier de Défense Commune', bonus: '+20% Puissance Flotte & Cyber' },
]);

export interface GeneseFoundingChoice {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly doctrineTag: 'SOLARPUNK' | 'CORPORATE' | 'SCIENTIFIC';
  readonly immediateSummary: string;
  readonly promiseTitle: string;
  readonly promiseDescription: string;
  readonly promiseMetric: 'ATMO_PROGRESS' | 'CREDITS' | 'APPROVAL';
  readonly promiseTarget: number;
  readonly promiseDeadlineTurns: number;
  readonly spectraShift: { ecoInd: number; fedSov: number; sciCyb: number; welEff: number };
}

export const GENESE_ACT0_CHOICES: readonly GeneseFoundingChoice[] = Object.freeze([
  {
    id: 'genese-biosphere',
    title: 'Priorité Biosphère & Quartiers Ouverts',
    subtitle: 'Accélère l’émergence d’une Atmosphère Stabilisée et rassure les équipes exobiologiques.',
    doctrineTag: 'SOLARPUNK',
    immediateSummary: '+8 Atmo/Bio · +6 Approbation · +20 Kits O₂',
    promiseTitle: 'Cap Atmosphère Stabilisée',
    promiseDescription: 'Atteindre 32% de progression atmosphérique avant le Tour 6.',
    promiseMetric: 'ATMO_PROGRESS',
    promiseTarget: 32,
    promiseDeadlineTurns: 6,
    spectraShift: { ecoInd: 18, fedSov: 6, sciCyb: 8, welEff: 12 },
  },
  {
    id: 'genese-industry',
    title: 'Priorité Infrastructures & Solvabilité',
    subtitle: 'Consolide la trésorerie fédérale, les matériaux et la chaîne logistique.',
    doctrineTag: 'CORPORATE',
    immediateSummary: '+320 Crédits · +50 Matériaux · +15 Électronique',
    promiseTitle: 'Réserve Fédérale Souveraine',
    promiseDescription: 'Maintenir au moins 1 600 Crédits en trésorerie avant le Tour 5.',
    promiseMetric: 'CREDITS',
    promiseTarget: 1600,
    promiseDeadlineTurns: 5,
    spectraShift: { ecoInd: -16, fedSov: -8, sciCyb: -4, welEff: -10 },
  },
  {
    id: 'genese-science',
    title: 'Priorité Recherche Partagée & Bien-Être',
    subtitle: 'Renforce le calcul souverain, les colons RPG et la cohésion civique.',
    doctrineTag: 'SCIENTIFIC',
    immediateSummary: '+45 Calcul · +8 Moral Colons · +1 PA Général',
    promiseTitle: 'Consensus Civique 2050',
    promiseDescription: 'Atteindre 80% d’approbation civique avant le Tour 6.',
    promiseMetric: 'APPROVAL',
    promiseTarget: 80,
    promiseDeadlineTurns: 6,
    spectraShift: { ecoInd: 8, fedSov: 12, sciCyb: 18, welEff: 16 },
  },
]);

export const FIXED_CAL_EVENTS = Object.freeze([
  { id: 'cal-e2-congress', minEra: 2, cycleMod: 4, title: 'Congrès Fédéral des Brevets', summary: 'Osmose technologique ouverte : +20 Calcul & +30 Gloire.' },
  { id: 'cal-e3-solstice', minEra: 3, cycleMod: 5, title: 'Solstice Atmosphérique Planétaire', summary: 'Cycle favorable : +5 Atmo/Hydro & +4 Approbation.' },
  { id: 'cal-e4-expo', minEra: 4, cycleMod: 6, title: 'Exposition Universelle Solarpunk', summary: 'Rayonnement culturel : +65 Gloire & +180 Crédits.' },
  { id: 'cal-e5-summit', minEra: 5, cycleMod: 7, title: 'Sommet des Chantiers Orbitaux', summary: 'Optimisation flotte : +15% intégrité flotte & +40 Matériaux.' },
  { id: 'cal-e6-zenith', minEra: 6, cycleMod: 8, title: 'Assemblée du Zénith 2100', summary: 'Consécration civilisationnelle : +120 Gloire.' },
]);

export const HK_STAR_DOMAINS: readonly { id: HkStarDomain; label: string; metricHint: string }[] = Object.freeze([
  { id: 'AESTHETE', label: 'Esthète', metricHint: 'Approbation & Promesses tenues' },
  { id: 'AGRARIAN', label: 'Agraire', metricHint: 'Colons, Vivres & Moral' },
  { id: 'BUILDER', label: 'Bâtisseur', metricHint: 'Quartiers & Extensions' },
  { id: 'EXPANSIONIST', label: 'Expansionniste', metricHint: 'Secteurs contrôlés' },
  { id: 'MERCHANT', label: 'Marchand', metricHint: 'Trésorerie & Solvabilité' },
  { id: 'MILITARIST', label: 'Stratège', metricHint: 'Flotte, Drones & Défense' },
  { id: 'SCIENTIST', label: 'Savant', metricHint: 'Techs & Terraformation' },
]);

export const INITIAL_FLEET_SHIPS: readonly FleetShip[] = Object.freeze([
  { id: 'ship-cargo-1', name: 'Navette Hélios-01', shipClass: 'SHUTTLE_CARGO', level: 1, integrity: 96, assignedRole: 'RESOURCE_HAUL' },
  { id: 'ship-probe-1', name: 'Sonde Exosphère-A', shipClass: 'SCIENCE_PROBE', level: 1, integrity: 94, assignedRole: 'RECON' },
  { id: 'ship-corv-1', name: 'Corvette Égide-I', shipClass: 'CORVETTE_ORBITAL', level: 1, integrity: 98, assignedRole: 'ORBIT_PATROL' },
]);

export function resolveSuperpowerV4(superpowerId: string): SuperpowerV4Spec {
  return (
    SUPERPOWERS_V4_CATALOG.find(
      (s) => s.id === superpowerId || s.legacyCatalogId === superpowerId,
    ) ?? SUPERPOWERS_V4_CATALOG[0]!
  );
}
