import type { ExecutiveDossier, PaBudget } from '../../contracts/pa-dossiers.schema.ts';
import type { TurnSummaryReport } from '../../contracts/v4-systems.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import { FALLBACK_DOSSIERS_CATALOG } from '../../data/fallback-dossiers.catalog.ts';
import { computeStateHash } from '../../core/hashing/state-hasher.ts';
import { createIsolatedPrng } from '../../core/prng/pcg32-streams.ts';
import { evaluateEntityLedger } from '../economy-urban/entity-ledger.ts';
import { stepTerraformationV4, stepWorkforceRpg } from '../biosphere-cabinet/terraformation-v4.ts';
import { evaluateHkTurnProgress, evaluateSpectraEffects } from '../geopolitics/humankind-progression.ts';
import {
  evaluatePromisesAndCycles,
  getNoRep3tExcludedCodes,
  recordLivingCatalogCodes,
} from '../dossiers-pa/genese-promises.ts';

/**
 * [L3] EXW.L3.TURN_GATE_V4 | v4.0.0-rc.1 | SADT A1.3
 * Karnaugh M7 Turn Gate (T_END_TURN), Guaranteed 0-PA Option, 7-Factor PA (150% cap) & Atomic Phi01..Phi12 Commit.
 */
const SEASONS: readonly WorldState['season'][] = ['PRINTEMPS', 'ETE', 'AUTOMNE', 'HIVER'];

export interface TurnGateStatus {
  readonly allowed: boolean;
  readonly reason: string;
  readonly pendingDossiers: number;
}

export function evaluateTurnGateM7(state: WorldState): TurnGateStatus {
  if (state.victoryState !== 'ACTIVE') {
    return { allowed: false, reason: 'Campagne terminée.', pendingDossiers: state.activeDossiers.length };
  }
  if (state.activeDossiers.length > 0) {
    return {
      allowed: false,
      reason: `Arbitrez ${state.activeDossiers.length} dossier(s) avant la Fin de tour.`,
      pendingDossiers: state.activeDossiers.length,
    };
  }
  return { allowed: true, reason: 'Prêt pour le Bilan de fin de tour.', pendingDossiers: 0 };
}

export function ensureZeroPaOption(dossier: ExecutiveDossier): ExecutiveDossier {
  if (dossier.options.some((o) => o.paGeneralCost === 0 && o.subPaCost === 0)) return dossier;
  return {
    ...dossier,
    options: [
      ...dossier.options,
      {
        id: `${dossier.id}-opt-0pa-protocol`,
        label: 'Protocole Minimal de Continuité (0 PA)',
        doctrineTag: 'FEDERAL',
        description: 'Applique les consignes standards sans dépense de PA afin d’éviter tout blocage.',
        paGeneralCost: 0,
        subPaDomain: null,
        subPaCost: 0,
        effects: {
          credits: -20, energy: 0, materials: 0, water: 0, food: 0,
          electronics: 0, compute: 0, breathingKits: 0, approvalDelta: -1,
          atmosphereDelta: 0, maintenanceDelta: 0, allianceTrustDelta: 0,
          eraStarsDelta: 0, xpCiv: 5, xpCabinet: 5, xpAlliance: 0, oracleImpactFactor: 0,
        },
      },
    ],
  };
}

export function computeSevenFactorPaBudget(state: WorldState): PaBudget {
  const eraFactor = Math.floor((state.era - 1) / 2);
  const cmdFactor = (state.districts.find((d) => d.kind === 'COMMAND')?.level ?? 1) >= 3 ? 1 : 0;
  const approvalFactor = state.approval >= 75 ? 1 : state.approval < 40 ? -1 : 0;
  const spectraFactor = state.spectra ? evaluateSpectraEffects(state.spectra).bonusPa : 0;
  const techFactor = state.hk?.unlockedTechIds.includes('tech-e4-neural-mesh') ? 1 : 0;
  const avgFatigue = state.advisors.reduce((a, adv) => a + adv.fatigue, 0) / Math.max(1, state.advisors.length);
  const fatiguePenalty = avgFatigue > 75 ? -1 : 0;

  const generalRegen = Math.max(3, 4 + eraFactor + cmdFactor + approvalFactor + spectraFactor + techFactor + fatiguePenalty);
  const generalCap = Math.floor(generalRegen * 1.5);
  const extraSub = state.hk?.unlockedTechIds.includes('tech-e5-ai-symbiosis') ? 1 : 0;

  const subPaRegen = { ...state.pa.subPaRegen };
  for (const adv of state.advisors) {
    subPaRegen[adv.domain] = Math.max(
      1,
      1 + Math.floor((adv.attributeScore + adv.traitBonus) / 3) + Math.floor(adv.xpLevel / 4) - (adv.fatigue > 70 ? 1 : 0) + extraSub,
    );
  }

  return {
    general: Math.min(generalCap, state.pa.general + generalRegen),
    generalRegen,
    generalCap,
    subPaRegen,
    subPa: {
      PA_GES: Math.min(Math.floor(subPaRegen.PA_GES * 1.5), state.pa.subPa.PA_GES + subPaRegen.PA_GES),
      PA_MNT: Math.min(Math.floor(subPaRegen.PA_MNT * 1.5), state.pa.subPa.PA_MNT + subPaRegen.PA_MNT),
      PA_BIO: Math.min(Math.floor(subPaRegen.PA_BIO * 1.5), state.pa.subPa.PA_BIO + subPaRegen.PA_BIO),
      PA_POL: Math.min(Math.floor(subPaRegen.PA_POL * 1.5), state.pa.subPa.PA_POL + subPaRegen.PA_POL),
    },
  };
}

function selectNextTurnDossiers(
  state: WorldState,
  nextCycle: number,
  wornCount: number,
  injectedLiveDossiers: readonly ExecutiveDossier[],
  evtRng: ReturnType<typeof createIsolatedPrng>,
): readonly ExecutiveDossier[] {
  const excludedCodes = getNoRep3tExcludedCodes(state.livingCatalog);
  const nextDossiers: ExecutiveDossier[] = injectedLiveDossiers.map(ensureZeroPaOption);

  if (wornCount > 0 && !nextDossiers.some((d) => d.dossierClass === 'P0')) {
    const p0Tpl = FALLBACK_DOSSIERS_CATALOG.find((d) => d.dossierClass === 'P0');
    if (p0Tpl) {
      nextDossiers.unshift(
        ensureZeroPaOption({ ...p0Tpl, id: `p0-wear-c${nextCycle}`, code: `P0-MNT-C${nextCycle}`, tileIndex: (nextCycle * 7) % 72 }),
      );
    }
  }

  const candidatePool = FALLBACK_DOSSIERS_CATALOG.filter((d) => d.dossierClass !== 'P0' && !excludedCodes.has(d.code));
  const fallbackPool = candidatePool.length >= 2 ? candidatePool : FALLBACK_DOSSIERS_CATALOG.filter((d) => d.dossierClass !== 'P0');

  while (nextDossiers.length < 3 && fallbackPool.length > 0) {
    const rawPick = fallbackPool[evtRng.nextInt(0, fallbackPool.length - 1)]!;
    const pick = nextDossiers.some((d) => d.code.startsWith(rawPick.code))
      ? fallbackPool.find((f) => !nextDossiers.some((d) => d.code.startsWith(f.code)))
      : rawPick;
    if (!pick) break;
    nextDossiers.push(
      ensureZeroPaOption({ ...pick, id: `cv-c${nextCycle}-${nextDossiers.length}`, code: `${pick.code}-C${nextCycle}`, tileIndex: evtRng.nextInt(0, 71) }),
    );
  }
  return nextDossiers;
}

export function commitEndOfTurnV4(
  state: WorldState,
  injectedLiveDossiers: readonly ExecutiveDossier[] = [],
): { readonly nextState: WorldState; readonly summary: TurnSummaryReport } {
  const nextCycle = state.cycle + 1;
  const nextTick = state.tick + 12;
  const month = (nextCycle % 12) + 1;
  const year = 2050 + Math.floor(nextCycle / 12);
  const season = SEASONS[Math.floor(((month - 1) / 3) % 4)] ?? 'PRINTEMPS';

  const wearRng = createIsolatedPrng(state.worldSeed, nextCycle, 'WEAR');
  const evtRng = createIsolatedPrng(state.worldSeed, nextCycle, 'EVT');
  const diploRng = createIsolatedPrng(state.worldSeed, nextCycle, 'DIPLO');

  // Phi01-03: Workforce RPG + Entity Resource Ledger + Structural Wear
  const prevWorkforce = stepWorkforceRpg(state, []);
  const { delta } = evaluateEntityLedger(state, prevWorkforce.workforceMultiplier);
  const workforce = stepWorkforceRpg(state, delta.shortages);

  const weatherPool: readonly WorldState['weatherState'][] =
    state.atmosphereTier === 'P1'
      ? ['DUST_STORM', 'CLEAR', 'SOLAR_FLARE', 'CLEAR']
      : state.atmosphereTier === 'P2'
        ? ['CLEAR', 'DUST_STORM', 'CRYO_FRONT', 'CLEAR']
        : ['CLEAR', 'RAIN', 'CLEAR', 'RAIN'];
  const weatherState = weatherPool[wearRng.nextInt(0, weatherPool.length - 1)] ?? 'CLEAR';
  const droneMitigation = Math.max(0.4, 1 - state.drones.construction * 0.05);
  const wearMult = state.hk?.unlockedTechIds.includes('tech-e6-zero-wear') ? 0.5 : 1.0;

  const nextDistricts = state.districts.map((d) => {
    const wear = Math.max(1, Math.round((2 + (weatherState === 'SOLAR_FLARE' ? 2 : 0)) * droneMitigation * wearMult));
    return { ...d, integrity: Math.max(12, d.integrity - wear) };
  });

  // Phi04-06: Terraformation P1..P4 (hysteresis -3) + Promises + Arrivals + CalEvents
  const terraRes = stepTerraformationV4(state);
  const promRes = evaluatePromisesAndCycles(
    { ...state, atmosphereProgress: terraRes.atmosphereProgress, atmosphereTier: terraRes.atmosphereTier },
    nextCycle,
  );
  const nextColonists = promRes.newColonist ? [...workforce.colonists, promRes.newColonist] : [...workforce.colonists];

  const nextResources = {
    ...state.resources,
    credits: Math.round(state.resources.credits + delta.credits + promRes.calCreditBonus),
    energy: Math.max(0, Math.round(state.resources.energy + delta.energy)),
    materials: Math.max(0, Math.round(state.resources.materials + delta.materials)),
    water: Math.max(0, Math.round(state.resources.water + delta.water)),
    food: Math.max(0, Math.round(state.resources.food + delta.food)),
    compute: Math.max(0, Math.round(state.resources.compute + delta.compute)),
    breathingKits: Math.max(0, Math.round(state.resources.breathingKits + delta.breathingKits)),
    electronics: Math.max(0, Math.round(state.resources.electronics + delta.electronics)),
  };
  const nextApproval = Math.max(0, Math.min(100, state.approval + promRes.approvalDelta + delta.shortages.length * -3));

  // Phi07-08: Rest Advisors, Rivals & HK 7-Stars/Fame
  const restedAdvisors = state.advisors.map((a) => ({ ...a, fatigue: Math.max(0, a.fatigue - 8) }));
  const nextRivals = state.rivals.map((r) => ({
    ...r,
    humankindScore: r.humankindScore + (r.paralyzedCycles > 0 ? 3 : diploRng.nextInt(12, 26)),
    paralyzedCycles: Math.max(0, r.paralyzedCycles - 1),
  }));

  const preHkState: WorldState = {
    ...state,
    cycle: nextCycle, tick: nextTick, year, month, season, weatherState,
    approval: nextApproval, atmosphereTier: terraRes.atmosphereTier,
    atmosphereProgress: terraRes.atmosphereProgress, terra: terraRes.terra,
    districts: nextDistricts, colonists: nextColonists, advisors: restedAdvisors,
    resources: nextResources, promises: [...promRes.promises], genese: promRes.genese, rivals: nextRivals,
  };
  const hkRes = evaluateHkTurnProgress(preHkState);
  const nextPa = computeSevenFactorPaBudget({ ...preHkState, hk: hkRes.hk });

  // Phi09-10: Next Turn Dossiers (Live 4T + Living Catalog CV with NoRep3t + 0-PA)
  const nextDossiers = selectNextTurnDossiers(state, nextCycle, delta.wornDistrictIds.length, injectedLiveDossiers, evtRng);
  const nextLivingCatalog = recordLivingCatalogCodes(
    state.livingCatalog,
    nextDossiers.map((d) => d.code.replace(/-C\d+$/, '')),
  );

  // Phi11-12: Victory/Defeat, Solvency & SHA-256 StateHash
  let victoryState = state.victoryState;
  let victoryReason = state.victoryReason;
  if (state.mode === 'CAMPAIGN') {
    if (nextApproval <= 10) {
      victoryState = 'DEFEAT';
      victoryReason = 'Destitution par référendum fédéral (Approbation critique).';
    } else if (state.era >= 6 && terraRes.atmosphereTier === 'P4' && state.capturedTiles.length >= 24) {
      victoryState = 'VICTORY';
      victoryReason = 'Suprématie Exosphérique atteinte : Ère VI & Atmosphère Éden.';
    }
  }

  const solvencyRating =
    nextResources.credits > 1500 ? 'AAA'
      : nextResources.credits > 800 ? 'AA'
        : nextResources.credits > 250 ? 'A'
          : nextResources.credits >= 0 ? 'BBB' : 'C';

  const nextDraft: WorldState = {
    ...preHkState,
    pa: nextPa,
    eraStars: hkRes.totalEraStars,
    hk: { ...hkRes.hk, fame: hkRes.hk.fame + promRes.calFameBonus },
    activeDossiers: [...nextDossiers],
    livingCatalog: nextLivingCatalog,
    victoryState,
    victoryReason,
    referendumActive: nextApproval < 30,
    finance: { ...state.finance, solvencyRating },
  };

  const stateHash = computeStateHash(nextDraft);
  const turnSnapshot = {
    id: `snap-c${nextCycle}-${stateHash.slice(0, 8)}`,
    campaignId: state.campaignId,
    cycle: nextCycle,
    year,
    season,
    era: state.era,
    stateHash,
    combatReports: [...state.combatReports],
  };
  nextDraft.turn_snapshots = [...(state.turn_snapshots ?? []), turnSnapshot].slice(-40);
  const summary: TurnSummaryReport = {
    cycleCompleted: nextCycle,
    year,
    season,
    ledger: delta,
    starsEarnedThisTurn: hkRes.starsEarnedThisTurn,
    totalEraStars: hkRes.totalEraStars,
    fameEarnedThisTurn: hkRes.fameEarnedThisTurn + promRes.calFameBonus,
    totalFame: nextDraft.hk?.fame ?? 0,
    eraAdvanceReady: hkRes.hk.eraAdvanceReady,
    promisesResolved: [...promRes.resolved],
    arrivalNotice: promRes.arrivalNotice,
    calEventNotice: promRes.calEventNotice,
    stateHash,
    commitDurationMs: 2,
  };

  return { nextState: { ...nextDraft, lastTurnSummary: summary, stateHash }, summary };
}
