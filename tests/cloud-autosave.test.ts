import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialWorldState } from '../src/core/loop/cycle-orchestrator.ts';
import type { WorldState } from '../src/contracts/world-state.schema.ts';
import {
  buildSyncFingerprint,
  buildTurnCheckpointRecord,
  compareCampaignFreshness,
  DEFAULT_CLOUD_AUTOSAVE_CONFIG,
  enqueueCloudSaveItem,
  removeCloudSaveItem,
  sanitizeCampaignForFirestore,
  sanitizeFirestoreDocId,
  shouldTriggerCloudAutoSave,
  stripUndefinedDeep,
  type QueuedCloudSave,
} from '../src/utils/cloud-autosave-policy.ts';

function makeWorld(overrides: Partial<WorldState> = {}): WorldState {
  const base = createInitialWorldState({
    campaignId: 'exw-test-2050',
    worldSeed: 20500409,
    superpowerId: 'eurasia-solar',
    doctrineId: 'SOLARPUNK',
    rivalCount: 5,
  });
  return { ...base, ...overrides };
}

test('sanitizeCampaignForFirestore enforces firestore.rules types (string worldSeed, clamped ints, no undefined)', () => {
  const dirty = makeWorld({
    campaignId: 'camp / 2050 #1!',
    worldSeed: 98765432,
    era: 9 as unknown as WorldState['era'],
    cycle: -5,
    tick: 150.7,
    stateHash: 'hash_alpha_123',
  }) as WorldState & { optionalNoise?: undefined; nested?: { keep: number; drop?: undefined; badNum: number } };
  dirty.optionalNoise = undefined;
  dirty.nested = { keep: 42, drop: undefined, badNum: Number.NaN };

  const payload = sanitizeCampaignForFirestore(dirty);

  assert.match(payload.campaignId, /^[a-zA-Z0-9_-]+$/);
  assert.equal(typeof payload.worldSeed, 'string');
  assert.equal(payload.worldSeed, '98765432');
  assert.equal(payload.era, 6);
  assert.equal(payload.cycle, 0);
  assert.equal(payload.tick, 150);
  assert.ok(['P1', 'P2', 'P3', 'P4'].includes(payload.atmosphereTier));

  const snapRecord = payload.snapshot as unknown as Record<string, unknown>;
  assert.equal('optionalNoise' in snapRecord, false);
  const nested = snapRecord.nested as Record<string, unknown>;
  assert.equal(nested.keep, 42);
  assert.equal('drop' in nested, false);
  assert.equal(nested.badNum, 0);
});

test('sanitizeCampaignForFirestore compacts oversized chronicle when exceeding maxBytes', () => {
  const hugeChronicle = Array.from({ length: 300 }, (_, i) => ({
    id: `c-${i}`,
    cycle: i,
    tick: i * 15,
    category: 'DOSSIER' as const,
    title: `Événement massif ${i}`,
    detail: 'X'.repeat(600),
    stateHash: `h-${i}`,
  }));
  const world = makeWorld({ chronicle: hugeChronicle });
  const compacted = sanitizeCampaignForFirestore(world, 60_000);
  assert.equal(compacted.compacted, true);
  assert.equal(compacted.snapshot.chronicle.length, 120);
});

test('buildTurnCheckpointRecord embeds full worldState under budget and falls back cleanly when oversized', () => {
  const world = makeWorld({ cycle: 4, era: 2, year: 2054, stateHash: 'abcdef1234567890' });

  const full = buildTurnCheckpointRecord(world, 'TURN_END', 850_000);
  assert.match(full.snapshotId, /^t4_abcdef123456$/);
  assert.equal(full.checkpointIncluded, true);
  assert.ok(full.snapshot.worldState);
  assert.equal(full.snapshot.reason, 'TURN_END');

  const metaOnly = buildTurnCheckpointRecord(world, 'TURN_END', 500);
  assert.equal(metaOnly.checkpointIncluded, false);
  assert.equal(metaOnly.snapshot.worldState, undefined);
});

test('shouldTriggerCloudAutoSave enforces config toggles, deduplication, and MANUAL override', () => {
  const world = makeWorld({ cycle: 2, tick: 30, stateHash: 'h2' });
  const fp = buildSyncFingerprint(world);

  assert.equal(shouldTriggerCloudAutoSave(DEFAULT_CLOUD_AUTOSAVE_CONFIG, 'TURN_END', null, fp), true);
  assert.equal(shouldTriggerCloudAutoSave(DEFAULT_CLOUD_AUTOSAVE_CONFIG, 'TURN_END', fp, fp), false);
  assert.equal(shouldTriggerCloudAutoSave(DEFAULT_CLOUD_AUTOSAVE_CONFIG, 'MANUAL', fp, fp), true);

  const disabled = { ...DEFAULT_CLOUD_AUTOSAVE_CONFIG, enabled: false };
  assert.equal(shouldTriggerCloudAutoSave(disabled, 'TURN_END', null, fp), false);
  assert.equal(shouldTriggerCloudAutoSave(disabled, 'MANUAL', null, fp), true);

  const noDossier = { ...DEFAULT_CLOUD_AUTOSAVE_CONFIG, saveOnDossierDecision: false };
  assert.equal(shouldTriggerCloudAutoSave(noDossier, 'DOSSIER', null, fp), false);
  assert.equal(shouldTriggerCloudAutoSave(noDossier, 'TURN_END', null, fp), true);
});

test('outbox queue deduplicates identical hashes, compacts non-turn saves, and respects maxItems cap', () => {
  const w1 = makeWorld({ cycle: 1, stateHash: 'h1' });
  const w2 = makeWorld({ cycle: 2, stateHash: 'h2' });
  const w3 = makeWorld({ cycle: 3, stateHash: 'h3' });

  const mk = (id: string, w: WorldState, archiveTurnSnapshot: boolean): QueuedCloudSave => ({
    id,
    campaignId: sanitizeFirestoreDocId(w.campaignId, 60),
    cycle: w.cycle,
    tick: w.tick,
    stateHash: w.stateHash,
    reason: archiveTurnSnapshot ? 'TURN_END' : 'DOSSIER',
    archiveTurnSnapshot,
    queuedAtIso: new Date().toISOString(),
    state: w,
  });

  let queue: QueuedCloudSave[] = [];
  queue = enqueueCloudSaveItem(queue, mk('q1', w1, true), 2);
  queue = enqueueCloudSaveItem(queue, mk('q1-dup', w1, true), 2);
  assert.equal(queue.length, 1);
  assert.equal(queue[0]!.id, 'q1-dup');

  queue = enqueueCloudSaveItem(queue, mk('q2', w2, true), 2);
  queue = enqueueCloudSaveItem(queue, mk('q3', w3, true), 2);
  assert.equal(queue.length, 2);
  assert.deepEqual(
    queue.map((q) => q.cycle),
    [2, 3],
  );

  const afterRemove = removeCloudSaveItem(queue, 'q2');
  assert.equal(afterRemove.length, 1);
  assert.equal(afterRemove[0]!.id, 'q3');
});

test('compareCampaignFreshness distinguishes CLOUD_NEWER, LOCAL_NEWER, IN_SYNC, and DIVERGED', () => {
  assert.equal(
    compareCampaignFreshness(
      { campaignId: 'c1', cycle: 3, tick: 45, stateHash: 'abc' },
      { campaignId: 'c1', cycle: 3, tick: 45, stateHash: 'abc' },
    ),
    'IN_SYNC',
  );
  assert.equal(
    compareCampaignFreshness(
      { campaignId: 'c1', cycle: 2, tick: 30, stateHash: 'old' },
      { campaignId: 'c1', cycle: 4, tick: 60, stateHash: 'new' },
    ),
    'CLOUD_NEWER',
  );
  assert.equal(
    compareCampaignFreshness(
      { campaignId: 'c1', cycle: 5, tick: 75, stateHash: 'loc' },
      { campaignId: 'c1', cycle: 4, tick: 60, stateHash: 'cld' },
    ),
    'LOCAL_NEWER',
  );
  assert.equal(
    compareCampaignFreshness(
      { campaignId: 'c1', cycle: 4, tick: 60, stateHash: 'hashA' },
      { campaignId: 'c1', cycle: 4, tick: 60, stateHash: 'hashB' },
    ),
    'DIVERGED',
  );
});

test('stripUndefinedDeep removes undefined from nested objects and arrays', () => {
  const input = { a: 1, b: undefined, arr: [1, undefined, { x: 'ok', y: undefined }] };
  const cleaned = stripUndefinedDeep(input) as Record<string, unknown>;
  assert.deepEqual(cleaned, { a: 1, arr: [1, { x: 'ok' }] });
});
