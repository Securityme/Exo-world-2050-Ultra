import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Download,
  ExternalLink,
  Network,
  Radio,
  Send,
  ShieldAlert,
} from 'lucide-react';
import type {
  SwarmHandoffPriority,
  SwarmHandoffTrack,
  SwarmRelayMessage,
  SwarmSurfaceId,
} from '../../contracts/swarm-relay.schema.ts';
import { INITIAL_AGENT_PYRAMID_NODES } from '../../data/agent-hierarchy.catalog.ts';
import {
  acknowledgeSwarmTicket,
  buildFallbackSwarmBusState,
  dispatchSwarmHandoff,
  fetchSwarmBusState,
  type SwarmBusStatePayload,
} from '../../doc-sync/swarm-relay.service.ts';

const SURFACE_LABELS: Readonly<Record<SwarmSurfaceId, string>> = {
  AISTUDIO_PREVIEW: 'Preview Live App',
  AISTUDIO_BUILD: 'Google AI Studio Build',
  ANTIGRAVITY_IDE: 'Antigravity IDE (Local)',
  DRIVE_BUS_EXW_001: 'Google Drive BUS-EXW-001',
  GITHUB_REPO: 'GitHub Ultra (main)',
  GEMINI_LEAD: 'Gemini Lead (Superviseur)',
  PRODUCTION_SWARM: 'Essaim Agents N0–N3',
};

const CHANNEL_STATUS_LABELS = {
  LIVE_ACTIVE: 'Actif temps réel',
  AUTH_OAUTH: 'OAuth Google requis',
  USER_HANDOFF_REQUIRED: 'Copier / PostMessage',
} as const;

export function SwarmRelayPanel() {
  const [busState, setBusState] = useState<SwarmBusStatePayload>(() => buildFallbackSwarmBusState());
  const [messages, setMessages] = useState<readonly SwarmRelayMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Handoff composer state
  const [toSurface, setToSurface] = useState<SwarmSurfaceId>('ANTIGRAVITY_IDE');
  const [targetAgentCode, setTargetAgentCode] = useState('N0 · ARGON');
  const [workflowTrack, setWorkflowTrack] = useState<SwarmHandoffTrack>('APP_GAME_CODE');
  const [priority, setPriority] = useState<SwarmHandoffPriority>('HIGH');
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [targetFilesCsv, setTargetFilesCsv] = useState(
    'src/systems/governance/doc-vcs.engine.ts, docs/inter-ia/BUS_MESSAGES.md',
  );
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const loadState = useCallback(async () => {
    setLoading(true);
    const data = await fetchSwarmBusState();
    setBusState(data);
    setMessages(data.liveMessages);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const activeMessage = useMemo(
    () => messages.find((m) => m.ticketId === selectedTicketId) ?? messages[0] ?? null,
    [messages, selectedTicketId],
  );

  const handleDispatch = async () => {
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    const targetFiles = targetFilesCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12);
    const previewOrigin = typeof window !== 'undefined' ? window.location.origin : '';

    const res = await dispatchSwarmHandoff(
      {
        fromSurface: 'AISTUDIO_PREVIEW',
        toSurface,
        targetAgentCode,
        workflowTrack,
        priority,
        title: title.trim(),
        objective: objective.trim(),
        targetFiles,
        docVcsHeadHash: 'docs/drive-sovereign',
        previewOrigin,
      },
      messages.length + 1,
    );
    setBusy(false);

    if (!res.ok || !res.message) {
      setFeedback({ tone: 'err', text: res.error ?? 'Envoi refusé.' });
      return;
    }

    const created = res.message;
    setMessages(res.liveMessages ?? [created, ...messages]);
    setSelectedTicketId(created.ticketId);
    setTitle('');
    setObjective('');
    setFeedback({
      tone: 'ok',
      text: `Enveloppe ${created.ticketId} prête sur /api/swarm-bus et émise vers window.parent. Copiez le paquet vers ${SURFACE_LABELS[toSurface]}.`,
    });
  };

  const handleAck = async (ticketId: string) => {
    const res = await acknowledgeSwarmTicket(ticketId);
    if (!res.ok) {
      setFeedback({ tone: 'err', text: res.error ?? 'Accusé impossible.' });
      return;
    }
    if (res.liveMessages) setMessages(res.liveMessages);
    setFeedback({ tone: 'ok', text: `Ticket ${ticketId} acquitté.` });
  };

  const handleCopyPayload = async (msg: SwarmRelayMessage) => {
    try {
      await navigator.clipboard.writeText(msg.promptPayload);
      setCopiedId(msg.ticketId);
      setTimeout(() => setCopiedId((prev) => (prev === msg.ticketId ? null : prev)), 2000);
    } catch {
      setFeedback({ tone: 'err', text: 'Accès presse-papiers bloqué par le navigateur.' });
    }
  };

  const handleDownloadJson = (msg: SwarmRelayMessage) => {
    const blob = new Blob([JSON.stringify(msg, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${msg.ticketId.toLowerCase()}-handoff.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4" data-testid="swarm-relay-panel">
      {/* Honest Preview Capability Architecture Diagnosis */}
      <section className="space-y-3 rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 exo-accent-text" />
              <h3 className="font-display text-base font-bold text-[var(--exo-text)]">
                Pont Communication Preview ↔ Google AI Studio ↔ Antigravity ↔ Essaim ({busState.agentPyramidSummary.totalAgents} agents)
              </h3>
            </div>
            <p className="mt-1 text-xs exo-muted-text">
              Architecture réelle et limites navigateur : l’iframe Preview ne peut pas écrire directement sur le disque local d’Antigravity ni piloter le champ prompt d’AI Studio sans passerelle. Elle communique via le bus serveur{' '}
              <span className="font-mono-num font-semibold exo-accent-text">/api/swarm-bus</span>, Google Drive{' '}
              <span className="font-mono-num">BUS-EXW-001</span> et les paquets structurés{' '}
              <span className="font-mono-num">[EXO-SWARM-HANDOFF]</span>.
            </p>
          </div>
          <span className="font-mono-num text-xs exo-muted-text">
            {loading ? 'Synchronisation…' : `${messages.length} tickets actifs`}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {busState.bridgeChannels.map((ch) => (
            <div
              key={ch.id}
              className="space-y-1.5 rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)]/55 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-xs font-bold text-[var(--exo-text)]">{ch.name}</span>
                <span className="font-mono-num text-[10.5px] exo-accent-text">
                  {CHANNEL_STATUS_LABELS[ch.status]}
                </span>
              </div>
              <div className="font-mono-num text-[10.5px] exo-muted-text">{ch.direction}</div>
              <p className="text-[11px] leading-relaxed text-[var(--exo-text)] opacity-85">
                {ch.capabilitySummary}
              </p>
              <p className="flex items-start gap-1 text-[10.5px] exo-muted-text">
                <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                <span>{ch.securityBoundary}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {feedback && (
        <div
          role="status"
          data-testid="swarm-relay-feedback"
          className={`flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-medium ${
            feedback.tone === 'ok'
              ? 'border-emerald-500/45 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-300'
          }`}
        >
          <span className="flex items-center gap-2">
            {feedback.tone === 'ok' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </span>
          <button type="button" onClick={() => setFeedback(null)} className="min-h-[32px] px-2 underline">
            Fermer
          </button>
        </div>
      )}

      {/* Composer + Live Handoff Queue */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        {/* Left: Structured Handoff Composer */}
        <section className="space-y-3 rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-4">
          <div className="flex items-center gap-2 border-b exo-accent-border pb-2">
            <Network className="h-4 w-4 exo-accent-text" />
            <h4 className="font-display text-sm font-bold text-[var(--exo-text)]">
              Émettre un Paquet Handoff depuis le Preview
            </h4>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="space-y-1 text-xs">
              <span className="font-medium text-[var(--exo-text)]">Surface cible</span>
              <select
                value={toSurface}
                onChange={(e) => setToSurface(e.target.value as SwarmSurfaceId)}
                data-testid="swarm-target-surface"
                className="min-h-[44px] w-full rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-2.5 text-xs text-[var(--exo-text)]"
              >
                <option value="ANTIGRAVITY_IDE">Antigravity IDE (Local / Git)</option>
                <option value="AISTUDIO_BUILD">Google AI Studio Build</option>
                <option value="PRODUCTION_SWARM">Essaim Production N0–N3</option>
                <option value="GEMINI_LEAD">Gemini Lead (Superviseur)</option>
                <option value="DRIVE_BUS_EXW_001">Google Drive BUS-EXW-001</option>
              </select>
            </label>

            <label className="space-y-1 text-xs">
              <span className="font-medium text-[var(--exo-text)]">Agent responsable (Triangle)</span>
              <select
                value={targetAgentCode}
                onChange={(e) => setTargetAgentCode(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-2.5 text-xs text-[var(--exo-text)]"
              >
                {INITIAL_AGENT_PYRAMID_NODES.map((node) => (
                  <option key={node.id} value={node.code}>
                    {node.code} — {node.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-xs">
              <span className="font-medium text-[var(--exo-text)]">Filière / Workflow</span>
              <select
                value={workflowTrack}
                onChange={(e) => setWorkflowTrack(e.target.value as SwarmHandoffTrack)}
                className="min-h-[44px] w-full rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-2.5 text-xs text-[var(--exo-text)]"
              >
                <option value="APP_GAME_CODE">Code App / Jeu / 3D (main)</option>
                <option value="DRIVE_DOC_VCS">Docs App via Drive/Docs VCS</option>
                <option value="SWARM_COORDINATION">Coordination Multi-Surfaces</option>
              </select>
            </label>

            <label className="space-y-1 text-xs">
              <span className="font-medium text-[var(--exo-text)]">Priorité</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as SwarmHandoffPriority)}
                className="min-h-[44px] w-full rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-2.5 text-xs text-[var(--exo-text)]"
              >
                <option value="STANDARD">Standard</option>
                <option value="HIGH">Haute</option>
                <option value="BLOCKING">Bloquante</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1 text-xs">
            <span className="font-medium text-[var(--exo-text)]">Titre du handoff</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="swarm-handoff-title"
              placeholder="Ex: Vérifier parité Prefabs Unity et branche docs/drive-sovereign"
              className="min-h-[44px] w-full rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-3 text-xs text-[var(--exo-text)]"
            />
          </label>

          <label className="block space-y-1 text-xs">
            <span className="font-medium text-[var(--exo-text)]">Instruction / Contexte Preview</span>
            <textarea
              rows={3}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              data-testid="swarm-handoff-objective"
              placeholder="Décrivez l'observation depuis le Preview, l'incident visuel observé ou la tâche à exécuter par Antigravity / l'essaim..."
              className="w-full rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] p-3 text-xs text-[var(--exo-text)]"
            />
          </label>

          <label className="block space-y-1 text-xs">
            <span className="font-medium text-[var(--exo-text)]">Fichiers cibles (séparés par virgule)</span>
            <input
              type="text"
              value={targetFilesCsv}
              onChange={(e) => setTargetFilesCsv(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-3 font-mono text-xs text-[var(--exo-text)]"
            />
          </label>

          <button
            type="button"
            data-testid="swarm-dispatch-btn"
            disabled={busy || title.trim().length < 4 || objective.trim().length < 10}
            onClick={() => void handleDispatch()}
            className="exo-accent-btn inline-flex min-h-[44px] w-full items-center justify-center gap-2 px-4 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Générer &amp; Publier sur /api/swarm-bus</span>
          </button>
        </section>

        {/* Right: Active Tickets & Generated Prompt Payload */}
        <section className="space-y-3 rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-4">
          <div className="flex items-center justify-between gap-2 border-b exo-accent-border pb-2">
            <h4 className="font-display text-sm font-bold text-[var(--exo-text)]">
              File BUS-EXW &amp; Paquets Prêts pour Antigravity / AI Studio
            </h4>
            <a
              href="/api/swarm-bus/state"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[36px] items-center gap-1 font-mono-num text-[11px] exo-accent-text hover:underline"
            >
              <span>JSON API</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
            {messages.map((msg) => {
              const selected = activeMessage?.ticketId === msg.ticketId;
              return (
                <button
                  key={msg.ticketId}
                  type="button"
                  onClick={() => setSelectedTicketId(msg.ticketId)}
                  className={`w-full rounded-lg border p-2.5 text-left transition ${
                    selected
                      ? 'exo-accent-chip-active border-[var(--exo-accent)]'
                      : 'exo-accent-border bg-[var(--exo-surface-alt)]/55 hover:border-[var(--exo-accent)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 font-mono-num text-[11px]">
                    <span className="font-bold exo-accent-text">{msg.ticketId}</span>
                    <span className={msg.status === 'ACKNOWLEDGED' ? 'text-emerald-600 dark:text-emerald-400' : 'exo-muted-text'}>
                      {msg.status} · {msg.targetAgentCode}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs font-semibold text-[var(--exo-text)]">{msg.title}</div>
                  <div className="mt-0.5 font-mono-num text-[10.5px] exo-muted-text">
                    {SURFACE_LABELS[msg.fromSurface]} → {SURFACE_LABELS[msg.toSurface]}
                  </div>
                </button>
              );
            })}
          </div>

          {activeMessage && (
            <div className="space-y-2 border-t exo-accent-border pt-3">
              <pre
                data-testid="swarm-payload-preview"
                className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] p-3 font-mono text-[11px] leading-relaxed text-[var(--exo-text)]"
              >
                {activeMessage.promptPayload}
              </pre>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopyPayload(activeMessage)}
                  className="exo-accent-btn inline-flex min-h-[44px] items-center gap-1.5 px-3.5 text-xs font-semibold"
                >
                  {copiedId === activeMessage.ticketId ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <ClipboardCopy className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {copiedId === activeMessage.ticketId
                      ? 'Paquet copié'
                      : 'Copier Prompt Handoff'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadJson(activeMessage)}
                  className="exo-accent-chip inline-flex min-h-[44px] items-center gap-1.5 px-3 text-xs font-semibold"
                >
                  <Download className="h-3.5 w-3.5 exo-accent-text" />
                  <span>Exporter .JSON</span>
                </button>
                {activeMessage.status !== 'ACKNOWLEDGED' && (
                  <button
                    type="button"
                    onClick={() => void handleAck(activeMessage.ticketId)}
                    className="exo-accent-chip inline-flex min-h-[44px] items-center gap-1.5 px-3 text-xs font-semibold"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Acquitter (ACK)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Static Bus Mirror Snapshot */}
          <div className="space-y-1.5 border-t exo-accent-border pt-2.5">
            <div className="text-[11px] font-semibold text-[var(--exo-text)]">
              Miroir historique BUS-EXW-001 ({busState.busMirror.length} entrées)
            </div>
            <ul className="space-y-1 text-[11px] exo-muted-text">
              {busState.busMirror.map((b) => (
                <li key={b.msgId} className="flex items-start gap-2">
                  <span className="font-mono-num font-bold exo-accent-text shrink-0">{b.msgId}</span>
                  <span className="min-w-0">
                    {b.from} → {b.to} : {b.summary}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
