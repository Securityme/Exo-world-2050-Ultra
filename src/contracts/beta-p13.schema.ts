import { z } from 'zod';

/**
 * [L0] EXW.L0.BETA_P13_SCHEMA | v5.0.0 | SADT A5.3
 * Strict Zod contracts for Wave P13: Virtual Beta-Testers & Community Improvement Questionnaire.
 */
export const BetaTesterProfileIdSchema = z.enum([
  'STRATEGIST_4X',
  'MOBILE_SAFARI',
  'NARRATIVE_ETHICS',
  'ENGINEER_3D',
  'DISCOVERY_SOLARPUNK',
  'COMMUNITY_PLAYER',
]);
export type BetaTesterProfileId = z.infer<typeof BetaTesterProfileIdSchema>;

export const BetaCriterionIdSchema = z.enum([
  'LOOP_PA',
  'HUD_DESKTOP',
  'MOBILE_SAFARI',
  'THEME_ASTRALIS',
  'BADGES_ETHICS',
  'SCENARIO_MATRIX',
  'HONORS_2TIER',
  'CITY_3D_CLIMATE',
  'GEMINI_FREE_TIER',
  'DOC_GOVERNANCE',
]);
export type BetaCriterionId = z.infer<typeof BetaCriterionIdSchema>;

export const BetaRatingsMapSchema = z.record(BetaCriterionIdSchema, z.number().int().min(1).max(5));
export type BetaRatingsMap = Record<BetaCriterionId, number>;

export const BetaQuestionnaireSubmissionSchema = z.object({
  id: z.string().min(2).max(80),
  authorName: z.string().min(2).max(48),
  profileId: BetaTesterProfileIdSchema,
  profileLabel: z.string().min(2).max(80),
  source: z.enum(['VIRTUAL_PERSONA', 'COMMUNITY']),
  ratings: z.object({
    LOOP_PA: z.number().min(1).max(5),
    HUD_DESKTOP: z.number().min(1).max(5),
    MOBILE_SAFARI: z.number().min(1).max(5),
    THEME_ASTRALIS: z.number().min(1).max(5),
    BADGES_ETHICS: z.number().min(1).max(5),
    SCENARIO_MATRIX: z.number().min(1).max(5),
    HONORS_2TIER: z.number().min(1).max(5),
    CITY_3D_CLIMATE: z.number().min(1).max(5),
    GEMINI_FREE_TIER: z.number().min(1).max(5),
    DOC_GOVERNANCE: z.number().min(1).max(5),
  }),
  priorityCriterionId: BetaCriterionIdSchema,
  strengths: z.array(z.string().min(2).max(260)).max(6).default([]),
  recommendations: z.array(z.string().min(2).max(260)).max(6).default([]),
  comment: z.string().min(10).max(1200),
  submittedAtIso: z.string().min(8).max(40),
});
export type BetaQuestionnaireSubmission = z.infer<typeof BetaQuestionnaireSubmissionSchema>;

export const BetaCriterionSummarySchema = z.object({
  criterionId: BetaCriterionIdSchema,
  label: z.string(),
  category: z.string(),
  averageScore: z.number().min(0).max(5),
  priorityVotes: z.number().int().min(0),
  v51Action: z.string(),
});
export type BetaCriterionSummary = z.infer<typeof BetaCriterionSummarySchema>;

export const BetaReleaseVerdictSchema = z.enum(['GO_RELEASE', 'CONDITIONAL', 'NEEDS_FIX']);
export type BetaReleaseVerdict = z.infer<typeof BetaReleaseVerdictSchema>;

export const ConsolidatedBetaReportSchema = z.object({
  totalResponses: z.number().int().min(0),
  virtualCount: z.number().int().min(0),
  communityCount: z.number().int().min(0),
  globalAverage: z.number().min(0).max(5),
  lowestCriterionId: BetaCriterionIdSchema,
  highestCriterionId: BetaCriterionIdSchema,
  verdict: BetaReleaseVerdictSchema,
  criteriaSummaries: z.array(BetaCriterionSummarySchema),
  prioritizedBacklog: z.array(BetaCriterionSummarySchema),
});
export type ConsolidatedBetaReport = z.infer<typeof ConsolidatedBetaReportSchema>;
