import { useSetAtom } from 'jotai';
import { Compass, ExternalLink } from 'lucide-react';
import { useExoStore } from '../../stores/game.store.ts';
import {
  activeSubscreenAtom,
  worldsHubDomainAtom,
  worldsHubSubViewAtom,
  type ExoSubscreenId,
  type WorldsHubDomain,
} from '../../stores/selection.atoms.ts';

/**
 * [L7] EXW.L7.APP_PATH_ATLAS | v5.0.0 | SADT A5.1
 * Clickable Complete Application Interface & Paths Atlas.
 */
interface AtlasRouteItem {
  readonly path: string;
  readonly category: string;
  readonly summary: string;
  readonly action: () => void;
}

export function AppPathAtlasPanel() {
  const setScreen = useExoStore((s) => s.setScreen);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
  const setDomain = useSetAtom(worldsHubDomainAtom);
  const setSubView = useSetAtom(worldsHubSubViewAtom);

  const openMonde = (domain: WorldsHubDomain, subView: string) => {
    setScreen('EXO_GAME_SCREEN');
    setDomain(domain);
    setSubView(subView);
    setSubscreen('WORLDS_HUB');
  };

  const openSubscreen = (id: ExoSubscreenId) => {
    setScreen('EXO_GAME_SCREEN');
    setSubscreen(id);
  };

  const routes: readonly AtlasRouteItem[] = [
    { path: 'Monde ▸ Territoires ▸ Fiche État', category: 'Statistiques', summary: 'Fiche Souveraine (Régime, 6 Planètes, Cités) & Finances', action: () => openMonde('TERRITORIES', 'SOVEREIGN_STATE') },
    { path: 'Monde ▸ Territoires ▸ Quartiers 24-Hex', category: 'Gestionnaire', summary: 'Cité vivante multi-hex, Ministères B3D, Maglev civil/fret', action: () => openMonde('TERRITORIES', 'DISTRICTS') },
    { path: 'Monde ▸ Population ▸ Citoyens', category: 'Statistiques', summary: 'Citoyens ordinaires Frostpunk, Santé, Éducation, Loisirs, Pollution', action: () => openMonde('POPULATION', 'CITIZENS') },
    { path: 'Monde ▸ Population ▸ Affectations', category: 'Gestionnaire', summary: 'Tableau général d’affectation des colons + Optimisation IA', action: () => openMonde('POPULATION', 'ASSIGNMENTS') },
    { path: 'Monde ▸ Biosphère ▸ Climat', category: 'Statistiques', summary: 'Qualité d’air textuelle, 4 piliers, prévisions 3 tours', action: () => openMonde('BIOSPHERE', 'CLIMATE') },
    { path: 'Monde ▸ Biosphère ▸ Studio Vidéo', category: 'Média', summary: '12 Catégories Climat/Catastrophes & Capture WebM 3D', action: () => openMonde('BIOSPHERE', 'VIDEO_STUDIO') },
    { path: 'Monde ▸ Militaire ▸ 4 Théâtres', category: 'Gestionnaire', summary: 'Spatial, Ciel, Terrestre, Maritime, Taskforces & Chantier 3D', action: () => openMonde('MILITARY', 'THEATERS') },
    { path: 'Monde ▸ Technologies ▸ Arbre 30 Techs', category: 'Gestionnaire', summary: 'Recherche scientifique dédiée (indépendante du Militaire)', action: () => openMonde('TECHNOLOGIES', 'TECH_TREE') },
    { path: 'Événements ▸ Dossiers Exécutifs', category: 'Commandement', summary: 'Badges 3 niveaux, classement IA non-restrictif, module Monde', action: () => openSubscreen('EVENTS_HUB') },
    { path: 'Journal ▸ Chronique · Playtest 6T', category: 'Archives', summary: 'Sauvegardes locales/Cloud, simulateur 6 tours & empreintes SHA-256', action: () => openSubscreen('JOURNAL_HUB') },
    { path: 'Profil ▸ Étendard · Commandant', category: 'Honneurs', summary: 'Vitrine multi-parties (Avatar, Médailles) & Hiérarchie CK3', action: () => openSubscreen('PROFILE') },
  ];

  return (
    <div className="space-y-3" data-testid="app-path-atlas">
      <div className="flex items-center gap-2">
        <Compass className="h-4 w-4 exo-accent-text" />
        <h3 className="font-display text-sm font-bold">Atlas Complet de l&apos;Interface · Chemins Directs</h3>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {routes.map((route) => (
          <button
            key={route.path}
            type="button"
            onClick={route.action}
            className="exo-surface-sub flex items-start justify-between gap-2 rounded-xl border p-3 text-left text-xs transition hover:border-[var(--exo-accent)] exo-accent-border"
          >
            <div className="min-w-0">
              <div className="font-mono text-[10px] font-bold uppercase exo-accent-2-text">
                {route.category}
              </div>
              <div className="mt-0.5 font-display font-bold">{route.path}</div>
              <p className="mt-0.5 text-[11px] exo-muted-text">{route.summary}</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 exo-accent-text" />
          </button>
        ))}
      </div>
    </div>
  );
}
