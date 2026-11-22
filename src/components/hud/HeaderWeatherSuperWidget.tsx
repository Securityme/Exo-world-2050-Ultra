import { useMemo, useState } from 'react';
import { useSetAtom } from 'jotai';
import {
  AlertTriangle,
  Calendar,
  CloudRain,
  Flame,
  Leaf,
  Snowflake,
  Sun,
  Video,
  Wind,
  X,
} from 'lucide-react';
import { useExoStore } from '../../stores/game.store.ts';
import {
  activeSubscreenAtom,
  worldsHubDomainAtom,
  worldsHubSubViewAtom,
} from '../../stores/selection.atoms.ts';
import {
  computeClimateLedger,
  type WeatherCode,
} from '../../systems/biosphere/climate-ledger.ts';

type WeatherTab = 'CHRONO' | 'AIR' | 'DISASTERS';

function WeatherIcon({ code, className }: { readonly code: WeatherCode; readonly className?: string }) {
  if (code === 'RAIN') return <CloudRain className={className} />;
  if (code === 'SOLAR_FLARE') return <Flame className={className} />;
  if (code === 'CRYO_FRONT') return <Snowflake className={className} />;
  if (code === 'DUST_STORM') return <Wind className={className} />;
  return <Sun className={className} />;
}

/**
 * [L7] EXW.L7.HEADER_WEATHER_SUPER_WIDGET | v5.0.0 | SADT A5.1
 * Top-bar Weather, Air Quality & 3-Turn Chronology Super-Widget with direct Biosphere & Video shortcuts.
 */
export function HeaderWeatherSuperWidget() {
  const world = useExoStore((s) => s.world);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
  const setWorldsDomain = useSetAtom(worldsHubDomainAtom);
  const setWorldsSubView = useSetAtom(worldsHubSubViewAtom);

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<WeatherTab>('CHRONO');

  const ledger = useMemo(() => computeClimateLedger(world), [world]);

  const toneBadge =
    ledger.airTone === 'critical'
      ? 'border-rose-400/75 text-rose-500 dark:text-rose-300'
      : ledger.airTone === 'warning'
        ? 'border-amber-400/75 text-amber-600 dark:text-amber-300'
        : 'border-emerald-400/75 text-emerald-600 dark:text-emerald-300';

  const openBiosphere = () => {
    setWorldsDomain('BIOSPHERE');
    setWorldsSubView('CLIMATE');
    setSubscreen('WORLDS_HUB');
    setOpen(false);
  };

  const openWeatherVideo = () => {
    setWorldsDomain('BIOSPHERE');
    setWorldsSubView('VIDEO_STUDIO');
    setSubscreen('WORLDS_HUB');
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        data-testid="header-weather-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Ouvrir le super-widget Météo, Qualité d'Air et Chronologie"
        className={`exo-accent-chip inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2 py-1 font-mono-num text-[10.5px] font-semibold transition sm:min-h-[36px] ${
          open ? 'ring-2 ring-[var(--exo-accent)]' : ''
        }`}
      >
        <WeatherIcon code={ledger.weatherCode} className="h-3.5 w-3.5 shrink-0 exo-accent-2-text" />
        <span className="hidden whitespace-nowrap lg:inline">
          {ledger.seasonLabel} {ledger.currentYear}
        </span>
        <span className="whitespace-nowrap">{ledger.weatherLabel}</span>
        {ledger.activeDisasterCount > 0 && (
          <span className="inline-flex items-center gap-0.5 rounded bg-rose-500/20 px-1 py-0.5 text-[9.5px] font-bold text-rose-500 dark:text-rose-300">
            <AlertTriangle className="h-2.5 w-2.5" />
            {ledger.activeDisasterCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Prévisions météo, qualité d'air et catastrophes"
          data-testid="header-weather-popover"
          className="exo-bento-card fixed inset-x-2 top-[62px] z-50 max-h-[80dvh] overflow-y-auto p-3.5 shadow-2xl sm:absolute sm:inset-x-auto sm:left-0 sm:top-11 sm:w-[420px]"
        >
          <div className="flex items-start justify-between gap-2 border-b exo-accent-border pb-2.5">
            <div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider exo-accent-text">
                <WeatherIcon code={ledger.weatherCode} className="h-3.5 w-3.5 exo-accent-2-text" />
                <span>
                  Tour {ledger.currentTurn} · {ledger.seasonLabel} {ledger.currentYear}
                </span>
              </div>
              <div className={`mt-1 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10.5px] font-bold ${toneBadge}`}>
                <Leaf className="h-3 w-3" />
                <span>{ledger.airQualityTitle}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le module météo"
              className="exo-accent-chip inline-flex h-8 w-8 items-center justify-center rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 3 Navigation Tabs */}
          <div className="mt-2.5 grid grid-cols-3 gap-1" role="tablist">
            {(
              [
                { id: 'CHRONO', label: 'Chronologie' },
                { id: 'AIR', label: "Qualité d'air" },
                { id: 'DISASTERS', label: `Catastrophes (${ledger.activeDisasterCount})` },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`min-h-[34px] rounded-lg px-2 font-mono text-[10.5px] font-bold transition ${
                  tab === t.id ? 'exo-accent-chip-active' : 'exo-accent-chip'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'CHRONO' && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase exo-muted-text">
                <Calendar className="h-3 w-3" />
                <span>Prévisions sur les 3 prochains tours</span>
              </div>
              {ledger.forecasts.map((f) => (
                <div
                  key={f.turnNumber}
                  className="exo-surface-sub flex items-center justify-between gap-2 rounded-lg border exo-accent-border px-2.5 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <WeatherIcon code={f.weatherCode} className="h-4 w-4 exo-accent-2-text" />
                    <div>
                      <div className="font-semibold text-[var(--exo-text)]">
                        Tour {f.turnNumber} · {f.seasonLabel} {f.year}
                      </div>
                      <div className="text-[11px] exo-muted-text">{f.weatherLabel}</div>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[10px]">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 font-bold ${
                        f.riskLevel === 'CRITIQUE'
                          ? 'bg-rose-500/20 text-rose-500 dark:text-rose-300'
                          : f.riskLevel === 'VIGILANCE'
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                      }`}
                    >
                      {f.riskLevel}
                    </span>
                    <div className="mt-0.5 exo-muted-text">Fiabilité {f.confidencePct}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'AIR' && (
            <div className="mt-3 space-y-2">
              <p className="rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] p-2.5 text-xs leading-relaxed text-[var(--exo-text)]">
                {ledger.airQualityDetail}
              </p>
              <div className="font-mono text-[10px] uppercase exo-muted-text">
                Critères influençant la météo planétaire
              </div>
              <div className="space-y-1.5">
                {ledger.criteria.map((c) => (
                  <div
                    key={c.id}
                    className="exo-surface-sub flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--exo-text)]">{c.label}</div>
                      <div className="text-[11px] exo-muted-text">{c.impactSummary}</div>
                    </div>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10.5px] font-bold ${
                        c.scoreDelta >= 0
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                      }`}
                    >
                      {c.scoreDelta >= 0 ? `+${c.scoreDelta}` : c.scoreDelta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'DISASTERS' && (
            <div className="mt-3 space-y-2">
              {ledger.disasterHistory.map((d) => (
                <div
                  key={d.turnNumber}
                  className="exo-surface-sub rounded-lg border exo-accent-border p-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2 font-mono text-[10.5px]">
                    <span className="font-bold text-[var(--exo-text)]">
                      Tour {d.turnNumber} · {d.activeCount} phénomène(s)
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-bold ${
                        d.peakIntensityPct >= 60
                          ? 'bg-rose-500/20 text-rose-500 dark:text-rose-300'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                      }`}
                    >
                      Intensité {d.peakIntensityPct}%
                    </span>
                  </div>
                  <div className="mt-1 font-semibold text-[var(--exo-text)]">{d.primaryLabel}</div>
                  <div className="mt-0.5 text-[11px] exo-muted-text">{d.damageSummary}</div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2 border-t exo-accent-border pt-2.5">
            <button
              type="button"
              onClick={openBiosphere}
              className="exo-accent-chip inline-flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 font-mono text-[11px] font-bold"
            >
              <Leaf className="h-3.5 w-3.5 exo-accent-text" />
              <span>Ouvrir Biosphère</span>
            </button>
            <button
              type="button"
              onClick={openWeatherVideo}
              className="exo-accent-btn inline-flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 font-mono text-[11px] font-bold"
            >
              <Video className="h-3.5 w-3.5" />
              <span>Vidéo Météo</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
