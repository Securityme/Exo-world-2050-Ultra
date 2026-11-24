import { ART_MANIFEST } from '../data/art-manifest.data.ts';

/**
 * [L7] EXO WORLD : 2050 — Iconic App Miniature & Title Lockup.
 * Pairs the bespoke orbital-ring planet emblem with the theme-driven title typography.
 */
export function ExoTitleEmblem() {
  return (
    <div className="flex items-center gap-4">
      <div
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-[var(--exo-accent)] bg-[var(--exo-void)] sm:h-[72px] sm:w-[72px]"
        style={{
          boxShadow: '0 8px 24px rgba(var(--exo-accent-rgb), 0.38)',
        }}
      >
        <img
          src={ART_MANIFEST.appIcon}
          alt="Miniature officielle EXO WORLD : 2050"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      </div>
      <div>
        <h1 className="font-display text-3xl font-bold tracking-[0.14em] text-[var(--exo-text)] sm:text-4xl">
          EXO WORLD <span className="exo-accent-2-text">:</span>{' '}
          <span className="exo-accent-text">2050</span>
        </h1>
      </div>
    </div>
  );
}
