/**
 * [L5] EXW.L5.BUS_MIRROR | v1.6.0 | SADT A5.2
 * Lightweight read-only mirror of Inter-IA handoff envelopes (BUS-EXW-001).
 */
export interface InterIaBusEnvelope {
  readonly msgId: string;
  readonly from: string;
  readonly to: string;
  readonly status: 'DONE' | 'OPEN' | 'READY_FOR_AUDIT';
  readonly summary: string;
}

export const INTER_IA_BUS_MIRROR: readonly InterIaBusEnvelope[] = Object.freeze([
  {
    msgId: 'MSG-003',
    from: 'Google AI Studio Build',
    to: 'Gemini Lead',
    status: 'DONE',
    summary: 'Socle Vague 0 (PCG32, SHA-256, Guardrails R-50/Kahn/BFS) validé 5/5 portes.',
  },
  {
    msgId: 'MSG-004',
    from: 'Google AI Studio Build',
    to: 'Gemini Lead / Antigravity Hub',
    status: 'READY_FOR_AUDIT',
    summary:
      'Synchronisation 24 domaines L0..L8 (purge features/ & handlers/), thème Astralis Snapshot V7, ExoTooltip & Playtest 6 tours (90 ticks) intégrés.',
  },
]);
