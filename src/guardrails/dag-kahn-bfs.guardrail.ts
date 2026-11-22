import { err, ok, type ExwResult } from '../contracts/trigger-bus.schema.ts';
import type { NarrativeDagGraph } from '../contracts/narrative-dag.schema.ts';

/**
 * [L2] FUP-006 / FUP-010 | SM-01 | SADT A4.2 | R-28
 * Pure Kahn Topological Sort + BFS Reachability Guardrail for Narrative & Tech DAGs.
 * Rejects cycles, unknown prerequisites, and unreachable orphan nodes.
 */
export interface DagValidationReport {
  readonly topologicalOrder: readonly string[];
  readonly reachableNodeIds: readonly string[];
}

export function validateDagKahnBfs(graph: NarrativeDagGraph): ExwResult<DagValidationReport> {
  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const id of nodeIds) {
    adjacency.set(id, []);
    inDegree.set(id, 0);
  }

  const rootIds: string[] = [];
  for (const node of graph.nodes) {
    if (node.prerequisites.length === 0) {
      rootIds.push(node.id);
    }
    for (const prereqId of node.prerequisites) {
      if (!nodeIds.has(prereqId)) {
        return err(
          'EXW_ERR_DAG_CYCLE',
          `Prérequis DAG introuvable (${prereqId} -> ${node.id}) : sommet absent.`,
        );
      }
      adjacency.get(prereqId)!.push(node.id);
      inDegree.set(node.id, (inDegree.get(node.id) ?? 0) + 1);
    }
  }

  if (rootIds.length === 0) {
    return err('EXW_ERR_DAG_CYCLE', 'Cycle détecté : aucun nœud racine sans prérequis.');
  }

  // Kahn's topological sort
  const queue: string[] = [...rootIds];
  const topologicalOrder: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    topologicalOrder.push(current);
    for (const next of adjacency.get(current) ?? []) {
      const nextDeg = (inDegree.get(next) ?? 0) - 1;
      inDegree.set(next, nextDeg);
      if (nextDeg === 0) queue.push(next);
    }
  }

  if (topologicalOrder.length !== nodeIds.size) {
    return err('EXW_ERR_DAG_CYCLE', 'Cycle détecté dans le DAG narratif (échec tri topologique Kahn).');
  }

  // BFS reachability from root nodes
  const visited = new Set<string>(rootIds);
  const bfsQueue: string[] = [...rootIds];
  while (bfsQueue.length > 0) {
    const curr = bfsQueue.shift()!;
    for (const neighbor of adjacency.get(curr) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        bfsQueue.push(neighbor);
      }
    }
  }

  if (visited.size !== nodeIds.size) {
    const orphans = [...nodeIds].filter((id) => !visited.has(id));
    return err(
      'EXW_ERR_DAG_CYCLE',
      `Nœud(s) orphelin(s) inatteignable(s) par BFS : ${orphans.join(', ')}.`,
    );
  }

  return ok({
    topologicalOrder,
    reachableNodeIds: [...visited],
  });
}
