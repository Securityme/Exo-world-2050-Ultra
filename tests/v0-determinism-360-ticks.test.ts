import { describe, expect, it } from 'vitest';
import {
  advanceSingleTick,
  createInitialWorldState,
} from '../src/core/loop/cycle-orchestrator.ts';
import {
  canonicalJson,
  hashState,
  sha256Hex,
} from '../src/core/hashing/state-hasher.ts';
import { Pcg32 } from '../src/core/prng/pcg32.ts';

describe('Wave 0 Determinism — 360 Ticks (1 Année N3)', () => {
  it('produit un SHA-256 bit-à-bit identique après 360 ticks sur deux exécutions indépendantes', () => {
    const config = {
      campaignId: 'exw-v0-det-test',
      worldSeed: 20500409,
      superpowerId: 'eu-spatiale',
      doctrineId: 'SOLARPUNK',
      rivalCount: 5,
    };

    let runA = createInitialWorldState(config);
    let runB = createInitialWorldState(config);

    expect(runA.stateHash).toMatch(/^[0-9a-f]{64}$/);
    expect(runA.stateHash).toBe(runB.stateHash);

    for (let t = 0; t < 360; t += 1) {
      runA = advanceSingleTick(runA);
      runB = advanceSingleTick(runB);
      if ((t + 1) % 15 === 0) {
        expect(runA.stateHash).toBe(runB.stateHash);
      }
    }

    expect(runA.tick).toBe(360);
    expect(runA.cycle).toBe(24);
    expect(runA.year).toBe(2051);
    expect(runA.stateHash).toBe(runB.stateHash);
  });

  it('produit un SHA-256 distinct si la graine initiale change', () => {
    let runA = createInitialWorldState({
      campaignId: 'exw-v0-seed-a',
      worldSeed: 20500409,
      superpowerId: 'eu-spatiale',
      doctrineId: 'SOLARPUNK',
      rivalCount: 5,
    });
    let runB = createInitialWorldState({
      campaignId: 'exw-v0-seed-b',
      worldSeed: 20500410,
      superpowerId: 'eu-spatiale',
      doctrineId: 'SOLARPUNK',
      rivalCount: 5,
    });

    for (let t = 0; t < 30; t += 1) {
      runA = advanceSingleTick(runA);
      runB = advanceSingleTick(runB);
    }

    expect(runA.stateHash).not.toBe(runB.stateHash);
  });

  it('garantit l’invariance de canonicalJson et la reproductibilité Pcg32 XSH-RR', () => {
    const h1 = hashState({ b: 2, a: 1, nested: { z: true, y: 'exo' }, stateHash: 'ignored-a' });
    const h2 = hashState({ nested: { y: 'exo', z: true }, a: 1, b: 2, stateHash: 'ignored-b' });
    expect(h1).toBe(h2);
    expect(canonicalJson({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
    expect(sha256Hex('exo-world-2050')).toMatch(/^[0-9a-f]{64}$/);

    const rng1 = new Pcg32(4242, 7);
    const rng2 = new Pcg32(4242, 7);
    for (let i = 0; i < 32; i += 1) {
      expect(rng1.nextU32()).toBe(rng2.nextUint32());
    }
  });
});
