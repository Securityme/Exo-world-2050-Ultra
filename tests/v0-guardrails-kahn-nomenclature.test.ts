import { describe, expect, it } from 'vitest';
import {
  assertR50CompliantText,
  checkFreeTierQuota,
  clampAirlockDelta,
  containsForbiddenNomenclature,
  evaluateWebKitMemoryBudget,
  validateAirlockDossier,
  validateDagKahnBfs,
} from '../src/guardrails/index.ts';
import { FALLBACK_DOSSIERS_CATALOG } from '../src/data/fallback-dossiers.catalog.ts';
import { SCIENTIFIC_DISCOVERIES_CATALOG } from '../src/data/scientific-discoveries.catalog.ts';
import {
  resolveLayerForFolder,
  validateLayerImportDirection,
} from '../src/core/routers/sot-layer.router.ts';

describe('Wave 0 — Guardrails: Zod Airlock (±15%), Kahn/BFS DAG & R-50 Nomenclature', () => {
  it('enforces Zod Airlock bounds [-0.15, +0.15]', () => {
    expect(clampAirlockDelta(0.42)).toBe(0.15);
    expect(clampAirlockDelta(-0.85)).toBe(-0.15);
    expect(clampAirlockDelta(0.075)).toBe(0.075);

    const sample = FALLBACK_DOSSIERS_CATALOG[0]!;
    const outOfBounds = {
      ...sample,
      options: sample.options.map((opt, idx) =>
        idx === 0
          ? { ...opt, effects: { ...opt.effects, oracleImpactFactor: 0.45 } }
          : opt,
      ),
    };
    const [rejectErr] = validateAirlockDossier(outOfBounds, { strictBounds: true });
    expect(rejectErr?.code).toBe('EXW_ERR_SCHEMA');

    const [okErr, clamped] = validateAirlockDossier(sample, { strictBounds: true });
    expect(okErr).toBeNull();
    expect(clamped?.code).toBe(sample.code);
  });

  it('validates acyclic reachable DAG via Kahn + BFS and rejects cycles or missing prerequisites', () => {
    const [validErr, report] = validateDagKahnBfs({
      graphId: 'dag-valid',
      nodes: [
        {
          id: 'n0',
          dossierCode: 'EXW-C1-01',
          title: 'Racine Solarpunk',
          eraMin: 1,
          atmosphereMin: 'P1',
          prerequisites: [],
          requiredMemoryFlags: [],
        },
        {
          id: 'n1',
          dossierCode: 'EXW-C4-02',
          title: 'Ensemencement P2',
          eraMin: 1,
          atmosphereMin: 'P1',
          prerequisites: ['n0'],
          requiredMemoryFlags: [],
        },
        {
          id: 'n2',
          dossierCode: 'EXW-C5-03',
          title: 'Traité Exosphérique',
          eraMin: 2,
          atmosphereMin: 'P2',
          prerequisites: ['n1'],
          requiredMemoryFlags: [],
        },
      ],
    });
    expect(validErr).toBeNull();
    expect(report?.topologicalOrder).toEqual(['n0', 'n1', 'n2']);

    const [cycleErr] = validateDagKahnBfs({
      graphId: 'dag-cycle',
      nodes: [
        {
          id: 'n0',
          dossierCode: 'EXW-C1-01',
          title: 'Nœud A',
          eraMin: 1,
          atmosphereMin: 'P1',
          prerequisites: ['n1'],
          requiredMemoryFlags: [],
        },
        {
          id: 'n1',
          dossierCode: 'EXW-C2-01',
          title: 'Nœud B',
          eraMin: 1,
          atmosphereMin: 'P1',
          prerequisites: ['n0'],
          requiredMemoryFlags: [],
        },
      ],
    });
    expect(cycleErr?.code).toBe('EXW_ERR_DAG_CYCLE');

    const [missingErr] = validateDagKahnBfs({
      graphId: 'dag-missing-prereq',
      nodes: [
        {
          id: 'n0',
          dossierCode: 'EXW-C1-01',
          title: 'Racine',
          eraMin: 1,
          atmosphereMin: 'P1',
          prerequisites: [],
          requiredMemoryFlags: [],
        },
        {
          id: 'n1',
          dossierCode: 'EXW-C3-01',
          title: 'Branche Isolée',
          eraMin: 1,
          atmosphereMin: 'P1',
          prerequisites: ['missing-node'],
          requiredMemoryFlags: [],
        },
      ],
    });
    expect(missingErr?.code).toBe('EXW_ERR_DAG_CYCLE');
  });

  it('strictly rejects the forbidden generic term (R-50) and verifies clean catalogs', () => {
    const forbiddenFr = 'anomal' + 'ie';
    const forbiddenFrPlural = 'anomal' + 'ies';
    const forbiddenEn = 'Anomal' + 'y';

    expect(containsForbiddenNomenclature(`Détection d'une ${forbiddenFr} géomagnétique`)).toBe(true);
    expect(containsForbiddenNomenclature(`Plusieurs ${forbiddenFrPlural} orbitales`)).toBe(true);
    expect(containsForbiddenNomenclature(`Orbital ${forbiddenEn} detected`)).toBe(true);

    const [r50Err] = assertR50CompliantText(`Une ${forbiddenFr} détectée`, 'CatalogAudit');
    expect(r50Err?.code).toBe('EXW_ERR_NOMENCLATURE');

    for (const item of SCIENTIFIC_DISCOVERIES_CATALOG) {
      const [errItem] = assertR50CompliantText(
        `${item.scientificLabel} ${item.summary}`,
        item.id,
      );
      expect(errItem).toBeNull();
    }
    for (const dossier of FALLBACK_DOSSIERS_CATALOG) {
      const [errDossier] = assertR50CompliantText(
        `${dossier.title} ${dossier.briefing} ${dossier.scientificTag ?? ''}`,
        dossier.code,
      );
      expect(errDossier).toBeNull();
    }
  });

  it('checks Free-Tier quota, WebKit memory ceiling & SSoT L0..L8 routing', () => {
    const [okQuota] = checkFreeTierQuota({ requestsInWindowMinute: 3, requestsToday: 25 });
    expect(okQuota).toBeNull();
    const [overQuota] = checkFreeTierQuota({ requestsInWindowMinute: 12, requestsToday: 25 });
    expect(overQuota?.code).toBe('EXW_ERR_QUOTA_EXCEEDED');

    const [okMem, memAdvice] = evaluateWebKitMemoryBudget({
      estimatedTextureMb: 96,
      activeGeometries: 240,
      lowPowerMode: false,
    });
    expect(okMem).toBeNull();
    expect(memAdvice?.recommendedPixelRatioMax).toBe(2);

    const [overMem] = evaluateWebKitMemoryBudget({
      estimatedTextureMb: 190,
      activeGeometries: 240,
      lowPowerMode: true,
    });
    expect(overMem?.code).toBe('EXW_ERR_SCHEMA');

    expect(resolveLayerForFolder('contracts')).toBe('L0');
    expect(resolveLayerForFolder('core')).toBe('L2');
    expect(resolveLayerForFolder('interfaces')).toBe('L7');
    expect(validateLayerImportDirection('L0', 'L2')[0]?.code).toBe('EXW_ERR_SCHEMA');
    expect(validateLayerImportDirection('L7', 'L0')[0]).toBeNull();
  });
});
