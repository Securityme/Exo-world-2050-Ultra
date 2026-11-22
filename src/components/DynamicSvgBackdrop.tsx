import type { AtmosphereTier } from '../contracts/render-bridge.schema.ts';
import type { WorldState } from '../contracts/world-state.schema.ts';
import { getWallpaperDef } from '../data/ui-themes.catalog.ts';
import { useExoStore } from '../stores/game.store.ts';

/**
 * [L7] Dynamic Theme-Aware Orbital SVG & Climate-Reactive Atmospheric Backdrop.
 * Reacts strictly to active UI Theme Studio tokens (--exo-accent, --exo-accent-2),
 * active climate/weather conditions (without blue leaks), and vignette/saturation settings.
 */
const TIER_RING_OPACITY: Record<AtmosphereTier, number> = {
  P1: 0.18,
  P2: 0.24,
  P3: 0.28,
  P4: 0.32,
};

const WEATHER_AURA_OPACITY: Record<WorldState['weatherState'], number> = {
  CLEAR: 0.28,
  DUST_STORM: 0.48,
  SOLAR_FLARE: 0.56,
  RAIN: 0.36,
  CRYO_FRONT: 0.42,
};

export function DynamicSvgBackdrop({
  tier,
  enabled,
}: {
  readonly tier: AtmosphereTier;
  readonly enabled: boolean;
}) {
  const uiTheme = useExoStore((s) => s.uiTheme);
  const weatherState = useExoStore((s) => s.world.weatherState);
  if (!enabled) return null;

  const wp = getWallpaperDef(uiTheme.wallpaperId);
  const ringOpacity = TIER_RING_OPACITY[tier];
  const isPureVoid = uiTheme.wallpaperId === 'PURE_VOID';
  const climateActive = uiTheme.climateDynamicWallpaper ?? true;
  const climateOpacity = climateActive ? WEATHER_AURA_OPACITY[weatherState] : 0.25;
  const satFilter = `saturate(${((uiTheme.saturationPct ?? 100) / 100).toFixed(2)})`;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ filter: satFilter }}
    >
      {!isPureVoid && (
        <svg
          className="h-full w-full transition-all duration-[1200ms] ease-out"
          style={{ opacity: Math.min(0.82, climateOpacity + (uiTheme.glowIntensity / 100) * 0.38) }}
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 1440 900"
        >
          <defs>
            <radialGradient id="exo-theme-aura-primary" cx="58%" cy="44%" r="64%">
              <stop offset="0%" stopColor="var(--exo-accent)" stopOpacity="0.34" />
              <stop offset="52%" stopColor="var(--exo-accent-2)" stopOpacity="0.14" />
              <stop offset="100%" stopColor="var(--exo-void)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1440" height="900" fill="url(#exo-theme-aura-primary)" />
          <g stroke="var(--exo-accent)" strokeOpacity={ringOpacity} fill="none">
            <circle cx="820" cy="440" r="285" strokeWidth="1" strokeDasharray="4 8" />
            <circle cx="820" cy="440" r="415" strokeWidth="0.9" />
            <ellipse
              cx="820"
              cy="440"
              rx="530"
              ry="190"
              transform="rotate(-16 820 440)"
              stroke="var(--exo-accent-2)"
              strokeOpacity={ringOpacity * 0.9}
              strokeWidth="0.85"
              strokeDasharray="2 10"
            />
          </g>
        </svg>
      )}
      {wp.id === 'ASTROLABE_SVG' && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 70% 35%, rgba(var(--exo-accent-rgb), 0.16), transparent 62%)',
          }}
        />
      )}
    </div>
  );
}
