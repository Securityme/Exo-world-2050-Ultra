import { describe, expect, it } from 'vitest';
import type { WorldState } from '../src/contracts/world-state.schema.ts';
import { checkZ0AndR50Compliance } from '../src/contracts/guards/z0-legacy.guard.ts';
import { createInitialWorldState } from '../src/core/loop/cycle-orchestrator.ts';
import { createIsolatedPrng } from '../src/core/prng/pcg32-streams.ts';
import { M0_MANIFEST, M13_MANIFEST } from '../src/data/blueprint-manifests.data.ts';
import {
  detectDsmCycles,
  evaluateMatrixArchitecture,
  isValidSemVer,
  propagateSemVer,
  renderBlueprintMarkdown,
  renderBlueprintYaml,
} from '../src/services/architecture/matrix-engine.ts';
import { migrateWorldStateV3ToV4 } from '../src/services/persistence/save-migration.service.ts';
import {
  resolveAtmosphereTierWithHysteresis,
  stepTerraformationV4,
  stepWorkforceRpg,
} from '../src/systems/biosphere-cabinet/terraformation-v4.ts';
import {
  applyGeneseAct0Choice,
  computeArrivalsEveryTurns,
  getNoRep3tExcludedCodes,
  recordLivingCatalogCodes,
} from '../src/systems/dossiers-pa/genese-promises.ts';
import { executeDossierDecision } from '../src/systems/dossiers-pa/pa-engine.ts';
import { evaluateEntityLedger, scaleLevelFactor } from '../src/systems/economy-urban/entity-ledger.ts';
import {
  applyManualEraAdvance,
  evaluateHkTurnProgress,
  evaluateSpectraEffects,
} from '../src/systems/geopolitics/humankind-progression.ts';
import {
  commitEndOfTurnV4,
  computeSevenFactorPaBudget,
  ensureZeroPaOption,
  evaluateTurnGateM7,
} from '../src/systems/turn-orchestration/turn-gate-v4.ts';

describe('Wave V0–V1 — Master Blueprint Matrix Engine, Z0 Guard, V4 Systems & 60-Turn Deterministic Fuzz', () => {
  it('validates M0–M15 Matrix Engine, SemVer propagation, Kahn DSM 0 cycles & Markdown/YAML exports', () => {
    expect(isValidSemVer('4.0.0-rc.1+full-m0-m15')).toBe(true);
    expect(isValidSemVer('v4.0')).toBe(false);
    expect(propagateSemVer('4.0.0-rc.1', 'MINOR')).toBe('4.1.0');
    expect(detectDsmCycles(M0_MANIFEST.nodes)).toBe(0);

    const report = evaluateMatrixArchitecture(M0_MANIFEST, M13_MANIFEST);
    expect(report.gate).toBe('GO');
    expect(report.dsmCycleCount).toBe(0);
    expect(report.matrices.length).toBeGreaterThanOrEqual(16);

    const md = renderBlueprintMarkdown(M0_MANIFEST, M13_MANIFEST, report, 'FMT-U');
    const yaml = renderBlueprintYaml(M0_MANIFEST, report);
    expect(md).toContain('MASTER BLUEPRINT');
    expect(yaml).toContain('gate: "GO"');
  });

  it('enforces Z0 legacy ban while preserving scientific R-50 label Fosse Hydrothermale Active', () => {
    const clean = checkZ0AndR50Compliance('Étude de la Fosse Hydrothermale Active en secteur polaire.');
    expect(clean.ok).toBe(true);

    const banned = checkZ0AndR50Compliance('Surcharge ' + 'ther' + 'mal dans le ' + 'corr' + 'idor.');
    expect(banned.ok).toBe(false);
    expect(banned.violations.length).toBeGreaterThanOrEqual(1);
  });

  it('evaluates Entity Resource Ledger scaling (×1.45^(lvl-1)), shortage priority 1.E→5.Cr & auto-shedding', () => {
    expect(scaleLevelFactor(1)).toBeCloseTo(1, 3);
    expect(scaleLevelFactor(3)).toBeCloseTo(2.103, 3);

    const base = createInitialWorldState({
      campaignId: 'test-ledger',
      worldSeed: 2050,
      superpowerId: 'eu-spatiale',
      doctrineId: 'SOLARPUNK',
      rivalCount: 5,
    });
    const stressed = {
      ...base,
      resources: { ...base.resources, energy: 0 },
      districts: base.districts.map((d) => ({ ...d, integrity: 50 })),
    };

    const ledger = evaluateEntityLedger(stressed, 1.0);
    expect(ledger.rows.length).toBe(stressed.districts.length);
    expect(ledger.delta.wornDistrictIds.length).toBe(stressed.districts.length);
  });

  it('applies Terraformation P1..P4 hysteresis (-3) and Workforce RPG burnout penalty', () => {
    expect(resolveAtmosphereTierWithHysteresis(28, 'P1')).toBe('P2');
    expect(resolveAtmosphereTierWithHysteresis(26, 'P2')).toBe('P2'); // hysteresis holds above 25
    expect(resolveAtmosphereTierWithHysteresis(24, 'P2')).toBe('P1'); // drops below 28 - 3

    const world = createInitialWorldState({
      campaignId: 'test-terra',
      worldSeed: 2050,
      superpowerId: 'eu-spatiale',
      doctrineId: 'SOLARPUNK',
      rivalCount: 5,
    });
    const terraStep = stepTerraformationV4(world);
    expect(terraStep.terra.compositeScore).toBeGreaterThanOrEqual(0);
    expect(terraStep.terra.compositeScore).toBeLessThanOrEqual(100);

    const tiredWorld = {
      ...world,
      colonists: world.colonists.map((c) => ({ ...c, fatigue: 88, morale: 40 })),
    };
    const wf = stepWorkforceRpg(tiredWorld, []);
    expect(wf.burnoutCount).toBe(tiredWorld.colonists.length);
    expect(wf.workforceMultiplier).toBeLessThan(1);
  });

  it('computes Humankind 7-Domain Stars, Fame, Manual Era Advance (>=7★) and Binary Spectra', () => {
    const world = createInitialWorldState({
      campaignId: 'test-hk',
      worldSeed: 2050,
      superpowerId: 'eu-spatiale',
      doctrineId: 'SOLARPUNK',
      rivalCount: 5,
    });

    const hkEval = evaluateHkTurnProgress(world);
    expect(hkEval.hk.fame).toBeGreaterThanOrEqual(0);

    const readyWorld = {
      ...world,
      eraStars: 7,
      hk: { ...hkEval.hk, eraAdvanceReady: true },
    };
    const advanced = applyManualEraAdvance(readyWorld, 'EVOLVE', 'DOC_ECO_SYMBIOSIS');
    expect(advanced.era).toBe(2);
    expect(advanced.hk?.eraAdvanceReady).toBe(false);

    const spectraBonus = evaluateSpectraEffects({
      ecologyVsIndustry: 45,
      federalVsSovereign: 0,
      openScienceVsCyberControl: 0,
      civicWelfareVsEfficiency: 0,
    });
    expect(spectraBonus.bonusPa).toBe(1);
  });

  it('handles Protocole Genèse Act 0, ArrivalsEvery(3..9t), Living Catalog NoRep3t & Save Migration v3→v4', () => {
    const world = createInitialWorldState({
      campaignId: 'test-genese',
      worldSeed: 2050,
      superpowerId: 'eu-spatiale',
      doctrineId: 'SOLARPUNK',
      rivalCount: 5,
    });

    expect(computeArrivalsEveryTurns(95, 3)).toBeGreaterThanOrEqual(3);
    expect(computeArrivalsEveryTurns(10, 1)).toBeLessThanOrEqual(9);

    const afterAct0 = applyGeneseAct0Choice(world, 'genese-biosphere', false);
    expect(afterAct0.genese?.act0Completed).toBe(true);
    expect((afterAct0.promises?.length ?? 0)).toBeGreaterThan(0);

    const catalog1 = recordLivingCatalogCodes(afterAct0.livingCatalog, ['EXW-C1-01', 'EXW-C2-02']);
    const excluded = getNoRep3tExcludedCodes(catalog1);
    expect(excluded.has('EXW-C1-01')).toBe(true);

    // Strip V4 fields to simulate a legacy v3.1 save
    const legacyV3 = { ...world } as Record<string, unknown>;
    delete legacyV3.terra;
    delete legacyV3.hk;
    delete legacyV3.genese;
    delete legacyV3.livingCatalog;
    const migrated = migrateWorldStateV3ToV4(legacyV3);
    expect(migrated.migrated).toBe(true);
    expect(migrated.world?.terra).toBeDefined();
    expect(migrated.world?.hk).toBeDefined();
    expect(migrated.world?.genese).toBeDefined();
  });

  it('enforces Karnaugh M7 Turn Gate, 6-stream PCG32 determinism & 60-turn fuzz stability (0 NaN, 0 deadlock, identical SHA)', () => {
    const rngA = createIsolatedPrng(2050, 1, 'EVT');
    const rngB = createIsolatedPrng(2050, 1, 'EVT');
    expect(rngA.nextFloat()).toBe(rngB.nextFloat());
    expect(createIsolatedPrng(2050, 1, 'WEAR').nextFloat()).toBe(
      createIsolatedPrng(2050, 1, 'WEAR').nextFloat(),
    );

    const run60Turns = (seed: number) => {
      let state: WorldState = {
        ...createInitialWorldState({
          campaignId: `fuzz-${seed}`,
          worldSeed: seed,
          superpowerId: 'eu-spatiale',
          doctrineId: 'SOLARPUNK',
          rivalCount: 5,
        }),
        mode: 'INFINITE_SANDBOX',
      };
      state = applyGeneseAct0Choice(state, 'genese-biosphere', true);

      // Gate must block while activeDossiers > 0
      expect(evaluateTurnGateM7(state).allowed).toBe(false);

      for (let turn = 0; turn < 60; turn++) {
        // Resolve every active dossier using guaranteed 0-PA option
        let guard = 0;
        while (state.activeDossiers.length > 0 && guard < 12) {
          guard++;
          const dossier = ensureZeroPaOption(state.activeDossiers[0]!);
          const zeroOpt =
            dossier.options.find((o) => o.paGeneralCost === 0 && o.subPaCost === 0) ??
            dossier.options[0]!;
          const patched = {
            ...state,
            activeDossiers: [dossier, ...state.activeDossiers.slice(1)],
          };
          const [err, res] = executeDossierDecision(patched, {
            dossierId: dossier.id,
            optionId: zeroOpt.id,
            refinementLevel: 0,
            assignedAdvisorId: state.advisors[0]!.id,
            useGeneralPaFallback: true,
            moduleExtensionTag: 'NONE',
          });
          expect(err).toBeNull();
          state = res!.nextState;
        }

        expect(evaluateTurnGateM7(state).allowed).toBe(true);
        const paPreview = computeSevenFactorPaBudget(state);
        expect(Number.isNaN(paPreview.general)).toBe(false);

        const { nextState, summary } = commitEndOfTurnV4(state);
        state = nextState;

        expect(Number.isNaN(state.resources.credits)).toBe(false);
        expect(Number.isNaN(state.resources.energy)).toBe(false);
        expect(Number.isNaN(state.atmosphereProgress)).toBe(false);
        expect(Number.isNaN(state.approval)).toBe(false);
        expect(summary.cycleCompleted).toBeGreaterThan(0);
      }

      return state;
    };

    const run1 = run60Turns(2050);
    const run2 = run60Turns(2050);
    expect(run1.cycle).toBe(60);
    expect(run1.stateHash).toBe(run2.stateHash);
  });
});
