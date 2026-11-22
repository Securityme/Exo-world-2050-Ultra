import { TELEMETRY_CONSTANTS } from '../../config/telemetry.constants.ts';

/**
 * [L2] FUP-006 | SM-01 | SADT A4.2 (R-06, R-68)
 * Pure LLM FreeTier Router: deterministically chooses between ORACLE_GEMINI and FALLBACK_CATALOG
 * based on quota usage, cooldown state, and circuit-breaker flags (zero network calls).
 */
export interface FreeTierQuotaState {
  readonly requestsLastMinute: number;
  readonly requestsToday: number;
  readonly oracleEnabled: boolean;
  readonly consecutiveErrors: number;
}

export type OracleRouteDecision = 'ORACLE_GEMINI' | 'FALLBACK_CATALOG';

export function routeLlmFreeTierRequest(quota: FreeTierQuotaState): {
  readonly route: OracleRouteDecision;
  readonly reason: string;
} {
  if (!quota.oracleEnabled) {
    return { route: 'FALLBACK_CATALOG', reason: 'Oracle désactivé par le joueur.' };
  }
  if (quota.consecutiveErrors >= 2) {
    return { route: 'FALLBACK_CATALOG', reason: 'Coupe-circuit actif après erreurs consécutives.' };
  }
  if (quota.requestsLastMinute >= TELEMETRY_CONSTANTS.GEMINI_FREE_RPM_LIMIT) {
    return { route: 'FALLBACK_CATALOG', reason: 'Plafond FreeTier RPM atteint (R-06).' };
  }
  if (quota.requestsToday >= TELEMETRY_CONSTANTS.GEMINI_FREE_RPD_LIMIT) {
    return { route: 'FALLBACK_CATALOG', reason: 'Plafond FreeTier RPD atteint (R-68).' };
  }
  return { route: 'ORACLE_GEMINI', reason: 'Quota FreeTier nominal.' };
}
