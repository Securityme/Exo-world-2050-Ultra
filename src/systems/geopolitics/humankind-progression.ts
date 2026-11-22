import type { BinarySpectra, HkProgress, HkStarDomain } from '../../contracts/v4-systems.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import {
  resolveSuperpowerV4,
  SHARED_TECHS_30,
} from '../../data/v4-catalog.data.ts';

/**
 * [L3] EXW.L3.HUMANKIND_PROGRESSION | v4.0.0-rc.1 | SADT A3.3
 * Pure Humankind (HK) Progression, 4 Binary Spectra & 30 Shared Technologies Engine:
 * - 7 Star Domains x 3 Tiers (T1/T2/T3) -> manual Era Advance unlocked at >= 7 stars
 * - Fame accrual + Transcendence (+10% Fame per transcendence)
 * - Evolutive Faction Doctrines + Common Doctrines
 * - 30 Shared/Cyber Techs (5/Era) with +20% ally osmosis
 * - 4 Binary Spectra [-100, +100]: +1 PA bonus if |axis| >= 35, polarization warning if |axis| >= 70
 */

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
    transcendedCount: 0,
    activeDoctrines: ['DOC_SOLAR_CHARTER'],
    unlockedTechIds: ['tech-e1-solar-grid'],
    activeResearchTechId: 'tech-e1-modular-fab',
    researchTurnsLeft: 3,
    factionEraTitle: sp.eraIdentities[0]?.factionName ?? sp.name,
  };
}

function tierForValue(val: number, t1: number, t2: number, t3: number): 0 | 1 | 2 | 3 {
  if (val >= t3) return 3;
  if (val >= t2) return 2;
  if (val >= t1) return 1;
  return 0;
}

export function evaluateHkTurnProgress(state: WorldState): {
  readonly hk: HkProgress;
  readonly starsEarnedThisTurn: number;
  readonly totalEraStars: number;
  readonly fameEarnedThisTurn: number;
  readonly newlyUnlockedTechName: string | null;
} {
  const current = state.hk ?? createDefaultHkProgress(state.superpowerId);
  const eraScale = state.era;

  const keptPromises = (state.promises ?? []).filter((p) => p.status === 'KEPT').length;
  const totalExtensions = state.districts.reduce((a, d) => a + d.modulesCount + d.level, 0);
  const militaryStrength =
    state.militaryRoster.reduce((a, u) => a + u.count * u.level, 0) +
    (state.fleetShips?.length ?? 0) * 4;

  const computedStars: Record<HkStarDomain, 0 | 1 | 2 | 3> = {
    AESTHETE: Math.max(
      current.starsByDomain.AESTHETE,
      tierForValue(state.approval + keptPromises * 12, 70, 82, 92),
    ) as 0 | 1 | 2 | 3,
    AGRARIAN: Math.max(
      current.starsByDomain.AGRARIAN,
      tierForValue(state.colonists.length * 15 + state.resources.food / 6, 65, 95, 130),
    ) as 0 | 1 | 2 | 3,
    BUILDER: Math.max(
      current.starsByDomain.BUILDER,
      tierForValue(totalExtensions, 10 + eraScale * 2, 16 + eraScale * 3, 24 + eraScale * 4),
    ) as 0 | 1 | 2 | 3,
    EXPANSIONIST: Math.max(
      current.starsByDomain.EXPANSIONIST,
      tierForValue(state.capturedTiles.length, 8 + eraScale, 12 + eraScale * 2, 18 + eraScale * 2),
    ) as 0 | 1 | 2 | 3,
    MERCHANT: Math.max(
      current.starsByDomain.MERCHANT,
      tierForValue(state.resources.credits, 1100 * eraScale, 1900 * eraScale, 3000 * eraScale),
    ) as 0 | 1 | 2 | 3,
    MILITARIST: Math.max(
      current.starsByDomain.MILITARIST,
      tierForValue(militaryStrength, 16 + eraScale * 4, 28 + eraScale * 6, 42 + eraScale * 8),
    ) as 0 | 1 | 2 | 3,
    SCIENTIST: Math.max(
      current.starsByDomain.SCIENTIST,
      tierForValue(
        current.unlockedTechIds.length * 18 + state.atmosphereProgress,
        35 + eraScale * 10,
        65 + eraScale * 14,
        95 + eraScale * 16,
      ),
    ) as 0 | 1 | 2 | 3,
  };

  const prevTotal = Object.values(current.starsByDomain).reduce<number>((a, b) => a + b, 0);
  const nextTotal = Object.values(computedStars).reduce<number>((a, b) => a + b, 0);
  const starsEarnedThisTurn = Math.max(0, nextTotal - prevTotal);

  // Advance active 3-turn shared technology research (+20% ally osmosis speeds up when compute >= 80)
  let unlockedTechIds = [...current.unlockedTechIds];
  let activeResearchTechId = current.activeResearchTechId;
  let researchTurnsLeft = current.researchTurnsLeft;
  let newlyUnlockedTechName: string | null = null;

  if (activeResearchTechId) {
    const hasAlliedOsmosis =
      state.rivals.some((r) => r.isAlliedPair) ||
      unlockedTechIds.includes('tech-e2-patent-osmosis');
    const step = hasAlliedOsmosis && state.resources.compute >= 90 ? 2 : 1;
    researchTurnsLeft = Math.max(0, researchTurnsLeft - step);
    if (researchTurnsLeft === 0) {
      const tech = SHARED_TECHS_30.find((t) => t.id === activeResearchTechId);
      if (tech && !unlockedTechIds.includes(tech.id)) {
        unlockedTechIds.push(tech.id);
        newlyUnlockedTechName = tech.name;
      }
      const nextTech = SHARED_TECHS_30.find(
        (t) => t.era <= state.era && !unlockedTechIds.includes(t.id),
      );
      activeResearchTechId = nextTech?.id ?? null;
      researchTurnsLeft = nextTech?.turnsBase ?? 0;
    }
  }

  const transcendMult = 1 + current.transcendedCount * 0.1;
  const rawFameGain =
    18 + starsEarnedThisTurn * 45 + (newlyUnlockedTechName ? 35 : 0) + Math.floor(state.approval / 10);
  const fameEarnedThisTurn = Math.round(rawFameGain * transcendMult);
  const eraAdvanceReady = nextTotal >= 7 && state.era < 6;

  return {
    hk: {
      ...current,
      fame: current.fame + fameEarnedThisTurn,
      starsByDomain: computedStars,
      eraAdvanceReady,
      unlockedTechIds,
      activeResearchTechId,
      researchTurnsLeft,
    },
    starsEarnedThisTurn,
    totalEraStars: nextTotal,
    fameEarnedThisTurn,
    newlyUnlockedTechName,
  };
}

export function applyManualEraAdvance(
  state: WorldState,
  mode: 'EVOLVE' | 'TRANSCEND',
  doctrineId: string,
): WorldState {
  const currentHk = state.hk ?? createDefaultHkProgress(state.superpowerId);
  if (state.era >= 6) return state;

  const nextEra = state.era + 1;
  const sp = resolveSuperpowerV4(state.superpowerId);
  const eraIdentity = sp.eraIdentities.find((e) => e.era === nextEra);

  const nextDoctrines = currentHk.activeDoctrines.includes(doctrineId)
    ? currentHk.activeDoctrines
    : [...currentHk.activeDoctrines, doctrineId];

  const nextTech = SHARED_TECHS_30.find(
    (t) => t.era <= nextEra && !currentHk.unlockedTechIds.includes(t.id),
  );

  return {
    ...state,
    era: nextEra,
    unlockedSlots: Math.min(6, Math.max(state.unlockedSlots, nextEra)),
    hk: {
      ...currentHk,
      fame: currentHk.fame + (mode === 'TRANSCEND' ? 120 : 80),
      starsByDomain: {
        AESTHETE: 0,
        AGRARIAN: 0,
        BUILDER: 0,
        EXPANSIONIST: 0,
        MERCHANT: 0,
        MILITARIST: 0,
        SCIENTIST: 0,
      },
      eraAdvanceReady: false,
      transcendedCount: currentHk.transcendedCount + (mode === 'TRANSCEND' ? 1 : 0),
      activeDoctrines: nextDoctrines,
      activeResearchTechId: currentHk.activeResearchTechId ?? nextTech?.id ?? null,
      researchTurnsLeft: currentHk.activeResearchTechId ? currentHk.researchTurnsLeft : 3,
      factionEraTitle:
        mode === 'TRANSCEND'
          ? `${currentHk.factionEraTitle} (Transcendée)`
          : eraIdentity?.factionName ?? `Ère ${nextEra}`,
    },
    chronicle: [
      {
        id: `chr-hk-era-${nextEra}-c${state.cycle}`,
        cycle: state.cycle,
        tick: state.tick,
        category: 'ERA' as const,
        title:
          mode === 'TRANSCEND'
            ? `Transcendance vers l’Ère ${nextEra}`
            : `Avènement : ${eraIdentity?.factionName ?? `Ère ${nextEra}`}`,
        detail: `Doctrine adoptée : ${doctrineId} · Bonus Gloire ${mode === 'TRANSCEND' ? '+10% cumulatif' : 'Fédération'}.`,
        stateHash: state.stateHash,
      },
      ...state.chronicle,
    ].slice(0, 60),
  };
}

export function evaluateSpectraEffects(spectra: BinarySpectra): {
  readonly bonusPa: number;
  readonly polarizedAxes: readonly string[];
} {
  const axes: readonly [string, number][] = [
    ['Écologie / Industrie', spectra.ecologyVsIndustry],
    ['Fédéral / Souverain', spectra.federalVsSovereign],
    ['Science Ouverte / Cyber', spectra.openScienceVsCyberControl],
    ['Bien-Être / Efficacité', spectra.civicWelfareVsEfficiency],
  ];
  const bonusPa = axes.some(([, v]) => Math.abs(v) >= 35) ? 1 : 0;
  const polarizedAxes = axes.filter(([, v]) => Math.abs(v) >= 70).map(([label]) => label);
  return { bonusPa, polarizedAxes };
}
