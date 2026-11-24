import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialWorldState } from '../src/core/loop/cycle-orchestrator.ts';
import {
  SHIP_BLUEPRINTS_CATALOG,
  SHIP_MODULES_CATALOG,
} from '../src/data/ship-equipment.catalog.ts';
import { ShipInstalledModuleSchema } from '../src/contracts/v4-systems.schema.ts';
import { generateActionEventDossier } from '../src/systems/dossiers-pa/action-event-generator.ts';
import { executeDossierDecision } from '../src/systems/dossiers-pa/pa-engine.ts';
import { computeFleetTotals, computeShipStats } from '../src/systems/fleet/ship-loadout.engine.ts';
import { computeFourTheaterForces } from '../src/systems/combat-conquest/theaters-and-polities.ts';
import { resolveDeterministicCombat } from '../src/systems/combat-conquest/combat-engine.ts';
import { evaluateEntityLedger } from '../src/systems/economy-urban/entity-ledger.ts';

import { INITIAL_FLEET_SHIPS } from '../src/data/v4-catalog.data.ts';
import { createDefaultHkProgress } from '../src/systems/geopolitics/humankind-progression.ts';
import { migrateWorldStateV3ToV4 } from '../src/services/persistence/save-migration.service.ts';
import { buildEventActionPillars } from '../src/systems/dossiers-pa/event-action-taxonomy.ts';
import type { WorldState } from '../src/contracts/world-state.schema.ts';

function buildRichTestWorld(): WorldState {
  const world = createInitialWorldState({
    campaignId: 'test-fleet-coherence',
    superpowerId: 'sp-uea',
    doctrineId: 'DOC_SOLAR_CHARTER',
    worldSeed: 2050,
    rivalCount: 3,
  });
  return {
    ...world,
    activeDossiers: [],
    fleetShips: INITIAL_FLEET_SHIPS.map((s) => ({ ...s, loadout: [...s.loadout] })),
    colonistGear: { outfitTier: 1, toolTier: 1, weaponTier: 1 },
    hk: createDefaultHkProgress('sp-uea'),
    resources: {
      ...world.resources,
      credits: 2500,
      materials: 450,
      electronics: 220,
      compute: 180,
    },
  };
}

test('ship equipment catalog has 12 unique modules across 4 slots and 5 vessel blueprints', () => {
  assert.equal(SHIP_MODULES_CATALOG.length, 12);
  assert.equal(SHIP_BLUEPRINTS_CATALOG.length, 5);
  const ids = new Set(SHIP_MODULES_CATALOG.map((m) => m.id));
  assert.equal(ids.size, SHIP_MODULES_CATALOG.length);

  for (const mod of SHIP_MODULES_CATALOG) {
    const parsed = ShipInstalledModuleSchema.safeParse({
      id: mod.id,
      slot: mod.slot,
      name: mod.name,
      tier: mod.tier,
      firepower: mod.firepower,
      defense: mod.defense,
      speed: mod.speed,
      utilityYield: mod.utilityYield,
    });
    assert.equal(parsed.success, true, `Module ${mod.id} should parse cleanly`);
  }
});

test('EQUIP_SHIP_MODULE routes through R-24 Events Gateway and strengthens combat & theaters', () => {
  const world = buildRichTestWorld();
  const corvette = (world.fleetShips ?? []).find((s) => s.shipClass === 'CORVETTE_ORBITAL');
  assert.ok(corvette, 'Initial fleet should include an orbital corvette');

  const beforeStats = computeShipStats(corvette);
  const beforeSpace = computeFourTheaterForces(world).find((t) => t.id === 'SPACE')!;

  const [genErr, genRes] = generateActionEventDossier(world, {
    kind: 'EQUIP_SHIP_MODULE',
    shipId: corvette.id,
    moduleId: 'mod-wpn-ion-lance',
  });
  assert.equal(genErr, null);
  assert.ok(genRes);
  assert.equal(genRes.dossier.options.length, 4);
  assert.equal(genRes.dossier.source, 'ACTION_GATEWAY');

  const stdOpt = genRes.dossier.options[0]!;
  assert.equal(stdOpt.paGeneralCost, 0);
  assert.equal(stdOpt.subPaCost, 0);

  const [execErr, execRes] = executeDossierDecision(genRes.nextState, {
    dossierId: genRes.dossier.id,
    optionId: stdOpt.id,
    refinementLevel: 0,
    assignedAdvisorId: world.advisors[0]!.id,
    useGeneralPaFallback: false,
    moduleExtensionTag: 'NONE',
  });
  assert.equal(execErr, null);
  assert.ok(execRes);

  const updatedCorvette = execRes.nextState.fleetShips!.find((s) => s.id === corvette.id)!;
  const afterStats = computeShipStats(updatedCorvette);
  assert.equal(
    updatedCorvette.loadout.some((m) => m.id === 'mod-wpn-ion-lance'),
    true,
  );
  assert.ok(afterStats.firepower > beforeStats.firepower, 'Firepower must increase after mounting Ion Lance');
  assert.ok(execRes.nextState.resources.credits < world.resources.credits, 'Credits must be deducted');

  const afterSpace = computeFourTheaterForces(execRes.nextState).find((t) => t.id === 'SPACE')!;
  assert.ok(afterSpace.powerScore > beforeSpace.powerScore, 'SPACE theater power must reflect new ship weapon');

  // Verify combat Phase 2 orbital damage increases with fleet firepower bonus
  const baseOrder = {
    orderId: 'ord-test-fleet',
    targetZoneId: 'tile-24',
    targetZoneName: 'Secteur #24',
    defenderFactionId: 'riv-1',
    biome: 'BARREN' as const,
    atmosphereTier: 'P1' as const,
    attackerComputeSurplus: 60,
    defenderComputeDefense: 30,
    orbitalSupportLevel: 2,
    attackers: world.militaryRoster,
    defenders: world.militaryRoster,
  };
  const [, unarmedCombat] = resolveDeterministicCombat({ ...baseOrder, fleetFirepowerBonus: 0 }, 12345, 2);
  const [, armedCombat] = resolveDeterministicCombat(
    { ...baseOrder, fleetFirepowerBonus: computeFleetTotals(execRes.nextState.fleetShips!).totalFirepower },
    12345,
    2,
  );
  assert.ok(
    armedCombat!.phases[1]!.attackerDamageDealt > unarmedCombat!.phases[1]!.attackerDamageDealt,
    'Armed fleet must deal greater Phase 2 orbital bombardment damage',
  );
});

test('REFIT_SHIP, COMMISSION_SHIP, UPGRADE_COLONIST_GEAR and START_RESEARCH execute cleanly via Events Gateway', () => {
  let state = buildRichTestWorld();
  const initialShipCount = (state.fleetShips ?? []).length;
  const initialLedger = evaluateEntityLedger(state, 1.0);

  // 1. Commission a new Shuttle Cargo (adds utility yield to ledger)
  const [cErr, cGen] = generateActionEventDossier(state, {
    kind: 'COMMISSION_SHIP',
    shipClass: 'SHUTTLE_CARGO',
    customName: 'Navette Solarpunk-IV',
  });
  assert.equal(cErr, null);
  const [cExecErr, cExec] = executeDossierDecision(cGen!.nextState, {
    dossierId: cGen!.dossier.id,
    optionId: cGen!.dossier.options[0]!.id,
    refinementLevel: 0,
    assignedAdvisorId: state.advisors[0]!.id,
    useGeneralPaFallback: false,
    moduleExtensionTag: 'NONE',
  });
  assert.equal(cExecErr, null);
  state = cExec!.nextState;
  assert.equal(state.fleetShips!.length, initialShipCount + 1);
  assert.equal(state.fleetShips![state.fleetShips!.length - 1]!.name, 'Navette Solarpunk-IV');

  // 2. Upgrade ship level (1 -> 2)
  const targetShip = state.fleetShips![0]!;
  const [uErr, uGen] = generateActionEventDossier(state, {
    kind: 'REFIT_SHIP',
    shipId: targetShip.id,
    mode: 'UPGRADE_LEVEL',
  });
  assert.equal(uErr, null);
  const [uExecErr, uExec] = executeDossierDecision(uGen!.nextState, {
    dossierId: uGen!.dossier.id,
    optionId: uGen!.dossier.options[0]!.id,
    refinementLevel: 0,
    assignedAdvisorId: state.advisors[0]!.id,
    useGeneralPaFallback: false,
    moduleExtensionTag: 'NONE',
  });
  assert.equal(uExecErr, null);
  state = uExec!.nextState;
  assert.equal(state.fleetShips!.find((s) => s.id === targetShip.id)!.level, 2);

  // 3. Upgrade colonist tools T1 -> T2 and verify ledger materials boost
  const [gErr, gGen] = generateActionEventDossier(state, {
    kind: 'UPGRADE_COLONIST_GEAR',
    gearSlot: 'toolTier',
  });
  assert.equal(gErr, null);
  const [gExecErr, gExec] = executeDossierDecision(gGen!.nextState, {
    dossierId: gGen!.dossier.id,
    optionId: gGen!.dossier.options[0]!.id,
    refinementLevel: 0,
    assignedAdvisorId: state.advisors[0]!.id,
    useGeneralPaFallback: false,
    moduleExtensionTag: 'NONE',
  });
  assert.equal(gExecErr, null);
  state = gExec!.nextState;
  assert.equal(state.colonistGear?.toolTier, 2);

  const upgradedLedger = evaluateEntityLedger(state, 1.0);
  assert.ok(
    upgradedLedger.delta.materials > initialLedger.delta.materials,
    'Upgrading colonist tools and adding cargo ship must increase net materials yield',
  );

  // 4. Start research via dossier (and test DEFER_ACTION cancel leaves active research intact)
  const [rErr, rGen] = generateActionEventDossier(state, {
    kind: 'START_RESEARCH',
    techId: 'tech-e1-cyber-vault',
  });
  assert.equal(rErr, null);
  const [rExecErr, rExec] = executeDossierDecision(rGen!.nextState, {
    dossierId: rGen!.dossier.id,
    optionId: rGen!.dossier.options[0]!.id,
    refinementLevel: 0,
    assignedAdvisorId: state.advisors[0]!.id,
    useGeneralPaFallback: false,
    moduleExtensionTag: 'NONE',
  });
  assert.equal(rExecErr, null);
  assert.equal(rExec!.nextState.hk?.activeResearchTechId, 'tech-e1-cyber-vault');
});

test('migrateWorldStateV3ToV4 normalizes legacy fleetShips without loadout and hydrates colonistGear', () => {
  const base = createInitialWorldState({
    campaignId: 'legacy-v4-save',
    superpowerId: 'sp-uea',
    doctrineId: 'DOC_SOLAR_CHARTER',
    worldSeed: 2050,
    rivalCount: 2,
  });
  const legacyRaw = {
    ...base,
    fleetShips: [
      {
        id: 'ship-legacy-1',
        name: 'Corvette Ancienne',
        shipClass: 'CORVETTE_ORBITAL',
        level: 2,
        integrity: 90,
        assignedRole: 'ORBIT_PATROL',
      },
    ],
  };
  const migrated = migrateWorldStateV3ToV4(legacyRaw);
  assert.equal(migrated.warning, null);
  assert.ok(migrated.world);
  assert.equal(migrated.world!.fleetShips![0]!.maxSlots, 4);
  assert.deepEqual(migrated.world!.fleetShips![0]!.loadout, []);
  assert.deepEqual(migrated.world!.colonistGear, { outfitTier: 1, toolTier: 1, weaponTier: 1 });
});

test('buildEventActionPillars structures actions into RESEARCH, MILITARY, and DIPLOMATIC and executes DIPLOMATIC_INITIATIVE via R-24', () => {
  let state = buildRichTestWorld();
  const pillars = buildEventActionPillars(state);
  assert.deepEqual(
    pillars.map((p) => p.id),
    ['RESEARCH', 'MILITARY', 'DIPLOMATIC'],
  );
  for (const pillar of pillars) {
    assert.equal(pillar.items.length, 4, `Pillar ${pillar.id} must expose 4 grid actions`);
    const iconKeys = new Set(pillar.items.map((i) => i.iconKey));
    assert.equal(iconKeys.size, 4, `Pillar ${pillar.id} action icons must be distinct`);
  }

  const baseTrust = state.superAllianceTrust;
  const [pErr, pGen] = generateActionEventDossier(state, {
    kind: 'DIPLOMATIC_INITIATIVE',
    mode: 'ALLIANCE_PACT',
  });
  assert.equal(pErr, null);
  assert.equal(pGen!.dossier.options.length, 4);

  const [pExecErr, pExec] = executeDossierDecision(pGen!.nextState, {
    dossierId: pGen!.dossier.id,
    optionId: pGen!.dossier.options[0]!.id,
    refinementLevel: 0,
    assignedAdvisorId: state.advisors[0]!.id,
    useGeneralPaFallback: false,
    moduleExtensionTag: 'NONE',
  });
  assert.equal(pExecErr, null);
  state = pExec!.nextState;
  assert.ok(state.superAllianceTrust > baseTrust, 'ALLIANCE_PACT must boost Super-Alliance trust');

  const targetRival = state.rivals[0]!;
  const baseRel = targetRival.relationWithPlayer;
  const [dErr, dGen] = generateActionEventDossier(state, {
    kind: 'DIPLOMATIC_INITIATIVE',
    mode: 'RIVAL_DETENTE',
    rivalId: targetRival.id,
  });
  assert.equal(dErr, null);
  const [dExecErr, dExec] = executeDossierDecision(dGen!.nextState, {
    dossierId: dGen!.dossier.id,
    optionId: dGen!.dossier.options[0]!.id,
    refinementLevel: 0,
    assignedAdvisorId: state.advisors[0]!.id,
    useGeneralPaFallback: false,
    moduleExtensionTag: 'NONE',
  });
  assert.equal(dExecErr, null);
  const updatedRival = dExec!.nextState.rivals.find((r) => r.id === targetRival.id)!;
  assert.ok(updatedRival.relationWithPlayer > baseRel, 'RIVAL_DETENTE must improve rival relation');
});


