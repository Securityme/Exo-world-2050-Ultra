import { ATMOSPHERE_CONSTANTS } from '../../config/atmosphere.constants.ts';
import type { CityDistrictPacket } from '../../contracts/render-bridge.schema.ts';
import type { EntityLedgerDelta } from '../../contracts/v4-systems.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';

/**
 * [L3] EXW.L3.ENTITY_LEDGER | v4.0.0-rc.1 | SADT A3.1
 * Pure Entity Resource Ledger:
 * - Scales 7 building types L1..L5 by 1.45^(level - 1)
 * - Enforces fixed shortage resolution order: 1.Energy -> 2.O2(P1-P3) -> 3.Water -> 4.Food -> 5.Credits
 * - Auto-sheds INDUSTRY and DATACENTER districts on Energy deficit
 * - Flags worn districts (<55% integrity) for P0/C3 maintenance alerts
 */

export interface BuildingFlowRow {
  readonly districtId: string;
  readonly name: string;
  readonly kind: CityDistrictPacket['kind'];
  readonly level: number;
  readonly energyNet: number;
  readonly creditsNet: number;
  readonly materialsNet: number;
  readonly waterNet: number;
  readonly foodNet: number;
  readonly computeNet: number;
  readonly kitsNet: number;
  readonly electronicsNet: number;
  readonly underPowered: boolean;
  readonly wornAlert: boolean;
}

export function scaleLevelFactor(level: number): number {
  return Number(Math.pow(1.45, Math.max(0, level - 1)).toFixed(3));
}

export function computeBuildingFlowRow(
  district: CityDistrictPacket,
  season: WorldState['season'],
  workforceMultiplier: number,
  underPowered: boolean,
): BuildingFlowRow {
  const f = scaleLevelFactor(district.level) * (1 + district.modulesCount * 0.22);
  const integrityEff = district.integrity < 55 ? 0.72 : 1.0;
  const eff = (underPowered ? 0.35 : 1.0) * integrityEff * workforceMultiplier;
  const solarSeason = season === 'ETE' ? 1.15 : season === 'HIVER' ? 0.9 : 1.0;

  let energyNet = -Math.round(4 * f);
  let creditsNet = Math.round(14 * f * eff);
  let materialsNet = 0;
  let waterNet = 0;
  let foodNet = 0;
  let computeNet = 0;
  let kitsNet = 0;
  let electronicsNet = 0;

  switch (district.kind) {
    case 'COMMAND':
      creditsNet = Math.round(32 * f * eff);
      computeNet = Math.round(4 * f * eff);
      break;
    case 'HABITAT':
      creditsNet = Math.round(24 * f * eff);
      foodNet = Math.round(10 * f * eff * (season === 'HIVER' ? 0.88 : 1.05));
      waterNet = -Math.round(3 * f);
      break;
    case 'ENERGY':
      energyNet = Math.round(24 * f * solarSeason * eff);
      creditsNet = -Math.round(6 * f);
      break;
    case 'INDUSTRY':
      energyNet = -Math.round(8 * f);
      materialsNet = Math.round(15 * f * eff);
      electronicsNet = Math.round(6 * f * eff);
      break;
    case 'DATACENTER':
      energyNet = -Math.round(7 * f);
      computeNet = Math.round(14 * f * eff);
      break;
    case 'BIOPARK':
      energyNet = -Math.round(4 * f);
      waterNet = Math.round(12 * f * eff);
      kitsNet = Math.round(5 * f * eff);
      break;
    case 'SPACEPORT':
      energyNet = -Math.round(6 * f);
      creditsNet = Math.round(28 * f * eff);
      materialsNet = Math.round(5 * f * eff);
      break;
  }

  return {
    districtId: district.id,
    name: district.name,
    kind: district.kind,
    level: district.level,
    energyNet,
    creditsNet,
    materialsNet,
    waterNet,
    foodNet,
    computeNet,
    kitsNet,
    electronicsNet,
    underPowered,
    wornAlert: district.integrity < 55,
  };
}

export function evaluateEntityLedger(
  state: WorldState,
  workforceMultiplier: number,
): { readonly rows: readonly BuildingFlowRow[]; readonly delta: EntityLedgerDelta } {
  const preliminaryRows = state.districts.map((d) =>
    computeBuildingFlowRow(d, state.season, workforceMultiplier, false),
  );
  const baseEnergyDelta = preliminaryRows.reduce((a, r) => a + r.energyNet, 8);
  const energyShortage = state.resources.energy + baseEnergyDelta < 0;

  const shedDistrictIds: string[] = [];
  const rows = state.districts.map((d) => {
    const shouldShed = energyShortage && (d.kind === 'INDUSTRY' || d.kind === 'DATACENTER');
    if (shouldShed) shedDistrictIds.push(d.id);
    return computeBuildingFlowRow(d, state.season, workforceMultiplier, shouldShed);
  });

  const atmoSpec = ATMOSPHERE_CONSTANTS[state.atmosphereTier];
  const kitDemand = state.atmosphereTier === 'P4' ? 0 : Math.ceil(state.colonists.length * atmoSpec.kitsPerColonist);
  const upkeep = state.districts.reduce((acc, d) => acc + d.level * 8, 20);
  const fleetUpkeep = (state.fleetShips?.length ?? 0) * 6 + state.militaryRoster.reduce((a, u) => a + u.count, 0);

  const energy = rows.reduce((a, r) => a + r.energyNet, 8);
  const credits = rows.reduce((a, r) => a + r.creditsNet, 45) - upkeep - fleetUpkeep;
  const materials = rows.reduce((a, r) => a + r.materialsNet, 6);
  const water = rows.reduce((a, r) => a + r.waterNet, 4);
  const food = rows.reduce((a, r) => a + r.foodNet, 4) - Math.ceil(state.colonists.length * 1.2);
  const compute = rows.reduce((a, r) => a + r.computeNet, state.datacenterTier * 4);
  const breathingKits = rows.reduce((a, r) => a + r.kitsNet, 0) - kitDemand;
  const electronics = rows.reduce((a, r) => a + r.electronicsNet, 2);

  // Fixed shortage order: 1.E -> 2.O2(P1-P3) -> 3.W -> 4.F -> 5.Cr
  const shortages: string[] = [];
  if (state.resources.energy + energy < 0) shortages.push('1.Énergie (délestage auto Ind/DC)');
  if (state.atmosphereTier !== 'P4' && state.resources.breathingKits + breathingKits < 0) {
    shortages.push('2.Kits O₂ (Atmosphère non-Éden)');
  }
  if (state.resources.water + water < 0) shortages.push('3.Eau');
  if (state.resources.food + food < 0) shortages.push('4.Vivres');
  if (state.resources.credits + credits < 0) shortages.push('5.Crédits');

  const wornDistrictIds = state.districts.filter((d) => d.integrity < 55).map((d) => d.id);

  return {
    rows,
    delta: {
      credits,
      energy,
      materials,
      water,
      food,
      compute,
      breathingKits,
      electronics,
      shortages,
      shedDistrictIds,
      wornDistrictIds,
    },
  };
}
