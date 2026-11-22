import { z } from 'zod';
import { err, ok, type ExwResult } from '../contracts/trigger-bus.schema.ts';
import { WorldStateSchema, type WorldState } from '../contracts/world-state.schema.ts';
import { parseJsonBoundary } from './zod-boundary.parser.ts';

/**
 * [L0] FUP-008 / FUP-010 | MC-00 | SADT A5.1
 * Deterministic Snapshot Envelope Parser (JSON/Gzip-ready payload with schema validation).
 */
export const SnapshotEnvelopeSchema = z.object({
  format: z.literal('EXW_SNAPSHOT_V1'),
  encoding: z.enum(['json-utf8', 'gzip-base64']).default('json-utf8'),
  checksumSha256: z.string().min(8),
  world: WorldStateSchema,
});

export type SnapshotEnvelope = z.infer<typeof SnapshotEnvelopeSchema>;

export function serializeSnapshotEnvelope(world: WorldState): SnapshotEnvelope {
  return {
    format: 'EXW_SNAPSHOT_V1',
    encoding: 'json-utf8',
    checksumSha256: world.stateHash,
    world,
  };
}

export function parseSnapshotEnvelope(rawJson: string): ExwResult<WorldState> {
  const [e, envelope] = parseJsonBoundary(SnapshotEnvelopeSchema, rawJson, 'SnapshotEnvelope');
  if (e || !envelope) {
    return err(e?.code ?? 'EXW_ERR_SCHEMA', e?.message ?? 'Instantané invalide.', e?.detail);
  }
  if (envelope.checksumSha256 !== envelope.world.stateHash) {
    return err(
      'EXW_ERR_SCHEMA',
      'Empreinte SHA-256 du snapshot incohérente avec WorldState.',
      `Expected ${envelope.world.stateHash}, got ${envelope.checksumSha256}`,
    );
  }
  return ok(envelope.world);
}
