import type { AtmosphereTier } from '../../contracts/render-bridge.schema.ts';
import type { TerraformationV4 } from '../../contracts/v4-systems.schema.ts';
import type { Colonist, WorldState } from '../../contracts/world-state.schema.ts';

/**
 * [L3] EXW.L3.TERRA_WORKFORCE | v4.0.0-rc.1 | SADT A3.2
 * Pure Terraformation P1..P4 (hysteresis -3) & Frostpunk Workforce RPG System:
 * - TerraScore = 0.35*Atmo + 0.30*Hydro + 0.25*Bio + 0.10*RadShield
 * - Hysteresis (-3) prevents oscillating between atmosphere tiers
 * - Colonists RPG: Health, Happiness, Morale, Fatigue, XP/Level, Gear T1..T3, Synergy +0.10, Burnout Fat>=80
 */

export function computeTerraCompositeScore(terra: Omit<TerraformationV4, 'compositeScore'>): number {
  const score =
    0.35 * terra.atmo + 0.3 * terra.hydro + 0.25 * terra.bio + 0.1 * terra.radShield;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function resolveAtmosphereTierWithHysteresis(
  score: number,
  currentTier: AtmosphereTier,
): AtmosphereTier {
  const thresholds: Record<AtmosphereTier, number> = { P1: 0, P2: 28, P3: 58, P4: 85 };
  const order: readonly AtmosphereTier[] = ['P1', 'P2', 'P3', 'P4'];
  const curIdx = order.indexOf(currentTier);

  // Upgrade check
  let nextIdx = curIdx;
  for (let i = curIdx + 1; i < order.length; i++) {
    const tier = order[i]!;
    if (score >= thresholds[tier]) nextIdx = i;
  }
  if (nextIdx > curIdx) return order[nextIdx]!;

  // Downgrade check with -3 hysteresis buffer
  if (curIdx > 0 && score < thresholds[currentTier] - 3) {
    return order[curIdx - 1]!;
  }
  return currentTier;
}

export function stepTerraformationV4(state: WorldState): {
  readonly terra: TerraformationV4;
  readonly atmosphereTier: AtmosphereTier;
  readonly atmosphereProgress: number;
} {
  const current = state.terra ?? {
    atmo: state.atmosphereProgress,
    hydro: Math.min(100, state.atmosphereProgress + 4),
    bio: Math.max(0, state.atmosphereProgress - 2),
    radShield: 28,
    compositeScore: state.atmosphereProgress,
  };

  const bioParks = state.districts.filter((d) => d.kind === 'BIOPARK');
  const bioPower = bioParks.reduce((a, d) => a + d.level * 1.3 + d.modulesCount * 0.5, 0.7);
  const techBonus = (state.hk?.unlockedTechIds.includes('tech-e3-bio-enzymes') ? 2.5 : 0) +
    (state.hk?.unlockedTechIds.includes('tech-e4-magnetosphere') ? 3 : 0);

  const atmo = Math.min(100, Math.round((current.atmo + bioPower + techBonus * 0.4) * 10) / 10);
  const hydro = Math.min(100, Math.round((current.hydro + bioPower * 0.85) * 10) / 10);
  const bio = Math.min(100, Math.round((current.bio + bioPower * 0.95) * 10) / 10);
  const radShield = Math.min(100, Math.round((current.radShield + 0.6 + techBonus * 0.6) * 10) / 10);
  const compositeScore = computeTerraCompositeScore({ atmo, hydro, bio, radShield });
  const atmosphereTier = resolveAtmosphereTierWithHysteresis(compositeScore, state.atmosphereTier);

  return {
    terra: { atmo, hydro, bio, radShield, compositeScore },
    atmosphereTier,
    atmosphereProgress: compositeScore,
  };
}

export interface WorkforceReport {
  readonly colonists: readonly Colonist[];
  readonly workforceMultiplier: number;
  readonly burnoutCount: number;
  readonly synergyCount: number;
}

function matchesDistrictSynergy(colonist: Colonist, districtKind: string | undefined): boolean {
  if (!districtKind) return false;
  if (colonist.specialty === 'ENGINEERING' && (districtKind === 'INDUSTRY' || districtKind === 'ENERGY' || districtKind === 'COMMAND')) return true;
  if (colonist.specialty === 'EXOBIOLOGY' && districtKind === 'BIOPARK') return true;
  if (colonist.specialty === 'CYBERNETICS' && districtKind === 'DATACENTER') return true;
  if (colonist.specialty === 'AGRONOMY' && districtKind === 'HABITAT') return true;
  if (colonist.specialty === 'SECURITY' && districtKind === 'SPACEPORT') return true;
  return false;
}

export function stepWorkforceRpg(
  state: WorldState,
  shortages: readonly string[],
): WorkforceReport {
  const districtMap = new Map(state.districts.map((d) => [d.id, d.kind]));
  const hasFoodShortage = shortages.some((s) => s.startsWith('4.'));
  const hasO2Shortage = shortages.some((s) => s.startsWith('2.'));
  const hasClinicTech = state.hk?.unlockedTechIds.includes('tech-e3-wellbeing-act') ?? false;

  let totalYield = 0;
  let burnoutCount = 0;
  let synergyCount = 0;

  const colonists = state.colonists.map((col) => {
    const gear = col.gear ?? { outfitTier: 1 as const, toolTier: 1 as const, weaponTier: 1 as const };
    const health = Math.max(
      15,
      Math.min(100, (col.health ?? 84) + (hasO2Shortage ? -8 : hasFoodShortage ? -5 : 2)),
    );
    const fatigueDelta = (state.atmosphereTier === 'P1' ? 3 : -2) - (hasClinicTech ? 3 : 0);
    const fatigue = Math.max(5, Math.min(98, col.fatigue + fatigueDelta));
    const isBurnout = fatigue >= 80;
    if (isBurnout) burnoutCount += 1;

    const happiness = Math.max(
      10,
      Math.min(
        100,
        (col.happiness ?? col.morale) +
          (state.atmosphereTier === 'P4' ? 4 : state.atmosphereTier === 'P3' ? 2 : 0) -
          (isBurnout ? 6 : 0),
      ),
    );
    const morale = Math.max(15, Math.min(100, Math.round((col.morale + happiness) / 2)));
    const xp = (col.xp ?? 20) + (col.assignedDistrictId ? 15 : 5);
    const level = Math.min(10, Math.max(col.level ?? 1, 1 + Math.floor(xp / 60)));

    const synergy = matchesDistrictSynergy(col, districtMap.get(col.assignedDistrictId ?? ''));
    if (synergy) synergyCount += 1;

    const gearBonus = (gear.outfitTier + gear.toolTier - 2) * 0.04;
    const baseYield = 0.78 + (morale / 100) * 0.25 + (synergy ? 0.1 : 0) + gearBonus - (isBurnout ? 0.22 : 0);
    totalYield += Math.max(0.45, Math.min(1.45, baseYield));

    return {
      ...col,
      health,
      happiness,
      morale,
      fatigue,
      xp,
      level,
      gear,
    };
  });

  const workforceMultiplier =
    colonists.length > 0 ? Number((totalYield / colonists.length).toFixed(3)) : 1.0;

  return { colonists, workforceMultiplier, burnoutCount, synergyCount };
}
