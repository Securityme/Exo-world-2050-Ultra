import { resolveScientificAtmosphereDivision } from '../config/atmosphere.constants.ts';
import type { AtmosphereTier } from '../contracts/render-bridge.schema.ts';
import type { WorldState } from '../contracts/world-state.schema.ts';
import { getWallpaperDef } from '../data/ui-themes.catalog.ts';
import { useExoStore } from '../stores/game.store.ts';

/**
 * [L7] Dynamic Theme-Aware Orbital SVG & Atmospheric Division Backdrop (v5.1.0-alpha.1).
 * Reacts smoothly (1 200 ms) to UI Theme Studio tokens (--exo-accent, --exo-accent-2),
 * active weather state, and the 5 scientific atmospheric divisions EXOSPHERE..TROPOSPHERE
 * with cyan/emerald telemetry micro-rings.
 */
const TIER_RING_OPACITY: Record<AtmosphereTier, number> = {
  P1: 0.2,
  P2: 0.26,
  P3: 0.3,
  P4: 0.36,
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
  const atmoProgress = useExoStore((s) => s.world.atmosphereProgress);
  if (!enabled) return null;

  const wp = getWallpaperDef(uiTheme.wallpaperId);
  const division = resolveScientificAtmosphereDivision(tier, atmoProgress);
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
      data-atmo-division={division.id}
    >
      {!isPureVoid && (
        <svg
          className="h-full w-full transition-all duration-[1200ms] ease-out"
          style={{ opacity: Math.min(0.84, climateOpacity + (uiTheme.glowIntensity / 100) * 0.38) }}
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 1440 900"
        >
          <defs>
            <radialGradient id="exo-theme-aura-primary" cx="58%" cy="44%" r="64%">
              <stop offset="0%" stopColor="var(--exo-accent)" stopOpacity="0.34" />
              <stop offset="48%" stopColor={division.haloHex} stopOpacity="0.16" />
              <stop offset="76%" stopColor="var(--exo-accent-2)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--exo-void)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1440" height="900" fill="url(#exo-theme-aura-primary)" />
          <g fill="none">
            <circle
              cx="820"
              cy="440"
              r="245"
              stroke="#00f0ff"
              strokeOpacity={ringOpacity * 0.55}
              strokeWidth="0.75"
              strokeDasharray="2 10"
            />
            <circle
              cx="820"
              cy="440"
              r="285"
              stroke="var(--exo-accent)"
              strokeOpacity={ringOpacity}
              strokeWidth="1"
              strokeDasharray="4 8"
            />
            <circle
              cx="820"
              cy="440"
              r="355"
              stroke="#10b981"
              strokeOpacity={ringOpacity * 0.48}
              strokeWidth="0.8"
              strokeDasharray="10 6"
            />
            <circle
              cx="820"
              cy="440"
              r="415"
              stroke="var(--exo-accent)"
              strokeOpacity={ringOpacity}
              strokeWidth="0.9"
            />
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
              'radial-gradient(circle at 70% 35%, rgba(0, 240, 255, 0.14), rgba(16, 185, 129, 0.08) 42%, transparent 66%)',
          }}
        />
      )}
    </div>
  );
}
