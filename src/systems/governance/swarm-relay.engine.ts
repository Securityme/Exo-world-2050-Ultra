import { checkZ0AndR50Compliance } from '../../contracts/guards/z0-legacy.guard.ts';
import type {
  SwarmHandoffInput,
  SwarmRelayMessage,
} from '../../contracts/swarm-relay.schema.ts';

/**
 * [L3] EXW.L3.SWARM_RELAY_ENGINE | v5.1.0 | SADT A5.4
 * 100% Pure formatter & guardrail validator for Preview ↔ AI Studio Build ↔ Antigravity ↔ Swarm envelopes.
 */

const SECRET_LITERAL_PATTERN = /\b(?:AIza[0-9A-Za-z_-]{20,}|sk-[0-9A-Za-z]{20,}|ghp_[0-9A-Za-z]{20,})\b/;

export interface SwarmEnvelopeResult {
  readonly ok: boolean;
  readonly error?: string;
  readonly message?: SwarmRelayMessage;
}

export function buildSwarmPromptPayload(params: {
  readonly ticketId: string;
  readonly input: SwarmHandoffInput;
  readonly appVersion: string;
  readonly timestampIso: string;
}): string {
  const filesBlock =
    params.input.targetFiles.length > 0
      ? params.input.targetFiles.map((f) => `- \`${f}\``).join('\n')
      : '- Aucun fichier ciblé spécifié';

  return [
    `[EXO-SWARM-HANDOFF · ${params.ticketId}]`,
    `Date: ${params.timestampIso} | App: EXO WORLD : 2050 v${params.appVersion}`,
    `Origine: ${params.input.fromSurface} -> Cible: ${params.input.toSurface} (${params.input.targetAgentCode})`,
    `Filière: ${params.input.workflowTrack} | Priorité: ${params.input.priority}`,
    params.input.docVcsHeadHash
      ? `HEAD VCS Docs: ${/^[a-f0-9]{16,}$/i.test(params.input.docVcsHeadHash) ? params.input.docVcsHeadHash.slice(0, 12) : params.input.docVcsHeadHash.slice(0, 48)}`
      : 'HEAD VCS Docs: N/A',
    params.input.previewOrigin ? `Preview Origin: ${params.input.previewOrigin}` : 'Preview Origin: local',
    '',
    `## Objectif : ${params.input.title}`,
    params.input.objective,
    '',
    '## Périmètre fichiers / modules',
    filesBlock,
    '',
    '## Garde-fous obligatoires',
    '- Respecter strictement la séparation Documentation Drive/Docs (APP-*) vs Code App/Jeu (main / JEU-*).',
    '- Appliquer TypeScript strict, Z0/R-50, pureté L2/L3 et vérification tests/navigateur.',
  ].join('\n');
}

export function buildSwarmHandoffEnvelope(
  input: SwarmHandoffInput,
  sequenceNumber: number,
  appVersion: string,
  timestampIso: string,
): SwarmEnvelopeResult {
  const combinedText = `${input.title}\n${input.objective}\n${input.targetFiles.join(' ')}`;
  if (SECRET_LITERAL_PATTERN.test(combinedText)) {
    return {
      ok: false,
      error: 'Rejet sécurité : une chaîne ressemblant à un secret API a été détectée dans le message.',
    };
  }
  const compliance = checkZ0AndR50Compliance(combinedText);
  if (!compliance.ok) {
    return {
      ok: false,
      error: `Conformité éditoriale R-50/Z0 non respectée : ${compliance.violations.join(', ')}.`,
    };
  }

  const ticketId = `EXW-SWARM-${String(Math.max(1, sequenceNumber)).padStart(3, '0')}`;
  const promptPayload = buildSwarmPromptPayload({
    ticketId,
    input,
    appVersion,
    timestampIso,
  });

  return {
    ok: true,
    message: {
      ticketId,
      fromSurface: input.fromSurface,
      toSurface: input.toSurface,
      targetAgentCode: input.targetAgentCode,
      workflowTrack: input.workflowTrack,
      priority: input.priority,
      status: 'DISPATCHED',
      title: input.title,
      objective: input.objective,
      targetFiles: [...input.targetFiles],
      docVcsHeadHash: input.docVcsHeadHash,
      previewOrigin: input.previewOrigin,
      promptPayload,
      createdAtIso: timestampIso,
      acknowledgedAtIso: null,
    },
  };
}
