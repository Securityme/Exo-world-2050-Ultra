import fs from 'node:fs';
import path from 'node:path';
import {
  evaluateMatrixArchitecture,
  type M0Manifest,
  type M13Manifest,
} from '../src/services/architecture/matrix-engine.ts';
import { syncMasterBlueprint } from './export-trifmt.ts';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const TESTS_DIR = path.join(ROOT, 'tests');
const BP_DIR = path.join(ROOT, 'master-blueprint');

// Auto-immunized Z0 ban patterns (constructed dynamically so this script never triggers itself)
const Z0_TOKENS = [
  ['ther', 'mal'].join(''),
  ['ther', 'mique'].join(''),
  ['cha', 'leur'].join(''),
  ['s_', 'heat'].join(''),
  ['cycle', '\\+1'].join(''),
  ['corri', 'dor'].join(''),
  ['loop_?', 'climate'].join(''),
];
const Z0_REGEX = new RegExp(`\\b(?:${Z0_TOKENS.join('|')})\\b`, 'i');

const PURITY_PATTERNS: readonly { label: string; regex: RegExp }[] = [
  { label: 'Math.random()', regex: /\bMath\.random\s*\(/ },
  { label: 'Date.now()', regex: /\bDate\.now\s*\(/ },
  { label: 'fetch()', regex: /\bfetch\s*\(/ },
  { label: 'window/document DOM', regex: /\b(?:window|document)\./ },
  { label: 'react import', regex: /from\s+['"]react['"]/ },
  { label: 'three import', regex: /from\s+['"]three['"]/ },
];

function collectTsFiles(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'assets' || entry.name === 'node_modules') continue;
      collectTsFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc.sort();
}

function estimateCyclomaticComplexity(code: string): number {
  const branches = code.match(/\b(?:if|else if|for|while|case|catch|\?\?|&&|\|\|)\b|\?/g);
  return 1 + (branches ? branches.length : 0);
}

function runAudit(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  const srcFiles = collectTsFiles(SRC_DIR);
  const testFiles = collectTsFiles(TESTS_DIR);

  // 1. Z0 Ban scan across src/ and tests/ (excluding z0-legacy.guard.ts which defines the ban regex)
  for (const file of [...srcFiles, ...testFiles]) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    if (rel.endsWith('z0-legacy.guard.ts') || rel.endsWith('save-migration.service.ts')) continue;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const m = line.match(Z0_REGEX);
      if (m) {
        errors.push(`[Z0-BAN] ${rel}:${idx + 1} contient un jeton banni (${m[0]})`);
      }
    });
  }

  // 2. L2/L3 Purity check (src/core & src/systems — strip comments so JSDoc notes don't false-positive)
  for (const file of srcFiles) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    if (!rel.startsWith('src/core/') && !rel.startsWith('src/systems/')) continue;
    const raw = fs.readFileSync(file, 'utf8');
    const codeOnly = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    for (const rule of PURITY_PATTERNS) {
      if (rule.regex.test(codeOnly)) {
        errors.push(`[L2/L3-PURITY] ${rel} viole la pureté déterministe (${rule.label})`);
      }
    }
  }

  // 3. R-14 Line count & Cyclomatic complexity check (strict on new v4 modules, telemetry on legacy)
  for (const file of srcFiles) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');
    const lineCount = content.split('\n').length;
    const isV4Module =
      rel.includes('-v4.') ||
      rel.includes('entity-ledger') ||
      rel.includes('humankind-progression') ||
      rel.includes('workforce-rpg') ||
      rel.includes('genese-promises') ||
      rel.includes('turn-gate');
    if (isV4Module) {
      const limit = rel.endsWith('.tsx') ? 220 : 300;
      if (lineCount > limit) {
        errors.push(`[R-14] ${rel} dépasse le plafond (${lineCount} > ${limit} lignes)`);
      }
      const cc = estimateCyclomaticComplexity(content);
      if (cc > 85) {
        warnings.push(`[R-14-CC] ${rel} complexité globale élevée (${cc})`);
      }
    }
  }

  // 4. M0 / M13 & SRC 1:1 coverage
  const m0 = JSON.parse(fs.readFileSync(path.join(BP_DIR, 'M0_MetaSemVer.json'), 'utf8')) as M0Manifest;
  const m13 = JSON.parse(fs.readFileSync(path.join(BP_DIR, 'M13_SADT_Mapping.json'), 'utf8')) as M13Manifest;
  const actualSrcRel = srcFiles.map((f) => path.relative(ROOT, f).replace(/\\/g, '/'));
  const report = evaluateMatrixArchitecture(m0, m13, actualSrcRel);

  if (report.dsmCycleCount > 0) {
    errors.push(`[M3-DSM] ${report.dsmCycleCount} cycle(s) de dépendance détecté(s)`);
  }
  for (const v of report.icomViolations) errors.push(`[M13-ICOM] ${v}`);
  for (const v of report.semverViolations) errors.push(`[M0-SEMVER] ${v}`);
  for (const v of report.isoViolations) errors.push(`[M15-ISO] ${v}`);
  for (const u of report.unmappedSrcPaths) errors.push(`[M13-SRC] Module non référencé dans Blueprint: ${u}`);
  for (const o of report.orphanMappings) errors.push(`[M13-SRC] Référence orpheline dans Blueprint: ${o}`);

  // 5. Tri-Format parity files check
  const cleanSemver = m0.rootSemver.split('+')[0] ?? m0.rootSemver;
  const expectedFiles = [
    `MASTER_BLUEPRINT_FMT-U_v${cleanSemver}.md`,
    `MASTER_BLUEPRINT_FMT-M_v${cleanSemver}.md`,
    `MASTER_BLUEPRINT_FMT-S_AISTUDIO_v${cleanSemver}.md`,
    `MASTER_BLUEPRINT_v${cleanSemver}.yaml`,
  ];
  for (const f of expectedFiles) {
    const full = path.join(BP_DIR, f);
    if (!fs.existsSync(full)) {
      errors.push(`[DIR-01] Projection manquante: master-blueprint/${f}`);
    } else {
      const txt = fs.readFileSync(full, 'utf8');
      if (!txt.includes(m0.rootSemver)) {
        errors.push(`[DIR-01] Désynchronisation SemVer dans master-blueprint/${f}`);
      }
    }
  }

  console.log(`\n=== EXO WORLD : 2050 — AUDIT DE GOUVERNANCE (${m0.rootId}@${m0.rootSemver}) ===`);
  console.log(`Modules SRC vérifiés : ${actualSrcRel.length}`);
  console.log(`Matrices M0..M15     : ${report.matrices.filter((m) => m.status === 'PASS').length}/${report.matrices.length} PASS`);
  console.log(`Cycles DSM (Kahn)    : ${report.dsmCycleCount}`);
  console.log(`Release Gate         : ${errors.length === 0 && report.gate === 'GO' ? 'GO' : 'NO-GO'}`);

  if (warnings.length > 0) {
    console.log('\nAvertissements :');
    for (const w of warnings) console.log(`  ! ${w}`);
  }

  if (errors.length > 0 || report.gate !== 'GO') {
    console.error('\nErreurs bloquantes :');
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }

  // Auto-export synchronized MD/YAML/JSON on green audit
  syncMasterBlueprint();
  console.log('\n[exo:audit] VERT (GO) — Exports Master Blueprint MD/YAML/JSON synchronisés.\n');
}

runAudit();
