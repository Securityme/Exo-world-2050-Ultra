import { err, ok, type ExwResult } from '../../contracts/trigger-bus.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import { useCloudAutoSaveStore } from '../../stores/cloud-autosave.store.ts';
import {
  buildSyncFingerprint,
  compareCampaignFreshness,
  sanitizeFirestoreDocId,
  shouldTriggerCloudAutoSave,
  type CloudAutoSaveReason,
  type QueuedCloudSave,
} from '../../utils/cloud-autosave-policy.ts';
import {
  auth,
  deleteCloudCampaign,
  listUserCloudCampaigns,
  saveCampaignToCloud,
  type CampaignSaveMeta,
} from '../firebase/firebase-client.ts';
import {
  deleteCloudTurnCheckpoint,
  listCloudTurnCheckpoints,
  saveCloudTurnCheckpoint,
  type CloudTurnCheckpoint,
} from '../firebase/firestore-archives.service.ts';

/**
 * [L5] EXW.L5.CLOUD_AUTOSAVE_SERVICE | v5.1.0 | SADT A5.1
 * Orchestrates automatic turn-by-turn Cloud saves, debounced dossier/milestone saves,
 * append-only turn checkpoint archival (for Cloud Time-Travel / Rewind),
 * persistent offline/unauthenticated outbox flushing, and newer-cloud detection.
 */

const DOSSIER_DEBOUNCE_MS = 2500;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingDebouncedPayload: { world: WorldState; reason: CloudAutoSaveReason } | null = null;
let syncInFlight = false;
let queuedFollowUp: { world: WorldState; reason: CloudAutoSaveReason } | null = null;

function isNavigatorOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

function shouldArchiveCheckpointForReason(reason: CloudAutoSaveReason, archiveEnabled: boolean): boolean {
  if (!archiveEnabled) return false;
  return reason === 'TURN_END' || reason === 'MILESTONE' || reason === 'MANUAL';
}

function queueForLaterSync(world: WorldState, reason: CloudAutoSaveReason, status: 'AUTH_REQUIRED' | 'QUEUED_OFFLINE'): void {
  const store = useCloudAutoSaveStore.getState();
  const safeCampaignId = sanitizeFirestoreDocId(world.campaignId, 60);
  const item: QueuedCloudSave = {
    id: `${safeCampaignId}_c${world.cycle}_${Date.now()}`,
    campaignId: safeCampaignId,
    cycle: world.cycle,
    tick: world.tick,
    stateHash: world.stateHash,
    reason,
    archiveTurnSnapshot: shouldArchiveCheckpointForReason(reason, store.config.archiveTurnSnapshots),
    queuedAtIso: new Date().toISOString(),
    state: world,
  };
  store.enqueueOutbox(item);
  store.setStatus(status, null);
}

async function executeSingleCloudSave(
  world: WorldState,
  reason: CloudAutoSaveReason,
  archiveCheckpoint: boolean,
): Promise<ExwResult<string>> {
  const store = useCloudAutoSaveStore.getState();
  const fingerprint = buildSyncFingerprint(world);

  if (!auth.currentUser) {
    queueForLaterSync(world, reason, 'AUTH_REQUIRED');
    if (reason === 'MANUAL') {
      return err('EXW_ERR_AUTH_REQUIRED', 'Connexion Google requise — sauvegarde mise en file d’attente.');
    }
    return ok(sanitizeFirestoreDocId(world.campaignId, 60));
  }

  if (!isNavigatorOnline()) {
    queueForLaterSync(world, reason, 'QUEUED_OFFLINE');
    if (reason === 'MANUAL') {
      return err('EXW_ERR_SCHEMA', 'Hors ligne — sauvegarde ajoutée à la file d’attente Cloud.');
    }
    return ok(sanitizeFirestoreDocId(world.campaignId, 60));
  }

  store.setStatus('SAVING', null);
  const [saveErr, savedCampaignId] = await saveCampaignToCloud(world);
  if (saveErr || !savedCampaignId) {
    queueForLaterSync(world, reason, 'QUEUED_OFFLINE');
    store.setStatus('ERROR', saveErr?.message ?? 'Échec de synchronisation Cloud.');
    return err(saveErr?.code ?? 'EXW_ERR_SCHEMA', saveErr?.message ?? 'Échec de synchronisation Cloud.');
  }

  let checkpointId: string | null = null;
  if (archiveCheckpoint) {
    const [, cp] = await saveCloudTurnCheckpoint(world, reason);
    checkpointId = cp?.snapshotId ?? null;
  }

  store.recordSyncSuccess({
    fingerprint,
    campaignId: savedCampaignId,
    cycle: world.cycle,
    reason,
    checkpointId,
  });

  // Refresh metadata lists in background without blocking the gameplay loop
  void refreshCloudSavesAndCheckpoints(savedCampaignId, world);
  return ok(savedCampaignId);
}

export async function triggerCloudAutoSave(
  world: WorldState,
  reason: CloudAutoSaveReason,
): Promise<ExwResult<string>> {
  const store = useCloudAutoSaveStore.getState();
  const fingerprint = buildSyncFingerprint(world);

  if (!shouldTriggerCloudAutoSave(store.config, reason, store.lastSyncedFingerprint, fingerprint)) {
    return ok(sanitizeFirestoreDocId(world.campaignId, 60));
  }

  // Coalesce frequent dossier decisions to protect Firestore write quotas
  if (reason === 'DOSSIER') {
    pendingDebouncedPayload = { world, reason };
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const payload = pendingDebouncedPayload;
      pendingDebouncedPayload = null;
      debounceTimer = null;
      if (payload) {
        void runSingleFlightCloudSave(payload.world, payload.reason);
      }
    }, DOSSIER_DEBOUNCE_MS);
    return ok(sanitizeFirestoreDocId(world.campaignId, 60));
  }

  // Immediate flush cancels any stale debounced dossier timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
    pendingDebouncedPayload = null;
  }

  return runSingleFlightCloudSave(world, reason);
}

async function runSingleFlightCloudSave(
  world: WorldState,
  reason: CloudAutoSaveReason,
): Promise<ExwResult<string>> {
  if (syncInFlight) {
    queuedFollowUp = { world, reason };
    return ok(sanitizeFirestoreDocId(world.campaignId, 60));
  }

  syncInFlight = true;
  try {
    const store = useCloudAutoSaveStore.getState();
    const archiveCheckpoint = shouldArchiveCheckpointForReason(
      reason,
      store.config.archiveTurnSnapshots,
    );
    const result = await executeSingleCloudSave(world, reason, archiveCheckpoint);

    // If another save arrived while in flight, drain it immediately
    while (queuedFollowUp) {
      const next = queuedFollowUp;
      queuedFollowUp = null;
      const latestConfig = useCloudAutoSaveStore.getState().config;
      await executeSingleCloudSave(
        next.world,
        next.reason,
        shouldArchiveCheckpointForReason(next.reason, latestConfig.archiveTurnSnapshots),
      );
    }
    return result;
  } finally {
    syncInFlight = false;
  }
}

export function flushPendingDebouncedCloudSave(fallbackWorld?: WorldState): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  const payload = pendingDebouncedPayload;
  pendingDebouncedPayload = null;
  if (payload) {
    void runSingleFlightCloudSave(payload.world, 'PAGE_HIDE');
    return;
  }
  if (fallbackWorld && useCloudAutoSaveStore.getState().config.enabled) {
    const fp = buildSyncFingerprint(fallbackWorld);
    if (fp !== useCloudAutoSaveStore.getState().lastSyncedFingerprint) {
      void runSingleFlightCloudSave(fallbackWorld, 'PAGE_HIDE');
    }
  }
}

export async function flushCloudAutoSaveOutbox(
  activeWorld?: WorldState,
): Promise<{ synced: number; remaining: number }> {
  const store = useCloudAutoSaveStore.getState();
  if (!auth.currentUser || !isNavigatorOnline() || store.outbox.length === 0) {
    return { synced: 0, remaining: store.outbox.length };
  }
  if (syncInFlight) {
    return { synced: 0, remaining: store.outbox.length };
  }

  syncInFlight = true;
  let synced = 0;
  try {
    const snapshotQueue = [...store.outbox];
    for (const item of snapshotQueue) {
      const [saveErr] = await executeSingleCloudSave(
        item.state,
        item.reason,
        item.archiveTurnSnapshot,
      );
      if (saveErr) {
        break;
      }
      useCloudAutoSaveStore.getState().dequeueOutbox(item.id);
      synced += 1;
    }
    if (activeWorld && synced > 0) {
      await refreshCloudSavesAndCheckpoints(activeWorld.campaignId, activeWorld);
    }
    return { synced, remaining: useCloudAutoSaveStore.getState().outbox.length };
  } finally {
    syncInFlight = false;
  }
}

export async function refreshCloudSavesAndCheckpoints(
  activeCampaignId?: string,
  localWorld?: WorldState,
): Promise<{ campaigns: CampaignSaveMeta[]; checkpoints: CloudTurnCheckpoint[] }> {
  const store = useCloudAutoSaveStore.getState();
  if (!auth.currentUser) {
    store.setCloudCampaigns([]);
    store.setTurnCheckpoints([]);
    store.setNewerCloudCampaign(null);
    return { campaigns: [], checkpoints: [] };
  }

  const [, campaigns] = await listUserCloudCampaigns();
  const safeCampaigns = campaigns ?? [];
  store.setCloudCampaigns(safeCampaigns);

  // Detect whether a cloud campaign is newer than the active local campaign
  if (safeCampaigns.length > 0) {
    const newestCloud = safeCampaigns[0]!;
    const localPoint = localWorld
      ? {
          campaignId: sanitizeFirestoreDocId(localWorld.campaignId, 60),
          cycle: localWorld.cycle,
          tick: localWorld.tick,
          stateHash: localWorld.stateHash,
        }
      : null;
    const sameCampaignCloud = localPoint
      ? safeCampaigns.find((c) => c.campaignId === localPoint.campaignId) ?? newestCloud
      : newestCloud;
    const freshness = compareCampaignFreshness(localPoint, sameCampaignCloud);
    store.setNewerCloudCampaign(freshness === 'CLOUD_NEWER' ? sameCampaignCloud : null);
  } else {
    store.setNewerCloudCampaign(null);
  }

  let checkpoints: CloudTurnCheckpoint[] = [];
  if (activeCampaignId) {
    const [, listed] = await listCloudTurnCheckpoints(activeCampaignId);
    checkpoints = listed ?? [];
    store.setTurnCheckpoints(checkpoints);
  }

  return { campaigns: safeCampaigns, checkpoints };
}

export async function removeCloudCampaignAndRefresh(
  campaignId: string,
  activeCampaignId?: string,
  localWorld?: WorldState,
): Promise<ExwResult<string>> {
  const res = await deleteCloudCampaign(campaignId);
  if (!res[0]) {
    await refreshCloudSavesAndCheckpoints(activeCampaignId, localWorld);
  }
  return res;
}

export async function removeCloudTurnCheckpointAndRefresh(
  campaignId: string,
  snapshotId: string,
): Promise<ExwResult<string>> {
  const res = await deleteCloudTurnCheckpoint(campaignId, snapshotId);
  if (!res[0]) {
    const [, listed] = await listCloudTurnCheckpoints(campaignId);
    useCloudAutoSaveStore.getState().setTurnCheckpoints(listed ?? []);
  }
  return res;
}
