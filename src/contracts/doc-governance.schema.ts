import { z } from 'zod';

/**
 * [L0] EXW.L0.DOC_GOVERNANCE_SCHEMA | v5.1.0 | SADT A5.4
 * Strict Zod contracts for RBAC Roles & Permissions, 3-Track Validation Workflow
 * (Application Tech Docs, Skills, Game Content), and Separated App vs Game Taxonomy.
 */

export const DocDomainScopeSchema = z.enum(['APP', 'GAME']);
export type DocDomainScope = z.infer<typeof DocDomainScopeSchema>;

export const ContentTrackSchema = z.enum(['APP_DOC', 'SKILLS', 'GAME_DOC']);
export type ContentTrack = z.infer<typeof ContentTrackSchema>;

export const DocCategoryCodeSchema = z.enum([
  // Pôle Application (APP)
  'APP-UPD', // Mises à jour, notes de version & migrations
  'APP-GUI', // Guides utilisateur, gouvernance & administration
  'APP-TEC', // Architecture & spécifications techniques
  'APP-SKL', // Compétences ('skills') & procédures d'exécution
  // Pôle Jeu (GAME)
  'JEU-REG', // Règles, systèmes & mécaniques de jeu
  'JEU-SCE', // Scénarios, campagne, dossiers & lore
  'JEU-BAL', // Équilibrage, matrices & playtests
  'JEU-VIS', // Direction artistique, 3D & univers visuel
]);
export type DocCategoryCode = z.infer<typeof DocCategoryCodeSchema>;

export const GovernanceRoleIdSchema = z.enum([
  'LECTEUR',
  'AUTEUR_JEU',
  'INGENIEUR_APP_SKILLS',
  'REVISEUR_QUALITE',
  'APPROBATEUR_MAITRE',
]);
export type GovernanceRoleId = z.infer<typeof GovernanceRoleIdSchema>;

export const GovernancePermissionSchema = z.enum([
  'READ',
  'CREATE',
  'EDIT',
  'SUBMIT_REVIEW',
  'REVIEW_TECHNICAL',
  'REVIEW_SKILLS',
  'REVIEW_GAME',
  'REQUEST_CHANGES',
  'APPROVE_PUBLISH',
  'ARCHIVE',
  'MANAGE_ROLES',
]);
export type GovernancePermission = z.infer<typeof GovernancePermissionSchema>;

export const WorkflowStageSchema = z.enum([
  'DRAFT',
  'TECH_REVIEW',
  'SKILLS_REVIEW',
  'GAME_REVIEW',
  'CHANGES_REQUESTED',
  'READY_FOR_APPROVAL',
  'PUBLISHED',
  'ARCHIVED',
]);
export type WorkflowStage = z.infer<typeof WorkflowStageSchema>;

export const WorkflowActionSchema = z.enum([
  'SUBMIT_REVIEW',
  'PASS_SPECIALIZED_REVIEW',
  'REQUEST_CHANGES',
  'APPROVE_PUBLISH',
  'REOPEN_DRAFT',
  'ARCHIVE',
]);
export type WorkflowAction = z.infer<typeof WorkflowActionSchema>;

export const QualityCheckItemSchema = z.object({
  id: z.string().min(2).max(60),
  label: z.string().min(4).max(160),
  automated: z.boolean(),
  passed: z.boolean(),
  detail: z.string().min(2).max(240),
});
export type QualityCheckItem = z.infer<typeof QualityCheckItemSchema>;

export const WorkflowAuditEventSchema = z.object({
  id: z.string().min(2).max(80),
  timestampIso: z.string().min(10).max(40),
  actorName: z.string().min(1).max(80),
  actorRole: GovernanceRoleIdSchema,
  action: z.string().min(2).max(60),
  fromStage: WorkflowStageSchema,
  toStage: WorkflowStageSchema,
  comment: z.string().max(400),
});
export type WorkflowAuditEvent = z.infer<typeof WorkflowAuditEventSchema>;

export const GovernedDocumentSchema = z.object({
  id: z.string().min(2).max(80),
  filingCode: z.string().regex(/^(APP|JEU)-[A-Z]{3}-\d{3}$/, 'Code de classement invalide (ex: APP-GUI-001)'),
  domain: DocDomainScopeSchema,
  track: ContentTrackSchema,
  categoryCode: DocCategoryCodeSchema,
  title: z.string().min(4).max(140),
  summary: z.string().min(10).max(400),
  content: z.string().min(20).max(16000),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/, 'Version SemVer attendue (ex: 5.1.0)'),
  stage: WorkflowStageSchema,
  ownerName: z.string().min(2).max(80),
  ownerRole: GovernanceRoleIdSchema,
  lastAuthorName: z.string().min(2).max(80),
  lastReviewerName: z.string().max(80).nullable(),
  approverName: z.string().max(80).nullable(),
  updatedAtIso: z.string().min(10).max(40),
  verifiedStandardIds: z.array(z.string().min(2).max(60)).max(20),
  tags: z.array(z.string().min(1).max(40)).max(12),
  sourcePath: z.string().max(200).nullable(),
  auditLog: z.array(WorkflowAuditEventSchema).max(60),
});
export type GovernedDocument = z.infer<typeof GovernedDocumentSchema>;

export const RoleAssignmentSchema = z.object({
  memberId: z.string().min(2).max(60),
  displayName: z.string().min(2).max(80),
  scopeLabel: z.string().min(2).max(120),
  roleId: GovernanceRoleIdSchema,
  assignedAtIso: z.string().min(10).max(40),
  assignedBy: z.string().min(2).max(80),
});
export type RoleAssignment = z.infer<typeof RoleAssignmentSchema>;

export const CreateDocumentInputSchema = z.object({
  categoryCode: DocCategoryCodeSchema,
  title: z.string().trim().min(4).max(140),
  summary: z.string().trim().min(10).max(400),
  content: z.string().trim().min(20).max(16000),
  version: z.string().trim().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/),
  tags: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
  actorName: z.string().trim().min(2).max(80),
  actorRole: GovernanceRoleIdSchema,
});
export type CreateDocumentInput = z.infer<typeof CreateDocumentInputSchema>;

export const UpdateDocumentInputSchema = z.object({
  title: z.string().trim().min(4).max(140).optional(),
  summary: z.string().trim().min(10).max(400).optional(),
  content: z.string().trim().min(20).max(16000).optional(),
  version: z.string().trim().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(8).optional(),
  verifiedStandardIds: z.array(z.string().min(2).max(60)).max(20).optional(),
  actorName: z.string().trim().min(2).max(80),
  actorRole: GovernanceRoleIdSchema,
});
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentInputSchema>;

export const TransitionDocumentInputSchema = z.object({
  action: WorkflowActionSchema,
  actorName: z.string().trim().min(2).max(80),
  actorRole: GovernanceRoleIdSchema,
  comment: z.string().trim().max(400).default(''),
  verifiedStandardIds: z.array(z.string().min(2).max(60)).max(20).optional(),
});
export type TransitionDocumentInput = z.infer<typeof TransitionDocumentInputSchema>;

export const UpdateRoleAssignmentInputSchema = z.object({
  memberId: z.string().trim().min(2).max(60),
  newRoleId: GovernanceRoleIdSchema,
  actorName: z.string().trim().min(2).max(80),
  actorRole: GovernanceRoleIdSchema,
});
export type UpdateRoleAssignmentInput = z.infer<typeof UpdateRoleAssignmentInputSchema>;

// === DOCUMENTATION GIT-LIKE VERSION CONTROL SYSTEM (SEPARATE FROM APP/GAME CODE) ===

export const DocVcsBranchSchema = z.enum([
  'docs/drive-sovereign',
  'docs/game-assets-mirror',
]);
export type DocVcsBranch = z.infer<typeof DocVcsBranchSchema>;

export const DocVcsSurfaceSchema = z.enum([
  'DRIVE_DOC',
  'APP_HUB',
  'LOCAL_MIRROR',
]);
export type DocVcsSurface = z.infer<typeof DocVcsSurfaceSchema>;

export const DocVcsOperationSchema = z.enum([
  'INIT',
  'EDIT',
  'WORKFLOW_TRANSITION',
  'DRIVE_PATCH_SYNC',
  'ROLLBACK',
  'TAG_RELEASE',
]);
export type DocVcsOperation = z.infer<typeof DocVcsOperationSchema>;

export const DocVcsCommitSchema = z.object({
  commitId: z.string().min(4).max(80),
  commitHash: z.string().regex(/^[a-f0-9]{64}$/),
  shortHash: z.string().regex(/^[a-f0-9]{8}$/),
  parentHash: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  branch: DocVcsBranchSchema,
  surface: DocVcsSurfaceSchema,
  docId: z.string().min(2).max(80),
  filingCode: z.string().regex(/^(APP|JEU)-[A-Z]{3}-\d{3}$/),
  domain: DocDomainScopeSchema,
  version: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/),
  stage: WorkflowStageSchema,
  operation: DocVcsOperationSchema,
  commitMessage: z.string().min(4).max(240),
  authorName: z.string().min(2).max(80),
  authorRole: GovernanceRoleIdSchema,
  reviewerName: z.string().max(80).nullable(),
  approverName: z.string().max(80).nullable(),
  timestampIso: z.string().min(10).max(40),
  titleSnapshot: z.string().min(4).max(140),
  summarySnapshot: z.string().min(10).max(400),
  contentSnapshot: z.string().min(20).max(16000),
  tag: z.string().max(48).nullable().default(null),
});
export type DocVcsCommit = z.infer<typeof DocVcsCommitSchema>;

export const DocVcsCommitCreateInputSchema = z.object({
  docId: z.string().trim().min(2).max(80),
  surface: DocVcsSurfaceSchema.default('APP_HUB'),
  commitMessage: z.string().trim().min(4).max(240),
  title: z.string().trim().min(4).max(140).optional(),
  summary: z.string().trim().min(10).max(400).optional(),
  content: z.string().trim().min(20).max(16000).optional(),
  version: z.string().trim().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/).optional(),
  tag: z.string().trim().max(48).nullable().optional(),
  actorName: z.string().trim().min(2).max(80),
  actorRole: GovernanceRoleIdSchema,
});
export type DocVcsCommitCreateInput = z.infer<typeof DocVcsCommitCreateInputSchema>;

export const DocRollbackInputSchema = z.object({
  targetCommitId: z.string().trim().min(4).max(80),
  reason: z.string().trim().min(6).max(240),
  actorName: z.string().trim().min(2).max(80),
  actorRole: GovernanceRoleIdSchema,
});
export type DocRollbackInput = z.infer<typeof DocRollbackInputSchema>;

