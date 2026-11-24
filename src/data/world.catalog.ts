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

export type PlanetBiomeId =
  | 'ARCHIPEL_EMERAUDE'
  | 'MONDE_OCEANIQUE'
  | 'PANGEE_TEMPEREE'
  | 'CANYONS_OCRES'
  | 'CRYO_OCEAN'
  | 'VOLCANIQUE_BASALTE'
  | 'BIOSPHERE_FONGIQUE'
  | 'ALPIN_SAUVAGE';

export type PlanetReliefId = 'DOUX' | 'EQUILIBRE' | 'ESCARPE';
export type PlanetClimateId = 'TEMPERE' | 'TROPICAL' | 'ARIDE' | 'POLAIRE';

export interface PlanetBiomeProfileSpec {
  readonly id: PlanetBiomeId;
  readonly name: string;
  readonly subtitle: string;
  readonly hasOcean: boolean;
  readonly defaultOceanPct: number;
  readonly defaultRelief: PlanetReliefId;
  readonly defaultClimate: PlanetClimateId;
  readonly swatchOcean: string;
  readonly swatchLand: string;
  readonly swatchHighlight: string;
  readonly bonusSummary: string;
  readonly tags: readonly string[];
  readonly startingDelta: {
    readonly water?: number;
    readonly energy?: number;
    readonly materials?: number;
    readonly food?: number;
    readonly compute?: number;
    readonly breathingKits?: number;
    readonly atmosphereProgress?: number;
  };
}

export const PLANET_BIOME_PROFILES_CATALOG: readonly PlanetBiomeProfileSpec[] = Object.freeze([
  {
    id: 'ARCHIPEL_EMERAUDE',
    name: 'Archipel Émeraude',
    subtitle: 'Îles volcaniques luxuriantes, lagons turquoise et forêts côtières.',
    hasOcean: true,
    defaultOceanPct: 72,
    defaultRelief: 'EQUILIBRE',
    defaultClimate: 'TROPICAL',
    swatchOcean: '#0284c7',
    swatchLand: '#10b981',
    swatchHighlight: '#67e8f9',
    bonusSummary: '+35 Eau · +15 Vivres · +8 % Biosphère initiale',
    tags: ['Océan 72 %', 'Récifs', 'Forêts côtières'],
    startingDelta: { water: 35, food: 15, atmosphereProgress: 8 },
  },
  {
    id: 'MONDE_OCEANIQUE',
    name: 'Monde Océanique',
    subtitle: 'Immenses mers profondes parsemées d’atolls solarpunk et de récifs.',
    hasOcean: true,
    defaultOceanPct: 86,
    defaultRelief: 'DOUX',
    defaultClimate: 'TROPICAL',
    swatchOcean: '#0369a1',
    swatchLand: '#2dd4bf',
    swatchHighlight: '#bae6fd',
    bonusSummary: '+55 Eau · +25 Énergie marémotrice · +10 % Biosphère',
    tags: ['Océan 86 %', 'Atolls', 'Marémoteur'],
    startingDelta: { water: 55, energy: 25, atmosphereProgress: 10 },
  },
  {
    id: 'PANGEE_TEMPEREE',
    name: 'Pangée Tempérée',
    subtitle: 'Grands continents fertiles, mers bleues équilibrées et vallées douces.',
    hasOcean: true,
    defaultOceanPct: 54,
    defaultRelief: 'EQUILIBRE',
    defaultClimate: 'TEMPERE',
    swatchOcean: '#0ea5e9',
    swatchLand: '#22c55e',
    swatchHighlight: '#fde68a',
    bonusSummary: '+25 Vivres · +20 Eau · +20 Matériaux',
    tags: ['Océan 54 %', 'Plaines', 'Équilibré'],
    startingDelta: { water: 20, food: 25, materials: 20, atmosphereProgress: 6 },
  },
  {
    id: 'CRYO_OCEAN',
    name: 'Cryo-Océan Boréal',
    subtitle: 'Mers polaires navigables, banquises fracturées et fjords cristallins.',
    hasOcean: true,
    defaultOceanPct: 64,
    defaultRelief: 'ESCARPE',
    defaultClimate: 'POLAIRE',
    swatchOcean: '#1d4ed8',
    swatchLand: '#cbd5e1',
    swatchHighlight: '#7dd3fc',
    bonusSummary: '+30 Compute · +30 Eau pure · Refroidissement naturel',
    tags: ['Océan 64 %', 'Banquise', 'Fjords'],
    startingDelta: { water: 30, compute: 30, atmosphereProgress: 4 },
  },
  {
    id: 'BIOSPHERE_FONGIQUE',
    name: 'Biosphère Fongique',
    subtitle: 'Estuaires bioluminescents, canopées améthyste et marais fertiles.',
    hasOcean: true,
    defaultOceanPct: 48,
    defaultRelief: 'DOUX',
    defaultClimate: 'TROPICAL',
    swatchOcean: '#0f766e',
    swatchLand: '#9333ea',
    swatchHighlight: '#34d399',
    bonusSummary: '+25 Kits Resp. · +20 Vivres · +12 % Biosphère',
    tags: ['Mers 48 %', 'Bioluminescent', 'Exobiologie'],
    startingDelta: { breathingKits: 25, food: 20, water: 15, atmosphereProgress: 12 },
  },
  {
    id: 'ALPIN_SAUVAGE',
    name: 'Alpin & Fjords',
    subtitle: 'Chaînes montagneuses enneigées, lacs profonds et vallées encaissées.',
    hasOcean: true,
    defaultOceanPct: 42,
    defaultRelief: 'ESCARPE',
    defaultClimate: 'TEMPERE',
    swatchOcean: '#0284c7',
    swatchLand: '#64748b',
    swatchHighlight: '#f8fafc',
    bonusSummary: '+30 Matériaux · +20 Énergie hydro · Relief défensif',
    tags: ['Lacs & Fjords 42 %', 'Hauts sommets', 'Hydro'],
    startingDelta: { materials: 30, energy: 20, water: 15, atmosphereProgress: 5 },
  },
  {
    id: 'VOLCANIQUE_BASALTE',
    name: 'Basalte & Caldeiras',
    subtitle: 'Côtes d’obsidienne, mers intérieures minérales et crêtes basaltiques.',
    hasOcean: true,
    defaultOceanPct: 30,
    defaultRelief: 'ESCARPE',
    defaultClimate: 'ARIDE',
    swatchOcean: '#0e7490',
    swatchLand: '#57534e',
    swatchHighlight: '#f97316',
    bonusSummary: '+45 Énergie · +35 Matériaux · Gisements lourds',
    tags: ['Mers 30 %', 'Obsidienne', 'Haute énergie'],
    startingDelta: { energy: 45, materials: 35 },
  },
  {
    id: 'CANYONS_OCRES',
    name: 'Canyons Ocres',
    subtitle: 'Plateaux de grès rouge, oasis profondes et bassins sédimentaires.',
    hasOcean: false,
    defaultOceanPct: 16,
    defaultRelief: 'ESCARPE',
    defaultClimate: 'ARIDE',
    swatchOcean: '#155e75',
    swatchLand: '#c2410c',
    swatchHighlight: '#fbbf24',
    bonusSummary: '+50 Matériaux · +25 Énergie solaire · Exploration minière',
    tags: ['Mers 16 %', 'Canyons', 'Solaire'],
    startingDelta: { materials: 50, energy: 25 },
  },
]);

export function resolvePlanetBiomeProfile(id?: string): PlanetBiomeProfileSpec {
  return (
    PLANET_BIOME_PROFILES_CATALOG.find((p) => p.id === id) ?? PLANET_BIOME_PROFILES_CATALOG[0]!
  );
}

export interface ComputedBiomeShare {
  readonly id: string;
  readonly label: string;
  readonly pct: number;
  readonly colorHex: string;
}

/**
 * Pure deterministic planetary surface breakdown (always sums to 100%).
 */
export function computePlanetBiomeDistribution(
  biomeId: PlanetBiomeId,
  oceanCoveragePct: number,
  relief: PlanetReliefId,
  climate: PlanetClimateId,
  worldSeed: number,
): readonly ComputedBiomeShare[] {
  const clampedOcean = Math.max(0, Math.min(92, Math.round(oceanCoveragePct)));
  const landPct = 100 - clampedOcean;
  const seedJitter = ((worldSeed % 7) - 3);

  const deepOceanPct = Math.round(clampedOcean * 0.68);
  const shelfOceanPct = Math.max(0, clampedOcean - deepOceanPct);

  const reliefMountainWeight = relief === 'ESCARPE' ? 0.34 : relief === 'DOUX' ? 0.14 : 0.24;
  const polarWeight = climate === 'POLAIRE' ? 0.38 : climate === 'ARIDE' ? 0.08 : climate === 'TROPICAL' ? 0.06 : 0.16;

  const peaksPct = Math.max(
    0,
    Math.min(landPct, Math.round(landPct * reliefMountainWeight) + (seedJitter > 0 ? 1 : 0)),
  );
  const polarPct = Math.max(
    0,
    Math.min(landPct - peaksPct, Math.round(landPct * polarWeight)),
  );
  const remainingLand = Math.max(0, landPct - peaksPct - polarPct);
  const primaryLandPct = Math.round(remainingLand * 0.65);
  const secondaryLandPct = Math.max(0, remainingLand - primaryLandPct);

  const landLabels: Record<PlanetBiomeId, { primary: string; primaryColor: string; secondary: string; secondaryColor: string; peak: string; peakColor: string }> = {
    ARCHIPEL_EMERAUDE: { primary: 'Forêts côtières', primaryColor: '#10b981', secondary: 'Plages & plaines', secondaryColor: '#84cc16', peak: 'Crêtes volcaniques', peakColor: '#64748b' },
    MONDE_OCEANIQUE: { primary: 'Atolls verdoyants', primaryColor: '#14b8a6', secondary: 'Bancs coralliens', secondaryColor: '#2dd4bf', peak: 'Pitons marins', peakColor: '#94a3b8' },
    PANGEE_TEMPEREE: { primary: 'Plaines tempérées', primaryColor: '#22c55e', secondary: 'Forêts boréales', secondaryColor: '#15803d', peak: 'Massifs alpins', peakColor: '#94a3b8' },
    CRYO_OCEAN: { primary: 'Toundra côtière', primaryColor: '#64748b', secondary: 'Banquise & glaciers', secondaryColor: '#bae6fd', peak: 'Pics glacés', peakColor: '#e2e8f0' },
    BIOSPHERE_FONGIQUE: { primary: 'Canopée fongique', primaryColor: '#a855f7', secondary: 'Estuaires bio', secondaryColor: '#34d399', peak: 'Plateaux cristallins', peakColor: '#c084fc' },
    ALPIN_SAUVAGE: { primary: 'Vallées alpines', primaryColor: '#16a34a', secondary: 'Toundra d’altitude', secondaryColor: '#64748b', peak: 'Sommets enneigés', peakColor: '#f1f5f9' },
    VOLCANIQUE_BASALTE: { primary: 'Steppes basaltiques', primaryColor: '#57534e', secondary: 'Plaines minérales', secondaryColor: '#a8a29e', peak: 'Caldeiras actives', peakColor: '#f97316' },
    CANYONS_OCRES: { primary: 'Plateaux ocres', primaryColor: '#d97706', secondary: 'Oasis & bassins', secondaryColor: '#84cc16', peak: 'Canyons & mesas', peakColor: '#b45309' },
  };
  const cfg = landLabels[biomeId];

  const raw: ComputedBiomeShare[] = [];
  if (deepOceanPct > 0) raw.push({ id: 'deep_ocean', label: 'Océans profonds', pct: deepOceanPct, colorHex: '#0369a1' });
  if (shelfOceanPct > 0) raw.push({ id: 'coastal_shelf', label: 'Mers côtières & récifs', pct: shelfOceanPct, colorHex: '#06b6d4' });
  if (primaryLandPct > 0) raw.push({ id: 'primary_land', label: cfg.primary, pct: primaryLandPct, colorHex: cfg.primaryColor });
  if (secondaryLandPct > 0) raw.push({ id: 'secondary_land', label: cfg.secondary, pct: secondaryLandPct, colorHex: cfg.secondaryColor });
  if (peaksPct > 0) raw.push({ id: 'peaks', label: cfg.peak, pct: peaksPct, colorHex: cfg.peakColor });
  if (polarPct > 0) raw.push({ id: 'polar', label: climate === 'ARIDE' ? 'Déserts d’altitude' : 'Calottes polaires', pct: polarPct, colorHex: climate === 'ARIDE' ? '#eab308' : '#e2e8f0' });

  // Guarantee exact 100% total
  const sum = raw.reduce((acc, item) => acc + item.pct, 0);
  if (raw.length > 0 && sum !== 100) {
    const first = raw[0]!;
    raw[0] = { ...first, pct: Math.max(0, first.pct + (100 - sum)) };
  }
  return raw;
}
