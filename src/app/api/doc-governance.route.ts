import { Router } from 'express';
import {
  CreateDocumentInputSchema,
  TransitionDocumentInputSchema,
  UpdateDocumentInputSchema,
  UpdateRoleAssignmentInputSchema,
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
  transitionDocumentWorkflow,
  updateGovernedDocument,
} from '../../systems/governance/doc-governance.engine.ts';

/**
 * [L8] EXW.L8.DOC_GOVERNANCE_ROUTE | v5.1.0 | SADT A5.4
 * Express router enforcing server-side RBAC permissions, 3-track validation workflow,
 * and strict App vs Game documentation separation.
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

    documents = [result.document, ...documents];

    res.status(201).json({
      document: result.document,
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

    res.json({
      document: result.document,
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

    res.json({
      document: result.document,
      quality: evaluateQualityStandards(result.document),
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
