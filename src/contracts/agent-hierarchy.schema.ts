import { z } from 'zod';

/**
 * [L0] EXW.L0.AGENT_HIERARCHY | v5.1.0 | SADT A5.4
 * Zod contracts for the 4-Level Triangular Multi-Agent Pyramid (N0 Summit -> N1 Directors -> N2 Leads -> N3 Sub-Agents).
 */
export const AgentTierLevelSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export const AgentDivisionSchema = z.enum([
  'ORCHESTRATION',
  'CORE_3D',
  'CLOUD_TANSTACK',
  'UI_IDENTITY',
  'QA_GOVERNANCE',
]);

export const AgentNodeStatusSchema = z.enum([
  'ACTIVE',
  'READY',
  'VALIDATING',
  'DELEGATING',
]);

export const MissionPrioritySchema = z.enum(['STANDARD', 'ELEVATED', 'CRITICAL']);

export const HierarchicalAgentNodeSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  roleTitle: z.string(),
  level: AgentTierLevelSchema,
  parentId: z.string().nullable(),
  division: AgentDivisionSchema,
  status: AgentNodeStatusSchema,
  accentHex: z.string(),
  summary: z.string(),
  responsibilities: z.array(z.string()).min(1),
  ownedModules: z.array(z.string()).min(1),
  kpiLabel: z.string(),
  activeTask: z.string(),
});

export const AgentCascadeMissionSchema = z.object({
  id: z.string(),
  directive: z.string().min(3).max(160),
  originId: z.string(),
  targetId: z.string(),
  chainIds: z.array(z.string()).min(1),
  activatedSubtreeIds: z.array(z.string()),
  priority: MissionPrioritySchema,
  stepTick: z.number().int().positive(),
  outcomeSummary: z.string(),
});

export const AgentPyramidStateSchema = z.object({
  nodes: z.array(HierarchicalAgentNodeSchema),
  missions: z.array(AgentCascadeMissionSchema),
  totalCascades: z.number().int().min(0),
});

export type AgentTierLevel = z.infer<typeof AgentTierLevelSchema>;
export type AgentDivision = z.infer<typeof AgentDivisionSchema>;
export type AgentNodeStatus = z.infer<typeof AgentNodeStatusSchema>;
export type MissionPriority = z.infer<typeof MissionPrioritySchema>;
export type HierarchicalAgentNode = z.infer<typeof HierarchicalAgentNodeSchema>;
export type AgentCascadeMission = z.infer<typeof AgentCascadeMissionSchema>;
export type AgentPyramidState = z.infer<typeof AgentPyramidStateSchema>;
