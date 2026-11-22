import { useEffect, useMemo } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  Building2,
  CloudSun,
  Cpu,
  Leaf,
  Shield,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { AssignmentsTablePanel } from '../../components/world/AssignmentsTablePanel.tsx';
import { CitizensSocietyPanel } from '../../components/world/CitizensSocietyPanel.tsx';
import { ColonistRosterCards } from '../../components/world/ColonistRosterCards.tsx';
import { ExternalPolitiesPanel } from '../../components/world/ExternalPolitiesPanel.tsx';
import { MilitaryTheatersPanel } from '../../components/world/MilitaryTheatersPanel.tsx';
import { SovereignStatePanel } from '../../components/world/SovereignStatePanel.tsx';
import { VideoStudioPanel } from '../../components/world/VideoStudioPanel.tsx';
import { WorldBiospherePanel } from '../../components/world/WorldBiospherePanel.tsx';
import { WorldCitiesPanel } from '../../components/world/WorldCitiesPanel.tsx';
import { WorldFleetTechPanel } from '../../components/world/WorldFleetTechPanel.tsx';
import { resolveSuperpowerV4 } from '../../data/v4-catalog.data.ts';
import { handleGenerateActionEvent } from '../../pipelines/game-actions.pipeline.ts';
import { useExoStore } from '../../stores/game.store.ts';
import {
  activeDossierIdAtom,
  toastNoticeAtom,
  worldsHubDomainAtom,
  worldsHubSubViewAtom,
  type WorldsHubDomain,
} from '../../stores/selection.atoms.ts';
import { evaluateEntityLedger } from '../../systems/economy-urban/entity-ledger.ts';
import { computeResourceForecast } from '../../systems/economy-urban/resource-forecast.ts';
import {
  formatAtmosphereStageName,
  formatSeasonLabel,
  formatWeatherLabel,
} from '../../utils/atmosphere-labels.ts';

interface DomainSpec {
  readonly id: WorldsHubDomain;
  readonly label: string;
  readonly icon: typeof Building2;
  readonly subViews: readonly {
    readonly id: string;
    readonly label: string;
    readonly mode: 'STATS' | 'MANAGER';
  }[];
}

const MONDE_DOMAINS: readonly DomainSpec[] = [
  {
    id: 'TERRITORIES',
    label: 'Territoires',
    icon: Building2,
    subViews: [
      { id: 'STATE', label: 'Fiche État', mode: 'STATS' },
      { id: 'DISTRICTS', label: 'Quartiers', mode: 'MANAGER' },
      { id: 'PLANETS', label: 'Planètes', mode: 'MANAGER' },
    ],
  },
  {
    id: 'POPULATION',
    label: 'Population',
    icon: Users,
    subViews: [
      { id: 'CITIZENS', label: 'Citoyens', mode: 'STATS' },
      { id: 'ASSIGNMENTS', label: 'Affectations', mode: 'MANAGER' },
      { id: 'COLONISTS', label: 'Colons', mode: 'MANAGER' },
    ],
  },
  {
    id: 'BIOSPHERE',
    label: 'Biosphère',
    icon: Leaf,
    subViews: [
      { id: 'CLIMATE', label: 'Qualité Air', mode: 'STATS' },
      { id: 'SPECTRA_HK', label: 'Spectres', mode: 'STATS' },
      { id: 'VIDEO_STUDIO', label: 'Studio Vidéo', mode: 'MANAGER' },
    ],
  },
  {
    id: 'MILITARY',
    label: 'Militaire',
    icon: Shield,
    subViews: [
      { id: 'THEATERS', label: '4 Théâtres', mode: 'MANAGER' },
      { id: 'POLITIES', label: 'Cités Extérieures', mode: 'STATS' },
    ],
  },
  {
    id: 'TECHNOLOGIES',
    label: 'Technologies',
    icon: Cpu,
    subViews: [{ id: 'TECH_TREE', label: 'Arbre 30 Techs', mode: 'MANAGER' }],
  },
];

/**
 * [L7] EXW.L7.MONDE_HUB | v5.0.0 | SADT A3.1/A5.1
 * Pure 5-Domain Monde Hub (zero "et" / "&" labels), Stats vs Managers separation,
 * and remaining-PA Initiative Launcher directly from Monde.
 */
export function WorldsHubTab() {
  const [domain, setDomain] = useAtom(worldsHubDomainAtom);
  const [subView, setSubView] = useAtom(worldsHubSubViewAtom);
  const setActiveDossierId = useSetAtom(activeDossierIdAtom);
  const setToast = useSetAtom(toastNoticeAtom);
  const world = useExoStore((s) => s.world);

  const forecast = useMemo(() => computeResourceForecast(world), [world]);
  const ledger = useMemo(() => evaluateEntityLedger(world, 1.0), [world]);
  const sp = resolveSuperpowerV4(world.superpowerId);

  const activeSpec = MONDE_DOMAINS.find((d) => d.id === domain) ?? MONDE_DOMAINS[0]!;
  const resolvedSubView = activeSpec.subViews.some((s) => s.id === subView)
    ? subView
    : activeSpec.subViews[0]!.id;

  useEffect(() => {
    if (!activeSpec.subViews.some((s) => s.id === subView)) {
      setSubView(activeSpec.subViews[0]!.id);
    }
  }, [activeSpec, subView, setSubView]);

  const stageLabel = formatAtmosphereStageName(world.atmosphereTier);
  const seasonLabel = formatSeasonLabel(world.season);
  const weatherLabel = formatWeatherLabel(world.weatherState);
  const mandatoryCleared = world.activeDossiers.length === 0;

  const launchWorldInitiative = () => {
    const req =
      domain === 'MILITARY'
        ? ({ kind: 'RECRUIT_UNIT', unitClass: 'INFANTRY_EXO', level: 1 } as const)
        : domain === 'BIOSPHERE'
          ? ({ kind: 'REASSIGN_DRONE', fromRole: 'recon', toRole: 'construction' } as const)
          : domain === 'POPULATION'
            ? ({ kind: 'MARKET_TRADE', resource: 'materials', action: 'BUY', quantity: 15 } as const)
            : world.districts[0]
              ? ({ kind: 'GRAFT_MODULE', districtId: world.districts[0].id } as const)
              : ({ kind: 'BANK_LOAN', principal: 300 } as const);

    const [err, dossier] = handleGenerateActionEvent(req);
    if (err || !dossier) {
      setToast({ id: Date.now(), tone: 'warn', text: err?.message ?? 'Initiative indisponible.' });
      return;
    }
    setActiveDossierId(dossier.id);
  };

  return (
    <div className="space-y-4">
      <div className="exo-bento-card space-y-3 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2 font-mono">
            <span className="exo-accent-btn inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold">
              <CloudSun className="h-3.5 w-3.5" />
              {seasonLabel} {world.year} · Tour {world.cycle}
            </span>
            <span className="exo-accent-chip px-2.5 py-1 font-semibold">
              {stageLabel} ({world.atmosphereProgress}%)
            </span>
            <span className="exo-surface-sub rounded-lg px-2.5 py-1 font-semibold">
              Météo : {weatherLabel}
            </span>
            <span
              className={`rounded-lg border px-2.5 py-1 font-semibold ${
                forecast.maintenanceTone === 'critical'
                  ? 'border-rose-400 bg-rose-500/15 text-rose-500'
                  : 'border-emerald-400/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
              }`}
            >
              Usure : {forecast.maintenanceLoadPct}%
            </span>
          </div>
          <div className="font-mono text-[11px] font-semibold exo-accent-text">
            {sp.code} · {world.hk?.factionEraTitle ?? sp.name} · Renommée {world.hk?.fame ?? 0}
          </div>
        </div>

        {/* Niveau 1 : 5 Domaines Purs (zéro "et" / "&") */}
        <div className="flex flex-wrap gap-1.5 border-t exo-accent-border pt-3">
          {MONDE_DOMAINS.map((spec) => {
            const Icon = spec.icon;
            const active = spec.id === domain;
            return (
              <button
                key={spec.id}
                type="button"
                data-testid={`monde-domain-${spec.id}`}
                onClick={() => {
                  setDomain(spec.id);
                  setSubView(spec.subViews[0]!.id);
                }}
                className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition ${
                  active ? 'exo-accent-btn' : 'exo-accent-chip'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{spec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Niveau 2 : Sous-vues Stats vs Gestionnaires + Bouton Initiative PA Restants */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t exo-accent-border pt-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-mono text-[10px] font-bold uppercase exo-muted-text">
              Vue :
            </span>
            {activeSpec.subViews.map((sv) => {
              const active = sv.id === resolvedSubView;
              return (
                <button
                  key={sv.id}
                  type="button"
                  data-testid={`monde-subview-${sv.id}`}
                  onClick={() => setSubView(sv.id)}
                  className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-lg px-2.5 font-mono text-[11px] font-semibold transition ${
                    active
                      ? 'exo-accent-chip-active ring-1 ring-[var(--exo-accent)]'
                      : 'exo-surface-sub exo-muted-text hover:text-[var(--exo-text)]'
                  }`}
                >
                  <span>{sv.label}</span>
                  <span className="rounded bg-black/10 px-1 text-[9px] opacity-80 dark:bg-white/10">
                    {sv.mode === 'STATS' ? 'Stats' : 'Gestion'}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            data-testid="monde-launch-choice-btn"
            onClick={launchWorldInitiative}
            className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-xl px-3 font-mono text-[11px] font-bold transition ${
              mandatoryCleared && world.pa.general > 0 ? 'exo-accent-btn' : 'exo-accent-chip'
            }`}
          >
            {mandatoryCleared && world.pa.general > 0 ? (
              <Zap className="h-3.5 w-3.5" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 exo-accent-text" />
            )}
            <span>Lancer un choix ({world.pa.general} PA restants)</span>
          </button>
        </div>
      </div>

      {domain === 'TERRITORIES' &&
        (resolvedSubView === 'STATE' ? (
          <SovereignStatePanel />
        ) : (
          <WorldCitiesPanel
            subView={resolvedSubView === 'PLANETS' ? 'PLANETS_FINANCE' : 'DISTRICTS'}
            forecast={forecast}
            ledger={ledger}
          />
        ))}

      {domain === 'POPULATION' &&
        (resolvedSubView === 'CITIZENS' ? (
          <CitizensSocietyPanel />
        ) : resolvedSubView === 'COLONISTS' ? (
          <ColonistRosterCards />
        ) : (
          <AssignmentsTablePanel />
        ))}

      {domain === 'BIOSPHERE' &&
        (resolvedSubView === 'VIDEO_STUDIO' ? (
          <VideoStudioPanel />
        ) : (
          <WorldBiospherePanel
            subView={resolvedSubView === 'SPECTRA_HK' ? 'SPECTRA_HK' : 'CLIMATE'}
          />
        ))}

      {domain === 'MILITARY' &&
        (resolvedSubView === 'POLITIES' ? <ExternalPolitiesPanel /> : <MilitaryTheatersPanel />)}

      {domain === 'TECHNOLOGIES' && <WorldFleetTechPanel subView="TECH_TREE" />}
    </div>
  );
}
