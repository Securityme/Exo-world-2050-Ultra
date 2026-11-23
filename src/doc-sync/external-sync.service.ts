import {
  GEMINI_NOTEBOOK_ID,
  GEMINI_NOTEBOOK_URL,
  GITHUB_REPO_BRANCH,
  GITHUB_REPO_NAME,
  GITHUB_REPO_OWNER,
  GITHUB_REPO_URL,
  GITHUB_SYNC_BASELINE_SHA,
} from './sot-manifest.ts';

/**
 * [L5 — EXTERNAL SYNC SERVICE (GITHUB + GEMINI NOTEBOOK)]
 * Pure parity evaluation helpers + Result-Pattern client fetcher against /api/sync/external-sources.
 */
export type GithubParityState = 'SYNCED' | 'REMOTE_AHEAD' | 'UNREACHABLE';

export interface GithubSyncReport {
  readonly repoFullName: string;
  readonly repoUrl: string;
  readonly branch: string;
  readonly baselineSha: string;
  readonly remoteSha: string | null;
  readonly remoteCommitDate: string | null;
  readonly remoteCommitMessage: string | null;
  readonly parity: GithubParityState;
  readonly description: string | null;
  readonly checkedAtIso: string;
  readonly errorDetail?: string;
}

export interface GeminiNotebookSyncReport {
  readonly notebookId: string;
  readonly notebookUrl: string;
  readonly status: 'AUTH_REQUIRED';
  readonly reason: string;
}

export interface ExternalSyncSnapshot {
  readonly github: GithubSyncReport;
  readonly geminiNotebook: GeminiNotebookSyncReport;
}

export interface ImportedNotebookNote {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly charCount: number;
  readonly sourceUrl: string;
  readonly importedAtIso: string;
}

export function evaluateGithubParity(
  baselineSha: string,
  remoteSha: string | null | undefined,
): GithubParityState {
  const cleanRemote = remoteSha?.trim() ?? '';
  if (!cleanRemote) return 'UNREACHABLE';
  const cleanBase = baselineSha.trim().toLowerCase();
  const normalizedRemote = cleanRemote.toLowerCase();
  if (normalizedRemote === cleanBase || normalizedRemote.startsWith(cleanBase) || cleanBase.startsWith(normalizedRemote)) {
    return 'SYNCED';
  }
  return 'REMOTE_AHEAD';
}

export function parseNotebookImportText(
  rawTitle: string,
  rawBody: string,
  nowIso: string = new Date().toISOString(),
): [Error, null] | [null, ImportedNotebookNote] {
  const body = rawBody.trim();
  if (body.length < 10) {
    return [new Error('Collez au moins 10 caractères exportés depuis le Notebook Gemini.'), null];
  }
  const title = rawTitle.trim() || `Extrait Notebook Gemini (${GEMINI_NOTEBOOK_ID.slice(0, 8)})`;
  return [
    null,
    {
      id: `notebook-${nowIso}`,
      title: title.slice(0, 120),
      body: body.slice(0, 20_000),
      charCount: body.length,
      sourceUrl: GEMINI_NOTEBOOK_URL,
      importedAtIso: nowIso,
    },
  ];
}

export function buildFallbackExternalSyncSnapshot(errorDetail?: string): ExternalSyncSnapshot {
  return {
    github: {
      repoFullName: `${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`,
      repoUrl: GITHUB_REPO_URL,
      branch: GITHUB_REPO_BRANCH,
      baselineSha: GITHUB_SYNC_BASELINE_SHA,
      remoteSha: null,
      remoteCommitDate: null,
      remoteCommitMessage: null,
      parity: 'UNREACHABLE',
      description: null,
      checkedAtIso: new Date().toISOString(),
      errorDetail,
    },
    geminiNotebook: {
      notebookId: GEMINI_NOTEBOOK_ID,
      notebookUrl: GEMINI_NOTEBOOK_URL,
      status: 'AUTH_REQUIRED',
      reason:
        'Un Notebook Gemini privé nécessite une session Google authentifiée ; utilisez le lien direct ou importez un extrait texte ci-dessous.',
    },
  };
}

export async function fetchExternalSyncStatus(): Promise<[Error, null] | [null, ExternalSyncSnapshot]> {
  try {
    const res = await fetch('/api/sync/external-sources');
    if (!res.ok) {
      return [new Error(`Statut sync HTTP ${res.status}`), null];
    }
    const payload = (await res.json()) as ExternalSyncSnapshot;
    return [null, payload];
  } catch (err) {
    return [err instanceof Error ? err : new Error('Erreur réseau lors de la vérification externe.'), null];
  }
}
