import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialWorldState } from '../src/core/loop/cycle-orchestrator.ts';
import { buildTacticalIntensityGrid } from '../src/systems/combat-conquest/tactical-intensity-grid.ts';
import { runDeterministicPlaytest6Turns } from '../src/systems/playtest/playtest-6-turns.ts';
import { buildResourceTrendProjection18 } from '../src/systems/playtest/resource-trend-projection.ts';
import { assertR50CompliantValue } from '../src/guardrails/nomenclature.guardrail.ts';

const TEST_CONFIG = {
  campaignId: 'test-tactical-2050',
  worldSeed: 2050,
  superpowerId: 'sp-uea',
  doctrineId: 'SOLARPUNK',
  rivalCount: 5,
} as const;

test('buildTacticalIntensityGrid outputs 20 deterministic cells (4 atmospheric zones x L1-L5) with bounded intensity', () => {
  const world = createInitialWorldState(TEST_CONFIG);
  const a = buildTacticalIntensityGrid(world);
  const b = buildTacticalIntensityGrid(world);

  assert.equal(a.cells.length, 20);
  assert.deepEqual(a, b);
  assert.ok(a.maxPower > 0);
  for (const cell of a.cells) {
    assert.ok(cell.intensity >= 0 && cell.intensity <= 1);
    assert.ok(Number.isFinite(cell.totalPower) && cell.totalPower > 0);
    assert.ok(cell.elevationPx >= 14 && cell.elevationPx <= 88);
  }
  assert.doesNotThrow(() => assertR50CompliantValue(a));
});

test('buildResourceTrendProjection18 computes 6-turn production vs consumption across all 18 primary resources', () => {
  const world = createInitialWorldState(TEST_CONFIG);
  const report = runDeterministicPlaytest6Turns();
  const projection = buildResourceTrendProjection18(world, report);

  assert.equal(projection.resources.length, 18);
  assert.equal(projection.aggregateTurns.length, 6);
  assert.equal(projection.surplusCount + projection.deficitCount, 18);

  const kits = projection.resources.find((r) => r.id === 'breathingKits');
  assert.ok(kits);
  assert.equal(kits.points.length, 6);
  // Tour 3 crosses P1 -> P2, reducing breathing kit consumption significantly
  assert.ok(kits.points[2]!.consumption < kits.points[0]!.consumption);

  for (const res of projection.resources) {
    assert.equal(res.points.length, 6);
    for (const pt of res.points) {
      assert.equal(pt.net, pt.production - pt.consumption);
      assert.ok(Number.isFinite(pt.projectedStock) && pt.projectedStock >= 0);
    }
  }
  assert.doesNotThrow(() => assertR50CompliantValue(projection));
});
