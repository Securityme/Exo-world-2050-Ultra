import assert from 'node:assert/strict';
import test from 'node:test';
import { assertR50CompliantValue } from '../src/guardrails/nomenclature.guardrail.ts';
import {
  DEFAULT_PLAYTEST_SEED,
  runDeterministicPlaytest6Turns,
} from '../src/systems/playtest/playtest-6-turns.ts';

test('runDeterministicPlaytest6Turns produces 6 turns (90 ticks) with identical SHA-256 chain hashes across runs', () => {
  const runA = runDeterministicPlaytest6Turns(DEFAULT_PLAYTEST_SEED);
  const runB = runDeterministicPlaytest6Turns(DEFAULT_PLAYTEST_SEED);

  assert.equal(runA.totalTurns, 6);
  assert.equal(runA.totalTicks, 90);
  assert.equal(runA.turns.length, 6);
  assert.equal(runA.finalChainHash, runB.finalChainHash);

  for (let i = 0; i < 6; i++) {
    const tA = runA.turns[i];
    const tB = runB.turns[i];
    assert.ok(tA && tB);
    assert.equal(tA.stateHash, tB.stateHash);
    assert.ok(tA.deltaPAdapt >= -0.15 && tA.deltaPAdapt <= 0.15);
  }
});

test('runDeterministicPlaytest6Turns enforces P1 -> P2 transition, 4-phase combat on Tour 4, and R-50 nomenclature purity', () => {
  const report = runDeterministicPlaytest6Turns(DEFAULT_PLAYTEST_SEED);

  assert.equal(report.turns[0]?.atmosphereTier, 'P1');
  assert.equal(report.turns[2]?.atmosphereTier, 'P2');
  assert.equal(report.turns[3]?.combatPhases?.length, 4);
  assert.equal(report.superpowerComparison.length, 7);

  const [nomenclatureErr] = assertR50CompliantValue(report, 'Playtest6TurnsReport');
  assert.equal(nomenclatureErr, null);
});
