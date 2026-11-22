import { z } from 'zod';

/**
 * [L0] FUP-001 | SM-01 | SADT A1.1
 * Tri-Way Cybernetic TRIGGER_BUS & Result Pattern contracts (R-01, R-20, R-53).
 */
export const TriggerHorizonSchema = z.enum([
  'IMMEDIATE',
  'SUSTAINED_MODIFIER',
  'DELAYED_ECHO',
  'MEMORY_FLAG',
]);

export const TriggerSeveritySchema = z.enum(['P0_CRISIS', 'HIGH', 'STANDARD', 'INFO']);

export const TriggerCategorySchema = z.enum([
  'MAINTENANCE_WEAR',
  'MAINTENANCE_CRITICAL',
  'ATMOSPHERE_SHIFT',
  'DEBT_SOLVENCY',
  'CYBER_INTRUSION',
  'CIVIC_REFERENDUM',
  'ALLIANCE_DIRECTIVE',
  'SCIENTIFIC_DISCOVERY',
  'MILITARY_FRONT',
  'DELAYED_CONSEQUENCE',
]);

export const TriggerBusEventSchema = z.object({
  id: z.string().min(3).max(96),
  tickIssued: z.number().int().nonnegative(),
  cycleIssued: z.number().int().nonnegative(),
  dueCycle: z.number().int().nonnegative(),
  horizon: TriggerHorizonSchema,
  severity: TriggerSeveritySchema,
  category: TriggerCategorySchema,
  title: z.string().min(3).max(120),
  summary: z.string().min(4).max(400),
  sourceNode: z.enum(['A1.1', 'A1.3', 'A2.3', 'A3.1', 'A3.2', 'A3.3', 'A3.4', 'A3.5', 'A3.6', 'A4.2']),
  deltaModifier: z.number().min(-0.15).max(0.15).default(0),
  resolved: z.boolean().default(false),
});

export type TriggerHorizon = z.infer<typeof TriggerHorizonSchema>;
export type TriggerSeverity = z.infer<typeof TriggerSeveritySchema>;
export type TriggerCategory = z.infer<typeof TriggerCategorySchema>;
export type TriggerBusEvent = z.infer<typeof TriggerBusEventSchema>;

export type ExwErrorCode =
  | 'EXW_ERR_SCHEMA'
  | 'EXW_ERR_PA_INSUFFICIENT'
  | 'EXW_ERR_P0_BLOCK'
  | 'EXW_ERR_ERA_LOCKED'
  | 'EXW_ERR_COMBAT_INVALID'
  | 'EXW_ERR_CYBER_INSUFFICIENT'
  | 'EXW_ERR_FINANCE_LIMIT'
  | 'EXW_ERR_ORACLE_TIMEOUT'
  | 'EXW_ERR_AUTH_REQUIRED'
  | 'EXW_ERR_DOC_SYNC'
  | 'EXW_ERR_NOMENCLATURE'
  | 'EXW_ERR_DAG_CYCLE'
  | 'EXW_ERR_QUOTA_EXCEEDED';

export interface ExwError {
  readonly code: ExwErrorCode;
  readonly message: string;
  readonly detail?: string;
}

export type ExwResult<T> = readonly [ExwError, null] | readonly [null, T];

export function ok<T>(data: T): ExwResult<T> {
  return [null, data] as const;
}

export function err<T = never>(code: ExwErrorCode, message: string, detail?: string): ExwResult<T> {
  return [{ code, message, detail }, null] as const;
}
