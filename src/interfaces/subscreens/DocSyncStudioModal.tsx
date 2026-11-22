import { X } from 'lucide-react';
import { DocStudioPanel, type DocStudioTabId } from './DocStudioPanel.tsx';

/**
 * [L7 — ISOLATED GOVERNANCE & PROJECT DOCS STUDIO]
 */
interface DocSyncStudioModalProps {
  readonly initialTab?: DocStudioTabId;
  readonly onClose: () => void;
}

export function DocSyncStudioModal({ initialTab = 'PROJECT_DOCS', onClose }: DocSyncStudioModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-rose-950/35 p-3 dark:bg-[#0d0611]/85 sm:p-6">
      <div className="exo-bento-card flex max-h-[90vh] w-full max-w-6xl flex-col rounded-2xl">
        <div className="flex items-center justify-between border-b border-rose-200 px-5 py-3.5 dark:border-rose-900/60">
          <div>
            <h2 className="font-display text-lg font-bold text-[#1f1224] dark:text-rose-50">
              Studio Documentaire, Catalogues &amp; Atlas
            </h2>
            <p className="font-mono text-[11px] text-rose-900/65 dark:text-rose-200/70">
              Archives projet en lecture, atlas stratégique et passerelle documentaire isolée
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le studio documentaire"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 text-rose-700 hover:border-rose-500 dark:border-rose-800 dark:text-rose-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <DocStudioPanel initialTab={initialTab} />
        </div>
      </div>
    </div>
  );
}
