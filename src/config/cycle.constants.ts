/**
 * [L1] FUP-001 | MC-00 | SADT A1.1
 * Frozen multi-scale temporal cycle constants (N0..N3) and P0 storm damper limit.
 */
export const CYCLE_CONSTANTS = Object.freeze({
  TICKS_PER_CYCLE_N1: 15,
  TICKS_PER_MONTH_N2: 30,
  TICKS_PER_SEASON_N2: 60,
  TICKS_PER_YEAR_N3: 360,
  MAX_NEW_P0_PER_CYCLE: 2,
  BASE_YEAR: 2050,
  SPEED_MULTIPLIERS: Object.freeze([0, 1, 2, 4] as const),
});
