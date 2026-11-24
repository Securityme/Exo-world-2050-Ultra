import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createInitialWorldState } from '../src/core/loop/cycle-orchestrator.ts';
import {
  buildCitizenAgent,
  buildCityShuttleVessel,
  buildDroneUnit,
  buildRealisticBird,
  buildSkyRailShuttle,
} from '../src/engine3d/procedural-models.ts';
import { updateCityLifeFrame } from '../src/engine3d/city-life.ts';
import {
  buildSubChoiceBadgeTriplet,
  getSubChoiceBadgeMeta,
} from '../src/systems/dossiers-pa/badge-taxonomy.ts';
import {
  getEffectiveOptionsForDossier,
  getSubChoicesForOption,
} from '../src/systems/dossiers-pa/dossier-subchoices.ts';
import {
  buildCampaignComparisonRows,
  buildCampaignTimelineFrames,
  computeCivilizationScore,
  formatCampaignCsvExport,
  formatCampaignHtmlReport,
} from '../src/systems/journal/archives-analytics.ts';

function countMeshes(root: THREE.Object3D): number {
  let count = 0;
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) count += 1;
  });
  return count;
}

test('Upgraded 3D city actors (Drone, VTOL Shuttle, Bird, Citizen) are articulated multi-part models', () => {
  const drone = buildDroneUnit('PATROL');
  assert.ok(countMeshes(drone) >= 12, 'Quad-tilt-rotor drone should have >= 12 meshes');
  for (let i = 0; i < 4; i++) {
    assert.ok(drone.getObjectByName(`rotorRing${i}`), `Drone missing rotorRing${i}`);
  }

  const shuttle = buildCityShuttleVessel(0x38bdf8);
  assert.ok(countMeshes(shuttle) >= 10, 'Atmospheric VTOL shuttle should have >= 10 meshes');

  const bird = buildRealisticBird(1.1);
  assert.ok(countMeshes(bird) >= 8, 'Articulated bird should have >= 8 meshes');
  assert.ok(bird.getObjectByName('leftInnerWing'));
  assert.ok(bird.getObjectByName('leftOuterWing'));
  assert.ok(bird.getObjectByName('rightInnerWing'));
  assert.ok(bird.getObjectByName('rightOuterWing'));

  const citizen = buildCitizenAgent(2);
  assert.ok(countMeshes(citizen) >= 8, 'Articulated citizen should have >= 8 meshes');
  assert.ok(citizen.getObjectByName('leftLeg'));
  assert.ok(citizen.getObjectByName('rightLeg'));
  assert.ok(citizen.getObjectByName('leftArm'));
  assert.ok(citizen.getObjectByName('rightArm'));
});

test('updateCityLifeFrame animates drones between built districts, citizen gait, bird wings, and VTOL vessels', () => {
  const dronesGroup = new THREE.Group();
  const d0 = buildDroneUnit('RECON');
  dronesGroup.add(d0);

  const shuttlesGroup = new THREE.Group();
  const maglev = buildSkyRailShuttle(0xf43f5e);
  maglev.userData = { orbitPhase: 0, orbitR: 6.2, orbitY: 0.74, speed: 0.36 };
  shuttlesGroup.add(maglev);

  const pedestriansGroup = new THREE.Group();
  const citizen = buildCitizenAgent(0);
  citizen.userData = { orbitPhase: 0.4, orbitR: 4.2, speed: 0.14, strideFreq: 5.5, pauseOffset: 0 };
  pedestriansGroup.add(citizen);

  const wildlifeGroup = new THREE.Group();
  const bird = buildRealisticBird(1);
  bird.userData = { orbitPhase: 0.2, orbitR: 6.4, orbitY: 3.4, speed: 0.28, flapFreq: 6.0, glideOffset: 2.2 };
  wildlifeGroup.add(bird);

  const vesselsGroup = new THREE.Group();
  const vessel = buildCityShuttleVessel(0x10b981);
  vessel.userData = { orbitPhase: 0.5, rx: 11, rz: 8.5, baseY: 5.5, speed: 0.16 };
  vesselsGroup.add(vessel);

  const cloudLayer = new THREE.Group();
  const wisp = new THREE.Object3D();
  wisp.userData = { baseX: 2, baseZ: -4, driftSpeed: 0.4, phase: 0.5 };
  cloudLayer.add(wisp);

  const targets = [
    { id: 'd1', x: 0, z: 0, inspectY: 2.4 },
    { id: 'd2', x: 3.2, z: -2.4, inspectY: 2.9 },
  ];

  updateCityLifeFrame(
    { dronesGroup, shuttlesGroup, pedestriansGroup, wildlifeGroup, vesselsGroup, cloudLayer },
    3.6,
    targets,
  );

  assert.notEqual(d0.getObjectByName('rotorRing0')?.rotation.y ?? 0, 0);
  assert.ok(d0.position.y > 1.8, 'Drone should hover cleanly above district roofs');
  assert.notEqual(citizen.getObjectByName('leftLeg')?.rotation.x ?? 0, 0);
  assert.notEqual(bird.getObjectByName('leftOuterWing')?.rotation.z ?? 0, 0);
  assert.ok(vessel.position.y > 4.5, 'Atmospheric VTOL shuttle should fly in upper airspace');
});

test('Sub-choice badge metadata & triplets cover both standard options and DEFER_ACTION', () => {
  const world = createInitialWorldState({
    campaignId: 'camp-subchoice-test',
    worldSeed: 20500801,
    superpowerId: 'EUROPA',
    doctrineId: 'SOLARPUNK',
    rivalCount: 3,
  });
  const dossier = world.activeDossiers[0];
  assert.ok(dossier, 'Initial world must contain at least one active dossier');

  const options = getEffectiveOptionsForDossier(dossier);
  assert.ok(options.length >= 4);

  const deferOption = {
    ...options[0]!,
    id: 'opt-defer-test',
    actionPayload: { kind: 'DEFER_ACTION' as const },
  };

  for (const opt of [...options, deferOption]) {
    const subs = getSubChoicesForOption(opt, dossier.dossierClass);
    assert.equal(subs.length, 3);
    for (const sc of subs) {
      const meta = getSubChoiceBadgeMeta(sc);
      assert.ok(meta.modeTag.length >= 3);
      assert.ok(meta.focusTag.length >= 3);
      assert.ok(meta.costTag.length >= 3);

      const triplet = buildSubChoiceBadgeTriplet(sc, opt, dossier.dossierClass);
      assert.equal(triplet.kind, 'SUBCHOICE');
      assert.equal(triplet.master.shortLabel, meta.modeTag);
      assert.equal(triplet.level1.shortLabel, meta.focusTag);
      assert.equal(triplet.level2.shortLabel, meta.costTag);
    }
  }
});

test('Journal Archives analytics produce timeline frames, BOM CSV, escaped HTML report, and sorted campaign comparator', () => {
  const world = createInitialWorldState({
    campaignId: 'camp-archives-test',
    worldSeed: 20500801,
    superpowerId: 'PACIFICA',
    doctrineId: 'SOLARPUNK',
    rivalCount: 3,
  });
  const score = computeCivilizationScore(world);
  assert.ok(score > 0);

  const frames = buildCampaignTimelineFrames(world);
  const expectedCycles = Math.max(1, world.cycle);
  assert.equal(frames.length, expectedCycles);
  assert.equal(frames[frames.length - 1]?.cycle, expectedCycles);

  const csv = formatCampaignCsvExport(world);
  assert.ok(csv.startsWith('\uFEFF'), 'CSV export must start with UTF-8 BOM for Excel compatibility');
  assert.ok(csv.includes('SECTION,CLÉ,VALEUR,DÉTAIL'));
  assert.ok(csv.includes('FRISE_CYCLE,ANNÉE,SAISON,ÈRE'));

  const html = formatCampaignHtmlReport(world, 'Pacifica <Test & Co>');
  assert.ok(html.startsWith('<!DOCTYPE html>'));
  assert.ok(html.includes('Pacifica &lt;Test &amp; Co&gt;'), 'HTML report must escape unsafe characters');

  const rows = buildCampaignComparisonRows(world, [
    {
      campaignId: 'camp-past-01',
      superpowerId: 'ATLANTIS',
      doctrineId: 'SCIENTIFIC',
      era: 2,
      cycle: 8,
      atmosphereTier: 'P2',
      approval: 74,
      stateHash: 'abcd1234',
    },
  ]);
  assert.equal(rows.length, 3);
  assert.ok(rows.some((r) => r.isCurrent));
  assert.ok(rows.some((r) => r.isBenchmark));
  assert.ok(rows[0]!.score >= rows[1]!.score && rows[1]!.score >= rows[2]!.score);
});
