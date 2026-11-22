import { CYCLE_CONSTANTS } from '../../config/cycle.constants.ts';
import type { ExecutiveDossier } from '../../contracts/pa-dossiers.schema.ts';

/**
 * [L2] FUP-002 | SM-01 | SADT A2.1 (§5.5.5)
 * Pure P0 Crisis Queue & Storm Damper: enforces strict max 2 new P0 crises per N1 cycle.
 * Any overflow P0 candidate is downgraded deterministically to C3 HIGH severity or deferred.
 */
export interface P0DamperResult {
  readonly acceptedAsP0: readonly ExecutiveDossier[];
  readonly downgradedOverflow: readonly ExecutiveDossier[];
  readonly p0IssuedThisCycle: number;
}

export function applyP0CycleDamper(
  candidates: readonly ExecutiveDossier[],
  alreadyIssuedP0ThisCycle: number,
): P0DamperResult {
  const maxP0 = CYCLE_CONSTANTS.MAX_NEW_P0_PER_CYCLE;
  let remainingBudget = Math.max(0, maxP0 - alreadyIssuedP0ThisCycle);
  const acceptedAsP0: ExecutiveDossier[] = [];
  const downgradedOverflow: ExecutiveDossier[] = [];

  for (const dossier of candidates) {
    if (dossier.dossierClass !== 'P0') {
      downgradedOverflow.push(dossier);
      continue;
    }
    if (remainingBudget > 0) {
      acceptedAsP0.push(dossier);
      remainingBudget -= 1;
    } else {
      downgradedOverflow.push({
        ...dossier,
        dossierClass: 'C3',
        code: dossier.code.replace(/^P0/, 'C3-AMP'),
        briefing: `[Amortisseur P0 §5.5.5] ${dossier.briefing}`,
      });
    }
  }

  return {
    acceptedAsP0,
    downgradedOverflow,
    p0IssuedThisCycle: alreadyIssuedP0ThisCycle + acceptedAsP0.length,
  };
}
