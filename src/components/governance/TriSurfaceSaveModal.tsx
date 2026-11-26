import { CheckCircle2, CloudUpload, GitCommitHorizontal, HardDrive, ShieldAlert } from 'lucide-react';

interface TriSurfaceSaveModalProps {
  readonly open: boolean;
  readonly relativePath: string;
  readonly byteLength: number;
  readonly commitSummary: string;
  readonly driveConnected: boolean;
  readonly githubConnected: boolean;
  readonly githubLogin: string | null;
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

/**
 * [L7] EXW.L7.TRI_SURFACE_SAVE_MODAL | v5.1.0 | <= 120 lines (R-14)
 * Single unified confirmation dialog required prior to simultaneous write across
 * Google AI Studio local workspace, Google Drive, and GitHub.
 */
export function TriSurfaceSaveModal({
  open,
  relativePath,
  byteLength,
  commitSummary,
  driveConnected,
  githubConnected,
  githubLogin,
  busy,
  onCancel,
  onConfirm,
}: TriSurfaceSaveModalProps) {
  if (!open) return null;

  return (
    <div
      data-testid="tri-surface-confirm-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="exo-bento-card w-full max-w-lg space-y-4 p-5 text-xs">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <div>
            <h3 className="font-display text-sm font-bold text-[var(--exo-text)]">
              Confirmer l’enregistrement Tri-Surface simultané
            </h3>
            <p className="mt-1 exo-muted-text">
              Cette validation déclenche l’écriture simultanée sur les 3 surfaces configurées pour{' '}
              <span className="font-mono text-[var(--exo-text)]">{relativePath}</span> ({byteLength} o).
            </p>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border exo-accent-border bg-[var(--exo-surface-alt)] p-3 font-mono text-[11px]">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[var(--exo-text)]">
              <HardDrive className="h-3.5 w-3.5 text-cyan-300" />
              1. Google AI Studio (Workspace local)
            </span>
            <span className="text-emerald-300">Prêt · Écriture atomique</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[var(--exo-text)]">
              <CloudUpload className="h-3.5 w-3.5 text-sky-300" />
              2. Google Drive (OAuth Workspace)
            </span>
            <span className={driveConnected ? 'text-emerald-300' : 'text-amber-300'}>
              {driveConnected ? 'Connecté · Upload / Patch' : 'Non connecté (sera ignoré)'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[var(--exo-text)]">
              <GitCommitHorizontal className="h-3.5 w-3.5 text-fuchsia-300" />
              3. GitHub (Exo-world-2050-Ultra)
            </span>
            <span className={githubConnected ? 'text-emerald-300' : 'text-amber-300'}>
              {githubConnected ? `Connecté (${githubLogin ?? 'OAuth'})` : 'Non connecté (sera ignoré)'}
            </span>
          </div>
          <div className="border-t exo-accent-border pt-2 text-[10.5px] exo-muted-text">
            Message : {commitSummary}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            data-testid="tri-surface-cancel-btn"
            className="exo-accent-chip min-h-[42px] px-4 font-semibold whitespace-nowrap shrink-0"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            data-testid="tri-surface-confirm-btn"
            className="exo-window-tab-active inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-4 font-bold whitespace-nowrap shrink-0"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{busy ? 'Synchronisation...' : 'Confirmer les 3 enregistrements'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
