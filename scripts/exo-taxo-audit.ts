import fs from 'node:fs';
import path from 'node:path';
import {
  buildCanonicalArtifactId,
  Classification6DManifestSchema,
  classifyArtifactPathIso7573,
  collectNodeClassificationTokens,
  detectPrefixCollisions,
  ISO7573_CLASS_SPECS,
  Iso7573RegistrySchema,
  type Iso7573ArtifactClass,
  type Iso7573ArtifactEntry,
  type SrcLayer,
} from '../src/contracts/classification-6d.schema.ts';
import type { M13Manifest } from '../src/services/architecture/matrix-engine.ts';

/**
 * [TLS] EXW.TLS.TAXO_AUDIT | NORM-EXW v3.0.0
 * Verifies:
 *  1. XSC-CUBE (6D) ⊥ G-CUBE (5D) two-space manifest validity (docs/master-blueprint/classif-6d.json)
 *  2. Zero legacy prefix collisions (N0..N6, D1..D5, P0..P7, P-I..VI)
 *  3. Strict NF EN ISO 7573 7-class separation (FEAT | MOD | CMP | PLG | TLS | SCR | EXT) — R-03 zero fusion
 */

const ROOT = process.cwd();
const BP_DIR = path.join(ROOT, 'docs', 'master-blueprint');
const SRC_DIR = path.join(ROOT, 'src');
const SCRIPTS_DIR = path.join(ROOT, 'scripts');

function collectFiles(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'assets' || entry.name === 'node_modules') continue;
      collectFiles(full, acc);
    } else if (/\.(ts|tsx|mjs)$/.test(entry.name)) {
      acc.push(path.relative(ROOT, full).replace(/\\/g, '/'));
    }
  }
  return acc.sort();
}

function runTaxoAudit(): void {
  const errors: string[] = [];

  // 1. Validate XSC-CUBE 6D ⊥ G-CUBE manifest
  const classifPath = path.join(BP_DIR, 'classif-6d.json');
  let validatedNodeCount = 0;
  let totalTokensScanned = 0;
  let totalCollisions = 0;

  if (!fs.existsSync(classifPath)) {
    errors.push('[XSC-6D] Fichier manquant : docs/master-blueprint/classif-6d.json');
  } else {
    const raw: unknown = JSON.parse(fs.readFileSync(classifPath, 'utf8'));
    const parsed = Classification6DManifestSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`[XSC-6D] ${issue.path.join('.')}: ${issue.message}`);
      }
    } else {
      validatedNodeCount = parsed.data.nodes.length;
      const tokens: string[] = [];
      for (const node of parsed.data.nodes) {
        tokens.push(...collectNodeClassificationTokens(node));
      }
      totalTokensScanned = tokens.length;
      const collisions = detectPrefixCollisions(tokens);
      totalCollisions = collisions.length;
      for (const c of collisions) {
        errors.push(
          `[PREFIX-COLLISION] "${c.token}" (${c.legacyGroup}) -> remplacer par ${c.canonicalReplacement}`,
        );
      }
    }
  }

  // 2. Validate strict 7-class NF EN ISO 7573 separation (R-03 zero fusion) across src/ & scripts/
  const m13Path = path.join(BP_DIR, 'M13_SADT_Mapping.json');
  const m13 = JSON.parse(fs.readFileSync(m13Path, 'utf8')) as M13Manifest;
  const m13ByPath = new Map(m13.srcMappings.map((m) => [m.path, m]));

  const allFiles = [...collectFiles(SRC_DIR), ...collectFiles(SCRIPTS_DIR)];
  const entries: Iso7573ArtifactEntry[] = allFiles.map((relPath) => {
    const iso7573Class = classifyArtifactPathIso7573(relPath);
    const mapped = m13ByPath.get(relPath);
    const layer: SrcLayer = mapped?.layer ?? (relPath.startsWith('scripts/') ? 'L8' : 'L5');
    const sadtBox = mapped?.sadtBox ?? 'A5.1';
    return {
      artifactId: buildCanonicalArtifactId(iso7573Class, relPath),
      iso7573Class,
      path: relPath,
      layer,
      sadtBox,
    };
  });

  const regParsed = Iso7573RegistrySchema.safeParse({
    normSemver: 'NORM-EXW-3.0.0',
    entries,
  });

  if (!regParsed.success) {
    for (const issue of regParsed.error.issues) {
      errors.push(`[ISO-7573-R03] ${issue.path.join('.')}: ${issue.message}`);
    }
  }

  // Check coverage across all 7 classes
  const counts: Record<Iso7573ArtifactClass, number> = {
    FEAT: 0,
    MOD: 0,
    CMP: 0,
    PLG: 0,
    TLS: 0,
    SCR: 0,
    EXT: 0,
  };
  for (const e of entries) {
    counts[e.iso7573Class] += 1;
  }

  const missingClasses = (Object.keys(counts) as Iso7573ArtifactClass[]).filter(
    (cls) => counts[cls] === 0,
  );
  if (missingClasses.length > 0) {
    errors.push(`[ISO-7573] Classe(s) sans aucun artefact mappé : ${missingClasses.join(', ')}`);
  }

  console.log('\n=== EXO WORLD : 2050 — AUDIT TAXONOMIQUE ISO 7573 & XSC-CUBE 6D (NORM-EXW-3.0.0) ===');
  console.log(`Nœuds XSC-CUBE ⊥ G-CUBE : ${validatedNodeCount} validé(s) (${totalTokensScanned} jetons scannés, ${totalCollisions} collision)`);
  console.log(`Artefacts classifiés    : ${entries.length} (0 fusion inter-classes R-03)`);
  for (const cls of Object.keys(counts) as Iso7573ArtifactClass[]) {
    console.log(
      `  - ${cls.padEnd(4)} (${ISO7573_CLASS_SPECS[cls].prefix.padEnd(5)}) : ${String(counts[cls]).padStart(3)} artefact(s) · ${ISO7573_CLASS_SPECS[cls].label}`,
    );
  }
  console.log(`Gate Taxonomie ISO 7573 : ${errors.length === 0 ? 'PASS GO' : 'NO-GO'}`);

  if (errors.length > 0) {
    console.error('\nViolations détectées :');
    for (const err of errors) console.error(`  ✗ ${err}`);
    process.exit(1);
  }

  console.log('\n[exo:taxo:audit] VERT (GO) — Séparation stricte des 7 classes ISO 7573 et XSC-CUBE ⊥ G-CUBE vérifiée.\n');
}

runTaxoAudit();
