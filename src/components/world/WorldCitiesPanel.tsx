import { useSetAtom } from 'jotai';
import { AlertTriangle, Box, Coins, Globe2, Hammer } from 'lucide-react';
import { PLANETARY_SLOTS_CATALOG } from '../../data/world.catalog.ts';
import { handleGenerateActionEvent } from '../../pipelines/game-actions.pipeline.ts';
import { useExoStore } from '../../stores/game.store.ts';
import {
  activeDossierIdAtom,
  activeSubscreenAtom,
  isolated3DModalAtom,
  toastNoticeAtom,
} from '../../stores/selection.atoms.ts';
import type { evaluateEntityLedger } from '../../systems/economy-urban/entity-ledger.ts';
import type { ResourceForecastReport } from '../../systems/economy-urban/resource-forecast.ts';
import { formatDistrictKind } from '../../utils/ui-labels.ts';

interface WorldCitiesPanelProps {
  readonly subView: 'DISTRICTS' | 'PLANETS_FINANCE';
  readonly forecast: ResourceForecastReport;
  readonly ledger: ReturnType<typeof evaluateEntityLedger>;
}

/**
 * [L7] EXW.L7.WORLD_CITIES_PANEL | v4.1.0 | <= 200 lines (R-14)
 * Level-2 views under Monde -> Territoires & Cités (Quartiers | Planètes & Finances).
 */
export function WorldCitiesPanel({ subView, forecast, ledger }: WorldCitiesPanelProps) {
  const world = useExoStore((s) => s.world);
  const setActiveSlot = useExoStore((s) => s.setActiveSlot);
  const setActiveScale = useExoStore((s) => s.setActiveScale);
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
    setActiveDossierId(dossier.id);
  };

  if (subView === 'PLANETS_FINANCE') {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {PLANETARY_SLOTS_CATALOG.map((slot) => {
            const unlocked = slot.slotIndex <= world.unlockedSlots;
            const active = slot.slotIndex === world.activeSlotIndex;
            return (
              <div key={slot.slotIndex} className="exo-bento-card flex flex-col justify-between p-3.5 text-xs">
                <div>
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px] font-bold">
                    <span className="exo-accent-text">SLOT #{slot.slotIndex} · {slot.bodyType}</span>
                    <span className={unlocked ? 'text-emerald-600 dark:text-emerald-300' : 'exo-muted-text'}>
                      {active ? 'ACTIF' : unlocked ? 'DÉBLOQUÉ' : `ÈRE ${slot.unlockEra}`}
                    </span>
                  </div>
                  <h3 className="mt-1 font-display text-sm font-bold text-[var(--exo-text)]">{slot.name}</h3>
                  <p className="mt-1 exo-muted-text">Ressources : {slot.signatureResource}</p>
                </div>
                <button
                  type="button"
                  disabled={!unlocked}
                  onClick={() => {
                    setActiveSlot(slot.slotIndex);
                    setActiveScale(2);
                    setSubscreen('NONE');
                  }}
                  className="exo-accent-chip mt-3 inline-flex min-h-[36px] items-center justify-center gap-1.5 font-mono text-[11px] font-bold disabled:opacity-45"
                >
                  <Globe2 className="h-3.5 w-3.5 exo-accent-text" />
                  <span>{unlocked ? 'Observer sur le Globe 3D' : `Verrouillé (Ère ${slot.unlockEra})`}</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="exo-bento-card flex flex-wrap items-center justify-between gap-3 p-4 text-xs">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase exo-accent-text">
              Trésorerie &amp; Marché Fédéral
            </div>
            <div className="mt-0.5 font-display text-sm font-bold text-[var(--exo-text)]">
              Cote {world.finance.solvencyRating} · Solde net {forecast.netCreditsPerCycle >= 0 ? `+${forecast.netCreditsPerCycle}` : forecast.netCreditsPerCycle} Cr/tour
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openActionDossier({ kind: 'MARKET_TRADE', resource: 'materials', action: 'BUY', quantity: 20 })}
              className="exo-accent-chip inline-flex min-h-[38px] items-center gap-1.5 px-3 font-semibold"
            >
              <Hammer className="h-3.5 w-3.5 exo-accent-text" />
              <span>Acheter 20 Matériaux</span>
            </button>
            <button
              type="button"
              onClick={() => openActionDossier({ kind: 'BANK_LOAN', principal: 400 })}
              className="exo-accent-btn inline-flex min-h-[38px] items-center gap-1.5 px-3 font-bold"
            >
              <Coins className="h-3.5 w-3.5" />
              <span>Emprunt Fédéral (+400 Cr)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-4">
        {forecast.metrics.map((m) => (
          <div key={m.id} className="exo-surface-sub rounded-xl p-2.5 text-xs">
            <div className="flex items-center justify-between font-mono">
              <span className="font-semibold text-[var(--exo-text)]">{m.label}</span>
              <span className={`font-bold ${m.deltaPerCycle >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-500'}`}>
                {m.deltaPerCycle >= 0 ? `+${m.deltaPerCycle}` : m.deltaPerCycle}/t
              </span>
            </div>
            <div className="mt-1 font-display text-base font-bold text-[var(--exo-text)]">
              {m.stock} <span className="text-[11px] font-normal exo-muted-text">{m.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {world.districts.map((dist) => {
          const row = ledger.rows.find((r) => r.districtId === dist.id);
          const assigned = world.colonists.filter((c) => c.assignedDistrictId === dist.id);
          return (
            <div key={dist.id} className="exo-bento-card flex flex-col justify-between p-3.5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase exo-accent-text">
                      {formatDistrictKind(dist.kind)} · Niv. {dist.level}
                    </span>
                    <h3 className="font-display text-sm font-bold text-[var(--exo-text)]">{dist.name}</h3>
                  </div>
                  <span className={`rounded-lg px-2 py-0.5 font-mono text-[10.5px] font-bold ${
                    dist.integrity < 55 ? 'bg-rose-500/15 text-rose-500' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                  }`}>
                    {dist.integrity}%
                  </span>
                </div>

                {row && (
                  <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[10.5px]">
                    <span className="exo-surface-sub rounded px-1.5 py-0.5">
                      Énerg {row.energyNet >= 0 ? `+${row.energyNet}` : row.energyNet}
                    </span>
                    <span className="exo-surface-sub rounded px-1.5 py-0.5">
                      Cr {row.creditsNet >= 0 ? `+${row.creditsNet}` : row.creditsNet}
                    </span>
                    <span className="exo-surface-sub rounded px-1.5 py-0.5">
                      Ext {dist.modulesCount}/3 · Colons {assigned.length}/2
                    </span>
                    {row.underPowered && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/20 px-1.5 py-0.5 font-bold text-amber-600 dark:text-amber-300">
                        <AlertTriangle className="h-3 w-3" /> Sous-tension
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-2 border-t exo-accent-border pt-2.5">
                <button
                  type="button"
                  onClick={() => setIsolated3D({ mode: 'BUILDING', districtId: dist.id })}
                  className="exo-accent-btn inline-flex min-h-[36px] flex-1 items-center justify-center gap-1.5 px-3 text-xs font-bold"
                >
                  <Box className="h-3.5 w-3.5" />
                  <span>Inspecter 3D (B3D)</span>
                </button>
                <button
                  type="button"
                  disabled={dist.modulesCount >= 3}
                  onClick={() => openActionDossier({ kind: 'GRAFT_MODULE', districtId: dist.id })}
                  className="exo-accent-chip inline-flex min-h-[36px] items-center justify-center gap-1 px-2.5 text-xs font-semibold disabled:opacity-45"
                >
                  <Hammer className="h-3.5 w-3.5 exo-accent-text" />
                  <span>Ext.</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
