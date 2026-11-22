import type { ExecutiveDossier } from '../../contracts/pa-dossiers.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';

/**
 * [L3] EXW.L3.PAX_SCENARIO_MATRIX | v5.0.0 | SADT A2.1/A5.1
 * Parameterized Matrix-Bound Scenario Generator (Standard <-> Advanced + Manual Overrides)
 * addressing Pax Historia's lack of structured simulation filters:
 * every parameter is operationally coupled to WorldState & Executive Dossiers.
 */
export interface ScenarioMatrixConfig {
  readonly title: string;
  readonly synopsis: string;
  readonly complexityMode: 'STANDARD' | 'ADVANCED';
  readonly climateHarshness: 1 | 2 | 3 | 4 | 5;
  readonly economicScarcity: 1 | 2 | 3 | 4 | 5;
  readonly rivalAggression: 1 | 2 | 3 | 4 | 5;
  readonly diplomacyOpenness: 1 | 2 | 3 | 4 | 5;
  readonly ethicalEmphasis: 'THOMISM' | 'CIVIC_HUMANISM' | 'ECO_SYMBIOSIS' | 'REALPOLITIK' | 'BALANCED';
  readonly startingEra: 1 | 2 | 3;
  readonly customDirectiveRule: string;
}

export interface CompiledMatrixScenario {
  readonly config: ScenarioMatrixConfig;
  readonly worldPatch: Partial<WorldState>;
  readonly openingDossier: ExecutiveDossier;
  readonly matrixFingerprint: string;
}

export const DEFAULT_SCENARIO_MATRIX: ScenarioMatrixConfig = Object.freeze({
  title: 'Renaissance Kepler 2050',
  synopsis: 'Stabiliser la biosphère tout en préservant l’équilibre civique face aux 5 superpuissances.',
  complexityMode: 'STANDARD',
  climateHarshness: 3,
  economicScarcity: 2,
  rivalAggression: 3,
  diplomacyOpenness: 4,
  ethicalEmphasis: 'THOMISM',
  startingEra: 1,
  customDirectiveRule: 'Priorité aux couloirs Maglev civils et aux traités de partage atmosphérique.',
});

export function compileScenarioMatrix(
  world: WorldState,
  cfg: ScenarioMatrixConfig,
): CompiledMatrixScenario {
  const creditMult = 1.3 - cfg.economicScarcity * 0.14;
  const atmoStart = Math.max(8, Math.min(72, 34 - cfg.climateHarshness * 5 + (cfg.startingEra - 1) * 12));
  const relationShift = (cfg.diplomacyOpenness - cfg.rivalAggression) * 7;

  const nextRivals = world.rivals.map((r) => ({
    ...r,
    relationWithPlayer: Math.max(-90, Math.min(90, r.relationWithPlayer + relationShift)),
    militaryPower: Math.round(r.militaryPower * (0.85 + cfg.rivalAggression * 0.08)),
  }));

  const weatherState: WorldState['weatherState'] =
    cfg.climateHarshness >= 5
      ? 'SOLAR_FLARE'
      : cfg.climateHarshness >= 4
        ? 'DUST_STORM'
        : cfg.climateHarshness <= 2
          ? 'CLEAR'
          : 'RAIN';

  const matrixFingerprint = `MTX-E${cfg.startingEra}-C${cfg.climateHarshness}-S${cfg.economicScarcity}-R${cfg.rivalAggression}-D${cfg.diplomacyOpenness}`;

  const openingDossier: ExecutiveDossier = {
    id: `mtx-open-${world.cycle}-${cfg.climateHarshness}-${cfg.rivalAggression}`,
    code: matrixFingerprint.slice(0, 16),
    dossierClass: cfg.climateHarshness >= 4 || cfg.rivalAggression >= 4 ? 'P0' : 'C1',
    title: `Scénario : ${cfg.title.slice(0, 88)}`,
    briefing: `${cfg.synopsis.slice(0, 260)} Directive matricielle : ${cfg.customDirectiveRule.slice(0, 180)}`,
    source: 'DIRECT_INITIATIVE',
    slotIndex: world.activeSlotIndex,
    tileIndex: 12,
    expiresInCycles: 2,
    scientificTag: cfg.ethicalEmphasis,
    options: [
      {
        id: 'mtx-opt-common-good',
        label: 'Charte du Bien Commun & Coopération',
        doctrineTag: 'SOLARPUNK',
        description: 'Mobilise la biosphère et renforce l’adhésion citoyenne dès l’ouverture du scénario.',
        paGeneralCost: 1,
        subPaDomain: 'PA_BIO',
        subPaCost: 1,
        effects: {
          credits: -60,
          energy: 12,
          materials: 10,
          water: 15,
          food: 15,
          electronics: 0,
          compute: 8,
          breathingKits: 8,
          approvalDelta: 6,
          atmosphereDelta: 4,
          maintenanceDelta: -4,
          allianceTrustDelta: 5,
          eraStarsDelta: 0,
          xpCiv: 35,
          xpCabinet: 25,
          xpAlliance: 30,
          oracleImpactFactor: 0.08,
        },
      },
      {
        id: 'mtx-opt-sovereign',
        label: 'Déploiement Stratégique & Dissuasion',
        doctrineTag: 'SECURITY',
        description: 'Sécurise les lignes logistiques 72 secteurs et stabilise la trésorerie de crise.',
        paGeneralCost: 1,
        subPaDomain: 'PA_MNT',
        subPaCost: 1,
        effects: {
          credits: 120,
          energy: 15,
          materials: 20,
          water: 0,
          food: 0,
          electronics: 10,
          compute: 14,
          breathingKits: 0,
          approvalDelta: -2,
          atmosphereDelta: -1,
          maintenanceDelta: -8,
          allianceTrustDelta: -2,
          eraStarsDelta: 0,
          xpCiv: 25,
          xpCabinet: 35,
          xpAlliance: 15,
          oracleImpactFactor: 0.05,
        },
      },
      {
        id: 'mtx-opt-zero-pa',
        label: 'Observation Prudente (0 PA)',
        doctrineTag: 'SCIENTIFIC',
        description: 'Option gratuite garantie permettant d’évaluer le terrain avant d’engager vos PA.',
        paGeneralCost: 0,
        subPaDomain: null,
        subPaCost: 0,
        effects: {
          credits: 25,
          energy: 5,
          materials: 5,
          water: 5,
          food: 5,
          electronics: 0,
          compute: 5,
          breathingKits: 2,
          approvalDelta: 1,
          atmosphereDelta: 1,
          maintenanceDelta: 0,
          allianceTrustDelta: 1,
          eraStarsDelta: 0,
          xpCiv: 15,
          xpCabinet: 15,
          xpAlliance: 10,
          oracleImpactFactor: 0,
        },
      },
    ],
  };

  return {
    config: cfg,
    worldPatch: {
      era: cfg.startingEra,
      atmosphereProgress: atmoStart,
      weatherState,
      resources: {
        ...world.resources,
        credits: Math.max(150, Math.round(world.resources.credits * creditMult)),
      },
      rivals: nextRivals,
      activeDossiers: [openingDossier, ...world.activeDossiers].slice(0, 5),
    },
    openingDossier,
    matrixFingerprint,
  };
}
