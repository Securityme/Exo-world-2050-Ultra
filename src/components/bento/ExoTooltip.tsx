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
  cyan: 'exo-accent-border',
  amber: 'border-amber-500/65 dark:border-amber-400/65',
  emerald: 'border-emerald-500/60 dark:border-emerald-400/60',
  coral: 'border-rose-500/65 dark:border-rose-400/65',
};

const ACCENT_TITLE: Record<NonNullable<ExoTooltipProps['accent']>, string> = {
  cyan: 'exo-accent-text',
  amber: 'text-amber-600 dark:text-amber-300',
  emerald: 'text-emerald-600 dark:text-emerald-300',
  coral: 'text-rose-600 dark:text-rose-300',
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
          className={`pointer-events-none fixed z-[90] w-[280px] rounded-xl border bg-[var(--exo-surface)] p-3 text-left shadow-xl ${ACCENT_BORDER[accent]}`}
        >
          <span className={`block font-display text-[11px] font-bold tracking-wide ${ACCENT_TITLE[accent]}`}>
            {title}
          </span>
          {formula && (
            <span className="mt-1 block rounded-md border exo-accent-border bg-[var(--exo-surface-alt)] px-2 py-1 font-mono text-[10px] font-semibold exo-accent-2-text">
              {formula}
            </span>
          )}
          <span className="mt-1.5 block text-[11px] leading-relaxed text-[var(--exo-text)] opacity-90">
            {body}
          </span>
        </span>
      )}
    </span>
  );
}
