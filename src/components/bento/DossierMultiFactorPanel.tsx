import { CheckCircle2, Coins, Layers, ShieldAlert, UserCheck, Users } from 'lucide-react';
import type {
  DossierOption,
  DossierSelectionBudget,
} from '../../contracts/pa-dossiers.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import {
  computeColonistSkillContribution,
  type BudgetedSelectionEvaluation,
  type SkillAttribute,
} from '../../systems/dossiers-pa/multi-factor-unlock.engine.ts';
import { formatSpecialtyLabel } from '../../systems/economy-urban/workforce-assignments.ts';
import { ExoTooltip } from './ExoTooltip.tsx';

/**
 * [L7] EXW.L7.DOSSIER_MULTI_FACTOR_PANEL | v5.1.0 | SADT A2.1/A5.3
 * Budgeted Multi-Choice meter + Teammate/Colonist & Skill Assignment selector.
 */
interface DossierMultiFactorPanelProps {
  readonly world: WorldState;
  readonly options: readonly DossierOption[];
  readonly budget: DossierSelectionBudget;
  readonly budgetEval: BudgetedSelectionEvaluation;
  readonly selectedOptionIds: readonly string[];
  readonly assignedColonistIds: readonly string[];
  readonly onToggleColonist: (colonistId: string) => void;
}

export function DossierMultiFactorPanel({
  world,
  options,
  budget,
  budgetEval,
  selectedOptionIds,
  assignedColonistIds,
  onToggleColonist,
}: DossierMultiFactorPanelProps) {
  const isMulti = budget.mode === 'BUDGETED_MULTI';
  const neededSpecialties = new Set(
    options
      .map((o) => o.unlockConditions?.requiredColonistSpecialty)
      .filter((s): s is NonNullable<typeof s> => Boolean(s)),
  );
  const activeAttr: SkillAttribute =
    budgetEval.selectedOptions[0]?.unlockConditions?.minSkillThreshold?.attribute ??
    budgetEval.selectedOptions[0]?.skillCheck?.attribute ??
    'engineering';

  return (
    <div className="space-y-2.5 rounded-xl border border-cyan-400/35 bg-cyan-950/15 p-3 dark:border-cyan-500/30 dark:bg-[#091522]/75">
      {isMulti && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 pb-2">
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px]">
            <ExoTooltip
              title="Événement à Choix Multiples Budgétés"
              formula={`Max ${budget.maxSelections} décisions · ${budget.paBudgetCap} PA · ${budget.creditsBudgetCap} Cr`}
              body="Combinez plusieurs options compatibles dans la limite du budget PA et Crédits de l’événement. Leurs effets s’additionnent à la signature."
              accent="cyan"
              align="left"
            >
              <span className="inline-flex cursor-help items-center gap-1 rounded-md border border-cyan-400/60 bg-cyan-500/15 px-2 py-0.5 font-bold text-cyan-800 dark:text-cyan-200">
                <Layers className="h-3 w-3" />
                Multi-Choix Budgété
              </span>
            </ExoTooltip>
            <span className="rounded bg-slate-900/10 px-2 py-0.5 font-bold tabular-nums text-[#1f1224] dark:bg-white/10 dark:text-cyan-100">
              Choix : {selectedOptionIds.length}/{budget.maxSelections}
            </span>
            <span
              className={`rounded px-2 py-0.5 font-bold tabular-nums ${
                budgetEval.totalPaSpent > budget.paBudgetCap
                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-200'
                  : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
              }`}
            >
              PA : {budgetEval.totalPaSpent}/{budget.paBudgetCap}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-bold tabular-nums ${
                budgetEval.totalCreditsSpent > budget.creditsBudgetCap
                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-200'
                  : 'bg-amber-500/15 text-amber-900 dark:text-amber-200'
              }`}
            >
              <Coins className="h-3 w-3" />
              {budgetEval.totalCreditsSpent}/{budget.creditsBudgetCap} Cr
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold ${
              budgetEval.allowed
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-amber-700 dark:text-amber-300'
            }`}
          >
            {budgetEval.allowed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
            {budgetEval.reason}
          </span>
        </div>
      )}

      <div>
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px]">
          <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-cyan-900 dark:text-cyan-200">
            <Users className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-300" />
            Équipe &amp; Coéquipiers affectés ({assignedColonistIds.length}/2 max)
          </span>
          <span className="text-[10px] font-semibold text-cyan-900/75 dark:text-cyan-200/80">
            Score combiné Conseiller + Équipe : <strong className="tabular-nums">{budgetEval.combinedSkillScore}</strong>
          </span>
        </div>

        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {world.colonists.map((col) => {
            const active = assignedColonistIds.includes(col.id);
            const needed = neededSpecialties.has(col.specialty);
            const exhausted = col.fatigue >= 92;
            const bonus = computeColonistSkillContribution(col, activeAttr);
            return (
              <button
                key={col.id}
                type="button"
                data-testid={`colonist-assign-${col.id}`}
                disabled={exhausted}
                onClick={() => onToggleColonist(col.id)}
                className={`flex min-h-[46px] items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition disabled:opacity-45 ${
                  active
                    ? 'border-cyan-500 bg-cyan-500/20 text-[#1f1224] ring-1 ring-cyan-400/50 dark:border-cyan-400 dark:text-cyan-50'
                    : needed
                      ? 'border-amber-400/70 bg-amber-500/10 text-[#1f1224] hover:border-cyan-400 dark:border-amber-500/50 dark:text-rose-50'
                      : 'border-rose-200/80 bg-white/80 text-[#1f1224] hover:border-cyan-400 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 truncate text-xs font-bold">
                    {active && <UserCheck className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-300" />}
                    <span className="truncate">{col.name}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1 font-mono text-[9.5px] opacity-85">
                    <span>{formatSpecialtyLabel(col.specialty)}</span>
                    <span>· Niv.{col.level ?? 1}</span>
                    <span>· Fat.{Math.round(col.fatigue)}%</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5 font-mono text-[9.5px] font-bold">
                  <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-cyan-900 dark:text-cyan-200">
                    +{bonus} Comp.
                  </span>
                  {needed && !active && (
                    <span className="text-[9px] text-amber-700 dark:text-amber-300">Requis</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
