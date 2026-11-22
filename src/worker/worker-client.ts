import type { WorldState } from '../contracts/world-state.schema.ts';
import type { CombatDispatchOrder, CombatReport } from '../contracts/combat-units.schema.ts';
import { advanceFullCycle } from '../core/loop/cycle-orchestrator.ts';
import { resolveDeterministicCombat } from '../systems/combat-conquest/combat-engine.ts';
import type { SimWorkerRequest, SimWorkerResponse } from './simulation.worker.ts';

/**
 * [L5] src/worker/worker-client.ts
 * Typed async bridge to simulation.worker.ts with safe deterministic main-thread fallback.
 */
type SimWorkerPayload =
  | { readonly type: 'ADVANCE_TICK'; readonly state: WorldState }
  | { readonly type: 'ADVANCE_CYCLE'; readonly state: WorldState }
  | {
      readonly type: 'RESOLVE_COMBAT';
      readonly order: CombatDispatchOrder;
      readonly seed: number;
      readonly cycle: number;
    };

class SimulationWorkerClient {
  private worker: Worker | null = null;
  private pending = new Map<string, (res: SimWorkerResponse) => void>();
  private seq = 0;

  private ensureWorker(): Worker | null {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return null;
    if (!this.worker) {
      try {
        this.worker = new Worker(new URL('./simulation.worker.ts', import.meta.url), {
          type: 'module',
        });
        this.worker.onmessage = (event: MessageEvent<SimWorkerResponse>) => {
          const cb = this.pending.get(event.data.id);
          if (cb) {
            this.pending.delete(event.data.id);
            cb(event.data);
          }
        };
        this.worker.onerror = () => {
          this.worker?.terminate();
          this.worker = null;
        };
      } catch {
        this.worker = null;
      }
    }
    return this.worker;
  }

  private dispatch(req: SimWorkerPayload): Promise<SimWorkerResponse | null> {
    const worker = this.ensureWorker();
    if (!worker) return Promise.resolve(null);
    const id = `wk-${++this.seq}`;
    return new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        this.pending.delete(id);
        resolve(null);
      }, 2500);
      this.pending.set(id, (res) => {
        window.clearTimeout(timer);
        resolve(res);
      });
      worker.postMessage({ ...req, id } as SimWorkerRequest);
    });
  }

  public async runFullCycle(state: WorldState): Promise<WorldState> {
    const res = await this.dispatch({ type: 'ADVANCE_CYCLE', state });
    if (res && res.type === 'STATE_RESULT') return res.state;
    return advanceFullCycle(state);
  }

  public async runCombat(
    order: CombatDispatchOrder,
    seed: number,
    cycle: number
  ): Promise<CombatReport | null> {
    const res = await this.dispatch({ type: 'RESOLVE_COMBAT', order, seed, cycle });
    if (res && res.type === 'COMBAT_RESULT') return res.report;
    const [, report] = resolveDeterministicCombat(order, seed, cycle);
    return report;
  }
}

export const simWorkerClient = new SimulationWorkerClient();
