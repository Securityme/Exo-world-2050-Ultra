import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialWorldState } from '../src/core/loop/cycle-orchestrator.ts';
import { CLIMATE_DISASTER_12_CATALOG } from '../src/systems/biosphere/video-studio-catalog.ts';
import {
  buildExternalCitiesRoster,
  buildLocalPolitiesRoster,
  computeCivilPressureStars,
  computeFourTheaterForces,
  simulateTaskforcePlan,
} from '../src/systems/combat-conquest/theaters-and-polities.ts';
import {
  buildPhilosophyBadgeTriplet,
  buildProvenanceBadgeTriplet,
} from '../src/systems/dossiers-pa/badge-taxonomy.ts';
import {
  compileScenarioMatrix,
  DEFAULT_SCENARIO_MATRIX,
} from '../src/systems/dossiers-pa/pax-scenario-matrix.ts';
import {
  buildSovereignStateTechnicalSheet,
  computeCitizensSocietyReport,
} from '../src/systems/economy-urban/citizens-society.ts';
import {
  createDefaultMetaShowcase,
  evaluateCampaignCommanderProfile,
  evaluateMetaShowcaseFromWorld,
} from '../src/systems/honors/honors-evaluator.ts';
import {
  buildTurnGroupedChoiceSummary,
  createInitialGeminiCostLedger,
  FREE_TIER_CHANNEL_MODELS,
  rankDossiersByAiContext,
} from '../src/systems/turn-orchestration/gemini-cost-ledger.ts';
import { createDefaultUserContext3D } from '../src/systems/turn-orchestration/user-context-3d.ts';

const TEST_CONFIG = {
  campaignId: 'test-v5-roadmap-2050',
  worldSeed: 2050,
  superpowerId: 'eu-spatiale',
  doctrineId: 'SOLARPUNK',
  rivalCount: 5,
} as const;

test('P4: Gemini 6-channel router uses strictly Free-Tier models and ranks dossiers non-restrictively', () => {
  const channels = Object.entries(FREE_TIER_CHANNEL_MODELS);
  assert.equal(channels.length, 6);
  for (const [, model] of channels) {
    assert.ok(!model.includes('argon') && !model.includes('nano-banana') && !model.includes('omni'));
  }
  const ledger = createInitialGeminiCostLedger();
  assert.equal(ledger.freeTierStrict, true);
  assert.equal(ledger.billedUsd, 0);

  const world = createInitialWorldState(TEST_CONFIG);
  const ctx = createDefaultUserContext3D('2050-05-01T12:00:00.000Z');
  const ranked = rankDossiersByAiContext(world.activeDossiers, ctx);
  assert.equal(ranked.length, world.activeDossiers.length);

  const summary = buildTurnGroupedChoiceSummary(1, [
    {
      id: 'dec-1',
      turn: 1,
      dossierCode: 'C4-BIO',
      dossierTitle: 'Pacte Biosphère',
      dossierClass: 'C4',
      optionLabel: 'Charte du Bien Commun',
      sourceModel: 'gemini-4-hydrogen',
      channel: 'text',
      philosophySchoolId: 'THOMISM',
      paSpent: 1,
    },
  ]);
  assert.equal(summary.totalDecisions, 1);
  assert.equal(summary.byCategory['C4'], 1);
});

test('P5: Two-Tier Honors system unlocks symbolic Project Conception Platinum trophy and CK3 commander attributes', () => {
  const world = createInitialWorldState(TEST_CONFIG);
  const baseMeta = createDefaultMetaShowcase();
  const projectMedal = baseMeta.medals.find((m) => m.id === 'medal-founder-global-conception');
  assert.ok(projectMedal);
  assert.equal(projectMedal.tier, 'PLATINUM');
  assert.equal(projectMedal.unlocked, true);
  assert.equal(projectMedal.isSymbolicDistinction, true);

  const synced = evaluateMetaShowcaseFromWorld(baseMeta, world);
  assert.ok(synced.medals.length >= 6);

  const commander = evaluateCampaignCommanderProfile(world);
  assert.equal(Object.keys(commander.attributes).length, 5);
  assert.ok(commander.territorialTitles.length >= 1);
});

test('P6 & P7: Sovereign State sheet, Frostpunk Citizens pool, and 3-tier nested badges work deterministically', () => {
  const world = createInitialWorldState(TEST_CONFIG);
  const sheet = buildSovereignStateTechnicalSheet(world);
  assert.ok(sheet.ownedPlanetsCount >= 1);
  assert.equal(sheet.planetRoster.length, 6);
  assert.ok(!sheet.atmosphereLabel.includes('Palier'));

  const citizens = computeCitizensSocietyReport(world);
  assert.ok(citizens.totalOrdinaryCitizens > 150);
  assert.equal(citizens.culturalOrigins.length, 4);

  const firstDossier = world.activeDossiers[0];
  assert.ok(firstDossier);
  const prov = buildProvenanceBadgeTriplet(firstDossier);
  assert.ok(prov.master.label.length > 0 && prov.level1.label.length > 0 && prov.level2.label.length > 0);

  const firstOpt = firstDossier.options[0];
  assert.ok(firstOpt);
  const eth = buildPhilosophyBadgeTriplet(firstOpt, { THOMISM: 2 });
  assert.equal(eth.kind, 'ETHICS');
  assert.ok(eth.level2.shortLabel.length > 0);
});

test('P8 & P10: 4 Military Theaters, Civil Pressure 0..5★, External Cities, Pax Matrix Compiler & 12 Video Categories', () => {
  const world = createInitialWorldState(TEST_CONFIG);
  const theaters = computeFourTheaterForces(world);
  assert.equal(theaters.length, 4);
  assert.deepEqual(
    theaters.map((t) => t.id),
    ['SPACE', 'AIR', 'LAND', 'SEA'],
  );

  const plan = simulateTaskforcePlan(world, 'SPACE', 28, 'Taskforce Alpha');
  assert.ok(plan.supplyEfficiencyPct >= 42 && plan.supplyEfficiencyPct <= 100);

  const pressure = computeCivilPressureStars(world);
  assert.ok(pressure.stars >= 0 && pressure.stars <= 5);

  const extCities = buildExternalCitiesRoster(world);
  assert.ok(extCities.length >= 3);
  const polities = buildLocalPolitiesRoster(world);
  assert.equal(polities.length, 3);

  const compiled = compileScenarioMatrix(world, {
    ...DEFAULT_SCENARIO_MATRIX,
    complexityMode: 'ADVANCED',
    climateHarshness: 5,
    rivalAggression: 4,
    startingEra: 2,
  });
  assert.equal(compiled.worldPatch.era, 2);
  assert.equal(compiled.worldPatch.weatherState, 'SOLAR_FLARE');
  assert.equal(compiled.openingDossier.dossierClass, 'P0');
  assert.ok(compiled.matrixFingerprint.startsWith('MTX-E2-C5'));

  assert.equal(CLIMATE_DISASTER_12_CATALOG.length, 12);
});
