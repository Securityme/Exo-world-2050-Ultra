import test from 'node:test';
import assert from 'node:assert/strict';
import { MetaPlayerShowcaseSchema } from '../src/contracts/honors.schema.ts';
import {
  AVATAR_PRESETS,
  BANNER_STYLES_CATALOG,
  INITIAL_META_BADGES,
  INITIAL_META_MEDALS,
  INITIAL_META_TITLES,
} from '../src/data/honors.catalog.ts';
import {
  createDefaultMetaShowcase,
  evaluateMetaShowcaseFromWorld,
  mergeCatalogHonors,
} from '../src/systems/honors/honors-evaluator.ts';
import { createInitialWorldState } from '../src/core/loop/cycle-orchestrator.ts';
import {
  buildShowcaseAssetById,
  countGroupGeometryStats,
  SHOWCASE_3D_ASSETS_CATALOG,
} from '../src/engine3d/showcase-assets.ts';

test('Profile portrait catalog exposes 12 categorized presets with unique IDs and monograms', () => {
  assert.equal(AVATAR_PRESETS.length, 12);
  const ids = new Set(AVATAR_PRESETS.map((p) => p.id));
  assert.equal(ids.size, 12);
  for (const preset of AVATAR_PRESETS) {
    assert.ok(preset.monogram.length >= 2);
    assert.ok(preset.tagline.length > 10);
  }
  assert.equal(BANNER_STYLES_CATALOG.length, 6);
});

test('Expanded achievements catalog contains 16 medals, 10 badges, 8 titles (zero Commandant) and validates Zod', () => {
  const showcase = createDefaultMetaShowcase('2050-05-01T00:00:00.000Z');
  const parsed = MetaPlayerShowcaseSchema.safeParse(showcase);
  assert.equal(parsed.success, true);
  assert.equal(INITIAL_META_MEDALS.length, 16);
  assert.equal(INITIAL_META_BADGES.length, 10);
  assert.equal(INITIAL_META_TITLES.length, 8);

  for (const title of INITIAL_META_TITLES) {
    assert.equal(/commandant/i.test(title.label), false, `Forbidden Commandant title: ${title.label}`);
  }
});

test('mergeCatalogHonors preserves legacy unlocked progress while adding newly expanded achievements', () => {
  const full = createDefaultMetaShowcase();
  const legacySaved = {
    ...full,
    medals: full.medals.slice(0, 6).map((m) =>
      m.id === 'medal-eden-architect' ? { ...m, unlocked: true, progressCurrent: 95 } : m,
    ),
    badges: full.badges.slice(0, 5),
    titles: full.titles.slice(0, 4),
  };

  const merged = mergeCatalogHonors(legacySaved);
  assert.equal(merged.medals.length, 16);
  assert.equal(merged.badges.length, 10);
  assert.equal(merged.titles.length, 8);
  const eden = merged.medals.find((m) => m.id === 'medal-eden-architect');
  assert.equal(eden?.unlocked, true);
  assert.equal(eden?.progressCurrent, 95);
});

test('evaluateMetaShowcaseFromWorld unlocks economy, science, biosphere, and diplomacy achievements deterministically', () => {
  const base = createDefaultMetaShowcase();
  const world = createInitialWorldState({
    campaignId: 'TEST-HONORS',
    worldSeed: 0x2050a111,
    superpowerId: 'eurasia-solar',
    doctrineId: 'SOLARPUNK_EQUILIBRIUM',
    rivalCount: 5,
  });
  const progressedWorld = {
    ...world,
    atmosphereTier: 'P4' as const,
    atmosphereProgress: 94,
    approval: 86,
    superAllianceTrust: 90,
    superAllianceRank: 1,
    datacenterTier: 2,
    unlockedSlots: 2,
    capturedTiles: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    resources: {
      ...world.resources,
      credits: 3200,
    },
    districts: [
      ...world.districts,
      { id: 'd-4', name: 'Bio-Éden', kind: 'BIOPARK' as const, level: 2, modulesCount: 1, integrity: 100, gridX: 2, gridZ: 0 },
      { id: 'd-5', name: 'Silicium', kind: 'DATACENTER' as const, level: 2, modulesCount: 1, integrity: 100, gridX: -2, gridZ: 0 },
      { id: 'd-6', name: 'Port Orbital', kind: 'SPACEPORT' as const, level: 2, modulesCount: 1, integrity: 100, gridX: 0, gridZ: 2 },
    ],
  };

  const next = evaluateMetaShowcaseFromWorld(base, progressedWorld, '2050-06-01T00:00:00.000Z');
  const unlockedIds = new Set(next.medals.filter((m) => m.unlocked).map((m) => m.id));
  assert.equal(unlockedIds.has('medal-eden-architect'), true);
  assert.equal(unlockedIds.has('medal-exo-cartographer'), true);
  assert.equal(unlockedIds.has('medal-multiworld-pioneer'), true);
  assert.equal(unlockedIds.has('medal-solar-treasury'), true);
  assert.equal(unlockedIds.has('medal-quantum-compute'), true);
  assert.equal(unlockedIds.has('medal-urban-architect'), true);
  assert.equal(unlockedIds.has('medal-alliance-primacy'), true);
  assert.equal(unlockedIds.has('medal-ethical-beacon'), true);

  const unlockedBadgeIds = new Set(next.badges.filter((b) => b.unlocked).map((b) => b.id));
  assert.equal(unlockedBadgeIds.has('badge-quantum-grid'), true);
  assert.equal(unlockedBadgeIds.has('badge-eden-breath'), true);
  assert.equal(unlockedBadgeIds.has('badge-solar-treasurer'), true);
});

test('All 10 Showcase 3D PBR assets construct multi-part THREE.Group hierarchies (>= 6 meshes each)', () => {
  assert.equal(SHOWCASE_3D_ASSETS_CATALOG.length, 10);
  for (const spec of SHOWCASE_3D_ASSETS_CATALOG) {
    const group = buildShowcaseAssetById(spec.id);
    const stats = countGroupGeometryStats(group);
    assert.ok(
      stats.meshCount >= 6,
      `Expected >= 6 meshes for ${spec.id}, got ${stats.meshCount}`,
    );
    assert.ok(
      stats.triangleCount >= 100,
      `Expected >= 100 triangles for ${spec.id}, got ${stats.triangleCount}`,
    );
    assert.ok(spec.unityPrefabId.startsWith('Prefabs/'));
  }
});
