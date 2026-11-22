import type { HybridCloudSyncPacket } from '../../bridges/cloud-hybrid.bridge.ts';

/**
 * [L5] FUP-012 | SM-05 | SADT A5.1
 * Asynchronous I/O queue staging Firestore & Cloud SQL snapshot packets cleanly outside L2/L3.
 */
export interface CloudSyncQueueItem {
  readonly packet: HybridCloudSyncPacket;
  readonly status: 'PENDING' | 'SYNCED' | 'FAILED';
  readonly attempts: number;
}

export class CloudSyncQueue {
  private readonly items: CloudSyncQueueItem[] = [];

  public enqueue(packet: HybridCloudSyncPacket): void {
    this.items.push({ packet, status: 'PENDING', attempts: 0 });
  }

  public pendingCount(): number {
    return this.items.filter((i) => i.status === 'PENDING').length;
  }

  public peekPending(): CloudSyncQueueItem | null {
    return this.items.find((i) => i.status === 'PENDING') ?? null;
  }

  public markSynced(stateHash: string): void {
    const target = this.items.find((i) => i.packet.stateHash === stateHash);
    if (target) {
      (target as { status: 'SYNCED' }).status = 'SYNCED';
    }
  }
}
