import { COMBAT_CONSTANTS } from '../../config/game.constants.ts';
import {
  CombatDispatchOrderSchema,
  type CombatDispatchOrder,
  type CombatPhaseLog,
  type CombatReport,
  type MilitaryUnitStack,
} from '../../contracts/combat-units.schema.ts';
import { err, ok, type ExwResult } from '../../contracts/trigger-bus.schema.ts';
import { sha256Hex } from '../../core/hashing/state-hasher.ts';
import { Pcg32 } from '../../core/prng/pcg32.ts';

/**
 * [L3] FUP-006 | SM-04 | SADT A3.6 / A4.4
 * 100% Pure Deterministic 4-Phase Combat Engine (OPT-07 A+, R-47).
 * - Phase 1: Cyber & Drones (Compute ratio >= 2.0 => Paralysis -40% DEF)
 * - Phase 2: Orbital Bombardment
 * - Phase 3: Combined Arms Rounds (Infantry / Armor / Drones / Corvettes / Cyber)
 * - Phase 4: Capture & Garrison + Deterministic PCG32 SHA-256 fingerprint
 */
function calculateStackPower(stacks: readonly MilitaryUnitStack[], biomeMod: number): number {
  let total = 0;
  for (const s of stacks) {
    const levelMult = COMBAT_CONSTANTS.LEVEL_MULTIPLIERS[s.level];
    const armorBonus = 1 + s.armor * 0.45;
    total += s.count * s.basePower * levelMult * armorBonus * s.supplyFactor * biomeMod;
  }
  return Math.max(1, Number(total.toFixed(2)));
}

export function resolveDeterministicCombat(
  rawOrder: unknown,
  seed: number,
  cycle: number,
): ExwResult<CombatReport> {
  const parsed = CombatDispatchOrderSchema.safeParse(rawOrder);
  if (!parsed.success) {
    return err('EXW_ERR_COMBAT_INVALID', 'Ordre de combat invalide.', parsed.error.message);
  }
  const order: CombatDispatchOrder = parsed.data;
  const prng = new Pcg32(seed ^ (cycle * 131 + 17));
  const biomeMod = COMBAT_CONSTANTS.BIOME_MODIFIERS[order.biome];

  let attackerPower = calculateStackPower(order.attackers, biomeMod);
  let defenderPower = calculateStackPower(order.defenders, 1.0);
  const initialAttackerPower = attackerPower;
  const initialDefenderPower = defenderPower;

  const phases: CombatPhaseLog[] = [];

  // Phase 1: Cyber & Drones
  const cyberRatio = order.attackerComputeSurplus / Math.max(1, order.defenderComputeDefense);
  const cyberParalysisApplied = cyberRatio >= COMBAT_CONSTANTS.CYBER_SURPLUS_RATIO_REQUIRED;
  const p1AtkDmg = Number((defenderPower * (cyberParalysisApplied ? 0.4 : 0.12) * prng.nextRange(0.92, 1.08)).toFixed(2));
  const p1DefDmg = Number((attackerPower * 0.08 * prng.nextRange(0.9, 1.1)).toFixed(2));
  defenderPower = Math.max(0, Number((defenderPower - p1AtkDmg).toFixed(2)));
  attackerPower = Math.max(0, Number((attackerPower - p1DefDmg).toFixed(2)));

  phases.push({
    phase: 'PHASE_1_CYBER_DRONES',
    summary: cyberParalysisApplied
      ? `Ratio Compute ${cyberRatio.toFixed(1)}× >= 2× : Cyber-paralysie active (-40% DEF adverse).`
      : `Escarmouche drones & contre-mesures (Ratio Compute ${cyberRatio.toFixed(1)}×).`,
    attackerDamageDealt: p1AtkDmg,
    defenderDamageDealt: p1DefDmg,
    attackerRemainingPower: attackerPower,
    defenderRemainingPower: defenderPower,
  });

  // Phase 2: Orbital Bombardment
  const orbitalFactor = 0.06 + order.orbitalSupportLevel * 0.045;
  const p2AtkDmg = Number((attackerPower * orbitalFactor * prng.nextRange(0.95, 1.1)).toFixed(2));
  const p2DefDmg = Number((defenderPower * 0.1 * prng.nextRange(0.9, 1.05)).toFixed(2));
  defenderPower = Math.max(0, Number((defenderPower - p2AtkDmg).toFixed(2)));
  attackerPower = Math.max(0, Number((attackerPower - p2DefDmg).toFixed(2)));

  phases.push({
    phase: 'PHASE_2_ORBITAL_BOMBARDMENT',
    summary: `Frappe orbitale Niv.${order.orbitalSupportLevel} (${p2AtkDmg.toFixed(1)} dégâts structurels).`,
    attackerDamageDealt: p2AtkDmg,
    defenderDamageDealt: p2DefDmg,
    attackerRemainingPower: attackerPower,
    defenderRemainingPower: defenderPower,
  });

  // Phase 3: Combined Arms Rounds
  const p3AtkDmg = Number((attackerPower * 0.58 * prng.nextRange(0.92, 1.12)).toFixed(2));
  const p3DefDmg = Number((defenderPower * 0.46 * prng.nextRange(0.9, 1.1)).toFixed(2));
  defenderPower = Math.max(0, Number((defenderPower - p3AtkDmg).toFixed(2)));
  attackerPower = Math.max(0, Number((attackerPower - p3DefDmg).toFixed(2)));

  phases.push({
    phase: 'PHASE_3_COMBINED_ROUNDS',
    summary: `Assaut interarmes en biome ${order.biome} (${order.atmosphereTier}) : percée ${p3AtkDmg.toFixed(1)} vs riposte ${p3DefDmg.toFixed(1)}.`,
    attackerDamageDealt: p3AtkDmg,
    defenderDamageDealt: p3DefDmg,
    attackerRemainingPower: attackerPower,
    defenderRemainingPower: defenderPower,
  });

  // Phase 4: Capture & Garrison
  const outcome: CombatReport['outcome'] =
    attackerPower > defenderPower * 1.1
      ? 'CAPTURED'
      : defenderPower > attackerPower * 1.1
        ? 'REPELLED'
        : 'STALEMATE';

  const totalAttackerUnits = order.attackers.reduce((sum, u) => sum + u.count, 0);
  const totalDefenderUnits = order.defenders.reduce((sum, u) => sum + u.count, 0);
  const attackerLossRatio = 1 - attackerPower / Math.max(1, initialAttackerPower);
  const defenderLossRatio = 1 - defenderPower / Math.max(1, initialDefenderPower);

  const attackerLosses = Math.max(0, Math.min(totalAttackerUnits, Math.round(totalAttackerUnits * attackerLossRatio * 0.5)));
  const defenderLosses = Math.max(0, Math.min(totalDefenderUnits, Math.round(totalDefenderUnits * defenderLossRatio * 0.75)));
  const garrisonStrength = outcome === 'CAPTURED' ? Math.max(1, totalAttackerUnits - attackerLosses) : Math.max(1, totalDefenderUnits - defenderLosses);

  phases.push({
    phase: 'PHASE_4_CAPTURE_GARRISON',
    summary:
      outcome === 'CAPTURED'
        ? `Secteur ${order.targetZoneName} sécurisé. Garnison déployée : ${garrisonStrength} unités.`
        : outcome === 'REPELLED'
          ? `Assaut repoussé sur ${order.targetZoneName}. Repli tactique ordonné.`
          : `Front stabilisé (statu quo) sur ${order.targetZoneName}.`,
    attackerDamageDealt: 0,
    defenderDamageDealt: 0,
    attackerRemainingPower: attackerPower,
    defenderRemainingPower: defenderPower,
  });

  const deterministicSeedHash = sha256Hex(
    `${order.orderId}|${seed}|${cycle}|${outcome}|${attackerPower}|${defenderPower}`,
  );

  return ok({
    orderId: order.orderId,
    targetZoneId: order.targetZoneId,
    targetZoneName: order.targetZoneName,
    cycleResolved: cycle,
    outcome,
    cyberParalysisApplied,
    attackerLosses,
    defenderLosses,
    garrisonStrength,
    humankindMilitaryStars: outcome === 'CAPTURED' ? (cyberParalysisApplied ? 2 : 1) : 0,
    phases,
    deterministicSeedHash,
  });
}
