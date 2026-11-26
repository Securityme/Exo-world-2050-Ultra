import { z } from 'zod';

/**
 * [L0] EXW.L0.DEV_BRIDGE_SCHEMA | v5.1.0 | SADT A1.1
 * Strict Zod contracts for Multi-Surface Dev Connectivity (AI Studio, Antigravity,
 * Gemini Swarm, Data Agent Kit, Google Drive, GitHub, Firebase, Vercel).
 */

export const DevSurfaceActorSchema = z.enum([
  'USER',
  'AI_STUDIO',
  'ANTIGRAVITY',
  'GEMINI_LEAD',
  'SWARM',
  'DATA_AGENT_KIT',
  'GOOGLE_DRIVE',
  'GITHUB',
  'FIREBASE',
  'VERCEL',
]);
export type DevSurfaceActor = z.infer<typeof DevSurfaceActorSchema>;

export const DevCommsKindSchema = z.enum([
  'DIRECTIVE',
  'HANDOFF',
  'SYNC_PATCH',
  'ACK',
  'ALERT',
]);
export type DevCommsKind = z.infer<typeof DevCommsKindSchema>;

export const DevCommsMessageSchema = z.object({
  id: z.string().min(3).max(96),
  sender: DevSurfaceActorSchema,
  target: DevSurfaceActorSchema,
  kind: DevCommsKindSchema,
  content: z.string().min(2).max(2000),
  linkedPath: z.string().max(180).default(''),
  linkedDocId: z.string().max(80).default(''),
  createdAtIso: z.string().min(10).max(40),
  shaDigest: z.string().min(6).max(64),
});
export type DevCommsMessage = z.infer<typeof DevCommsMessageSchema>;

export const SurfaceOutcomeStatusSchema = z.enum([
  'SUCCESS',
  'AUTH_REQUIRED',
  'SKIPPED',
  'ERROR',
]);
export type SurfaceOutcomeStatus = z.infer<typeof SurfaceOutcomeStatusSchema>;

export const SurfaceWriteResultSchema = z.object({
  status: SurfaceOutcomeStatusSchema,
  detail: z.string().max(320),
  referenceUrl: z.string().max(360).default(''),
  referenceShaOrId: z.string().max(128).default(''),
});
export type SurfaceWriteResult = z.infer<typeof SurfaceWriteResultSchema>;

export const TriSurfaceSyncLogSchema = z.object({
  syncId: z.string().min(3).max(96),
  relativePath: z.string().min(3).max(180),
  contentSha256: z.string().min(8).max(128),
  commitSummary: z.string().min(2).max(240),
  createdAtIso: z.string().min(10).max(40),
  aiStudio: SurfaceWriteResultSchema,
  drive: SurfaceWriteResultSchema,
  github: SurfaceWriteResultSchema,
});
export type TriSurfaceSyncLog = z.infer<typeof TriSurfaceSyncLogSchema>;

export const DataAgentDiagnosticsSchema = z.object({
  modulesCount: z.number().int().min(0),
  matricesPass: z.number().int().min(0),
  totalMatrices: z.number().int().min(1),
  dsmCycleCount: z.number().int().min(0),
  gate: z.enum(['GO', 'NO-GO']),
  githubParity: z.enum(['SYNCED', 'REMOTE_AHEAD', 'UNREACHABLE']),
  generatedAtIso: z.string().min(10).max(40),
  details: z.array(z.string().max(200)).max(20).default([]),
});
export type DataAgentDiagnostics = z.infer<typeof DataAgentDiagnosticsSchema>;

export const DevBridgeStateSchema = z.object({
  messages: z.array(DevCommsMessageSchema).max(80),
  syncLogs: z.array(TriSurfaceSyncLogSchema).max(40),
  vercelProjectUrl: z.string().max(240).default(''),
  vercelHookConfigured: z.boolean().default(false),
  githubOAuthConfigured: z.boolean().default(false),
  lastAudit: DataAgentDiagnosticsSchema.nullable().default(null),
});
export type DevBridgeState = z.infer<typeof DevBridgeStateSchema>;
