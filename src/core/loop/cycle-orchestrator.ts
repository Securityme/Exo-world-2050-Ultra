import { ATMOSPHERE_CONSTANTS } from '../../config/atmosphere.constants.ts';
import { CYCLE_CONSTANTS } from '../../config/cycle.constants.ts';
import { ECONOMY_CONSTANTS } from '../../config/economy.constants.ts';
import { MAINTENANCE_CONSTANTS } from '../../config/maintenance.constants.ts';
import { PA_CONSTANTS } from '../../config/pa.constants.ts';
import type { ExecutiveDossier } from '../../contracts/pa-dossiers.schema.ts';
import type { AtmosphereTier } from '../../contracts/render-bridge.schema.ts';
import type { Advisor, WorldState } from '../../contracts/world-state.schema.ts';
import { FALLBACK_DOSSIERS_CATALOG } from '../../data/fallback-dossiers.catalog.ts';
import {
  ERAS_CATALOG,
  PLANET_BIOME_PROFILES_CATALOG,
  SUPERPOWERS_CATALOG,
  computePlanetBiomeDistribution,
  resolvePlanetBiomeProfile,
} from '../../data/world.catalog.ts';
import {
  COLONY_SPECIALIZATIONS_CATALOG,
  DIFFICULTY_PRESETS_CATALOG,
  GOVERNMENT_TYPES_CATALOG,
  LANDING_SITES_CATALOG,
  RESOURCE_ABUNDANCE_CATALOG,
} from '../../data/campaign-genesis.catalog.ts';
import type {
  PlanetBiomeProfile,
  PlanetClimatePreset,
  PlanetReliefPreset,
} from '../../contracts/render-bridge.schema.ts';
import type { BioHealthReport } from '../../contracts/skills-vcs.schema.ts';
import { collectDueTriggers, enqueueTriggerEvent } from '../bus/trigger-bus.ts';
import { applyPaAccumulationCap } from '../dispatchers/dossier.dispatcher.ts';
import { appendChronicleHook, evaluateMilestonesHook } from '../dispatchers/event-hook.dispatcher.ts';
import { computeStateHash } from '../hashing/state-hasher.ts';
import { Pcg32 } from '../prng/pcg32.ts';
import { calculateAdaptiveDeltaP } from '../probability/adaptive-delta.ts';
import { applyP0CycleDamper } from '../queues/dossier-p0.queue.ts';
import { evaluateAutoTurnBoundary } from '../triggers/auto-turn.trigger.ts';
import { evaluateWatchdogThresholds } from '../triggers/watchdog-thresholds.trigger.ts';

/**
 * [L2] FUP-001 / FUP-004 | MC-00 | SADT A1.1–A1.4
 * Multi-Cycle Temporal Orchestrator (N0..N5):
 * - 100% Pure L2, zero L3..L8 imports, deterministic PCG32 + canonical SHA-256 hash on every cycle commit.
 * - Zero Math.random(), zero Date.now(), zero I/O.
 */
export interface InitialCampaignConfig {
  readonly campaignId: string;
  readonly worldSeed: number;
  readonly superpowerId: string;
  readonly doctrineId: string;
  readonly rivalCount: number;
  readonly biomeId?: PlanetBiomeProfile;
  readonly oceanCoveragePct?: number;
  readonly relief?: PlanetReliefPreset;
  readonly climate?: PlanetClimatePreset;
  readonly planetName?: string;
  readonly governmentTypeId?: string;
  readonly leaderName?: string;
  readonly capitalName?: string;
  readonly fleetName?: string;
  readonly landingSiteId?: string;
  readonly startingSpecializationId?: string;
  readonly difficultyPreset?: 'EXPLORATEUR' | 'COMMANDANT' | 'STRATEGE';
  readonly resourceAbundance?: 'SOBRE' | 'EQUILIBRE' | 'ABONDANT';
  readonly initialDiplomaticTension?: 'DETENDUE' | 'EQUILIBREE' | 'TENDUE';
}

const SEASONS: readonly WorldState['season'][] = ['PRINTEMPS', 'ETE', 'AUTOMNE', 'HIVER'];

function resolveTierPure(progress: number): AtmosphereTier {
  if (progress >= ATMOSPHERE_CONSTANTS.P4.thresholdProgress) return 'P4';
  if (progress >= ATMOSPHERE_CONSTANTS.P3.thresholdProgress) return 'P3';
  if (progress >= ATMOSPHERE_CONSTANTS.P2.thresholdProgress) return 'P2';
  return 'P1';
}

function computeSubPaRegenPure(advisor: Advisor): number {
  const attrTerm = Math.floor((advisor.attributeScore + advisor.traitBonus) / 3);
  const xpTerm = Math.floor(advisor.xpLevel / 3);
  const fatiguePenalty = advisor.fatigue > PA_CONSTANTS.FATIGUE_PENALTY_THRESHOLD ? 1 : 0;
  return Math.max(1, 1 + attrTerm + xpTerm - fatiguePenalty);
}

interface DoctrineModifiers {
  readonly atmoMult: number;
  readonly taxMult: number;
  readonly computeMult: number;
  readonly wearMult: number;
  readonly moraleBonus: number;
}

function resolveDoctrineModifiersPure(doctrineId: string): DoctrineModifiers {
  switch (doctrineId) {
    case 'SOLARPUNK':
      return { atmoMult: 1.15, taxMult: 1.0, computeMult: 1.0, wearMult: 0.95, moraleBonus: 2 };
    case 'SCIENTIFIC':
      return { atmoMult: 1.05, taxMult: 1.0, computeMult: 1.25, wearMult: 1.0, moraleBonus: 1 };
    case 'CORPORATE':
      return { atmoMult: 0.95, taxMult: 1.18, computeMult: 1.05, wearMult: 1.05, moraleBonus: 0 };
    case 'SECURITY':
      return { atmoMult: 1.0, taxMult: 1.02, computeMult: 1.1, wearMult: 0.8, moraleBonus: 1 };
    default:
      return { atmoMult: 1.0, taxMult: 1.0, computeMult: 1.0, wearMult: 1.0, moraleBonus: 0 };
  }
}

function selectContextualFallbackDossier(
  state: WorldState,
  existingDossiers: readonly ExecutiveDossier[],
  prng: Pcg32,
): ExecutiveDossier {
  const activeCodes = new Set(existingDossiers.map((d) => d.code.split('-C')[0]));
  const nonP0Pool = FALLBACK_DOSSIERS_CATALOG.filter((d) => d.dossierClass !== 'P0');

  let bestScore = -999;
  const scored = nonP0Pool.map((tpl, idx) => {
    let score = 0;
    if (!activeCodes.has(tpl.code)) score += 30;
    if (state.resources.credits < 350 && tpl.options.some((o) => o.effects.credits > 120)) score += 24;
    if (state.approval < 55 && tpl.options.some((o) => o.effects.approvalDelta >= 4)) score += 22;
    if ((state.atmosphereTier === 'P1' || state.atmosphereTier === 'P2') && tpl.dossierClass === 'C4') score += 16;
    if (state.era >= 2 && (tpl.dossierClass === 'C2' || tpl.dossierClass === 'C5')) score += 12;
    if (state.districts.some((d) => d.integrity < 55) && tpl.dossierClass === 'C3') score += 20;
    score += prng.nextInt(0, 12);
    if (score > bestScore) bestScore = score;
    return { tpl, idx, score };
  });

  const topCandidates = scored.filter((item) => item.score >= bestScore - 4);
  const chosen = topCandidates[prng.nextInt(0, Math.max(0, topCandidates.length - 1))] ?? scored[0]!;
  return chosen.tpl;
}

function stepBiospherePure(state: WorldState, prng: Pcg32, doctrine: DoctrineModifiers): WorldState {
  const bioParks = state.districts.filter((d) => d.kind === 'BIOPARK');
  const rawAtmoGain = bioParks.reduce((acc, d) => acc + d.level * 1.4 + d.modulesCount * 0.6, 0.8);
  const passiveAtmoGain = rawAtmoGain * doctrine.atmoMult;
  const nextProgress = Math.min(100, Math.round(state.atmosphereProgress + passiveAtmoGain));
  const nextTier = resolveTierPure(nextProgress);

  const weatherPool: readonly WorldState['weatherState'][] =
    nextTier === 'P1'
      ? ['DUST_STORM', 'CLEAR', 'SOLAR_FLARE', 'DUST_STORM']
      : nextTier === 'P2'
        ? ['CLEAR', 'DUST_STORM', 'CRYO_FRONT', 'CLEAR']
        : ['CLEAR', 'RAIN', 'CLEAR', 'RAIN'];
  const weatherState = weatherPool[prng.nextInt(0, weatherPool.length - 1)] ?? 'CLEAR';

  const stormPenalty =
    weatherState === 'DUST_STORM' || weatherState === 'SOLAR_FLARE'
      ? MAINTENANCE_CONSTANTS.STORM_WEAR_PENALTY
      : 0;
  const preventiveFactor = Math.max(0.35, (1 - Math.min(0.6, state.drones.construction * 0.04)) * doctrine.wearMult);

  const nextDistricts = state.districts.map((dist) => {
    const wear = Math.max(1, (MAINTENANCE_CONSTANTS.BASE_WEAR_PER_CYCLE + stormPenalty) * preventiveFactor);
    return {
      ...dist,
      integrity: Math.max(10, Math.round(dist.integrity - wear)),
    };
  });

  const atmoSpec = ATMOSPHERE_CONSTANTS[nextTier];
  const kitDemand = Math.ceil(state.colonists.length * atmoSpec.kitsPerColonist);
  const respiratoryCost = Math.round(kitDemand * 12 * atmoSpec.kitCostMultiplier);
  const bioCraftedKits = bioParks.reduce((acc, d) => acc + d.level * 2 + d.modulesCount, 0);
  const nextKits = Math.max(0, state.resources.breathingKits - kitDemand + bioCraftedKits);

  const nextColonists = state.colonists.map((col) => {
    const moraleShift =
      (nextTier === 'P4' ? 4 : nextTier === 'P3' ? 2 : nextTier === 'P1' ? -2 : 0) + doctrine.moraleBonus;
    return {
      ...col,
      morale: Math.max(15, Math.min(100, col.morale + moraleShift)),
      fatigue: Math.max(5, Math.min(95, col.fatigue + (nextTier === 'P1' ? 3 : -2))),
    };
  });

  return {
    ...state,
    atmosphereProgress: nextProgress,
    atmosphereTier: nextTier,
    biomeStabilityCycles: nextTier === state.atmosphereTier ? state.biomeStabilityCycles + 1 : 0,
    weatherState,
    districts: nextDistricts,
    colonists: nextColonists,
    resources: {
      ...state.resources,
      breathingKits: nextKits,
    },
    finance: {
      ...state.finance,
      respiratoryCost,
    },
  };
}

export function createInitialWorldState(config: InitialCampaignConfig): WorldState {
  const prng = new Pcg32(config.worldSeed);
  const playerPower =
    SUPERPOWERS_CATALOG.find((s) => s.id === config.superpowerId) ?? SUPERPOWERS_CATALOG[0]!;
  const biomeSpec = resolvePlanetBiomeProfile(config.biomeId ?? PLANET_BIOME_PROFILES_CATALOG[0]?.id);
  const oceanPct = config.oceanCoveragePct ?? biomeSpec.defaultOceanPct;
  const relief = config.relief ?? biomeSpec.defaultRelief;
  const climate = config.climate ?? biomeSpec.defaultClimate;
  const govSpec =
    GOVERNMENT_TYPES_CATALOG.find((g) => g.id === config.governmentTypeId) ?? GOVERNMENT_TYPES_CATALOG[0]!;
  const landingSpec =
    LANDING_SITES_CATALOG.find((l) => l.id === config.landingSiteId) ?? LANDING_SITES_CATALOG[0]!;
  const specDef =
    COLONY_SPECIALIZATIONS_CATALOG.find((s) => s.id === config.startingSpecializationId) ??
    COLONY_SPECIALIZATIONS_CATALOG[0]!;
  const diffSpec =
    DIFFICULTY_PRESETS_CATALOG.find((d) => d.id === config.difficultyPreset) ?? DIFFICULTY_PRESETS_CATALOG[1]!;
  const abundSpec =
    RESOURCE_ABUNDANCE_CATALOG.find((a) => a.id === config.resourceAbundance) ?? RESOURCE_ABUNDANCE_CATALOG[1]!;
  const tension = config.initialDiplomaticTension ?? 'EQUILIBREE';
  const tensionRelationShift = tension === 'DETENDUE' ? 14 : tension === 'TENDUE' ? -18 : 0;

  const rivalTemplates = SUPERPOWERS_CATALOG.filter((s) => s.id !== playerPower.id).slice(
    0,
    Math.max(1, Math.min(5, config.rivalCount)),
  );

  const rivals = rivalTemplates.map((tpl, idx) => ({
    id: tpl.id,
    name: tpl.name,
    code: tpl.code,
    colorHex: tpl.colorHex,
    era: 1,
    eraStars: 1 + (idx % 2),
    humankindScore: Math.round((110 + idx * 14) * diffSpec.rivalStrengthMult),
    economyIndex: Math.round((100 + idx * 8) * diffSpec.rivalStrengthMult),
    militaryPower: Math.round((95 + idx * 10) * diffSpec.rivalStrengthMult),
    computeDefense: Math.round((32 + idx * 7) * diffSpec.rivalStrengthMult),
    relationWithPlayer: Math.max(-100, Math.min(100, (idx === 0 ? 35 : -10 + idx * 8) + tensionRelationShift)),
    isAlliedPair: idx === 0 && tension !== 'TENDUE',
    controlledTiles: 6 + (idx % 3),
    paralyzedCycles: 0,
  }));

  const capturedTiles = [10, 11, 12, 13, 18, 19, 20, 21];
  if (!capturedTiles.includes(landingSpec.tileIndex)) {
    capturedTiles.push(landingSpec.tileIndex);
  }
  const rivalTiles = [24, 25, 31, 32, 38, 39, 44, 45, 51, 52, 58, 59].filter(
    (t) => !capturedTiles.includes(t),
  );

  const initialDossiers: ExecutiveDossier[] = FALLBACK_DOSSIERS_CATALOG.slice(0, 4).map((d, i) => ({
    ...d,
    id: `init-${d.code}-${i}`,
    tileIndex: (landingSpec.tileIndex + i * 9) % 72,
  }));

  const biomeDelta = biomeSpec.startingDelta;
  const specCredits = specDef.id === 'DIPLOMATIE_COMMERCE' ? 220 : 0;
  const specMaterials = specDef.id === 'INGENIERIE_INDUSTRIELLE' ? 45 : 0;
  const specEnergy = specDef.id === 'INGENIERIE_INDUSTRIELLE' ? 20 : 0;
  const specFood = specDef.id === 'BIOSCIENCES_AGRO' ? 25 : 0;
  const specKits = (specDef.id === 'BIOSCIENCES_AGRO' ? 20 : 0) + (govSpec.id === 'REPUBLIQUE_SOLAIRE' ? 12 : 0);
  const specCompute = (specDef.id === 'CYBER_ORBITAL' ? 30 : 0) + (govSpec.id === 'CONSORTIUM_TECHNOCRATIQUE' ? 25 : 0);
  const specElec = (specDef.id === 'CYBER_ORBITAL' ? 20 : 0) + (govSpec.id === 'CONSORTIUM_TECHNOCRATIQUE' ? 15 : 0);
  const specAtmo = (specDef.id === 'BIOSCIENCES_AGRO' ? 3 : 0) + (govSpec.id === 'REPUBLIQUE_SOLAIRE' ? 2 : 0);
  const baseCredits = Math.round((1250 + govSpec.creditsDelta + specCredits) * diffSpec.creditsMult);
  const initialAtmoProgress = Math.min(48, 18 + (biomeDelta.atmosphereProgress ?? 0) + specAtmo);
  const initialAtmoTier = resolveTierPure(initialAtmoProgress);
  const initialGeneralRegen = PA_CONSTANTS.GENERAL_BASE_REGEN + (govSpec.paBonus ? 1 : 0);

  const planetName = (config.planetName ?? '').trim() || 'Nouvelle-Aurore';
  const leaderName = (config.leaderName ?? '').trim() || 'Hélène Vance';
  const capitalName = (config.capitalName ?? '').trim() || 'Port-Lumière';
  const fleetName = (config.fleetName ?? '').trim() || 'Armada Aurore';

  const draft: WorldState = {
    campaignId: config.campaignId,
    worldSeed: config.worldSeed,
    prngState: prng.getStateNumber(),
    superpowerId: playerPower.id,
    superAllianceName: playerPower.allianceName,
    doctrineId: config.doctrineId,
    tick: 0,
    cycle: 0,
    year: CYCLE_CONSTANTS.BASE_YEAR,
    month: 1,
    season: 'PRINTEMPS',
    era: 1,
    eraStars: 1,
    mode: 'CAMPAIGN',
    victoryState: 'ACTIVE',
    victoryReason: null,
    activeScale: 2,
    activeSlotIndex: 1,
    unlockedSlots: 1,
    atmosphereTier: initialAtmoTier,
    atmosphereProgress: initialAtmoProgress,
    biomeStabilityCycles: 1,
    weatherState: 'CLEAR',
    resources: {
      credits: baseCredits,
      energy: Math.round((180 + (biomeDelta.energy ?? 0) + landingSpec.energyDelta + specEnergy) * abundSpec.multiplier),
      materials: Math.round((160 + (biomeDelta.materials ?? 0) + landingSpec.materialsDelta + specMaterials + (govSpec.id === 'SYNDICAT_MARCHAND' ? 25 : govSpec.id === 'PROTECTORAT_STRATEGIQUE' ? 30 : 0)) * abundSpec.multiplier),
      water: Math.round((120 + (biomeDelta.water ?? 0) + landingSpec.waterDelta) * abundSpec.multiplier),
      food: Math.round((115 + (biomeDelta.food ?? 0) + landingSpec.foodDelta + specFood) * abundSpec.multiplier),
      electronics: 85 + specElec,
      orbitalFuel: 45,
      compute: 75 + (biomeDelta.compute ?? 0) + specCompute,
      breathingKits: 60 + (biomeDelta.breathingKits ?? 0) + specKits,
      helium3: 15,
      rareEarths: 20,
      galacticInfluence: 10 + (specDef.id === 'DIPLOMATIE_COMMERCE' ? 12 : 0),
    },
    marketPrices: {
      materials: 12,
      water: 9,
      food: 11,
      electronics: 24,
      helium3: 48,
    },
    finance: {
      cityTaxIncome: 195,
      maintenanceUpkeep: 75,
      respiratoryCost: 24,
      solvencyRating: 'AA',
      loans: [],
    },
    approval: Math.max(40, Math.min(95, 72 + govSpec.approvalDelta)),
    referendumActive: false,
    superAllianceRank: 3,
    superAllianceTrust: Math.min(95, 64 + (govSpec.id === 'CONSEIL_CIVIQUE' ? 5 : 0)),
    superAllianceDirective: `Déployer ${capitalName} sur ${planetName} et stabiliser la biosphère.`,
    transporterTier: 1,
    datacenterTier: 1,
    pa: {
      general: initialGeneralRegen,
      generalRegen: initialGeneralRegen,
      generalCap: Math.floor(initialGeneralRegen * PA_CONSTANTS.ACCUMULATION_CAP_FACTOR),
      subPa: { PA_GES: 3, PA_MNT: 3, PA_BIO: 3, PA_POL: 3 },
      subPaRegen: { PA_GES: 3, PA_MNT: 3, PA_BIO: 3, PA_POL: 3 },
    },
    advisors: [
      {
        id: 'adv-ges',
        name: 'Dir. Claire Valmont',
        role: 'Urbanisme & Industrie',
        domain: 'PA_GES',
        attributeScore: 8,
        traitName: 'Logistique Modulaire',
        traitBonus: 2,
        xpLevel: 2,
        fatigue: 15,
        loyalty: 85,
      },
      {
        id: 'adv-mnt',
        name: 'Ing. Tariq Al-Mansoor',
        role: 'Maintenance & Résilience',
        domain: 'PA_MNT',
        attributeScore: 7,
        traitName: 'Zéro Panne',
        traitBonus: 2,
        xpLevel: 2,
        fatigue: 18,
        loyalty: 82,
      },
      {
        id: 'adv-bio',
        name: 'Dr. Mei-Ling Chen',
        role: 'Biosphère & Exobiologie',
        domain: 'PA_BIO',
        attributeScore: 9,
        traitName: 'Pionnière P4',
        traitBonus: 2,
        xpLevel: 3,
        fatigue: 12,
        loyalty: 88,
      },
      {
        id: 'adv-pol',
        name: 'Amb. Jonas Lindqvist',
        role: 'Diplomatie & Cyber',
        domain: 'PA_POL',
        attributeScore: 8,
        traitName: 'Stratège Fédéral',
        traitBonus: 1,
        xpLevel: 2,
        fatigue: 16,
        loyalty: 80,
      },
    ],
    colonists: [
      { id: 'col-1', name: 'Nadia Kowalski', specialty: 'ENGINEERING', trait: 'Précision Modulaire', morale: 78, fatigue: 20, assignedDistrictId: 'dist-cmd' },
      { id: 'col-2', name: 'Kenji Takahashi', specialty: 'CYBERNETICS', trait: 'Pare-Feu Quantique', morale: 81, fatigue: 18, assignedDistrictId: 'dist-dc' },
      { id: 'col-3', name: 'Amina Diallo', specialty: 'EXOBIOLOGY', trait: 'Bio-Enzymes Adaptatives', morale: 76, fatigue: 24, assignedDistrictId: 'dist-bio' },
      { id: 'col-4', name: 'Lucas Ferreira', specialty: 'AGRONOMY', trait: 'Hydroponie Rendement', morale: 74, fatigue: 22, assignedDistrictId: 'dist-hab' },
    ],
    districts: [
      { id: 'dist-cmd', name: 'Centre de commandement', kind: 'COMMAND', level: 2, modulesCount: 1, integrity: 94, gridX: 0, gridZ: 0 },
      { id: 'dist-hab', name: 'Quartier résidentiel', kind: 'HABITAT', level: 2, modulesCount: 1, integrity: 88, gridX: 1, gridZ: 0 },
      { id: 'dist-en', name: 'Centrale solaire', kind: 'ENERGY', level: 2, modulesCount: 0, integrity: 86, gridX: -1, gridZ: 0 },
      { id: 'dist-ind', name: 'Zone industrielle', kind: 'INDUSTRY', level: 1, modulesCount: 1, integrity: 82, gridX: 0, gridZ: 1 },
      { id: 'dist-dc', name: 'Centre de calcul', kind: 'DATACENTER', level: 1, modulesCount: 0, integrity: 91, gridX: 0, gridZ: -1 },
      { id: 'dist-bio', name: 'Station écologique', kind: 'BIOPARK', level: 1, modulesCount: 1, integrity: 89, gridX: 1, gridZ: 1 },
    ],
    drones: {
      construction: 4,
      defense: 3,
      attack: 2,
      recon: 2,
      reassigningCooldown: 0,
    },
    militaryRoster: [
      { id: 'unit-inf-1', unitClass: 'INFANTRY_EXO', level: 1, count: 6, basePower: 12, armor: 0.2, supplyFactor: 1.0 },
      { id: 'unit-arm-1', unitClass: 'ARMOR_MECH', level: 1, count: 3, basePower: 22, armor: 0.35, supplyFactor: 1.0 },
      { id: 'unit-drn-1', unitClass: 'DRONE_SWARM', level: 1, count: 4, basePower: 16, armor: 0.15, supplyFactor: 1.0 },
    ],
    rivals,
    capturedTiles,
    rivalTiles,
    activeDossiers: initialDossiers,
    triggerBus: [],
    combatReports: [],
    chronicle: [
      {
        id: 'chr-boot-0',
        cycle: 0,
        tick: 0,
        category: 'ERA',
        title: `Fondation de ${capitalName} (${planetName})`,
        detail: `${leaderName} (${govSpec.name}) déploie ${fleetName} sur ${landingSpec.name} · Biome ${biomeSpec.name} (Graine ${config.worldSeed}).`,
        stateHash: 'genesis',
      },
    ],
    xp: {
      civilization: 50,
      cabinet: 25,
      alliance: 30,
    },
    achievements: ['PREMIERE_FONDATION'],
    adaptiveDeltaP: 0,
    stateHash: '',
    planetProfile: {
      biomeId: biomeSpec.id,
      name: planetName,
      oceanCoveragePct: oceanPct,
      relief,
      climate,
      biomeDistribution: [...computePlanetBiomeDistribution(biomeSpec.id, oceanPct, relief, climate, config.worldSeed)],
    },
    planetaryDiplomacy: {
      influenceScore: tension === 'DETENDUE' ? 42 : tension === 'TENDUE' ? 24 : 32,
      treaties: [],
    },
    bioHealth: {
      airScore: Math.round(initialAtmoProgress * 0.9),
      soilFertility: 54,
      hydroScore: Math.round(25 + oceanPct * 0.55),
      floraIndex: 42,
      faunaIndex: 38,
      catastropheDrag: 0,
      compositeBioHealth: Math.round(0.25 * (initialAtmoProgress * 0.9) + 0.2 * 54 + 0.2 * (25 + oceanPct * 0.55) + 0.2 * 42 + 0.15 * 38),
      edenStreak: 0,
      activeDivision: initialAtmoTier === 'P4' ? 'STRATOSPHERE_3' : initialAtmoTier === 'P3' ? 'MESOSPHERE_2' : initialAtmoTier === 'P2' ? 'THERMOSPHERE_1' : 'EXOSPHERE_0',
    },
    ecclesiaState: {
      pastoralAxis: 52,
      charityAxis: 58,
      contemplationAxis: 48,
      dialogueAxis: 55,
      freedomOfConscienceScore: 100,
      lastDiscernmentGrade: 2,
    },
    settlementProfile: {
      governmentTypeId: govSpec.id,
      leaderName,
      capitalName,
      fleetName,
      landingSiteId: landingSpec.id,
      startingSpecializationId: specDef.id,
      difficultyPreset: diffSpec.id,
      resourceAbundance: abundSpec.id,
      initialDiplomaticTension: tension,
    },
    eventChainQueue: [
      {
        chainId: 'chain-coastal-charter',
        step: 1,
        totalSteps: 3,
        title: `Charte d’établissement de ${capitalName}`,
        nextTriggerCycle: 2,
      },
    ],
  };

  return { ...draft, stateHash: computeStateHash(draft) };
}

export function advanceSingleTick(state: WorldState): WorldState {
  if (state.victoryState !== 'ACTIVE') return state;
  const boundary = evaluateAutoTurnBoundary(state.tick, state.cycle);
  if (boundary.crossesCycleN1) {
    return commitCycleBoundary({ ...state, tick: boundary.nextTick });
  }
  return { ...state, tick: boundary.nextTick };
}

export function advanceFullCycle(state: WorldState): WorldState {
  if (state.victoryState !== 'ACTIVE') return state;
  const remainder = CYCLE_CONSTANTS.TICKS_PER_CYCLE_N1 - (state.tick % CYCLE_CONSTANTS.TICKS_PER_CYCLE_N1);
  const nextTick = state.tick + remainder;
  return commitCycleBoundary({ ...state, tick: nextTick });
}

function commitCycleBoundary(baseState: WorldState): WorldState {
  const prng = new Pcg32(baseState.prngState ^ (baseState.tick * 73 + 11));
  const nextCycle = baseState.cycle + 1;
  const doctrine = resolveDoctrineModifiersPure(baseState.doctrineId);

  // Step 1: Biosphere, weather, structural wear & doctrine modifiers
  const state = stepBiospherePure(baseState, prng, doctrine);

  // Step 2: Temporal calendar (N1..N3)
  const totalMonths = Math.floor(state.tick / CYCLE_CONSTANTS.TICKS_PER_MONTH_N2);
  const year = CYCLE_CONSTANTS.BASE_YEAR + Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;
  const season = SEASONS[Math.floor(((month - 1) / 3) % 4)] ?? 'PRINTEMPS';

  // Step 3: District-driven Economy, tax, resources & loan interest
  const rawTaxIncome = state.districts.reduce((acc, d) => acc + d.level * 28 + d.modulesCount * 14, 70);
  const taxIncome = Math.round(rawTaxIncome * doctrine.taxMult);
  const upkeep = state.districts.reduce((acc, d) => acc + d.level * 9, 25);
  let loanPayment = 0;
  const nextLoans = state.finance.loans
    .map((loan) => {
      const payment = Math.round(loan.remaining * loan.interestRate + loan.principal / 6);
      loanPayment += payment;
      return {
        ...loan,
        remaining: Math.max(0, loan.remaining - Math.round(loan.principal / 6)),
        cyclesLeft: Math.max(0, loan.cyclesLeft - 1),
      };
    })
    .filter((l) => l.cyclesLeft > 0 && l.remaining > 0);

  const avgColonistMorale =
    state.colonists.reduce((acc, c) => acc + c.morale, 0) / Math.max(1, state.colonists.length);
  const moraleOutputFactor = 0.85 + (avgColonistMorale / 100) * 0.3;

  const energyDist = state.districts.filter((d) => d.kind === 'ENERGY');
  const indDist = state.districts.filter((d) => d.kind === 'INDUSTRY');
  const bioDist = state.districts.filter((d) => d.kind === 'BIOPARK');
  const habDist = state.districts.filter((d) => d.kind === 'HABITAT');
  const dcDist = state.districts.filter((d) => d.kind === 'DATACENTER');

  const energyGain = Math.round(
    (10 + energyDist.reduce((a, d) => a + d.level * 9 + d.modulesCount * 5, 0)) *
      (season === 'ETE' ? 1.15 : season === 'HIVER' ? 0.9 : 1) *
      moraleOutputFactor,
  );
  const materialsGain = Math.round(
    (8 + indDist.reduce((a, d) => a + d.level * 8 + d.modulesCount * 5, 0) +
      (baseState.doctrineId === 'CORPORATE' ? 6 : 0)) *
      moraleOutputFactor,
  );
  const waterGain = Math.round(6 + bioDist.reduce((a, d) => a + d.level * 6 + d.modulesCount * 3, 0));
  const foodGain = Math.round(
    (6 + habDist.reduce((a, d) => a + d.level * 5 + d.modulesCount * 3, 0)) *
      (season === 'HIVER' ? 0.88 : 1.05),
  );
  const electronicsGain = Math.max(2, indDist.reduce((a, d) => a + d.level * 3 + d.modulesCount * 2, 0));
  const computeGain = Math.round(
    (state.datacenterTier * 6 + dcDist.reduce((a, d) => a + d.level * 6 + d.modulesCount * 4, 0)) *
      doctrine.computeMult,
  );

  // Dynamic seasonal & scarcity market pricing
  const nextMarketPrices = {
    materials: Math.max(7, Math.min(24, Math.round(14 - Math.min(5, state.resources.materials / 75) + (state.weatherState === 'DUST_STORM' ? 2 : 0)))),
    water: Math.max(6, Math.min(19, Math.round(11 - Math.min(4, state.resources.water / 60) + (season === 'ETE' ? 1 : 0)))),
    food: Math.max(7, Math.min(22, Math.round(12 - Math.min(4, state.resources.food / 60) + (season === 'HIVER' ? 2 : 0)))),
    electronics: Math.max(16, Math.min(42, Math.round(26 - Math.min(6, state.resources.electronics / 45) + state.era))),
    helium3: Math.max(32, Math.min(72, Math.round(46 + state.era * 2 + prng.nextInt(-2, 3)))),
  };

  // Step 4: Regenerate PA (R-29 150% cap) & rest advisors
  const restedAdvisors = state.advisors.map((a) => ({
    ...a,
    fatigue: Math.max(0, a.fatigue - 6),
  }));
  const nextSubRegen = { ...state.pa.subPaRegen };
  for (const advisor of restedAdvisors) {
    nextSubRegen[advisor.domain] = computeSubPaRegenPure(advisor);
  }
  const nextPa = applyPaAccumulationCap({ ...state.pa, subPaRegen: nextSubRegen });

  // Step 5: Advance 5 deterministic AI rivals
  const nextRivals = state.rivals.map((rival) => {
    const paralyzed = rival.paralyzedCycles > 0;
    const scoreGain = paralyzed ? 2 : prng.nextInt(8, 18);
    const starGain = !paralyzed && nextCycle % 4 === 0 ? 1 : 0;
    const nextStars = rival.eraStars + starGain;
    const nextRivalEra = Math.min(6, Math.max(rival.era, 1 + Math.floor(nextStars / 5)));
    return {
      ...rival,
      era: nextRivalEra,
      eraStars: nextStars,
      humankindScore: rival.humankindScore + scoreGain,
      economyIndex: rival.economyIndex + (paralyzed ? 0 : prng.nextInt(3, 9)),
      militaryPower: rival.militaryPower + (paralyzed ? 0 : prng.nextInt(2, 8)),
      paralyzedCycles: Math.max(0, rival.paralyzedCycles - 1),
    };
  });

  // Step 6: Trigger Bus due delayed echoes execution + Watchdog (C3 / Referendum / Solvency)
  let nextBus = state.triggerBus;
  const { due, remaining } = collectDueTriggers(nextBus, nextCycle);
  nextBus = remaining;

  let echoCreditDelta = 0;
  let echoApprovalDelta = 0;
  let echoAtmoDelta = 0;
  let echoXpCiv = 0;
  for (const evt of due) {
    echoCreditDelta += Math.round(evt.deltaModifier * 500);
    echoApprovalDelta += Math.round(evt.deltaModifier * 25);
    if (evt.category === 'DELAYED_CONSEQUENCE') {
      echoAtmoDelta += Math.max(-2, Math.min(3, Math.round(evt.deltaModifier * 20)));
      echoXpCiv += 12;
    }
  }

  const netCredits = taxIncome - upkeep - state.finance.respiratoryCost - loanPayment + echoCreditDelta;
  const nextCredits = Math.round(state.resources.credits + netCredits);

  const watchdog = evaluateWatchdogThresholds(state, nextCycle);
  for (const evt of watchdog.emittedTriggers) {
    const [, updatedBus] = enqueueTriggerEvent(nextBus, evt, nextCycle);
    if (updatedBus) nextBus = updatedBus;
  }

  // Step 7: Dossiers lifecycle + P0 Damper (max 2 P0/cycle) + Contextual Generation
  const avgIntegrity =
    state.districts.reduce((acc, d) => acc + d.integrity, 0) / Math.max(1, state.districts.length);
  let nextDossiers = state.activeDossiers
    .map((d) => ({ ...d, expiresInCycles: d.expiresInCycles - 1 }))
    .filter((d) => d.expiresInCycles > 0);

  let p0IssuedNow = 0;
  if (
    (watchdog.criticalDistricts.length > 0 || state.resources.breathingKits < 12) &&
    !nextDossiers.some((d) => d.dossierClass === 'P0')
  ) {
    const p0Pool = FALLBACK_DOSSIERS_CATALOG.filter((d) => d.dossierClass === 'P0');
    const p0Template = p0Pool[nextCycle % Math.max(1, p0Pool.length)];
    if (p0Template) {
      const damper = applyP0CycleDamper(
        [
          {
            ...p0Template,
            id: `p0-c${nextCycle}-${state.tick}`,
            code: `P0-C${nextCycle}`,
            tileIndex: (nextCycle * 5) % 72,
          },
        ],
        p0IssuedNow,
      );
      p0IssuedNow = damper.p0IssuedThisCycle;
      nextDossiers = [...damper.acceptedAsP0, ...damper.downgradedOverflow, ...nextDossiers];
    }
  }

  if (nextDossiers.length < 4) {
    const tpl = selectContextualFallbackDossier(state, nextDossiers, prng);
    nextDossiers = [
      ...nextDossiers,
      {
        ...tpl,
        id: `cat-c${nextCycle}-${state.tick}-${nextDossiers.length}`,
        code: `${tpl.code.split('-C')[0]}-C${nextCycle}`,
        slotIndex: state.activeSlotIndex,
        tileIndex: prng.nextInt(0, 71),
      },
    ];
  }

  // Step 8: Adaptive probability delta (ΔP_adapt)
  const avgRivalScore =
    nextRivals.reduce((acc, r) => acc + r.humankindScore, 0) / Math.max(1, nextRivals.length);
  const playerScore = 100 + state.eraStars * 24 + state.capturedTiles.length * 8;
  const aiRelativeLag = Math.max(-1, Math.min(1, (avgRivalScore - playerScore) / 200));
  const managementScore = Math.max(-1, Math.min(1, (avgIntegrity - 55) / 45));
  const unresolvedCrisisDebt = Math.min(
    1,
    nextDossiers.filter((d) => d.dossierClass === 'P0').length * 0.5,
  );
  const adaptiveDeltaP = calculateAdaptiveDeltaP({
    managementScore,
    aiRelativeLag,
    unresolvedCrisisDebt,
  });

  // Step 9: Approval, Referendum, Era Progression & Victory/Defeat evaluation
  const nextAtmoProgress = Math.max(0, Math.min(100, state.atmosphereProgress + echoAtmoDelta));
  const nextAtmoTier = resolveTierPure(nextAtmoProgress);
  const nextApproval = Math.max(
    0,
    Math.min(100, state.approval + (nextCredits < 0 ? -4 : 0) + echoApprovalDelta),
  );
  const referendumActive = nextApproval < ECONOMY_CONSTANTS.REFERENDUM_APPROVAL_THRESHOLD;

  const preMilestoneDraft: WorldState = {
    ...state,
    atmosphereProgress: nextAtmoProgress,
    atmosphereTier: nextAtmoTier,
    resources: {
      ...state.resources,
      credits: nextCredits,
      energy: Math.max(0, state.resources.energy + energyGain),
      materials: Math.max(0, state.resources.materials + materialsGain),
      water: Math.max(0, state.resources.water + waterGain),
      food: Math.max(0, state.resources.food + foodGain),
      electronics: Math.max(0, state.resources.electronics + electronicsGain),
      compute: Math.max(0, state.resources.compute + computeGain),
    },
  };
  const nextAchievements = evaluateMilestonesHook(preMilestoneDraft);
  const newlyUnlockedCount = Math.max(0, nextAchievements.length - state.achievements.length);
  const nextEraStars = state.eraStars + newlyUnlockedCount;

  let nextEra = state.era;
  let nextUnlockedSlots = state.unlockedSlots;
  for (const eraDef of ERAS_CATALOG) {
    if (eraDef.era > nextEra && nextEraStars >= eraDef.starsRequired) {
      nextEra = eraDef.era;
      nextUnlockedSlots = Math.max(nextUnlockedSlots, eraDef.unlockedSlot);
    }
  }

  let victoryState: WorldState['victoryState'] = state.victoryState;
  let victoryReason: string | null = state.victoryReason;
  if (state.mode === 'CAMPAIGN') {
    if (nextApproval <= ECONOMY_CONSTANTS.DEFEAT_APPROVAL_THRESHOLD) {
      victoryState = 'DEFEAT';
      victoryReason = 'Destitution par référendum fédéral (Approbation critique).';
    } else if (nextEra >= 6 && nextAtmoTier === 'P4' && state.capturedTiles.length >= 24) {
      victoryState = 'VICTORY';
      victoryReason = 'Suprématie Exosphérique atteinte : Ère VI, Atmosphère Éden et 24+ secteurs.';
    }
  }

  let nextChronicle = [...state.chronicle];
  if (nextEra > state.era) {
    const eraInfo = ERAS_CATALOG.find((e) => e.era === nextEra);
    nextChronicle = appendChronicleHook(nextChronicle, {
      id: `chr-era-${nextEra}-c${nextCycle}`,
      cycle: nextCycle,
      tick: state.tick,
      category: 'ERA',
      title: `Transition vers ${eraInfo?.name ?? `l’Ère ${nextEra}`}`,
      detail: `Déblocage du Slot ${nextUnlockedSlots} et des technologies d’Ère ${nextEra}.`,
      stateHash: state.stateHash,
    });
  }
  for (const evt of due) {
    nextChronicle = appendChronicleHook(nextChronicle, {
      id: `chr-due-${evt.id}-${nextCycle}`,
      cycle: nextCycle,
      tick: state.tick,
      category: 'DOSSIER',
      title: evt.title,
      detail: evt.summary,
      stateHash: state.stateHash,
    });
  }

  // Step 10: Planetary Diplomacy Treaties + BioHealth (FEAT-53) + Multi-turn Event Chain
  const currentDip = state.planetaryDiplomacy ?? { influenceScore: 30, treaties: [] };
  let treatyCredits = 0;
  let treatyCompute = 0;
  const steppedTreaties = currentDip.treaties
    .map((t) => {
      if (t.kind === 'MARITIME_TRADE') treatyCredits += 38;
      else if (t.kind === 'SCIENCE_SHARE') treatyCompute += 12;
      else if (t.kind === 'NON_AGGRESSION') treatyCredits += 10;
      else if (t.kind === 'PLANETARY_SUMMIT') {
        treatyCredits += 20;
        treatyCompute += 6;
      }
      return { ...t, remainingCycles: Math.max(0, t.remainingCycles - 1) };
    })
    .filter((t) => t.remainingCycles > 0);

  const oceanPct = state.planetProfile?.oceanCoveragePct ?? 45;
  const activeP0Count = nextDossiers.filter((d) => d.dossierClass === 'P0').length;
  const catDrag = Math.min(40, activeP0Count * 6 + (state.weatherState === 'DUST_STORM' ? 5 : 0));
  const airS = Math.min(100, Math.round(nextAtmoProgress * 0.88 + bioDist.length * 4));
  const soilS = Math.min(100, Math.round(32 + Math.min(40, preMilestoneDraft.resources.food * 0.18) + bioDist.length * 4));
  const hydroS = Math.min(100, Math.round(20 + oceanPct * 0.55 + Math.min(25, preMilestoneDraft.resources.water * 0.14)));
  const floraS = Math.min(100, Math.round((state.terra?.bio ?? 18) * 0.7 + bioDist.length * 7 + airS * 0.22));
  const faunaS = Math.min(100, Math.round(floraS * 0.55 + hydroS * 0.35 + state.biomeStabilityCycles * 2));
  const compBio = Math.max(0, Math.min(100, Math.round(0.25 * airS + 0.2 * soilS + 0.2 * hydroS + 0.2 * floraS + 0.15 * faunaS - catDrag)));
  const activeDiv: BioHealthReport['activeDivision'] =
    nextAtmoTier === 'P4' && nextAtmoProgress >= 90
      ? 'TROPOSPHERE_4'
      : nextAtmoTier === 'P4' || nextAtmoProgress >= 75
        ? 'STRATOSPHERE_3'
        : nextAtmoTier === 'P3' || nextAtmoProgress >= 50
          ? 'MESOSPHERE_2'
          : nextAtmoTier === 'P2' || nextAtmoProgress >= 25
            ? 'THERMOSPHERE_1'
            : 'EXOSPHERE_0';

  const nextBioHealth: BioHealthReport = {
    airScore: airS,
    soilFertility: soilS,
    hydroScore: hydroS,
    floraIndex: floraS,
    faunaIndex: faunaS,
    catastropheDrag: catDrag,
    compositeBioHealth: compBio,
    edenStreak: compBio >= 80 ? (state.bioHealth?.edenStreak ?? 0) + 1 : 0,
    activeDivision: activeDiv,
  };

  const nextChainQueue = (state.eventChainQueue ?? []).map((entry) =>
    entry.nextTriggerCycle <= nextCycle && entry.step < entry.totalSteps
      ? { ...entry, step: entry.step + 1, nextTriggerCycle: nextCycle + 3 }
      : entry,
  );

  const draft: WorldState = {
    ...preMilestoneDraft,
    resources: {
      ...preMilestoneDraft.resources,
      credits: preMilestoneDraft.resources.credits + treatyCredits,
      compute: preMilestoneDraft.resources.compute + treatyCompute,
    },
    prngState: prng.getStateNumber(),
    cycle: nextCycle,
    year,
    month,
    season,
    era: nextEra,
    eraStars: nextEraStars,
    unlockedSlots: nextUnlockedSlots,
    pa: nextPa,
    advisors: restedAdvisors,
    rivals: nextRivals,
    activeDossiers: nextDossiers.slice(0, 12),
    triggerBus: nextBus,
    marketPrices: nextMarketPrices,
    approval: nextApproval,
    referendumActive,
    adaptiveDeltaP,
    victoryState,
    victoryReason,
    xp: {
      ...state.xp,
      civilization: state.xp.civilization + echoXpCiv + 8,
      cabinet: state.xp.cabinet + (baseState.doctrineId === 'SCIENTIFIC' ? 4 : 1),
    },
    drones: {
      ...state.drones,
      reassigningCooldown: Math.max(0, state.drones.reassigningCooldown - 1),
    },
    finance: {
      ...state.finance,
      cityTaxIncome: taxIncome,
      maintenanceUpkeep: upkeep,
      loans: nextLoans,
      solvencyRating:
        nextCredits > 1500
          ? 'AAA'
          : nextCredits > 800
            ? 'AA'
            : nextCredits > 250
              ? 'A'
              : nextCredits >= 0
                ? 'BBB'
                : 'C',
    },
    achievements: nextAchievements,
    chronicle: nextChronicle,
    planetaryDiplomacy: {
      influenceScore: Math.max(0, Math.min(100, currentDip.influenceScore + (steppedTreaties.length > 0 ? 1 : 0))),
      treaties: steppedTreaties,
    },
    bioHealth: nextBioHealth,
    eventChainQueue: nextChainQueue,
  };

  return { ...draft, stateHash: computeStateHash(draft) };
}
