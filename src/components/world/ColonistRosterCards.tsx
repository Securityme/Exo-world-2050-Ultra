import { useSetAtom } from 'jotai';
import { HeartPulse } from 'lucide-react';
import { getColonistPortrait } from '../../data/art-manifest.data.ts';
import { useExoStore } from '../../stores/game.store.ts';
import {
  inspectedColonistIdAtom,
  isolated3DModalAtom,
} from '../../stores/selection.atoms.ts';
import { formatSpecialtyLabel } from '../../systems/economy-urban/workforce-assignments.ts';

/**
 * [L7] EXW.L7.COLONIST_ROSTER_CARDS | v4.1.0 | <= 160 lines (R-14)
 * Colonist RPG card roster with clickable 1:1 portraits -> full ColonistDetailModal + Civic Promises.
 */
export function ColonistRosterCards() {
  const world = useExoStore((s) => s.world);
  const setInspectedColonist = useSetAtom(inspectedColonistIdAtom);
  const setIsolated3D = useSetAtom(isolated3DModalAtom);

  return (
    <div className="space-y-4">
      <div className="exo-bento-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm font-bold text-[var(--exo-text)]">
            Fiches Spécialistes ({world.colonists.length}) — Cliquer sur une photo pour inspecter
          </h3>
          <span className="font-mono text-[11px] exo-accent-text">
            Prochaine navette : Tour {world.genese?.nextArrivalCycle ?? world.cycle + 4}
          </span>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {world.colonists.map((col) => {
            const dist = world.districts.find((d) => d.id === col.assignedDistrictId);
            const burnout = col.fatigue >= 80;
            return (
              <div key={col.id} className="exo-surface-sub rounded-xl p-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    data-testid={`colonist-card-photo-${col.id}`}
                    onClick={() => setInspectedColonist(col.id)}
                    className="group flex min-w-0 items-center gap-2.5 text-left"
                  >
                    <img
                      src={getColonistPortrait(col.id, col.specialty)}
                      alt={col.name}
                      className="h-12 w-12 shrink-0 rounded-xl border exo-accent-border object-cover transition group-hover:scale-105 group-hover:ring-2 group-hover:ring-[var(--exo-accent)]"
                    />
                    <div className="min-w-0">
                      <div className="truncate font-display font-bold text-[var(--exo-text)] group-hover:exo-accent-text">
                        {col.name}
                      </div>
                      <span className="inline-block rounded bg-[var(--exo-accent-soft)] px-1.5 py-0.5 font-mono text-[10px] font-bold exo-accent-text">
                        Niv.{col.level ?? 1} · {formatSpecialtyLabel(col.specialty)}
                      </span>
                    </div>
                  </button>
                  {burnout && (
                    <span className="rounded bg-rose-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                      SURMENAGE
                    </span>
                  )}
                </div>

                <div className="mt-2.5 grid grid-cols-4 gap-1.5 font-mono text-[10.5px]">
                  <div className="flex items-center gap-1">
                    <HeartPulse className="h-3 w-3 text-emerald-500" />
                    <span>Santé {col.health ?? 88}%</span>
                  </div>
                  <div>Bonh. {col.happiness ?? col.morale}%</div>
                  <div>Moral {col.morale}%</div>
                  <div>Fat. {col.fatigue}%</div>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t exo-accent-border pt-2 text-[11px]">
                  <span className="font-mono exo-muted-text">
                    Tenue T{col.gear?.outfitTier ?? 1} · Outil T{col.gear?.toolTier ?? 1} · Arme T{col.gear?.weaponTier ?? 1}
                  </span>
                  {dist ? (
                    <button
                      type="button"
                      onClick={() => setIsolated3D({ mode: 'BUILDING', districtId: dist.id })}
                      className="font-semibold exo-accent-text underline hover:opacity-80"
                    >
                      {dist.name} (B3D)
                    </button>
                  ) : (
                    <span className="exo-muted-text">Non affecté</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(world.promises?.length ?? 0) > 0 && (
        <div className="exo-bento-card p-4">
          <h3 className="font-display text-sm font-bold text-[var(--exo-text)]">
            Engagements Civiques &amp; Promesses (PM)
          </h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {world.promises?.map((pm) => (
              <div key={pm.id} className="exo-surface-sub rounded-xl p-3 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span>{pm.title}</span>
                  <span className="font-mono text-[10px] uppercase exo-accent-text">
                    {pm.status} · Échéance T{pm.deadlineCycle}
                  </span>
                </div>
                <p className="mt-1 exo-muted-text">{pm.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
