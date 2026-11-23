import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Grid3X3,
  Layers,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Sparkles,
  Sun,
} from 'lucide-react';
import {
  IsolatedInspectorScene,
  type StudioLightingPreset,
} from '../../engine3d/isolated-inspector.scene.ts';
import {
  SHOWCASE_3D_ASSETS_CATALOG,
  type ShowcaseAssetCategory,
  type ShowcaseAssetId,
} from '../../engine3d/showcase-assets.ts';
import { useExoStore } from '../../stores/game.store.ts';

/**
 * [L7] EXW.L7.ASSET_3D_GALLERY | v5.1.0 | SADT A5.2
 * AAA Interactive 3D Showcase Gallery inside the Profile Hub:
 * - Real-time WebGL PBR inspection of 10 multi-part Solarpunk/Orbital 3D assets
 * - 3 Studio Lighting Presets (Obsidienne, Orbite Solaire, Ciel Éden) + Turntable Auto-Rotate
 * - Category filter (Flotte, Unités, Infrastructures, Orbital), orbit/zoom, wireframe & Unity prefab mapping
 */
const CATEGORY_LABEL: Readonly<Record<'ALL' | ShowcaseAssetCategory, string>> = {
  ALL: 'Tous (10)',
  FLEET: 'Flotte (4)',
  UNITS: 'Unités (2)',
  INFRASTRUCTURE: 'Infrastructures (3)',
  ORBITAL: 'Orbital (1)',
};

const LIGHTING_PRESETS: readonly { readonly id: StudioLightingPreset; readonly label: string }[] = [
  { id: 'OBSIDIAN', label: 'Obsidienne' },
  { id: 'SOLAR_ORBIT', label: 'Orbite Solaire' },
  { id: 'EDEN_SKY', label: 'Ciel Éden' },
];

export function Asset3DGalleryPanel() {
  const uiTheme = useExoStore((s) => s.uiTheme);
  const lightTheme = uiTheme.colorScheme === 'LIGHT';

  const [category, setCategory] = useState<'ALL' | ShowcaseAssetCategory>('ALL');
  const [selectedId, setSelectedId] = useState<ShowcaseAssetId>('COLONY_ARK');
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [lightingPreset, setLightingPreset] = useState<StudioLightingPreset>('OBSIDIAN');
  const [contextLost, setContextLost] = useState(false);
  const [stats, setStats] = useState<{ meshCount: number; triangleCount: number }>({
    meshCount: 0,
    triangleCount: 0,
  });

  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<IsolatedInspectorScene | null>(null);

  const filteredAssets = useMemo(
    () =>
      category === 'ALL'
        ? SHOWCASE_3D_ASSETS_CATALOG
        : SHOWCASE_3D_ASSETS_CATALOG.filter((a) => a.category === category),
    [category],
  );

  const activeSpec =
    SHOWCASE_3D_ASSETS_CATALOG.find((a) => a.id === selectedId) ?? SHOWCASE_3D_ASSETS_CATALOG[0]!;

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;
    setContextLost(false);
    const controller = new IsolatedInspectorScene();
    sceneRef.current = controller;
    const ok = controller.mount(
      host,
      {
        kind: 'ASSET_SHOWCASE',
        assetId: selectedId,
        lightTheme,
        wireframe,
        lightingPreset,
      },
      () => setContextLost(true),
    );
    if (ok) {
      setStats(controller.getSubjectStats());
      if (autoRotate) controller.setAutoRotate(true);
    }
    return () => {
      controller.dispose();
      sceneRef.current = null;
    };
  }, [selectedId, lightTheme]);

  useEffect(() => {
    sceneRef.current?.setWireframe(wireframe);
  }, [wireframe]);

  useEffect(() => {
    sceneRef.current?.setAutoRotate(autoRotate);
  }, [autoRotate]);

  useEffect(() => {
    sceneRef.current?.applyLightingPreset(lightingPreset, lightTheme);
  }, [lightingPreset, lightTheme]);

  return (
    <div data-testid="asset-3d-gallery" className="space-y-4">
      <div className="exo-bento-card space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-1.5 font-display text-base font-bold exo-accent-text">
              <Box className="h-4 w-4" />
              Atelier &amp; Galerie d&apos;Assets 3D PBR ({SHOWCASE_3D_ASSETS_CATALOG.length} modèles)
            </h3>
            <p className="text-xs exo-muted-text">
              Modèles procéduraux multi-pièces (Three.js r170+ · PBR RoomEnvironment) prêts pour le pont Unity 6 URP.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer les modèles 3D">
            {(['ALL', 'FLEET', 'UNITS', 'INFRASTRUCTURE', 'ORBITAL'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                data-testid={`asset3d-filter-${cat.toLowerCase()}`}
                onClick={() => {
                  setCategory(cat);
                  if (cat !== 'ALL') {
                    const first = SHOWCASE_3D_ASSETS_CATALOG.find((a) => a.category === cat);
                    if (first) setSelectedId(first.id);
                  }
                }}
                className={`min-h-[36px] rounded-xl px-3 font-mono text-[11px] font-semibold transition ${
                  category === cat ? 'exo-accent-btn' : 'exo-accent-chip'
                }`}
              >
                {CATEGORY_LABEL[cat]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          {/* Interactive 3D Viewport */}
          <div className="space-y-2.5 lg:col-span-7">
            <div className="relative h-[270px] w-full overflow-hidden rounded-2xl border exo-accent-border bg-[#090e1c] sm:h-[300px]">
              {contextLost ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-xs exo-muted-text">
                  <Sparkles className="h-6 w-6 exo-accent-text" />
                  <p className="font-semibold text-[var(--exo-text)]">{activeSpec.name}</p>
                  <p>Aperçu 3D indisponible (contexte WebGL suspendu). Sélectionnez un autre modèle pour réessayer.</p>
                </div>
              ) : (
                <div
                  ref={canvasHostRef}
                  data-testid="asset-3d-gallery-canvas"
                  className="h-full w-full cursor-grab active:cursor-grabbing"
                />
              )}
            </div>

            {/* Turntable, Wireframe & Studio Lighting Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setAutoRotate((v) => !v)}
                  className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 font-mono text-[11px] font-semibold ${
                    autoRotate ? 'exo-accent-btn' : 'exo-accent-chip'
                  }`}
                >
                  {autoRotate ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span>Rotation</span>
                </button>
                <button
                  type="button"
                  onClick={() => sceneRef.current?.rotateStep(-Math.PI / 4)}
                  aria-label="Tourner le modèle de -45 degrés"
                  className="exo-accent-chip inline-flex min-h-[38px] items-center gap-1 px-2.5 font-mono text-[11px] font-semibold"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>-45°</span>
                </button>
                <button
                  type="button"
                  onClick={() => sceneRef.current?.rotateStep(Math.PI / 4)}
                  aria-label="Tourner le modèle de +45 degrés"
                  className="exo-accent-chip inline-flex min-h-[38px] items-center gap-1 px-2.5 font-mono text-[11px] font-semibold"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>+45°</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWireframe((v) => !v)}
                  className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-2.5 font-mono text-[11px] font-semibold ${
                    wireframe ? 'exo-accent-btn' : 'exo-accent-chip'
                  }`}
                >
                  <Grid3X3 className="h-3.5 w-3.5" />
                  <span>Maillage</span>
                </button>
                <button
                  type="button"
                  onClick={() => sceneRef.current?.resetView()}
                  className="exo-accent-chip inline-flex min-h-[38px] items-center px-2.5 font-mono text-[11px] font-semibold"
                >
                  <span>Réinit.</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Éclairage studio 3D">
                <Sun className="mr-0.5 h-3.5 w-3.5 exo-muted-text" />
                {LIGHTING_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setLightingPreset(preset.id)}
                    className={`min-h-[34px] rounded-lg px-2 font-mono text-[10px] font-semibold ${
                      lightingPreset === preset.id ? 'exo-accent-chip-active' : 'exo-surface-sub exo-muted-text'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Asset Technical Card */}
            <div className="exo-surface-sub space-y-1.5 rounded-xl border p-3.5 text-xs exo-accent-border">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h4 className="font-display text-sm font-bold">{activeSpec.name}</h4>
                  <div className="font-mono text-[10.5px] exo-accent-2-text">
                    {activeSpec.subtitle} · {activeSpec.tierLabel}
                  </div>
                </div>
                <div className="font-mono text-[11px] tabular-nums exo-muted-text">
                  {stats.meshCount} pièces · {stats.triangleCount.toLocaleString('fr-FR')} triangles
                </div>
              </div>
              <p className="text-[11.5px] leading-relaxed exo-muted-text">
                {activeSpec.description}
              </p>
              <div className="flex items-center gap-1.5 pt-1 font-mono text-[10px] exo-muted-text">
                <Layers className="h-3 w-3 shrink-0 exo-accent-text" />
                <span>Cible Unity 6 URP :</span>
                <code className="font-semibold text-[var(--exo-text)]">{activeSpec.unityPrefabId}</code>
              </div>
            </div>
          </div>

          {/* Selectable Asset Catalog List */}
          <div className="space-y-2 lg:col-span-5">
            <div className="grid max-h-[490px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-1">
              {filteredAssets.map((asset) => {
                const isActive = asset.id === activeSpec.id;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    data-testid={`asset3d-item-${asset.id.toLowerCase()}`}
                    onClick={() => setSelectedId(asset.id)}
                    className={`flex min-h-[60px] flex-col justify-center rounded-xl border p-3 text-left transition ${
                      isActive
                        ? 'exo-accent-chip-active'
                        : 'exo-surface-sub exo-accent-border hover:border-[var(--exo-accent)]/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-xs font-bold">{asset.name}</span>
                      <span className="shrink-0 font-mono text-[10px] exo-accent-2-text">
                        {asset.tierLabel}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[10.5px] exo-muted-text line-clamp-1">
                      {asset.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
