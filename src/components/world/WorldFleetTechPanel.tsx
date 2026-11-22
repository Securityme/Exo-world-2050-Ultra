import { useSetAtom } from 'jotai';
import { Cpu, Rocket, Shield } from 'lucide-react';
import { SHARED_TECHS_30 } from '../../data/v4-catalog.data.ts';
import {
  handleGenerateActionEvent,
  handleSelectResearchTech,
} from '../../pipelines/game-actions.pipeline.ts';
import { useExoStore } from '../../stores/game.store.ts';
import {
  activeDossierIdAtom,
  isolated3DModalAtom,
  toastNoticeAtom,
} from '../../stores/selection.atoms.ts';
import { CombatHistoryViewer } from './CombatHistoryViewer.tsx';

interface WorldFleetTechPanelProps {
  readonly subView: 'HANGAR_COMBAT' | 'TECH_TREE';
}

/**
 * [L7] EXW.L7.WORLD_FLEET_TECH_PANEL | v4.1.0 | <= 200 lines (R-14)
 * Level-2 views under Monde -> Flotte & Techs (Hangar 3D & Combats | Arbre 30 Techs).
 */
export function WorldFleetTechPanel({ subView }: WorldFleetTechPanelProps) {
  const world = useExoStore((s) => s.world);
  const setIsolated3D = useSetAtom(isolated3DModalAtom);
  const setActiveDossierId = useSetAtom(activeDossierIdAtom);
  const setToast = useSetAtom(toastNoticeAtom);

  const openActionDossier = (req: Parameters<typeof handleGenerateActionEvent>[0]) => {
    const [err, dossier] = handleGenerateActionEvent(req);
    if (err || !dossier) {
      setToast({ id: Date.now(), tone: 'error', text: err?.message ?? 'Action indisponible.' });
      return;
    }
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
            Osmose alliée +20% · Recherche active : {world.hk?.researchTurnsLeft ?? 0}t restant(s)
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
                disabled={unlocked || lockedEra}
                onClick={() => handleSelectResearchTech(tech.id)}
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
                    {unlocked ? 'ACQUISE' : researching ? `EN COURS (${world.hk?.researchTurnsLeft}t)` : lockedEra ? 'VERROUILLÉE' : 'RECHERCHER'}
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

  return (
    <div className="space-y-4">
      <div className="exo-bento-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="font-mono text-[10px] font-bold uppercase exo-accent-text">
            Inventaire Orbital &amp; Tactique Réel
          </div>
          <h3 className="font-display text-base font-bold text-[var(--exo-text)]">
            {world.fleetShips?.length ?? 0} Vaisseaux ·{' '}
            {world.drones.construction + world.drones.defense + world.drones.attack + world.drones.recon} Drones ·{' '}
            {world.militaryRoster.reduce((a, u) => a + u.count, 0)} Unités
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsolated3D({ mode: 'HANGAR' })}
            className="exo-accent-btn inline-flex min-h-[42px] items-center gap-2 px-4 text-xs font-bold"
          >
            <Rocket className="h-4 w-4" />
            <span>Ouvrir le Hangar 3D (H3D)</span>
          </button>
          <button
            type="button"
            onClick={() => openActionDossier({ kind: 'RECRUIT_UNIT', unitClass: 'INFANTRY_EXO', level: 1 })}
            className="exo-accent-chip inline-flex min-h-[42px] items-center gap-1.5 px-3.5 text-xs font-semibold"
          >
            <Shield className="h-4 w-4 exo-accent-text" />
            <span>Recruter (Dossier)</span>
          </button>
        </div>
      </div>

      <CombatHistoryViewer
        turnSnapshots={world.turn_snapshots}
        combatReports={world.combatReports}
        onLaunchAssault={() =>
          openActionDossier({
            kind: 'LAUNCH_COMBAT',
            targetTileIndex: world.rivalTiles[0] ?? 24,
          })
        }
      />
    </div>
  );
}
