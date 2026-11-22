import { useMemo } from 'react';
import { useSetAtom } from 'jotai';
import { Activity, Building2, Coins, Globe2, Plus, Sparkles } from 'lucide-react';
import { PLANETARY_SLOTS_CATALOG } from '../../data/world.catalog.ts';
import { handleGenerateActionEvent } from '../../pipelines/game-actions.pipeline.ts';
import { useExoStore } from '../../stores/game.store.ts';
import { activeDossierIdAtom, toastNoticeAtom } from '../../stores/selection.atoms.ts';
import type { ActionEventRequest } from '../../systems/dossiers-pa/action-event-generator.ts';
import { computeResourceForecast } from '../../systems/economy-urban/resource-forecast.ts';

/**
 * [L7] FUP-004 | SM-03 | SADT A3.3 / A3.4
 * Planetary Slots 1..6, Live Resource & Production Chains Balance,
 * Open-Sky Solarpunk Districts, Federal Bank & Market — ALL routed exclusively
 * through the Event Generator (DossierWorkshopModal arbitration).
 */
const DISTRICT_PRODUCTION_LABEL: Record<string, string> = {
  COMMAND: 'Taxes fédérales & Coordination',
  HABITAT: 'Vivres Hydroponiques & Taxes',
  ENERGY: 'Énergie Solaire (+15% Été)',
  INDUSTRY: 'Matériaux & Électronique Fine',
  DATACENTER: 'Puissance Calcul (Cyber)',
  BIOPARK: 'Eau, Kits O₂ & Terraformation',
  SPACEPORT: 'Transit Orbital & Influence',
};

export function WorldCitiesTab() {
  const world = useExoStore((s) => s.world);
  const setActiveSlot = useExoStore((s) => s.setActiveSlot);
  const setActiveScale = useExoStore((s) => s.setActiveScale);
  const setToast = useSetAtom(toastNoticeAtom);
  const setActiveDossierId = useSetAtom(activeDossierIdAtom);

  const forecast = useMemo(() => computeResourceForecast(world), [world]);

  const dispatchViaEventGenerator = (request: ActionEventRequest) => {
    const [error, dossier] = handleGenerateActionEvent(request);
    if (error || !dossier) {
      setToast({
        id: Date.now(),
        tone: 'error',
        text: error?.message ?? 'Impossible de générer cet événement.',
      });
      return;
    }
    setActiveDossierId(dossier.id);
    setToast({
      id: Date.now(),
      tone: 'info',
      text: `Événement généré : « ${dossier.title} » — choisissez votre option.`,
    });
  };

  return (
    <div className="space-y-5">
      {/* Event-Gateway Notice Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-300/80 bg-rose-50/80 px-3.5 py-2.5 text-xs dark:border-rose-800/70 dark:bg-rose-950/40">
        <div className="flex items-center gap-2 text-[#1f1224] dark:text-rose-100">
          <Sparkles className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
          <span>
            <strong>Gestion par Événements :</strong> chaque chantier, emprunt ou ordre de marché ouvre un dossier multi-choix.
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/70 bg-amber-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-900 dark:text-amber-200">
          <Activity className="h-3.5 w-3.5" /> Usure {forecast.maintenanceLoadPct}%
        </span>
      </div>

      {/* Live Resource Production & Flow Matrix */}
      <div className="rounded-xl border border-rose-200/90 bg-white/90 p-4 dark:border-rose-900/60 dark:bg-[#190d1f]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm font-bold text-[#1f1224] dark:text-rose-50">
            Bilan des Ressources &amp; Flux par Cycle
          </h3>
          <span className="font-mono text-[11px] text-rose-900/70 dark:text-rose-200/75">
            Saison : {world.season} · Météo : {world.weatherState}
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {forecast.metrics.map((m) => (
            <div
              key={m.id}
              className={`rounded-lg border p-2.5 ${
                m.tone === 'critical'
                  ? 'border-rose-400 bg-rose-500/10 dark:border-rose-500/70 dark:bg-rose-500/15'
                  : m.tone === 'warning'
                    ? 'border-amber-300 bg-amber-500/10 dark:border-amber-500/60 dark:bg-amber-500/15'
                    : 'border-rose-200/80 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/25'
              }`}
            >
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="font-semibold text-[#1f1224] dark:text-rose-50">{m.label}</span>
                <span
                  className={`font-bold ${
                    m.deltaPerCycle >= 0
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {m.deltaPerCycle >= 0 ? `+${m.deltaPerCycle}` : m.deltaPerCycle}/c
                </span>
              </div>
              <div className="mt-1 font-mono-num text-base font-bold text-rose-700 dark:text-rose-200">
                {m.stock} <span className="text-[11px] font-normal text-rose-900/65 dark:text-rose-200/70">{m.unit}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-[10.5px] leading-snug text-rose-900/70 dark:text-rose-200/75">
                {m.producerHint}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 font-display text-sm font-bold text-[#1f1224] dark:text-rose-100">
            <Globe2 className="h-4 w-4 text-rose-600 dark:text-rose-300" />
            Mondes &amp; Avant-Postes · Débloqués : {world.unlockedSlots}/6
          </h3>
          <button
            type="button"
            onClick={() => setActiveScale(3)}
            className="min-h-[44px] rounded-lg border border-rose-300 bg-rose-50 px-3 text-xs font-semibold text-rose-800 hover:border-rose-500 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-100"
          >
            Ouvrir la Ville 3D
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {PLANETARY_SLOTS_CATALOG.map((slot) => {
            const unlocked = slot.slotIndex <= world.unlockedSlots;
            const active = slot.slotIndex === world.activeSlotIndex;
            return (
              <button
                key={slot.slotIndex}
                type="button"
                disabled={!unlocked}
                onClick={() => setActiveSlot(slot.slotIndex)}
                className={`min-h-[44px] rounded-xl border p-2.5 text-left transition ${
                  active
                    ? 'border-rose-500 bg-rose-500/15 shadow-sm dark:border-rose-400 dark:bg-rose-500/20'
                    : unlocked
                      ? 'border-rose-200 bg-white/85 hover:border-rose-400 dark:border-rose-900/60 dark:bg-rose-950/30'
                      : 'border-rose-200/50 bg-rose-50/40 opacity-55 dark:border-rose-900/40 dark:bg-rose-950/15'
                }`}
              >
                <div className="font-mono text-[10px] font-semibold text-rose-600 dark:text-rose-300">
                  MONDE {slot.slotIndex}
                </div>
                <div className="text-xs font-semibold text-[#1f1224] dark:text-rose-50">{slot.name}</div>
                <div className="mt-1 font-mono text-[10px] text-rose-900/65 dark:text-rose-200/70">
                  {unlocked ? slot.bodyType : `Ère ${slot.unlockEra} requise`}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-rose-200/90 bg-white/85 p-4 dark:border-rose-900/60 dark:bg-[#190d1f]">
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-[#1f1224] dark:text-rose-100">
            <Building2 className="h-4 w-4 text-rose-600 dark:text-rose-300" />
            Quartiers Urbains (max 3 extensions · via Événement)
          </h3>
          <div className="space-y-2">
            {world.districts.map((dist) => (
              <div
                key={dist.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200/80 bg-rose-50/60 px-3 py-2.5 dark:border-rose-900/50 dark:bg-rose-950/30"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#1f1224] dark:text-rose-50">
                    {dist.name} <span className="font-mono text-rose-600 dark:text-rose-300">Niv.{dist.level}</span>
                  </div>
                  <div className="mt-0.5 font-mono text-[10.5px] text-emerald-700 dark:text-emerald-300">
                    {DISTRICT_PRODUCTION_LABEL[dist.kind] ?? dist.kind}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-rose-900/70 dark:text-rose-200/75">
                    Extensions {dist.modulesCount}/3 · Intégrité {dist.integrity}%
                  </div>
                </div>
                <button
                  type="button"
                  disabled={dist.modulesCount >= 3}
                  onClick={() => dispatchViaEventGenerator({ kind: 'GRAFT_MODULE', districtId: dist.id })}
                  className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-rose-300 bg-white px-3 text-xs font-semibold text-rose-800 hover:border-rose-500 disabled:opacity-35 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-100"
                >
                  <Plus className="h-3.5 w-3.5 text-rose-600 dark:text-rose-300" />
                  Chantier (140 Cr · 30 Mat.)
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-rose-200/90 bg-white/85 p-4 dark:border-rose-900/60 dark:bg-[#190d1f]">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold text-[#1f1224] dark:text-rose-100">
              <Coins className="h-4 w-4 text-rose-600 dark:text-rose-300" />
              Banque Fédérale &amp; Marché (via Événement)
            </h3>
            <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-xs font-bold text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300">
              Cote {world.finance.solvencyRating}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono text-xs">
            <div className="rounded-lg border border-rose-200/70 bg-rose-50/60 p-2.5 dark:border-rose-900/50 dark:bg-rose-950/30">
              <div className="text-[10px] text-rose-900/65 dark:text-rose-200/70">Taxes/cycle</div>
              <div className="font-bold text-emerald-700 dark:text-emerald-300">+{forecast.taxIncome}</div>
            </div>
            <div className="rounded-lg border border-rose-200/70 bg-rose-50/60 p-2.5 dark:border-rose-900/50 dark:bg-rose-950/30">
              <div className="text-[10px] text-rose-900/65 dark:text-rose-200/70">Maintenance</div>
              <div className="font-bold text-amber-700 dark:text-amber-300">-{forecast.upkeepCost}</div>
            </div>
            <div className="rounded-lg border border-rose-200/70 bg-rose-50/60 p-2.5 dark:border-rose-900/50 dark:bg-rose-950/30">
              <div className="text-[10px] text-rose-900/65 dark:text-rose-200/70">Kits Resp.</div>
              <div className="font-bold text-rose-700 dark:text-rose-300">-{forecast.respiratoryCost}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[400, 900].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => dispatchViaEventGenerator({ kind: 'BANK_LOAN', principal: amount })}
                className="min-h-[44px] flex-1 rounded-lg border border-rose-300 bg-rose-50 px-3 text-xs font-semibold text-rose-800 hover:border-rose-500 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-100"
              >
                Demander emprunt +{amount} Cr ({world.finance.loans.length}/3)
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            {(['materials', 'water', 'food', 'electronics', 'helium3'] as const).map((resKey) => {
              const labelMap: Record<typeof resKey, string> = {
                materials: 'Matériaux',
                water: 'Eau',
                food: 'Vivres',
                electronics: 'Électronique',
                helium3: 'Hélium-3',
              };
              return (
                <div
                  key={resKey}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-200/80 bg-rose-50/50 px-3 py-2 text-xs dark:border-rose-900/50 dark:bg-rose-950/25"
                >
                  <div>
                    <span className="font-mono font-semibold text-[#1f1224] dark:text-rose-100">
                      {labelMap[resKey]} · {world.marketPrices[resKey]} Cr/u
                    </span>
                    <span className="ml-2 font-mono text-[10.5px] text-rose-900/65 dark:text-rose-200/70">
                      (Stock : {world.resources[resKey]})
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        dispatchViaEventGenerator({
                          kind: 'MARKET_TRADE',
                          resource: resKey,
                          action: 'BUY',
                          quantity: 20,
                        })
                      }
                      className="min-h-[44px] rounded-lg bg-emerald-500/15 px-3 font-mono text-[11px] font-semibold text-emerald-800 hover:bg-emerald-500/25 dark:bg-emerald-500/25 dark:text-emerald-200"
                    >
                      +20 Achat
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        dispatchViaEventGenerator({
                          kind: 'MARKET_TRADE',
                          resource: resKey,
                          action: 'SELL',
                          quantity: 20,
                        })
                      }
                      className="min-h-[44px] rounded-lg bg-rose-500/15 px-3 font-mono text-[11px] font-semibold text-rose-800 hover:bg-rose-500/25 dark:bg-rose-500/25 dark:text-rose-200"
                    >
                      -20 Vente
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
