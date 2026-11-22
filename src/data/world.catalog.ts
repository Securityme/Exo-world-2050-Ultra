/**
 * [L1] FUP-010 | MC-00 | R-04, R-27, R-50
 * Data-driven static catalogs: 6 Humankind Eras, 6 Superpowers, 6 Planetary Slots,
 * and strictly scientific discovery nomenclature (zero usage of forbidden generic word).
 */
export interface EraDefinition {
  readonly era: 1 | 2 | 3 | 4 | 5 | 6;
  readonly name: string;
  readonly yearStart: number;
  readonly starsRequired: number;
  readonly unlockedResources: readonly string[];
  readonly maxUnitLevel: 1 | 2 | 3 | 4 | 5;
  readonly unlockedSlot: 1 | 2 | 3 | 4 | 5 | 6;
}

export const ERAS_CATALOG: readonly EraDefinition[] = Object.freeze([
  {
    era: 1,
    name: 'Ère I — Horizon 2050',
    yearStart: 2050,
    starsRequired: 0,
    unlockedResources: ['Crédits', 'Énergie', 'Matériaux', 'Eau', 'Vivres', 'Électronique'],
    maxUnitLevel: 1,
    unlockedSlot: 1,
  },
  {
    era: 2,
    name: 'Ère II — Orbite & Lune',
    yearStart: 2065,
    starsRequired: 4,
    unlockedResources: ['Carburant Orbital', 'Alliages Composites', 'Compute', 'Kits Respiratoires'],
    maxUnitLevel: 2,
    unlockedSlot: 2,
  },
  {
    era: 3,
    name: 'Ère III — Genèse Martienne',
    yearStart: 2085,
    starsRequired: 9,
    unlockedResources: ['Hélium-3', 'Terres Rares', 'Bio-Polymères', 'Pièces Drones'],
    maxUnitLevel: 3,
    unlockedSlot: 3,
  },
  {
    era: 4,
    name: 'Ère IV — Cyber-Industrie',
    yearStart: 2110,
    starsRequired: 15,
    unlockedResources: ['Supra-conducteurs', 'Compute Quantique'],
    maxUnitLevel: 4,
    unlockedSlot: 4,
  },
  {
    era: 5,
    name: 'Ère V — Exoplanètes Lointaines',
    yearStart: 2140,
    starsRequired: 22,
    unlockedResources: ['Bio-Enzymes Extrêmophiles', 'Isotopes Exotiques'],
    maxUnitLevel: 5,
    unlockedSlot: 5,
  },
  {
    era: 6,
    name: 'Ère VI — Suprématie Exosphérique',
    yearStart: 2170,
    starsRequired: 30,
    unlockedResources: ['Influence Galactique', 'Antimatière'],
    maxUnitLevel: 5,
    unlockedSlot: 6,
  },
]);

export interface SuperpowerTemplate {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly allianceName: string;
  readonly colorHex: string;
  readonly doctrineBonus: string;
}

export const SUPERPOWERS_CATALOG: readonly SuperpowerTemplate[] = Object.freeze([
  {
    id: 'eu-spatiale',
    name: 'Union Européenne Spatiale',
    code: 'UES',
    allianceName: 'Consortium Hélios-Eurydice',
    colorHex: '#ec4899',
    doctrineBonus: '+15 % Terraformation & Réglementation Solarpunk',
  },
  {
    id: 'otan-orbite',
    name: 'Alliance Atlantique Orbitale',
    code: 'AAO',
    allianceName: 'Directoire Stratégique Atlantique',
    colorHex: '#8b5cf6',
    doctrineBonus: '+12 % Puissance Corvettes & Compute Défensif',
  },
  {
    id: 'brics-plus',
    name: 'Pacte BRICS+ Exosphérique',
    code: 'BRX',
    allianceName: 'Fédération Industrielle Polycentrique',
    colorHex: '#f59e0b',
    doctrineBonus: '+18 % Extraction Matériaux & Transporteurs T1–T4',
  },
  {
    id: 'indo-pacifique',
    name: 'Ligue Indo-Pacifique',
    code: 'LIP',
    allianceName: 'Union Cyber-Maritime Pacifique',
    colorHex: '#10b981',
    doctrineBonus: '+15 % Rendement Datacenters & Drones Autonomes',
  },
  {
    id: 'pan-africain',
    name: 'Consortium Pan-Africain',
    code: 'CPA',
    allianceName: 'Ligue Solaire Équatoriale',
    colorHex: '#f97316',
    doctrineBonus: '+20 % Production Énergie Solaire & Croissance Urbaine',
  },
  {
    id: 'andin-austral',
    name: 'Fédération Andine-Australe',
    code: 'FAA',
    allianceName: 'Coopérative Australe des Hauts-Plateaux',
    colorHex: '#a78bfa',
    doctrineBonus: '+15 % Résilience Atmosphérique P1–P2 & Agronomie',
  },
]);

export interface PlanetarySlotInfo {
  readonly slotIndex: 1 | 2 | 3 | 4 | 5 | 6;
  readonly name: string;
  readonly bodyType: string;
  readonly signatureResource: string;
  readonly unlockEra: number;
  readonly orbitRadius: number;
  readonly planetColor: string;
}

export const PLANETARY_SLOTS_CATALOG: readonly PlanetarySlotInfo[] = Object.freeze([
  {
    slotIndex: 1,
    name: 'Colonie principale',
    bodyType: 'Planète habitable (Zone 1)',
    signatureResource: 'Crédits, Eau, Vivres',
    unlockEra: 1,
    orbitRadius: 7,
    planetColor: '#c26d3a',
  },
  {
    slotIndex: 2,
    name: 'Base lunaire',
    bodyType: 'Satellite naturel (Zone 2)',
    signatureResource: 'Hélium-3, Glace pure',
    unlockEra: 2,
    orbitRadius: 11,
    planetColor: '#94a3b8',
  },
  {
    slotIndex: 3,
    name: 'Colonie martienne',
    bodyType: 'Planète rocheuse (Zone 3)',
    signatureResource: 'Minerais lourds, Isotopes',
    unlockEra: 3,
    orbitRadius: 15.5,
    planetColor: '#b45309',
  },
  {
    slotIndex: 4,
    name: 'Station océanique',
    bodyType: 'Planète glacée (Zone 4)',
    signatureResource: 'Eau profonde, Conducteurs',
    unlockEra: 4,
    orbitRadius: 20,
    planetColor: '#0284c7',
  },
  {
    slotIndex: 5,
    name: 'Monde forestier',
    bodyType: 'Exoplanète tempérée (Zone 5)',
    signatureResource: 'Ressources biologiques',
    unlockEra: 5,
    orbitRadius: 25,
    planetColor: '#059669',
  },
  {
    slotIndex: 6,
    name: 'Station lointaine',
    bodyType: 'Avant-poste profond (Zone 6)',
    signatureResource: 'Énergie haute densité',
    unlockEra: 6,
    orbitRadius: 30,
    planetColor: '#7c3aed',
  },
]);

/**
 * R-50 Strict Scientific Nomenclature Catalog (banned generic word strictly absent).
 */
export const SCIENTIFIC_DISCOVERIES_CATALOG: readonly string[] = Object.freeze([
  'Gisement d’Isotopes Piégés',
  'Fosse Hydrothermale Active',
  'Cavité Glaciaire Pressurisée',
  'Poche Microbienne Extrêmophile',
  'Épave de Sonde Précurseur',
  'Faille Magnétique Sub-Croûtale',
  'Signature Spectrale Artificielle',
]);
