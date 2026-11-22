import { z } from 'zod';

/**
 * [L0] EXW.L0.HONORS | v5.0.0 | SADT A5.1
 * Two-Tier Honors System:
 * - Tier 1: Multi-Campaign Lobby Showcase (Call of Duty / Foundation / Humankind)
 * - Tier 2: Active Campaign Hierarchy (CK3 Traits, Territorial Titles & 5 Attributes)
 */
export const MedalTierSchema = z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']);

export const MetaMedalRecordSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(['CONCEPTION', 'EXPLORATION', 'BIOSPHERE', 'DIPLOMACY', 'MILITARY', 'PHILOSOPHY']),
  tier: MedalTierSchema,
  description: z.string(),
  unlocked: z.boolean(),
  progressCurrent: z.number().min(0),
  progressTarget: z.number().positive(),
  isSymbolicDistinction: z.boolean().default(false),
  unlockedAtIso: z.string().nullable().default(null),
});

export const MetaBadgeRecordSchema = z.object({
  id: z.string(),
  label: z.string(),
  tier: MedalTierSchema,
  colorHex: z.string(),
  description: z.string(),
  unlocked: z.boolean(),
  isSymbolicDistinction: z.boolean().default(false),
});

export const MetaTitleRecordSchema = z.object({
  id: z.string(),
  label: z.string(),
  requirement: z.string(),
  unlocked: z.boolean(),
  isSymbolicDistinction: z.boolean().default(false),
});

export const MetaPlayerShowcaseSchema = z.object({
  callsign: z.string().min(2).max(40),
  avatarPresetId: z.string(),
  customAvatarDataUrl: z.string().max(180000).nullable(),
  bannerStyleId: z.enum(['ASTRAL_ROSE', 'SOLAR_GOLD', 'EDEN_EMERALD', 'OBSIDIAN_PLATINUM']),
  emblemId: z.enum(['STAR_COMPASS', 'ORBIT_CROWN', 'BIO_LEAF', 'AEGIS_SHIELD', 'FOUNDER_PRISM']),
  equippedTitleId: z.string(),
  pinnedBadgeIds: z.array(z.string()).max(4),
  campaignsPlayed: z.number().int().min(0),
  totalTurnsSimulated: z.number().int().min(0),
  totalDecisionsSigned: z.number().int().min(0),
  medals: z.array(MetaMedalRecordSchema),
  badges: z.array(MetaBadgeRecordSchema),
  titles: z.array(MetaTitleRecordSchema),
  updatedAtIso: z.string(),
});

export const CharacterAttributesSchema = z.object({
  diplomacy: z.number().int().min(1).max(30),
  martial: z.number().int().min(1).max(30),
  stewardship: z.number().int().min(1).max(30),
  intrigue: z.number().int().min(1).max(30),
  learning: z.number().int().min(1).max(30),
});

export const CampaignTraitSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: z.enum(['GOVERNANCE', 'ETHICS', 'MILITARY', 'SCIENCE', 'ECOLOGY']),
  bonusSummary: z.string(),
  attributeModifiers: z.object({
    diplomacy: z.number().int().default(0),
    martial: z.number().int().default(0),
    stewardship: z.number().int().default(0),
    intrigue: z.number().int().default(0),
    learning: z.number().int().default(0),
  }),
});

export const TerritorialTitleSchema = z.object({
  id: z.string(),
  rank: z.enum(['SECTOR_WARDEN', 'CITY_GOVERNOR', 'PLANETARY_ARCHON', 'STELLAR_CONSUL']),
  titleName: z.string(),
  territoryLabel: z.string(),
  prestigeBonus: z.number().int().min(0),
});

export const CampaignCommanderProfileSchema = z.object({
  attributes: CharacterAttributesSchema,
  traits: z.array(CampaignTraitSchema),
  territorialTitles: z.array(TerritorialTitleSchema),
  activePrimaryTitleId: z.string(),
});

export type MedalTier = z.infer<typeof MedalTierSchema>;
export type MetaMedalRecord = z.infer<typeof MetaMedalRecordSchema>;
export type MetaBadgeRecord = z.infer<typeof MetaBadgeRecordSchema>;
export type MetaTitleRecord = z.infer<typeof MetaTitleRecordSchema>;
export type MetaPlayerShowcase = z.infer<typeof MetaPlayerShowcaseSchema>;
export type CharacterAttributes = z.infer<typeof CharacterAttributesSchema>;
export type CampaignTrait = z.infer<typeof CampaignTraitSchema>;
export type TerritorialTitle = z.infer<typeof TerritorialTitleSchema>;
export type CampaignCommanderProfile = z.infer<typeof CampaignCommanderProfileSchema>;
