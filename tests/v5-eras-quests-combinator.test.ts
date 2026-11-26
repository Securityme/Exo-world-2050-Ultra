import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialWorldState } from '../src/core/loop/cycle-orchestrator.ts';
import {
  ASTRALIS_HAND_LIMIT,
  findNextPlayableAstralisDossier,
  getAstralisEventHand,
  pickMagicWandArbitration,
} from '../src/systems/dossiers-pa/magic-wand-astralis.ts';
import {
  computeEventPaProgress,
  computeTurnPaProgress,
} from '../src/systems/dossiers-pa/pa-progress.ts';
import {
  evaluateCampaignQuests,
  getQuestsImpactedByDossier,
  groupQuestsByEra,
  groupQuestsByScenarioThread,
} from '../src/systems/quests/campaign-quests.ts';
import {
  applySpecializationAdvance,
  evaluateHkTurnProgress,
} from '../src/systems/geopolitics/humankind-progression.ts';
import {
  getSpecializationsForStep,
  getSubEraScaleTitle,
  MACRO_ERAS_8,
  MAX_MACRO_ERA,
} from '../src/data/eras-specializations.data.ts';
import {
  buildCombinatorialScenarioBrief,
  synthesizeCombinatorialBonusDossier,
} from '../src/systems/turn-orchestration/scenario-combinator.ts';

const TEST_CONFIG = {
  campaignId: 'test-v52-campaign',
  worldSeed: 2050,
  superpowerId: 'UEA',
  doctrineId: 'DOC_SOLAR_CHARTER',
  rivalCount: 3,
  difficulty: 'STANDARD' as const,
};

describe('V5.2 Astralis 7-Card Hand, Magic Wand & PA Progress', () => {
  it('computes turn PA consumption and single-event PA projection with R-26 fallback', () => {
    const world = createInitialWorldState(TEST_CONFIG);
    const turn = computeTurnPaProgress(world);
    assert.equal(turn.totalCap > 0, true);
    assert.equal(turn.activeEventsCount, world.activeDossiers.length);
    assert.equal(turn.playableEventsCount > 0, true);

    const ev = computeEventPaProgress(world, {
      totalGeneralPa: 1,
      subDomain: 'PA_GES',
      totalSubPa: 1,
      useGeneralFallback: true,
    });
    assert.equal(ev.affordable, true);
    assert.equal(ev.eventTotalCost, 2);
    assert.equal(ev.turnRemainingAfterSign, turn.totalRemaining - 2);
  });

  it('builds a 7-card Astralis hand and picks a valid random affordable arbitration', () => {
    const world = createInitialWorldState(TEST_CONFIG);
    const hand = getAstralisEventHand(world);
    assert.equal(hand.handLimit, ASTRALIS_HAND_LIMIT);
    assert.ok(hand.cards.length > 0 && hand.cards.length <= ASTRALIS_HAND_LIMIT);
    assert.equal(hand.canDrawBonusCard, true);

    const first = hand.cards[0]!.dossier;
    const pickA = pickMagicWandArbitration(world, first, 1);
    const pickB = pickMagicWandArbitration(world, first, 7);
    assert.ok(pickA, 'Magic Wand must pick a valid affordable arbitration');
    assert.ok(pickB, 'Magic Wand must pick a valid affordable arbitration for another salt');
    assert.equal(pickA.intent.dossierId, first.id);
    assert.equal(pickA.intent.useGeneralPaFallback, true);

    const next = findNextPlayableAstralisDossier(world, first.id);
    if (world.activeDossiers.length > 1) {
      assert.ok(next, 'Should chain to another playable dossier when more than 1 exists');
      assert.notEqual(next.id, first.id);
    }
  });
});

describe('V5.2 Multi-Thread Collapsible Quests (by Scenario & by Era 1..8)', () => {
  it('groups quests across multiple scenario threads and Eras 1..8 and links impacted quests to events', () => {
    const world = createInitialWorldState(TEST_CONFIG);
    const statuses = evaluateCampaignQuests(world, {});
    assert.ok(statuses.length >= 16, 'Must have multi-thread campaign quests across eras');

    const byScenario = groupQuestsByScenarioThread(statuses);
    assert.ok(byScenario.length >= 4, 'Must organize quests into at least 4 distinct scenario threads');

    const byEra = groupQuestsByEra(statuses, world.era);
    assert.ok(byEra.some((g) => g.groupId === 'ERA_1'));
    assert.ok(byEra.some((g) => g.groupId === 'ERA_6_8'), 'Must include Eras 6-8 progression quests');

    const firstDossier = world.activeDossiers[0]!;
    const impacted = getQuestsImpactedByDossier(world, firstDossier, {});
    assert.ok(impacted.length >= 1, 'Every active event should surface at least 1 linked quest thread');
  });
});

describe('V5.2 8 Macro-Eras, Branch-Adaptive Sub-Eras & 4 Specializations', () => {
  it('provides 8 Macro-Eras and 4 distinct Specializations at every Sub-Era and Macro-Era step', () => {
    assert.equal(MACRO_ERAS_8.length, MAX_MACRO_ERA);
    assert.equal(MAX_MACRO_ERA, 8);

    for (let era = 1; era <= 8; era++) {
      for (const subEra of [1, 2, 3] as const) {
        const specs = getSpecializationsForStep(era, subEra);
        assert.equal(specs.length, 4, `Era ${era}.${subEra} must provide exactly 4 specializations`);
        const branches = new Set(specs.map((s) => s.branchId));
        assert.equal(branches.size, 4, 'All 4 branches must be represented');
      }
    }

    const bioLabel = getSubEraScaleTitle(2, 2, 'BIOSPHERE');
    const indLabel = getSubEraScaleTitle(2, 2, 'INDUSTRY');
    assert.notEqual(bioLabel, indLabel, 'Sub-Era scale labels must adapt to chosen branch');
  });

  it('advances Sub-Era (.a -> .b) and Macro-Era (1 -> 2 -> ... -> 8) while applying specialization bonuses', () => {
    const base = createInitialWorldState(TEST_CONFIG);
    const boosted = {
      ...base,
      eraStars: 7,
      hk: {
        ...base.hk!,
        subEra: 1 as const,
        subEraAdvanceReady: true,
        eraAdvanceReady: true,
      },
    };
    const subSpecs = getSpecializationsForStep(1, 2);
    const chosenSub = subSpecs[1]!; // INDUSTRY
    const afterSub = applySpecializationAdvance(boosted, {
      kind: 'SUB_ERA',
      specializationId: chosenSub.id,
    });
    assert.equal(afterSub.hk?.subEra, 2);
    assert.equal(afterSub.hk?.activeBranchId, chosenSub.branchId);
    assert.equal(afterSub.hk?.chosenSpecializations.length, 1);

    const macroSpecs = getSpecializationsForStep(2, 1);
    const chosenMacro = macroSpecs[3]!; // FRONTIER
    const afterMacro = applySpecializationAdvance(
      { ...afterSub, hk: { ...afterSub.hk!, eraAdvanceReady: true } },
      { kind: 'EVOLVE', specializationId: chosenMacro.id },
    );
    assert.equal(afterMacro.era, 2);
    assert.equal(afterMacro.hk?.subEra, 1);
    assert.equal(afterMacro.hk?.activeBranchId, 'FRONTIER');

    const hkEval = evaluateHkTurnProgress(afterMacro);
    assert.equal(hkEval.hk.activeBranchId, 'FRONTIER');
  });
});

describe('V5.2 Live Combinatorial Scenario Assembler', () => {
  it('extracts a structured combinatorial world brief and synthesizes a valid bonus dossier', () => {
    const world = createInitialWorldState(TEST_CONFIG);
    const brief = buildCombinatorialScenarioBrief(world);
    assert.equal(brief.subEraCode, '1.a');
    assert.ok(brief.worldTensions.length >= 1);
    assert.ok(brief.combinationMatrix.length >= 3);

    const bonus = synthesizeCombinatorialBonusDossier(world, 1);
    assert.ok(bonus.id.startsWith('dos-comb-'));
    assert.ok(bonus.options.length >= 3);
    assert.ok(
      bonus.options.some((o) => o.paGeneralCost === 0 && o.subPaCost === 0),
      'Synthesized bonus dossier must guarantee a 0-PA safe option',
    );
  });
});
