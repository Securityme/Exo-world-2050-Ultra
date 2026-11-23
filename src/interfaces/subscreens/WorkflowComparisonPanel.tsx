import { ArrowRight, CheckCircle2, Cloud, Code2, GitBranch, ShieldCheck } from 'lucide-react';
import { DUAL_WORKFLOW_TRACKS_CATALOG } from '../../data/workflow-dual-tracks.catalog.ts';

interface WorkflowComparisonPanelProps {
  readonly onOpenDriveSync?: () => void;
  readonly onOpenDocVcs?: () => void;
  readonly onOpenGovernance?: () => void;
  readonly onOpenSwarmBridge?: () => void;
}

/**
 * [L7] Explicit visual specification of the two separated update workflows:
 * - Track A: Application Core Documentation (Drive / Google Docs + Dedicated Doc VCS)
 * - Track B: Application & Game Code / 3D Assets (Git / CI / Quality Gates / Unity)
 */
export function WorkflowComparisonPanel({
  onOpenDriveSync,
  onOpenDocVcs,
  onOpenGovernance,
  onOpenSwarmBridge,
}: WorkflowComparisonPanelProps) {
  return (
    <div className="space-y-5" data-testid="workflow-comparison-panel">
      <div className="rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-4">
        <h3 className="font-display text-base font-bold text-[var(--exo-text)]">
          Workflows Séparés : Documentation Application (Drive/Docs) vs Code Applicatif &amp; Jeu
        </h3>
        <p className="mt-1 text-xs exo-muted-text">
          Les documents cœur d’application évoluent sur la branche documentaire{' '}
          <span className="font-mono-num font-semibold exo-accent-text">docs/drive-sovereign</span> via Google Drive/Docs sans attendre de build code, tandis que le code source, les règles jouables et les assets 3D passent par le pipeline CI/CD sur{' '}
          <span className="font-mono-num font-semibold exo-accent-2-text">main</span>.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {onOpenDocVcs && (
            <button
              type="button"
              onClick={onOpenDocVcs}
              className="exo-accent-btn inline-flex min-h-[44px] items-center gap-1.5 px-3.5 text-xs font-semibold"
            >
              <GitBranch className="h-3.5 w-3.5" />
              <span>Ouvrir Git Docs (VCS Séparé)</span>
            </button>
          )}
          {onOpenDriveSync && (
            <button
              type="button"
              onClick={onOpenDriveSync}
              className="exo-accent-chip inline-flex min-h-[44px] items-center gap-1.5 px-3.5 text-xs font-semibold"
            >
              <Cloud className="h-3.5 w-3.5 exo-accent-text" />
              <span>Ouvrir Enclave Drive &amp; Docs</span>
            </button>
          )}
          {onOpenGovernance && (
            <button
              type="button"
              onClick={onOpenGovernance}
              className="exo-accent-chip inline-flex min-h-[44px] items-center gap-1.5 px-3.5 text-xs font-semibold"
            >
              <ShieldCheck className="h-3.5 w-3.5 exo-accent-text" />
              <span>Registre RBAC &amp; Validations</span>
            </button>
          )}
          {onOpenSwarmBridge && (
            <button
              type="button"
              onClick={onOpenSwarmBridge}
              className="exo-accent-chip inline-flex min-h-[44px] items-center gap-1.5 px-3.5 text-xs font-semibold"
            >
              <ArrowRight className="h-3.5 w-3.5 exo-accent-2-text" />
              <span>Pont Preview ↔ Antigravity / Swarm</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {DUAL_WORKFLOW_TRACKS_CATALOG.map((track) => {
          const isDocsTrack = track.id === 'TRACK_A_DRIVE_DOCS';
          return (
            <section
              key={track.id}
              data-testid={`workflow-track-${isDocsTrack ? 'docs' : 'code'}`}
              className="space-y-4 rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-4"
            >
              <div className="space-y-1.5 border-b exo-accent-border pb-3">
                <div className="flex items-center gap-2 font-mono-num text-[11px] font-bold">
                  {isDocsTrack ? (
                    <Cloud className="h-4 w-4 exo-accent-text" />
                  ) : (
                    <Code2 className="h-4 w-4 exo-accent-2-text" />
                  )}
                  <span className={isDocsTrack ? 'exo-accent-text' : 'exo-accent-2-text'}>
                    {track.badge}
                  </span>
                </div>
                <h4 className="font-display text-base font-bold text-[var(--exo-text)]">
                  {track.title}
                </h4>
                <p className="text-xs leading-relaxed exo-muted-text">{track.subtitle}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1 font-mono-num text-[11px] exo-muted-text">
                  <span>Branche : {track.vcsBranchName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{track.releaseCadence}</span>
                </div>
              </div>

              <ol className="space-y-3">
                {track.steps.map((step) => (
                  <li
                    key={step.id}
                    className="rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)]/55 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-xs font-bold text-[var(--exo-text)]">
                        {String(step.stepNumber).padStart(2, '0')}. {step.title}
                      </span>
                      <span className="font-mono-num text-[10.5px] exo-muted-text">{step.id}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-[var(--exo-text)] opacity-85">
                      <span className="font-semibold">Responsable : </span>
                      {step.actorRole}
                    </div>
                    <div className="mt-1 flex items-start gap-1.5 text-[11px] exo-muted-text">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        <strong className="text-[var(--exo-text)]">Porte : </strong>
                        {step.gateRule}
                      </span>
                    </div>
                    <div className="mt-1 font-mono-num text-[10.5px] exo-accent-text">
                      Livrable : {step.artifactProduced}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
