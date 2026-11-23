import test from 'node:test';
import assert from 'node:assert/strict';
import {
  consolidateBetaFeedbackReport,
  createDefaultRatings,
  formatBetaReportMarkdown,
  runVirtualBetaPlaytestCampaign,
  validateCommunityQuestionnaireInput,
} from '../src/systems/playtest/beta-p13-engine.ts';
import { createDefaultMetaShowcase } from '../src/systems/honors/honors-evaluator.ts';
import { INITIAL_META_TITLES } from '../src/data/honors.catalog.ts';

test('runVirtualBetaPlaytestCampaign is deterministic and evaluates all 5 personas', () => {
  const run1 = runVirtualBetaPlaytestCampaign();
  const run2 = runVirtualBetaPlaytestCampaign();

  assert.equal(run1.personas.length, 5);
  assert.equal(run1.playtest.totalTurns, 6);
  assert.equal(run1.playtest.totalTicks, 90);
  assert.equal(run1.playtest.finalChainHash, run2.playtest.finalChainHash);
  assert.equal(run1.consolidated.totalResponses, 5);
  assert.equal(run1.consolidated.verdict, 'GO_RELEASE');
  assert.ok(run1.consolidated.globalAverage >= 4.5);
});

test('validateCommunityQuestionnaireInput rejects empty/short inputs and accepts valid submissions', () => {
  const [errName] = validateCommunityQuestionnaireInput({
    authorName: ' ',
    profileId: 'COMMUNITY_PLAYER',
    ratings: createDefaultRatings(5),
    priorityCriterionId: 'MOBILE_SAFARI',
    comment: 'Super fluidité sur mobile et desktop.',
    submittedAtIso: '2026-11-22T18:00:00Z',
    sequenceNumber: 1,
  });
  assert.ok(errName instanceof Error);

  const [errComment] = validateCommunityQuestionnaireInput({
    authorName: 'Baptiste',
    profileId: 'COMMUNITY_PLAYER',
    ratings: createDefaultRatings(5),
    priorityCriterionId: 'MOBILE_SAFARI',
    comment: 'Court',
    submittedAtIso: '2026-11-22T18:00:00Z',
    sequenceNumber: 1,
  });
  assert.ok(errComment instanceof Error);

  const [errOk, valid] = validateCommunityQuestionnaireInput({
    authorName: 'Baptiste',
    profileId: 'STRATEGIST_4X',
    ratings: createDefaultRatings(4),
    priorityCriterionId: 'CITY_3D_CLIMATE',
    comment: 'Très bonne ambiance Rose Astralis et radio FIP propre au lancement.',
    submittedAtIso: '2026-11-22T18:00:00Z',
    sequenceNumber: 1,
  });
  assert.equal(errOk, null);
  assert.ok(valid);
  assert.equal(valid.source, 'COMMUNITY');
  assert.equal(valid.authorName, 'Baptiste');
});

test('consolidateBetaFeedbackReport updates verdict and exports readable Markdown', () => {
  const [, lowSub] = validateCommunityQuestionnaireInput({
    authorName: 'Testeur Critique',
    profileId: 'MOBILE_SAFARI',
    ratings: createDefaultRatings(2),
    priorityCriterionId: 'MOBILE_SAFARI',
    comment: 'Besoin d’un ajustement tactile sur les petits écrans.',
    submittedAtIso: '2026-11-22T18:05:00Z',
    sequenceNumber: 2,
  });
  assert.ok(lowSub);

  const singleLow = consolidateBetaFeedbackReport([lowSub]);
  assert.equal(singleLow.verdict, 'NEEDS_FIX');
  assert.equal(singleLow.globalAverage, 2);

  const run = runVirtualBetaPlaytestCampaign();
  const merged = consolidateBetaFeedbackReport([lowSub, ...run.personas]);
  assert.equal(merged.totalResponses, 6);
  assert.equal(merged.communityCount, 1);
  assert.equal(merged.virtualCount, 5);

  const md = formatBetaReportMarkdown(merged, [lowSub, ...run.personas], run.playtest);
  assert.ok(md.includes('Rapport Consolidé Vague P13'));
  assert.ok(md.includes('Testeur Critique'));
  assert.ok(md.includes('Kaelen'));
});

test('Commandant title is removed from default showcase and titles catalog', () => {
  const showcase = createDefaultMetaShowcase();
  assert.equal(showcase.callsign, 'Baptiste');
  assert.equal(/commandant/i.test(showcase.callsign), false);
  for (const title of INITIAL_META_TITLES) {
    assert.equal(/commandant/i.test(title.label), false);
  }
});
