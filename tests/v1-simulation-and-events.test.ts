import { describe, expect, it } from 'vitest';
import {
  advanceFullCycle,
  createInitialWorldState,
} from '../src/core/loop/cycle-orchestrator.ts';
import { executeDossierDecision } from '../src/systems/dossiers-pa/pa-engine.ts';
import { buildContextualFallbackDossier } from '../src/pipelines/oracle-dossier.pipeline.ts';

describe('Wave 1 — Production Simulation Engine & Contextual Event Generator', () => {
  it('applies distinct deterministic doctrine modifiers across SOLARPUNK vs CORPORATE', () => {
    const solarInit = createInitialWorldState({
      campaignId: 'doc-solar',
      worldSeed: 20500409,
      superpowerId: 'eu-spatiale',
      doctrineId: 'SOLARPUNK',
      rivalCount: 5,
    });
    const corpInit = createInitialWorldState({
      campaignId: 'doc-corp',
      worldSeed: 20500409,
      superpowerId: 'eu-spatiale',
      doctrineId: 'CORPORATE',
      rivalCount: 5,
    });

    let solar = solarInit;
    let corp = corpInit;
    for (let i = 0; i < 4; i += 1) {
      solar = advanceFullCycle(solar);
      corp = advanceFullCycle(corp);
    }

    expect(solar.atmosphereProgress).toBeGreaterThanOrEqual(corp.atmosphereProgress);
    expect(corp.finance.cityTaxIncome).toBeGreaterThan(solar.finance.cityTaxIncome);
    expect(corp.resources.credits).toBeGreaterThan(solar.resources.credits);
  });

  it('executes due triggerBus delayed echoes and updates approval/credits/chronicle', () => {
    const init = createInitialWorldState({
      campaignId: 'echo-exec',
      worldSeed: 9901,
      superpowerId: 'eu-spatiale',
      doctrineId: 'SOLARPUNK',
      rivalCount: 5,
    });
    const dossierWithEcho = init.activeDossiers.find((d) =>
      d.options.some((o) => Boolean(o.effects.delayedEchoSummary)),
    );
    expect(dossierWithEcho).toBeDefined();
    const opt = dossierWithEcho!.options.find((o) => Boolean(o.effects.delayedEchoSummary))!;

    const [err, execReport] = executeDossierDecision(init, {
      dossierId: dossierWithEcho!.id,
      optionId: opt.id,
      refinementLevel: 0,
      assignedAdvisorId: init.advisors[0]!.id,
      useGeneralPaFallback: true,
      moduleExtensionTag: 'NONE',
    });
    expect(err).toBeNull();
    expect(execReport!.nextState.triggerBus.length).toBeGreaterThan(0);

    let afterTwoCycles = advanceFullCycle(execReport!.nextState);
    afterTwoCycles = advanceFullCycle(afterTwoCycles);
    expect(
      afterTwoCycles.chronicle.some(
        (entry) => entry.title.startsWith('Suite :') || entry.title.startsWith('Écho :'),
      ),
    ).toBe(true);
  });

  it('produces district-scaled resources and dynamic seasonal market prices', () => {
    const base = createInitialWorldState({
      campaignId: 'dist-prod',
      worldSeed: 4040,
      superpowerId: 'eu-spatiale',
      doctrineId: 'SCIENTIFIC',
      rivalCount: 5,
    });
    const next = advanceFullCycle(base);
    expect(next.resources.energy).toBeGreaterThan(base.resources.energy);
    expect(next.resources.materials).toBeGreaterThan(base.resources.materials);
    expect(next.resources.compute).toBeGreaterThan(base.resources.compute);
    expect(next.marketPrices.materials).toBeGreaterThanOrEqual(7);
    expect(next.marketPrices.helium3).toBeGreaterThanOrEqual(32);
  });

  it('selects context-aware fallback dossiers avoiding recent chronicle titles and scaling with era', () => {
    const resEra1 = buildContextualFallbackDossier(
      {
        campaignId: 'ctx-1',
        worldSeed: 2050,
        cycle: 3,
        era: 1,
        atmosphereTier: 'P1',
        approval: 75,
        credits: 200,
        adaptiveDeltaP: 0,
        dominantDossierClass: 'C2',
        recentChronicleTitles: ['Charte Solarpunk de Novaterra-1'],
        activeTriggerSummaries: [],
        freeTierGovernorMode: 'LOCAL_DETERMINISTIC',
      },
      'local',
      Date.now(),
    );
    expect(resEra1.dossier.title).not.toBe('Charte Solarpunk de Novaterra-1');
    expect(resEra1.dossier.briefing).not.toContain('Relais local');

    const resEra4 = buildContextualFallbackDossier(
      {
        campaignId: 'ctx-4',
        worldSeed: 2050,
        cycle: 3,
        era: 4,
        atmosphereTier: 'P3',
        approval: 75,
        credits: 200,
        adaptiveDeltaP: 0,
        dominantDossierClass: 'C2',
        recentChronicleTitles: ['Charte Solarpunk de Novaterra-1'],
        activeTriggerSummaries: [],
        freeTierGovernorMode: 'LOCAL_DETERMINISTIC',
      },
      'local',
      Date.now(),
    );
    expect(resEra4.dossier.options[0]!.effects.oracleImpactFactor).toBeGreaterThanOrEqual(-0.15);
    expect(resEra4.dossier.options[0]!.effects.oracleImpactFactor).toBeLessThanOrEqual(0.15);
  });
});
