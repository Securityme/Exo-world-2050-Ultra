import { X } from 'lucide-react';
import { DocStudioPanel, type DocStudioTabId } from './DocStudioPanel.tsx';

/**
 * [L7 — ISOLATED GOVERNANCE & PROJECT DOCS STUDIO]
 */
interface DocSyncStudioModalProps {
  readonly initialTab?: DocStudioTabId;
  readonly onClose: () => void;
}

export function DocSyncStudioModal({ initialTab = 'GOVERNANCE', onClose }: DocSyncStudioModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-6">
      <div className="exo-bento-card flex max-h-[92dvh] w-full max-w-6xl flex-col rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b exo-accent-border px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <h2 className="font-display text-base font-bold text-[var(--exo-text)] sm:text-lg">
              Studio Documentaire · Gouvernance RBAC, Validation &amp; Archives App / Jeu
            </h2>
            <p className="text-xs exo-muted-text">
              Rôles et permissions, flux de validation (Application, Skills, Jeu) et classement documentaire séparé
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le studio documentaire"
            className="exo-accent-chip inline-flex h-11 w-11 shrink-0 items-center justify-center"
          >
            <X className="h-5 w-5 exo-accent-text" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <DocStudioPanel initialTab={initialTab} />
        </div>
      </div>
    </div>
  );
}
