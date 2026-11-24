import { z } from 'zod';

/**
 * [L0] EXW.L0.NESTED_BADGES | v5.0.0 | SADT A2.1/A5.1
 * 3-Level Stacked Badge Architecture (Master -> Level 1 -> Level 2)
 * for both AI Provenance and 3-Level Philosophical/Ethical Classification.
 */
export const BadgeColorToneSchema = z.enum([
  'ROSE',
  'AMBER',
  'EMERALD',
  'VIOLET',
  'SLATE',
  'CORAL',
  'GOLD',
  'INDIGO',
]);

export const NestedBadgeLevelSchema = z.object({
  id: z.string(),
  label: z.string(),
  shortLabel: z.string(),
  tone: BadgeColorToneSchema,
  description: z.string(),
});

export const StackedBadgeTripletSchema = z.object({
  id: z.string(),
  kind: z.enum(['PROVENANCE', 'ETHICS', 'GAMEPLAY', 'SUBCHOICE']),
  master: NestedBadgeLevelSchema,
  level1: NestedBadgeLevelSchema,
  level2: NestedBadgeLevelSchema,
  cumulativeCount: z.number().int().min(0).optional(),
  punctualDelta: z.number().int().optional(),
});

export type BadgeColorTone = z.infer<typeof BadgeColorToneSchema>;
export type NestedBadgeLevel = z.infer<typeof NestedBadgeLevelSchema>;
export type StackedBadgeTriplet = z.infer<typeof StackedBadgeTripletSchema>;
