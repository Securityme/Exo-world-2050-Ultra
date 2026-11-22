import { CYCLE_CONSTANTS } from '../../config/cycle.constants.ts';

/**
 * [L2] FUP-001 | MC-00 | SADT A1.1
 * Pure Multi-Scale Temporal Auto-Turn Evaluator (N0 Tick -> N1 Cycle -> N2 Month/Season -> N3 Year).
 */
export interface AutoTurnBoundary {
  readonly nextTick: number;
  readonly crossesCycleN1: boolean;
  readonly crossesMonthN2: boolean;
  readonly crossesSeasonN2: boolean;
  readonly crossesYearN3: boolean;
  readonly nextCycleIndex: number;
}

export function evaluateAutoTurnBoundary(currentTick: number, currentCycle: number): AutoTurnBoundary {
  const nextTick = currentTick + 1;
  const crossesCycleN1 = nextTick % CYCLE_CONSTANTS.TICKS_PER_CYCLE_N1 === 0;
  const crossesMonthN2 = nextTick % CYCLE_CONSTANTS.TICKS_PER_MONTH_N2 === 0;
  const crossesSeasonN2 = nextTick % CYCLE_CONSTANTS.TICKS_PER_SEASON_N2 === 0;
  const crossesYearN3 = nextTick % CYCLE_CONSTANTS.TICKS_PER_YEAR_N3 === 0;

  return {
    nextTick,
    crossesCycleN1,
    crossesMonthN2,
    crossesSeasonN2,
    crossesYearN3,
    nextCycleIndex: crossesCycleN1 ? currentCycle + 1 : currentCycle,
  };
}
