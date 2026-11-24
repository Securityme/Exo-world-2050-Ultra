import { useEffect, useMemo, useState } from 'react';
import { useSetAtom } from 'jotai';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  GitCompare,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Trophy,
} from 'lucide-react';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import { SUPERPOWERS_CATALOG } from '../../data/world.catalog.ts';
import { listLocalCampaigns } from '../../services/saves/local-saves.service.ts';
import { toastNoticeAtom } from '../../stores/selection.atoms.ts';
import {
  buildCampaignComparisonRows,
  buildCampaignTimelineFrames,
  formatCampaignCsvExport,
  formatCampaignHtmlReport,
} from '../../systems/journal/archives-analytics.ts';
import { formatAtmosphereStageName } from '../../utils/atmosphere-labels.ts';

/**
 * [L7] EXW.L7.JOURNAL_ARCHIVES_SUITE | v5.1.0 | SADT A5.1
 * Interactive Archives Suite replacing legacy roadmap placeholders:
 * 1) Frise Chronologique & Replay (cycle scrubber + play/pause + SVG evolution chart)
 * 2) Export CSV & Rapport HTML Mis en Page (direct Blob download, zero window.open)
 * 3) Comparateur de Campagnes (active campaign vs local saves + Seed 0x2050E801 benchmark)
 */
interface JournalArchivesSuiteProps {
  readonly world: WorldState;
}

function triggerBlobDownload(content: string, mime: string, filename: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function JournalArchivesSuite({ world }: JournalArchivesSuiteProps) {
  const setToast = useSetAtom(toastNoticeAtom);
  const frames = useMemo(() => buildCampaignTimelineFrames(world), [world]);
  const [frameIdx, setFrameIdx] = useState<number>(() => Math.max(0, frames.length - 1));
  const [playing, setPlaying] = useState(false);

  const clampedIdx = Math.min(frameIdx, Math.max(0, frames.length - 1));
  const currentFrame = frames[clampedIdx] ?? frames[0];

  useEffect(() => {
    if (!playing || frames.length <= 1) return;
    const timer = window.setInterval(() => {
      setFrameIdx((prev) => {
        if (prev >= frames.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 950);
    return () => window.clearInterval(timer);
  }, [playing, frames.length]);

  const superpower = SUPERPOWERS_CATALOG.find((s) => s.id === world.superpowerId);
  const localSaves = useMemo(() => listLocalCampaigns(), [world.cycle, world.stateHash]);
  const comparisonRows = useMemo(
    () => buildCampaignComparisonRows(world, localSaves),
    [world, localSaves],
  );
  const maxComparisonScore = Math.max(1, ...comparisonRows.map((r) => r.score));

  const onExportCsv = () => {
    const csv = formatCampaignCsvExport(world);
    triggerBlobDownload(
      csv,
      'text/csv;charset=utf-8',
      `exo-world-ledger-${world.campaignId}-c${world.cycle}.csv`,
    );
    setToast({
      id: Date.now(),
      tone: 'success',
      text: `Export CSV téléchargé (${frames.length} cycle(s), ${world.districts.length} quartiers).`,
    });
  };

  const onExportHtml = () => {
    const html = formatCampaignHtmlReport(world, superpower?.name ?? world.superpowerId);
    triggerBlobDownload(
      html,
      'text/html;charset=utf-8',
      `exo-world-rapport-${world.campaignId}-c${world.cycle}.html`,
    );
    setToast({
      id: Date.now(),
      tone: 'success',
      text: 'Rapport souverain HTML mis en page prêt à imprimer ou partager.',
    });
  };

  // Build SVG polyline points for Atmosphere % and Approval %
  const svgW = 360;
  const svgH = 88;
  const atmoPoints = frames
    .map((f, i) => {
      const x = frames.length === 1 ? svgW / 2 : 12 + (i / (frames.length - 1)) * (svgW - 24);
      const y = svgH - 12 - (Math.max(0, Math.min(100, f.atmoPct)) / 100) * (svgH - 24);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const approvalPoints = frames
    .map((f, i) => {
      const x = frames.length === 1 ? svgW / 2 : 12 + (i / (frames.length - 1)) * (svgW - 24);
      const y = svgH - 12 - (Math.max(0, Math.min(100, f.approvalPct)) / 100) * (svgH - 24);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const markerX =
    frames.length <= 1 ? svgW / 2 : 12 + (clampedIdx / (frames.length - 1)) * (svgW - 24);

  return (
    <div className="space-y-4">
      {/* 1. Interactive Timeline & Replay */}
      <section
        data-testid="archives-timeline-replay"
        className="rounded-xl border border-rose-200/90 bg-white/95 p-4 dark:border-rose-900/60 dark:bg-[#190d1f]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 font-display text-sm font-bold text-[#1f1224] dark:text-rose-50">
              <BarChart3 className="h-4 w-4 text-rose-600 dark:text-rose-300" />
              <span>Frise Chronologique &amp; Replay de Campagne</span>
            </h3>
            <p className="mt-0.5 text-xs text-rose-900/70 dark:text-rose-200/70">
              Parcourez l’évolution cycle par cycle de votre atmosphère, approbation civique et territoire.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setFrameIdx(0);
              }}
              aria-label="Revenir au cycle 1"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-900 hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              data-testid="archives-replay-toggle"
              onClick={() => {
                if (clampedIdx >= frames.length - 1) setFrameIdx(0);
                setPlaying((p) => !p);
              }}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-rose-600 px-3 font-mono text-xs font-bold text-white hover:bg-rose-500"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{playing ? 'Pause' : 'Rejouer'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setFrameIdx(Math.max(0, frames.length - 1));
              }}
              aria-label="Aller au dernier cycle"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-900 hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-12">
          <div className="rounded-xl border border-rose-200/75 bg-rose-50/45 p-3 dark:border-rose-900/50 dark:bg-rose-950/25 lg:col-span-7">
            <div className="mb-1.5 flex items-center justify-between font-mono text-[10.5px] text-rose-900/75 dark:text-rose-200/75">
              <span>Courbes d’évolution ({frames.length} cycle{frames.length > 1 ? 's' : ''})</span>
              <span>Émeraude : Atmosphère % · Rose : Approbation %</span>
            </div>
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="h-24 w-full overflow-visible"
              role="img"
              aria-label="Courbe d'évolution atmosphère et approbation"
            >
              <line x1="12" y1={svgH - 12} x2={svgW - 12} y2={svgH - 12} stroke="currentColor" strokeOpacity="0.16" />
              <line x1="12" y1={svgH / 2} x2={svgW - 12} y2={svgH / 2} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
              <line x1={markerX} y1="8" x2={markerX} y2={svgH - 10} stroke="#e11d48" strokeOpacity="0.45" strokeDasharray="3 3" />
              {frames.length > 1 ? (
                <>
                  <polyline fill="none" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" points={atmoPoints} />
                  <polyline fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 3" points={approvalPoints} />
                </>
              ) : (
                <>
                  <circle cx={markerX} cy={svgH - 12 - ((currentFrame?.atmoPct ?? 20) / 100) * (svgH - 24)} r="4" fill="#10b981" />
                  <circle cx={markerX} cy={svgH - 12 - ((currentFrame?.approvalPct ?? 60) / 100) * (svgH - 24)} r="4" fill="#f43f5e" />
                </>
              )}
            </svg>
            <div className="mt-2 flex items-center gap-3">
              <span className="font-mono text-[11px] font-semibold tabular-nums text-rose-900 dark:text-rose-100">
                C1
              </span>
              <input
                type="range"
                min={0}
                max={Math.max(0, frames.length - 1)}
                value={clampedIdx}
                onChange={(e) => {
                  setPlaying(false);
                  setFrameIdx(Number(e.target.value));
                }}
                aria-label="Curseur de cycle de la frise chronologique"
                className="h-2 flex-1 cursor-pointer accent-rose-600"
              />
              <span className="font-mono text-[11px] font-semibold tabular-nums text-rose-900 dark:text-rose-100">
                C{frames[frames.length - 1]?.cycle ?? 1}
              </span>
            </div>
          </div>

          {currentFrame && (
            <div className="flex flex-col justify-between rounded-xl border border-rose-200/75 bg-white/85 p-3 dark:border-rose-900/50 dark:bg-[#140a1a] lg:col-span-5">
              <div>
                <div className="flex items-center justify-between font-mono text-[11px] text-rose-700 dark:text-rose-300">
                  <span>
                    Cycle {currentFrame.cycle} · {currentFrame.year} ({currentFrame.season})
                  </span>
                  <span className="tabular-nums">Ère {currentFrame.era}</span>
                </div>
                <div className="mt-1 font-display text-sm font-bold text-[#1f1224] dark:text-rose-50">
                  {currentFrame.headline}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs tabular-nums">
                <div className="rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-emerald-900 dark:text-emerald-200">
                  <div className="text-[10px] opacity-75">Atmosphère</div>
                  <div className="font-bold">{currentFrame.atmoPct}%</div>
                </div>
                <div className="rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-rose-900 dark:text-rose-200">
                  <div className="text-[10px] opacity-75">Approbation</div>
                  <div className="font-bold">{currentFrame.approvalPct}%</div>
                </div>
                <div className="rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-amber-900 dark:text-amber-200">
                  <div className="text-[10px] opacity-75">Trésorerie</div>
                  <div className="font-bold">{currentFrame.creditsEst} Cr</div>
                </div>
                <div className="rounded-lg bg-indigo-500/10 px-2.5 py-1.5 text-indigo-900 dark:text-indigo-200">
                  <div className="text-[10px] opacity-75">Score / Secteurs</div>
                  <div className="font-bold">
                    {currentFrame.score} · {currentFrame.capturedCount}/72
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. Formatted Exports (CSV Ledger & Standalone Printable HTML Report) + 3. Campaign Comparator */}
      <div className="grid gap-4 lg:grid-cols-12">
        <section
          data-testid="archives-formatted-export"
          className="flex flex-col justify-between rounded-xl border border-rose-200/90 bg-white/95 p-4 dark:border-rose-900/60 dark:bg-[#190d1f] lg:col-span-5"
        >
          <div>
            <h3 className="flex items-center gap-2 font-display text-sm font-bold text-[#1f1224] dark:text-rose-50">
              <Download className="h-4 w-4 text-rose-600 dark:text-rose-300" />
              <span>Exports Mis en Page (CSV &amp; Rapport HTML)</span>
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-rose-900/75 dark:text-rose-200/75">
              Téléchargez un registre tableur complet (UTF-8) ou un dossier souverain autonome prêt à imprimer ou partager.
            </p>
            <div className="mt-3 space-y-1.5 font-mono text-[11px] text-rose-950/80 dark:text-rose-100/80">
              <div>• {world.districts.length} quartiers avec niveau, intégrité &amp; extensions</div>
              <div>• {frames.length} cycles archivés ({formatAtmosphereStageName(world.atmosphereTier)})</div>
              <div>• {world.chronicle.length} événements de chronique signés</div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              data-testid="archives-export-csv-btn"
              onClick={onExportCsv}
              className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-emerald-400/80 bg-emerald-500/12 px-3 text-xs font-bold text-emerald-900 hover:bg-emerald-500/20 dark:border-emerald-700 dark:text-emerald-100 whitespace-nowrap"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Exporter CSV</span>
            </button>
            <button
              type="button"
              data-testid="archives-export-html-btn"
              onClick={onExportHtml}
              className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 text-xs font-bold text-white hover:bg-rose-500 whitespace-nowrap"
            >
              <FileText className="h-4 w-4" />
              <span>Rapport HTML</span>
            </button>
          </div>
        </section>

        <section
          data-testid="archives-campaign-comparator"
          className="rounded-xl border border-rose-200/90 bg-white/95 p-4 dark:border-rose-900/60 dark:bg-[#190d1f] lg:col-span-7"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold text-[#1f1224] dark:text-rose-50">
              <GitCompare className="h-4 w-4 text-rose-600 dark:text-rose-300" />
              <span>Comparateur de Campagnes</span>
            </h3>
            <span className="font-mono text-[11px] text-rose-900/65 dark:text-rose-200/70">
              {comparisonRows.length} profil(s) comparés
            </span>
          </div>

          <div className="mt-3 space-y-2.5">
            {comparisonRows.slice(0, 5).map((row) => {
              const pct = Math.max(8, Math.round((row.score / maxComparisonScore) * 100));
              return (
                <div
                  key={row.id}
                  className={`rounded-lg border p-2.5 text-xs ${
                    row.isCurrent
                      ? 'border-rose-400 bg-rose-50/75 dark:border-rose-500/70 dark:bg-rose-950/35'
                      : 'border-rose-200/70 bg-white/75 dark:border-rose-900/50 dark:bg-[#140a1a]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-[#1f1224] dark:text-rose-50">
                      {row.isBenchmark && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
                      <span>{row.label}</span>
                    </div>
                    <div className="font-mono text-[11px] tabular-nums text-rose-800 dark:text-rose-200">
                      Ère {row.era} · C{row.cycle} · {row.atmosphereTier} · {row.approval}% · <strong>{row.score} pts</strong>
                    </div>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-rose-200/70 dark:bg-rose-950/80">
                    <div
                      className={`h-full rounded-full ${
                        row.isCurrent
                          ? 'bg-gradient-to-r from-rose-600 to-emerald-500'
                          : row.isBenchmark
                            ? 'bg-amber-500'
                            : 'bg-indigo-500/80'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
