import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Download,
  ListChecks,
  Play,
  Users,
} from 'lucide-react';
import {
  BetaQuestionnaireSubmissionSchema,
  type BetaQuestionnaireSubmission,
} from '../../contracts/beta-p13.schema.ts';
import { VIRTUAL_BETA_PERSONAS_CATALOG } from '../../data/beta-p13.catalog.ts';
import {
  computeSubmissionAverage,
  consolidateBetaFeedbackReport,
  formatBetaReportMarkdown,
  runVirtualBetaPlaytestCampaign,
  type VirtualBetaCampaignRun,
} from '../../systems/playtest/beta-p13-engine.ts';
import { BetaP13QuestionnaireForm } from './BetaP13QuestionnaireForm.tsx';

const COMMUNITY_STORAGE_KEY = 'exo_p13_community_feedback_v1';

type BetaP13SubTab = 'PERSONAS' | 'QUESTIONNAIRE' | 'SYNTHESIS';

function loadCommunitySubmissions(): BetaQuestionnaireSubmission[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(COMMUNITY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => BetaQuestionnaireSubmissionSchema.safeParse(item))
      .filter((r): r is { success: true; data: BetaQuestionnaireSubmission } => r.success)
      .map((r) => r.data);
  } catch {
    return [];
  }
}

/**
 * [L7] EXW.L7.BETA_P13_HUB | v5.0.0 | SADT A5.3
 * Wave P13 Closure Module: Virtual Beta-Tester Multi-Persona Campaign,
 * Community Improvement Questionnaire, Consolidated Score & v5.1 Backlog Export.
 */
export function BetaP13HubPanel() {
  const [subTab, setSubTab] = useState<BetaP13SubTab>('PERSONAS');
  const [communitySubs, setCommunitySubs] = useState<BetaQuestionnaireSubmission[]>(() =>
    loadCommunitySubmissions(),
  );
  const [campaignRun, setCampaignRun] = useState<VirtualBetaCampaignRun | null>(null);

  const allSubmissions = useMemo<readonly BetaQuestionnaireSubmission[]>(
    () => [...communitySubs, ...(campaignRun?.personas ?? VIRTUAL_BETA_PERSONAS_CATALOG)],
    [campaignRun, communitySubs],
  );

  const report = useMemo(() => consolidateBetaFeedbackReport(allSubmissions), [allSubmissions]);

  const handleRunVirtualCampaign = () => {
    setCampaignRun(runVirtualBetaPlaytestCampaign());
  };

  const handleAddCommunitySubmission = (sub: BetaQuestionnaireSubmission) => {
    const next = [sub, ...communitySubs].slice(0, 30);
    setCommunitySubs(next);
    try {
      window.localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
  };

  const handleExportMarkdown = () => {
    const md = formatBetaReportMarkdown(report, allSubmissions, campaignRun?.playtest);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'exo-world-2050-p13-beta-report.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  const verdictBadge =
    report.verdict === 'GO_RELEASE'
      ? {
          label: 'GO PRODUCTION v5.0.0',
          tone: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
        }
      : report.verdict === 'CONDITIONAL'
        ? {
            label: 'CONDITIONNEL v5.0',
            tone: 'border-amber-500/50 bg-amber-500/15 text-amber-800 dark:text-amber-300',
          }
        : {
            label: 'CORRECTIFS REQUIS',
            tone: 'border-rose-500/50 bg-rose-500/15 text-rose-700 dark:text-rose-300',
          };

  return (
    <div className="space-y-4" data-testid="beta-p13-hub">
      <div className="rounded-xl border border-rose-200 bg-white/90 p-4 dark:border-rose-900/60 dark:bg-rose-950/25">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-sm font-bold text-[#1f1224] dark:text-rose-50">
                Vague P13 · Bêta-Testeurs Virtuels &amp; Communauté
              </h3>
              <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10.5px] font-bold ${verdictBadge.tone}`}>
                <CheckCircle2 className="h-3 w-3" />
                <span>{verdictBadge.label}</span>
              </span>
            </div>
            <p className="mt-1 text-xs text-rose-900/75 dark:text-rose-200/75">
              Clôture du cycle V5 : campagne multi-profils (5 personas) et questionnaire structuré d’amélioration communautaire.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRunVirtualCampaign}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-500"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Simuler Campagne Bêta (5 Personas)</span>
            </button>
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 text-xs font-semibold text-rose-900 hover:border-rose-500 dark:border-rose-700 dark:bg-rose-950/50 dark:text-rose-100"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exporter Rapport .MD</span>
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs sm:grid-cols-4">
          <div className="rounded-lg border border-rose-200/80 bg-rose-50/50 p-2.5 dark:border-rose-900/50 dark:bg-rose-950/40">
            <div className="text-[10px] uppercase text-rose-700/75 dark:text-rose-300/75">Score Global</div>
            <div className="mt-0.5 font-display text-lg font-black text-rose-700 dark:text-rose-300">
              {report.globalAverage.toFixed(2).replace('.', ',')} / 5
            </div>
          </div>
          <div className="rounded-lg border border-rose-200/80 bg-rose-50/50 p-2.5 dark:border-rose-900/50 dark:bg-rose-950/40">
            <div className="text-[10px] uppercase text-rose-700/75 dark:text-rose-300/75">Évaluations</div>
            <div className="mt-0.5 font-display text-lg font-black text-[#1f1224] dark:text-rose-50">
              {report.totalResponses}
            </div>
            <div className="text-[10px] text-rose-800/70 dark:text-rose-200/70">
              {report.virtualCount} virtuels · {report.communityCount} communauté
            </div>
          </div>
          <div className="rounded-lg border border-rose-200/80 bg-rose-50/50 p-2.5 dark:border-rose-900/50 dark:bg-rose-950/40">
            <div className="text-[10px] uppercase text-rose-700/75 dark:text-rose-300/75">Simulation 6 Tours</div>
            <div className="mt-0.5 font-bold text-[#1f1224] dark:text-rose-50">
              {campaignRun ? `${campaignRun.playtest.totalTicks} ticks · OK` : 'Prête (90 ticks)'}
            </div>
            <div className="truncate text-[10px] text-emerald-700 dark:text-emerald-300">
              {campaignRun ? `SHA ${campaignRun.playtest.finalChainHash.slice(0, 12)}` : 'Seed 0x2050E801'}
            </div>
          </div>
          <div className="rounded-lg border border-rose-200/80 bg-rose-50/50 p-2.5 dark:border-rose-900/50 dark:bg-rose-950/40">
            <div className="text-[10px] uppercase text-rose-700/75 dark:text-rose-300/75">Critères Évalués</div>
            <div className="mt-0.5 font-display text-lg font-black text-[#1f1224] dark:text-rose-50">
              {report.criteriaSummaries.length} / 10
            </div>
            <div className="text-[10px] text-rose-800/70 dark:text-rose-200/70">Backlog v5.1 priorisé</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'PERSONAS' as const, label: `Panel & Retours (${allSubmissions.length})`, icon: Users },
          { id: 'QUESTIONNAIRE' as const, label: 'Questionnaire Communauté', icon: ClipboardList },
          { id: 'SYNTHESIS' as const, label: 'Synthèse & Backlog v5.1', icon: ListChecks },
        ].map((item) => {
          const Icon = item.icon;
          const active = subTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSubTab(item.id)}
              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${
                active
                  ? 'border-rose-500 bg-rose-500/15 text-rose-800 dark:border-rose-400 dark:bg-rose-500/25 dark:text-rose-100'
                  : 'border-rose-200 bg-white/85 text-[#1f1224] hover:border-rose-400 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {subTab === 'PERSONAS' && (
        <div className="grid gap-3 md:grid-cols-2">
          {allSubmissions.map((sub) => {
            const avg = computeSubmissionAverage(sub);
            return (
              <article
                key={sub.id}
                className="space-y-2 rounded-xl border border-rose-200 bg-white/90 p-3.5 dark:border-rose-900/60 dark:bg-rose-950/25"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-display text-sm font-bold text-[#1f1224] dark:text-rose-50">
                        {sub.authorName}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                          sub.source === 'COMMUNITY'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {sub.source === 'COMMUNITY' ? 'Communauté' : 'Persona Virtuel'}
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-900/70 dark:text-rose-200/70">{sub.profileLabel}</p>
                  </div>
                  <span className="shrink-0 rounded-lg border border-amber-400/50 bg-amber-500/15 px-2 py-1 font-mono text-xs font-bold text-amber-800 dark:text-amber-300">
                    {avg.toFixed(1).replace('.', ',')} / 5
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#1f1224] dark:text-rose-100">« {sub.comment} »</p>
                {sub.strengths.length > 0 && (
                  <ul className="space-y-0.5 text-[11px] text-emerald-800 dark:text-emerald-300">
                    {sub.strengths.map((st) => (
                      <li key={st}>+ {st}</li>
                    ))}
                  </ul>
                )}
                {sub.recommendations.length > 0 && (
                  <ul className="space-y-0.5 text-[11px] text-amber-800 dark:text-amber-300">
                    {sub.recommendations.map((rec) => (
                      <li key={rec}>▸ v5.1 : {rec}</li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      )}

      {subTab === 'QUESTIONNAIRE' && (
        <BetaP13QuestionnaireForm
          nextSequence={communitySubs.length + 1}
          onSubmit={handleAddCommunitySubmission}
        />
      )}

      {subTab === 'SYNTHESIS' && (
        <div className="space-y-2 rounded-xl border border-rose-200 bg-white/90 p-4 dark:border-rose-900/60 dark:bg-rose-950/25">
          <div className="font-display text-xs font-bold uppercase tracking-wide text-rose-700 dark:text-rose-300">
            Synthèse Quantitative &amp; Backlog Priorisé v5.1
          </div>
          <div className="space-y-2">
            {report.prioritizedBacklog.map((row) => {
              const pct = Math.round((row.averageScore / 5) * 100);
              return (
                <div
                  key={row.criterionId}
                  className="rounded-lg border border-rose-200/80 bg-rose-50/40 p-2.5 dark:border-rose-900/50 dark:bg-rose-950/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#1f1224] dark:text-rose-50">{row.label}</span>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      {row.priorityVotes > 0 && (
                        <span className="rounded bg-rose-500/15 px-1.5 py-0.5 font-semibold text-rose-700 dark:text-rose-300">
                          {row.priorityVotes} vote(s) priorité
                        </span>
                      )}
                      <span className="font-bold text-amber-700 dark:text-amber-300">
                        {row.averageScore.toFixed(2).replace('.', ',')} / 5
                      </span>
                    </div>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-rose-200/60 dark:bg-rose-900/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-rose-900/75 dark:text-rose-200/75">
                    Action v5.1 : {row.v51Action}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
