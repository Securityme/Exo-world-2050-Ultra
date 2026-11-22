import type { GeneseState, LivingCatalogState, PromiseRecord } from '../../contracts/v4-systems.schema.ts';
import type { Colonist, WorldState } from '../../contracts/world-state.schema.ts';
import { FIXED_CAL_EVENTS, GENESE_ACT0_CHOICES } from '../../data/v4-catalog.data.ts';
import { createIsolatedPrng } from '../../core/prng/pcg32-streams.ts';

/**
 * [L3] EXW.L3.GENESE_PROMISES | v4.0.0-rc.1 | SADT A2.3
 * Protocole Genèse 2050 (Acte 0), Promises (PM) Approval Tracker,
 * X-Turn Arrival Cycles (3..9t), 5 Fixed CalEvents & Living Catalog (CV, LRU 500, NoRep3t).
 */

const ARRIVAL_NAMES = [
  'Soraia Mendes',
  'Ibrahim Diop',
  'Elena Petrova',
  'Mateo Silva',
  'Hana Sato',
  'Liam O’Connor',
  'Farah Haddad',
  'Victor Lindholm',
];

const SPECIALTIES: readonly Colonist['specialty'][] = [
  'ENGINEERING',
  'EXOBIOLOGY',
  'CYBERNETICS',
  'AGRONOMY',
  'SECURITY',
];

export function computeArrivalsEveryTurns(approval: number, era: number): number {
  const raw = 3 + Math.floor((100 - approval) / 15) + (era > 3 ? -1 : 0);
  return Math.max(3, Math.min(9, raw));
}

export function applyGeneseAct0Choice(
  state: WorldState,
  choiceId: string,
  expertBypass = false,
): WorldState {
  const choice = GENESE_ACT0_CHOICES.find((c) => c.id === choiceId) ?? GENESE_ACT0_CHOICES[0]!;
  const currentSpectra = state.spectra ?? {
    ecologyVsIndustry: 10,
    federalVsSovereign: 0,
    openScienceVsCyberControl: 5,
    civicWelfareVsEfficiency: 10,
  };

  const nextResources = { ...state.resources };
  let nextAtmo = state.atmosphereProgress;
  let nextApproval = state.approval;
  let nextPaGeneral = state.pa.general;

  if (choice.id === 'genese-biosphere') {
    nextAtmo = Math.min(100, nextAtmo + 8);
    nextApproval = Math.min(100, nextApproval + 6);
    nextResources.breathingKits += 20;
  } else if (choice.id === 'genese-industry') {
    nextResources.credits += 320;
    nextResources.materials += 50;
    nextResources.electronics += 15;
  } else {
    nextResources.compute += 45;
    nextPaGeneral = Math.min(state.pa.generalCap + 1, nextPaGeneral + 1);
  }

  const foundingPromise: PromiseRecord = {
    id: `pm-genese-${choice.id}`,
    title: choice.promiseTitle,
    description: choice.promiseDescription,
    metric: choice.promiseMetric,
    targetValue: choice.promiseTarget,
    deadlineCycle: state.cycle + choice.promiseDeadlineTurns,
    status: 'ACTIVE',
    rewardApproval: 8,
    penaltyApproval: -7,
  };

  const nextGenese: GeneseState = {
    act0Completed: true,
    expertBypass,
    hudStage: 4,
    foundingChoiceId: choice.id,
    nextArrivalCycle: state.cycle + computeArrivalsEveryTurns(nextApproval, state.era),
    completedCalEventIds: state.genese?.completedCalEventIds ?? [],
  };

  const baseTerra = state.terra ?? {
    atmo: state.atmosphereProgress,
    hydro: 22,
    bio: 16,
    radShield: 28,
    compositeScore: state.atmosphereProgress,
  };
  const atmoDelta = nextAtmo - state.atmosphereProgress;
  const nextTerra = {
    ...baseTerra,
    atmo: Math.min(100, baseTerra.atmo + atmoDelta),
    bio: Math.min(100, baseTerra.bio + Math.round(atmoDelta * 0.6)),
    compositeScore: nextAtmo,
  };

  return {
    ...state,
    doctrineId: choice.doctrineTag,
    atmosphereProgress: nextAtmo,
    terra: nextTerra,
    approval: nextApproval,
    resources: nextResources,
    pa: { ...state.pa, general: nextPaGeneral },
    spectra: {
      ecologyVsIndustry: Math.max(-100, Math.min(100, currentSpectra.ecologyVsIndustry + choice.spectraShift.ecoInd)),
      federalVsSovereign: Math.max(-100, Math.min(100, currentSpectra.federalVsSovereign + choice.spectraShift.fedSov)),
      openScienceVsCyberControl: Math.max(-100, Math.min(100, currentSpectra.openScienceVsCyberControl + choice.spectraShift.sciCyb)),
      civicWelfareVsEfficiency: Math.max(-100, Math.min(100, currentSpectra.civicWelfareVsEfficiency + choice.spectraShift.welEff)),
    },
    promises: [foundingPromise, ...(state.promises ?? [])],
    genese: nextGenese,
    chronicle: [
      {
        id: `chr-genese-act0-${state.cycle}`,
        cycle: state.cycle,
        tick: state.tick,
        category: 'ERA' as const,
        title: `Protocole Genèse 2050 : ${choice.title}`,
        detail: `Engagement civique enregistré : ${choice.promiseTitle} (${choice.promiseDescription}).`,
        stateHash: state.stateHash,
      },
      ...state.chronicle,
    ].slice(0, 60),
  };
}

function readPromiseMetricValue(state: WorldState, metric: PromiseRecord['metric']): number {
  switch (metric) {
    case 'ATMO_PROGRESS':
      return state.atmosphereProgress;
    case 'APPROVAL':
      return state.approval;
    case 'CREDITS':
      return state.resources.credits;
    case 'DISTRICT_INTEGRITY':
      return Math.round(
        state.districts.reduce((a, d) => a + d.integrity, 0) / Math.max(1, state.districts.length),
      );
    case 'TECH_COUNT':
      return state.hk?.unlockedTechIds.length ?? 1;
    case 'COLONIST_MORALE':
      return Math.round(
        state.colonists.reduce((a, c) => a + c.morale, 0) / Math.max(1, state.colonists.length),
      );
  }
}

export function evaluatePromisesAndCycles(
  state: WorldState,
  nextCycle: number,
): {
  readonly promises: readonly PromiseRecord[];
  readonly resolved: readonly { readonly title: string; readonly status: 'KEPT' | 'BROKEN' }[];
  readonly approvalDelta: number;
  readonly genese: GeneseState;
  readonly newColonist: Colonist | null;
  readonly arrivalNotice: string | null;
  readonly calEventNotice: string | null;
  readonly calCreditBonus: number;
  readonly calFameBonus: number;
} {
  let approvalDelta = 0;
  const resolved: { title: string; status: 'KEPT' | 'BROKEN' }[] = [];
  const promises = (state.promises ?? []).map((pm) => {
    if (pm.status !== 'ACTIVE') return pm;
    const val = readPromiseMetricValue(state, pm.metric);
    if (val >= pm.targetValue) {
      approvalDelta += pm.rewardApproval;
      resolved.push({ title: pm.title, status: 'KEPT' });
      return { ...pm, status: 'KEPT' as const };
    }
    if (nextCycle >= pm.deadlineCycle) {
      approvalDelta += pm.penaltyApproval;
      resolved.push({ title: pm.title, status: 'BROKEN' });
      return { ...pm, status: 'BROKEN' as const };
    }
    return pm;
  });

  const curGenese: GeneseState = state.genese ?? {
    act0Completed: false,
    expertBypass: false,
    hudStage: 4,
    foundingChoiceId: null,
    nextArrivalCycle: 4,
    completedCalEventIds: [],
  };

  // X-turn colonist arrival cycle (3..9t)
  let newColonist: Colonist | null = null;
  let arrivalNotice: string | null = null;
  let nextArrivalCycle = curGenese.nextArrivalCycle;
  if (nextCycle >= nextArrivalCycle && state.colonists.length < 12) {
    const arrRng = createIsolatedPrng(state.worldSeed, nextCycle, 'ARR');
    const name = ARRIVAL_NAMES[arrRng.nextInt(0, ARRIVAL_NAMES.length - 1)] ?? 'Soraia Mendes';
    const specialty = SPECIALTIES[arrRng.nextInt(0, SPECIALTIES.length - 1)] ?? 'ENGINEERING';
    const targetDistrict = state.districts[arrRng.nextInt(0, Math.max(0, state.districts.length - 1))];
    newColonist = {
      id: `col-arr-${nextCycle}`,
      name,
      specialty,
      trait: 'Pionnier 2050',
      morale: 76,
      fatigue: 15,
      health: 92,
      happiness: 78,
      level: 1,
      xp: 0,
      gear: { outfitTier: 1, toolTier: 1, weaponTier: 1 },
      assignedDistrictId: targetDistrict?.id ?? null,
    };
    arrivalNotice = `Arrivée navette colons : ${name} (${specialty}) affecté(e) à ${targetDistrict?.name ?? 'Réserve'}.`;
    nextArrivalCycle = nextCycle + computeArrivalsEveryTurns(state.approval, state.era);
  }

  // Fixed Calendar Events (5 CalEvents E2..E6)
  let calEventNotice: string | null = null;
  let calCreditBonus = 0;
  let calFameBonus = 0;
  const completedCalEventIds = [...curGenese.completedCalEventIds];
  for (const cal of FIXED_CAL_EVENTS) {
    if (
      state.era >= cal.minEra &&
      nextCycle % cal.cycleMod === 0 &&
      !completedCalEventIds.includes(cal.id)
    ) {
      completedCalEventIds.push(cal.id);
      calEventNotice = `${cal.title} — ${cal.summary}`;
      calCreditBonus += 120;
      calFameBonus += 45;
      break;
    }
  }

  return {
    promises,
    resolved,
    approvalDelta,
    genese: { ...curGenese, nextArrivalCycle, completedCalEventIds },
    newColonist,
    arrivalNotice,
    calEventNotice,
    calCreditBonus,
    calFameBonus,
  };
}

export function recordLivingCatalogCodes(
  current: LivingCatalogState | undefined,
  newCodes: readonly string[],
): LivingCatalogState {
  const base = current ?? { recentCodes: [], lastThreeTurnsCodes: [], totalGenerated: 0 };
  const merged = [...base.recentCodes, ...newCodes].slice(-500);
  const lastThree = [...base.lastThreeTurnsCodes, [...newCodes]].slice(-3);
  return {
    recentCodes: merged,
    lastThreeTurnsCodes: lastThree,
    totalGenerated: base.totalGenerated + newCodes.length,
  };
}

export function getNoRep3tExcludedCodes(current: LivingCatalogState | undefined): Set<string> {
  if (!current) return new Set();
  return new Set(current.lastThreeTurnsCodes.flat());
}
