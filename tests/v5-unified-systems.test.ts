import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createInitialWorldState } from '../src/core/loop/cycle-orchestrator.ts';
import {
  computeBioHealthReport,
  mapAtmosphereToDivision,
} from '../src/systems/biosphere-cabinet/bioclimate-health.ts';
import {
  executeEcclesiaDiscernmentPure,
  executeSignPlanetaryTreatyPure,
  stepPlanetaryTreatiesPure,
} from '../src/systems/geopolitics/planetary-diplomacy.ts';
import {
  bumpSkillSemver,
  computeLineDiff,
  createInitialDocVcsStoreState,
  createNewDocEntry,
  createRevisionFromEdit,
  generateCloseVariantsFromSelection,
  generateInitialSuggestions,
  generateNextSuggestionsBatch,
  revertDocToRevision,
  toggleSkillEnabled,
  updateSkillConfig,
} from '../src/systems/governance/skills-vcs.engine.ts';
import {
  appendDevCommsMessage,
  appendTriSurfaceSyncLog,
  createInitialDevBridgeState,
  formatInterIaBusMarkdown,
  sanitizeWorkspaceRelativePath,
} from '../src/systems/governance/dev-bridge.engine.ts';

test('V5.1-1: Docs VCS lifecycle (create, SemVer revision, SHA digest, line diff, non-destructive REVERT)', () => {
  const initial = createInitialDocVcsStoreState();
  assert.ok(initial.docs.length >= 10);
  assert.equal(initial.skills.length, 9);

  const created = createNewDocEntry(initial, {
    docId: 'doc-test-nf-audit',
    title: 'Dossier DMT-SW Test',
    category: 'NORMS_NF_AFNOR',
    domain: 'SYSTEM',
    content: '# Titre\nLigne A\nLigne B',
    author: 'QA Lead',
    createdAtIso: '2026-11-24T12:10:00.000Z',
    tags: ['DMT-SW'],
  });
  assert.equal(created.createdDoc.currentSemver, '1.0.0');

  const rev2 = createRevisionFromEdit(created.nextStore, {
    docId: 'doc-test-nf-audit',
    nextContent: '# Titre\nLigne A\nLigne C modifiée\nLigne D',
    summary: 'Ajout section traçabilité',
    author: 'QA Lead',
    bumpKind: 'minor',
    source: 'LOCAL',
    createdAtIso: '2026-11-24T12:20:00.000Z',
  });
  assert.ok(rev2.createdRevision);
  assert.equal(rev2.createdRevision.semver, '1.1.0');
  assert.notEqual(rev2.createdRevision.contentHash, created.createdDoc.currentContentHash);

  const diff = computeLineDiff('# Titre\nLigne A\nLigne B', rev2.createdRevision.content);
  assert.ok(diff.some((d) => d.kind === 'REMOVED' && d.text === 'Ligne B'));
  assert.ok(diff.some((d) => d.kind === 'ADDED' && d.text === 'Ligne C modifiée'));

  const rev1Id = created.createdDoc.currentRevisionId;
  const reverted = revertDocToRevision(rev2.nextStore, {
    docId: 'doc-test-nf-audit',
    targetRevisionId: rev1Id,
    author: 'QA Lead',
    createdAtIso: '2026-11-24T12:30:00.000Z',
  });
  assert.ok(reverted.revertRevision);
  assert.equal(reverted.revertRevision.source, 'REVERT');
  assert.equal(reverted.revertRevision.content, '# Titre\nLigne A\nLigne B');
  // Non-destructive: all 3 revisions remain in history
  const history = reverted.nextStore.revisions.filter((r) => r.docId === 'doc-test-nf-audit');
  assert.equal(history.length, 3);
});

test('V5.1-2: Modular Skills remain strictly isolated from Docs VCS revisions & resolve docId', () => {
  const initial = createInitialDocVcsStoreState();
  const prevRevCount = initial.revisions.length;
  const docIds = new Set(initial.docs.map((d) => d.docId));

  for (const skill of initial.skills) {
    assert.ok(docIds.has(skill.docId), `Missing linked doc ${skill.docId} for skill ${skill.id}`);
  }

  const targetId = initial.skills[0]!.id;
  const s1 = toggleSkillEnabled(initial, targetId, '2026-11-24T13:00:00.000Z');
  const s2 = bumpSkillSemver(s1, targetId, 'minor', '2026-11-24T13:01:00.000Z');
  const s3 = updateSkillConfig(s2, targetId, { strictLayerGuards: false, maxCyclomaticWarn: 70 }, '2026-11-24T13:02:00.000Z');

  assert.equal(s3.revisions.length, prevRevCount);
  assert.deepEqual(s3.docs, initial.docs);
  const updatedSkill = s3.skills.find((s) => s.id === targetId);
  assert.ok(updatedSkill);
  assert.equal(updatedSkill.enabled, !initial.skills[0]!.enabled);
  assert.equal(updatedSkill.config['maxCyclomaticWarn'], 70);
});

test('V5.1-3: Combinatorial Suggestion Bubbles respect persistent dismiss & multi-select close variants', () => {
  const initial = generateInitialSuggestions('PLANET', 2050, [], 6);
  assert.equal(initial.length, 6);

  const dismissed = [initial[0]!, initial[1]!];
  const nextBatch = generateNextSuggestionsBatch('PLANET', 1, 2050, dismissed, 6);
  for (const item of dismissed) {
    assert.ok(!nextBatch.includes(item), `Dismissed bubble "${item}" must never reappear`);
  }

  const selected = [initial[2]!, initial[3]!];
  const variants = generateCloseVariantsFromSelection('PLANET', selected, 2050, dismissed, 6);
  assert.equal(variants.length, 6);
  for (const item of [...dismissed, ...selected]) {
    assert.ok(!variants.includes(item));
  }
});

test('V5.1-4: 5 Scientific Divisions BioHealth (FEAT-53) & P0 Catastrophe cap <= 2 (FEAT-54)', () => {
  const world = createInitialWorldState({
    campaignId: 'test-biohealth-5div',
    worldSeed: 2050,
    superpowerId: 'eu-spatiale',
    doctrineId: 'SOLARPUNK',
    rivalCount: 5,
    biomeId: 'MONDE_OCEANIQUE',
    oceanCoveragePct: 78,
  });

  assert.equal(mapAtmosphereToDivision('P1', 10), 'EXOSPHERE_0');
  assert.equal(mapAtmosphereToDivision('P2', 30), 'THERMOSPHERE_1');
  assert.equal(mapAtmosphereToDivision('P3', 55), 'MESOSPHERE_2');
  assert.equal(mapAtmosphereToDivision('P4', 78), 'STRATOSPHERE_3');
  assert.equal(mapAtmosphereToDivision('P4', 94), 'TROPOSPHERE_4');

  const bh = computeBioHealthReport(world);
  assert.ok(bh.compositeBioHealth >= 0 && bh.compositeBioHealth <= 100);
  const p0Count = world.activeDossiers.filter((d) => d.dossierClass === 'P0').length;
  assert.ok(p0Count <= 2);
});

test('V5.1-5: Planetary Diplomacy treaties & cycle accrual work deterministically', () => {
  const world = createInitialWorldState({
    campaignId: 'test-diplomacy',
    worldSeed: 2050,
    superpowerId: 'eu-spatiale',
    doctrineId: 'SOLARPUNK',
    rivalCount: 5,
  });

  const maritime = executeSignPlanetaryTreatyPure(world, 'MARITIME_TRADE');
  assert.equal(maritime[0], null);
  assert.ok(maritime[1]);
  const w1 = maritime[1].nextState;
  assert.equal(w1.planetaryDiplomacy?.treaties.length, 1);

  const nonAgg = executeSignPlanetaryTreatyPure(w1, 'NON_AGGRESSION');
  assert.equal(nonAgg[0], null);
  assert.ok(nonAgg[1]);

  const embargo = executeSignPlanetaryTreatyPure(nonAgg[1].nextState, 'ORBITAL_EMBARGO', w1.rivals[1]?.id);
  assert.equal(embargo[0], null);
  assert.ok(embargo[1]);

  const stepped = stepPlanetaryTreatiesPure(embargo[1].nextState);
  assert.ok(stepped.treatyCreditsDelta > 0);
  assert.ok(stepped.treatyComputeDelta > 0);
});

test('V5.1-6: Ecclesia & Discernment preserves 100% Freedom of Conscience invariant (AR-19)', () => {
  let world = createInitialWorldState({
    campaignId: 'test-ecclesia-ar19',
    worldSeed: 2050,
    superpowerId: 'eu-spatiale',
    doctrineId: 'SOLARPUNK',
    rivalCount: 5,
  });

  for (const axis of ['PASTORAL', 'CHARITY', 'CONTEMPLATION', 'DIALOGUE'] as const) {
    const res = executeEcclesiaDiscernmentPure(world, axis);
    assert.equal(res[0], null);
    assert.ok(res[1]);
    world = res[1].nextState;
    assert.equal(world.ecclesiaState?.freedomOfConscienceScore, 100);
    assert.equal(world.ecclesiaState?.lastDiscernmentGrade, 3);
  }
});

test('V5.1-7: Free Tier strict guard (HTTP 403) and zero R-50 forbidden word in src/ & server.ts', () => {
  const serverTxt = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
  assert.ok(serverTxt.includes('FREE_TIER_ALLOWED_MODELS'));
  assert.ok(serverTxt.includes('res.status(403)'));

  const r50Word = ['ano', 'malie'].join('');
  const srcRoot = path.join(process.cwd(), 'src');
  const stack = [srcRoot];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        if (full.endsWith('z0-legacy.guard.ts') || full.endsWith('llm-lexicon.ts')) continue;
        const txt = fs.readFileSync(full, 'utf8').toLowerCase();
        assert.ok(!txt.includes(r50Word), `Forbidden R-50 word found in ${full}`);
      }
    }
  }
});

test('V5.1-8: Dev Bridge path guard allows unified docs/ & .exo-sync/ and blocks legacy/traversal paths', () => {
  assert.equal(sanitizeWorkspaceRelativePath('docs/DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md').ok, true);
  assert.equal(sanitizeWorkspaceRelativePath('docs/master-blueprint/M0_MetaSemVer.json').ok, true);
  assert.equal(sanitizeWorkspaceRelativePath('.exo-sync/handoff.yaml').ok, true);
  assert.equal(sanitizeWorkspaceRelativePath('master-blueprint/M0_MetaSemVer.json').ok, false);
  assert.equal(sanitizeWorkspaceRelativePath('../secret.md').ok, false);
  assert.equal(sanitizeWorkspaceRelativePath('/etc/passwd').ok, false);
  assert.equal(sanitizeWorkspaceRelativePath('docs/evil.ts').ok, false);

  const s0 = createInitialDevBridgeState();
  const s1 = appendDevCommsMessage(s0, {
    id: 'msg-test-bus',
    sender: 'USER',
    target: 'ANTIGRAVITY',
    kind: 'DIRECTIVE',
    content: 'Vérifier la synchronisation tri-surface sur /docs/DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md',
    linkedPath: 'docs/DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md',
    createdAtIso: '2026-11-24T14:00:00.000Z',
  });
  assert.equal(s1.messages[0]?.id, 'msg-test-bus');
  assert.ok(formatInterIaBusMarkdown(s1.messages).includes('BUS-EXW-001'));

  const s2 = appendTriSurfaceSyncLog(s1, {
    syncId: 'sync-test-01',
    relativePath: '.exo-sync/smoke.md',
    contentSha256: 'abc12345def67890',
    commitSummary: 'test tri-surface log',
    createdAtIso: '2026-11-24T14:05:00.000Z',
    aiStudio: { status: 'SUCCESS', detail: 'ok', referenceUrl: '', referenceShaOrId: 'abc12345' },
    drive: { status: 'AUTH_REQUIRED', detail: 'oauth', referenceUrl: '', referenceShaOrId: '' },
    github: { status: 'AUTH_REQUIRED', detail: 'oauth', referenceUrl: '', referenceShaOrId: '' },
  });
  assert.equal(s2.syncLogs[0]?.syncId, 'sync-test-01');
});

test('V5.1-9: Unified /docs folder removes root duplicates, keeps docs/master-blueprint SSoT & compiles Blueprint v2.14.0 (Annexes A-N)', () => {
  const root = process.cwd();
  assert.equal(fs.existsSync(path.join(root, 'master-blueprint')), false);
  assert.equal(fs.existsSync(path.join(root, 'INDEX.md')), false);
  assert.equal(fs.existsSync(path.join(root, 'CHANGELOG.txt')), false);
  assert.equal(fs.existsSync(path.join(root, 'ARCHITECTURE_MIGRATION_PLAN.md')), false);
  assert.equal(fs.existsSync(path.join(root, 'docs', 'master-blueprint', 'M0_MetaSemVer.json')), true);
  assert.equal(fs.existsSync(path.join(root, 'docs', '00_INDEX_DOCS.md')), true);
  assert.equal(fs.existsSync(path.join(root, 'docs', 'CHANGELOG.txt')), true);
  assert.equal(fs.existsSync(path.join(root, 'docs', 'archive', 'ARCHITECTURE_MIGRATION_PLAN.md')), true);

  const bpPath = path.join(root, 'docs', 'DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md');
  const bpTxt = fs.readFileSync(bpPath, 'utf8');
  assert.ok(bpTxt.includes('v2.14.0-MAITRE'));
  assert.ok(bpTxt.includes('# **15\\. ESPACE DEV & CONNECTIVITÉ MULTI-SURFACES (`EXO-DEV-BRIDGE`)**'));
  assert.ok(bpTxt.includes('# **H. ANNEXE H'));
  assert.ok(bpTxt.includes('# **K. ANNEXE K'));
  assert.ok(bpTxt.includes('# **N. ANNEXE N'));
  assert.ok(bpTxt.includes('FUP-018'));
  assert.ok(bpTxt.includes('PARTITION MÉTADONNÉES MULTI-NIVEAUX'));
  const idxTxt = fs.readFileSync(path.join(root, 'docs', '00_INDEX_DOCS.md'), 'utf8');
  assert.ok(idxTxt.includes('PARTITION MÉTADONNÉES (H × V)'));
});

import { FALLBACK_DOSSIERS_CATALOG } from '../src/data/fallback-dossiers.catalog.ts';
import {
  evaluateOptionUnlockFactors,
  findRecommendedColonistsForOption,
} from '../src/systems/dossiers-pa/multi-factor-unlock.engine.ts';
import { evaluateBudgetedSelection } from '../src/systems/dossiers-pa/budgeted-selection.engine.ts';
import { getEffectiveOptionsForDossier } from '../src/systems/dossiers-pa/dossier-subchoices.ts';
import { executeDossierDecision } from '../src/systems/dossiers-pa/pa-engine.ts';

test('V5.1-10: Multi-Factor Conditional Unlock enforces colonist specialty, level, skill, era & recommends teammate', () => {
  const world = createInitialWorldState({
    campaignId: 'test-multifactor-unlock',
    worldSeed: 2050,
    superpowerId: 'eu-spatiale',
    doctrineId: 'SOLARPUNK',
    rivalCount: 5,
  });
  const charter = FALLBACK_DOSSIERS_CATALOG.find((d) => d.id === 'dos-c1-horizon-charter')!;
  const options = getEffectiveOptionsForDossier(charter);
  assert.ok(options.length >= 6);

  const engOpt = options.find((o) => o.id === 'opt-c1-eng-microgrid')!;
  const eraCyberOpt = options.find((o) => o.id === 'opt-c1-cyber-consensus')!;
  const advisorId = world.advisors[0]!.id;

  // Without assigned colonist: locked on colonist & skill
  const lockedEval = evaluateOptionUnlockFactors(world, engOpt, advisorId, []);
  assert.equal(lockedEval.unlocked, false);
  assert.ok(lockedEval.factors.some((f) => f.id === 'colonist' && !f.met));

  // Assign wrong specialty (col-3 Amina EXOBIOLOGY): still locked
  const wrongColEval = evaluateOptionUnlockFactors(world, engOpt, advisorId, ['col-3']);
  assert.equal(wrongColEval.unlocked, false);

  // Recommend qualified teammate (Nadia Kowalski, ENGINEERING lvl 2) -> unlocked!
  const recommended = findRecommendedColonistsForOption(world, engOpt, 2);
  assert.ok(recommended.includes('col-1'));
  const unlockedEval = evaluateOptionUnlockFactors(world, engOpt, advisorId, recommended);
  assert.equal(unlockedEval.unlocked, true);
  assert.ok(unlockedEval.combinedSkillScore >= 12);

  // Era 2 option stays locked in Era 1 even with Cyberneticist Kenji (col-2) assigned
  const eraLocked = evaluateOptionUnlockFactors(world, eraCyberOpt, advisorId, ['col-2']);
  assert.equal(eraLocked.unlocked, false);
  assert.ok(eraLocked.factors.some((f) => f.id === 'era' && !f.met));
});

test('V5.1-11: Budgeted Multi-Choice bundle validates caps & applies additive effects + colonist XP/fatigue', () => {
  const world = createInitialWorldState({
    campaignId: 'test-budgeted-multi',
    worldSeed: 2050,
    superpowerId: 'eu-spatiale',
    doctrineId: 'SOLARPUNK',
    rivalCount: 5,
  });
  const dossier = world.activeDossiers.find((d) => d.code === 'EXW-C1-01') ?? world.activeDossiers[0]!;
  const options = getEffectiveOptionsForDossier(dossier);
  const advisorId = world.advisors[0]!.id;

  // Cannot mix DEFER or exceed selection cap
  const overCap = evaluateBudgetedSelection(
    world,
    dossier,
    options,
    ['opt-c1-open-sky', 'opt-c1-corp-grid', 'opt-c1-eng-microgrid', 'opt-c1-zero-charter'],
    undefined,
    0,
    advisorId,
    ['col-1'],
  );
  assert.equal(overCap.allowed, false);

  // Multi-choice bundle without colonist rejected because requireColonistOnBundle = true
  const noColBundle = evaluateBudgetedSelection(
    world,
    dossier,
    options,
    ['opt-c1-open-sky', 'opt-c1-corp-grid'],
    undefined,
    0,
    advisorId,
    [],
  );
  assert.equal(noColBundle.allowed, false);

  // Valid 2-option bundle with qualified engineer Nadia Kowalski (col-1)
  const validBundle = evaluateBudgetedSelection(
    world,
    dossier,
    options,
    ['opt-c1-open-sky', 'opt-c1-eng-microgrid'],
    undefined,
    0,
    advisorId,
    ['col-1'],
  );
  assert.equal(validBundle.allowed, true);
  assert.equal(validBundle.selectedOptions.length, 2);

  const prevEnergy = world.resources.energy;
  const prevNadia = world.colonists.find((c) => c.id === 'col-1')!;
  const [execErr, execRes] = executeDossierDecision(world, {
    dossierId: dossier.id,
    optionId: 'opt-c1-open-sky',
    extraOptionIds: ['opt-c1-eng-microgrid'],
    refinementLevel: 0,
    assignedAdvisorId: advisorId,
    assignedColonistIds: ['col-1'],
    useGeneralPaFallback: true,
    moduleExtensionTag: 'NONE',
  });
  assert.equal(execErr, null);
  assert.ok(execRes);
  const nextNadia = execRes.nextState.colonists.find((c) => c.id === 'col-1')!;
  assert.ok(execRes.nextState.resources.energy > prevEnergy);
  assert.ok(nextNadia.fatigue > prevNadia.fatigue);
  assert.ok((nextNadia.xp ?? 0) !== (prevNadia.xp ?? 0) || (nextNadia.level ?? 1) > (prevNadia.level ?? 1));
});

import { buildPartitionedEventBilan } from '../src/systems/dossiers-pa/dossier-bilan-poles.ts';

test('V5.1-12: Partitioned 4-Pole Event Bilan includes building actions, economy, biosphere & human poles', () => {
  const world = createInitialWorldState({
    campaignId: 'test-bilan-poles',
    worldSeed: 2050,
    superpowerId: 'eu-spatiale',
    doctrineId: 'SOLARPUNK',
    rivalCount: 5,
  });
  const charter = FALLBACK_DOSSIERS_CATALOG.find((d) => d.id === 'dos-c1-horizon-charter')!;
  const options = getEffectiveOptionsForDossier(charter);
  const engOpt = options.find((o) => o.id === 'opt-c1-eng-microgrid')!;
  const nadia = world.colonists.find((c) => c.id === 'col-1')!;

  const bilan = buildPartitionedEventBilan([engOpt], undefined, 1, 'ENERGY_BOOST', [nadia]);
  assert.ok(bilan.actionsPole.some((a) => a.includes('Construction bâtiment')));
  assert.ok(bilan.actionsPole.some((a) => a.includes('Nadia Kowalski')));
  assert.ok(bilan.economyPole.length > 0);
  assert.ok(bilan.humanPoliticsPole.some((c) => c.label.includes('coéquipier')));
});

import {
  findLowestMoraleColonist,
  getColonistMoraleTone,
} from '../src/systems/biosphere-cabinet/colonist-quick-access.ts';

test('V5.1-13: HUD Accès Rapide selector deterministically picks lowest-morale colonist with fatigue tie-break', () => {
  const world = createInitialWorldState({
    campaignId: 'test-lowest-morale',
    worldSeed: 2050,
    superpowerId: 'eu-spatiale',
    doctrineId: 'SOLARPUNK',
    rivalCount: 5,
  });
  const tweaked = world.colonists.map((c, idx) =>
    idx === 1 ? { ...c, morale: 38, fatigue: 55 } : idx === 2 ? { ...c, morale: 38, fatigue: 72 } : { ...c, morale: 80 },
  );
  const picked = findLowestMoraleColonist(tweaked);
  assert.ok(picked !== null);
  assert.equal(picked.id, tweaked[2]!.id);
  assert.equal(getColonistMoraleTone(picked.morale), 'critical');
  assert.equal(getColonistMoraleTone(62), 'warning');
  assert.equal(getColonistMoraleTone(85), 'healthy');
  assert.equal(findLowestMoraleColonist([]), null);
});

import {
  Classification6DManifestSchema,
  detectPrefixCollisions,
  XscClassificationNodeSchema,
} from '../src/contracts/classification-6d.schema.ts';

test('V5.1-14: XSC-CUBE 6D ⊥ G-CUBE Zod contract validates manifest, enforces ISO 2145 d_restant & catches prefix collisions', () => {
  const root = process.cwd();
  const raw = JSON.parse(
    fs.readFileSync(path.join(root, 'docs', 'master-blueprint', 'classif-6d.json'), 'utf8'),
  );
  const parsed = Classification6DManifestSchema.safeParse(raw);
  assert.equal(parsed.success, true);

  // Violate ISO 2145 invariant (V2 requires d_restant = 4, pass 2 -> must reject)
  assert.ok(parsed.data.nodes[1]);
  const broken = structuredClone(parsed.data.nodes[1]);
  broken.xsc_cube_6d.axe_1_doc.d_restant = 2;
  assert.equal(XscClassificationNodeSchema.safeParse(broken).success, false);

  // Prefix collision detector catches ambiguous legacy N/D/P tokens and allows canonical NORM-EXW v3.0 tokens
  const collisions = detectPrefixCollisions([
    'N1',
    'D3',
    'P0',
    'P-III',
    'V2',
    'O3',
    'T1',
    'ATMO-D2',
    'PIV-3',
    'PART-III',
    'PRIO-P0',
  ]);
  assert.equal(collisions.length, 4);
  assert.deepEqual(
    collisions.map((c) => c.token),
    ['N1', 'D3', 'P0', 'P-III'],
  );

  // Strict space separation: V0 root node or infra-only node cannot attach g_cube_overlay
  assert.ok(parsed.data.nodes[0]);
  const rootWithGameplayOverlay = {
    ...structuredClone(parsed.data.nodes[0]),
    g_cube_overlay: {
      g1_spatial: ['S-0'],
      g2_temporal: ['T1/GL-1'],
      g3_atmo: ['ATMO-D1'],
      g4_decision: ['PA'],
      g5_ethics: ['BIEN_COMMUN'],
    },
  };
  assert.equal(XscClassificationNodeSchema.safeParse(rootWithGameplayOverlay).success, false);

  // Duplicate inode inside manifest must fail
  const duplicateManifest = {
    ...structuredClone(parsed.data),
    nodes: [parsed.data.nodes[0], structuredClone(parsed.data.nodes[0])],
  };
  assert.equal(Classification6DManifestSchema.safeParse(duplicateManifest).success, false);
});
