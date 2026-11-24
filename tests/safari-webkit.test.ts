import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeEffectiveFontScale,
  SHELL_ZOOM_MAX_PCT,
  SHELL_ZOOM_MIN_PCT,
  SHELL_ZOOM_PRESETS,
  stepShellZoom,
} from '../src/utils/safari-webkit.ts';
import {
  DEFAULT_UI_THEME_STUDIO_CONFIG,
  resolveThemeSnapshot,
} from '../src/data/ui-themes.catalog.ts';

test('computeEffectiveFontScale syncs with Safari system px, expanded zoom levels (70%-150%), and manual slider', () => {
  const defaultScale = computeEffectiveFontScale({
    manualPct: 100,
    safariSyncEnabled: true,
    systemBodyPx: 16,
  });
  assert.equal(defaultScale.effectiveScale, 1);
  assert.equal(defaultScale.effectiveRootPx, 16);
  assert.equal(defaultScale.browserZoomCompensation, 1);

  // Safari Dynamic Type bumped to 20px (+25%)
  const largeDynamic = computeEffectiveFontScale({
    manualPct: 100,
    safariSyncEnabled: true,
    systemBodyPx: 20,
  });
  assert.equal(largeDynamic.safariSystemRatio, 1.25);
  assert.equal(largeDynamic.effectiveScale, 1.25);
  assert.equal(largeDynamic.effectiveRootPx, 20);

  // Disable Safari sync -> strictly follows manual percentage
  const manualOnly = computeEffectiveFontScale({
    manualPct: 120,
    safariSyncEnabled: false,
    systemBodyPx: 20,
  });
  assert.equal(manualOnly.safariSystemRatio, 1);
  assert.equal(manualOnly.effectiveScale, 1.2);

  // Clamping out-of-range manual scale (40% -> 70%, 220% -> 150%)
  const clampedLow = computeEffectiveFontScale({
    manualPct: 40,
    safariSyncEnabled: false,
    systemBodyPx: 16,
  });
  assert.equal(clampedLow.manualRatio, 0.7);
  assert.equal(clampedLow.effectiveScale, 0.7);

  const clampedHigh = computeEffectiveFontScale({
    manualPct: 220,
    safariSyncEnabled: false,
    systemBodyPx: 16,
  });
  assert.equal(clampedHigh.manualRatio, 1.5);
  assert.equal(clampedHigh.effectiveScale, 1.5);
});

test('computeEffectiveFontScale adapts App Shell cleanly to Safari browser zoom & profiles', () => {
  // Safari zoomed in to 135% -> AUTO_SYSTEM gently compensates so modal tabs stay readable without clipping
  const safariZoomed = computeEffectiveFontScale({
    manualPct: 100,
    safariSyncEnabled: true,
    systemBodyPx: 16,
    adaptMode: 'AUTO_SYSTEM',
    browserZoomRatio: 1.35,
    viewportWidthPx: 1100,
  });
  assert.ok(safariZoomed.browserZoomCompensation < 1);
  assert.ok(safariZoomed.browserZoomCompensation >= 0.84);
  assert.ok(safariZoomed.effectiveScale < 1);

  // SAFARI_COMPACT applies 0.92x multiplier for compact Safari / iPad / Preview viewports
  const compact = computeEffectiveFontScale({
    manualPct: 100,
    safariSyncEnabled: false,
    systemBodyPx: 16,
    adaptMode: 'SAFARI_COMPACT',
  });
  assert.equal(compact.modeMultiplier, 0.92);
  assert.equal(compact.effectiveScale, 0.92);

  // SAFARI_COMFORT applies 1.08x multiplier
  const comfort = computeEffectiveFontScale({
    manualPct: 100,
    safariSyncEnabled: false,
    systemBodyPx: 16,
    adaptMode: 'SAFARI_COMFORT',
  });
  assert.equal(comfort.modeMultiplier, 1.08);
  assert.equal(comfort.effectiveScale, 1.08);

  // MANUAL_LOCK ignores OS Dynamic Type & Safari zoom compensation completely
  const locked = computeEffectiveFontScale({
    manualPct: 110,
    safariSyncEnabled: true,
    systemBodyPx: 22,
    adaptMode: 'MANUAL_LOCK',
    browserZoomRatio: 1.5,
    viewportWidthPx: 390,
  });
  assert.equal(locked.safariSystemRatio, 1);
  assert.equal(locked.browserZoomCompensation, 1);
  assert.equal(locked.effectiveScale, 1.1);
});

test('stepShellZoom and SHELL_ZOOM_PRESETS stay within 70%-150% bounds', () => {
  assert.equal(SHELL_ZOOM_MIN_PCT, 70);
  assert.equal(SHELL_ZOOM_MAX_PCT, 150);
  assert.ok(SHELL_ZOOM_PRESETS.includes(75));
  assert.ok(SHELL_ZOOM_PRESETS.includes(100));
  assert.ok(SHELL_ZOOM_PRESETS.includes(150));
  assert.equal(stepShellZoom(100, 5), 105);
  assert.equal(stepShellZoom(100, -5), 95);
  assert.equal(stepShellZoom(70, -5), 70);
  assert.equal(stepShellZoom(150, 5), 150);
});

test('resolveThemeSnapshot emits Rose Astralis non-cyan accent and clamps saturation/opacity/zoom', () => {
  const snap = resolveThemeSnapshot(
    {
      ...DEFAULT_UI_THEME_STUDIO_CONFIG,
      saturationPct: 140,
      hudOpacity: 95,
      fontScalePct: 145,
    },
    true,
  );
  assert.equal(snap.preset.id, 'ROSE_ASTRAL');
  assert.equal(snap.cssVars['--exo-saturation'], '1.40');
  assert.equal(snap.cssVars['--exo-hud-opacity'], '0.95');
  assert.equal(snap.cssVars['--exo-font-scale'], '1.450');
  assert.ok(!(snap.cssVars['--exo-accent'] ?? '').toLowerCase().includes('38bdf8'));
});
