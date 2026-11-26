import { useEffect, useState } from 'react';
import {
  Award,
  BookMarked,
  CloudDownload,
  Compass,
  FolderOpen,
  Monitor,
  Play,
  RotateCcw,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  UserCheck,
} from 'lucide-react';
import { useAtomValue, useSetAtom } from 'jotai';
import { ExoTitleEmblem } from '../components/ExoTitleEmblem.tsx';
import { ProfileAvatarFrame } from '../components/bento/ProfileAvatarFrame.tsx';
import { AVATAR_PRESETS } from '../data/honors.catalog.ts';
import { resolveWallpaperImageSrc } from '../data/ui-wallpapers.assets.ts';
import { useViewportLayout } from '../hooks/use-viewport-layout.ts';
import { loadCloudCampaign } from '../services/firebase/firebase-client.ts';
import { listLocalCampaigns } from '../services/saves/local-saves.service.ts';
import { useCloudAutoSaveStore } from '../stores/cloud-autosave.store.ts';
import { useExoStore } from '../stores/game.store.ts';
import { useMetaHonorsStore } from '../stores/meta-honors.store.ts';
import { activeSubscreenAtom, toastNoticeAtom } from '../stores/selection.atoms.ts';

/**
 * [L7] EXW.L7.MAIN_MENU | v4.1.0 | SADT A5.1
 * Atmospheric full-bleed title screen driven by active UI Theme Studio wallpaper,
 * vignette, and semantic system theme colors.
 */
export function MainMenuScreen() {
  const world = useExoStore((s) => s.world);
  const uiTheme = useExoStore((s) => s.uiTheme);
  const hasActiveCampaign = useExoStore((s) => s.hasActiveCampaign);
  const setScreen = useExoStore((s) => s.setScreen);
  const startNewCampaign = useExoStore((s) => s.startNewCampaign);
  const resumeCampaign = useExoStore((s) => s.resumeCampaign);
  const loadCampaignState = useExoStore((s) => s.loadCampaignState);
  const activeSubscreen = useAtomValue(activeSubscreenAtom);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
  const setToast = useSetAtom(toastNoticeAtom);
  const { isMobile, setLayoutMode } = useViewportLayout();
  const newerCloudCampaign = useCloudAutoSaveStore((s) => s.newerCloudCampaign);
  const [resumingCloud, setResumingCloud] = useState(false);

  const savedCount = listLocalCampaigns().length;
  const canResume = hasActiveCampaign || savedCount > 0 || world.cycle > 0;
  const wallpaperSrc = resolveWallpaperImageSrc(uiTheme.wallpaperId);
  const showcase = useMetaHonorsStore((s) => s.showcase);
  const avatarPreset =
    AVATAR_PRESETS.find((p) => p.id === showcase.avatarPresetId) ?? AVATAR_PRESETS[0]!;
  const equippedTitle =
    showcase.titles.find((t) => t.id === showcase.equippedTitleId) ?? showcase.titles[0]!;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (activeSubscreen !== 'NONE') return;
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startNewCampaign();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSubscreen, startNewCampaign]);

  const handleResume = () => {
    const resumed = resumeCampaign();
    if (!resumed) {
      setToast({ id: Date.now(), tone: 'info', text: 'Aucune partie en cours. Lancez une campagne.' });
    }
  };

  const handleResumeFromCloud = async () => {
    if (!newerCloudCampaign || resumingCloud) return;
    setResumingCloud(true);
    const [e, loaded] = await loadCloudCampaign(newerCloudCampaign.campaignId);
    setResumingCloud(false);
    if (e || !loaded) {
      setToast({ id: Date.now(), tone: 'error', text: e?.message ?? 'Échec de reprise Cloud.' });
      return;
    }
    loadCampaignState(loaded);
    setToast({
      id: Date.now(),
      tone: 'success',
      text: `Campagne Cloud reprise au Tour T${newerCloudCampaign.cycle}.`,
    });
  };

  const vignettePct = Math.round(uiTheme.vignetteStrength);

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto">
      {/* Dynamic Concept Art Wallpaper from UI Theme Studio */}
      {wallpaperSrc && (
        <img
          src={wallpaperSrc}
          alt=""
          aria-hidden="true"
          style={{ opacity: uiTheme.wallpaperOpacity / 100 }}
          className="pointer-events-none fixed inset-0 h-full w-full object-cover object-center transition-opacity duration-500"
        />
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background: `linear-gradient(100deg, var(--exo-void) 0%, color-mix(in srgb, var(--exo-void) ${Math.max(45, vignettePct)}%, transparent) 44%, color-mix(in srgb, var(--exo-void) ${Math.round(vignettePct * 0.45)}%, transparent) 75%, color-mix(in srgb, var(--exo-void) ${Math.round(vignettePct * 0.22)}%, transparent) 100%)`,
        }}
      />

      <div
        className={`relative z-10 flex min-h-full flex-col justify-between ${
          isMobile ? 'p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]' : 'p-10'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            data-testid="lobby-showcase-card"
            onClick={() => setSubscreen('PROFILE')}
            className="exo-bento-card inline-flex min-h-[44px] items-center gap-2.5 px-3 py-1.5 text-left transition hover:border-[var(--exo-accent)]"
          >
            <ProfileAvatarFrame
              preset={avatarPreset}
              customDataUrl={showcase.customAvatarDataUrl}
              alt={`Portrait de ${showcase.callsign}`}
              className="h-10 w-10 rounded-xl border border-white/40 shadow-sm"
              monogramClassName="text-xs"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1 font-display text-xs font-bold">
                <span>{showcase.callsign}</span>
                <Award className="h-3.5 w-3.5 exo-accent-2-text" />
              </div>
              <div className="font-mono text-[10px] tabular-nums exo-muted-text truncate">
                {equippedTitle.label} · {showcase.medals.filter((m) => m.unlocked).length}/{showcase.medals.length} succès
              </div>
            </div>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSubscreen('BLUEPRINT_ATLAS')}
              className="exo-bento-card inline-flex min-h-[40px] items-center gap-1.5 px-3 text-xs font-semibold transition whitespace-nowrap"
            >
              <Compass className="h-3.5 w-3.5 exo-accent-text" />
              <span>Atlas Blueprint</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode(isMobile ? 'DESKTOP' : 'MOBILE')}
              className="exo-bento-card inline-flex min-h-[40px] items-center gap-1.5 px-3 text-xs font-semibold transition whitespace-nowrap"
            >
              {isMobile ? (
                <Monitor className="h-3.5 w-3.5 exo-accent-text" />
              ) : (
                <Smartphone className="h-3.5 w-3.5 exo-accent-text" />
              )}
              <span>{isMobile ? 'Mode Ordinateur' : 'Mode Mobile'}</span>
            </button>
          </div>
        </div>

        <div
          className={`space-y-5 ${
            isMobile ? 'mx-auto my-auto w-full max-w-md py-4' : 'max-w-xl my-auto'
          }`}
        >
          <ExoTitleEmblem />

          <p className="max-w-md text-base font-medium leading-relaxed text-[var(--exo-text)] opacity-90 sm:text-lg">
            Gouvernez la première exo-civilisation solaire de 2050, tour après tour.
          </p>

          {/* Primary Actions */}
          <div className={`flex flex-wrap items-center gap-2.5 ${isMobile ? 'flex-col items-stretch' : 'gap-3'}`}>
            {newerCloudCampaign && (
              <button
                type="button"
                data-testid="main-menu-resume-cloud-btn"
                disabled={resumingCloud}
                onClick={() => void handleResumeFromCloud()}
                className="inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl border border-emerald-400/80 bg-emerald-600/90 px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-emerald-500 disabled:opacity-60 whitespace-nowrap"
              >
                <CloudDownload className="h-4 w-4" />
                <span>
                  {resumingCloud ? 'Reprise Cloud…' : `Reprendre du Cloud (T${newerCloudCampaign.cycle})`}
                </span>
              </button>
            )}

            {canResume && (
              <button
                type="button"
                onClick={handleResume}
                className="exo-accent-chip inline-flex min-h-[48px] items-center justify-center gap-2.5 px-5 py-3 font-display text-sm font-bold uppercase tracking-wider shadow-md transition active:scale-[0.99] whitespace-nowrap"
              >
                <RotateCcw className="h-4 w-4 exo-accent-text" />
                <span>Reprendre la partie</span>
              </button>
            )}

            <button
              type="button"
              data-start="true"
              onClick={startNewCampaign}
              className="exo-accent-btn inline-flex min-h-[50px] items-center justify-center gap-2.5 px-6 py-3 font-display text-sm font-bold uppercase tracking-wider transition active:scale-[0.99] whitespace-nowrap"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Lancer la Campagne</span>
            </button>

            <button
              type="button"
              onClick={() => setScreen('EXO_NEW_SIMULATION')}
              className="exo-bento-card inline-flex min-h-[46px] items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition whitespace-nowrap"
            >
              <SlidersHorizontal className="h-4 w-4 exo-accent-2-text" />
              <span>Configurer (2050 &amp; Co-pilote IA)</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setSubscreen('JOURNAL_HUB')}
              className="exo-bento-card inline-flex min-h-[42px] items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium transition whitespace-nowrap"
            >
              <FolderOpen className="h-3.5 w-3.5 exo-accent-text" />
              <span>Charger</span>
            </button>
            <button
              type="button"
              data-testid="main-menu-settings-btn"
              onClick={() => setScreen('EXO_SETTINGS')}
              className="exo-bento-card inline-flex min-h-[42px] items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium transition whitespace-nowrap"
            >
              <Settings className="h-3.5 w-3.5 exo-accent-text" />
              <span>Paramètres</span>
            </button>
            <button
              type="button"
              data-testid="main-menu-docs-skills-btn"
              onClick={() => setSubscreen('DOCS_SKILLS_HUB')}
              className="exo-bento-card inline-flex min-h-[44px] items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold transition whitespace-nowrap"
            >
              <BookMarked className="h-3.5 w-3.5 exo-accent-2-text" />
              <span>Docs, VCS &amp; Skills</span>
            </button>
            <button
              type="button"
              data-testid="main-menu-governance-btn"
              onClick={() => setSubscreen('DOC_SYNC_STUDIO')}
              className="exo-bento-card inline-flex min-h-[44px] items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium transition whitespace-nowrap"
            >
              <ShieldCheck className="h-3.5 w-3.5 exo-accent-text" />
              <span>Gouvernance &amp; Docs</span>
            </button>
            <button
              type="button"
              onClick={() => setScreen('EXO_AUTH')}
              className="exo-bento-card inline-flex min-h-[44px] items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium transition whitespace-nowrap"
            >
              <UserCheck className="h-3.5 w-3.5 exo-accent-2-text" />
              <span>Compte</span>
            </button>
          </div>
        </div>

        <div aria-hidden="true" />
      </div>
    </div>
  );
}
