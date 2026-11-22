import { useMemo, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  AlertTriangle,
  ArrowRight,
  Box,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  FileText,
  Filter,
  Globe,
  Hammer,
  Handshake,
  MapPin,
  RefreshCw,
  Rocket,
  Search,
  Shield,
  Sparkles,
  User,
  Wrench,
  Zap,
} from 'lucide-react';
import { RichEntityText } from '../../components/RichEntityText.tsx';
import { NestedBadgeGroup } from '../../components/bento/NestedBadgeGroup.tsx';
import { PaxScenarioMatrixModal } from '../../components/world/PaxScenarioMatrixModal.tsx';
import {
  handleCommitEndOfTurn,
  handleGenerateActionEvent,
} from '../../pipelines/game-actions.pipeline.ts';
import { useOracleDossierMutation } from '../../hooks/use-oracle-query.ts';
import { requestTurnEvents4T } from '../../pipelines/turn-events-4t.pipeline.ts';
import { useExoStore } from '../../stores/game.store.ts';
import { useMetaHonorsStore } from '../../stores/meta-honors.store.ts';
import { useUserContextStore } from '../../stores/user-context.store.ts';
import {
  activeDossierIdAtom,
  activeSubscreenAtom,
  inspectedEntityAtom,
  isolated3DModalAtom,
  latestTurnEvents4TAtom,
  selectedTileAtom,
  toastNoticeAtom,
  turnEventsLoadingAtom,
  turnSummaryModalOpenAtom,
} from '../../stores/selection.atoms.ts';
import {
  buildPhilosophyBadgeTriplet,
  buildProvenanceBadgeTriplet,
} from '../../systems/dossiers-pa/badge-taxonomy.ts';
import { getEffectiveOptionsForDossier } from '../../systems/dossiers-pa/dossier-subchoices.ts';
import { resolveDossierContext } from '../../systems/dossiers-pa/entity-markup.ts';
import { rankDossiersByAiContext } from '../../systems/turn-orchestration/gemini-cost-ledger.ts';
import { ensureZeroPaOption, evaluateTurnGateM7 } from '../../systems/turn-orchestration/turn-gate-v4.ts';
import { formatDossierCategory } from '../../utils/ui-labels.ts';
import { GeopoliticsTab } from './GeopoliticsTab.tsx';

type EventsSubTab = 'DOSSIERS' | 'OPERATIONS' | 'DIPLOMACY';
type DossierFilter = 'ALL' | 'P0' | 'ECONOMY' | 'TECH' | 'POLITICS';
type SynthClass = 'C1' | 'C2' | 'C3';

const CLASS_BADGE: Record<string, string> = {
  P0: 'bg-rose-600 text-white border-rose-600 dark:bg-rose-500 dark:border-rose-400',
  C1: 'bg-fuchsia-500/14 text-fuchsia-900 border-fuchsia-300 dark:bg-fuchsia-500/20 dark:text-fuchsia-200 dark:border-fuchsia-700',
  C2: 'bg-amber-500/14 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-700',
  C3: 'bg-orange-500/14 text-orange-900 border-orange-300 dark:bg-orange-500/20 dark:text-orange-200 dark:border-orange-700',
  C4: 'bg-emerald-500/14 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-700',
  C5: 'bg-pink-500/14 text-pink-900 border-pink-300 dark:bg-pink-500/20 dark:text-pink-200 dark:border-pink-700',
};

const CLASS_ACCENT_BORDER: Record<string, string> = {
  P0: 'border-l-rose-600',
  C1: 'border-l-fuchsia-500',
  C2: 'border-l-amber-500',
  C3: 'border-l-orange-500',
  C4: 'border-l-emerald-500',
  C5: 'border-l-pink-500',
};

function getOperationStatusMeta(category: string, summary: string): {
  readonly label: string;
  readonly tone: string;
} {
  const s = summary.toLowerCase();
  if (s.includes('chantier') || s.includes('extension') || s.includes('quartier')) {
    return {
      label: 'Chantier en cours',
      tone: 'border-emerald-300 bg-emerald-500/12 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
    };
  }
  if (s.includes('recrut') || s.includes('unité') || s.includes('troupe') || s.includes('garnison')) {
    return {
      label: 'Recrutement en cours',
      tone: 'border-fuchsia-300 bg-fuchsia-500/12 text-fuchsia-900 dark:border-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-200',
    };
  }
  if (s.includes('drone') || s.includes('maintenance') || s.includes('répar')) {
    return {
      label: 'Maintenance en cours',
      tone: 'border-orange-300 bg-orange-500/12 text-orange-900 dark:border-orange-700 dark:bg-orange-500/20 dark:text-orange-200',
    };
  }
  if (s.includes('emprunt') || s.includes('crédit') || s.includes('marché') || s.includes('subvention')) {
    return {
      label: 'Opération financière en cours',
      tone: 'border-amber-300 bg-amber-500/12 text-amber-900 dark:border-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
    };
  }
  if (category === 'DELAYED_CONSEQUENCE') {
    return {
      label: 'Programme en cours',
      tone: 'border-rose-300 bg-rose-500/12 text-rose-900 dark:border-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
    };
  }
  return {
    label: 'Événement en cours',
    tone: 'border-rose-300 bg-rose-500/12 text-rose-900 dark:border-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
  };
}

/**
 * [L7] EXW.L7.EVENTS_HUB | v4.0.0-rc.1 | SADT A2.1/A3.3
 * Primary Game Tab 2 — Événements:
 * - Vertical collapsible dossier cards + expandable SubDossiers/options preview
 * - Subtle dotted underline on ORACLE_GEMINI live dossiers + guaranteed 0-PA badge
 * - Direct clickable badges to open Isolated Building 3D Inspector (B3D) & Fleet Hangar 3D (H3D)
 * - Transparent 4-Tier Gemini Cascade status banner with manual retry when degraded
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
  const userContext = useUserContextStore((s) => s.context);
  const philosophyCounters = useMetaHonorsStore((s) => s.philosophyCumulative);
  const setActiveDossierId = useSetAtom(activeDossierIdAtom);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
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
  const upgradableDistrict =
    world.districts.find((d) => d.modulesCount < 3) ?? world.districts[0];

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

  const onGenerateEvent = async () => {
    try {
      const res = await generateEventMutation.mutateAsync(synthClass);
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
      const merged = [
        ...res.dossiers.map(ensureZeroPaOption),
        ...world.activeDossiers,
      ].slice(0, 5);
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

  const openBuilding3D = (districtId: string) => {
    setIsolated3D({ mode: 'BUILDING', districtId });
  };

  const inspectSector = (tileIndex: number) => {
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
      {/* Sub-tab Switcher + Quick Hangar 3D & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = subTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSubTab(item.id)}
                className={`inline-flex min-h-[42px] shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-semibold transition whitespace-nowrap ${
                  active
                    ? 'border-rose-500 bg-rose-500/15 text-rose-800 dark:border-rose-400 dark:bg-rose-500/25 dark:text-rose-100'
                    : 'border-rose-200 bg-white/85 text-[#1f1224] hover:border-rose-400 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5 text-rose-600 dark:text-rose-300" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px]">
          <button
            type="button"
            data-testid="open-pax-scenario-btn"
            onClick={() => setScenarioModalOpen(true)}
            className="exo-accent-btn inline-flex min-h-[34px] items-center gap-1 rounded-lg px-2.5 font-bold"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Scénario Matriciel
          </button>
          <button
            type="button"
            onClick={() => setIsolated3D({ mode: 'HANGAR' })}
            className="exo-accent-chip inline-flex min-h-[34px] items-center gap-1 rounded-lg px-2.5 font-bold"
          >
            <Rocket className="h-3.5 w-3.5 exo-accent-text" />
            Hangar 3D
          </button>
          <span
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 font-bold ${
              p0Count > 0
                ? 'border-rose-400 bg-rose-500/15 text-rose-800 dark:border-rose-500 dark:text-rose-200'
                : 'border-emerald-300 bg-emerald-500/12 text-emerald-800 dark:border-emerald-700 dark:text-emerald-200'
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            {p0Count > 0 ? `${p0Count} urgence(s)` : 'Situation stable'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white/85 px-2 py-1 font-semibold text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
            <Clock className="h-3 w-3 text-rose-600 dark:text-rose-300" />
            Tour {world.cycle} · {world.season}
          </span>
        </div>
      </div>

      {/* Transparent 4-Tier Gemini Cascade Status Banner */}
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
          {/* PA Budget & Quick Event Launcher */}
          <div className="space-y-3 rounded-xl border border-rose-200/90 bg-white/95 p-3.5 shadow-xs dark:border-rose-900/60 dark:bg-[#190d1f]">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                  <Zap className="h-3.5 w-3.5" />
                  PA : {world.pa.general}/{world.pa.generalCap}
                </span>
                <span className="rounded-md border border-amber-300/90 bg-amber-500/12 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-amber-900 dark:border-amber-700 dark:text-amber-200">
                  Gestion {world.pa.subPa.PA_GES}
                </span>
                <span className="rounded-md border border-orange-300/90 bg-orange-500/12 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-orange-900 dark:border-orange-700 dark:text-orange-200">
                  Technique {world.pa.subPa.PA_MNT}
                </span>
                <span className="rounded-md border border-emerald-300/90 bg-emerald-500/12 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-emerald-900 dark:border-emerald-700 dark:text-emerald-200">
                  Climat {world.pa.subPa.PA_BIO}
                </span>
                <span className="rounded-md border border-fuchsia-300/90 bg-fuchsia-500/12 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-fuchsia-900 dark:border-fuchsia-700 dark:text-fuchsia-200">
                  Politique {world.pa.subPa.PA_POL}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <select
                  aria-label="Catégorie d'événement à générer"
                  value={synthClass}
                  onChange={(e) => setSynthClass(e.target.value as SynthClass)}
                  className="min-h-[38px] rounded-lg border border-rose-200 bg-white px-2.5 font-mono text-xs font-semibold text-[#1f1224] dark:border-rose-800 dark:bg-[#190d1f] dark:text-rose-100"
                >
                  <option value="C1">Politique</option>
                  <option value="C2">Économie</option>
                  <option value="C3">Technique</option>
                </select>
                <button
                  type="button"
                  disabled={generateEventMutation.isPending}
                  onClick={() => void onGenerateEvent()}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-rose-500 disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{generateEventMutation.isPending ? 'Création…' : 'Nouvel événement'}</span>
                </button>
              </div>
            </div>

            {/* Direct Operational Event Shortcuts */}
            <div className="border-t border-rose-200/70 pt-2.5 dark:border-rose-900/50">
              <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-rose-900/65 dark:text-rose-200/70">
                Lancer une opération (dossier 4 choix + option gratuite 0-PA garantie)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {upgradableDistrict && (
                  <button
                    type="button"
                    onClick={() =>
                      launchQuickAction({ kind: 'GRAFT_MODULE', districtId: upgradableDistrict.id })
                    }
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-emerald-300/90 bg-emerald-50/80 px-2.5 text-xs font-semibold text-emerald-950 hover:border-emerald-500 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
                  >
                    <Building2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
                    <span>+ Extension ({upgradableDistrict.name})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => launchQuickAction({ kind: 'BANK_LOAN', principal: 400 })}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-amber-300/90 bg-amber-50/80 px-2.5 text-xs font-semibold text-amber-950 hover:border-amber-500 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                >
                  <Coins className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" />
                  <span>+ Emprunt (+400 Cr)</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    launchQuickAction({ kind: 'MARKET_TRADE', resource: 'materials', action: 'BUY', quantity: 20 })
                  }
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/80 px-2.5 text-xs font-semibold text-rose-900 hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
                >
                  <Hammer className="h-3.5 w-3.5 text-rose-600 dark:text-rose-300" />
                  <span>+ Acheter 20 Matériaux</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    launchQuickAction({ kind: 'REASSIGN_DRONE', fromRole: 'recon', toRole: 'construction' })
                  }
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-orange-300/80 bg-orange-50/80 px-2.5 text-xs font-semibold text-orange-950 hover:border-orange-500 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-100"
                >
                  <Wrench className="h-3.5 w-3.5 text-orange-600 dark:text-orange-300" />
                  <span>+ Drones entretien</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    launchQuickAction({ kind: 'RECRUIT_UNIT', unitClass: 'INFANTRY_EXO', level: 1 })
                  }
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-fuchsia-300/80 bg-fuchsia-50/80 px-2.5 text-xs font-semibold text-fuchsia-950 hover:border-fuchsia-500 dark:border-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-100"
                >
                  <Shield className="h-3.5 w-3.5 text-fuchsia-600 dark:text-fuchsia-300" />
                  <span>+ Recrutement</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter, AI Context Ranking Toggle & Search Bar */}
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
                  className={`min-h-[34px] rounded-lg border px-2.5 font-mono text-[11px] font-semibold transition ${
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
                className={`min-h-[34px] rounded-lg px-2.5 font-mono text-[11px] font-bold transition ${
                  aiPrioritize ? 'exo-accent-btn' : 'exo-accent-chip'
                }`}
              >
                {aiPrioritize ? '★ Priorisé Contexte IA' : 'Tri Chronologique'}
              </button>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-rose-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un dossier..."
                className="min-h-[38px] w-full rounded-lg border border-rose-200 bg-white pl-8 pr-3 text-xs text-[#1f1224] placeholder:text-rose-900/45 dark:border-rose-800 dark:bg-[#190d1f] dark:text-rose-50"
              />
            </div>
          </div>

          {rankedDossiers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-300/80 bg-emerald-50/60 p-6 text-center dark:border-emerald-800/70 dark:bg-emerald-950/30">
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
                    : 'Essayez un autre filtre ou lancez une opération ci-dessus.'}
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
            /* Vertical Collapsible Event Cards */
            <div className="space-y-3">
              {rankedDossiers.map(({ dossier: dos, tier, reason }) => {
                const expandedOptions = getEffectiveOptionsForDossier(dos);
                const hasZeroPa = expandedOptions.some(
                  (o) => o.paGeneralCost === 0 && o.subPaCost === 0,
                );
                const isLive = dos.source === 'ORACLE_GEMINI';
                const isExpanded = Boolean(expandedIds[dos.id]);
                const ctx = resolveDossierContext(world, dos);
                const isUrgent = dos.dossierClass === 'P0' || ctx.urgency.level === 'CRITICAL';
                const primaryOpt = expandedOptions[0];
                const badgeTriplets = [
                  buildProvenanceBadgeTriplet(dos),
                  ...(primaryOpt
                    ? [buildPhilosophyBadgeTriplet(primaryOpt, philosophyCounters)]
                    : []),
                ];

                return (
                  <article
                    key={dos.id}
                    className={`rounded-xl border border-l-4 p-4 transition hover:border-rose-400 ${
                      CLASS_ACCENT_BORDER[dos.dossierClass] ?? 'border-l-rose-500'
                    } ${
                      isUrgent
                        ? 'border-rose-400 bg-rose-50/75 dark:border-rose-500/70 dark:bg-rose-950/40'
                        : 'border-rose-200/90 bg-white/95 dark:border-rose-900/60 dark:bg-[#190d1f]'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-bold ${
                            CLASS_BADGE[dos.dossierClass] ?? ''
                          }`}
                        >
                          {isUrgent && <AlertTriangle className="h-3 w-3" />}
                          {formatDossierCategory(dos.dossierClass)} · {dos.code}
                        </span>
                        {aiPrioritize && tier !== 'OTHER' && (
                          <span
                            title={reason}
                            className={`rounded-md border px-1.5 py-0.5 font-bold ${
                              tier === 'RECOMMENDED'
                                ? 'border-amber-400 bg-amber-500/15 text-amber-800 dark:text-amber-200'
                                : 'border-fuchsia-400 bg-fuchsia-500/15 text-fuchsia-800 dark:text-fuchsia-200'
                            }`}
                          >
                            {tier === 'RECOMMENDED' ? '★ Recommandé' : '◆ Préférence IA'}
                          </span>
                        )}
                        {hasZeroPa && (
                          <span className="rounded-md border border-emerald-400/80 bg-emerald-500/12 px-1.5 py-0.5 font-bold text-emerald-800 dark:text-emerald-200">
                            0-PA dispo
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-100/75 px-1.5 py-0.5 font-semibold text-rose-900/80 dark:bg-rose-900/50 dark:text-rose-200">
                          <Clock className="h-2.5 w-2.5" />
                          {dos.expiresInCycles} tour(s)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpanded(dos.id)}
                        aria-expanded={isExpanded}
                        className="inline-flex min-h-[28px] items-center gap-1 rounded-md border border-rose-200 bg-white/90 px-2 font-semibold text-rose-900 hover:border-rose-400 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
                      >
                        <span>{isExpanded ? 'Replier options' : `Aperçu (${expandedOptions.length} choix)`}</span>
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </div>

                    {/* 3-Level Stacked Badges (Provenance + Philosophy/Ethics + right-side (i) Legend) */}
                    <div className="mt-2">
                      <NestedBadgeGroup triplets={badgeTriplets} />
                    </div>

                    {/* Title — subtle dotted underline when generated live by Gemini */}
                    <h3
                      className={`mt-2 font-display text-sm font-bold text-[#1f1224] dark:text-rose-50 ${
                        isLive ? 'underline decoration-rose-400/70 decoration-dotted underline-offset-4' : ''
                      }`}
                    >
                      <RichEntityText text={dos.title} interactive />
                    </h3>

                    {/* Clickable Entity Badges -> Direct B3D / H3D / Sector Inspection */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                      <button
                        type="button"
                        onClick={() => inspectSector(ctx.tileIndex)}
                        className="exo-accent-chip inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold"
                      >
                        <MapPin className="h-3 w-3 shrink-0 exo-accent-text" />
                        <span>{ctx.placeLabel}</span>
                      </button>
                      {ctx.building && (
                        <button
                          type="button"
                          onClick={() => openBuilding3D(ctx.building!.id)}
                          title="Ouvrir le modèle 3D isolé du bâtiment (B3D)"
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-400/90 bg-emerald-500/12 px-2 py-0.5 font-semibold text-emerald-900 hover:bg-emerald-500/25 dark:border-emerald-700 dark:text-emerald-100"
                        >
                          <Box className="h-3 w-3 shrink-0" />
                          <span>{ctx.building.name} · 3D ({ctx.building.integrity}%)</span>
                        </button>
                      )}
                      {(dos.dossierClass === 'C3' || dos.dossierClass === 'C5') && (
                        <button
                          type="button"
                          onClick={() => setIsolated3D({ mode: 'HANGAR' })}
                          className="inline-flex items-center gap-1 rounded-md border border-amber-300/90 bg-amber-500/12 px-2 py-0.5 font-semibold text-amber-950 hover:bg-amber-500/25 dark:border-amber-700 dark:text-amber-100"
                        >
                          <Rocket className="h-3 w-3 shrink-0" />
                          <span>Flotte 3D</span>
                        </button>
                      )}
                      {ctx.advisor && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-rose-300/90 bg-rose-500/10 px-2 py-0.5 font-semibold text-rose-900 dark:border-rose-700 dark:text-rose-100">
                          <User className="h-3 w-3 shrink-0" />
                          <span>{ctx.advisor.name}</span>
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs leading-relaxed text-rose-950/85 dark:text-rose-100/85">
                      <RichEntityText text={dos.briefing} interactive />
                    </p>

                    {/* Collapsible SubDossiers / Options Preview */}
                    {isExpanded && (
                      <div className="mt-3 grid gap-2 border-t border-rose-200/70 pt-3 sm:grid-cols-2 dark:border-rose-900/50">
                        {expandedOptions.map((opt) => (
                          <div
                            key={opt.id}
                            className="rounded-lg border border-rose-200/80 bg-rose-50/45 p-2.5 text-[11px] dark:border-rose-900/50 dark:bg-rose-950/30"
                          >
                            <div className="flex items-center justify-between gap-2 font-semibold text-[#1f1224] dark:text-rose-50">
                              <span>{opt.label}</span>
                              <span
                                className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                                  opt.paGeneralCost === 0 && opt.subPaCost === 0
                                    ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200'
                                    : 'bg-rose-500/15 text-rose-800 dark:text-rose-200'
                                }`}
                              >
                                {opt.paGeneralCost === 0 && opt.subPaCost === 0
                                  ? '0 PA'
                                  : `${opt.paGeneralCost} PA${opt.subPaCost > 0 ? ` +${opt.subPaCost}` : ''}`}
                              </span>
                            </div>
                            <p className="mt-1 text-[10.5px] text-rose-900/75 dark:text-rose-200/75">
                              {opt.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-rose-200/70 pt-2.5 dark:border-rose-900/50">
                      <span className="font-mono text-[11px] font-medium text-rose-800/80 dark:text-rose-300">
                        {expandedOptions.length} choix · {expandedOptions.length * 3} variantes
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveDossierId(dos.id)}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 font-mono text-[11px] font-bold text-white shadow-xs hover:bg-rose-500"
                      >
                        <span>Traiter</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {subTab === 'OPERATIONS' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-200/90 bg-white/95 p-4 dark:border-rose-900/60 dark:bg-[#190d1f]">
            <h3 className="font-display text-sm font-bold text-[#1f1224] dark:text-rose-50">
              Opérations &amp; Programmes en cours ({world.triggerBus.length})
            </h3>
            <p className="mt-0.5 text-xs text-rose-900/65 dark:text-rose-200/70">
              Suivi technique des chantiers, prochain convoi de colons (Tour {world.genese?.nextArrivalCycle ?? world.cycle + 4}), promesses et programmes planifiés.
            </p>
            {world.triggerBus.length === 0 ? (
              <p className="mt-3 rounded-lg border border-rose-200/70 bg-rose-50/50 p-3 text-xs text-rose-900/70 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-200/75">
                Aucune opération différée en file d’attente. Vos prochains chantiers et engagements apparaîtront ici avec leur tour d’achèvement.
              </p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {world.triggerBus.map((ev) => {
                  const status = getOperationStatusMeta(ev.category, ev.summary);
                  const cyclesLeft = Math.max(0, ev.dueCycle - world.cycle);
                  const progressPct =
                    cyclesLeft === 0 ? 100 : Math.max(18, Math.min(88, 100 - cyclesLeft * 25));

                  return (
                    <div
                      key={ev.id}
                      className="space-y-2 rounded-xl border border-rose-200/80 bg-rose-50/55 px-3.5 py-3 text-xs dark:border-rose-900/50 dark:bg-rose-950/30"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${status.tone}`}
                        >
                          <Clock className="h-3 w-3" />
                          {status.label}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                          {cyclesLeft === 0
                            ? `Achèvement imminent (Tour ${ev.dueCycle})`
                            : `Dans ${cyclesLeft} tour(s) · Tour ${ev.dueCycle}`}
                        </span>
                      </div>

                      <div className="font-medium leading-relaxed text-[#1f1224] dark:text-rose-50">
                        <RichEntityText text={ev.summary} interactive />
                      </div>

                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-rose-200/80 dark:bg-rose-900/60">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-emerald-500 transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-rose-200/80 bg-white/85 p-3.5 text-xs dark:border-rose-900/60 dark:bg-[#190d1f]">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
                <Building2 className="h-4 w-4" />
                <span>Chantiers actifs</span>
              </div>
              <p className="mt-1 text-rose-900/75 dark:text-rose-200/75">
                {world.districts.reduce((acc, d) => acc + d.modulesCount, 0)} extension(s) construites sur {world.districts.length} quartiers.
              </p>
            </div>
            <div className="rounded-xl border border-rose-200/80 bg-white/85 p-3.5 text-xs dark:border-rose-900/60 dark:bg-[#190d1f]">
              <div className="flex items-center gap-1.5 font-semibold exo-accent-text">
                <Shield className="h-4 w-4" />
                <span>Garnison &amp; Flotte</span>
              </div>
              <p className="mt-1 text-rose-900/75 dark:text-rose-200/75">
                {world.militaryRoster.reduce((acc, u) => acc + u.count, 0)} unité(s) ·{' '}
                {world.drones.construction + world.drones.defense + world.drones.attack + world.drones.recon} drones.
              </p>
            </div>
            <div className="rounded-xl border border-rose-200/80 bg-white/85 p-3.5 text-xs dark:border-rose-900/60 dark:bg-[#190d1f]">
              <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300">
                <Handshake className="h-4 w-4" />
                <span>Promesses &amp; Alliance</span>
              </div>
              <p className="mt-1 text-rose-900/75 dark:text-rose-200/75">
                {(world.promises ?? []).filter((p) => p.status === 'ACTIVE').length} promesse(s) active(s) · Confiance {world.superAllianceTrust}%.
              </p>
            </div>
          </div>
        </div>
      )}

      {subTab === 'DIPLOMACY' && <GeopoliticsTab />}

      <PaxScenarioMatrixModal
        open={scenarioModalOpen}
        onClose={() => setScenarioModalOpen(false)}
      />
    </div>
  );
}
