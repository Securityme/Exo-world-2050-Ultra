import type { WorldState } from '../../contracts/world-state.schema.ts';
import { resolveSuperpowerV4 } from '../../data/v4-catalog.data.ts';
import { formatAtmosphereStageName } from '../../utils/atmosphere-labels.ts';

/**
 * [L3] EXW.L3.CITIZENS_SOCIETY | v5.0.0 | SADT A3.1/A3.4
 * Pure Frostpunk-style Ordinary Citizens Workforce Pool, Civic Wellbeing Matrix
 * (Health, Education, Leisure, Pollution, Cultural-Origin Political Equilibrium),
 * and Sovereign State Technical Sheet (Pays / Empire / Royaume / Fédération / Démocratie).
 */
export type SovereignRegimeType =
  | 'FÉDÉRATION'
  | 'DÉMOCRATIE'
  | 'RÉPUBLIQUE'
  | 'EMPIRE'
  | 'ROYAUME'
  | 'CONFÉDÉRATION';

export interface CulturalOriginShare {
  readonly id: string;
  readonly label: string;
  readonly sharePct: number;
  readonly politicalLean: string;
  readonly satisfactionPct: number;
}

export interface CitizensSocietyReport {
  readonly totalOrdinaryCitizens: number;
  readonly activeWorkforce: number;
  readonly reserveCitizens: number;
  readonly healthIndex: number;
  readonly educationIndex: number;
  readonly leisureIndex: number;
  readonly pollutionIndex: number;
  readonly politicalEquilibriumIndex: number;
  readonly culturalOrigins: readonly CulturalOriginShare[];
  readonly civicAlert: string | null;
}

export interface SovereignStateTechnicalSheet {
  readonly stateName: string;
  readonly regimeType: SovereignRegimeType;
  readonly eraTitle: string;
  readonly capitalCity: string;
  readonly constitutionSummary: string;
  readonly ownedPlanetsCount: number;
  readonly totalCitiesCount: number;
  readonly controlledSectors: number;
  readonly solvencyRating: string;
  readonly atmosphereLabel: string;
  readonly approvalPct: number;
  readonly stabilityIndex: number;
  readonly planetRoster: readonly {
    readonly slotIndex: number;
    readonly planetName: string;
    readonly unlocked: boolean;
    readonly ownedCitiesCount: number;
    readonly statusLabel: string;
  }[];
}

export function computeCitizensSocietyReport(world: WorldState): CitizensSocietyReport {
  const habDistricts = world.districts.filter((d) => d.kind === 'HABITAT' || d.kind === 'BIOPARK');
  const indDistricts = world.districts.filter((d) => d.kind === 'INDUSTRY' || d.kind === 'ENERGY');
  const sciDistricts = world.districts.filter((d) => d.kind === 'DATACENTER' || d.kind === 'COMMAND');

  const totalOrdinaryCitizens =
    140 +
    world.districts.length * 48 +
    world.districts.reduce((acc, d) => acc + d.modulesCount * 24, 0) +
    world.cycle * 6;

  const avgIntegrity =
    world.districts.length > 0
      ? Math.round(world.districts.reduce((a, d) => a + d.integrity, 0) / world.districts.length)
      : 80;

  const pollutionIndex = Math.max(
    4,
    Math.min(
      95,
      Math.round(
        58 -
          world.atmosphereProgress * 0.55 +
          indDistricts.length * 7 -
          sciDistricts.length * 5,
      ),
    ),
  );

  const healthIndex = Math.max(
    18,
    Math.min(
      99,
      Math.round(
        62 +
          Math.min(18, Math.floor(world.resources.breathingKits / 8)) +
          Math.min(14, Math.floor(world.resources.water / 18)) -
          pollutionIndex * 0.25,
      ),
    ),
  );

  const educationIndex = Math.max(
    25,
    Math.min(
      99,
      Math.round(
        54 +
          (world.hk?.unlockedTechIds.length ?? 1) * 6 +
          sciDistricts.length * 7 +
          Math.min(10, world.colonists.length),
      ),
    ),
  );

  const leisureIndex = Math.max(
    20,
    Math.min(
      98,
      Math.round(
        48 +
          habDistricts.length * 8 +
          Math.round((world.approval - 50) * 0.45) +
          Math.round((avgIntegrity - 75) * 0.25),
      ),
    ),
  );

  const activeWorkforce = Math.round(totalOrdinaryCitizens * 0.68);
  const reserveCitizens = Math.max(0, totalOrdinaryCitizens - activeWorkforce);

  const fedTilt = world.spectra?.federalVsSovereign ?? 0;
  const ecoTilt = world.spectra?.ecologyVsIndustry ?? 0;

  const culturalOrigins: CulturalOriginShare[] = [
    {
      id: 'orig-pioneers',
      label: 'Pionniers Fondateurs',
      sharePct: 36,
      politicalLean: ecoTilt >= 0 ? 'Éco-Symbiose & Bien Commun' : 'Productivisme Pionnier',
      satisfactionPct: Math.max(25, Math.min(98, Math.round((world.approval + healthIndex) / 2))),
    },
    {
      id: 'orig-scientists',
      label: 'Techniciens & Savants',
      sharePct: 24,
      politicalLean: 'Déontologie & Science Ouverte',
      satisfactionPct: Math.max(25, Math.min(98, Math.round((educationIndex + avgIntegrity) / 2))),
    },
    {
      id: 'orig-civic',
      label: 'Citoyens Civils Urbains',
      sharePct: 26,
      politicalLean: fedTilt >= 0 ? 'Fédéralisme Civique' : 'Autonomie des Quartiers',
      satisfactionPct: Math.max(25, Math.min(98, Math.round((leisureIndex + world.approval) / 2))),
    },
    {
      id: 'orig-migrants',
      label: 'Nouveaux Arrivants Orbitaux',
      sharePct: 14,
      politicalLean: 'Contractualisme & Intégration',
      satisfactionPct: Math.max(25, Math.min(98, Math.round((healthIndex + leisureIndex) / 2))),
    },
  ];

  const politicalEquilibriumIndex = Math.round(
    (healthIndex * 0.3 + educationIndex * 0.25 + leisureIndex * 0.2 + (100 - pollutionIndex) * 0.25),
  );

  const civicAlert =
    pollutionIndex >= 62
      ? 'Pollution industrielle élevée : déployez un purificateur atmosphérique.'
      : healthIndex < 55
        ? 'Tension sanitaire citoyenne : renforcez les stocks de kits O₂ et d’eau.'
        : leisureIndex < 48
          ? 'Fatigue civique : créez des espaces de loisirs dans les quartiers habitat.'
          : null;

  return {
    totalOrdinaryCitizens,
    activeWorkforce,
    reserveCitizens,
    healthIndex,
    educationIndex,
    leisureIndex,
    pollutionIndex,
    politicalEquilibriumIndex,
    culturalOrigins,
    civicAlert,
  };
}

const PLANET_NAMES = [
  'Kepler-442b (Monde Natal)',
  'Lune Minière Thétis',
  'Archipel Océanique Thalassa',
  'Ceinture Cryo-Titan',
  'Plateau Solaire Hélios',
  'Arche Terminale Éden-VI',
] as const;

export function buildSovereignStateTechnicalSheet(world: WorldState): SovereignStateTechnicalSheet {
  const sp = resolveSuperpowerV4(world.superpowerId);
  const fed = world.spectra?.federalVsSovereign ?? 0;
  const welfare = world.spectra?.civicWelfareVsEfficiency ?? 0;

  let regimeType: SovereignRegimeType = 'FÉDÉRATION';
  if (fed >= 25 && welfare >= 15) regimeType = 'DÉMOCRATIE';
  else if (fed <= -35) regimeType = 'EMPIRE';
  else if (fed <= -15 && welfare >= 10) regimeType = 'ROYAUME';
  else if (welfare >= 20) regimeType = 'RÉPUBLIQUE';
  else if (world.unlockedSlots >= 3) regimeType = 'CONFÉDÉRATION';

  const planetRoster = PLANET_NAMES.map((planetName, idx) => {
    const slotIndex = idx + 1;
    const unlocked = slotIndex <= world.unlockedSlots;
    const ownedCitiesCount = !unlocked
      ? 0
      : slotIndex === 1
        ? Math.max(1, Math.ceil(world.districts.length / 4))
        : 1;
    return {
      slotIndex,
      planetName,
      unlocked,
      ownedCitiesCount,
      statusLabel: unlocked
        ? slotIndex === world.activeSlotIndex
          ? 'Monde actif'
          : 'Colonisé'
        : `Verrouillé (Ère ${Math.min(6, slotIndex)})`,
    };
  });

  const totalCitiesCount = planetRoster.reduce((acc, p) => acc + p.ownedCitiesCount, 0);

  return {
    stateName: sp.name,
    regimeType,
    eraTitle: world.hk?.factionEraTitle ?? sp.name,
    capitalCity: world.districts[0]?.name ?? 'Cité Aurore #12',
    constitutionSummary:
      regimeType === 'DÉMOCRATIE'
        ? 'Charte citoyenne ouverte, référendums contraignants et bien commun.'
        : regimeType === 'EMPIRE'
          ? 'Commandement centralisé fort, priorité à la projection orbitale.'
          : regimeType === 'ROYAUME'
            ? 'Souveraineté constitutionnelle fondée sur la continuité dynastique et la prudence.'
            : 'Pacte fédéral équilibrant autonomie urbaine et solidarité planétaire.',
    ownedPlanetsCount: world.unlockedSlots,
    totalCitiesCount,
    controlledSectors: world.capturedTiles.length,
    solvencyRating: world.finance.solvencyRating,
    atmosphereLabel: formatAtmosphereStageName(world.atmosphereTier),
    approvalPct: Math.round(world.approval),
    stabilityIndex: Math.max(10, Math.min(100, Math.round((world.approval + world.superAllianceTrust) / 2))),
    planetRoster,
  };
}
