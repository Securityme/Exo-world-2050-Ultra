import type { EraBranchId, HkProgress } from '../../contracts/v4-systems.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import {
  findSpecializationById,
  formatSubEraLetter,
  getMacroEraMeta,
  getSpecializationsForStep,
  getSubEraScaleTitle,
  MAX_MACRO_ERA,
} from '../../data/eras-specializations.data.ts';
import { resolveSuperpowerV4, SHARED_TECHS_30 } from '../../data/v4-catalog.data.ts';

/**
 * [L3] EXW.L3.ERA_SPECIALIZATION_ENGINE | v5.2.0 | SADT A3.3
 * Pure Sub-Era (.a/.b/.c) and 8-Macro-Era Transition & 4-Specialization Engine.
 */

export interface SpecializationAdvanceInput {
  readonly kind: 'SUB_ERA' | 'EVOLVE' | 'TRANSCEND';
  readonly specializationId: string;
  readonly doctrineId?: string;
}

export function getSubEraStarThreshold(subEra: number): number {
  if (subEra <= 1) return 3;
  if (subEra === 2) return 5;
  return 7;
}

export function createDefaultHkProgress(superpowerId: string): HkProgress {
  const sp = resolveSuperpowerV4(superpowerId);
  return {
    fame: 120,
    starsByDomain: {
      AESTHETE: sp.code === 'UEA' ? 1 : 0,
      AGRARIAN: 0,
      BUILDER: 1,
      EXPANSIONIST: 0,
      MERCHANT: 0,
      MILITARIST: 0,
      SCIENTIST: 0,
    },
    eraAdvanceReady: false,
    subEra: 1,
    activeBranchId: 'BIOSPHERE',
    subEraAdvanceReady: false,
    chosenSpecializations: [],
    transcendedCount: 0,
    activeDoctrines: ['DOC_SOLAR_CHARTER'],
    unlockedTechIds: ['tech-e1-solar-grid'],
    activeResearchTechId: 'tech-e1-modular-fab',
    researchTurnsLeft: 3,
    factionEraTitle: sp.eraIdentities[0]?.factionName ?? sp.name,
  };
}

export function applySpecializationAdvance(
  state: WorldState,
  input: SpecializationAdvanceInput,
): WorldState {
  const defaultHk = createDefaultHkProgress(state.superpowerId);
  const currentHk: HkProgress = {
    ...defaultHk,
    ...(state.hk ?? {}),
    starsByDomain: state.hk?.starsByDomain ?? defaultHk.starsByDomain,
    activeDoctrines: state.hk?.activeDoctrines ?? defaultHk.activeDoctrines,
    unlockedTechIds: state.hk?.unlockedTechIds ?? defaultHk.unlockedTechIds,
    chosenSpecializations: state.hk?.chosenSpecializations ?? defaultHk.chosenSpecializations,
  };
  const currentSubEra = currentHk.subEra ?? 1;
  const totalStars = Object.values(currentHk.starsByDomain).reduce<number>((a, b) => a + b, 0);

  let targetEra = state.era;
  let targetSubEra: 1 | 2 | 3 = currentSubEra as 1 | 2 | 3;

  if (input.kind === 'SUB_ERA') {
    if (currentSubEra >= 3) return state;
    const needed = getSubEraStarThreshold(currentSubEra);
    if (totalStars < needed && !currentHk.subEraAdvanceReady) return state;
    targetSubEra = (currentSubEra + 1) as 1 | 2 | 3;
  } else {
    if (state.era >= MAX_MACRO_ERA) return state;
    targetEra = Math.min(MAX_MACRO_ERA, state.era + 1);
    targetSubEra = 1;
  }

  const fallbackOptions = getSpecializationsForStep(targetEra, targetSubEra);
  const spec = findSpecializationById(input.specializationId) ?? fallbackOptions[0];
  if (!spec) return state;

  const fx = spec.effects;
  const nextBranch: EraBranchId = spec.branchId;
  const nextTitle = getSubEraScaleTitle(targetEra, targetSubEra, nextBranch);
  const macroMeta = getMacroEraMeta(targetEra);
  const doctrineId = input.doctrineId ?? `SPEC_${spec.branchId}_E${targetEra}`;
  const nextDoctrines = currentHk.activeDoctrines.includes(doctrineId)
    ? currentHk.activeDoctrines
    : [...currentHk.activeDoctrines, doctrineId];

  const nextTech = SHARED_TECHS_30.find(
    (t) => t.era <= Math.min(6, targetEra) && !currentHk.unlockedTechIds.includes(t.id),
  );

  const nextStarsByDomain =
    input.kind === 'SUB_ERA'
      ? currentHk.starsByDomain
      : {
          AESTHETE: 0,
          AGRARIAN: 0,
          BUILDER: 0,
          EXPANSIONIST: 0,
          MERCHANT: 0,
          MILITARIST: 0,
          SCIENTIST: 0,
        };

  const nextTotalStars = Object.values(nextStarsByDomain).reduce<number>((a, b) => a + b, 0);
  const nextSubReady =
    (targetSubEra === 1 && nextTotalStars >= 3) || (targetSubEra === 2 && nextTotalStars >= 5);
  const nextEraReady = nextTotalStars >= 7 && targetEra < MAX_MACRO_ERA;

  const chosenRecord = {
    era: targetEra,
    subEra: targetSubEra,
    branchId: nextBranch,
    specializationId: spec.id,
    title: spec.title,
    bonusSummary: spec.bonusSummary,
  };
  const existingSpecs = currentHk.chosenSpecializations ?? [];
  const nextSpecs = [
    ...existingSpecs.filter((item) => !(item.era === targetEra && item.subEra === targetSubEra)),
    chosenRecord,
  ];

  const paBonus = fx.paGeneralBonus ?? 0;
  const nextAtmo = Math.max(0, Math.min(100, state.atmosphereProgress + (fx.atmosphereDelta ?? 0)));
  const nextApproval = Math.max(0, Math.min(100, state.approval + (fx.approvalDelta ?? 0)));

  return {
    ...state,
    era: targetEra,
    unlockedSlots: Math.min(6, Math.max(state.unlockedSlots, Math.min(6, targetEra))),
    atmosphereProgress: nextAtmo,
    approval: nextApproval,
    resources: {
      ...state.resources,
      credits: state.resources.credits + (fx.credits ?? 0),
      energy: state.resources.energy + (fx.energy ?? 0),
      materials: state.resources.materials + (fx.materials ?? 0),
      water: state.resources.water + (fx.water ?? 0),
      food: state.resources.food + (fx.food ?? 0),
      compute: state.resources.compute + (fx.compute ?? 0),
      electronics: state.resources.electronics + (fx.electronics ?? 0),
      breathingKits: state.resources.breathingKits + (fx.breathingKits ?? 0),
    },
    pa:
      paBonus > 0
        ? {
            ...state.pa,
            generalCap: Math.min(8, state.pa.generalCap + paBonus),
            general: Math.min(8, state.pa.general + paBonus),
          }
        : state.pa,
    hk: {
      ...currentHk,
      fame:
        currentHk.fame +
        (fx.fameBonus ?? 60) +
        (input.kind === 'TRANSCEND' ? 120 : input.kind === 'EVOLVE' ? 80 : 35),
      starsByDomain: nextStarsByDomain,
      subEra: targetSubEra,
      activeBranchId: nextBranch,
      subEraAdvanceReady: nextSubReady,
      eraAdvanceReady: nextEraReady,
      chosenSpecializations: nextSpecs,
      transcendedCount: currentHk.transcendedCount + (input.kind === 'TRANSCEND' ? 1 : 0),
      activeDoctrines: nextDoctrines,
      activeResearchTechId: currentHk.activeResearchTechId ?? nextTech?.id ?? null,
      researchTurnsLeft: currentHk.activeResearchTechId ? currentHk.researchTurnsLeft : 3,
      factionEraTitle:
        input.kind === 'TRANSCEND'
          ? `${currentHk.factionEraTitle} · ${nextTitle}`
          : `${macroMeta.name} — ${nextTitle}`,
    },
    chronicle: [
      {
        id: `chr-hk-spec-${targetEra}-${targetSubEra}-c${state.cycle}`,
        cycle: state.cycle,
        tick: state.tick,
        category: 'ERA' as const,
        title:
          input.kind === 'SUB_ERA'
            ? `Sous-Ère ${targetEra}.${formatSubEraLetter(targetSubEra)} : ${spec.title}`
            : input.kind === 'TRANSCEND'
              ? `Transcendance Ère ${targetEra}.a : ${spec.title}`
              : `Ère ${targetEra}.a — ${macroMeta.name} (${spec.title})`,
        detail: `Spécialisation ${spec.branchId} activée : ${spec.bonusSummary}.`,
        stateHash: state.stateHash,
      },
      ...state.chronicle,
    ].slice(0, 60),
  };
}

export function applyManualEraAdvance(
  state: WorldState,
  mode: 'EVOLVE' | 'TRANSCEND',
  doctrineId: string,
  specializationId?: string,
): WorldState {
  if (state.era >= MAX_MACRO_ERA) return state;
  const nextEra = Math.min(MAX_MACRO_ERA, state.era + 1);
  const defaultSpec = getSpecializationsForStep(nextEra, 1)[0];
  return applySpecializationAdvance(state, {
    kind: mode,
    specializationId: specializationId ?? defaultSpec?.id ?? `spec-e${nextEra}-s1-biosphere`,
    doctrineId,
  });
}
