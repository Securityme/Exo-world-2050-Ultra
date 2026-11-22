import { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  ChevronDown,
  ChevronRight,
  Cloud,
  Download,
  FolderUp,
  Palmtree,
  Sliders,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';
import { useUserContext } from '../../hooks/use-user-context.ts';
import { useExoStore } from '../../stores/game.store.ts';
import { showQueryDevtoolsAtom, toastNoticeAtom } from '../../stores/selection.atoms.ts';
import { detectWebkitEnvironment } from '../../utils/safari-webkit.ts';

/**
 * [L7] EXW.L7.HEADER_DEV_DRAWER | v5.0.0 | SADT A5.1
 * Palmtree Studio/Dev Drawer in HUD Header:
 * - Remembered accordions (shellUxHabits)
 * - Live Opacity / Saturation / Glow / Font sliders
 * - 3D User Context inspector + Local (.json/.md) & Google Drive export
 * - Instant Climate/Disaster visual trigger helpers for testing
 */
export function HeaderDevDrawer() {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const world = useExoStore((s) => s.world);
  const uiTheme = useExoStore((s) => s.uiTheme);
  const setWorld = useExoStore((s) => s.setWorld);
  const updateUiTheme = useExoStore((s) => s.updateUiTheme);
  const setScreen = useExoStore((s) => s.setScreen);
  const setToast = useSetAtom(toastNoticeAtom);
  const [showQueryDevtools, setShowQueryDevtools] = useAtom(showQueryDevtoolsAtom);

  const {
    context,
    cloudSynced,
    isAccordionOpen,
    toggleAccordion,
    syncToCloud,
    downloadContextFile,
    exportContextToDrive,
  } = useUserContext();

  const webkitEnv = detectWebkitEnvironment();

  const handleCloudSync = async () => {
    setExporting(true);
    const [err] = await syncToCloud();
    setExporting(false);
    setToast({
      id: Date.now(),
      tone: err ? 'warn' : 'success',
      text: err ? err.message : 'Contexte Utilisateur 3D synchronisé vers Firestore.',
    });
  };

  const handleDriveExport = async (format: 'json' | 'md') => {
    setExporting(true);
    const [err, res] = await exportContextToDrive(format);
    setExporting(false);
    setToast({
      id: Date.now(),
      tone: err ? 'warn' : 'success',
      text: err
        ? err.message
        : `Contexte exporté sur Google Drive (${res?.fileId.slice(0, 10) ?? 'OK'}).`,
    });
  };

  const cycleTestWeather = (weatherState: typeof world.weatherState) => {
    setWorld({ ...world, weatherState });
    setToast({
      id: Date.now(),
      tone: 'info',
      text: `Météo de test appliquée : ${weatherState}.`,
    });
  };

  const themeAccOpen = isAccordionOpen('dev.theme', true);
  const safariAccOpen = isAccordionOpen('dev.safari', true);
  const ctxAccOpen = isAccordionOpen('dev.context', false);

  return (
    <div className="relative">
      <button
        type="button"
        data-testid="header-dev-drawer-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Ouvrir le tiroir Studio & Contexte"
        aria-expanded={open}
        title="Studio & Contexte 3D (Opacité, Safari, Export IA)"
        className={`inline-flex h-8 w-8 items-center justify-center gap-1 text-xs font-semibold transition sm:h-9 sm:w-9 2xl:w-auto 2xl:px-2 whitespace-nowrap ${
          open ? 'exo-accent-chip-active' : 'exo-accent-chip'
        }`}
      >
        <Palmtree className="h-4 w-4 exo-accent-text" />
        <span className="hidden 2xl:inline">Studio</span>
      </button>

      {open && (
        <div
          data-testid="header-dev-drawer-panel"
          className="exo-bento-card absolute right-0 top-11 z-40 max-h-[78dvh] w-[min(92vw,390px)] overflow-y-auto p-3 text-xs shadow-2xl"
        >
          <div className="mb-2 flex items-center justify-between border-b pb-2 exo-accent-border">
            <div className="flex items-center gap-1.5 font-display font-bold exo-accent-text">
              <Palmtree className="h-4 w-4" />
              <span>Studio UX · Contexte 3D</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le tiroir Studio"
              className="exo-accent-chip inline-flex h-7 w-7 items-center justify-center"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {/* Accordion 1: Live Appearance */}
            <div className="exo-surface-sub rounded-lg p-2">
              <button
                type="button"
                onClick={() => toggleAccordion('dev.theme', true)}
                aria-expanded={themeAccOpen}
                className="flex w-full items-center justify-between font-semibold"
              >
                <span className="flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 exo-accent-text" />
                  Thème &amp; Visibilité Temps Réel
                </span>
                {themeAccOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
              {themeAccOpen && (
                <div className="mt-2 space-y-2">
                  <label className="block">
                    <div className="flex justify-between text-[11px]">
                      <span>Opacité HUD</span>
                      <span className="font-mono-num exo-accent-text">{uiTheme.hudOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={100}
                      value={uiTheme.hudOpacity}
                      onChange={(e) => updateUiTheme({ hudOpacity: Number(e.target.value) })}
                      className="exo-range w-full"
                    />
                  </label>
                  <label className="block">
                    <div className="flex justify-between text-[11px]">
                      <span>Saturation</span>
                      <span className="font-mono-num exo-accent-text">{uiTheme.saturationPct ?? 100}%</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={150}
                      value={uiTheme.saturationPct ?? 100}
                      onChange={(e) => updateUiTheme({ saturationPct: Number(e.target.value) })}
                      className="exo-range w-full"
                    />
                  </label>
                  <label className="block">
                    <div className="flex justify-between text-[11px]">
                      <span>Échelle Texte</span>
                      <span className="font-mono-num exo-accent-text">{uiTheme.fontScalePct ?? 100}%</span>
                    </div>
                    <input
                      type="range"
                      min={85}
                      max={135}
                      step={5}
                      value={uiTheme.fontScalePct ?? 100}
                      onChange={(e) => updateUiTheme({ fontScalePct: Number(e.target.value) })}
                      className="exo-range w-full"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setScreen('EXO_SETTINGS');
                    }}
                    className="exo-accent-chip w-full py-1.5 font-mono text-[11px] font-semibold"
                  >
                    Ouvrir Studio Thèmes complet →
                  </button>
                </div>
              )}
            </div>

            {/* Accordion 2: Safari & Climate Probe */}
            <div className="exo-surface-sub rounded-lg p-2">
              <button
                type="button"
                onClick={() => toggleAccordion('dev.safari', true)}
                aria-expanded={safariAccOpen}
                className="flex w-full items-center justify-between font-semibold"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 exo-accent-2-text" />
                  Safari / Test Climat 3D
                </span>
                {safariAccOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
              {safariAccOpen && (
                <div className="mt-2 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="exo-muted-text">
                      {webkitEnv.isSafariEngine ? 'WebKit Safari' : 'Chromium/Desktop'} ·{' '}
                      {webkitEnv.isAiStudioIframe ? 'Iframe Preview' : 'Autonome'}
                    </span>
                    <label className="flex items-center gap-1.5">
                      <span>Synchro OS</span>
                      <input
                        type="checkbox"
                        checked={uiTheme.safariTextSync ?? true}
                        onChange={(e) => updateUiTheme({ safariTextSync: e.target.checked })}
                        className="h-3.5 w-3.5"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['CLEAR', 'SOLAR_FLARE', 'RAIN'] as const).map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => cycleTestWeather(w)}
                        className={`px-1.5 py-1 font-mono text-[10px] font-semibold ${
                          world.weatherState === w ? 'exo-accent-chip-active' : 'exo-accent-chip'
                        }`}
                      >
                        {w === 'CLEAR' ? 'Clair' : w === 'SOLAR_FLARE' ? 'Éruption' : 'Pluie'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 3: 3D User Context Inspector & AI Context Export */}
            <div className="exo-surface-sub rounded-lg p-2">
              <button
                type="button"
                onClick={() => toggleAccordion('dev.context', false)}
                aria-expanded={ctxAccOpen}
                className="flex w-full items-center justify-between font-semibold"
              >
                <span className="flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 exo-accent-text" />
                  Contexte 3D &amp; Export IA
                </span>
                {ctxAccOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
              {ctxAccOpen && (
                <div className="mt-2 space-y-2 text-[11px]">
                  <div className="rounded border exo-accent-border p-1.5 font-mono text-[10px]">
                    <div>1. shellUxHabits : {Object.keys(context.shellUxHabits.accordionStates).length} accordéons</div>
                    <div>2. displayProfile : {context.displaySettingsProfile.presetId} ({context.displaySettingsProfile.hudOpacity}%)</div>
                    <div>
                      3. traceability : {context.simulationTraceabilityProfile.traceabilityMatrix.length} lignes ·{' '}
                      {context.simulationTraceabilityProfile.eventLogs.length} logs
                    </div>
                    <div className="exo-muted-text">
                      Firestore : {cloudSynced ? 'Synchronisé' : 'Local prêt'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => downloadContextFile('json')}
                      className="exo-accent-chip inline-flex items-center justify-center gap-1 py-1.5 font-mono text-[10px] font-semibold"
                    >
                      <Download className="h-3 w-3" />
                      Local .JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadContextFile('md')}
                      className="exo-accent-chip inline-flex items-center justify-center gap-1 py-1.5 font-mono text-[10px] font-semibold"
                    >
                      <Download className="h-3 w-3" />
                      Local .MD
                    </button>
                    <button
                      type="button"
                      disabled={exporting}
                      onClick={() => void handleCloudSync()}
                      className="exo-accent-chip inline-flex items-center justify-center gap-1 py-1.5 font-mono text-[10px] font-semibold"
                    >
                      <Cloud className="h-3 w-3" />
                      Sync Cloud
                    </button>
                    <button
                      type="button"
                      disabled={exporting}
                      onClick={() => void handleDriveExport('md')}
                      className="exo-accent-chip inline-flex items-center justify-center gap-1 py-1.5 font-mono text-[10px] font-semibold"
                    >
                      <FolderUp className="h-3 w-3" />
                      Export Drive
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQueryDevtools((v) => !v)}
                    className={`w-full py-1.5 font-mono text-[10px] font-semibold ${
                      showQueryDevtools ? 'exo-accent-chip-active' : 'exo-accent-chip'
                    }`}
                  >
                    {showQueryDevtools
                      ? 'Masquer Inspecteur TanStack Query'
                      : 'Ouvrir Inspecteur TanStack Query'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
