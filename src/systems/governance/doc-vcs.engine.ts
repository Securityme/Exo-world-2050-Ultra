import type {
  DocDomainScope,
  DocVcsBranch,
  DocVcsCommit,
  DocVcsOperation,
  DocVcsSurface,
  GovernedDocument,
  GovernanceRoleId,
} from '../../contracts/doc-governance.schema.ts';
import { hasPermission } from './doc-governance.engine.ts';

/**
 * [L3] EXW.L3.DOC_VCS_ENGINE | v5.1.0 | SADT A5.4
 * 100% Pure Git-Like Version Control Engine dedicated to Documentation (Drive/Docs vs Game Mirror),
 * strictly isolated from application/game source code commits.
 */

export interface DocDiffLine {
  readonly kind: 'SAME' | 'ADD' | 'DEL';
  readonly oldLine: number | null;
  readonly newLine: number | null;
  readonly text: string;
}

export interface DocDiffResult {
  readonly addedCount: number;
  readonly removedCount: number;
  readonly unchangedCount: number;
  readonly lines: readonly DocDiffLine[];
}

export interface DocRollbackResult {
  readonly ok: boolean;
  readonly error?: string;
  readonly document?: GovernedDocument;
  readonly commit?: DocVcsCommit;
}

export function resolveDocVcsBranch(domain: DocDomainScope): DocVcsBranch {
  return domain === 'APP' ? 'docs/drive-sovereign' : 'docs/game-assets-mirror';
}

/**
 * Pure deterministic 64-hex canonical digest (8 orthogonal 32-bit FNV-1a lanes).
 * Guarantees identical hashes on browser & Node without platform crypto APIs.
 */
export function computeCanonicalCommitHash(payload: string): string {
  const seeds = [
    0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35,
    0x27d4eb2f, 0x165667b1, 0xd3a2646c, 0xfd7046c5,
  ];
  let hex = '';
  for (let lane = 0; lane < seeds.length; lane += 1) {
    let h = seeds[lane]!;
    for (let i = 0; i < payload.length; i += 1) {
      h ^= payload.charCodeAt(i) + ((lane + 1) * 31);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    h ^= (payload.length * (lane + 17)) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0;
    hex += (h >>> 0).toString(16).padStart(8, '0');
  }
  return hex;
}

export function getLatestCommitForDocument(
  commits: readonly DocVcsCommit[],
  docId: string,
): DocVcsCommit | null {
  let latest: DocVcsCommit | null = null;
  for (const commit of commits) {
    if (commit.docId === docId) {
      latest = commit;
    }
  }
  return latest;
}

export function recordDocVcsCommit(
  existingCommits: readonly DocVcsCommit[],
  doc: GovernedDocument,
  params: {
    readonly surface: DocVcsSurface;
    readonly operation: DocVcsOperation;
    readonly commitMessage: string;
    readonly actorName: string;
    readonly actorRole: GovernanceRoleId;
    readonly timestampIso: string;
    readonly tag?: string | null;
  },
): DocVcsCommit {
  const previous = getLatestCommitForDocument(existingCommits, doc.id);
  const parentHash = previous ? previous.commitHash : null;
  const branch = resolveDocVcsBranch(doc.domain);
  const seq = existingCommits.filter((c) => c.docId === doc.id).length + 1;
  const canonicalPayload = [
    branch,
    params.surface,
    doc.id,
    doc.filingCode,
    doc.version,
    doc.stage,
    params.operation,
    parentHash ?? 'ROOT',
    params.actorName,
    params.timestampIso,
    doc.title,
    doc.summary,
    doc.content,
  ].join('\n::\n');

  const commitHash = computeCanonicalCommitHash(canonicalPayload);
  return {
    commitId: `dvc-${doc.filingCode.toLowerCase()}-${seq}`,
    commitHash,
    shortHash: commitHash.slice(0, 8),
    parentHash,
    branch,
    surface: params.surface,
    docId: doc.id,
    filingCode: doc.filingCode,
    domain: doc.domain,
    version: doc.version,
    stage: doc.stage,
    operation: params.operation,
    commitMessage: params.commitMessage.slice(0, 240),
    authorName: params.actorName,
    authorRole: params.actorRole,
    reviewerName: doc.lastReviewerName,
    approverName: doc.approverName,
    timestampIso: params.timestampIso,
    titleSnapshot: doc.title,
    summarySnapshot: doc.summary,
    contentSnapshot: doc.content,
    tag: params.tag ?? (doc.stage === 'PUBLISHED' ? `doc-v${doc.version}` : null),
  };
}

/**
 * Seeds realistic historical commits on the separate Documentation VCS ledger so
 * ancestry, diff comparisons, and rollback targets are immediately inspectable.
 */
export function seedInitialDocVcsCommits(
  docs: readonly GovernedDocument[],
): readonly DocVcsCommit[] {
  const commits: DocVcsCommit[] = [];

  for (const doc of docs) {
    const isDriveApp = doc.domain === 'APP';
    const initialSurface: DocVcsSurface = isDriveApp ? 'DRIVE_DOC' : 'LOCAL_MIRROR';

    // Genesis baseline revision (v5.0.0) for key seeded docs to demonstrate real diffs & rollback
    if (doc.filingCode === 'APP-GUI-001') {
      const baseDoc: GovernedDocument = {
        ...doc,
        version: '5.0.0',
        stage: 'DRAFT',
        approverName: null,
        lastReviewerName: null,
        content: [
          '# APP-GUI-001 · Processus de Gestion des Accès & Gouvernance Documentaire',
          '',
          '1. Attribution des rôles : attribution initiale des droits de lecture et rédaction.',
          '2. Séparation Application vs Jeu : préfixes APP-* et JEU-*.',
        ].join('\n'),
      };
      commits.push(
        recordDocVcsCommit(commits, baseDoc, {
          surface: 'DRIVE_DOC',
          operation: 'INIT',
          commitMessage: 'Initialisation Drive/Docs du référentiel RBAC (v5.0.0)',
          actorName: 'Karim Benali',
          actorRole: 'INGENIEUR_APP_SKILLS',
          timestampIso: '2026-11-21T09:00:00Z',
          tag: 'drive-v5.0.0',
        }),
      );
    } else if (doc.filingCode === 'APP-SKL-001') {
      const baseDoc: GovernedDocument = {
        ...doc,
        version: '5.0.0',
        stage: 'DRAFT',
        content: [
          "# APP-SKL-001 · Compétence ('Skill') Oracle Gemini Free Tier",
          '',
          '- Déclenchement : génération de dossiers narratifs et résumés.',
          '- Modèles autorisés : gemini-3.1-flash-lite uniquement.',
        ].join('\n'),
      };
      commits.push(
        recordDocVcsCommit(commits, baseDoc, {
          surface: 'DRIVE_DOC',
          operation: 'INIT',
          commitMessage: 'Création initiale du skill Oracle sur Google Docs',
          actorName: 'Karim Benali',
          actorRole: 'INGENIEUR_APP_SKILLS',
          timestampIso: '2026-11-21T10:30:00Z',
          tag: null,
        }),
      );
    } else if (doc.filingCode === 'JEU-REG-001') {
      const baseDoc: GovernedDocument = {
        ...doc,
        version: '5.0.0',
        stage: 'DRAFT',
        approverName: null,
        lastReviewerName: null,
        content: [
          '# JEU-REG-001 · Règles des Points d’Action & Dossiers Exécutifs',
          '',
          '- Chaque tour exécutif (15 ticks) octroie un budget de PA Général.',
          '- Garantie anti-impasse : option 0-PA obligatoire.',
        ].join('\n'),
      };
      commits.push(
        recordDocVcsCommit(commits, baseDoc, {
          surface: 'LOCAL_MIRROR',
          operation: 'INIT',
          commitMessage: 'Initialisation des règles fondamentales PA (v5.0.0)',
          actorName: 'Elena Vance',
          actorRole: 'AUTEUR_JEU',
          timestampIso: '2026-11-20T14:00:00Z',
          tag: 'game-doc-v5.0.0',
        }),
      );
    }

    commits.push(
      recordDocVcsCommit(commits, doc, {
        surface: initialSurface,
        operation: doc.stage === 'PUBLISHED' ? 'TAG_RELEASE' : 'WORKFLOW_TRANSITION',
        commitMessage:
          doc.auditLog[doc.auditLog.length - 1]?.comment ||
          `Révision ${doc.filingCode} v${doc.version}`,
        actorName: doc.approverName ?? doc.lastAuthorName,
        actorRole: doc.approverName ? 'APPROBATEUR_MAITRE' : doc.ownerRole,
        timestampIso: doc.updatedAtIso,
        tag: doc.stage === 'PUBLISHED' ? `doc-v${doc.version}` : null,
      }),
    );
  }

  return commits;
}

/**
 * Pure line-by-line LCS diff for inspecting documentary revisions without touching source code Git.
 */
export function computeDocLineDiff(beforeText: string, afterText: string): DocDiffResult {
  const a = beforeText.split('\n');
  const b = afterText.split('\n');
  const n = a.length;
  const m = b.length;

  // Build DP table safely with bounded size for documentary snapshots
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      if (a[i] === b[j]) {
        dp[i]![j] = 1 + dp[i + 1]![j + 1]!;
      } else {
        dp[i]![j] = Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
      }
    }
  }

  const lines: DocDiffLine[] = [];
  let i = 0;
  let j = 0;
  let addedCount = 0;
  let removedCount = 0;
  let unchangedCount = 0;

  while (i < n && j < m) {
    if (a[i] === b[j]) {
      lines.push({ kind: 'SAME', oldLine: i + 1, newLine: j + 1, text: a[i]! });
      unchangedCount += 1;
      i += 1;
      j += 1;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      lines.push({ kind: 'DEL', oldLine: i + 1, newLine: null, text: a[i]! });
      removedCount += 1;
      i += 1;
    } else {
      lines.push({ kind: 'ADD', oldLine: null, newLine: j + 1, text: b[j]! });
      addedCount += 1;
      j += 1;
    }
  }

  while (i < n) {
    lines.push({ kind: 'DEL', oldLine: i + 1, newLine: null, text: a[i]! });
    removedCount += 1;
    i += 1;
  }
  while (j < m) {
    lines.push({ kind: 'ADD', oldLine: null, newLine: j + 1, text: b[j]! });
    addedCount += 1;
    j += 1;
  }

  return { addedCount, removedCount, unchangedCount, lines };
}

/**
 * Restores a document snapshot to an earlier VCS commit in DRAFT stage (append-only history).
 * Strictly enforces RBAC EDIT permissions on the target document's track.
 */
export function rollbackDocumentToCommit(
  doc: GovernedDocument,
  commits: readonly DocVcsCommit[],
  targetCommitId: string,
  actorName: string,
  actorRole: GovernanceRoleId,
  reason: string,
  timestampIso: string,
): DocRollbackResult {
  const perm = hasPermission(actorRole, doc.track, 'EDIT');
  if (!perm.allowed) {
    return { ok: false, error: perm.reason };
  }

  const target = commits.find((c) => c.commitId === targetCommitId && c.docId === doc.id);
  if (!target) {
    return { ok: false, error: 'Commit documentaire introuvable pour ce dossier documentaire.' };
  }

  const restoredDoc: GovernedDocument = {
    ...doc,
    title: target.titleSnapshot,
    summary: target.summarySnapshot,
    content: target.contentSnapshot,
    version: target.version,
    stage: 'DRAFT',
    verifiedStandardIds: [],
    lastAuthorName: actorName,
    lastReviewerName: null,
    approverName: null,
    updatedAtIso: timestampIso,
    auditLog: [
      ...doc.auditLog,
      {
        id: `aud-${doc.id}-${doc.auditLog.length + 1}`,
        timestampIso,
        actorName,
        actorRole,
        action: 'ROLLBACK_DOC_VCS',
        fromStage: doc.stage,
        toStage: 'DRAFT',
        comment: `Restauration vers ${target.shortHash} (v${target.version}) : ${reason}`,
      },
    ],
  };

  const rollbackCommit = recordDocVcsCommit(commits, restoredDoc, {
    surface: target.surface,
    operation: 'ROLLBACK',
    commitMessage: `Rollback vers ${target.shortHash} (${reason.slice(0, 120)})`,
    actorName,
    actorRole,
    timestampIso,
    tag: null,
  });

  return {
    ok: true,
    document: restoredDoc,
    commit: rollbackCommit,
  };
}
