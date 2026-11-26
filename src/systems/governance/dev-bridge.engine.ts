import type {
  DevBridgeState,
  DevCommsKind,
  DevCommsMessage,
  DevSurfaceActor,
  TriSurfaceSyncLog,
} from '../../contracts/dev-bridge.schema.ts';

/**
 * [L3] EXW.L3.DEV_BRIDGE_ENGINE | v5.1.0 | SADT A3.1
 * 100% Pure deterministic helpers for workspace path safety, Bus EXW-001 formatting,
 * and multi-surface synchronization state transitions (zero I/O, zero Date.now, zero Math.random).
 */

const ALLOWED_PREFIXES = ['docs/', '.exo-sync/'] as const;
const ALLOWED_EXT_RE = /\.(md|txt|json|yaml)$/i;

export function sanitizeWorkspaceRelativePath(rawPath: string): {
  readonly ok: boolean;
  readonly normalized: string;
  readonly error?: string;
} {
  const cleaned = rawPath.trim().replace(/\\/g, '/').replace(/^\.\//, '');
  if (!cleaned || cleaned.length > 180) {
    return { ok: false, normalized: '', error: 'Chemin requis (max 180 caractères).' };
  }
  if (cleaned.startsWith('/') || cleaned.includes('..') || cleaned.includes('\0')) {
    return { ok: false, normalized: '', error: 'Chemin interdit (traversée ou chemin absolu refusé).' };
  }
  const hasAllowedPrefix = ALLOWED_PREFIXES.some((prefix) => cleaned.startsWith(prefix));
  if (!hasAllowedPrefix) {
    return {
      ok: false,
      normalized: '',
      error: 'Répertoire autorisé uniquement : docs/ (dont docs/master-blueprint/) ou .exo-sync/.',
    };
  }
  if (!ALLOWED_EXT_RE.test(cleaned)) {
    return {
      ok: false,
      normalized: '',
      error: 'Extension autorisée uniquement : .md, .txt, .json ou .yaml.',
    };
  }
  return { ok: true, normalized: cleaned };
}

export function computePureTextDigest(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i += 1) {
    const code = input.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= code + ((i + 1) * 31);
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${p1}${p2}`;
}

export function createInitialDevBridgeState(): DevBridgeState {
  const seedContent =
    'Canal BUS-EXW-001 initialisé : passerelles AI Studio, Antigravity, Gemini Swarm, Data Agent Kit, Firebase, Vercel, Drive et GitHub prêtes.';
  return {
    messages: [
      {
        id: 'bus-init-001',
        sender: 'ANTIGRAVITY',
        target: 'AI_STUDIO',
        kind: 'ACK',
        content: seedContent,
        linkedPath: 'docs/inter-ia/BUS_MESSAGES.md',
        linkedDocId: 'doc-master-blueprint-ssot',
        createdAtIso: '2026-11-24T22:00:00.000Z',
        shaDigest: computePureTextDigest(seedContent),
      },
      {
        id: 'bus-init-002',
        sender: 'SWARM',
        target: 'DATA_AGENT_KIT',
        kind: 'HANDOFF',
        content:
          'Vérifier la parité M13_SADT_Mapping.json et préparer le paquet de synchronisation tri-surface avant publication.',
        linkedPath: 'docs/DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md',
        linkedDocId: 'doc-master-blueprint-ssot',
        createdAtIso: '2026-11-24T22:05:00.000Z',
        shaDigest: computePureTextDigest('swarm-handoff-002'),
      },
    ],
    syncLogs: [],
    vercelProjectUrl: '',
    vercelHookConfigured: false,
    githubOAuthConfigured: false,
    lastAudit: null,
  };
}

export function appendDevCommsMessage(
  state: DevBridgeState,
  input: {
    readonly id: string;
    readonly sender: DevSurfaceActor;
    readonly target: DevSurfaceActor;
    readonly kind: DevCommsKind;
    readonly content: string;
    readonly linkedPath?: string;
    readonly linkedDocId?: string;
    readonly createdAtIso: string;
  },
): DevBridgeState {
  const msg: DevCommsMessage = {
    id: input.id.slice(0, 96),
    sender: input.sender,
    target: input.target,
    kind: input.kind,
    content: input.content.trim().slice(0, 2000),
    linkedPath: (input.linkedPath ?? '').slice(0, 180),
    linkedDocId: (input.linkedDocId ?? '').slice(0, 80),
    createdAtIso: input.createdAtIso,
    shaDigest: computePureTextDigest(`${input.sender}|${input.target}|${input.content}|${input.createdAtIso}`),
  };
  return {
    ...state,
    messages: [msg, ...state.messages].slice(0, 80),
  };
}

export function appendTriSurfaceSyncLog(
  state: DevBridgeState,
  log: TriSurfaceSyncLog,
): DevBridgeState {
  return {
    ...state,
    syncLogs: [log, ...state.syncLogs].slice(0, 40),
  };
}

export function formatInterIaBusMarkdown(messages: readonly DevCommsMessage[]): string {
  const lines = [
    '# BUS-EXW-001 — Journal Multi-Surfaces (AI Studio · Antigravity · Gemini Swarm · GitHub)',
    '',
    '| Horodatage UTC | Type | Émetteur → Cible | Chemin lié | Digest | Message |',
    '| :--- | :--- | :--- | :--- | :--- | :--- |',
  ];
  for (const m of messages.slice(0, 30)) {
    const safeText = m.content.replace(/\|/g, '/').replace(/\n+/g, ' ').slice(0, 220);
    lines.push(
      `| ${m.createdAtIso} | ${m.kind} | ${m.sender} → ${m.target} | ${m.linkedPath || '—'} | ${m.shaDigest} | ${safeText} |`,
    );
  }
  return `${lines.join('\n')}\n`;
}
