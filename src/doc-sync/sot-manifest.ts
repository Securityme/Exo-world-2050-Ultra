/**
 * [L5] EXW.L5.SOT_MANIFEST | v1.6.0 | SADT A5.2
 * Canonical local mirror of the 5-surface Single Source of Truth (SSoT)
 * synchronized across Drive, Google AI Studio Build, GitHub, Gemini Lead, and Antigravity Hub.
 */
export interface SotManifestEntry {
  readonly id: string;
  readonly version: string;
  readonly localPath: string;
  readonly role: string;
}

export const SOT_MANIFEST: readonly SotManifestEntry[] = Object.freeze([
  {
    id: 'DOC-EXW-ARCH-001',
    version: 'v2.10.0-MAITRE',
    localPath: 'docs/DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md',
    role: 'Master Blueprint partitionné (Annexes A-G, SADT A0..A5, AR-01..18, R-01..69)',
  },
  {
    id: 'SYS-INST-EXW-001',
    version: 'v1.6.0',
    localPath: 'docs/SYSTEM_INSTRUCTION_LIVE.md',
    role: 'System Instruction universel multi-IA (override temps réel)',
  },
  {
    id: 'SPEC-SRC-DOC-EXW-001',
    version: 'v1.2.0',
    localPath: 'docs/architecture/05_SRC_ARBO_AISTUDIO_COMPLETE.md',
    role: 'Arborescence plate normative 24 domaines L0 -> L8 (0 src/features, 0 src/handlers)',
  },
  {
    id: 'V1-PLAYTEST-6T',
    version: 'v1.0.0',
    localPath: 'docs/changelogs/V1_PLAYTEST_HISTOIRE_6_TOURS.md',
    role: 'Synthèse narrative & télémétrique déterministe 6 tours (90 ticks, seed 0x2050E801)',
  },
]);

export const SOT_THEME_ID = 'ASTRALIS_SNAPSHOT_V7' as const;
export const SOT_SHELL_IDENTITY = 'EXO WORLD : 2050 (EXO-SHELL)' as const;
