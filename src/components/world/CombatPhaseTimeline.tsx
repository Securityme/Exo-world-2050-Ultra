import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Cpu,
  Crosshair,
  Flag,
  Layers,
  ShieldAlert,
  Sparkles,
  Swords,
} from 'lucide-react';
import {
  formatCombatOutcomeLabel,
  type CombatPhaseCode,
  type ParsedCombatEngagement,
  type ParsedCombatPhaseStep,
} from '../../utils/combat-snapshot-parser.ts';

/**
 * [L7] EXW.L7.COMBAT_PHASE_TIMELINE | v4.0.0-rc.1 | SADT A5.1
 * Interactive 4-Phase Combat Resolution Timeline Visualization:
 * - Step-by-step phase rail (P1 Cyber & Drones -> P2 Orbital -> P3 Combined Arms -> P4 Capture & Garrison)
 * - Dual-force attrition retention bars, damage exchange deltas, decisive phase badge & SHA-256 provenance
 */

interface CombatPhaseTimelineProps {
  readonly engagement: ParsedCombatEngagement;
}

const PHASE_ICON: Record<CombatPhaseCode, typeof Cpu> = {
  PHASE_1_CYBER_DRONES: Cpu,
  PHASE_2_ORBITAL_BOMBARDMENT: Crosshair,
  PHASE_3_COMBINED_ROUNDS: Swords,
  PHASE_4_CAPTURE_GARRISON: Flag,
};

function renderStepCard(step: ParsedCombatPhaseStep, highlighted: boolean) {
  const Icon = PHASE_ICON[step.phase];
  const momentumPos = step.netMomentum >= 0;

  return (
    <div
      key={step.phase}
      className={`rounded-xl border p-3.5 transition ${
        highlighted
          ? 'border-rose-400 bg-white shadow-xs dark:border-rose-500/70 dark:bg-[#190d1f]'
          : 'border-rose-200/80 bg-rose-50/45 dark:border-rose-900/50 dark:bg-rose-950/25'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 font-mono text-xs font-bold text-white">
            {step.stepNumber}
          </span>
          <div>
            <div className="flex items-center gap-1.5 font-display text-xs font-bold text-[#1f1224] dark:text-rose-50">
              <Icon className="h-3.5 w-3.5 text-rose-600 dark:text-rose-300" />
              <span>{step.title}</span>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-rose-800/70 dark:text-rose-300/75">
              {step.domainTag}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] font-bold">
          {step.isDecisivePhase && (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/80 bg-amber-500/15 px-2 py-0.5 text-amber-900 dark:border-amber-500/60 dark:text-amber-200">
              <Sparkles className="h-3 w-3" />
              Phase décisive
            </span>
          )}
          <span
            className={`rounded-md px-2 py-0.5 ${
              momentumPos
                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-500/15 text-rose-800 dark:text-rose-200'
            }`}
          >
            Élan {momentumPos ? '+' : ''}{step.netMomentum.toFixed(1)}
          </span>
        </div>
      </div>

      <p className="mt-2.5 text-xs leading-relaxed text-[#1f1224] dark:text-rose-100">
        {step.summary}
      </p>

      {/* Dual-force power retention bars & damage deltas */}
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <div className="rounded-lg border border-emerald-300/60 bg-emerald-500/8 p-2.5 dark:border-emerald-800/60 dark:bg-emerald-950/30">
          <div className="flex items-center justify-between font-mono text-[10.5px]">
            <span className="font-bold text-emerald-900 dark:text-emerald-200">Force d’assaut</span>
            <span className="text-emerald-800 dark:text-emerald-300">
              {step.attackerPowerBefore.toFixed(1)} → <strong>{step.attackerPowerAfter.toFixed(1)}</strong> ({step.attackerRetentionPct}%)
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-emerald-950/15 dark:bg-emerald-950">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all dark:bg-emerald-400"
              style={{ width: `${step.attackerRetentionPct}%` }}
            />
          </div>
          <div className="mt-1 font-mono text-[10px] text-emerald-900/80 dark:text-emerald-200/80">
            Dégâts infligés : <strong>+{step.attackerDamageDealt.toFixed(1)}</strong>
          </div>
        </div>

        <div className="rounded-lg border border-rose-300/60 bg-rose-500/8 p-2.5 dark:border-rose-800/60 dark:bg-rose-950/30">
          <div className="flex items-center justify-between font-mono text-[10.5px]">
            <span className="font-bold text-rose-900 dark:text-rose-200">Défense adverse</span>
            <span className="text-rose-800 dark:text-rose-300">
              {step.defenderPowerBefore.toFixed(1)} → <strong>{step.defenderPowerAfter.toFixed(1)}</strong> ({step.defenderRetentionPct}%)
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-rose-950/15 dark:bg-rose-950">
            <div
              className="h-full rounded-full bg-rose-600 transition-all dark:bg-rose-400"
              style={{ width: `${step.defenderRetentionPct}%` }}
            />
          </div>
          <div className="mt-1 font-mono text-[10px] text-rose-900/80 dark:text-rose-200/80">
            Riposte subie : <strong>-{step.defenderDamageDealt.toFixed(1)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CombatPhaseTimeline({ engagement }: CombatPhaseTimelineProps) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [showAllPhases, setShowAllPhases] = useState<boolean>(false);

  useEffect(() => {
    setActiveIndex(0);
  }, [engagement.key]);

  const currentStep = engagement.steps[activeIndex] ?? engagement.steps[0]!;
  const outcomeTone =
    engagement.outcome === 'CAPTURED'
      ? 'border-emerald-400/80 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200'
      : engagement.outcome === 'REPELLED'
        ? 'border-rose-400/80 bg-rose-500/15 text-rose-900 dark:text-rose-200'
        : 'border-amber-400/80 bg-amber-500/15 text-amber-900 dark:text-amber-200';

  return (
    <div className="space-y-3.5" data-testid="combat-phase-timeline">
      {/* Engagement Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-rose-200/75 pb-3 dark:border-rose-900/50">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px]">
            <span className={`rounded-md border px-2 py-0.5 font-bold ${outcomeTone}`}>
              {formatCombatOutcomeLabel(engagement.outcome)}
            </span>
            <span className="rounded-md bg-rose-100/80 px-2 py-0.5 font-semibold text-rose-900 dark:bg-rose-900/50 dark:text-rose-200">
              Tour {engagement.cycleResolved}
              {engagement.year ? ` · ${engagement.year}` : ''}
            </span>
            {engagement.cyberParalysisApplied && (
              <span className="inline-flex items-center gap-1 rounded-md border border-fuchsia-400/70 bg-fuchsia-500/15 px-2 py-0.5 font-bold text-fuchsia-900 dark:text-fuchsia-200">
                <ShieldAlert className="h-3 w-3" />
                Cyber-Paralysie (-40% DEF)
              </span>
            )}
          </div>
          <h4 className="mt-1.5 font-display text-base font-bold text-[#1f1224] dark:text-rose-50">
            {engagement.targetZoneName}
          </h4>
          <div className="mt-0.5 font-mono text-[10.5px] text-rose-900/70 dark:text-rose-200/70">
            Snapshot {engagement.snapshotId} (Tour {engagement.snapshotCycle}) · Pertes : -{engagement.attackerLosses} alliés / -{engagement.defenderLosses} adverses · Garnison {engagement.garrisonStrength}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAllPhases((v) => !v)}
          className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 font-mono text-[11px] font-semibold text-rose-900 hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
        >
          <Layers className="h-3.5 w-3.5 text-rose-600 dark:text-rose-300" />
          <span>{showAllPhases ? 'Mode pas à pas' : 'Déplier les 4 phases'}</span>
        </button>
      </div>

      {/* Connected 4-Node Visual Timeline Rail */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute top-5 right-6 left-6 hidden h-0.5 bg-rose-200 sm:block dark:bg-rose-900/70"
        />
        <div
          aria-hidden="true"
          className="absolute top-5 left-6 hidden h-0.5 bg-rose-600 transition-all sm:block dark:bg-rose-400"
          style={{ width: `calc(${(activeIndex / 3) * 100}% - ${activeIndex === 3 ? 3 : 1.5}rem)` }}
        />

        <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label="Phases de résolution du combat">
          {engagement.steps.map((step, idx) => {
            const Icon = PHASE_ICON[step.phase];
            const isSelected = !showAllPhases && idx === activeIndex;
            const isPassed = showAllPhases || idx <= activeIndex;

            return (
              <button
                key={step.phase}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  setShowAllPhases(false);
                  setActiveIndex(idx);
                }}
                className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                  isSelected
                    ? 'border-rose-500 bg-rose-500/12 ring-1 ring-rose-500/40 dark:border-rose-400 dark:bg-rose-500/20'
                    : 'border-rose-200/80 bg-white/90 hover:border-rose-400 dark:border-rose-900/60 dark:bg-[#190d1f]'
                }`}
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                      isPassed
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {step.stepNumber}
                  </span>
                  <Icon className="h-3.5 w-3.5 text-rose-600 dark:text-rose-300" />
                </div>
                <div className="mt-1.5 font-display text-xs font-bold text-[#1f1224] dark:text-rose-50">
                  {step.shortLabel}
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-rose-900/70 dark:text-rose-200/70">
                  Att. {step.attackerRetentionPct}% · Déf. {step.defenderRetentionPct}%
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step-by-step Detail Card OR Expanded Full Breakdown */}
      {showAllPhases ? (
        <div className="space-y-2.5">
          {engagement.steps.map((step) => renderStepCard(step, step.isDecisivePhase))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {renderStepCard(currentStep, true)}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 font-mono text-xs font-semibold text-rose-900 hover:border-rose-500 disabled:opacity-40 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Phase précédente</span>
            </button>
            <span className="font-mono text-[11px] font-semibold text-rose-800/80 dark:text-rose-200/80">
              Étape {activeIndex + 1} / {engagement.steps.length} · Hash {engagement.deterministicSeedHash.slice(0, 10)}
            </span>
            <button
              type="button"
              disabled={activeIndex >= engagement.steps.length - 1}
              onClick={() => setActiveIndex((i) => Math.min(engagement.steps.length - 1, i + 1))}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-rose-600 px-3 font-mono text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-40"
            >
              <span>Phase suivante</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
