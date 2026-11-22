import { TELEMETRY_CONSTANTS } from '../config/telemetry.constants.ts';
import type { ExecutiveDossier } from '../contracts/pa-dossiers.schema.ts';
import { ExecutiveDossierSchema } from '../contracts/pa-dossiers.schema.ts';
import { err, ok, type ExwResult } from '../contracts/trigger-bus.schema.ts';

/**
 * [L2/L5] FUP-006 / R-10 | Zod Airlock Guardrail
 * Enforces strict [-0.15, +0.15] delta bounds and schema conformity on external/Oracle payloads.
 */
export function clampAirlockDelta(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(
    TELEMETRY_CONSTANTS.AIRLOCK_DELTA_MIN,
    Math.min(TELEMETRY_CONSTANTS.AIRLOCK_DELTA_MAX, value),
  );
}

export function validateAirlockDossier(
  rawPayload: unknown,
  options?: { readonly strictBounds?: boolean },
): ExwResult<ExecutiveDossier> {
  const parsed = ExecutiveDossierSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return err('EXW_ERR_SCHEMA', 'Airlock Zod : dossier non conforme.', parsed.error.message);
  }
  const dossier = parsed.data;
  if (options?.strictBounds) {
    for (const opt of dossier.options) {
      if (
        opt.effects.oracleImpactFactor < TELEMETRY_CONSTANTS.AIRLOCK_DELTA_MIN ||
        opt.effects.oracleImpactFactor > TELEMETRY_CONSTANTS.AIRLOCK_DELTA_MAX
      ) {
        return err(
          'EXW_ERR_SCHEMA',
          `Airlock Zod : oracleImpactFactor hors bornes [-0.15, +0.15] (${opt.effects.oracleImpactFactor}).`,
        );
      }
    }
  }

  return ok({
    ...dossier,
    options: dossier.options.map((opt) => ({
      ...opt,
      effects: {
        ...opt.effects,
        oracleImpactFactor: clampAirlockDelta(opt.effects.oracleImpactFactor),
      },
    })),
  });
}
