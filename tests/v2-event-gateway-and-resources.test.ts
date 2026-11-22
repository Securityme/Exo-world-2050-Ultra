import { describe, expect, it } from 'vitest';
import { createInitialWorldState } from '../src/core/loop/cycle-orchestrator.ts';
import { generateActionEventDossier } from '../src/systems/dossiers-pa/action-event-generator.ts';
import {
  getEffectiveOptionsForDossier,
  getSubChoicesForOption,
} from '../src/systems/dossiers-pa/dossier-subchoices.ts';
import {
  resolveDossierContext,
  tokenizeEntityText,
} from '../src/systems/dossiers-pa/entity-markup.ts';
import { executeDossierDecision } from '../src/systems/dossiers-pa/pa-engine.ts';
import { computeResourceForecast } from '../src/systems/economy-urban/resource-forecast.ts';

describe('v2 Event-Only Action Gateway, Multi-Choices, Sub-Choices & Entity Balises', () => {
  it('computes deterministic resource flows, net credits, and bounded maintenance load', () => {
    const world = createInitialWorldState({
      campaignId: 'test-forecast',
      worldSeed: 2050,
      superpowerId: 'eu-spatiale',
      doctrineId: 'SOLARPUNK',
      rivalCount: 5,
    });

    const report = computeResourceForecast(world);
    expect(report.metrics).toHaveLength(8);
    expect(report.taxIncome).toBeGreaterThan(0);
    expect(report.netCreditsPerCycle).toBe(
      report.taxIncome - report.upkeepCost - report.respiratoryCost - report.loanPaymentEstimate,
    );
    expect(report.maintenanceLoadPct).toBeGreaterThanOrEqual(12);
    expect(report.maintenanceLoadPct).toBeLessThanOrEqual(98);
    expect(report.nextActionHint.length).toBeGreaterThan(10);
  });

  it('escalates maintenance load under solar flares and worn district integrity', () => {
    const world = createInitialWorldState({
      campaignId: 'test-wear',
      worldSeed: 9001,
      superpowerId: 'eu-spatiale',
      doctrineId: 'CORPORATE',
      rivalCount: 5,
    });

    const base = computeResourceForecast(world);
    const stressed = computeResourceForecast({
      ...world,
      weatherState: 'SOLAR_FLARE',
      districts: world.districts.map((d) => ({ ...d, integrity: 40 })),
    });

    expect(stressed.maintenanceLoadPct).toBeGreaterThan(base.maintenanceLoadPct);
  });

  it('routes district grafting exclusively through generated 4-choice Executive Event Dossiers', () => {
    const world = createInitialWorldState({
      campaignId: 'test-gateway',
      worldSeed: 2050,
      superpowerId: 'eu-spatiale',
      doctrineId: 'SOLARPUNK',
      rivalCount: 5,
    });
    const targetDist = world.districts[2]!;

    const [genErr, genRes] = generateActionEventDossier(world, {
      kind: 'GRAFT_MODULE',
      districtId: targetDist.id,
    });
    expect(genErr).toBeNull();
    expect(genRes!.dossier.source).toBe('ACTION_GATEWAY');
    expect(genRes!.dossier.options.length).toBeGreaterThanOrEqual(4);

    const stdOption = genRes!.dossier.options[0]!;
    const [execErr, execRes] = executeDossierDecision(genRes!.nextState, {
      dossierId: genRes!.dossier.id,
      optionId: stdOption.id,
      refinementLevel: 0,
      assignedAdvisorId: world.advisors[0]!.id,
      useGeneralPaFallback: true,
      moduleExtensionTag: 'NONE',
    });

    expect(execErr).toBeNull();
    const updatedDist = execRes!.nextState.districts.find((d) => d.id === targetDist.id)!;
    expect(updatedDist.modulesCount).toBe(targetDist.modulesCount + 1);
    expect(execRes!.nextState.resources.credits).toBe(world.resources.credits - 140);
    expect(execRes!.nextState.resources.materials).toBe(world.resources.materials - 30);
  });

  it('allows cancelling any generated action event with zero resource spend', () => {
    const world = createInitialWorldState({
      campaignId: 'test-cancel',
      worldSeed: 4040,
      superpowerId: 'eu-spatiale',
      doctrineId: 'CORPORATE',
      rivalCount: 5,
    });
    const [genErr, genRes] = generateActionEventDossier(world, {
      kind: 'BANK_LOAN',
      principal: 400,
    });
    expect(genErr).toBeNull();
    const cancelOption = genRes!.dossier.options.find(
      (o) => o.actionPayload?.kind === 'DEFER_ACTION',
    )!;
    expect(cancelOption).toBeDefined();

    const [execErr, execRes] = executeDossierDecision(genRes!.nextState, {
      dossierId: genRes!.dossier.id,
      optionId: cancelOption.id,
      refinementLevel: 0,
      assignedAdvisorId: world.advisors[0]!.id,
      useGeneralPaFallback: true,
      moduleExtensionTag: 'NONE',
    });

    expect(execErr).toBeNull();
    expect(execRes!.nextState.resources.credits).toBe(world.resources.credits);
    expect(execRes!.nextState.finance.loans).toHaveLength(0);
  });

  it('guarantees >= 4 primary choices and 3 sub-choices per option and applies sub-choice bonuses', () => {
    const world = createInitialWorldState({
      campaignId: 'test-subchoices',
      worldSeed: 2050,
      superpowerId: 'eu-spatiale',
      doctrineId: 'SOLARPUNK',
      rivalCount: 5,
    });

    const dossier = world.activeDossiers[1]!;
    const effectiveOptions = getEffectiveOptionsForDossier(dossier);
    expect(effectiveOptions.length).toBeGreaterThanOrEqual(4);

    const opt = effectiveOptions[1]!;
    const subChoices = getSubChoicesForOption(opt, dossier.dossierClass);
    expect(subChoices).toHaveLength(3);

    const budgetSub = subChoices[1]!;
    const [errStd, resStd] = executeDossierDecision(world, {
      dossierId: dossier.id,
      optionId: opt.id,
      subChoiceId: subChoices[0]!.id,
      refinementLevel: 0,
      assignedAdvisorId: world.advisors[0]!.id,
      useGeneralPaFallback: true,
      moduleExtensionTag: 'NONE',
    });
    const [errSub, resSub] = executeDossierDecision(world, {
      dossierId: dossier.id,
      optionId: opt.id,
      subChoiceId: budgetSub.id,
      refinementLevel: 0,
      assignedAdvisorId: world.advisors[0]!.id,
      useGeneralPaFallback: true,
      moduleExtensionTag: 'NONE',
    });

    expect(errStd).toBeNull();
    expect(errSub).toBeNull();
    expect(resSub!.summary).toContain(budgetSub.label);
    const deltaCredits =
      resSub!.nextState.resources.credits - resStd!.nextState.resources.credits;
    expect(deltaCredits).toBe(budgetSub.bonusEffects?.credits ?? 0);
  });

  it('tokenizes places, buildings, characters, sectors, and entities losslessly and resolves dossier context', () => {
    const world = createInitialWorldState({
      campaignId: 'test-markup',
      worldSeed: 2050,
      superpowerId: 'eu-spatiale',
      doctrineId: 'SOLARPUNK',
      rivalCount: 5,
    });

    const sample =
      'Sur la Colonie principale (Secteur #14), Dr. Mei-Ling Chen inspecte la Centrale solaire avec les Drones de Chantier.';
    const segments = tokenizeEntityText(sample, world);

    // Lossless character reconstruction
    expect(segments.map((s) => s.text).join('')).toBe(sample);

    const entitySegments = segments.filter((s) => s.type === 'ENTITY');
    expect(entitySegments.some((s) => s.kind === 'PLACE' && s.text === 'Colonie principale')).toBe(true);
    expect(entitySegments.some((s) => s.kind === 'PLACE' && s.text === 'Secteur #14')).toBe(true);
    expect(entitySegments.some((s) => s.kind === 'CHARACTER' && s.text === 'Dr. Mei-Ling Chen')).toBe(true);
    expect(entitySegments.some((s) => s.kind === 'BUILDING' && s.text === 'Centrale solaire')).toBe(true);
    expect(entitySegments.some((s) => s.kind === 'ENTITY' && s.text === 'Drones de Chantier')).toBe(true);

    const ctx = resolveDossierContext(world, world.activeDossiers[0]!);
    expect(ctx.placeLabel).toContain('Colonie principale');
    expect(ctx.building).not.toBeNull();
    expect(ctx.advisor).not.toBeNull();
  });
});
