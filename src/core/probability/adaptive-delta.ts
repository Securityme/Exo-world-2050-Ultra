import { TELEMETRY_CONSTANTS } from '../../config/telemetry.constants.ts';

/**
 * [L2] FUP-005 | SM-05 | SADT A1.2 | AR-09, R-69
 * Adaptive Probability Delta Calculator:
 * ΔP_adapt = clamp[-0.20, +0.25](w1 * managementScore + w2 * aiLag - w3 * unresolvedCrisisDebt)
 */
export interface AdaptiveDeltaInputs {
  readonly managementScore: number; // [-1, 1]
  readonly aiRelativeLag: number; // [-1, 1], positive if player behind AI average
  readonly unresolvedCrisisDebt: number; // [0, 1]
}

export interface AdaptiveDeltaAltInputs {
  readonly approval: number; // [0, 100]
  readonly solvencyRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'C' | 'D';
  readonly activeP0Count: number;
  readonly atmosphereProgress: number; // [0, 100]
  readonly cycle: number;
}

const W1 = 0.14;
const W2 = 0.16;
const W3 = 0.22;

export function calculateAdaptiveDeltaP(inputs: AdaptiveDeltaInputs): number {
  const raw =
    W1 * inputs.managementScore +
    W2 * inputs.aiRelativeLag -
    W3 * inputs.unresolvedCrisisDebt;
  const clamped = Math.max(
    TELEMETRY_CONSTANTS.ADAPTIVE_DELTA_MIN,
    Math.min(TELEMETRY_CONSTANTS.ADAPTIVE_DELTA_MAX, raw),
  );
  return Math.round(clamped * 10000) / 10000;
}

/** Wave 0 ergonomic wrapper accepting high-level state metrics or direct AdaptiveDeltaInputs. */
export function computeAdaptiveDeltaP(
  inputs: AdaptiveDeltaInputs | AdaptiveDeltaAltInputs,
): number {
  if ('managementScore' in inputs) {
    return calculateAdaptiveDeltaP(inputs);
  }
  const solvencyBonus =
    inputs.solvencyRating === 'AAA'
      ? 0.6
      : inputs.solvencyRating === 'AA'
        ? 0.4
        : inputs.solvencyRating === 'A'
          ? 0.2
          : inputs.solvencyRating === 'BBB'
            ? 0
            : -0.4;
  const managementScore = Math.max(
    -1,
    Math.min(1, ((inputs.approval - 50) / 50) * 0.7 + solvencyBonus * 0.3),
  );
  const aiRelativeLag = Math.max(-1, Math.min(1, (50 - inputs.atmosphereProgress) / 100));
  const unresolvedCrisisDebt = Math.min(1, inputs.activeP0Count * 0.5);
  return calculateAdaptiveDeltaP({ managementScore, aiRelativeLag, unresolvedCrisisDebt });
}
