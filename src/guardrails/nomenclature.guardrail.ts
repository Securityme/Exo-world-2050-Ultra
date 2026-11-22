import { NOMENCLATURE_CONSTANTS } from '../config/nomenclature.constants.ts';
import { err, ok, type ExwResult } from '../contracts/trigger-bus.schema.ts';

/**
 * [L2/L5] R-50 Strict Scientific Nomenclature Guardrail.
 * Rejects the banned generic term across strings, dossiers, catalogs, and Oracle outputs.
 */
const FORBIDDEN_TERM_REGEX = new RegExp(NOMENCLATURE_CONSTANTS.FORBIDDEN_PATTERN_SOURCE, 'i');

export function containsForbiddenNomenclature(text: string): boolean {
  return FORBIDDEN_TERM_REGEX.test(text);
}

export function assertR50CompliantText(text: string, context = 'TextPayload'): ExwResult<string> {
  if (containsForbiddenNomenclature(text)) {
    return err(
      'EXW_ERR_NOMENCLATURE',
      `Violation R-50 (${context}) : terme générique banni détecté. Utiliser un descripteur scientifique exact.`,
    );
  }
  return ok(text);
}

export function assertR50CompliantValue(value: unknown, context = 'Payload'): ExwResult<true> {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  if (serialized && containsForbiddenNomenclature(serialized)) {
    return err(
      'EXW_ERR_NOMENCLATURE',
      `Violation R-50 (${context}) : nomenclature scientifique stricte non respectée.`,
    );
  }
  return ok(true);
}
