import type { CombatDispatchOrder, CombatReport } from '../contracts/combat-units.schema.ts';
import type { WorldState } from '../contracts/world-state.schema.ts';

/**
 * [L4/L5] FUP-001 | MC-00 | SADT A5.1
 * Typed Worker Simulation Bridge messages shared between main thread and Web Worker.
 */
export type SimWorkerRequest =
  | { readonly id: string; readonly kind: 'ADVANCE_CYCLE'; readonly state: WorldState }
  | { readonly id: string; readonly kind: 'ADVANCE_TICK'; readonly state: WorldState }
  | {
      readonly id: string;
      readonly kind: 'RESOLVE_COMBAT';
      readonly order: CombatDispatchOrder;
      readonly seed: number;
      readonly cycle: number;
    };

export type SimWorkerResponse =
  | { readonly id: string; readonly kind: 'WORLD_UPDATED'; readonly state: WorldState }
  | { readonly id: string; readonly kind: 'COMBAT_RESOLVED'; readonly report: CombatReport }
  | { readonly id: string; readonly kind: 'ERROR'; readonly message: string };
