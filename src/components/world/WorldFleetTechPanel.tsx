import { useSetAtom } from 'jotai';
import { Cpu, Plus, Rocket, Shield, Wrench } from 'lucide-react';
import {
  SHIP_CLASS_LABELS,
  SHIP_MODULES_CATALOG,
} from '../../data/ship-equipment.catalog.ts';
import { SHARED_TECHS_30 } from '../../data/v4-catalog.data.ts';
import { handleGenerateActionEvent } from '../../pipelines/game-actions.pipeline.ts';
import { useExoStore } from '../../stores/game.store.ts';
import {
  activeDossierIdAtom,
  activeSubscreenAtom,
  isolated3DModalAtom,
  toastNoticeAtom,
} from '../../stores/selection.atoms.ts';
import { computeFleetTotals, computeShipStats } from '../../systems/fleet/ship-loadout.engine.ts';
import { CombatHistoryViewer } from './CombatHistoryViewer.tsx';

interface WorldFleetTechPanelProps {
  readonly subView: 'HANGAR_COMBAT' | 'TECH_TREE';
}

/**
 * [L7] EXW.L7.WORLD_FLEET_TECH_PANEL | v5.1.0 | <= 200 lines (R-14)
 * Level-2 views under Monde -> Militaire (Flotte) & Technologies (Arbre 30 Techs).
 * All ship equipping, refit, commissioning & tech selection route strictly via Événements (R-24).
 */
export function WorldFleetTechPanel({ subView }: WorldFleetTechPanelProps) {
  const world = useExoStore((s) => s.world);
  const setIsolated3D = useSetAtom(isolated3DModalAtom);
  const setActiveDossierId = useSetAtom(activeDossierIdAtom);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
  const setToast = useSetAtom(toastNoticeAtom);

  const openActionDossier = (req: Parameters<typeof handleGenerateActionEvent>[0]) => {
    const [err, dossier] = handleGenerateActionEvent(req);
    if (err || !dossier) {
      setToast({ id: Date.now(), tone: 'error', text: err?.message ?? 'Action indisponible.' });
      return;
    }
    setSubscreen('EVENTS_HUB');
    setActiveDossierId(dossier.id);
  };

  if (subView === 'TECH_TREE') {
    return (
      <div className="exo-bento-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="h-4.5 w-4.5 exo-accent-text" />
            <h3 className="font-display text-sm font-bold text-[var(--exo-text)]">
              30 Technologies Partagées &amp; Cyber ({world.hk?.unlockedTechIds.length ?? 1} / 30)
            </h3>
          </div>
          <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-300">
            Passerelle Événements (R-24) · Actif : {world.hk?.researchTurnsLeft ?? 0}t restant(s)
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SHARED_TECHS_30.filter((t) => t.era <= Math.min(6, world.era + 1)).map((tech) => {
            const unlocked = world.hk?.unlockedTechIds.includes(tech.id) ?? false;
            const researching = world.hk?.activeResearchTechId === tech.id;
            const lockedEra = tech.era > world.era;
            return (
              <button
                key={tech.id}
                type="button"
                disabled={unlocked || lockedEra || researching}
                onClick={() => openActionDossier({ kind: 'START_RESEARCH', techId: tech.id })}
                className={`rounded-xl border p-2.5 text-left text-xs transition ${
                  unlocked
                    ? 'border-emerald-400/70 bg-emerald-500/10'
                    : researching
                      ? 'exo-accent-chip-active ring-1 ring-[var(--exo-accent)]'
                      : 'exo-surface-sub hover:border-[var(--exo-accent)] disabled:opacity-50'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px] font-bold">
                  <span className="exo-accent-text">Ère {tech.era} · {tech.domain}</span>
                  <span className={unlocked ? 'text-emerald-600 dark:text-emerald-300' : 'exo-muted-text'}>
                    {unlocked ? 'ACQUISE' : researching ? `EN COURS (${world.hk?.researchTurnsLeft}t)` : lockedEra ? 'VERROUILLÉE' : 'DOSSIER R-24'}
                  </span>
                </div>
                <div className="mt-1 font-display font-bold text-[var(--exo-text)]">{tech.name}</div>
                <div className="mt-0.5 text-[11px] exo-muted-text">{tech.effectLabel}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const ships = world.fleetShips ?? [];
  const fleetTotals = computeFleetTotals(ships);

  return (
    <div className="space-y-4">
      <div className="exo-bento-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="font-mono text-[10px] font-bold uppercase exo-accent-text">
            Flotte Orbitale &amp; Armement Modulaire (R-24)
          </div>
          <h3 className="font-display text-base font-bold text-[var(--exo-text)]">
            {fleetTotals.shipCount} Vaisseaux ({fleetTotals.totalModulesFitted} modules) · Puiss.{' '}
            {fleetTotals.totalFirepower} · Déf. {fleetTotals.totalDefense}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsolated3D({ mode: 'HANGAR' })}
            className="exo-accent-btn inline-flex min-h-[40px] items-center gap-1.5 px-3.5 text-xs font-bold"
          >
            <Rocket className="h-4 w-4" />
            <span>Hangar 3D</span>
          </button>
          <button
            type="button"
            onClick={() => openActionDossier({ kind: 'COMMISSION_SHIP', shipClass: 'CORVETTE_ORBITAL' })}
            className="exo-accent-chip inline-flex min-h-[40px] items-center gap-1.5 px-3 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5 exo-accent-text" />
            <span>Construire Vaisseau (Événements)</span>
          </button>
        </div>
      </div>

      {/* Live Fleet Vessel Roster */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {ships.map((ship) => {
          const stats = computeShipStats(ship);
          const nextMod = SHIP_MODULES_CATALOG.find(
            (m) => m.minEra <= world.era && !(ship.loadout ?? []).some((inst) => inst.id === m.id),
          );
          return (
            <div key={ship.id} className="exo-bento-card flex flex-col justify-between space-y-2.5 p-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                  <span className="font-bold exo-accent-text">
                    {SHIP_CLASS_LABELS[ship.shipClass]} · Niv.{ship.level}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-300">État {ship.integrity}%</span>
                </div>
                <div className="mt-0.5 font-display text-sm font-bold text-[var(--exo-text)]">{ship.name}</div>
                <div className="mt-1 font-mono text-[10.5px] exo-muted-text">
                  Puiss {stats.firepower} · Déf {stats.defense} · Util {stats.utilityYield} · Baies {stats.slotsUsed}/{stats.maxSlots}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(ship.loadout ?? []).map((mod) => (
                    <span key={mod.id} className="exo-accent-chip rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                      {mod.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 border-t exo-accent-border pt-2">
                {nextMod && (
                  <button
                    type="button"
                    onClick={() => openActionDossier({ kind: 'EQUIP_SHIP_MODULE', shipId: ship.id, moduleId: nextMod.id })}
                    className="exo-accent-btn inline-flex min-h-[32px] flex-1 items-center justify-center gap-1 px-2.5 font-mono text-[10.5px] font-bold"
                  >
                    <Shield className="h-3 w-3" />
                    Armer / Module
                  </button>
                )}
                {ship.level < 5 && (
                  <button
                    type="button"
                    onClick={() => openActionDossier({ kind: 'REFIT_SHIP', shipId: ship.id, mode: 'UPGRADE_LEVEL' })}
                    className="exo-accent-chip inline-flex min-h-[32px] items-center gap-1 px-2.5 font-mono text-[10.5px] font-semibold"
                  >
                    <Wrench className="h-3 w-3 exo-accent-text" />
                    Niv.{ship.level + 1}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CombatHistoryViewer
        turnSnapshots={world.turn_snapshots}
        combatReports={world.combatReports}
        onLaunchAssault={() =>
          openActionDossier({ kind: 'LAUNCH_COMBAT', targetTileIndex: world.rivalTiles[0] ?? 24 })
        }
      />
    </div>
  );
}
