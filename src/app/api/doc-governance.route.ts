import { Router } from 'express';
import {
  CreateDocumentInputSchema,
  DocRollbackInputSchema,
  DocVcsCommitCreateInputSchema,
  TransitionDocumentInputSchema,
  UpdateDocumentInputSchema,
  UpdateRoleAssignmentInputSchema,
  type DocVcsCommit,
  type GovernedDocument,
  type RoleAssignment,
} from '../../contracts/doc-governance.schema.ts';
import {
  DOC_CATEGORIES_CATALOG,
  GOVERNANCE_ROLES_CATALOG,
  INITIAL_GOVERNED_DOCUMENTS,
  INITIAL_ROLE_ASSIGNMENTS,
  QUALITY_STANDARDS_CATALOG,
} from '../../data/doc-governance.catalog.ts';
import {
  canManageRoles,
  createGovernedDocument,
  evaluateQualityStandards,
  hasPermission,
  transitionDocumentWorkflow,
  updateGovernedDocument,
} from '../../systems/governance/doc-governance.engine.ts';
import {
  recordDocVcsCommit,
  rollbackDocumentToCommit,
  seedInitialDocVcsCommits,
} from '../../systems/governance/doc-vcs.engine.ts';

/**
 * [L8] EXW.L8.DOC_GOVERNANCE_ROUTE | v5.1.0 | SADT A5.4
 * Express router enforcing server-side RBAC permissions, 3-track validation workflow,
 * strict App vs Game documentation separation, and the dedicated Git-like Doc VCS ledger.
 */
export function createDocGovernanceRouter(): Router {
  const router = Router();

  let documents: GovernedDocument[] = INITIAL_GOVERNED_DOCUMENTS.map((d) => ({
    ...d,
    verifiedStandardIds: [...d.verifiedStandardIds],
    tags: [...d.tags],
    auditLog: d.auditLog.map((e) => ({ ...e })),
  }));

  let assignments: RoleAssignment[] = INITIAL_ROLE_ASSIGNMENTS.map((a) => ({ ...a }));
  let vcsCommits: DocVcsCommit[] = [...seedInitialDocVcsCommits(documents)];

  const verifyActorAssignment = (actorName: string, actorRole: string): string | null => {
    const matched = assignments.find(
      (a) => a.displayName.trim().toLowerCase() === actorName.trim().toLowerCase(),
    );
    if (!matched) {
      return 'Compte non répertorié dans le registre des accès RBAC.';
    }
    if (matched.roleId !== actorRole) {
      return `Rôle incohérent : ${matched.displayName} est attribué au rôle ${matched.roleId}, pas ${actorRole}.`;
    }
    return null;
  };

  router.get('/state', (_req, res) => {
    const docsWithQuality = documents.map((doc) => ({
      ...doc,
      quality: evaluateQualityStandards(doc),
    }));
    res.json({
      documents: docsWithQuality,
      assignments,
      vcsCommits,
      roles: GOVERNANCE_ROLES_CATALOG,
      categories: DOC_CATEGORIES_CATALOG,
      standards: QUALITY_STANDARDS_CATALOG,
    });
  });

  router.post('/documents', (req, res) => {
    const parsed = CreateDocumentInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Données de création invalides.',
        details: parsed.error.issues,
      });
      return;
    }

    const actorError = verifyActorAssignment(parsed.data.actorName, parsed.data.actorRole);
    if (actorError) {
      res.status(403).json({ error: actorError });
      return;
    }

    const nowIso = new Date().toISOString();
    const result = createGovernedDocument(documents, parsed.data, nowIso);
    if (!result.ok || !result.document) {
      res.status(403).json({ error: result.error ?? 'Création refusée par la politique RBAC.' });
      return;
    }

    const commit = recordDocVcsCommit(vcsCommits, result.document, {
      surface: result.document.domain === 'APP' ? 'DRIVE_DOC' : 'APP_HUB',
      operation: 'INIT',
      commitMessage: `Création ${result.document.filingCode} v${result.document.version}`,
      actorName: parsed.data.actorName,
      actorRole: parsed.data.actorRole,
      timestampIso: nowIso,
    });
    vcsCommits = [...vcsCommits, commit];
    documents = [result.document, ...documents];

    res.status(201).json({
      document: result.document,
      commit,
      vcsCommits,
      quality: evaluateQualityStandards(result.document),
    });
  });

  router.patch('/documents/:id', (req, res) => {
    const docId = String(req.params.id ?? '').trim();
    const index = documents.findIndex((d) => d.id === docId);
    if (index === -1) {
      res.status(404).json({ error: 'Document introuvable.' });
      return;
    }

    const parsed = UpdateDocumentInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Données de mise à jour invalides.',
        details: parsed.error.issues,
      });
      return;
    }

    const actorError = verifyActorAssignment(parsed.data.actorName, parsed.data.actorRole);
    if (actorError) {
      res.status(403).json({ error: actorError });
      return;
    }

    const current = documents[index]!;
    const nowIso = new Date().toISOString();
    const result = updateGovernedDocument(current, parsed.data, nowIso);
    if (!result.ok || !result.document) {
      res.status(403).json({ error: result.error ?? 'Modification refusée par la politique RBAC.' });
      return;
    }

    documents[index] = result.document;
    const contentEdited =
      parsed.data.title !== undefined ||
      parsed.data.summary !== undefined ||
      parsed.data.content !== undefined ||
      parsed.data.version !== undefined;

    let commit: DocVcsCommit | undefined;
    if (contentEdited) {
      commit = recordDocVcsCommit(vcsCommits, result.document, {
        surface: result.document.domain === 'APP' ? 'DRIVE_DOC' : 'APP_HUB',
        operation: 'EDIT',
        commitMessage: `Mise à jour ${result.document.filingCode} (v${result.document.version})`,
        actorName: parsed.data.actorName,
        actorRole: parsed.data.actorRole,
        timestampIso: nowIso,
      });
      vcsCommits = [...vcsCommits, commit];
    }

    res.json({
      document: result.document,
      commit,
      vcsCommits,
      quality: evaluateQualityStandards(result.document),
    });
  });

  router.post('/documents/:id/transition', (req, res) => {
    const docId = String(req.params.id ?? '').trim();
    const index = documents.findIndex((d) => d.id === docId);
    if (index === -1) {
      res.status(404).json({ error: 'Document introuvable.' });
      return;
    }

    const parsed = TransitionDocumentInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Payload de transition invalide.',
        details: parsed.error.issues,
      });
      return;
    }

    const actorError = verifyActorAssignment(parsed.data.actorName, parsed.data.actorRole);
    if (actorError) {
      res.status(403).json({ error: actorError });
      return;
    }

    const current = documents[index]!;
    const { action, actorName, actorRole, comment, verifiedStandardIds } = parsed.data;
    const nowIso = new Date().toISOString();
    const result = transitionDocumentWorkflow(
      current,
      action,
      actorName,
      actorRole,
      nowIso,
      comment,
      verifiedStandardIds,
    );

    if (!result.ok || !result.document) {
      res.status(403).json({ error: result.error ?? 'Transition refusée par le workflow ou le RBAC.' });
      return;
    }

    documents[index] = result.document;
    const commit = recordDocVcsCommit(vcsCommits, result.document, {
      surface: result.document.domain === 'APP' ? 'DRIVE_DOC' : 'APP_HUB',
      operation: action === 'APPROVE_PUBLISH' ? 'TAG_RELEASE' : 'WORKFLOW_TRANSITION',
      commitMessage: comment || `Transition ${action} (${result.document.stage})`,
      actorName,
      actorRole,
      timestampIso: nowIso,
      tag: action === 'APPROVE_PUBLISH' ? `doc-v${result.document.version}` : null,
    });
    vcsCommits = [...vcsCommits, commit];

    res.json({
      document: result.document,
      commit,
      vcsCommits,
      quality: evaluateQualityStandards(result.document),
    });
  });

  // Explicit VCS Snapshot Commit (e.g. Drive/Docs Patch Sync or Release Tag)
  router.post('/vcs/commit', (req, res) => {
    const parsed = DocVcsCommitCreateInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Commit documentaire invalide.', details: parsed.error.issues });
      return;
    }

    const actorError = verifyActorAssignment(parsed.data.actorName, parsed.data.actorRole);
    if (actorError) {
      res.status(403).json({ error: actorError });
      return;
    }

    const index = documents.findIndex((d) => d.id === parsed.data.docId);
    if (index === -1) {
      res.status(404).json({ error: 'Document cible introuvable.' });
      return;
    }

    const current = documents[index]!;
    const perm = hasPermission(parsed.data.actorRole, current.track, 'EDIT');
    if (!perm.allowed) {
      res.status(403).json({ error: perm.reason });
      return;
    }

    const nowIso = new Date().toISOString();
    const hasContentPatch =
      parsed.data.title !== undefined ||
      parsed.data.summary !== undefined ||
      parsed.data.content !== undefined ||
      parsed.data.version !== undefined;

    let nextDoc = current;
    if (hasContentPatch) {
      if (current.stage !== 'DRAFT' && current.stage !== 'CHANGES_REQUESTED') {
        res.status(403).json({
          error: 'Pour committer un nouveau texte sur un document publié, rouvrez d’abord un brouillon.',
        });
        return;
      }
      const updatedRes = updateGovernedDocument(
        current,
        {
          title: parsed.data.title,
          summary: parsed.data.summary,
          content: parsed.data.content,
          version: parsed.data.version,
          actorName: parsed.data.actorName,
          actorRole: parsed.data.actorRole,
        },
        nowIso,
      );
      if (!updatedRes.ok || !updatedRes.document) {
        res.status(403).json({ error: updatedRes.error ?? 'Mise à jour refusée.' });
        return;
      }
      nextDoc = updatedRes.document;
      documents[index] = nextDoc;
    }

    const commit = recordDocVcsCommit(vcsCommits, nextDoc, {
      surface: parsed.data.surface,
      operation: parsed.data.surface === 'DRIVE_DOC' ? 'DRIVE_PATCH_SYNC' : 'EDIT',
      commitMessage: parsed.data.commitMessage,
      actorName: parsed.data.actorName,
      actorRole: parsed.data.actorRole,
      timestampIso: nowIso,
      tag: parsed.data.tag ?? null,
    });
    vcsCommits = [...vcsCommits, commit];

    res.status(201).json({
      document: nextDoc,
      commit,
      vcsCommits,
      quality: evaluateQualityStandards(nextDoc),
    });
  });

  // RBAC-guarded VCS Rollback (restores snapshot in DRAFT stage and records new ROLLBACK commit)
  router.post('/documents/:id/rollback', (req, res) => {
    const docId = String(req.params.id ?? '').trim();
    const index = documents.findIndex((d) => d.id === docId);
    if (index === -1) {
      res.status(404).json({ error: 'Document introuvable.' });
      return;
    }

    const parsed = DocRollbackInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Paramètres de restauration invalides.', details: parsed.error.issues });
      return;
    }

    const actorError = verifyActorAssignment(parsed.data.actorName, parsed.data.actorRole);
    if (actorError) {
      res.status(403).json({ error: actorError });
      return;
    }

    const current = documents[index]!;
    const nowIso = new Date().toISOString();
    const rollbackRes = rollbackDocumentToCommit(
      current,
      vcsCommits,
      parsed.data.targetCommitId,
      parsed.data.actorName,
      parsed.data.actorRole,
      parsed.data.reason,
      nowIso,
    );

    if (!rollbackRes.ok || !rollbackRes.document || !rollbackRes.commit) {
      res.status(403).json({ error: rollbackRes.error ?? 'Restauration refusée.' });
      return;
    }

    documents[index] = rollbackRes.document;
    vcsCommits = [...vcsCommits, rollbackRes.commit];

    res.json({
      document: rollbackRes.document,
      commit: rollbackRes.commit,
      vcsCommits,
      quality: evaluateQualityStandards(rollbackRes.document),
    });
  });

  router.patch('/roles', (req, res) => {
    const parsed = UpdateRoleAssignmentInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Données d’attribution de rôle invalides.',
        details: parsed.error.issues,
      });
      return;
    }

    const { memberId, newRoleId, actorName, actorRole } = parsed.data;
    const actorError = verifyActorAssignment(actorName, actorRole);
    if (actorError) {
      res.status(403).json({ error: actorError });
      return;
    }
    const check = canManageRoles(actorRole);
    if (!check.allowed) {
      res.status(403).json({ error: check.reason });
      return;
    }

    const idx = assignments.findIndex((a) => a.memberId === memberId);
    if (idx === -1) {
      res.status(404).json({ error: 'Membre introuvable dans le registre des accès.' });
      return;
    }

    const updated: RoleAssignment = {
      ...assignments[idx]!,
      roleId: newRoleId,
      assignedAtIso: new Date().toISOString(),
      assignedBy: actorName,
    };
    assignments[idx] = updated;
    res.json({ assignment: updated, assignments });
  });

  return router;
}
