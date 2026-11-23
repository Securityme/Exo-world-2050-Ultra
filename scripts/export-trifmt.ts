import fs from 'node:fs';
import path from 'node:path';
import {
  evaluateMatrixArchitecture,
  renderBlueprintMarkdown,
  renderBlueprintYaml,
  type LayerCode,
  type M0Manifest,
  type M13Manifest,
  type SrcModuleMapping,
} from '../src/services/architecture/matrix-engine.ts';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const BP_DIR = path.join(ROOT, 'master-blueprint');

function walkSrcFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'assets') continue;
      walkSrcFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(path.relative(ROOT, full).replace(/\\/g, '/'));
    }
  }
  return acc.sort();
}

function inferLayerAndSadt(relPath: string): { layer: LayerCode; sadtBox: string; maxLinesBudget: number } {
  if (relPath.startsWith('src/contracts/') || relPath.startsWith('src/parsers/')) {
    return { layer: 'L0', sadtBox: 'A1.1', maxLinesBudget: 300 };
  }
  if (relPath.startsWith('src/config/') || relPath.startsWith('src/data/')) {
    return { layer: 'L1', sadtBox: 'A1.1', maxLinesBudget: 300 };
  }
  if (relPath.startsWith('src/core/') || relPath.startsWith('src/guardrails/')) {
    return { layer: 'L2', sadtBox: 'A1.3', maxLinesBudget: 300 };
  }
  if (relPath.startsWith('src/systems/')) return { layer: 'L3', sadtBox: 'A3.1', maxLinesBudget: 300 };
  if (relPath.startsWith('src/engine3d/') || relPath.startsWith('src/adapters/')) {
    return { layer: 'L4', sadtBox: 'A5.3', maxLinesBudget: 300 };
  }
  if (
    relPath.startsWith('src/bridges/') ||
    relPath.startsWith('src/retrievers/') ||
    relPath.startsWith('src/services/') ||
    relPath.startsWith('src/pipelines/') ||
    relPath.startsWith('src/doc-sync/') ||
    relPath.startsWith('src/utils/') ||
    relPath.startsWith('src/app/')
  ) {
    return { layer: 'L5', sadtBox: 'A4.3', maxLinesBudget: 300 };
  }
  if (
    relPath.startsWith('src/stores/') ||
    relPath.startsWith('src/hooks/') ||
    relPath.startsWith('src/worker/')
  ) {
    return { layer: 'L6', sadtBox: 'A4.2', maxLinesBudget: 300 };
  }
  return { layer: 'L7', sadtBox: 'A5.1', maxLinesBudget: 200 };
}

export function syncMasterBlueprint(): { m0: M0Manifest; m13: M13Manifest; srcFiles: string[] } {
  const m0Path = path.join(BP_DIR, 'M0_MetaSemVer.json');
  const m13Path = path.join(BP_DIR, 'M13_SADT_Mapping.json');

  const m0 = JSON.parse(fs.readFileSync(m0Path, 'utf8')) as M0Manifest;
  const m13Raw = JSON.parse(fs.readFileSync(m13Path, 'utf8')) as M13Manifest;
  const cleanSemver = m0.rootSemver.split('+')[0] ?? m0.rootSemver;
  const srcFiles = walkSrcFiles(SRC_DIR);

  const srcMappings: SrcModuleMapping[] = srcFiles.map((filePath) => {
    const meta = inferLayerAndSadt(filePath);
    return {
      path: filePath,
      layer: meta.layer,
      sadtBox: meta.sadtBox,
      semver: cleanSemver,
      status: 'VERIFIED',
      maxLinesBudget: meta.maxLinesBudget,
    };
  });

  const updatedM13: M13Manifest = {
    ...m13Raw,
    version: cleanSemver,
    srcMappings,
  };

  fs.writeFileSync(m13Path, `${JSON.stringify(updatedM13, null, 2)}\n`, 'utf8');

  const report = evaluateMatrixArchitecture(m0, updatedM13, srcFiles);
  fs.writeFileSync(
    path.join(BP_DIR, `MASTER_BLUEPRINT_FMT-U_v${cleanSemver}.md`),
    renderBlueprintMarkdown(m0, updatedM13, report, 'FMT-U'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(BP_DIR, `MASTER_BLUEPRINT_FMT-M_v${cleanSemver}.md`),
    renderBlueprintMarkdown(m0, updatedM13, report, 'FMT-M'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(BP_DIR, `MASTER_BLUEPRINT_FMT-S_AISTUDIO_v${cleanSemver}.md`),
    renderBlueprintMarkdown(m0, updatedM13, report, 'FMT-S'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(BP_DIR, `MASTER_BLUEPRINT_v${cleanSemver}.yaml`),
    renderBlueprintYaml(m0, report),
    'utf8',
  );

  // Sync typed runtime bridge for Atlas UI
  const bridgePath = path.join(SRC_DIR, 'data', 'blueprint-manifests.data.ts');
  const bridgeContent = [
    `import type { M0Manifest, M13Manifest } from '../services/architecture/matrix-engine.ts';`,
    '',
    '/**',
    ' * [L1] Auto-synchronized by `npm run exo:sync-bp` from master-blueprint/*.json.',
    ' */',
    `export const M0_MANIFEST: M0Manifest = ${JSON.stringify(m0, null, 2)} as const;`,
    '',
    `export const M13_MANIFEST: M13Manifest = ${JSON.stringify(updatedM13, null, 2)} as const;`,
    '',
  ].join('\n');
  fs.writeFileSync(bridgePath, bridgeContent, 'utf8');

  return { m0, m13: updatedM13, srcFiles };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { m0, m13 } = syncMasterBlueprint();
  console.log(
    `[exo:sync-bp] OK — ${m0.rootId}@${m0.rootSemver} | ${m13.srcMappings.length} modules SRC synchronisés + Tri-Format (FMT-U/M/S + YAML) générés.`,
  );
}
