import { err, ok, type ExwResult } from '../../contracts/trigger-bus.schema.ts';

/**
 * [L2] SPEC-SRC-DOC-EXW-001 | MC-00 | L0..L8 SoT Architectural Layer Router
 * Pure dependency direction checker verifying downward-only layer imports (L8 -> ... -> L0).
 */
export type ArchitectureLayerId = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8';

const LAYER_RANK: Readonly<Record<ArchitectureLayerId, number>> = Object.freeze({
  L0: 0,
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4,
  L5: 5,
  L6: 6,
  L7: 7,
  L8: 8,
});

const FOLDER_TO_LAYER: Readonly<Record<string, ArchitectureLayerId>> = Object.freeze({
  contracts: 'L0',
  parsers: 'L0',
  config: 'L1',
  data: 'L1',
  core: 'L2',
  guardrails: 'L2',
  systems: 'L3',
  engine3d: 'L4',
  adapters: 'L4',
  bridges: 'L4',
  retrievers: 'L5',
  stores: 'L5',
  services: 'L5',
  pipelines: 'L5',
  worker: 'L5',
  'doc-sync': 'L5',
  hooks: 'L6',
  handlers: 'L6',
  components: 'L7',
  interfaces: 'L7',
  features: 'L7',
  app: 'L8',
});

export function resolveLayerForFolder(folderName: string): ArchitectureLayerId | null {
  return FOLDER_TO_LAYER[folderName] ?? null;
}

export function validateLayerImportDirection(
  sourceLayer: ArchitectureLayerId,
  targetLayer: ArchitectureLayerId,
): ExwResult<true> {
  if (LAYER_RANK[targetLayer] > LAYER_RANK[sourceLayer]) {
    return err(
      'EXW_ERR_SCHEMA',
      `Violation SoT inter-couches : ${sourceLayer} ne peut pas importer ${targetLayer}.`,
    );
  }
  return ok(true);
}
