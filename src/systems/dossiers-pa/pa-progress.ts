import type { ExecutiveDossier, SubPaDomain } from '../../contracts/pa-dossiers.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import { getEffectiveOptionsForDossier } from './dossier-subchoices.ts';

/**
 * [L3] EXW.L3.PA_PROGRESS | v5.2.0 | SADT A2.1
 * Pure calculator for PA consumption progress across:
 * 1) The entire current turn (already consumed, remaining, projected min/avg/max across all active events)
 * 2) A single event currently under arbitration (live cost, R-26 general fallback deduction, post-sign remaining)
 */

export const SUB_PA_DOMAINS: readonly SubPaDomain[] = ['PA_GES', 'PA_MNT', 'PA_BIO', 'PA_POL'];

export interface DomainPaGauge {
  readonly domain: SubPaDomain;
  readonly remaining: number;
  readonly cap: number;
  readonly spent: number;
  readonly pctUsed: number;
}

export interface TurnPaProgressSummary {
  readonly totalCap: number;
  readonly totalRemaining: number;
  readonly totalSpent: number;
  readonly spentPct: number;
  readonly generalRemaining: number;
  readonly generalCap: number;
  readonly generalSpent: number;
  readonly subDomains: readonly DomainPaGauge[];
  readonly activeEventsCount: number;
  readonly playableEventsCount: number;
  readonly blockedEventsCount: number;
  readonly projectedMinPa: number;
  readonly projectedAvgPa: number;
  readonly projectedMaxPa: number;
  readonly projectedCoveragePct: number;
}

export interface EventPaProgressSummary {
  readonly eventTotalCost: number;
  readonly generalDirectCost: number;
  readonly subDomain: SubPaDomain | null;
  readonly subDirectCost: number;
  readonly subPaidFromDomain: number;
  readonly fallbackGeneralCost: number;
  readonly totalGeneralDeducted: number;
  readonly totalSubDeducted: number;
  readonly affordable: boolean;
  readonly shortfallReason: string | null;
  readonly turnTotalCap: number;
  readonly turnAlreadySpent: number;
  readonly turnSpentAfterSign: number;
  readonly turnRemainingAfterSign: number;
  readonly turnSpentPctBefore: number;
  readonly turnSpentPctAfter: number;
  readonly eventShareOfCapPct: number;
}

export function evaluateOptionPaAffordability(
  world: WorldState,
  paGeneralCost: number,
  subPaDomain: SubPaDomain | null,
  subPaCost: number,
  useGeneralFallback = true,
): {
  readonly affordable: boolean;
  readonly subPaidFromDomain: number;
  readonly fallbackGeneralCost: number;
  readonly totalGeneralDeducted: number;
  readonly shortfallReason: string | null;
} {
  const availableGen = world.pa.general;
  if (!subPaDomain || subPaCost <= 0) {
    const ok = availableGen >= paGeneralCost;
    return {
      affordable: ok,
      subPaidFromDomain: 0,
      fallbackGeneralCost: 0,
      totalGeneralDeducted: paGeneralCost,
      shortfallReason: ok
        ? null
        : `Manque ${paGeneralCost - availableGen} PA Général`,
    };
  }

  const availableSub = world.pa.subPa[subPaDomain] ?? 0;
  const subPaidFromDomain = Math.min(availableSub, subPaCost);
  const subShortfall = Math.max(0, subPaCost - subPaidFromDomain);
  const fallbackGeneralCost = useGeneralFallback ? subShortfall : 0;

  if (subShortfall > 0 && !useGeneralFallback) {
    return {
      affordable: false,
      subPaidFromDomain,
      fallbackGeneralCost: 0,
      totalGeneralDeducted: paGeneralCost,
      shortfallReason: `Manque ${subShortfall} ${subPaDomain} (recours PA Général désactivé)`,
    };
  }

  const totalGeneralDeducted = paGeneralCost + fallbackGeneralCost;
  if (availableGen < totalGeneralDeducted) {
    return {
      affordable: false,
      subPaidFromDomain,
      fallbackGeneralCost,
      totalGeneralDeducted,
      shortfallReason: `Manque ${totalGeneralDeducted - availableGen} PA Général`,
    };
  }

  return {
    affordable: true,
    subPaidFromDomain,
    fallbackGeneralCost,
    totalGeneralDeducted,
    shortfallReason: null,
  };
}

export function getDossierPaBounds(dossier: ExecutiveDossier): {
  readonly minPa: number;
  readonly avgPa: number;
  readonly maxPa: number;
} {
  const opts = getEffectiveOptionsForDossier(dossier).filter(
    (o) => o.actionPayload?.kind !== 'DEFER_ACTION',
  );
  const source = opts.length > 0 ? opts : dossier.options;
  if (source.length === 0) {
    return { minPa: 0, avgPa: 0, maxPa: 0 };
  }
  const costs = source.map((o) => o.paGeneralCost + o.subPaCost);
  const minPa = Math.min(...costs);
  const maxPa = Math.max(...costs);
  const avgPa = Math.round((costs.reduce((a, b) => a + b, 0) / costs.length) * 10) / 10;
  return { minPa, avgPa, maxPa };
}

export function isDossierAffordablyPlayable(
  world: WorldState,
  dossier: ExecutiveDossier,
): boolean {
  const opts = getEffectiveOptionsForDossier(dossier);
  return opts.some((opt) => {
    if (opt.actionPayload?.kind === 'DEFER_ACTION') return true;
    const paCheck = evaluateOptionPaAffordability(
      world,
      opt.paGeneralCost,
      opt.subPaDomain,
      opt.subPaCost,
      true,
    );
    if (!paCheck.affordable) return false;
    const creditsNeed = opt.effects.credits < 0 ? Math.abs(opt.effects.credits) : 0;
    const energyNeed = opt.effects.energy < 0 ? Math.abs(opt.effects.energy) : 0;
    const materialsNeed = opt.effects.materials < 0 ? Math.abs(opt.effects.materials) : 0;
    return (
      world.resources.credits >= creditsNeed &&
      world.resources.energy >= energyNeed &&
      world.resources.materials >= materialsNeed
    );
  });
}

export function computeTurnPaProgress(world: WorldState): TurnPaProgressSummary {
  const generalCap = Math.max(world.pa.generalCap, world.pa.general);
  const generalRemaining = Math.max(0, world.pa.general);
  const generalSpent = Math.max(0, generalCap - generalRemaining);

  const subDomains: DomainPaGauge[] = SUB_PA_DOMAINS.map((domain) => {
    const remaining = Math.max(0, world.pa.subPa[domain] ?? 0);
    const cap = Math.max(world.pa.subPaRegen[domain] ?? 2, remaining);
    const spent = Math.max(0, cap - remaining);
    const pctUsed = cap > 0 ? Math.round((spent / cap) * 100) : 0;
    return { domain, remaining, cap, spent, pctUsed };
  });

  const totalCap = generalCap + subDomains.reduce((acc, d) => acc + d.cap, 0);
  const totalRemaining = generalRemaining + subDomains.reduce((acc, d) => acc + d.remaining, 0);
  const totalSpent = Math.max(0, totalCap - totalRemaining);
  const spentPct = totalCap > 0 ? Math.min(100, Math.round((totalSpent / totalCap) * 100)) : 0;

  let projectedMinPa = 0;
  let projectedAvgPa = 0;
  let projectedMaxPa = 0;
  let playableEventsCount = 0;

  for (const dossier of world.activeDossiers) {
    const bounds = getDossierPaBounds(dossier);
    projectedMinPa += bounds.minPa;
    projectedAvgPa += bounds.avgPa;
    projectedMaxPa += bounds.maxPa;
    if (isDossierAffordablyPlayable(world, dossier)) {
      playableEventsCount += 1;
    }
  }

  projectedAvgPa = Math.round(projectedAvgPa);
  const activeEventsCount = world.activeDossiers.length;
  const blockedEventsCount = Math.max(0, activeEventsCount - playableEventsCount);
  const projectedCoveragePct =
    projectedMinPa > 0
      ? Math.min(100, Math.round((totalRemaining / projectedMinPa) * 100))
      : 100;

  return {
    totalCap,
    totalRemaining,
    totalSpent,
    spentPct,
    generalRemaining,
    generalCap,
    generalSpent,
    subDomains,
    activeEventsCount,
    playableEventsCount,
    blockedEventsCount,
    projectedMinPa,
    projectedAvgPa,
    projectedMaxPa,
    projectedCoveragePct,
  };
}

export function computeEventPaProgress(
  world: WorldState,
  params: {
    readonly totalGeneralPa: number;
    readonly subDomain: SubPaDomain | null;
    readonly totalSubPa: number;
    readonly useGeneralFallback: boolean;
  },
): EventPaProgressSummary {
  const turn = computeTurnPaProgress(world);
  const evalPa = evaluateOptionPaAffordability(
    world,
    params.totalGeneralPa,
    params.subDomain,
    params.totalSubPa,
    params.useGeneralFallback,
  );
  const eventTotalCost = params.totalGeneralPa + params.totalSubPa;
  const totalSubDeducted = evalPa.subPaidFromDomain;
  const turnSpentAfterSign = Math.min(turn.totalCap, turn.totalSpent + eventTotalCost);
  const turnRemainingAfterSign = Math.max(0, turn.totalRemaining - eventTotalCost);
  const turnSpentPctBefore = turn.spentPct;
  const turnSpentPctAfter =
    turn.totalCap > 0 ? Math.min(100, Math.round((turnSpentAfterSign / turn.totalCap) * 100)) : 0;
  const eventShareOfCapPct =
    turn.totalCap > 0 ? Math.min(100, Math.round((eventTotalCost / turn.totalCap) * 100)) : 0;

  return {
    eventTotalCost,
    generalDirectCost: params.totalGeneralPa,
    subDomain: params.subDomain,
    subDirectCost: params.totalSubPa,
    subPaidFromDomain: evalPa.subPaidFromDomain,
    fallbackGeneralCost: evalPa.fallbackGeneralCost,
    totalGeneralDeducted: evalPa.totalGeneralDeducted,
    totalSubDeducted,
    affordable: evalPa.affordable,
    shortfallReason: evalPa.shortfallReason,
    turnTotalCap: turn.totalCap,
    turnAlreadySpent: turn.totalSpent,
    turnSpentAfterSign,
    turnRemainingAfterSign,
    turnSpentPctBefore,
    turnSpentPctAfter,
    eventShareOfCapPct,
  };
}
