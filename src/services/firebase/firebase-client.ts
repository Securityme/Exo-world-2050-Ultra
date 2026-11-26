import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';
import { err, ok, type ExwResult } from '../../contracts/trigger-bus.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import {
  sanitizeCampaignForFirestore,
  sanitizeFirestoreDocId,
} from '../../utils/cloud-autosave-policy.ts';

/**
 * [L5] FUP-004 / FUP-008 | SM-01 | SADT A5.1
 * Single Firebase Auth + Firestore instance.
 * Enforces strict separation: Game Auth uses standard Google Sign-In, while
 * Google Drive/Docs OAuth scopes are requested ONLY on explicit action inside src/doc-sync/.
 * Access tokens live strictly in memory and are cleared on auth state changes.
 */
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const firestoreDatabaseId =
  (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId ??
  'ai-studio-a21d5e66-3b0e-4b54-9e77-3a272b3c94d1';
export const db = getFirestore(app, firestoreDatabaseId);

let workspaceAccessTokenInMemory: string | null = null;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    workspaceAccessTokenInMemory = null;
  }
});

export function subscribeAuthState(listener: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, listener);
}

export function getWorkspaceAccessToken(): string | null {
  return workspaceAccessTokenInMemory;
}

export function clearWorkspaceAccessToken(): void {
  workspaceAccessTokenInMemory = null;
}

export enum FirestoreOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  readonly error: string;
  readonly operationType: FirestoreOperationType;
  readonly path: string | null;
  readonly authInfo: {
    readonly userId: string | undefined;
    readonly email: string | null | undefined;
    readonly emailVerified: boolean | undefined;
    readonly isAnonymous: boolean | undefined;
    readonly tenantId: string | null | undefined;
    readonly providerInfo: ReadonlyArray<{
      readonly providerId: string;
      readonly displayName: string | null;
      readonly email: string | null;
      readonly photoUrl: string | null;
    }>;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: FirestoreOperationType,
  path: string | null,
): string {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) ?? [],
    },
    operationType,
    path,
  };
  const serialized = JSON.stringify(errInfo);
  console.error('Firestore Error:', serialized);
  return serialized;
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Firestore client appears offline.');
      return false;
    }
    return true;
  }
}

export async function signInWithGoogleGameAuth(): Promise<ExwResult<User>> {
  try {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    await ensurePlayerProfile(res.user);
    return ok(res.user);
  } catch (error) {
    return err('EXW_ERR_AUTH_REQUIRED', error instanceof Error ? error.message : 'Échec de connexion Google.');
  }
}

export const GOOGLE_WORKSPACE_PICKER_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/documents',
] as const;

/**
 * Isolated Workspace & Google Picker OAuth popup.
 * Access token is kept strictly in memory and cleared on sign-out.
 */
export async function connectGoogleWorkspaceDocsOAuth(): Promise<ExwResult<{ user: User; accessToken: string }>> {
  try {
    const provider = new GoogleAuthProvider();
    for (const scope of GOOGLE_WORKSPACE_PICKER_SCOPES) {
      provider.addScope(scope);
    }
    provider.setCustomParameters({ prompt: 'consent' });
    const res = await signInWithPopup(auth, provider);
    const cred = GoogleAuthProvider.credentialFromResult(res);
    const token = cred?.accessToken ?? null;
    if (!token) {
      return err('EXW_ERR_DOC_SYNC', 'Jeton OAuth Google Workspace introuvable après autorisation.');
    }
    workspaceAccessTokenInMemory = token;
    return ok({ user: res.user, accessToken: token });
  } catch (error) {
    return err('EXW_ERR_DOC_SYNC', error instanceof Error ? error.message : 'Autorisation Drive/Docs annulée.');
  }
}

export async function signOutExoUser(): Promise<void> {
  workspaceAccessTokenInMemory = null;
  await signOut(auth);
}

async function ensurePlayerProfile(user: User): Promise<void> {
  const ref = doc(db, 'players', user.uid);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        displayName: (user.displayName ?? user.email ?? 'Joueur').slice(0, 80),
        xpTotal: 0,
        campaignsCompleted: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, FirestoreOperationType.WRITE, `players/${user.uid}`);
  }
}

export interface CampaignSaveMeta {
  readonly campaignId: string;
  readonly superpowerId: string;
  readonly worldSeed: string;
  readonly era: number;
  readonly cycle: number;
  readonly tick: number;
  readonly atmosphereTier: string;
  readonly stateHash: string;
  readonly updatedAtIso: string | null;
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

export async function saveCampaignToCloud(state: WorldState): Promise<ExwResult<string>> {
  const user = auth.currentUser;
  if (!user) {
    return err('EXW_ERR_AUTH_REQUIRED', 'Connexion Google requise pour sauvegarder sur le Cloud.');
  }
  const payload = sanitizeCampaignForFirestore(state);
  const ref = doc(db, 'campaigns', payload.campaignId);
  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await updateDoc(ref, {
        era: payload.era,
        cycle: payload.cycle,
        tick: payload.tick,
        atmosphereTier: payload.atmosphereTier,
        stateHash: payload.stateHash,
        snapshot: payload.snapshot,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        campaignId: payload.campaignId,
        ownerId: user.uid,
        worldSeed: payload.worldSeed,
        superpowerId: payload.superpowerId,
        era: payload.era,
        cycle: payload.cycle,
        tick: payload.tick,
        atmosphereTier: payload.atmosphereTier,
        stateHash: payload.stateHash,
        snapshot: payload.snapshot,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return ok(payload.campaignId);
  } catch (error) {
    const detail = handleFirestoreError(
      error,
      FirestoreOperationType.WRITE,
      `campaigns/${payload.campaignId}`,
    );
    return err('EXW_ERR_SCHEMA', detail);
  }
}

export async function listUserCloudCampaigns(): Promise<ExwResult<CampaignSaveMeta[]>> {
  const user = auth.currentUser;
  if (!user) return ok([]);
  try {
    const q = query(collection(db, 'campaigns'), where('ownerId', '==', user.uid));
    const snaps = await getDocs(q);
    const items: CampaignSaveMeta[] = snaps.docs
      .map((d) => {
        const data = d.data();
        return {
          campaignId: String(data.campaignId ?? d.id),
          superpowerId: String(data.superpowerId ?? 'sp-uea'),
          worldSeed: String(data.worldSeed ?? '20500409'),
          era: Number(data.era ?? 1),
          cycle: Number(data.cycle ?? 0),
          tick: Number(data.tick ?? 0),
          atmosphereTier: String(data.atmosphereTier ?? 'P1'),
          stateHash: String(data.stateHash ?? ''),
          updatedAtIso: toIsoTimestamp(data.updatedAt),
        };
      })
      .sort((a, b) => {
        if (a.updatedAtIso && b.updatedAtIso && a.updatedAtIso !== b.updatedAtIso) {
          return b.updatedAtIso.localeCompare(a.updatedAtIso);
        }
        return b.cycle - a.cycle || b.tick - a.tick;
      });
    return ok(items);
  } catch (error) {
    const detail = handleFirestoreError(error, FirestoreOperationType.LIST, 'campaigns');
    return err('EXW_ERR_SCHEMA', detail);
  }
}

export async function loadCloudCampaign(campaignId: string): Promise<ExwResult<WorldState>> {
  const user = auth.currentUser;
  if (!user) return err('EXW_ERR_AUTH_REQUIRED', 'Connexion requise.');
  const safeId = sanitizeFirestoreDocId(campaignId, 60);
  try {
    const snap = await getDoc(doc(db, 'campaigns', safeId));
    if (!snap.exists()) return err('EXW_ERR_SCHEMA', 'Campagne introuvable.');
    const data = snap.data();
    return ok(data.snapshot as WorldState);
  } catch (error) {
    const detail = handleFirestoreError(error, FirestoreOperationType.GET, `campaigns/${safeId}`);
    return err('EXW_ERR_SCHEMA', detail);
  }
}

export async function deleteCloudCampaign(campaignId: string): Promise<ExwResult<string>> {
  const user = auth.currentUser;
  if (!user) return err('EXW_ERR_AUTH_REQUIRED', 'Connexion requise.');
  const safeId = sanitizeFirestoreDocId(campaignId, 60);
  try {
    await deleteDoc(doc(db, 'campaigns', safeId));
    return ok(safeId);
  } catch (error) {
    const detail = handleFirestoreError(error, FirestoreOperationType.DELETE, `campaigns/${safeId}`);
    return err('EXW_ERR_SCHEMA', detail);
  }
}
