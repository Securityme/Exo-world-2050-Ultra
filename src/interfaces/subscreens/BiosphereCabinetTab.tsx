import { useSetAtom } from 'jotai';
import { Users, Wind, Wrench } from 'lucide-react';
import { getColonistPortrait } from '../../data/art-manifest.data.ts';
import { useExoStore } from '../../stores/game.store.ts';
import { inspectedColonistIdAtom } from '../../stores/selection.atoms.ts';
import { computeEffectiveBuildSpeed } from '../../systems/biosphere/world-systems.ts';
import { computeAdvisorSubPaRegen } from '../../systems/dossiers-pa/pa-engine.ts';
import { formatSpecialtyLabel } from '../../systems/economy-urban/workforce-assignments.ts';
import {
  formatAtmosphereStageName,
  formatWeatherLabel,
} from '../../utils/atmosphere-labels.ts';

/**
 * [L7] FUP-003 | SM-02 | SADT A3.2
 * Biosphere Terraformation, PNJ Build Speed, C3 Maintenance,
 * Presidential Cabinet (4 Advisors) & Clickable Colonists Roster.
 */
export function BiosphereCabinetTab() {
  const world = useExoStore((s) => s.world);
  const setInspectedColonist = useSetAtom(inspectedColonistIdAtom);
  const avgIntegrity = Math.round(
    world.districts.reduce((acc, d) => acc + d.integrity, 0) / Math.max(1, world.districts.length),
  );
  const buildSpeed = computeEffectiveBuildSpeed(
    1,
    world.atmosphereTier,
    world.drones.construction,
    avgIntegrity,
  );

  const avgMorale = Math.round(
    world.colonists.reduce((acc, c) => acc + c.morale, 0) / Math.max(1, world.colonists.length),
  );
  const totalDrones =
    world.drones.construction + world.drones.defense + world.drones.attack + world.drones.recon;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="exo-surface-sub rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-300">
            <span className="flex items-center gap-1.5 font-display font-bold">
              <Wind className="h-4 w-4" /> {formatAtmosphereStageName(world.atmosphereTier)}
            </span>
            <span className="font-mono font-bold">{world.atmosphereProgress}%</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-black/15 dark:bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500"
              style={{ width: `${world.atmosphereProgress}%` }}
            />
          </div>
          <p className="mt-2 font-mono text-[11px] exo-muted-text">
            Vitesse Bâtisseurs : ×{buildSpeed.toFixed(2)} · Météo : {formatWeatherLabel(world.weatherState)}
          </p>
        </div>

        <div className="exo-surface-sub rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-300">
            <span className="flex items-center gap-1.5 font-display font-bold">
              <Wrench className="h-4 w-4" /> Intégrité des Infrastructures
            </span>
            <span className="font-mono font-bold">{avgIntegrity}%</span>
          </div>
          <p className="mt-2 text-xs exo-muted-text">
            Sous 25 %, un dossier de crise urgente s&apos;ouvre automatiquement pour réparer le réseau.
          </p>
          <p className="mt-1 font-mono text-[11px] exo-muted-text">
            Kits Respiratoires : {world.resources.breathingKits} unités
          </p>
        </div>

        <div className="exo-surface-sub rounded-xl p-4">
          <div className="flex items-center justify-between text-xs exo-accent-text">
            <span className="flex items-center gap-1.5 font-display font-bold">
              <Users className="h-4 w-4" /> Colons &amp; Logistique
            </span>
            <span className="font-mono font-bold">Moral {avgMorale}%</span>
          </div>
          <p className="mt-2 text-xs exo-muted-text">
            Équipe active de {world.colonists.length} spécialistes soutenue par {totalDrones} drones autonomes.
          </p>
          <p className="mt-1 font-mono text-[11px] exo-muted-text">
            Réserve Énergie : {world.resources.energy} · Eau : {world.resources.water}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="exo-surface-sub rounded-xl p-4">
          <h3 className="mb-3 font-display text-sm font-bold text-[var(--exo-text)]">
            Cabinet Présidentiel (4 Conseillers · Régénération Sous-PA)
          </h3>
          <div className="space-y-2.5">
            {world.advisors.map((adv) => (
              <div key={adv.id} className="exo-bento-card rounded-lg p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-[var(--exo-text)]">{adv.name}</div>
                    <div className="text-[11px] exo-muted-text">
                      {adv.role} · Trait : {adv.traitName}
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <div className="font-semibold exo-accent-text">
                      +{computeAdvisorSubPaRegen(adv)} {adv.domain}/cycle
                    </div>
                    <div className="text-[10px] exo-muted-text">
                      Niv.{adv.xpLevel} · Fatigue {adv.fatigue}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="exo-surface-sub rounded-xl p-4">
          <h3 className="mb-3 font-display text-sm font-bold text-[var(--exo-text)]">
            Colons &amp; Spécialistes (Cliquer photo pour ouvrir la fiche)
          </h3>
          <div className="space-y-2">
            {world.colonists.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => setInspectedColonist(col.id)}
                className="exo-bento-card flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition hover:border-[var(--exo-accent)]"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={getColonistPortrait(col.id, col.specialty)}
                    alt={col.name}
                    className="h-9 w-9 shrink-0 rounded-lg border exo-accent-border object-cover"
                  />
                  <div>
                    <div className="font-semibold text-[var(--exo-text)]">{col.name}</div>
                    <div className="font-mono text-[10px] exo-muted-text">
                      {formatSpecialtyLabel(col.specialty)} · Trait : {col.trait}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-300">Moral {col.morale}%</span>
                  <div className="exo-muted-text">Fatigue {col.fatigue}%</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
