/**
 * [L2] FUP-004 | MC-00 | SADT A1.1
 * Pure Deterministic Intent Queue (orders intents strictly by priority desc, tick asc, id asc).
 */
export interface QueuedIntent<TPayload = unknown> {
  readonly id: string;
  readonly kind: 'DOSSIER_DECISION' | 'BUILD_MODULE' | 'COMBAT_DISPATCH' | 'FINANCE_ACTION' | 'CYBER_OP';
  readonly tickIssued: number;
  readonly priority: number; // Higher executes first (e.g. P0=100, standard=10)
  readonly payload: TPayload;
}

export class IntentQueue<TPayload = unknown> {
  private readonly items: QueuedIntent<TPayload>[];

  constructor(initial: readonly QueuedIntent<TPayload>[] = []) {
    this.items = [...initial];
  }

  public enqueue(intent: QueuedIntent<TPayload>): void {
    this.items.push(intent);
    this.items.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      if (a.tickIssued !== b.tickIssued) return a.tickIssued - b.tickIssued;
      return a.id.localeCompare(b.id);
    });
  }

  public dequeue(): QueuedIntent<TPayload> | undefined {
    return this.items.shift();
  }

  public drainAll(): QueuedIntent<TPayload>[] {
    const out = [...this.items];
    this.items.length = 0;
    return out;
  }

  public size(): number {
    return this.items.length;
  }

  public snapshot(): readonly QueuedIntent<TPayload>[] {
    return [...this.items];
  }
}
