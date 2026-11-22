/**
 * [L1] FUP-004 | SM-03 | SADT A3.4
 * Frozen C3 Maintenance Watchdog thresholds & drone repair coefficients.
 */
export const MAINTENANCE_CONSTANTS = Object.freeze({
  CRITICAL_SHUTDOWN_THRESHOLD: 25,
  WARNING_THRESHOLD: 45,
  BASE_WEAR_PER_CYCLE: 5.5,
  STORM_WEAR_PENALTY: 4.0,
  PREVENTIVE_REDUCTION: Object.freeze({ 1: 0.2, 2: 0.45, 3: 0.75 }),
  DRONE_CONSTRUCTION_BONUS_UNIT: 0.04,
});
