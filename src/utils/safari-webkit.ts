/**
 * [L5] EXW.L5.SAFARI_WEBKIT_UTILS | v5.0.0 | SADT A5.1
 * Native Safari / iPhone / Google AI Studio Preview adaptation helpers:
 * - Probes WebKit Dynamic Type via computed `-apple-system-body` font-size
 * - Combines Safari OS text ratio with player manual scale (85%..135%)
 * - Reports WebKit environment & safe-area / viewport-fit capabilities
 */

export interface FontScaleInput {
  readonly manualPct: number;
  readonly safariSyncEnabled: boolean;
  readonly systemBodyPx: number;
}

export interface FontScaleResult {
  readonly safariSystemRatio: number;
  readonly manualRatio: number;
  readonly effectiveScale: number;
  readonly effectiveRootPx: number;
}

export interface WebkitEnvironmentSnapshot {
  readonly isSafariEngine: boolean;
  readonly isIosDevice: boolean;
  readonly isAiStudioIframe: boolean;
  readonly viewportHeightDvhPx: number;
  readonly devicePixelRatio: number;
  readonly systemFontRatio: number;
}

export function computeEffectiveFontScale(input: FontScaleInput): FontScaleResult {
  const safeManual = Math.max(85, Math.min(135, Number.isFinite(input.manualPct) ? input.manualPct : 100));
  const manualRatio = safeManual / 100;
  const rawSystemRatio = Number.isFinite(input.systemBodyPx) && input.systemBodyPx > 0
    ? input.systemBodyPx / 16
    : 1;
  // Clamp Safari Dynamic Type ratio between 0.85x and 1.45x so HUD remains legible
  const safariSystemRatio = input.safariSyncEnabled
    ? Math.max(0.85, Math.min(1.45, Number(rawSystemRatio.toFixed(3))))
    : 1;
  const effectiveScale = Math.max(0.8, Math.min(1.55, Number((manualRatio * safariSystemRatio).toFixed(3))));
  const effectiveRootPx = Number((16 * effectiveScale).toFixed(2));
  return {
    safariSystemRatio,
    manualRatio,
    effectiveScale,
    effectiveRootPx,
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
      viewportHeightDvhPx: 900,
      devicePixelRatio: 1,
      systemFontRatio: 1,
    };
  }
  const ua = navigator.userAgent ?? '';
  const isIosDevice = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafariEngine =
    /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg/i.test(ua);
  let isAiStudioIframe = false;
  try {
    isAiStudioIframe = window.self !== window.top;
  } catch {
    isAiStudioIframe = true;
  }
  const systemPx = probeSafariSystemFontPx();
  return {
    isSafariEngine,
    isIosDevice,
    isAiStudioIframe,
    viewportHeightDvhPx: window.innerHeight || 900,
    devicePixelRatio: Math.min(2, window.devicePixelRatio || 1),
    systemFontRatio: Number((systemPx / 16).toFixed(3)),
  };
}
