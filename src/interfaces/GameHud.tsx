import { useEffect, useMemo, useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  Activity,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  Compass,
  Cpu,
  Droplets,
  Eye,
  EyeOff,
  Globe2,
  Hammer,
  HelpCircle,
  Lock,
  Pause,
  Radio,
  Settings,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  Wheat,
  Wind,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { ExoTooltip } from '../components/bento/ExoTooltip.tsx';
import { HeaderDevDrawer } from '../components/hud/HeaderDevDrawer.tsx';
import { HeaderNotificationCenter } from '../components/hud/HeaderNotificationCenter.tsx';
import { HeaderWeatherSuperWidget } from '../components/hud/HeaderWeatherSuperWidget.tsx';
import { RichEntityText } from '../components/RichEntityText.tsx';
import type { ViewportOverlayMode } from '../contracts/render-bridge.schema.ts';
import { PLANETARY_SLOTS_CATALOG } from '../data/world.catalog.ts';
import { handleCommitEndOfTurn } from '../pipelines/game-actions.pipeline.ts';
import { useViewportLayout } from '../hooks/use-viewport-layout.ts';
import {
  FIP_STATIONS,
  fipRadioService,
  type FipStationId,
} from '../services/audio/fip-radio.service.ts';
import { useExoStore } from '../stores/game.store.ts';
import {
  activeDossierIdAtom,
  activeInvestigationDossierIdAtom,
  activeSubscreenAtom,
  dockCollapsedAtom,
  hudHiddenAtom,
  inspectedDossierIdsAtom,
  latestTurnEvents4TAtom,
  questUiMilestonesAtom,
  returnEventContextAtom,
  selectedTileAtom,
  tacticalHeatmapOpenAtom,
  toastNoticeAtom,
  turnEventsLoadingAtom,
  turnSummaryModalOpenAtom,
  tutorialOpenAtom,
  viewportOverlayModeAtom,
} from '../stores/selection.atoms.ts';
import {
  computeResourceForecast,
  type ResourceMetricItem,
} from '../systems/economy-urban/resource-forecast.ts';
import { evaluateTurnGateM7 } from '../systems/turn-orchestration/turn-gate-v4.ts';
import {
  formatAtmosphereStatusBadge,
  formatSeasonLabel,
  formatWeatherLabel,
} from '../utils/atmosphere-labels.ts';

/**
 * [L7] EXW.L7.GAME_HUD | v4.0.0-rc.1 | SADT A5.1
 * Grounded Tactical HUD over 3D Viewport (Strict Turn-Based V4):
 * - Header: Era/Stars/Fame + Tour/Season + 3D Scales + Karnaugh M7 "Fin de tour" + Guide + UI Toggle + 6-Stream FIP Radio + Profil + Paramètres + Pause
 * - Above-Footer Tactical Ribbon: Smart Guidance + Live Resource Flow Strip (+Δ/tour) + 3D Filter (Std / Maint. / Flux)
 * - Footer: STRICTLY 3 primary tabs ONLY (Monde · Événements · Journal)
 */
const PRIMARY_TABS = [
  { id: 'WORLDS_HUB' as const, label: 'Monde', icon: Globe2 },
  { id: 'EVENTS_HUB' as const, label: 'Événements', icon: Sparkles },
  { id: 'JOURNAL_HUB' as const, label: 'Journal', icon: BookOpen },
] as const;

const RESOURCE_ICONS: Record<ResourceMetricItem['id'], typeof Coins> = {
  credits: Coins,
  energy: Zap,
  materials: Hammer,
  water: Droplets,
  food: Wheat,
  compute: Cpu,
  breathingKits: Wind,
  electronics: Cpu,
};

const OVERLAY_OPTIONS: readonly {
  id: ViewportOverlayMode;
  label: string;
  short: string;
  formula: string;
  body: string;
  accent: 'cyan' | 'amber' | 'emerald' | 'coral';
}[] = [
  {
    id: 'STANDARD',
    label: 'Vue planétaire & urbaine naturelle',
    short: 'Réel',
    formula: 'Rendu PBR naturel · Océans & Quartiers côtiers',
    body: 'Affiche les continents, océans spéculaires, météo dynamique et quartiers ouverts sans surcouche technique.',
    accent: 'cyan',
  },
  {
    id: 'MAINTENANCE',
    label: "Carte d'usure, intégrité & maintenance 3D",
    short: 'Usure',
    formula: 'Vert ≥ 85 % · Ambre 60–84 % · Rouge < 60 %',
    body: 'Met en évidence l’intégrité structurelle de chaque quartier et signale les zones nécessitant réparation ou drones.',
    accent: 'amber',
  },
  {
    id: 'LOGISTICS',
    label: 'Carte des réseaux logistiques & énergie 3D',
    short: 'Flux',
    formula: 'Cyan Énergie/Flux · Or Traités · Émeraude Convois',
    body: 'Révèle les flux inter-quartiers, liaisons maritimes côtières et lignes logistiques orbitales en 3D.',
    accent: 'emerald',
  },
  {
    id: 'TACTICAL',
    label: 'Surcouche Tactique, Rivaux & Embargos 3D',
    short: 'Tactique 3D',
    formula: 'Bleu/Cyan Contrôlé · Rouge/Ambre Rivaux & Embargos',
    body: 'Projette les frontières territoriales, secteurs contestés, garnisons et arcs diplomatiques ou d’embargo.',
    accent: 'coral',
  },
  {
    id: 'BIOSPHERE',
    label: 'Carte Bioclimatique 5 Divisions & Océans',
    short: 'Biomes',
    formula: 'BioHealth 0–100 % · Hydro · Flore · Atmosphère',
    body: 'Visualise la vitalité écologique (BioHealth), l’humidité océanique et la progression atmosphérique P1→P4.',
    accent: 'emerald',
  },
];

export function GameHud() {
  const world = useExoStore((s) => s.world);
  const audio = useExoStore((s) => s.audio);
  const oracleEnabled = useExoStore((s) => s.oracleEnabled);
  const setPaused = useExoStore((s) => s.setPaused);
  const setScreen = useExoStore((s) => s.setScreen);
  const setActiveScale = useExoStore((s) => s.setActiveScale);
  const updateAudio = useExoStore((s) => s.updateAudio);
  const { isMobile } = useViewportLayout();

  const selectedTile = useAtomValue(selectedTileAtom);
  const [ribbonCollapsed, setRibbonCollapsed] = useAtom(dockCollapsedAtom);
  const [hudHidden, setHudHidden] = useAtom(hudHiddenAtom);
  const interfaceOpen = !hudHidden;
  const [inspectedResourceId, setInspectedResourceId] = useState<ResourceMetricItem['id'] | null>(null);
  const [committingTurn, setCommittingTurn] = useState(false);

  const toast = useAtomValue(toastNoticeAtom);
  const setToast = useSetAtom(toastNoticeAtom);
  const setActiveDossierId = useSetAtom(activeDossierIdAtom);
  const [subscreen, setSubscreen] = useAtom(activeSubscreenAtom);
  const [overlayMode, setOverlayMode] = useAtom(viewportOverlayModeAtom);
  const [tacticalHeatmapOpen, setTacticalHeatmapOpen] = useAtom(tacticalHeatmapOpenAtom);
  const [tutorialOpen, setTutorialOpen] = useAtom(tutorialOpenAtom);
  const [investigationDossierId, setInvestigationDossierId] = useAtom(activeInvestigationDossierIdAtom);
  const [inspectedDossierIds, setInspectedDossierIds] = useAtom(inspectedDossierIdsAtom);
  const [returnContext, setReturnContext] = useAtom(returnEventContextAtom);
  const setTurnSummaryOpen = useSetAtom(turnSummaryModalOpenAtom);
  const setLatestTurnEvents4T = useSetAtom(latestTurnEvents4TAtom);
  const setTurnEventsLoading = useSetAtom(turnEventsLoadingAtom);
  const setQuestUi = useSetAtom(questUiMilestonesAtom);

  const activeSlotSpec =
    PLANETARY_SLOTS_CATALOG.find((s) => s.slotIndex === world.activeSlotIndex) ??
    PLANETARY_SLOTS_CATALOG[0]!;
  const seasonLabel = formatSeasonLabel(world.season);
  const weatherLabel = formatWeatherLabel(world.weatherState);

  const forecast = useMemo(() => computeResourceForecast(world), [world]);
  const turnGate = useMemo(() => evaluateTurnGateM7(world), [world]);
  const atmoStatus = useMemo(
    () =>
      formatAtmosphereStatusBadge({
        atmosphereTier: world.atmosphereTier,
        atmosphereProgress: world.atmosphereProgress,
        weatherState: world.weatherState,
        biomeStabilityCycles: world.biomeStabilityCycles,
        hasEmergencyP0: world.activeDossiers.some((d) => d.dossierClass === 'P0'),
      }),
    [
      world.atmosphereTier,
      world.atmosphereProgress,
      world.weatherState,
      world.biomeStabilityCycles,
      world.activeDossiers,
    ],
  );
  const atmoToneClass =
    atmoStatus.tone === 'critical'
      ? 'text-rose-600 dark:text-rose-300'
      : atmoStatus.tone === 'warning'
        ? 'text-amber-600 dark:text-amber-300'
        : 'text-emerald-600 dark:text-emerald-300';
  const atmoAccent =
    atmoStatus.tone === 'critical'
      ? 'coral'
      : atmoStatus.tone === 'warning'
        ? 'amber'
        : 'emerald';
  const hudMetrics = forecast.metrics.slice(0, 7);
  const inspectedMetric = inspectedResourceId
    ? forecast.metrics.find((m) => m.id === inspectedResourceId) ?? null
    : null;
  const activeStation = (audio.stationId.replace(/^FIP_/, '').toUpperCase() || 'DIRECT') as FipStationId;

  const toggleInterface = () => {
    setHudHidden((hidden) => {
      if (!hidden) setInspectedResourceId(null);
      return !hidden;
    });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      const key = e.key.toLowerCase();
      if (key === '1' || key === '2' || key === '3') {
        const scale = Number(key) as 1 | 2 | 3;
        setActiveScale(scale);
        if (scale === 3) {
          setQuestUi((prev) => (prev.scale3Visited ? prev : { ...prev, scale3Visited: true }));
        }
        fipRadioService.playUiCue('CLICK');
      } else if (key === 'h') {
        setHudHidden((hidden) => {
          if (!hidden) setInspectedResourceId(null);
          return !hidden;
        });
      } else if (key === 'm') {
        updateAudio({ muted: !audio.muted });
      } else if (e.key === 'Escape') {
        if (subscreen !== 'NONE') {
          setSubscreen('NONE');
        } else if (inspectedResourceId) {
          setInspectedResourceId(null);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [audio.muted, inspectedResourceId, setActiveScale, setHudHidden, setQuestUi, setSubscreen, subscreen, updateAudio]);

  const onCommitEndOfTurn = async () => {
    if (committingTurn) return;
    if (!turnGate.allowed) {
      fipRadioService.playUiCue('ALERT_P0');
      setToast({ id: Date.now(), tone: 'warn', text: turnGate.reason });
      setSubscreen('EVENTS_HUB');
      return;
    }

    setCommittingTurn(true);
    if (oracleEnabled) setTurnEventsLoading(true);
    const [err] = await handleCommitEndOfTurn((liveRes) => {
      setLatestTurnEvents4T(liveRes);
      setTurnEventsLoading(false);
    });
    setCommittingTurn(false);

    if (err) {
      setTurnEventsLoading(false);
      setToast({ id: Date.now(), tone: 'error', text: err.message });
      return;
    }
    setTurnSummaryOpen(true);
  };

  const handleReturnFromInvestigation = () => {
    if (!investigationDossierId) return;
    if (!inspectedDossierIds.includes(investigationDossierId)) {
      setInspectedDossierIds([...inspectedDossierIds, investigationDossierId]);
    }
    const targetId = investigationDossierId;
    setInvestigationDossierId(null);
    setActiveDossierId(targetId);
    setToast({
      id: Date.now(),
      tone: 'success',
      text: 'Inspection 3D validée : données terrain confirmées dans le dossier.',
    });
  };

  const handleHintClick = () => {
    if (forecast.nextActionCategory === 'EMERGENCY' || forecast.nextActionCategory === 'DOSSIER') {
      const target =
        world.activeDossiers.find((d) => d.dossierClass === 'P0') ?? world.activeDossiers[0];
      if (target) {
        setActiveDossierId(target.id);
        return;
      }
      setSubscreen('EVENTS_HUB');
      return;
    }
    if (forecast.nextActionCategory === 'BUILD' || forecast.nextActionCategory === 'ATMO') {
      setSubscreen('WORLDS_HUB');
      return;
    }
    if (turnGate.allowed) {
      void onCommitEndOfTurn();
    } else {
      setSubscreen('EVENTS_HUB');
    }
  };

  if (hudHidden) {
    return (
      <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-end p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto flex justify-end">
          <button
            type="button"
            data-testid="restore-hud-btn"
            onClick={() => setHudHidden(false)}
            aria-label="Ouvrir l'interface"
            className="exo-bento-card inline-flex min-h-[44px] items-center gap-1.5 px-3.5 font-mono text-xs font-bold exo-accent-text shadow-lg"
          >
            <Eye className="h-4 w-4 exo-accent-text" />
            <span>Ouvrir l&apos;interface</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="game-hud-root"
      className={`pointer-events-none fixed inset-0 z-20 flex flex-col justify-between gap-2 ${
        isMobile ? 'p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]' : 'p-4'
      }`}
    >
      {/* Top Tactical Header — Era/Fame, Super-Widget Météo, Notifications, Scales, FIP Radio, Profile, Settings */}
      <header className="pointer-events-auto exo-bento-card exo-astral-ticks exo-hud-panel flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-2.5 py-1.5 sm:flex-nowrap sm:gap-2 sm:px-3.5 sm:py-2">
        {isMobile ? (
          <div className="flex min-w-0 w-full items-center justify-between gap-2 leading-tight font-mono-num">
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-1 text-[10px]">
                <span className="font-display font-bold tracking-wide exo-accent-2-text whitespace-nowrap">
                  ÈRE {world.era}/6 · {world.eraStars}★
                </span>
                <span aria-hidden="true" className="exo-muted-text opacity-50">·</span>
                <span className="font-medium whitespace-nowrap">
                  T{world.cycle}
                </span>
                <span aria-hidden="true" className="exo-muted-text opacity-50">·</span>
                <span className="font-semibold exo-accent-text whitespace-nowrap">
                  PA {world.pa.general}/{world.pa.generalCap}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span
                  data-testid="header-atmo-status-mobile"
                  className={`truncate font-semibold ${atmoToneClass}`}
                >
                  {atmoStatus.mobileLabel}
                </span>
              </div>
            </div>
            <HeaderWeatherSuperWidget />
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-x-1.5 overflow-hidden font-mono-num text-[11px]">
            <span className="font-display font-bold tracking-wide exo-accent-2-text whitespace-nowrap">
              ÈRE {world.era}/6 · {world.eraStars}★
            </span>
            <span aria-hidden="true" className="hidden exo-muted-text opacity-50 2xl:inline">·</span>
            <span className="hidden items-center gap-0.5 font-semibold exo-accent-2-text 2xl:inline-flex whitespace-nowrap">
              <Award className="h-3 w-3" />
              {world.hk?.fame ?? 0} Ren.
            </span>
            <span aria-hidden="true" className="exo-muted-text opacity-50">·</span>
            <span className="font-medium whitespace-nowrap">T{world.cycle}</span>
            <HeaderWeatherSuperWidget />
            <span aria-hidden="true" className="hidden exo-muted-text opacity-50 2xl:inline">·</span>
            <span className="hidden 2xl:inline">
              <ExoTooltip
                title={atmoStatus.tooltipTitle}
                formula={atmoStatus.tooltipFormula}
                body={atmoStatus.tooltipBody}
                accent={atmoAccent}
                align="left"
              >
                <span
                  data-testid="header-atmo-status-desktop"
                  className={`cursor-help font-semibold whitespace-nowrap ${atmoToneClass}`}
                >
                  {atmoStatus.desktopLabel}
                </span>
              </ExoTooltip>
            </span>
            <span aria-hidden="true" className="exo-muted-text opacity-50">·</span>
            <ExoTooltip
              title="PA Général & 4 Sous-PA Conseillers (R-26)"
              formula={`Général ${world.pa.general}/${world.pa.generalCap} · G:${world.pa.subPa.PA_GES} T:${world.pa.subPa.PA_MNT} C:${world.pa.subPa.PA_BIO} P:${world.pa.subPa.PA_POL}`}
              body="Fongibilité asymétrique : le PA Général peut compenser n’importe quel Sous-PA manquant (plafond 150 %), jamais l’inverse."
              accent="cyan"
            >
              <span className="cursor-help font-semibold exo-accent-text whitespace-nowrap">
                PA {world.pa.general}/{world.pa.generalCap}
              </span>
            </ExoTooltip>
            <span className="hidden text-[10.5px] exo-muted-text 2xl:inline whitespace-nowrap">
              ({world.pa.subPa.PA_GES}G · {world.pa.subPa.PA_MNT}T · {world.pa.subPa.PA_BIO}C · {world.pa.subPa.PA_POL}P)
            </span>
          </div>
        )}

        <div className="flex w-full shrink-0 items-center justify-between gap-1 sm:w-auto sm:justify-end sm:gap-1.5">
          {!isMobile && (
            <>
              {([1, 2, 3] as const).map((sc) => (
                <ExoTooltip
                  key={sc}
                  title={
                    sc === 1
                      ? 'Échelle 1 — Carte Spatiale & Slots (1→6)'
                      : sc === 2
                        ? 'Échelle 2 — Globe Planétaire (72 Tuiles)'
                        : 'Échelle 3 — Quartiers Urbains Ouverts'
                  }
                  formula="Transition fluide 650 ms · Touches 1 / 2 / 3"
                  body="Navigation multi-échelle Three.js r170+ à ciel ouvert sans dôme (R-15, R-16)."
                  accent="cyan"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveScale(sc);
                      if (sc === 3) {
                        setQuestUi((prev) => (prev.scale3Visited ? prev : { ...prev, scale3Visited: true }));
                      }
                    }}
                    className={`min-h-[36px] px-2 font-mono text-[11px] font-medium transition whitespace-nowrap ${
                      world.activeScale === sc ? 'exo-accent-chip-active' : 'exo-accent-chip'
                    }`}
                  >
                    {sc === 1 ? '1:Espace' : sc === 2 ? '2:Planète' : '3:Ville'}
                  </button>
                </ExoTooltip>
              ))}

              {/* Karnaugh M7 Turn Gate: Fin de tour */}
              <button
                type="button"
                data-testid="end-turn-btn"
                onClick={() => void onCommitEndOfTurn()}
                disabled={committingTurn}
                title={turnGate.reason}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 font-mono text-[11px] font-bold transition whitespace-nowrap ${
                  turnGate.allowed
                    ? 'border-emerald-500 bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-sm hover:from-emerald-500 hover:to-teal-400'
                    : 'border-amber-400/90 bg-amber-50/95 text-amber-950 hover:border-rose-400 dark:border-amber-600/80 dark:bg-amber-950/50 dark:text-amber-100'
                }`}
              >
                {turnGate.allowed ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" />
                )}
                <span>
                  {committingTurn
                    ? 'Validation…'
                    : turnGate.allowed
                      ? 'Fin de tour →'
                      : `Fin de tour (${world.activeDossiers.length})`}
                </span>
              </button>
            </>
          )}

          {/* Header: Centre de notifications + Studio Contexte 3D + Tutoriel + Masquer 100% */}
          <HeaderNotificationCenter />
          <HeaderDevDrawer />

          <button
            type="button"
            onClick={() => setTutorialOpen((v) => !v)}
            aria-label={tutorialOpen ? 'Fermer le guide' : 'Ouvrir le guide'}
            title="Guide interactif"
            className={`inline-flex h-8 w-8 items-center justify-center gap-1 text-xs font-semibold transition sm:h-9 sm:w-9 2xl:w-auto 2xl:px-2 whitespace-nowrap ${
              tutorialOpen ? 'exo-accent-chip-active' : 'exo-accent-chip'
            }`}
          >
            <HelpCircle className="h-4 w-4 exo-accent-text" />
            <span className="hidden 2xl:inline">Guide</span>
          </button>

          <button
            type="button"
            data-testid="hide-hud-btn"
            onClick={toggleInterface}
            aria-label="Fermer l'interface"
            title="Masquer 100% de l'interface (Touche H)"
            className="exo-accent-chip inline-flex h-8 w-8 items-center justify-center gap-1 text-xs font-semibold transition sm:h-9 sm:w-9 2xl:w-auto 2xl:px-2 whitespace-nowrap"
          >
            <EyeOff className="h-4 w-4 exo-accent-text" />
            <span className="hidden 2xl:inline">Masquer</span>
          </button>

          {/* Header: 6-Stream Radio France FIP Widget */}
          <div className="exo-accent-chip inline-flex items-center overflow-hidden">
            <button
              type="button"
              onClick={() => updateAudio({ muted: !audio.muted })}
              aria-label={audio.muted ? 'Activer la Radio FIP' : 'Couper la Radio FIP'}
              title={audio.muted ? 'Radio FIP coupée — cliquer pour écouter' : 'Radio FIP active — cliquer pour couper'}
              className={`inline-flex h-8 w-8 items-center justify-center gap-1 text-xs font-semibold transition sm:h-9 sm:w-9 2xl:w-auto 2xl:px-2 whitespace-nowrap ${
                !audio.muted ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-300' : ''
              }`}
            >
              {audio.muted ? (
                <VolumeX className="h-4 w-4 exo-muted-text" />
              ) : (
                <>
                  <Radio className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                  <Volume2 className="hidden h-3.5 w-3.5 text-emerald-500 sm:inline dark:text-emerald-400" />
                </>
              )}
            </button>
            {!isMobile && (
              <select
                aria-label="Sélectionner une station Radio France FIP"
                value={activeStation}
                onChange={(e) => {
                  const st = e.target.value as FipStationId;
                  updateAudio({ stationId: st, muted: false });
                  void fipRadioService.play(st);
                }}
                className="h-9 max-w-[96px] border-l exo-accent-border bg-transparent px-1.5 font-mono text-[10.5px] font-semibold text-[var(--exo-text)] focus:outline-none"
              >
                {FIP_STATIONS.map((st) => (
                  <option key={st.id} value={st.id} className="bg-[var(--exo-surface)] text-[var(--exo-text)]">
                    {st.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Header: Profil */}
          <button
            type="button"
            onClick={() => setSubscreen('PROFILE')}
            aria-label="Ouvrir le Profil"
            title="Profil Joueur"
            className={`inline-flex h-8 w-8 items-center justify-center gap-1 text-xs font-semibold transition sm:h-9 sm:w-9 2xl:w-auto 2xl:px-2 whitespace-nowrap ${
              subscreen === 'PROFILE' ? 'exo-accent-chip-active' : 'exo-accent-chip'
            }`}
          >
            <User className="h-4 w-4 exo-accent-text" />
            <span className="hidden 2xl:inline">Profil</span>
          </button>

          <button
            type="button"
            data-testid="hud-settings-btn"
            onClick={() => setScreen('EXO_SETTINGS')}
            aria-label="Ouvrir les Paramètres"
            className="exo-accent-chip inline-flex h-8 w-8 items-center justify-center sm:h-9 sm:w-9"
          >
            <Settings className="h-4 w-4 exo-accent-text" />
          </button>

          <button
            type="button"
            onClick={() => setPaused(true)}
            aria-label="Mettre en pause"
            className="exo-accent-chip inline-flex h-8 w-8 items-center justify-center sm:h-9 sm:w-9"
          >
            <Pause className="h-4 w-4 exo-accent-text" />
          </button>
        </div>
      </header>

      {/* Lightweight transient toast notice with semantic tone & entity tags */}
      {toast && (
        <div
          className={`pointer-events-none exo-bento-card mx-auto max-w-lg rounded-xl px-3.5 py-2 text-center font-mono text-xs font-medium shadow-lg ${
            toast.tone === 'success'
              ? 'border-emerald-400/90 text-emerald-950 dark:border-emerald-500/70 dark:text-emerald-100'
              : toast.tone === 'error'
                ? 'border-rose-500 text-rose-950 dark:border-rose-400 dark:text-rose-100'
                : toast.tone === 'warn'
                  ? 'border-amber-400/90 text-amber-950 dark:border-amber-500/70 dark:text-amber-100'
                  : 'border-[var(--exo-accent)] text-[#1f1224] dark:text-rose-100'
          }`}
        >
          <RichEntityText text={toast.text} interactive={false} />
        </div>
      )}

      {/* Bottom Stack: Above-Footer Tactical Resource Deck + STRICT 3-Tab Footer ONLY */}
      <div className="pointer-events-auto flex flex-col gap-1.5 sm:gap-2">
        {/* Quick Return to Event / Dossier after 3D Entity Focus */}
        {returnContext && (
          <div
            data-testid="return-to-event-banner"
            className="exo-bento-card flex flex-wrap items-center justify-between gap-2 rounded-xl border-cyan-400/75 bg-cyan-950/85 px-3 py-2 text-xs text-cyan-50 shadow-md"
          >
            <div className="flex min-w-0 items-center gap-2">
              <Compass className="h-4 w-4 shrink-0 text-cyan-300" />
              <span className="truncate font-medium">
                Focus 3D sur <strong className="text-cyan-200">{returnContext.entityLabel}</strong>
                {' · '}
                <span className="opacity-80">{returnContext.title}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                data-testid="return-to-event-btn"
                onClick={() => {
                  const ctx = returnContext;
                  setReturnContext(null);
                  setSubscreen(ctx.returnSubscreen === 'NONE' ? 'EVENTS_HUB' : ctx.returnSubscreen);
                  if (ctx.dossierId) {
                    setActiveDossierId(ctx.dossierId);
                  }
                }}
                className="min-h-[36px] rounded-lg bg-cyan-500 px-3 font-mono text-[11px] font-bold text-slate-950 shadow-xs hover:bg-cyan-400 whitespace-nowrap"
              >
                ← Retour à l&apos;événement
              </button>
              <button
                type="button"
                onClick={() => setReturnContext(null)}
                aria-label="Fermer la bannière de retour"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-900/50 text-cyan-100 hover:bg-cyan-800/70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Active 3D Inspection Banner */}
        {investigationDossierId && (
          <div className="exo-bento-card flex flex-wrap items-center justify-between gap-2 rounded-xl border-amber-400/80 bg-amber-50/95 px-3 py-2 text-xs shadow-md dark:border-amber-500/60 dark:bg-amber-950/85">
            <div className="flex items-center gap-2 font-medium text-amber-950 dark:text-amber-100">
              <Wrench className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
              <span>
                Inspection 3D active (Charge maintenance {forecast.maintenanceLoadPct}%) — Observez la zone puis validez votre relevé.
              </span>
            </div>
            <button
              type="button"
              onClick={handleReturnFromInvestigation}
              className="min-h-[36px] rounded-lg bg-rose-600 px-3 font-mono text-[11px] font-bold text-white shadow-sm hover:bg-rose-500 whitespace-nowrap"
            >
              Retour au dossier (Valider)
            </button>
          </div>
        )}

        {/* Inspectable Resource Mini-Card */}
        {inspectedMetric && (
          <div className="exo-bento-card flex flex-wrap items-center justify-between gap-2 rounded-xl border-rose-400/75 px-3.5 py-2.5 text-xs shadow-md">
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display font-bold text-[#1f1224] dark:text-rose-50">
                  {inspectedMetric.label} : {inspectedMetric.stock} {inspectedMetric.unit}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                    inspectedMetric.deltaPerCycle >= 0
                      ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-500/15 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {inspectedMetric.deltaPerCycle >= 0
                    ? `+${inspectedMetric.deltaPerCycle}`
                    : inspectedMetric.deltaPerCycle}
                  /tour
                </span>
              </div>
              <p className="text-[11px] text-rose-950/80 dark:text-rose-100/80">
                <strong>Source :</strong> {inspectedMetric.producerHint} · <strong>Usage :</strong> {inspectedMetric.usageHint}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setInspectedResourceId(null);
                  setSubscreen('WORLDS_HUB');
                }}
                className="min-h-[36px] rounded-lg border border-rose-300 bg-rose-50 px-2.5 font-mono text-[11px] font-semibold text-rose-800 hover:border-rose-500 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-100 whitespace-nowrap"
              >
                Gérer (Monde)
              </button>
              <button
                type="button"
                onClick={() => setInspectedResourceId(null)}
                aria-label="Fermer le détail ressource"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white/90 text-rose-900 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* JUSTE AU-DESSUS DU FOOTER — Bandeau Ressources, Conseil & Contrôles 3D */}
        <section
          aria-label="Bandeau ressources et contrôles 3D"
          className="exo-bento-card exo-hud-panel flex flex-col gap-1.5 px-2.5 py-2 sm:px-3"
        >
          {/* Row 1: Smart Guidance Hint + 3D View Mode + Mobile End Turn + Collapse Toggle */}
          <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <button
                type="button"
                onClick={handleHintClick}
                className={`inline-flex min-h-[30px] w-full items-center gap-1.5 px-2.5 py-1 text-left text-[11px] font-semibold transition md:w-auto md:max-w-full ${
                  forecast.nextActionCategory === 'EMERGENCY' ? 'exo-accent-chip-active' : 'exo-accent-chip'
                }`}
              >
                <Compass className="h-3.5 w-3.5 shrink-0 exo-accent-text" />
                <span className="truncate">{forecast.nextActionHint}</span>
              </button>

              {!isMobile && (
                <span className="exo-surface-sub hidden rounded-md px-2 py-1 font-mono-num text-[10.5px] font-medium exo-muted-text xl:inline-flex whitespace-nowrap">
                  {activeSlotSpec.name} · {weatherLabel} · Secteur #{selectedTile ?? 12} ({world.capturedTiles.length}/72)
                </span>
              )}
            </div>

            <div className="flex w-full shrink-0 items-center justify-between gap-1 md:w-auto md:justify-end">
              <div
                role="group"
                aria-label="Filtre visuel 3D"
                className="exo-surface-sub inline-flex flex-wrap items-center rounded-lg p-0.5"
              >
                {OVERLAY_OPTIONS.map((opt) => {
                  const active = overlayMode === opt.id;
                  return (
                    <ExoTooltip
                      key={opt.id}
                      title={opt.label}
                      formula={opt.formula}
                      body={opt.body}
                      accent={opt.accent}
                      position="top"
                    >
                      <button
                        type="button"
                        data-testid={`overlay-btn-${opt.id.toLowerCase()}`}
                        onClick={() => {
                          setOverlayMode(opt.id);
                          setQuestUi((prev) => (prev.filterSwitched ? prev : { ...prev, filterSwitched: true }));
                        }}
                        aria-label={opt.label}
                        className={`min-h-[30px] rounded-md px-2 font-mono text-[10.5px] font-semibold transition whitespace-nowrap ${
                          active
                            ? opt.id === 'MAINTENANCE'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : opt.id === 'LOGISTICS' || opt.id === 'BIOSPHERE'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : opt.id === 'TACTICAL'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'exo-accent-btn'
                            : 'exo-muted-text hover:text-[var(--exo-accent)]'
                        }`}
                      >
                        {opt.short}
                      </button>
                    </ExoTooltip>
                  );
                })}
                <ExoTooltip
                  title="Matrice Tactique L1–L5 × Zones Atmosphériques"
                  formula="5 Niveaux Unités × 5 Divisions · Touche T"
                  body="Ouvre la grille matricielle interactive des forces déployées, défenses orbitales et seuils atmosphériques."
                  accent="amber"
                  position="top"
                >
                  <button
                    type="button"
                    data-testid="toggle-tactical-heatmap-btn"
                    onClick={() => setTacticalHeatmapOpen((v) => !v)}
                    aria-label="Matrice Tactique L1–L5"
                    className={`min-h-[30px] rounded-md px-2 font-mono text-[10.5px] font-semibold transition whitespace-nowrap ${
                      tacticalHeatmapOpen
                        ? 'exo-accent-btn'
                        : 'exo-accent-text hover:opacity-80'
                    }`}
                  >
                    Matrice
                  </button>
                </ExoTooltip>
              </div>

              {isMobile && (
                <button
                  type="button"
                  data-testid="end-turn-btn-mobile"
                  onClick={() => void onCommitEndOfTurn()}
                  disabled={committingTurn}
                  className={`inline-flex min-h-[34px] items-center gap-1 rounded-lg border px-2.5 font-mono text-[11px] font-bold whitespace-nowrap ${
                    turnGate.allowed
                      ? 'border-emerald-500 bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-sm'
                      : 'border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-100'
                  }`}
                >
                  {turnGate.allowed ? <CheckCircle2 className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  <span>{turnGate.allowed ? 'Fin tour' : `(${world.activeDossiers.length})`}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setRibbonCollapsed((c) => !c)}
                aria-label={ribbonCollapsed ? 'Déplier la barre ressources' : 'Replier la barre ressources'}
                className="exo-accent-chip inline-flex min-h-[34px] items-center gap-1 px-2 font-mono text-[10.5px] font-medium whitespace-nowrap"
              >
                {ribbonCollapsed ? <ChevronUp className="h-3.5 w-3.5 exo-accent-text" /> : <ChevronDown className="h-3.5 w-3.5 exo-accent-text" />}
                <span>{ribbonCollapsed ? 'Ressources' : 'Réduire'}</span>
              </button>
            </div>
          </div>

          {!ribbonCollapsed && (
            <>
              {isMobile && (
                <div className="grid w-full grid-cols-3 gap-1">
                  {([1, 2, 3] as const).map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setActiveScale(sc)}
                      className={`min-h-[34px] px-1.5 font-mono text-[10.5px] font-semibold transition whitespace-nowrap ${
                        world.activeScale === sc ? 'exo-accent-chip-active' : 'exo-accent-chip'
                      }`}
                    >
                      {sc === 1 ? '1·Espace' : sc === 2 ? '2·Planète' : '3·Ville'}
                    </button>
                  ))}
                </div>
              )}

              {/* Live Resource & Flow Strip (+Δ/tour) + Maintenance Gauge */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {hudMetrics.map((metric) => {
                  const Icon = RESOURCE_ICONS[metric.id];
                  const selected = inspectedResourceId === metric.id;
                  const toneClass =
                    metric.tone === 'critical'
                      ? 'border-rose-500 bg-rose-500/15'
                      : metric.tone === 'warning'
                        ? 'border-amber-400/80 bg-amber-500/12'
                        : 'exo-accent-chip';

                  return (
                    <ExoTooltip
                      key={metric.id}
                      title={`${metric.label} (18 Ressources d’Ère)`}
                      formula={`Stock ${metric.stock} ${metric.unit} · Flux ${metric.deltaPerCycle >= 0 ? '+' : ''}${metric.deltaPerCycle}/tour (15 ticks)`}
                      body={`Source : ${metric.producerHint}. Usage : ${metric.usageHint}.`}
                      accent={metric.tone === 'critical' ? 'coral' : metric.tone === 'warning' ? 'amber' : 'cyan'}
                      position="top"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setInspectedResourceId((cur) => (cur === metric.id ? null : metric.id))
                        }
                        aria-label={`${metric.label} : ${metric.stock} (${metric.deltaPerCycle >= 0 ? '+' : ''}${metric.deltaPerCycle} par tour)`}
                        className={`inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1 font-mono-num text-[11px] transition whitespace-nowrap ${
                          selected ? 'ring-2 ring-[var(--exo-accent)]' : ''
                        } ${toneClass}`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 exo-accent-text" />
                        <span className="font-bold">
                          {metric.stock}
                        </span>
                        <span className="text-[10px] exo-muted-text">
                          {metric.shortLabel}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            metric.deltaPerCycle >= 0
                              ? 'text-emerald-500 dark:text-emerald-300'
                              : 'text-rose-500 dark:text-rose-300'
                          }`}
                        >
                          {metric.deltaPerCycle >= 0 ? `+${metric.deltaPerCycle}` : metric.deltaPerCycle}
                        </span>
                      </button>
                    </ExoTooltip>
                  );
                })}

                <button
                  type="button"
                  onClick={() =>
                    setOverlayMode((m) => (m === 'MAINTENANCE' ? 'STANDARD' : 'MAINTENANCE'))
                  }
                  title="Indice de maintenance & usure — cliquer pour basculer la vue maintenance 3D"
                  className={`inline-flex min-h-[34px] shrink-0 items-center gap-1 px-2 py-1 font-mono-num text-[11px] font-semibold transition whitespace-nowrap ${
                    overlayMode === 'MAINTENANCE' || forecast.maintenanceTone === 'critical'
                      ? 'exo-accent-chip-active'
                      : 'exo-accent-chip'
                  }`}
                >
                  <Activity className="h-3.5 w-3.5 exo-accent-2-text" />
                  <span>Maint. {forecast.maintenanceLoadPct}%</span>
                </button>
              </div>
            </>
          )}
        </section>

        {/* FOOTER — STRICTEMENT 3 ONGLETS UNIQUEMENT : Monde · Événements · Journal */}
        <footer className="exo-bento-card exo-astral-ticks exo-hud-panel p-1.5 sm:p-2">
          <nav
            aria-label="Navigation principale de campagne"
            className="grid w-full grid-cols-3 gap-1.5"
          >
            {PRIMARY_TABS.map((nav) => {
              const Icon = nav.icon;
              const active = subscreen === nav.id;
              const badgeCount =
                nav.id === 'EVENTS_HUB'
                  ? world.activeDossiers.length
                  : nav.id === 'JOURNAL_HUB'
                    ? world.chronicle.length
                    : world.unlockedSlots;
              const hasP0 =
                nav.id === 'EVENTS_HUB' &&
                world.activeDossiers.some((d) => d.dossierClass === 'P0');

              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => setSubscreen(active ? 'NONE' : nav.id)}
                  className={`inline-flex min-h-[46px] min-w-0 items-center justify-center gap-1 px-1.5 font-semibold transition sm:min-h-[48px] sm:gap-1.5 sm:px-3.5 ${
                    active ? 'exo-accent-chip-active shadow-sm' : 'exo-accent-chip'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 exo-accent-text sm:h-4 sm:w-4" />
                  <span className="text-[11px] sm:text-[13px] whitespace-nowrap">
                    {nav.label}
                  </span>
                  <span
                    className={`inline-flex shrink-0 items-center justify-center rounded-md px-1 py-0.5 font-mono text-[10px] font-bold sm:px-1.5 ${
                      hasP0
                        ? 'exo-accent-btn'
                        : 'bg-[var(--exo-accent-soft)] exo-accent-text'
                    }`}
                  >
                    {badgeCount}
                  </span>
                </button>
              );
            })}
          </nav>
        </footer>
      </div>
    </div>
  );
}
