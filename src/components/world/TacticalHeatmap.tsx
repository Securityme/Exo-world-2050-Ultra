import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useAtom } from 'jotai';
import { Crosshair, Layers, ShieldAlert, X } from 'lucide-react';
import type { UnitLevel } from '../../contracts/combat-units.schema.ts';
import type { AtmosphereTier } from '../../contracts/render-bridge.schema.ts';
import { resolveThemeSnapshot } from '../../data/ui-themes.catalog.ts';
import { useExoStore } from '../../stores/game.store.ts';
import { tacticalHeatmapOpenAtom } from '../../stores/selection.atoms.ts';
import {
  ATMOSPHERIC_ZONES,
  UNIT_LEVELS,
  buildTacticalIntensityGrid,
  type TacticalGridCell,
} from '../../systems/combat-conquest/tactical-intensity-grid.ts';

/**
 * [L7] EXW.L7.TACTICAL_HEATMAP | v4.1.0 | Theme-Synced D3 3D Grid (<= 200 lines R-14)
 * D3-powered 3D isometric grid intensity overlay mapping L1-L5 military unit
 * concentrations across planetary atmospheric zones (P1-P4). Zero backdrop-blur over WebGL.
 */
const ISO_W = 46;
const ISO_H = 24;
const ORIGIN_X = 250;
const ORIGIN_Y = 128;

function projectIso(col: number, row: number): [number, number] {
  return [ORIGIN_X + (col - row) * ISO_W, ORIGIN_Y + (col + row) * ISO_H];
}

export function TacticalHeatmap() {
  const [open, setOpen] = useAtom(tacticalHeatmapOpenAtom);
  const world = useExoStore((s) => s.world);
  const uiTheme = useExoStore((s) => s.uiTheme);
  const themeMode = useExoStore((s) => s.graphics.themeMode);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [zoneFilter, setZoneFilter] = useState<'ALL' | AtmosphereTier>('ALL');
  const [tierFilter, setTierFilter] = useState<'ALL' | UnitLevel>('ALL');
  const [hovered, setHovered] = useState<TacticalGridCell | null>(null);

  const resolvedTheme = useMemo(
    () => resolveThemeSnapshot(uiTheme, themeMode === 'DARK_BENTO'),
    [uiTheme, themeMode],
  );
  const summary = useMemo(() => buildTacticalIntensityGrid(world), [world]);
  const visibleCells = useMemo(
    () =>
      summary.cells.filter(
        (c) =>
          (zoneFilter === 'ALL' || c.zone === zoneFilter) &&
          (tierFilter === 'ALL' || c.level === tierFilter),
      ),
    [summary.cells, zoneFilter, tierFilter],
  );

  useEffect(() => {
    if (!open || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const { palette, isDark } = resolvedTheme;
    const lowTone = isDark ? palette.surfaceAltHex : '#e2e8f0';
    const colorScale = d3
      .scaleSequential<string>()
      .domain([0.08, 1])
      .interpolator(d3.interpolateRgbBasis([lowTone, palette.accentHex, palette.accent2Hex, '#ef4444']));

    const g = svg.append('g').attr('class', 'tactical-iso-scene');
    const sorted = [...visibleCells].sort((a, b) => a.zoneIndex + a.levelIndex - (b.zoneIndex + b.levelIndex));
    const groups = g.selectAll<SVGGElement, TacticalGridCell>('g.iso-prism').data(sorted, (d) => d.id).enter().append('g').attr('class', 'iso-prism').style('cursor', 'pointer')
      .on('mouseenter', (_ev, d) => setHovered(d)).on('click', (_ev, d) => setHovered(d));

    groups.each(function renderPrism(d) {
      const node = d3.select(this);
      const [cx, cy] = projectIso(d.levelIndex, d.zoneIndex);
      const h = d.elevationPx;
      const hw = ISO_W * 0.78;
      const hh = ISO_H * 0.78;
      const baseColor = d3.color(colorScale(d.intensity));
      const topFill = baseColor ? baseColor.brighter(0.3).formatHex() : palette.accentHex;
      const leftFill = baseColor ? baseColor.darker(0.55).formatHex() : palette.surfaceAltHex;
      const rightFill = baseColor ? baseColor.darker(1.05).formatHex() : palette.voidHex;
      node.append('polygon').attr('points', `${cx - hw},${cy - h} ${cx},${cy - h + hh} ${cx},${cy + hh} ${cx - hw},${cy}`).attr('fill', leftFill).attr('stroke', palette.voidHex).attr('stroke-width', 0.9);
      node.append('polygon').attr('points', `${cx + hw},${cy - h} ${cx},${cy - h + hh} ${cx},${cy + hh} ${cx + hw},${cy}`).attr('fill', rightFill).attr('stroke', palette.voidHex).attr('stroke-width', 0.9);
      node.append('polygon').attr('points', `${cx},${cy - h - hh} ${cx + hw},${cy - h} ${cx},${cy - h + hh} ${cx - hw},${cy - h}`).attr('fill', topFill).attr('stroke', palette.textHex).attr('stroke-opacity', 0.45).attr('stroke-width', 0.8);
      node.append('text').attr('x', cx).attr('y', cy - h + 3).attr('text-anchor', 'middle').attr('fill', palette.accentOnHex).attr('font-family', 'monospace').attr('font-size', 9).attr('font-weight', 800).text(`${Math.round(d.intensity * 100)}%`);
    });

    for (let z = 0; z < ATMOSPHERIC_ZONES.length; z++) {
      const [lx, ly] = projectIso(-1.25, z);
      g.append('text').attr('x', lx - 4).attr('y', ly + 4).attr('text-anchor', 'end').attr('fill', palette.textMutedHex).attr('font-family', 'monospace').attr('font-size', 10.5).attr('font-weight', 700).text(ATMOSPHERIC_ZONES[z]!.tier);
    }
    for (let l = 0; l < UNIT_LEVELS.length; l++) {
      const [rx, ry] = projectIso(l, ATMOSPHERIC_ZONES.length - 0.15);
      g.append('text').attr('x', rx + 2).attr('y', ry + 18).attr('text-anchor', 'middle').attr('fill', palette.accentHex).attr('font-family', 'monospace').attr('font-size', 10.5).attr('font-weight', 700).text(`L${UNIT_LEVELS[l]}`);
    }
  }, [open, visibleCells, resolvedTheme]);

  if (!open) return null;
  const activeCell = hovered ?? visibleCells[0] ?? null;

  return (
    <aside
      data-testid="tactical-heatmap-overlay"
      aria-label="Carte d'intensité tactique 3D L1–L5 par zone atmosphérique"
      className="exo-bento-card exo-astral-ticks exo-hud-panel pointer-events-auto fixed right-3 top-16 z-30 flex w-[min(560px,calc(100vw-1.5rem))] flex-col gap-2.5 p-3.5"
    >
      <div className="flex items-center justify-between gap-2 border-b exo-accent-border pb-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 exo-accent-text" />
          <div>
            <h3 className="font-display text-xs font-bold uppercase tracking-wider exo-accent-text">
              Carte Tactique 3D · Unités L1–L5 × Zones Atmosphériques
            </h3>
            <p className="font-mono text-[10px] exo-muted-text">
              Pic {summary.peakZone}·L{summary.peakLevel} · Alliés {summary.totalAlliedUnits} vs Rivaux {summary.totalRivalUnits}
            </p>
          </div>
        </div>
        <button
          type="button"
          data-testid="close-tactical-heatmap-btn"
          onClick={() => setOpen(false)}
          aria-label="Fermer la carte tactique 3D"
          className="exo-accent-chip inline-flex h-9 w-9 items-center justify-center"
        >
          <X className="h-4 w-4 exo-accent-text" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-1.5 font-mono text-[10px]">
        <div className="flex flex-wrap gap-1">
          {(
            [
              ['ALL', 'Toutes Zones'],
              ['P1', 'Hostile'],
              ['P2', 'Stabilisée'],
              ['P3', 'Respirable'],
              ['P4', 'Éden'],
            ] as const
          ).map(([z, label]) => (
            <button
              key={z}
              type="button"
              onClick={() => setZoneFilter(z)}
              className={`min-h-[30px] px-2 font-semibold transition ${
                zoneFilter === z ? 'exo-accent-chip-active' : 'exo-accent-chip'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {(['ALL', 1, 2, 3, 4, 5] as const).map((lv) => (
            <button
              key={lv}
              type="button"
              onClick={() => setTierFilter(lv)}
              className={`min-h-[30px] px-2 font-semibold transition ${
                tierFilter === lv ? 'exo-accent-chip-active' : 'exo-accent-chip'
              }`}
            >
              {lv === 'ALL' ? 'L1–L5' : `L${lv}`}
            </button>
          ))}
        </div>
      </div>

      <div className="exo-surface-sub rounded-xl p-1">
        <svg ref={svgRef} viewBox="0 0 540 315" className="h-56 w-full sm:h-64" role="img" aria-label="Grille 3D isométrique D3 d'intensité militaire L1-L5" />
      </div>

      <div className="exo-surface-sub flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 font-mono text-[11px]">
        {activeCell ? (
          <>
            <span className="inline-flex items-center gap-1.5 font-bold exo-accent-text">
              <Crosshair className="h-3.5 w-3.5 exo-accent-2-text" />
              {activeCell.zoneLabel} · Niveau L{activeCell.level}
            </span>
            <span>
              Alliés <strong>{activeCell.alliedUnits}</strong> · Rivaux <strong>{activeCell.rivalUnits}</strong> · Puiss. <strong className="exo-accent-2-text">{activeCell.totalPower}</strong>
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 dark:text-emerald-300">
              <ShieldAlert className="h-3 w-3" />
              PNJ {activeCell.pnjModifierPct >= 0 ? `+${activeCell.pnjModifierPct}` : activeCell.pnjModifierPct}%
            </span>
          </>
        ) : (
          <span className="exo-muted-text">Sélectionnez un prisme 3D pour inspecter la concentration militaire.</span>
        )}
      </div>
    </aside>
  );
}
