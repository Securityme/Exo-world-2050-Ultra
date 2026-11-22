import type { LucideIcon } from 'lucide-react';
import { Clock, Construction, Sparkles } from 'lucide-react';

/**
 * [L7] Reusable honest placeholder card for features explicitly marked as
 * "En cours de développement", "À implanter", or "Mise à jour prévue".
 */
export type RoadmapStatus = 'En cours de développement' | 'À implanter' | 'Mise à jour prévue';

interface RoadmapPlaceholderCardProps {
  readonly title: string;
  readonly description: string;
  readonly status: RoadmapStatus;
  readonly icon?: LucideIcon;
  readonly milestone?: string;
}

const STATUS_STYLE: Record<RoadmapStatus, string> = {
  'En cours de développement':
    'border-amber-300 bg-amber-500/15 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-200',
  'À implanter':
    'border-rose-300 bg-rose-500/12 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-200',
  'Mise à jour prévue':
    'border-fuchsia-300 bg-fuchsia-500/12 text-fuchsia-800 dark:border-fuchsia-500/40 dark:bg-fuchsia-500/20 dark:text-fuchsia-200',
};

export function RoadmapPlaceholderCard({
  title,
  description,
  status,
  icon,
  milestone,
}: RoadmapPlaceholderCardProps) {
  const Icon = icon ?? (status === 'En cours de développement' ? Construction : status === 'À implanter' ? Sparkles : Clock);

  return (
    <div className="rounded-xl border border-dashed border-rose-300/90 bg-rose-50/45 p-3.5 dark:border-rose-800/70 dark:bg-rose-950/20">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <Icon className="h-4 w-4" />
          </span>
          <h4 className="font-display text-sm font-bold text-[#1f1224] dark:text-rose-50">{title}</h4>
        </div>
        <span
          className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold ${STATUS_STYLE[status]}`}
        >
          {status}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-rose-950/75 dark:text-rose-100/75">{description}</p>
      {milestone && (
        <div className="mt-2 font-mono text-[10px] text-rose-800/70 dark:text-rose-300/75">
          Jalon cible : {milestone}
        </div>
      )}
    </div>
  );
}
