import { useState } from 'react';
import { useAtom } from 'jotai';
import { BookOpen, Globe2, Maximize2, Minimize2, Sparkles, X } from 'lucide-react';
import { BiosphereCabinetTab } from './subscreens/BiosphereCabinetTab.tsx';
import { ChronicleSavesTab } from './subscreens/ChronicleSavesTab.tsx';
import { DocSyncStudioModal } from './subscreens/DocSyncStudioModal.tsx';
import { DossierWorkshopModal } from './subscreens/DossierWorkshopModal.tsx';
import { EventsHubTab } from './subscreens/EventsHubTab.tsx';
import { GeopoliticsTab } from './subscreens/GeopoliticsTab.tsx';
import { JournalHubTab } from './subscreens/JournalHubTab.tsx';
import { MilitaryCombatTab } from './subscreens/MilitaryCombatTab.tsx';
import { ProfileHubTab } from './subscreens/ProfileHubTab.tsx';
import { WorldCitiesTab } from './subscreens/WorldCitiesTab.tsx';
import { WorldsHubTab } from './subscreens/WorldsHubTab.tsx';
import { useExoStore } from '../stores/game.store.ts';
import {
  activeDossierIdAtom,
  activeSubscreenAtom,
  type ExoSubscreenId,
} from '../stores/selection.atoms.ts';

/**
 * [L7] Fast Overlay Subscreens & Dossier Workshop.
 * Supports 3 primary hubs (Mondes, Événements, Journal) + Header Profil,
 * with Fullscreen / Window toggle & mobile bottom-sheet framing.
 */
const SUBSCREEN_TITLES: Partial<Record<ExoSubscreenId, string>> = {
  WORLDS_HUB: 'Monde · Territoires, Population, Biosphère, Militaire',
  EVENTS_HUB: 'Événements · Décisions, Opérations, Diplomatie',
  JOURNAL_HUB: 'Journal · Chronique, Archives, Playtest',
  PROFILE: 'Profil',
  WORLD_CITIES: 'Territoires',
  BIOSPHERE_CABINET: 'Biosphère',
  MILITARY_COMBAT: 'Militaire',
  GEOPOLITICS: 'Diplomatie',
  CHRONICLE_SAVES: 'Chronique',
};

const QUICK_PRIMARY_TABS = [
  { id: 'WORLDS_HUB' as const, label: 'Monde', icon: Globe2 },
  { id: 'EVENTS_HUB' as const, label: 'Événements', icon: Sparkles },
  { id: 'JOURNAL_HUB' as const, label: 'Journal', icon: BookOpen },
] as const;

export function SubscreensOverlay() {
  const [subscreen, setSubscreen] = useAtom(activeSubscreenAtom);
  const [activeDossierId, setActiveDossierId] = useAtom(activeDossierIdAtom);
  const [fullscreen, setFullscreen] = useState(false);
  const world = useExoStore((s) => s.world);

  const activeDossier = activeDossierId
    ? world.activeDossiers.find((d) => d.id === activeDossierId) ?? null
    : null;

  if (activeDossier) {
    return (
      <DossierWorkshopModal
        dossier={activeDossier}
        onClose={() => setActiveDossierId(null)}
      />
    );
  }

  if (subscreen === 'NONE') return null;

  if (subscreen === 'DOC_SYNC_STUDIO' || subscreen === 'BLUEPRINT_ATLAS') {
    return (
      <DocSyncStudioModal
        initialTab={subscreen === 'BLUEPRINT_ATLAS' ? 'ATLAS' : 'GOVERNANCE'}
        onClose={() => setSubscreen('NONE')}
      />
    );
  }

  const title = SUBSCREEN_TITLES[subscreen] ?? 'Module Exécutif';
  const isPrimaryHub =
    subscreen === 'WORLDS_HUB' || subscreen === 'EVENTS_HUB' || subscreen === 'JOURNAL_HUB';

  return (
    <div
      className={`fixed inset-0 z-40 flex justify-center bg-black/55 ${
        fullscreen ? 'items-stretch p-0' : 'items-end p-0 sm:items-center sm:p-6'
      }`}
    >
      <div
        className={`exo-bento-card exo-astral-ticks flex w-full flex-col ${
          fullscreen
            ? 'h-[100dvh] max-w-none rounded-none'
            : 'max-h-[92dvh] max-w-5xl rounded-t-2xl sm:max-h-[88vh] sm:rounded-2xl'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b exo-accent-border px-4 py-3 sm:px-5">
          <h2 className="font-display text-base font-bold text-[var(--exo-text)] sm:text-lg">{title}</h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFullscreen((f) => !f)}
              aria-label={fullscreen ? 'Format fenêtre' : 'Passer en plein écran'}
              className="exo-accent-chip inline-flex h-10 items-center gap-1.5 px-2.5 font-mono text-[11px] font-semibold"
            >
              {fullscreen ? <Minimize2 className="h-4 w-4 exo-accent-text" /> : <Maximize2 className="h-4 w-4 exo-accent-text" />}
              <span className="hidden sm:inline">{fullscreen ? 'Fenêtre' : 'Plein écran'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFullscreen(false);
                setSubscreen('NONE');
              }}
              aria-label="Fermer le module"
              className="exo-accent-chip inline-flex h-10 w-10 shrink-0 items-center justify-center"
            >
              <X className="h-5 w-5 exo-accent-text" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {subscreen === 'WORLDS_HUB' && <WorldsHubTab />}
          {subscreen === 'EVENTS_HUB' && <EventsHubTab />}
          {subscreen === 'JOURNAL_HUB' && <JournalHubTab />}
          {subscreen === 'PROFILE' && <ProfileHubTab />}
          {subscreen === 'WORLD_CITIES' && <WorldCitiesTab />}
          {subscreen === 'BIOSPHERE_CABINET' && <BiosphereCabinetTab />}
          {subscreen === 'MILITARY_COMBAT' && <MilitaryCombatTab />}
          {subscreen === 'GEOPOLITICS' && <GeopoliticsTab />}
          {subscreen === 'CHRONICLE_SAVES' && <ChronicleSavesTab />}
        </div>

        {isPrimaryHub && (
          <nav
            aria-label="Basculer entre les 3 onglets principaux"
            className="grid shrink-0 grid-cols-3 gap-1.5 border-t exo-accent-border bg-[var(--exo-surface-alt)] p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-5"
          >
            {QUICK_PRIMARY_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = subscreen === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSubscreen(tab.id)}
                  className={`inline-flex min-h-[42px] items-center justify-center gap-1.5 px-2 text-xs font-semibold transition ${
                    active ? 'exo-accent-chip-active' : 'exo-accent-chip'
                  }`}
                >
                  <Icon className="h-4 w-4 exo-accent-text" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
