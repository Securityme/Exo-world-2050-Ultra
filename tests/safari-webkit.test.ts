import assert from 'node:assert/strict';
import test from 'node:test';
import { computeEffectiveFontScale } from '../src/utils/safari-webkit.ts';
import {
  DEFAULT_UI_THEME_STUDIO_CONFIG,
  resolveThemeSnapshot,
} from '../src/data/ui-themes.catalog.ts';

test('computeEffectiveFontScale syncs with Safari system px and manual slider', () => {
  const defaultScale = computeEffectiveFontScale({
    manualPct: 100,
    safariSyncEnabled: true,
    systemBodyPx: 16,
  });
  assert.equal(defaultScale.effectiveScale, 1);
  assert.equal(defaultScale.effectiveRootPx, 16);

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

  // Clamping out-of-range manual scale (40% -> 85%)
  const clampedLow = computeEffectiveFontScale({
    manualPct: 40,
    safariSyncEnabled: false,
    systemBodyPx: 16,
  });
  assert.equal(clampedLow.effectiveScale, 0.85);
});

test('resolveThemeSnapshot emits Rose Astralis non-cyan accent and clamps saturation/opacity', () => {
  const snap = resolveThemeSnapshot(
    {
      ...DEFAULT_UI_THEME_STUDIO_CONFIG,
      saturationPct: 140,
      hudOpacity: 95,
    },
    true,
  );
  assert.equal(snap.preset.id, 'ROSE_ASTRAL');
  assert.equal(snap.cssVars['--exo-saturation'], '1.40');
  assert.equal(snap.cssVars['--exo-hud-opacity'], '0.95');
  assert.ok(!(snap.cssVars['--exo-accent'] ?? '').toLowerCase().includes('38bdf8'));
});
