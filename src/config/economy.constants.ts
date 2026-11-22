/**
 * [L1] FUP-004 | SM-03 | SADT A3.3
 * Frozen Economy, Anno 3-Module Limit (R-36), Bank Solvency & Referendum thresholds.
 */
export const ECONOMY_CONSTANTS = Object.freeze({
  MAX_MODULES_PER_BUILDING: 3,
  REFERENDUM_APPROVAL_THRESHOLD: 35,
  DEFEAT_APPROVAL_THRESHOLD: 5,
  TRANSPORTER_TONNAGE_BY_TIER: Object.freeze({ 1: 120, 2: 280, 3: 550, 4: 1100 }),
  SOLVENCY_INTEREST_RATES: Object.freeze({
    AAA: 0.04,
    AA: 0.06,
    A: 0.08,
    BBB: 0.11,
    BB: 0.15,
    C: 0.21,
    D: 0.28,
  }),
});
