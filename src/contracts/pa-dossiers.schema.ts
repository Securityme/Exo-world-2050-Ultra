import { z } from 'zod';

/**
 * [L0] FUP-002 | SM-01 | SADT A2.1–A2.3
 * Executive Dossiers (P0 + C1..C5), PA Général + 4 Sous-PA Advisors,
 * Asymmetric Fungibility (R-26) & New Vegas DAG Skill-Check contracts (R-28).
 */
export const DossierClassSchema = z.enum(['P0', 'C1', 'C2', 'C3', 'C4', 'C5']);

export const SubPaDomainSchema = z.enum(['PA_GES', 'PA_MNT', 'PA_BIO', 'PA_POL']);

export const RefinementLevelSchema = z.union([z.literal(0), z.literal(1), z.literal(2)]);

export const SkillCheckSchema = z.object({
  attribute: z.enum(['engineering', 'diplomacy', 'ecology', 'strategy', 'cyber']),
  threshold: z.number().int().min(1).max(20),
  successBonusLabel: z.string().min(2).max(120),
  failureRiskLabel: z.string().min(2).max(120),
});

export const DossierEffectVectorSchema = z.object({
  credits: z.number().default(0),
  energy: z.number().default(0),
  materials: z.number().default(0),
  water: z.number().default(0),
  food: z.number().default(0),
  electronics: z.number().default(0),
  compute: z.number().default(0),
  breathingKits: z.number().default(0),
  approvalDelta: z.number().min(-25).max(25).default(0),
  atmosphereDelta: z.number().min(-15).max(15).default(0),
  maintenanceDelta: z.number().min(-30).max(35).default(0),
  allianceTrustDelta: z.number().min(-20).max(20).default(0),
  eraStarsDelta: z.number().min(0).max(3).default(0),
  xpCiv: z.number().min(0).max(200).default(0),
  xpCabinet: z.number().min(0).max(200).default(0),
  xpAlliance: z.number().min(0).max(200).default(0),
  delayedEchoSummary: z.string().max(240).optional(),
  oracleImpactFactor: z.number().min(-0.15).max(0.15).default(0),
});

export const DossierActionPayloadSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('GRAFT_MODULE'), districtId: z.string() }),
  z.object({ kind: z.literal('BANK_LOAN'), principal: z.number().positive() }),
  z.object({
    kind: z.literal('MARKET_TRADE'),
    resource: z.enum(['materials', 'water', 'food', 'electronics', 'helium3']),
    action: z.enum(['BUY', 'SELL']),
    quantity: z.number().int().positive(),
  }),
  z.object({
    kind: z.literal('REASSIGN_DRONE'),
    fromRole: z.enum(['construction', 'defense', 'attack', 'recon']),
    toRole: z.enum(['construction', 'defense', 'attack', 'recon']),
  }),
  z.object({ kind: z.literal('CYBER_PARALYSIS'), rivalId: z.string() }),
  z.object({
    kind: z.literal('RECRUIT_UNIT'),
    unitClass: z.enum(['INFANTRY_EXO', 'ARMOR_MECH', 'DRONE_SWARM', 'ORBITAL_CORVETTE', 'CYBER_EW']),
    level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  }),
  z.object({
    kind: z.literal('LAUNCH_COMBAT'),
    targetTileIndex: z.number().int().min(0).max(71),
  }),
  z.object({
    kind: z.literal('EQUIP_SHIP_MODULE'),
    shipId: z.string().min(2).max(64),
    moduleId: z.string().min(2).max(64),
  }),
  z.object({
    kind: z.literal('REFIT_SHIP'),
    shipId: z.string().min(2).max(64),
    mode: z.enum(['REPAIR', 'UPGRADE_LEVEL']),
  }),
  z.object({
    kind: z.literal('COMMISSION_SHIP'),
    shipClass: z.enum(['SHUTTLE_CARGO', 'CORVETTE_ORBITAL', 'FRIGATE_SOLAR', 'SCIENCE_PROBE', 'COLONY_ARK']),
    customName: z.string().max(48).optional(),
  }),
  z.object({
    kind: z.literal('UPGRADE_COLONIST_GEAR'),
    gearSlot: z.enum(['outfitTier', 'toolTier', 'weaponTier']),
    colonistId: z.string().max(64).optional(),
  }),
  z.object({
    kind: z.literal('START_RESEARCH'),
    techId: z.string().min(2).max(64),
  }),
  z.object({
    kind: z.literal('DIPLOMATIC_INITIATIVE'),
    mode: z.enum(['ALLIANCE_PACT', 'RIVAL_DETENTE', 'TRADE_ACCORD']),
    rivalId: z.string().max(64).optional(),
  }),
  z.object({
    kind: z.literal('SIGN_PLANETARY_TREATY'),
    treatyKind: z.enum([
      'MARITIME_TRADE',
      'NON_AGGRESSION',
      'SCIENCE_SHARE',
      'ORBITAL_EMBARGO',
      'PLANETARY_SUMMIT',
    ]),
    rivalId: z.string().max(64).optional(),
  }),
  z.object({
    kind: z.literal('DISPATCH_COLONIST_MISSION'),
    colonistId: z.string().max(64),
    missionFocus: z.enum(['RECON_BIOME', 'MAINTENANCE_FIELD', 'DIPLOMACY_ENVOY']),
  }),
  z.object({
    kind: z.literal('REST_COLONIST'),
    colonistId: z.string().max(64),
  }),
  z.object({
    kind: z.literal('ECCLESIA_DISCERNMENT'),
    axis: z.enum(['PASTORAL', 'CHARITY', 'CONTEMPLATION', 'DIALOGUE']),
  }),
  z.object({ kind: z.literal('DEFER_ACTION') }),
]);

export const DossierSubChoiceEffectsSchema = z.object({
  credits: z.number().default(0),
  energy: z.number().default(0),
  materials: z.number().default(0),
  water: z.number().default(0),
  food: z.number().default(0),
  electronics: z.number().default(0),
  compute: z.number().default(0),
  breathingKits: z.number().default(0),
  atmosphereDelta: z.number().min(-10).max(10).default(0),
  maintenanceDelta: z.number().min(-15).max(20).default(0),
  allianceTrustDelta: z.number().min(-10).max(10).default(0),
});

export const SubChoiceBadgeMetaSchema = z.object({
  modeTag: z.string().min(2).max(28),
  focusTag: z.string().min(2).max(28),
  costTag: z.string().min(2).max(28),
  tone: z.enum(['GOLD', 'ROSE', 'EMERALD', 'INDIGO', 'VIOLET', 'AMBER', 'CORAL', 'SLATE']),
});

export const DossierSubChoiceSchema = z.object({
  id: z.string().min(2).max(64),
  label: z.string().min(2).max(90),
  description: z.string().min(4).max(220),
  extraPaGeneralCost: z.number().int().min(0).max(3).default(0),
  extraSubPaCost: z.number().int().min(0).max(3).default(0),
  bonusEffects: DossierSubChoiceEffectsSchema.optional(),
  badgeMeta: SubChoiceBadgeMetaSchema.optional(),
});

export const DossierOptionSchema = z.object({
  id: z.string().min(2).max(64),
  label: z.string().min(3).max(110),
  doctrineTag: z.enum(['SOLARPUNK', 'CORPORATE', 'SECURITY', 'SCIENTIFIC', 'FEDERAL']),
  description: z.string().min(6).max(300),
  paGeneralCost: z.number().int().min(0).max(6),
  subPaDomain: SubPaDomainSchema.nullable(),
  subPaCost: z.number().int().min(0).max(6),
  skillCheck: SkillCheckSchema.optional(),
  effects: DossierEffectVectorSchema,
  actionPayload: DossierActionPayloadSchema.optional(),
  subChoices: z.array(DossierSubChoiceSchema).max(4).optional(),
});

export const ExecutiveDossierSchema = z.object({
  id: z.string().min(3).max(80),
  code: z.string().min(3).max(24),
  dossierClass: DossierClassSchema,
  title: z.string().min(4).max(120),
  briefing: z.string().min(10).max(520),
  source: z.enum(['WATCHDOG', 'CATALOG', 'DIRECT_INITIATIVE', 'ORACLE_GEMINI', 'ACTION_GATEWAY']),
  slotIndex: z.number().int().min(1).max(6).default(1),
  tileIndex: z.number().int().min(0).max(71).default(12),
  expiresInCycles: z.number().int().min(1).max(6),
  scientificTag: z.string().max(80).optional(),
  options: z.array(DossierOptionSchema).min(2).max(6),
});

export const ExecutiveDecisionIntentSchema = z.object({
  dossierId: z.string().min(3).max(80),
  optionId: z.string().min(2).max(64),
  subChoiceId: z.string().max(64).optional(),
  refinementLevel: RefinementLevelSchema,
  assignedAdvisorId: z.string().min(2).max(64),
  useGeneralPaFallback: z.boolean().default(false),
  moduleExtensionTag: z.enum(['NONE', 'ENERGY_BOOST', 'STORAGE_BAY', 'OUTPUT_CORE']).default('NONE'),
});

export const PaBudgetSchema = z.object({
  general: z.number().int().min(0),
  generalRegen: z.number().int().min(1),
  generalCap: z.number().int().min(1),
  subPa: z.object({
    PA_GES: z.number().int().min(0),
    PA_MNT: z.number().int().min(0),
    PA_BIO: z.number().int().min(0),
    PA_POL: z.number().int().min(0),
  }),
  subPaRegen: z.object({
    PA_GES: z.number().int().min(1),
    PA_MNT: z.number().int().min(1),
    PA_BIO: z.number().int().min(1),
    PA_POL: z.number().int().min(1),
  }),
});

export type DossierClass = z.infer<typeof DossierClassSchema>;
export type SubPaDomain = z.infer<typeof SubPaDomainSchema>;
export type RefinementLevel = z.infer<typeof RefinementLevelSchema>;
export type DossierActionPayload = z.infer<typeof DossierActionPayloadSchema>;
export type SubChoiceBadgeMeta = z.infer<typeof SubChoiceBadgeMetaSchema>;
export type DossierSubChoice = z.infer<typeof DossierSubChoiceSchema>;
export type DossierOption = z.infer<typeof DossierOptionSchema>;
export type ExecutiveDossier = z.infer<typeof ExecutiveDossierSchema>;
export type ExecutiveDecisionIntent = z.infer<typeof ExecutiveDecisionIntentSchema>;
export type PaBudget = z.infer<typeof PaBudgetSchema>;
