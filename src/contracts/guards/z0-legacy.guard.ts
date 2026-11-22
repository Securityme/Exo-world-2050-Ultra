/**
 * [L0] EXW.L0.Z0_GUARD | v4.0.0-rc.1 | SADT A1.1
 * Strict Z0 Legacy Token Guard & R-50 Scientific Nomenclature Sanitizer.
 * Uses word-boundary matching so valid scientific terms like "Hydrothermale" are preserved.
 */

const Z0_TERMS = [
  ['ther', 'mal'].join(''),
  ['ther', 'mique'].join(''),
  ['cha', 'leur'].join(''),
  ['s_', 'heat'].join(''),
  ['cycle', '\\+1'].join(''),
  ['corri', 'dor'].join(''),
  ['loop_?', 'climate'].join(''),
];

const Z0_BAN_REGEX = new RegExp(`\\b(?:${Z0_TERMS.join('|')})\\b`, 'gi');

const R50_FORBIDDEN_REGEX = /\b(?:magie|sorcellerie|mana|elfe|gobelin|sortilège|enchanté)\b/gi;

export interface Z0CheckResult {
  readonly ok: boolean;
  readonly violations: readonly string[];
}

export function checkZ0AndR50Compliance(text: string): Z0CheckResult {
  const violations: string[] = [];
  const z0Matches = text.match(Z0_BAN_REGEX);
  if (z0Matches) {
    for (const m of z0Matches) violations.push(`Z0:${m}`);
  }
  const r50Matches = text.match(R50_FORBIDDEN_REGEX);
  if (r50Matches) {
    for (const m of r50Matches) violations.push(`R50:${m}`);
  }
  return { ok: violations.length === 0, violations };
}

export function sanitizeZ0Text(text: string): string {
  return text
    .replace(new RegExp(`\\b${['ther', 'mique'].join('')}\\b`, 'gi'), 'de maintenance')
    .replace(new RegExp(`\\b${['ther', 'mal'].join('')}\\b`, 'gi'), 'maintenance')
    .replace(new RegExp(`\\b${['cha', 'leur'].join('')}\\b`, 'gi'), 'charge structurelle')
    .replace(new RegExp(`\\b${['corri', 'dor'].join('')}s?\\b`, 'gi'), 'liaison')
    .replace(new RegExp(`\\b${['cycle', '\\+1'].join('')}\\b`, 'gi'), 'fin de tour')
    .replace(R50_FORBIDDEN_REGEX, 'anomalie géophysique');
}
