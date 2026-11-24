import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Coins,
  Cpu,
  Crosshair,
  FlaskConical,
  Globe,
  Handshake,
  Rocket,
  Scale,
  Shield,
  Sparkles,
  Swords,
  Wrench,
  Zap,
} from 'lucide-react';
import { useExoStore } from '../../stores/game.store.ts';
import type { ActionEventRequest } from '../../systems/dossiers-pa/action-event-generator.ts';
import {
  buildEventActionPillars,
  type EventActionGridItem,
  type EventActionIconKey,
  type EventActionPillarId,
} from '../../systems/dossiers-pa/event-action-taxonomy.ts';
import { ExoTooltip } from '../bento/ExoTooltip.tsx';
import { ActionGatewayDrawer, type GatewayDomain } from './ActionGatewayDrawer.tsx';

type SynthClass = 'C1' | 'C2' | 'C3';

interface EventsActionCommandCenterProps {
  readonly synthClass: SynthClass;
  readonly onSynthClassChange: (next: SynthClass) => void;
  readonly onGenerateSynthDossier: (targetClass?: SynthClass) => void;
  readonly isGeneratingSynth: boolean;
  readonly onLaunchAction: (request: ActionEventRequest) => void;
  readonly onOpenHangar: () => void;
}

const ACTION_ICONS: Record<EventActionIconKey, typeof Rocket> = {
  FLASK: FlaskConical,
  CPU: Cpu,
  WRENCH: Wrench,
  SPARKLES: Sparkles,
  ROCKET: Rocket,
  SWORDS: Swords,
  CROSSHAIR: Crosshair,
  SHIELD: Shield,
  HANDSHAKE: Handshake,
  GLOBE: Globe,
  COINS: Coins,
  SCALE: Scale,
};

const PILLAR_THEME: Record<
  EventActionPillarId,
  {
    readonly icon: typeof FlaskConical;
    readonly container: string;
    readonly headerBg: string;
    readonly headerIcon: string;
    readonly pill: string;
    readonly button: string;
    readonly iconBox: string;
    readonly badge: string;
  }
> = {
  RESEARCH: {
    icon: FlaskConical,
    container: 'border-cyan-300/80 bg-cyan-50/40 dark:border-cyan-800/70 dark:bg-cyan-950/20',
    headerBg: 'border-cyan-200/80 dark:border-cyan-800/60',
    headerIcon: 'bg-cyan-600 text-white dark:bg-cyan-500/90',
    pill: 'border-cyan-300 bg-white/90 text-cyan-900 dark:border-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-200',
    button:
      'border-cyan-200/85 bg-white/95 hover:border-cyan-500 hover:bg-cyan-50/75 dark:border-cyan-900/60 dark:bg-[#101c26]/90 dark:hover:border-cyan-500/80 dark:hover:bg-cyan-950/45',
    iconBox: 'bg-cyan-500/15 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
    badge: 'bg-cyan-500/12 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-200',
  },
  MILITARY: {
    icon: Swords,
    container: 'border-rose-300/80 bg-rose-50/40 dark:border-rose-800/70 dark:bg-rose-950/20',
    headerBg: 'border-rose-200/80 dark:border-rose-800/60',
    headerIcon: 'bg-rose-600 text-white dark:bg-rose-500',
    pill: 'border-rose-300 bg-white/90 text-rose-900 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-200',
    button:
      'border-rose-200/85 bg-white/95 hover:border-rose-500 hover:bg-rose-50/75 dark:border-rose-900/60 dark:bg-[#1d1020]/90 dark:hover:border-rose-500/80 dark:hover:bg-rose-950/45',
    iconBox: 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
    badge: 'bg-rose-500/12 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200',
  },
  DIPLOMATIC: {
    icon: Handshake,
    container: 'border-amber-300/80 bg-amber-50/35 dark:border-amber-800/70 dark:bg-amber-950/20',
    headerBg: 'border-amber-200/80 dark:border-amber-800/60',
    headerIcon: 'bg-amber-600 text-white dark:bg-amber-500/90',
    pill: 'border-amber-300 bg-white/90 text-amber-950 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200',
    button:
      'border-amber-200/85 bg-white/95 hover:border-amber-500 hover:bg-amber-50/75 dark:border-amber-900/60 dark:bg-[#1d1712]/90 dark:hover:border-amber-500/80 dark:hover:bg-amber-950/45',
    iconBox: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    badge: 'bg-amber-500/14 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200',
  },
};

function mapAtelierToGatewayDomain(
  atelier: NonNullable<EventActionGridItem['opensAtelier']>,
): GatewayDomain {
  switch (atelier) {
    case 'FLEET_ARMORY':
      return 'FLEET';
    case 'TECH_COLONISTS':
      return 'URBAN';
    case 'MILITARY_OPS':
      return 'DEFENSE';
    case 'DIPLOMACY_MARKET':
      return 'ECONOMY';
  }
}

/**
 * [L7] EXW.L7.EVENTS_ACTION_COMMAND_CENTER | v5.1.0 | SADT A2.1/A3.3
 * Structured 3-Pillar Action Grid inside Événements (Recherche, Militaire, Diplomatique)
 * + collapsible deep Armory / Market / Tech atelier (100% R-24 compliant).
 */
export function EventsActionCommandCenter({
  synthClass,
  onSynthClassChange,
  onGenerateSynthDossier,
  isGeneratingSynth,
  onLaunchAction,
  onOpenHangar,
}: EventsActionCommandCenterProps) {
  const world = useExoStore((s) => s.world);
  const [showActionGrid, setShowActionGrid] = useState(true);
  const [showQuickOps, setShowQuickOps] = useState(false);
  const [atelierDomain, setAtelierDomain] = useState<GatewayDomain>('FLEET');

  const pillars = useMemo(() => buildEventActionPillars(world), [world]);

  const handleGridItemClick = (item: EventActionGridItem) => {
    if (item.disabled) return;
    if (item.actionPayload) {
      onLaunchAction(item.actionPayload);
      return;
    }
    if (item.opensAtelier) {
      setAtelierDomain(mapAtelierToGatewayDomain(item.opensAtelier));
      setShowQuickOps(true);
      return;
    }
    if (item.generatesSynthClass) {
      onSynthClassChange(item.generatesSynthClass);
      onGenerateSynthDossier(item.generatesSynthClass);
    }
  };

  return (
    <section
      aria-label="Centre de commandement des actions"
      className="space-y-3 rounded-2xl border border-rose-200/90 bg-white/95 p-3.5 shadow-xs dark:border-rose-900/60 dark:bg-[#190d1f]"
    >
      {/* Executive PA Bar + Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <ExoTooltip
            title="Points d’Action Généraux & Conseillers (R-26)"
            formula="PA Général = universel · Sous-PA = Gestion / Technique / Climat / Politique"
            body="Chaque bouton ci-dessous ouvre un dossier R-24 à 4 choix, dont une option garantie à 0 PA."
            accent="cyan"
          >
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-2.5 py-1 font-mono text-xs font-bold text-white shadow-xs">
              <Zap className="h-3.5 w-3.5" />
              PA {world.pa.general}/{world.pa.generalCap}
            </span>
          </ExoTooltip>
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px] font-semibold text-rose-950/80 dark:text-rose-200/85">
            <span className="rounded-md border border-rose-200/75 bg-rose-50/60 px-2 py-0.5 dark:border-rose-900/60 dark:bg-rose-950/40">
              Gestion {world.pa.subPa.PA_GES}
            </span>
            <span className="rounded-md border border-cyan-200/75 bg-cyan-50/60 px-2 py-0.5 dark:border-cyan-900/60 dark:bg-cyan-950/35">
              Technique {world.pa.subPa.PA_MNT}
            </span>
            <span className="rounded-md border border-emerald-200/75 bg-emerald-50/60 px-2 py-0.5 dark:border-emerald-900/60 dark:bg-emerald-950/35">
              Climat {world.pa.subPa.PA_BIO}
            </span>
            <span className="rounded-md border border-amber-200/75 bg-amber-50/60 px-2 py-0.5 dark:border-amber-900/60 dark:bg-amber-950/35">
              Politique {world.pa.subPa.PA_POL}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            data-testid="toggle-action-grid-btn"
            onClick={() => setShowActionGrid((v) => !v)}
            aria-expanded={showActionGrid}
            className="inline-flex min-h-[34px] shrink-0 items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/60 px-2.5 font-mono text-[10.5px] font-bold text-rose-900 hover:border-rose-400 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100"
          >
            <span>{showActionGrid ? 'Masquer grille' : 'Actions par type'}</span>
            {showActionGrid ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          <button
            type="button"
            data-testid="toggle-quick-ops-btn"
            onClick={() => setShowQuickOps((v) => !v)}
            aria-expanded={showQuickOps}
            className={`inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-lg border px-2.5 font-mono text-[10.5px] font-bold whitespace-nowrap transition ${
              showQuickOps
                ? 'border-rose-500 bg-rose-600 text-white shadow-xs'
                : 'border-rose-200 bg-white/90 text-rose-900 hover:border-rose-400 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100'
            }`}
          >
            <Rocket className="h-3.5 w-3.5" />
            <span>Armement &amp; Atelier</span>
            {showQuickOps ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          <select
            aria-label="Catégorie d'événement à générer"
            value={synthClass}
            onChange={(e) => onSynthClassChange(e.target.value as SynthClass)}
            className="min-h-[34px] rounded-lg border border-rose-200 bg-white px-2 font-mono text-[11px] font-semibold text-[#1f1224] dark:border-rose-800 dark:bg-[#190d1f] dark:text-rose-100"
          >
            <option value="C1">Politique</option>
            <option value="C2">Économie</option>
            <option value="C3">Technique</option>
          </select>

          <button
            type="button"
            disabled={isGeneratingSynth}
            onClick={() => onGenerateSynthDossier()}
            className="inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-xs font-bold text-white shadow-sm whitespace-nowrap hover:bg-rose-500 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isGeneratingSynth ? 'Création…' : 'Nouveau dossier'}</span>
          </button>
        </div>
      </div>

      {/* 3-Pillar Categorized Intuitive Action Grid: Recherche, Militaire, Diplomatique */}
      {showActionGrid && (
        <div
          data-testid="events-action-pillars-grid"
          className="grid gap-3 border-t border-rose-200/70 pt-3 lg:grid-cols-3 dark:border-rose-900/50"
        >
          {pillars.map((pillar) => {
            const theme = PILLAR_THEME[pillar.id];
            const PillarIcon = theme.icon;

            return (
              <div
                key={pillar.id}
                data-testid={`action-pillar-${pillar.id.toLowerCase()}`}
                className={`flex min-w-0 flex-col overflow-hidden rounded-xl border p-3 transition ${theme.container}`}
              >
                {/* Pillar Header */}
                <div className={`space-y-2 border-b pb-2.5 ${theme.headerBg}`}>
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-xs ${theme.headerIcon}`}
                    >
                      <PillarIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-xs font-bold uppercase tracking-wide text-[#1f1224] dark:text-rose-50">
                        {pillar.title}
                      </h3>
                      <p className="line-clamp-2 text-[10.5px] leading-snug text-rose-950/75 dark:text-rose-200/75">
                        {pillar.subtitle}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`inline-block max-w-full truncate rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${theme.pill}`}
                    >
                      {pillar.statusPill}
                    </span>
                  </div>
                </div>

                {/* Intuitive Action Buttons Grid */}
                <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
                  {pillar.items.map((item) => {
                    const ItemIcon = ACTION_ICONS[item.iconKey];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={`action-pillar-btn-${item.id}`}
                        disabled={item.disabled}
                        onClick={() => handleGridItemClick(item)}
                        className={`group flex min-w-0 items-center gap-2.5 rounded-xl border p-2 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${theme.button}`}
                      >
                        <span
                          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition group-hover:scale-105 ${theme.iconBox}`}
                        >
                          <ItemIcon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="truncate font-display text-[11.5px] font-bold text-[#1f1224] dark:text-rose-50">
                              {item.title}
                            </span>
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${theme.badge}`}
                            >
                              {item.badge}
                            </span>
                          </div>
                          <div className="mt-0.5 line-clamp-1 text-[10px] text-rose-950/70 dark:text-rose-200/70">
                            {item.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expandable Deep Atelier (12 Ship Modules, Refit, Commissioning, Urban, Cyber, Tech Tree) */}
      {showQuickOps && (
        <ActionGatewayDrawer
          activeDomain={atelierDomain}
          onDomainChange={setAtelierDomain}
          onLaunchAction={onLaunchAction}
          onOpenHangar={onOpenHangar}
        />
      )}
    </section>
  );
}
