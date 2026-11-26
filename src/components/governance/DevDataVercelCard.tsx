import { Activity, Database, Rocket } from 'lucide-react';
import type { DataAgentDiagnostics } from '../../contracts/dev-bridge.schema.ts';

interface DevDataVercelCardProps {
  readonly firebaseOk: boolean | null;
  readonly lastAudit: DataAgentDiagnostics | null;
  readonly vercelHookInput: string;
  readonly busy: boolean;
  readonly onVercelHookInputChange: (val: string) => void;
  readonly onTriggerVercel: () => void;
}

/**
 * [L7] EXW.L7.DEV_DATA_VERCEL_CARD | v5.1.0 | <= 200 lines (R-14)
 */
export function DevDataVercelCard({
  firebaseOk,
  lastAudit,
  vercelHookInput,
  busy,
  onVercelHookInputChange,
  onTriggerVercel,
}: DevDataVercelCardProps) {
  return (
    <div className="exo-bento-card space-y-2.5 p-3.5" data-testid="vercel-data-agent-card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-display text-sm font-bold text-[var(--exo-text)]">
          <Activity className="h-4 w-4 exo-accent-text" />
          <span>Data Agent Kit · Vercel · Firebase</span>
        </div>
        <span className="font-mono text-[10px] exo-muted-text">
          <Database className="mr-1 inline h-3 w-3" />
          {firebaseOk ? 'Firestore OK' : 'Hors-ligne'}
        </span>
      </div>
      {lastAudit && (
        <div className="rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-3 py-2 font-mono text-[11px] tabular-nums">
          Porte {lastAudit.gate} · {lastAudit.modulesCount} modules · {lastAudit.matricesPass}/{lastAudit.totalMatrices} matrices · {lastAudit.dsmCycleCount} cycles
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="url"
          value={vercelHookInput}
          onChange={(e) => onVercelHookInputChange(e.target.value)}
          placeholder="https://api.vercel.com/v1/integrations/deploy/..."
          data-testid="vercel-hook-input"
          aria-label="URL Deploy Hook Vercel"
          className="min-h-[40px] flex-1 rounded-xl border exo-accent-border bg-[var(--exo-surface)] px-3 font-mono text-[11px] text-[var(--exo-text)]"
        />
        <button
          type="button"
          onClick={onTriggerVercel}
          disabled={busy}
          className="exo-accent-chip inline-flex min-h-[40px] items-center gap-1.5 px-3 font-semibold whitespace-nowrap shrink-0"
        >
          <Rocket className="h-3.5 w-3.5" />
          <span>Déployer</span>
        </button>
      </div>
    </div>
  );
}
