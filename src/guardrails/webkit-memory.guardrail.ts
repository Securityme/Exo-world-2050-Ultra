import { TELEMETRY_CONSTANTS } from '../config/telemetry.constants.ts';
import { err, ok, type ExwResult } from '../contracts/trigger-bus.schema.ts';

/**
 * [L2/L5] R-60 Safari/WebKit Memory & Geometry Guardrail.
 * Prevents iOS/WebKit tab crashes by bounding texture MB & active Three.js geometry count.
 */
export interface WebKitMemoryTelemetry {
  readonly estimatedTextureMb: number;
  readonly activeGeometries: number;
  readonly lowPowerMode: boolean;
}

export function evaluateWebKitMemoryBudget(telemetry: WebKitMemoryTelemetry): ExwResult<{
  readonly recommendedPixelRatioMax: number;
  readonly pruneTextures: boolean;
}> {
  if (telemetry.estimatedTextureMb > TELEMETRY_CONSTANTS.WEBKIT_MAX_TEXTURE_MB) {
    return err(
      'EXW_ERR_SCHEMA',
      `R-60 Budget texture WebKit dépassé (${telemetry.estimatedTextureMb} MB > ${TELEMETRY_CONSTANTS.WEBKIT_MAX_TEXTURE_MB} MB).`,
    );
  }
  if (telemetry.activeGeometries > TELEMETRY_CONSTANTS.WEBKIT_MAX_GEOMETRY_COUNT) {
    return err(
      'EXW_ERR_SCHEMA',
      `R-60 Budget géométries WebKit dépassé (${telemetry.activeGeometries} > ${TELEMETRY_CONSTANTS.WEBKIT_MAX_GEOMETRY_COUNT}).`,
    );
  }
  return ok({
    recommendedPixelRatioMax: telemetry.lowPowerMode ? 1.25 : 2,
    pruneTextures: telemetry.estimatedTextureMb > TELEMETRY_CONSTANTS.WEBKIT_MAX_TEXTURE_MB * 0.8,
  });
}
