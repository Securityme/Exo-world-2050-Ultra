import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialWorldState } from '../src/core/loop/cycle-orchestrator.ts';
import { computeClimateLedger } from '../src/systems/biosphere/climate-ledger.ts';
import { evaluateCampaignQuests } from '../src/systems/quests/campaign-quests.ts';
import { buildHeaderNotificationFeed } from '../src/systems/turn-orchestration/header-notifications.ts';

const TEST_CONFIG = {
  campaignId: 'test-climate-notif-2050',
  worldSeed: 2050,
  superpowerId: 'eu-spatiale',
  doctrineId: 'SOLARPUNK',
  rivalCount: 4,
} as const;

test('computeClimateLedger returns 3-turn forecasts, air quality detail, criteria, and disaster records', () => {
  const world = createInitialWorldState(TEST_CONFIG);
  const ledger = computeClimateLedger(world);

  assert.equal(ledger.forecasts.length, 3);
  assert.equal(ledger.forecasts[0]?.turnNumber, world.cycle + 1);
  assert.ok(ledger.airQualityTitle.length > 5);
  assert.ok(ledger.criteria.length >= 4);
  assert.ok(ledger.disasterHistory.length >= 1);
});

test('buildHeaderNotificationFeed categorizes ALERT, SCENARIO, QUEST, and PA_WORLD items', () => {
  const world = createInitialWorldState(TEST_CONFIG);
  const quests = evaluateCampaignQuests(world, {});
  const feed = buildHeaderNotificationFeed(world, quests, {
    readyVideosCount: 1,
    unlockedTrophiesCount: 2,
  });

  assert.ok(feed.totalCount >= 2);
  assert.ok(feed.items.some((i) => i.kind === 'PA_WORLD'));
  assert.ok(feed.items.some((i) => i.kind === 'SYSTEM' && i.badge === 'Média'));
  assert.equal(feed.mandatoryResolved, world.activeDossiers.length === 0);
});
