import type {
  AgentCascadeMission,
  AgentPyramidState,
  AgentTierLevel,
  HierarchicalAgentNode,
  MissionPriority,
} from '../../contracts/agent-hierarchy.schema.ts';
import {
  INITIAL_AGENT_PYRAMID_NODES,
  INITIAL_PYRAMID_MISSIONS,
} from '../../data/agent-hierarchy.catalog.ts';

/**
 * [L3] EXW.L3.AGENT_HIERARCHY_ENGINE | v5.1.0 | SADT A5.4
 * 100% pure deterministic engine for the 4-level Triangular Multi-Agent Hierarchy:
 * - Zero I/O, zero DOM, zero Math.random(), zero Date.now().
 * - Graph queries (escalation chain to N0, subordinate delegation cone, pyramid integrity checks)
 * - Deterministic hierarchical mission cascade (N0 -> N1 -> N2 -> N3).
 */
export function createInitialAgentPyramidState(): AgentPyramidState {
  return {
    nodes: INITIAL_AGENT_PYRAMID_NODES.map((n) => ({
      ...n,
      responsibilities: [...n.responsibilities],
      ownedModules: [...n.ownedModules],
    })),
    missions: INITIAL_PYRAMID_MISSIONS.map((m) => ({
      ...m,
      chainIds: [...m.chainIds],
      activatedSubtreeIds: [...m.activatedSubtreeIds],
    })),
    totalCascades: INITIAL_PYRAMID_MISSIONS.length,
  };
}

export function groupAgentsByLevel(
  nodes: readonly HierarchicalAgentNode[],
): Readonly<Record<AgentTierLevel, readonly HierarchicalAgentNode[]>> {
  const buckets: Record<AgentTierLevel, HierarchicalAgentNode[]> = {
    0: [],
    1: [],
    2: [],
    3: [],
  };
  for (const node of nodes) {
    buckets[node.level].push(node);
  }
  return buckets;
}

export function getEscalationChain(
  nodeId: string,
  nodes: readonly HierarchicalAgentNode[],
): readonly HierarchicalAgentNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const chain: HierarchicalAgentNode[] = [];
  const visited = new Set<string>();
  let current = byId.get(nodeId) ?? null;

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    chain.unshift(current);
    current = current.parentId ? byId.get(current.parentId) ?? null : null;
  }
  return chain;
}

export function getDirectSubordinates(
  nodeId: string,
  nodes: readonly HierarchicalAgentNode[],
): readonly HierarchicalAgentNode[] {
  return nodes.filter((n) => n.parentId === nodeId);
}

export function getSubordinateSubtreeIds(
  nodeId: string,
  nodes: readonly HierarchicalAgentNode[],
): readonly string[] {
  const result: string[] = [];
  const queue: string[] = [nodeId];
  const visited = new Set<string>([nodeId]);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const child of nodes) {
      if (child.parentId === cur && !visited.has(child.id)) {
        visited.add(child.id);
        result.push(child.id);
        queue.push(child.id);
      }
    }
  }
  return result;
}

export interface PyramidIntegrityReport {
  readonly valid: boolean;
  readonly rootCount: number;
  readonly maxLevel: number;
  readonly levelsCount: number;
  readonly triangleShape: readonly [number, number, number, number];
  readonly errors: readonly string[];
}

export function validatePyramidIntegrity(
  nodes: readonly HierarchicalAgentNode[],
): PyramidIntegrityReport {
  const errors: string[] = [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const roots = nodes.filter((n) => n.parentId === null);

  if (roots.length !== 1) {
    errors.push(`Exactement 1 agent sommet (N0) requis, trouvé ${roots.length}.`);
  }

  for (const node of nodes) {
    if (node.level === 0 && node.parentId !== null) {
      errors.push(`Agent N0 ${node.id} ne doit pas avoir de parent.`);
    }
    if (node.level > 0) {
      if (!node.parentId) {
        errors.push(`Agent ${node.id} (N${node.level}) doit avoir un superviseur.`);
      } else {
        const parent = byId.get(node.parentId);
        if (!parent) {
          errors.push(`Parent ${node.parentId} introuvable pour ${node.id}.`);
        } else if (parent.level !== node.level - 1) {
          errors.push(
            `Saut hiérarchique invalide : ${node.id} (N${node.level}) rattaché à ${parent.id} (N${parent.level}).`,
          );
        }
      }
    }
  }

  const grouped = groupAgentsByLevel(nodes);
  const shape: [number, number, number, number] = [
    grouped[0].length,
    grouped[1].length,
    grouped[2].length,
    grouped[3].length,
  ];
  const nonEmptyLevels = shape.filter((c) => c > 0).length;
  if (nonEmptyLevels < 3) {
    errors.push(`La pyramide requiert au minimum 3 niveaux hiérarchiques (trouvé ${nonEmptyLevels}).`);
  }
  if (!(shape[0] <= shape[1] && shape[1] <= shape[2] && shape[2] <= shape[3])) {
    errors.push(`Forme triangulaire non monotone : ${shape.join('-')}.`);
  }

  return {
    valid: errors.length === 0,
    rootCount: roots.length,
    maxLevel: nonEmptyLevels - 1,
    levelsCount: nonEmptyLevels,
    triangleShape: shape,
    errors,
  };
}

export function computePyramidSummary(nodes: readonly HierarchicalAgentNode[]): {
  readonly totalAgents: number;
  readonly levelsCount: number;
  readonly triangleShape: readonly [number, number, number, number];
  readonly activeCount: number;
  readonly validatingCount: number;
} {
  const grouped = groupAgentsByLevel(nodes);
  const triangleShape: [number, number, number, number] = [
    grouped[0].length,
    grouped[1].length,
    grouped[2].length,
    grouped[3].length,
  ];
  return {
    totalAgents: nodes.length,
    levelsCount: triangleShape.filter((c) => c > 0).length,
    triangleShape,
    activeCount: nodes.filter((n) => n.status === 'ACTIVE' || n.status === 'DELEGATING').length,
    validatingCount: nodes.filter((n) => n.status === 'VALIDATING').length,
  };
}

export function dispatchHierarchicalMission(
  state: AgentPyramidState,
  targetNodeId: string,
  rawDirective: string,
  priority: MissionPriority = 'STANDARD',
): AgentPyramidState {
  const directive = rawDirective.trim().slice(0, 160);
  if (directive.length < 3) return state;

  const chain = getEscalationChain(targetNodeId, state.nodes);
  if (chain.length === 0) return state;

  const targetNode = chain[chain.length - 1]!;
  const chainIds = chain.map((n) => n.id);
  const subtreeIds = getSubordinateSubtreeIds(targetNode.id, state.nodes);
  const chainSet = new Set(chainIds);
  const subtreeSet = new Set(subtreeIds);

  const nextTick = state.totalCascades + 1;
  const mission: AgentCascadeMission = {
    id: `MIS-${String(nextTick).padStart(3, '0')}`,
    directive,
    originId: chain[0]!.id,
    targetId: targetNode.id,
    chainIds,
    activatedSubtreeIds: [...subtreeIds],
    priority,
    stepTick: nextTick,
    outcomeSummary: `Cascade ${chain.map((c) => `N${c.level}`).join(' → ')} exécutée vers ${targetNode.name}${
      subtreeIds.length > 0 ? ` (+${subtreeIds.length} sous-agent(s) mobilisé(s))` : ''
    }.`,
  };

  const nextNodes = state.nodes.map((node) => {
    if (node.id === targetNode.id) {
      return {
        ...node,
        status: priority === 'CRITICAL' ? ('VALIDATING' as const) : ('ACTIVE' as const),
        activeTask: directive,
      };
    }
    if (chainSet.has(node.id)) {
      return {
        ...node,
        status: 'DELEGATING' as const,
        activeTask: `Relais N${node.level} → ${targetNode.code} : ${directive}`,
      };
    }
    if (subtreeSet.has(node.id)) {
      return {
        ...node,
        status: 'ACTIVE' as const,
        activeTask: `Exécution déléguée par ${targetNode.code} : ${directive}`,
      };
    }
    return node;
  });

  return {
    nodes: nextNodes,
    missions: [mission, ...state.missions].slice(0, 20),
    totalCascades: nextTick,
  };
}
