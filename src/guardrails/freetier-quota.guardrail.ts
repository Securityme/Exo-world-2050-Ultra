import { TELEMETRY_CONSTANTS } from '../config/telemetry.constants.ts';
import { err, ok, type ExwResult } from '../contracts/trigger-bus.schema.ts';

/**
 * [L2/L5] R-06 / R-68 Gemini FreeTier Quota Guardrail.
 * Enforces RPM (<=12) and RPD (<=900) budgets before dispatching external LLM calls.
 */
export interface QuotaUsageSnapshot {
  readonly requestsInWindowMinute: number;
  readonly requestsToday: number;
}

export function checkFreeTierQuota(usage: QuotaUsageSnapshot): ExwResult<true> {
  if (usage.requestsInWindowMinute >= TELEMETRY_CONSTANTS.GEMINI_FREE_RPM_LIMIT) {
    return err(
      'EXW_ERR_QUOTA_EXCEEDED',
      `Quota FreeTier RPM dépassé (${usage.requestsInWindowMinute}/${TELEMETRY_CONSTANTS.GEMINI_FREE_RPM_LIMIT}). Bascule fallback local.`,
    );
  }
  if (usage.requestsToday >= TELEMETRY_CONSTANTS.GEMINI_FREE_RPD_LIMIT) {
    return err(
      'EXW_ERR_QUOTA_EXCEEDED',
      `Quota FreeTier RPD dépassé (${usage.requestsToday}/${TELEMETRY_CONSTANTS.GEMINI_FREE_RPD_LIMIT}). Bascule fallback local.`,
    );
  }
  return ok(true);
}
