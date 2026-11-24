import { useState } from 'react';
import {
  Activity,
  Cpu,
  FlaskConical,
  Leaf,
  Shield,
  Wrench,
} from 'lucide-react';
import type { Colonist } from '../../contracts/world-state.schema.ts';

interface ColonistPortraitAvatarProps {
  readonly name: string;
  readonly specialty: Colonist['specialty'];
  readonly imageUrl?: string;
  readonly size?: 'sm' | 'md' | 'lg';
}

const SPECIALTY_THEME: Record<
  Colonist['specialty'],
  {
    readonly bgA: string;
    readonly bgB: string;
    readonly visor: string;
    readonly suit: string;
    readonly badgeLabel: string;
    readonly Icon: typeof Wrench;
  }
> = {
  ENGINEERING: {
    bgA: '#1e1b4b',
    bgB: '#f59e0b',
    visor: '#38bdf8',
    suit: '#eab308',
    badgeLabel: 'Ingénierie',
    Icon: Wrench,
  },
  AGRONOMY: {
    bgA: '#064e3b',
    bgB: '#10b981',
    visor: '#a7f3d0',
    suit: '#059669',
    badgeLabel: 'Agronomie',
    Icon: Leaf,
  },
  CYBERNETICS: {
    bgA: '#0f172a',
    bgB: '#06b6d4',
    visor: '#22d3ee',
    suit: '#0284c7',
    badgeLabel: 'Cybernétique',
    Icon: Cpu,
  },
  SECURITY: {
    bgA: '#3b0764',
    bgB: '#f43f5e',
    visor: '#fda4af',
    suit: '#e11d48',
    badgeLabel: 'Sécurité',
    Icon: Shield,
  },
  EXOBIOLOGY: {
    bgA: '#1e1b4b',
    bgB: '#a855f7',
    visor: '#c4b5fd',
    suit: '#7c3aed',
    badgeLabel: 'Exobiologie',
    Icon: FlaskConical,
  },
};

const SIZE_CLASSES = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-56 w-full',
} as const;

/**
 * [L7] Bespoke procedural SVG colonist portrait + specialty badge with clean raster fallback.
 */
export function ColonistPortraitAvatar({
  name,
  specialty,
  imageUrl,
  size = 'md',
}: ColonistPortraitAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const theme = SPECIALTY_THEME[specialty];
  const BadgeIcon = theme.Icon;
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div
      className={`relative overflow-hidden rounded-xl border exo-accent-border bg-[#0b1020] ${SIZE_CLASSES[size]}`}
    >
      {imageUrl && !imgFailed ? (
        <img
          src={imageUrl}
          alt={name}
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <svg viewBox="0 0 120 120" className="h-full w-full" aria-label={name}>
          <defs>
            <linearGradient id={`col-bg-${specialty}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={theme.bgA} />
              <stop offset="100%" stopColor={theme.bgB} stopOpacity="0.45" />
            </linearGradient>
          </defs>
          <rect width="120" height="120" fill={`url(#col-bg-${specialty})`} />
          <circle cx="60" cy="44" r="21" fill="#e2e8f0" />
          <path d="M26 118c4-28 20-40 34-40s30 12 34 40Z" fill={theme.suit} />
          <rect x="44" y="34" width="32" height="14" rx="7" fill={theme.visor} opacity="0.9" />
          <rect x="48" y="88" width="24" height="14" rx="4" fill="#0f172a" opacity="0.6" />
          <text
            x="60"
            y="98"
            textAnchor="middle"
            fontSize="9"
            fontWeight="bold"
            fill="#f8fafc"
            fontFamily="monospace"
          >
            {initials || 'EX'}
          </text>
        </svg>
      )}
      <span
        title={theme.badgeLabel}
        className="absolute bottom-1 left-1 inline-flex items-center gap-0.5 rounded bg-slate-950/85 px-1 py-0.5 font-mono text-[9px] font-bold text-cyan-200 border border-cyan-400/40"
      >
        {BadgeIcon ? <BadgeIcon className="h-2.5 w-2.5" /> : <Activity className="h-2.5 w-2.5" />}
        {size === 'lg' && <span>{theme.badgeLabel}</span>}
      </span>
    </div>
  );
}
