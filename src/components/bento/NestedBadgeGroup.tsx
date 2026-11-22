import { useState } from 'react';
import { Info, X } from 'lucide-react';
import type { BadgeColorTone, StackedBadgeTriplet } from '../../contracts/nested-badges.schema.ts';
import { BADGE_COLOR_LEGEND } from '../../data/philosophy-ethics.catalog.ts';

/**
 * [L7] EXW.L7.NESTED_BADGE_GROUP | v5.0.0 | SADT A2.1/A5.1
 * 3-Level Stacked Badge Display (Master -> Level 1 -> Level 2) with
 * right-aligned (i) Color & Sub-Badge Legend button + Modal.
 */
const TONE_CLASS: Record<BadgeColorTone, string> = {
  GOLD: 'border-amber-400/90 bg-amber-500/15 text-amber-800 dark:text-amber-200',
  ROSE: 'border-rose-400/90 bg-rose-500/15 text-rose-800 dark:text-rose-200',
  EMERALD: 'border-emerald-400/90 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  INDIGO: 'border-indigo-400/90 bg-indigo-500/15 text-indigo-800 dark:text-indigo-200',
  VIOLET: 'border-violet-400/90 bg-violet-500/15 text-violet-800 dark:text-violet-200',
  AMBER: 'border-orange-400/90 bg-orange-500/15 text-orange-800 dark:text-orange-200',
  CORAL: 'border-red-400/90 bg-red-500/15 text-red-800 dark:text-red-200',
  SLATE: 'border-slate-400/80 bg-slate-500/15 text-slate-700 dark:text-slate-200',
};

interface NestedBadgeGroupProps {
  readonly triplets: readonly StackedBadgeTriplet[];
  readonly compact?: boolean;
  readonly showLegendButton?: boolean;
}

export function NestedBadgeGroup({
  triplets,
  compact = false,
  showLegendButton = true,
}: NestedBadgeGroupProps) {
  const [legendOpen, setLegendOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {triplets.map((t) => (
          <div
            key={t.id}
            title={`${t.master.label} ▸ ${t.level1.label} ▸ ${t.level2.label} — ${t.level1.description}`}
            className={`inline-flex flex-wrap items-center gap-0.5 rounded-lg border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
              TONE_CLASS[t.master.tone]
            }`}
          >
            <span className="font-bold">{t.master.shortLabel}</span>
            <span className="opacity-55">▸</span>
            <span
              className={`rounded border px-1 py-0.25 text-[9.5px] ${TONE_CLASS[t.level1.tone]}`}
            >
              {t.level1.shortLabel}
            </span>
            {!compact && (
              <>
                <span className="opacity-55">▸</span>
                <span
                  className={`rounded border px-1 py-0.25 text-[9px] opacity-90 ${TONE_CLASS[t.level2.tone]}`}
                >
                  {t.level2.shortLabel}
                </span>
              </>
            )}
            {typeof t.cumulativeCount === 'number' && (
              <span className="ml-0.5 rounded bg-black/15 px-1 text-[9px] font-bold dark:bg-white/15">
                ×{t.cumulativeCount}
                {t.punctualDelta ? ` (+${t.punctualDelta})` : ''}
              </span>
            )}
          </div>
        ))}
      </div>

      {showLegendButton && (
        <button
          type="button"
          data-testid="badge-legend-info-btn"
          onClick={(e) => {
            e.stopPropagation();
            setLegendOpen(true);
          }}
          aria-label="Légende des couleurs des badges et sous-badges"
          title="Légende des badges, sous-badges et courants éthiques"
          className="exo-accent-chip inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
        >
          <Info className="h-3.5 w-3.5 exo-accent-text" />
        </button>
      )}

      {legendOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setLegendOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Légende des badges et courants philosophiques"
            onClick={(e) => e.stopPropagation()}
            className="exo-bento-card max-h-[82dvh] w-full max-w-lg overflow-y-auto p-4 text-xs"
          >
            <div className="mb-3 flex items-center justify-between border-b pb-2 exo-accent-border">
              <div>
                <h3 className="font-display text-sm font-bold exo-accent-text">
                  Légende des Badges (3 Niveaux : Maître ▸ N1 ▸ N2)
                </h3>
                <p className="text-[11px] exo-muted-text">
                  Couleurs de provenance IA et classification philosophique / éthique (ponctuel + cumulatif)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLegendOpen(false)}
                aria-label="Fermer la légende"
                className="exo-accent-chip inline-flex h-8 w-8 items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {BADGE_COLOR_LEGEND.map((item) => (
                <div
                  key={item.tone}
                  className={`rounded-lg border p-2 ${TONE_CLASS[item.tone]}`}
                >
                  <div className="font-mono text-[11px] font-bold">{item.label}</div>
                  <div className="mt-0.5 text-[11px] opacity-90">{item.meaning}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
