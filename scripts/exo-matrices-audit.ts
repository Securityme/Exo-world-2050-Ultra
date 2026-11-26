import fs from 'node:fs';
import path from 'node:path';
import {
  buildCanonicalArtifactId,
  Classification6DManifestSchema,
  classifyArtifactPathIso7573,
  collectNodeClassificationTokens,
  detectPrefixCollisions,
  RtmXscMatrixSchema,
  type DocPartitionIdSchema,
  type DocPivotIdSchema,
  type RtmXscRow,
  type SrcLayer,
} from '../src/contracts/classification-6d.schema.ts';
import {
  evaluateMatrixArchitecture,
  type M0Manifest,
  type M13Manifest,
} from '../src/services/architecture/matrix-engine.ts';
import type { z } from 'zod';

/**
 * [TLS] EXW.TLS.MATRICES_AUDIT | NORM-EXW v3.0.0
 * Verifies:
 *  1. M0..M15 Matrix Architecture (17/17 PASS, 0 DSM cycles, 0 ICOM/SemVer/ISO violations)
 *  2. RTM-XSC Requirements Traceability Matrix integrity (1:1 SRC coverage, valid inodes & IEC 81346,
 *     ISO 7573 R-03 compliance, XSC-CUBE ⊥ G-CUBE orthogonality, 0 prefix collisions)
 */

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const BP_DIR = path.join(ROOT, 'docs', 'master-blueprint');

type PartId = z.infer<typeof DocPartitionIdSchema>;
type PivotId = z.infer<typeof DocPivotIdSchema>;

const DOMAIN_CAPABLE_LAYERS = new Set<SrcLayer>(['L1', 'L2', 'L3', 'L4', 'L7']);

function collectSrcFiles(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'assets' || entry.name === 'node_modules') continue;
      collectSrcFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(path.relative(ROOT, full).replace(/\\/g, '/'));
    }
  }
  return acc.sort();
}

function resolvePartitionAndPivot(layer: SrcLayer, sadtBox: string): {
  part: PartId;
  pivot: PivotId;
  inode: string;
} {
  if (layer === 'L0') {
    return { part: 'PART-I', pivot: 'PIV-0', inode: 'K0://PIV-0-EXOW-ROOT' };
  }
  if (sadtBox.startsWith('A2')) {
    return { part: 'PART-III', pivot: 'PIV-4', inode: 'K0://PIV-4-S06-DECISION-FUP018' };
  }
  if (sadtBox.startsWith('A3')) {
    return { part: 'PART-III', pivot: 'PIV-3', inode: 'K0://PIV-3-S04-ATMO-BIO' };
  }
  if (layer === 'L4' || layer === 'L7' || sadtBox.startsWith('A4')) {
    return { part: 'PART-IV', pivot: 'PIV-6', inode: 'K0://PIV-6-S10-UNITY6-URP-3D' };
  }
  return { part: 'PART-V', pivot: 'PIV-7', inode: 'K0://PIV-0-EXOW-ROOT' };
}

function runMatricesAudit(): void {
  const errors: string[] = [];

  const m0 = JSON.parse(fs.readFileSync(path.join(BP_DIR, 'M0_MetaSemVer.json'), 'utf8')) as M0Manifest;
  const m13 = JSON.parse(fs.readFileSync(path.join(BP_DIR, 'M13_SADT_Mapping.json'), 'utf8')) as M13Manifest;
  const classifRaw: unknown = JSON.parse(
    fs.readFileSync(path.join(BP_DIR, 'classif-6d.json'), 'utf8'),
  );

  // 1. M0..M15 Engine evaluation
  const actualSrcRel = collectSrcFiles(SRC_DIR);
  const report = evaluateMatrixArchitecture(m0, m13, actualSrcRel);
  if (report.dsmCycleCount > 0) {
    errors.push(`[M3-DSM] ${report.dsmCycleCount} cycle(s) de dépendance`);
  }
  for (const v of report.icomViolations) errors.push(`[M13-ICOM] ${v}`);
  for (const v of report.semverViolations) errors.push(`[M0-SEMVER] ${v}`);
  for (const v of report.isoViolations) errors.push(`[M15-ISO] ${v}`);
  for (const u of report.unmappedSrcPaths) errors.push(`[M13-SRC] Non mappé : ${u}`);
  for (const o of report.orphanMappings) errors.push(`[M13-SRC] Orphelin : ${o}`);

  // 2. XSC-CUBE 6D manifest check
  const parsedClassif = Classification6DManifestSchema.safeParse(classifRaw);
  const validInodes = new Set<string>();
  let totalFmtMAllocated = 0;
  let totalFmtMCap = 20000;

  if (!parsedClassif.success) {
    for (const issue of parsedClassif.error.issues) {
      errors.push(`[XSC-6D] ${issue.path.join('.')}: ${issue.message}`);
    }
  } else {
    totalFmtMCap = parsedClassif.data.totalFmtMCap;
    for (const node of parsedClassif.data.nodes) {
      validInodes.add(node.inode);
      totalFmtMAllocated += node.xsc_cube_6d.axe_6_llm.fmt_m_cap;
      const collisions = detectPrefixCollisions(collectNodeClassificationTokens(node));
      for (const c of collisions) {
        errors.push(`[RTM-XSC-COLLISION] "${c.token}" (${c.legacyGroup}) -> ${c.canonicalReplacement}`);
      }
    }
  }

  // 3. Build & strictly validate RTM-XSC Traceability Matrix against L0 Zod schema
  const rows: RtmXscRow[] = m13.srcMappings.map((m, idx) => {
    const isoClass = classifyArtifactPathIso7573(m.path);
    const artifactId = buildCanonicalArtifactId(isoClass, m.path);
    const { part, pivot, inode } = resolvePartitionAndPivot(m.layer, m.sadtBox);
    const hasGCubeOverlay =
      DOMAIN_CAPABLE_LAYERS.has(m.layer) &&
      (m.path.startsWith('src/systems/') ||
        m.path.startsWith('src/core/') ||
        m.path.startsWith('src/render/') ||
        m.path.startsWith('src/data/'));
    const iecSlug = artifactId.replace(/[^A-Z0-9_]/g, '_').slice(0, 36);
    const sliceCode = m.sadtBox.replace(/\./g, '_');

    return {
      rowId: `RTM-XSC-${String(idx + 1).padStart(4, '0')}`,
      inode,
      iec_81346: `=${m.sadtBox}-${iecSlug}+${m.layer}_${sliceCode}`,
      artifactId,
      iso7573Class: isoClass,
      layer: m.layer,
      sadtBox: m.sadtBox,
      srcPath: m.path,
      xscPart: part,
      xscPivot: pivot,
      hasGCubeOverlay,
      semver: m.semver,
      status: m.status,
    };
  });

  const rtmParsed = RtmXscMatrixSchema.safeParse({
    matrixId: 'RTM-XSC',
    normSemver: 'NORM-EXW-3.0.0',
    rootSemver: m0.rootSemver,
    rows,
  });

  if (!rtmParsed.success) {
    for (const issue of rtmParsed.error.issues) {
      errors.push(`[RTM-XSC] ${issue.path.join('.')}: ${issue.message}`);
    }
  } else {
    for (const row of rtmParsed.data.rows) {
      if (validInodes.size > 0 && !validInodes.has(row.inode)) {
        errors.push(`[RTM-XSC] Inode inconnu "${row.inode}" sur ${row.srcPath}`);
      }
    }
  }

  const gCubeRows = rows.filter((r) => r.hasGCubeOverlay).length;
  const infraOnlyRows = rows.length - gCubeRows;
  const passMatrices = report.matrices.filter((m) => m.status === 'PASS').length;

  console.log(`\n=== EXO WORLD : 2050 — AUDIT MATRICES M0..M15 & INTÉGRITÉ RTM-XSC (${m0.rootSemver}) ===`);
  console.log(`Matrices M0..M15       : ${passMatrices}/${report.matrices.length} PASS (score ${report.scorePct}%)`);
  console.log(`Cycles DSM (Kahn)      : ${report.dsmCycleCount}`);
  console.log(`Couverture RTM-XSC     : ${rows.length}/${actualSrcRel.length} modules SRC tracés (0 orphelin, 0 non-mappé)`);
  console.log(`Séparation 2 Espaces   : ${infraOnlyRows} XSC-CUBE seul (Infra/DMT-SW) ⊥ ${gCubeRows} XSC-CUBE + calque G-CUBE`);
  console.log(`Budget FMT-M (AXE-6)   : ${totalFmtMAllocated}/${totalFmtMCap} tokens`);
  console.log(`Gate Matrices RTM-XSC  : ${errors.length === 0 && report.gate === 'GO' ? 'PASS GO' : 'NO-GO'}`);

  if (errors.length > 0 || report.gate !== 'GO') {
    console.error('\nErreurs détectées :');
    for (const err of errors) console.error(`  ✗ ${err}`);
    process.exit(1);
  }

  console.log('\n[exo:matrices:audit] VERT (GO) — Intégrité complète M0..M15 et matrice RTM-XSC validée.\n');
}

runMatricesAudit();
