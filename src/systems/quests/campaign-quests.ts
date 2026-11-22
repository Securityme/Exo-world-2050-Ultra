import type { WorldState } from '../../contracts/world-state.schema.ts';
import { countWorkforceSynergies } from '../economy-urban/workforce-assignments.ts';

/**
 * [L3] EXW.L3.CAMPAIGN_QUESTS | v4.1.0 | SADT A3.1
 * Pure Anno / Idle progressive campaign quests tracking live WorldState & UI milestones.
 * Zero I/O, zero Math.random(), zero Date.now(), zero Z0/R-50 terms.
 */

export type QuestTargetLink =
  | 'SCALE_3'
  | 'SCALE_2'
  | 'EVENTS_HUB'
  | 'WORLDS_WORKFORCE'
  | 'WORLDS_CITIES'
  | 'WORLDS_BIOSPHERE'
  | 'END_TURN';

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

interface InternalQuestDef {
  readonly id: string;
  readonly order: number;
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
  {
    id: 'q-brief-orbit',
    order: 1,
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
    chapter: 'Gouvernance Exécutive',
    title: 'Premier Arbitrage Exécutif',
    objective: 'Traiter un premier dossier dans Événements (ou via un repère 3D).',
    hint: 'Ouvrez Événements ou cliquez sur un losange dossier sur le globe.',
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
    id: 'q-workforce-synergy',
    order: 3,
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
    order: 4,
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
    id: 'q-end-turn-1',
    order: 5,
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
    id: 'q-atmo-stabilize',
    order: 6,
    chapter: 'Terraformation',
    title: 'Percée Atmosphère Stabilisée',
    objective: 'Atteindre 28% d’avancement atmosphérique (vers Atmosphère Stabilisée).',
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
    id: 'q-sector-expand',
    order: 7,
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
    return {
      id: def.id,
      order: def.order,
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
