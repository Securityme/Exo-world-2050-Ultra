import { useMemo, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  AlertTriangle,
  Bell,
  Compass,
  FileText,
  Globe2,
  Sparkles,
  X,
} from 'lucide-react';
import { useExoStore } from '../../stores/game.store.ts';
import {
  activeDossierIdAtom,
  activeSubscreenAtom,
  questUiMilestonesAtom,
  worldsHubDomainAtom,
} from '../../stores/selection.atoms.ts';
import { evaluateCampaignQuests } from '../../systems/quests/campaign-quests.ts';
import {
  buildHeaderNotificationFeed,
  type HeaderNotificationItem,
} from '../../systems/turn-orchestration/header-notifications.ts';

/**
 * [L7] EXW.L7.HEADER_NOTIFICATION_CENTER | v5.0.0 | SADT A5.1
 * Header bell + priority counter + drawer grouping Alertes, Scénarios, Quêtes,
 * and remaining PA initiatives available in Monde.
 */
export function HeaderNotificationCenter() {
  const world = useExoStore((s) => s.world);
  const questUi = useAtomValue(questUiMilestonesAtom);
  const setActiveDossierId = useSetAtom(activeDossierIdAtom);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
  const setWorldsDomain = useSetAtom(worldsHubDomainAtom);

  const [open, setOpen] = useState(false);

  const feed = useMemo(() => {
    const quests = evaluateCampaignQuests(world, questUi);
    return buildHeaderNotificationFeed(world, quests);
  }, [world, questUi]);

  const handleNavigate = (item: HeaderNotificationItem) => {
    setOpen(false);
    if (item.target.type === 'DOSSIER') {
      setActiveDossierId(item.target.dossierId);
      return;
    }
    if (item.target.domain) {
      setWorldsDomain(item.target.domain);
    }
    setSubscreen(item.target.subscreen);
  };

  return (
    <div className="relative">
      <button
        type="button"
        data-testid="header-notifications-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Notifications (${feed.totalCount})`}
        title="Centre de notifications tactiques"
        className={`relative inline-flex h-8 w-8 items-center justify-center sm:h-9 sm:w-9 ${
          open ? 'exo-accent-chip-active' : 'exo-accent-chip'
        }`}
      >
        <Bell className="h-4 w-4 exo-accent-text" />
        {feed.totalCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 font-mono text-[9.5px] font-bold text-white ${
              feed.alertCount > 0 ? 'bg-rose-600' : 'bg-amber-600'
            }`}
          >
            {feed.totalCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Centre de notifications de campagne"
          data-testid="header-notifications-drawer"
          className="exo-bento-card fixed inset-x-2 top-[62px] z-50 max-h-[78dvh] overflow-y-auto p-3.5 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-[390px]"
        >
          <div className="flex items-center justify-between gap-2 border-b exo-accent-border pb-2">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider exo-accent-text">
                Alertes &amp; Priorités du Tour {world.cycle}
              </div>
              <div className="mt-0.5 flex flex-wrap gap-1.5 font-mono text-[10px] exo-muted-text">
                <span>Alertes: {feed.alertCount}</span>
                <span>·</span>
                <span>Scénario: {feed.scenarioCount}</span>
                <span>·</span>
                <span>Quêtes: {feed.questCount}</span>
                <span>·</span>
                <span className="font-bold exo-accent-2-text">PA libres: {feed.paRemaining}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer les notifications"
              className="exo-accent-chip inline-flex h-8 w-8 items-center justify-center rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2.5 space-y-2">
            {feed.items.length === 0 ? (
              <p className="py-6 text-center text-xs exo-muted-text">
                Aucune notification urgente en attente pour ce tour.
              </p>
            ) : (
              feed.items.map((item) => {
                const badgeStyle =
                  item.kind === 'ALERT'
                    ? 'bg-rose-500/20 text-rose-500 dark:text-rose-300'
                    : item.kind === 'SCENARIO'
                      ? 'bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300'
                      : item.kind === 'QUEST'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : item.kind === 'PA_WORLD'
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          : 'bg-[var(--exo-accent-soft)] exo-accent-text';

                const Icon =
                  item.kind === 'ALERT'
                    ? AlertTriangle
                    : item.kind === 'SCENARIO'
                      ? FileText
                      : item.kind === 'QUEST'
                        ? Compass
                        : item.kind === 'PA_WORLD'
                          ? Globe2
                          : Sparkles;

                return (
                  <div
                    key={item.id}
                    className="exo-surface-sub flex items-start justify-between gap-2.5 rounded-xl border exo-accent-border p-2.5 text-xs"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 shrink-0 exo-accent-text" />
                        <span className={`rounded px-1.5 py-0.5 font-mono text-[9.5px] font-bold ${badgeStyle}`}>
                          {item.badge}
                        </span>
                      </div>
                      <div className="font-semibold text-[var(--exo-text)]">{item.title}</div>
                      <p className="text-[11px] leading-snug exo-muted-text">{item.detail}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNavigate(item)}
                      className="exo-accent-chip min-h-[32px] shrink-0 rounded-lg px-2.5 font-mono text-[10.5px] font-bold"
                    >
                      {item.actionLabel}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
