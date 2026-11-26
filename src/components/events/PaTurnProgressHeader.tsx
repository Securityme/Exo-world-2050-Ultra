import type { SubPaDomain } from '../../contracts/pa-dossiers.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import {
  computeEventPaProgress,
  computeTurnPaProgress,
} from '../../systems/dossiers-pa/pa-progress.ts';
import { formatSubPaDomain } from '../../utils/ui-labels.ts';

/**
 * [L7] EXW.L7.PA_TURN_PROGRESS_HEADER | v5.2.0 | SADT A5.1
 * Clear header PA consumption progress bar for:
 * - mode="turn"  : Whole turn consumption + projection across all active events
 * - mode="event" : Live arbitration cost for the current event + post-sign turn remaining
 */

interface PaTurnProgressHeaderTurnProps {
  readonly mode: 'turn';
  readonly world: WorldState;
}

interface PaTurnProgressHeaderEventProps {
  readonly mode: 'event';
  readonly world: WorldState;
  readonly totalGeneralPa: number;
  readonly subDomain: SubPaDomain | null;
  readonly totalSubPa: number;
  readonly useGeneralFallback: boolean;
}

type PaTurnProgressHeaderProps = PaTurnProgressHeaderTurnProps | PaTurnProgressHeaderEventProps;

export function PaTurnProgressHeader(props: PaTurnProgressHeaderProps) {
  if (props.mode === 'turn') {
    const turn = computeTurnPaProgress(props.world);
    const projectedPct =
      turn.totalCap > 0
        ? Math.min(100, Math.round(((turn.totalSpent + turn.projectedMinPa) / turn.totalCap) * 100))
        : 0;
    const projectedExtraPct = Math.max(0, projectedPct - turn.spentPct);

    return (
      <div
        className="rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2.5 text-slate-900 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-100"
        data-testid="turn-pa-progress-header"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2 font-semibold">
            <span>Progression PA du tour</span>
            <span className="text-slate-400" aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-amber-700 dark:text-amber-300">
              {turn.totalSpent}/{turn.totalCap} consommés ({turn.spentPct}%)
            </span>
            <span className="text-slate-400" aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-300">
              {turn.totalRemaining} PA disponibles
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-mono tabular-nums">
            <span>
              Événements du tour : {turn.playableEventsCount}/{turn.activeEventsCount} jouables
            </span>
            <span className="text-slate-400" aria-hidden="true">·</span>
            <span>
              Besoin estimé : {turn.projectedMinPa}–{turn.projectedMaxPa} PA (moy. {turn.projectedAvgPa})
            </span>
          </div>
        </div>

        {/* Dual-layer progress track: spent PA + minimum projected PA for remaining events */}
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="flex h-full w-full">
            <div
              className="h-full bg-amber-500 transition-[width] duration-200"
              style={{ width: `${turn.spentPct}%` }}
              title={`PA déjà consommés : ${turn.totalSpent}/${turn.totalCap}`}
            />
            {projectedExtraPct > 0 && (
              <div
                className="h-full bg-sky-400/75 dark:bg-sky-400/60 transition-[width] duration-200"
                style={{ width: `${projectedExtraPct}%` }}
                title={`Besoin minimal des événements restants : ${turn.projectedMinPa} PA`}
              />
            )}
          </div>
        </div>

        {/* Clean typographic breakdown of General PA + 4 Sub-PA domains */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              PA Général {turn.generalRemaining}/{turn.generalCap}
            </span>
            {turn.subDomains.map((sub) => (
              <span key={sub.domain}>
                {formatSubPaDomain(sub.domain)} {sub.remaining}/{sub.cap}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-xs bg-amber-500" />
              Consommés
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-xs bg-sky-400" />
              Projection événements
            </span>
          </div>
        </div>
      </div>
    );
  }

  const ev = computeEventPaProgress(props.world, {
    totalGeneralPa: props.totalGeneralPa,
    subDomain: props.subDomain,
    totalSubPa: props.totalSubPa,
    useGeneralFallback: props.useGeneralFallback,
  });
  const turn = computeTurnPaProgress(props.world);
  const deltaPct = Math.max(0, ev.turnSpentPctAfter - ev.turnSpentPctBefore);

  return (
    <div
      className="rounded-lg border border-slate-200 bg-slate-50/95 px-3 py-2 text-slate-900 dark:border-slate-700/80 dark:bg-slate-900/90 dark:text-slate-100"
      data-testid="event-pa-progress-header"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-2 font-semibold">
          <span>Consommation PA</span>
          <span className="text-slate-400" aria-hidden="true">·</span>
          <span
            className={`font-mono tabular-nums ${
              ev.affordable
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            Cet événement : {ev.eventTotalCost} PA
          </span>
          <span className="text-slate-400" aria-hidden="true">·</span>
          <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
            Tour : {ev.turnAlreadySpent} → {ev.turnSpentAfterSign}/{ev.turnTotalCap} PA ({ev.turnSpentPctAfter}%)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] tabular-nums">
          <span className="text-emerald-700 dark:text-emerald-300">
            Reste après signature : {ev.turnRemainingAfterSign} PA
          </span>
          {ev.fallbackGeneralCost > 0 && (
            <>
              <span className="text-slate-400" aria-hidden="true">·</span>
              <span className="text-amber-700 dark:text-amber-300">
                Recours PA Général +{ev.fallbackGeneralCost}
              </span>
            </>
          )}
          {!ev.affordable && ev.shortfallReason && (
            <>
              <span className="text-slate-400" aria-hidden="true">·</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                {ev.shortfallReason}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Segmented bar: already spent in turn + this event cost */}
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="flex h-full w-full">
          <div
            className="h-full bg-slate-500 dark:bg-slate-400 transition-[width] duration-200"
            style={{ width: `${ev.turnSpentPctBefore}%` }}
            title={`Déjà dépensé ce tour : ${ev.turnAlreadySpent} PA`}
          />
          <div
            className={`h-full transition-[width] duration-200 ${
              ev.affordable ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${deltaPct}%` }}
            title={`Coût de cet événement : ${ev.eventTotalCost} PA`}
          />
        </div>
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
        <span>
          Déduction : {ev.totalGeneralDeducted} PA Gén.
          {ev.subDomain && ev.totalSubDeducted > 0
            ? ` + ${ev.totalSubDeducted} ${formatSubPaDomain(ev.subDomain)}`
            : ''}
        </span>
        <span>
          Tous événements du tour : {turn.playableEventsCount}/{turn.activeEventsCount} jouables · Besoin min. {turn.projectedMinPa} PA
        </span>
      </div>
    </div>
  );
}
