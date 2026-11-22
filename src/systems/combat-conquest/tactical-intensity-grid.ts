import type { MilitaryUnitStack, UnitLevel } from '../../contracts/combat-units.schema.ts';
import type { AtmosphereTier } from '../../contracts/render-bridge.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';

/**
 * [L3] EXW.L3.TACTICAL_INTENSITY_GRID | v1.6.0 | SADT A4.4
 * 100% pure deterministic 3D grid intensity calculator mapping L1–L5 military unit
 * concentrations across the planet's P1–P4 atmospheric zones.
 */
export interface AtmosphericZoneSpec {
  readonly tier: AtmosphereTier;
  readonly label: string;
  readonly pnjModifierPct: number;
  readonly tileShare: number;
}

export interface TacticalGridCell {
  readonly id: string;
  readonly zoneIndex: number;
  readonly levelIndex: number;
  readonly zone: AtmosphereTier;
  readonly zoneLabel: string;
  readonly level: UnitLevel;
  readonly alliedUnits: number;
  readonly rivalUnits: number;
  readonly totalPower: number;
  readonly intensity: number;
  readonly elevationPx: number;
  readonly pnjModifierPct: number;
}

export interface TacticalIntensitySummary {
  readonly cells: readonly TacticalGridCell[];
  readonly maxPower: number;
  readonly totalAlliedUnits: number;
  readonly totalRivalUnits: number;
  readonly peakZone: AtmosphereTier;
  readonly peakLevel: UnitLevel;
  readonly activeAtmosphere: AtmosphereTier;
}

export const ATMOSPHERIC_ZONES: readonly AtmosphericZoneSpec[] = Object.freeze([
  { tier: 'P1', label: 'P1 · Hostile', pnjModifierPct: -40, tileShare: 0.34 },
  { tier: 'P2', label: 'P2 · Assisté', pnjModifierPct: -15, tileShare: 0.32 },
  { tier: 'P3', label: 'P3 · Symbiotique', pnjModifierPct: 15, tileShare: 0.21 },
  { tier: 'P4', label: 'P4 · Éden', pnjModifierPct: 40, tileShare: 0.13 },
]);

export const UNIT_LEVELS: readonly UnitLevel[] = Object.freeze([1, 2, 3, 4, 5]);

const ZONE_WEIGHT_BY_ACTIVE: Record<AtmosphereTier, readonly [number, number, number, number]> = {
  P1: [0.46, 0.30, 0.16, 0.08],
  P2: [0.24, 0.44, 0.22, 0.10],
  P3: [0.14, 0.26, 0.40, 0.20],
  P4: [0.10, 0.18, 0.32, 0.40],
};

function distributeRosterByLevel(
  roster: readonly MilitaryUnitStack[],
): Readonly<Record<UnitLevel, { count: number; power: number }>> {
  const acc: Record<UnitLevel, { count: number; power: number }> = {
    1: { count: 0, power: 0 },
    2: { count: 0, power: 0 },
    3: { count: 0, power: 0 },
    4: { count: 0, power: 0 },
    5: { count: 0, power: 0 },
  };
  for (const stack of roster) {
    const slot = acc[stack.level];
    slot.count += stack.count;
    slot.power += stack.count * stack.basePower;
  }
  return acc;
}

export function buildTacticalIntensityGrid(world: WorldState): TacticalIntensitySummary {
  const byLevel = distributeRosterByLevel(world.militaryRoster);
  const zoneWeights = ZONE_WEIGHT_BY_ACTIVE[world.atmosphereTier];
  const rivalTotalPower = world.rivals.reduce((sum, r) => sum + r.militaryPower, 0);
  const tilePressure = Math.max(0.5, (world.capturedTiles.length + world.rivalTiles.length) / 36);
  const droneFactor = 1 + (world.drones.attack + world.drones.recon) * 0.025;

  const rawCells: Omit<TacticalGridCell, 'intensity' | 'elevationPx'>[] = [];
  let maxPower = 1;
  let totalAlliedUnits = 0;
  let totalRivalUnits = 0;

  ATMOSPHERIC_ZONES.forEach((zoneSpec, zIdx) => {
    const zWeight = zoneWeights[zIdx] ?? 0.25;
    UNIT_LEVELS.forEach((level, lIdx) => {
      const alliedSlot = byLevel[level];
      const tierAffinity = 0.72 + ((zIdx + lIdx) % 3) * 0.18;
      const baseAllied =
        alliedSlot.count > 0
          ? Math.max(1, Math.round(alliedSlot.count * zWeight * tierAffinity))
          : Math.max(0, Math.round((world.era >= level ? 2 : 1) * zWeight * 4));
      const rivalShare = (rivalTotalPower / 110) * zWeight * (0.45 + level * 0.18) * tilePressure;
      const rivalUnits = Math.max(1, Math.round(rivalShare * (1 + ((zIdx * 3 + lIdx) % 4) * 0.12)));

      const alliedPower =
        (alliedSlot.power > 0 ? alliedSlot.power * zWeight : baseAllied * level * 14) * droneFactor;
      const rivalPower = rivalUnits * (12 + level * 9);
      const totalPower = Math.round(alliedPower + rivalPower);

      if (totalPower > maxPower) maxPower = totalPower;
      totalAlliedUnits += baseAllied;
      totalRivalUnits += rivalUnits;

      rawCells.push({
        id: `${zoneSpec.tier}-L${level}`,
        zoneIndex: zIdx,
        levelIndex: lIdx,
        zone: zoneSpec.tier,
        zoneLabel: zoneSpec.label,
        level,
        alliedUnits: baseAllied,
        rivalUnits,
        totalPower,
        pnjModifierPct: zoneSpec.pnjModifierPct,
      });
    });
  });

  let peakZone: AtmosphereTier = 'P1';
  let peakLevel: UnitLevel = 1;
  let peakPower = -1;

  const cells: TacticalGridCell[] = rawCells.map((cell) => {
    const intensity = Math.max(0.08, Math.min(1, Number((cell.totalPower / maxPower).toFixed(3))));
    if (cell.totalPower > peakPower) {
      peakPower = cell.totalPower;
      peakZone = cell.zone;
      peakLevel = cell.level;
    }
    return {
      ...cell,
      intensity,
      elevationPx: Math.round(14 + intensity * 74),
    };
  });

  return {
    cells,
    maxPower,
    totalAlliedUnits,
    totalRivalUnits,
    peakZone,
    peakLevel,
    activeAtmosphere: world.atmosphereTier,
  };
}
