import type {
  CreateDocumentInput,
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

/**
 * [L5] EXW.L5.DOC_GOVERNANCE_SERVICE | v5.1.0 | SADT A5.4
 * Client bridge to server-authoritative /api/governance endpoints.
 */

export interface GovernanceStatePayload {
  readonly documents: readonly GovernedDocument[];
  readonly assignments: readonly RoleAssignment[];
}

export interface GovernanceMutationResult<T> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: string;
}

export async function fetchGovernanceState(): Promise<GovernanceStatePayload> {
  try {
    const res = await fetch('/api/governance/state');
    if (res.ok) {
      const json = (await res.json()) as {
        documents?: GovernedDocument[];
        assignments?: RoleAssignment[];
      };
      if (Array.isArray(json.documents) && Array.isArray(json.assignments)) {
        return {
          documents: json.documents,
          assignments: json.assignments,
        };
      }
    }
  } catch {
    // Fallback to initial frozen catalog if server is momentarily unreachable
  }
  return {
    documents: INITIAL_GOVERNED_DOCUMENTS,
    assignments: INITIAL_ROLE_ASSIGNMENTS,
  };
}

export async function apiCreateGovernedDocument(
  input: CreateDocumentInput,
  localFallbackDocs: readonly GovernedDocument[],
): Promise<GovernanceMutationResult<GovernedDocument>> {
  try {
    const res = await fetch('/api/governance/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const json = (await res.json()) as {
      document?: GovernedDocument;
      error?: string;
    };
    if (!res.ok) {
      return { ok: false, error: json.error ?? `Erreur serveur (${res.status})` };
    }
    return json.document ? { ok: true, data: json.document } : { ok: false, error: 'Réponse vide.' };
  } catch {
    const nowIso = new Date().toISOString();
    const local = createGovernedDocument(localFallbackDocs, input, nowIso);
    if (!local.ok || !local.document) return { ok: false, error: local.error };
    return {
      ok: true,
      data: local.document,
    };
  }
}

export async function apiUpdateGovernedDocument(
  docId: string,
  input: UpdateDocumentInput,
  localFallbackDoc?: GovernedDocument,
): Promise<GovernanceMutationResult<GovernedDocument>> {
  try {
    const res = await fetch(`/api/governance/documents/${encodeURIComponent(docId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const json = (await res.json()) as {
      document?: GovernedDocument;
      error?: string;
    };
    if (!res.ok) {
      return { ok: false, error: json.error ?? `Erreur serveur (${res.status})` };
    }
    return json.document ? { ok: true, data: json.document } : { ok: false, error: 'Réponse vide.' };
  } catch {
    if (!localFallbackDoc) return { ok: false, error: 'Service indisponible.' };
    const nowIso = new Date().toISOString();
    const local = updateGovernedDocument(localFallbackDoc, input, nowIso);
    if (!local.ok || !local.document) return { ok: false, error: local.error };
    return {
      ok: true,
      data: local.document,
    };
  }
}

export async function apiTransitionGovernedDocument(
  docId: string,
  input: TransitionDocumentInput,
  localFallbackDoc?: GovernedDocument,
): Promise<GovernanceMutationResult<GovernedDocument>> {
  try {
    const res = await fetch(`/api/governance/documents/${encodeURIComponent(docId)}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const json = (await res.json()) as {
      document?: GovernedDocument;
      error?: string;
    };
    if (!res.ok) {
      return { ok: false, error: json.error ?? `Transition refusée (${res.status})` };
    }
    return json.document ? { ok: true, data: json.document } : { ok: false, error: 'Réponse vide.' };
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
    return {
      ok: true,
      data: local.document,
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
