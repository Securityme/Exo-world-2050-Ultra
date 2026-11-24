import type { WorldState } from '../../contracts/world-state.schema.ts';
import { computeFleetTotals } from '../fleet/ship-loadout.engine.ts';

/**
 * [L3] EXW.L3.THEATERS_AND_POLITIES | v5.0.0 | SADT A3.3/A4.1
 * Pure deterministic modeling for:
 * - 4 Military Theaters (Spatial, Ciel, Terrestre, Maritime)
 * - Call of War Taskforce Builder & 72-Sector Supply Lines
 * - Humankind External Cities (Hostile / Allied / Neutral Trade, Intel, Tech)
 * - Local Fauna & Pre-Spacefaring Polities (TRIBE..LOCAL_STATE)
 * - OpenGTA2/OpenRW-inspired Civil Pressure Star Rating (1★..5★) & Faction Respect Meter
 */
export type MilitaryTheaterId = 'SPACE' | 'AIR' | 'LAND' | 'SEA';

export interface TheaterForceSummary {
  readonly id: MilitaryTheaterId;
  readonly label: string;
  readonly unitCount: number;
  readonly powerScore: number;
  readonly readinessPct: number;
  readonly supplyStatus: 'OPTIMAL' | 'TENDU' | 'RUPTURE';
  readonly flagshipLabel: string;
}

export interface TaskforcePlan {
  readonly id: string;
  readonly name: string;
  readonly theater: MilitaryTheaterId;
  readonly originSector: number;
  readonly targetSector: number;
  readonly supplyLineDistance: number;
  readonly supplyEfficiencyPct: number;
  readonly projectedWinChancePct: number;
}

export interface ExternalCityState {
  readonly id: string;
  readonly name: string;
  readonly factionName: string;
  readonly stance: 'ALLIED' | 'NEUTRAL' | 'HOSTILE';
  readonly sectorIndex: number;
  readonly respectScore: number; // -100..+100 (GTA2-style faction respect)
  readonly tradeBonusCredits: number;
  readonly techExchangeAvailable: string;
  readonly intelLevelPct: number;
}

export interface LocalPolityState {
  readonly id: string;
  readonly name: string;
  readonly kind: 'FAUNA_BIOME' | 'TRIBE' | 'CITY_STATE' | 'LOCAL_STATE';
  readonly sectorIndex: number;
  readonly attitude: 'CURIOUS' | 'CAUTIOUS' | 'DEFENSIVE';
  readonly populationEstimate: number;
  readonly ecologicalRole: string;
}

export interface CivilPressureStatus {
  readonly stars: 0 | 1 | 2 | 3 | 4 | 5;
  readonly label: string;
  readonly primaryDriver: string;
  readonly patrolCoveragePct: number;
}

export function computeFourTheaterForces(world: WorldState): readonly TheaterForceSummary[] {
  const ships = world.fleetShips ?? [];
  const fleetTotals = computeFleetTotals(ships);
  const spaceUnits = ships.length + world.militaryRoster.filter((u) => u.unitClass === 'ORBITAL_CORVETTE').reduce((a, u) => a + u.count, 0);
  const airUnits = world.drones.attack + world.drones.recon + world.militaryRoster.filter((u) => u.unitClass === 'DRONE_SWARM').reduce((a, u) => a + u.count, 0);
  const landUnits = world.militaryRoster
    .filter((u) => u.unitClass === 'INFANTRY_EXO' || u.unitClass === 'ARMOR_MECH')
    .reduce((a, u) => a + u.count, 0);
  const seaUnits = Math.max(2, Math.floor(world.resources.water / 65) + world.unlockedSlots * 2);

  const fuelOk = world.resources.orbitalFuel >= 15;
  const energyOk = world.resources.energy >= 20;
  const flagship = ships[0];
  const flagshipLabel = flagship
    ? `${flagship.name} (${fleetTotals.totalModulesFitted} mod. flotte)`
    : 'Corvette Aurore-I';

  return [
    {
      id: 'SPACE',
      label: 'Spatial',
      unitCount: spaceUnits,
      powerScore: spaceUnits * 16 + fleetTotals.totalCombatRating + world.datacenterTier * 18,
      readinessPct: fuelOk ? Math.min(100, 86 + Math.min(14, fleetTotals.totalModulesFitted * 2)) : 58,
      supplyStatus: fuelOk ? 'OPTIMAL' : 'TENDU',
      flagshipLabel,
    },
    {
      id: 'AIR',
      label: 'Ciel',
      unitCount: airUnits,
      powerScore: airUnits * 14 + world.drones.defense * 9,
      readinessPct: energyOk ? 89 : 62,
      supplyStatus: energyOk ? 'OPTIMAL' : 'TENDU',
      flagshipLabel: 'Escadrille Drones Stratosphère',
    },
    {
      id: 'LAND',
      label: 'Terrestre',
      unitCount: landUnits,
      powerScore: landUnits * 16 + world.capturedTiles.length * 4,
      readinessPct: world.resources.breathingKits >= 10 ? 94 : 64,
      supplyStatus: world.resources.breathingKits >= 10 ? 'OPTIMAL' : 'RUPTURE',
      flagshipLabel: 'Division Exo-Blindée #1',
    },
    {
      id: 'SEA',
      label: 'Maritime',
      unitCount: seaUnits,
      powerScore: seaUnits * 19 + Math.round((world.terra?.hydro ?? 22) * 0.8),
      readinessPct: (world.terra?.hydro ?? 22) >= 20 ? 86 : 60,
      supplyStatus: (world.terra?.hydro ?? 22) >= 20 ? 'OPTIMAL' : 'TENDU',
      flagshipLabel: 'Frégate Hydro-Glisseur Thalassa',
    },
  ];
}

export function simulateTaskforcePlan(
  world: WorldState,
  theater: MilitaryTheaterId,
  targetSector: number,
  name: string,
): TaskforcePlan {
  const originSector = world.capturedTiles[0] ?? 12;
  const supplyLineDistance = Math.max(1, Math.abs(targetSector - originSector) % 18);
  const supplyEfficiencyPct = Math.max(42, Math.min(100, 100 - supplyLineDistance * 3 + world.transporterTier * 4));
  const theaterForce = computeFourTheaterForces(world).find((f) => f.id === theater);
  const power = theaterForce?.powerScore ?? 80;
  const projectedWinChancePct = Math.max(
    18,
    Math.min(96, Math.round(42 + power * 0.14 + (supplyEfficiencyPct - 70) * 0.5)),
  );

  return {
    id: `tf-${theater.toLowerCase()}-${targetSector}`,
    name: name.trim() || `Force ${theater} → Secteur #${targetSector}`,
    theater,
    originSector,
    targetSector,
    supplyLineDistance,
    supplyEfficiencyPct,
    projectedWinChancePct,
  };
}

export function buildExternalCitiesRoster(world: WorldState): readonly ExternalCityState[] {
  return world.rivals.slice(0, 4).map((rival, idx) => {
    const stance: ExternalCityState['stance'] =
      rival.relationWithPlayer >= 25
        ? 'ALLIED'
        : rival.relationWithPlayer <= -20
          ? 'HOSTILE'
          : 'NEUTRAL';
    return {
      id: `ext-city-${rival.id}`,
      name: `Port-${rival.code} ${idx + 1}`,
      factionName: rival.name,
      stance,
      sectorIndex: (24 + idx * 11) % 72,
      respectScore: Math.round(rival.relationWithPlayer),
      tradeBonusCredits: stance === 'ALLIED' ? 95 : stance === 'NEUTRAL' ? 45 : 0,
      techExchangeAvailable:
        idx === 0
          ? 'Filtres Biopolymères Mk.II'
          : idx === 1
            ? 'Réseaux Maglev Haute Densité'
            : idx === 2
              ? 'Optique Orbitale Basse Latence'
              : 'Synthèse Hydroponique Salée',
      intelLevelPct: Math.max(25, Math.min(95, 35 + world.drones.recon * 8 + idx * 5)),
    };
  });
}

export function buildLocalPolitiesRoster(world: WorldState): readonly LocalPolityState[] {
  return [
    {
      id: 'pol-fauna-steppe',
      name: 'Hardes Silico-Coralliennes',
      kind: 'FAUNA_BIOME',
      sectorIndex: 19,
      attitude: world.atmosphereProgress >= 30 ? 'CURIOUS' : 'CAUTIOUS',
      populationEstimate: 420,
      ecologicalRole: 'Stabilise la minéralisation des sols et filtre les poussières fines.',
    },
    {
      id: 'pol-tribe-canyon',
      name: 'Clan Nomade des Crêtes',
      kind: 'TRIBE',
      sectorIndex: 31,
      attitude: world.approval >= 60 ? 'CURIOUS' : 'DEFENSIVE',
      populationEstimate: 1150,
      ecologicalRole: 'Connaissance ancestrale des nappes phréatiques souterraines.',
    },
    {
      id: 'pol-state-val',
      name: 'Cité-État de Val-Sélène',
      kind: 'LOCAL_STATE',
      sectorIndex: 47,
      attitude: world.superAllianceTrust >= 65 ? 'CURIOUS' : 'CAUTIOUS',
      populationEstimate: 8400,
      ecologicalRole: 'Carrefour artisanal indépendant sensible aux traités de respect mutuel.',
    },
  ];
}

/**
 * OpenGTA2 / OpenRW-inspired Civil Pressure Star Escalation (0..5★)
 * driven deterministically by approval, shortages, active P0 crises, and patrol coverage.
 */
export function computeCivilPressureStars(world: WorldState): CivilPressureStatus {
  const p0Count = world.activeDossiers.filter((d) => d.dossierClass === 'P0').length;
  const lowApprovalPenalty = world.approval < 40 ? 2 : world.approval < 58 ? 1 : 0;
  const shortagePenalty =
    world.resources.food < 15 || world.resources.water < 15 || world.resources.breathingKits < 5 ? 1 : 0;
  const patrolCoveragePct = Math.min(
    100,
    Math.round(35 + world.drones.defense * 9 + world.militaryRoster.reduce((a, u) => a + u.count, 0) * 2),
  );
  const rawStars = Math.max(
    0,
    Math.min(5, p0Count + lowApprovalPenalty + shortagePenalty + (patrolCoveragePct < 55 ? 1 : 0)),
  ) as 0 | 1 | 2 | 3 | 4 | 5;

  const labels: Record<number, string> = {
    0: 'Sérénité Civique',
    1: 'Vigilance Locale',
    2: 'Tensions de Quartier',
    3: 'Pression Civile Élevée',
    4: 'État d’Urgence Urbain',
    5: 'Crise Critique de Souveraineté',
  };

  const primaryDriver =
    p0Count > 0
      ? `${p0Count} crise(s) P0 active(s)`
      : lowApprovalPenalty > 0
        ? `Approbation basse (${Math.round(world.approval)}%)`
        : shortagePenalty > 0
          ? 'Tension sur les stocks vitaux'
          : 'Patrouilles & services civils stables';

  return {
    stars: rawStars,
    label: labels[rawStars] ?? 'Vigilance',
    primaryDriver,
    patrolCoveragePct,
  };
}
