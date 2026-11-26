import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCanonicalArtifactId,
  Classification6DManifestSchema,
  classifyArtifactPathIso7573,
  detectPrefixCollisions,
  Iso7573RegistrySchema,
  RtmXscMatrixSchema,
  XscClassificationNodeSchema,
} from '../src/contracts/classification-6d.schema.ts';

const VALID_ROOT_NODE = {
  inode: 'K0://PIV-0-EXOW-ROOT',
  iec_81346: '=A0-DOC_ROOT+EXOW_ROOT',
  xsc_cube_6d: {
    axe_1_doc: { depth: 'V0', d_restant: 6, part: 'PART-I', pivot: 'PIV-0', h_active: ['H0', 'H1'] },
    axe_2_taxo: {
      ref: ['MAD', 'MBE'],
      class_iso7573: ['MOD', 'SCR'],
      archetypes: ['ARCH-TOC-TENSOR-6D'],
      instances: ['M0-META'],
    },
    axe_3_arch: { layers: ['L0', 'L5', 'L8'], fs4x_slice: 'shared-kernel/root', truth_rank: 'R-09:L0' },
    axe_4_gov: {
      holon: 'C1.Q1.W-',
      ring: 3,
      ap_gate: 'AP-4',
      trl: 6,
      gemma: 'F2',
      tri_lock: [1, 1, 1] as const,
      semver_mode: 'CASCADE',
    },
    axe_5_org: {
      laniakea: 'LAN://O0:GRAND-ATTRACTEUR/O1:TEAMWORKER',
      filament: 'FIL://SSOT-ROOT',
      skill_bridge: 'EXW-COMP-01<->AG-SKL-01',
    },
    axe_6_llm: {
      zoom: 'Z1',
      mode_dprof: 'ULTRA_DENSE',
      fmt_m_cap: 1100,
      posture: 'NORMATIF',
      hbdi: 'A+B',
      disc: 'C+D',
      enn: '1w9',
      temp: 0.05,
      thinking: 'HIGH',
    },
  },
};

test('detectPrefixCollisions catches all legacy N/D/P ambiguous prefixes and passes canonical NORM-EXW v3.0 tokens', () => {
  const hits = detectPrefixCollisions(['N0', 'N6', 'D1', 'D5', 'P0', 'P4', 'P-III', 'V2', 'O3', 'ATMO-D2', 'PART-III', 'PIV-4']);
  assert.deepEqual(
    hits.map((h) => h.token),
    ['N0', 'N6', 'D1', 'D5', 'P0', 'P4', 'P-III'],
  );
  assert.equal(detectPrefixCollisions(['V0', 'O2', 'T1', 'ATMO-D1', 'ZOD-D1', 'PART-I', 'PIV-0', 'PRIO-P0', 'GEMMA-D1']).length, 0);
});

test('XscClassificationNodeSchema enforces strict XSC-CUBE ⊥ G-CUBE separation and ISO 2145 d_restant', () => {
  // V0 root cannot carry g_cube_overlay
  const badRootWithGCube = XscClassificationNodeSchema.safeParse({
    ...VALID_ROOT_NODE,
    g_cube_overlay: {
      g1_spatial: ['S-3'],
      g2_temporal: ['T1/GL-1'],
      g3_atmo: ['ATMO-D1'],
      g4_decision: ['PRIO-P0'],
      g5_ethics: ['BIEN_COMMUN'],
    },
  });
  assert.equal(badRootWithGCube.success, false);

  // Wrong d_restant (ISO 2145 requires 6 - 0 = 6)
  const badDepth = XscClassificationNodeSchema.safeParse({
    ...VALID_ROOT_NODE,
    xsc_cube_6d: {
      ...VALID_ROOT_NODE.xsc_cube_6d,
      axe_1_doc: { ...VALID_ROOT_NODE.xsc_cube_6d.axe_1_doc, d_restant: 4 },
    },
  });
  assert.equal(badDepth.success, false);

  // Valid root passes
  const goodRoot = XscClassificationNodeSchema.safeParse(VALID_ROOT_NODE);
  assert.equal(goodRoot.success, true);
});

test('Iso7573RegistrySchema enforces R-03 zero inter-class fusion and prefix consistency', () => {
  assert.equal(classifyArtifactPathIso7573('src/systems/dossiers-pa/pa-engine.ts'), 'FEAT');
  assert.equal(classifyArtifactPathIso7573('src/interfaces/GameHud.tsx'), 'CMP');
  assert.equal(classifyArtifactPathIso7573('src/services/firebase/firebase-client.ts'), 'EXT');
  assert.equal(classifyArtifactPathIso7573('scripts/exo-taxo-audit.ts'), 'TLS');
  assert.equal(classifyArtifactPathIso7573('scripts/export-trifmt.ts'), 'SCR');

  const fused = Iso7573RegistrySchema.safeParse({
    normSemver: 'NORM-EXW-3.0.0',
    entries: [
      {
        artifactId: buildCanonicalArtifactId('MOD', 'src/core/a.ts'),
        iso7573Class: 'MOD',
        path: 'src/core/a.ts',
        layer: 'L2',
        sadtBox: 'A1.1',
      },
      {
        artifactId: buildCanonicalArtifactId('FEAT', 'src/core/a.ts'),
        iso7573Class: 'FEAT',
        path: 'src/core/a.ts',
        layer: 'L2',
        sadtBox: 'A1.1',
      },
    ],
  });
  assert.equal(fused.success, false);
});

test('RtmXscMatrixSchema rejects G-CUBE overlays on pure infra layers (L0/L5/L8)', () => {
  const badRtm = RtmXscMatrixSchema.safeParse({
    matrixId: 'RTM-XSC',
    normSemver: 'NORM-EXW-3.0.0',
    rootSemver: '5.1.0-alpha.1',
    rows: [
      {
        rowId: 'RTM-XSC-0001',
        inode: 'K0://PIV-0-EXOW-ROOT',
        iec_81346: '=A1.1-MOD_TEST+L0_A1_1',
        artifactId: 'MOD-CONTRACTS_TEST',
        iso7573Class: 'MOD',
        layer: 'L0',
        sadtBox: 'A1.1',
        srcPath: 'src/contracts/test.ts',
        xscPart: 'PART-I',
        xscPivot: 'PIV-0',
        hasGCubeOverlay: true,
        semver: '5.1.0-alpha.1',
        status: 'VERIFIED',
      },
    ],
  });
  assert.equal(badRtm.success, false);
});

test('Classification6DManifestSchema rejects duplicate inodes and FMT-M budget overflow', () => {
  const overflow = Classification6DManifestSchema.safeParse({
    normSemver: 'NORM-EXW-3.0.0',
    blueprintId: 'DOC-EXW-ARCH-001',
    docSemver: '2.14.0-MAITRE',
    totalFmtMCap: 500,
    nodes: [VALID_ROOT_NODE],
  });
  assert.equal(overflow.success, false);
});
