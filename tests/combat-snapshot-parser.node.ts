import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDeterministicCombat } from '../src/systems/combat-conquest/combat-engine.ts';
import {
  COMBAT_PHASE_META,
  parseTurnSnapshotsForCombat,
} from '../src/utils/combat-snapshot-parser.ts';

function makeDeterministicReport(orderId: string, cycle: number, computeSurplus: number) {
  const [err, report] = resolveDeterministicCombat(
    {
      orderId,
      targetZoneId: `zone-${cycle}`,
      targetZoneName: `Crête Boréale #${20 + cycle}`,
      defenderFactionId: 'rival-1',
      biome: 'CANYON',
      atmosphereTier: 'P1',
      attackerComputeSurplus: computeSurplus,
      defenderComputeDefense: 30,
      orbitalSupportLevel: 2,
      attackers: [
        { id: 'atk-1', unitClass: 'INFANTRY_EXO', level: 2, count: 14, basePower: 12, armor: 0.25, supplyFactor: 1 },
        { id: 'atk-2', unitClass: 'DRONE_SWARM', level: 1, count: 10, basePower: 9, armor: 0.1, supplyFactor: 1 },
      ],
      defenders: [
        { id: 'def-1', unitClass: 'INFANTRY_EXO', level: 1, count: 9, basePower: 10, armor: 0.15, supplyFactor: 1 },
      ],
    },
    20500409,
    cycle,
  );
  assert.equal(err, null);
  assert.ok(report);
  return report;
}

test('parseTurnSnapshotsForCombat deduplicates consecutive turn_snapshots and preserves 4-phase timeline math', () => {
  const r1 = makeDeterministicReport('ord-alpha', 1, 80); // triggers cyber paralysis (>= 60)
  const r2 = makeDeterministicReport('ord-beta', 3, 20);  // no cyber paralysis

  const snapshots = [
    {
      id: 'snap-c1',
      campaignId: 'camp-1',
      cycle: 1,
      year: 2050,
      season: 'PRINTEMPS',
      era: 1,
      stateHash: 'aaaa1111bbbb',
      combatReports: [r1],
    },
    {
      id: 'snap-c2',
      campaignId: 'camp-1',
      cycle: 2,
      year: 2050,
      season: 'ETE',
      era: 1,
      stateHash: 'cccc2222dddd',
      combatReports: [r1], // repeated from previous turn — must deduplicate & keep snap-c1 provenance
    },
    {
      id: 'snap-c3',
      campaignId: 'camp-1',
      cycle: 3,
      year: 2050,
      season: 'AUTOMNE',
      era: 1,
      stateHash: 'eeee3333ffff',
      combatReports: [r2, r1],
    },
  ];

  const parsed = parseTurnSnapshotsForCombat(snapshots);
  assert.equal(parsed.parseError, null);
  assert.equal(parsed.metrics.snapshotsScanned, 3);
  assert.equal(parsed.metrics.totalBattles, 2);
  assert.equal(parsed.metrics.cyberParalysisCount, 1);

  // Sorted newest cycle first
  assert.equal(parsed.engagements[0]!.orderId, 'ord-beta');
  assert.equal(parsed.engagements[1]!.orderId, 'ord-alpha');
  // Earliest snapshot provenance preserved
  assert.equal(parsed.engagements[1]!.snapshotId, 'snap-c1');
  assert.equal(parsed.engagements[1]!.snapshotCycle, 1);

  // 4 ordered phases with valid retention percentages & decisive phase flag
  const steps = parsed.engagements[1]!.steps;
  assert.equal(steps.length, 4);
  assert.deepEqual(
    steps.map((s) => s.stepNumber),
    [1, 2, 3, 4],
  );
  assert.equal(steps[0]!.title, COMBAT_PHASE_META.PHASE_1_CYBER_DRONES.title);
  assert.equal(steps.filter((s) => s.isDecisivePhase).length, 1);
  assert.ok(steps[0]!.attackerPowerBefore >= steps[0]!.attackerPowerAfter);
  assert.ok(steps[3]!.defenderRetentionPct >= 0 && steps[3]!.defenderRetentionPct <= 100);
});

test('parseTurnSnapshotsForCombat supports snake_case Drizzle/SQL JSON rows and reports invalid JSON cleanly', () => {
  const r = makeDeterministicReport('ord-sql-7', 5, 75);
  const snakeJson = JSON.stringify({
    turn_snapshots: [
      {
        snapshot_id: 'pg-row-5',
        cycle: 5,
        year: 2051,
        season: 'HIVER',
        era: 2,
        state_hash: '998877665544',
        payload: {
          combat_reports: [
            {
              order_id: r.orderId,
              target_zone_id: r.targetZoneId,
              target_zone_name: r.targetZoneName,
              cycle_resolved: r.cycleResolved,
              outcome: r.outcome,
              cyber_paralysis_applied: r.cyberParalysisApplied,
              attacker_losses: r.attackerLosses,
              defender_losses: r.defenderLosses,
              garrison_strength: r.garrisonStrength,
              humankind_military_stars: r.humankindMilitaryStars,
              deterministic_seed_hash: r.deterministicSeedHash,
              phases: r.phases.map((p) => ({
                phase_code: p.phase,
                summary: p.summary,
                attacker_damage_dealt: p.attackerDamageDealt,
                defender_damage_dealt: p.defenderDamageDealt,
                attacker_remaining_power: p.attackerRemainingPower,
                defender_remaining_power: p.defenderRemainingPower,
              })),
            },
          ],
        },
      },
    ],
  });

  const okRes = parseTurnSnapshotsForCombat(snakeJson);
  assert.equal(okRes.parseError, null);
  assert.equal(okRes.metrics.totalBattles, 1);
  assert.equal(okRes.engagements[0]!.snapshotId, 'pg-row-5');
  assert.equal(okRes.engagements[0]!.steps.length, 4);

  const badRes = parseTurnSnapshotsForCombat('{not valid json');
  assert.ok(badRes.parseError && badRes.parseError.includes('JSON'));
  assert.equal(badRes.engagements.length, 0);
});
