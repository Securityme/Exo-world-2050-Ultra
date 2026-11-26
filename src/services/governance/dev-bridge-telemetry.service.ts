import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import type {
  DataAgentDiagnostics,
  DevBridgeState,
  DevCommsMessage,
  TriSurfaceSyncLog,
} from '../../contracts/dev-bridge.schema.ts';
import {
  auth,
  db,
  FirestoreOperationType,
  handleFirestoreError,
} from '../firebase/firebase-client.ts';

/**
 * [L5] EXW.L5.DEV_BRIDGE_TELEMETRY | v5.1.0 | SADT A4.3
 * Data Agent Kit live audit trigger, Vercel Deploy Hook relay, and Firestore audit mirrors.
 */

export async function runDataAgentLiveAudit(): Promise<{
  readonly ok: boolean;
  readonly diagnostics?: DataAgentDiagnostics;
  readonly state?: DevBridgeState;
  readonly error?: string;
}> {
  try {
    const resp = await fetch('/api/dev-bridge/data-agent/audit', { method: 'POST' });
    const data = (await resp.json()) as {
      diagnostics?: DataAgentDiagnostics;
      state?: DevBridgeState;
      error?: string;
    };
    if (!resp.ok || !data.diagnostics) {
      return { ok: false, error: data.error ?? `HTTP ${resp.status}` };
    }
    return { ok: true, diagnostics: data.diagnostics, state: data.state };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur audit Data Agent Kit.' };
  }
}

export async function triggerVercelDeployHook(input: {
  readonly hookUrl?: string;
  readonly projectUrl?: string;
}): Promise<{
  readonly ok: boolean;
  readonly jobId?: string;
  readonly jobState?: string;
  readonly state?: DevBridgeState;
  readonly error?: string;
}> {
  try {
    const resp = await fetch('/api/dev-bridge/vercel/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = (await resp.json()) as {
      ok?: boolean;
      jobId?: string;
      jobState?: string;
      state?: DevBridgeState;
      error?: string;
    };
    if (!resp.ok || !data.ok) {
      return { ok: false, error: data.error ?? `HTTP ${resp.status}` };
    }
    return { ok: true, jobId: data.jobId, jobState: data.jobState, state: data.state };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur Vercel Deploy Hook.' };
  }
}

export async function mirrorCommsMessageToFirestore(message: DevCommsMessage): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const safeId = message.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 96);
  try {
    await setDoc(doc(db, 'devCommsMessages', safeId), {
      messageId: safeId,
      ownerId: user.uid,
      sender: message.sender,
      target: message.target,
      kind: message.kind,
      content: message.content.slice(0, 2000),
      linkedPath: message.linkedPath.slice(0, 180),
      linkedDocId: message.linkedDocId.slice(0, 80),
      shaDigest: message.shaDigest.slice(0, 64),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, FirestoreOperationType.WRITE, `devCommsMessages/${safeId}`);
  }
}

export async function mirrorSyncLogToFirestore(log: TriSurfaceSyncLog): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const safeId = log.syncId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 96);
  try {
    await setDoc(doc(db, 'surfaceSyncLogs', safeId), {
      syncId: safeId,
      ownerId: user.uid,
      relativePath: log.relativePath.slice(0, 180),
      contentSha256: log.contentSha256.slice(0, 128),
      commitSummary: log.commitSummary.slice(0, 240),
      aiStudioStatus: log.aiStudio.status,
      driveStatus: log.drive.status,
      githubStatus: log.github.status,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, FirestoreOperationType.WRITE, `surfaceSyncLogs/${safeId}`);
  }
}
