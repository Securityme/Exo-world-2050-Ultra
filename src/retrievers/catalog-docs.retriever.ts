import type { GeodesicBiome } from '../contracts/maps-biomes.schema.ts';
import {
  SCIENTIFIC_DISCOVERIES_CATALOG,
  type ScientificDiscoverySpec,
} from '../data/scientific-discoveries.catalog.ts';
import { FALLBACK_DOSSIERS_CATALOG } from '../data/fallback-dossiers.catalog.ts';

/**
 * [L5] FUP-002 / FUP-003 | SM-01
 * Deterministic Catalog & Scientific Discovery Retriever (R-50 compliant).
 */
export function retrieveDiscoveriesForBiome(biome: GeodesicBiome): readonly ScientificDiscoverySpec[] {
  return SCIENTIFIC_DISCOVERIES_CATALOG.filter((item) => item.biome === biome);
}

export function retrieveFallbackDossiersByClass(
  dossierClass: 'P0' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5',
) {
  return FALLBACK_DOSSIERS_CATALOG.filter((d) => d.dossierClass === dossierClass);
}
