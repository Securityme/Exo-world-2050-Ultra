import type { WorldState } from '../../contracts/world-state.schema.ts';
import type { Playtest6TurnsReport } from './playtest-6-turns.ts';

/**
 * [L3] EXW.L3.RESOURCE_TREND_PROJECTION | v1.6.0 | SADT A3.2
 * 100% pure deterministic 6-turn Production vs Consumption projection engine
 * covering all 18 primary EXO WORLD : 2050 resources.
 */
export type ResourcePillar = 'ENERGIE_FLUIDES' | 'INDUSTRIE_TECH' | 'BIOSPHERE_SURVIE' | 'SOUVERAINETE_ORBITE';

export interface ResourceTurnPoint {
  readonly turn: number;
  readonly label: string;
  readonly atmosphereTier: 'P1' | 'P2' | 'P2+';
  readonly production: number;
  readonly consumption: number;
  readonly net: number;
  readonly projectedStock: number;
}

export interface ResourceProjectionSeries {
  readonly id: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly unit: string;
  readonly pillar: ResourcePillar;
  readonly currentStock: number;
  readonly net6TurnTotal: number;
  readonly points: readonly ResourceTurnPoint[];
}

export interface AggregateTurnTrend {
  readonly turn: number;
  readonly label: string;
  readonly atmosphereTier: 'P1' | 'P2' | 'P2+';
  readonly totalProduction: number;
  readonly totalConsumption: number;
  readonly netBalance: number;
}

export interface ResourceTrendProjection18 {
  readonly resources: readonly ResourceProjectionSeries[];
  readonly aggregateTurns: readonly AggregateTurnTrend[];
  readonly surplusCount: number;
  readonly deficitCount: number;
}

interface ResourceSeedSpec {
  readonly id: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly unit: string;
  readonly pillar: ResourcePillar;
  readonly stockOf: (w: WorldState) => number;
  readonly baseProd: (w: WorldState) => number;
  readonly baseCons: (w: WorldState) => number;
  readonly prodGrowth: number;
  readonly consGrowth: number;
  readonly p2ConsFactor: number;
}

const PRIMARY_18_RESOURCES: readonly ResourceSeedSpec[] = Object.freeze([
  { id: 'credits', label: 'Crédits Fédéraux', shortLabel: 'Crédits', unit: 'Cr', pillar: 'SOUVERAINETE_ORBITE', stockOf: (w) => w.resources.credits, baseProd: (w) => Math.max(140, w.finance.cityTaxIncome), baseCons: (w) => Math.max(70, w.finance.maintenanceUpkeep + w.finance.respiratoryCost), prodGrowth: 0.11, consGrowth: 0.06, p2ConsFactor: 0.90 },
  { id: 'energy', label: 'Énergie Solaire', shortLabel: 'Énergie', unit: 'MW', pillar: 'ENERGIE_FLUIDES', stockOf: (w) => w.resources.energy, baseProd: (w) => 52 + w.districts.length * 8, baseCons: (w) => 30 + w.districts.length * 5, prodGrowth: 0.14, consGrowth: 0.08, p2ConsFactor: 0.95 },
  { id: 'water', label: 'Eau Purifiée', shortLabel: 'Eau', unit: 'm³', pillar: 'ENERGIE_FLUIDES', stockOf: (w) => w.resources.water, baseProd: (w) => 38 + w.districts.length * 5, baseCons: (w) => 24 + w.colonists.length * 1.4, prodGrowth: 0.09, consGrowth: 0.07, p2ConsFactor: 0.92 },
  { id: 'food', label: 'Vivres Hydroponiques', shortLabel: 'Vivres', unit: 't', pillar: 'BIOSPHERE_SURVIE', stockOf: (w) => w.resources.food, baseProd: (w) => 42 + w.districts.length * 4, baseCons: (w) => 25 + w.colonists.length * 1.6, prodGrowth: 0.10, consGrowth: 0.07, p2ConsFactor: 0.94 },
  { id: 'materials', label: 'Matériaux Composites', shortLabel: 'Matériaux', unit: 't', pillar: 'INDUSTRIE_TECH', stockOf: (w) => w.resources.materials, baseProd: (w) => 46 + w.capturedTiles.length * 3, baseCons: (w) => 28 + w.districts.length * 4, prodGrowth: 0.10, consGrowth: 0.09, p2ConsFactor: 0.96 },
  { id: 'electronics', label: 'Électronique Avancée', shortLabel: 'Électro.', unit: 'u', pillar: 'INDUSTRIE_TECH', stockOf: (w) => w.resources.electronics, baseProd: (w) => 26 + w.datacenterTier * 7, baseCons: (w) => 17 + w.militaryRoster.length * 2.5, prodGrowth: 0.12, consGrowth: 0.10, p2ConsFactor: 1.0 },
  { id: 'compute', label: 'Calcul Datacenter', shortLabel: 'Compute', unit: 'PF', pillar: 'INDUSTRIE_TECH', stockOf: (w) => w.resources.compute, baseProd: (w) => 30 + w.datacenterTier * 11, baseCons: (w) => 18 + w.rivals.length * 3, prodGrowth: 0.15, consGrowth: 0.09, p2ConsFactor: 1.0 },
  { id: 'breathingKits', label: 'Kits Respiratoires O₂', shortLabel: 'Kits O₂', unit: 'u', pillar: 'BIOSPHERE_SURVIE', stockOf: (w) => w.resources.breathingKits, baseProd: () => 22, baseCons: (w) => 24 + w.colonists.length * 0.9, prodGrowth: 0.06, consGrowth: 0.03, p2ConsFactor: 0.70 },
  { id: 'orbitalFuel', label: 'Carburant Orbital', shortLabel: 'Carb. Orb.', unit: 'kL', pillar: 'SOUVERAINETE_ORBITE', stockOf: (w) => w.resources.orbitalFuel, baseProd: (w) => 20 + w.transporterTier * 6, baseCons: (w) => 14 + w.transporterTier * 4, prodGrowth: 0.13, consGrowth: 0.11, p2ConsFactor: 1.0 },
  { id: 'helium3', label: 'Hélium-3 Lunaire', shortLabel: 'Hélium-3', unit: 'kg', pillar: 'SOUVERAINETE_ORBITE', stockOf: (w) => w.resources.helium3, baseProd: (w) => 14 + w.unlockedSlots * 5, baseCons: () => 11, prodGrowth: 0.18, consGrowth: 0.10, p2ConsFactor: 1.0 },
  { id: 'rareEarths', label: 'Terres Rares', shortLabel: 'Terres R.', unit: 't', pillar: 'INDUSTRIE_TECH', stockOf: (w) => w.resources.rareEarths, baseProd: (w) => 18 + w.capturedTiles.length * 1.4, baseCons: () => 15, prodGrowth: 0.08, consGrowth: 0.11, p2ConsFactor: 1.0 },
  { id: 'galacticInfluence', label: 'Influence Fédérale', shortLabel: 'Influence', unit: 'pt', pillar: 'SOUVERAINETE_ORBITE', stockOf: (w) => w.resources.galacticInfluence, baseProd: (w) => 24 + w.eraStars * 5, baseCons: () => 14, prodGrowth: 0.14, consGrowth: 0.06, p2ConsFactor: 0.95 },
  { id: 'bioEnzymes', label: 'Bio-Enzymes Atmo', shortLabel: 'Enzymes', unit: 'kL', pillar: 'BIOSPHERE_SURVIE', stockOf: (w) => Math.round(35 + w.atmosphereProgress * 1.2), baseProd: (w) => 28 + w.atmosphereProgress * 0.6, baseCons: () => 19, prodGrowth: 0.16, consGrowth: 0.08, p2ConsFactor: 0.90 },
  { id: 'radShielding', label: 'Blindage Radiatif', shortLabel: 'RadShield', unit: 'u', pillar: 'BIOSPHERE_SURVIE', stockOf: (w) => Math.round(40 + (w.terra?.radShield ?? 18) * 1.5), baseProd: () => 24, baseCons: () => 17, prodGrowth: 0.09, consGrowth: 0.06, p2ConsFactor: 0.88 },
  { id: 'droneParts', label: 'Châssis Drones D1–D2', shortLabel: 'Drones', unit: 'u', pillar: 'INDUSTRIE_TECH', stockOf: (w) => (w.drones.construction + w.drones.defense + w.drones.attack + w.drones.recon) * 4, baseProd: () => 25, baseCons: (w) => 16 + w.drones.attack * 1.5, prodGrowth: 0.11, consGrowth: 0.09, p2ConsFactor: 0.95 },
  { id: 'medicalGel', label: 'Biogels Médicaux', shortLabel: 'Médical', unit: 'u', pillar: 'BIOSPHERE_SURVIE', stockOf: (w) => Math.round(45 + w.approval * 0.5), baseProd: () => 26, baseCons: (w) => 18 + w.colonists.length * 0.7, prodGrowth: 0.08, consGrowth: 0.05, p2ConsFactor: 0.82 },
  { id: 'hydrogenCells', label: 'Cellules Hydrogène', shortLabel: 'Hydrogène', unit: 'MWh', pillar: 'ENERGIE_FLUIDES', stockOf: (w) => Math.round(w.resources.energy * 0.65), baseProd: () => 34, baseCons: () => 23, prodGrowth: 0.13, consGrowth: 0.08, p2ConsFactor: 0.94 },
  { id: 'orbitalAlloys', label: 'Alliages Orbitaux', shortLabel: 'Alliages', unit: 't', pillar: 'SOUVERAINETE_ORBITE', stockOf: (w) => Math.round(w.resources.materials * 0.45), baseProd: () => 22, baseCons: () => 18, prodGrowth: 0.12, consGrowth: 0.12, p2ConsFactor: 1.0 },
]);

export function buildResourceTrendProjection18(
  world: WorldState,
  report: Playtest6TurnsReport,
): ResourceTrendProjection18 {
  const resources: ResourceProjectionSeries[] = PRIMARY_18_RESOURCES.map((spec) => {
    const startStock = Math.max(0, Math.round(spec.stockOf(world)));
    const prod0 = Math.max(5, spec.baseProd(world));
    const cons0 = Math.max(3, spec.baseCons(world));
    let runningStock = startStock;
    let net6TurnTotal = 0;

    const points: ResourceTurnPoint[] = report.turns.map((turnRec, idx) => {
      const isP2Plus = turnRec.atmosphereTier !== 'P1';
      const combatSpike = turnRec.turn === 4 && (spec.id === 'energy' || spec.id === 'compute' || spec.id === 'droneParts' || spec.id === 'orbitalAlloys') ? 1.16 : 1.0;
      const echoBoost = turnRec.turn >= 3 && (spec.id === 'energy' || spec.id === 'hydrogenCells') ? 1.14 : 1.0;
      const deltaMod = 1 + turnRec.deltaPAdapt * 0.4;

      const production = Math.round(prod0 * (1 + spec.prodGrowth * idx) * echoBoost * deltaMod);
      const consumption = Math.round(cons0 * (1 + spec.consGrowth * idx) * (isP2Plus ? spec.p2ConsFactor : 1.0) * combatSpike);
      const net = production - consumption;
      runningStock = Math.max(0, runningStock + net);
      net6TurnTotal += net;

      return {
        turn: turnRec.turn,
        label: `T${turnRec.turn}`,
        atmosphereTier: turnRec.atmosphereTier,
        production,
        consumption,
        net,
        projectedStock: runningStock,
      };
    });

    return {
      id: spec.id,
      label: spec.label,
      shortLabel: spec.shortLabel,
      unit: spec.unit,
      pillar: spec.pillar,
      currentStock: startStock,
      net6TurnTotal,
      points,
    };
  });

  const aggregateTurns: AggregateTurnTrend[] = report.turns.map((turnRec, idx) => {
    let totalProduction = 0;
    let totalConsumption = 0;
    for (const r of resources) {
      const pt = r.points[idx];
      if (pt) {
        totalProduction += pt.production;
        totalConsumption += pt.consumption;
      }
    }
    return {
      turn: turnRec.turn,
      label: `T${turnRec.turn} (${turnRec.atmosphereTier})`,
      atmosphereTier: turnRec.atmosphereTier,
      totalProduction,
      totalConsumption,
      netBalance: totalProduction - totalConsumption,
    };
  });

  const surplusCount = resources.filter((r) => r.net6TurnTotal >= 0).length;
  return {
    resources,
    aggregateTurns,
    surplusCount,
    deficitCount: resources.length - surplusCount,
  };
}
