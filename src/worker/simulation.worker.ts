import type { CombatDispatchOrder, CombatReport } from '../contracts/combat-units.schema.ts';
import type { WorldState } from '../contracts/world-state.schema.ts';
import { advanceFullCycle, advanceSingleTick } from '../core/loop/cycle-orchestrator.ts';
import { resolveDeterministicCombat } from '../systems/combat-conquest/combat-engine.ts';

/**
 * [L5] src/worker/simulation.worker.ts
 * Dedicated Web Worker executing pure deterministic simulation steps & 4-phase combat off the UI thread.
 */
export type SimWorkerRequest =
  | { readonly id: string; readonly type: 'ADVANCE_TICK'; readonly state: WorldState }
  | { readonly id: string; readonly type: 'ADVANCE_CYCLE'; readonly state: WorldState }
  | {
      readonly id: string;
      readonly type: 'RESOLVE_COMBAT';
      readonly order: CombatDispatchOrder;
      readonly seed: number;
      readonly cycle: number;
    };

export type SimWorkerResponse =
  | { readonly id: string; readonly type: 'STATE_RESULT'; readonly state: WorldState }
  | { readonly id: string; readonly type: 'COMBAT_RESULT'; readonly report: CombatReport | null };

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<SimWorkerRequest>) => void) | null;
  postMessage: (msg: SimWorkerResponse) => void;
};

scope.onmessage = (event: MessageEvent<SimWorkerRequest>) => {
  const req = event.data;
  if (req.type === 'ADVANCE_TICK') {
    scope.postMessage({ id: req.id, type: 'STATE_RESULT', state: advanceSingleTick(req.state) });
    return;
  }
  if (req.type === 'ADVANCE_CYCLE') {
    scope.postMessage({ id: req.id, type: 'STATE_RESULT', state: advanceFullCycle(req.state) });
    return;
  }
  if (req.type === 'RESOLVE_COMBAT') {
    const [, report] = resolveDeterministicCombat(req.order, req.seed, req.cycle);
    scope.postMessage({ id: req.id, type: 'COMBAT_RESULT', report });
  }
};
