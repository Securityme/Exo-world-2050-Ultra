import type { WorldState } from '../contracts/world-state.schema.ts';
import { err, ok, type ExwResult } from '../contracts/trigger-bus.schema.ts';
import {
  parseSnapshotEnvelope,
  serializeSnapshotEnvelope,
} from '../parsers/snapshot-gzip.parser.ts';

/**
 * [L4/L5] FUP-012 | SM-05 | SADT A5.1
 * Cloud Hybrid Bridge coordinating deterministic snapshot envelopes between Firestore & Cloud SQL pgvector.
 */
export interface HybridCloudSyncPacket {
  readonly campaignId: string;
  readonly cycle: number;
  readonly stateHash: string;
  readonly envelopeJson: string;
}

export function buildCloudHybridSyncPacket(state: WorldState): ExwResult<HybridCloudSyncPacket> {
  const envelope = serializeSnapshotEnvelope(state);
  return ok({
    campaignId: state.campaignId,
    cycle: state.cycle,
    stateHash: state.stateHash,
    envelopeJson: JSON.stringify(envelope),
  });
}

export function restoreFromCloudHybridPacket(packet: HybridCloudSyncPacket): ExwResult<WorldState> {
  const [decodeErr, state] = parseSnapshotEnvelope(packet.envelopeJson);
  if (decodeErr !== null) return [decodeErr, null];
  if (state.stateHash !== packet.stateHash) {
    return err('EXW_ERR_SCHEMA', 'Empreinte SHA-256 divergente lors de la restauration Cloud.');
  }
  return ok(state);
}
