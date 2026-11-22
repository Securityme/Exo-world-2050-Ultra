import { useMemo, useState } from 'react';
import { Area, Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, TrendingDown, TrendingUp } from 'lucide-react';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import { resolveThemeSnapshot } from '../../data/ui-themes.catalog.ts';
import { useExoStore } from '../../stores/game.store.ts';
import type { Playtest6TurnsReport } from '../../systems/playtest/playtest-6-turns.ts';
import { buildResourceTrendProjection18, type ResourcePillar } from '../../systems/playtest/resource-trend-projection.ts';

/** [L7] EXW.L7.RESOURCE_TREND_PROJECTION_CHART | v4.1.0 | Theme-Synced Recharts (<= 200 lines R-14) */
interface ResourceTrendProjectionChartProps {
  readonly world: WorldState;
  readonly report: Playtest6TurnsReport;
}

const PILLAR_LABELS: Readonly<Record<'ALL' | ResourcePillar, string>> = {
  ALL: '18 Ressources',
  ENERGIE_FLUIDES: 'Énergie & Fluides',
  INDUSTRIE_TECH: 'Industrie & Tech',
  BIOSPHERE_SURVIE: 'Biosphère & Survie',
  SOUVERAINETE_ORBITE: 'Souveraineté & Orbite',
};

export function ResourceTrendProjectionChart({
  world,
  report,
}: ResourceTrendProjectionChartProps) {
  const uiTheme = useExoStore((s) => s.uiTheme);
  const themeMode = useExoStore((s) => s.graphics.themeMode);
  const resolvedTheme = useMemo(
    () => resolveThemeSnapshot(uiTheme, themeMode === 'DARK_BENTO'),
    [uiTheme, themeMode],
  );
  const projection = useMemo(
    () => buildResourceTrendProjection18(world, report),
    [world, report],
  );
  const [pillarFilter, setPillarFilter] = useState<'ALL' | ResourcePillar>('ALL');
  const [selectedId, setSelectedId] = useState<'AGGREGATE' | string>('AGGREGATE');

  const filteredResources = useMemo(
    () =>
      pillarFilter === 'ALL'
        ? projection.resources
        : projection.resources.filter((r) => r.pillar === pillarFilter),
    [projection.resources, pillarFilter],
  );

  const selectedSeries = useMemo(
    () =>
      selectedId === 'AGGREGATE'
        ? null
        : projection.resources.find((r) => r.id === selectedId) ?? null,
    [projection.resources, selectedId],
  );

  const chartData = useMemo(() => {
    if (selectedSeries) {
      return selectedSeries.points.map((pt) => ({
        label: `${pt.label} (${pt.atmosphereTier})`,
        Production: pt.production,
        Consommation: pt.consumption,
        SoldeNet: pt.net,
      }));
    }
    return projection.aggregateTurns.map((t) => ({
      label: t.label,
      Production: t.totalProduction,
      Consommation: t.totalConsumption,
      SoldeNet: t.netBalance,
    }));
  }, [projection.aggregateTurns, selectedSeries]);

  const { palette } = resolvedTheme;

  return (
    <section
      data-testid="resource-trend-projection"
      className="exo-surface-sub space-y-3 rounded-xl p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider exo-accent-text">
            <Activity className="h-3.5 w-3.5 exo-accent-2-text" />
            <span>
              Resource Trend Projection · 6 Tours (
              {selectedSeries ? `${selectedSeries.label} [${selectedSeries.unit}]` : 'Agrégat 18 Ressources'})
            </span>
          </h4>
          <p className="font-mono text-[10.5px] exo-muted-text">
            Production prédite vs Consommation · {projection.surplusCount} excédents · {projection.deficitCount} déficits
          </p>
        </div>

        <div className="flex flex-wrap gap-1 font-mono text-[10px]">
          {(['ALL', 'ENERGIE_FLUIDES', 'INDUSTRIE_TECH', 'BIOSPHERE_SURVIE', 'SOUVERAINETE_ORBITE'] as const).map(
            (p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPillarFilter(p)}
                className={`min-h-[30px] px-2 font-semibold transition ${
                  pillarFilter === p ? 'exo-accent-chip-active' : 'exo-accent-chip'
                }`}
              >
                {PILLAR_LABELS[p]}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="h-56 w-full rounded-xl border exo-accent-border bg-[var(--exo-void)] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 2 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={`rgba(${palette.accentRgb}, 0.18)`} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: palette.textMutedHex }} />
            <YAxis tick={{ fontSize: 10, fill: palette.textMutedHex }} width={44} />
            <Tooltip
              contentStyle={{
                backgroundColor: palette.surfaceHex,
                borderColor: palette.accentHex,
                borderRadius: '10px',
                fontSize: '11px',
                color: palette.textHex,
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', color: palette.textHex }} />
            <Area
              type="monotone"
              dataKey="Production"
              fill={`rgba(${palette.accentRgb}, 0.24)`}
              stroke={palette.accentHex}
              strokeWidth={2}
            />
            <Bar dataKey="Consommation" fill={palette.accent2Hex} radius={[4, 4, 0, 0]} barSize={20} />
            <Line
              type="monotone"
              dataKey="SoldeNet"
              name="Solde Net"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 3, fill: '#10B981' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
        <button
          type="button"
          data-testid="trend-select-aggregate"
          onClick={() => setSelectedId('AGGREGATE')}
          className={`flex min-h-[38px] items-center justify-between px-2 py-1 font-mono text-[10px] transition ${
            selectedId === 'AGGREGATE' ? 'exo-accent-chip-active font-bold' : 'exo-accent-chip'
          }`}
        >
          <span>Σ 18 Total</span>
          <span className="text-emerald-500 dark:text-emerald-300">6T</span>
        </button>

        {filteredResources.map((res) => {
          const active = selectedId === res.id;
          const positive = res.net6TurnTotal >= 0;
          return (
            <button
              key={res.id}
              type="button"
              data-testid={`trend-res-${res.id}`}
              onClick={() => setSelectedId(res.id)}
              className={`flex min-h-[38px] items-center justify-between gap-1 px-2 py-1 text-left font-mono text-[10px] transition ${
                active ? 'exo-accent-chip-active font-bold' : 'exo-accent-chip'
              }`}
            >
              <span className="truncate">{res.shortLabel}</span>
              <span
                className={`inline-flex shrink-0 items-center gap-0.5 font-bold ${
                  positive ? 'text-emerald-500 dark:text-emerald-300' : 'exo-accent-2-text'
                }`}
              >
                {positive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {positive ? `+${res.net6TurnTotal}` : res.net6TurnTotal}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
