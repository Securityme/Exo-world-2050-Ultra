import type { BioHealthReport, EcclesiaDiscernmentGrade } from '../../contracts/skills-vcs.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';

/**
 * [L3] EXW.L3.BIOCLIMATE_HEALTH | v5.1.0 | SADT A3.1
 * Implements the 5 Scientific Divisions (EXOSPHERE_0 .. TROPOSPHERE_4)
 * coupled with the Bioclimatic BioHealth Simulator (FEAT-53) and P0 Catastrophe Drag (FEAT-54).
 * Pure, deterministic, zero I/O, zero Z0 terms.
 */

const DIVISION_LABELS: Readonly<Record<BioHealthReport['activeDivision'], string>> = {
  EXOSPHERE_0: 'Division 0 · Exosphère',
  THERMOSPHERE_1: 'Division 1 · Ionosphère & Haute Couche',
  MESOSPHERE_2: 'Division 2 · Mésosphère',
  STRATOSPHERE_3: 'Division 3 · Stratosphère',
  TROPOSPHERE_4: 'Division 4 · Troposphère Éden',
};

export function formatScientificDivisionLabel(division: BioHealthReport['activeDivision']): string {
  return DIVISION_LABELS[division] ?? division;
}

export const PEDAGOGICAL_SCALE_LABELS: Readonly<
  Record<EcclesiaDiscernmentGrade, { readonly code: string; readonly label: string }>
> = {
  3: { code: '+3', label: 'Super Positive — Grâce' },
  2: { code: '+2', label: 'Positive — Prudence & Bien Commun' },
  1: { code: '+1', label: 'Miséricorde & Réparation' },
  0: { code: '0', label: 'Ambiguë / Double Effet' },
  [-1]: { code: '-1', label: 'Négative — Court-Termisme' },
  [-2]: { code: '-2', label: 'Très Négative — Rupture Morale' },
};

export function mapAtmosphereToDivision(
  tier: WorldState['atmosphereTier'],
  progress: number,
): BioHealthReport['activeDivision'] {
  if (tier === 'P4' && progress >= 90) return 'TROPOSPHERE_4';
  if (tier === 'P4' || progress >= 75) return 'STRATOSPHERE_3';
  if (tier === 'P3' || progress >= 50) return 'MESOSPHERE_2';
  if (tier === 'P2' || progress >= 25) return 'THERMOSPHERE_1';
  return 'EXOSPHERE_0';
}

export function computeBioHealthReport(state: WorldState): BioHealthReport {
  const bioParks = state.districts.filter((d) => d.kind === 'BIOPARK');
  const bioPower = bioParks.reduce((acc, d) => acc + d.level * 6 + d.modulesCount * 4, 0);
  const oceanPct = state.planetProfile?.oceanCoveragePct ?? 45;
  const activeP0Count = state.activeDossiers.filter((d) => d.dossierClass === 'P0').length;
  const catastropheDrag = Math.min(
    40,
    activeP0Count * 6 +
      (state.weatherState === 'DUST_STORM' ? 5 : state.weatherState === 'SOLAR_FLARE' ? 4 : 0),
  );

  const airScore = Math.max(
    0,
    Math.min(100, Math.round(state.atmosphereProgress * 0.85 + Math.min(15, bioPower * 0.5))),
  );
  const soilFertility = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        30 +
          Math.min(40, state.resources.food * 0.2) +
          (state.terra?.hydro ?? 22) * 0.25 +
          bioPower * 0.3,
      ),
    ),
  );
  const hydroScore = Math.max(
    0,
    Math.min(100, Math.round(20 + oceanPct * 0.55 + Math.min(25, state.resources.water * 0.15))),
  );
  const floraIndex = Math.max(
    0,
    Math.min(100, Math.round((state.terra?.bio ?? 18) * 0.7 + bioPower * 1.1 + airScore * 0.25)),
  );
  const faunaIndex = Math.max(
    0,
    Math.min(100, Math.round((floraIndex * 0.55 + hydroScore * 0.35 + state.biomeStabilityCycles * 2))),
  );

  const rawComposite =
    0.25 * airScore +
    0.2 * soilFertility +
    0.2 * hydroScore +
    0.2 * floraIndex +
    0.15 * faunaIndex -
    catastropheDrag;

  const compositeBioHealth = Math.max(0, Math.min(100, Math.round(rawComposite)));
  const prevStreak = state.bioHealth?.edenStreak ?? 0;
  const edenStreak = compositeBioHealth >= 80 ? prevStreak + 1 : 0;

  return {
    airScore,
    soilFertility,
    hydroScore,
    floraIndex,
    faunaIndex,
    catastropheDrag,
    compositeBioHealth,
    edenStreak,
    activeDivision: mapAtmosphereToDivision(state.atmosphereTier, state.atmosphereProgress),
  };
}
