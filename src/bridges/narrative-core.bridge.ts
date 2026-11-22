import type { ExecutiveDossier } from '../contracts/pa-dossiers.schema.ts';
import type { NarrativeDagGraph } from '../contracts/narrative-dag.schema.ts';
import { err, ok, type ExwResult } from '../contracts/trigger-bus.schema.ts';
import { parseGeminiDualPass } from '../parsers/gemini-dualpass.parser.ts';
import { validateDagKahnBfs } from '../guardrails/dag-kahn-bfs.guardrail.ts';
import { assertR50CompliantText } from '../guardrails/nomenclature.guardrail.ts';

/**
 * [L4/L5] FUP-006 | SM-05 | SADT A4.2
 * Narrative-Core Bridge validating Oracle Dual-Pass output through R-50 & Kahn/BFS DAG before entering L2/L3.
 */
export function bridgeOracleResponseToCore(
  rawOracleText: string,
  optionalDag?: NarrativeDagGraph,
): ExwResult<ExecutiveDossier> {
  const [parseErr, parsed] = parseGeminiDualPass(rawOracleText);
  if (parseErr !== null) return [parseErr, null];

  const [r50Err] = assertR50CompliantText(
    `${parsed.dossier.title} ${parsed.dossier.briefing} ${parsed.dossier.scientificTag ?? ''}`,
    'OracleBridge',
  );
  if (r50Err !== null) return [r50Err, null];

  if (optionalDag) {
    const [dagErr] = validateDagKahnBfs(optionalDag);
    if (dagErr !== null) return [dagErr, null];
  }

  return ok({
    ...parsed.dossier,
    source: 'ORACLE_GEMINI',
  });
}

export function rejectInvalidBridgePayload(reason: string): ExwResult<never> {
  return err('EXW_ERR_SCHEMA', reason);
}
