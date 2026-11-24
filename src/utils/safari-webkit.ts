import type { SafariZoomAdaptMode } from '../contracts/ui-theme.schema.ts';

/**
 * [L5] EXW.L5.SAFARI_WEBKIT_UTILS | v5.1.0 | SADT A5.1
 * Native Safari / iPhone / macOS / Google AI Studio Preview App Shell zoom & adaptation helpers:
 * - Probes WebKit Dynamic Type via computed `-apple-system-body` font-size
 * - Detects browser / Safari zoom (`visualViewport.scale`, desktop outer/inner ratio)
 * - Combines player App Shell zoom levels (70%..150%) with Safari & OS adaptation profiles
 */

export const SHELL_ZOOM_MIN_PCT = 70;
export const SHELL_ZOOM_MAX_PCT = 150;
export const SHELL_ZOOM_STEP_PCT = 5;
export const SHELL_ZOOM_PRESETS = [75, 85, 90, 100, 110, 120, 135, 150] as const;

export interface FontScaleInput {
  readonly manualPct: number;
  readonly safariSyncEnabled: boolean;
  readonly systemBodyPx: number;
  readonly adaptMode?: SafariZoomAdaptMode;
  readonly browserZoomRatio?: number;
  readonly viewportWidthPx?: number;
}

export interface FontScaleResult {
  readonly safariSystemRatio: number;
  readonly browserZoomCompensation: number;
  readonly modeMultiplier: number;
  readonly manualRatio: number;
  readonly effectiveScale: number;
  readonly effectiveRootPx: number;
  readonly shellGapScale: number;
}

export interface WebkitEnvironmentSnapshot {
  readonly isSafariEngine: boolean;
  readonly isIosDevice: boolean;
  readonly isAiStudioIframe: boolean;
  readonly viewportWidthPx: number;
  readonly viewportHeightDvhPx: number;
  readonly devicePixelRatio: number;
  readonly visualViewportScale: number;
  readonly browserZoomPct: number;
  readonly systemFontRatio: number;
  readonly platformLabel: string;
}

export function clampShellZoomPct(value: number): number {
  const safe = Number.isFinite(value) ? value : 100;
  return Math.max(SHELL_ZOOM_MIN_PCT, Math.min(SHELL_ZOOM_MAX_PCT, Math.round(safe)));
}

export function stepShellZoom(currentPct: number, deltaPct: number): number {
  const base = clampShellZoomPct(currentPct);
  const snapped = Math.round((base + deltaPct) / SHELL_ZOOM_STEP_PCT) * SHELL_ZOOM_STEP_PCT;
  return clampShellZoomPct(snapped);
}

export function computeEffectiveFontScale(input: FontScaleInput): FontScaleResult {
  const safeManual = clampShellZoomPct(input.manualPct);
  const manualRatio = Number((safeManual / 100).toFixed(3));
  const adaptMode: SafariZoomAdaptMode = input.adaptMode ?? 'AUTO_SYSTEM';

  const rawSystemRatio =
    Number.isFinite(input.systemBodyPx) && input.systemBodyPx > 0
      ? input.systemBodyPx / 16
      : 1;

  // MANUAL_LOCK ignores OS Dynamic Type & Safari zoom adjustments
  const applySystemSync = adaptMode !== 'MANUAL_LOCK' && input.safariSyncEnabled;
  const safariSystemRatio = applySystemSync
    ? Math.max(0.8, Math.min(1.45, Number(rawSystemRatio.toFixed(3))))
    : 1;

  // Profile multiplier tuned for Safari macOS/iPad/iPhone & App Shell ergonomics
  const modeMultiplier =
    adaptMode === 'SAFARI_COMPACT'
      ? 0.92
      : adaptMode === 'SAFARI_COMFORT'
        ? 1.08
        : 1;

  // Compensate gently when Safari/browser page zoom (>1.12x) or narrow viewport (<430px)
  // would otherwise stack with large root rem scaling and clip modal tabs/controls.
  const rawBrowserZoom =
    Number.isFinite(input.browserZoomRatio) && (input.browserZoomRatio ?? 0) > 0
      ? input.browserZoomRatio!
      : 1;
  const viewportWidth =
    Number.isFinite(input.viewportWidthPx) && (input.viewportWidthPx ?? 0) > 0
      ? input.viewportWidthPx!
      : 1440;

  let browserZoomCompensation = 1;
  if (adaptMode !== 'MANUAL_LOCK') {
    if (rawBrowserZoom > 1.12) {
      // Softly damp stacked Safari zoom (never over-shrink below 0.84x)
      browserZoomCompensation = Math.max(0.84, Number((1 / Math.sqrt(rawBrowserZoom)).toFixed(3)));
    } else if (rawBrowserZoom < 0.88) {
      // Slightly boost readability if Safari browser is zoomed far out
      browserZoomCompensation = Math.min(1.12, Number((1 / Math.sqrt(rawBrowserZoom)).toFixed(3)));
    }
    if (viewportWidth <= 420 && adaptMode === 'AUTO_SYSTEM' && manualRatio > 1.15) {
      // Keep mobile Safari modals & tabs from overflowing horizontally at extreme zoom
      browserZoomCompensation = Number((browserZoomCompensation * 0.94).toFixed(3));
    }
  }

  const rawEffective = manualRatio * safariSystemRatio * modeMultiplier * browserZoomCompensation;
  const effectiveScale = Math.max(0.68, Math.min(1.62, Number(rawEffective.toFixed(3))));
  const effectiveRootPx = Number((16 * effectiveScale).toFixed(2));
  const shellGapScale = Math.max(0.82, Math.min(1.22, Number((0.65 + effectiveScale * 0.35).toFixed(3))));

  return {
    safariSystemRatio,
    browserZoomCompensation,
    modeMultiplier,
    manualRatio,
    effectiveScale,
    effectiveRootPx,
    shellGapScale,
  };
}

export function probeSafariSystemFontPx(): number {
  if (typeof document === 'undefined' || typeof window === 'undefined' || !document.body) {
    return 16;
  }
  try {
    const probe = document.createElement('span');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.position = 'fixed';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    probe.style.font = '-apple-system-body';
    // Non-WebKit browsers ignore `-apple-system-body`, leaving `probe.style.font` empty
    // and falling back to inherited `html { font-size }`. Guard against feedback loops.
    if (!probe.style.font || !probe.style.font.includes('-apple-system-body')) {
      return 16;
    }
    probe.textContent = 'Ag';
    document.body.appendChild(probe);
    const computed = window.getComputedStyle(probe).fontSize;
    document.body.removeChild(probe);
    const parsed = Number.parseFloat(computed);
    return Number.isFinite(parsed) && parsed >= 10 && parsed <= 32 ? parsed : 16;
  } catch {
    return 16;
  }
}

export function detectWebkitEnvironment(): WebkitEnvironmentSnapshot {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isSafariEngine: false,
      isIosDevice: false,
      isAiStudioIframe: false,
      viewportWidthPx: 1440,
      viewportHeightDvhPx: 900,
      devicePixelRatio: 1,
      visualViewportScale: 1,
      browserZoomPct: 100,
      systemFontRatio: 1,
      platformLabel: 'Bureau Standard',
    };
  }
  const ua = navigator.userAgent ?? '';
  const isIosDevice =
    /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafariEngine =
    /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg/i.test(ua);
  let isAiStudioIframe = false;
  try {
    isAiStudioIframe = window.self !== window.top;
  } catch {
    isAiStudioIframe = true;
  }

  const viewportWidthPx = window.innerWidth || 1440;
  const viewportHeightDvhPx = window.innerHeight || 900;
  const visualViewportScale = Number((window.visualViewport?.scale ?? 1).toFixed(2));

  // Estimate Safari / desktop page zoom safely without false positives inside iframes
  let estimatedRatio = visualViewportScale;
  if (!isAiStudioIframe && !isIosDevice && window.outerWidth > 0 && viewportWidthPx > 0) {
    const ratio = window.outerWidth / viewportWidthPx;
    if (Number.isFinite(ratio) && ratio >= 0.5 && ratio <= 2.5 && Math.abs(ratio - 1) > 0.04) {
      estimatedRatio = ratio;
    }
  }
  const browserZoomPct = Math.max(50, Math.min(250, Math.round(estimatedRatio * 100)));

  const systemPx = probeSafariSystemFontPx();
  const platformLabel = isIosDevice
    ? 'Safari iOS / iPadOS'
    : isSafariEngine
      ? 'Safari macOS (WebKit)'
      : isAiStudioIframe
        ? 'Preview AI Studio'
        : 'Navigateur Bureau';

  return {
    isSafariEngine,
    isIosDevice,
    isAiStudioIframe,
    viewportWidthPx,
    viewportHeightDvhPx,
    devicePixelRatio: Math.min(3, Number((window.devicePixelRatio || 1).toFixed(2))),
    visualViewportScale,
    browserZoomPct,
    systemFontRatio: Number((systemPx / 16).toFixed(3)),
    platformLabel,
  };
}
