import { useEffect, useMemo, useState } from 'react';
import {
  resolveThemeSnapshot,
  UI_THEME_STORAGE_KEY,
} from '../data/ui-themes.catalog.ts';
import type { ResolvedThemeSnapshot } from '../contracts/ui-theme.schema.ts';
import { useExoStore } from '../stores/game.store.ts';
import {
  computeEffectiveFontScale,
  probeSafariSystemFontPx,
} from '../utils/safari-webkit.ts';

/**
 * [L6] EXW.L6.THEME_ENGINE_HOOK | v5.0.0 | SADT A5.1
 * Synchronizes UiThemeStudioConfig + Safari Dynamic Type (-apple-system-body) + active weather
 * with document CSS custom properties, root rem font size, localStorage, and Three.js themeMode.
 */
function readOsPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useThemeEngine(): ResolvedThemeSnapshot {
  const uiTheme = useExoStore((s) => s.uiTheme);
  const weatherState = useExoStore((s) => s.world.weatherState);
  const currentThemeMode = useExoStore((s) => s.graphics.themeMode);
  const updateGraphics = useExoStore((s) => s.updateGraphics);
  const [osPrefersDark, setOsPrefersDark] = useState<boolean>(readOsPrefersDark);
  const [safariBodyPx, setSafariBodyPx] = useState<number>(() => probeSafariSystemFontPx());

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setOsPrefersDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const refreshProbe = () => setSafariBodyPx(probeSafariSystemFontPx());
    refreshProbe();
    window.addEventListener('resize', refreshProbe, { passive: true });
    window.addEventListener('focus', refreshProbe);
    document.addEventListener('visibilitychange', refreshProbe);
    return () => {
      window.removeEventListener('resize', refreshProbe);
      window.removeEventListener('focus', refreshProbe);
      document.removeEventListener('visibilitychange', refreshProbe);
    };
  }, [uiTheme.safariTextSync]);

  const resolved = useMemo(
    () => resolveThemeSnapshot(uiTheme, osPrefersDark),
    [uiTheme, osPrefersDark],
  );

  const fontScaleMetrics = useMemo(
    () =>
      computeEffectiveFontScale({
        manualPct: uiTheme.fontScalePct ?? 100,
        safariSyncEnabled: uiTheme.safariTextSync ?? true,
        systemBodyPx: safariBodyPx,
      }),
    [uiTheme.fontScalePct, uiTheme.safariTextSync, safariBodyPx],
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dark', resolved.isDark);
    root.dataset.exoTheme = uiTheme.presetId;
    root.dataset.exoDensity = uiTheme.uiDensity;
    root.dataset.exoCorners = uiTheme.cornerStyle;
    root.dataset.exoContrast = uiTheme.highContrast ? 'high' : 'normal';
    root.dataset.exoMotion = uiTheme.reducedMotion ? 'reduced' : 'full';
    root.dataset.exoTactile = uiTheme.tactileTargetBoost ?? true ? 'on' : 'off';
    root.dataset.exoWeather = weatherState;

    for (const [key, val] of Object.entries(resolved.cssVars)) {
      root.style.setProperty(key, val);
    }
    root.style.setProperty('--exo-font-scale', String(fontScaleMetrics.effectiveScale));
    root.style.setProperty('--exo-safari-ratio', String(fontScaleMetrics.safariSystemRatio));
    root.style.fontSize = `${fontScaleMetrics.effectiveRootPx}px`;

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', resolved.palette.voidHex);
    }

    try {
      window.localStorage.setItem(UI_THEME_STORAGE_KEY, JSON.stringify(uiTheme));
    } catch {
      // ignore storage quota errors
    }
  }, [resolved, uiTheme, fontScaleMetrics, weatherState]);

  // Keep Three.js SceneDiffPacket themeMode synchronized with resolved dark/light scheme
  useEffect(() => {
    const desiredMode = resolved.isDark ? 'DARK_BENTO' : 'LIGHT_ANNO';
    if (currentThemeMode !== desiredMode) {
      updateGraphics({ themeMode: desiredMode });
    }
  }, [resolved.isDark, currentThemeMode, updateGraphics]);

  return resolved;
}
