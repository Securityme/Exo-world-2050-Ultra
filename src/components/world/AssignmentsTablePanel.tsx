import { useSetAtom } from 'jotai';
import { Box, CheckCircle2, Sparkles, Users, Wand2 } from 'lucide-react';
import { getAdvisorPortrait, getColonistPortrait } from '../../data/art-manifest.data.ts';
import {
  handleAssignColonistToDistrict,
  handleAutoAssignColonists,
} from '../../pipelines/game-actions.pipeline.ts';
import { useExoStore } from '../../stores/game.store.ts';
import {
  inspectedColonistIdAtom,
  isolated3DModalAtom,
  toastNoticeAtom,
} from '../../stores/selection.atoms.ts';
import {
  computeColonistEffectiveYieldPct,
  countWorkforceSynergies,
  doesColonistMatchDistrict,
  formatSpecialtyLabel,
  getDistrictOccupantCount,
  MAX_COLONISTS_PER_DISTRICT,
} from '../../systems/economy-urban/workforce-assignments.ts';
import { formatDistrictKind } from '../../utils/ui-labels.ts';

/**
 * [L7] EXW.L7.ASSIGNMENTS_TABLE | v4.1.0 | <= 200 lines (R-14)
 * General Assignment Matrix ("Tableau Général des Affectations") + Cabinet & Drones.
 */
export function AssignmentsTablePanel() {
  const world = useExoStore((s) => s.world);
  const setInspectedColonist = useSetAtom(inspectedColonistIdAtom);
  const setIsolated3D = useSetAtom(isolated3DModalAtom);
  const setToast = useSetAtom(toastNoticeAtom);

  const assignedCount = world.colonists.filter((c) => c.assignedDistrictId !== null).length;
  const synergyCount = countWorkforceSynergies(world);
  const avgMorale = Math.round(
    world.colonists.reduce((acc, c) => acc + c.morale, 0) / Math.max(1, world.colonists.length),
  );
  const totalDrones =
    world.drones.construction + world.drones.defense + world.drones.attack + world.drones.recon;

  const onAutoOptimize = () => {
    const count = handleAutoAssignColonists();
    setToast({
      id: Date.now(),
      tone: 'success',
      text: `Affectations optimisées automatiquement (${count}/${world.colonists.length} colons en poste).`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="exo-bento-card flex flex-wrap items-center justify-between gap-3 p-3.5">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-display text-sm font-bold text-[var(--exo-text)]">
            <Users className="h-4 w-4 exo-accent-text" />
            <span>Tableau Général des Affectations</span>
          </div>
          <span className="exo-accent-chip px-2 py-0.5 font-mono text-[11px]">
            En poste : {assignedCount}/{world.colonists.length}
          </span>
          <span className="exo-accent-chip px-2 py-0.5 font-mono text-[11px] text-emerald-500 dark:text-emerald-300">
            Synergies : {synergyCount}
          </span>
          <span className="exo-accent-chip px-2 py-0.5 font-mono text-[11px]">
            Moral moy. {avgMorale}% · {totalDrones} Drones
          </span>
        </div>

        <button
          type="button"
          data-testid="auto-optimize-assignments-btn"
          onClick={onAutoOptimize}
          className="exo-accent-btn inline-flex min-h-[38px] items-center gap-1.5 px-3.5 text-xs font-bold"
        >
          <Wand2 className="h-3.5 w-3.5" />
          <span>Auto-Optimiser les affectations</span>
        </button>
      </div>

      <div className="exo-bento-card overflow-x-auto p-3">
        <table className="min-w-[680px] w-full text-left text-xs">
          <thead className="border-b exo-accent-border font-mono text-[10px] uppercase exo-accent-text">
            <tr>
              <th className="px-2.5 py-2">Colon (Cliquer photo = Fiche)</th>
              <th className="px-2.5 py-2">Spécialité</th>
              <th className="px-2.5 py-2">État</th>
              <th className="px-2.5 py-2">Quartier Affecté</th>
              <th className="px-2.5 py-2">Rendement</th>
              <th className="px-2.5 py-2 text-right">3D</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--exo-accent-soft)]">
            {world.colonists.map((col) => {
              const dist = world.districts.find((d) => d.id === col.assignedDistrictId) ?? null;
              const syn = dist ? doesColonistMatchDistrict(col.specialty, dist.kind) : false;
              const yieldPct = computeColonistEffectiveYieldPct(col, dist);
              return (
                <tr key={col.id} className="hover:bg-[var(--exo-accent-soft)]/35">
                  <td className="px-2.5 py-2">
                    <button
                      type="button"
                      data-testid={`colonist-photo-btn-${col.id}`}
                      onClick={() => setInspectedColonist(col.id)}
                      className="group flex items-center gap-2.5 text-left"
                    >
                      <img
                        src={getColonistPortrait(col.id, col.specialty)}
                        alt={col.name}
                        className="h-10 w-10 shrink-0 rounded-lg border exo-accent-border object-cover transition group-hover:scale-105 group-hover:ring-2 group-hover:ring-[var(--exo-accent)]"
                      />
                      <div>
                        <div className="font-display font-bold text-[var(--exo-text)] group-hover:exo-accent-text">
                          {col.name}
                        </div>
                        <div className="font-mono text-[10px] exo-muted-text">
                          Niv.{col.level ?? 1} · {col.trait}
                        </div>
                      </div>
                    </button>
                  </td>
                  <td className="px-2.5 py-2 font-mono text-[11px] exo-accent-2-text">
                    {formatSpecialtyLabel(col.specialty)}
                  </td>
                  <td className="px-2.5 py-2 font-mono text-[10.5px]">
                    <span className="text-emerald-600 dark:text-emerald-300">M {col.morale}%</span> ·{' '}
                    <span className={col.fatigue >= 80 ? 'font-bold text-rose-500' : 'exo-muted-text'}>
                      F {col.fatigue}%
                    </span>
                  </td>
                  <td className="px-2.5 py-2">
                    <select
                      aria-label={`Poste de ${col.name}`}
                      value={col.assignedDistrictId ?? ''}
                      onChange={(e) => handleAssignColonistToDistrict(col.id, e.target.value || null)}
                      className="min-h-[34px] w-full max-w-[230px] rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2 font-mono text-[11px] text-[var(--exo-text)]"
                    >
                      <option value="">— Repos —</option>
                      {world.districts.map((d) => {
                        const occ = getDistrictOccupantCount(world, d.id);
                        const full = d.id !== col.assignedDistrictId && occ >= MAX_COLONISTS_PER_DISTRICT;
                        const match = doesColonistMatchDistrict(col.specialty, d.kind);
                        return (
                          <option key={d.id} value={d.id} disabled={full}>
                            {d.name} ({occ}/{MAX_COLONISTS_PER_DISTRICT}){match ? ' ★' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </td>
                  <td className="px-2.5 py-2 font-mono text-[11px]">
                    {dist ? (
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        syn ? 'text-emerald-600 dark:text-emerald-300' : 'exo-muted-text'
                      }`}>
                        {syn ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Sparkles className="h-3 w-3" />}
                        +{yieldPct}% ({formatDistrictKind(dist.kind)})
                      </span>
                    ) : (
                      <span className="exo-muted-text">—</span>
                    )}
                  </td>
                  <td className="px-2.5 py-2 text-right">
                    {dist && (
                      <button
                        type="button"
                        onClick={() => setIsolated3D({ mode: 'BUILDING', districtId: dist.id })}
                        className="exo-accent-chip inline-flex h-8 items-center gap-1 px-2 font-mono text-[10.5px]"
                      >
                        <Box className="h-3 w-3 exo-accent-text" /> B3D
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {world.advisors.map((adv) => (
          <div key={adv.id} className="exo-bento-card flex items-center gap-3 p-2.5">
            <img
              src={getAdvisorPortrait(adv.id)}
              alt={adv.name}
              className="h-12 w-12 shrink-0 rounded-xl border exo-accent-border object-cover"
            />
            <div className="min-w-0 text-xs">
              <div className="font-mono text-[10px] font-bold uppercase exo-accent-text">
                {adv.domain} · Niv. {adv.xpLevel}
              </div>
              <div className="truncate font-display font-bold text-[var(--exo-text)]">{adv.name}</div>
              <div className="truncate text-[10.5px] exo-muted-text">{adv.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
