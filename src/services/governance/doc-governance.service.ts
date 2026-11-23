import type {
  CreateDocumentInput,
  DocRollbackInput,
  DocVcsCommit,
  DocVcsCommitCreateInput,
  GovernedDocument,
  RoleAssignment,
  TransitionDocumentInput,
  UpdateDocumentInput,
  UpdateRoleAssignmentInput,
} from '../../contracts/doc-governance.schema.ts';
import {
  INITIAL_GOVERNED_DOCUMENTS,
  INITIAL_ROLE_ASSIGNMENTS,
} from '../../data/doc-governance.catalog.ts';
import {
  canManageRoles,
  createGovernedDocument,
  transitionDocumentWorkflow,
  updateGovernedDocument,
} from '../../systems/governance/doc-governance.engine.ts';
import {
  recordDocVcsCommit,
  rollbackDocumentToCommit,
  seedInitialDocVcsCommits,
} from '../../systems/governance/doc-vcs.engine.ts';

/**
 * [L5] EXW.L5.DOC_GOVERNANCE_SERVICE | v5.1.0 | SADT A5.4
 * Client bridge to server-authoritative /api/governance & /api/governance/vcs endpoints.
 */

export interface GovernanceStatePayload {
  readonly documents: readonly GovernedDocument[];
  readonly assignments: readonly RoleAssignment[];
  readonly vcsCommits: readonly DocVcsCommit[];
}

export interface GovernanceMutationResult<T> {
  readonly ok: boolean;
  readonly data?: T;
  readonly vcsCommits?: readonly DocVcsCommit[];
  readonly error?: string;
}

export async function fetchGovernanceState(): Promise<GovernanceStatePayload> {
  try {
    const res = await fetch('/api/governance/state');
    if (res.ok) {
      const json = (await res.json()) as {
        documents?: GovernedDocument[];
        assignments?: RoleAssignment[];
        vcsCommits?: DocVcsCommit[];
      };
      if (Array.isArray(json.documents) && Array.isArray(json.assignments)) {
        return {
          documents: json.documents,
          assignments: json.assignments,
          vcsCommits: Array.isArray(json.vcsCommits)
            ? json.vcsCommits
            : seedInitialDocVcsCommits(json.documents),
        };
      }
    }
  } catch {
    // Fallback to initial frozen catalog if server is momentarily unreachable
  }
  return {
    documents: INITIAL_GOVERNED_DOCUMENTS,
    assignments: INITIAL_ROLE_ASSIGNMENTS,
    vcsCommits: seedInitialDocVcsCommits(INITIAL_GOVERNED_DOCUMENTS),
  };
}

export async function apiCreateGovernedDocument(
  input: CreateDocumentInput,
  localFallbackDocs: readonly GovernedDocument[],
  localFallbackCommits: readonly DocVcsCommit[] = [],
): Promise<GovernanceMutationResult<GovernedDocument>> {
  try {
    const res = await fetch('/api/governance/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const json = (await res.json()) as {
      document?: GovernedDocument;
      vcsCommits?: DocVcsCommit[];
      error?: string;
    };
    if (!res.ok) {
      return { ok: false, error: json.error ?? `Erreur serveur (${res.status})` };
    }
    return json.document
      ? { ok: true, data: json.document, vcsCommits: json.vcsCommits }
      : { ok: false, error: 'Réponse vide.' };
  } catch {
    const nowIso = new Date().toISOString();
    const local = createGovernedDocument(localFallbackDocs, input, nowIso);
    if (!local.ok || !local.document) return { ok: false, error: local.error };
    const commit = recordDocVcsCommit(localFallbackCommits, local.document, {
      surface: local.document.domain === 'APP' ? 'DRIVE_DOC' : 'APP_HUB',
      operation: 'INIT',
      commitMessage: `Création ${local.document.filingCode} v${local.document.version}`,
      actorName: input.actorName,
      actorRole: input.actorRole,
      timestampIso: nowIso,
    });
    return {
      ok: true,
      data: local.document,
      vcsCommits: [...localFallbackCommits, commit],
    };
  }
}

export async function apiUpdateGovernedDocument(
  docId: string,
  input: UpdateDocumentInput,
  localFallbackDoc?: GovernedDocument,
  localFallbackCommits: readonly DocVcsCommit[] = [],
): Promise<GovernanceMutationResult<GovernedDocument>> {
  try {
    const res = await fetch(`/api/governance/documents/${encodeURIComponent(docId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const json = (await res.json()) as {
      document?: GovernedDocument;
      vcsCommits?: DocVcsCommit[];
      error?: string;
    };
    if (!res.ok) {
      return { ok: false, error: json.error ?? `Erreur serveur (${res.status})` };
    }
    return json.document
      ? { ok: true, data: json.document, vcsCommits: json.vcsCommits }
      : { ok: false, error: 'Réponse vide.' };
  } catch {
    if (!localFallbackDoc) return { ok: false, error: 'Service indisponible.' };
    const nowIso = new Date().toISOString();
    const local = updateGovernedDocument(localFallbackDoc, input, nowIso);
    if (!local.ok || !local.document) return { ok: false, error: local.error };
    const commit = recordDocVcsCommit(localFallbackCommits, local.document, {
      surface: local.document.domain === 'APP' ? 'DRIVE_DOC' : 'APP_HUB',
      operation: 'EDIT',
      commitMessage: `Mise à jour ${local.document.filingCode} (v${local.document.version})`,
      actorName: input.actorName,
      actorRole: input.actorRole,
      timestampIso: nowIso,
    });
    return {
      ok: true,
      data: local.document,
      vcsCommits: [...localFallbackCommits, commit],
    };
  }
}

export async function apiTransitionGovernedDocument(
  docId: string,
  input: TransitionDocumentInput,
  localFallbackDoc?: GovernedDocument,
  localFallbackCommits: readonly DocVcsCommit[] = [],
): Promise<GovernanceMutationResult<GovernedDocument>> {
  try {
    const res = await fetch(`/api/governance/documents/${encodeURIComponent(docId)}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const json = (await res.json()) as {
      document?: GovernedDocument;
      vcsCommits?: DocVcsCommit[];
      error?: string;
    };
    if (!res.ok) {
      return { ok: false, error: json.error ?? `Transition refusée (${res.status})` };
    }
    return json.document
      ? { ok: true, data: json.document, vcsCommits: json.vcsCommits }
      : { ok: false, error: 'Réponse vide.' };
  } catch {
    if (!localFallbackDoc) return { ok: false, error: 'Service indisponible.' };
    const nowIso = new Date().toISOString();
    const local = transitionDocumentWorkflow(
      localFallbackDoc,
      input.action,
      input.actorName,
      input.actorRole,
      nowIso,
      input.comment,
      input.verifiedStandardIds,
    );
    if (!local.ok || !local.document) return { ok: false, error: local.error };
    const commit = recordDocVcsCommit(localFallbackCommits, local.document, {
      surface: local.document.domain === 'APP' ? 'DRIVE_DOC' : 'APP_HUB',
      operation: input.action === 'APPROVE_PUBLISH' ? 'TAG_RELEASE' : 'WORKFLOW_TRANSITION',
      commitMessage: input.comment || `Transition ${input.action}`,
      actorName: input.actorName,
      actorRole: input.actorRole,
      timestampIso: nowIso,
    });
    return {
      ok: true,
      data: local.document,
      vcsCommits: [...localFallbackCommits, commit],
    };
  }
}

export async function apiCommitDocVcsSnapshot(
  input: DocVcsCommitCreateInput,
  localFallbackDoc?: GovernedDocument,
  localFallbackCommits: readonly DocVcsCommit[] = [],
): Promise<GovernanceMutationResult<GovernedDocument>> {
  try {
    const res = await fetch('/api/governance/vcs/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const json = (await res.json()) as {
      document?: GovernedDocument;
      vcsCommits?: DocVcsCommit[];
      error?: string;
    };
    if (!res.ok) {
      return { ok: false, error: json.error ?? `Commit refusé (${res.status})` };
    }
    return json.document
      ? { ok: true, data: json.document, vcsCommits: json.vcsCommits }
      : { ok: false, error: 'Réponse vide.' };
  } catch {
    if (!localFallbackDoc) return { ok: false, error: 'Service indisponible.' };
    const nowIso = new Date().toISOString();
    const commit = recordDocVcsCommit(localFallbackCommits, localFallbackDoc, {
      surface: input.surface,
      operation: input.surface === 'DRIVE_DOC' ? 'DRIVE_PATCH_SYNC' : 'EDIT',
      commitMessage: input.commitMessage,
      actorName: input.actorName,
      actorRole: input.actorRole,
      timestampIso: nowIso,
      tag: input.tag ?? null,
    });
    return {
      ok: true,
      data: localFallbackDoc,
      vcsCommits: [...localFallbackCommits, commit],
    };
  }
}

export async function apiRollbackDocumentToCommit(
  docId: string,
  input: DocRollbackInput,
  localFallbackDoc?: GovernedDocument,
  localFallbackCommits: readonly DocVcsCommit[] = [],
): Promise<GovernanceMutationResult<GovernedDocument>> {
  try {
    const res = await fetch(`/api/governance/documents/${encodeURIComponent(docId)}/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const json = (await res.json()) as {
      document?: GovernedDocument;
      vcsCommits?: DocVcsCommit[];
      error?: string;
    };
    if (!res.ok) {
      return { ok: false, error: json.error ?? `Restauration refusée (${res.status})` };
    }
    return json.document
      ? { ok: true, data: json.document, vcsCommits: json.vcsCommits }
      : { ok: false, error: 'Réponse vide.' };
  } catch {
    if (!localFallbackDoc) return { ok: false, error: 'Service indisponible.' };
    const local = rollbackDocumentToCommit(
      localFallbackDoc,
      localFallbackCommits,
      input.targetCommitId,
      input.actorName,
      input.actorRole,
      input.reason,
      new Date().toISOString(),
    );
    if (!local.ok || !local.document || !local.commit) {
      return { ok: false, error: local.error ?? 'Restauration locale impossible.' };
    }
    return {
      ok: true,
      data: local.document,
      vcsCommits: [...localFallbackCommits, local.commit],
    };
  }
}

export async function apiUpdateRoleAssignment(
  input: UpdateRoleAssignmentInput,
  localFallbackAssignments: readonly RoleAssignment[],
): Promise<GovernanceMutationResult<readonly RoleAssignment[]>> {
  try {
    const res = await fetch('/api/governance/roles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const json = (await res.json()) as { assignments?: RoleAssignment[]; error?: string };
    if (!res.ok) {
      return { ok: false, error: json.error ?? `Modification refusée (${res.status})` };
    }
    return json.assignments ? { ok: true, data: json.assignments } : { ok: false, error: 'Réponse vide.' };
  } catch {
    const check = canManageRoles(input.actorRole);
    if (!check.allowed) return { ok: false, error: check.reason };
    const next = localFallbackAssignments.map((a) =>
      a.memberId === input.memberId
        ? { ...a, roleId: input.newRoleId, assignedBy: input.actorName, assignedAtIso: new Date().toISOString() }
        : a,
    );
    return { ok: true, data: next };
  }
}
