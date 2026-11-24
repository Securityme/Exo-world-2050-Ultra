import { useMemo } from 'react';
import {
  computePlanetBiomeDistribution,
  resolvePlanetBiomeProfile,
  type PlanetBiomeId,
  type PlanetClimateId,
  type PlanetReliefId,
} from '../../data/world.catalog.ts';

interface PlanetLivePreviewProps {
  readonly biomeId: PlanetBiomeId;
  readonly oceanCoveragePct: number;
  readonly relief: PlanetReliefId;
  readonly climate: PlanetClimateId;
  readonly worldSeed: number;
  readonly planetName: string;
  readonly capitalName: string;
  readonly leaderName: string;
  readonly fleetName: string;
}

/**
 * [L7] Sticky Real-Time SVG Planetary Globe & Biome Composition Preview
 * for the 4-Step Campaign Genesis screen.
 */
export function PlanetLivePreview({
  biomeId,
  oceanCoveragePct,
  relief,
  climate,
  worldSeed,
  planetName,
  capitalName,
  leaderName,
  fleetName,
}: PlanetLivePreviewProps) {
  const biome = resolvePlanetBiomeProfile(biomeId);
  const distribution = useMemo(
    () => computePlanetBiomeDistribution(biomeId, oceanCoveragePct, relief, climate, worldSeed),
    [biomeId, oceanCoveragePct, relief, climate, worldSeed],
  );

  const seaRadius = Math.min(82, 42 + oceanCoveragePct * 0.42);
  const polarBandH = climate === 'POLAIRE' ? 28 : climate === 'ARIDE' ? 8 : 16;

  return (
    <div className="exo-bento-card space-y-3.5 p-4" data-testid="planet-live-preview">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest exo-accent-text">
            Aperçu Planétaire Temps Réel
          </div>
          <h3 className="font-display text-base font-bold text-[var(--exo-text)]">
            {planetName.trim() || 'Nouvelle-Aurore'}
          </h3>
        </div>
        <span className="exo-accent-chip rounded-lg px-2 py-1 font-mono text-[10.5px] font-bold">
          {oceanCoveragePct}% Océans
        </span>
      </div>

      {/* Procedural SVG Planet Globe */}
      <div className="relative mx-auto flex items-center justify-center rounded-2xl border exo-accent-border bg-[#040814] p-3">
        <svg viewBox="0 0 220 220" className="h-44 w-44" role="img" aria-label={`Globe ${biome.name}`}>
          <defs>
            <radialGradient id="planetOceanGrad" cx="35%" cy="32%" r="72%">
              <stop offset="0%" stopColor={biome.swatchHighlight} stopOpacity="0.45" />
              <stop offset="55%" stopColor={biome.swatchOcean} />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
            <clipPath id="planetGlobeClip">
              <circle cx="110" cy="110" r="82" />
            </clipPath>
          </defs>

          {/* Orbital glow & ring */}
          <circle cx="110" cy="110" r="92" fill="none" stroke={biome.swatchHighlight} strokeOpacity="0.22" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="110" cy="110" r="82" fill="url(#planetOceanGrad)" />

          <g clipPath="url(#planetGlobeClip)">
            {/* Continents / Islands scaled inversely to ocean coverage */}
            <ellipse
              cx={88 - (worldSeed % 12)}
              cy="94"
              rx={Math.max(14, (100 - oceanCoveragePct) * 0.56)}
              ry={Math.max(10, (100 - oceanCoveragePct) * 0.36)}
              fill={biome.swatchLand}
              opacity="0.92"
            />
            <ellipse
              cx={140 + (worldSeed % 9)}
              cy="128"
              rx={Math.max(10, (100 - oceanCoveragePct) * 0.42)}
              ry={Math.max(8, (100 - oceanCoveragePct) * 0.28)}
              fill={biome.swatchLand}
              opacity="0.86"
            />
            <circle
              cx="118"
              cy="76"
              r={Math.max(5, Math.round((100 - seaRadius) * 0.35))}
              fill={biome.swatchHighlight}
              opacity="0.65"
            />
            {/* Relief Ridges */}
            {relief !== 'DOUX' && (
              <path
                d="M68 106 L82 90 L98 104 L112 92 L124 106"
                fill="none"
                stroke="#f8fafc"
                strokeOpacity={relief === 'ESCARPE' ? 0.55 : 0.28}
                strokeWidth={relief === 'ESCARPE' ? 2.4 : 1.4}
              />
            )}
            {/* Polar Caps */}
            <rect x="20" y="24" width="180" height={polarBandH} fill="#e2e8f0" opacity="0.45" />
            <rect x="20" y={196 - polarBandH} width="180" height={polarBandH} fill="#e2e8f0" opacity="0.4" />
            {/* Atmospheric Rim */}
            <circle cx="110" cy="110" r="82" fill="none" stroke="#67e8f9" strokeOpacity="0.45" strokeWidth="3.5" />
          </g>
        </svg>
      </div>

      {/* Stacked Biome Distribution Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between font-mono text-[10.5px]">
          <span className="font-bold text-[var(--exo-text)]">{biome.name}</span>
          <span className="exo-muted-text">{relief} · {climate}</span>
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full border exo-accent-border">
          {distribution.map((seg) => (
            <div
              key={seg.id}
              title={`${seg.label} : ${seg.pct}%`}
              style={{ width: `${seg.pct}%`, backgroundColor: seg.colorHex }}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {distribution.slice(0, 4).map((seg) => (
            <span
              key={seg.id}
              className="inline-flex items-center gap-1 rounded border exo-accent-border bg-[var(--exo-surface)] px-1.5 py-0.5 font-mono text-[9.5px]"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.colorHex }} />
              <span>{seg.label} {seg.pct}%</span>
            </span>
          ))}
        </div>
      </div>

      {/* Founding Identity Summary */}
      <div className="space-y-1 border-t exo-accent-border pt-2.5 font-mono text-[10.5px]">
        <div className="flex justify-between gap-2">
          <span className="exo-muted-text">Capitale :</span>
          <strong className="truncate text-[var(--exo-text)]">{capitalName || 'Port-Lumière'}</strong>
        </div>
        <div className="flex justify-between gap-2">
          <span className="exo-muted-text">Dirigeant :</span>
          <strong className="truncate text-[var(--exo-text)]">{leaderName || 'Hélène Vance'}</strong>
        </div>
        <div className="flex justify-between gap-2">
          <span className="exo-muted-text">Flotte :</span>
          <strong className="truncate exo-accent-text">{fleetName || 'Armada Aurore'}</strong>
        </div>
        <div className="mt-1 rounded-lg bg-emerald-500/12 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
          {biome.bonusSummary}
        </div>
      </div>
    </div>
  );
}
