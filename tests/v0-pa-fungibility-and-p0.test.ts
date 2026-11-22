import { describe, expect, it } from 'vitest';
import {
  applyPaAccumulationCap,
  checkP0LockRule,
  computePaAccumulationCap,
  spendPaWithAsymmetricFungibility,
} from '../src/core/dispatchers/dossier.dispatcher.ts';
import { applyP0CycleDamper } from '../src/core/queues/dossier-p0.queue.ts';
import { enqueueTriggerEvent } from '../src/core/bus/trigger-bus.ts';
import { createInitialWorldState } from '../src/core/loop/cycle-orchestrator.ts';
import { executeDossierDecision } from '../src/systems/dossiers-pa/pa-engine.ts';
import { FALLBACK_DOSSIERS_CATALOG } from '../src/data/fallback-dossiers.catalog.ts';
import type { ExecutiveDossier, PaBudget } from '../src/contracts/pa-dossiers.schema.ts';
import type { TriggerBusEvent } from '../src/contracts/trigger-bus.schema.ts';

describe('Wave 0 — PA Asymmetric Fungibility (R-26), 150% Cap (R-29) & P0 Damper (Max 2/Cycle)', () => {
  it('enforces R-26 asymmetric fungibility: PA Général covers Sub-PA deficit, never reverse', () => {
    const budget: PaBudget = {
      general: 4,
      generalRegen: 4,
      generalCap: 6,
      subPa: { PA_GES: 0, PA_MNT: 5, PA_BIO: 2, PA_POL: 1 },
      subPaRegen: { PA_GES: 3, PA_MNT: 3, PA_BIO: 3, PA_POL: 3 },
    };

    const [errNoFallback] = spendPaWithAsymmetricFungibility(budget, {
      dossierClass: 'C2',
      paGeneralCost: 0,
      subPaDomain: 'PA_GES',
      subPaCost: 2,
      useGeneralPaFallback: false,
    });
    expect(errNoFallback).not.toBeNull();
    expect(errNoFallback?.code).toBe('EXW_ERR_PA_INSUFFICIENT');

    const [errWithFallback, nextBudget] = spendPaWithAsymmetricFungibility(budget, {
      dossierClass: 'C2',
      paGeneralCost: 0,
      subPaDomain: 'PA_GES',
      subPaCost: 2,
      useGeneralPaFallback: true,
    });
    expect(errWithFallback).toBeNull();
    expect(nextBudget?.general).toBe(2);
    expect(nextBudget?.subPa.PA_GES).toBe(0);
    expect(nextBudget?.subPa.PA_MNT).toBe(5);
  });

  it('caps accumulated PA strictly at 150% of base regeneration (R-29)', () => {
    expect(computePaAccumulationCap(4)).toBe(6);
    expect(computePaAccumulationCap(3)).toBe(4);

    const saturated = applyPaAccumulationCap({
      general: 5,
      generalRegen: 4,
      generalCap: 6,
      subPa: { PA_GES: 4, PA_MNT: 3, PA_BIO: 2, PA_POL: 0 },
      subPaRegen: { PA_GES: 3, PA_MNT: 3, PA_BIO: 3, PA_POL: 3 },
    });
    expect(saturated.general).toBe(6);
    expect(saturated.subPa.PA_GES).toBe(4);
    expect(saturated.subPa.PA_MNT).toBe(4);
    expect(saturated.subPa.PA_BIO).toBe(4);
    expect(saturated.subPa.PA_POL).toBe(3);
  });

  it('enforces R-32: active P0 crisis blocks C4 & C5 execution', () => {
    const template = FALLBACK_DOSSIERS_CATALOG[0]!;
    const p0Sample: ExecutiveDossier = { ...template, id: 'p0-block', dossierClass: 'P0' };
    const [blockErr] = checkP0LockRule([p0Sample], 'C4');
    expect(blockErr?.code).toBe('EXW_ERR_P0_BLOCK');

    const [allowErr] = checkP0LockRule([p0Sample], 'C2');
    expect(allowErr).toBeNull();

    const state = createInitialWorldState({
      campaignId: 'camp-r32',
      worldSeed: 12345,
      superpowerId: 'eu-spatiale',
      doctrineId: 'SOLARPUNK',
      rivalCount: 5,
    });
    const c4 = state.activeDossiers.find((d) => d.dossierClass === 'C4');
    if (c4) {
      const p0Dossier = { ...c4, id: 'p0-crisis-test', dossierClass: 'P0' as const };
      const stateWithP0 = { ...state, activeDossiers: [p0Dossier, ...state.activeDossiers] };
      const [execErr] = executeDossierDecision(stateWithP0, {
        dossierId: c4.id,
        optionId: c4.options[0]!.id,
        refinementLevel: 0,
        assignedAdvisorId: stateWithP0.advisors[2]!.id,
        useGeneralPaFallback: true,
        moduleExtensionTag: 'NONE',
      });
      expect(execErr?.code).toBe('EXW_ERR_P0_BLOCK');
    }
  });

  it('caps new P0 crises at max 2 per cycle across both dossier-p0.queue and TRIGGER_BUS', () => {
    const template = FALLBACK_DOSSIERS_CATALOG[0]!;
    const makeP0Dossier = (idx: number): ExecutiveDossier => ({
      ...template,
      id: `p0-dos-${idx}`,
      code: `P0-C1-${idx}`,
      dossierClass: 'P0',
    });

    const damperRes = applyP0CycleDamper(
      [makeP0Dossier(1), makeP0Dossier(2), makeP0Dossier(3)],
      0,
    );
    expect(damperRes.acceptedAsP0).toHaveLength(2);
    expect(damperRes.downgradedOverflow).toHaveLength(1);
    expect(damperRes.downgradedOverflow[0]?.dossierClass).toBe('C3');
    expect(damperRes.p0IssuedThisCycle).toBe(2);

    const makeBusP0 = (idx: number): TriggerBusEvent => ({
      id: `bus-p0-${idx}`,
      tickIssued: 15,
      cycleIssued: 1,
      dueCycle: 1,
      horizon: 'IMMEDIATE',
      severity: 'P0_CRISIS',
      category: 'MAINTENANCE_WEAR',
      title: `Crise critique #${idx}`,
      summary: `Tension majeure sur secteur #${idx}`,
      sourceNode: 'A3.3',
      deltaModifier: -0.05,
      resolved: false,
    });

    const [e1, bus1] = enqueueTriggerEvent([], makeBusP0(1), 1);
    expect(e1).toBeNull();
    const [e2, bus2] = enqueueTriggerEvent(bus1!, makeBusP0(2), 1);
    expect(e2).toBeNull();
    const [e3, bus3] = enqueueTriggerEvent(bus2!, makeBusP0(3), 1);
    expect(e3).toBeNull();
    expect(bus3![2]?.severity).toBe('HIGH');
    expect(bus3![2]?.horizon).toBe('SUSTAINED_MODIFIER');
  });
});
