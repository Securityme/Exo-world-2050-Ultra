import { useEffect, useMemo, useState } from 'react';
import {
  resolveThemeSnapshot,
  UI_THEME_STORAGE_KEY,
} from '../data/ui-themes.catalog.ts';
import type { ResolvedThemeSnapshot } from '../contracts/ui-theme.schema.ts';
import { useExoStore } from '../stores/game.store.ts';
import {
  computeEffectiveFontScale,
  detectWebkitEnvironment,
  probeSafariSystemFontPx,
} from '../utils/safari-webkit.ts';

/**
 * [L6] EXW.L6.THEME_ENGINE_HOOK | v5.1.0 | SADT A5.1
 * Synchronizes UiThemeStudioConfig + Safari Dynamic Type (-apple-system-body) +
 * browser/visualViewport zoom + active weather with document CSS custom properties,
 * root rem App Shell scale, localStorage, and Three.js themeMode.
 */
function readOsPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

interface ViewportZoomMetrics {
  readonly safariBodyPx: number;
  readonly browserZoomRatio: number;
  readonly viewportWidthPx: number;
}

function readViewportZoomMetrics(): ViewportZoomMetrics {
  const env = detectWebkitEnvironment();
  return {
    safariBodyPx: probeSafariSystemFontPx(),
    browserZoomRatio: env.browserZoomPct / 100,
    viewportWidthPx: env.viewportWidthPx,
  };
}

export function useThemeEngine(): ResolvedThemeSnapshot {
  const uiTheme = useExoStore((s) => s.uiTheme);
  const weatherState = useExoStore((s) => s.world.weatherState);
  const currentThemeMode = useExoStore((s) => s.graphics.themeMode);
  const updateGraphics = useExoStore((s) => s.updateGraphics);
  const [osPrefersDark, setOsPrefersDark] = useState<boolean>(readOsPrefersDark);
  const [zoomMetrics, setZoomMetrics] = useState<ViewportZoomMetrics>(() =>
    readViewportZoomMetrics(),
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setOsPrefersDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const refreshProbe = () => setZoomMetrics(readViewportZoomMetrics());
    refreshProbe();
    window.addEventListener('resize', refreshProbe, { passive: true });
    window.addEventListener('focus', refreshProbe);
    document.addEventListener('visibilitychange', refreshProbe);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', refreshProbe);
    return () => {
      window.removeEventListener('resize', refreshProbe);
      window.removeEventListener('focus', refreshProbe);
      document.removeEventListener('visibilitychange', refreshProbe);
      vv?.removeEventListener('resize', refreshProbe);
    };
  }, [uiTheme.safariTextSync, uiTheme.safariZoomAdaptMode]);

  const resolved = useMemo(
    () => resolveThemeSnapshot(uiTheme, osPrefersDark),
    [uiTheme, osPrefersDark],
  );

  const fontScaleMetrics = useMemo(
    () =>
      computeEffectiveFontScale({
        manualPct: uiTheme.fontScalePct ?? 100,
        safariSyncEnabled: uiTheme.safariTextSync ?? true,
        systemBodyPx: zoomMetrics.safariBodyPx,
        adaptMode: uiTheme.safariZoomAdaptMode ?? 'AUTO_SYSTEM',
        browserZoomRatio: zoomMetrics.browserZoomRatio,
        viewportWidthPx: zoomMetrics.viewportWidthPx,
      }),
    [
      uiTheme.fontScalePct,
      uiTheme.safariTextSync,
      uiTheme.safariZoomAdaptMode,
      zoomMetrics.safariBodyPx,
      zoomMetrics.browserZoomRatio,
      zoomMetrics.viewportWidthPx,
    ],
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
    root.dataset.exoSafariZoomMode = uiTheme.safariZoomAdaptMode ?? 'AUTO_SYSTEM';
    root.dataset.exoWeather = weatherState;

    for (const [key, val] of Object.entries(resolved.cssVars)) {
      root.style.setProperty(key, val);
    }
    root.style.setProperty('--exo-font-scale', String(fontScaleMetrics.effectiveScale));
    root.style.setProperty('--exo-shell-scale', String(fontScaleMetrics.effectiveScale));
    root.style.setProperty('--exo-shell-gap-scale', String(fontScaleMetrics.shellGapScale));
    root.style.setProperty('--exo-safari-ratio', String(fontScaleMetrics.safariSystemRatio));
    root.style.setProperty(
      '--exo-browser-zoom-comp',
      String(fontScaleMetrics.browserZoomCompensation),
    );
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
