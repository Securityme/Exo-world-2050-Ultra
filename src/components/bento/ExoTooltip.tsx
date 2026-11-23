import { useId, useRef, useState, type ReactNode } from 'react';

/**
 * [L7] EXW.L7.EXO_TOOLTIP | v1.6.0 | Astralis Snapshot V7
 * Viewport-safe contextual tooltip (hover, keyboard focus, touch long-press)
 * using fixed coordinates so overflow-hidden / scrollable HUD strips never clip it.
 */
export interface ExoTooltipProps {
  readonly title: string;
  readonly body: string;
  readonly formula?: string;
  readonly accent?: 'cyan' | 'amber' | 'emerald' | 'coral';
  readonly position?: 'top' | 'bottom';
  readonly align?: 'left' | 'center' | 'right';
  readonly children: ReactNode;
}

const ACCENT_BORDER: Record<NonNullable<ExoTooltipProps['accent']>, string> = {
  cyan: 'border-cyan-500/65 dark:border-cyan-400/70 shadow-[0_14px_34px_rgba(2,10,24,0.85),inset_0_1px_0_rgba(0,240,255,0.22)]',
  amber: 'border-amber-500/70 dark:border-amber-400/70 shadow-[0_14px_34px_rgba(24,14,2,0.82),inset_0_1px_0_rgba(255,184,0,0.2)]',
  emerald: 'border-emerald-500/65 dark:border-emerald-400/70 shadow-[0_14px_34px_rgba(2,22,16,0.82),inset_0_1px_0_rgba(16,185,129,0.22)]',
  coral: 'border-rose-500/70 dark:border-rose-400/70 shadow-[0_14px_34px_rgba(24,6,14,0.82),inset_0_1px_0_rgba(251,113,133,0.2)]',
};

const ACCENT_TITLE: Record<NonNullable<ExoTooltipProps['accent']>, string> = {
  cyan: 'text-cyan-700 dark:text-cyan-300',
  amber: 'text-amber-700 dark:text-amber-300',
  emerald: 'text-emerald-700 dark:text-emerald-300',
  coral: 'text-rose-700 dark:text-rose-300',
};

interface FixedCoords {
  readonly top: number;
  readonly left: number;
  readonly placeAbove: boolean;
}

export function ExoTooltip({
  title,
  body,
  formula,
  accent = 'cyan',
  position = 'bottom',
  align = 'center',
  children,
}: ExoTooltipProps) {
  const [coords, setCoords] = useState<FixedCoords | null>(null);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const tooltipId = useId();

  const openTooltip = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.min(280, Math.max(200, window.innerWidth - 24));
    let left =
      align === 'left'
        ? rect.left
        : align === 'right'
          ? rect.right - width
          : rect.left + rect.width / 2 - width / 2;
    left = Math.max(12, Math.min(window.innerWidth - width - 12, left));
    const preferAbove = position === 'top' || rect.bottom + 140 > window.innerHeight;
    const top = preferAbove ? Math.max(12, rect.top - 10) : Math.min(window.innerHeight - 120, rect.bottom + 10);
    setCoords({ top, left, placeAbove: preferAbove });
  };

  const closeTooltip = () => setCoords(null);

  const clearLongPress = () => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleTouchStart = () => {
    clearLongPress();
    pressTimerRef.current = window.setTimeout(() => {
      if (coords) closeTooltip();
      else openTooltip();
    }, 360);
  };

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex max-w-full"
      onMouseEnter={openTooltip}
      onMouseLeave={closeTooltip}
      onFocus={openTooltip}
      onBlur={closeTooltip}
      onTouchStart={handleTouchStart}
      onTouchEnd={clearLongPress}
      onTouchCancel={clearLongPress}
      aria-describedby={coords ? tooltipId : undefined}
    >
      {children}
      {coords && (
        <span
          id={tooltipId}
          role="tooltip"
          style={{
            top: coords.top,
            left: coords.left,
            transform: coords.placeAbove ? 'translateY(-100%)' : undefined,
          }}
          className={`pointer-events-none fixed z-[90] w-[min(280px,calc(100vw-24px))] rounded-xl border bg-[var(--exo-surface)] p-3 text-left text-[var(--exo-text)] ${ACCENT_BORDER[accent]}`}
        >
          <span className={`block font-display text-[11px] font-bold tracking-wide ${ACCENT_TITLE[accent]}`}>
            {title}
          </span>
          {formula && (
            <span className="mt-1 block rounded-md border border-cyan-500/35 bg-[var(--exo-surface-alt)] px-2 py-1 font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
              {formula}
            </span>
          )}
          <span className="mt-1.5 block text-[11px] leading-relaxed text-[var(--exo-text)]">
            {body}
          </span>
        </span>
      )}
    </span>
  );
}
