import {
  ERAS_CATALOG,
  PLANETARY_SLOTS_CATALOG,
  SCIENTIFIC_DISCOVERIES_CATALOG,
  SUPERPOWERS_CATALOG,
  type EraDefinition,
  type PlanetarySlotInfo,
  type SuperpowerTemplate,
} from '../data/world.catalog.ts';

/**
 * [L5 — ISOLATED DOCUMENTARY CATALOG LOADER]
 * Reads project reference documents from server-side /api/project-docs and merges
 * them with frozen L1 catalogs for read-only inspection inside the Governance Studio.
 */
export interface ProjectDocEntry {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly category: string;
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly fullText: string;
}

export interface ProjectDocsAndCatalogsPayload {
  readonly documents: readonly ProjectDocEntry[];
  readonly catalogs: {
    readonly eras: readonly EraDefinition[];
    readonly planetarySlots: readonly PlanetarySlotInfo[];
    readonly superpowers: readonly SuperpowerTemplate[];
    readonly scientificDiscoveries: readonly string[];
    readonly eventGeneratorContractSummary: {
      readonly schemaName: string;
      readonly graphValidation: string;
      readonly impactClamp: string;
      readonly nomenclatureRule: string;
    };
  };
}

export async function fetchProjectDocumentsAndCatalogs(): Promise<ProjectDocsAndCatalogsPayload> {
  let documents: ProjectDocEntry[] = [];
  try {
    const res = await fetch('/api/project-docs');
    if (res.ok) {
      const json = (await res.json()) as { documents?: ProjectDocEntry[] };
      documents = json.documents ?? [];
    }
  } catch {
    documents = [];
  }

  return {
    documents,
    catalogs: {
      eras: ERAS_CATALOG,
      planetarySlots: PLANETARY_SLOTS_CATALOG,
      superpowers: SUPERPOWERS_CATALOG,
      scientificDiscoveries: SCIENTIFIC_DISCOVERIES_CATALOG,
      eventGeneratorContractSummary: {
        schemaName: 'EventGeneratorResponseSchema (EXW-EVGEN-2.7 · Zod Strict)',
        graphValidation: 'Tri Topologique de Kahn (DAG acyclique) + Joignabilité BFS depuis la racine',
        impactClamp: 'Bornage absolu [-0.15, +0.15] + Repli déterministe local < 6 000 ms',
        nomenclatureRule: 'R-50 : nomenclature scientifique stricte, filtrage automatique du terme générique interdit',
      },
    },
  };
}
