import { z } from 'zod';
import { DossierClassSchema, ExecutiveDossierSchema } from './pa-dossiers.schema.ts';
import { AtmosphereTierSchema } from './render-bridge.schema.ts';

/**
 * [L0] FUP-005 / FUP-011 | SM-04 | SADT A4.1–A4.3
 * Event Generator Contract (EXW-EVGEN-2.7) — Astralis-grade Dual-Pass DAG contract
 * with zero external Astralis imports:
 * - Kahn Topological Sort (acyclicity verification)
 * - BFS Reachability from root node
 * - Strict impact clamping [-0.15, +0.15]
 * - R-50 Scientific Nomenclature Filter (bans forbidden generic word)
 */
const FORBIDDEN_PATTERN = new RegExp('\\banomal' + '(?:ie|ies|y|ous)\\b', 'i');

export function containsForbiddenNomenclature(text: string): boolean {
  return FORBIDDEN_PATTERN.test(text);
}

export const EventGeneratorNodeSchema = z.object({
  nodeId: z.string().min(2).max(48),
  stage: z.enum(['ROOT_BRIEFING', 'BRANCH_SKILL_CHECK', 'RESOLUTION_OUTCOME']),
  title: z.string().min(3).max(120),
  narrative: z.string().min(8).max(420),
  nextNodeIds: z.array(z.string().min(2).max(48)),
  horizonEffect: z.enum(['IMMEDIATE', 'DELAYED_ECHO', 'SUSTAINED_MODIFIER']).default('IMMEDIATE'),
  impactClamp: z.number().min(-0.15).max(0.15).default(0),
});

export const EventGeneratorStateBriefSchema = z.object({
  campaignId: z.string().min(2).max(80),
  worldSeed: z.number().int().nonnegative(),
  cycle: z.number().int().nonnegative(),
  era: z.number().int().min(1).max(6),
  atmosphereTier: AtmosphereTierSchema,
  approval: z.number().min(0).max(100),
  credits: z.number(),
  adaptiveDeltaP: z.number().min(-0.2).max(0.25),
  dominantDossierClass: DossierClassSchema,
  recentChronicleTitles: z.array(z.string()).max(12).default([]),
  activeTriggerSummaries: z.array(z.string()).max(12).default([]),
  freeTierGovernorMode: z.enum(['STRICT_FREE', 'LOCAL_DETERMINISTIC']).default('STRICT_FREE'),
});

export const EventGeneratorResponseSchema = z
  .object({
    generatorVersion: z.literal('EXW-EVGEN-2.7'),
    modelUsed: z.string().min(3).max(80),
    fallbackTriggered: z.boolean(),
    latencyMs: z.number().nonnegative(),
    dossier: ExecutiveDossierSchema,
    dagNodes: z.array(EventGeneratorNodeSchema).min(2).max(8),
    memoryFlagKey: z.string().min(3).max(80),
    cosineNoveltyEstimate: z.number().min(0).max(1),
  })
  .superRefine((val, ctx) => {
    const textsToCheck = [
      val.dossier.title,
      val.dossier.briefing,
      val.dossier.scientificTag ?? '',
      ...val.dossier.options.flatMap((o) => [o.label, o.description]),
      ...val.dagNodes.flatMap((n) => [n.title, n.narrative]),
    ];
    for (const txt of textsToCheck) {
      if (containsForbiddenNomenclature(txt)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Violation R-50 : nomenclature scientifique stricte requise.',
        });
        break;
      }
    }
  });

export interface DagValidationResult {
  readonly valid: boolean;
  readonly topologicalOrder: readonly string[];
  readonly reachableCount: number;
  readonly reason?: string;
}

/**
 * Pure Kahn topological sort + BFS reachability verification for Dual-Pass narrative DAGs.
 */
export function validateNarrativeDag(nodes: readonly EventGeneratorNode[]): DagValidationResult {
  if (nodes.length === 0) {
    return { valid: false, topologicalOrder: [], reachableCount: 0, reason: 'DAG vide.' };
  }

  const nodeMap = new Map<string, EventGeneratorNode>();
  const inDegree = new Map<string, number>();

  for (const n of nodes) {
    if (nodeMap.has(n.nodeId)) {
      return {
        valid: false,
        topologicalOrder: [],
        reachableCount: 0,
        reason: `Identifiant de nœud dupliqué : ${n.nodeId}`,
      };
    }
    nodeMap.set(n.nodeId, n);
    inDegree.set(n.nodeId, 0);
  }

  for (const n of nodes) {
    for (const target of n.nextNodeIds) {
      if (!nodeMap.has(target)) {
        return {
          valid: false,
          topologicalOrder: [],
          reachableCount: 0,
          reason: `Arête vers nœud inexistant : ${target}`,
        };
      }
      inDegree.set(target, (inDegree.get(target) ?? 0) + 1);
    }
  }

  // Kahn topological sort (detects cycles)
  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  const topologicalOrder: string[] = [];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    topologicalOrder.push(cur);
    const curNode = nodeMap.get(cur);
    if (!curNode) continue;
    for (const next of curNode.nextNodeIds) {
      const nextDeg = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, nextDeg);
      if (nextDeg === 0) queue.push(next);
    }
  }

  if (topologicalOrder.length !== nodes.length) {
    return {
      valid: false,
      topologicalOrder,
      reachableCount: 0,
      reason: 'Cycle détecté dans le graphe narratif DAG (échec tri de Kahn).',
    };
  }

  // BFS reachability from root node (nodes[0])
  const rootId = nodes[0]!.nodeId;
  const visited = new Set<string>([rootId]);
  const bfsQueue: string[] = [rootId];
  while (bfsQueue.length > 0) {
    const cur = bfsQueue.shift()!;
    const curNode = nodeMap.get(cur);
    if (!curNode) continue;
    for (const next of curNode.nextNodeIds) {
      if (!visited.has(next)) {
        visited.add(next);
        bfsQueue.push(next);
      }
    }
  }

  if (visited.size !== nodes.length) {
    return {
      valid: false,
      topologicalOrder,
      reachableCount: visited.size,
      reason: `Nœuds orphelins inaccessibles depuis ${rootId} (${visited.size}/${nodes.length}).`,
    };
  }

  return {
    valid: true,
    topologicalOrder,
    reachableCount: visited.size,
  };
}

export type EventGeneratorNode = z.infer<typeof EventGeneratorNodeSchema>;
export type EventGeneratorStateBrief = z.infer<typeof EventGeneratorStateBriefSchema>;
export type EventGeneratorResponse = z.infer<typeof EventGeneratorResponseSchema>;
