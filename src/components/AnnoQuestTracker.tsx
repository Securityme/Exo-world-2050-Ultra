import { useMemo, useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Compass,
  Gift,
  Sparkles,
} from 'lucide-react';
import { handleClaimQuestReward } from '../pipelines/game-actions.pipeline.ts';
import { useExoStore } from '../stores/game.store.ts';
import {
  activeDossierIdAtom,
  activeSubscreenAtom,
  eraAdvanceModalOpenAtom,
  hudHiddenAtom,
  questTrackerCollapsedAtom,
  questUiMilestonesAtom,
  toastNoticeAtom,
  worldsHubDomainAtom,
  worldsHubSubViewAtom,
} from '../stores/selection.atoms.ts';
import {
  evaluateCampaignQuests,
  getActiveQuestFocus,
  groupQuestsByEra,
  groupQuestsByScenarioThread,
  type CampaignQuestStatus,
  type QuestTargetLink,
} from '../systems/quests/campaign-quests.ts';

/**
 * [L7] EXW.L7.ANNO_QUEST_TRACKER | v5.2.0 | SADT A5.1
 * Collapsible Multi-Thread Quest HUD Tracker grouped by Scenario Thread or by Era (1..8).
 * Lets the player open/collapse the entire widget as well as individual quest threads.
 */
type QuestViewMode = 'SCENARIO' | 'ERA';

export function AnnoQuestTracker() {
  const world = useExoStore((s) => s.world);
  const setActiveScale = useExoStore((s) => s.setActiveScale);
  const questUi = useAtomValue(questUiMilestonesAtom);
  const setQuestUi = useSetAtom(questUiMilestonesAtom);
  const [collapsed, setCollapsed] = useAtom(questTrackerCollapsedAtom);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
  const setWorldsDomain = useSetAtom(worldsHubDomainAtom);
  const setWorldsSubView = useSetAtom(worldsHubSubViewAtom);
  const setActiveDossierId = useSetAtom(activeDossierIdAtom);
  const setEraModalOpen = useSetAtom(eraAdvanceModalOpenAtom);
  const setToast = useSetAtom(toastNoticeAtom);
  const hudHidden = useAtomValue(hudHiddenAtom);

  const [viewMode, setViewMode] = useState<QuestViewMode>('SCENARIO');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    GENESE_2050: true,
    'era-ERA_1': true,
  });

  const statuses = useMemo(() => evaluateCampaignQuests(world, questUi), [world, questUi]);
  const activeQuest = useMemo(() => getActiveQuestFocus(statuses), [statuses]);
  const scenarioGroups = useMemo(() => groupQuestsByScenarioThread(statuses), [statuses]);
  const eraGroups = useMemo(() => groupQuestsByEra(statuses, world.era), [statuses, world.era]);

  const completedCount = statuses.filter((q) => q.claimed).length;
  const claimableCount = statuses.filter((q) => q.completed && !q.claimed).length;

  if (hudHidden) return null;
  if (world.genese && !world.genese.act0Completed) return null;

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navigateTarget = (link: QuestTargetLink) => {
    if (link === 'SCALE_3') {
      setActiveScale(3);
      setQuestUi((prev) => ({ ...prev, scale3Visited: true }));
    } else if (link === 'SCALE_2') {
      setActiveScale(2);
    } else if (link === 'EVENTS_HUB') {
      const first = world.activeDossiers[0];
      if (first) setActiveDossierId(first.id);
      else setSubscreen('EVENTS_HUB');
    } else if (link === 'WORLDS_WORKFORCE') {
      setWorldsDomain('POPULATION');
      setWorldsSubView('ASSIGNMENTS');
      setSubscreen('WORLDS_HUB');
    } else if (link === 'WORLDS_CITIES') {
      setWorldsDomain('TERRITORIES');
      setWorldsSubView('DISTRICTS');
      setSubscreen('WORLDS_HUB');
    } else if (link === 'WORLDS_BIOSPHERE') {
      setWorldsDomain('BIOSPHERE');
      setWorldsSubView('CLIMATE');
      setSubscreen('WORLDS_HUB');
    } else if (link === 'ERA_PANEL') {
      setEraModalOpen(true);
    } else if (link === 'END_TURN') {
      const target = world.activeDossiers[0];
      if (target) setActiveDossierId(target.id);
      else {
        setToast({
          id: Date.now(),
          tone: 'info',
          text: 'Cliquez « Fin de tour → » en haut pour valider le cycle.',
        });
      }
    }
  };

  const onClaim = (quest: CampaignQuestStatus) => {
    const [err, claimed] = handleClaimQuestReward(quest.id, questUi);
    if (err || !claimed) {
      setToast({ id: Date.now(), tone: 'error', text: err?.message ?? 'Récompense indisponible.' });
      return;
    }
    setToast({
      id: Date.now(),
      tone: 'success',
      text: `Quête validée (${claimed.title}) : ${claimed.reward.summaryLabel}`,
    });
  };

  const renderQuestRow = (quest: CampaignQuestStatus) => {
    const pct = quest.target > 0 ? Math.min(100, Math.round((quest.progress / quest.target) * 100)) : 0;
    return (
      <div
        key={quest.id}
        className={`space-y-1.5 rounded-lg border p-2 ${
          quest.claimed
            ? 'border-emerald-500/30 bg-emerald-500/8 opacity-75'
            : 'border-slate-200/80 bg-white/70 dark:border-slate-800 dark:bg-slate-950/60'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-bold leading-snug text-[var(--exo-text)]">
              {quest.title}
            </div>
            <p className="mt-0.5 text-[10.5px] leading-snug text-[var(--exo-text)] opacity-80">
              {quest.objective}
            </p>
          </div>
          <span className="shrink-0 font-mono text-[10px] font-bold tabular-nums exo-accent-text">
            {quest.progress}/{quest.target}
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/15 dark:bg-white/10">
          <div
            className={`h-full transition-all ${
              quest.claimed || quest.completed ? 'bg-emerald-500' : 'bg-[var(--exo-accent)]'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          <span className="inline-flex min-w-0 items-center gap-1 truncate font-mono text-[9.5px] text-emerald-700 dark:text-emerald-300">
            <Gift className="h-3 w-3 shrink-0" />
            <span className="truncate">{quest.reward.summaryLabel}</span>
          </span>

          {quest.claimed ? (
            <span className="inline-flex items-center gap-0.5 font-mono text-[9.5px] font-bold text-emerald-600 dark:text-emerald-300 whitespace-nowrap">
              <CheckCircle2 className="h-3 w-3" />
              Validée
            </span>
          ) : quest.completed ? (
            <button
              type="button"
              data-testid={`claim-quest-btn-${quest.id}`}
              onClick={() => onClaim(quest)}
              className="inline-flex min-h-[26px] shrink-0 items-center gap-1 rounded-md bg-emerald-600 px-2 font-mono text-[10px] font-bold text-white shadow-xs hover:bg-emerald-500 whitespace-nowrap"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>Réclamer</span>
            </button>
          ) : (
            <button
              type="button"
              data-testid={`goto-quest-btn-${quest.id}`}
              onClick={() => navigateTarget(quest.targetLink)}
              className="exo-accent-chip inline-flex min-h-[26px] shrink-0 items-center gap-1 px-2 font-mono text-[10px] font-bold whitespace-nowrap"
            >
              <span>Y aller</span>
              <ArrowRight className="h-3 w-3 exo-accent-text" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <aside
      data-testid="anno-quest-tracker"
      aria-label="Suivi des quêtes de campagne multi-fils"
      className="pointer-events-auto fixed left-2 top-[58px] z-20 w-72 sm:left-4 sm:top-[64px] sm:w-80"
    >
      <div className="exo-bento-card exo-astral-ticks exo-hud-panel overflow-hidden p-2.5 text-xs">
        {/* Top Open / Collapse Bar */}
        <button
          type="button"
          data-testid="quest-tracker-toggle"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-wider exo-accent-text">
            <Compass className="h-3.5 w-3.5 exo-accent-2-text" />
            <span>Quêtes {completedCount}/{statuses.length}</span>
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] exo-muted-text">
            {claimableCount > 0 && (
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-bold text-emerald-700 dark:text-emerald-300">
                {claimableCount} PRÊT
              </span>
            )}
            <span>{collapsed ? 'Ouvrir' : 'Réduire'}</span>
            {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </span>
        </button>

        {/* Compact Summary Line when Collapsed */}
        {collapsed && activeQuest && (
          <div className="mt-1.5 flex items-center justify-between gap-2 border-t exo-accent-border pt-1.5 text-[10.5px]">
            <span className="truncate font-medium text-[var(--exo-text)] opacity-90">
              {activeQuest.scenarioLabel} · {activeQuest.title}
            </span>
            <span className="shrink-0 font-mono text-[10px] font-bold tabular-nums exo-accent-text">
              {activeQuest.progress}/{activeQuest.target}
            </span>
          </div>
        )}

        {/* Expanded Multi-Thread Panel */}
        {!collapsed && (
          <div className="mt-2 space-y-2 border-t exo-accent-border pt-2">
            {/* Mode Switch: Par Scénario vs Par Ère */}
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-black/5 p-0.5 font-mono text-[10px] dark:bg-white/5">
              <button
                type="button"
                data-testid="quest-mode-scenario"
                onClick={() => setViewMode('SCENARIO')}
                className={`rounded-md py-1 font-bold transition ${
                  viewMode === 'SCENARIO'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                    : 'exo-muted-text hover:text-[var(--exo-text)]'
                }`}
              >
                Par Scénario ({scenarioGroups.length})
              </button>
              <button
                type="button"
                data-testid="quest-mode-era"
                onClick={() => setViewMode('ERA')}
                className={`rounded-md py-1 font-bold transition ${
                  viewMode === 'ERA'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                    : 'exo-muted-text hover:text-[var(--exo-text)]'
                }`}
              >
                Par Ère (1–8)
              </button>
            </div>

            {/* Scrollable Collapsible Threads List */}
            <div className="max-h-[46vh] space-y-1.5 overflow-y-auto pr-0.5">
              {viewMode === 'SCENARIO'
                ? scenarioGroups.map((thread) => {
                    const key = thread.groupId;
                    const isOpen = openGroups[key] ?? thread.claimableCount > 0;
                    return (
                      <div
                        key={key}
                        className="rounded-lg border exo-accent-border bg-black/[0.02] dark:bg-white/[0.02]"
                      >
                        <button
                          type="button"
                          data-testid={`quest-thread-${key.toLowerCase()}`}
                          onClick={() => toggleGroup(key)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left"
                        >
                          <div className="flex min-w-0 items-center gap-1.5">
                            {isOpen ? (
                              <ChevronDown className="h-3 w-3 shrink-0 exo-accent-text" />
                            ) : (
                              <ChevronRight className="h-3 w-3 shrink-0 exo-muted-text" />
                            )}
                            <span className="truncate text-[11px] font-bold text-[var(--exo-text)]">
                              {thread.label}
                            </span>
                          </div>
                          <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] tabular-nums exo-muted-text">
                            {thread.claimableCount > 0 && (
                              <span className="font-bold text-emerald-600 dark:text-emerald-300">
                                +{thread.claimableCount}
                              </span>
                            )}
                            <span>
                              {thread.claimedCount}/{thread.quests.length}
                            </span>
                          </span>
                        </button>
                        {isOpen && (
                          <div className="space-y-1.5 border-t exo-accent-border p-1.5">
                            {thread.quests.map(renderQuestRow)}
                          </div>
                        )}
                      </div>
                    );
                  })
                : eraGroups.map((group) => {
                    const key = `era-${group.groupId}`;
                    const isCurrentEra = group.subtitle.startsWith('Palier actif');
                    const isOpen = openGroups[key] ?? (isCurrentEra || group.claimableCount > 0);
                    return (
                      <div
                        key={key}
                        className={`rounded-lg border ${
                          isCurrentEra ? 'border-amber-500/60' : 'exo-accent-border'
                        } bg-black/[0.02] dark:bg-white/[0.02]`}
                      >
                        <button
                          type="button"
                          data-testid={`quest-era-${group.groupId}`}
                          onClick={() => toggleGroup(key)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left"
                        >
                          <div className="flex min-w-0 items-center gap-1.5">
                            {isOpen ? (
                              <ChevronDown className="h-3 w-3 shrink-0 exo-accent-text" />
                            ) : (
                              <ChevronRight className="h-3 w-3 shrink-0 exo-muted-text" />
                            )}
                            <span className="truncate text-[11px] font-bold text-[var(--exo-text)]">
                              {group.label}
                              {isCurrentEra ? ' · Active' : ''}
                            </span>
                          </div>
                          <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] tabular-nums exo-muted-text">
                            {group.claimableCount > 0 && (
                              <span className="font-bold text-emerald-600 dark:text-emerald-300">
                                +{group.claimableCount}
                              </span>
                            )}
                            <span>
                              {group.claimedCount}/{group.quests.length}
                            </span>
                          </span>
                        </button>
                        {isOpen && (
                          <div className="space-y-1.5 border-t exo-accent-border p-1.5">
                            {group.quests.map(renderQuestRow)}
                          </div>
                        )}
                      </div>
                    );
                  })}
            </div>

            {!activeQuest && (
              <div className="flex items-center gap-1.5 border-t exo-accent-border pt-2 font-mono text-[10.5px] text-emerald-600 dark:text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Tous les fils de quêtes sont accomplis !</span>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
