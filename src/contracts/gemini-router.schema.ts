import { z } from 'zod';

/**
 * [L0] EXW.L0.GEMINI_ROUTER | v5.0.0 | SADT A2.1/A5.2
 * 6-Channel Free-Tier Gemini Router, Cumulative Cost Ledger & Grouped Turn Digest contracts.
 */
export const GeminiChannelIdSchema = z.enum([
  'text',
  'entities',
  'consequences',
  'digest',
  'image',
  'video',
]);

export const GeminiChannelUsageSchema = z.object({
  channel: GeminiChannelIdSchema,
  modelId: z.string(),
  calls: z.number().int().min(0).default(0),
  inputTokens: z.number().int().min(0).default(0),
  outputTokens: z.number().int().min(0).default(0),
  referenceUsdEquivalent: z.number().min(0).default(0),
});

export const GeminiCostLedgerSchema = z.object({
  freeTierStrict: z.boolean().default(true),
  billedUsd: z.number().min(0).default(0),
  totalCalls: z.number().int().min(0).default(0),
  totalInputTokens: z.number().int().min(0).default(0),
  totalOutputTokens: z.number().int().min(0).default(0),
  channels: z.record(GeminiChannelIdSchema, GeminiChannelUsageSchema),
});

export const TurnChoiceLogEntrySchema = z.object({
  id: z.string(),
  turn: z.number().int().min(0),
  dossierCode: z.string(),
  dossierTitle: z.string(),
  dossierClass: z.string(),
  optionLabel: z.string(),
  sourceModel: z.string(),
  channel: GeminiChannelIdSchema,
  philosophySchoolId: z.string(),
  paSpent: z.number().int().min(0),
});

export const TurnGroupedChoiceSummarySchema = z.object({
  cycle: z.number().int().min(0),
  totalDecisions: z.number().int().min(0),
  byCategory: z.record(z.string(), z.number().int().min(0)),
  byModel: z.record(z.string(), z.number().int().min(0)),
  byPhilosophy: z.record(z.string(), z.number().int().min(0)),
  entries: z.array(TurnChoiceLogEntrySchema),
});

export type GeminiChannelId = z.infer<typeof GeminiChannelIdSchema>;
export type GeminiChannelUsage = z.infer<typeof GeminiChannelUsageSchema>;
export type GeminiCostLedger = z.infer<typeof GeminiCostLedgerSchema>;
export type TurnChoiceLogEntry = z.infer<typeof TurnChoiceLogEntrySchema>;
export type TurnGroupedChoiceSummary = z.infer<typeof TurnGroupedChoiceSummarySchema>;
