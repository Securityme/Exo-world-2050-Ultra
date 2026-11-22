import type { ChronicleEntry } from '../contracts/world-state.schema.ts';

/**
 * [L5] FUP-006 / FUP-012 | SM-05
 * Retrieves deterministic windowed Chronicle turns for Hybrid RAG & Archives.
 */
export function retrieveChronicleTurns(
  chronicle: readonly ChronicleEntry[],
  limit = 8,
): ChronicleEntry[] {
  return chronicle.slice(0, Math.max(1, limit));
}
