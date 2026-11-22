import { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  Activity,
  Building2,
  Coins,
  Compass,
  Flame,
  Globe2,
  Hammer,
  Maximize2,
  Minimize2,
  Radar,
  Shield,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import { PLANETARY_SLOTS_CATALOG } from '../data/world.catalog.ts';
import { handleGenerateActionEvent } from '../pipelines/game-actions.pipeline.ts';
import { useExoStore } from '../stores/game.store.ts';
import {
  activeDossierIdAtom,
  activeSubscreenAtom,
  inspectedEntityAtom,
  isolated3DModalAtom,
  toastNoticeAtom,
  viewportOverlayModeAtom,
} from '../stores/selection.atoms.ts';
import { computeResourceForecast } from '../systems/economy-urban/resource-forecast.ts';
import { formatAtmosphereStageName } from '../utils/atmosphere-labels.ts';
import { formatDistrictKind } from '../utils/ui-labels.ts';

/**
 * [L7] Dedicated Window / Fullscreen Inspector opened when clicking any 3D entity:
 * - Scale 1 (Space): Planet / Colony Slot
 * - Scale 2 (Planet): Geodesic Sector (#0..71)
 * - Scale 3 (City): Urban District / Building
 * All operational actions route strictly through the Event Generator.
 */
export function EntityWindowModal() {
  const [entity, setEntity] = useAtom(inspectedEntityAtom);
  const [fullscreen, setFullscreen] = useState(false);

  const world = useExoStore((s) => s.world);
  const setActiveScale = useExoStore((s) => s.setActiveScale);
  const setActiveSlot = useExoStore((s) => s.setActiveSlot);

  const setActiveDossierId = useSetAtom(activeDossierIdAtom);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
  const setOverlayMode = useSetAtom(viewportOverlayModeAtom);
  const setIsolated3D = useSetAtom(isolated3DModalAtom);
  const setToast = useSetAtom(toastNoticeAtom);

  if (!entity) return null;

  const forecast = computeResourceForecast(world);

  const closeWindow = () => {
    setFullscreen(false);
    setEntity(null);
  };

  const triggerEventAction = (
    request: Parameters<typeof handleGenerateActionEvent>[0],
    fallbackLabel: string,
  ) => {
    const [err, dossier] = handleGenerateActionEvent(request);
    if (err || !dossier) {
      setToast({ id: Date.now(), tone: 'error', text: err?.message ?? fallbackLabel });
      return;
    }
    closeWindow();
    setActiveDossierId(dossier.id);
  };

  // Resolve header metadata based on clicked 3D entity
  let badge = 'Entité 3D';
  let title = 'Inspection';
  let Icon = Globe2;

  const district =
    entity.kind === 'DISTRICT'
      ? world.districts.find((d) => d.id === entity.districtId) ?? null
      : null;
  const planetSlot =
    entity.kind === 'WORLD'
      ? PLANETARY_SLOTS_CATALOG.find((s) => s.slotIndex === entity.slotIndex) ??
        PLANETARY_SLOTS_CATALOG[0]
      : null;

  if (entity.kind === 'DISTRICT' && district) {
    badge = `Quartier · ${formatDistrictKind(district.kind)}`;
    title = district.name;
    Icon = Building2;
  } else if (entity.kind === 'SECTOR') {
    const isPlayer = world.capturedTiles.includes(entity.tileIndex);
    const isRival = world.rivalTiles.includes(entity.tileIndex);
    badge = isPlayer ? 'Secteur contrôlé' : isRival ? 'Secteur rival' : 'Secteur neutre';
    title = `Secteur #${entity.tileIndex}`;
    Icon = Compass;
  } else if (entity.kind === 'WORLD' && planetSlot) {
    badge = planetSlot.slotIndex <= world.unlockedSlots ? 'Monde accessible' : `Verrouillé · Ère ${planetSlot.unlockEra}`;
    title = planetSlot.name;
    Icon = Globe2;
  }

  return (
    <div
      className={`fixed inset-0 z-40 flex justify-center bg-rose-950/30 dark:bg-[#0d0611]/75 ${
        fullscreen ? 'items-stretch p-0' : 'items-end p-0 sm:items-center sm:p-6'
      }`}
    >
      <div
        role="dialog"
        aria-label={`Fenêtre ${title}`}
        className={`exo-bento-card exo-astral-ticks flex w-full flex-col ${
          fullscreen
            ? 'h-[100dvh] max-w-none rounded-none'
            : 'max-h-[86dvh] max-w-xl rounded-t-2xl sm:max-h-[82vh] sm:rounded-2xl'
        }`}
      >
        {/* Header with Window / Fullscreen Toggle */}
        <div className="flex items-center justify-between gap-3 border-b border-rose-200 px-4 py-3 dark:border-rose-900/60 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-700 dark:bg-rose-500/25 dark:text-rose-200">
              <Icon className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-300">
                {badge}
              </div>
              <h2 className="truncate font-display text-base font-bold text-[#1f1224] dark:text-rose-50 sm:text-lg">
                {title}
              </h2>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFullscreen((f) => !f)}
              aria-label={fullscreen ? 'Revenir en fenêtre' : 'Passer en plein écran'}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 bg-white/85 px-2.5 font-mono text-[11px] font-semibold text-rose-900 hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{fullscreen ? 'Fenêtre' : 'Plein écran'}</span>
            </button>
            <button
              type="button"
              onClick={closeWindow}
              aria-label="Fermer la fenêtre entité"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-white/85 text-rose-900 hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {entity.kind === 'DISTRICT' && district && (
            <>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="rounded-xl border border-rose-200/80 bg-white/85 p-3 dark:border-rose-900/60 dark:bg-[#190d1f]">
                  <div className="font-mono text-[10px] uppercase text-rose-900/65 dark:text-rose-200/70">Niveau</div>
                  <div className="mt-1 font-display text-lg font-bold text-[#1f1224] dark:text-rose-50">
                    Niv. {district.level}
                  </div>
                </div>
                <div className="rounded-xl border border-rose-200/80 bg-white/85 p-3 dark:border-rose-900/60 dark:bg-[#190d1f]">
                  <div className="font-mono text-[10px] uppercase text-rose-900/65 dark:text-rose-200/70">Extensions</div>
                  <div className="mt-1 font-display text-lg font-bold text-rose-700 dark:text-rose-300">
                    {district.modulesCount} / 3
                  </div>
                </div>
                <div className="rounded-xl border border-rose-200/80 bg-white/85 p-3 dark:border-rose-900/60 dark:bg-[#190d1f]">
                  <div className="font-mono text-[10px] uppercase text-rose-900/65 dark:text-rose-200/70">État</div>
                  <div
                    className={`mt-1 font-display text-lg font-bold ${
                      district.integrity < 60
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {district.integrity}%
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-rose-200/80 bg-rose-50/70 p-3.5 text-xs leading-relaxed text-[#1f1224] dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-100">
                <div className="flex items-center justify-between gap-2 font-mono text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                  <span>Indice d’usure réseau : {forecast.maintenanceLoadPct}%</span>
                  <span>Position ({district.gridX}, {district.gridZ})</span>
                </div>
                <p className="mt-1.5">
                  Ajouter une extension augmente la production de ce quartier, améliore son état (+8%) et ouvre un dossier multi-choix pour ajuster l’investissement.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-rose-900/65 dark:text-rose-200/75">
                  Actions (via le Générateur d’Événements)
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={district.modulesCount >= 3}
                    onClick={() =>
                      triggerEventAction(
                        { kind: 'GRAFT_MODULE', districtId: district.id },
                        'Extension indisponible.',
                      )
                    }
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-rose-600 px-3.5 text-xs font-bold text-white shadow-sm hover:bg-rose-500 disabled:opacity-45"
                  >
                    <Hammer className="h-4 w-4" />
                    <span>
                      {district.modulesCount >= 3
                        ? 'Extensions au maximum (3/3)'
                        : 'Construire une extension'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      triggerEventAction(
                        { kind: 'REASSIGN_DRONE', fromRole: 'recon', toRole: 'construction' },
                        'Réaffectation indisponible.',
                      )
                    }
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3.5 text-xs font-semibold text-rose-800 hover:border-rose-500 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-100"
                  >
                    <Wrench className="h-4 w-4" />
                    <span>Affecter un drone d’entretien</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsolated3D({ mode: 'BUILDING', districtId: district.id });
                      closeWindow();
                    }}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 text-xs font-semibold text-amber-900 hover:border-amber-500 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
                  >
                    <Flame className="h-4 w-4" />
                    <span>Ouvrir l’Inspecteur 3D Isolé (B3D)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      closeWindow();
                      setSubscreen('WORLDS_HUB');
                    }}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white/90 px-3.5 text-xs font-semibold text-[#1f1224] hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100"
                  >
                    <Activity className="h-4 w-4 text-rose-600 dark:text-rose-300" />
                    <span>Ouvrir le bilan des quartiers</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {entity.kind === 'SECTOR' && (
            <>
              {(() => {
                const isPlayer = world.capturedTiles.includes(entity.tileIndex);
                const isRival = world.rivalTiles.includes(entity.tileIndex);
                const sectorWear = Math.min(95, Math.max(12, forecast.maintenanceLoadPct + ((entity.tileIndex * 7) % 19) - 9));
                const linkedDossier = world.activeDossiers.find((d) => d.tileIndex === entity.tileIndex);

                return (
                  <>
                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      <div className="rounded-xl border border-rose-200/80 bg-white/85 p-3 dark:border-rose-900/60 dark:bg-[#190d1f]">
                        <div className="font-mono text-[10px] uppercase text-rose-900/65 dark:text-rose-200/70">Statut</div>
                        <div className="mt-1 font-display text-sm font-bold text-[#1f1224] dark:text-rose-50">
                          {isPlayer ? 'Contrôlé' : isRival ? 'Rival' : 'Neutre'}
                        </div>
                      </div>
                      <div className="rounded-xl border border-rose-200/80 bg-white/85 p-3 dark:border-rose-900/60 dark:bg-[#190d1f]">
                        <div className="font-mono text-[10px] uppercase text-rose-900/65 dark:text-rose-200/70">Usure</div>
                        <div className="mt-1 font-display text-sm font-bold text-amber-700 dark:text-amber-300">
                          {sectorWear}%
                        </div>
                      </div>
                      <div className="rounded-xl border border-rose-200/80 bg-white/85 p-3 dark:border-rose-900/60 dark:bg-[#190d1f]">
                        <div className="font-mono text-[10px] uppercase text-rose-900/65 dark:text-rose-200/70">Territoire</div>
                        <div className="mt-1 font-display text-sm font-bold text-emerald-700 dark:text-emerald-300">
                          {world.capturedTiles.length}/72
                        </div>
                      </div>
                    </div>

                    {linkedDossier && (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-300 bg-rose-50/85 p-3 text-xs dark:border-rose-700 dark:bg-rose-950/45">
                        <div>
                          <div className="font-mono text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300">
                            Événement actif sur ce secteur
                          </div>
                          <div className="font-semibold text-[#1f1224] dark:text-rose-50">{linkedDossier.title}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            closeWindow();
                            setActiveDossierId(linkedDossier.id);
                          }}
                          className="min-h-[38px] rounded-lg bg-rose-600 px-3 text-xs font-bold text-white hover:bg-rose-500"
                        >
                          Traiter
                        </button>
                      </div>
                    )}

                    <div className="grid gap-2 sm:grid-cols-2">
                      {!isPlayer ? (
                        <button
                          type="button"
                          onClick={() =>
                            triggerEventAction(
                              { kind: 'LAUNCH_COMBAT', targetTileIndex: entity.tileIndex },
                              'Opération indisponible.',
                            )
                          }
                          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-rose-600 px-3.5 text-xs font-bold text-white shadow-sm hover:bg-rose-500"
                        >
                          <Shield className="h-4 w-4" />
                          <span>Sécuriser le secteur (Événement)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveScale(3);
                            closeWindow();
                          }}
                          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-rose-600 px-3.5 text-xs font-bold text-white shadow-sm hover:bg-rose-500"
                        >
                          <Building2 className="h-4 w-4" />
                          <span>Descendre en Vue Ville 3D</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setOverlayMode('MAINTENANCE');
                          closeWindow();
                        }}
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 text-xs font-semibold text-amber-900 hover:border-amber-500 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
                      >
                        <Radar className="h-4 w-4" />
                        <span>Scanner la maintenance en 3D</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          triggerEventAction(
                            { kind: 'MARKET_TRADE', resource: 'materials', action: 'BUY', quantity: 20 },
                            'Ordre de marché indisponible.',
                          )
                        }
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white/90 px-3.5 text-xs font-semibold text-[#1f1224] hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100"
                      >
                        <Coins className="h-4 w-4 text-rose-600 dark:text-rose-300" />
                        <span>Commander 20 Matériaux</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          closeWindow();
                          setSubscreen('EVENTS_HUB');
                        }}
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white/90 px-3.5 text-xs font-semibold text-[#1f1224] hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100"
                      >
                        <Sparkles className="h-4 w-4 text-rose-600 dark:text-rose-300" />
                        <span>Voir tous les événements</span>
                      </button>
                    </div>
                  </>
                );
              })()}
            </>
          )}

          {entity.kind === 'WORLD' && planetSlot && (
            <>
              <div className="rounded-xl border border-rose-200/80 bg-rose-50/70 p-3.5 text-xs leading-relaxed text-[#1f1224] dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-100">
                <div className="font-semibold">{planetSlot.bodyType}</div>
                <p className="mt-1 text-rose-950/80 dark:text-rose-200/80">
                  <strong>Ressources clés :</strong> {planetSlot.signatureResource}
                </p>
                <p className="mt-1 text-rose-950/80 dark:text-rose-200/80">
                  <strong>Atmosphère actuelle :</strong> {formatAtmosphereStageName(world.atmosphereTier)} ({world.atmosphereProgress}%) · <strong>Solde :</strong>{' '}
                  {forecast.netCreditsPerCycle >= 0 ? `+${forecast.netCreditsPerCycle}` : forecast.netCreditsPerCycle} Cr/cycle
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {planetSlot.slotIndex <= world.unlockedSlots ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSlot(planetSlot.slotIndex);
                        setActiveScale(2);
                        closeWindow();
                      }}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-rose-600 px-3.5 text-xs font-bold text-white shadow-sm hover:bg-rose-500"
                    >
                      <Globe2 className="h-4 w-4" />
                      <span>Explorer la planète 3D</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSlot(planetSlot.slotIndex);
                        setActiveScale(3);
                        closeWindow();
                      }}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3.5 text-xs font-semibold text-rose-800 hover:border-rose-500 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-100"
                    >
                      <Building2 className="h-4 w-4" />
                      <span>Ouvrir la Ville 3D</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        triggerEventAction({ kind: 'BANK_LOAN', principal: 400 }, 'Emprunt indisponible.')
                      }
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white/90 px-3.5 text-xs font-semibold text-[#1f1224] hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100"
                    >
                      <Coins className="h-4 w-4 text-rose-600 dark:text-rose-300" />
                      <span>Demander un emprunt (+400 Cr)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        closeWindow();
                        setSubscreen('WORLDS_HUB');
                      }}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white/90 px-3.5 text-xs font-semibold text-[#1f1224] hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100"
                    >
                      <Activity className="h-4 w-4 text-rose-600 dark:text-rose-300" />
                      <span>Gérer la colonie</span>
                    </button>
                  </>
                ) : (
                  <div className="col-span-2 rounded-xl border border-amber-300 bg-amber-50/80 p-3 text-xs text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
                    Cette destination se débloquera à l’<strong>Ère {planetSlot.unlockEra}</strong> en accumulant des étoiles de progression via vos événements.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
