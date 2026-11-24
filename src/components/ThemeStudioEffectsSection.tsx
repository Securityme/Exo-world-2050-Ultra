import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, RotateCcw, Sliders, Smartphone, ZoomIn } from 'lucide-react';
import type {
  CornerStyle,
  SafariZoomAdaptMode,
  ShadowDepth,
  UiDensity,
} from '../contracts/ui-theme.schema.ts';
import { useExoStore } from '../stores/game.store.ts';
import {
  computeEffectiveFontScale,
  detectWebkitEnvironment,
  probeSafariSystemFontPx,
  SHELL_ZOOM_MAX_PCT,
  SHELL_ZOOM_MIN_PCT,
  SHELL_ZOOM_PRESETS,
  SHELL_ZOOM_STEP_PCT,
  stepShellZoom,
} from '../utils/safari-webkit.ts';

/**
 * [L7] EXW.L7.THEME_STUDIO_EFFECTS | v5.1.0 | SADT A5.1
 * App Shell Zoom (70%-150%), Safari/macOS/iOS & System Zoom adaptation profiles,
 * Saturation, Lighting, Shadow depth, Corner geometry, 44px Tactile Targets & Climate Wallpaper.
 */
const SHADOW_OPTIONS: readonly { id: ShadowDepth; label: string }[] = [
  { id: 'FLAT', label: 'Plate' },
  { id: 'SOFT', label: 'Douce' },
  { id: 'TACTICAL', label: 'Tactique' },
  { id: 'DEEP', label: 'Profonde' },
];

const DENSITY_OPTIONS: readonly { id: UiDensity; label: string }[] = [
  { id: 'COMPACT', label: 'Compacte' },
  { id: 'STANDARD', label: 'Standard' },
  { id: 'COMFORT', label: 'Confort' },
];

const CORNER_OPTIONS: readonly { id: CornerStyle; label: string }[] = [
  { id: 'SHARP', label: 'Vif (4px)' },
  { id: 'BEVELED', label: 'Biseauté (14px)' },
  { id: 'ROUNDED', label: 'Arrondi (22px)' },
];

const SAFARI_ADAPT_MODES: readonly {
  readonly id: SafariZoomAdaptMode;
  readonly label: string;
  readonly detail: string;
}[] = [
  {
    id: 'AUTO_SYSTEM',
    label: 'Auto Safari & OS',
    detail: 'Synchro Dynamic Type + compensation anti-débordement si zoom Safari actif',
  },
  {
    id: 'SAFARI_COMPACT',
    label: 'Safari Compact (-8%)',
    detail: 'Idéal Safari macOS, iPad et Preview AI Studio pour garder tous les onglets visibles',
  },
  {
    id: 'SAFARI_COMFORT',
    label: 'Safari Confort (+8%)',
    detail: 'Lisibilité renforcée avec cibles tactiles ≥ 44px et marges confortables',
  },
  {
    id: 'MANUAL_LOCK',
    label: 'Manuel Verrouillé',
    detail: 'Applique strictement le niveau de zoom choisi sans ajustement système',
  },
];

interface ThemeStudioEffectsSectionProps {
  readonly mode?: 'ALL' | 'ZOOM_ONLY' | 'EFFECTS_ONLY';
}

export function ThemeStudioEffectsSection({ mode = 'ALL' }: ThemeStudioEffectsSectionProps) {
  const uiTheme = useExoStore((s) => s.uiTheme);
  const graphics = useExoStore((s) => s.graphics);
  const updateUiTheme = useExoStore((s) => s.updateUiTheme);
  const updateGraphics = useExoStore((s) => s.updateGraphics);
  const [viewportTick, setViewportTick] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setViewportTick((n) => n + 1);
    window.addEventListener('resize', onResize, { passive: true });
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, []);

  const currentZoomPct = uiTheme.fontScalePct ?? 100;
  const currentAdaptMode: SafariZoomAdaptMode = uiTheme.safariZoomAdaptMode ?? 'AUTO_SYSTEM';

  const webkitStats = useMemo(() => {
    void viewportTick;
    const env = detectWebkitEnvironment();
    const sysPx = probeSafariSystemFontPx();
    const scale = computeEffectiveFontScale({
      manualPct: currentZoomPct,
      safariSyncEnabled: uiTheme.safariTextSync ?? true,
      systemBodyPx: sysPx,
      adaptMode: currentAdaptMode,
      browserZoomRatio: env.browserZoomPct / 100,
      viewportWidthPx: env.viewportWidthPx,
    });
    return { env, scale };
  }, [currentZoomPct, uiTheme.safariTextSync, currentAdaptMode, viewportTick]);

  const showZoom = mode === 'ALL' || mode === 'ZOOM_ONLY';
  const showEffects = mode === 'ALL' || mode === 'EFFECTS_ONLY';

  return (
    <section className={mode === 'ZOOM_ONLY' ? 'space-y-3' : 'space-y-4 border-t pt-4 exo-accent-border'}>
      {showZoom && (
        <div
          className="exo-surface-sub space-y-3.5 rounded-xl p-3.5 sm:p-4"
          data-testid="app-shell-zoom-panel"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border exo-accent-border bg-[var(--exo-surface)]">
                <ZoomIn className="h-4 w-4 exo-accent-text" />
              </span>
              <div>
                <h3 className="font-display text-sm font-bold text-[var(--exo-text)]">
                  Zoom App Shell · Adaptation Safari &amp; Système
                </h3>
                <p className="text-[11px] exo-muted-text">
                  Ajuste proportionnellement l&apos;interface (onglets, fenêtres, HUD) sans déformer la scène 3D WebGL
                </p>
              </div>
            </div>
            <div
              className="font-mono text-[11px] tabular-nums exo-muted-text"
              data-testid="safari-font-telemetry"
            >
              Base {webkitStats.scale.effectiveRootPx}px · Safari ×{webkitStats.scale.safariSystemRatio} ·{' '}
              Zoom Nav. {webkitStats.env.browserZoomPct}% · {webkitStats.env.platformLabel}
            </div>
          </div>

          {/* Stepper + Slider + Quick Reset */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span>Niveau de zoom App Shell</span>
                <span
                  className="font-mono-num text-sm font-bold exo-accent-text"
                  data-testid="font-scale-value"
                >
                  {currentZoomPct}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  data-testid="zoom-step-down"
                  aria-label="Réduire le zoom de 5%"
                  disabled={currentZoomPct <= SHELL_ZOOM_MIN_PCT}
                  onClick={() =>
                    updateUiTheme({ fontScalePct: stepShellZoom(currentZoomPct, -SHELL_ZOOM_STEP_PCT) })
                  }
                  className="exo-accent-chip inline-flex h-9 w-9 items-center justify-center disabled:opacity-40"
                >
                  <Minus className="h-3.5 w-3.5 exo-accent-text" />
                </button>
                <button
                  type="button"
                  data-testid="zoom-reset-100"
                  onClick={() =>
                    updateUiTheme({ fontScalePct: 100, safariZoomAdaptMode: 'AUTO_SYSTEM' })
                  }
                  className="exo-accent-chip inline-flex h-9 items-center gap-1 px-2.5 font-mono text-[11px] font-semibold"
                >
                  <RotateCcw className="h-3 w-3 exo-accent-text" />
                  100%
                </button>
                <button
                  type="button"
                  data-testid="zoom-step-up"
                  aria-label="Augmenter le zoom de 5%"
                  disabled={currentZoomPct >= SHELL_ZOOM_MAX_PCT}
                  onClick={() =>
                    updateUiTheme({ fontScalePct: stepShellZoom(currentZoomPct, SHELL_ZOOM_STEP_PCT) })
                  }
                  className="exo-accent-chip inline-flex h-9 w-9 items-center justify-center disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5 exo-accent-text" />
                </button>
              </div>
            </div>

            <input
              type="range"
              min={SHELL_ZOOM_MIN_PCT}
              max={SHELL_ZOOM_MAX_PCT}
              step={SHELL_ZOOM_STEP_PCT}
              aria-label="Niveau de zoom App Shell"
              data-testid="slider-font-scale"
              value={currentZoomPct}
              onChange={(e) => updateUiTheme({ fontScalePct: Number(e.target.value) })}
              className="exo-range w-full"
            />

            {/* Quick Zoom Level Presets */}
            <div
              className="grid grid-cols-4 gap-1.5 sm:grid-cols-8"
              role="group"
              aria-label="Paliers rapides de zoom App Shell"
            >
              {SHELL_ZOOM_PRESETS.map((pct) => {
                const active = currentZoomPct === pct;
                return (
                  <button
                    key={pct}
                    type="button"
                    data-testid={`zoom-preset-${pct}`}
                    aria-pressed={active}
                    onClick={() => updateUiTheme({ fontScalePct: pct })}
                    className={`min-h-[38px] font-mono text-xs font-bold tabular-nums transition ${
                      active ? 'exo-window-tab-active' : 'exo-window-tab'
                    }`}
                  >
                    {pct}%
                  </button>
                );
              })}
            </div>
          </div>

          {/* Safari & OS System Adaptation Profiles */}
          <div className="space-y-2 border-t exo-accent-border pt-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Smartphone className="h-3.5 w-3.5 exo-accent-text" />
              <span>Profil d&apos;adaptation Safari, macOS / iOS &amp; Système</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {SAFARI_ADAPT_MODES.map((opt) => {
                const active = currentAdaptMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`safari-mode-${opt.id.toLowerCase()}`}
                    aria-pressed={active}
                    onClick={() => updateUiTheme({ safariZoomAdaptMode: opt.id })}
                    className={`flex min-h-[54px] flex-col items-start justify-between p-2.5 text-left transition ${
                      active ? 'exo-accent-chip-active' : 'exo-accent-chip'
                    }`}
                  >
                    <span className="font-display text-xs font-bold">{opt.label}</span>
                    <span className="mt-1 text-[10.5px] leading-snug exo-muted-text">
                      {opt.detail}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-2 pt-1 text-xs sm:grid-cols-2">
              <label className="flex min-h-[40px] cursor-pointer items-center justify-between gap-2 rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-3 py-1.5">
                <span>Synchro Taille Texte Safari (-apple-system-body)</span>
                <input
                  type="checkbox"
                  data-testid="toggle-safari-text-sync"
                  checked={uiTheme.safariTextSync ?? true}
                  onChange={(e) => updateUiTheme({ safariTextSync: e.target.checked })}
                  className="exo-range h-4 w-4 shrink-0"
                />
              </label>
              <label className="flex min-h-[40px] cursor-pointer items-center justify-between gap-2 rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-3 py-1.5">
                <span>Cibles Tactiles iOS ≥ 44px &amp; Anti-Rebond</span>
                <input
                  type="checkbox"
                  checked={uiTheme.tactileTargetBoost ?? true}
                  onChange={(e) => updateUiTheme({ tactileTargetBoost: e.target.checked })}
                  className="exo-range h-4 w-4 shrink-0"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {showEffects && (
        <>
          <h3 className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider exo-accent-text">
            <Sliders className="h-3.5 w-3.5" />
            Lumière, Saturation, Ombres &amp; Densité
          </h3>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs">
              <div className="flex justify-between">
                <span>Halo Lumineux (Glow)</span>
                <span className="font-mono-num exo-accent-text">{uiTheme.glowIntensity}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                data-testid="slider-glow-intensity"
                value={uiTheme.glowIntensity}
                onChange={(e) => updateUiTheme({ glowIntensity: Number(e.target.value) })}
                className="exo-range mt-1 w-full"
              />
            </label>
            <label className="text-xs">
              <div className="flex justify-between">
                <span>Saturation UI</span>
                <span className="font-mono-num exo-accent-text">{uiTheme.saturationPct ?? 100}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={150}
                data-testid="slider-saturation"
                value={uiTheme.saturationPct ?? 100}
                onChange={(e) => updateUiTheme({ saturationPct: Number(e.target.value) })}
                className="exo-range mt-1 w-full"
              />
            </label>
            <label className="text-xs">
              <div className="flex justify-between">
                <span>Opacité HUD Bento</span>
                <span className="font-mono-num exo-accent-text">{uiTheme.hudOpacity}%</span>
              </div>
              <input
                type="range"
                min={60}
                max={100}
                data-testid="slider-hud-opacity"
                value={uiTheme.hudOpacity}
                onChange={(e) => updateUiTheme({ hudOpacity: Number(e.target.value) })}
                className="exo-range mt-1 w-full"
              />
            </label>
            <label className="text-xs">
              <div className="flex justify-between">
                <span>Biseau Directionnel 135°</span>
                <span className="font-mono-num exo-accent-text">{uiTheme.bevelIntensity}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={uiTheme.bevelIntensity}
                onChange={(e) => updateUiTheme({ bevelIntensity: Number(e.target.value) })}
                className="exo-range mt-1 w-full"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <div className="mb-1 text-[11px] font-semibold exo-muted-text">Profondeur d&apos;Ombre</div>
              <div className="grid grid-cols-2 gap-1">
                {SHADOW_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`shadow-${opt.id.toLowerCase()}`}
                    onClick={() => updateUiTheme({ shadowDepth: opt.id })}
                    className={`px-2 py-1.5 text-[11px] font-semibold ${
                      uiTheme.shadowDepth === opt.id ? 'exo-accent-chip-active' : 'exo-accent-chip'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1 text-[11px] font-semibold exo-muted-text">Style des Coins</div>
              <div className="flex flex-col gap-1">
                {CORNER_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateUiTheme({ cornerStyle: opt.id })}
                    className={`px-2 py-1 text-[11px] font-semibold ${
                      uiTheme.cornerStyle === opt.id ? 'exo-accent-chip-active' : 'exo-accent-chip'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1 text-[11px] font-semibold exo-muted-text">Densité &amp; Options</div>
              <div className="flex gap-1">
                {DENSITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateUiTheme({ uiDensity: opt.id })}
                    className={`flex-1 px-1.5 py-1 text-[10px] font-semibold ${
                      uiTheme.uiDensity === opt.id ? 'exo-accent-chip-active' : 'exo-accent-chip'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 space-y-1 text-[11px]">
                <label className="flex items-center justify-between gap-2">
                  <span>Mires de Coins</span>
                  <input
                    type="checkbox"
                    checked={uiTheme.cornerTicks}
                    onChange={(e) => updateUiTheme({ cornerTicks: e.target.checked })}
                    className="exo-range h-4 w-4"
                  />
                </label>
                <label className="flex items-center justify-between gap-2">
                  <span>Fond Dynamique Climat</span>
                  <input
                    type="checkbox"
                    checked={uiTheme.climateDynamicWallpaper ?? true}
                    onChange={(e) => updateUiTheme({ climateDynamicWallpaper: e.target.checked })}
                    className="exo-range h-4 w-4"
                  />
                </label>
                <label className="flex items-center justify-between gap-2">
                  <span>Halo SVG Orbital</span>
                  <input
                    type="checkbox"
                    checked={graphics.dynamicSvgBackdrop}
                    onChange={(e) => updateGraphics({ dynamicSvgBackdrop: e.target.checked })}
                    className="exo-range h-4 w-4"
                  />
                </label>
                <label className="flex items-center justify-between gap-2">
                  <span>Contraste Élevé</span>
                  <input
                    type="checkbox"
                    checked={uiTheme.highContrast}
                    onChange={(e) => updateUiTheme({ highContrast: e.target.checked })}
                    className="exo-range h-4 w-4"
                  />
                </label>
                <label className="flex items-center justify-between gap-2">
                  <span>Mouvement Réduit</span>
                  <input
                    type="checkbox"
                    checked={uiTheme.reducedMotion}
                    onChange={(e) => updateUiTheme({ reducedMotion: e.target.checked })}
                    className="exo-range h-4 w-4"
                  />
                </label>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
