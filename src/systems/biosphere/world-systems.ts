import { ATMOSPHERE_CONSTANTS, MAINTENANCE_CONSTANTS } from '../../config/game.constants.ts';
import type { AtmosphereTier } from '../../contracts/render-bridge.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import { Pcg32 } from '../../core/prng/pcg32.ts';

/**
 * [L3] FUP-003 | SM-02 | SADT A3.2–A3.4
 * Biosphere P1..P4 Terraformation, PNJ Construction Speed (A3.2 × A3.4),
 * C3 Structural Wear & Weather Progression. Zero I/O, zero Math.random().
 */
export function resolveAtmosphereTier(progress: number): AtmosphereTier {
  if (progress >= ATMOSPHERE_CONSTANTS.P4.thresholdProgress) return 'P4';
  if (progress >= ATMOSPHERE_CONSTANTS.P3.thresholdProgress) return 'P3';
  if (progress >= ATMOSPHERE_CONSTANTS.P2.thresholdProgress) return 'P2';
  return 'P1';
}

export function computeEffectiveBuildSpeed(
  baseSpeed: number,
  tier: AtmosphereTier,
  constructionDrones: number,
  avgDistrictIntegrity: number,
): number {
  const atmoMod = ATMOSPHERE_CONSTANTS[tier].buildSpeedMod;
  const droneBonus = Math.min(0.6, constructionDrones * MAINTENANCE_CONSTANTS.DRONE_CONSTRUCTION_BONUS_UNIT);
  const integrityFactor = avgDistrictIntegrity < MAINTENANCE_CONSTANTS.CRITICAL_SHUTDOWN_THRESHOLD
    ? 0.55
    : 0.75 + (avgDistrictIntegrity / 100) * 0.35;
  return Math.max(0.35, Number((baseSpeed * (1 + atmoMod + droneBonus) * integrityFactor).toFixed(2)));
}

export function stepBiosphereAndWeather(state: WorldState, prng: Pcg32): WorldState {
  const bioParks = state.districts.filter((d) => d.kind === 'BIOPARK');
  const passiveAtmoGain = bioParks.reduce((acc, d) => acc + d.level * 1.4 + d.modulesCount * 0.6, 0.8);
  const nextProgress = Math.min(100, Math.round(state.atmosphereProgress + passiveAtmoGain));
  const nextTier = resolveAtmosphereTier(nextProgress);

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
  const preventiveFactor = 1 - Math.min(0.6, state.drones.construction * 0.04);

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
  const nextKits = Math.max(0, state.resources.breathingKits - kitDemand);

  const nextColonists = state.colonists.map((col) => {
    const moraleShift = nextTier === 'P4' ? 4 : nextTier === 'P3' ? 2 : nextTier === 'P1' ? -2 : 0;
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
