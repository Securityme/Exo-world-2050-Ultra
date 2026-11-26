import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { err, ok, type ExwResult } from '../../contracts/trigger-bus.schema.ts';
import {
  UserContext3DSchema,
  type UserContext3D,
} from '../../contracts/user-context.schema.ts';
import type { TurnSnapshot } from '../../contracts/v4-systems.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import {
  buildTurnCheckpointRecord,
  sanitizeFirestoreDocId,
  stripUndefinedDeep,
  type CloudAutoSaveReason,
} from '../../utils/cloud-autosave-policy.ts';
import {
  auth,
  db,
  FirestoreOperationType,
  handleFirestoreError,
} from './firebase-client.ts';

/**
 * [L5] EXW.L5.FIRESTORE_ARCHIVES | v5.1.0 | SADT A5.1
 * Persists append-only turn_snapshots (with full WorldState checkpoints for rewind),
 * Google Picker Drive links, 3D User Context (players/{uid}/context/primary),
 * and Meta Honors (players/{uid}/metaHonors/showcase).
 */

export interface DriveLinkItem {
  readonly linkId: string;
  readonly campaignId: string;
  readonly fileId: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly webViewLink: string;
}

export interface CloudTurnCheckpoint {
  readonly snapshotId: string;
  readonly campaignId: string;
  readonly cycle: number;
  readonly year: number;
  readonly season: string;
  readonly era: number;
  readonly stateHash: string;
  readonly combatCount: number;
  readonly reason: CloudAutoSaveReason;
  readonly createdAtIso: string | null;
  readonly checkpointIncluded: boolean;
  readonly worldState?: WorldState;
}

function sanitizeDocId(raw: string, maxLen: number): string {
  return sanitizeFirestoreDocId(raw, maxLen);
}

function toIsoTimestamp(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

export async function saveTurnSnapshotToFirestore(
  campaignId: string,
  snapshot: TurnSnapshot,
): Promise<ExwResult<string>> {
  const user = auth.currentUser;
  if (!user) {
    return err('EXW_ERR_AUTH_REQUIRED', 'Connexion Google requise pour archiver le snapshot dans Firestore.');
  }
  const safeCampaignId = sanitizeDocId(campaignId, 60);
  const safeSnapshotId = sanitizeDocId(
    `t${snapshot.cycle}_${snapshot.stateHash.slice(0, 12)}`,
    80,
  );
  const path = `campaigns/${safeCampaignId}/turnSnapshots/${safeSnapshotId}`;
  const ref = doc(db, 'campaigns', safeCampaignId, 'turnSnapshots', safeSnapshotId);

  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      return ok(safeSnapshotId);
    }
    await setDoc(ref, {
      snapshotId: safeSnapshotId,
      campaignId: safeCampaignId,
      ownerId: user.uid,
      cycle: Math.max(0, Math.floor(snapshot.cycle)),
      stateHash: snapshot.stateHash.slice(0, 128),
      combatCount: Math.min(500, snapshot.combatReports.length),
      snapshot: stripUndefinedDeep(snapshot),
      createdAt: serverTimestamp(),
    });
    return ok(safeSnapshotId);
  } catch (error) {
    const detail = handleFirestoreError(error, FirestoreOperationType.CREATE, path);
    return err('EXW_ERR_SCHEMA', detail);
  }
}

export async function saveCloudTurnCheckpoint(
  state: WorldState,
  reason: CloudAutoSaveReason,
): Promise<ExwResult<{ snapshotId: string; checkpointIncluded: boolean }>> {
  const user = auth.currentUser;
  if (!user) {
    return err('EXW_ERR_AUTH_REQUIRED', 'Connexion Google requise pour archiver ce tour dans le Cloud.');
  }
  const record = buildTurnCheckpointRecord(state, reason);
  const path = `campaigns/${record.campaignId}/turnSnapshots/${record.snapshotId}`;
  const ref = doc(db, 'campaigns', record.campaignId, 'turnSnapshots', record.snapshotId);

  try {
    // turnSnapshots are append-only (allow update: if false) — skip if already archived
    const existing = await getDoc(ref);
    if (existing.exists()) {
      return ok({ snapshotId: record.snapshotId, checkpointIncluded: record.checkpointIncluded });
    }
    await setDoc(ref, {
      snapshotId: record.snapshotId,
      campaignId: record.campaignId,
      ownerId: user.uid,
      cycle: record.cycle,
      stateHash: record.stateHash,
      combatCount: record.combatCount,
      snapshot: record.snapshot,
      createdAt: serverTimestamp(),
    });
    return ok({ snapshotId: record.snapshotId, checkpointIncluded: record.checkpointIncluded });
  } catch (error) {
    const detail = handleFirestoreError(error, FirestoreOperationType.CREATE, path);
    return err('EXW_ERR_SCHEMA', detail);
  }
}

export async function listCloudTurnCheckpoints(
  campaignId: string,
): Promise<ExwResult<CloudTurnCheckpoint[]>> {
  const user = auth.currentUser;
  if (!user) return ok([]);
  const safeCampaignId = sanitizeDocId(campaignId, 60);
  const path = `campaigns/${safeCampaignId}/turnSnapshots`;

  try {
    const q = query(
      collection(db, 'campaigns', safeCampaignId, 'turnSnapshots'),
      where('ownerId', '==', user.uid),
    );
    const snaps = await getDocs(q);
    const results: CloudTurnCheckpoint[] = snaps.docs
      .map((d) => {
        const data = d.data();
        const snapMap = (data.snapshot ?? {}) as Partial<TurnSnapshot> & {
          reason?: CloudAutoSaveReason;
          checkpointIncluded?: boolean;
          worldState?: WorldState;
        };
        const worldState = snapMap.worldState;
        return {
          snapshotId: String(data.snapshotId ?? d.id),
          campaignId: String(data.campaignId ?? safeCampaignId),
          cycle: Number(data.cycle ?? snapMap.cycle ?? 0),
          year: Number(snapMap.year ?? 2050),
          season: String(snapMap.season ?? 'PRINTEMPS'),
          era: Number(snapMap.era ?? 1),
          stateHash: String(data.stateHash ?? snapMap.stateHash ?? ''),
          combatCount: Number(data.combatCount ?? 0),
          reason: snapMap.reason ?? 'TURN_END',
          createdAtIso: toIsoTimestamp(data.createdAt),
          checkpointIncluded: Boolean(snapMap.checkpointIncluded && worldState),
          worldState,
        };
      })
      .sort((a, b) => {
        if (b.cycle !== a.cycle) return b.cycle - a.cycle;
        if (a.createdAtIso && b.createdAtIso) return b.createdAtIso.localeCompare(a.createdAtIso);
        return 0;
      });
    return ok(results);
  } catch (error) {
    const detail = handleFirestoreError(error, FirestoreOperationType.LIST, path);
    return err('EXW_ERR_SCHEMA', detail);
  }
}

export async function deleteCloudTurnCheckpoint(
  campaignId: string,
  snapshotId: string,
): Promise<ExwResult<string>> {
  const user = auth.currentUser;
  if (!user) return err('EXW_ERR_AUTH_REQUIRED', 'Connexion Google requise.');
  const safeCampaignId = sanitizeDocId(campaignId, 60);
  const safeSnapshotId = sanitizeDocId(snapshotId, 80);
  const path = `campaigns/${safeCampaignId}/turnSnapshots/${safeSnapshotId}`;

  try {
    await deleteDoc(doc(db, 'campaigns', safeCampaignId, 'turnSnapshots', safeSnapshotId));
    return ok(safeSnapshotId);
  } catch (error) {
    const detail = handleFirestoreError(error, FirestoreOperationType.DELETE, path);
    return err('EXW_ERR_SCHEMA', detail);
  }
}

export async function listTurnSnapshotsFromFirestore(
  campaignId: string,
): Promise<ExwResult<TurnSnapshot[]>> {
  const user = auth.currentUser;
  if (!user) return ok([]);
  const safeCampaignId = sanitizeDocId(campaignId, 60);
  const path = `campaigns/${safeCampaignId}/turnSnapshots`;

  try {
    const q = query(
      collection(db, 'campaigns', safeCampaignId, 'turnSnapshots'),
      where('ownerId', '==', user.uid),
    );
    const snaps = await getDocs(q);
    const results: TurnSnapshot[] = snaps.docs
      .map((d) => d.data().snapshot as TurnSnapshot | undefined)
      .filter((item): item is TurnSnapshot => Boolean(item && typeof item.cycle === 'number'))
      .sort((a, b) => b.cycle - a.cycle);
    return ok(results);
  } catch (error) {
    const detail = handleFirestoreError(error, FirestoreOperationType.LIST, path);
    return err('EXW_ERR_SCHEMA', detail);
  }
}

export async function saveDriveLinkToFirestore(
  campaignId: string,
  file: {
    readonly id: string;
    readonly name: string;
    readonly mimeType: string;
    readonly url?: string;
  },
): Promise<ExwResult<string>> {
  const user = auth.currentUser;
  if (!user) {
    return err('EXW_ERR_AUTH_REQUIRED', 'Connexion Google requise pour lier ce fichier Drive à la campagne.');
  }
  const safeCampaignId = sanitizeDocId(campaignId, 60);
  const safeLinkId = sanitizeDocId(`drv_${file.id}`, 128);
  const path = `campaigns/${safeCampaignId}/driveLinks/${safeLinkId}`;
  const safeUrl = file.url && file.url.startsWith('https://') ? file.url.slice(0, 512) : '';

  try {
    await setDoc(doc(db, 'campaigns', safeCampaignId, 'driveLinks', safeLinkId), {
      linkId: safeLinkId,
      campaignId: safeCampaignId,
      ownerId: user.uid,
      fileId: file.id.slice(0, 128),
      fileName: file.name.slice(0, 200),
      mimeType: file.mimeType.slice(0, 120),
      webViewLink: safeUrl,
      createdAt: serverTimestamp(),
    });
    return ok(safeLinkId);
  } catch (error) {
    const detail = handleFirestoreError(error, FirestoreOperationType.CREATE, path);
    return err('EXW_ERR_SCHEMA', detail);
  }
}

export async function listDriveLinksFromFirestore(
  campaignId: string,
): Promise<ExwResult<DriveLinkItem[]>> {
  const user = auth.currentUser;
  if (!user) return ok([]);
  const safeCampaignId = sanitizeDocId(campaignId, 60);
  const path = `campaigns/${safeCampaignId}/driveLinks`;

  try {
    const q = query(
      collection(db, 'campaigns', safeCampaignId, 'driveLinks'),
      where('ownerId', '==', user.uid),
    );
    const snaps = await getDocs(q);
    const items: DriveLinkItem[] = snaps.docs.map((d) => {
      const data = d.data();
      return {
        linkId: String(data.linkId ?? d.id),
        campaignId: String(data.campaignId ?? safeCampaignId),
        fileId: String(data.fileId ?? ''),
        fileName: String(data.fileName ?? 'Fichier Drive'),
        mimeType: String(data.mimeType ?? 'application/octet-stream'),
        webViewLink: String(data.webViewLink ?? ''),
      };
    });
    return ok(items);
  } catch (error) {
    const detail = handleFirestoreError(error, FirestoreOperationType.LIST, path);
    return err('EXW_ERR_SCHEMA', detail);
  }
}

export async function saveUserContext3DToFirestore(
  ctx: UserContext3D,
): Promise<ExwResult<string>> {
  const user = auth.currentUser;
  if (!user) {
    return err('EXW_ERR_AUTH_REQUIRED', 'Connexion Google requise pour synchroniser le contexte 3D.');
  }
  const safeContextId = sanitizeDocId(ctx.contextId || 'primary', 60);
  const path = `players/${user.uid}/context/${safeContextId}`;

  try {
    await setDoc(doc(db, 'players', user.uid, 'context', safeContextId), {
      contextId: safeContextId,
      ownerId: user.uid,
      shellUxHabits: ctx.shellUxHabits,
      displaySettingsProfile: ctx.displaySettingsProfile,
      simulationTraceabilityProfile: ctx.simulationTraceabilityProfile,
      updatedAt: serverTimestamp(),
    });
    return ok(safeContextId);
  } catch (error) {
    const detail = handleFirestoreError(error, FirestoreOperationType.WRITE, path);
    return err('EXW_ERR_SCHEMA', detail);
  }
}

export async function loadUserContext3DFromFirestore(
  contextId = 'primary',
): Promise<ExwResult<UserContext3D | null>> {
  const user = auth.currentUser;
  if (!user) return ok(null);
  const safeContextId = sanitizeDocId(contextId, 60);
  const path = `players/${user.uid}/context/${safeContextId}`;

  try {
    const snap = await getDoc(doc(db, 'players', user.uid, 'context', safeContextId));
    if (!snap.exists()) return ok(null);
    const data = snap.data();
    const parsed = UserContext3DSchema.safeParse({
      contextId: data.contextId ?? safeContextId,
      shellUxHabits: data.shellUxHabits,
      displaySettingsProfile: data.displaySettingsProfile,
      simulationTraceabilityProfile: data.simulationTraceabilityProfile,
      updatedAtIso: new Date().toISOString(),
    });
    return parsed.success ? ok(parsed.data) : ok(null);
  } catch (error) {
    const detail = handleFirestoreError(error, FirestoreOperationType.GET, path);
    return err('EXW_ERR_SCHEMA', detail);
  }
}

export async function saveMetaHonorsToFirestore(
  payload: Record<string, unknown>,
  honorsId = 'showcase',
): Promise<ExwResult<string>> {
  const user = auth.currentUser;
  if (!user) {
    return err('EXW_ERR_AUTH_REQUIRED', 'Connexion Google requise pour synchroniser les honneurs.');
  }
  const safeHonorsId = sanitizeDocId(honorsId, 60);
  const path = `players/${user.uid}/metaHonors/${safeHonorsId}`;

  try {
    await setDoc(doc(db, 'players', user.uid, 'metaHonors', safeHonorsId), {
      honorsId: safeHonorsId,
      ownerId: user.uid,
      payload,
      updatedAt: serverTimestamp(),
    });
    return ok(safeHonorsId);
  } catch (error) {
    const detail = handleFirestoreError(error, FirestoreOperationType.WRITE, path);
    return err('EXW_ERR_SCHEMA', detail);
  }
}

export async function loadMetaHonorsFromFirestore(
  honorsId = 'showcase',
): Promise<ExwResult<Record<string, unknown> | null>> {
  const user = auth.currentUser;
  if (!user) return ok(null);
  const safeHonorsId = sanitizeDocId(honorsId, 60);
  const path = `players/${user.uid}/metaHonors/${safeHonorsId}`;

  try {
    const snap = await getDoc(doc(db, 'players', user.uid, 'metaHonors', safeHonorsId));
    if (!snap.exists()) return ok(null);
    const data = snap.data();
    return ok((data.payload as Record<string, unknown>) ?? null);
  } catch (error) {
    const detail = handleFirestoreError(error, FirestoreOperationType.GET, path);
    return err('EXW_ERR_SCHEMA', detail);
  }
}
