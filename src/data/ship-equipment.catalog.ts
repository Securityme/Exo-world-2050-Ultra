import type {
  FleetShip,
  ShipInstalledModule,
  ShipModuleSlot,
} from '../contracts/v4-systems.schema.ts';

/**
 * [L1] EXW.L1.SHIP_EQUIPMENT_CATALOG | v5.1.0 | SADT A1.1
 * Pure static catalog of Solarpunk/Orbital vessel weapons, defense shields,
 * propulsion drives, utility pods, vessel blueprints, and colonist gear upgrades.
 */

export interface ShipModuleSpec {
  readonly id: string;
  readonly slot: ShipModuleSlot;
  readonly name: string;
  readonly tier: 1 | 2 | 3;
  readonly minEra: 1 | 2 | 3 | 4 | 5 | 6;
  readonly summary: string;
  readonly costCredits: number;
  readonly costMaterials: number;
  readonly costElectronics: number;
  readonly costCompute: number;
  readonly firepower: number;
  readonly defense: number;
  readonly speed: number;
  readonly utilityYield: number;
}

export const SHIP_MODULE_SLOT_LABELS: Record<ShipModuleSlot, string> = Object.freeze({
  WEAPON: 'Armement',
  DEFENSE: 'Défense & Bouclier',
  PROPULSION: 'Propulsion',
  UTILITY: 'Utilitaire & Science',
});

export const SHIP_CLASS_LABELS: Record<FleetShip['shipClass'], string> = Object.freeze({
  SHUTTLE_CARGO: 'Navette Cargo',
  SCIENCE_PROBE: 'Sonde Scientifique',
  CORVETTE_ORBITAL: 'Corvette Orbitale',
  FRIGATE_SOLAR: 'Frégate Solaire',
  COLONY_ARK: 'Arche Coloniale',
});

export const SHIP_MODULES_CATALOG: readonly ShipModuleSpec[] = Object.freeze([
  // ARMEMENT (WEAPON)
  {
    id: 'mod-wpn-railgun',
    slot: 'WEAPON',
    name: 'Canon Railgun Cinétique',
    tier: 1,
    minEra: 1,
    summary: 'Batterie électromagnétique précise pour escorte orbitale et appui tactique.',
    costCredits: 110,
    costMaterials: 22,
    costElectronics: 8,
    costCompute: 0,
    firepower: 18,
    defense: 0,
    speed: 0,
    utilityYield: 0,
  },
  {
    id: 'mod-wpn-ion-lance',
    slot: 'WEAPON',
    name: 'Batterie Laser Ionique',
    tier: 2,
    minEra: 1,
    summary: 'Faisceaux ioniques haute fréquence capables de saturer les boucliers adverses.',
    costCredits: 190,
    costMaterials: 32,
    costElectronics: 16,
    costCompute: 10,
    firepower: 28,
    defense: 4,
    speed: 0,
    utilityYield: 0,
  },
  {
    id: 'mod-wpn-plasma-arc',
    slot: 'WEAPON',
    name: 'Lance-Torpilles Arc-Solaire',
    tier: 3,
    minEra: 2,
    summary: 'Salves plasma guidées pour bombardement orbital décisif.',
    costCredits: 290,
    costMaterials: 48,
    costElectronics: 24,
    costCompute: 18,
    firepower: 42,
    defense: 0,
    speed: 0,
    utilityYield: 0,
  },

  // DÉFENSE (DEFENSE)
  {
    id: 'mod-def-graphene-hull',
    slot: 'DEFENSE',
    name: 'Blindage Titane-Graphène',
    tier: 1,
    minEra: 1,
    summary: 'Plaques composites renforcées réduisant l’usure structurelle et les pertes.',
    costCredits: 105,
    costMaterials: 26,
    costElectronics: 6,
    costCompute: 0,
    firepower: 0,
    defense: 20,
    speed: 0,
    utilityYield: 0,
  },
  {
    id: 'mod-def-mag-shield',
    slot: 'DEFENSE',
    name: 'Bouclier Magnétosphérique',
    tier: 2,
    minEra: 1,
    summary: 'Champ déflecteur actif absorbant les tirs orbitaux et tempêtes solaires.',
    costCredits: 185,
    costMaterials: 30,
    costElectronics: 18,
    costCompute: 12,
    firepower: 6,
    defense: 32,
    speed: 0,
    utilityYield: 0,
  },
  {
    id: 'mod-def-cyber-aegis',
    slot: 'DEFENSE',
    name: 'Contre-Mesures Quantiques',
    tier: 2,
    minEra: 2,
    summary: 'Brouilleur spectral protégeant la flotte contre les intrusions cyber.',
    costCredits: 170,
    costMaterials: 20,
    costElectronics: 22,
    costCompute: 15,
    firepower: 0,
    defense: 24,
    speed: 0,
    utilityYield: 10,
  },

  // PROPULSION (PROPULSION)
  {
    id: 'mod-prop-vasimr',
    slot: 'PROPULSION',
    name: 'Propulseur Ionique Hélium-3',
    tier: 1,
    minEra: 1,
    summary: 'Accélère les rotations orbitales et améliore l’esquive tactique.',
    costCredits: 95,
    costMaterials: 18,
    costElectronics: 10,
    costCompute: 0,
    firepower: 0,
    defense: 6,
    speed: 20,
    utilityYield: 0,
  },
  {
    id: 'mod-prop-solar-sail',
    slot: 'PROPULSION',
    name: 'Voile Photonique Haute Crête',
    tier: 2,
    minEra: 1,
    summary: 'Collecteur solaire déployable alliant vitesse de croisière et rendement logistique.',
    costCredits: 155,
    costMaterials: 24,
    costElectronics: 14,
    costCompute: 0,
    firepower: 0,
    defense: 0,
    speed: 28,
    utilityYield: 8,
  },
  {
    id: 'mod-prop-orbital-vector',
    slot: 'PROPULSION',
    name: 'Tuyères Vectorielles Orbitales',
    tier: 3,
    minEra: 2,
    summary: 'Manœuvrabilité de combat supérieure et verrouillage rapide des cibles.',
    costCredits: 240,
    costMaterials: 36,
    costElectronics: 22,
    costCompute: 10,
    firepower: 14,
    defense: 6,
    speed: 38,
    utilityYield: 0,
  },

  // UTILITAIRE & SCIENCE (UTILITY)
  {
    id: 'mod-util-cargo-bay',
    slot: 'UTILITY',
    name: 'Baie Logistique Modulaire',
    tier: 1,
    minEra: 1,
    summary: 'Augmente le fret orbital (+Crédits et +Matériaux nets à chaque tour).',
    costCredits: 90,
    costMaterials: 20,
    costElectronics: 4,
    costCompute: 0,
    firepower: 0,
    defense: 0,
    speed: 0,
    utilityYield: 14,
  },
  {
    id: 'mod-util-bio-seeder',
    slot: 'UTILITY',
    name: 'Nacelle Bio-Ensemencement',
    tier: 2,
    minEra: 1,
    summary: 'Diffuse des bio-nutriments en orbite basse (+Eau, +Kits O₂ et +Terraformation).',
    costCredits: 145,
    costMaterials: 22,
    costElectronics: 12,
    costCompute: 6,
    firepower: 0,
    defense: 0,
    speed: 0,
    utilityYield: 18,
  },
  {
    id: 'mod-util-quantum-relay',
    slot: 'UTILITY',
    name: 'Relais Calcul Orbital',
    tier: 2,
    minEra: 1,
    summary: 'Nœud de calcul spatial renforçant votre capacité Cyber et votre recherche.',
    costCredits: 165,
    costMaterials: 18,
    costElectronics: 20,
    costCompute: 0,
    firepower: 4,
    defense: 0,
    speed: 0,
    utilityYield: 22,
  },
]);

export function toInstalledModule(spec: ShipModuleSpec): ShipInstalledModule {
  return {
    id: spec.id,
    slot: spec.slot,
    name: spec.name,
    tier: spec.tier,
    firepower: spec.firepower,
    defense: spec.defense,
    speed: spec.speed,
    utilityYield: spec.utilityYield,
  };
}

export function findShipModuleSpec(moduleId: string): ShipModuleSpec | null {
  return SHIP_MODULES_CATALOG.find((m) => m.id === moduleId) ?? null;
}

export interface ShipBlueprintSpec {
  readonly shipClass: FleetShip['shipClass'];
  readonly label: string;
  readonly defaultRole: FleetShip['assignedRole'];
  readonly minEra: 1 | 2 | 3 | 4 | 5 | 6;
  readonly baseSlots: number;
  readonly costCredits: number;
  readonly costMaterials: number;
  readonly costElectronics: number;
  readonly defaultModuleId: string;
  readonly summary: string;
}

export const SHIP_BLUEPRINTS_CATALOG: readonly ShipBlueprintSpec[] = Object.freeze([
  {
    shipClass: 'SHUTTLE_CARGO',
    label: 'Navette Cargo',
    defaultRole: 'RESOURCE_HAUL',
    minEra: 1,
    baseSlots: 3,
    costCredits: 220,
    costMaterials: 45,
    costElectronics: 12,
    defaultModuleId: 'mod-util-cargo-bay',
    summary: 'Transporteur polyvalent pour logistique orbitale et approvisionnement.',
  },
  {
    shipClass: 'SCIENCE_PROBE',
    label: 'Sonde Scientifique',
    defaultRole: 'RECON',
    minEra: 1,
    baseSlots: 3,
    costCredits: 240,
    costMaterials: 38,
    costElectronics: 22,
    defaultModuleId: 'mod-util-quantum-relay',
    summary: 'Plateforme de reconnaissance, télémétrie et calcul orbital souverain.',
  },
  {
    shipClass: 'CORVETTE_ORBITAL',
    label: 'Corvette Orbitale',
    defaultRole: 'ORBIT_PATROL',
    minEra: 1,
    baseSlots: 4,
    costCredits: 320,
    costMaterials: 62,
    costElectronics: 24,
    defaultModuleId: 'mod-wpn-railgun',
    summary: 'Vaisseau d’escorte agile doté de 4 emplacements d’armes et boucliers.',
  },
  {
    shipClass: 'FRIGATE_SOLAR',
    label: 'Frégate Solaire',
    defaultRole: 'ORBIT_PATROL',
    minEra: 2,
    baseSlots: 5,
    costCredits: 460,
    costMaterials: 90,
    costElectronics: 36,
    defaultModuleId: 'mod-wpn-ion-lance',
    summary: 'Croiseur solaire lourd à 5 baies modulaires pour supériorité orbitale.',
  },
  {
    shipClass: 'COLONY_ARK',
    label: 'Arche Coloniale',
    defaultRole: 'TERRA_SEED',
    minEra: 3,
    baseSlots: 6,
    costCredits: 680,
    costMaterials: 130,
    costElectronics: 50,
    defaultModuleId: 'mod-util-bio-seeder',
    summary: 'Vaisseau amiral biosphérique à 6 emplacements pour terraformation planétaire.',
  },
]);

export function findShipBlueprint(shipClass: FleetShip['shipClass']): ShipBlueprintSpec {
  return (
    SHIP_BLUEPRINTS_CATALOG.find((b) => b.shipClass === shipClass) ??
    SHIP_BLUEPRINTS_CATALOG[0]!
  );
}

export interface ColonistGearUpgradeSpec {
  readonly slot: 'outfitTier' | 'toolTier' | 'weaponTier';
  readonly label: string;
  readonly summary: string;
  readonly costCreditsPerTier: number;
  readonly costMaterialsPerTier: number;
  readonly costElectronicsPerTier: number;
}

export const COLONIST_GEAR_UPGRADE_SPECS: Record<
  'outfitTier' | 'toolTier' | 'weaponTier',
  ColonistGearUpgradeSpec
> = Object.freeze({
  outfitTier: {
    slot: 'outfitTier',
    label: 'Tenues de Protection',
    summary: 'Réduit la fatigue des colons et améliore la résistance atmosphérique.',
    costCreditsPerTier: 130,
    costMaterialsPerTier: 24,
    costElectronicsPerTier: 10,
  },
  toolTier: {
    slot: 'toolTier',
    label: 'Outillage de Précision',
    summary: 'Augmente la productivité urbaine et le rendement des quartiers.',
    costCreditsPerTier: 140,
    costMaterialsPerTier: 28,
    costElectronicsPerTier: 14,
  },
  weaponTier: {
    slot: 'weaponTier',
    label: 'Équipement Défense Personnelle',
    summary: 'Renforce la sécurité civique et la défense des garnisons locales.',
    costCreditsPerTier: 150,
    costMaterialsPerTier: 26,
    costElectronicsPerTier: 16,
  },
});
