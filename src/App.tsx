import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider as JotaiProvider, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { AnnoQuestTracker } from './components/AnnoQuestTracker.tsx';
import { CampaignTutorialOverlay, TUTORIAL_STORAGE_KEY } from './components/CampaignTutorialOverlay.tsx';
import { DynamicSvgBackdrop } from './components/DynamicSvgBackdrop.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { ColonistDetailModal } from './components/world/ColonistDetailModal.tsx';
import { EraSpecializationModal } from './components/world/EraSpecializationModal.tsx';
import { TacticalHeatmap } from './components/world/TacticalHeatmap.tsx';
import { useCloudAutoSave } from './hooks/use-cloud-autosave.ts';
import { useCycleClock } from './hooks/use-cycle-clock.ts';
import { useFipAudio } from './hooks/use-fip-audio.ts';
import { useThemeEngine } from './hooks/use-theme-engine.ts';
import { useUserContext } from './hooks/use-user-context.ts';
import { AuthScreen } from './interfaces/AuthScreen.tsx';
import { BriefingLobbyScreen } from './interfaces/BriefingLobbyScreen.tsx';
import { EntityWindowModal } from './interfaces/EntityWindowModal.tsx';
import { GameHud } from './interfaces/GameHud.tsx';
import { GameViewport } from './interfaces/GameViewport.tsx';
import { GeneseAct0Modal } from './interfaces/GeneseAct0Modal.tsx';
import { Isolated3DViewerModal } from './interfaces/Isolated3DViewerModal.tsx';
import { MainMenuScreen } from './interfaces/MainMenuScreen.tsx';
import { NewSimulationScreen } from './interfaces/NewSimulationScreen.tsx';
import { OutcomeModal } from './interfaces/OutcomeModal.tsx';
import { SettingsScreen } from './interfaces/SettingsScreen.tsx';
import { SubscreensOverlay } from './interfaces/SubscreensOverlay.tsx';
import { TurnSummaryHkModal } from './interfaces/TurnSummaryHkModal.tsx';
import { testFirestoreConnection } from './services/firebase/firebase-client.ts';
import { useExoStore } from './stores/game.store.ts';
import {
  activeDossierIdAtom,
  activeSubscreenAtom,
  eraAdvanceModalOpenAtom,
  inspectedColonistIdAtom,
  inspectedEntityAtom,
  showQueryDevtoolsAtom,
  tacticalHeatmapOpenAtom,
  toastNoticeAtom,
  tutorialOpenAtom,
} from './stores/selection.atoms.ts';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function ExoShellRoot() {
  const screen = useExoStore((s) => s.screen);
  const paused = useExoStore((s) => s.paused);
  const world = useExoStore((s) => s.world);
  const graphics = useExoStore((s) => s.graphics);
  const startNewCampaign = useExoStore((s) => s.startNewCampaign);
  const setPaused = useExoStore((s) => s.setPaused);
  const setActiveScale = useExoStore((s) => s.setActiveScale);

  const [toast, setToast] = useAtom(toastNoticeAtom);
  const setTutorialOpen = useSetAtom(tutorialOpenAtom);
  const [subscreen, setSubscreen] = useAtom(activeSubscreenAtom);
  const [activeDossierId, setActiveDossierId] = useAtom(activeDossierIdAtom);
  const [inspectedEntity, setInspectedEntity] = useAtom(inspectedEntityAtom);
  const [inspectedColonistId, setInspectedColonistId] = useAtom(inspectedColonistIdAtom);
  const [tacticalHeatmapOpen, setTacticalHeatmapOpen] = useAtom(tacticalHeatmapOpenAtom);
  const [eraModalOpen, setEraModalOpen] = useAtom(eraAdvanceModalOpenAtom);

  useCloudAutoSave();
  useCycleClock();
  useFipAudio();
  useThemeEngine();
  useUserContext();

  // Verify Firestore connection on mount + honor ?autostart=1 for automated checks
  useEffect(() => {
    void testFirestoreConnection();
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startNewCampaign();
      if (params.get('tutorial') === '1') {
        setTutorialOpen(true);
      }
    } else {
      document.body.dataset.state = 'title';
    }
  }, [startNewCampaign, setTutorialOpen]);

  // Auto-open interactive tutorial once on first real player campaign start (after Act 0)
  useEffect(() => {
    if (screen !== 'EXO_GAME_SCREEN') return;
    if (world.genese && !world.genese.act0Completed) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && params.get('tutorial') !== '1') return;
    try {
      if (!window.localStorage.getItem(TUTORIAL_STORAGE_KEY)) {
        setTutorialOpen(true);
      }
    } catch {
      // ignore storage errors
    }
  }, [screen, world.genese, setTutorialOpen]);

  // Auto-dismiss transient HUD notices after 4s
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast, setToast]);

  // Keyboard shortcuts (Enter/Space on title, Esc/P pause, H dock, 1/2/3 camera scales)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if (screen === 'EXO_MAIN_MENU' && (e.key === 'Enter' || e.key === ' ')) {
        if (subscreen !== 'NONE') return;
        e.preventDefault();
        startNewCampaign();
        return;
      }
      if (e.key === 'Escape') {
        if (eraModalOpen) {
          setEraModalOpen(false);
          return;
        }
        if (inspectedColonistId) {
          setInspectedColonistId(null);
          return;
        }
        if (activeDossierId) {
          setActiveDossierId(null);
          return;
        }
        if (inspectedEntity) {
          setInspectedEntity(null);
          return;
        }
        if (tacticalHeatmapOpen) {
          setTacticalHeatmapOpen(false);
          return;
        }
        if (subscreen !== 'NONE') {
          setSubscreen('NONE');
          return;
        }
        if (screen === 'EXO_GAME_SCREEN') {
          setPaused(!paused);
        }
        return;
      }
      if (screen !== 'EXO_GAME_SCREEN') return;
      if (e.key === 'p' || e.key === 'P') setPaused(!paused);
      if (e.key === 't' || e.key === 'T') setTacticalHeatmapOpen((v) => !v);
      if (e.key === '1') setActiveScale(1);
      if (e.key === '2') setActiveScale(2);
      if (e.key === '3') setActiveScale(3);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeDossierId,
    eraModalOpen,
    inspectedColonistId,
    inspectedEntity,
    paused,
    screen,
    setActiveDossierId,
    setActiveScale,
    setEraModalOpen,
    setInspectedColonistId,
    setInspectedEntity,
    setPaused,
    setSubscreen,
    setTacticalHeatmapOpen,
    startNewCampaign,
    subscreen,
    tacticalHeatmapOpen,
  ]);

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden overscroll-none bg-[var(--exo-void)] text-[var(--exo-text)]">
      <DynamicSvgBackdrop tier={world.atmosphereTier} enabled={graphics.dynamicSvgBackdrop} />
      <GameViewport />

      {screen === 'EXO_MAIN_MENU' && <MainMenuScreen />}
      {screen === 'EXO_AUTH' && <AuthScreen />}
      {screen === 'EXO_NEW_SIMULATION' && <NewSimulationScreen />}
      {screen === 'EXO_BRIEFING_LOBBY' && <BriefingLobbyScreen />}
      {screen === 'EXO_SETTINGS' && <SettingsScreen />}

      {screen === 'EXO_GAME_SCREEN' && (
        <>
          <GameHud />
          <AnnoQuestTracker />
          <TacticalHeatmap />
          <EntityWindowModal />
          <GeneseAct0Modal />
          <TurnSummaryHkModal />
          <EraSpecializationModal />
          <Isolated3DViewerModal />
          <CampaignTutorialOverlay />
          <OutcomeModal />
        </>
      )}

      <SubscreensOverlay />
      <ColonistDetailModal />
      <QueryDevtoolsGate />
    </main>
  );
}

function QueryDevtoolsGate() {
  const show = useAtomValue(showQueryDevtoolsAtom);
  if (!show) return null;
  return <ReactQueryDevtools initialIsOpen={true} buttonPosition="bottom-left" />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <JotaiProvider>
          <ExoShellRoot />
        </JotaiProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
