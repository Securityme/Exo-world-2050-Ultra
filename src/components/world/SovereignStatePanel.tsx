import { useMemo } from 'react';
import { Building2, Globe2, Landmark, ShieldCheck } from 'lucide-react';
import { useExoStore } from '../../stores/game.store.ts';
import { buildSovereignStateTechnicalSheet } from '../../systems/economy-urban/citizens-society.ts';

/**
 * [L7] EXW.L7.SOVEREIGN_STATE_PANEL | v5.0.0 | SADT A3.1
 * Read-Only Sovereign State Technical Sheet (Pays / Empire / Royaume / Fédération / Démocratie)
 * + Planet Roster with owned city counts.
 */
export function SovereignStatePanel() {
  const world = useExoStore((s) => s.world);
  const setActiveSlot = useExoStore((s) => s.setActiveSlot);
  const sheet = useMemo(() => buildSovereignStateTechnicalSheet(world), [world]);

  return (
    <div className="space-y-4">
      <div className="exo-bento-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3 exo-accent-border">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10.5px] font-bold uppercase exo-accent-2-text">
              <Landmark className="h-3.5 w-3.5" />
              <span>Fiche Technique Souveraine · {sheet.regimeType}</span>
            </div>
            <h3 className="mt-1 font-display text-lg font-bold">
              {sheet.stateName} — {sheet.eraTitle}
            </h3>
            <p className="mt-0.5 text-xs exo-muted-text">{sheet.constitutionSummary}</p>
          </div>
          <span className="exo-accent-chip px-2.5 py-1 font-mono text-xs font-bold">
            Cote {sheet.solvencyRating} · Stabilité {sheet.stabilityIndex}%
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 font-mono text-xs">
          <div className="exo-surface-sub rounded-xl p-2.5">
            <div className="text-[10px] exo-muted-text">Capitale</div>
            <div className="mt-0.5 font-bold truncate">{sheet.capitalCity}</div>
          </div>
          <div className="exo-surface-sub rounded-xl p-2.5">
            <div className="text-[10px] exo-muted-text">Planètes / Cités</div>
            <div className="mt-0.5 font-bold exo-accent-text">
              {sheet.ownedPlanetsCount}/6 mondes · {sheet.totalCitiesCount} cité(s)
            </div>
          </div>
          <div className="exo-surface-sub rounded-xl p-2.5">
            <div className="text-[10px] exo-muted-text">Secteurs Souverains</div>
            <div className="mt-0.5 font-bold">{sheet.controlledSectors} / 72</div>
          </div>
          <div className="exo-surface-sub rounded-xl p-2.5">
            <div className="text-[10px] exo-muted-text">Biosphère</div>
            <div className="mt-0.5 font-bold text-emerald-500 dark:text-emerald-300">
              {sheet.atmosphereLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Planet Roster with Owned City Counts */}
      <div className="exo-bento-card space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 font-display text-sm font-bold exo-accent-text">
            <Globe2 className="h-4 w-4" />
            Planètes du Domaine (6 Mondes &amp; Nombre de Cités)
          </h4>
          <span className="font-mono text-[10.5px] exo-muted-text">Vue Statistique Lecture Seule</span>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {sheet.planetRoster.map((planet) => (
            <div
              key={planet.slotIndex}
              className={`rounded-xl border p-3 text-xs ${
                planet.slotIndex === world.activeSlotIndex
                  ? 'exo-accent-chip-active'
                  : 'exo-surface-sub exo-accent-border'
              }`}
            >
              <div className="flex items-center justify-between gap-2 font-bold">
                <span className="truncate">{planet.planetName}</span>
                <span className="font-mono text-[10px] exo-accent-2-text">#{planet.slotIndex}</span>
              </div>
              <div className="mt-1 flex items-center justify-between font-mono text-[11px] exo-muted-text">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {planet.ownedCitiesCount} cité(s)
                </span>
                <span>{planet.statusLabel}</span>
              </div>
              {planet.unlocked && planet.slotIndex !== world.activeSlotIndex && (
                <button
                  type="button"
                  onClick={() => setActiveSlot(planet.slotIndex)}
                  className="exo-accent-chip mt-2 inline-flex min-h-[30px] items-center gap-1 px-2 font-mono text-[10px] font-semibold"
                >
                  <ShieldCheck className="h-3 w-3" />
                  Basculer sur ce monde
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
