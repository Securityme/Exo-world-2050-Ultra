import { EventGeneratorStateBriefSchema } from '../../contracts/event-generator.schema.ts';
import type { ExwResult } from '../../contracts/trigger-bus.schema.ts';
import { parseWithZodSchema } from '../../parsers/zod-boundary.parser.ts';

/**
 * [L8] FUP-006 | Server Route Contract Spec — Oracle Event Endpoint (/api/oracle/dossier)
 * Mirrors Express server-side Gemini proxy validation in /server.ts.
 */
export function validateOracleRouteRequest(rawBody: unknown): ExwResult<{
  readonly cycle: number;
  readonly era: number;
  readonly atmosphereTier: 'P1' | 'P2' | 'P3' | 'P4';
}> {
  const [parseErr, valid] = parseWithZodSchema(
    EventGeneratorStateBriefSchema,
    rawBody,
    'OracleRouteRequest',
  );
  if (parseErr !== null || !valid) {
    return [parseErr!, null];
  }
  return [
    null,
    {
      cycle: valid.cycle,
      era: valid.era,
      atmosphereTier: valid.atmosphereTier,
    },
  ];
}
