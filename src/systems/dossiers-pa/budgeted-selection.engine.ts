import type {
  DossierOption,
  DossierSelectionBudget,
  DossierSubChoice,
  ExecutiveDossier,
  RefinementLevel,
} from '../../contracts/pa-dossiers.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import {
  computeCombinedSkillScore,
  evaluateOptionUnlockFactors,
} from './multi-factor-unlock.engine.ts';

/**
 * [L3] EXW.L3.BUDGETED_SELECTION | v5.1.0 | SADT A2.1/A2.2
 * Pure deterministic evaluator for SINGLE and BUDGETED_MULTI executive dossier choices.
 * Enforces maxSelections, paBudgetCap, creditsBudgetCap, teammate requirements & unlock gates.
 */
export interface BudgetedSelectionEvaluation {
  readonly allowed: boolean;
  readonly reason: string;
  readonly selectedOptions: readonly DossierOption[];
  readonly totalGeneralPa: number;
  readonly totalSubPa: number;
  readonly totalPaSpent: number;
  readonly totalCreditsSpent: number;
  readonly combinedSkillScore: number;
}

export function resolveDossierSelectionBudget(
  dossier: ExecutiveDossier,
): DossierSelectionBudget {
  return (
    dossier.selectionBudget ?? {
      mode: 'SINGLE',
      maxSelections: 1,
      paBudgetCap: 8,
      creditsBudgetCap: 2000,
      requireColonistOnBundle: false,
    }
  );
}

function failedEval(
  reason: string,
  selectedOptions: readonly DossierOption[],
  totalGeneralPa = 0,
  totalSubPa = 0,
  totalCreditsSpent = 0,
  combinedSkillScore = 0,
): BudgetedSelectionEvaluation {
  return {
    allowed: false,
    reason,
    selectedOptions,
    totalGeneralPa,
    totalSubPa,
    totalPaSpent: totalGeneralPa + totalSubPa,
    totalCreditsSpent,
    combinedSkillScore,
  };
}

export function evaluateBudgetedSelection(
  world: WorldState,
  dossier: ExecutiveDossier,
  effectiveOptions: readonly DossierOption[],
  selectedOptionIds: readonly string[],
  subChoice: DossierSubChoice | undefined,
  refinementLevel: RefinementLevel,
  advisorId: string,
  assignedColonistIds: readonly string[],
): BudgetedSelectionEvaluation {
  const uniqueIds = [...new Set(selectedOptionIds)];
  const selectedOptions = uniqueIds
    .map((id) => effectiveOptions.find((o) => o.id === id))
    .filter((o): o is DossierOption => Boolean(o));

  const budget = resolveDossierSelectionBudget(dossier);
  if (selectedOptions.length === 0) {
    return failedEval(
      'Sélectionnez au moins une décision.',
      [],
      0,
      0,
      0,
      computeCombinedSkillScore(world, advisorId, assignedColonistIds, 'engineering'),
    );
  }

  if (budget.mode === 'SINGLE' && selectedOptions.length > 1) {
    return failedEval('Ce dossier n’accepte qu’une seule décision principale.', selectedOptions);
  }

  if (selectedOptions.length > budget.maxSelections) {
    return failedEval(
      `Limite atteinte : maximum ${budget.maxSelections} décisions combinées.`,
      selectedOptions,
    );
  }

  if (selectedOptions.some((o) => o.actionPayload?.kind === 'DEFER_ACTION') && selectedOptions.length > 1) {
    return failedEval(
      'Impossible de combiner un ajournement avec une décision active.',
      selectedOptions,
    );
  }

  const mult = 1 + refinementLevel * 0.5;
  let totalGeneralPa = subChoice?.extraPaGeneralCost ?? 0;
  let totalSubPa = subChoice?.extraSubPaCost ?? 0;
  let totalCreditsSpent =
    subChoice?.bonusEffects?.credits && subChoice.bonusEffects.credits < 0
      ? Math.abs(subChoice.bonusEffects.credits)
      : 0;

  for (const opt of selectedOptions) {
    totalGeneralPa += opt.paGeneralCost;
    totalSubPa += Math.ceil(opt.subPaCost * mult);
    if (opt.effects.credits < 0) {
      totalCreditsSpent += Math.abs(opt.effects.credits);
    }
    const evalRes = evaluateOptionUnlockFactors(world, opt, advisorId, assignedColonistIds);
    if (!evalRes.unlocked) {
      const firstUnmet = evalRes.factors.find((f) => !f.met);
      return failedEval(
        firstUnmet
          ? `Déblocage requis pour « ${opt.label} » : ${firstUnmet.label} (${firstUnmet.requiredLabel}).`
          : `Conditions non remplies pour « ${opt.label} ».`,
        selectedOptions,
        totalGeneralPa,
        totalSubPa,
        totalCreditsSpent,
        evalRes.combinedSkillScore,
      );
    }
  }

  const totalPaSpent = totalGeneralPa + totalSubPa;
  if (budget.mode === 'BUDGETED_MULTI') {
    if (totalPaSpent > budget.paBudgetCap) {
      return failedEval(
        `Budget PA dépassé (${totalPaSpent}/${budget.paBudgetCap} PA max).`,
        selectedOptions,
        totalGeneralPa,
        totalSubPa,
        totalCreditsSpent,
      );
    }
    if (totalCreditsSpent > budget.creditsBudgetCap) {
      return failedEval(
        `Budget Crédits dépassé (${totalCreditsSpent}/${budget.creditsBudgetCap} Cr max).`,
        selectedOptions,
        totalGeneralPa,
        totalSubPa,
        totalCreditsSpent,
      );
    }
    if (budget.requireColonistOnBundle && selectedOptions.length > 1 && assignedColonistIds.length === 0) {
      return failedEval(
        'Affectez au moins 1 coéquipier pour coordonner une réponse multi-choix.',
        selectedOptions,
        totalGeneralPa,
        totalSubPa,
        totalCreditsSpent,
      );
    }
  }

  const primaryAttr =
    selectedOptions[0]?.unlockConditions?.minSkillThreshold?.attribute ??
    selectedOptions[0]?.skillCheck?.attribute ??
    'engineering';

  return {
    allowed: true,
    reason: 'Sélection prête pour validation.',
    selectedOptions,
    totalGeneralPa,
    totalSubPa,
    totalPaSpent,
    totalCreditsSpent,
    combinedSkillScore: computeCombinedSkillScore(world, advisorId, assignedColonistIds, primaryAttr),
  };
}
