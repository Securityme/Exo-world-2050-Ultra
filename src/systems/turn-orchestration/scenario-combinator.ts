import type { DossierClass, ExecutiveDossier } from '../../contracts/pa-dossiers.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import {
  ERA_BRANCHES,
  formatSubEraLetter,
  getMacroEraMeta,
  getSubEraScaleTitle,
} from '../../data/eras-specializations.data.ts';
import { evaluateCampaignQuests, type QuestUiMilestones } from '../quests/campaign-quests.ts';

/**
 * [L3] EXW.L3.SCENARIO_COMBINATOR | v5.2.0 | SADT A4.1
 * Live Combinatorial Scenario Assembler:
 * Extracts real-time bricks from WorldState (Era/Sub-Era/Branch/Specializations,
 * Active Quest Threads, Resource/District/Colonist/Diplomatic Tensions) to assemble
 * a structured CombinatorialBrief for the live Gemini 4T LLM pipeline, AND provides
 * a local combinatorial dossier synthesizer for instant Astralis bonus draws / T4 fallback.
 */

export interface CombinatorialRecipeBrick {
  readonly recipeId: string;
  readonly category: DossierClass;
  readonly actor: string;
  readonly location: string;
  readonly stake: string;
  readonly lever: string;
  readonly questThread: string;
}

export interface CombinatorialScenarioBrief {
  readonly eraLabel: string;
  readonly subEraCode: string;
  readonly branchLabel: string;
  readonly specializationTitles: readonly string[];
  readonly activeQuestHighlights: readonly string[];
  readonly worldTensions: readonly string[];
  readonly combinationMatrix: readonly CombinatorialRecipeBrick[];
}

function pickTopWorldTensions(world: WorldState): readonly string[] {
  const tensions: string[] = [];
  if (world.resources.credits < 260) {
    tensions.push(`Trésorerie tendue (${Math.round(world.resources.credits)} Cr)`);
  }
  if (world.resources.energy < 35) {
    tensions.push(`Réserve énergétique basse (${Math.round(world.resources.energy)} Énerg.)`);
  }
  if (world.resources.water < 35) {
    tensions.push(`Stress hydrique local (${Math.round(world.resources.water)} Eau)`);
  }
  if (world.resources.food < 35) {
    tensions.push(`Tension alimentaire (${Math.round(world.resources.food)} Vivres)`);
  }
  if (world.approval < 58) {
    tensions.push(`Approbation citoyenne fragile (${Math.round(world.approval)}%)`);
  }
  if (world.atmosphereProgress < 32) {
    tensions.push(`Biosphère en phase pionnière (${Math.round(world.atmosphereProgress)}% Air)`);
  }

  const wornDistrict = [...world.districts].sort((a, b) => a.integrity - b.integrity)[0];
  if (wornDistrict && wornDistrict.integrity < 82) {
    tensions.push(`Usure du quartier ${wornDistrict.name} (${Math.round(wornDistrict.integrity)}%)`);
  }

  const tiredColonist = [...world.colonists].sort((a, b) => b.fatigue - a.fatigue)[0];
  if (tiredColonist && tiredColonist.fatigue >= 45) {
    tensions.push(`Fatigue de ${tiredColonist.name} (${Math.round(tiredColonist.fatigue)}%)`);
  }

  const activePromise = (world.promises ?? []).find((p) => p.status === 'ACTIVE');
  if (activePromise) {
    tensions.push(`Promesse active : ${activePromise.title}`);
  }

  const tenseRival = [...world.rivals].sort((a, b) => a.relationWithPlayer - b.relationWithPlayer)[0];
  if (tenseRival && tenseRival.relationWithPlayer < 10) {
    tensions.push(`Pression diplomatique avec ${tenseRival.name} (${tenseRival.relationWithPlayer})`);
  }

  if (tensions.length === 0) {
    tensions.push(`Fenêtre d’opportunité stable en ${world.season} ${world.year}`);
  }
  return tensions.slice(0, 6);
}

export function buildCombinatorialScenarioBrief(
  world: WorldState,
  ui: QuestUiMilestones = {},
): CombinatorialScenarioBrief {
  const subEra = world.hk?.subEra ?? 1;
  const branchId = world.hk?.activeBranchId ?? 'BIOSPHERE';
  const macroMeta = getMacroEraMeta(world.era);
  const subTitle = getSubEraScaleTitle(world.era, subEra, branchId);
  const branchMeta = ERA_BRANCHES[branchId];
  const subEraCode = `${world.era}.${formatSubEraLetter(subEra)}`;

  const specializationTitles = (world.hk?.chosenSpecializations ?? [])
    .slice(-4)
    .map((s) => `${s.era}.${formatSubEraLetter(s.subEra)} ${s.title}`);

  const quests = evaluateCampaignQuests(world, ui)
    .filter((q) => !q.claimed)
    .sort((a, b) => {
      const ratioA = a.target > 0 ? a.progress / a.target : 0;
      const ratioB = b.target > 0 ? b.progress / b.target : 0;
      return ratioB - ratioA;
    });

  const activeQuestHighlights = quests
    .slice(0, 4)
    .map((q) => `[${q.scenarioLabel}] ${q.title} (${q.progress}/${q.target})`);

  const worldTensions = pickTopWorldTensions(world);

  const primaryDistrict = world.districts[world.cycle % Math.max(1, world.districts.length)];
  const secondDistrict = world.districts[(world.cycle + 1) % Math.max(1, world.districts.length)] ?? primaryDistrict;
  const leadAdvisor = world.advisors[world.cycle % Math.max(1, world.advisors.length)];
  const activeColonist = world.colonists[world.cycle % Math.max(1, world.colonists.length)];
  const rival = world.rivals[world.cycle % Math.max(1, world.rivals.length)];

  const combinationMatrix: CombinatorialRecipeBrick[] = [
    {
      recipeId: `comb-c${world.cycle}-bio`,
      category: 'C3',
      actor: activeColonist?.name ?? 'Équipe Biosphère',
      location: primaryDistrict?.name ?? 'Baie Solarpunk',
      stake: worldTensions[0] ?? 'Accélération de la biosphère ouverte',
      lever: `Voie ${branchMeta.shortLabel} (${subTitle})`,
      questThread: quests.find((q) => q.scenarioThreadId === 'BIOSPHERE_TERRA')?.title ?? 'Percée Atmosphère',
    },
    {
      recipeId: `comb-c${world.cycle}-urban`,
      category: 'C2',
      actor: leadAdvisor?.name ?? 'Cabinet Technique',
      location: secondDistrict?.name ?? 'Hub Industriel',
      stake: worldTensions[1] ?? 'Rendement modulaire des quartiers',
      lever: 'Extensions & Synergie Colons',
      questThread: quests.find((q) => q.scenarioThreadId === 'URBAN_COLONISTS')?.title ?? 'Expansion Modulaire',
    },
    {
      recipeId: `comb-c${world.cycle}-diplo`,
      category: 'C4',
      actor: rival?.name ?? 'Conseil Super-Alliance',
      location: `Secteur Orbital #${world.activeSlotIndex}`,
      stake: worldTensions[2] ?? 'Équilibre des routes fédérales',
      lever: 'Traités & Flotte Civile',
      questThread: quests.find((q) => q.scenarioThreadId === 'DIPLO_FRONTIER')?.title ?? 'Consolidation Territoriale',
    },
  ];

  return {
    eraLabel: `${macroMeta.code} ${macroMeta.name} (${subTitle})`,
    subEraCode,
    branchLabel: branchMeta.label,
    specializationTitles,
    activeQuestHighlights,
    worldTensions,
    combinationMatrix,
  };
}

/**
 * Synthesizes an immediately playable combinatorial dossier from the live WorldState
 * (used for Astralis bonus card draws when PA & resources remain, or as T4 fallback).
 */
export function synthesizeCombinatorialBonusDossier(
  world: WorldState,
  drawIndex: number,
): ExecutiveDossier {
  const brief = buildCombinatorialScenarioBrief(world);
  const brick =
    brief.combinationMatrix[drawIndex % Math.max(1, brief.combinationMatrix.length)] ??
    brief.combinationMatrix[0]!;

  const domainMap: Record<DossierClass, 'PA_GES' | 'PA_MNT' | 'PA_BIO' | 'PA_POL'> = {
    P0: 'PA_GES',
    C1: 'PA_GES',
    C2: 'PA_MNT',
    C3: 'PA_BIO',
    C4: 'PA_POL',
    C5: 'PA_MNT',
  };
  const subDomain = domainMap[brick.category] ?? 'PA_GES';
  const code = `CMB-E${world.era}-C${world.cycle}-D${drawIndex + 1}`;
  const tileIndex = world.capturedTiles[drawIndex % Math.max(1, world.capturedTiles.length)] ?? 12;

  return {
    id: `dos-comb-${world.cycle}-${world.tick}-${drawIndex + 1}`,
    code,
    dossierClass: brick.category,
    title: `${brick.location} : ${brick.lever}`,
    briefing: `[${brief.subEraCode} · ${brief.branchLabel}] ${brick.actor} signale une fenêtre d’action sur ${brick.location} face à « ${brick.stake} ». Cet arbitrage nourrit directement le fil « ${brick.questThread} ».`,
    source: 'CATALOG',
    slotIndex: world.activeSlotIndex,
    tileIndex,
    expiresInCycles: 2,
    scientificTag: `${brief.subEraCode} · ${brick.questThread}`.slice(0, 78),
    selectionBudget: {
      mode: 'BUDGETED_MULTI',
      maxSelections: 2,
      paBudgetCap: 4,
      creditsBudgetCap: 450,
      requireColonistOnBundle: false,
    },
    options: [
      {
        id: `${code}-opt-bio`,
        label: `Protocole ${brick.lever.slice(0, 42)}`,
        doctrineTag: 'SOLARPUNK',
        description: `Mobiliser ${brick.actor} à ${brick.location} pour transformer « ${brick.stake} » en gain durable.`,
        paGeneralCost: 0,
        subPaDomain: subDomain,
        subPaCost: 1,
        effects: {
          credits: -60,
          energy: 14,
          materials: 12,
          water: 16,
          food: 8,
          electronics: 4,
          compute: 12,
          breathingKits: 8,
          approvalDelta: 4,
          atmosphereDelta: 3,
          maintenanceDelta: 6,
          allianceTrustDelta: 3,
          eraStarsDelta: 1,
          xpCiv: 25,
          xpCabinet: 15,
          xpAlliance: 15,
          oracleImpactFactor: 0.05,
        },
      },
      {
        id: `${code}-opt-ind`,
        label: `Accélération logistique sur ${brick.location.slice(0, 32)}`,
        doctrineTag: 'CORPORATE',
        description: `Optimiser les flux matériels et financiers autour de ${brick.location} avec rendement rapide.`,
        paGeneralCost: 1,
        subPaDomain: null,
        subPaCost: 0,
        effects: {
          credits: 135,
          energy: -6,
          materials: 22,
          water: 0,
          food: 0,
          electronics: 10,
          compute: 8,
          breathingKits: 0,
          approvalDelta: 1,
          atmosphereDelta: 0,
          maintenanceDelta: 4,
          allianceTrustDelta: 1,
          eraStarsDelta: 0,
          xpCiv: 20,
          xpCabinet: 20,
          xpAlliance: 10,
          oracleImpactFactor: 0.03,
        },
      },
      {
        id: `${code}-opt-sci`,
        label: `Synergie recherche & fil « ${brick.questThread.slice(0, 28)} »`,
        doctrineTag: 'SCIENTIFIC',
        description: `Coupler les capteurs de ${brick.location} au réseau fédéral sans surcharge de PA pour accélérer les quêtes.`,
        paGeneralCost: 0,
        subPaDomain: null,
        subPaCost: 0,
        effects: {
          credits: -45,
          energy: 6,
          materials: 6,
          water: 8,
          food: 4,
          electronics: 12,
          compute: 24,
          breathingKits: 4,
          approvalDelta: 3,
          atmosphereDelta: 2,
          maintenanceDelta: 3,
          allianceTrustDelta: 4,
          eraStarsDelta: 1,
          xpCiv: 30,
          xpCabinet: 25,
          xpAlliance: 20,
          oracleImpactFactor: 0.06,
        },
      },
    ],
  };
}
