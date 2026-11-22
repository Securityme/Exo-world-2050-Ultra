import type { z } from 'zod';
import { err, ok, type ExwResult } from '../contracts/trigger-bus.schema.ts';

/**
 * [L0] FUP-010 / FUP-012 | MC-00 | SADT A0
 * Strict Zod Boundary Parser returning Result tuples [ExwError, null] | [null, T] (R-10, R-20).
 */
export function parseWithZodSchema<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  rawPayload: unknown,
  boundaryLabel = 'BoundaryPayload',
): ExwResult<z.infer<TSchema>> {
  const parsed = schema.safeParse(rawPayload);
  if (!parsed.success) {
    const issueSummary = parsed.error.issues
      .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
      .join(' | ');
    return err('EXW_ERR_SCHEMA', `Validation Zod échouée (${boundaryLabel})`, issueSummary);
  }
  return ok(parsed.data);
}

export function parseJsonBoundary<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  rawJson: string,
  boundaryLabel = 'JsonBoundary',
): ExwResult<z.infer<TSchema>> {
  try {
    const decoded: unknown = JSON.parse(rawJson);
    return parseWithZodSchema(schema, decoded, boundaryLabel);
  } catch (caught) {
    const detail = caught instanceof Error ? caught.message : String(caught);
    return err('EXW_ERR_SCHEMA', `JSON invalide (${boundaryLabel})`, detail);
  }
}
