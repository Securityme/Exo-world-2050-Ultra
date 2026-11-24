import { useMemo } from 'react';
import { GitCommitHorizontal, RotateCcw } from 'lucide-react';
import type { DocVcsRevision } from '../../contracts/skills-vcs.schema.ts';
import { computeLineDiff } from '../../systems/governance/skills-vcs.engine.ts';

interface DocRevisionTimelineDiffProps {
  readonly revisions: readonly DocVcsRevision[];
  readonly activeRevisionId: string;
  readonly compareRevisionId: string | null;
  readonly busy: boolean;
  readonly onSelectCompare: (revisionId: string) => void;
  readonly onRevert: (targetRevisionId: string) => void;
}

const SOURCE_BADGES: Readonly<Record<DocVcsRevision['source'], string>> = {
  LOCAL: 'border-cyan-400/50 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  REVERT: 'border-amber-400/60 bg-amber-500/15 text-amber-800 dark:text-amber-300',
  DRIVE_IMPORT: 'border-emerald-400/60 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
};

/**
 * [L7] EXW.L7.DOC_REVISION_TIMELINE_DIFF | v5.1.0 | <= 170 lines (R-14)
 * Displays SHA-256 revision history, interactive line-by-line Diff, and non-destructive Revert.
 */
export function DocRevisionTimelineDiff({
  revisions,
  activeRevisionId,
  compareRevisionId,
  busy,
  onSelectCompare,
  onRevert,
}: DocRevisionTimelineDiffProps) {
  const currentRev = revisions.find((r) => r.revisionId === activeRevisionId) ?? revisions[0] ?? null;
  const compareRev =
    revisions.find((r) => r.revisionId === compareRevisionId) ??
    revisions[1] ??
    currentRev;

  const diffLines = useMemo(() => {
    if (!currentRev || !compareRev) return [];
    if (currentRev.revisionId === compareRev.revisionId) {
      return computeLineDiff(currentRev.content, currentRev.content);
    }
    return computeLineDiff(compareRev.content, currentRev.content);
  }, [currentRev, compareRev]);

  const diffStats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const line of diffLines) {
      if (line.kind === 'ADDED') added++;
      if (line.kind === 'REMOVED') removed++;
    }
    return { added, removed };
  }, [diffLines]);

  return (
    <div className="space-y-3" data-testid="doc-vcs-history-panel">
      <div className="exo-surface-sub rounded-xl p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-display text-xs font-bold text-[var(--exo-text)]">
            <GitCommitHorizontal className="h-3.5 w-3.5 exo-accent-text" />
            <span>Historique des Révisions ({revisions.length})</span>
          </div>
          <span className="font-mono text-[10px] exo-muted-text">
            Restauration non destructive (nouvelle révision REVERT)
          </span>
        </div>

        <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
          {revisions.map((rev) => {
            const isCurrent = rev.revisionId === activeRevisionId;
            const isCompared = rev.revisionId === compareRev?.revisionId;
            return (
              <div
                key={rev.revisionId}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-[11px] ${
                  isCurrent
                    ? 'exo-accent-chip-active border-[var(--exo-accent)]'
                    : isCompared
                      ? 'border-amber-400/70 bg-amber-500/10'
                      : 'exo-accent-border bg-[var(--exo-surface)]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 font-mono">
                    <span className="font-bold exo-accent-text">v{rev.semver}</span>
                    <span className={`rounded border px-1.5 py-0.5 text-[9.5px] font-bold ${SOURCE_BADGES[rev.source]}`}>
                      {rev.source}
                    </span>
                    <span className="exo-muted-text">SHA {rev.contentHash.slice(0, 8)}</span>
                    {isCurrent && (
                      <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-700 dark:text-emerald-300">
                        ACTUELLE
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] font-medium text-[var(--exo-text)]">
                    {rev.summary}
                  </div>
                  <div className="font-mono text-[9.5px] exo-muted-text">
                    {rev.author} · {rev.createdAtIso.slice(0, 16).replace('T', ' ')}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    data-testid={`diff-select-${rev.revisionId}`}
                    onClick={() => onSelectCompare(rev.revisionId)}
                    className={`min-h-[30px] rounded-lg px-2 font-mono text-[10px] font-bold transition ${
                      isCompared ? 'bg-amber-500 text-slate-950' : 'exo-accent-chip'
                    }`}
                  >
                    Comparer
                  </button>
                  {!isCurrent && (
                    <button
                      type="button"
                      disabled={busy}
                      data-testid={`revert-rev-${rev.revisionId}`}
                      onClick={() => onRevert(rev.revisionId)}
                      className="inline-flex min-h-[30px] items-center gap-1 rounded-lg border border-amber-400/70 bg-amber-500/15 px-2 font-mono text-[10px] font-bold text-amber-800 hover:bg-amber-500/25 disabled:opacity-45 dark:text-amber-200"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Revert</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Line-by-line Diff Viewer */}
      <div className="exo-surface-sub rounded-xl p-3" data-testid="doc-vcs-line-diff">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px]">
          <span className="font-bold text-[var(--exo-text)]">
            Diff ligne à ligne : v{compareRev?.semver ?? '—'} → v{currentRev?.semver ?? '—'}
          </span>
          <span className="flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-300">+{diffStats.added}</span>
            <span className="text-rose-600 dark:text-rose-300">-{diffStats.removed}</span>
          </span>
        </div>
        <div className="max-h-44 overflow-y-auto rounded-lg border exo-accent-border bg-black/5 p-2 font-mono text-[10.5px] leading-relaxed dark:bg-black/35">
          {diffLines.map((line, idx) => (
            <div
              key={`${idx}-${line.kind}`}
              className={`flex gap-2 px-1.5 ${
                line.kind === 'ADDED'
                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                  : line.kind === 'REMOVED'
                    ? 'bg-rose-500/15 text-rose-800 dark:text-rose-200'
                    : 'text-[var(--exo-text)] opacity-80'
              }`}
            >
              <span className="w-4 shrink-0 select-none font-bold">
                {line.kind === 'ADDED' ? '+' : line.kind === 'REMOVED' ? '-' : ' '}
              </span>
              <span className="whitespace-pre-wrap break-words">{line.text || ' '}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
