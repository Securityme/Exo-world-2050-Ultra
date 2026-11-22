import type { CityDistrictPacket } from '../../contracts/render-bridge.schema.ts';
import type { Colonist, WorldState } from '../../contracts/world-state.schema.ts';

/**
 * [L3] EXW.L3.WORKFORCE_ASSIGNMENTS | v4.1.0 | SADT A3.2
 * Pure colonist-district assignment matrix, specialty synergy logic & auto-optimizer.
 * Zero I/O, zero Math.random(), zero Z0/R-50 terms.
 */

export const MAX_COLONISTS_PER_DISTRICT = 2;

const SPECIALTY_SYNERGY_MAP: Record<
  Colonist['specialty'],
  readonly CityDistrictPacket['kind'][]
> = {
  ENGINEERING: ['INDUSTRY', 'ENERGY', 'COMMAND'],
  EXOBIOLOGY: ['BIOPARK'],
  CYBERNETICS: ['DATACENTER'],
  AGRONOMY: ['HABITAT', 'BIOPARK'],
  SECURITY: ['SPACEPORT', 'COMMAND'],
};

const SPECIALTY_LABELS_FR: Record<Colonist['specialty'], string> = {
  ENGINEERING: 'Ingénierie',
  AGRONOMY: 'Agronomie',
  CYBERNETICS: 'Cybernétique',
  SECURITY: 'Sécurité',
  EXOBIOLOGY: 'Exobiologie',
};

export function formatSpecialtyLabel(specialty: Colonist['specialty']): string {
  return SPECIALTY_LABELS_FR[specialty] ?? specialty;
}

export function getRecommendedDistrictKinds(
  specialty: Colonist['specialty'],
): readonly CityDistrictPacket['kind'][] {
  return SPECIALTY_SYNERGY_MAP[specialty] ?? ['COMMAND'];
}

export function doesColonistMatchDistrict(
  specialty: Colonist['specialty'],
  districtKind: CityDistrictPacket['kind'],
): boolean {
  return getRecommendedDistrictKinds(specialty).includes(districtKind);
}

export function computeColonistEffectiveYieldPct(
  colonist: Colonist,
  district: CityDistrictPacket | null | undefined,
): number {
  if (!district) return 0;
  const base = 15;
  const synergy = doesColonistMatchDistrict(colonist.specialty, district.kind) ? 15 : 0;
  const gearBonus = ((colonist.gear?.toolTier ?? 1) - 1) * 6;
  const levelBonus = Math.max(0, (colonist.level ?? 1) - 1) * 4;
  const burnoutPenalty = colonist.fatigue >= 80 ? -20 : 0;
  return Math.max(5, base + synergy + gearBonus + levelBonus + burnoutPenalty);
}

export function countWorkforceSynergies(world: WorldState): number {
  let synergies = 0;
  for (const col of world.colonists) {
    if (!col.assignedDistrictId) continue;
    const district = world.districts.find((d) => d.id === col.assignedDistrictId);
    if (district && doesColonistMatchDistrict(col.specialty, district.kind)) {
      synergies += 1;
    }
  }
  return synergies;
}

export function getDistrictOccupantCount(
  world: WorldState,
  districtId: string,
): number {
  return world.colonists.filter((c) => c.assignedDistrictId === districtId).length;
}

/**
 * Deterministically assigns colonists to open district slots (<= 2 per district),
 * prioritizing specialty synergies and highest-level districts first.
 */
export function computeOptimalAssignments(
  world: WorldState,
): Readonly<Record<string, string | null>> {
  const slotCounts = new Map<string, number>();
  for (const d of world.districts) {
    slotCounts.set(d.id, 0);
  }

  const orderedDistricts = [...world.districts].sort(
    (a, b) => b.level - a.level || b.modulesCount - a.modulesCount || a.id.localeCompare(b.id),
  );
  const orderedColonists = [...world.colonists].sort(
    (a, b) => (b.level ?? 1) - (a.level ?? 1) || a.fatigue - b.fatigue || a.id.localeCompare(b.id),
  );

  const assignments: Record<string, string | null> = {};

  // Pass 1: Assign colonists to best matching synergy district with open capacity
  for (const col of orderedColonists) {
    const synergyTarget = orderedDistricts.find((d) => {
      const count = slotCounts.get(d.id) ?? 0;
      return count < MAX_COLONISTS_PER_DISTRICT && doesColonistMatchDistrict(col.specialty, d.kind);
    });
    if (synergyTarget) {
      assignments[col.id] = synergyTarget.id;
      slotCounts.set(synergyTarget.id, (slotCounts.get(synergyTarget.id) ?? 0) + 1);
    }
  }

  // Pass 2: Assign remaining unassigned colonists to highest-level open district slots
  for (const col of orderedColonists) {
    if (assignments[col.id] !== undefined) continue;
    const fallbackTarget = orderedDistricts.find(
      (d) => (slotCounts.get(d.id) ?? 0) < MAX_COLONISTS_PER_DISTRICT,
    );
    if (fallbackTarget) {
      assignments[col.id] = fallbackTarget.id;
      slotCounts.set(fallbackTarget.id, (slotCounts.get(fallbackTarget.id) ?? 0) + 1);
    } else {
      assignments[col.id] = null;
    }
  }

  return assignments;
}
