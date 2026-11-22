import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendContextEventLog,
  appendTraceabilityRecord,
  createDefaultUserContext3D,
  serializeUserContextJson,
  serializeUserContextMarkdown,
  setRememberedAccordion,
  updateDisplayProfileInContext,
} from '../src/systems/turn-orchestration/user-context-3d.ts';

test('user-context-3d preserves all 3 isolated dimensions and remembered accordions', () => {
  const base = createDefaultUserContext3D('2050-05-01T12:00:00.000Z');
  const step1 = setRememberedAccordion(base, 'dev.context', true, '2050-05-01T12:01:00.000Z');
  const step2 = updateDisplayProfileInContext(step1, {
    presetId: 'EMERALD_ATMO',
    hudOpacity: 88,
    saturationPct: 115,
  });
  const step3 = appendTraceabilityRecord(step2, {
    id: 'tr-1',
    campaignId: 'exw-test',
    turn: 4,
    actionType: 'DOSSIER_CHOICE',
    sourceChannel: 'gemini-4-neon',
    philosophyPole: 'HUMANISME',
    paSpent: 2,
    deltaSummary: 'Atmo +6%, Santé +4%',
  });
  const step4 = appendContextEventLog(step3, {
    id: 'ev-1',
    campaignId: 'exw-test',
    turn: 4,
    category: 'SCENARIO',
    title: 'Pacte des Jardins Hydroponiques',
    detail: 'Accord citoyen validé.',
  });

  assert.equal(step4.shellUxHabits.accordionStates['dev.context'], true);
  assert.equal(step4.displaySettingsProfile.presetId, 'EMERALD_ATMO');
  assert.equal(step4.displaySettingsProfile.hudOpacity, 88);
  assert.equal(step4.simulationTraceabilityProfile.traceabilityMatrix.length, 1);
  assert.equal(step4.simulationTraceabilityProfile.eventLogs.length, 1);

  const json = serializeUserContextJson(step4);
  const md = serializeUserContextMarkdown(step4);
  assert.ok(json.includes('"EMERALD_ATMO"'));
  assert.ok(md.includes('gemini-4-neon'));
  assert.ok(md.includes('HUMANISME'));
});
