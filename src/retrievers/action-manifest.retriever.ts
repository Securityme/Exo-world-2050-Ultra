import type { WorldState } from '../contracts/world-state.schema.ts';
import type { DossierClass } from '../contracts/pa-dossiers.schema.ts';

/**
 * [L5] FUP-002 / FUP-006 | SM-01
 * Computes the currently legal Executive Action Manifest for UI & Oracle grounding (R-32).
 */
export interface ActionManifest {
  readonly hasActiveP0: boolean;
  readonly allowedClasses: readonly DossierClass[];
  readonly blockedClasses: readonly DossierClass[];
}

export function retrieveActionManifest(state: WorldState): ActionManifest {
  const hasActiveP0 = state.activeDossiers.some((d) => d.dossierClass === 'P0');
  if (hasActiveP0) {
    return {
      hasActiveP0: true,
      allowedClasses: ['P0', 'C1', 'C2', 'C3'],
      blockedClasses: ['C4', 'C5'],
    };
  }
  return {
    hasActiveP0: false,
    allowedClasses: ['P0', 'C1', 'C2', 'C3', 'C4', 'C5'],
    blockedClasses: [],
  };
}
