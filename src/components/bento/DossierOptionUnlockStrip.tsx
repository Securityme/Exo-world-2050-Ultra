import { Check, Lock, UserPlus } from 'lucide-react';
import type {
  DossierOption,
  DossierSubChoice,
  RefinementLevel,
} from '../../contracts/pa-dossiers.schema.ts';
import type { OptionUnlockEvaluation } from '../../systems/dossiers-pa/multi-factor-unlock.engine.ts';

/**
 * [L7] EXW.L7.DOSSIER_OPTION_UNLOCK_STRIP | v5.1.0 | SADT A2.1
 * Multi-factor unlock badge strip + 1-click teammate assignment helper + multi-choice impact builder.
 */
export function buildMultiCombinedImpactChips(
  selectedOptions: readonly DossierOption[],
  sub: DossierSubChoice | undefined,
  refinement: RefinementLevel,
): readonly { label: string; positive: boolean }[] {
  if (selectedOptions.length === 0) return [];
  const mult = refinement === 2 ? 1.4 : refinement === 1 ? 1.2 : 1.0;
  const bx = sub?.bonusEffects;
  const scale = (v: number) => (v > 0 ? Math.round(v * mult) : v);

  const sumFx = selectedOptions.reduce(
    (acc, opt) => ({
      credits: acc.credits + scale(opt.effects.credits),
      energy: acc.energy + scale(opt.effects.energy),
      materials: acc.materials + scale(opt.effects.materials),
      water: acc.water + scale(opt.effects.water),
      food: acc.food + scale(opt.effects.food),
      compute: acc.compute + scale(opt.effects.compute),
      breathingKits: acc.breathingKits + scale(opt.effects.breathingKits),
      atmosphereDelta: acc.atmosphereDelta + scale(opt.effects.atmosphereDelta),
      maintenanceDelta: acc.maintenanceDelta + scale(opt.effects.maintenanceDelta),
      allianceTrustDelta: acc.allianceTrustDelta + scale(opt.effects.allianceTrustDelta),
    }),
    {
      credits: 0, energy: 0, materials: 0, water: 0, food: 0,
      compute: 0, breathingKits: 0, atmosphereDelta: 0, maintenanceDelta: 0, allianceTrustDelta: 0,
    },
  );

  const totals = [
    { key: 'Cr', val: sumFx.credits + (bx?.credits ?? 0) },
    { key: 'Énerg.', val: sumFx.energy + (bx?.energy ?? 0) },
    { key: 'Mat.', val: sumFx.materials + (bx?.materials ?? 0) },
    { key: 'Eau', val: sumFx.water + (bx?.water ?? 0) },
    { key: 'Vivres', val: sumFx.food + (bx?.food ?? 0) },
    { key: 'Calcul', val: sumFx.compute + (bx?.compute ?? 0) },
    { key: 'Kits O₂', val: sumFx.breathingKits + (bx?.breathingKits ?? 0) },
    { key: '% Air', val: sumFx.atmosphereDelta + (bx?.atmosphereDelta ?? 0) },
    { key: '% État', val: sumFx.maintenanceDelta + (bx?.maintenanceDelta ?? 0) },
    { key: '% Alliance', val: sumFx.allianceTrustDelta + (bx?.allianceTrustDelta ?? 0) },
  ];

  return totals
    .filter((t) => t.val !== 0)
    .map((t) => ({
      label: `${t.val > 0 ? '+' : ''}${t.val}${t.key.startsWith('%') ? t.key : ` ${t.key}`}`,
      positive: t.val > 0,
    }));
}

interface DossierOptionUnlockStripProps {
  readonly evaluation: OptionUnlockEvaluation;
  readonly canAutoAssignColonist: boolean;
  readonly onAutoAssignColonist: () => void;
}

export function DossierOptionUnlockStrip({
  evaluation,
  canAutoAssignColonist,
  onAutoAssignColonist,
}: DossierOptionUnlockStripProps) {
  if (evaluation.factors.length === 0) return null;

  return (
    <div className="space-y-1.5 rounded-lg border border-cyan-500/25 bg-cyan-500/5 p-2">
      <div className="flex flex-wrap gap-1">
        {evaluation.factors.map((f) => (
          <span
            key={f.id}
            title={`${f.label} : actuel ${f.currentLabel} / requis ${f.requiredLabel}`}
            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9.5px] font-bold ${
              f.met
                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-500/15 text-rose-800 dark:text-rose-200'
            }`}
          >
            {f.met ? <Check className="h-2.5 w-2.5 shrink-0" /> : <Lock className="h-2.5 w-2.5 shrink-0" />}
            <span>{f.label} : {f.requiredLabel}</span>
          </span>
        ))}
      </div>

      {!evaluation.unlocked && canAutoAssignColonist && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAutoAssignColonist();
          }}
          className="inline-flex min-h-[28px] items-center gap-1 rounded-md border border-cyan-400/70 bg-cyan-500/15 px-2 font-mono text-[10px] font-bold text-cyan-900 hover:bg-cyan-500/25 dark:text-cyan-200"
        >
          <UserPlus className="h-3 w-3" />
          Affecter coéquipier qualifié
        </button>
      )}
    </div>
  );
}
