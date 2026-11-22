/**
 * [L8] FUP-008 | Server Route Contract Spec — Health Endpoint (/api/health)
 * Mirrors Express route in /server.ts for Wave 0 L8 parity.
 */
export interface HealthApiResponse {
  readonly ok: boolean;
  readonly service: string;
  readonly oracleConfigured: boolean;
}

export function buildHealthPayload(oracleConfigured: boolean): HealthApiResponse {
  return {
    ok: true,
    service: 'exo-world-2050',
    oracleConfigured,
  };
}
