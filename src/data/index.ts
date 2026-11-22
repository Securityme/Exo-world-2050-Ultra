/**
 * [L1] Barrel exports for all frozen game data catalogs.
 */
export {
  ERAS_CATALOG,
  PLANETARY_SLOTS_CATALOG,
  SUPERPOWERS_CATALOG,
  SCIENTIFIC_DISCOVERIES_CATALOG as SCIENTIFIC_DISCOVERY_LABELS,
  type EraDefinition,
  type PlanetarySlotInfo,
  type SuperpowerTemplate,
} from './world.catalog.ts';
export * from './fallback-dossiers.catalog.ts';
export * from './scientific-discoveries.catalog.ts';
