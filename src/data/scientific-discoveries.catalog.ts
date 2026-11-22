import type { GeodesicBiome } from '../contracts/maps-biomes.schema.ts';

/**
 * [L1] FUP-003 / R-50 Strict Scientific Nomenclature Catalog.
 * Zero generic forbidden terminology; every planetary discovery carries a concrete geophysical/exobiological label.
 */
export interface ScientificDiscoverySpec {
  readonly id: string;
  readonly scientificLabel: string;
  readonly biome: GeodesicBiome;
  readonly minAtmosphereTier: 'P1' | 'P2' | 'P3' | 'P4';
  readonly dossierClass: 'C1' | 'C2' | 'C4' | 'C5';
  readonly summary: string;
  readonly atmosphereBonus: number;
  readonly computeBonus: number;
  readonly materialsBonus: number;
}

export const SCIENTIFIC_DISCOVERIES_CATALOG: readonly ScientificDiscoverySpec[] = Object.freeze([
  {
    id: 'sci-hydrothermal-trench',
    scientificLabel: 'Fosse Hydrothermale Active',
    biome: 'CANYON',
    minAtmosphereTier: 'P1',
    dossierClass: 'C4',
    summary: 'Source géothermique profonde libérant vapeur d’eau minéralisée et micro-nutriments.',
    atmosphereBonus: 8,
    computeBonus: 5,
    materialsBonus: 15,
  },
  {
    id: 'sci-subcrustal-fault',
    scientificLabel: 'Faille Magnétique Sub-Croûtale',
    biome: 'HIGHLAND',
    minAtmosphereTier: 'P1',
    dossierClass: 'C1',
    summary: 'Couloir de flux tellurique exploitable pour amplifier la magnétosphère artificielle.',
    atmosphereBonus: 7,
    computeBonus: 10,
    materialsBonus: 20,
  },
  {
    id: 'sci-extremophile-pocket',
    scientificLabel: 'Poche Microbienne Extrêmophile',
    biome: 'ICE_SHELF',
    minAtmosphereTier: 'P1',
    dossierClass: 'C4',
    summary: 'Souche chimio-autotrophe capable d’accélérer l’oxygénation des bassins pionniers.',
    atmosphereBonus: 9,
    computeBonus: 8,
    materialsBonus: 0,
  },
  {
    id: 'sci-trapped-isotopes',
    scientificLabel: 'Gisement d’Isotopes Piégés',
    biome: 'BARREN',
    minAtmosphereTier: 'P2',
    dossierClass: 'C2',
    summary: 'Réservoir d’Hélium-3 fossile stabilisant la propulsion inter-mondes.',
    atmosphereBonus: 2,
    computeBonus: 12,
    materialsBonus: 35,
  },
  {
    id: 'sci-basalt-resonator',
    scientificLabel: 'Résonateur Basaltique Orbital',
    biome: 'HIGHLAND',
    minAtmosphereTier: 'P2',
    dossierClass: 'C5',
    summary: 'Formation cristalline conductrice réduisant de 18% la latence des nœuds Compute.',
    atmosphereBonus: 1,
    computeBonus: 28,
    materialsBonus: 10,
  },
  {
    id: 'sci-cryo-silicate-lens',
    scientificLabel: 'Lentille Cryo-Silicatée',
    biome: 'ICE_SHELF',
    minAtmosphereTier: 'P1',
    dossierClass: 'C4',
    summary: 'Dépôt glaciaire purifié fournissant eau liquide et blindage radiatif.',
    atmosphereBonus: 5,
    computeBonus: 4,
    materialsBonus: 22,
  },
  {
    id: 'sci-lichen-passage',
    scientificLabel: 'Liaison Symbiotique de Lichens',
    biome: 'TEMPERATE',
    minAtmosphereTier: 'P3',
    dossierClass: 'C4',
    summary: 'Écosystème ouvert auto-régulé accélérant la transition P3→P4 Éden.',
    atmosphereBonus: 12,
    computeBonus: 6,
    materialsBonus: 12,
  },
  {
    id: 'sci-rare-earth-vein',
    scientificLabel: 'Filon de Terres Rares Tectoniques',
    biome: 'CANYON',
    minAtmosphereTier: 'P1',
    dossierClass: 'C2',
    summary: 'Veine métallifère alimentant la production L3–L5 de composants électroniques.',
    atmosphereBonus: 0,
    computeBonus: 14,
    materialsBonus: 40,
  },
]);
