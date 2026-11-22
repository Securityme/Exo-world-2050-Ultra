import { z } from 'zod';

/**
 * [L0] FUP-002 / FUP-006 | SM-01 | SADT A2.2
 * New Vegas Narrative DAG (R-28), Kahn Topological Validation & Historical Memory Flags.
 */
export const DagNodeSchema = z.object({
  id: z.string().min(2).max(64),
  dossierCode: z.string().min(3).max(24),
  title: z.string().min(3).max(120),
  eraMin: z.number().int().min(1).max(6).default(1),
  atmosphereMin: z.enum(['P1', 'P2', 'P3', 'P4']).default('P1'),
  prerequisites: z.array(z.string()).default([]),
  requiredMemoryFlags: z.array(z.string()).default([]),
  emitsMemoryFlag: z.string().max(64).optional(),
});

export const NarrativeDagGraphSchema = z.object({
  graphId: z.string().min(2).max(64),
  nodes: z.array(DagNodeSchema).min(1),
});

export const MemoryFlagRecordSchema = z.object({
  flag: z.string().min(2).max(64),
  cycleSet: z.number().int().nonnegative(),
  sourceDossierId: z.string(),
  permanent: z.boolean().default(true),
});

export type DagNode = z.infer<typeof DagNodeSchema>;
export type NarrativeDagGraph = z.infer<typeof NarrativeDagGraphSchema>;
export type MemoryFlagRecord = z.infer<typeof MemoryFlagRecordSchema>;
