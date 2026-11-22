import type { ChronicleEntry, WorldState } from '../../contracts/world-state.schema.ts';

/**
 * [L2] FUP-001 | MC-00 | SADT A1.1 / A2.3
 * Pure Event Hook Dispatcher appending deterministic Chronicle & Achievement records.
 */
export function appendChronicleHook(
  chronicle: readonly ChronicleEntry[],
  entry: ChronicleEntry,
  maxEntries = 60,
): ChronicleEntry[] {
  return [entry, ...chronicle].slice(0, maxEntries);
}

export function evaluateMilestonesHook(state: WorldState): string[] {
  const unlocked = new Set(state.achievements);
  if (state.atmosphereTier === 'P2' || state.atmosphereTier === 'P3' || state.atmosphereTier === 'P4') {
    unlocked.add('PALIER_P2_STABILISE');
  }
  if (state.atmosphereTier === 'P3' || state.atmosphereTier === 'P4') {
    unlocked.add('PALIER_P3_RESPIRABLE');
  }
  if (state.atmosphereTier === 'P4') {
    unlocked.add('EDEN_OPEN_SKY_P4');
  }
  if (state.era >= 3) {
    unlocked.add('ERE_III_EXPANSION');
  }
  if (state.era >= 5) {
    unlocked.add('ERE_V_EXOSPHERE');
  }
  if (state.capturedTiles.length >= 16) {
    unlocked.add('HEGEMONIE_GEODESIQUE');
  }
  if (state.resources.credits >= 2500) {
    unlocked.add('TRESOR_FEDERAL_2500');
  }
  return Array.from(unlocked);
}
