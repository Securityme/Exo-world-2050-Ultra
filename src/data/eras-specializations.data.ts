import type { EraBranchId } from '../contracts/v4-systems.schema.ts';

/**
 * [L1] EXW.L1.ERAS_SPECIALIZATIONS | v5.2.0 | SADT A1.1
 * 8 Macro-Eras x 4 Structural Branches x 3 Branch-Adaptive Sub-Eras (.a/.b/.c)
 * with 4 distinct selectable Specializations at every transition step.
 */

export const MAX_MACRO_ERA = 8;

export interface EraBranchMeta {
  readonly id: EraBranchId;
  readonly label: string;
  readonly shortLabel: string;
  readonly motto: string;
  readonly accentClass: string;
  readonly subEraNames: readonly [string, string, string];
}

export interface MacroEraMeta {
  readonly era: number;
  readonly code: string;
  readonly name: string;
  readonly yearHorizon: string;
  readonly summary: string;
  readonly branchSubScaleTitles: Record<EraBranchId, readonly [string, string, string]>;
}

export interface EraSpecializationOption {
  readonly id: string;
  readonly era: number;
  readonly subEra: 1 | 2 | 3;
  readonly branchId: EraBranchId;
  readonly title: string;
  readonly tagline: string;
  readonly bonusSummary: string;
  readonly unlockedQuestThreadId: string;
  readonly effects: {
    readonly credits?: number;
    readonly energy?: number;
    readonly materials?: number;
    readonly water?: number;
    readonly food?: number;
    readonly compute?: number;
    readonly electronics?: number;
    readonly breathingKits?: number;
    readonly atmosphereDelta?: number;
    readonly approvalDelta?: number;
    readonly fameBonus?: number;
    readonly paGeneralBonus?: number;
  };
}

export const ERA_BRANCHES: Record<EraBranchId, EraBranchMeta> = {
  BIOSPHERE: {
    id: 'BIOSPHERE',
    label: 'Voie Biosphère & Symbiose',
    shortLabel: 'Biosphère',
    motto: 'Écosystèmes ouverts, cycles hydriques et forêts solarpunk',
    accentClass: 'text-emerald-600 dark:text-emerald-300',
    subEraNames: ['Ensemencement', 'Équilibre Vivant', 'Canopée Souveraine'],
  },
  INDUSTRY: {
    id: 'INDUSTRY',
    label: 'Voie Industrie & Énergie Solaire',
    shortLabel: 'Industrie',
    motto: 'Micro-réseaux propres, impression modulaire et logistique maglev',
    accentClass: 'text-amber-600 dark:text-amber-300',
    subEraNames: ['Fondation Modulaire', 'Cadence Solaire', 'Méga-Forge Propre'],
  },
  CIVIC: {
    id: 'CIVIC',
    label: 'Voie Civique & Savoir Ouvert',
    shortLabel: 'Civique',
    motto: 'Assemblées citoyennes, santé collective et recherche partagée',
    accentClass: 'text-sky-600 dark:text-sky-300',
    subEraNames: ['Pacte Citoyen', 'Agora Fédérale', 'Humanisme Orbital'],
  },
  FRONTIER: {
    id: 'FRONTIER',
    label: 'Voie Frontière & Horizon Orbital',
    shortLabel: 'Frontière',
    motto: 'Reconnaissance planétaire, corridors orbitaux et diplomatie stellaire',
    accentClass: 'text-violet-600 dark:text-violet-300',
    subEraNames: ['Avant-Postes', 'Réseau Géodésique', 'Constellation Libre'],
  },
};

export const ERA_BRANCH_LIST: readonly EraBranchMeta[] = [
  ERA_BRANCHES.BIOSPHERE,
  ERA_BRANCHES.INDUSTRY,
  ERA_BRANCHES.CIVIC,
  ERA_BRANCHES.FRONTIER,
];

export const MACRO_ERAS_8: readonly MacroEraMeta[] = [
  {
    era: 1,
    code: 'ÈRE I',
    name: 'Genèse Pionnière 2050',
    yearHorizon: '2050–2056',
    summary: 'Atterrissage, premiers quartiers à ciel ouvert et ancrage énergétique.',
    branchSubScaleTitles: {
      BIOSPHERE: ['I.a — Oasis Pilote', 'I.b — Hydro-Bassins', 'I.c — Ceinture Verte'],
      INDUSTRY: ['I.a — Chantiers Solaires', 'I.b — Fonderie Modulaire', 'I.c — Réseau Portuaire'],
      CIVIC: ['I.a — Charte des Pionniers', 'I.b — Conseil de Baie', 'I.c — Écoles Ouvertes'],
      FRONTIER: ['I.a — Balises d’Ancrage', 'I.b — Relais de Surface', 'I.c — Cap Géodésique'],
    },
  },
  {
    era: 2,
    code: 'ÈRE II',
    name: 'Fédération des Cités',
    yearHorizon: '2057–2064',
    summary: 'Interconnexion des quartiers, premiers traités fédéraux et réseaux maglev.',
    branchSubScaleTitles: {
      BIOSPHERE: ['II.a — Corridors Boisés', 'II.b — Fermes Aquaponiques', 'II.c — Micro-Climats'],
      INDUSTRY: ['II.a — Maglev Côtier', 'II.b — Batteries Solides', 'II.c — Hubs Logistiques'],
      CIVIC: ['II.a — Parlement Urbain', 'II.b — Mutualisation O₂', 'II.c — Culture Solarpunk'],
      FRONTIER: ['II.a — Stations Relais', 'II.b — Escadrilles Civiles', 'II.c — Cartographie Fine'],
    },
  },
  {
    era: 3,
    code: 'ÈRE III',
    name: 'Symbiose Climatique',
    yearHorizon: '2065–2073',
    summary: 'Stabilisation atmosphérique active, laboratoires du vivant et économie circulaire.',
    branchSubScaleTitles: {
      BIOSPHERE: ['III.a — Forêts Littorales', 'III.b — Réensemencement', 'III.c — Pluies Régulées'],
      INDUSTRY: ['III.a — Recyclage Intégral', 'III.b — Collecteurs Hélio', 'III.c — Composites Bio'],
      CIVIC: ['III.a — Université Planétaire', 'III.b — Santé Prédictive', 'III.c — Pacte Inter-Cités'],
      FRONTIER: ['III.a — Drones Stratosphère', 'III.b — Ports Spatiaux', 'III.c — Accords Orbitaux'],
    },
  },
  {
    era: 4,
    code: 'ÈRE IV',
    name: 'Biosphère Ouverte',
    yearHorizon: '2074–2084',
    summary: 'Air libre consolidé, grands parcs continentaux et essor des réseaux quantiques.',
    branchSubScaleTitles: {
      BIOSPHERE: ['IV.a — Sanctuaires Marins', 'IV.b — Rivières Vivantes', 'IV.c — Air Libre Durable'],
      INDUSTRY: ['IV.a — Super-Grilles Propres', 'IV.b — Usines Autonomes', 'IV.c — Chantiers Navals'],
      CIVIC: ['IV.a — Démocratie Directe', 'IV.b — Bibliothèques IA', 'IV.c — Arts & Architecture'],
      FRONTIER: ['IV.a — Anneau Bas-Orbite', 'IV.b — Flotte Scientifique', 'IV.c — Diplomatie Active'],
    },
  },
  {
    era: 5,
    code: 'ÈRE V',
    name: 'Horizons Orbitaux',
    yearHorizon: '2085–2096',
    summary: 'Ascenseurs solaires, chantiers spatiaux civils et commerce inter-mondes.',
    branchSubScaleTitles: {
      BIOSPHERE: ['V.a — Serres Orbitales', 'V.b — Banques de Graines', 'V.c — Éco-Cités Volantes'],
      INDUSTRY: ['V.a — Collecte Hélium-3', 'V.b — Raffineries en Orbite', 'V.c — Propulsion Ionique'],
      CIVIC: ['V.a — Charte Multi-Mondes', 'V.b — Académies Orbitales', 'V.c — Conseil des Cités'],
      FRONTIER: ['V.a — Chantiers Spatiaux', 'V.b — Sondes Profondes', 'V.c — Routes Solaires'],
    },
  },
  {
    era: 6,
    code: 'ÈRE VI',
    name: 'Convergence Planétaire',
    yearHorizon: '2097–2110',
    summary: 'Synthèse entre écologie globale, IA coopérative et gouvernance de Super-Alliance.',
    branchSubScaleTitles: {
      BIOSPHERE: ['VI.a — Gaïa Connectée', 'VI.b — Régénération Totale', 'VI.c — Harmonie Biologique'],
      INDUSTRY: ['VI.a — Matière Programmable', 'VI.b — Fusion Civile Propre', 'VI.c — Infrastructures Zéro-Perte'],
      CIVIC: ['VI.a — Consensus Planétaire', 'VI.b — Mémoire Commune', 'VI.c — Cités Jardins'],
      FRONTIER: ['VI.a — Arche Inter-Système', 'VI.b — Réseau Inter-Planètes', 'VI.c — Ambassades Stellaires'],
    },
  },
  {
    era: 7,
    code: 'ÈRE VII',
    name: 'Archipel Stellaire',
    yearHorizon: '2111–2130',
    summary: 'Déploiement simultané sur plusieurs mondes sœurs reliés par corridors photoniques.',
    branchSubScaleTitles: {
      BIOSPHERE: ['VII.a — Biomes Jumelés', 'VII.b — Semence Inter-Mondes', 'VII.c — Jardins d’Exo-Terre'],
      INDUSTRY: ['VII.a — Anneaux Solaires', 'VII.b — Chantiers Lagrange', 'VII.c — Logistique Quantique'],
      CIVIC: ['VII.a — Sénat de l’Archipel', 'VII.b — Citoyenneté Libre', 'VII.c — Renaissance 2120'],
      FRONTIER: ['VII.a — Relais Héliosphère', 'VII.b — Flottes d’Exploration', 'VII.c — Cartes Stellaires'],
    },
  },
  {
    era: 8,
    code: 'ÈRE VIII',
    name: 'Aube Transcendante',
    yearHorizon: '2131+',
    summary: 'Civilisation Solarpunk mature rayonnant à l’échelle du système et au-delà.',
    branchSubScaleTitles: {
      BIOSPHERE: ['VIII.a — Symbiose Totale', 'VIII.b — Sanctuaire Vivant', 'VIII.c — Héritage Vert'],
      INDUSTRY: ['VIII.a — Réseau Photovoltaïque Pur', 'VIII.b — Synthèse Universelle', 'VIII.c — Œuvre Infinie'],
      CIVIC: ['VIII.a — Concorde Absolue', 'VIII.b — Savoir Partagé', 'VIII.c — Âge d’Or Civique'],
      FRONTIER: ['VIII.a — Voiles Stellaires', 'VIII.b — Portes d’Horizon', 'VIII.c — Destinée Stellaire'],
    },
  },
];

export function formatSubEraLetter(subEra: number): 'a' | 'b' | 'c' {
  if (subEra <= 1) return 'a';
  if (subEra === 2) return 'b';
  return 'c';
}

export function getMacroEraMeta(era: number): MacroEraMeta {
  const clamped = Math.max(1, Math.min(MAX_MACRO_ERA, Math.round(era)));
  return MACRO_ERAS_8[clamped - 1] ?? MACRO_ERAS_8[0]!;
}

export function getSubEraScaleTitle(
  era: number,
  subEra: number,
  branchId: EraBranchId,
): string {
  const meta = getMacroEraMeta(era);
  const idx = Math.max(0, Math.min(2, Math.round(subEra) - 1));
  return meta.branchSubScaleTitles[branchId]?.[idx] ?? `${meta.code}.${formatSubEraLetter(subEra)}`;
}

/**
 * Generates the 4 distinct Specializations (one per strategic Branch) for any (Era 1..8, SubEra 1..3).
 * Scaling scales cleanly with era & subEra while remaining deterministic and R-50 compliant.
 */
export function getSpecializationsForStep(
  era: number,
  subEra: number,
): readonly EraSpecializationOption[] {
  const safeEra = Math.max(1, Math.min(MAX_MACRO_ERA, Math.round(era)));
  const safeSub = Math.max(1, Math.min(3, Math.round(subEra))) as 1 | 2 | 3;
  const meta = getMacroEraMeta(safeEra);
  const scale = safeEra + (safeSub - 1) * 0.4;

  const bioTitle = meta.branchSubScaleTitles.BIOSPHERE[safeSub - 1] ?? meta.name;
  const indTitle = meta.branchSubScaleTitles.INDUSTRY[safeSub - 1] ?? meta.name;
  const civTitle = meta.branchSubScaleTitles.CIVIC[safeSub - 1] ?? meta.name;
  const frtTitle = meta.branchSubScaleTitles.FRONTIER[safeSub - 1] ?? meta.name;

  const creditsSmall = Math.round(110 * scale);
  const creditsMed = Math.round(160 * scale);
  const matGain = Math.round(28 * scale);
  const energyGain = Math.round(24 * scale);
  const waterGain = Math.round(26 * scale);
  const computeGain = Math.round(22 * scale);
  const atmoGain = Math.min(8, Math.round(2.5 + safeEra * 0.6));
  const fameGain = Math.round(35 * scale);
  const paBonus = safeSub === 3 ? 1 : 0;

  return [
    {
      id: `spec-e${safeEra}-s${safeSub}-biosphere`,
      era: safeEra,
      subEra: safeSub,
      branchId: 'BIOSPHERE',
      title: bioTitle,
      tagline: 'Accélère la biosphère ouverte, le cycle hydrique et les parcs vivants.',
      bonusSummary: `+${atmoGain}% Air · +${waterGain} Eau · +${Math.round(14 * scale)} Kits O₂ · +${fameGain} Ren.${paBonus ? ' · +1 PA Max' : ''}`,
      unlockedQuestThreadId: 'BIOSPHERE_TERRA',
      effects: {
        water: waterGain,
        breathingKits: Math.round(14 * scale),
        atmosphereDelta: atmoGain,
        fameBonus: fameGain,
        paGeneralBonus: paBonus,
      },
    },
    {
      id: `spec-e${safeEra}-s${safeSub}-industry`,
      era: safeEra,
      subEra: safeSub,
      branchId: 'INDUSTRY',
      title: indTitle,
      tagline: 'Décuple la capacité solaire, les matériaux modulaires et la trésorerie.',
      bonusSummary: `+${creditsMed} Cr · +${matGain} Mat. · +${energyGain} Énerg. · +${Math.round(fameGain * 0.9)} Ren.${paBonus ? ' · +1 PA Max' : ''}`,
      unlockedQuestThreadId: 'URBAN_COLONISTS',
      effects: {
        credits: creditsMed,
        materials: matGain,
        energy: energyGain,
        fameBonus: Math.round(fameGain * 0.9),
        paGeneralBonus: paBonus,
      },
    },
    {
      id: `spec-e${safeEra}-s${safeSub}-civic`,
      era: safeEra,
      subEra: safeSub,
      branchId: 'CIVIC',
      title: civTitle,
      tagline: 'Renforce la cohésion civique, la science ouverte et le calcul partagé.',
      bonusSummary: `+${Math.min(10, 4 + safeEra)}% Approb. · +${computeGain} Calcul · +${creditsSmall} Cr · +${Math.round(fameGain * 1.1)} Ren.${paBonus ? ' · +1 PA Max' : ''}`,
      unlockedQuestThreadId: 'GENESE_2050',
      effects: {
        credits: creditsSmall,
        compute: computeGain,
        approvalDelta: Math.min(10, 4 + safeEra),
        fameBonus: Math.round(fameGain * 1.1),
        paGeneralBonus: paBonus,
      },
    },
    {
      id: `spec-e${safeEra}-s${safeSub}-frontier`,
      era: safeEra,
      subEra: safeSub,
      branchId: 'FRONTIER',
      title: frtTitle,
      tagline: 'Ouvre les relais orbitaux, l’électronique avancée et le rayonnement fédéral.',
      bonusSummary: `+${Math.round(20 * scale)} Électron. · +${computeGain} Calcul · +${creditsSmall} Cr · +${Math.round(fameGain * 1.15)} Ren.${paBonus ? ' · +1 PA Max' : ''}`,
      unlockedQuestThreadId: 'DIPLO_FRONTIER',
      effects: {
        credits: creditsSmall,
        electronics: Math.round(20 * scale),
        compute: computeGain,
        fameBonus: Math.round(fameGain * 1.15),
        paGeneralBonus: paBonus,
      },
    },
  ];
}

export function findSpecializationById(id: string): EraSpecializationOption | null {
  for (let era = 1; era <= MAX_MACRO_ERA; era += 1) {
    for (let sub = 1; sub <= 3; sub += 1) {
      const found = getSpecializationsForStep(era, sub).find((opt) => opt.id === id);
      if (found) return found;
    }
  }
  return null;
}
