import { z } from 'zod';

/**
 * [L0] EXW.L0.SWARM_RELAY_SCHEMA | v5.1.0 | SADT A5.4
 * Strict Zod contracts for structured communication between Live Preview,
 * Google AI Studio Build, Antigravity IDE, Google Drive BUS-EXW-001, and Agent Swarm.
 */

export const SwarmSurfaceIdSchema = z.enum([
  'AISTUDIO_PREVIEW',
  'AISTUDIO_BUILD',
  'ANTIGRAVITY_IDE',
  'DRIVE_BUS_EXW_001',
  'GITHUB_REPO',
  'GEMINI_LEAD',
  'PRODUCTION_SWARM',
]);
export type SwarmSurfaceId = z.infer<typeof SwarmSurfaceIdSchema>;

export const SwarmHandoffTrackSchema = z.enum([
  'DRIVE_DOC_VCS',
  'APP_GAME_CODE',
  'SWARM_COORDINATION',
]);
export type SwarmHandoffTrack = z.infer<typeof SwarmHandoffTrackSchema>;

export const SwarmHandoffPrioritySchema = z.enum(['STANDARD', 'HIGH', 'BLOCKING']);
export type SwarmHandoffPriority = z.infer<typeof SwarmHandoffPrioritySchema>;

export const SwarmMessageStatusSchema = z.enum(['QUEUED', 'DISPATCHED', 'ACKNOWLEDGED']);
export type SwarmMessageStatus = z.infer<typeof SwarmMessageStatusSchema>;

export const SwarmHandoffInputSchema = z.object({
  fromSurface: SwarmSurfaceIdSchema.default('AISTUDIO_PREVIEW'),
  toSurface: SwarmSurfaceIdSchema,
  targetAgentCode: z.string().trim().min(2).max(40).default('N0 · ARGON'),
  workflowTrack: SwarmHandoffTrackSchema.default('SWARM_COORDINATION'),
  priority: SwarmHandoffPrioritySchema.default('HIGH'),
  title: z.string().trim().min(4).max(120),
  objective: z.string().trim().min(10).max(1500),
  targetFiles: z.array(z.string().trim().min(1).max(160)).max(12).default([]),
  docVcsHeadHash: z.string().trim().max(64).default(''),
  previewOrigin: z.string().trim().max(180).default(''),
});
export type SwarmHandoffInput = z.infer<typeof SwarmHandoffInputSchema>;

export const SwarmRelayMessageSchema = z.object({
  ticketId: z.string().min(4).max(40),
  fromSurface: SwarmSurfaceIdSchema,
  toSurface: SwarmSurfaceIdSchema,
  targetAgentCode: z.string().min(2).max(40),
  workflowTrack: SwarmHandoffTrackSchema,
  priority: SwarmHandoffPrioritySchema,
  status: SwarmMessageStatusSchema,
  title: z.string().min(4).max(120),
  objective: z.string().min(10).max(1500),
  targetFiles: z.array(z.string()).max(12),
  docVcsHeadHash: z.string().max(64),
  previewOrigin: z.string().max(180),
  promptPayload: z.string().min(20).max(6000),
  createdAtIso: z.string().min(10).max(40),
  acknowledgedAtIso: z.string().max(40).nullable(),
});
export type SwarmRelayMessage = z.infer<typeof SwarmRelayMessageSchema>;
