import { z } from 'zod';

/**
 * [L0] FUP-011 | SM-04 | SADT A3.6
 * Deterministic 4-Phase Combat Engine & Multi-Level Military Units (5 Classes × L1..L5) (OPT-07 A+, R-47).
 */
export const UnitClassSchema = z.enum([
  'INFANTRY_EXO',
  'ARMOR_MECH',
  'DRONE_SWARM',
  'ORBITAL_CORVETTE',
  'CYBER_EW',
]);

export const UnitLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const MilitaryUnitStackSchema = z.object({
  id: z.string().min(2).max(64),
  unitClass: UnitClassSchema,
  level: UnitLevelSchema,
  count: z.number().int().min(1).max(500),
  basePower: z.number().positive(),
  armor: z.number().min(0).max(0.75),
  supplyFactor: z.number().min(0.4).max(1.25),
});

export const CombatDispatchOrderSchema = z.object({
  orderId: z.string().min(3).max(80),
  targetZoneId: z.string().min(2).max(64),
  targetZoneName: z.string().min(2).max(100),
  defenderFactionId: z.string().min(2).max(64),
  biome: z.enum(['BARREN', 'CANYON', 'ICE_SHELF', 'TEMPERATE', 'HIGHLAND', 'METROPOLIS']),
  atmosphereTier: z.enum(['P1', 'P2', 'P3', 'P4']),
  attackerComputeSurplus: z.number().min(0),
  defenderComputeDefense: z.number().min(1),
  orbitalSupportLevel: z.number().int().min(0).max(5),
  fleetFirepowerBonus: z.number().min(0).optional(),
  fleetDefenseBonus: z.number().min(0).optional(),
  attackers: z.array(MilitaryUnitStackSchema).min(1),
  defenders: z.array(MilitaryUnitStackSchema).min(1),
});

export const CombatPhaseLogSchema = z.object({
  phase: z.enum([
    'PHASE_1_CYBER_DRONES',
    'PHASE_2_ORBITAL_BOMBARDMENT',
    'PHASE_3_COMBINED_ROUNDS',
    'PHASE_4_CAPTURE_GARRISON',
  ]),
  summary: z.string(),
  attackerDamageDealt: z.number().nonnegative(),
  defenderDamageDealt: z.number().nonnegative(),
  attackerRemainingPower: z.number().nonnegative(),
  defenderRemainingPower: z.number().nonnegative(),
});

export const CombatReportSchema = z.object({
  orderId: z.string(),
  targetZoneId: z.string(),
  targetZoneName: z.string(),
  cycleResolved: z.number().int().nonnegative(),
  outcome: z.enum(['CAPTURED', 'REPELLED', 'STALEMATE']),
  cyberParalysisApplied: z.boolean(),
  attackerLosses: z.number().int().nonnegative(),
  defenderLosses: z.number().int().nonnegative(),
  garrisonStrength: z.number().int().nonnegative(),
  humankindMilitaryStars: z.number().int().min(0).max(2),
  phases: z.array(CombatPhaseLogSchema).length(4),
  deterministicSeedHash: z.string().min(8),
});

export type UnitClass = z.infer<typeof UnitClassSchema>;
export type UnitLevel = z.infer<typeof UnitLevelSchema>;
export type MilitaryUnitStack = z.infer<typeof MilitaryUnitStackSchema>;
export type CombatDispatchOrder = z.infer<typeof CombatDispatchOrderSchema>;
export type CombatPhaseLog = z.infer<typeof CombatPhaseLogSchema>;
export type CombatReport = z.infer<typeof CombatReportSchema>;
