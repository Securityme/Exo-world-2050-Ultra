import { ECONOMY_CONSTANTS } from '../../config/economy.constants.ts';
import { MAINTENANCE_CONSTANTS } from '../../config/maintenance.constants.ts';
import type { TriggerBusEvent } from '../../contracts/trigger-bus.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';

/**
 * [L2] FUP-001 / FUP-004 | SM-01 / SM-03 | SADT A1.1 / A3.4
 * Pure Watchdog Threshold Evaluator: detects C3 critical integrity (<25%),
 * civic approval referendum threshold (<35%), and solvency degradation.
 */
export interface WatchdogReport {
  readonly criticalDistricts: readonly string[];
  readonly referendumTriggered: boolean;
  readonly solvencyCritical: boolean;
  readonly emittedTriggers: readonly TriggerBusEvent[];
}

export function evaluateWatchdogThresholds(
  state: WorldState,
  targetCycle: number,
): WatchdogReport {
  const emitted: TriggerBusEvent[] = [];
  const criticalDistricts = state.districts
    .filter((d) => d.integrity < MAINTENANCE_CONSTANTS.CRITICAL_SHUTDOWN_THRESHOLD)
    .map((d) => d.id);

  if (criticalDistricts.length > 0) {
    const first = state.districts.find((d) => d.id === criticalDistricts[0]);
    emitted.push({
      id: `wd-c3-${targetCycle}-${criticalDistricts[0]}`,
      tickIssued: state.tick,
      cycleIssued: targetCycle,
      dueCycle: targetCycle,
      horizon: 'IMMEDIATE',
      severity: 'P0_CRISIS',
      category: 'MAINTENANCE_CRITICAL',
      title: `Rupture C3 : ${first?.name ?? criticalDistricts[0]}`,
      summary: `Intégrité tombée à ${first?.integrity ?? 0}% (< ${MAINTENANCE_CONSTANTS.CRITICAL_SHUTDOWN_THRESHOLD}%).`,
      sourceNode: 'A3.4',
      deltaModifier: -0.08,
      resolved: false,
    });
  }

  const referendumTriggered = state.approval < ECONOMY_CONSTANTS.REFERENDUM_APPROVAL_THRESHOLD;
  if (referendumTriggered) {
    emitted.push({
      id: `wd-ref-${targetCycle}`,
      tickIssued: state.tick,
      cycleIssued: targetCycle,
      dueCycle: targetCycle,
      horizon: 'IMMEDIATE',
      severity: 'HIGH',
      category: 'CIVIC_REFERENDUM',
      title: 'Seuil de Référendum Fédéral Franchi',
      summary: `Approbation civique à ${state.approval}% (< ${ECONOMY_CONSTANTS.REFERENDUM_APPROVAL_THRESHOLD}%).`,
      sourceNode: 'A1.1',
      deltaModifier: -0.06,
      resolved: false,
    });
  }

  const solvencyCritical = state.finance.solvencyRating === 'C' || state.finance.solvencyRating === 'D';
  if (solvencyCritical) {
    emitted.push({
      id: `wd-debt-${targetCycle}`,
      tickIssued: state.tick,
      cycleIssued: targetCycle,
      dueCycle: targetCycle,
      horizon: 'SUSTAINED_MODIFIER',
      severity: 'HIGH',
      category: 'DEBT_SOLVENCY',
      title: 'Alerte Solvabilité Fédérale',
      summary: `Cote financière ${state.finance.solvencyRating} : majoration des taux d’emprunt.`,
      sourceNode: 'A3.3',
      deltaModifier: -0.05,
      resolved: false,
    });
  }

  return {
    criticalDistricts,
    referendumTriggered,
    solvencyCritical,
    emittedTriggers: emitted,
  };
}
