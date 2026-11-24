import { useState } from 'react';
import { useSetAtom } from 'jotai';
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  Building2,
  Compass,
  Cpu,
  Gamepad2,
  Globe,
  History,
  ListChecks,
  Maximize2,
  Minimize2,
  Monitor,
  Palette,
  Radio,
  Shield,
  Smartphone,
  Sparkles,
  Swords,
  Volume2,
  Wind,
} from 'lucide-react';
import { ThemeStudioPanel } from '../components/ThemeStudioPanel.tsx';
import { AppPathAtlasPanel } from '../components/world/AppPathAtlasPanel.tsx';
import { DocStudioPanel } from './subscreens/DocStudioPanel.tsx';
import { useViewportLayout } from '../hooks/use-viewport-layout.ts';
import { FIP_STATIONS } from '../services/audio/fip-radio.service.ts';
import { useExoStore } from '../stores/game.store.ts';
import { activeSubscreenAtom } from '../stores/selection.atoms.ts';

type SettingsTabId = '3D' | 'AUDIO' | 'ORACLE' | 'THEME' | 'CONTROLS' | 'FEATURES' | 'ATLAS' | 'DOCS_ATLAS';

const APP_FEATURES = [
  {
    icon: Globe,
    title: 'Exploration Spatiale à 3 Échelles',
    description:
      'Navigation fluide entre la vue orbitale des 6 mondes, le globe géodésique à 72 secteurs et vos cités à ciel ouvert.',
    tag: 'Vue 3D',
  },
  {
    icon: ListChecks,
    title: 'Dossiers Exécutifs & Points d’Action',
    description:
      'Arbitrez crises urgentes et décrets stratégiques avec vos conseillers, raffinement de décisions et budget d’action asymétrique.',
    tag: 'Commandement',
  },
  {
    icon: Wind,
    title: 'Terraformation & Biosphère (Hostile → Éden)',
    description:
      'Transformez progressivement l’atmosphère et la météo planétaire, surveillez l’intégrité des quartiers et le moral des colons.',
    tag: 'Écologie',
  },
  {
    icon: Building2,
    title: 'Urbanisme Modulaire & Banque Fédérale',
    description:
      'Greffez jusqu’à 3 extensions par quartier urbain, contractez des prêts fédéraux et négociez sur le marché des ressources.',
    tag: 'Économie',
  },
  {
    icon: Swords,
    title: 'Forces Armées, Drones & Cyberguerre',
    description:
      'Recrutez 5 classes d’unités, réaffectez vos drones autonomes, paralysez les rivaux et menez des assauts tactiques en 4 phases.',
    tag: 'Défense',
  },
  {
    icon: Shield,
    title: 'Super-Alliance & 5 Rivalités Autonomes',
    description:
      'Mesurez votre influence dans le classement mondial, appliquez les directives fédérales et anticipez les manœuvres adverses.',
    tag: 'Diplomatie',
  },
  {
    icon: Sparkles,
    title: 'Générateur d’Événements Contextuels',
    description:
      'Dépêches narratives dynamiques adaptées à votre situation planétaire, avec repli local instantané et équilibrage garanti.',
    tag: 'Narration',
  },
  {
    icon: History,
    title: 'Chronique Filtrable & Sauvegardes Hybrides',
    description:
      'Consultez l’historique complet de votre civilisation, reprenez instantanément en local ou synchronisez votre campagne dans le Cloud.',
    tag: 'Archives',
  },
  {
    icon: BookOpen,
    title: 'Studio Documentaire, Catalogues & Atlas',
    description:
      'Consultez les documents du projet, les catalogues de découvertes, les cartes et actigrammes interactifs, et synchronisez Google Drive/Docs.',
    tag: 'Documentation',
  },
  {
    icon: Radio,
    title: 'Web Radio FIP, Thème Astralis & Ergonomie Mobile',
    description:
      'Ambiance musicale muette par défaut, interface optimisée mobile avec bascule vers Mode Ordinateur et thème Rose & Blanc Astralis.',
    tag: 'Confort',
  },
] as const;

/**
 * [L7] Settings Screen (3D, Audio/Radio, Advisor, Theme, Layout Mode, Controls, Features List, Documentary Studio & Atlas).
 */
export function SettingsScreen() {
  const [tab, setTab] = useState<SettingsTabId>('THEME');
  const [fullscreen, setFullscreen] = useState(false);
  const audio = useExoStore((s) => s.audio);
  const graphics = useExoStore((s) => s.graphics);
  const oracleEnabled = useExoStore((s) => s.oracleEnabled);
  const previousScreen = useExoStore((s) => s.previousScreen);
  const updateAudio = useExoStore((s) => s.updateAudio);
  const updateGraphics = useExoStore((s) => s.updateGraphics);
  const setOracleEnabled = useExoStore((s) => s.setOracleEnabled);
  const setScreen = useExoStore((s) => s.setScreen);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
  const { isMobile, layoutMode, setLayoutMode } = useViewportLayout();

  const isWideTab = tab === 'DOCS_ATLAS' || tab === 'ATLAS' || tab === 'FEATURES' || tab === 'THEME';

  const settingsTabs: readonly {
    readonly id: SettingsTabId;
    readonly label: string;
    readonly icon: typeof Palette;
  }[] = [
    { id: 'THEME', label: 'Thème & Zoom', icon: Palette },
    { id: 'FEATURES', label: 'Fonctionnalités', icon: ListChecks },
    { id: 'ATLAS', label: 'Atlas Chemins', icon: Compass },
    { id: 'DOCS_ATLAS', label: 'Studio Docs', icon: BookOpen },
    { id: 'AUDIO', label: 'Audio FIP', icon: Volume2 },
    { id: '3D', label: 'Moteur 3D', icon: Monitor },
    { id: 'ORACLE', label: 'Événements', icon: Cpu },
    { id: 'CONTROLS', label: 'Contrôles', icon: Gamepad2 },
  ];

  return (
    <div
      className={`fixed inset-0 z-40 flex justify-center bg-black/60 ${
        fullscreen ? 'items-stretch p-0' : 'items-end p-0 sm:items-center sm:p-5'
      }`}
    >
      <div
        className={`exo-bento-card exo-astral-ticks flex w-full flex-col transition-all ${
          fullscreen
            ? 'h-[100dvh] max-w-none rounded-none p-4 sm:p-6'
            : `max-h-[94dvh] rounded-t-2xl p-4 sm:max-h-[90vh] sm:rounded-2xl sm:p-6 ${
                isWideTab ? 'max-w-5xl' : 'max-w-3xl'
              }`
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b exo-accent-border pb-3.5">
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold text-[var(--exo-text)] sm:text-xl">Paramètres</h1>
            <p className="text-xs exo-muted-text">
              Ergonomie {isMobile ? 'Mobile' : 'Ordinateur'}, zoom App Shell Safari/Système, thèmes et atlas
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="settings-docs-skills-btn"
              onClick={() => setSubscreen('DOCS_SKILLS_HUB')}
              className="exo-accent-btn inline-flex min-h-[44px] items-center gap-1.5 px-3 text-xs font-bold whitespace-nowrap"
            >
              <BookMarked className="h-4 w-4" />
              <span>Docs, VCS &amp; Skills</span>
            </button>
            <button
              type="button"
              onClick={() => setFullscreen((f) => !f)}
              aria-label={fullscreen ? 'Format fenêtre' : 'Passer en plein écran'}
              className="exo-accent-chip inline-flex min-h-[44px] items-center gap-1.5 px-3 text-xs font-semibold whitespace-nowrap"
            >
              {fullscreen ? (
                <Minimize2 className="h-4 w-4 exo-accent-text" />
              ) : (
                <Maximize2 className="h-4 w-4 exo-accent-text" />
              )}
              <span className="hidden md:inline">{fullscreen ? 'Fenêtre' : 'Plein écran'}</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode(isMobile ? 'DESKTOP' : 'MOBILE')}
              className="exo-accent-chip inline-flex min-h-[44px] items-center gap-1.5 px-3 text-xs font-semibold whitespace-nowrap"
            >
              {isMobile ? <Monitor className="h-4 w-4 exo-accent-text" /> : <Smartphone className="h-4 w-4 exo-accent-text" />}
              <span>{isMobile ? 'Mode Ordinateur' : 'Mode Mobile'}</span>
            </button>
            <button
              type="button"
              data-testid="settings-close-btn"
              onClick={() => setScreen(previousScreen === 'EXO_GAME_SCREEN' ? 'EXO_GAME_SCREEN' : 'EXO_MAIN_MENU')}
              className="exo-accent-chip inline-flex min-h-[44px] items-center gap-1.5 px-3 text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4 exo-accent-text" />
              Fermer
            </button>
          </div>
        </div>

        <nav
          role="tablist"
          aria-label="Sections des paramètres"
          data-testid="settings-tabs-rail"
          className="exo-window-tabs-rail mt-3 flex shrink-0 flex-nowrap gap-1.5 overflow-x-auto sm:grid sm:grid-cols-4 sm:overflow-visible"
        >
          {settingsTabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`settings-tab-${item.id.toLowerCase()}`}
                onClick={() => setTab(item.id)}
                className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 px-3 text-[13px] font-bold tracking-tight whitespace-nowrap ${
                  active ? 'exo-window-tab-active' : 'exo-window-tab'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-current' : 'exo-accent-text'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-3 flex-1 overflow-y-auto rounded-xl border exo-accent-border bg-[var(--exo-surface-alt)] p-3.5 text-sm text-[var(--exo-text)] sm:p-4">
          {tab === '3D' && (
            <label className="flex min-h-[44px] items-center justify-between gap-4">
              <div>
                <div className="font-semibold">Mode Économie d’Énergie 3D</div>
                <div className="text-xs exo-muted-text">
                  Allège les effets visuels 3D et optimise la résolution d’affichage pour plus de fluidité sur mobile.
                </div>
              </div>
              <input
                type="checkbox"
                checked={graphics.lowPowerMode}
                onChange={(e) => updateGraphics({ lowPowerMode: e.target.checked })}
                className="exo-range h-5 w-5 shrink-0"
              />
            </label>
          )}

          {tab === 'AUDIO' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span>Web Radio FIP (Activée par défaut · 6 flux Radio France)</span>
                <button
                  type="button"
                  onClick={() => updateAudio({ muted: !audio.muted })}
                  className={`min-h-[44px] rounded-lg px-4 text-xs font-bold transition ${
                    audio.muted
                      ? 'border border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  {audio.muted ? 'Muet (Activer)' : 'Son Actif (Couper)'}
                </button>
              </div>
              <label className="block text-xs">
                <span>Volume : {Math.round(audio.volume * 100)}%</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={audio.volume}
                  onChange={(e) => updateAudio({ volume: Number(e.target.value) })}
                  className="mt-2 w-full accent-rose-600"
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {FIP_STATIONS.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => updateAudio({ stationId: st.id })}
                    className={`min-h-[44px] rounded-lg border p-2.5 text-left text-xs transition ${
                      audio.stationId === st.id
                        ? 'border-rose-500 bg-rose-50 text-rose-900 dark:border-rose-400 dark:bg-rose-500/20 dark:text-rose-100'
                        : 'border-rose-200/80 bg-white text-rose-950/80 hover:border-rose-400 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200'
                    }`}
                  >
                    <div className="font-semibold">{st.label}</div>
                    <div className="text-[11px] text-rose-900/65 dark:text-rose-200/65">{st.mood}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'ORACLE' && (
            <label className="flex min-h-[44px] items-center justify-between gap-4">
              <div>
                <div className="font-semibold">Générateur d’Événements Contextuels</div>
                <div className="text-xs text-rose-900/70 dark:text-rose-200/70">
                  Génère des dépêches narratives et crises diplomatiques équilibrées, avec repli local instantané.
                </div>
              </div>
              <input
                type="checkbox"
                checked={oracleEnabled}
                onChange={(e) => setOracleEnabled(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-rose-600"
              />
            </label>
          )}

          {tab === 'THEME' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="font-semibold text-sm">Mode d&apos;Ergonomie &amp; Disposition</div>
                <p className="text-xs exo-muted-text">
                  Optimisé pour la prise en main tactile mobile par défaut, avec bascule instantanée vers le Mode Ordinateur.
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    { id: 'AUTO' as const, label: 'Automatique (Écran)' },
                    { id: 'MOBILE' as const, label: 'Mode Mobile (Tactile)' },
                    { id: 'DESKTOP' as const, label: 'Mode Ordinateur (Bureau)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setLayoutMode(opt.id)}
                      className={`min-h-[42px] px-3 py-2 text-xs font-semibold transition ${
                        layoutMode === opt.id ? 'exo-accent-chip-active' : 'exo-accent-chip'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t exo-accent-border pt-4">
                <ThemeStudioPanel />
              </div>
            </div>
          )}

          {tab === 'CONTROLS' && (
            <ul className="space-y-2.5 font-mono text-xs text-[var(--exo-text)] opacity-90">
              <li>Tactile Mobile — Glisser pour orbiter la planète, pincer pour zoomer, balayer les cartes dossiers horizontalement.</li>
              <li>1 / 2 / 3 — Basculer entre Échelle 1 (Espace), Échelle 2 (Planète 72 secteurs), Échelle 3 (Cité Ciel Ouvert).</li>
              <li>T — Ouvrir / Fermer la Carte Tactique 3D (D3 · Zones Atmosphériques × Unités L1–L5).</li>
              <li>H — Masquer / Afficher le panneau de commandes inférieur.</li>
              <li>Échap / P — Pause / Reprise de la simulation.</li>
            </ul>
          )}

          {tab === 'FEATURES' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200 pb-3 dark:border-rose-900/60">
                <div>
                  <h2 className="font-display text-base font-bold text-[#1f1224] dark:text-rose-50">
                    Fonctionnalités de l&apos;Application
                  </h2>
                  <p className="text-xs text-rose-900/70 dark:text-rose-200/70">
                    Vue d&apos;ensemble des systèmes de jeu, outils documentaires et options disponibles.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('DOCS_ATLAS')}
                  className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:border-rose-500 dark:border-rose-700 dark:bg-rose-500/20 dark:text-rose-200"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Ouvrir Studio Documentaire &amp; Atlas
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {APP_FEATURES.map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={feat.title}
                      className="rounded-xl border border-rose-200/90 bg-rose-50/45 p-3.5 dark:border-rose-900/60 dark:bg-rose-950/25"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                            <Icon className="h-4 w-4" />
                          </span>
                          <h3 className="font-display text-sm font-bold text-[#1f1224] dark:text-rose-50">
                            {feat.title}
                          </h3>
                        </div>
                        <span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-300">
                          {feat.tag}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-rose-950/80 dark:text-rose-100/80">
                        {feat.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'ATLAS' && <AppPathAtlasPanel />}

          {tab === 'DOCS_ATLAS' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b exo-accent-border pb-2.5">
                <div>
                  <h2 className="font-display text-base font-bold text-[var(--exo-text)]">
                    Gouvernance RBAC, Validation &amp; Documentation Séparée (Application / Jeu)
                  </h2>
                  <p className="text-xs exo-muted-text">
                    Rôles utilisateurs, flux de validation (Documentation technique, Skills, Jeu) et archives classées par pôle.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubscreen('DOCS_SKILLS_HUB')}
                  className="exo-accent-btn inline-flex min-h-[38px] items-center gap-1.5 px-3 text-xs font-bold"
                >
                  <BookMarked className="h-3.5 w-3.5" />
                  <span>Ouvrir Atelier VCS &amp; Skills</span>
                </button>
              </div>
              <DocStudioPanel initialTab="GOVERNANCE" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
