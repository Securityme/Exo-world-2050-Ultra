import type {
  DossierOption,
  ExecutiveDecisionIntent,
  ExecutiveDossier,
  RefinementLevel,
} from '../../contracts/pa-dossiers.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import {
  evaluateBudgetedSelection,
  resolveDossierSelectionBudget,
} from './budgeted-selection.engine.ts';
import {
  getEffectiveOptionsForDossier,
  getSubChoicesForOption,
} from './dossier-subchoices.ts';
import { resolveDossierContext } from './entity-markup.ts';
import {
  evaluateOptionUnlockFactors,
  findRecommendedColonistsForOption,
} from './multi-factor-unlock.engine.ts';
import {
  computeTurnPaProgress,
  evaluateOptionPaAffordability,
  getDossierPaBounds,
} from './pa-progress.ts';

/**
 * [L3] EXW.L3.MAGIC_WAND_ASTRALIS | v5.2.0 | SADT A2.2
 * Pure Astralis-inspired 7-Card Event Hand & Magic Wand Auto-Arbitration Engine.
 * - Organizes active turn dossiers into a prioritized 7-card Astralis hand
 * - Selects a 100% valid, unlocked & affordable random arbitration plan (options, sub-choice,
 *   intensity, bonus module, advisor & colonists)
 * - Chains seamlessly to the next playable card or detects when bonus card draws are allowed
 */

export const ASTRALIS_HAND_LIMIT = 7;
export const MAX_BONUS_DRAWS_PER_CYCLE = 4;

export type BonusModuleTag = 'NONE' | 'ENERGY_BOOST' | 'STORAGE_BAY' | 'OUTPUT_CORE';

export interface AstralisCardSlot {
  readonly slotNumber: number;
  readonly dossier: ExecutiveDossier;
  readonly playable: boolean;
  readonly urgent: boolean;
  readonly minPaCost: number;
  readonly blockedReason: string | null;
}

export interface AstralisHandState {
  readonly cards: readonly AstralisCardSlot[];
  readonly totalActiveCount: number;
  readonly playableCount: number;
  readonly handLimit: number;
  readonly bonusDrawsUsed: number;
  readonly bonusDrawsRemaining: number;
  readonly canDrawBonusCard: boolean;
  readonly drawBlockedReason: string | null;
}

export interface MagicWandPickResult {
  readonly intent: ExecutiveDecisionIntent;
  readonly selectedOptionLabels: readonly string[];
  readonly subChoiceLabel: string;
  readonly moduleLabel: string;
  readonly estimatedPaCost: number;
}

function deterministicHash(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function isOptionResourceAffordable(world: WorldState, opt: DossierOption): boolean {
  const fx = opt.effects;
  if (fx.credits < 0 && world.resources.credits + fx.credits < -50) return false;
  if (fx.energy < 0 && world.resources.energy + fx.energy < 0) return false;
  if (fx.materials < 0 && world.resources.materials + fx.materials < 0) return false;
  if (fx.water < 0 && world.resources.water + fx.water < 0) return false;
  if (fx.compute < 0 && world.resources.compute + fx.compute < 0) return false;
  return true;
}

function evaluateDossierCardPlayability(
  world: WorldState,
  dossier: ExecutiveDossier,
): { readonly playable: boolean; readonly blockedReason: string | null; readonly minPaCost: number } {
  const ctx = resolveDossierContext(world, dossier);
  const advisorId = ctx.advisor?.id ?? world.advisors[0]?.id ?? '';
  const options = getEffectiveOptionsForDossier(dossier);
  const bounds = getDossierPaBounds(dossier);

  let hasUnlockedNonDefer = false;
  let lastShortfall: string | null = null;

  for (const opt of options) {
    if (opt.actionPayload?.kind === 'DEFER_ACTION') continue;
    const autoColonists = findRecommendedColonistsForOption(world, opt, 2);
    const unlock = evaluateOptionUnlockFactors(world, opt, advisorId, autoColonists);
    if (!unlock.unlocked) {
      const unmet = unlock.factors.find((f) => !f.met);
      lastShortfall = unmet ? `${unmet.label} (${unmet.requiredLabel})` : 'Conditions non réunies';
      continue;
    }
    hasUnlockedNonDefer = true;
    const paCheck = evaluateOptionPaAffordability(
      world,
      opt.paGeneralCost,
      opt.subPaDomain,
      opt.subPaCost,
      true,
    );
    if (!paCheck.affordable) {
      lastShortfall = paCheck.shortfallReason ?? 'PA insuffisants';
      continue;
    }
    if (!isOptionResourceAffordable(world, opt)) {
      lastShortfall = 'Ressources insuffisantes';
      continue;
    }
    return { playable: true, blockedReason: null, minPaCost: bounds.minPa };
  }

  return {
    playable: false,
    blockedReason: lastShortfall ?? (hasUnlockedNonDefer ? 'Budget PA insuffisant' : 'Prérequis manquants'),
    minPaCost: bounds.minPa,
  };
}

export function getAstralisEventHand(world: WorldState): AstralisHandState {
  const ranked = world.activeDossiers.map((dossier) => {
    const evalCard = evaluateDossierCardPlayability(world, dossier);
    const urgent = dossier.dossierClass === 'P0' || dossier.expiresInCycles <= 1;
    return {
      dossier,
      playable: evalCard.playable,
      urgent,
      minPaCost: evalCard.minPaCost,
      blockedReason: evalCard.blockedReason,
    };
  });

  ranked.sort((a, b) => {
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
    if (a.playable !== b.playable) return a.playable ? -1 : 1;
    return a.minPaCost - b.minPaCost;
  });

  const sliced = ranked.slice(0, ASTRALIS_HAND_LIMIT);
  const cards: AstralisCardSlot[] = sliced.map((item, idx) => ({
    slotNumber: idx + 1,
    dossier: item.dossier,
    playable: item.playable,
    urgent: item.urgent,
    minPaCost: item.minPaCost,
    blockedReason: item.blockedReason,
  }));

  const turnPa = computeTurnPaProgress(world);
  const bonusDrawsUsed = world.bonusEventDrawsThisCycle ?? 0;
  const bonusDrawsRemaining = Math.max(0, MAX_BONUS_DRAWS_PER_CYCLE - bonusDrawsUsed);

  let canDrawBonusCard = true;
  let drawBlockedReason: string | null = null;

  if (cards.length >= ASTRALIS_HAND_LIMIT) {
    canDrawBonusCard = false;
    drawBlockedReason = `Main complète (${ASTRALIS_HAND_LIMIT}/${ASTRALIS_HAND_LIMIT} cartes)`;
  } else if (bonusDrawsRemaining <= 0) {
    canDrawBonusCard = false;
    drawBlockedReason = `Limite de pioches bonus atteinte (${MAX_BONUS_DRAWS_PER_CYCLE}/tour)`;
  } else if (turnPa.totalRemaining < 1) {
    canDrawBonusCard = false;
    drawBlockedReason = 'Crédit PA épuisé pour ce tour';
  } else if (world.resources.credits < 40 && world.resources.energy < 10) {
    canDrawBonusCard = false;
    drawBlockedReason = 'Réserves critiques (Crédits / Énergie insuffisants)';
  }

  return {
    cards,
    totalActiveCount: world.activeDossiers.length,
    playableCount: cards.filter((c) => c.playable).length,
    handLimit: ASTRALIS_HAND_LIMIT,
    bonusDrawsUsed,
    bonusDrawsRemaining,
    canDrawBonusCard,
    drawBlockedReason,
  };
}

export function findNextPlayableAstralisDossier(
  world: WorldState,
  excludeDossierId?: string,
): ExecutiveDossier | null {
  const hand = getAstralisEventHand(world);
  const nextCard = hand.cards.find(
    (card) => card.playable && card.dossier.id !== excludeDossierId,
  );
  return nextCard?.dossier ?? null;
}

const MODULE_LABELS: Record<BonusModuleTag, string> = {
  NONE: 'Standard',
  ENERGY_BOOST: 'Module Énergie',
  STORAGE_BAY: 'Baie Stockage',
  OUTPUT_CORE: 'Noyau Rendement',
};

export function pickMagicWandArbitration(
  world: WorldState,
  dossier: ExecutiveDossier,
  salt = 0,
): MagicWandPickResult | null {
  const ctx = resolveDossierContext(world, dossier);
  const advisorId = ctx.advisor?.id ?? world.advisors[0]?.id ?? 'adv-ges';
  const options = getEffectiveOptionsForDossier(dossier);
  if (options.length === 0) return null;

  const budget = resolveDossierSelectionBudget(dossier);
  const seedBase = `${world.worldSeed}:${world.cycle}:${world.tick}:${dossier.id}:${salt}`;
  const hash0 = deterministicHash(seedBase);

  interface CandidateOption {
    readonly option: DossierOption;
    readonly colonists: readonly string[];
    readonly isDefer: boolean;
  }

  const validCandidates: CandidateOption[] = [];
  for (const opt of options) {
    const isDefer = opt.actionPayload?.kind === 'DEFER_ACTION';
    const colonists = isDefer
      ? []
      : findRecommendedColonistsForOption(world, opt, 2);
    const unlock = evaluateOptionUnlockFactors(world, opt, advisorId, colonists);
    if (!unlock.unlocked) continue;
    const paCheck = evaluateOptionPaAffordability(
      world,
      opt.paGeneralCost,
      opt.subPaDomain,
      opt.subPaCost,
      true,
    );
    if (!paCheck.affordable) continue;
    if (!isDefer && !isOptionResourceAffordable(world, opt)) continue;
    validCandidates.push({ option: opt, colonists, isDefer });
  }

  const activeCandidates = validCandidates.filter((c) => !c.isDefer);
  const pool = activeCandidates.length > 0 ? activeCandidates : validCandidates;
  if (pool.length === 0) return null;

  const primaryPick = pool[hash0 % pool.length];
  if (!primaryPick) return null;
  let chosenIds: string[] = [primaryPick.option.id];
  let assignedColonistIds: string[] = [...primaryPick.colonists];

  // For budgeted multi-choice dossiers, optionally combine a second valid affordable card
  if (budget.mode === 'BUDGETED_MULTI' && budget.maxSelections >= 2 && activeCandidates.length >= 2) {
    const wantBundle = (hash0 & 1) === 1;
    if (wantBundle) {
      const others = activeCandidates.filter((c) => c.option.id !== primaryPick.option.id);
      const secondPick = others[(hash0 >>> 3) % others.length];
      if (secondPick) {
        const mergedColonists = [
          ...new Set([
            ...assignedColonistIds,
            ...secondPick.colonists,
            ...(world.colonists[0] ? [world.colonists[0].id] : []),
          ]),
        ].slice(0, 2);
        const testEval = evaluateBudgetedSelection(
          world,
          dossier,
          options,
          [primaryPick.option.id, secondPick.option.id],
          undefined,
          0,
          advisorId,
          mergedColonists,
        );
        const testPa = evaluateOptionPaAffordability(
          world,
          testEval.totalGeneralPa,
          primaryPick.option.subPaDomain,
          testEval.totalSubPa,
          true,
        );
        if (testEval.allowed && testPa.affordable) {
          chosenIds = [primaryPick.option.id, secondPick.option.id];
          assignedColonistIds = mergedColonists;
        }
      }
    }
  }

  const subChoices = getSubChoicesForOption(primaryPick.option, dossier.dossierClass);
  const affordableSubChoices = subChoices.filter((sc) => {
    const testEval = evaluateBudgetedSelection(
      world,
      dossier,
      options,
      chosenIds,
      sc,
      0,
      advisorId,
      assignedColonistIds,
    );
    if (!testEval.allowed) return false;
    const testPa = evaluateOptionPaAffordability(
      world,
      testEval.totalGeneralPa,
      primaryPick.option.subPaDomain,
      testEval.totalSubPa,
      true,
    );
    return testPa.affordable;
  });

  const pickedSub =
    affordableSubChoices.length > 0
      ? affordableSubChoices[(hash0 >>> 6) % affordableSubChoices.length]
      : subChoices[0];

  // Try intensity 0 or 1 if comfortably affordable (keep PA budget healthy for chaining!)
  let refinementLevel: RefinementLevel = 0;
  const turnPa = computeTurnPaProgress(world);
  if (turnPa.totalRemaining >= 4 && (hash0 >>> 9) % 3 === 0) {
    const testRef = evaluateBudgetedSelection(
      world,
      dossier,
      options,
      chosenIds,
      pickedSub,
      1,
      advisorId,
      assignedColonistIds,
    );
    const testPa = evaluateOptionPaAffordability(
      world,
      testRef.totalGeneralPa,
      primaryPick.option.subPaDomain,
      testRef.totalSubPa,
      true,
    );
    if (testRef.allowed && testPa.affordable) {
      refinementLevel = 1;
    }
  }

  const modulePool: readonly BonusModuleTag[] = ['NONE', 'ENERGY_BOOST', 'STORAGE_BAY', 'OUTPUT_CORE'];
  const moduleExtensionTag: BonusModuleTag = primaryPick.isDefer
    ? 'NONE'
    : (modulePool[(hash0 >>> 12) % modulePool.length] ?? 'NONE');

  const finalEval = evaluateBudgetedSelection(
    world,
    dossier,
    options,
    chosenIds,
    pickedSub,
    refinementLevel,
    advisorId,
    assignedColonistIds,
  );

  if (!finalEval.allowed) {
    return null;
  }

  const [primaryOptionId, ...extraOptionIds] = chosenIds;
  if (!primaryOptionId) return null;
  return {
    intent: {
      dossierId: dossier.id,
      optionId: primaryOptionId,
      extraOptionIds: extraOptionIds.length > 0 ? extraOptionIds : undefined,
      assignedColonistIds: assignedColonistIds.length > 0 ? assignedColonistIds : undefined,
      subChoiceId: pickedSub?.id,
      refinementLevel,
      assignedAdvisorId: advisorId,
      useGeneralPaFallback: true,
      moduleExtensionTag,
    },
    selectedOptionLabels: finalEval.selectedOptions.map((o) => o.label),
    subChoiceLabel: pickedSub?.label ?? 'Standard',
    moduleLabel: MODULE_LABELS[moduleExtensionTag],
    estimatedPaCost: finalEval.totalPaSpent,
  };
}
