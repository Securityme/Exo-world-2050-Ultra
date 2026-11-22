import { err, ok, type ExwResult } from '../../contracts/trigger-bus.schema.ts';
import type { QueuedIntent } from '../queues/intent.queue.ts';

/**
 * [L2] FUP-004 | MC-00 | SADT A1.1 / A2
 * Pure Deterministic Intent Dispatcher validating & routing queued player/AI intents.
 */
export interface DispatchedOutcome {
  readonly intentId: string;
  readonly kind: QueuedIntent['kind'];
  readonly accepted: boolean;
  readonly summary: string;
}

export function dispatchIntentBatch<TState>(
  initialState: TState,
  intents: readonly QueuedIntent[],
  applyIntent: (state: TState, intent: QueuedIntent) => ExwResult<TState>,
): { nextState: TState; outcomes: DispatchedOutcome[] } {
  let current = initialState;
  const outcomes: DispatchedOutcome[] = [];

  for (const intent of intents) {
    const [e, updated] = applyIntent(current, intent);
    if (e || !updated) {
      outcomes.push({
        intentId: intent.id,
        kind: intent.kind,
        accepted: false,
        summary: e?.message ?? 'Intent rejeté',
      });
    } else {
      current = updated;
      outcomes.push({
        intentId: intent.id,
        kind: intent.kind,
        accepted: true,
        summary: `${intent.kind} exécuté au tick ${intent.tickIssued}`,
      });
    }
  }

  return { nextState: current, outcomes };
}

export function validateIntentEnvelope(intent: unknown): ExwResult<QueuedIntent> {
  if (!intent || typeof intent !== 'object') {
    return err('EXW_ERR_SCHEMA', 'Intent vide ou non-objet.');
  }
  const obj = intent as Partial<QueuedIntent>;
  if (typeof obj.id !== 'string' || typeof obj.kind !== 'string' || typeof obj.tickIssued !== 'number') {
    return err('EXW_ERR_SCHEMA', 'Structure QueuedIntent invalide.');
  }
  return ok(obj as QueuedIntent);
}
