import { Image, RotateCcw, Sparkles, SunMoon } from 'lucide-react';
import type { ColorSchemePreference } from '../contracts/ui-theme.schema.ts';
import { UI_THEME_PRESETS, WALLPAPER_CATALOG } from '../data/ui-themes.catalog.ts';
import { resolveWallpaperImageSrc } from '../data/ui-wallpapers.assets.ts';
import { useExoStore } from '../stores/game.store.ts';
import { ThemeStudioEffectsSection } from './ThemeStudioEffectsSection.tsx';

/**
 * [L7] EXW.L7.THEME_STUDIO_PANEL | v4.1.0 | SADT A5.1
 * Multi-Theme & UI Studio: 6 system presets, Dark/Light/Auto OS, 9 wallpapers,
 * and lighting/shadow/ergonomics controls.
 */
const SCHEME_OPTIONS: readonly { id: ColorSchemePreference; label: string }[] = [
  { id: 'DARK', label: 'Sombre' },
  { id: 'LIGHT', label: 'Clair' },
  { id: 'AUTO', label: 'Auto Système' },
];

export function ThemeStudioPanel() {
  const uiTheme = useExoStore((s) => s.uiTheme);
  const updateUiTheme = useExoStore((s) => s.updateUiTheme);
  const selectThemePreset = useExoStore((s) => s.selectThemePreset);
  const resetUiTheme = useExoStore((s) => s.resetUiTheme);

  return (
    <div className="space-y-5" data-testid="theme-studio-panel">
      {/* Live Bento Preview */}
      <div className="exo-bento-card exo-astral-ticks p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-display text-xs font-bold uppercase tracking-wider exo-accent-text">
              Aperçu Temps Réel · Studio Thème &amp; Lumière
            </div>
            <p className="mt-0.5 text-[11px] exo-muted-text">
              Panneaux Bento, mires de coins, cartes 3D et graphiques héritent du thème actif.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="exo-accent-btn px-2.5 py-1 font-display text-[10px] font-bold uppercase">
              Action Principale
            </span>
            <button
              type="button"
              onClick={resetUiTheme}
              data-testid="theme-reset-btn"
              className="exo-accent-chip inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold"
            >
              <RotateCcw className="h-3 w-3 exo-accent-text" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* 6 System Themes Grid */}
      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider exo-accent-text">
            <Sparkles className="h-3.5 w-3.5" />
            Thèmes Système (6 Palettes)
          </h3>
          <div className="flex items-center gap-1">
            <SunMoon className="h-3.5 w-3.5 exo-muted-text" />
            {SCHEME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                data-testid={`scheme-${opt.id.toLowerCase()}`}
                onClick={() => updateUiTheme({ colorScheme: opt.id })}
                className={`px-2 py-1 text-[11px] font-semibold transition ${
                  uiTheme.colorScheme === opt.id ? 'exo-accent-chip-active' : 'exo-accent-chip'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {UI_THEME_PRESETS.map((preset) => {
            const active = uiTheme.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                data-testid={`theme-preset-${preset.id}`}
                onClick={() => selectThemePreset(preset.id)}
                className={`flex flex-col gap-1.5 p-2.5 text-left transition ${
                  active ? 'exo-accent-chip-active' : 'exo-accent-chip'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-xs font-bold">{preset.label}</span>
                  <span className="flex items-center gap-1">
                    {preset.swatchedHex.map((hex) => (
                      <span
                        key={hex}
                        className="h-3.5 w-3.5 rounded-full border border-white/40"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </span>
                </div>
                <span className="text-[11px] leading-snug exo-muted-text">{preset.subtitle}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Wallpaper & Backdrop */}
      <section className="space-y-2.5 border-t pt-4 exo-accent-border">
        <h3 className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider exo-accent-text">
          <Image className="h-3.5 w-3.5" />
          Fond d&apos;Écran &amp; Atmosphère
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {WALLPAPER_CATALOG.map((wp) => {
            const active = uiTheme.wallpaperId === wp.id;
            const imgSrc = resolveWallpaperImageSrc(wp.id);
            return (
              <button
                key={wp.id}
                type="button"
                data-testid={`wallpaper-${wp.id}`}
                onClick={() => updateUiTheme({ wallpaperId: wp.id })}
                className={`overflow-hidden p-1.5 text-left transition ${
                  active ? 'exo-accent-chip-active' : 'exo-accent-chip'
                }`}
              >
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={wp.label}
                    className="h-11 w-full rounded object-cover"
                  />
                ) : (
                  <div
                    className="flex h-11 w-full items-center justify-center rounded font-mono text-[10px] exo-accent-text"
                    style={{
                      background:
                        wp.id === 'ASTROLABE_SVG'
                          ? 'radial-gradient(circle, rgba(var(--exo-accent-rgb), 0.28), var(--exo-void))'
                          : 'var(--exo-void)',
                    }}
                  >
                    {wp.id === 'ASTROLABE_SVG' ? 'SVG' : 'PUR'}
                  </div>
                )}
                <div className="mt-1 truncate text-[10px] font-semibold">{wp.label}</div>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs">
            <div className="flex justify-between">
              <span>Opacité du Fond d&apos;Écran</span>
              <span className="font-mono-num exo-accent-text">{uiTheme.wallpaperOpacity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={uiTheme.wallpaperOpacity}
              onChange={(e) => updateUiTheme({ wallpaperOpacity: Number(e.target.value) })}
              className="exo-range mt-1.5 w-full"
            />
          </label>
          <label className="text-xs">
            <div className="flex justify-between">
              <span>Vignettage Cinématique</span>
              <span className="font-mono-num exo-accent-text">{uiTheme.vignetteStrength}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={uiTheme.vignetteStrength}
              onChange={(e) => updateUiTheme({ vignetteStrength: Number(e.target.value) })}
              className="exo-range mt-1.5 w-full"
            />
          </label>
        </div>
      </section>

      <ThemeStudioEffectsSection />
    </div>
  );
}
