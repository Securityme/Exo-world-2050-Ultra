import { z } from 'zod';

/**
 * [L0] EXW.L0.UI_THEME_SCHEMA | v5.0.0 | SADT A5.1
 * Canonical contracts for the Multi-Theme System, Saturation, Safari Dynamic Type Sync,
 * Tactile 44px Ergonomics, and Climate-Reactive UI Studio.
 */
export const ThemePresetIdSchema = z.enum([
  'ROSE_ASTRAL',
  'ASTRALIS_CYAN',
  'EMERALD_P4',
  'AMBER_ORBITAL',
  'NEBULA_VIOLET',
  'ANNO_DAYLIGHT',
]);
export type ThemePresetId = z.infer<typeof ThemePresetIdSchema>;

export const ColorSchemePreferenceSchema = z.enum(['DARK', 'LIGHT', 'AUTO']);
export type ColorSchemePreference = z.infer<typeof ColorSchemePreferenceSchema>;

export const WallpaperIdSchema = z.enum([
  'KEYART_2050',
  'ERA_1',
  'ERA_2',
  'ERA_3',
  'ERA_4',
  'ERA_5',
  'ERA_6',
  'ASTROLABE_SVG',
  'PURE_VOID',
]);
export type WallpaperId = z.infer<typeof WallpaperIdSchema>;

export const ShadowDepthSchema = z.enum(['FLAT', 'SOFT', 'TACTICAL', 'DEEP']);
export type ShadowDepth = z.infer<typeof ShadowDepthSchema>;

export const UiDensitySchema = z.enum(['COMPACT', 'STANDARD', 'COMFORT']);
export type UiDensity = z.infer<typeof UiDensitySchema>;

export const CornerStyleSchema = z.enum(['SHARP', 'BEVELED', 'ROUNDED']);
export type CornerStyle = z.infer<typeof CornerStyleSchema>;

export const SafariZoomAdaptModeSchema = z.enum([
  'AUTO_SYSTEM',
  'SAFARI_COMPACT',
  'SAFARI_COMFORT',
  'MANUAL_LOCK',
]);
export type SafariZoomAdaptMode = z.infer<typeof SafariZoomAdaptModeSchema>;

export const UiThemeStudioConfigSchema = z.object({
  presetId: ThemePresetIdSchema,
  colorScheme: ColorSchemePreferenceSchema,
  wallpaperId: WallpaperIdSchema,
  wallpaperOpacity: z.number().min(0).max(100),
  vignetteStrength: z.number().min(0).max(100),
  glowIntensity: z.number().min(0).max(100),
  bevelIntensity: z.number().min(0).max(100),
  shadowDepth: ShadowDepthSchema,
  cornerTicks: z.boolean(),
  uiDensity: UiDensitySchema,
  cornerStyle: CornerStyleSchema,
  hudOpacity: z.number().min(60).max(100),
  highContrast: z.boolean(),
  reducedMotion: z.boolean(),
  saturationPct: z.number().min(50).max(150).default(100),
  fontScalePct: z.number().min(70).max(150).default(100),
  safariTextSync: z.boolean().default(true),
  safariZoomAdaptMode: SafariZoomAdaptModeSchema.default('AUTO_SYSTEM'),
  tactileTargetBoost: z.boolean().default(true),
  climateDynamicWallpaper: z.boolean().default(true),
});

export type UiThemeStudioConfig = z.infer<typeof UiThemeStudioConfigSchema>;

export interface ThemeTonePalette {
  readonly voidHex: string;
  readonly surfaceHex: string;
  readonly surfaceAltHex: string;
  readonly textHex: string;
  readonly textMutedHex: string;
  readonly accentHex: string;
  readonly accentRgb: string;
  readonly accentOnHex: string;
  readonly accent2Hex: string;
  readonly accent2Rgb: string;
  readonly accentSoftBg: string;
  readonly surfaceGradStart: string;
  readonly surfaceGradMid: string;
  readonly surfaceGradEnd: string;
}

export interface UiThemePresetDefinition {
  readonly id: ThemePresetId;
  readonly label: string;
  readonly subtitle: string;
  readonly defaultColorScheme: ColorSchemePreference;
  readonly swatchedHex: readonly [string, string, string];
  readonly dark: ThemeTonePalette;
  readonly light: ThemeTonePalette;
}

export interface WallpaperDefinition {
  readonly id: WallpaperId;
  readonly label: string;
  readonly category: 'KEYART' | 'ERA' | 'VECTOR';
  readonly artKey: 'MENU_2050' | 'ERA_1' | 'ERA_2' | 'ERA_3' | 'ERA_4' | 'ERA_5' | 'ERA_6' | null;
}

export interface ResolvedThemeSnapshot {
  readonly preset: UiThemePresetDefinition;
  readonly isDark: boolean;
  readonly palette: ThemeTonePalette;
  readonly cssVars: Record<string, string>;
}
