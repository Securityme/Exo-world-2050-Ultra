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
