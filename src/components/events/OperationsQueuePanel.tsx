import { Building2, Clock, Handshake, Shield } from 'lucide-react';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import type { FleetAggregateStats } from '../../systems/fleet/ship-loadout.engine.ts';
import { RichEntityText } from '../RichEntityText.tsx';

function getOperationStatusMeta(category: string, summary: string): {
  readonly label: string;
  readonly tone: string;
} {
  const s = summary.toLowerCase();
  if (s.includes('chantier') || s.includes('extension') || s.includes('quartier')) {
    return {
      label: 'Chantier en cours',
      tone: 'border-emerald-300 bg-emerald-500/12 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
    };
  }
  if (s.includes('recrut') || s.includes('unité') || s.includes('troupe') || s.includes('garnison')) {
    return {
      label: 'Recrutement en cours',
      tone: 'border-fuchsia-300 bg-fuchsia-500/12 text-fuchsia-900 dark:border-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-200',
    };
  }
  if (s.includes('drone') || s.includes('maintenance') || s.includes('répar')) {
    return {
      label: 'Maintenance en cours',
      tone: 'border-orange-300 bg-orange-500/12 text-orange-900 dark:border-orange-700 dark:bg-orange-500/20 dark:text-orange-200',
    };
  }
  if (s.includes('emprunt') || s.includes('crédit') || s.includes('marché') || s.includes('subvention')) {
    return {
      label: 'Opération financière en cours',
      tone: 'border-amber-300 bg-amber-500/12 text-amber-900 dark:border-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
    };
  }
  if (category === 'DELAYED_CONSEQUENCE') {
    return {
      label: 'Programme en cours',
      tone: 'border-rose-300 bg-rose-500/12 text-rose-900 dark:border-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
    };
  }
  return {
    label: 'Événement en cours',
    tone: 'border-rose-300 bg-rose-500/12 text-rose-900 dark:border-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
  };
}

interface OperationsQueuePanelProps {
  readonly world: WorldState;
  readonly fleetTotals: FleetAggregateStats;
}

/**
 * [L7] EXW.L7.OPERATIONS_QUEUE_PANEL | v5.1.0 | SADT A2.1/A3.3
 * Displays scheduled delayed trigger-bus operations and colony readiness summary.
 */
export function OperationsQueuePanel({ world, fleetTotals }: OperationsQueuePanelProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-rose-200/90 bg-white/95 p-4 dark:border-rose-900/60 dark:bg-[#190d1f]">
        <h3 className="font-display text-sm font-bold text-[#1f1224] dark:text-rose-50">
          Opérations &amp; Programmes en cours ({world.triggerBus.length})
        </h3>
        <p className="mt-0.5 text-xs text-rose-900/65 dark:text-rose-200/70">
          Suivi technique des chantiers, prochain convoi de colons (Tour{' '}
          {world.genese?.nextArrivalCycle ?? world.cycle + 4}), promesses et programmes planifiés.
        </p>
        {world.triggerBus.length === 0 ? (
          <p className="mt-3 rounded-lg border border-rose-200/70 bg-rose-50/50 p-3 text-xs text-rose-900/70 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-200/75">
            Aucune opération différée en file d’attente. Vos prochains chantiers et engagements
            apparaîtront ici avec leur tour d’achèvement.
          </p>
        ) : (
          <div className="mt-3 space-y-2.5">
            {world.triggerBus.map((ev) => {
              const status = getOperationStatusMeta(ev.category, ev.summary);
              const cyclesLeft = Math.max(0, ev.dueCycle - world.cycle);
              const progressPct =
                cyclesLeft === 0 ? 100 : Math.max(18, Math.min(88, 100 - cyclesLeft * 25));

              return (
                <div
                  key={ev.id}
                  className="space-y-2 rounded-xl border border-rose-200/80 bg-rose-50/55 px-3.5 py-3 text-xs dark:border-rose-900/50 dark:bg-rose-950/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${status.tone}`}
                    >
                      <Clock className="h-3 w-3" />
                      {status.label}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                      {cyclesLeft === 0
                        ? `Achèvement imminent (Tour ${ev.dueCycle})`
                        : `Dans ${cyclesLeft} tour(s) · Tour ${ev.dueCycle}`}
                    </span>
                  </div>

                  <div className="font-medium leading-relaxed text-[#1f1224] dark:text-rose-50">
                    <RichEntityText text={ev.summary} interactive />
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-rose-200/80 dark:bg-rose-900/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-emerald-500 transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-rose-200/80 bg-white/85 p-3.5 text-xs dark:border-rose-900/60 dark:bg-[#190d1f]">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
            <Building2 className="h-4 w-4" />
            <span>Chantiers actifs</span>
          </div>
          <p className="mt-1 text-rose-900/75 dark:text-rose-200/75">
            {world.districts.reduce((acc, d) => acc + d.modulesCount, 0)} extension(s) construites
            sur {world.districts.length} quartiers.
          </p>
        </div>
        <div className="rounded-xl border border-rose-200/80 bg-white/85 p-3.5 text-xs dark:border-rose-900/60 dark:bg-[#190d1f]">
          <div className="flex items-center gap-1.5 font-semibold exo-accent-text">
            <Shield className="h-4 w-4" />
            <span>Garnison &amp; Flotte</span>
          </div>
          <p className="mt-1 text-rose-900/75 dark:text-rose-200/75">
            {fleetTotals.shipCount} vaisseau(x) ({fleetTotals.totalModulesFitted} modules · Puiss.{' '}
            {fleetTotals.totalFirepower}) ·{' '}
            {world.militaryRoster.reduce((acc, u) => acc + u.count, 0)} unité(s) ·{' '}
            {world.drones.construction +
              world.drones.defense +
              world.drones.attack +
              world.drones.recon}{' '}
            drones.
          </p>
        </div>
        <div className="rounded-xl border border-rose-200/80 bg-white/85 p-3.5 text-xs dark:border-rose-900/60 dark:bg-[#190d1f]">
          <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300">
            <Handshake className="h-4 w-4" />
            <span>Promesses &amp; Alliance</span>
          </div>
          <p className="mt-1 text-rose-900/75 dark:text-rose-200/75">
            {(world.promises ?? []).filter((p) => p.status === 'ACTIVE').length} promesse(s)
            active(s) · Confiance {world.superAllianceTrust}%.
          </p>
        </div>
      </div>
    </div>
  );
}
