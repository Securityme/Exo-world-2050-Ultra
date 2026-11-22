import { useEffect, useMemo, useRef, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  AlertTriangle,
  Building2,
  Hammer,
  Maximize2,
  Minimize2,
  Rocket,
  RotateCw,
  Users,
  X,
} from 'lucide-react';
import { IsolatedInspectorScene } from '../engine3d/isolated-inspector.scene.ts';
import {
  handleAssignColonistToDistrict,
  handleGenerateActionEvent,
} from '../pipelines/game-actions.pipeline.ts';
import { useExoStore } from '../stores/game.store.ts';
import {
  activeDossierIdAtom,
  isolated3DModalAtom,
  toastNoticeAtom,
} from '../stores/selection.atoms.ts';
import { computeBuildingFlowRow, evaluateEntityLedger } from '../systems/economy-urban/entity-ledger.ts';
import { formatDistrictKind } from '../utils/ui-labels.ts';

/**
 * [L7] EXW.L7.ISOLATED_3D_MODAL | v4.0.0-rc.1 | SADT A5.2
 * Dedicated Isolated 3D Inspector Modal for:
 * - B3D (Building 3D Inspector): free 3D orbit, wear/under-power visuals, cons/prod matrix, RPG colonist slots, fullscreen
 * - H3D (Fleet Hangar 3D): renders every actually owned ship, drone role & military unit
 * Automatic 2D schematic fallback if WebGL context is lost or prefers-reduced-motion is set.
 */
export function Isolated3DViewerModal() {
  const [target, setTarget] = useAtom(isolated3DModalAtom);
  const setActiveDossierId = useSetAtom(activeDossierIdAtom);
  const setToast = useSetAtom(toastNoticeAtom);

  const world = useExoStore((s) => s.world);
  const lightTheme = useExoStore((s) => s.graphics.themeMode === 'LIGHT_ANNO');

  const [fullscreen, setFullscreen] = useState(false);
  const [fallback2D, setFallback2D] = useState(false);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<IsolatedInspectorScene | null>(null);

  const district = useMemo(
    () =>
      target?.mode === 'BUILDING'
        ? world.districts.find((d) => d.id === target.districtId) ?? world.districts[0] ?? null
        : null,
    [target, world.districts],
  );

  const ledger = useMemo(() => evaluateEntityLedger(world, 1.0), [world]);
  const buildingRow = useMemo(() => {
    if (!district) return null;
    const underPowered = ledger.delta.shedDistrictIds.includes(district.id);
    return computeBuildingFlowRow(district, world.season, 1.0, underPowered);
  }, [district, ledger.delta.shedDistrictIds, world.season]);

  useEffect(() => {
    if (!target || !canvasHostRef.current) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setFallback2D(true);
      return;
    }

    setFallback2D(false);
    const controller = new IsolatedInspectorScene();
    sceneRef.current = controller;

    const ok =
      target.mode === 'BUILDING' && district
        ? controller.mount(
            canvasHostRef.current,
            {
              kind: 'BUILDING',
              district,
              underPowered: Boolean(buildingRow?.underPowered),
              lightTheme,
            },
            () => setFallback2D(true),
          )
        : controller.mount(
            canvasHostRef.current,
            {
              kind: 'HANGAR',
              fleetShips: world.fleetShips ?? [],
              drones: world.drones,
              militaryRoster: world.militaryRoster,
              lightTheme,
            },
            () => setFallback2D(true),
          );

    if (!ok) setFallback2D(true);

    return () => {
      controller.dispose();
      sceneRef.current = null;
    };
  }, [
    target,
    district?.id,
    district?.level,
    district?.modulesCount,
    district?.integrity,
    buildingRow?.underPowered,
    lightTheme,
    world.fleetShips?.length,
    world.drones.construction,
    world.drones.defense,
    world.militaryRoster.length,
  ]);

  if (!target) return null;

  const isBuilding = target.mode === 'BUILDING' && district !== null;
  const assignedColonists = isBuilding
    ? world.colonists.filter((c) => c.assignedDistrictId === district.id)
    : [];
  const otherColonists = isBuilding
    ? world.colonists.filter((c) => c.assignedDistrictId !== district.id)
    : [];

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-[#0d0612]/80 ${
        fullscreen ? 'items-stretch p-0' : 'items-center p-3 sm:p-6'
      }`}
    >
      <div
        role="dialog"
        aria-label={isBuilding ? `Inspecteur 3D — ${district.name}` : 'Hangar 3D de la Flotte'}
        className={`exo-bento-card flex w-full flex-col overflow-hidden ${
          fullscreen ? 'h-[100dvh] max-w-none rounded-none' : 'max-h-[92dvh] max-w-4xl rounded-2xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-rose-200 px-4 py-3 dark:border-rose-900/60">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white">
              {isBuilding ? <Building2 className="h-4.5 w-4.5" /> : <Rocket className="h-4.5 w-4.5" />}
            </span>
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-300">
                {isBuilding ? `Inspecteur 3D Isolé (B3D) · ${formatDistrictKind(district.kind)}` : 'Hangar Orbital 3D (H3D)'}
              </div>
              <h2 className="font-display text-base font-bold text-[#1f1224] dark:text-rose-50 sm:text-lg">
                {isBuilding ? `${district.name} · Niv. ${district.level}` : 'Flotte, Drones & Unités Possédés'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!fallback2D && (
              <button
                type="button"
                onClick={() => sceneRef.current?.rotateStep(Math.PI / 4)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 bg-white/90 px-2.5 font-mono text-[11px] font-semibold text-rose-900 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Pivoter 45°</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setFullscreen((f) => !f)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 bg-white/90 px-2.5 font-mono text-[11px] font-semibold text-rose-900 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{fullscreen ? 'Fenêtre' : 'Plein écran'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFullscreen(false);
                setTarget(null);
              }}
              aria-label="Fermer l'inspecteur 3D"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-white/90 text-rose-900 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Split Layout: Isolated 3D Viewport + Telemetry / RPG Slots */}
        <div className="grid flex-1 overflow-y-auto lg:grid-cols-12">
          <div className="relative min-h-[280px] border-b border-rose-200/70 dark:border-rose-900/50 lg:col-span-7 lg:min-h-[420px] lg:border-b-0 lg:border-r">
            {fallback2D ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs text-rose-900 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100">
                  <strong>Vue Schématique 2D active</strong> (préférence de mouvement réduit ou contexte WebGL libéré).
                </div>
              </div>
            ) : (
              <div ref={canvasHostRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
            )}

            {/* Status Badges pinned cleanly inside viewport corner */}
            {isBuilding && (district.integrity < 55 || buildingRow?.underPowered) && (
              <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
                {district.integrity < 55 && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 font-mono text-[10.5px] font-bold text-white shadow">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Usure critique ({district.integrity}%)
                  </span>
                )}
                {buildingRow?.underPowered && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 font-mono text-[10.5px] font-bold text-white shadow">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Sous-tension (délestage auto)
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4 p-4 lg:col-span-5">
            {isBuilding && buildingRow ? (
              <>
                <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                  <div className="rounded-xl border border-rose-200 bg-white/85 p-2.5 dark:border-rose-900/60 dark:bg-[#190d1f]">
                    <div className="text-[10px] text-rose-900/60 dark:text-rose-200/65">Intégrité</div>
                    <div className={`font-bold ${district.integrity < 55 ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-300'}`}>
                      {district.integrity}%
                    </div>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-white/85 p-2.5 dark:border-rose-900/60 dark:bg-[#190d1f]">
                    <div className="text-[10px] text-rose-900/60 dark:text-rose-200/65">Extensions</div>
                    <div className="font-bold text-rose-700 dark:text-rose-300">{district.modulesCount} / 3</div>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-white/85 p-2.5 dark:border-rose-900/60 dark:bg-[#190d1f]">
                    <div className="text-[10px] text-rose-900/60 dark:text-rose-200/65">Énergie</div>
                    <div className={`font-bold ${buildingRow.energyNet >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                      {buildingRow.energyNet >= 0 ? `+${buildingRow.energyNet}` : buildingRow.energyNet} MW
                    </div>
                  </div>
                </div>

                {/* Conso / Prod Matrix */}
                <div className="rounded-xl border border-rose-200/80 bg-rose-50/60 p-3 text-xs dark:border-rose-900/60 dark:bg-rose-950/30">
                  <div className="font-mono text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300">
                    Matrice Consommation / Production par Tour
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                    <div>Crédits : <strong>{buildingRow.creditsNet >= 0 ? `+${buildingRow.creditsNet}` : buildingRow.creditsNet}</strong></div>
                    <div>Matériaux : <strong>{buildingRow.materialsNet >= 0 ? `+${buildingRow.materialsNet}` : buildingRow.materialsNet}</strong></div>
                    <div>Eau : <strong>{buildingRow.waterNet >= 0 ? `+${buildingRow.waterNet}` : buildingRow.waterNet}</strong></div>
                    <div>Vivres : <strong>{buildingRow.foodNet >= 0 ? `+${buildingRow.foodNet}` : buildingRow.foodNet}</strong></div>
                    <div>Calcul : <strong>{buildingRow.computeNet >= 0 ? `+${buildingRow.computeNet}` : buildingRow.computeNet}</strong></div>
                    <div>Kits O₂ : <strong>{buildingRow.kitsNet >= 0 ? `+${buildingRow.kitsNet}` : buildingRow.kitsNet}</strong></div>
                  </div>
                </div>

                {/* RPG Colonist Slots */}
                <div className="space-y-2 rounded-xl border border-rose-200/80 bg-white/85 p-3 dark:border-rose-900/60 dark:bg-[#190d1f]">
                  <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> Créneaux Colons RPG ({assignedColonists.length}/2)
                    </span>
                    <span>Synergie +10%</span>
                  </div>
                  {assignedColonists.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border border-emerald-300/70 bg-emerald-50/70 px-2.5 py-1.5 text-xs dark:border-emerald-800 dark:bg-emerald-950/35">
                      <div>
                        <div className="font-bold text-[#1f1224] dark:text-rose-50">{c.name} (Niv.{c.level ?? 1})</div>
                        <div className="font-mono text-[10px] text-rose-900/70 dark:text-rose-200/70">
                          {c.specialty} · Moral {c.morale}% · Fat {c.fatigue}%
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAssignColonistToDistrict(c.id, null)}
                        className="rounded-lg border border-rose-300 px-2 py-1 text-[10.5px] font-semibold text-rose-700 dark:border-rose-700 dark:text-rose-200"
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                  {assignedColonists.length < 2 && otherColonists.slice(0, 2).map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border border-rose-200/70 px-2.5 py-1.5 text-xs dark:border-rose-900/50">
                      <span className="truncate text-[#1f1224] dark:text-rose-100">{c.name} ({c.specialty})</span>
                      <button
                        type="button"
                        onClick={() => handleAssignColonistToDistrict(c.id, district.id)}
                        className="rounded-lg bg-rose-600 px-2 py-1 text-[10.5px] font-bold text-white hover:bg-rose-500"
                      >
                        Affecter
                      </button>
                    </div>
                  ))}
                </div>

                {/* Action via Event Generator (R-24) */}
                <button
                  type="button"
                  disabled={district.modulesCount >= 3}
                  onClick={() => {
                    const [err, dossier] = handleGenerateActionEvent({ kind: 'GRAFT_MODULE', districtId: district.id });
                    if (err || !dossier) {
                      setToast({ id: Date.now(), tone: 'error', text: err?.message ?? 'Action indisponible.' });
                      return;
                    }
                    setTarget(null);
                    setActiveDossierId(dossier.id);
                  }}
                  className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-45"
                >
                  <Hammer className="h-4 w-4" />
                  <span>
                    {district.modulesCount >= 3
                      ? 'Extensions au maximum (3/3)'
                      : 'Ouvrir Dossier d’Extension / Maintenance (R-24)'}
                  </span>
                </button>
              </>
            ) : (
              /* Hangar 3D Inventory Breakdown */
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-rose-200/80 bg-white/85 p-3 dark:border-rose-900/60 dark:bg-[#190d1f]">
                  <div className="font-mono text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300">
                    Vaisseaux Orbitaux ({world.fleetShips?.length ?? 0})
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {(world.fleetShips ?? []).map((ship) => (
                      <div key={ship.id} className="flex items-center justify-between rounded-lg bg-rose-50/70 px-2.5 py-1.5 dark:bg-rose-950/35">
                        <span className="font-semibold text-[#1f1224] dark:text-rose-50">{ship.name}</span>
                        <span className="font-mono text-[10.5px] text-emerald-700 dark:text-emerald-300">
                          {ship.shipClass} · {ship.integrity}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-rose-200/80 bg-white/85 p-3 dark:border-rose-900/60 dark:bg-[#190d1f]">
                  <div className="font-mono text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300">
                    Escadrilles de Drones ({world.drones.construction + world.drones.defense + world.drones.attack + world.drones.recon})
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                    <div>Construction : <strong>{world.drones.construction}</strong></div>
                    <div>Défense : <strong>{world.drones.defense}</strong></div>
                    <div>Attaque : <strong>{world.drones.attack}</strong></div>
                    <div>Reconnaissance : <strong>{world.drones.recon}</strong></div>
                  </div>
                </div>

                <div className="rounded-xl border border-rose-200/80 bg-white/85 p-3 dark:border-rose-900/60 dark:bg-[#190d1f]">
                  <div className="font-mono text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300">
                    Unités Tactiques ({world.militaryRoster.reduce((a, u) => a + u.count, 0)})
                  </div>
                  <div className="mt-2 space-y-1">
                    {world.militaryRoster.map((u) => (
                      <div key={u.id} className="flex items-center justify-between font-mono text-[11px]">
                        <span>{u.unitClass} (Niv.{u.level})</span>
                        <strong>×{u.count}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
