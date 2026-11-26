import type { Colonist } from '../../contracts/world-state.schema.ts';

/**
 * [L3 Pure] EXW.L3.COLONIST_QUICK_ACCESS | v5.1.0 | SADT A1.2
 * Deterministic selector for the HUD "Accès Rapide" button targeting the colonist
 * with the lowest morale (tie-breaking on highest fatigue, then lexicographical ID).
 */
export type ColonistMoraleTone = 'critical' | 'warning' | 'healthy';

export function findLowestMoraleColonist(
  colonists: readonly Colonist[],
): Colonist | null {
  if (colonists.length === 0) return null;

  let lowest = colonists[0]!;
  for (let i = 1; i < colonists.length; i += 1) {
    const candidate = colonists[i]!;
    if (
      candidate.morale < lowest.morale ||
      (candidate.morale === lowest.morale && candidate.fatigue > lowest.fatigue) ||
      (candidate.morale === lowest.morale &&
        candidate.fatigue === lowest.fatigue &&
        candidate.id.localeCompare(lowest.id) < 0)
    ) {
      lowest = candidate;
    }
  }
  return lowest;
}

export function getColonistMoraleTone(morale: number): ColonistMoraleTone {
  if (morale < 45) return 'critical';
  if (morale < 70) return 'warning';
  return 'healthy';
}
