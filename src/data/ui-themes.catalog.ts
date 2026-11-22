import type {
  CornerStyle,
  ResolvedThemeSnapshot,
  ShadowDepth,
  ThemePresetId,
  UiDensity,
  UiThemePresetDefinition,
  UiThemeStudioConfig,
  WallpaperDefinition,
  WallpaperId,
} from '../contracts/ui-theme.schema.ts';

/**
 * [L1] EXW.L1.UI_THEMES_CATALOG | v5.0.0 | SADT A5.1
 * 6 curated system themes (default: Rose Astralis — zero blue leaks), 9 wallpapers,
 * saturation/opacity/glow/text-scale/Safari-sync CSS variables computation.
 */
export const UI_THEME_STORAGE_KEY = 'exo_ui_theme_studio_v1';

export const DEFAULT_UI_THEME_STUDIO_CONFIG: UiThemeStudioConfig = {
  presetId: 'ROSE_ASTRAL',
  colorScheme: 'DARK',
  wallpaperId: 'KEYART_2050',
  wallpaperOpacity: 88,
  vignetteStrength: 58,
  glowIntensity: 62,
  bevelIntensity: 68,
  shadowDepth: 'TACTICAL',
  cornerTicks: true,
  uiDensity: 'STANDARD',
  cornerStyle: 'BEVELED',
  hudOpacity: 96,
  highContrast: false,
  reducedMotion: false,
  saturationPct: 100,
  fontScalePct: 100,
  safariTextSync: true,
  tactileTargetBoost: true,
  climateDynamicWallpaper: true,
};

export const UI_THEME_PRESETS: readonly UiThemePresetDefinition[] = [
  {
    id: 'ROSE_ASTRAL',
    label: 'Rose Astralis',
    subtitle: 'Signature Framboise, Prune Obsidienne & Or Solaire',
    defaultColorScheme: 'DARK',
    swatchedHex: ['#e11d48', '#fb7185', '#f59e0b'],
    dark: {
      voidHex: '#120818',
      surfaceHex: '#1b0d24',
      surfaceAltHex: '#261233',
      textHex: '#fff1f5',
      textMutedHex: '#e4b8c9',
      accentHex: '#fb7185',
      accentRgb: '251, 113, 133',
      accentOnHex: '#1a0712',
      accent2Hex: '#fbbf24',
      accent2Rgb: '251, 191, 36',
      accentSoftBg: 'rgba(244, 63, 94, 0.18)',
      surfaceGradStart: 'rgba(244, 63, 94, 0.14)',
      surfaceGradMid: 'rgba(26, 12, 34, 0.96)',
      surfaceGradEnd: 'rgba(16, 7, 22, 0.98)',
    },
    light: {
      voidHex: '#fff7fa',
      surfaceHex: '#ffffff',
      surfaceAltHex: '#fff0f5',
      textHex: '#1f1224',
      textMutedHex: '#7d4660',
      accentHex: '#e11d48',
      accentRgb: '225, 29, 72',
      accentOnHex: '#ffffff',
      accent2Hex: '#d97706',
      accent2Rgb: '217, 119, 6',
      accentSoftBg: 'rgba(225, 29, 72, 0.11)',
      surfaceGradStart: 'rgba(255, 255, 255, 0.99)',
      surfaceGradMid: 'rgba(255, 244, 248, 0.96)',
      surfaceGradEnd: 'rgba(255, 232, 241, 0.94)',
    },
  },
  {
    id: 'ASTRALIS_CYAN',
    label: 'Astralis Cyan V7',
    subtitle: 'Obsidienne spatiale, Cyan #00F0FF & Ambre orbital',
    defaultColorScheme: 'DARK',
    swatchedHex: ['#00F0FF', '#0ea5e9', '#FFB800'],
    dark: {
      voidHex: '#050811',
      surfaceHex: '#0a1224',
      surfaceAltHex: '#0f1c36',
      textHex: '#f0f9ff',
      textMutedHex: '#9cc6dd',
      accentHex: '#00F0FF',
      accentRgb: '0, 240, 255',
      accentOnHex: '#050811',
      accent2Hex: '#FFB800',
      accent2Rgb: '255, 184, 0',
      accentSoftBg: 'rgba(0, 240, 255, 0.15)',
      surfaceGradStart: 'rgba(0, 240, 255, 0.12)',
      surfaceGradMid: 'rgba(9, 15, 30, 0.96)',
      surfaceGradEnd: 'rgba(5, 8, 17, 0.98)',
    },
    light: {
      voidHex: '#f5f9fc',
      surfaceHex: '#ffffff',
      surfaceAltHex: '#ecf7fe',
      textHex: '#0f172a',
      textMutedHex: '#47657d',
      accentHex: '#0284c7',
      accentRgb: '2, 132, 199',
      accentOnHex: '#ffffff',
      accent2Hex: '#d97706',
      accent2Rgb: '217, 119, 6',
      accentSoftBg: 'rgba(2, 132, 199, 0.12)',
      surfaceGradStart: 'rgba(255, 255, 255, 0.99)',
      surfaceGradMid: 'rgba(240, 249, 255, 0.96)',
      surfaceGradEnd: 'rgba(224, 242, 254, 0.94)',
    },
  },
  {
    id: 'EMERALD_P4',
    label: 'Biosphère Éden',
    subtitle: 'Canopée solarpunk, Vert Émeraude & Citron vital',
    defaultColorScheme: 'DARK',
    swatchedHex: ['#10b981', '#34d399', '#84cc16'],
    dark: {
      voidHex: '#061311',
      surfaceHex: '#0b201c',
      surfaceAltHex: '#102e28',
      textHex: '#ecfdf5',
      textMutedHex: '#9cd6c4',
      accentHex: '#34d399',
      accentRgb: '52, 211, 153',
      accentOnHex: '#051a14',
      accent2Hex: '#a3e635',
      accent2Rgb: '163, 230, 53',
      accentSoftBg: 'rgba(16, 185, 129, 0.18)',
      surfaceGradStart: 'rgba(16, 185, 129, 0.14)',
      surfaceGradMid: 'rgba(10, 29, 25, 0.96)',
      surfaceGradEnd: 'rgba(6, 19, 17, 0.98)',
    },
    light: {
      voidHex: '#f3fbf7',
      surfaceHex: '#ffffff',
      surfaceAltHex: '#e6f7ef',
      textHex: '#0a261f',
      textMutedHex: '#3d6e5e',
      accentHex: '#059669',
      accentRgb: '5, 150, 105',
      accentOnHex: '#ffffff',
      accent2Hex: '#65a30d',
      accent2Rgb: '101, 163, 13',
      accentSoftBg: 'rgba(5, 150, 105, 0.12)',
      surfaceGradStart: 'rgba(255, 255, 255, 0.99)',
      surfaceGradMid: 'rgba(236, 253, 245, 0.96)',
      surfaceGradEnd: 'rgba(209, 250, 229, 0.93)',
    },
  },
  {
    id: 'AMBER_ORBITAL',
    label: 'Ambre & Cuivre Orbital',
    subtitle: 'Graphite chaud, Or Cuivré & Magenta crépusculaire',
    defaultColorScheme: 'DARK',
    swatchedHex: ['#f59e0b', '#fbbf24', '#ec4899'],
    dark: {
      voidHex: '#140e09',
      surfaceHex: '#21170f',
      surfaceAltHex: '#2f2014',
      textHex: '#fffbeb',
      textMutedHex: '#dfbf96',
      accentHex: '#fbbf24',
      accentRgb: '251, 191, 36',
      accentOnHex: '#1c1105',
      accent2Hex: '#f472b6',
      accent2Rgb: '244, 114, 182',
      accentSoftBg: 'rgba(245, 158, 11, 0.18)',
      surfaceGradStart: 'rgba(245, 158, 11, 0.14)',
      surfaceGradMid: 'rgba(30, 21, 14, 0.96)',
      surfaceGradEnd: 'rgba(18, 12, 8, 0.98)',
    },
    light: {
      voidHex: '#fffaf2',
      surfaceHex: '#ffffff',
      surfaceAltHex: '#fef3e0',
      textHex: '#27190c',
      textMutedHex: '#7d5b34',
      accentHex: '#d97706',
      accentRgb: '217, 119, 6',
      accentOnHex: '#ffffff',
      accent2Hex: '#db2777',
      accent2Rgb: '219, 39, 119',
      accentSoftBg: 'rgba(217, 119, 6, 0.12)',
      surfaceGradStart: 'rgba(255, 255, 255, 0.99)',
      surfaceGradMid: 'rgba(255, 249, 235, 0.96)',
      surfaceGradEnd: 'rgba(254, 240, 210, 0.93)',
    },
  },
  {
    id: 'NEBULA_VIOLET',
    label: 'Violet Nébuleuse',
    subtitle: 'Indigo profond, Améthyste stellaire & Corail rose',
    defaultColorScheme: 'DARK',
    swatchedHex: ['#a855f7', '#c084fc', '#f43f5e'],
    dark: {
      voidHex: '#0e081a',
      surfaceHex: '#170e2b',
      surfaceAltHex: '#221540',
      textHex: '#faf5ff',
      textMutedHex: '#cbb3e8',
      accentHex: '#c084fc',
      accentRgb: '192, 132, 252',
      accentOnHex: '#150826',
      accent2Hex: '#fb7185',
      accent2Rgb: '251, 113, 133',
      accentSoftBg: 'rgba(168, 85, 247, 0.19)',
      surfaceGradStart: 'rgba(168, 85, 247, 0.15)',
      surfaceGradMid: 'rgba(22, 13, 41, 0.96)',
      surfaceGradEnd: 'rgba(13, 7, 25, 0.98)',
    },
    light: {
      voidHex: '#faf5ff',
      surfaceHex: '#ffffff',
      surfaceAltHex: '#f3e8ff',
      textHex: '#1f1035',
      textMutedHex: '#6b4d8e',
      accentHex: '#9333ea',
      accentRgb: '147, 51, 234',
      accentOnHex: '#ffffff',
      accent2Hex: '#e11d48',
      accent2Rgb: '225, 29, 72',
      accentSoftBg: 'rgba(147, 51, 234, 0.12)',
      surfaceGradStart: 'rgba(255, 255, 255, 0.99)',
      surfaceGradMid: 'rgba(249, 242, 255, 0.96)',
      surfaceGradEnd: 'rgba(240, 226, 255, 0.94)',
    },
  },
  {
    id: 'ANNO_DAYLIGHT',
    label: 'Clair Anno Diurne',
    subtitle: 'Albâtre minéral solaire, Rose Carmin & Or laiton',
    defaultColorScheme: 'LIGHT',
    swatchedHex: ['#f8fafc', '#e11d48', '#d97706'],
    dark: {
      voidHex: '#15121a',
      surfaceHex: '#211c28',
      surfaceAltHex: '#2c2536',
      textHex: '#f8fafc',
      textMutedHex: '#c7bed4',
      accentHex: '#fb7185',
      accentRgb: '251, 113, 133',
      accentOnHex: '#1d0a12',
      accent2Hex: '#f59e0b',
      accent2Rgb: '245, 158, 11',
      accentSoftBg: 'rgba(244, 63, 94, 0.18)',
      surfaceGradStart: 'rgba(244, 63, 94, 0.12)',
      surfaceGradMid: 'rgba(30, 25, 37, 0.96)',
      surfaceGradEnd: 'rgba(20, 17, 25, 0.98)',
    },
    light: {
      voidHex: '#f8fafc',
      surfaceHex: '#ffffff',
      surfaceAltHex: '#f1f5f9',
      textHex: '#18181b',
      textMutedHex: '#52525b',
      accentHex: '#e11d48',
      accentRgb: '225, 29, 72',
      accentOnHex: '#ffffff',
      accent2Hex: '#b45309',
      accent2Rgb: '180, 83, 9',
      accentSoftBg: 'rgba(225, 29, 72, 0.1)',
      surfaceGradStart: 'rgba(255, 255, 255, 0.99)',
      surfaceGradMid: 'rgba(248, 250, 252, 0.97)',
      surfaceGradEnd: 'rgba(241, 245, 249, 0.95)',
    },
  },
] as const;

export const WALLPAPER_CATALOG: readonly WallpaperDefinition[] = [
  { id: 'KEYART_2050', label: 'Cité 2050 (Key Art)', category: 'KEYART', artKey: 'MENU_2050' },
  { id: 'ERA_1', label: 'Ère I · Pionniers', category: 'ERA', artKey: 'ERA_1' },
  { id: 'ERA_2', label: 'Ère II · Fédération', category: 'ERA', artKey: 'ERA_2' },
  { id: 'ERA_3', label: 'Ère III · Symbiose', category: 'ERA', artKey: 'ERA_3' },
  { id: 'ERA_4', label: 'Ère IV · Biosphère', category: 'ERA', artKey: 'ERA_4' },
  { id: 'ERA_5', label: 'Ère V · Orbital', category: 'ERA', artKey: 'ERA_5' },
  { id: 'ERA_6', label: 'Ère VI · Transcendance', category: 'ERA', artKey: 'ERA_6' },
  { id: 'ASTROLABE_SVG', label: 'Astrolabe Orbital SVG', category: 'VECTOR', artKey: null },
  { id: 'PURE_VOID', label: 'Obsidienne / Albâtre Pur', category: 'VECTOR', artKey: null },
] as const;

const CORNER_RADIUS_MAP: Record<CornerStyle, { card: string; button: string }> = {
  SHARP: { card: '4px', button: '3px' },
  BEVELED: { card: '14px', button: '10px' },
  ROUNDED: { card: '22px', button: '14px' },
};

const DENSITY_SCALE_MAP: Record<UiDensity, string> = {
  COMPACT: '0.82',
  STANDARD: '1',
  COMFORT: '1.16',
};

function clampRange(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

export function getThemePreset(presetId: ThemePresetId): UiThemePresetDefinition {
  return UI_THEME_PRESETS.find((p) => p.id === presetId) ?? UI_THEME_PRESETS[0]!;
}

export function getWallpaperDef(wallpaperId: WallpaperId): WallpaperDefinition {
  return WALLPAPER_CATALOG.find((w) => w.id === wallpaperId) ?? WALLPAPER_CATALOG[0]!;
}

function buildShadowCss(depth: ShadowDepth, isDark: boolean, accentRgb: string, glowRatio: number): string {
  const glowSpread = Math.round(14 + glowRatio * 22);
  const glowAlpha = Number((glowRatio * (isDark ? 0.28 : 0.16)).toFixed(3));
  if (depth === 'FLAT') {
    return `0 0 0 1px rgba(${accentRgb}, ${(0.18 + glowAlpha).toFixed(3)})`;
  }
  if (depth === 'SOFT') {
    return isDark
      ? `0 8px 22px rgba(2, 4, 12, 0.55), 0 0 ${glowSpread}px rgba(${accentRgb}, ${glowAlpha})`
      : `0 6px 18px rgba(15, 23, 42, 0.08), 0 0 ${glowSpread}px rgba(${accentRgb}, ${glowAlpha})`;
  }
  if (depth === 'DEEP') {
    return isDark
      ? `0 22px 52px rgba(1, 2, 8, 0.94), 0 0 ${glowSpread + 12}px rgba(${accentRgb}, ${(glowAlpha * 1.25).toFixed(3)})`
      : `0 20px 44px rgba(15, 23, 42, 0.18), 0 0 ${glowSpread + 8}px rgba(${accentRgb}, ${(glowAlpha * 1.15).toFixed(3)})`;
  }
  return isDark
    ? `0 14px 36px rgba(2, 4, 12, 0.82), 0 0 ${glowSpread}px rgba(${accentRgb}, ${glowAlpha})`
    : `0 12px 30px rgba(15, 23, 42, 0.11), 0 0 ${glowSpread}px rgba(${accentRgb}, ${glowAlpha})`;
}

export function resolveThemeSnapshot(
  config: UiThemeStudioConfig,
  osPrefersDark: boolean,
): ResolvedThemeSnapshot {
  const preset = getThemePreset(config.presetId);
  const isDark =
    config.colorScheme === 'AUTO' ? osPrefersDark : config.colorScheme === 'DARK';
  const palette = isDark ? preset.dark : preset.light;
  const glowRatio = clampRange(config.glowIntensity) / 100;
  const bevelRatio = clampRange(config.bevelIntensity) / 100;
  const hudRatio = clampRange(config.hudOpacity, 60, 100) / 100;
  const satRatio = clampRange(config.saturationPct ?? 100, 50, 150) / 100;
  const fontScaleRatio = clampRange(config.fontScalePct ?? 100, 85, 135) / 100;
  const borderAlpha = config.highContrast
    ? isDark
      ? 0.72
      : 0.62
    : Number((isDark ? 0.24 + bevelRatio * 0.24 : 0.2 + bevelRatio * 0.22).toFixed(3));
  const corners = CORNER_RADIUS_MAP[config.cornerStyle];

  const cssVars: Record<string, string> = {
    '--exo-void': palette.voidHex,
    '--exo-surface': palette.surfaceHex,
    '--exo-surface-alt': palette.surfaceAltHex,
    '--exo-text': palette.textHex,
    '--exo-text-muted': palette.textMutedHex,
    '--exo-accent': palette.accentHex,
    '--exo-accent-rgb': palette.accentRgb,
    '--exo-accent-on': palette.accentOnHex,
    '--exo-accent-2': palette.accent2Hex,
    '--exo-accent-2-rgb': palette.accent2Rgb,
    '--exo-accent-soft': palette.accentSoftBg,
    '--exo-surface-grad-start': palette.surfaceGradStart,
    '--exo-surface-grad-mid': palette.surfaceGradMid,
    '--exo-surface-grad-end': palette.surfaceGradEnd,
    '--exo-border-alpha': String(borderAlpha),
    '--exo-glow-alpha': (glowRatio * (isDark ? 0.42 : 0.24)).toFixed(3),
    '--exo-bevel-alpha': (bevelRatio * (isDark ? 0.44 : 0.32)).toFixed(3),
    '--exo-bevel-2-alpha': (bevelRatio * (isDark ? 0.24 : 0.16)).toFixed(3),
    '--exo-shadow-css': buildShadowCss(config.shadowDepth, isDark, palette.accentRgb, glowRatio),
    '--exo-radius-card': corners.card,
    '--exo-radius-btn': corners.button,
    '--exo-hud-opacity': hudRatio.toFixed(2),
    '--exo-saturation': satRatio.toFixed(2),
    '--exo-font-scale': fontScaleRatio.toFixed(3),
    '--exo-density-scale': DENSITY_SCALE_MAP[config.uiDensity],
    '--exo-ticks-opacity': config.cornerTicks ? '1' : '0',
    '--exo-wallpaper-opacity': (clampRange(config.wallpaperOpacity) / 100).toFixed(2),
    '--exo-vignette-alpha': (clampRange(config.vignetteStrength) / 100).toFixed(2),
  };

  return { preset, isDark, palette, cssVars };
}
