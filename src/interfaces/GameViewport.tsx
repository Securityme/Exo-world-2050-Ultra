import { useEffect, useMemo, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { projectWorldToSceneDiff } from '../adapters/scene-diff-projector.ts';
import type { RenderToGameEvent } from '../contracts/render-bridge.schema.ts';
import { resolveThemeSnapshot } from '../data/ui-themes.catalog.ts';
import { ThreeJsRenderAdapter } from '../engine3d/threejs-render.adapter.ts';
import { useExoStore } from '../stores/game.store.ts';
import {
  activeDossierIdAtom,
  hologramPreviewDistrictAtom,
  inspectedEntityAtom,
  selectedDistrictIdAtom,
  selectedTileAtom,
  toastNoticeAtom,
  viewportOverlayModeAtom,
} from '../stores/selection.atoms.ts';

/**
 * [L7] FUP-007 | SM-05 | SADT A5.3
 * Dedicated, empty canvas mount node hosting ThreeJsRenderAdapter strictly decoupled
 * from React DOM reconciliation, protected with split-pane ResizeObserver Shield (AI Studio Preview / Safari).
 */
export function GameViewport() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const adapterRef = useRef<ThreeJsRenderAdapter | null>(null);

  const world = useExoStore((s) => s.world);
  const graphics = useExoStore((s) => s.graphics);
  const uiTheme = useExoStore((s) => s.uiTheme);
  const setActiveSlot = useExoStore((s) => s.setActiveSlot);

  const selectedTile = useAtomValue(selectedTileAtom);
  const hologramPreview = useAtomValue(hologramPreviewDistrictAtom);
  const overlayMode = useAtomValue(viewportOverlayModeAtom);
  const setSelectedTile = useSetAtom(selectedTileAtom);
  const setSelectedDistrict = useSetAtom(selectedDistrictIdAtom);
  const setInspectedEntity = useSetAtom(inspectedEntityAtom);
  const setActiveDossierId = useSetAtom(activeDossierIdAtom);
  const setToast = useSetAtom(toastNoticeAtom);

  const activeThemeAccents = useMemo(() => {
    const snap = resolveThemeSnapshot(uiTheme, graphics.themeMode === 'DARK_BENTO');
    return {
      accentHex: snap.palette.accentHex,
      accent2Hex: snap.palette.accent2Hex,
    };
  }, [uiTheme, graphics.themeMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const adapter = new ThreeJsRenderAdapter();
    adapterRef.current = adapter;
    adapter.mount(container, { lowPowerMode: graphics.lowPowerMode, maxDpr: 1.5 });

    const onEvent = (evt: RenderToGameEvent) => {
      if (evt.type === 'TILE_SELECTED') {
        setSelectedTile(evt.tileIndex);
        setInspectedEntity({ kind: 'SECTOR', tileIndex: evt.tileIndex });
      } else if (evt.type === 'SLOT_SELECTED') {
        setActiveSlot(evt.slotIndex);
        setInspectedEntity({ kind: 'WORLD', slotIndex: evt.slotIndex });
      } else if (evt.type === 'DOSSIER_PIN_CLICKED') {
        setInspectedEntity(null);
        setActiveDossierId(evt.dossierId);
      } else if (evt.type === 'DISTRICT_CLICKED') {
        setSelectedDistrict(evt.districtId);
        setInspectedEntity({ kind: 'DISTRICT', districtId: evt.districtId });
      }
    };
    adapter.setOnGameEvent(onEvent);

    // Split-Pane Preview & Safari WebKit Resize Shield (guards transient 0x0 collapses)
    let resizeRaf = 0;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.floor(entry.contentRect.width);
      const h = Math.floor(entry.contentRect.height);
      if (w < 64 || h < 64) return;
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        adapter.resize(w, h);
      });
    });
    ro.observe(container);

    const onContextLost = (ev: Event) => {
      ev.preventDefault();
      setToast({
        id: Date.now(),
        tone: 'warn',
        text: 'Contexte WebGL suspendu pendant le redimensionnement — restauration en cours…',
      });
    };
    const onContextRestored = () => {
      const w = Math.max(320, container.clientWidth || window.innerWidth);
      const h = Math.max(240, container.clientHeight || window.innerHeight);
      adapter.resize(w, h);
    };
    const canvasEl = container.querySelector('canvas');
    canvasEl?.addEventListener('webglcontextlost', onContextLost);
    canvasEl?.addEventListener('webglcontextrestored', onContextRestored);

    return () => {
      cancelAnimationFrame(resizeRaf);
      canvasEl?.removeEventListener('webglcontextlost', onContextLost);
      canvasEl?.removeEventListener('webglcontextrestored', onContextRestored);
      ro.disconnect();
      adapter.dispose();
      adapterRef.current = null;
    };
  }, [
    graphics.lowPowerMode,
    setActiveDossierId,
    setActiveSlot,
    setInspectedEntity,
    setSelectedDistrict,
    setSelectedTile,
    setToast,
  ]);

  useEffect(() => {
    const adapter = adapterRef.current;
    if (!adapter) return;
    const diff = projectWorldToSceneDiff(world, {
      selectedTileIndex: selectedTile,
      themeMode: graphics.themeMode,
      hologramPreviewDistrict: hologramPreview,
      overlayMode,
      themeAccentHex: activeThemeAccents.accentHex,
      themeAccent2Hex: activeThemeAccents.accent2Hex,
    });
    adapter.applySceneDiff(diff);
  }, [world, selectedTile, graphics.themeMode, hologramPreview, overlayMode, activeThemeAccents]);

  return (
    <div
      ref={mountRef}
      data-testid="exo-3d-viewport"
      aria-label="Scène 3D EXO WORLD 2050"
      className="fixed inset-0 z-10 h-full w-full touch-none select-none overflow-hidden"
    />
  );
}
