import type { DossierClass, ExecutiveDossier } from '../../contracts/pa-dossiers.schema.ts';
import type { EraBranchId } from '../../contracts/v4-systems.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import { getMacroEraMeta } from '../../data/eras-specializations.data.ts';
import { countWorkforceSynergies } from '../economy-urban/workforce-assignments.ts';

/**
 * [L3] EXW.L3.CAMPAIGN_QUESTS | v5.2.0 | SADT A3.1
 * Pure Multi-Thread Campaign Quest Engine organized by Scenario Thread & Era (1..8).
 * Supports collapsible HUD threads and contextual Event-linked quest strips.
 * Zero I/O, zero Math.random(), zero Date.now(), zero Z0/R-50 terms.
 */

export type QuestTargetLink =
  | 'SCALE_3'
  | 'SCALE_2'
  | 'EVENTS_HUB'
  | 'WORLDS_WORKFORCE'
  | 'WORLDS_CITIES'
  | 'WORLDS_BIOSPHERE'
  | 'ERA_PANEL'
  | 'END_TURN';

export type QuestScenarioThreadId =
  | 'GENESE_2050'
  | 'BIOSPHERE_TERRA'
  | 'URBAN_COLONISTS'
  | 'DIPLO_FRONTIER'
  | 'BRANCH_MASTERY';

export interface QuestScenarioThreadMeta {
  readonly id: QuestScenarioThreadId;
  readonly label: string;
  readonly shortLabel: string;
  readonly summary: string;
  readonly accentClass: string;
}

export const QUEST_SCENARIO_THREADS: Record<QuestScenarioThreadId, QuestScenarioThreadMeta> = {
  GENESE_2050: {
    id: 'GENESE_2050',
    label: 'Scénario Genèse 2050',
    shortLabel: 'Genèse 2050',
    summary: 'Prise de commandement, arbitrages exécutifs et premiers cycles solaires.',
    accentClass: 'text-amber-600 dark:text-amber-300',
  },
  BIOSPHERE_TERRA: {
    id: 'BIOSPHERE_TERRA',
    label: 'Scénario Biosphère & Climat',
    shortLabel: 'Biosphère',
    summary: 'Stabilisation atmosphérique, cycle hydrique et transition vers l’air libre.',
    accentClass: 'text-emerald-600 dark:text-emerald-300',
  },
  URBAN_COLONISTS: {
    id: 'URBAN_COLONISTS',
    label: 'Scénario Cités & Colons',
    shortLabel: 'Cités & Colons',
    summary: 'Synergies humaines, quartiers Solarpunk modulaires et économie résiliente.',
    accentClass: 'text-sky-600 dark:text-sky-300',
  },
  DIPLO_FRONTIER: {
    id: 'DIPLO_FRONTIER',
    label: 'Scénario Frontière & Alliances',
    shortLabel: 'Frontière',
    summary: 'Secteurs planétaires, flotte orbitale et rayonnement auprès de la Super-Alliance.',
    accentClass: 'text-violet-600 dark:text-violet-300',
  },
  BRANCH_MASTERY: {
    id: 'BRANCH_MASTERY',
    label: 'Scénario Ères & Spécialisations',
    shortLabel: 'Ères & Voies',
    summary: 'Sous-ères branchées (.a/.b/.c), spécialisations et ascension vers l’Ère VIII.',
    accentClass: 'text-indigo-600 dark:text-indigo-300',
  },
};

export const QUEST_SCENARIO_THREAD_LIST: readonly QuestScenarioThreadMeta[] = [
  QUEST_SCENARIO_THREADS.GENESE_2050,
  QUEST_SCENARIO_THREADS.BIOSPHERE_TERRA,
  QUEST_SCENARIO_THREADS.URBAN_COLONISTS,
  QUEST_SCENARIO_THREADS.DIPLO_FRONTIER,
  QUEST_SCENARIO_THREADS.BRANCH_MASTERY,
];

export interface QuestUiMilestones {
  readonly scale3Visited?: boolean;
  readonly colonistSheetOpened?: boolean;
  readonly filterSwitched?: boolean;
  readonly assignmentVisited?: boolean;
}

export interface QuestRewardSpec {
  readonly credits?: number;
  readonly materials?: number;
  readonly water?: number;
  readonly energy?: number;
  readonly compute?: number;
  readonly electronics?: number;
  readonly breathingKits?: number;
  readonly fame?: number;
  readonly summaryLabel: string;
}

export interface CampaignQuestStatus {
  readonly id: string;
  readonly order: number;
  readonly scenarioThreadId: QuestScenarioThreadId;
  readonly scenarioLabel: string;
  readonly eraMin: number;
  readonly eraMax: number;
  readonly branchAffinity?: EraBranchId;
  readonly linkedDossierClasses: readonly DossierClass[];
  readonly chapter: string;
  readonly title: string;
  readonly objective: string;
  readonly hint: string;
  readonly progress: number;
  readonly target: number;
  readonly completed: boolean;
  readonly claimed: boolean;
  readonly targetLink: QuestTargetLink;
  readonly reward: QuestRewardSpec;
}

export interface QuestThreadGroup {
  readonly groupId: string;
  readonly label: string;
  readonly subtitle: string;
  readonly accentClass: string;
  readonly quests: readonly CampaignQuestStatus[];
  readonly completedCount: number;
  readonly claimedCount: number;
  readonly claimableCount: number;
  readonly totalCount: number;
  readonly pctComplete: number;
}

interface InternalQuestDef {
  readonly id: string;
  readonly order: number;
  readonly scenarioThreadId: QuestScenarioThreadId;
  readonly eraMin: number;
  readonly eraMax: number;
  readonly branchAffinity?: EraBranchId;
  readonly linkedDossierClasses: readonly DossierClass[];
  readonly chapter: string;
  readonly title: string;
  readonly objective: string;
  readonly hint: string;
  readonly target: number;
  readonly targetLink: QuestTargetLink;
  readonly reward: QuestRewardSpec;
  readonly computeProgress: (world: WorldState, ui: QuestUiMilestones) => number;
}

const CAMPAIGN_QUEST_DEFS: readonly InternalQuestDef[] = [
  // ── FIL 1 : GENÈSE 2050 ───────────────────────────────────────────
  {
    id: 'q-brief-orbit',
    order: 1,
    scenarioThreadId: 'GENESE_2050',
    eraMin: 1,
    eraMax: 2,
    linkedDossierClasses: ['P0', 'C1', 'C2'],
    chapter: 'Protocole Orbital',
    title: 'Inspection de la Cité Ouverte',
    objective: 'Basculer en Échelle 3 (Ville) pour inspecter vos quartiers à ciel ouvert.',
    hint: 'Cliquez sur « 3:Ville » dans la barre supérieure ou via « Y aller ».',
    target: 1,
    targetLink: 'SCALE_3',
    reward: {
      credits: 120,
      materials: 20,
      fame: 10,
      summaryLabel: '+120 Cr · +20 Mat. · +10 Ren.',
    },
    computeProgress: (world, ui) => (ui.scale3Visited || world.activeScale === 3 || world.cycle >= 1 ? 1 : 0),
  },
  {
    id: 'q-dossier-1',
    order: 2,
    scenarioThreadId: 'GENESE_2050',
    eraMin: 1,
    eraMax: 3,
    linkedDossierClasses: ['P0', 'C1', 'C2', 'C3', 'C4', 'C5'],
    chapter: 'Gouvernance Exécutive',
    title: 'Premier Arbitrage Exécutif',
    objective: 'Traiter un premier dossier dans Événements (ou via la Baguette Magique).',
    hint: 'Ouvrez Événements ou utilisez la Baguette Magique en haut d’un dossier.',
    target: 1,
    targetLink: 'EVENTS_HUB',
    reward: {
      credits: 140,
      compute: 15,
      summaryLabel: '+140 Cr · +15 Calcul',
    },
    computeProgress: (world) =>
      world.chronicle.some((entry) => entry.category === 'DOSSIER') || world.cycle >= 1 ? 1 : 0,
  },
  {
    id: 'q-end-turn-1',
    order: 3,
    scenarioThreadId: 'GENESE_2050',
    eraMin: 1,
    eraMax: 2,
    linkedDossierClasses: ['P0', 'C1', 'C5'],
    chapter: 'Rythme Solaire',
    title: 'Premier Cycle Solaire Validé',
    objective: 'Valider votre premier tour complet via « Fin de tour → ».',
    hint: 'Résolvez les dossiers en attente puis cliquez « Fin de tour → ».',
    target: 1,
    targetLink: 'END_TURN',
    reward: {
      credits: 180,
      compute: 25,
      fame: 15,
      summaryLabel: '+180 Cr · +25 Calcul · +15 Ren.',
    },
    computeProgress: (world) => Math.min(1, world.cycle),
  },
  {
    id: 'q-astralis-cadence',
    order: 4,
    scenarioThreadId: 'GENESE_2050',
    eraMin: 1,
    eraMax: 5,
    linkedDossierClasses: ['P0', 'C1', 'C2', 'C3', 'C4', 'C5'],
    chapter: 'Cadence Astralis',
    title: 'Maîtrise de la Main Exécutive',
    objective: 'Arbitrer au moins 5 dossiers exécutifs cumulés dans la Chronique.',
    hint: 'Enchaînez vos événements via la file à 7 cartes ou la Baguette Magique.',
    target: 5,
    targetLink: 'EVENTS_HUB',
    reward: {
      credits: 240,
      compute: 30,
      fame: 30,
      summaryLabel: '+240 Cr · +30 Calcul · +30 Ren.',
    },
    computeProgress: (world) =>
      Math.min(5, world.chronicle.filter((e) => e.category === 'DOSSIER').length),
  },

  // ── FIL 2 : BIOSPHÈRE & CLIMAT ────────────────────────────────────
  {
    id: 'q-atmo-stabilize',
    order: 5,
    scenarioThreadId: 'BIOSPHERE_TERRA',
    eraMin: 1,
    eraMax: 3,
    branchAffinity: 'BIOSPHERE',
    linkedDossierClasses: ['P0', 'C3'],
    chapter: 'Terraformation',
    title: 'Percée Atmosphère Stabilisée',
    objective: 'Atteindre 28 % d’avancement atmosphérique (vers Atmosphère Stabilisée).',
    hint: 'Investissez dans les Bio-Parcs, les dossiers écologiques et la biosphère.',
    target: 28,
    targetLink: 'WORLDS_BIOSPHERE',
    reward: {
      credits: 260,
      water: 35,
      fame: 40,
      summaryLabel: '+260 Cr · +35 Eau · +40 Ren.',
    },
    computeProgress: (world) =>
      world.atmosphereTier !== 'P1' ? 28 : Math.min(28, Math.round(world.atmosphereProgress)),
  },
  {
    id: 'q-bio-hydro-reserve',
    order: 6,
    scenarioThreadId: 'BIOSPHERE_TERRA',
    eraMin: 2,
    eraMax: 5,
    branchAffinity: 'BIOSPHERE',
    linkedDossierClasses: ['C3', 'C2'],
    chapter: 'Cycle Hydrique',
    title: 'Autonomie Hydrique & Oxygène',
    objective: 'Constituer une réserve d’au moins 140 unités d’Eau et 50 Kits O₂.',
    hint: 'Privilégiez les sous-choix biosphère et les extensions hydro-écologiques.',
    target: 2,
    targetLink: 'WORLDS_BIOSPHERE',
    reward: {
      water: 45,
      breathingKits: 25,
      fame: 45,
      summaryLabel: '+45 Eau · +25 Kits O₂ · +45 Ren.',
    },
    computeProgress: (world) =>
      (world.resources.water >= 140 ? 1 : 0) + (world.resources.breathingKits >= 50 ? 1 : 0),
  },
  {
    id: 'q-atmo-open-sky',
    order: 7,
    scenarioThreadId: 'BIOSPHERE_TERRA',
    eraMin: 3,
    eraMax: 6,
    branchAffinity: 'BIOSPHERE',
    linkedDossierClasses: ['P0', 'C3'],
    chapter: 'Air Libre',
    title: 'Horizon Biosphère Ouverte',
    objective: 'Atteindre 60 % d’avancement atmosphérique à ciel ouvert.',
    hint: 'Cumulez spécialisations Biosphère et grands chantiers écologiques.',
    target: 60,
    targetLink: 'WORLDS_BIOSPHERE',
    reward: {
      credits: 420,
      water: 60,
      fame: 90,
      summaryLabel: '+420 Cr · +60 Eau · +90 Ren.',
    },
    computeProgress: (world) => Math.min(60, Math.round(world.atmosphereProgress)),
  },
  {
    id: 'q-atmo-gaia',
    order: 8,
    scenarioThreadId: 'BIOSPHERE_TERRA',
    eraMin: 5,
    eraMax: 8,
    branchAffinity: 'BIOSPHERE',
    linkedDossierClasses: ['P0', 'C3'],
    chapter: 'Symbiose Totale',
    title: 'Sanctuaire Gaïa 2050',
    objective: 'Porter l’indice atmosphérique planétaire à 85 % ou plus.',
    hint: 'Maintenez l’équilibre des 5 divisions scientifiques jusqu’aux ères avancées.',
    target: 85,
    targetLink: 'WORLDS_BIOSPHERE',
    reward: {
      credits: 650,
      energy: 60,
      fame: 150,
      summaryLabel: '+650 Cr · +60 Énerg. · +150 Ren.',
    },
    computeProgress: (world) => Math.min(85, Math.round(world.atmosphereProgress)),
  },

  // ── FIL 3 : CITÉS & COLONS ────────────────────────────────────────
  {
    id: 'q-workforce-synergy',
    order: 9,
    scenarioThreadId: 'URBAN_COLONISTS',
    eraMin: 1,
    eraMax: 3,
    branchAffinity: 'CIVIC',
    linkedDossierClasses: ['C1', 'C2'],
    chapter: 'Capital Humain',
    title: 'Synergie d’Équipe & Colons',
    objective: 'Ouvrir une fiche colon (photo) ou atteindre 3 affectations synergiques.',
    hint: 'Allez dans Monde → Colons & Affectations puis cliquez sur la photo d’un colon.',
    target: 1,
    targetLink: 'WORLDS_WORKFORCE',
    reward: {
      credits: 100,
      breathingKits: 15,
      summaryLabel: '+100 Cr · +15 Kits O₂',
    },
    computeProgress: (world, ui) =>
      ui.colonistSheetOpened || countWorkforceSynergies(world) >= 3 ? 1 : 0,
  },
  {
    id: 'q-build-extension',
    order: 10,
    scenarioThreadId: 'URBAN_COLONISTS',
    eraMin: 1,
    eraMax: 4,
    branchAffinity: 'INDUSTRY',
    linkedDossierClasses: ['C2', 'C1'],
    chapter: 'Urbanisme Solarpunk',
    title: 'Expansion Modulaire',
    objective: 'Atteindre 5 extensions de quartiers greffées sur la cité.',
    hint: 'Dans Monde → Territoires & Cités, cliquez « Ext. » sur un quartier.',
    target: 5,
    targetLink: 'WORLDS_CITIES',
    reward: {
      materials: 45,
      electronics: 25,
      summaryLabel: '+45 Mat. · +25 Électron.',
    },
    computeProgress: (world) =>
      Math.min(
        5,
        world.districts.reduce((acc, d) => acc + d.modulesCount, 0),
      ),
  },
  {
    id: 'q-civic-approval',
    order: 11,
    scenarioThreadId: 'URBAN_COLONISTS',
    eraMin: 2,
    eraMax: 6,
    branchAffinity: 'CIVIC',
    linkedDossierClasses: ['C1', 'C4'],
    chapter: 'Concorde Civique',
    title: 'Plébiscite Citoyen 80 %',
    objective: 'Porter l’approbation citoyenne à 80 % ou plus.',
    hint: 'Tenez vos promesses et privilégiez les arbitrages sociaux et écologiques.',
    target: 80,
    targetLink: 'EVENTS_HUB',
    reward: {
      credits: 280,
      compute: 35,
      fame: 60,
      summaryLabel: '+280 Cr · +35 Calcul · +60 Ren.',
    },
    computeProgress: (world) => Math.min(80, Math.round(world.approval)),
  },
  {
    id: 'q-industry-treasury',
    order: 12,
    scenarioThreadId: 'URBAN_COLONISTS',
    eraMin: 3,
    eraMax: 8,
    branchAffinity: 'INDUSTRY',
    linkedDossierClasses: ['C2', 'C5'],
    chapter: 'Puissance Industrielle',
    title: 'Trésorerie Souveraine 3 000 Cr',
    objective: 'Atteindre une trésorerie de 3 000 Crédits fédéraux.',
    hint: 'Développez les extensions d’énergie/commerce et les spécialisations Industrie.',
    target: 3000,
    targetLink: 'WORLDS_CITIES',
    reward: {
      materials: 80,
      electronics: 45,
      fame: 85,
      summaryLabel: '+80 Mat. · +45 Électron. · +85 Ren.',
    },
    computeProgress: (world) => Math.min(3000, Math.max(0, Math.round(world.resources.credits))),
  },

  // ── FIL 4 : FRONTIÈRE & ALLIANCES ─────────────────────────────────
  {
    id: 'q-sector-expand',
    order: 13,
    scenarioThreadId: 'DIPLO_FRONTIER',
    eraMin: 1,
    eraMax: 4,
    branchAffinity: 'FRONTIER',
    linkedDossierClasses: ['C4', 'C5'],
    chapter: 'Frontière Géodésique',
    title: 'Consolidation Territoriale',
    objective: 'Contrôler au moins 15 secteurs planétaires sur le globe (15/72).',
    hint: 'Sélectionnez un secteur adjacent sur le globe pour lancer une sécurisation.',
    target: 15,
    targetLink: 'SCALE_2',
    reward: {
      credits: 300,
      energy: 30,
      fame: 50,
      summaryLabel: '+300 Cr · +30 Énerg. · +50 Ren.',
    },
    computeProgress: (world) => Math.min(15, world.capturedTiles.length),
  },
  {
    id: 'q-alliance-trust',
    order: 14,
    scenarioThreadId: 'DIPLO_FRONTIER',
    eraMin: 2,
    eraMax: 6,
    branchAffinity: 'FRONTIER',
    linkedDossierClasses: ['C4', 'P0'],
    chapter: 'Super-Alliance',
    title: 'Mandat de Confiance Fédérale',
    objective: 'Hisser la confiance de la Super-Alliance à 75 % ou plus.',
    hint: 'Signez des accords diplomatiques et honorez les dossiers fédéraux.',
    target: 75,
    targetLink: 'EVENTS_HUB',
    reward: {
      credits: 320,
      compute: 40,
      fame: 70,
      summaryLabel: '+320 Cr · +40 Calcul · +70 Ren.',
    },
    computeProgress: (world) => Math.min(75, Math.round(world.superAllianceTrust)),
  },
  {
    id: 'q-orbital-fleet',
    order: 15,
    scenarioThreadId: 'DIPLO_FRONTIER',
    eraMin: 3,
    eraMax: 8,
    branchAffinity: 'FRONTIER',
    linkedDossierClasses: ['C4', 'C5'],
    chapter: 'Horizon Orbital',
    title: 'Escadre Civile & Orbitale',
    objective: 'Opérer au moins 4 vaisseaux actifs dans votre flotte orbitale.',
    hint: 'Armez ou commandez de nouveaux vaisseaux depuis Monde ou Événements.',
    target: 4,
    targetLink: 'SCALE_2',
    reward: {
      credits: 450,
      electronics: 50,
      fame: 95,
      summaryLabel: '+450 Cr · +50 Électron. · +95 Ren.',
    },
    computeProgress: (world) => Math.min(4, world.fleetShips?.length ?? 0),
  },

  // ── FIL 5 : ÈRES & SPÉCIALISATIONS (1 → 8) ────────────────────────
  {
    id: 'q-first-subera',
    order: 16,
    scenarioThreadId: 'BRANCH_MASTERY',
    eraMin: 1,
    eraMax: 8,
    linkedDossierClasses: ['P0', 'C1', 'C2', 'C3', 'C4'],
    chapter: 'Sous-Échelle d’Ère',
    title: 'Première Spécialisation de Branche',
    objective: 'Activer votre 1re spécialisation de sous-ère (.a → .b) parmi les 4 voies.',
    hint: 'Cumulez 3★ puis ouvrez le panneau d’Ère (en haut) pour choisir votre spécialisation.',
    target: 1,
    targetLink: 'ERA_PANEL',
    reward: {
      credits: 220,
      compute: 25,
      fame: 45,
      summaryLabel: '+220 Cr · +25 Calcul · +45 Ren.',
    },
    computeProgress: (world) =>
      Math.min(1, world.hk?.chosenSpecializations?.length ?? ((world.hk?.subEra ?? 1) > 1 ? 1 : 0)),
  },
  {
    id: 'q-era-2-reach',
    order: 17,
    scenarioThreadId: 'BRANCH_MASTERY',
    eraMin: 1,
    eraMax: 3,
    linkedDossierClasses: ['P0', 'C1', 'C4'],
    chapter: 'Ère II — Fédération',
    title: 'Avènement de l’Ère II',
    objective: 'Franchir le cap de l’Ère II avec une spécialisation fédérale.',
    hint: 'Atteignez 7★ dans l’Ère I puis déclenchez la transition d’Ère.',
    target: 2,
    targetLink: 'ERA_PANEL',
    reward: {
      credits: 350,
      materials: 50,
      fame: 80,
      summaryLabel: '+350 Cr · +50 Mat. · +80 Ren.',
    },
    computeProgress: (world) => Math.min(2, world.era),
  },
  {
    id: 'q-era-4-reach',
    order: 18,
    scenarioThreadId: 'BRANCH_MASTERY',
    eraMin: 3,
    eraMax: 5,
    linkedDossierClasses: ['P0', 'C3', 'C4'],
    chapter: 'Ère IV — Biosphère Ouverte',
    title: 'Cap de l’Ère IV & 3 Spécialisations',
    objective: 'Atteindre l’Ère IV ou cumuler au moins 3 spécialisations de branches.',
    hint: 'Alternez ou approfondissez vos 4 voies à chaque palier d’Ère et de Sous-Ère.',
    target: 3,
    targetLink: 'ERA_PANEL',
    reward: {
      credits: 500,
      energy: 50,
      fame: 120,
      summaryLabel: '+500 Cr · +50 Énerg. · +120 Ren.',
    },
    computeProgress: (world) =>
      Math.min(3, Math.max(world.era >= 4 ? 3 : 0, world.hk?.chosenSpecializations?.length ?? 0)),
  },
  {
    id: 'q-era-7-archipelago',
    order: 19,
    scenarioThreadId: 'BRANCH_MASTERY',
    eraMin: 5,
    eraMax: 8,
    linkedDossierClasses: ['P0', 'C4', 'C5'],
    chapter: 'Ère VII — Archipel Stellaire',
    title: 'Horizon de l’Archipel Stellaire',
    objective: 'Atteindre la Macro-Ère VII (Archipel Stellaire).',
    hint: 'Enchaînez les paliers d’étoiles et spécialisations jusqu’à l’Ère 7.',
    target: 7,
    targetLink: 'ERA_PANEL',
    reward: {
      credits: 800,
      compute: 80,
      fame: 200,
      summaryLabel: '+800 Cr · +80 Calcul · +200 Ren.',
    },
    computeProgress: (world) => Math.min(7, world.era),
  },
  {
    id: 'q-era-8-apex',
    order: 20,
    scenarioThreadId: 'BRANCH_MASTERY',
    eraMin: 6,
    eraMax: 8,
    linkedDossierClasses: ['P0', 'C1', 'C2', 'C3', 'C4', 'C5'],
    chapter: 'Ère VIII — Aube Transcendante',
    title: 'Sommet de l’Ère VIII',
    objective: 'Atteindre la Macro-Ère VIII et parachever votre civilisation Solarpunk.',
    hint: 'Complétez les paliers d’étoiles jusqu’à l’Ère 8.',
    target: 8,
    targetLink: 'ERA_PANEL',
    reward: {
      credits: 1200,
      fame: 350,
      summaryLabel: '+1 200 Cr · +350 Ren.',
    },
    computeProgress: (world) => Math.min(8, world.era),
  },
];

export function evaluateCampaignQuests(
  world: WorldState,
  ui: QuestUiMilestones = {},
): readonly CampaignQuestStatus[] {
  const claimedSet = new Set(world.claimedQuestIds ?? []);
  return CAMPAIGN_QUEST_DEFS.map((def) => {
    const claimed = claimedSet.has(def.id);
    const rawProgress = Math.max(0, Math.min(def.target, def.computeProgress(world, ui)));
    const progress = claimed ? def.target : rawProgress;
    const completed = claimed || progress >= def.target;
    const threadMeta = QUEST_SCENARIO_THREADS[def.scenarioThreadId];
    return {
      id: def.id,
      order: def.order,
      scenarioThreadId: def.scenarioThreadId,
      scenarioLabel: threadMeta.shortLabel,
      eraMin: def.eraMin,
      eraMax: def.eraMax,
      branchAffinity: def.branchAffinity,
      linkedDossierClasses: def.linkedDossierClasses,
      chapter: def.chapter,
      title: def.title,
      objective: def.objective,
      hint: def.hint,
      progress,
      target: def.target,
      completed,
      claimed,
      targetLink: def.targetLink,
      reward: def.reward,
    };
  });
}

function buildGroup(
  groupId: string,
  label: string,
  subtitle: string,
  accentClass: string,
  quests: readonly CampaignQuestStatus[],
): QuestThreadGroup {
  const completedCount = quests.filter((q) => q.completed).length;
  const claimedCount = quests.filter((q) => q.claimed).length;
  const claimableCount = quests.filter((q) => q.completed && !q.claimed).length;
  const totalCount = quests.length;
  const pctComplete =
    totalCount > 0
      ? Math.round(
          (quests.reduce((acc, q) => acc + Math.min(1, q.target > 0 ? q.progress / q.target : 0), 0) /
            totalCount) *
            100,
        )
      : 0;
  return {
    groupId,
    label,
    subtitle,
    accentClass,
    quests,
    completedCount,
    claimedCount,
    claimableCount,
    totalCount,
    pctComplete,
  };
}

export function groupQuestsByScenarioThread(
  statuses: readonly CampaignQuestStatus[],
): readonly QuestThreadGroup[] {
  return QUEST_SCENARIO_THREAD_LIST.map((meta) =>
    buildGroup(
      meta.id,
      meta.label,
      meta.summary,
      meta.accentClass,
      statuses.filter((q) => q.scenarioThreadId === meta.id),
    ),
  ).filter((g) => g.quests.length > 0);
}

export function groupQuestsByEra(
  statuses: readonly CampaignQuestStatus[],
  currentEra: number,
): readonly QuestThreadGroup[] {
  const bands: readonly { id: string; eraRef: number; min: number; max: number; accent: string }[] = [
    { id: 'ERA_1', eraRef: 1, min: 1, max: 1, accent: 'text-amber-600 dark:text-amber-300' },
    { id: 'ERA_2_3', eraRef: 2, min: 2, max: 3, accent: 'text-emerald-600 dark:text-emerald-300' },
    { id: 'ERA_4_5', eraRef: 4, min: 4, max: 5, accent: 'text-sky-600 dark:text-sky-300' },
    { id: 'ERA_6_8', eraRef: 6, min: 6, max: 8, accent: 'text-violet-600 dark:text-violet-300' },
  ];

  return bands
    .map((band) => {
      const meta = getMacroEraMeta(band.eraRef);
      const quests = statuses.filter((q) => q.eraMin >= band.min && q.eraMin <= band.max);
      const isCurrent = currentEra >= band.min && currentEra <= band.max;
      const label =
        band.min === band.max
          ? `Ère ${band.min} · ${meta.name}`
          : `Ères ${band.min}–${band.max} · ${meta.name}`;
      const subtitle = isCurrent
        ? `Palier actif (Ère ${currentEra}/8)`
        : currentEra > band.max
          ? 'Palier franchi'
          : 'Palier à venir';
      return buildGroup(band.id, label, subtitle, band.accent, quests);
    })
    .filter((g) => g.quests.length > 0);
}

export function getQuestsImpactedByDossier(
  world: WorldState,
  dossier: ExecutiveDossier,
  ui: QuestUiMilestones = {},
): readonly CampaignQuestStatus[] {
  const all = evaluateCampaignQuests(world, ui);
  const activeBranch = world.hk?.activeBranchId ?? 'BIOSPHERE';

  const scored = all
    .filter((q) => !q.claimed)
    .map((q) => {
      let score = 0;
      if (q.linkedDossierClasses.includes(dossier.dossierClass)) score += 3;
      if (world.era >= q.eraMin && world.era <= q.eraMax) score += 2;
      if (q.branchAffinity && q.branchAffinity === activeBranch) score += 2;
      if (q.completed && !q.claimed) score += 4;
      if (q.progress > 0 && !q.completed) score += 1;
      return { quest: q, score };
    })
    .filter((item) => item.score >= 3)
    .sort((a, b) => b.score - a.score || a.quest.order - b.quest.order);

  return scored.slice(0, 4).map((item) => item.quest);
}

export function getActiveQuestFocus(
  statuses: readonly CampaignQuestStatus[],
): CampaignQuestStatus | null {
  const claimable = statuses.find((q) => q.completed && !q.claimed);
  if (claimable) return claimable;
  const nextPending = statuses.find((q) => !q.completed);
  return nextPending ?? null;
}

export function applyQuestRewardToWorld(
  world: WorldState,
  questId: string,
  ui: QuestUiMilestones = {},
): { readonly nextState: WorldState; readonly quest: CampaignQuestStatus } | null {
  const statuses = evaluateCampaignQuests(world, ui);
  const quest = statuses.find((q) => q.id === questId);
  if (!quest || !quest.completed || quest.claimed) return null;

  const r = quest.reward;
  const currentClaimed = world.claimedQuestIds ?? [];
  const nextState: WorldState = {
    ...world,
    claimedQuestIds: [...currentClaimed, quest.id],
    resources: {
      ...world.resources,
      credits: world.resources.credits + (r.credits ?? 0),
      materials: world.resources.materials + (r.materials ?? 0),
      water: world.resources.water + (r.water ?? 0),
      energy: world.resources.energy + (r.energy ?? 0),
      compute: world.resources.compute + (r.compute ?? 0),
      electronics: world.resources.electronics + (r.electronics ?? 0),
      breathingKits: world.resources.breathingKits + (r.breathingKits ?? 0),
    },
    hk: world.hk
      ? {
          ...world.hk,
          fame: world.hk.fame + (r.fame ?? 0),
        }
      : world.hk,
    xp: {
      ...world.xp,
      civilization: world.xp.civilization + (r.fame ?? 5),
    },
  };
  return { nextState, quest };
}
