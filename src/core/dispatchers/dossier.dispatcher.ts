import { PA_CONSTANTS } from '../../config/pa.constants.ts';
import {
  type DossierClass,
  type ExecutiveDossier,
  type PaBudget,
  type SubPaDomain,
} from '../../contracts/pa-dossiers.schema.ts';
import { err, ok, type ExwResult } from '../../contracts/trigger-bus.schema.ts';

/**
 * [L2] FUP-002 | SM-01 | SADT A2.1–A2.3
 * Pure PA Fungibility & Dossier Dispatcher (R-26, R-29, R-32).
 * - R-26: PA Général can pay any Sub-PA domain; Sub-PA cannot pay another domain.
 * - R-29: Accumulation strictly capped at 150% (1.5x) of per-cycle regen.
 * - R-32: Active P0 crisis blocks execution of C4 and C5 dossiers.
 */
export interface PaSpendSpec {
  readonly dossierClass: DossierClass;
  readonly paGeneralCost: number;
  readonly subPaDomain: SubPaDomain | null;
  readonly subPaCost: number;
  readonly useGeneralPaFallback: boolean;
}

export function computePaAccumulationCap(regenPerCycle: number): number {
  return Math.max(1, Math.floor(regenPerCycle * PA_CONSTANTS.ACCUMULATION_CAP_FACTOR));
}

export function applyPaAccumulationCap(pa: PaBudget): PaBudget {
  const genCap = computePaAccumulationCap(pa.generalRegen);
  return {
    general: Math.min(genCap, pa.general + pa.generalRegen),
    generalRegen: pa.generalRegen,
    generalCap: genCap,
    subPaRegen: { ...pa.subPaRegen },
    subPa: {
      PA_GES: Math.min(computePaAccumulationCap(pa.subPaRegen.PA_GES), pa.subPa.PA_GES + pa.subPaRegen.PA_GES),
      PA_MNT: Math.min(computePaAccumulationCap(pa.subPaRegen.PA_MNT), pa.subPa.PA_MNT + pa.subPaRegen.PA_MNT),
      PA_BIO: Math.min(computePaAccumulationCap(pa.subPaRegen.PA_BIO), pa.subPa.PA_BIO + pa.subPaRegen.PA_BIO),
      PA_POL: Math.min(computePaAccumulationCap(pa.subPaRegen.PA_POL), pa.subPa.PA_POL + pa.subPaRegen.PA_POL),
    },
  };
}

export function checkP0LockRule(
  activeDossiers: readonly ExecutiveDossier[],
  targetClass: DossierClass,
): ExwResult<true> {
  const hasP0 = activeDossiers.some((d) => d.dossierClass === 'P0');
  if (hasP0 && (targetClass === 'C4' || targetClass === 'C5')) {
    return err(
      'EXW_ERR_P0_BLOCK',
      'R-32 : Une crise P0 active bloque les dossiers C4 et C5 jusqu’à résolution.',
    );
  }
  return ok(true);
}

export function spendPaWithAsymmetricFungibility(
  budget: PaBudget,
  spec: PaSpendSpec,
): ExwResult<PaBudget> {
  let reqGeneral = spec.paGeneralCost;
  let reqSub = 0;
  const domain = spec.dossierClass === 'P0' ? null : spec.subPaDomain;

  if (domain === null) {
    reqGeneral += spec.subPaCost;
  } else if (spec.useGeneralPaFallback) {
    const availSub = budget.subPa[domain];
    const fromSub = Math.min(availSub, spec.subPaCost);
    reqSub = fromSub;
    reqGeneral += spec.subPaCost - fromSub;
  } else {
    reqSub = spec.subPaCost;
  }

  if (budget.general < reqGeneral) {
    return err('EXW_ERR_PA_INSUFFICIENT', `PA Général insuffisant (${budget.general}/${reqGeneral}).`);
  }
  if (domain !== null && budget.subPa[domain] < reqSub) {
    return err(
      'EXW_ERR_PA_INSUFFICIENT',
      `Sous-PA ${domain} insuffisant (${budget.subPa[domain]}/${reqSub}) sans fongibilité PA Général (R-26).`,
    );
  }

  return ok({
    ...budget,
    general: budget.general - reqGeneral,
    subPa: {
      ...budget.subPa,
      ...(domain !== null ? { [domain]: budget.subPa[domain] - reqSub } : {}),
    },
  });
}
