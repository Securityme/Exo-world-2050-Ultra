import { useMemo } from 'react';
import { Sliders, Smartphone } from 'lucide-react';
import type { CornerStyle, ShadowDepth, UiDensity } from '../contracts/ui-theme.schema.ts';
import { useExoStore } from '../stores/game.store.ts';
import {
  computeEffectiveFontScale,
  detectWebkitEnvironment,
  probeSafariSystemFontPx,
} from '../utils/safari-webkit.ts';

/**
 * [L7] EXW.L7.THEME_STUDIO_EFFECTS | v5.0.0 | SADT A5.1
 * Saturation, Lighting, Shadow depth, Corner geometry, Safari Dynamic Type sync,
 * 85%-135% Font Scale, 44px Tactile Targets & Climate-Reactive Wallpaper controls.
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

export function ThemeStudioEffectsSection() {
  const uiTheme = useExoStore((s) => s.uiTheme);
  const graphics = useExoStore((s) => s.graphics);
  const updateUiTheme = useExoStore((s) => s.updateUiTheme);
  const updateGraphics = useExoStore((s) => s.updateGraphics);

  const webkitStats = useMemo(() => {
    const env = detectWebkitEnvironment();
    const sysPx = probeSafariSystemFontPx();
    const scale = computeEffectiveFontScale({
      manualPct: uiTheme.fontScalePct ?? 100,
      safariSyncEnabled: uiTheme.safariTextSync ?? true,
      systemBodyPx: sysPx,
    });
    return { env, scale };
  }, [uiTheme.fontScalePct, uiTheme.safariTextSync]);

  return (
    <section className="space-y-4 border-t pt-4 exo-accent-border">
      <h3 className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider exo-accent-text">
        <Sliders className="h-3.5 w-3.5" />
        Lumière, Saturation, Texte &amp; Safari / iPhone
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

      {/* Safari / iPhone Dynamic Type + Manual Font Size Block */}
      <div className="exo-surface-sub space-y-3 rounded-xl p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Smartphone className="h-4 w-4 exo-accent-text" />
            <span>Adaptation Safari, iPhone &amp; Preview AI Studio</span>
          </div>
          <span className="font-mono text-[10.5px] exo-muted-text" data-testid="safari-font-telemetry">
            Base {webkitStats.scale.effectiveRootPx}px (Safari ×{webkitStats.scale.safariSystemRatio} ·{' '}
            {webkitStats.env.isAiStudioIframe ? 'Preview Iframe' : 'Plein Écran'})
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs">
            <div className="flex justify-between">
              <span>Taille manuelle du texte</span>
              <span className="font-mono-num exo-accent-text" data-testid="font-scale-value">
                {uiTheme.fontScalePct ?? 100}%
              </span>
            </div>
            <input
              type="range"
              min={85}
              max={135}
              step={5}
              data-testid="slider-font-scale"
              value={uiTheme.fontScalePct ?? 100}
              onChange={(e) => updateUiTheme({ fontScalePct: Number(e.target.value) })}
              className="exo-range mt-1 w-full"
            />
          </label>
          <div className="grid gap-1.5 text-[11px]">
            <label className="flex min-h-[36px] items-center justify-between gap-2">
              <span>Synchro Taille Texte Safari (-apple-system-body)</span>
              <input
                type="checkbox"
                data-testid="toggle-safari-text-sync"
                checked={uiTheme.safariTextSync ?? true}
                onChange={(e) => updateUiTheme({ safariTextSync: e.target.checked })}
                className="exo-range h-4 w-4"
              />
            </label>
            <label className="flex min-h-[36px] items-center justify-between gap-2">
              <span>Cibles Tactiles iOS ≥ 44px &amp; Anti-Rebond</span>
              <input
                type="checkbox"
                checked={uiTheme.tactileTargetBoost ?? true}
                onChange={(e) => updateUiTheme({ tactileTargetBoost: e.target.checked })}
                className="exo-range h-4 w-4"
              />
            </label>
          </div>
        </div>
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
    </section>
  );
}
