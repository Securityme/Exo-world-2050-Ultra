import { useEffect, useState } from 'react';
import { useExoStore } from '../stores/game.store.ts';

/**
 * [L5] Responsive Viewport & Ergonomics Hook.
 * Mobile-first by default below 768px when layoutMode is 'AUTO',
 * with explicit overrides for 'MOBILE' and 'DESKTOP' (Mode Ordinateur).
 */
export function useViewportLayout() {
  const layoutMode = useExoStore((s) => s.graphics.layoutMode);
  const updateGraphics = useExoStore((s) => s.updateGraphics);

  const [viewportIsMobile, setViewportIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(max-width: 767px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (evt: MediaQueryListEvent) => setViewportIsMobile(evt.matches);
    setViewportIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const isMobile =
    layoutMode === 'MOBILE' ? true : layoutMode === 'DESKTOP' ? false : viewportIsMobile;

  return {
    isMobile,
    viewportIsMobile,
    layoutMode,
    setLayoutMode: (mode: 'AUTO' | 'MOBILE' | 'DESKTOP') => updateGraphics({ layoutMode: mode }),
  };
}
