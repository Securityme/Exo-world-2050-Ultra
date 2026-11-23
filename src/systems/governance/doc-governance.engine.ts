import { checkZ0AndR50Compliance } from '../../contracts/guards/z0-legacy.guard.ts';
import type {
  ContentTrack,
  CreateDocumentInput,
  DocCategoryCode,
  DocDomainScope,
  GovernedDocument,
  GovernancePermission,
  GovernanceRoleId,
  QualityCheckItem,
  RoleAssignment,
  UpdateDocumentInput,
  WorkflowAction,
  WorkflowStage,
} from '../../contracts/doc-governance.schema.ts';
import {
  DOC_CATEGORIES_CATALOG,
  GOVERNANCE_ROLES_CATALOG,
  QUALITY_STANDARDS_CATALOG,
  WORKFLOW_STAGE_LABELS,
  type DocCategorySpec,
  type GovernanceRoleSpec,
} from '../../data/doc-governance.catalog.ts';

/**
 * [L3] EXW.L3.DOC_GOVERNANCE_ENGINE | v5.1.0 | SADT A5.4
 * 100% Pure Deterministic RBAC Authorization, Separated App/Game Classification,
 * Automated Standards Verification & Multi-Stage Validation Workflow Engine.
 */

const SECRET_LITERAL_PATTERN = /\b(?:AIza[0-9A-Za-z_-]{20,}|sk-[0-9A-Za-z]{20,}|ghp_[0-9A-Za-z]{20,})\b/;

export interface PermissionCheckResult {
  readonly allowed: boolean;
  readonly reason: string;
}

export interface QualityEvaluationResult {
  readonly allAutomatedPassed: boolean;
  readonly allStandardsPassed: boolean;
  readonly passedCount: number;
  readonly totalCount: number;
  readonly checks: readonly QualityCheckItem[];
}

export interface WorkflowTransitionResult {
  readonly ok: boolean;
  readonly error?: string;
  readonly document?: GovernedDocument;
}

export interface ClassifiedProjectFile {
  readonly domain: DocDomainScope;
  readonly track: ContentTrack;
  readonly categoryCode: DocCategoryCode;
  readonly categoryLabel: string;
  readonly filingCode: string;
}

export function getRoleSpec(roleId: GovernanceRoleId): GovernanceRoleSpec {
  return GOVERNANCE_ROLES_CATALOG.find((r) => r.id === roleId) ?? GOVERNANCE_ROLES_CATALOG[0]!;
}

export function getCategorySpec(code: DocCategoryCode): DocCategorySpec {
  return DOC_CATEGORIES_CATALOG.find((c) => c.code === code) ?? DOC_CATEGORIES_CATALOG[0]!;
}

export function getRequiredReviewStage(track: ContentTrack): WorkflowStage {
  if (track === 'APP_DOC') return 'TECH_REVIEW';
  if (track === 'SKILLS') return 'SKILLS_REVIEW';
  return 'GAME_REVIEW';
}

export function getRequiredReviewPermission(track: ContentTrack): GovernancePermission {
  if (track === 'APP_DOC') return 'REVIEW_TECHNICAL';
  if (track === 'SKILLS') return 'REVIEW_SKILLS';
  return 'REVIEW_GAME';
}

export function hasPermission(
  roleId: GovernanceRoleId,
  track: ContentTrack,
  permission: GovernancePermission,
): PermissionCheckResult {
  const role = getRoleSpec(roleId);
  const trackPerms = role.permissionsByTrack[track];
  const allowed = trackPerms.includes(permission) || role.globalPermissions.includes(permission);
  if (allowed) {
    return {
      allowed: true,
      reason: `Autorisé pour le rôle ${role.shortLabel} (${permission} sur ${track}).`,
    };
  }
  return {
    allowed: false,
    reason: `Accès refusé : le rôle ${role.shortLabel} ne dispose pas de la permission ${permission} sur la filière ${track}.`,
  };
}

export function canManageRoles(roleId: GovernanceRoleId): PermissionCheckResult {
  const role = getRoleSpec(roleId);
  if (role.globalPermissions.includes('MANAGE_ROLES')) {
    return { allowed: true, reason: `Administration des rôles autorisée (${role.shortLabel}).` };
  }
  return {
    allowed: false,
    reason: `Réservé à l’Approbateur Maître : le rôle ${role.shortLabel} ne peut pas modifier les attributions d’accès.`,
  };
}

/**
 * Classifies any repository file path cleanly into the separated APP vs GAME taxonomy.
 */
export function classifyProjectDocument(
  relPath: string,
  title: string,
  sequenceIndex: number,
): ClassifiedProjectFile {
  const norm = `${relPath} ${title}`.toLowerCase();
  let categoryCode: DocCategoryCode;

  if (
    norm.includes('gameplay/') ||
    norm.includes('regle') ||
    norm.includes('règle') ||
    norm.includes('combat') ||
    norm.includes('biosphere')
  ) {
    categoryCode = 'JEU-REG';
  } else if (
    norm.includes('playtest') ||
    norm.includes('beta') ||
    norm.includes('equilibr') ||
    norm.includes('équilibr') ||
    norm.includes('matrices/')
  ) {
    categoryCode = 'JEU-BAL';
  } else if (
    norm.includes('lore') ||
    norm.includes('scenario') ||
    norm.includes('scénario') ||
    norm.includes('campagne') ||
    norm.includes('chroniq')
  ) {
    categoryCode = 'JEU-SCE';
  } else if (norm.includes('design/') || norm.includes('astralis') || norm.includes('pax')) {
    categoryCode = 'JEU-VIS';
  } else if (
    norm.includes('skill') ||
    norm.includes('system_instruction') ||
    norm.includes('inter-ia/') ||
    norm.includes('deleg')
  ) {
    categoryCode = 'APP-SKL';
  } else if (
    norm.includes('changelog') ||
    norm.includes('fup_tracker') ||
    norm.includes('migration') ||
    norm.includes('release')
  ) {
    categoryCode = 'APP-UPD';
  } else if (
    norm.includes('governance') ||
    norm.includes('guide') ||
    norm.includes('index') ||
    norm.includes('readme') ||
    norm.includes('rbac')
  ) {
    categoryCode = 'APP-GUI';
  } else {
    categoryCode = 'APP-TEC';
  }

  const spec = getCategorySpec(categoryCode);
  const padded = String(sequenceIndex + 1).padStart(3, '0');
  return {
    domain: spec.domain,
    track: spec.track,
    categoryCode: spec.code,
    categoryLabel: spec.label,
    filingCode: `${spec.code}-${padded}`,
  };
}

/**
 * Evaluates both automated compliance rules and track-specific manual quality standards.
 */
export function evaluateQualityStandards(doc: GovernedDocument): QualityEvaluationResult {
  const category = getCategorySpec(doc.categoryCode);
  const fullText = `${doc.title}\n${doc.summary}\n${doc.content}`;
  const compliance = checkZ0AndR50Compliance(fullText);
  const codeMatchesCategory =
    doc.filingCode.startsWith(`${doc.categoryCode}-`) &&
    doc.domain === category.domain &&
    doc.track === category.track;
  const semverValid = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/.test(doc.version);
  const noSecretLeak = !SECRET_LITERAL_PATTERN.test(fullText);
  const hasStructuredBody = doc.summary.trim().length >= 15 && doc.content.trim().length >= 40;

  const automatedChecks: QualityCheckItem[] = [
    {
      id: 'AUTO-TAXONOMY',
      label: 'Classement séparé Application / Jeu cohérent',
      automated: true,
      passed: codeMatchesCategory,
      detail: codeMatchesCategory
        ? `Code ${doc.filingCode} aligné sur le pôle ${doc.domain} (${doc.categoryCode}).`
        : `Le code ${doc.filingCode} ne correspond pas à la catégorie ${doc.categoryCode}.`,
    },
    {
      id: 'AUTO-SEMVER',
      label: 'Version SemVer conforme',
      automated: true,
      passed: semverValid,
      detail: semverValid ? `Version v${doc.version} valide.` : `Version "${doc.version}" non conforme SemVer.`,
    },
    {
      id: 'AUTO-NOMENCLATURE',
      label: 'Conformité éditoriale R-50 & Hygiène Z0',
      automated: true,
      passed: compliance.ok,
      detail: compliance.ok
        ? 'Aucun terme banni ni rupture de nomenclature scientifique.'
        : `Violations détectées : ${compliance.violations.join(', ')}.`,
    },
    {
      id: 'AUTO-SECRETS',
      label: 'Sécurité : aucune clé API ni secret en clair',
      automated: true,
      passed: noSecretLeak,
      detail: noSecretLeak
        ? 'Aucune signature de clé secrète détectée dans le contenu.'
        : 'Chaîne ressemblant à un secret API détectée — retrait obligatoire.',
    },
    {
      id: 'AUTO-STRUCTURE',
      label: 'Complétude résumé & contenu structuré',
      automated: true,
      passed: hasStructuredBody,
      detail: hasStructuredBody
        ? 'Résumé exécutif et corps documentaire complets.'
        : 'Le résumé (>= 15 car.) ou le contenu (>= 40 car.) est trop court.',
    },
  ];

  const manualStandards = QUALITY_STANDARDS_CATALOG.filter((s) => s.track === doc.track);
  const manualChecks: QualityCheckItem[] = manualStandards.map((std) => {
    const passed = doc.verifiedStandardIds.includes(std.id);
    return {
      id: std.id,
      label: std.label,
      automated: false,
      passed,
      detail: passed ? 'Validé par le réviseur.' : std.description,
    };
  });

  const checks = [...automatedChecks, ...manualChecks];
  const passedCount = checks.filter((c) => c.passed).length;
  return {
    allAutomatedPassed: automatedChecks.every((c) => c.passed),
    allStandardsPassed: checks.every((c) => c.passed),
    passedCount,
    totalCount: checks.length,
    checks,
  };
}

export function generateNextFilingCode(
  existingDocs: readonly GovernedDocument[],
  categoryCode: DocCategoryCode,
): string {
  const prefix = `${categoryCode}-`;
  let maxNum = 0;
  for (const d of existingDocs) {
    if (d.filingCode.startsWith(prefix)) {
      const num = Number.parseInt(d.filingCode.slice(prefix.length), 10);
      if (Number.isFinite(num) && num > maxNum) maxNum = num;
    }
  }
  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}

export function createGovernedDocument(
  existingDocs: readonly GovernedDocument[],
  input: CreateDocumentInput,
  timestampIso: string,
): WorkflowTransitionResult {
  const category = getCategorySpec(input.categoryCode);
  const perm = hasPermission(input.actorRole, category.track, 'CREATE');
  if (!perm.allowed) {
    return { ok: false, error: perm.reason };
  }

  const filingCode = generateNextFilingCode(existingDocs, category.code);
  const id = `gov-${filingCode.toLowerCase()}`;
  const doc: GovernedDocument = {
    id,
    filingCode,
    domain: category.domain,
    track: category.track,
    categoryCode: category.code,
    title: input.title,
    summary: input.summary,
    content: input.content,
    version: input.version,
    stage: 'DRAFT',
    ownerName: input.actorName,
    ownerRole: input.actorRole,
    lastAuthorName: input.actorName,
    lastReviewerName: null,
    approverName: null,
    updatedAtIso: timestampIso,
    verifiedStandardIds: [],
    tags: input.tags,
    sourcePath: null,
    auditLog: [
      {
        id: `aud-${id}-1`,
        timestampIso,
        actorName: input.actorName,
        actorRole: input.actorRole,
        action: 'CREATE',
        fromStage: 'DRAFT',
        toStage: 'DRAFT',
        comment: `Création du document ${filingCode} dans le pôle ${category.domain}.`,
      },
    ],
  };

  return { ok: true, document: doc };
}

export function updateGovernedDocument(
  doc: GovernedDocument,
  input: UpdateDocumentInput,
  timestampIso: string,
): WorkflowTransitionResult {
  const isReviewChecklistOnly =
    input.verifiedStandardIds !== undefined &&
    input.title === undefined &&
    input.summary === undefined &&
    input.content === undefined &&
    input.version === undefined &&
    input.tags === undefined;

  if (isReviewChecklistOnly) {
    const reviewPerm = hasPermission(input.actorRole, doc.track, getRequiredReviewPermission(doc.track));
    if (!reviewPerm.allowed) {
      return { ok: false, error: reviewPerm.reason };
    }
    if (doc.stage !== 'TECH_REVIEW' && doc.stage !== 'SKILLS_REVIEW' && doc.stage !== 'GAME_REVIEW') {
      return { ok: false, error: 'La grille de révision ne peut être cochée que pendant une étape de révision active.' };
    }
    return {
      ok: true,
      document: {
        ...doc,
        verifiedStandardIds: input.verifiedStandardIds ?? doc.verifiedStandardIds,
        updatedAtIso: timestampIso,
      },
    };
  }

  const editPerm = hasPermission(input.actorRole, doc.track, 'EDIT');
  if (!editPerm.allowed) {
    return { ok: false, error: editPerm.reason };
  }
  if (doc.stage !== 'DRAFT' && doc.stage !== 'CHANGES_REQUESTED') {
    return {
      ok: false,
      error: `Modification bloquée au statut « ${WORKFLOW_STAGE_LABELS[doc.stage]} » : rouvrez un brouillon pour modifier un document soumis ou publié.`,
    };
  }

  const updated: GovernedDocument = {
    ...doc,
    title: input.title ?? doc.title,
    summary: input.summary ?? doc.summary,
    content: input.content ?? doc.content,
    version: input.version ?? doc.version,
    tags: input.tags ?? doc.tags,
    lastAuthorName: input.actorName,
    updatedAtIso: timestampIso,
    verifiedStandardIds: [],
    auditLog: [
      ...doc.auditLog,
      {
        id: `aud-${doc.id}-${doc.auditLog.length + 1}`,
        timestampIso,
        actorName: input.actorName,
        actorRole: input.actorRole,
        action: 'EDIT',
        fromStage: doc.stage,
        toStage: doc.stage,
        comment: `Mise à jour du contenu (v${input.version ?? doc.version}).`,
      },
    ],
  };
  return { ok: true, document: updated };
}

export function transitionDocumentWorkflow(
  doc: GovernedDocument,
  action: WorkflowAction,
  actorName: string,
  actorRole: GovernanceRoleId,
  timestampIso: string,
  comment: string,
  verifiedStandardIds?: readonly string[],
): WorkflowTransitionResult {
  const workingDoc: GovernedDocument = verifiedStandardIds
    ? { ...doc, verifiedStandardIds: [...verifiedStandardIds] }
    : doc;
  const quality = evaluateQualityStandards(workingDoc);
  const expectedReviewStage = getRequiredReviewStage(workingDoc.track);

  if (action === 'SUBMIT_REVIEW') {
    const perm = hasPermission(actorRole, workingDoc.track, 'SUBMIT_REVIEW');
    if (!perm.allowed) return { ok: false, error: perm.reason };
    if (workingDoc.stage !== 'DRAFT' && workingDoc.stage !== 'CHANGES_REQUESTED') {
      return { ok: false, error: 'Seul un brouillon ou un document en correction peut être soumis en révision.' };
    }
    if (!quality.allAutomatedPassed) {
      return {
        ok: false,
        error: 'Soumission bloquée : tous les contrôles automatiques (classement, SemVer, R-50, sécurité) doivent être conformes.',
      };
    }
    return {
      ok: true,
      document: {
        ...workingDoc,
        stage: expectedReviewStage,
        lastAuthorName: actorName,
        updatedAtIso: timestampIso,
        auditLog: [
          ...workingDoc.auditLog,
          {
            id: `aud-${workingDoc.id}-${workingDoc.auditLog.length + 1}`,
            timestampIso,
            actorName,
            actorRole,
            action,
            fromStage: workingDoc.stage,
            toStage: expectedReviewStage,
            comment: comment || `Soumis pour ${WORKFLOW_STAGE_LABELS[expectedReviewStage]}.`,
          },
        ],
      },
    };
  }

  if (action === 'PASS_SPECIALIZED_REVIEW') {
    const reviewPerm = getRequiredReviewPermission(workingDoc.track);
    const perm = hasPermission(actorRole, workingDoc.track, reviewPerm);
    if (!perm.allowed) return { ok: false, error: perm.reason };
    if (workingDoc.stage !== expectedReviewStage) {
      return {
        ok: false,
        error: `Ce document n’est pas à l’étape « ${WORKFLOW_STAGE_LABELS[expectedReviewStage]} ».`,
      };
    }
    if (
      actorRole !== 'APPROBATEUR_MAITRE' &&
      actorName.trim().toLowerCase() === workingDoc.lastAuthorName.trim().toLowerCase()
    ) {
      return {
        ok: false,
        error: 'Séparation des tâches : l’auteur de la dernière modification ne peut pas auto-réviser son propre dossier.',
      };
    }
    if (!quality.allStandardsPassed) {
      return {
        ok: false,
        error: `Validation d’étape bloquée : ${quality.passedCount}/${quality.totalCount} standards qualité validés. Cochez tous les critères requis.`,
      };
    }
    return {
      ok: true,
      document: {
        ...workingDoc,
        stage: 'READY_FOR_APPROVAL',
        lastReviewerName: actorName,
        updatedAtIso: timestampIso,
        auditLog: [
          ...workingDoc.auditLog,
          {
            id: `aud-${workingDoc.id}-${workingDoc.auditLog.length + 1}`,
            timestampIso,
            actorName,
            actorRole,
            action,
            fromStage: workingDoc.stage,
            toStage: 'READY_FOR_APPROVAL',
            comment: comment || 'Révision spécialisée approuvée : tous les standards sont conformes.',
          },
        ],
      },
    };
  }

  if (action === 'REQUEST_CHANGES') {
    const perm = hasPermission(actorRole, workingDoc.track, 'REQUEST_CHANGES');
    if (!perm.allowed) return { ok: false, error: perm.reason };
    if (
      workingDoc.stage !== expectedReviewStage &&
      workingDoc.stage !== 'READY_FOR_APPROVAL'
    ) {
      return { ok: false, error: 'Une demande de corrections ne s’applique qu’à un document en cours de révision ou prêt pour validation.' };
    }
    if (comment.trim().length < 6) {
      return { ok: false, error: 'Veuillez indiquer un motif de correction clair (au moins 6 caractères).' };
    }
    return {
      ok: true,
      document: {
        ...workingDoc,
        stage: 'CHANGES_REQUESTED',
        lastReviewerName: actorName,
        updatedAtIso: timestampIso,
        auditLog: [
          ...workingDoc.auditLog,
          {
            id: `aud-${workingDoc.id}-${workingDoc.auditLog.length + 1}`,
            timestampIso,
            actorName,
            actorRole,
            action,
            fromStage: workingDoc.stage,
            toStage: 'CHANGES_REQUESTED',
            comment: comment.trim(),
          },
        ],
      },
    };
  }

  if (action === 'APPROVE_PUBLISH') {
    const perm = hasPermission(actorRole, workingDoc.track, 'APPROVE_PUBLISH');
    if (!perm.allowed) return { ok: false, error: perm.reason };
    if (workingDoc.stage !== 'READY_FOR_APPROVAL') {
      return {
        ok: false,
        error: 'La publication finale exige d’abord la validation de l’étape de révision spécialisée.',
      };
    }
    if (!quality.allStandardsPassed) {
      return {
        ok: false,
        error: `Publication bloquée : ${quality.passedCount}/${quality.totalCount} standards qualité conformes.`,
      };
    }
    return {
      ok: true,
      document: {
        ...workingDoc,
        stage: 'PUBLISHED',
        approverName: actorName,
        updatedAtIso: timestampIso,
        auditLog: [
          ...workingDoc.auditLog,
          {
            id: `aud-${workingDoc.id}-${workingDoc.auditLog.length + 1}`,
            timestampIso,
            actorName,
            actorRole,
            action,
            fromStage: workingDoc.stage,
            toStage: 'PUBLISHED',
            comment: comment || 'Validation finale approuvée et mise en publication officielle.',
          },
        ],
      },
    };
  }

  if (action === 'REOPEN_DRAFT') {
    const perm = hasPermission(actorRole, workingDoc.track, 'EDIT');
    if (!perm.allowed) return { ok: false, error: perm.reason };
    if (workingDoc.stage !== 'PUBLISHED' && workingDoc.stage !== 'ARCHIVED') {
      return { ok: false, error: 'Seul un document publié ou archivé peut ouvrir une nouvelle révision en brouillon.' };
    }
    return {
      ok: true,
      document: {
        ...workingDoc,
        stage: 'DRAFT',
        verifiedStandardIds: [],
        lastAuthorName: actorName,
        updatedAtIso: timestampIso,
        auditLog: [
          ...workingDoc.auditLog,
          {
            id: `aud-${workingDoc.id}-${workingDoc.auditLog.length + 1}`,
            timestampIso,
            actorName,
            actorRole,
            action,
            fromStage: workingDoc.stage,
            toStage: 'DRAFT',
            comment: comment || 'Ouverture d’une nouvelle révision en brouillon.',
          },
        ],
      },
    };
  }

  // ARCHIVE
  const archivePerm = hasPermission(actorRole, workingDoc.track, 'ARCHIVE');
  if (!archivePerm.allowed) return { ok: false, error: archivePerm.reason };
  return {
    ok: true,
    document: {
      ...workingDoc,
      stage: 'ARCHIVED',
      updatedAtIso: timestampIso,
      auditLog: [
        ...workingDoc.auditLog,
        {
          id: `aud-${workingDoc.id}-${workingDoc.auditLog.length + 1}`,
          timestampIso,
          actorName,
          actorRole,
          action: 'ARCHIVE',
          fromStage: workingDoc.stage,
          toStage: 'ARCHIVED',
          comment: comment || 'Document archivé par l’Approbateur Maître.',
        },
      ],
    },
  };
}

export function exportGovernanceHandbookMarkdown(
  docs: readonly GovernedDocument[],
  assignments: readonly RoleAssignment[],
): string {
  const appDocs = docs.filter((d) => d.domain === 'APP');
  const gameDocs = docs.filter((d) => d.domain === 'GAME');

  const lines: string[] = [
    '# Manuel de Gouvernance Documentaire, RBAC & Validation — EXO WORLD : 2050',
    '',
    '## 1. Rôles Utilisateurs & Matrice de Permissions (RBAC)',
    '',
    '| Rôle | Documentation Application | Compétences (Skills) | Documentation Jeu | Gouvernance |',
    '| :--- | :--- | :--- | :--- | :--- |',
    ...GOVERNANCE_ROLES_CATALOG.map(
      (r) =>
        `| **${r.label}** (\`${r.id}\`) | ${r.permissionsByTrack.APP_DOC.join(', ')} | ${r.permissionsByTrack.SKILLS.join(', ')} | ${r.permissionsByTrack.GAME_DOC.join(', ')} | ${r.separationRule} |`,
    ),
    '',
    '## 2. Attributions de Rôles Actives',
    '',
    '| Membre | Rôle | Périmètre | Attribué par |',
    '| :--- | :--- | :--- | :--- |',
    ...assignments.map((a) => `| ${a.displayName} | \`${a.roleId}\` | ${a.scopeLabel} | ${a.assignedBy} |`),
    '',
    '## 3. Flux de Validation en 3 Filières',
    '',
    '1. **Brouillon (`DRAFT`)** → Contrôles automatiques obligatoires (Classement, SemVer, R-50/Z0, Sécurité Zéro Secret).',
    '2. **Révision Spécialisée** : `TECH_REVIEW` (Application), `SKILLS_REVIEW` (Compétences), `GAME_REVIEW` (Jeu) avec séparation des tâches.',
    '3. **Prêt pour validation (`READY_FOR_APPROVAL`)** → 100 % des standards cochés.',
    '4. **Validation Finale & Publication (`PUBLISHED`)** → Réservée à l’`APPROBATEUR_MAITRE`.',
    '',
    `## 4. Pôle Application (${appDocs.length} documents)`,
    '',
    '| Code | Catégorie | Titre | Version | Statut |',
    '| :--- | :--- | :--- | :--- | :--- |',
    ...appDocs.map((d) => `| \`${d.filingCode}\` | ${d.categoryCode} | ${d.title} | v${d.version} | ${WORKFLOW_STAGE_LABELS[d.stage]} |`),
    '',
    `## 5. Pôle Jeu (${gameDocs.length} documents)`,
    '',
    '| Code | Catégorie | Titre | Version | Statut |',
    '| :--- | :--- | :--- | :--- | :--- |',
    ...gameDocs.map((d) => `| \`${d.filingCode}\` | ${d.categoryCode} | ${d.title} | v${d.version} | ${WORKFLOW_STAGE_LABELS[d.stage]} |`),
  ];

  return lines.join('\n');
}
