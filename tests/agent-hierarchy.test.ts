import test from 'node:test';
import assert from 'node:assert/strict';
import { AgentPyramidStateSchema } from '../src/contracts/agent-hierarchy.schema.ts';
import {
  computePyramidSummary,
  createInitialAgentPyramidState,
  dispatchHierarchicalMission,
  getDirectSubordinates,
  getEscalationChain,
  getSubordinateSubtreeIds,
  validatePyramidIntegrity,
} from '../src/systems/governance/agent-hierarchy.engine.ts';

test('Triangular multi-agent pyramid has 4 strict levels (1 -> 2 -> 4 -> 8 = 15 agents) and validates Zod & integrity', () => {
  const state = createInitialAgentPyramidState();
  const parsed = AgentPyramidStateSchema.safeParse(state);
  assert.equal(parsed.success, true);

  const report = validatePyramidIntegrity(state.nodes);
  assert.equal(report.valid, true, report.errors.join('; '));
  assert.equal(report.rootCount, 1);
  assert.equal(report.levelsCount, 4);
  assert.deepEqual(report.triangleShape, [1, 2, 4, 8]);

  const summary = computePyramidSummary(state.nodes);
  assert.equal(summary.totalAgents, 15);
  assert.equal(summary.levelsCount, 4);
});

test('Escalation chain and subordinate delegation cone traverse N0 -> N1 -> N2 -> N3 accurately', () => {
  const state = createInitialAgentPyramidState();
  const chain = getEscalationChain('AG-L3-UNITY', state.nodes);
  assert.deepEqual(
    chain.map((n) => n.id),
    ['AG-L0-ARGON', 'AG-L1-TECH', 'AG-L2-HYDRO', 'AG-L3-UNITY'],
  );

  const techSubtree = getSubordinateSubtreeIds('AG-L1-TECH', state.nodes);
  assert.equal(techSubtree.length, 6);
  assert.ok(techSubtree.includes('AG-L2-HYDRO'));
  assert.ok(techSubtree.includes('AG-L2-SILICIUM'));
  assert.ok(techSubtree.includes('AG-L3-TANSTACK'));
  assert.ok(techSubtree.includes('AG-L3-UNITY'));

  const rootChildren = getDirectSubordinates('AG-L0-ARGON', state.nodes);
  assert.equal(rootChildren.length, 2);
});

test('dispatchHierarchicalMission cascades directives deterministically along the hierarchy and mobilizes subordinates', () => {
  const initial = createInitialAgentPyramidState();
  const next = dispatchHierarchicalMission(
    initial,
    'AG-L2-BORE',
    'Valider la release AAA et les 10 préfabriqués Unity',
    'CRITICAL',
  );

  assert.equal(next.totalCascades, initial.totalCascades + 1);
  assert.equal(next.missions[0]?.targetId, 'AG-L2-BORE');
  assert.deepEqual(next.missions[0]?.chainIds, ['AG-L0-ARGON', 'AG-L1-PROD', 'AG-L2-BORE']);
  assert.equal(next.missions[0]?.activatedSubtreeIds.length, 2);

  const bore = next.nodes.find((n) => n.id === 'AG-L2-BORE');
  const argon = next.nodes.find((n) => n.id === 'AG-L0-ARGON');
  const auditSub = next.nodes.find((n) => n.id === 'AG-L3-AUDIT');
  assert.equal(bore?.status, 'VALIDATING');
  assert.equal(argon?.status, 'DELEGATING');
  assert.equal(auditSub?.status, 'ACTIVE');
});
