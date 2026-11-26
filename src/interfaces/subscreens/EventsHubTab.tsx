import { useMemo, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Globe,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { DossierCard } from '../../components/events/DossierCard.tsx';
import { EventsActionCommandCenter } from '../../components/events/EventsActionCommandCenter.tsx';
import { OperationsQueuePanel } from '../../components/events/OperationsQueuePanel.tsx';
import { PaTurnProgressHeader } from '../../components/events/PaTurnProgressHeader.tsx';
import { PaxScenarioMatrixModal } from '../../components/world/PaxScenarioMatrixModal.tsx';
import { useOracleDossierMutation } from '../../hooks/use-oracle-query.ts';
import {
  handleCommitEndOfTurn,
  handleDrawAstralisBonusEvent,
  handleGenerateActionEvent,
  handleMagicWandResolveAndChain,
} from '../../pipelines/game-actions.pipeline.ts';
import { requestTurnEvents4T } from '../../pipelines/turn-events-4t.pipeline.ts';
import { useExoStore } from '../../stores/game.store.ts';
import { useMetaHonorsStore } from '../../stores/meta-honors.store.ts';
import {
  activeDossierIdAtom,
  activeSubscreenAtom,
  cameraFocusTargetAtom,
  focusNonceAtom,
  inspectedEntityAtom,
  isolated3DModalAtom,
  latestTurnEvents4TAtom,
  returnEventContextAtom,
  selectedTileAtom,
  toastNoticeAtom,
  turnEventsLoadingAtom,
  turnSummaryModalOpenAtom,
} from '../../stores/selection.atoms.ts';
import { useUserContextStore } from '../../stores/user-context.store.ts';
import { getAstralisEventHand } from '../../systems/dossiers-pa/magic-wand-astralis.ts';
import { computeFleetTotals } from '../../systems/fleet/ship-loadout.engine.ts';
import { rankDossiersByAiContext } from '../../systems/turn-orchestration/gemini-cost-ledger.ts';
import { buildCombinatorialScenarioBrief } from '../../systems/turn-orchestration/scenario-combinator.ts';
import { ensureZeroPaOption, evaluateTurnGateM7 } from '../../systems/turn-orchestration/turn-gate-v4.ts';
import { GeopoliticsTab } from './GeopoliticsTab.tsx';

type EventsSubTab = 'DOSSIERS' | 'OPERATIONS' | 'DIPLOMACY';
type DossierFilter = 'ALL' | 'P0' | 'ECONOMY' | 'TECH' | 'POLITICS';
type SynthClass = 'C1' | 'C2' | 'C3';

/**
 * [L7] EXW.L7.EVENTS_HUB | v5.1.0 | SADT A2.1/A3.3
 * Primary Game Tab 2 — Événements:
 * Clean 3-tier executive structure:
 * 1) Sub-tab & status header
 * 2) EventsActionCommandCenter (Recherche, Militaire, Diplomatique intuitive action grid + deep atelier)
 * 3) Prioritized P0 vs Cycle Executive Dossier Queue
 */
export function EventsHubTab() {
  const [subTab, setSubTab] = useState<EventsSubTab>('DOSSIERS');
  const [filterMode, setFilterMode] = useState<DossierFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [synthClass, setSynthClass] = useState<SynthClass>('C2');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [aiPrioritize, setAiPrioritize] = useState(true);
  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);

  const world = useExoStore((s) => s.world);
  const setWorld = useExoStore((s) => s.setWorld);
  const setActiveScale = useExoStore((s) => s.setActiveScale);
  const userContext = useUserContextStore((s) => s.context);
  const philosophyCounters = useMetaHonorsStore((s) => s.philosophyCumulative);
  const setActiveDossierId = useSetAtom(activeDossierIdAtom);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
  const [focusNonce, setFocusNonce] = useAtom(focusNonceAtom);
  const setCameraFocus = useSetAtom(cameraFocusTargetAtom);
  const setReturnContext = useSetAtom(returnEventContextAtom);
  const setInspectedEntity = useSetAtom(inspectedEntityAtom);
  const setIsolated3D = useSetAtom(isolated3DModalAtom);
  const setSelectedTile = useSetAtom(selectedTileAtom);
  const setToast = useSetAtom(toastNoticeAtom);
  const setTurnSummaryOpen = useSetAtom(turnSummaryModalOpenAtom);
  const [latest4T, setLatest4T] = useAtom(latestTurnEvents4TAtom);
  const [loading4T, setLoading4T] = useAtom(turnEventsLoadingAtom);
  const generateEventMutation = useOracleDossierMutation();

  const p0Count = world.activeDossiers.filter((d) => d.dossierClass === 'P0').length;
  const turnGate = useMemo(() => evaluateTurnGateM7(world), [world]);
  const fleetTotals = useMemo(() => computeFleetTotals(world.fleetShips ?? []), [world.fleetShips]);
  const astralisHand = useMemo(() => getAstralisEventHand(world), [world]);
  const comboBrief = useMemo(() => buildCombinatorialScenarioBrief(world), [world]);
  const [wandSalt, setWandSalt] = useState(1);

  const rankedDossiers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = world.activeDossiers.filter((dos) => {
      if (filterMode === 'P0' && dos.dossierClass !== 'P0') return false;
      if (filterMode === 'ECONOMY' && dos.dossierClass !== 'C2') return false;
      if (filterMode === 'TECH' && dos.dossierClass !== 'C3' && dos.dossierClass !== 'C4') return false;
      if (filterMode === 'POLITICS' && dos.dossierClass !== 'C1' && dos.dossierClass !== 'C5') return false;
      if (!q) return true;
      return (
        dos.title.toLowerCase().includes(q) ||
        dos.briefing.toLowerCase().includes(q) ||
        dos.code.toLowerCase().includes(q)
      );
    });
    if (!aiPrioritize) {
      return base.map((dossier) => ({
        dossier,
        tier: 'OTHER' as const,
        reason: 'Tri chronologique standard',
      }));
    }
    return rankDossiersByAiContext(base, userContext);
  }, [world.activeDossiers, filterMode, searchQuery, aiPrioritize, userContext]);

  const shouldSplitPriority = filterMode === 'ALL' && searchQuery.trim().length === 0;
  const urgentRanked = useMemo(
    () => (shouldSplitPriority ? rankedDossiers.filter((r) => r.dossier.dossierClass === 'P0') : []),
    [rankedDossiers, shouldSplitPriority],
  );
  const standardRanked = useMemo(
    () =>
      shouldSplitPriority
        ? rankedDossiers.filter((r) => r.dossier.dossierClass !== 'P0')
        : rankedDossiers,
    [rankedDossiers, shouldSplitPriority],
  );

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const launchQuickAction = (req: Parameters<typeof handleGenerateActionEvent>[0]) => {
    const [err, dossier] = handleGenerateActionEvent(req);
    if (err || !dossier) {
      setToast({ id: Date.now(), tone: 'error', text: err?.message ?? 'Action indisponible.' });
      return;
    }
    setActiveDossierId(dossier.id);
  };

  const onGenerateEvent = async (targetClass?: SynthClass) => {
    try {
      const res = await generateEventMutation.mutateAsync(targetClass ?? synthClass);
      setToast({
        id: Date.now(),
        tone: 'info',
        text: `Nouvel événement ajouté : « ${res.dossier.title} ».`,
      });
    } catch (e) {
      setToast({
        id: Date.now(),
        tone: 'warn',
        text: e instanceof Error ? e.message : 'Création d’événement indisponible.',
      });
    }
  };

  const onRetry4TCascade = async () => {
    if (loading4T) return;
    setLoading4T(true);
    const res = await requestTurnEvents4T(world);
    setLatest4T(res);
    setLoading4T(false);
    if (res.dossiers.length > 0) {
      const merged = [...res.dossiers.map(ensureZeroPaOption), ...world.activeDossiers].slice(0, 7);
      setWorld({ ...world, activeDossiers: merged });
      setToast({
        id: Date.now(),
        tone: 'success',
        text: `Cascade 4T (${res.tier}) : ${res.dossiers.length} dossier(s) synchronisé(s).`,
      });
    } else {
      setToast({ id: Date.now(), tone: 'warn', text: res.errorMessage ?? 'Repli local actif.' });
    }
  };

  const onQuickMagicWand = () => {
    const firstPlayable = astralisHand.cards.find((s) => s.playable);
    if (!firstPlayable) {
      setToast({
        id: Date.now(),
        tone: 'warn',
        text: 'Aucun événement finançable dans la main courante.',
      });
      return;
    }
    const nextSalt = wandSalt + 1;
    setWandSalt(nextSalt);
    const [err, outcome] = handleMagicWandResolveAndChain(firstPlayable.dossier.id, nextSalt);
    if (err || !outcome) {
      setToast({ id: Date.now(), tone: 'warn', text: err?.message ?? 'Baguette Magique indisponible.' });
      return;
    }
    if (outcome.nextDossier) {
      setToast({
        id: Date.now(),
        tone: 'success',
        text: `Baguette Magique : ${outcome.pickedLabel} → Suivant ouvert : « ${outcome.nextDossier.title} »`,
      });
      setActiveDossierId(outcome.nextDossier.id);
    } else {
      setToast({
        id: Date.now(),
        tone: 'success',
        text: `Baguette Magique : ${outcome.pickedLabel} · Tous les événements jouables traités.`,
      });
    }
  };

  const onDrawBonusCard = () => {
    const [err, drawn] = handleDrawAstralisBonusEvent();
    if (err || !drawn) {
      setToast({ id: Date.now(), tone: 'warn', text: err?.message ?? 'Pioche indisponible.' });
      return;
    }
    setToast({
      id: Date.now(),
      tone: 'info',
      text: `Événement bonus assemblé : « ${drawn.title} ».`,
    });
    setActiveDossierId(drawn.id);
  };

  const onAdvanceTurnFromHub = async () => {
    setLoading4T(true);
    const [err] = await handleCommitEndOfTurn((res) => {
      setLatest4T(res);
      setLoading4T(false);
    });
    if (err) {
      setLoading4T(false);
      setToast({ id: Date.now(), tone: 'warn', text: err.message });
      return;
    }
    setSubscreen('NONE');
    setTurnSummaryOpen(true);
  };

  const openBuilding3D = (districtId: string) => setIsolated3D({ mode: 'BUILDING', districtId });

  const inspectSector = (tileIndex: number) => {
    const nextNonce = focusNonce + 1;
    setFocusNonce(nextNonce);
    setReturnContext({
      dossierId: null,
      title: 'Événements',
      entityLabel: `Secteur #${tileIndex}`,
      returnSubscreen: 'EVENTS_HUB',
    });
    setActiveScale(2);
    setCameraFocus({ scale: 2, targetType: 'TILE', tileIndex, focusNonce: nextNonce });
    setSubscreen('NONE');
    setSelectedTile(tileIndex);
    setInspectedEntity({ kind: 'SECTOR', tileIndex });
  };

  const tabs: readonly { id: EventsSubTab; label: string; icon: typeof FileText }[] = [
    { id: 'DOSSIERS', label: `À traiter (${world.activeDossiers.length})`, icon: FileText },
    { id: 'OPERATIONS', label: `Opérations (${world.triggerBus.length})`, icon: Clock },
    { id: 'DIPLOMACY', label: 'Diplomatie', icon: Globe },
  ];

  return (
    <div className="space-y-4">
      {/* Zone 1: Sub-tab Switcher, Shortcuts & Cycle Telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav
          role="tablist"
          aria-label="Sections des événements"
          className="exo-window-tabs-rail flex shrink-0 flex-nowrap gap-1.5 overflow-x-auto sm:flex-wrap sm:overflow-visible"
        >
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = subTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSubTab(item.id)}
                className={`inline-flex min-h-[42px] shrink-0 items-center gap-2 px-3.5 text-[13px] font-bold transition whitespace-nowrap ${
                  active ? 'exo-window-tab-active' : 'exo-window-tab'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-current' : 'exo-accent-text'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px]">
          <button
            type="button"
            data-testid="open-pax-scenario-btn"
            onClick={() => setScenarioModalOpen(true)}
            className="exo-accent-btn inline-flex min-h-[34px] shrink-0 items-center gap-1 rounded-lg px-2.5 font-bold whitespace-nowrap"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Scénario Matriciel
          </button>
          <button
            type="button"
            onClick={() => setIsolated3D({ mode: 'HANGAR' })}
            className="exo-accent-chip inline-flex min-h-[34px] shrink-0 items-center gap-1 rounded-lg px-2.5 font-bold whitespace-nowrap"
          >
            <Rocket className="h-3.5 w-3.5 exo-accent-text" />
            Hangar 3D
          </button>
          <span
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 font-bold whitespace-nowrap ${
              p0Count > 0
                ? 'border-rose-400 bg-rose-500/15 text-rose-800 dark:border-rose-500 dark:text-rose-200'
                : 'border-emerald-300 bg-emerald-500/12 text-emerald-800 dark:border-emerald-700 dark:text-emerald-200'
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            {p0Count > 0 ? `${p0Count} urgence(s)` : 'Situation stable'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white/85 px-2 py-1 font-semibold text-rose-900 whitespace-nowrap dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
            <Clock className="h-3 w-3 text-rose-600 dark:text-rose-300" />
            Tour {world.cycle} · {world.season}
          </span>
        </div>
      </div>

      {/* Whole-Turn PA Consumption Header & Astralis 7-Card Hand Deck */}
      <PaTurnProgressHeader mode="turn" world={world} />

      <div
        data-testid="events-astralis-deck-bar"
        className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-slate-50/90 px-3.5 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-900/75"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Main Astralis {astralisHand.cards.length}/{astralisHand.handLimit}
          </span>
          <span className="text-slate-400" aria-hidden="true">·</span>
          <span className="font-mono text-[11px] tabular-nums text-emerald-700 dark:text-emerald-300">
            {astralisHand.playableCount} jouable{astralisHand.playableCount > 1 ? 's' : ''}
          </span>
          <span className="text-slate-400" aria-hidden="true">·</span>
          <span className="truncate text-[11px] text-slate-600 dark:text-slate-300">
            {comboBrief.subEraCode} · {comboBrief.branchLabel} · {comboBrief.worldTensions[0]}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {astralisHand.playableCount > 0 && (
            <button
              type="button"
              data-testid="hub-magic-wand-btn"
              onClick={onQuickMagicWand}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-amber-500 px-3 font-mono text-[11px] font-bold text-slate-950 shadow-xs transition hover:bg-amber-400 whitespace-nowrap"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>Baguette Magique (Enchaîner)</span>
            </button>
          )}
          <button
            type="button"
            data-testid="hub-draw-bonus-btn"
            disabled={!astralisHand.canDrawBonusCard}
            onClick={onDrawBonusCard}
            title={
              astralisHand.canDrawBonusCard
                ? `Pioche un nouvel événement combinatoire (PA & ressources suffisants · ${astralisHand.bonusDrawsRemaining} rest.)`
                : 'Pioche indisponible (main pleine, quota atteint ou PA/ressources insuffisants)'
            }
            className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-sky-400/75 bg-sky-500/12 px-2.5 font-mono text-[11px] font-bold text-sky-900 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-45 dark:border-sky-600 dark:text-sky-200 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Piocher bonus ({astralisHand.bonusDrawsRemaining})</span>
          </button>
        </div>
      </div>

      {/* 4-Tier Cascade Status */}
      {(loading4T || latest4T) && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200/80 bg-rose-50/70 px-3.5 py-2 text-xs dark:border-rose-900/60 dark:bg-rose-950/35">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-300" />
            <span className="font-medium text-[#1f1224] dark:text-rose-100">
              {loading4T
                ? 'Générateur d’événements 4 paliers en cours de synchronisation…'
                : latest4T?.tier === 'T4_OFFLINE_CV'
                  ? `Mode Catalogue Vivant (T4 hors-ligne) — ${latest4T.errorMessage ?? 'Repli déterministe actif'}`
                  : `Dépêches synchronisées (${latest4T?.tier ?? 'LIVE'} · ${latest4T?.modelUsed ?? 'Gemini'})`}
            </span>
          </div>
          {!loading4T && latest4T?.tier === 'T4_OFFLINE_CV' && (
            <button
              type="button"
              onClick={() => void onRetry4TCascade()}
              className="inline-flex min-h-[30px] items-center gap-1 rounded-lg border border-rose-300 bg-white px-2.5 font-mono text-[10.5px] font-bold text-rose-800 hover:border-rose-500 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-100"
            >
              <RefreshCw className="h-3 w-3" />
              Réessayer
            </button>
          )}
        </div>
      )}

      {subTab === 'DOSSIERS' && (
        <div className="space-y-4">
          {/* Zone 2: Categorized Action Grid (Recherche, Militaire, Diplomatique) + Deep Atelier */}
          <EventsActionCommandCenter
            synthClass={synthClass}
            onSynthClassChange={setSynthClass}
            onGenerateSynthDossier={(target) => void onGenerateEvent(target)}
            isGeneratingSynth={generateEventMutation.isPending}
            onLaunchAction={launchQuickAction}
            onOpenHangar={() => setIsolated3D({ mode: 'HANGAR' })}
          />

          {/* Zone 3: Dossier Filter, AI Context Ranking & Search */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-rose-600 dark:text-rose-300" />
              {([
                { id: 'ALL', label: `Tous (${world.activeDossiers.length})` },
                { id: 'P0', label: `Urgents (${p0Count})` },
                { id: 'ECONOMY', label: 'Économie' },
                { id: 'TECH', label: 'Technique' },
                { id: 'POLITICS', label: 'Politique' },
              ] as const).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterMode(f.id)}
                  className={`min-h-[34px] shrink-0 rounded-lg border px-2.5 font-mono text-[11px] font-semibold whitespace-nowrap transition ${
                    filterMode === f.id
                      ? 'border-rose-500 bg-rose-500/15 text-rose-800 dark:border-rose-400 dark:bg-rose-500/25 dark:text-rose-100'
                      : 'border-rose-200 bg-white/85 text-rose-900/75 hover:border-rose-400 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <button
                type="button"
                data-testid="ai-context-rank-toggle"
                onClick={() => setAiPrioritize((v) => !v)}
                className={`min-h-[34px] shrink-0 rounded-lg px-2.5 font-mono text-[11px] font-bold whitespace-nowrap transition ${
                  aiPrioritize ? 'exo-accent-btn' : 'exo-accent-chip'
                }`}
              >
                {aiPrioritize ? '★ Priorisé IA' : 'Chronologique'}
              </button>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-rose-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un dossier..."
                className="min-h-[36px] w-full rounded-lg border border-rose-200 bg-white pl-8 pr-3 text-xs text-[#1f1224] placeholder:text-rose-900/45 dark:border-rose-800 dark:bg-[#190d1f] dark:text-rose-50"
              />
            </div>
          </div>

          {rankedDossiers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-300/80 bg-emerald-50/60 p-6 text-center dark:border-emerald-800/70 dark:bg-emerald-950/30">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              <div className="space-y-1">
                <p className="font-display text-sm font-bold text-emerald-950 dark:text-emerald-100">
                  {world.activeDossiers.length === 0
                    ? 'Tous les dossiers du tour sont traités !'
                    : 'Aucun dossier dans ce filtre.'}
                </p>
                <p className="text-xs text-emerald-900/75 dark:text-emerald-200/80">
                  {world.activeDossiers.length === 0
                    ? 'La porte Fin de tour (M7) est déverrouillée. Validez pour ouvrir le bilan d’ère.'
                    : 'Essayez un autre filtre ou utilisez la grille d’actions ci-dessus.'}
                </p>
              </div>
              {turnGate.allowed && (
                <button
                  type="button"
                  onClick={() => void onAdvanceTurnFromHub()}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-emerald-600 px-4 font-mono text-xs font-bold text-white shadow-sm hover:bg-emerald-500"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Valider la Fin de tour →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {urgentRanked.length > 0 && (
                <section className="space-y-2.5" aria-label="Priorités critiques">
                  <div className="flex items-center justify-between border-b border-rose-300/70 pb-1.5 dark:border-rose-800/70">
                    <h2 className="inline-flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Priorités critiques (P0) · {urgentRanked.length}
                    </h2>
                    <span className="font-mono text-[10px] text-rose-800/70 dark:text-rose-300/75">
                      À arbitrer avant la fin du tour
                    </span>
                  </div>
                  <div className="space-y-3">
                    {urgentRanked.map((item) => (
                      <DossierCard
                        key={item.dossier.id}
                        dossier={item.dossier}
                        tier={item.tier}
                        reason={item.reason}
                        world={world}
                        philosophyCounters={philosophyCounters}
                        aiPrioritize={aiPrioritize}
                        isExpanded={Boolean(expandedIds[item.dossier.id])}
                        onToggleExpand={toggleExpanded}
                        onInspectSector={inspectSector}
                        onOpenBuilding3D={openBuilding3D}
                        onOpenHangar={() => setIsolated3D({ mode: 'HANGAR' })}
                        onSelectDossier={(id) => setActiveDossierId(id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {standardRanked.length > 0 && (
                <section className="space-y-2.5" aria-label="Dossiers du cycle">
                  {shouldSplitPriority && urgentRanked.length > 0 && (
                    <div className="flex items-center justify-between border-b border-rose-200/80 pb-1.5 dark:border-rose-900/60">
                      <h2 className="font-display text-xs font-bold uppercase tracking-wider text-rose-900/80 dark:text-rose-200/85">
                        Dossiers du cycle en cours · {standardRanked.length}
                      </h2>
                      <span className="font-mono text-[10px] text-rose-900/60 dark:text-rose-300/70">
                        Opportunités &amp; gouvernance
                      </span>
                    </div>
                  )}
                  <div className="space-y-3">
                    {standardRanked.map((item) => (
                      <DossierCard
                        key={item.dossier.id}
                        dossier={item.dossier}
                        tier={item.tier}
                        reason={item.reason}
                        world={world}
                        philosophyCounters={philosophyCounters}
                        aiPrioritize={aiPrioritize}
                        isExpanded={Boolean(expandedIds[item.dossier.id])}
                        onToggleExpand={toggleExpanded}
                        onInspectSector={inspectSector}
                        onOpenBuilding3D={openBuilding3D}
                        onOpenHangar={() => setIsolated3D({ mode: 'HANGAR' })}
                        onSelectDossier={(id) => setActiveDossierId(id)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}

      {subTab === 'OPERATIONS' && <OperationsQueuePanel world={world} fleetTotals={fleetTotals} />}
      {subTab === 'DIPLOMACY' && <GeopoliticsTab />}

      <PaxScenarioMatrixModal open={scenarioModalOpen} onClose={() => setScenarioModalOpen(false)} />
    </div>
  );
}
