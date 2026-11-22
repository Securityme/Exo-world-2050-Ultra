import { useMemo, useState } from 'react';
import { useSetAtom } from 'jotai';
import {
  Anchor,
  Compass,
  Plane,
  Rocket,
  Shield,
  Siren,
  Star,
  Swords,
} from 'lucide-react';
import { handleGenerateActionEvent } from '../../pipelines/game-actions.pipeline.ts';
import { useExoStore } from '../../stores/game.store.ts';
import {
  activeDossierIdAtom,
  isolated3DModalAtom,
  toastNoticeAtom,
} from '../../stores/selection.atoms.ts';
import {
  computeCivilPressureStars,
  computeFourTheaterForces,
  simulateTaskforcePlan,
  type MilitaryTheaterId,
} from '../../systems/combat-conquest/theaters-and-polities.ts';
import { CombatHistoryViewer } from './CombatHistoryViewer.tsx';

const THEATER_ICONS: Record<MilitaryTheaterId, typeof Rocket> = {
  SPACE: Rocket,
  AIR: Plane,
  LAND: Shield,
  SEA: Anchor,
};

/**
 * [L7] EXW.L7.MILITARY_THEATERS_PANEL | v5.0.0 | SADT A3.3
 * 4 Military Theaters (Spatial, Ciel, Terrestre, Maritime), Call of War Taskforce Builder
 * on 72 sectors, Hangar 3D launch, and OpenGTA2/OpenRW-inspired Civil Pressure Star Rating (0★..5★).
 */
export function MilitaryTheatersPanel() {
  const world = useExoStore((s) => s.world);
  const setIsolated3D = useSetAtom(isolated3DModalAtom);
  const setActiveDossierId = useSetAtom(activeDossierIdAtom);
  const setToast = useSetAtom(toastNoticeAtom);

  const [selectedTheater, setSelectedTheater] = useState<MilitaryTheaterId>('SPACE');
  const [targetSector, setTargetSector] = useState<number>(world.rivalTiles[0] ?? 24);
  const [taskforceName, setTaskforceName] = useState('Force Expéditionnaire Aurore');

  const theaters = useMemo(() => computeFourTheaterForces(world), [world]);
  const civilPressure = useMemo(() => computeCivilPressureStars(world), [world]);
  const plan = useMemo(
    () => simulateTaskforcePlan(world, selectedTheater, targetSector, taskforceName),
    [world, selectedTheater, targetSector, taskforceName],
  );

  const openActionDossier = (req: Parameters<typeof handleGenerateActionEvent>[0]) => {
    const [err, dossier] = handleGenerateActionEvent(req);
    if (err || !dossier) {
      setToast({ id: Date.now(), tone: 'error', text: err?.message ?? 'Action indisponible.' });
      return;
    }
    setActiveDossierId(dossier.id);
  };

  return (
    <div className="space-y-4" data-testid="military-theaters-panel">
      {/* Civil Pressure 0★..5★ Banner (OpenGTA2/OpenRW-inspired adaptation) */}
      <div className="exo-bento-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase exo-accent-text">
            <Siren className="h-3.5 w-3.5" />
            <span>Indice de Pression Civile &amp; Patrouilles Urbaines</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-0.5" aria-label={`${civilPressure.stars} étoiles sur 5`}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i <= civilPressure.stars
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-[var(--exo-muted)] opacity-35'
                  }`}
                />
              ))}
            </span>
            <strong className="font-display text-sm text-[var(--exo-text)]">
              {civilPressure.label}
            </strong>
          </div>
          <p className="text-xs exo-muted-text">
            Facteur principal : {civilPressure.primaryDriver} · Couverture patrouilles :{' '}
            <strong className="text-[var(--exo-text)]">{civilPressure.patrolCoveragePct}%</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsolated3D({ mode: 'HANGAR' })}
            className="exo-accent-btn inline-flex min-h-[40px] items-center gap-1.5 px-3.5 text-xs font-bold"
          >
            <Rocket className="h-4 w-4" />
            <span>Chantier / Hangar 3D</span>
          </button>
          <button
            type="button"
            onClick={() => openActionDossier({ kind: 'RECRUIT_UNIT', unitClass: 'INFANTRY_EXO', level: 1 })}
            className="exo-accent-chip inline-flex min-h-[40px] items-center gap-1.5 px-3 text-xs font-semibold"
          >
            <Shield className="h-3.5 w-3.5 exo-accent-text" />
            <span>Recruter Garnison</span>
          </button>
        </div>
      </div>

      {/* 4 Military Theaters Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {theaters.map((th) => {
          const Icon = THEATER_ICONS[th.id];
          const active = selectedTheater === th.id;
          return (
            <button
              key={th.id}
              type="button"
              data-testid={`theater-card-${th.id.toLowerCase()}`}
              onClick={() => setSelectedTheater(th.id)}
              className={`exo-bento-card flex flex-col justify-between p-3.5 text-left transition ${
                active ? 'ring-2 ring-[var(--exo-accent)]' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-[var(--exo-text)]">
                    <Icon className="h-4 w-4 exo-accent-text" />
                    {th.label}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[9.5px] font-bold ${
                      th.supplyStatus === 'OPTIMAL'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                        : th.supplyStatus === 'TENDU'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                          : 'bg-rose-500/20 text-rose-500 dark:text-rose-300'
                    }`}
                  >
                    {th.supplyStatus}
                  </span>
                </div>
                <div className="mt-2 font-mono text-xs">
                  <span className="font-bold exo-accent-text">{th.unitCount}</span> unités · Puissance{' '}
                  <strong>{th.powerScore}</strong>
                </div>
                <div className="mt-0.5 truncate text-[11px] exo-muted-text">{th.flagshipLabel}</div>
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t exo-accent-border pt-2 font-mono text-[10px]">
                <span className="exo-muted-text">Préparation</span>
                <strong>{th.readinessPct}%</strong>
              </div>
            </button>
          );
        })}
      </div>

      {/* Call of War Taskforce Builder & 72-Sector Supply Simulator */}
      <div className="exo-bento-card space-y-3 p-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-display text-sm font-bold text-[var(--exo-text)]">
            <Compass className="h-4 w-4 exo-accent-text" />
            <span>Planificateur Taskforce &amp; Lignes Logistiques (72 Secteurs)</span>
          </div>
          <span className="font-mono text-[10.5px] exo-accent-2-text">
            Origine : Secteur #{plan.originSector} → Cible : #{plan.targetSector}
          </span>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-3">
          <label className="space-y-1">
            <span className="font-mono text-[10px] uppercase exo-muted-text">Nom de la Taskforce</span>
            <input
              type="text"
              value={taskforceName}
              onChange={(e) => setTaskforceName(e.target.value)}
              className="min-h-[38px] w-full rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2.5 text-xs text-[var(--exo-text)]"
            />
          </label>
          <label className="space-y-1">
            <span className="font-mono text-[10px] uppercase exo-muted-text">Théâtre engagé</span>
            <select
              value={selectedTheater}
              onChange={(e) => setSelectedTheater(e.target.value as MilitaryTheaterId)}
              className="min-h-[38px] w-full rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2.5 text-xs text-[var(--exo-text)]"
            >
              <option value="SPACE">Spatial</option>
              <option value="AIR">Ciel</option>
              <option value="LAND">Terrestre</option>
              <option value="SEA">Maritime</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="font-mono text-[10px] uppercase exo-muted-text">Secteur Cible (0..71)</span>
            <input
              type="number"
              min={0}
              max={71}
              value={targetSector}
              onChange={(e) => setTargetSector(Math.max(0, Math.min(71, Number(e.target.value) || 0)))}
              className="min-h-[38px] w-full rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2.5 font-mono text-xs text-[var(--exo-text)]"
            />
          </label>
        </div>

        <div className="exo-surface-sub flex flex-wrap items-center justify-between gap-3 rounded-xl p-3">
          <div className="flex flex-wrap gap-3 font-mono text-[11px]">
            <span>
              Distance logistique : <strong>{plan.supplyLineDistance} hex</strong>
            </span>
            <span>
              Ravitaillement :{' '}
              <strong className={plan.supplyEfficiencyPct >= 75 ? 'text-emerald-500' : 'text-amber-500'}>
                {plan.supplyEfficiencyPct}%
              </strong>
            </span>
            <span>
              Probabilité succès : <strong className="exo-accent-text">{plan.projectedWinChancePct}%</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => openActionDossier({ kind: 'LAUNCH_COMBAT', targetTileIndex: targetSector })}
            className="exo-accent-btn inline-flex min-h-[36px] items-center gap-1.5 px-3 font-mono text-[11px] font-bold"
          >
            <Swords className="h-3.5 w-3.5" />
            <span>Déployer Taskforce (Dossier)</span>
          </button>
        </div>
      </div>

      <CombatHistoryViewer
        turnSnapshots={world.turn_snapshots}
        combatReports={world.combatReports}
        onLaunchAssault={() =>
          openActionDossier({ kind: 'LAUNCH_COMBAT', targetTileIndex: targetSector })
        }
      />
    </div>
  );
}
