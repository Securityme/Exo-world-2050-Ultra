/**
 * [L7] EXO WORLD : 2050 — Dynamic Theme-Driven Hexagonal Emblem.
 * Inherits --exo-accent, --exo-accent-2, --exo-void, and --exo-surface live from Theme Studio.
 */
export function ExoTitleEmblem() {
  return (
    <div className="flex items-center gap-4">
      <svg
        width="58"
        height="58"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
        style={{ filter: 'drop-shadow(0 6px 16px rgba(var(--exo-accent-rgb), 0.34))' }}
      >
        <polygon
          points="32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5"
          stroke="var(--exo-accent)"
          strokeWidth="2"
          fill="var(--exo-void)"
        />
        <polygon
          points="32,8 52,19.5 52,44.5 32,56 12,44.5 12,19.5"
          stroke="var(--exo-accent-2)"
          strokeOpacity="0.78"
          strokeWidth="1.2"
        />
        <ellipse
          cx="32"
          cy="32"
          rx="21"
          ry="8.5"
          transform="rotate(-24 32 32)"
          stroke="var(--exo-accent)"
          strokeWidth="1.8"
        />
        <circle
          cx="32"
          cy="32"
          r="8"
          fill="var(--exo-surface)"
          stroke="var(--exo-accent)"
          strokeWidth="1.8"
        />
        <circle cx="48" cy="24" r="2.6" fill="var(--exo-accent-2)" />
      </svg>
      <div>
        <h1 className="font-display text-3xl font-bold tracking-[0.14em] text-[var(--exo-text)] sm:text-4xl">
          EXO WORLD <span className="exo-accent-2-text">:</span>{' '}
          <span className="exo-accent-text">2050</span>
        </h1>
      </div>
    </div>
  );
}
