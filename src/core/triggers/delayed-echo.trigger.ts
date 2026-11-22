import {
  TriggerBusEventSchema,
  type ExwResult,
  type TriggerBusEvent,
  err,
  ok,
} from '../../contracts/trigger-bus.schema.ts';

/**
 * [L2] FUP-001 / FUP-002 | SM-01 | SADT A2.3
 * Pure Delayed Echo Trigger Scheduler (queues horizon='DELAYED_ECHO' & resolves due echoes).
 */
export function scheduleDelayedEchoTrigger(
  bus: readonly TriggerBusEvent[],
  params: {
    readonly id: string;
    readonly tickIssued: number;
    readonly cycleIssued: number;
    readonly delayCycles: number;
    readonly title: string;
    readonly summary: string;
    readonly deltaModifier: number;
  },
): ExwResult<TriggerBusEvent[]> {
  const clampedDelta = Math.max(-0.15, Math.min(0.15, params.deltaModifier));
  const candidate = {
    id: params.id,
    tickIssued: params.tickIssued,
    cycleIssued: params.cycleIssued,
    dueCycle: params.cycleIssued + Math.max(1, params.delayCycles),
    horizon: 'DELAYED_ECHO' as const,
    severity: 'STANDARD' as const,
    category: 'DELAYED_CONSEQUENCE' as const,
    title: params.title,
    summary: params.summary,
    sourceNode: 'A2.3' as const,
    deltaModifier: clampedDelta,
    resolved: false,
  };
  const parsed = TriggerBusEventSchema.safeParse(candidate);
  if (!parsed.success) {
    return err('EXW_ERR_SCHEMA', 'Écho différé invalide.', parsed.error.message);
  }
  return ok([...bus, parsed.data]);
}

export function extractDueEchoes(
  bus: readonly TriggerBusEvent[],
  currentCycle: number,
): { dueEchoes: TriggerBusEvent[]; pending: TriggerBusEvent[] } {
  const dueEchoes: TriggerBusEvent[] = [];
  const pending: TriggerBusEvent[] = [];
  for (const evt of bus) {
    if (!evt.resolved && evt.dueCycle <= currentCycle) {
      dueEchoes.push({ ...evt, resolved: true });
    } else {
      pending.push(evt);
    }
  }
  return { dueEchoes, pending };
}
