import { z } from 'zod';
import { PaBudgetSchema, ExecutiveDossierSchema } from './pa-dossiers.schema.ts';
import { TriggerBusEventSchema } from './trigger-bus.schema.ts';
import { CombatReportSchema, MilitaryUnitStackSchema } from './combat-units.schema.ts';
import {
  AtmosphereTierSchema,
  CameraScaleSchema,
  CityDistrictPacketSchema,
  PlanetBiomeProfileSchema,
  PlanetClimatePresetSchema,
  PlanetReliefPresetSchema,
} from './render-bridge.schema.ts';
import {
  AiPersonaSchema,
  BinarySpectraSchema,
  ColonistGearSchema,
  FleetShipSchema,
  GeneseStateSchema,
  HkProgressSchema,
  LivingCatalogStateSchema,
  PromiseRecordSchema,
  TerraformationV4Schema,
  TurnSnapshotSchema,
  TurnSummaryReportSchema,
} from './v4-systems.schema.ts';
import {
  BioHealthReportSchema,
  EcclesiaStateSchema,
  EventChainQueueEntrySchema,
  PlanetaryDiplomacyStateSchema,
  SettlementProfileSchema,
} from './skills-vcs.schema.ts';

/**
 * [L0] FUP-010 / FUP-012 | MC-00 | SADT A0
 * Canonical WorldState Zod schema — Single Source of Truth (R-01, R-02).
 */
export const AdvisorSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  domain: z.enum(['PA_GES', 'PA_MNT', 'PA_BIO', 'PA_POL']),
  attributeScore: z.number().int().min(1).max(15),
  traitName: z.string(),
  traitBonus: z.number().int().min(-2).max(4),
  xpLevel: z.number().int().min(1).max(20),
  fatigue: z.number().min(0).max(100),
  loyalty: z.number().min(0).max(100),
});

export const ColonistSchema = z.object({
  id: z.string(),
  name: z.string(),
  specialty: z.enum(['ENGINEERING', 'AGRONOMY', 'CYBERNETICS', 'SECURITY', 'EXOBIOLOGY']),
  trait: z.string(),
  morale: z.number().min(0).max(100),
  fatigue: z.number().min(0).max(100),
  assignedDistrictId: z.string().nullable(),
  health: z.number().min(0).max(100).optional(),
  happiness: z.number().min(0).max(100).optional(),
  level: z.number().int().min(1).max(10).optional(),
  xp: z.number().int().min(0).optional(),
  gear: ColonistGearSchema.optional(),
});

export const LoanSchema = z.object({
  id: z.string(),
  principal: z.number().positive(),
  remaining: z.number().nonnegative(),
  interestRate: z.number().min(0.01).max(0.35),
  cyclesLeft: z.number().int().min(0),
});

export const RivalPowerSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  colorHex: z.string(),
  era: z.number().int().min(1).max(6),
  eraStars: z.number().int().min(0),
  humankindScore: z.number().int().min(0),
  economyIndex: z.number().min(0),
  militaryPower: z.number().min(0),
  computeDefense: z.number().min(1),
  relationWithPlayer: z.number().min(-100).max(100),
  isAlliedPair: z.boolean(),
  controlledTiles: z.number().int().min(0),
  paralyzedCycles: z.number().int().min(0),
});

export const ChronicleEntrySchema = z.object({
  id: z.string(),
  cycle: z.number().int().nonnegative(),
  tick: z.number().int().nonnegative(),
  category: z.enum(['DOSSIER', 'COMBAT', 'ERA', 'ATMOSPHERE', 'FINANCE', 'ALLIANCE', 'REFERENDUM']),
  title: z.string(),
  detail: z.string(),
  stateHash: z.string(),
});

export const DroneAllocationSchema = z.object({
  construction: z.number().int().min(0),
  defense: z.number().int().min(0),
  attack: z.number().int().min(0),
  recon: z.number().int().min(0),
  reassigningCooldown: z.number().int().min(0),
});

export const PlanetBiomeShareSchema = z.object({
  id: z.string(),
  label: z.string(),
  pct: z.number().min(0).max(100),
  colorHex: z.string(),
});

export const PlanetWorldProfileSchema = z.object({
  biomeId: PlanetBiomeProfileSchema,
  name: z.string(),
  oceanCoveragePct: z.number().min(0).max(95),
  relief: PlanetReliefPresetSchema,
  climate: PlanetClimatePresetSchema,
  biomeDistribution: z.array(PlanetBiomeShareSchema),
});

export const WorldStateSchema = z.object({
  campaignId: z.string(),
  worldSeed: z.number().int().nonnegative(),
  prngState: z.number().int().nonnegative(),
  superpowerId: z.string(),
  superAllianceName: z.string(),
  doctrineId: z.string(),
  tick: z.number().int().nonnegative(),
  cycle: z.number().int().nonnegative(),
  year: z.number().int().min(2050),
  month: z.number().int().min(1).max(12),
  season: z.enum(['PRINTEMPS', 'ETE', 'AUTOMNE', 'HIVER']),
  era: z.number().int().min(1).max(6),
  eraStars: z.number().int().min(0),
  mode: z.enum(['CAMPAIGN', 'INFINITE_SANDBOX']),
  victoryState: z.enum(['ACTIVE', 'VICTORY', 'DEFEAT']),
  victoryReason: z.string().nullable(),
  activeScale: CameraScaleSchema,
  activeSlotIndex: z.number().int().min(1).max(6),
  unlockedSlots: z.number().int().min(1).max(6),
  atmosphereTier: AtmosphereTierSchema,
  atmosphereProgress: z.number().min(0).max(100),
  biomeStabilityCycles: z.number().int().min(0),
  weatherState: z.enum(['CLEAR', 'DUST_STORM', 'SOLAR_FLARE', 'RAIN', 'CRYO_FRONT']),
  resources: z.object({
    credits: z.number(),
    energy: z.number(),
    materials: z.number(),
    water: z.number(),
    food: z.number(),
    electronics: z.number(),
    orbitalFuel: z.number(),
    compute: z.number(),
    breathingKits: z.number(),
    helium3: z.number(),
    rareEarths: z.number(),
    galacticInfluence: z.number(),
  }),
  marketPrices: z.object({
    materials: z.number(),
    water: z.number(),
    food: z.number(),
    electronics: z.number(),
    helium3: z.number(),
  }),
  finance: z.object({
    cityTaxIncome: z.number(),
    maintenanceUpkeep: z.number(),
    respiratoryCost: z.number(),
    solvencyRating: z.enum(['AAA', 'AA', 'A', 'BBB', 'BB', 'C', 'D']),
    loans: z.array(LoanSchema),
  }),
  approval: z.number().min(0).max(100),
  referendumActive: z.boolean(),
  superAllianceRank: z.number().int().min(1).max(6),
  superAllianceTrust: z.number().min(0).max(100),
  superAllianceDirective: z.string(),
  transporterTier: z.number().int().min(1).max(4),
  datacenterTier: z.number().int().min(1).max(5),
  pa: PaBudgetSchema,
  advisors: z.array(AdvisorSchema).length(4),
  colonists: z.array(ColonistSchema),
  districts: z.array(CityDistrictPacketSchema),
  drones: DroneAllocationSchema,
  militaryRoster: z.array(MilitaryUnitStackSchema),
  rivals: z.array(RivalPowerSchema),
  capturedTiles: z.array(z.number().int().min(0).max(71)),
  rivalTiles: z.array(z.number().int().min(0).max(71)),
  activeDossiers: z.array(ExecutiveDossierSchema),
  triggerBus: z.array(TriggerBusEventSchema),
  combatReports: z.array(CombatReportSchema),
  chronicle: z.array(ChronicleEntrySchema),
  xp: z.object({
    civilization: z.number().int().nonnegative(),
    cabinet: z.number().int().nonnegative(),
    alliance: z.number().int().nonnegative(),
  }),
  achievements: z.array(z.string()),
  adaptiveDeltaP: z.number().min(-0.2).max(0.25),
  stateHash: z.string(),
  // V4 Core Gameplay Systems (optional for backwards compatibility with v3.1 snapshots)
  aiPersona: AiPersonaSchema.optional(),
  spectra: BinarySpectraSchema.optional(),
  terra: TerraformationV4Schema.optional(),
  promises: z.array(PromiseRecordSchema).optional(),
  hk: HkProgressSchema.optional(),
  genese: GeneseStateSchema.optional(),
  fleetShips: z.array(FleetShipSchema).optional(),
  colonistGear: ColonistGearSchema.optional(),
  livingCatalog: LivingCatalogStateSchema.optional(),
  lastTurnSummary: TurnSummaryReportSchema.nullable().optional(),
  turn_snapshots: z.array(TurnSnapshotSchema).optional(),
  enabledExtensions: z.array(z.string()).optional(),
  claimedQuestIds: z.array(z.string()).optional(),
  planetProfile: PlanetWorldProfileSchema.optional(),
  planetaryDiplomacy: PlanetaryDiplomacyStateSchema.optional(),
  bioHealth: BioHealthReportSchema.optional(),
  ecclesiaState: EcclesiaStateSchema.optional(),
  settlementProfile: SettlementProfileSchema.optional(),
  eventChainQueue: z.array(EventChainQueueEntrySchema).optional(),
});

export type Advisor = z.infer<typeof AdvisorSchema>;
export type Colonist = z.infer<typeof ColonistSchema>;
export type Loan = z.infer<typeof LoanSchema>;
export type RivalPower = z.infer<typeof RivalPowerSchema>;
export type ChronicleEntry = z.infer<typeof ChronicleEntrySchema>;
export type DroneAllocation = z.infer<typeof DroneAllocationSchema>;
export type PlanetBiomeShare = z.infer<typeof PlanetBiomeShareSchema>;
export type PlanetWorldProfile = z.infer<typeof PlanetWorldProfileSchema>;
export type WorldState = z.infer<typeof WorldStateSchema>;
