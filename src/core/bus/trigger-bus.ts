import {
  TriggerBusEventSchema,
  type TriggerBusEvent,
  type ExwResult,
  ok,
  err,
} from '../../contracts/trigger-bus.schema.ts';
import { CYCLE_CONSTANTS } from '../../config/game.constants.ts';

/**
 * [L2] FUP-001 | SM-01 | SADT A1.1
 * Pure TRIGGER_BUS validator & P0 Crisis Damper (max 2 new P0/cycle per §5.5.5).
 */
export function enqueueTriggerEvent(
  currentBus: readonly TriggerBusEvent[],
  rawCandidate: unknown,
  currentCycle: number
): ExwResult<TriggerBusEvent[]> {
  const parsed = TriggerBusEventSchema.safeParse(rawCandidate);
  if (!parsed.success) {
    return err('EXW_ERR_SCHEMA', 'Invalid TRIGGER_BUS event payload', parsed.error.message);
  }
  const candidate = parsed.data;

  // Anti-crisis storm damper (§5.5.5): strictly cap new P0 crises at 2 per N1 cycle
  if (candidate.severity === 'P0_CRISIS') {
    const p0ThisCycle = currentBus.filter(
      (evt) => evt.severity === 'P0_CRISIS' && evt.cycleIssued === currentCycle && !evt.resolved
    ).length;
    if (p0ThisCycle >= CYCLE_CONSTANTS.MAX_NEW_P0_PER_CYCLE) {
      const consolidated: TriggerBusEvent = {
        ...candidate,
        severity: 'HIGH',
        horizon: 'SUSTAINED_MODIFIER',
        summary: `[Amortisseur P0] ${candidate.summary}`,
      };
      return ok([...currentBus, consolidated]);
    }
  }

  return ok([...currentBus, candidate]);
}

export function collectDueTriggers(
  bus: readonly TriggerBusEvent[],
  currentCycle: number
): { due: TriggerBusEvent[]; remaining: TriggerBusEvent[] } {
  const due: TriggerBusEvent[] = [];
  const remaining: TriggerBusEvent[] = [];
  for (const evt of bus) {
    if (!evt.resolved && evt.dueCycle <= currentCycle) {
      due.push({ ...evt, resolved: true });
    } else {
      remaining.push(evt);
    }
  }
  return { due, remaining };
}
