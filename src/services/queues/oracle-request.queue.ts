import { routeLlmFreeTierRequest, type FreeTierQuotaState } from '../../core/routers/llm-freetier.router.ts';
import { checkFreeTierQuota } from '../../guardrails/freetier-quota.guardrail.ts';

/**
 * [L5] FUP-006 | SM-01 | SADT A4.2
 * Service-layer Oracle Request Queue honoring FreeTier RPM/RPD guardrails & cooldown windows.
 */
export class OracleRequestQueue {
  private readonly timestampsMs: number[] = [];
  private dailyCount = 0;
  private consecutiveErrors = 0;

  public canDispatch(oracleEnabled: boolean, nowMs = Date.now()): { allowed: boolean; reason: string } {
    this.pruneWindow(nowMs);
    const quotaState: FreeTierQuotaState = {
      requestsLastMinute: this.timestampsMs.length,
      requestsToday: this.dailyCount,
      oracleEnabled,
      consecutiveErrors: this.consecutiveErrors,
    };
    const [err] = checkFreeTierQuota({
      requestsInWindowMinute: quotaState.requestsLastMinute,
      requestsToday: quotaState.requestsToday,
    });
    if (err) return { allowed: false, reason: err.message };
    const decision = routeLlmFreeTierRequest(quotaState);
    return { allowed: decision.route === 'ORACLE_GEMINI', reason: decision.reason };
  }

  public recordSuccess(nowMs = Date.now()): void {
    this.timestampsMs.push(nowMs);
    this.dailyCount += 1;
    this.consecutiveErrors = 0;
  }

  public recordFailure(nowMs = Date.now()): void {
    this.timestampsMs.push(nowMs);
    this.dailyCount += 1;
    this.consecutiveErrors += 1;
  }

  private pruneWindow(nowMs: number): void {
    const cutoff = nowMs - 60_000;
    while (this.timestampsMs.length > 0 && (this.timestampsMs[0] ?? 0) < cutoff) {
      this.timestampsMs.shift();
    }
  }
}

export const oracleRequestQueue = new OracleRequestQueue();
