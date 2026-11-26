/**
 * [L5] EXW.L5.SOT_MANIFEST | v5.0.0 | SADT A5.2
 * Canonical local mirror of the multi-surface Single Source of Truth (SSoT)
 * synchronized across GitHub (Securityme/Exo-world-2050-Ultra), Gemini Notebook,
 * Google Drive, Google AI Studio Build, and Antigravity Hub.
 */
export interface SotManifestEntry {
  readonly id: string;
  readonly version: string;
  readonly localPath: string;
  readonly role: string;
}

export interface ExternalSsotSurface {
  readonly id: 'GITHUB_REPO' | 'GEMINI_NOTEBOOK' | 'GOOGLE_DRIVE' | 'AISTUDIO_BUILD';
  readonly label: string;
  readonly url: string;
  readonly ownerOrSlug: string;
  readonly accessModel: 'PUBLIC_API' | 'PRIVATE_GOOGLE_AUTH' | 'WORKSPACE_RUNTIME';
  readonly syncBaselineRef: string;
  readonly lastVerifiedIso: string;
}

export const GITHUB_REPO_OWNER = 'Securityme' as const;
export const GITHUB_REPO_NAME = 'Exo-world-2050-Ultra' as const;
export const GITHUB_REPO_BRANCH = 'main' as const;
export const GITHUB_REPO_URL = 'https://github.com/Securityme/Exo-world-2050-Ultra' as const;
export const GITHUB_SYNC_BASELINE_SHA = '75412438e8dc8cc12abf7bded0cdbbb2eeb1f886' as const;

export const GEMINI_NOTEBOOK_ID = 'd937d03d-d9c0-4f71-b89e-45506488e5fb' as const;
export const GEMINI_NOTEBOOK_URL =
  'https://gemini.google.com/notebook/d937d03d-d9c0-4f71-b89e-45506488e5fb' as const;

export const EXTERNAL_SSOT_SURFACES: readonly ExternalSsotSurface[] = Object.freeze([
  {
    id: 'GITHUB_REPO',
    label: 'GitHub · Securityme/Exo-world-2050-Ultra',
    url: GITHUB_REPO_URL,
    ownerOrSlug: `${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}@${GITHUB_REPO_BRANCH}`,
    accessModel: 'PUBLIC_API',
    syncBaselineRef: GITHUB_SYNC_BASELINE_SHA,
    lastVerifiedIso: '2026-11-22T15:50:00Z',
  },
  {
    id: 'GEMINI_NOTEBOOK',
    label: 'Gemini Notebook · EXO WORLD 2050',
    url: GEMINI_NOTEBOOK_URL,
    ownerOrSlug: GEMINI_NOTEBOOK_ID,
    accessModel: 'PRIVATE_GOOGLE_AUTH',
    syncBaselineRef: 'AUTH_REQUIRED_BROWSER_SESSION',
    lastVerifiedIso: '2026-11-22T15:50:00Z',
  },
  {
    id: 'GOOGLE_DRIVE',
    label: 'Google Drive · Partition Maître',
    url: 'https://drive.google.com/drive/folders/19MuQPs6wNfh4jAU1EaEhAq1ZZHSTk93k',
    ownerOrSlug: 'EXO_WORLD_2050_DRIVE',
    accessModel: 'PRIVATE_GOOGLE_AUTH',
    syncBaselineRef: 'OAUTH_PICKER_ISOLATED',
    lastVerifiedIso: '2026-11-22T15:50:00Z',
  },
  {
    id: 'AISTUDIO_BUILD',
    label: 'Google AI Studio Build · Runtime Principal',
    url: 'https://aistudio.google.com/apps/a21d5e66-3b0e-4b54-9e77-3a272b3c94d1?showAssistant=true',
    ownerOrSlug: 'a21d5e66-3b0e-4b54-9e77-3a272b3c94d1',
    accessModel: 'WORKSPACE_RUNTIME',
    syncBaselineRef: 'v5.0.0-roadmap-complete',
    lastVerifiedIso: '2026-11-22T15:50:00Z',
  },
]);

export const SOT_MANIFEST: readonly SotManifestEntry[] = Object.freeze([
  {
    id: 'DOC-EXW-ARCH-001',
    version: 'v2.14.0-MAITRE',
    localPath: 'docs/DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md',
    role: 'Master Blueprint Unifié intégral en 1 fichier (Annexes A-N, docs/master-blueprint/, EXO-DEV-BRIDGE, FUP-018, SADT A0..A5, AR-01..19, R-01..69)',
  },
  {
    id: 'SYS-INST-EXW-001',
    version: 'v5.1.0-alpha.1',
    localPath: 'docs/SYSTEM_INSTRUCTION_LIVE.md',
    role: 'System Instruction universel multi-IA (GitHub Ultra + Drive + AI Studio + Antigravity + Gemini)',
  },
  {
    id: 'SPEC-SRC-DOC-EXW-001',
    version: 'v1.4.0',
    localPath: 'docs/00_INDEX_DOCS.md',
    role: 'Index documentaire unifié Niveau 0 (/docs unique, /docs/master-blueprint/ SSoT, /docs/archive/ figée)',
  },
  {
    id: 'V1-PLAYTEST-6T',
    version: 'v1.0.0',
    localPath: 'docs/archive/changelogs/V1_PLAYTEST_HISTOIRE_6_TOURS.md',
    role: 'Synthèse narrative & télémétrique déterministe 6 tours (compilée en Annexe H du Master Blueprint)',
  },
]);

export const SOT_THEME_ID = 'ASTRALIS_SNAPSHOT_V7' as const;
export const SOT_SHELL_IDENTITY = 'EXO WORLD : 2050 (EXO-SHELL)' as const;
