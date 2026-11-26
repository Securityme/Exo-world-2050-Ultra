import { KeyRound } from 'lucide-react';
import type { DataAgentDiagnostics } from '../../contracts/dev-bridge.schema.ts';

interface DevConnectorsStripProps {
  readonly driveConnected: boolean;
  readonly githubConnected: boolean;
  readonly githubLogin: string | null;
  readonly firebaseOk: boolean | null;
  readonly vercelHookConfigured: boolean;
  readonly lastAudit: DataAgentDiagnostics | null;
  readonly showPatBox: boolean;
  readonly patInput: string;
  readonly onPatInputChange: (next: string) => void;
  readonly onApplyPat: () => void;
  readonly onConnectDrive: () => void;
  readonly onConnectGithub: () => void;
  readonly onTestFirebase: () => void;
  readonly onRunAudit: () => void;
  readonly onTriggerVercel: () => void;
}

/**
 * [L7] EXW.L7.DEV_CONNECTORS_STRIP | v5.1.0 | <= 130 lines (R-14)
 * Compact 6-surface status & auth bar (AI Studio, Drive, GitHub, Firebase, Data Agent Kit, Vercel).
 */
export function DevConnectorsStrip({
  driveConnected,
  githubConnected,
  githubLogin,
  firebaseOk,
  vercelHookConfigured,
  lastAudit,
  showPatBox,
  patInput,
  onPatInputChange,
  onApplyPat,
  onConnectDrive,
  onConnectGithub,
  onTestFirebase,
  onRunAudit,
  onTriggerVercel,
}: DevConnectorsStripProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <div className="exo-bento-card p-2.5">
          <div className="font-mono text-[10px] exo-muted-text">AI STUDIO</div>
          <div className="mt-1 font-semibold text-emerald-300">Workspace Prêt</div>
        </div>
        <button
          type="button"
          onClick={onConnectDrive}
          data-testid="dev-connect-drive-btn"
          className="exo-bento-card min-h-[44px] p-2.5 text-left transition hover:border-cyan-400/50"
        >
          <div className="font-mono text-[10px] exo-muted-text">GOOGLE DRIVE</div>
          <div className={`mt-1 font-semibold ${driveConnected ? 'text-emerald-300' : 'text-amber-300'}`}>
            {driveConnected ? 'Connecté (OAuth)' : 'Connecter Drive'}
          </div>
        </button>
        <button
          type="button"
          onClick={onConnectGithub}
          data-testid="dev-connect-github-btn"
          className="exo-bento-card min-h-[44px] p-2.5 text-left transition hover:border-cyan-400/50"
        >
          <div className="font-mono text-[10px] exo-muted-text">GITHUB PUSH</div>
          <div className={`mt-1 font-semibold ${githubConnected ? 'text-emerald-300' : 'text-amber-300'}`}>
            {githubConnected ? githubLogin : 'Connecter GitHub'}
          </div>
        </button>
        <button
          type="button"
          onClick={onTestFirebase}
          data-testid="dev-test-firebase-btn"
          className="exo-bento-card min-h-[44px] p-2.5 text-left transition hover:border-cyan-400/50"
        >
          <div className="font-mono text-[10px] exo-muted-text">FIREBASE</div>
          <div className={`mt-1 font-semibold ${firebaseOk ? 'text-emerald-300' : 'text-amber-300'}`}>
            {firebaseOk ? 'Firestore Actif' : 'Tester Firestore'}
          </div>
        </button>
        <button
          type="button"
          onClick={onRunAudit}
          data-testid="dev-data-agent-audit-btn"
          className="exo-bento-card min-h-[44px] p-2.5 text-left transition hover:border-cyan-400/50"
        >
          <div className="font-mono text-[10px] exo-muted-text">DATA AGENT KIT</div>
          <div className="mt-1 font-semibold text-cyan-300 tabular-nums">
            {lastAudit ? `${lastAudit.gate} · ${lastAudit.modulesCount} mod.` : 'Lancer Audit SSoT'}
          </div>
        </button>
        <button
          type="button"
          onClick={onTriggerVercel}
          data-testid="dev-vercel-trigger-btn"
          className="exo-bento-card min-h-[44px] p-2.5 text-left transition hover:border-cyan-400/50"
        >
          <div className="font-mono text-[10px] exo-muted-text">VERCEL</div>
          <div className="mt-1 font-semibold text-[var(--exo-text)]">
            {vercelHookConfigured ? 'Hook Configuré' : 'Deploy Hook'}
          </div>
        </button>
      </div>

      {showPatBox && (
        <div className="exo-bento-card flex flex-wrap items-center gap-2 p-3" data-testid="github-pat-memory-box">
          <KeyRound className="h-4 w-4 shrink-0 text-amber-300" />
          <input
            type="password"
            value={patInput}
            onChange={(e) => onPatInputChange(e.target.value)}
            placeholder="Jeton GitHub en mémoire de session uniquement (ghp_...)"
            data-testid="github-pat-input"
            className="min-h-[40px] flex-1 rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-3 text-xs text-[var(--exo-text)]"
          />
          <button
            type="button"
            onClick={onApplyPat}
            data-testid="github-pat-apply-btn"
            className="exo-window-tab-active min-h-[40px] rounded-lg px-3 font-bold whitespace-nowrap shrink-0"
          >
            Activer Session
          </button>
        </div>
      )}
    </div>
  );
}
