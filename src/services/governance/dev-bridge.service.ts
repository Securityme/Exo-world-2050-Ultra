import {
  DevBridgeStateSchema,
  type DevBridgeState,
  type DevCommsKind,
  type DevCommsMessage,
  type DevSurfaceActor,
  type SurfaceWriteResult,
  type TriSurfaceSyncLog,
} from '../../contracts/dev-bridge.schema.ts';
import { saveFileToGoogleDrive } from '../../doc-sync/drive-docs.service.ts';
import { createInitialDevBridgeState } from '../../systems/governance/dev-bridge.engine.ts';
import { getWorkspaceAccessToken } from '../firebase/firebase-client.ts';
import {
  mirrorCommsMessageToFirestore,
  mirrorSyncLogToFirestore,
  runDataAgentLiveAudit,
  triggerVercelDeployHook,
} from './dev-bridge-telemetry.service.ts';

export { runDataAgentLiveAudit, triggerVercelDeployHook };

/**
 * [L5] EXW.L5.DEV_BRIDGE_SERVICE | v5.1.0 | SADT A4.3
 * Client orchestration for the Dev & Multi-Surface Connectivity Space (<= 300 lines R-14):
 * - In-memory GitHub OAuth / PAT session token (never written to localStorage/sessionStorage)
 * - Simultaneous confirmed Tri-Surface write (AI Studio local + Google Drive + GitHub)
 */

let githubTokenInMemory: string | null = null;
let githubLoginInMemory: string | null = null;

export function getGithubSessionAuth(): { readonly connected: boolean; readonly login: string | null } {
  return {
    connected: Boolean(githubTokenInMemory),
    login: githubLoginInMemory,
  };
}

export function setGithubSessionTokenInMemory(token: string | null, login?: string | null): void {
  const cleaned = token?.trim() ?? '';
  githubTokenInMemory = cleaned.length > 0 ? cleaned : null;
  githubLoginInMemory = cleaned.length > 0 ? (login?.trim() || 'session-pat') : null;
}

export async function fetchDevBridgeState(): Promise<DevBridgeState> {
  try {
    const resp = await fetch('/api/dev-bridge/state');
    if (resp.ok) {
      const parsed = DevBridgeStateSchema.safeParse(await resp.json());
      if (parsed.success) return parsed.data;
    }
  } catch {
    // Fallback cleanly in static mode
  }
  return createInitialDevBridgeState();
}

export async function readWorkspaceTextFile(relativePath: string): Promise<{
  readonly ok: boolean;
  readonly content?: string;
  readonly error?: string;
}> {
  try {
    const resp = await fetch(`/api/dev-bridge/workspace/read?path=${encodeURIComponent(relativePath)}`);
    const data = (await resp.json()) as { content?: string; error?: string };
    if (!resp.ok || typeof data.content !== 'string') {
      return { ok: false, error: data.error ?? `HTTP ${resp.status}` };
    }
    return { ok: true, content: data.content };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur lecture workspace.' };
  }
}

export async function postDevCommsMessage(input: {
  readonly sender: DevSurfaceActor;
  readonly target: DevSurfaceActor;
  readonly kind: DevCommsKind;
  readonly content: string;
  readonly linkedPath?: string;
  readonly linkedDocId?: string;
}): Promise<{ readonly ok: boolean; readonly state?: DevBridgeState; readonly error?: string }> {
  try {
    const resp = await fetch('/api/dev-bridge/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = (await resp.json()) as {
      message?: DevCommsMessage;
      state?: DevBridgeState;
      error?: string;
    };
    if (!resp.ok || !data.state) {
      return { ok: false, error: data.error ?? `HTTP ${resp.status}` };
    }
    if (data.message) {
      void mirrorCommsMessageToFirestore(data.message);
    }
    return { ok: true, state: data.state };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur envoi message bus.' };
  }
}

export async function startGithubOAuthPopup(): Promise<{
  readonly ok: boolean;
  readonly url?: string;
  readonly callbackUrl?: string;
  readonly error?: string;
}> {
  try {
    const resp = await fetch('/api/auth/github/url');
    const data = (await resp.json()) as {
      configured?: boolean;
      url?: string;
      callbackUrl?: string;
      error?: string;
    };
    if (!resp.ok || !data.configured || !data.url) {
      return {
        ok: false,
        callbackUrl: data.callbackUrl,
        error:
          data.error ??
          'OAuth GitHub serveur non configuré (.env). Utilisez le champ Jeton Session Mémoire ci-dessous.',
      };
    }
    return { ok: true, url: data.url, callbackUrl: data.callbackUrl };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur OAuth GitHub.' };
  }
}

export async function executeTriSurfaceSave(input: {
  readonly relativePath: string;
  readonly content: string;
  readonly commitSummary: string;
  readonly driveFileId?: string | null;
}): Promise<{ readonly log: TriSurfaceSyncLog; readonly nextState?: DevBridgeState }> {
  const nowIso = new Date().toISOString();
  const syncId = `sync_${nowIso.replace(/[^a-zA-Z0-9]/g, '').slice(0, 18)}`;
  const fileName = input.relativePath.split('/').pop() ?? 'exo-doc.md';

  const writeLocal = async (): Promise<SurfaceWriteResult & { sha?: string }> => {
    try {
      const resp = await fetch('/api/dev-bridge/workspace/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relativePath: input.relativePath, content: input.content }),
      });
      const data = (await resp.json()) as { ok?: boolean; sha256?: string; bytes?: number; error?: string };
      if (!resp.ok || !data.ok) {
        return { status: 'ERROR', detail: data.error ?? `HTTP ${resp.status}`, referenceUrl: '', referenceShaOrId: '' };
      }
      return {
        status: 'SUCCESS',
        detail: `${input.relativePath} écrit (${data.bytes ?? 0} o)`,
        referenceUrl: '',
        referenceShaOrId: (data.sha256 ?? '').slice(0, 12),
        sha: data.sha256,
      };
    } catch (err) {
      return {
        status: 'ERROR',
        detail: err instanceof Error ? err.message : 'Échec écriture AI Studio local.',
        referenceUrl: '',
        referenceShaOrId: '',
      };
    }
  };

  const writeDrive = async (): Promise<SurfaceWriteResult> => {
    if (!getWorkspaceAccessToken()) {
      return {
        status: 'AUTH_REQUIRED',
        detail: 'Connectez Google Drive pour enregistrer sur Drive.',
        referenceUrl: '',
        referenceShaOrId: '',
      };
    }
    const [err, res] = await saveFileToGoogleDrive({
      fileName,
      mimeType: fileName.endsWith('.json') ? 'application/json' : 'text/markdown',
      content: input.content,
      existingFileId: input.driveFileId,
    });
    if (err || !res) {
      return { status: 'ERROR', detail: err?.message ?? 'Erreur Drive.', referenceUrl: '', referenceShaOrId: '' };
    }
    return {
      status: 'SUCCESS',
      detail: `Enregistré sur Drive (${fileName})`,
      referenceUrl: res.webViewLink,
      referenceShaOrId: res.fileId,
    };
  };

  const writeGithub = async (): Promise<SurfaceWriteResult> => {
    if (!githubTokenInMemory) {
      return {
        status: 'AUTH_REQUIRED',
        detail: 'Connectez GitHub (OAuth popup ou jeton session mémoire).',
        referenceUrl: '',
        referenceShaOrId: '',
      };
    }
    try {
      const resp = await fetch('/api/dev-bridge/github/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${githubTokenInMemory}`,
        },
        body: JSON.stringify({
          relativePath: input.relativePath,
          content: input.content,
          commitMessage: input.commitSummary,
        }),
      });
      const data = (await resp.json()) as {
        ok?: boolean;
        commitSha?: string;
        commitUrl?: string;
        error?: string;
      };
      if (!resp.ok || !data.ok) {
        return { status: 'ERROR', detail: data.error ?? `GitHub HTTP ${resp.status}`, referenceUrl: '', referenceShaOrId: '' };
      }
      return {
        status: 'SUCCESS',
        detail: `Commit GitHub poussé (${(data.commitSha ?? '').slice(0, 7)})`,
        referenceUrl: data.commitUrl ?? '',
        referenceShaOrId: (data.commitSha ?? '').slice(0, 12),
      };
    } catch (err) {
      return {
        status: 'ERROR',
        detail: err instanceof Error ? err.message : 'Erreur commit GitHub.',
        referenceUrl: '',
        referenceShaOrId: '',
      };
    }
  };

  const [aiStudio, drive, github] = await Promise.all([writeLocal(), writeDrive(), writeGithub()]);
  const log: TriSurfaceSyncLog = {
    syncId,
    relativePath: input.relativePath,
    contentSha256: aiStudio.sha ?? aiStudio.referenceShaOrId ?? '00000000',
    commitSummary: input.commitSummary,
    createdAtIso: nowIso,
    aiStudio: {
      status: aiStudio.status,
      detail: aiStudio.detail,
      referenceUrl: aiStudio.referenceUrl,
      referenceShaOrId: aiStudio.referenceShaOrId,
    },
    drive,
    github,
  };

  void mirrorSyncLogToFirestore(log);

  try {
    const logResp = await fetch('/api/dev-bridge/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    if (logResp.ok) {
      const json = (await logResp.json()) as { state?: DevBridgeState };
      return { log, nextState: json.state };
    }
  } catch {
    // Non-fatal
  }
  return { log };
}
