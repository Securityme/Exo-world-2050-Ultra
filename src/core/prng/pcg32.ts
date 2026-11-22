/**
 * [L2] FUP-010 | SM-05 | SADT A3 / A5.1
 * 100% Pure Deterministic PCG32 (XSH-RR 64->32) PRNG — ZERO Math.random(), ZERO Date.now(), ZERO I/O (R-13, R-17, R-66).
 */
const MULTIPLIER = 6364136223846793005n;
const DEFAULT_INC = 1442695040888963407n;
const MASK_64 = 0xffffffffffffffffn;
const MASK_32 = 0xffffffffn;

export class Pcg32 {
  private state: bigint;
  private readonly inc: bigint;

  constructor(seed: number, streamSeq = 0) {
    const safeSeed = BigInt(Math.abs(Math.floor(seed)) >>> 0);
    const safeSeq = BigInt(Math.abs(Math.floor(streamSeq)) >>> 0);
    this.inc = streamSeq === 0 ? DEFAULT_INC : ((safeSeq << 1n) | 1n) & MASK_64;
    this.state = 0n;
    this.nextUint32();
    this.state = (this.state + safeSeed) & MASK_64;
    this.nextUint32();
  }

  public getStateNumber(): number {
    return Number(this.state & MASK_32);
  }

  public nextUint32(): number {
    const oldState = this.state;
    this.state = (oldState * MULTIPLIER + this.inc) & MASK_64;
    const xorshifted = Number(((oldState >> 18n) ^ oldState) >> 27n) >>> 0;
    const rot = Number(oldState >> 59n) & 31;
    return ((xorshifted >>> rot) | (xorshifted << ((-rot) & 31))) >>> 0;
  }

  /** Wave 0 alias for nextUint32(). */
  public nextU32(): number {
    return this.nextUint32();
  }

  /** Returns deterministic float in [0, 1). */
  public nextFloat(): number {
    return this.nextUint32() / 4294967296;
  }

  /** Returns deterministic float in [min, max]. */
  public nextRange(min: number, max: number): number {
    return min + this.nextFloat() * (max - min);
  }

  /** Returns deterministic integer in [min, max] inclusive. */
  public nextInt(min: number, max: number): number {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    if (hi <= lo) return lo;
    return lo + (this.nextUint32() % (hi - lo + 1));
  }
}
