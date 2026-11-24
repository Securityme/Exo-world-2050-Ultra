import { z } from 'zod';

/**
 * [L0] EXW.L0.SKILLS_VCS | v5.1.0 | SADT A1.1
 * Contracts for:
 * - Autonomous Modular Skills Registry (strictly separated from documentation via docId)
 * - Isolated Documentation Version Control System (VCS Docs: SemVer, SHA-256, Diff & Revert)
 * - NF / AFNOR & DMT-SW Compliance Matrix
 * - Planetary Diplomacy Treaties, BioHealth (5 Divisions / FEAT-53), Ecclesia (FEAT-55/56 AR-19)
 * - Campaign Genesis (Government, Landing Sites, Specializations, Combinatorial Suggestions)
 */

export const SkillDomainSchema = z.enum([
  'APP',
  'GAME_WORLD',
  'GAME_ETHICS',
  'NARRATIVE',
]);

export const SkillHookKindSchema = z.enum([
  'SSOT_AUDIT',
  'DRIVE_SYNC',
  'DOCS_VCS',
  'BIOCLIMATE_5DIV',
  'BIOME_OCEAN_GEN',
  'PLANETARY_DIPLOMACY',
  'THOMISTIC_DISCERNMENT',
  'LLM_LEXICON',
  'BFF_CASCADE_ZERO',
]);

export const ModularSkillSpecSchema = z.object({
  id: z.string().min(2).max(64),
  code: z.string().min(2).max(32),
  name: z.string().min(2).max(100),
  domain: SkillDomainSchema,
  hookKind: SkillHookKindSchema,
  semver: z.string().min(5).max(32),
  enabled: z.boolean(),
  entryModule: z.string().min(3).max(140),
  docId: z.string().min(2).max(80),
  driveDocUrl: z.string().max(320).optional(),
  dependencies: z.array(z.string()),
  config: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  updatedAtIso: z.string(),
});

export const DocVcsSourceSchema = z.enum(['LOCAL', 'REVERT', 'DRIVE_IMPORT']);

export const DocVcsCategorySchema = z.enum([
  'ARCHITECTURE',
  'BLUEPRINT',
  'SKILL_GUIDE',
  'GAME_DESIGN',
  'NORMS_NF_AFNOR',
  'OPERATIONS',
]);

export const DocVcsRevisionSchema = z.object({
  revisionId: z.string().min(3).max(96),
  docId: z.string().min(2).max(80),
  semver: z.string().min(5).max(32),
  contentHash: z.string().min(8).max(128),
  author: z.string().min(1).max(80),
  summary: z.string().min(2).max(240),
  parentRevisionId: z.string().nullable(),
  source: DocVcsSourceSchema,
  createdAtIso: z.string(),
  content: z.string(),
});

export const DocVcsEntrySchema = z.object({
  docId: z.string().min(2).max(80),
  title: z.string().min(2).max(140),
  category: DocVcsCategorySchema,
  domain: SkillDomainSchema.or(z.literal('SYSTEM')),
  linkedSkillId: z.string().nullable(),
  driveFileId: z.string().nullable(),
  driveUrl: z.string().max(320).nullable(),
  currentSemver: z.string().min(5).max(32),
  currentRevisionId: z.string().min(3).max(96),
  currentContentHash: z.string().min(8).max(128),
  tags: z.array(z.string()),
  updatedAtIso: z.string(),
});

export const DocVcsStoreStateSchema = z.object({
  docs: z.array(DocVcsEntrySchema),
  revisions: z.array(DocVcsRevisionSchema),
  skills: z.array(ModularSkillSpecSchema),
});

export const SuggestionFieldKindSchema = z.enum(['PLANET', 'CAPITAL', 'LEADER', 'FLEET']);

export const PlanetaryTreatyKindSchema = z.enum([
  'MARITIME_TRADE',
  'NON_AGGRESSION',
  'SCIENCE_SHARE',
  'ORBITAL_EMBARGO',
  'PLANETARY_SUMMIT',
]);

export const PlanetaryTreatySchema = z.object({
  id: z.string(),
  kind: PlanetaryTreatyKindSchema,
  partnerRivalId: z.string().nullable(),
  partnerName: z.string(),
  signedCycle: z.number().int().min(0),
  durationCycles: z.number().int().min(1),
  remainingCycles: z.number().int().min(0),
  bonusLabel: z.string(),
});

export const PlanetaryDiplomacyStateSchema = z.object({
  influenceScore: z.number().min(0).max(100),
  treaties: z.array(PlanetaryTreatySchema),
});

export const BioHealthReportSchema = z.object({
  airScore: z.number().min(0).max(100),
  soilFertility: z.number().min(0).max(100),
  hydroScore: z.number().min(0).max(100),
  floraIndex: z.number().min(0).max(100),
  faunaIndex: z.number().min(0).max(100),
  catastropheDrag: z.number().min(0).max(40),
  compositeBioHealth: z.number().min(0).max(100),
  edenStreak: z.number().int().min(0),
  activeDivision: z.enum(['EXOSPHERE_0', 'THERMOSPHERE_1', 'MESOSPHERE_2', 'STRATOSPHERE_3', 'TROPOSPHERE_4']),
});

export const EcclesiaDiscernmentGradeSchema = z.union([
  z.literal(3),
  z.literal(2),
  z.literal(1),
  z.literal(0),
  z.literal(-1),
  z.literal(-2),
]);

export const EcclesiaStateSchema = z.object({
  pastoralAxis: z.number().min(0).max(100),
  charityAxis: z.number().min(0).max(100),
  contemplationAxis: z.number().min(0).max(100),
  dialogueAxis: z.number().min(0).max(100),
  freedomOfConscienceScore: z.number().min(80).max(100),
  lastDiscernmentGrade: EcclesiaDiscernmentGradeSchema,
});

export const SettlementProfileSchema = z.object({
  governmentTypeId: z.string(),
  leaderName: z.string(),
  capitalName: z.string(),
  fleetName: z.string(),
  landingSiteId: z.string(),
  startingSpecializationId: z.string(),
  difficultyPreset: z.enum(['EXPLORATEUR', 'COMMANDANT', 'STRATEGE']),
  resourceAbundance: z.enum(['SOBRE', 'EQUILIBRE', 'ABONDANT']),
  initialDiplomaticTension: z.enum(['DETENDUE', 'EQUILIBREE', 'TENDUE']),
});

export const EventChainQueueEntrySchema = z.object({
  chainId: z.string(),
  step: z.number().int().min(1),
  totalSteps: z.number().int().min(1),
  title: z.string(),
  nextTriggerCycle: z.number().int().min(0),
});

export type SkillDomain = z.infer<typeof SkillDomainSchema>;
export type SkillHookKind = z.infer<typeof SkillHookKindSchema>;
export type ModularSkillSpec = z.infer<typeof ModularSkillSpecSchema>;
export type DocVcsSource = z.infer<typeof DocVcsSourceSchema>;
export type DocVcsCategory = z.infer<typeof DocVcsCategorySchema>;
export type DocVcsRevision = z.infer<typeof DocVcsRevisionSchema>;
export type DocVcsEntry = z.infer<typeof DocVcsEntrySchema>;
export type DocVcsStoreState = z.infer<typeof DocVcsStoreStateSchema>;
export type SuggestionFieldKind = z.infer<typeof SuggestionFieldKindSchema>;
export type PlanetaryTreatyKind = z.infer<typeof PlanetaryTreatyKindSchema>;
export type PlanetaryTreaty = z.infer<typeof PlanetaryTreatySchema>;
export type PlanetaryDiplomacyState = z.infer<typeof PlanetaryDiplomacyStateSchema>;
export type BioHealthReport = z.infer<typeof BioHealthReportSchema>;
export type EcclesiaDiscernmentGrade = z.infer<typeof EcclesiaDiscernmentGradeSchema>;
export type EcclesiaState = z.infer<typeof EcclesiaStateSchema>;
export type SettlementProfile = z.infer<typeof SettlementProfileSchema>;
export type EventChainQueueEntry = z.infer<typeof EventChainQueueEntrySchema>;
