import { EventGeneratorResponseSchema, type EventGeneratorResponse } from '../contracts/event-generator.schema.ts';
import { err, ok, type ExwResult } from '../contracts/trigger-bus.schema.ts';
import { parseJsonBoundary } from './zod-boundary.parser.ts';

/**
 * [L0] FUP-006 | SM-01 | SADT A4.2
 * Dual-Pass Oracle Gemini Payload Parser (JSON sanitization + strict Zod + [-0.15, +0.15] delta clamp).
 */
const FORBIDDEN_GENERIC_REGEX = new RegExp('\\banomal' + '(?:ie|ies|y)\\b', 'i');

function stripMarkdownFences(rawText: string): string {
  const trimmed = rawText.trim();
  const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return match?.[1] ? match[1].trim() : trimmed;
}

export function parseGeminiDualPass(rawText: string): ExwResult<EventGeneratorResponse> {
  const cleaned = stripMarkdownFences(rawText);
  if (FORBIDDEN_GENERIC_REGEX.test(cleaned)) {
    return err(
      'EXW_ERR_NOMENCLATURE',
      'Rejet R-50 : terme générique interdit détecté dans le payload Oracle.',
    );
  }

  const [parseErr, validated] = parseJsonBoundary(EventGeneratorResponseSchema, cleaned, 'GeminiDualPass');
  if (parseErr || !validated) {
    return err(parseErr?.code ?? 'EXW_ERR_SCHEMA', parseErr?.message ?? 'Échec parsing Gemini.', parseErr?.detail);
  }

  // Pass 2: Normalize & lock delta bounds [-0.15, +0.15] across all options (R-10 Airlock)
  const clampedOptions = validated.dossier.options.map((opt) => ({
    ...opt,
    effects: {
      ...opt.effects,
      oracleImpactFactor: Math.max(-0.15, Math.min(0.15, opt.effects.oracleImpactFactor)),
    },
  }));

  return ok({
    ...validated,
    dossier: {
      ...validated.dossier,
      options: clampedOptions,
    },
  });
}
