import type { WorldState } from '../contracts/world-state.schema.ts';

/**
 * [L5] FUP-006 | SM-01 | SADT A4.1
 * Compact Context Retriever extracting token-bounded WorldState telemetry for Oracle / DocSync queries.
 */
export interface DossierContextDigest {
  readonly cycle: number;
  readonly era: number;
  readonly atmosphereTier: WorldState['atmosphereTier'];
  readonly atmosphereProgress: number;
  readonly approval: number;
  readonly solvencyRating: WorldState['finance']['solvencyRating'];
  readonly activeP0Count: number;
  readonly adaptiveDeltaP: number;
}

export function retrieveDossierContext(state: WorldState): DossierContextDigest {
  return {
    cycle: state.cycle,
    era: state.era,
    atmosphereTier: state.atmosphereTier,
    atmosphereProgress: state.atmosphereProgress,
    approval: state.approval,
    solvencyRating: state.finance.solvencyRating,
    activeP0Count: state.activeDossiers.filter((d) => d.dossierClass === 'P0').length,
    adaptiveDeltaP: state.adaptiveDeltaP,
  };
}
