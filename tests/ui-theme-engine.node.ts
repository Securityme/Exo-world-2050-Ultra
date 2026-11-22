import assert from 'node:assert/strict';
import test from 'node:test';
import { UiThemeStudioConfigSchema } from '../src/contracts/ui-theme.schema.ts';
import {
  DEFAULT_UI_THEME_STUDIO_CONFIG,
  UI_THEME_PRESETS,
  WALLPAPER_CATALOG,
  getThemePreset,
  getWallpaperDef,
  resolveThemeSnapshot,
} from '../src/data/ui-themes.catalog.ts';

test('UI Theme Studio defaults to Rose Astralis and validates cleanly with Zod', () => {
  const parsed = UiThemeStudioConfigSchema.safeParse(DEFAULT_UI_THEME_STUDIO_CONFIG);
  assert.equal(parsed.success, true);
  assert.equal(DEFAULT_UI_THEME_STUDIO_CONFIG.presetId, 'ROSE_ASTRAL');
  assert.equal(UI_THEME_PRESETS.length, 6);
  assert.equal(WALLPAPER_CATALOG.length, 9);

  const snap = resolveThemeSnapshot(DEFAULT_UI_THEME_STUDIO_CONFIG, true);
  assert.equal(snap.isDark, true);
  assert.equal(snap.preset.id, 'ROSE_ASTRAL');
  assert.equal(snap.cssVars['--exo-accent'], '#fb7185');
  assert.equal(snap.cssVars['--exo-void'], '#120818');
  assert.equal(snap.cssVars['--exo-ticks-opacity'], '1');
});

test('All 6 system presets produce distinct dark & light palettes and honor AUTO OS scheme', () => {
  const darkAccents = new Set<string>();
  for (const preset of UI_THEME_PRESETS) {
    const darkSnap = resolveThemeSnapshot(
      { ...DEFAULT_UI_THEME_STUDIO_CONFIG, presetId: preset.id, colorScheme: 'AUTO' },
      true,
    );
    const lightSnap = resolveThemeSnapshot(
      { ...DEFAULT_UI_THEME_STUDIO_CONFIG, presetId: preset.id, colorScheme: 'AUTO' },
      false,
    );
    assert.equal(darkSnap.isDark, true);
    assert.equal(lightSnap.isDark, false);
    assert.notEqual(darkSnap.cssVars['--exo-void'], lightSnap.cssVars['--exo-void']);
    darkAccents.add(`${preset.id}:${darkSnap.palette.accentHex}`);
  }
  assert.equal(darkAccents.size, 6);
});

test('Lighting, shadow depth, corner style, ticks, contrast, and wallpapers resolve deterministically', () => {
  const flatSnap = resolveThemeSnapshot(
    {
      ...DEFAULT_UI_THEME_STUDIO_CONFIG,
      presetId: 'EMERALD_P4',
      shadowDepth: 'FLAT',
      cornerStyle: 'SHARP',
      cornerTicks: false,
      highContrast: true,
      glowIntensity: 90,
      hudOpacity: 82,
    },
    true,
  );
  assert.equal(flatSnap.cssVars['--exo-radius-card'], '4px');
  assert.equal(flatSnap.cssVars['--exo-ticks-opacity'], '0');
  assert.equal(flatSnap.cssVars['--exo-hud-opacity'], '0.82');
  assert.equal(flatSnap.cssVars['--exo-border-alpha'], '0.72');
  assert.ok(flatSnap.cssVars['--exo-shadow-css']?.startsWith('0 0 0 1px'));

  const deepSnap = resolveThemeSnapshot(
    {
      ...DEFAULT_UI_THEME_STUDIO_CONFIG,
      presetId: 'NEBULA_VIOLET',
      shadowDepth: 'DEEP',
      cornerStyle: 'ROUNDED',
    },
    true,
  );
  assert.equal(deepSnap.cssVars['--exo-radius-card'], '22px');
  assert.ok(deepSnap.cssVars['--exo-shadow-css']?.includes('22px 52px'));

  assert.equal(getThemePreset('AMBER_ORBITAL').id, 'AMBER_ORBITAL');
  assert.equal(getWallpaperDef('ASTROLABE_SVG').artKey, null);
  assert.equal(getWallpaperDef('ERA_4').artKey, 'ERA_4');
});
