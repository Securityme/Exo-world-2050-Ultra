import { z } from 'zod';
import { CombatReportSchema } from './combat-units.schema.ts';
import { ExecutiveDossierSchema } from './pa-dossiers.schema.ts';

/**
 * [L0] EXW.L0.V4_SYSTEMS | v4.0.0-rc.1 | SADT A1.1
 * Strict Zod SSOT contracts for V1 Core Gameplay v4.0:
 * - AI Co-pilot Persona (AI-P)
 * - 4 Binary Spectra [-100, +100]
 * - Terraformation P1..P4 (4 sub-metrics + hysteresis -3)
 * - Protocole Genèse 2050 Act 0 & Promises (PM)
 * - Humankind (HK) 7 Star domains, Fame, Doctrines & 30 Techs
 * - Frostpunk (FP) Colonist Gear & Turn Summary Report
 * - BFF Gemini 4-Tier Cascade Response
 */

export const AiPersonalitySchema = z.enum([
  'ANALYTIQUE',
  'BIENVEILLANT',
  'PRAGMATIQUE',
  'SOUVERAIN',
  'AVANT_GARDE',
]);

export const AiPersonaSchema = z.object({
  name: z.string().min(2).max(40).default('AURA-2050'),
  personality: AiPersonalitySchema.default('ANALYTIQUE'),
  adaptability: z.boolean().default(true),
  driftCounter: z.number().int().min(0).default(0),
});

export const BinarySpectraSchema = z.object({
  ecologyVsIndustry: z.number().min(-100).max(100).default(10),
  federalVsSovereign: z.number().min(-100).max(100).default(0),
  openScienceVsCyberControl: z.number().min(-100).max(100).default(5),
  civicWelfareVsEfficiency: z.number().min(-100).max(100).default(10),
});

export const TerraformationV4Schema = z.object({
  atmo: z.number().min(0).max(100).default(18),
  hydro: z.number().min(0).max(100).default(22),
  bio: z.number().min(0).max(100).default(14),
  radShield: z.number().min(0).max(100).default(28),
  compositeScore: z.number().min(0).max(100).default(19),
});

export const PromiseMetricSchema = z.enum([
  'ATMO_PROGRESS',
  'APPROVAL',
  'CREDITS',
  'DISTRICT_INTEGRITY',
  'TECH_COUNT',
  'COLONIST_MORALE',
]);

export const PromiseRecordSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  metric: PromiseMetricSchema,
  targetValue: z.number(),
  deadlineCycle: z.number().int().min(1),
  status: z.enum(['ACTIVE', 'KEPT', 'BROKEN']).default('ACTIVE'),
  rewardApproval: z.number().int().default(6),
  penaltyApproval: z.number().int().default(-8),
});

export const HkStarDomainSchema = z.enum([
  'AESTHETE',
  'AGRARIAN',
  'BUILDER',
  'EXPANSIONIST',
  'MERCHANT',
  'MILITARIST',
  'SCIENTIST',
]);

export const EraBranchIdSchema = z.enum([
  'BIOSPHERE',
  'INDUSTRY',
  'CIVIC',
  'FRONTIER',
]);

export const EraSpecializationRecordSchema = z.object({
  era: z.number().int().min(1).max(8),
  subEra: z.number().int().min(1).max(3),
  branchId: EraBranchIdSchema,
  specializationId: z.string(),
  title: z.string(),
  bonusSummary: z.string(),
});

export const HkProgressSchema = z.object({
  fame: z.number().int().min(0).default(120),
  starsByDomain: z.object({
    AESTHETE: z.number().int().min(0).max(3).default(0),
    AGRARIAN: z.number().int().min(0).max(3).default(0),
    BUILDER: z.number().int().min(0).max(3).default(1),
    EXPANSIONIST: z.number().int().min(0).max(3).default(0),
    MERCHANT: z.number().int().min(0).max(3).default(0),
    MILITARIST: z.number().int().min(0).max(3).default(0),
    SCIENTIST: z.number().int().min(0).max(3).default(0),
  }),
  eraAdvanceReady: z.boolean().default(false),
  subEra: z.number().int().min(1).max(3).default(1),
  activeBranchId: EraBranchIdSchema.default('BIOSPHERE'),
  subEraAdvanceReady: z.boolean().default(false),
  chosenSpecializations: z.array(EraSpecializationRecordSchema).default([]),
  transcendedCount: z.number().int().min(0).default(0),
  activeDoctrines: z.array(z.string()).default(['DOC_SOLAR_CHARTER']),
  unlockedTechIds: z.array(z.string()).default(['tech-e1-solar-grid']),
  activeResearchTechId: z.string().nullable().default('tech-e1-modular-fab'),
  researchTurnsLeft: z.number().int().min(0).default(3),
  factionEraTitle: z.string().default('Charte Pionnière 2050'),
});

export const GeneseStateSchema = z.object({
  act0Completed: z.boolean().default(false),
  expertBypass: z.boolean().default(false),
  hudStage: z.number().int().min(0).max(4).default(1),
  foundingChoiceId: z.string().nullable().default(null),
  nextArrivalCycle: z.number().int().min(1).default(4),
  completedCalEventIds: z.array(z.string()).default([]),
});

export const ColonistGearSchema = z.object({
  outfitTier: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
  toolTier: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
  weaponTier: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
});

export const ShipModuleSlotSchema = z.enum(['WEAPON', 'DEFENSE', 'PROPULSION', 'UTILITY']);

export const ShipInstalledModuleSchema = z.object({
  id: z.string().min(2).max(64),
  slot: ShipModuleSlotSchema,
  name: z.string().min(2).max(90),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
  firepower: z.number().min(0).default(0),
  defense: z.number().min(0).default(0),
  speed: z.number().min(0).default(0),
  utilityYield: z.number().min(0).default(0),
});

export const FleetShipSchema = z.object({
  id: z.string(),
  name: z.string(),
  shipClass: z.enum(['SHUTTLE_CARGO', 'CORVETTE_ORBITAL', 'FRIGATE_SOLAR', 'SCIENCE_PROBE', 'COLONY_ARK']),
  level: z.number().int().min(1).max(5).default(1),
  integrity: z.number().min(0).max(100).default(100),
  assignedRole: z.enum(['ORBIT_PATROL', 'RESOURCE_HAUL', 'RECON', 'TERRA_SEED']),
  maxSlots: z.number().int().min(2).max(6).default(4),
  loadout: z.array(ShipInstalledModuleSchema).default([]),
});

export const LivingCatalogStateSchema = z.object({
  recentCodes: z.array(z.string()).max(500).default([]),
  lastThreeTurnsCodes: z.array(z.array(z.string())).max(3).default([]),
  totalGenerated: z.number().int().min(0).default(0),
});

export const EntityLedgerDeltaSchema = z.object({
  credits: z.number(),
  energy: z.number(),
  materials: z.number(),
  water: z.number(),
  food: z.number(),
  compute: z.number(),
  breathingKits: z.number(),
  electronics: z.number(),
  shortages: z.array(z.string()),
  shedDistrictIds: z.array(z.string()),
  wornDistrictIds: z.array(z.string()),
});

export const TurnSummaryReportSchema = z.object({
  cycleCompleted: z.number().int().min(1),
  year: z.number().int(),
  season: z.string(),
  ledger: EntityLedgerDeltaSchema,
  starsEarnedThisTurn: z.number().int().min(0),
  totalEraStars: z.number().int().min(0),
  fameEarnedThisTurn: z.number().int(),
  totalFame: z.number().int(),
  eraAdvanceReady: z.boolean(),
  subEraAdvanceReady: z.boolean().optional(),
  promisesResolved: z.array(z.object({ title: z.string(), status: z.enum(['KEPT', 'BROKEN']) })),
  arrivalNotice: z.string().nullable(),
  calEventNotice: z.string().nullable(),
  stateHash: z.string(),
  commitDurationMs: z.number().min(0),
});

export const TurnEventsTierSchema = z.enum([
  'T1_HYDROGEN',
  'T2_HYDROGEN_RETRY',
  'T3_FLASH_LITE',
  'T4_OFFLINE_CV',
]);

export const TurnEvents4TResponseSchema = z.object({
  tier: TurnEventsTierSchema,
  modelUsed: z.string(),
  degraded: z.boolean(),
  latencyMs: z.number().nonnegative(),
  errorMessage: z.string().nullable().default(null),
  aiCopilotComment: z.string().max(260).optional(),
  dossiers: z.array(ExecutiveDossierSchema).max(4),
});

export const TurnSnapshotSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  cycle: z.number().int().nonnegative(),
  year: z.number().int(),
  season: z.string(),
  era: z.number().int().min(1).max(8),
  stateHash: z.string(),
  combatReports: z.array(CombatReportSchema),
});

export type AiPersonality = z.infer<typeof AiPersonalitySchema>;
export type AiPersona = z.infer<typeof AiPersonaSchema>;
export type BinarySpectra = z.infer<typeof BinarySpectraSchema>;
export type TerraformationV4 = z.infer<typeof TerraformationV4Schema>;
export type PromiseRecord = z.infer<typeof PromiseRecordSchema>;
export type HkStarDomain = z.infer<typeof HkStarDomainSchema>;
export type EraBranchId = z.infer<typeof EraBranchIdSchema>;
export type EraSpecializationRecord = z.infer<typeof EraSpecializationRecordSchema>;
export type HkProgress = z.infer<typeof HkProgressSchema>;
export type GeneseState = z.infer<typeof GeneseStateSchema>;
export type ColonistGear = z.infer<typeof ColonistGearSchema>;
export type ShipModuleSlot = z.infer<typeof ShipModuleSlotSchema>;
export type ShipInstalledModule = z.infer<typeof ShipInstalledModuleSchema>;
export type FleetShip = z.infer<typeof FleetShipSchema>;
export type LivingCatalogState = z.infer<typeof LivingCatalogStateSchema>;
export type EntityLedgerDelta = z.infer<typeof EntityLedgerDeltaSchema>;
export type TurnSummaryReport = z.infer<typeof TurnSummaryReportSchema>;
export type TurnEventsTier = z.infer<typeof TurnEventsTierSchema>;
export type TurnEvents4TResponse = z.infer<typeof TurnEvents4TResponseSchema>;
export type TurnSnapshot = z.infer<typeof TurnSnapshotSchema>;
