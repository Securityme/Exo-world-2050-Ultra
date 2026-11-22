import { useMemo, useState } from 'react';
import { ArrowRight, Cpu, GitBranch, Play, ShieldCheck, Sparkles, Swords, Wind } from 'lucide-react';
import { ExoTooltip } from '../../components/bento/ExoTooltip.tsx';
import { ResourceTrendProjectionChart } from '../../components/world/ResourceTrendProjectionChart.tsx';
import { useExoStore } from '../../stores/game.store.ts';
import { DEFAULT_PLAYTEST_SEED, runDeterministicPlaytest6Turns, type Playtest6TurnsReport } from '../../systems/playtest/playtest-6-turns.ts';
import { formatAtmosphereStageName } from '../../utils/atmosphere-labels.ts';

function formatPlaytestStage(tier: 'P1' | 'P2' | 'P2+'): string {
  return tier === 'P2+' ? 'Pré-Atmosphère Respirable' : formatAtmosphereStageName(tier);
}

/** [L7] EXW.L7.JOURNAL_CHRONICLE_PANEL | v4.1.0 | Theme-Synced Playtest 6T (<= 200 lines R-14) */
export function JournalChroniclePanel() {
  const world = useExoStore((s) => s.world);
  const [report, setReport] = useState<Playtest6TurnsReport>(() => runDeterministicPlaytest6Turns(DEFAULT_PLAYTEST_SEED));
  const [selectedTurn, setSelectedTurn] = useState<number>(1);
  const [runCount, setRunCount] = useState<number>(1);
  const activeTurn = useMemo(() => report.turns.find((t) => t.turn === selectedTurn) ?? report.turns[0], [report.turns, selectedTurn]);

  const onRunSimulation = () => {
    setReport(runDeterministicPlaytest6Turns(DEFAULT_PLAYTEST_SEED));
    setRunCount((c) => c + 1);
    setSelectedTurn(1);
  };

  return (
    <div className="space-y-4">
      <div className="exo-surface-sub flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-display text-sm font-bold exo-accent-text">
            <Sparkles className="h-4 w-4 exo-accent-2-text" />
            <span>Playtest &amp; Synthèse Narrative 6 Tours (90 ticks)</span>
          </div>
          <p className="font-mono text-[11px] exo-muted-text">
            PCG32 ({report.seedHex}) · {report.eraTransition} · Exécution #{runCount}
          </p>
        </div>
        <button
          type="button"
          data-testid="run-playtest-6t-btn"
          onClick={onRunSimulation}
          className="exo-accent-btn inline-flex min-h-[44px] items-center gap-2 px-4 text-xs font-bold transition"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Simuler / Synthèse 6 Tours</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {report.turns.map((t) => {
          const active = t.turn === activeTurn?.turn;
          return (
            <button
              key={t.turn}
              type="button"
              data-testid={`playtest-turn-${t.turn}`}
              onClick={() => setSelectedTurn(t.turn)}
              className={`flex min-h-[44px] flex-col items-start px-2.5 py-2 text-left transition ${
                active ? 'exo-accent-chip-active' : 'exo-accent-chip'
              }`}
            >
              <span className="font-display text-xs font-bold">Tour {t.turn}</span>
              <span className="truncate font-mono text-[9.5px] exo-accent-2-text">
                {formatPlaytestStage(t.atmosphereTier)}
              </span>
            </button>
          );
        })}
      </div>

      {activeTurn && (
        <div
          data-testid="playtest-turn-detail"
          className="exo-surface-sub space-y-3 rounded-xl p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-sm font-bold text-[var(--exo-text)]">
                Tour {activeTurn.turn} / 6 (Ticks {activeTurn.ticksLabel})
              </span>
              <ExoTooltip
                title={formatPlaytestStage(activeTurn.atmosphereTier)}
                formula={`Vitesse PNJ : ${activeTurn.pnjSpeedModifierPct}% · ${activeTurn.exposureNote}`}
                body="Les 4 stades (Atmosphère Hostile, Stabilisée, Respirable, Éden) régissent la vitesse chantier PNJ (-40 % à +40 %), l’exposition (4 h/j en stade Hostile) et l’usure des kits O₂."
                accent="emerald"
              >
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-emerald-500 dark:text-emerald-300">
                  <Wind className="h-3 w-3" />
                  {formatPlaytestStage(activeTurn.atmosphereTier)} ({activeTurn.pnjSpeedModifierPct}% PNJ)
                </span>
              </ExoTooltip>
              <ExoTooltip
                title="Amplitude ΔP_adapt (Garde-fou Zod)"
                formula={`ΔP_adapt = ${activeTurn.deltaPAdapt >= 0 ? '+' : ''}${activeTurn.deltaPAdapt.toFixed(2)} ∈ [-0.15, +0.15]`}
                body="Chaque arbitrage d’Atelier 3 Étages borne strictement la dérive probabiliste IA dans [-0.15, +0.15] (R-69)."
                accent="amber"
              >
                <span className="rounded-md border exo-accent-border bg-[var(--exo-accent-soft)] px-2 py-0.5 font-mono text-[10.5px] font-semibold exo-accent-2-text">
                  ΔP_adapt {activeTurn.deltaPAdapt >= 0 ? '+' : ''}{activeTurn.deltaPAdapt.toFixed(2)}
                </span>
              </ExoTooltip>
            </div>
            <span className="inline-flex items-center gap-1 font-mono text-[10.5px] exo-accent-text">
              <ShieldCheck className="h-3.5 w-3.5" />
              SHA-256 : {activeTurn.stateHash.slice(0, 16)}…
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5 rounded-lg border exo-accent-border bg-[var(--exo-surface)] p-3">
              <div className="font-mono text-[10px] font-bold uppercase exo-accent-text">
                Dossiers arbitrés (P0 / C1..C5)
              </div>
              <ul className="space-y-1 text-xs">
                {activeTurn.dossiers.map((d) => <li key={d}>• {d}</li>)}
              </ul>
            </div>
            <div className="space-y-1.5 rounded-lg border exo-accent-border bg-[var(--exo-surface)] p-3">
              <div className="font-mono text-[10px] font-bold uppercase exo-accent-2-text">
                Atelier 3 Étages &amp; Mutation Monde
              </div>
              <p className="text-xs font-medium">{activeTurn.workshopChoice}</p>
              <p className="text-[11px] exo-muted-text">{activeTurn.mutationSummary}</p>
            </div>
          </div>

          {activeTurn.delayedEchoes.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border exo-accent-border bg-[var(--exo-accent-soft)] px-3 py-2 text-xs">
              <GitBranch className="h-3.5 w-3.5 shrink-0 exo-accent-text" />
              {activeTurn.delayedEchoes.map((echo) => (
                <span key={echo.code} className="flex flex-wrap items-center gap-1.5">
                  <strong className="font-mono exo-accent-2-text">{echo.code}</strong>
                  <span className="font-mono text-[10px] exo-accent-text">
                    T{echo.originTurn} <ArrowRight className="inline h-3 w-3" /> T{echo.resolutionTurn} ({echo.horizon})
                  </span>
                  <span>: {echo.summary}</span>
                </span>
              ))}
            </div>
          )}

          {activeTurn.combatPhases && (
            <div className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold exo-accent-2-text">
                <Swords className="h-3.5 w-3.5" />
                <span>Résolution Combat Déterministe 4 Phases (Tuile #29 · Compute 2.20x)</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {activeTurn.combatPhases.map((p) => (
                  <div key={p.phase} className="rounded-lg border exo-accent-border bg-[var(--exo-surface)] p-2 text-[11px]">
                    <div className="font-mono font-bold exo-accent-text">Phase {p.phase} · {p.label}</div>
                    <div className="mt-0.5 exo-muted-text">{p.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ResourceTrendProjectionChart world={world} report={report} />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider exo-accent-text">
            <Cpu className="h-3.5 w-3.5" />
            <span>Comparateur Fin Tour 6 — Solo vs 5 Superpuissances IA &amp; Super-Alliance</span>
          </h4>
          <span className="font-mono text-[10px] exo-muted-text">
            Chaîne SHA-256 finale : {report.finalChainHash.slice(0, 14)}…
          </span>
        </div>
        <div className="exo-surface-sub overflow-x-auto rounded-xl">
          <table className="min-w-[640px] w-full text-left font-mono text-[11px]">
            <thead className="border-b exo-accent-border bg-[var(--exo-surface)] text-[10px] uppercase exo-accent-text">
              <tr>
                <th className="px-3 py-2">Superpuissance</th><th className="px-3 py-2">Étoiles</th>
                <th className="px-3 py-2">Tuiles</th><th className="px-3 py-2">Atmo</th>
                <th className="px-3 py-2">Compute</th><th className="px-3 py-2">Diplomatie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--exo-accent-soft)]">
              {report.superpowerComparison.map((row) => (
                <tr key={row.name} className={row.isPlayer ? 'bg-[var(--exo-accent-soft)] font-semibold' : row.isSuperAlliance ? 'exo-accent-2-text' : ''}>
                  <td className="px-3 py-2">{row.name}</td><td className="px-3 py-2">{row.eraStars}</td>
                  <td className="px-3 py-2">{row.tilesControlled}</td><td className="px-3 py-2">{row.atmosphereLocal}</td>
                  <td className="px-3 py-2">{row.computeRatio}</td><td className="px-3 py-2">{row.diplomacyStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
