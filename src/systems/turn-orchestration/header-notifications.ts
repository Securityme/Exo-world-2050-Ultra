import type { WorldState } from '../../contracts/world-state.schema.ts';
import type { CampaignQuestStatus } from '../quests/campaign-quests.ts';
import { computeClimateLedger } from '../biosphere/climate-ledger.ts';

/**
 * [L3] EXW.L3.HEADER_NOTIFICATIONS | v5.0.0 | SADT A5.1
 * Pure prioritized notification center feed grouping mandatory turn events
 * (SCENARIO | QUEST | ALERT), unspent PA initiatives via Monde, climate hazards,
 * and ready honors/media items.
 */
export type NotificationKind = 'ALERT' | 'SCENARIO' | 'QUEST' | 'PA_WORLD' | 'SYSTEM';

export type NotificationActionTarget =
  | { readonly type: 'DOSSIER'; readonly dossierId: string }
  | { readonly type: 'SUBSCREEN'; readonly subscreen: 'EVENTS_HUB' | 'WORLDS_HUB' | 'PROFILE' | 'JOURNAL_HUB'; readonly domain?: 'TERRITORIES' | 'POPULATION' | 'BIOSPHERE' | 'MILITARY' | 'TECHNOLOGIES' };

export interface HeaderNotificationItem {
  readonly id: string;
  readonly kind: NotificationKind;
  readonly priority: number;
  readonly badge: string;
  readonly title: string;
  readonly detail: string;
  readonly actionLabel: string;
  readonly target: NotificationActionTarget;
}

export interface NotificationFeedSummary {
  readonly items: readonly HeaderNotificationItem[];
  readonly totalCount: number;
  readonly alertCount: number;
  readonly scenarioCount: number;
  readonly questCount: number;
  readonly paRemaining: number;
  readonly mandatoryResolved: boolean;
}

export function buildHeaderNotificationFeed(
  world: WorldState,
  quests: readonly CampaignQuestStatus[],
  extra?: { readonly readyVideosCount?: number; readonly unlockedTrophiesCount?: number },
): NotificationFeedSummary {
  const items: HeaderNotificationItem[] = [];

  // 1. Mandatory Crisis Alerts (P0) & Low Resources
  const p0Dossiers = world.activeDossiers.filter((d) => d.dossierClass === 'P0');
  for (const dos of p0Dossiers) {
    items.push({
      id: `notif-p0-${dos.id}`,
      kind: 'ALERT',
      priority: 100,
      badge: 'Alerte P0',
      title: dos.title,
      detail: `Obligatoire ce tour · Expire dans ${dos.expiresInCycles} tour(s).`,
      actionLabel: 'Traiter',
      target: { type: 'DOSSIER', dossierId: dos.id },
    });
  }

  // 2. Climate Hazard Warning
  const climate = computeClimateLedger(world);
  if (climate.activeDisasterCount > 0) {
    items.push({
      id: `notif-weather-t${world.cycle}`,
      kind: 'ALERT',
      priority: 90,
      badge: 'Météo',
      title: `${climate.weatherLabel} (${climate.activeIntensityPct}%)`,
      detail: climate.disasterHistory[0]?.damageSummary ?? 'Surveillance biosphère active.',
      actionLabel: 'Biosphère',
      target: { type: 'SUBSCREEN', subscreen: 'WORLDS_HUB', domain: 'BIOSPHERE' },
    });
  }

  // 3. Mandatory Scenario / Executive Dossiers (C1..C5)
  const scenarioDossiers = world.activeDossiers.filter((d) => d.dossierClass !== 'P0');
  for (const dos of scenarioDossiers) {
    items.push({
      id: `notif-dos-${dos.id}`,
      kind: 'SCENARIO',
      priority: 80,
      badge: 'Scénario',
      title: dos.title,
      detail: `Dossier ${dos.code} en attente d’arbitrage avant la fin du tour.`,
      actionLabel: 'Ouvrir',
      target: { type: 'DOSSIER', dossierId: dos.id },
    });
  }

  // 4. Quests (claimable first, then next active quest)
  const claimableQuests = quests.filter((q) => q.completed && !q.claimed);
  for (const q of claimableQuests) {
    items.push({
      id: `notif-quest-claim-${q.id}`,
      kind: 'QUEST',
      priority: 85,
      badge: 'Quête prête',
      title: q.title,
      detail: `Récompense disponible : ${q.reward.summaryLabel}`,
      actionLabel: 'Voir quêtes',
      target: { type: 'SUBSCREEN', subscreen: 'EVENTS_HUB' },
    });
  }
  const activeQuest = quests.find((q) => !q.completed);
  if (activeQuest) {
    items.push({
      id: `notif-quest-active-${activeQuest.id}`,
      kind: 'QUEST',
      priority: 55,
      badge: `Quête ${activeQuest.progress}/${activeQuest.target}`,
      title: activeQuest.title,
      detail: activeQuest.objective,
      actionLabel: 'Ouvrir',
      target: { type: 'SUBSCREEN', subscreen: 'WORLDS_HUB', domain: 'TERRITORIES' },
    });
  }

  // 5. Remaining PA opportunity via Monde once mandatory events are clear (or alongside)
  const mandatoryResolved = world.activeDossiers.length === 0;
  if (world.pa.general > 0) {
    items.push({
      id: `notif-pa-world-t${world.cycle}`,
      kind: 'PA_WORLD',
      priority: mandatoryResolved ? 78 : 40,
      badge: `${world.pa.general} PA libre(s)`,
      title: mandatoryResolved
        ? 'Événements résolus : investir vos PA dans Monde'
        : 'Initiatives disponibles dans Monde',
      detail: `Sous-PA prêts : ${world.pa.subPa.PA_GES} Gestion · ${world.pa.subPa.PA_MNT} Technique · ${world.pa.subPa.PA_BIO} Climat · ${world.pa.subPa.PA_POL} Politique.`,
      actionLabel: 'Monde',
      target: { type: 'SUBSCREEN', subscreen: 'WORLDS_HUB', domain: 'TERRITORIES' },
    });
  }

  if ((extra?.readyVideosCount ?? 0) > 0) {
    items.push({
      id: 'notif-video-ready',
      kind: 'SYSTEM',
      priority: 30,
      badge: 'Média',
      title: `${extra!.readyVideosCount} clip(s) généré(s) disponibles`,
      detail: 'Consultables dans la médiathèque Journal & Vidéo.',
      actionLabel: 'Journal',
      target: { type: 'SUBSCREEN', subscreen: 'JOURNAL_HUB' },
    });
  }

  if ((extra?.unlockedTrophiesCount ?? 0) > 0) {
    items.push({
      id: 'notif-honors-ready',
      kind: 'SYSTEM',
      priority: 25,
      badge: 'Honneurs',
      title: `${extra!.unlockedTrophiesCount} distinction(s) active(s)`,
      detail: 'Médailles, badges et traits CK3 consultables dans votre Profil.',
      actionLabel: 'Profil',
      target: { type: 'SUBSCREEN', subscreen: 'PROFILE' },
    });
  }

  items.sort((a, b) => b.priority - a.priority);

  return {
    items,
    totalCount: items.length,
    alertCount: items.filter((i) => i.kind === 'ALERT').length,
    scenarioCount: scenarioDossiers.length,
    questCount: claimableQuests.length + (activeQuest ? 1 : 0),
    paRemaining: world.pa.general,
    mandatoryResolved,
  };
}
