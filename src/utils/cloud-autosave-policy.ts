import type { TurnSnapshot } from '../contracts/v4-systems.schema.ts';
import type { WorldState } from '../contracts/world-state.schema.ts';

/**
 * [L2] EXW.L2.CLOUD_AUTOSAVE_POLICY | v5.1.0 | SADT A5.1
 * Pure, deterministic Cloud Auto-Save policy, Firestore rules sanitizer,
 * turn checkpoint builder, offline outbox reducer, and freshness comparator.
 * Zero Firebase SDK or DOM dependencies so node:test runs cleanly offline.
 */

export type CloudAutoSaveReason =
  | 'TURN_END'
  | 'DOSSIER'
  | 'MILESTONE'
  | 'MANUAL'
  | 'PAGE_HIDE';

export type CloudAutoSaveStatus =
  | 'IDLE'
  | 'SAVING'
  | 'SYNCED'
  | 'QUEUED_OFFLINE'
  | 'AUTH_REQUIRED'
  | 'ERROR';

export interface CloudAutoSaveConfig {
  readonly enabled: boolean;
  readonly saveOnTurnEnd: boolean;
  readonly saveOnDossierDecision: boolean;
  readonly archiveTurnSnapshots: boolean;
  readonly maxQueuedItems: number;
}

export const DEFAULT_CLOUD_AUTOSAVE_CONFIG: CloudAutoSaveConfig = {
  enabled: true,
  saveOnTurnEnd: true,
  saveOnDossierDecision: true,
  archiveTurnSnapshots: true,
  maxQueuedItems: 12,
};

export interface SanitizedCampaignPayload {
  readonly campaignId: string;
  readonly worldSeed: string;
  readonly superpowerId: string;
  readonly era: number;
  readonly cycle: number;
  readonly tick: number;
  readonly atmosphereTier: 'P1' | 'P2' | 'P3' | 'P4';
  readonly stateHash: string;
  readonly snapshot: WorldState;
  readonly compacted: boolean;
  readonly approxBytes: number;
}

export interface TurnCheckpointRecord {
  readonly snapshotId: string;
  readonly campaignId: string;
  readonly cycle: number;
  readonly stateHash: string;
  readonly combatCount: number;
  readonly checkpointIncluded: boolean;
  readonly snapshot: TurnSnapshot & {
    readonly reason: CloudAutoSaveReason;
    readonly checkpointIncluded: boolean;
    readonly worldState?: WorldState;
  };
}

export interface QueuedCloudSave {
  readonly id: string;
  readonly campaignId: string;
  readonly cycle: number;
  readonly tick: number;
  readonly stateHash: string;
  readonly reason: CloudAutoSaveReason;
  readonly archiveTurnSnapshot: boolean;
  readonly queuedAtIso: string;
  readonly state: WorldState;
}

export interface CampaignFreshnessPoint {
  readonly campaignId: string;
  readonly cycle: number;
  readonly tick?: number;
  readonly stateHash: string;
  readonly updatedAtIso?: string | null;
}

export type CampaignFreshnessResult =
  | 'CLOUD_NEWER'
  | 'LOCAL_NEWER'
  | 'IN_SYNC'
  | 'DIVERGED';

const ALLOWED_ATMO_TIERS = new Set(['P1', 'P2', 'P3', 'P4']);
const MAX_CAMPAIGN_BYTES = 900_000;
const MAX_CHECKPOINT_BYTES = 850_000;

export function sanitizeFirestoreDocId(raw: string, maxLen: number): string {
  const cleaned = String(raw ?? '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, maxLen);
  return cleaned.length > 0 ? cleaned : 'record_0';
}

export function stripUndefinedDeep<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'number') {
    return (Number.isFinite(value) ? value : 0) as T;
  }
  if (typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val === undefined) continue;
    out[key] = stripUndefinedDeep(val);
  }
  return out as T;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(num)));
}

export function estimateJsonBytes(value: unknown): number {
  try {
    const serialized = JSON.stringify(value);
    if (!serialized) return 0;
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(serialized).length;
    }
    return serialized.length * 2;
  } catch {
    return 0;
  }
}

function compactWorldStateForCloud(state: WorldState): WorldState {
  const chronicle = Array.isArray(state.chronicle) ? state.chronicle.slice(-120) : [];
  const combatReports = Array.isArray(state.combatReports) ? state.combatReports.slice(-24) : [];
  return {
    ...state,
    chronicle,
    combatReports,
  };
}

export function sanitizeCampaignForFirestore(
  state: WorldState,
  maxBytes = MAX_CAMPAIGN_BYTES,
): SanitizedCampaignPayload {
  const safeCampaignId = sanitizeFirestoreDocId(state.campaignId || 'exw-campaign', 60);
  const rawSeed = String(state.worldSeed ?? '20500409').trim();
  const worldSeed = (rawSeed.length > 0 ? rawSeed : '20500409').slice(0, 64);
  const rawSp = String(state.superpowerId ?? 'sp-uea').trim();
  const superpowerId = (rawSp.length > 0 ? rawSp : 'sp-uea').slice(0, 40);
  const era = clampInt(state.era, 1, 6, 1);
  const cycle = clampInt(state.cycle, 0, 100_000, 0);
  const tick = clampInt(state.tick, 0, 100_000_000, 0);
  const rawTier = String(state.atmosphereTier ?? 'P1');
  const atmosphereTier = (
    ALLOWED_ATMO_TIERS.has(rawTier) ? rawTier : 'P1'
  ) as 'P1' | 'P2' | 'P3' | 'P4';
  const rawHash = String(state.stateHash ?? 'init').trim();
  const stateHash = (rawHash.length > 0 ? rawHash : 'init').slice(0, 128);

  let cleanedSnapshot = stripUndefinedDeep(state);
  let approxBytes = estimateJsonBytes(cleanedSnapshot);
  let compacted = false;

  if (approxBytes > maxBytes) {
    cleanedSnapshot = stripUndefinedDeep(compactWorldStateForCloud(state));
    approxBytes = estimateJsonBytes(cleanedSnapshot);
    compacted = true;
  }

  return {
    campaignId: safeCampaignId,
    worldSeed,
    superpowerId,
    era,
    cycle,
    tick,
    atmosphereTier,
    stateHash,
    snapshot: cleanedSnapshot,
    compacted,
    approxBytes,
  };
}

export function buildTurnCheckpointRecord(
  state: WorldState,
  reason: CloudAutoSaveReason,
  maxBytes = MAX_CHECKPOINT_BYTES,
): TurnCheckpointRecord {
  const sanitized = sanitizeCampaignForFirestore(state, maxBytes);
  const hashPrefix = sanitizeFirestoreDocId(sanitized.stateHash.slice(0, 12), 16);
  const snapshotId = sanitizeFirestoreDocId(`t${sanitized.cycle}_${hashPrefix}`, 80);
  const combatReports = Array.isArray(sanitized.snapshot.combatReports)
    ? sanitized.snapshot.combatReports.slice(-20)
    : [];
  const combatCount = Math.min(500, combatReports.length);

  const baseSnapshot: TurnSnapshot = {
    id: snapshotId,
    campaignId: sanitized.campaignId,
    cycle: sanitized.cycle,
    year: clampInt(state.year, 2050, 9999, 2050),
    season: String(state.season ?? 'PRINTEMPS'),
    era: sanitized.era,
    stateHash: sanitized.stateHash,
    combatReports,
  };

  const withWorldState = {
    ...baseSnapshot,
    reason,
    checkpointIncluded: true,
    worldState: sanitized.snapshot,
  };

  const totalBytes = estimateJsonBytes(withWorldState);
  if (totalBytes <= maxBytes) {
    return {
      snapshotId,
      campaignId: sanitized.campaignId,
      cycle: sanitized.cycle,
      stateHash: sanitized.stateHash,
      combatCount,
      checkpointIncluded: true,
      snapshot: withWorldState,
    };
  }

  return {
    snapshotId,
    campaignId: sanitized.campaignId,
    cycle: sanitized.cycle,
    stateHash: sanitized.stateHash,
    combatCount,
    checkpointIncluded: false,
    snapshot: {
      ...baseSnapshot,
      reason,
      checkpointIncluded: false,
    },
  };
}

export function shouldTriggerCloudAutoSave(
  config: CloudAutoSaveConfig,
  reason: CloudAutoSaveReason,
  lastSyncedKey: string | null,
  nextKey: string,
): boolean {
  if (reason === 'MANUAL') return true;
  if (!config.enabled) return false;
  if (lastSyncedKey && lastSyncedKey === nextKey) return false;
  if (reason === 'TURN_END') return config.saveOnTurnEnd;
  if (reason === 'DOSSIER') return config.saveOnDossierDecision;
  return true;
}

export function buildSyncFingerprint(state: Pick<WorldState, 'campaignId' | 'cycle' | 'tick' | 'stateHash'>): string {
  return `${sanitizeFirestoreDocId(state.campaignId, 60)}::${state.cycle}::${state.tick}::${state.stateHash}`;
}

export function enqueueCloudSaveItem(
  queue: readonly QueuedCloudSave[],
  nextItem: QueuedCloudSave,
  maxItems: number,
): QueuedCloudSave[] {
  const deduped = queue.filter(
    (entry) =>
      !(
        entry.campaignId === nextItem.campaignId &&
        entry.cycle === nextItem.cycle &&
        entry.stateHash === nextItem.stateHash
      ),
  );
  // Keep only the latest pending non-turn-end entry per campaign to prevent queue bloat
  const compacted = nextItem.archiveTurnSnapshot
    ? deduped
    : deduped.filter(
        (entry) => !(entry.campaignId === nextItem.campaignId && !entry.archiveTurnSnapshot),
      );
  const merged = [...compacted, nextItem];
  const limit = Math.max(1, maxItems);
  return merged.length > limit ? merged.slice(merged.length - limit) : merged;
}

export function removeCloudSaveItem(
  queue: readonly QueuedCloudSave[],
  itemId: string,
): QueuedCloudSave[] {
  return queue.filter((entry) => entry.id !== itemId);
}

export function compareCampaignFreshness(
  local: CampaignFreshnessPoint | null,
  cloud: CampaignFreshnessPoint | null,
): CampaignFreshnessResult {
  if (!local && !cloud) return 'IN_SYNC';
  if (!local && cloud) return 'CLOUD_NEWER';
  if (local && !cloud) return 'LOCAL_NEWER';
  const loc = local!;
  const cld = cloud!;
  if (loc.stateHash === cld.stateHash && loc.cycle === cld.cycle) {
    return 'IN_SYNC';
  }
  if (cld.cycle > loc.cycle) return 'CLOUD_NEWER';
  if (loc.cycle > cld.cycle) return 'LOCAL_NEWER';
  const locTick = loc.tick ?? 0;
  const cldTick = cld.tick ?? 0;
  if (cldTick > locTick) return 'CLOUD_NEWER';
  if (locTick > cldTick) return 'LOCAL_NEWER';
  if (cld.updatedAtIso && loc.updatedAtIso) {
    if (cld.updatedAtIso > loc.updatedAtIso) return 'CLOUD_NEWER';
    if (loc.updatedAtIso > cld.updatedAtIso) return 'LOCAL_NEWER';
  }
  return 'DIVERGED';
}
