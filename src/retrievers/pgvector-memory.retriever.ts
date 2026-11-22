import { LLM_FREETIER_CONSTANTS } from '../config/llm-freetier.constants.ts';
import { err, ok, type ExwResult } from '../contracts/trigger-bus.schema.ts';

/**
 * [L5] FUP-012 | SM-05 | SADT A5.2
 * Cloud SQL PostgreSQL 16 pgvector (768d) semantic memory retriever client adapter.
 */
export interface PgVectorMemoryQuery {
  readonly campaignId: string;
  readonly queryEmbedding: readonly number[];
  readonly topK: number;
}

export interface PgVectorMemoryHit {
  readonly id: string;
  readonly cycle: number;
  readonly similarity: number;
  readonly summary: string;
}

export function validatePgVectorQuery(query: PgVectorMemoryQuery): ExwResult<PgVectorMemoryQuery> {
  if (query.queryEmbedding.length !== LLM_FREETIER_CONSTANTS.PGVECTOR_DIMENSIONS) {
    return err(
      'EXW_ERR_SCHEMA',
      `Dimension pgvector invalide (${query.queryEmbedding.length}/${LLM_FREETIER_CONSTANTS.PGVECTOR_DIMENSIONS}).`,
    );
  }
  return ok(query);
}
