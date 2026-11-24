import {
  AlertTriangle,
  ArrowRight,
  Box,
  ChevronDown,
  ChevronUp,
  MapPin,
  Rocket,
  User,
} from 'lucide-react';
import type { ExecutiveDossier, SubChoiceBadgeMeta } from '../../contracts/pa-dossiers.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import {
  buildPhilosophyBadgeTriplet,
  buildProvenanceBadgeTriplet,
  getSubChoiceBadgeMeta,
} from '../../systems/dossiers-pa/badge-taxonomy.ts';
import {
  getEffectiveOptionsForDossier,
  getSubChoicesForOption,
} from '../../systems/dossiers-pa/dossier-subchoices.ts';
import { resolveDossierContext } from '../../systems/dossiers-pa/entity-markup.ts';
import type { AiPriorityTier } from '../../systems/turn-orchestration/gemini-cost-ledger.ts';
import { formatDossierCategory } from '../../utils/ui-labels.ts';
import { RichEntityText } from '../RichEntityText.tsx';
import { NestedBadgeGroup } from '../bento/NestedBadgeGroup.tsx';

const CLASS_BADGE: Record<string, string> = {
  P0: 'bg-rose-600 text-white border-rose-600 dark:bg-rose-500 dark:border-rose-400',
  C1: 'bg-fuchsia-500/14 text-fuchsia-900 border-fuchsia-300 dark:bg-fuchsia-500/20 dark:text-fuchsia-200 dark:border-fuchsia-700',
  C2: 'bg-amber-500/14 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-700',
  C3: 'bg-orange-500/14 text-orange-900 border-orange-300 dark:bg-orange-500/20 dark:text-orange-200 dark:border-orange-700',
  C4: 'bg-emerald-500/14 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-700',
  C5: 'bg-pink-500/14 text-pink-900 border-pink-300 dark:bg-pink-500/20 dark:text-pink-200 dark:border-pink-700',
};

const SUBCHOICE_PREVIEW_TONE: Record<SubChoiceBadgeMeta['tone'], string> = {
  EMERALD: 'border-emerald-300/80 bg-emerald-500/10 text-emerald-900 dark:border-emerald-700/70 dark:text-emerald-200',
  AMBER: 'border-amber-300/80 bg-amber-500/10 text-amber-900 dark:border-amber-700/70 dark:text-amber-200',
  CORAL: 'border-orange-300/80 bg-orange-500/10 text-orange-900 dark:border-orange-700/70 dark:text-orange-200',
  VIOLET: 'border-violet-300/80 bg-violet-500/10 text-violet-900 dark:border-violet-700/70 dark:text-violet-200',
  INDIGO: 'border-indigo-300/80 bg-indigo-500/10 text-indigo-900 dark:border-indigo-700/70 dark:text-indigo-200',
  ROSE: 'border-rose-300/80 bg-rose-500/10 text-rose-900 dark:border-rose-700/70 dark:text-rose-200',
  GOLD: 'border-yellow-300/80 bg-yellow-500/10 text-yellow-900 dark:border-yellow-700/70 dark:text-yellow-200',
  SLATE: 'border-slate-300/80 bg-slate-500/10 text-slate-800 dark:border-slate-700/70 dark:text-slate-200',
};

interface DossierCardProps {
  readonly dossier: ExecutiveDossier;
  readonly tier: AiPriorityTier;
  readonly reason: string;
  readonly world: WorldState;
  readonly philosophyCounters: Record<string, number>;
  readonly aiPrioritize: boolean;
  readonly isExpanded: boolean;
  readonly onToggleExpand: (id: string) => void;
  readonly onInspectSector: (tileIndex: number) => void;
  readonly onOpenBuilding3D: (districtId: string) => void;
  readonly onOpenHangar: () => void;
  readonly onSelectDossier: (id: string) => void;
}

/**
 * [L7] EXW.L7.DOSSIER_CARD | v5.1.0 | SADT A2.1
 * Focused executive dossier card with provenance links, 3-tier badges, and expandable 4-option preview.
 */
export function DossierCard({
  dossier: dos,
  tier,
  reason,
  world,
  philosophyCounters,
  aiPrioritize,
  isExpanded,
  onToggleExpand,
  onInspectSector,
  onOpenBuilding3D,
  onOpenHangar,
  onSelectDossier,
}: DossierCardProps) {
  const expandedOptions = getEffectiveOptionsForDossier(dos);
  const hasZeroPa = expandedOptions.some((o) => o.paGeneralCost === 0 && o.subPaCost === 0);
  const isLive = dos.source === 'ORACLE_GEMINI';
  const ctx = resolveDossierContext(world, dos);
  const isUrgent = dos.dossierClass === 'P0' || ctx.urgency.level === 'CRITICAL';
  const primaryOpt = expandedOptions[0];
  const badgeTriplets = [
    buildProvenanceBadgeTriplet(dos),
    ...(primaryOpt ? [buildPhilosophyBadgeTriplet(primaryOpt, philosophyCounters)] : []),
  ];

  return (
    <article
      data-testid={`event-card-${dos.id}`}
      className={`rounded-2xl border p-4 transition ${
        isUrgent
          ? 'border-rose-400/90 bg-rose-50/70 shadow-xs hover:border-rose-500 dark:border-rose-500/70 dark:bg-rose-950/35'
          : 'border-rose-200/85 bg-white/95 hover:border-rose-300 dark:border-rose-900/55 dark:bg-[#190d1f]'
      }`}
    >
      {/* Top Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10.5px]">
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
                  ? 'border-amber-400/80 bg-amber-500/12 text-amber-800 dark:text-amber-200'
                  : 'border-fuchsia-400/80 bg-fuchsia-500/12 text-fuchsia-800 dark:text-fuchsia-200'
              }`}
            >
              {tier === 'RECOMMENDED' ? '★ Prioritaire IA' : '◆ Pertinent'}
            </span>
          )}
          <span className="text-rose-900/65 dark:text-rose-200/70">
            {dos.expiresInCycles} tour(s){hasZeroPa ? ' · Option 0 PA' : ''}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onToggleExpand(dos.id)}
          aria-expanded={isExpanded}
          className="inline-flex min-h-[30px] shrink-0 items-center gap-1 rounded-lg border border-rose-200/90 bg-white/90 px-2.5 font-mono text-[10.5px] font-semibold text-rose-900 whitespace-nowrap hover:border-rose-400 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
        >
          <span>{isExpanded ? 'Masquer aperçu' : `Aperçu (${expandedOptions.length} choix)`}</span>
          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Title & Briefing */}
      <h3
        className={`mt-2.5 font-display text-[15px] font-bold leading-snug text-[#1f1224] dark:text-rose-50 ${
          isLive ? 'underline decoration-rose-400/70 decoration-dotted underline-offset-4' : ''
        }`}
      >
        <RichEntityText text={dos.title} interactive />
      </h3>

      <p className="mt-1.5 text-xs leading-relaxed text-rose-950/80 dark:text-rose-100/80">
        <RichEntityText text={dos.briefing} interactive />
      </p>

      {/* Provenance & Direct Entity Links */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
          <button
            type="button"
            onClick={() => onInspectSector(ctx.tileIndex)}
            className="exo-accent-chip inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold"
          >
            <MapPin className="h-3 w-3 shrink-0 exo-accent-text" />
            <span>{ctx.placeLabel}</span>
          </button>
          {ctx.building && (
            <button
              type="button"
              onClick={() => onOpenBuilding3D(ctx.building!.id)}
              title="Ouvrir le modèle 3D isolé du bâtiment (B3D)"
              className="inline-flex items-center gap-1 rounded-md border border-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-900 hover:bg-emerald-500/20 dark:border-emerald-700 dark:text-emerald-100"
            >
              <Box className="h-3 w-3 shrink-0" />
              <span>{ctx.building.name} · 3D ({ctx.building.integrity}%)</span>
            </button>
          )}
          {(dos.dossierClass === 'C3' || dos.dossierClass === 'C5') && (
            <button
              type="button"
              onClick={onOpenHangar}
              className="inline-flex items-center gap-1 rounded-md border border-amber-300/80 bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-950 hover:bg-amber-500/20 dark:border-amber-700 dark:text-amber-100"
            >
              <Rocket className="h-3 w-3 shrink-0" />
              <span>Flotte 3D</span>
            </button>
          )}
          {ctx.advisor && (
            <span className="inline-flex items-center gap-1 rounded-md border border-rose-200/80 bg-rose-50/70 px-2 py-0.5 font-semibold text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
              <User className="h-3 w-3 shrink-0" />
              <span>{ctx.advisor.name}</span>
            </span>
          )}
        </div>
        <NestedBadgeGroup triplets={badgeTriplets} />
      </div>

      {/* Expandable Option & Sub-Choice Preview */}
      {isExpanded && (
        <div className="mt-3 grid gap-2 border-t border-rose-200/70 pt-3 sm:grid-cols-2 dark:border-rose-900/50">
          {expandedOptions.map((opt) => {
            const subChoices = getSubChoicesForOption(opt, dos.dossierClass);
            return (
              <div
                key={opt.id}
                className="flex flex-col justify-between rounded-xl border border-rose-200/80 bg-rose-50/40 p-2.5 text-[11px] dark:border-rose-900/50 dark:bg-rose-950/25"
              >
                <div>
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
                  <p className="mt-1 text-[10.5px] leading-snug text-rose-900/75 dark:text-rose-200/75">
                    {opt.description}
                  </p>
                </div>

                <div className="mt-2 flex flex-wrap gap-1 border-t border-rose-200/50 pt-1.5 dark:border-rose-900/40">
                  {subChoices.map((sc) => {
                    const meta = getSubChoiceBadgeMeta(sc);
                    return (
                      <span
                        key={sc.id}
                        title={`${sc.label} — ${meta.focusTag} (${meta.costTag})`}
                        className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[9.5px] font-bold ${SUBCHOICE_PREVIEW_TONE[meta.tone]}`}
                      >
                        <span>{meta.modeTag}</span>
                        <span className="opacity-70">{meta.costTag}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Card Action Footer */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-rose-200/70 pt-2.5 dark:border-rose-900/50">
        <span className="font-mono text-[10.5px] font-medium text-rose-800/75 dark:text-rose-300/80">
          {expandedOptions.length} décisions · {expandedOptions.length * 3} modalités d’exécution
        </span>
        <button
          type="button"
          onClick={() => onSelectDossier(dos.id)}
          className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 font-mono text-[11px] font-bold text-white shadow-xs whitespace-nowrap hover:bg-rose-500"
        >
          <span>Traiter</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}
