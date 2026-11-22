import assert from 'node:assert/strict';
import test from 'node:test';
import { formatAtmosphereStatusBadge } from '../src/utils/atmosphere-labels.ts';

test('P1 hostile atmosphere maps to Air Toxique and Climat Instable/Critique', () => {
  const clearP1 = formatAtmosphereStatusBadge({
    atmosphereTier: 'P1',
    atmosphereProgress: 26,
    weatherState: 'CLEAR',
    biomeStabilityCycles: 0,
    hasEmergencyP0: false,
  });
  assert.equal(clearP1.qualityLabel, 'Air Toxique');
  assert.equal(clearP1.climateStateLabel, 'Climat Instable');
  assert.equal(clearP1.desktopLabel, 'Air Toxique · Climat Instable');
  assert.equal(clearP1.mobileLabel, 'Air Toxique · Instable');
  assert.equal(clearP1.tone, 'critical');
  assert.ok(clearP1.tooltipFormula.includes('Atmosphère Hostile (26%)'));
  assert.equal(clearP1.tooltipFormula.includes('Palier'), false);

  const stormP1 = formatAtmosphereStatusBadge({
    atmosphereTier: 'P1',
    atmosphereProgress: 20,
    weatherState: 'DUST_STORM',
    biomeStabilityCycles: 0,
    hasEmergencyP0: false,
  });
  assert.equal(stormP1.climateStateLabel, 'Climat Critique');
  assert.equal(stormP1.mobileLabel, 'Air Toxique · Critique');
});

test('P2..P4 reflect variable, stabilized, temperate, and optimal climate states', () => {
  const p2Var = formatAtmosphereStatusBadge({
    atmosphereTier: 'P2',
    atmosphereProgress: 42,
    weatherState: 'CLEAR',
    biomeStabilityCycles: 1,
  });
  assert.equal(p2Var.desktopLabel, 'Air Filtré · Climat Variable');
  assert.equal(p2Var.tone, 'warning');

  const p2Stable = formatAtmosphereStatusBadge({
    atmosphereTier: 'P2',
    atmosphereProgress: 50,
    weatherState: 'RAIN',
    biomeStabilityCycles: 2,
  });
  assert.equal(p2Stable.desktopLabel, 'Air Filtré · Climat Stabilisé');

  const p3Temp = formatAtmosphereStatusBadge({
    atmosphereTier: 'P3',
    atmosphereProgress: 74,
    weatherState: 'CLEAR',
    biomeStabilityCycles: 3,
  });
  assert.equal(p3Temp.desktopLabel, 'Air Respirable · Climat Tempéré');
  assert.equal(p3Temp.tone, 'steady');

  const p4Opt = formatAtmosphereStatusBadge({
    atmosphereTier: 'P4',
    atmosphereProgress: 96,
    weatherState: 'CLEAR',
    biomeStabilityCycles: 5,
  });
  assert.equal(p4Opt.desktopLabel, 'Air Pur · Climat Optimal');
  assert.equal(p4Opt.tone, 'optimal');
});

test('Severe weather or active P0 emergency shifts P3/P4 climate to Instable', () => {
  const p3Flare = formatAtmosphereStatusBadge({
    atmosphereTier: 'P3',
    atmosphereProgress: 70,
    weatherState: 'SOLAR_FLARE',
    biomeStabilityCycles: 4,
    hasEmergencyP0: false,
  });
  assert.equal(p3Flare.climateStateLabel, 'Climat Instable');
  assert.equal(p3Flare.tone, 'warning');

  const p4P0 = formatAtmosphereStatusBadge({
    atmosphereTier: 'P4',
    atmosphereProgress: 95,
    weatherState: 'CLEAR',
    biomeStabilityCycles: 4,
    hasEmergencyP0: true,
  });
  assert.equal(p4P0.climateStateLabel, 'Climat Instable');
});
