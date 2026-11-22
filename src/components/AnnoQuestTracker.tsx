import { useMemo } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
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
  type QuestTargetLink,
} from '../systems/quests/campaign-quests.ts';

/**
 * [L7] EXW.L7.ANNO_QUEST_TRACKER | v4.1.0 | <= 200 lines (R-14)
 * Persistent collapsible Anno/Idle Quest HUD tracker guiding progression & granting rewards.
 */
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
  const setToast = useSetAtom(toastNoticeAtom);
  const hudHidden = useAtomValue(hudHiddenAtom);

  const statuses = useMemo(() => evaluateCampaignQuests(world, questUi), [world, questUi]);
  const activeQuest = useMemo(() => getActiveQuestFocus(statuses), [statuses]);
  const completedCount = statuses.filter((q) => q.claimed).length;

  if (hudHidden) return null;
  if (world.genese && !world.genese.act0Completed) return null;

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
    } else if (link === 'END_TURN') {
      const target = world.activeDossiers[0];
      if (target) setActiveDossierId(target.id);
      else setToast({ id: Date.now(), tone: 'info', text: 'Cliquez « Fin de tour → » en haut pour valider le cycle.' });
    }
  };

  const onClaim = () => {
    if (!activeQuest) return;
    const [err, claimed] = handleClaimQuestReward(activeQuest.id, questUi);
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

  return (
    <aside
      data-testid="anno-quest-tracker"
      aria-label="Suivi des quêtes de campagne"
      className="pointer-events-auto fixed left-2 top-[60px] z-20 hidden w-72 sm:left-4 sm:top-[66px] md:block"
    >
      <div className="exo-bento-card exo-astral-ticks exo-hud-panel overflow-hidden p-2.5 text-xs">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-wider exo-accent-text">
            <Compass className="h-3.5 w-3.5 exo-accent-2-text" />
            <span>Quêtes {completedCount}/{statuses.length}</span>
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px] exo-muted-text">
            {activeQuest?.completed && !activeQuest.claimed && (
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-bold text-emerald-500 dark:text-emerald-300">
                PRÊT
              </span>
            )}
            {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </span>
        </button>

        {!collapsed && activeQuest && (
          <div className="mt-2 space-y-2 border-t exo-accent-border pt-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-[9.5px] font-semibold uppercase exo-accent-2-text">
                  #{activeQuest.order} · {activeQuest.chapter}
                </div>
                <div className="font-display text-xs font-bold text-[var(--exo-text)]">
                  {activeQuest.title}
                </div>
              </div>
              <span className="font-mono text-[10.5px] font-bold exo-accent-text">
                {activeQuest.progress}/{activeQuest.target}
              </span>
            </div>

            <p className="text-[11px] leading-snug text-[var(--exo-text)] opacity-90">
              {activeQuest.objective}
            </p>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/20 dark:bg-white/10">
              <div
                className={`h-full transition-all ${
                  activeQuest.completed ? 'bg-emerald-500' : 'bg-[var(--exo-accent)]'
                }`}
                style={{ width: `${Math.round((activeQuest.progress / activeQuest.target) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-1.5 pt-0.5">
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-600 dark:text-emerald-300">
                <Gift className="h-3 w-3 shrink-0" />
                {activeQuest.reward.summaryLabel}
              </span>

              {activeQuest.completed && !activeQuest.claimed ? (
                <button
                  type="button"
                  data-testid="claim-quest-btn"
                  onClick={onClaim}
                  className="inline-flex min-h-[28px] items-center gap-1 rounded-lg bg-emerald-600 px-2.5 font-mono text-[10.5px] font-bold text-white shadow-sm hover:bg-emerald-500"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Réclamer</span>
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="goto-quest-btn"
                  onClick={() => navigateTarget(activeQuest.targetLink)}
                  className="exo-accent-chip inline-flex min-h-[28px] items-center gap-1 px-2.5 font-mono text-[10.5px] font-bold"
                >
                  <span>Y aller</span>
                  <ArrowRight className="h-3 w-3 exo-accent-text" />
                </button>
              )}
            </div>
          </div>
        )}

        {!collapsed && !activeQuest && (
          <div className="mt-2 flex items-center gap-1.5 border-t exo-accent-border pt-2 font-mono text-[11px] text-emerald-600 dark:text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Toutes les quêtes de démarrage accomplies !</span>
          </div>
        )}
      </div>
    </aside>
  );
}
