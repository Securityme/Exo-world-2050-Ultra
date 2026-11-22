import { Pcg32 } from './pcg32.ts';

/**
 * [L2] EXW.L2.PCG32_STREAMS | v4.0.0-rc.1 | SADT A1.2
 * 6 Isolated Deterministic PCG32 Streams (SIM:1, ARR:2, WEAR:3, EVT:4, CMB:5, DIPLO:6).
 * Prevents cross-subsystem RNG perturbation when one domain draws extra numbers.
 */
export const PRNG_STREAMS = {
  SIM: 1,
  ARR: 2,
  WEAR: 3,
  EVT: 4,
  CMB: 5,
  DIPLO: 6,
} as const;

export type PrngStreamName = keyof typeof PRNG_STREAMS;

export function createIsolatedPrng(worldSeed: number, cycle: number, stream: PrngStreamName): Pcg32 {
  const streamId = PRNG_STREAMS[stream];
  const mixedSeed = (worldSeed ^ Math.imul(cycle + 1, 2654435761) ^ Math.imul(streamId, 2246822519)) >>> 0;
  return new Pcg32(mixedSeed || streamId);
}
