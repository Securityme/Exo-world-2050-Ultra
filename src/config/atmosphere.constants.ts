/**
 * [L1] FUP-003 | SM-02 | SADT A3.1–A3.2
 * Frozen Open-Sky Atmospheric Terraforming Constants (P1..P4) (R-16, R-23).
 */
export const ATMOSPHERE_CONSTANTS = Object.freeze({
  P1: Object.freeze({
    tier: 'P1' as const,
    name: 'Hostile',
    buildSpeedMod: -0.4,
    kitCostMultiplier: 2.0,
    kitsPerColonist: 1,
    moraleDelta: -15,
    foodYieldBonus: 0,
    maxExposureHours: 4,
    thresholdProgress: 0,
    accentHex: '#c26d3a',
  }),
  P2: Object.freeze({
    tier: 'P2' as const,
    name: 'Stabilisé',
    buildSpeedMod: 0,
    kitCostMultiplier: 0.45,
    kitsPerColonist: 0.4,
    moraleDelta: 0,
    foodYieldBonus: 0.1,
    maxExposureHours: 10,
    thresholdProgress: 33,
    accentHex: '#6488a6',
  }),
  P3: Object.freeze({
    tier: 'P3' as const,
    name: 'Respirable',
    buildSpeedMod: 0.25,
    kitCostMultiplier: 0,
    kitsPerColonist: 0,
    moraleDelta: 20,
    foodYieldBonus: 0.35,
    maxExposureHours: 24,
    thresholdProgress: 66,
    accentHex: '#10b981',
  }),
  P4: Object.freeze({
    tier: 'P4' as const,
    name: 'Éden',
    buildSpeedMod: 0.4,
    kitCostMultiplier: 0,
    kitsPerColonist: 0,
    moraleDelta: 30,
    foodYieldBonus: 0.5,
    maxExposureHours: 24,
    thresholdProgress: 92,
    accentHex: '#14b8a6',
  }),
  BIOME_STABILITY_CYCLES_REQUIRED: 3,
});

export type ScientificAtmosphereDivisionId =
  | 'EXOSPHERE'
  | 'THERMOSPHERE'
  | 'MESOSPHERE'
  | 'STRATOSPHERE'
  | 'TROPOSPHERE';

export interface ScientificAtmosphereDivisionSpec {
  readonly id: ScientificAtmosphereDivisionId;
  readonly index: 1 | 2 | 3 | 4 | 5;
  readonly label: string;
  readonly altitudeKmLabel: string;
  readonly compatibleTier: 'P1' | 'P2' | 'P3' | 'P4';
  readonly minProgress: number;
  readonly rayleighHex: string;
  readonly mieHex: string;
  readonly horizonHex: string;
  readonly haloHex: string;
  readonly scatteringDensity: number;
}

/**
 * [L1] 5 Divisions Atmosphériques Scientifiques (SYS-INST-EXW-001 v2.0.0)
 * Progression descendante orbitale vers sol habitable, rétro-compatible avec P1..P4.
 */
export const SCIENTIFIC_ATMOSPHERE_DIVISIONS: readonly ScientificAtmosphereDivisionSpec[] = Object.freeze([
  {
    id: 'EXOSPHERE',
    index: 1,
    label: 'Exosphère (> 500 km)',
    altitudeKmLabel: '500–1 200 km',
    compatibleTier: 'P1',
    minProgress: 0,
    rayleighHex: '#181024',
    mieHex: '#f97316',
    horizonHex: '#c26d3a',
    haloHex: '#fb923c',
    scatteringDensity: 0.28,
  },
  {
    id: 'THERMOSPHERE',
    index: 2,
    label: 'Thermosphère (85–500 km)',
    altitudeKmLabel: '85–500 km',
    compatibleTier: 'P1',
    minProgress: 20,
    rayleighHex: '#251a38',
    mieHex: '#fb7185',
    horizonHex: '#e17a54',
    haloHex: '#fb7185',
    scatteringDensity: 0.44,
  },
  {
    id: 'MESOSPHERE',
    index: 3,
    label: 'Mésosphère (50–85 km)',
    altitudeKmLabel: '50–85 km',
    compatibleTier: 'P2',
    minProgress: 40,
    rayleighHex: '#1e3a5f',
    mieHex: '#60a5fa',
    horizonHex: '#7da8c9',
    haloHex: '#60a5fa',
    scatteringDensity: 0.62,
  },
  {
    id: 'STRATOSPHERE',
    index: 4,
    label: 'Stratosphère (15–50 km)',
    altitudeKmLabel: '15–50 km',
    compatibleTier: 'P3',
    minProgress: 65,
    rayleighHex: '#0c4a6e',
    mieHex: '#38bdf8',
    horizonHex: '#7dd3fc',
    haloHex: '#38bdf8',
    scatteringDensity: 0.82,
  },
  {
    id: 'TROPOSPHERE',
    index: 5,
    label: 'Troposphère (0–15 km)',
    altitudeKmLabel: '0–15 km',
    compatibleTier: 'P4',
    minProgress: 85,
    rayleighHex: '#065f46',
    mieHex: '#34d399',
    horizonHex: '#a7f3d0',
    haloHex: '#34d399',
    scatteringDensity: 1.0,
  },
]);

export function resolveScientificAtmosphereDivision(
  tier: 'P1' | 'P2' | 'P3' | 'P4',
  progress?: number,
): ScientificAtmosphereDivisionSpec {
  if (typeof progress === 'number' && Number.isFinite(progress)) {
    const pct = Math.max(0, Math.min(100, progress));
    for (let i = SCIENTIFIC_ATMOSPHERE_DIVISIONS.length - 1; i >= 0; i--) {
      const div = SCIENTIFIC_ATMOSPHERE_DIVISIONS[i]!;
      if (pct >= div.minProgress) return div;
    }
  }
  switch (tier) {
    case 'P4':
      return SCIENTIFIC_ATMOSPHERE_DIVISIONS[4]!;
    case 'P3':
      return SCIENTIFIC_ATMOSPHERE_DIVISIONS[3]!;
    case 'P2':
      return SCIENTIFIC_ATMOSPHERE_DIVISIONS[2]!;
    default:
      return typeof progress === 'number' && progress >= 20
        ? SCIENTIFIC_ATMOSPHERE_DIVISIONS[1]!
        : SCIENTIFIC_ATMOSPHERE_DIVISIONS[0]!;
  }
}

