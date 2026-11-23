import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DocRollbackInputSchema,
  DocVcsCommitCreateInputSchema,
} from '../src/contracts/doc-governance.schema.ts';
import { SwarmHandoffInputSchema } from '../src/contracts/swarm-relay.schema.ts';
import { INITIAL_GOVERNED_DOCUMENTS } from '../src/data/doc-governance.catalog.ts';
import {
  DUAL_WORKFLOW_TRACKS_CATALOG,
  PREVIEW_BRIDGE_CHANNELS,
} from '../src/data/workflow-dual-tracks.catalog.ts';
import { transitionDocumentWorkflow } from '../src/systems/governance/doc-governance.engine.ts';
import {
  computeDocLineDiff,
  getLatestCommitForDocument,
  recordDocVcsCommit,
  resolveDocVcsBranch,
  rollbackDocumentToCommit,
  seedInitialDocVcsCommits,
} from '../src/systems/governance/doc-vcs.engine.ts';
import { buildSwarmHandoffEnvelope } from '../src/systems/governance/swarm-relay.engine.ts';

test('Documentation VCS separates Drive/App branch from Game branch and builds deterministic commit chains', () => {
  const commits = seedInitialDocVcsCommits(INITIAL_GOVERNED_DOCUMENTS);
  assert.ok(commits.length >= INITIAL_GOVERNED_DOCUMENTS.length + 3);

  const appDoc = INITIAL_GOVERNED_DOCUMENTS.find((d) => d.filingCode === 'APP-GUI-001')!;
  const gameDoc = INITIAL_GOVERNED_DOCUMENTS.find((d) => d.filingCode === 'JEU-REG-001')!;
  assert.equal(resolveDocVcsBranch(appDoc.domain), 'docs/drive-sovereign');
  assert.equal(resolveDocVcsBranch(gameDoc.domain), 'docs/game-assets-mirror');

  const appCommits = commits.filter((c) => c.docId === appDoc.id);
  assert.equal(appCommits.length, 2);
  assert.equal(appCommits[0]!.parentHash, null);
  assert.equal(appCommits[1]!.parentHash, appCommits[0]!.commitHash);
  assert.match(appCommits[1]!.commitHash, /^[a-f0-9]{64}$/);
  assert.equal(appCommits[1]!.shortHash, appCommits[1]!.commitHash.slice(0, 8));
});

test('computeDocLineDiff accurately detects added, removed, and unchanged lines', () => {
  const before = ['# Titre', 'Ligne A', 'Ligne B', 'Fin'].join('\n');
  const after = ['# Titre', 'Ligne A modifiée', 'Ligne B', 'Ligne C', 'Fin'].join('\n');

  const diff = computeDocLineDiff(before, after);
  assert.equal(diff.removedCount, 1);
  assert.equal(diff.addedCount, 2);
  assert.equal(diff.unchangedCount, 3);
  assert.ok(diff.lines.some((l) => l.kind === 'DEL' && l.text === 'Ligne A'));
  assert.ok(diff.lines.some((l) => l.kind === 'ADD' && l.text === 'Ligne A modifiée'));
  assert.ok(diff.lines.some((l) => l.kind === 'ADD' && l.text === 'Ligne C'));
});

test('rollbackDocumentToCommit enforces RBAC, restores snapshot to DRAFT, and appends non-destructive ROLLBACK commit', () => {
  const commits = [...seedInitialDocVcsCommits(INITIAL_GOVERNED_DOCUMENTS)];
  const appDoc = INITIAL_GOVERNED_DOCUMENTS.find((d) => d.filingCode === 'APP-GUI-001')!;
  const firstCommit = commits.find((c) => c.docId === appDoc.id && c.operation === 'INIT')!;
  assert.ok(firstCommit);

  // AUTEUR_JEU cannot rollback an APP document
  const denied = rollbackDocumentToCommit(
    appDoc,
    commits,
    firstCommit.commitId,
    'Elena Vance',
    'AUTEUR_JEU',
    'Tentative hors périmètre',
    '2026-11-22T16:00:00Z',
  );
  assert.equal(denied.ok, false);

  // INGENIEUR_APP_SKILLS can rollback an APP document -> resets stage to DRAFT & appends ROLLBACK commit
  const restored = rollbackDocumentToCommit(
    appDoc,
    commits,
    firstCommit.commitId,
    'Karim Benali',
    'INGENIEUR_APP_SKILLS',
    'Revenir à la version v5.0.0 avant audit',
    '2026-11-22T16:05:00Z',
  );
  assert.equal(restored.ok, true);
  assert.equal(restored.document!.stage, 'DRAFT');
  assert.equal(restored.document!.version, '5.0.0');
  assert.equal(restored.document!.verifiedStandardIds.length, 0);
  assert.equal(restored.commit!.operation, 'ROLLBACK');
  assert.equal(
    restored.commit!.parentHash,
    getLatestCommitForDocument(commits, appDoc.id)!.commitHash,
  );

  // Restored document must pass review again before publishing
  const blockedDirectPublish = transitionDocumentWorkflow(
    restored.document!,
    'APPROVE_PUBLISH',
    'Baptiste Lecoustre',
    'APPROBATEUR_MAITRE',
    '2026-11-22T16:06:00Z',
    'Tentative publication directe après rollback',
  );
  assert.equal(blockedDirectPublish.ok, false);
});

test('Dual Workflow Catalog & Doc VCS Zod schemas cleanly separate Drive/Docs from App/Game Code', () => {
  assert.equal(DUAL_WORKFLOW_TRACKS_CATALOG.length, 2);
  const docsTrack = DUAL_WORKFLOW_TRACKS_CATALOG.find((t) => t.id === 'TRACK_A_DRIVE_DOCS')!;
  const codeTrack = DUAL_WORKFLOW_TRACKS_CATALOG.find((t) => t.id === 'TRACK_B_APP_GAME_CODE')!;
  assert.equal(docsTrack.vcsBranchName, 'docs/drive-sovereign');
  assert.ok(codeTrack.vcsBranchName.includes('main'));
  assert.ok(docsTrack.steps.length >= 5);
  assert.ok(codeTrack.steps.length >= 5);
  assert.equal(PREVIEW_BRIDGE_CHANNELS.length, 3);

  const commitParse = DocVcsCommitCreateInputSchema.safeParse({
    docId: 'gov-app-gui-001',
    surface: 'DRIVE_DOC',
    commitMessage: 'Synchronisation Google Docs section 4',
    actorName: 'Karim Benali',
    actorRole: 'INGENIEUR_APP_SKILLS',
  });
  assert.equal(commitParse.success, true);

  const rollbackParse = DocRollbackInputSchema.safeParse({
    targetCommitId: 'dvc-app-gui-001-1',
    reason: 'Restaurer snapshot stable v5.0.0',
    actorName: 'Karim Benali',
    actorRole: 'INGENIEUR_APP_SKILLS',
  });
  assert.equal(rollbackParse.success, true);

  // Record additional commit cleanly
  const baseCommits = seedInitialDocVcsCommits(INITIAL_GOVERNED_DOCUMENTS);
  const doc = INITIAL_GOVERNED_DOCUMENTS[0]!;
  const newCommit = recordDocVcsCommit(baseCommits, doc, {
    surface: 'DRIVE_DOC',
    operation: 'DRIVE_PATCH_SYNC',
    commitMessage: 'Patch confirmé depuis Google Picker',
    actorName: 'Karim Benali',
    actorRole: 'INGENIEUR_APP_SKILLS',
    timestampIso: '2026-11-22T16:10:00Z',
  });
  assert.equal(newCommit.surface, 'DRIVE_DOC');
  assert.equal(newCommit.operation, 'DRIVE_PATCH_SYNC');
});

test('Swarm Relay Engine validates payloads, blocks secrets/R-50 violations, and builds Preview-to-Antigravity envelopes', () => {
  const parsed = SwarmHandoffInputSchema.parse({
    fromSurface: 'AISTUDIO_PREVIEW',
    toSurface: 'ANTIGRAVITY_IDE',
    targetAgentCode: 'N0 · ARGON',
    workflowTrack: 'APP_GAME_CODE',
    priority: 'HIGH',
    title: 'Synchroniser VCS Documentation et parité Preview',
    objective:
      'Vérifier la branche docs/drive-sovereign et aligner les tests Antigravity avec le Preview Live.',
    targetFiles: ['src/systems/governance/doc-vcs.engine.ts'],
    docVcsHeadHash: 'abcd1234',
    previewOrigin: 'https://ais-dev-opxn7hr3lsy5xfjqnwz27o-802398497019.europe-west2.run.app',
  });

  const envelope = buildSwarmHandoffEnvelope(parsed, 7, '5.1.0', '2026-11-22T16:15:00Z');
  assert.equal(envelope.ok, true);
  assert.equal(envelope.message!.ticketId, 'EXW-SWARM-007');
  assert.ok(envelope.message!.promptPayload.includes('[EXO-SWARM-HANDOFF · EXW-SWARM-007]'));
  assert.ok(envelope.message!.promptPayload.includes('ANTIGRAVITY_IDE'));

  // Secret leakage blocked
  const syntheticSecret = ['AIza', 'SyFakeLeakedKeyValue1234567890123456'].join('');
  const secretBlocked = buildSwarmHandoffEnvelope(
    { ...parsed, objective: `Test secret ${syntheticSecret}` },
    8,
    '5.1.0',
    '2026-11-22T16:16:00Z',
  );
  assert.equal(secretBlocked.ok, false);
});
