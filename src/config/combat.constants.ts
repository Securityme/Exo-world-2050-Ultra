/**
 * [L1] FUP-011 | SM-04 | SADT A3.6
 * Frozen 4-Phase Deterministic Combat & Cyber-Paralysis constants (R-43, R-47).
 */
export const COMBAT_CONSTANTS = Object.freeze({
  UNIT_CLASS_BASE_POWER: Object.freeze({
    INFANTRY_EXO: 12,
    ARMOR_MECH: 22,
    DRONE_SWARM: 16,
    ORBITAL_CORVETTE: 34,
    CYBER_EW: 14,
  }),
  LEVEL_MULTIPLIERS: Object.freeze({ 1: 1.0, 2: 1.3, 3: 1.65, 4: 2.05, 5: 2.55 }),
  BIOME_MODIFIERS: Object.freeze({
    BARREN: 1.0,
    CANYON: 0.88,
    ICE_SHELF: 0.92,
    TEMPERATE: 1.08,
    HIGHLAND: 0.85,
    METROPOLIS: 0.9,
  }),
  CYBER_SURPLUS_RATIO_REQUIRED: 2.0,
  CYBER_PARALYSIS_CYCLES: 2,
});
