import { ATMOSPHERE_CONSTANTS } from '../../config/atmosphere.constants.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';

/**
 * [L3] Pure Resource Flow Forecast, Structural Maintenance Load & Gameplay Guidance Engine.
 * Zero Z0 legacy mechanics — tracks entity-driven production, maintenance stress & clear next actions.
 */
export type ResourceStatusTone = 'healthy' | 'warning' | 'critical';

export interface ResourceMetricItem {
  readonly id: 'credits' | 'energy' | 'materials' | 'water' | 'food' | 'compute' | 'breathingKits' | 'electronics';
  readonly label: string;
  readonly shortLabel: string;
  readonly stock: number;
  readonly deltaPerCycle: number;
  readonly unit: string;
  readonly producerHint: string;
  readonly usageHint: string;
  readonly tone: ResourceStatusTone;
}

export interface ResourceForecastReport {
  readonly metrics: readonly ResourceMetricItem[];
  readonly netCreditsPerCycle: number;
  readonly taxIncome: number;
  readonly upkeepCost: number;
  readonly respiratoryCost: number;
  readonly loanPaymentEstimate: number;
  readonly maintenanceLoadPct: number;
  readonly maintenanceTone: ResourceStatusTone;
  readonly nextActionHint: string;
  readonly nextActionCategory: 'EMERGENCY' | 'DOSSIER' | 'BUILD' | 'ATMO' | 'CYCLE';
}

function getDoctrineMultipliers(doctrineId: string): {
  readonly taxMult: number;
  readonly computeMult: number;
  readonly corpMaterialsBonus: number;
} {
  switch (doctrineId) {
    case 'SCIENTIFIC':
      return { taxMult: 1.0, computeMult: 1.25, corpMaterialsBonus: 0 };
    case 'CORPORATE':
      return { taxMult: 1.18, computeMult: 1.05, corpMaterialsBonus: 6 };
    case 'SECURITY':
      return { taxMult: 1.02, computeMult: 1.1, corpMaterialsBonus: 0 };
    default:
      return { taxMult: 1.0, computeMult: 1.0, corpMaterialsBonus: 0 };
  }
}

export function computeResourceForecast(world: WorldState): ResourceForecastReport {
  const doctrine = getDoctrineMultipliers(world.doctrineId);

  const avgColonistMorale =
    world.colonists.reduce((acc, c) => acc + c.morale, 0) / Math.max(1, world.colonists.length);
  const moraleOutputFactor = 0.85 + (avgColonistMorale / 100) * 0.3;

  const energyDist = world.districts.filter((d) => d.kind === 'ENERGY');
  const indDist = world.districts.filter((d) => d.kind === 'INDUSTRY');
  const bioDist = world.districts.filter((d) => d.kind === 'BIOPARK');
  const habDist = world.districts.filter((d) => d.kind === 'HABITAT');
  const dcDist = world.districts.filter((d) => d.kind === 'DATACENTER');

  const rawTaxIncome = world.districts.reduce((acc, d) => acc + d.level * 28 + d.modulesCount * 14, 70);
  const taxIncome = Math.round(rawTaxIncome * doctrine.taxMult);
  const upkeepCost = world.districts.reduce((acc, d) => acc + d.level * 9, 25);

  const atmoSpec = ATMOSPHERE_CONSTANTS[world.atmosphereTier];
  const kitDemand = Math.ceil(world.colonists.length * atmoSpec.kitsPerColonist);
  const respiratoryCost = Math.round(kitDemand * 12 * atmoSpec.kitCostMultiplier);
  const bioCraftedKits = bioDist.reduce((acc, d) => acc + d.level * 2 + d.modulesCount, 0);
  const kitsDelta = bioCraftedKits - kitDemand;

  const loanPaymentEstimate = world.finance.loans.reduce(
    (acc, loan) => acc + Math.round(loan.remaining * loan.interestRate + loan.principal / 6),
    0,
  );
  const netCreditsPerCycle = taxIncome - upkeepCost - respiratoryCost - loanPaymentEstimate;

  const energyDelta = Math.round(
    (10 + energyDist.reduce((a, d) => a + d.level * 9 + d.modulesCount * 5, 0)) *
      (world.season === 'ETE' ? 1.15 : world.season === 'HIVER' ? 0.9 : 1) *
      moraleOutputFactor,
  );

  const materialsDelta = Math.round(
    (8 +
      indDist.reduce((a, d) => a + d.level * 8 + d.modulesCount * 5, 0) +
      doctrine.corpMaterialsBonus) *
      moraleOutputFactor,
  );

  const waterDelta = Math.round(6 + bioDist.reduce((a, d) => a + d.level * 6 + d.modulesCount * 3, 0));

  const foodDelta = Math.round(
    (6 + habDist.reduce((a, d) => a + d.level * 5 + d.modulesCount * 3, 0)) *
      (world.season === 'HIVER' ? 0.88 : 1.05),
  );

  const electronicsDelta = Math.max(
    2,
    indDist.reduce((a, d) => a + d.level * 3 + d.modulesCount * 2, 0),
  );

  const computeDelta = Math.round(
    (world.datacenterTier * 6 + dcDist.reduce((a, d) => a + d.level * 6 + d.modulesCount * 4, 0)) *
      doctrine.computeMult,
  );

  // Structural Maintenance & Wear Stress Index (0..100%)
  const avgWear =
    world.districts.reduce((acc, d) => acc + Math.max(0, 100 - d.integrity), 0) /
    Math.max(1, world.districts.length);
  const droneMitigation = Math.min(28, world.drones.construction * 4);
  const stormStress = world.weatherState === 'SOLAR_FLARE' ? 14 : world.weatherState === 'DUST_STORM' ? 8 : 0;
  const rawMaintenanceLoad =
    18 +
    avgWear * 1.15 +
    indDist.reduce((acc, d) => acc + d.level * 4, 0) +
    dcDist.reduce((acc, d) => acc + d.level * 3, 0) +
    stormStress -
    droneMitigation;

  const maintenanceLoadPct = Math.max(8, Math.min(98, Math.round(rawMaintenanceLoad)));
  const maintenanceTone: ResourceStatusTone =
    maintenanceLoadPct >= 70 ? 'critical' : maintenanceLoadPct >= 48 ? 'warning' : 'healthy';

  const metrics: ResourceMetricItem[] = [
    {
      id: 'credits',
      label: 'Crédits Fédéraux',
      shortLabel: 'Cr',
      stock: world.resources.credits,
      deltaPerCycle: netCreditsPerCycle,
      unit: 'Cr',
      producerHint: `Taxes urbaines (+${taxIncome}) − Entretien (-${upkeepCost}) − Kits O₂ (-${respiratoryCost})`,
      usageHint: 'Finance les extensions de quartiers, le recrutement et le marché.',
      tone:
        world.resources.credits < 180 || netCreditsPerCycle < 0
          ? 'critical'
          : world.resources.credits < 400
            ? 'warning'
            : 'healthy',
    },
    {
      id: 'energy',
      label: 'Énergie Solaire',
      shortLabel: 'Énerg.',
      stock: world.resources.energy,
      deltaPerCycle: energyDelta,
      unit: 'MW',
      producerHint: 'Centrale solaire (+15% Été, −10% Hiver).',
      usageHint: 'Priorité n°1 du réseau ; évite le délestage Industrie/Calcul.',
      tone: world.resources.energy < 50 ? 'critical' : world.resources.energy < 110 ? 'warning' : 'healthy',
    },
    {
      id: 'materials',
      label: 'Matériaux',
      shortLabel: 'Mat.',
      stock: world.resources.materials,
      deltaPerCycle: materialsDelta,
      unit: 't',
      producerHint: 'Zone industrielle & extensions.',
      usageHint: 'Indispensables pour greffer des modules urbains et réparer.',
      tone: world.resources.materials < 35 ? 'critical' : world.resources.materials < 80 ? 'warning' : 'healthy',
    },
    {
      id: 'water',
      label: 'Eau',
      shortLabel: 'Eau',
      stock: world.resources.water,
      deltaPerCycle: waterDelta,
      unit: 'kL',
      producerHint: 'Station écologique et récupérateurs.',
      usageHint: 'Alimente la biosphère et la population.',
      tone: world.resources.water < 40 ? 'critical' : world.resources.water < 85 ? 'warning' : 'healthy',
    },
    {
      id: 'food',
      label: 'Vivres',
      shortLabel: 'Vivres',
      stock: world.resources.food,
      deltaPerCycle: foodDelta,
      unit: 'u',
      producerHint: 'Quartier résidentiel & serres hydroponiques.',
      usageHint: 'Soutient la santé, le bonheur et le rendement des colons.',
      tone: world.resources.food < 40 ? 'critical' : world.resources.food < 85 ? 'warning' : 'healthy',
    },
    {
      id: 'compute',
      label: 'Calcul',
      shortLabel: 'Calcul',
      stock: world.resources.compute,
      deltaPerCycle: computeDelta,
      unit: 'TF',
      producerHint: 'Centre de calcul souverain.',
      usageHint: 'Financement des 30 technologies partagées et défense cyber.',
      tone: world.resources.compute < 35 ? 'warning' : 'healthy',
    },
    {
      id: 'breathingKits',
      label: 'Kits O₂',
      shortLabel: 'Kits O₂',
      stock: world.resources.breathingKits,
      deltaPerCycle: kitsDelta,
      unit: 'kits',
      producerHint: `Station écologique (+${bioCraftedKits}) − Besoin colons (-${kitDemand})`,
      usageHint: 'Actifs jusqu’en Atmosphère Respirable ; gratuits dès l’Atmosphère Éden.',
      tone:
        world.resources.breathingKits < 15
          ? 'critical'
          : world.resources.breathingKits < 35 || kitsDelta < 0
            ? 'warning'
            : 'healthy',
    },
    {
      id: 'electronics',
      label: 'Électronique',
      shortLabel: 'Élec.',
      stock: world.resources.electronics,
      deltaPerCycle: electronicsDelta,
      unit: 'u',
      producerHint: 'Zone industrielle haute précision.',
      usageHint: 'Équipement Colons T2–T3, drones et flotte orbitale.',
      tone: world.resources.electronics < 25 ? 'warning' : 'healthy',
    },
  ];

  const p0Dossier = world.activeDossiers.find((d) => d.dossierClass === 'P0');
  const wornDistrict = world.districts.find((d) => d.integrity < 55);

  let nextActionHint = 'Tous les dossiers résolus : validez la Fin de tour pour lancer le Bilan.';
  let nextActionCategory: ResourceForecastReport['nextActionCategory'] = 'CYCLE';

  if (p0Dossier) {
    nextActionHint = `Urgence P0 : arbitrez « ${p0Dossier.title} » dans Événements.`;
    nextActionCategory = 'EMERGENCY';
  } else if (world.activeDossiers.length > 0) {
    nextActionHint = `${world.activeDossiers.length} dossier(s) actif(s) avant de déverrouiller la Fin de tour.`;
    nextActionCategory = 'DOSSIER';
  } else if (wornDistrict) {
    nextActionHint = `Usure critique sur ${wornDistrict.name} (${wornDistrict.integrity}%) : inspectez en 3D.`;
    nextActionCategory = 'BUILD';
  } else if (world.resources.breathingKits < 20 && world.atmosphereTier !== 'P4') {
    nextActionHint = 'Kits O₂ bas : agrandissez la Station écologique via un dossier.';
    nextActionCategory = 'ATMO';
  }

  return {
    metrics,
    netCreditsPerCycle,
    taxIncome,
    upkeepCost,
    respiratoryCost,
    loanPaymentEstimate,
    maintenanceLoadPct,
    maintenanceTone,
    nextActionHint,
    nextActionCategory,
  };
}
