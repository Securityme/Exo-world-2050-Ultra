import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialWorldState } from '../src/core/loop/cycle-orchestrator.ts';
import { assertR50CompliantValue } from '../src/guardrails/nomenclature.guardrail.ts';
import {
  computeOptimalAssignments,
  countWorkforceSynergies,
  doesColonistMatchDistrict,
  MAX_COLONISTS_PER_DISTRICT,
} from '../src/systems/economy-urban/workforce-assignments.ts';
import {
  applyQuestRewardToWorld,
  evaluateCampaignQuests,
  getActiveQuestFocus,
} from '../src/systems/quests/campaign-quests.ts';

const TEST_CONFIG = {
  campaignId: 'test-quests-assign-2050',
  worldSeed: 2050,
  superpowerId: 'sp-uea',
  doctrineId: 'SOLARPUNK',
  rivalCount: 5,
} as const;

test('computeOptimalAssignments assigns all colonists within MAX_COLONISTS_PER_DISTRICT and maximizes synergies', () => {
  const world = createInitialWorldState(TEST_CONFIG);
  assert.ok(doesColonistMatchDistrict('ENGINEERING', 'INDUSTRY'));
  assert.ok(doesColonistMatchDistrict('EXOBIOLOGY', 'BIOPARK'));
  assert.ok(doesColonistMatchDistrict('CYBERNETICS', 'DATACENTER'));

  const assignments = computeOptimalAssignments(world);
  const counts = new Map<string, number>();
  for (const col of world.colonists) {
    const targetId = assignments[col.id] ?? null;
    if (targetId) {
      counts.set(targetId, (counts.get(targetId) ?? 0) + 1);
      assert.ok((counts.get(targetId) ?? 0) <= MAX_COLONISTS_PER_DISTRICT);
    }
  }

  const optimizedWorld = {
    ...world,
    colonists: world.colonists.map((c) => ({ ...c, assignedDistrictId: assignments[c.id] ?? null })),
  };
  assert.ok(countWorkforceSynergies(optimizedWorld) >= 2);
  assert.doesNotThrow(() => assertR50CompliantValue(assignments));
});

test('evaluateCampaignQuests tracks milestones and applyQuestRewardToWorld grants rewards idempotently', () => {
  const world = createInitialWorldState(TEST_CONFIG);
  const initialQuests = evaluateCampaignQuests(world, {});
  assert.equal(initialQuests.length, 7);
  const q1Before = initialQuests.find((q) => q.id === 'q-brief-orbit');
  assert.ok(q1Before && !q1Before.completed);

  const afterScale3 = evaluateCampaignQuests(world, { scale3Visited: true });
  const focus = getActiveQuestFocus(afterScale3);
  assert.equal(focus?.id, 'q-brief-orbit');
  assert.equal(focus?.completed, true);

  const applied = applyQuestRewardToWorld(world, 'q-brief-orbit', { scale3Visited: true });
  assert.ok(applied);
  assert.equal(applied.nextState.resources.credits, world.resources.credits + 120);
  assert.equal(applied.nextState.resources.materials, world.resources.materials + 20);
  assert.ok(applied.nextState.claimedQuestIds?.includes('q-brief-orbit'));

  // Double-claim must return null
  const doubleClaim = applyQuestRewardToWorld(applied.nextState, 'q-brief-orbit', {
    scale3Visited: true,
  });
  assert.equal(doubleClaim, null);
  assert.doesNotThrow(() => assertR50CompliantValue(afterScale3));
});
