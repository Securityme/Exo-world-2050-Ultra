import { useState } from 'react';
import { Award, ChevronDown, ChevronRight, Compass } from 'lucide-react';
import type { ExecutiveDossier } from '../../contracts/pa-dossiers.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import { handleClaimQuestReward } from '../../pipelines/game-actions.pipeline.ts';
import {
  getQuestsImpactedByDossier,
  type QuestUiMilestones,
} from '../../systems/quests/campaign-quests.ts';

/**
 * [L7] EXW.L7.EVENT_QUEST_IMPACT_STRIP | v5.2.0 | SADT A5.1
 * Collapsible multi-thread quest progress strip embedded inside the event arbitration modal.
 * Shows the Scenario & Era quest threads directly linked to the event being arbitrated.
 */

interface EventQuestImpactStripProps {
  readonly world: WorldState;
  readonly dossier: ExecutiveDossier;
  readonly uiMilestones?: QuestUiMilestones;
  readonly onRewardClaimed?: (message: string) => void;
}

export function EventQuestImpactStrip({
  world,
  dossier,
  uiMilestones,
  onRewardClaimed,
}: EventQuestImpactStripProps) {
  const [expanded, setExpanded] = useState(false);
  const impacted = getQuestsImpactedByDossier(world, dossier, uiMilestones);

  if (impacted.length === 0) return null;

  const lead = impacted[0]!;
  const claimableCount = impacted.filter((q) => q.completed && !q.claimed).length;

  const handleClaim = (questId: string) => {
    const [err, quest] = handleClaimQuestReward(questId, uiMilestones);
    if (!err && quest) {
      onRewardClaimed?.(`Récompense de quête réclamée : ${quest.title} (${quest.reward.summaryLabel})`);
    }
  };

  return (
    <div
      className="rounded-lg border border-slate-200 bg-white/95 text-slate-900 dark:border-slate-700/80 dark:bg-slate-900/85 dark:text-slate-100"
      data-testid="event-quest-impact-strip"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70"
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Compass className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
          <span className="font-semibold whitespace-nowrap">
            Fils de quêtes liés ({impacted.length})
          </span>
          <span className="text-slate-400" aria-hidden="true">·</span>
          <span className="truncate text-[11px] text-slate-600 dark:text-slate-300">
            {lead.scenarioLabel} · {lead.title} ({lead.progress}/{lead.target})
          </span>
          {claimableCount > 0 && (
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
              · {claimableCount} prête{claimableCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {expanded ? 'Réduire' : 'Ouvrir'}
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </span>
      </button>

      {expanded && (
        <div className="grid gap-2 border-t border-slate-200 px-3 py-2.5 sm:grid-cols-2 dark:border-slate-800">
          {impacted.map((q) => {
            const pct = q.target > 0 ? Math.min(100, Math.round((q.progress / q.target) * 100)) : 0;
            return (
              <div
                key={q.id}
                className="flex flex-col justify-between gap-1.5 rounded-md border border-slate-200/90 bg-slate-50/90 p-2.5 dark:border-slate-800 dark:bg-slate-950/70"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      {q.scenarioLabel} · Ère {q.eraMin}
                      {q.eraMax > q.eraMin ? `–${q.eraMax}` : ''}
                    </div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {q.title}
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                      {q.objective}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] font-semibold tabular-nums text-sky-700 dark:text-sky-300">
                    {q.progress}/{q.target}
                  </span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className={`h-full transition-[width] duration-200 ${
                      q.completed ? 'bg-emerald-500' : 'bg-sky-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="truncate font-mono">{q.reward.summaryLabel}</span>
                  {q.completed && !q.claimed && (
                    <button
                      type="button"
                      onClick={() => handleClaim(q.id)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-emerald-500"
                    >
                      <Award className="h-3 w-3" />
                      Réclamer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
