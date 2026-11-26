import { useMemo, useState } from 'react';
import { Copy, MessageSquarePlus, Send } from 'lucide-react';
import type {
  DevCommsKind,
  DevCommsMessage,
  DevSurfaceActor,
} from '../../contracts/dev-bridge.schema.ts';
import { formatInterIaBusMarkdown } from '../../systems/governance/dev-bridge.engine.ts';

interface DevCommsBusPanelProps {
  readonly messages: readonly DevCommsMessage[];
  readonly activePath: string;
  readonly busy: boolean;
  readonly onSendMessage: (input: {
    readonly sender: DevSurfaceActor;
    readonly target: DevSurfaceActor;
    readonly kind: DevCommsKind;
    readonly content: string;
    readonly linkedPath: string;
  }) => Promise<void>;
}

const ACTORS: readonly DevSurfaceActor[] = [
  'USER',
  'AI_STUDIO',
  'ANTIGRAVITY',
  'GEMINI_LEAD',
  'SWARM',
  'DATA_AGENT_KIT',
  'GOOGLE_DRIVE',
  'GITHUB',
  'FIREBASE',
  'VERCEL',
];

const KINDS: readonly DevCommsKind[] = ['DIRECTIVE', 'HANDOFF', 'SYNC_PATCH', 'ACK', 'ALERT'];

/**
 * [L7] EXW.L7.DEV_COMMS_BUS_PANEL | v5.1.0 | <= 170 lines (R-14)
 * Structured multi-surface communication feed linking AI Studio, Antigravity,
 * Gemini Swarm, Data Agent Kit, Firebase, Vercel, Drive, and GitHub.
 */
export function DevCommsBusPanel({
  messages,
  activePath,
  busy,
  onSendMessage,
}: DevCommsBusPanelProps) {
  const [sender, setSender] = useState<DevSurfaceActor>('USER');
  const [target, setTarget] = useState<DevSurfaceActor>('ANTIGRAVITY');
  const [kind, setKind] = useState<DevCommsKind>('DIRECTIVE');
  const [content, setContent] = useState('');
  const [actorFilter, setActorFilter] = useState<'ALL' | DevSurfaceActor>('ALL');
  const [copied, setCopied] = useState(false);

  const visibleMessages = useMemo(() => {
    if (actorFilter === 'ALL') return messages;
    return messages.filter((m) => m.sender === actorFilter || m.target === actorFilter);
  }, [messages, actorFilter]);

  const handleSubmit = async () => {
    if (content.trim().length < 2) return;
    const text = content.trim();
    setContent('');
    await onSendMessage({ sender, target, kind, content: text, linkedPath: activePath });
  };

  const handleCopyBus = async () => {
    const md = formatInterIaBusMarkdown(visibleMessages);
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="exo-bento-card space-y-3 p-3.5 text-xs" data-testid="dev-comms-bus-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-display text-sm font-bold text-[var(--exo-text)]">
          <MessageSquarePlus className="h-4 w-4 exo-accent-text" />
          <span>Bus Inter-Surfaces (BUS-EXW-001)</span>
        </div>
        <button
          type="button"
          onClick={() => void handleCopyBus()}
          className="exo-accent-chip inline-flex min-h-[36px] items-center gap-1.5 px-2.5 text-[11px] font-semibold whitespace-nowrap shrink-0"
        >
          <Copy className="h-3.5 w-3.5" />
          <span>{copied ? 'Copié MD' : 'Copier Bus MD'}</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <select
          aria-label="Émetteur du message"
          value={sender}
          onChange={(e) => setSender(e.target.value as DevSurfaceActor)}
          data-testid="bus-sender-select"
          className="rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2 py-2 text-[11px] text-[var(--exo-text)]"
        >
          {ACTORS.map((a) => (
            <option key={`s-${a}`} value={a}>{`De: ${a}`}</option>
          ))}
        </select>
        <select
          aria-label="Destinataire du message"
          value={target}
          onChange={(e) => setTarget(e.target.value as DevSurfaceActor)}
          data-testid="bus-target-select"
          className="rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2 py-2 text-[11px] text-[var(--exo-text)]"
        >
          {ACTORS.map((a) => (
            <option key={`t-${a}`} value={a}>{`Vers: ${a}`}</option>
          ))}
        </select>
        <select
          aria-label="Type de message"
          value={kind}
          onChange={(e) => setKind(e.target.value as DevCommsKind)}
          data-testid="bus-kind-select"
          className="rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2 py-2 text-[11px] text-[var(--exo-text)]"
        >
          {KINDS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit(); }}
          placeholder="Directive Antigravity, Swarm, Gemini ou Data Agent..."
          data-testid="bus-message-input"
          className="min-h-[42px] flex-1 rounded-xl border exo-accent-border bg-[var(--exo-surface)] px-3 text-xs text-[var(--exo-text)]"
        />
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={busy || content.trim().length < 2}
          data-testid="bus-send-btn"
          className="exo-window-tab-active inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-3.5 font-bold whitespace-nowrap shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Envoyer</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 border-t exo-accent-border pt-2">
        <span className="font-mono text-[10.5px] exo-muted-text tabular-nums">
          {visibleMessages.length} messages · lié à {activePath}
        </span>
        <select
          aria-label="Filtrer par surface"
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value as 'ALL' | DevSurfaceActor)}
          className="rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2 py-1 text-[10.5px] text-[var(--exo-text)]"
        >
          <option value="ALL">Toutes surfaces</option>
          {ACTORS.map((a) => (
            <option key={`f-${a}`} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="max-h-60 space-y-2 overflow-y-auto pr-1" data-testid="bus-messages-list">
        {visibleMessages.length === 0 ? (
          <div className="rounded-xl border exo-accent-border p-3 text-center exo-muted-text">
            Aucun message pour ce filtre.
          </div>
        ) : (
          visibleMessages.map((msg) => (
            <div key={msg.id} className="rounded-xl border exo-accent-border bg-[var(--exo-surface-alt)] p-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1 font-mono text-[10px] exo-muted-text tabular-nums">
                <span className="font-semibold text-[var(--exo-text)]">
                  {msg.sender} → {msg.target} · {msg.kind}
                </span>
                <span>{msg.shaDigest.slice(0, 8)} · {msg.createdAtIso.slice(11, 19)} UTC</span>
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--exo-text)]">{msg.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
