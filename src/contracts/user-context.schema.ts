import { z } from 'zod';

/**
 * [L0] EXW.L0.USER_CONTEXT_3D | v5.0.0 | SADT A5.1
 * Strictly separated 3-Dimension User Context Contract:
 * 1) shellUxHabits: remembered accordions, preferred navigation, last subscreen habits
 * 2) displaySettingsProfile: synchronized theme, Safari text sync, opacity, saturation
 * 3) simulationTraceabilityProfile: TraceabilityMatrix + per-campaign EventLog
 */
export const ShellUxHabitsSchema = z.object({
  accordionStates: z.record(z.string(), z.boolean()),
  preferredHudTab: z.enum(['WORLDS_HUB', 'EVENTS_HUB', 'JOURNAL_HUB']),
  preferredOverlayMode: z.enum(['STANDARD', 'MAINTENANCE', 'LOGISTICS', 'TACTICAL', 'BIOSPHERE']),
  preferredScenarioComplexity: z.enum(['STANDARD', 'ADVANCED']),
  devDrawerPinned: z.boolean(),
});

export const DisplaySettingsProfileSchema = z.object({
  presetId: z.string(),
  colorScheme: z.enum(['AUTO', 'DARK', 'LIGHT']),
  hudOpacity: z.number().min(60).max(100),
  saturationPct: z.number().min(50).max(150),
  glowIntensity: z.number().min(0).max(100),
  uiDensity: z.enum(['COMPACT', 'STANDARD', 'COMFORT']),
  fontScalePct: z.number().min(70).max(150),
  safariTextSync: z.boolean(),
  tactileTargetBoost: z.boolean(),
});

export const TraceabilityMatrixEntrySchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  turn: z.number().int().min(0),
  actionType: z.string(),
  sourceChannel: z.string(),
  philosophyPole: z.string(),
  paSpent: z.number().int().min(0),
  deltaSummary: z.string(),
});

export const ContextEventLogEntrySchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  turn: z.number().int().min(0),
  category: z.string(),
  title: z.string(),
  detail: z.string(),
});

export const SimulationTraceabilityProfileSchema = z.object({
  traceabilityMatrix: z.array(TraceabilityMatrixEntrySchema).max(120),
  eventLogs: z.array(ContextEventLogEntrySchema).max(160),
});

export const UserContext3DSchema = z.object({
  contextId: z.string(),
  shellUxHabits: ShellUxHabitsSchema,
  displaySettingsProfile: DisplaySettingsProfileSchema,
  simulationTraceabilityProfile: SimulationTraceabilityProfileSchema,
  updatedAtIso: z.string(),
});

export type ShellUxHabits = z.infer<typeof ShellUxHabitsSchema>;
export type DisplaySettingsProfile = z.infer<typeof DisplaySettingsProfileSchema>;
export type TraceabilityMatrixEntry = z.infer<typeof TraceabilityMatrixEntrySchema>;
export type ContextEventLogEntry = z.infer<typeof ContextEventLogEntrySchema>;
export type SimulationTraceabilityProfile = z.infer<typeof SimulationTraceabilityProfileSchema>;
export type UserContext3D = z.infer<typeof UserContext3DSchema>;
