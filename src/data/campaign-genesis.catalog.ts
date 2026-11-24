import type { SuggestionFieldKind } from '../contracts/skills-vcs.schema.ts';

/**
 * [L1] EXW.L1.CAMPAIGN_GENESIS | v5.1.0 | SADT A1.1
 * Rich static catalog for the 4-step New Game Configurator:
 * - Government types
 * - Illustrated Landing sites
 * - Starting Colony Specializations
 * - Difficulty & Resource Abundance & Tension presets
 * - Combinatorial Lexicon Banks for Suggestion Bubbles (Planet, Capital, Leader, Fleet)
 */

export interface GovernmentTypeSpec {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly bonusLabel: string;
  readonly iconKey: 'SCALE' | 'SHIELD' | 'CPU' | 'LEAF' | 'BUILDING';
  readonly accentHex: string;
  readonly creditsDelta: number;
  readonly approvalDelta: number;
  readonly paBonus: boolean;
}

export const GOVERNMENT_TYPES_CATALOG: readonly GovernmentTypeSpec[] = Object.freeze([
  {
    id: 'REPUBLIQUE_SOLAIRE',
    name: 'République Solarpunk Fédérale',
    tagline: 'Assemblées citoyennes locales et charte écologique contraignante.',
    bonusLabel: '+6 % Approbation · +12 Kits O₂ · +2 % Biosphère',
    iconKey: 'LEAF',
    accentHex: '#10b981',
    creditsDelta: 0,
    approvalDelta: 6,
    paBonus: false,
  },
  {
    id: 'CONSORTIUM_TECHNOCRATIQUE',
    name: 'Directoire Technocratique',
    tagline: 'Décisions pilotées par modèles scientifiques et ingénierie de pointe.',
    bonusLabel: '+25 Calcul · +15 Électronique',
    iconKey: 'CPU',
    accentHex: '#00f0ff',
    creditsDelta: 60,
    approvalDelta: -2,
    paBonus: false,
  },
  {
    id: 'SYNDICAT_MARCHAND',
    name: 'Syndicat Orbital Marchand',
    tagline: 'Partenariats logistiques privés et fiscalité incitative.',
    bonusLabel: '+260 Crédits · +25 Matériaux',
    iconKey: 'BUILDING',
    accentHex: '#ffb800',
    creditsDelta: 260,
    approvalDelta: 0,
    paBonus: false,
  },
  {
    id: 'CONSEIL_CIVIQUE',
    name: 'Conseil de Subsidiarité Civique',
    tagline: 'Équilibre prudent entre bien commun, paroisses locales et autonomie.',
    bonusLabel: '+4 % Approbation · +5 % Confiance Alliance',
    iconKey: 'SCALE',
    accentHex: '#a78bfa',
    creditsDelta: 80,
    approvalDelta: 4,
    paBonus: true,
  },
  {
    id: 'PROTECTORAT_STRATEGIQUE',
    name: 'Protectorat de Sécurité Planétaire',
    tagline: 'Défense préventive, discipline logistique et garnisons prêtes.',
    bonusLabel: '+25 Énergie · +30 Matériaux · Garnison renforcée',
    iconKey: 'SHIELD',
    accentHex: '#f97316',
    creditsDelta: 90,
    approvalDelta: -3,
    paBonus: false,
  },
]);

export interface LandingSiteSpec {
  readonly id: string;
  readonly name: string;
  readonly subtitle: string;
  readonly terrainType: 'COASTAL_BAY' | 'RIVER_DELTA' | 'HIGHLAND_PLATEAU' | 'CRATER_BASIN' | 'FJORD_HARBOR';
  readonly bonusSummary: string;
  readonly accentHex: string;
  readonly tileIndex: number;
  readonly waterDelta: number;
  readonly materialsDelta: number;
  readonly energyDelta: number;
  readonly foodDelta: number;
}

export const LANDING_SITES_CATALOG: readonly LandingSiteSpec[] = Object.freeze([
  {
    id: 'BAIE_AUBE',
    name: 'Baie de l’Aube',
    subtitle: 'Anse côtière abritée avec estuaire profond pour quais maritimes.',
    terrainType: 'COASTAL_BAY',
    bonusSummary: '+30 Eau · +15 Vivres · Port naturel',
    accentHex: '#06b6d4',
    tileIndex: 12,
    waterDelta: 30,
    materialsDelta: 10,
    energyDelta: 10,
    foodDelta: 15,
  },
  {
    id: 'DELTA_EMERAUDE',
    name: 'Delta d’Émeraude',
    subtitle: 'Plaine alluviale fertile traversée de canaux navigables.',
    terrainType: 'RIVER_DELTA',
    bonusSummary: '+35 Vivres · +25 Eau',
    accentHex: '#10b981',
    tileIndex: 18,
    waterDelta: 25,
    materialsDelta: 0,
    energyDelta: 10,
    foodDelta: 35,
  },
  {
    id: 'PLATEAU_HELIOS',
    name: 'Plateau Hélios',
    subtitle: 'Terrasses ensoleillées idéales pour centrales solaires et astroport.',
    terrainType: 'HIGHLAND_PLATEAU',
    bonusSummary: '+40 Énergie · +20 Matériaux',
    accentHex: '#f59e0b',
    tileIndex: 13,
    waterDelta: 5,
    materialsDelta: 20,
    energyDelta: 40,
    foodDelta: 0,
  },
  {
    id: 'BASIN_BASALTE',
    name: 'Bassin du Basalte',
    subtitle: 'Cuvette minérale riche en terres rares et gisements métalliques.',
    terrainType: 'CRATER_BASIN',
    bonusSummary: '+45 Matériaux · +15 Énergie',
    accentHex: '#f97316',
    tileIndex: 20,
    waterDelta: 0,
    materialsDelta: 45,
    energyDelta: 15,
    foodDelta: 0,
  },
  {
    id: 'FJORD_BOREAL',
    name: 'Fjord Boréal',
    subtitle: 'Crique glaciaire profonde favorisant le calcul massif et l’hydro.',
    terrainType: 'FJORD_HARBOR',
    bonusSummary: '+25 Eau · +25 Énergie hydro',
    accentHex: '#38bdf8',
    tileIndex: 10,
    waterDelta: 25,
    materialsDelta: 15,
    energyDelta: 25,
    foodDelta: 5,
  },
]);

export interface ColonySpecializationSpec {
  readonly id: string;
  readonly name: string;
  readonly subtitle: string;
  readonly bonusSummary: string;
  readonly badgeColor: string;
}

export const COLONY_SPECIALIZATIONS_CATALOG: readonly ColonySpecializationSpec[] = Object.freeze([
  {
    id: 'BIOSCIENCES_AGRO',
    name: 'Biosciences & Agro-Écologie',
    subtitle: 'Accélère la régénération atmosphérique P1→P4 et les récoltes.',
    bonusSummary: '+25 Vivres · +20 Kits O₂ · +3 % Biosphère',
    badgeColor: '#10b981',
  },
  {
    id: 'INGENIERIE_INDUSTRIELLE',
    name: 'Ingénierie & Industrie Lourde',
    subtitle: 'Priorité aux chantiers, drones et infrastructures urbaines.',
    bonusSummary: '+45 Matériaux · +20 Énergie',
    badgeColor: '#f59e0b',
  },
  {
    id: 'CYBER_ORBITAL',
    name: 'Calcul Quantique & Chantier Orbital',
    subtitle: 'Renforce les centres de calcul, sondes et capacités spatiales.',
    bonusSummary: '+30 Calcul · +20 Électronique',
    badgeColor: '#06b6d4',
  },
  {
    id: 'DIPLOMATIE_COMMERCE',
    name: 'Carrefour Diplomatique & Maritime',
    subtitle: 'Démarre avec une forte influence planétaire et des réserves.',
    bonusSummary: '+220 Crédits · +12 Influence Planétaire',
    badgeColor: '#a78bfa',
  },
]);

export interface LexiconBankEntry {
  readonly value: string;
  readonly theme: string;
  readonly root: string;
}

export const SUGGESTION_LEXICON_BANKS: Readonly<Record<SuggestionFieldKind, readonly LexiconBankEntry[]>> = Object.freeze({
  PLANET: [
    { value: 'Nouvelle-Aurore', theme: 'SOLAR', root: 'Aurore' },
    { value: 'Thalassa IV', theme: 'OCEAN', root: 'Thalassa' },
    { value: 'Élysée-9', theme: 'EDEN', root: 'Élysée' },
    { value: 'Hélios-Prime', theme: 'SOLAR', root: 'Hélios' },
    { value: 'Veridia', theme: 'FLORA', root: 'Verid' },
    { value: 'Célestia', theme: 'ORBIT', root: 'Célest' },
    { value: 'Néréide-II', theme: 'OCEAN', root: 'Néréid' },
    { value: 'Boréalia', theme: 'CRYO', root: 'Boréal' },
    { value: 'Aurelia', theme: 'SOLAR', root: 'Aurel' },
    { value: 'Sérénité-2050', theme: 'EDEN', root: 'Sérén' },
    { value: 'Émeraude-V', theme: 'FLORA', root: 'Émeraud' },
    { value: 'Océanis', theme: 'OCEAN', root: 'Océan' },
    { value: 'Val-Lumen', theme: 'SOLAR', root: 'Lumen' },
    { value: 'Altéa', theme: 'ORBIT', root: 'Altéa' },
    { value: 'Sylva-Terra', theme: 'FLORA', root: 'Sylva' },
    { value: 'Astrée', theme: 'ORBIT', root: 'Astrée' },
    { value: 'Génésis-Mer', theme: 'OCEAN', root: 'Génésis' },
    { value: 'Zéphyr-III', theme: 'AIR', root: 'Zéphyr' },
  ],
  CAPITAL: [
    { value: 'Port-Lumière', theme: 'COAST', root: 'Lumière' },
    { value: 'Nouvelle-Genève', theme: 'CIVIC', root: 'Genève' },
    { value: 'Cité d’Émeraude', theme: 'FLORA', root: 'Émeraude' },
    { value: 'Havre-Solaire', theme: 'SOLAR', root: 'Havre' },
    { value: 'Aurore-sur-Mer', theme: 'COAST', root: 'Aurore' },
    { value: 'Val-d’Or', theme: 'SOLAR', root: 'Val' },
    { value: 'Concordia', theme: 'CIVIC', root: 'Concord' },
    { value: 'Port-Espérance', theme: 'COAST', root: 'Espér' },
    { value: 'Saint-Michel Orbital', theme: 'CIVIC', root: 'Michel' },
    { value: 'Bayside-2050', theme: 'COAST', root: 'Bay' },
    { value: 'Sola-Civitas', theme: 'SOLAR', root: 'Sola' },
    { value: 'Méridia', theme: 'CIVIC', root: 'Mérid' },
    { value: 'Nautilia', theme: 'COAST', root: 'Nautil' },
    { value: 'Verdelac', theme: 'FLORA', root: 'Verde' },
    { value: 'Arès-Port', theme: 'MINERAL', root: 'Port' },
    { value: 'Clairval', theme: 'FLORA', root: 'Clair' },
  ],
  LEADER: [
    { value: 'Hélène Vance', theme: 'CIVIC', root: 'Hélène' },
    { value: 'Marc-Antoine Delacroix', theme: 'FRENCH', root: 'Delacroix' },
    { value: 'Sébastien Lindqvist', theme: 'NORDIC', root: 'Lindqvist' },
    { value: 'Claire-Marie Moreau', theme: 'FRENCH', root: 'Moreau' },
    { value: 'Tariq Al-Mansoor', theme: 'SOLAR', root: 'Mansoor' },
    { value: 'Mei-Ling Chen', theme: 'SCIENCE', root: 'Chen' },
    { value: 'Camille Rochefort', theme: 'FRENCH', root: 'Rochefort' },
    { value: 'Gabriel Costa', theme: 'MARITIME', root: 'Costa' },
    { value: 'Nadia Kowalski', theme: 'SCIENCE', root: 'Kowalski' },
    { value: 'Jean-Baptiste Verrier', theme: 'CIVIC', root: 'Verrier' },
    { value: 'Amina Diallo', theme: 'ECO', root: 'Diallo' },
    { value: 'Astrid Solberg', theme: 'NORDIC', root: 'Solberg' },
    { value: 'Lucas Ferreira', theme: 'ECO', root: 'Ferreira' },
    { value: 'Éléonore de Valmont', theme: 'CIVIC', root: 'Valmont' },
    { value: 'Raphaël Saint-Clair', theme: 'FRENCH', root: 'Saint-Clair' },
    { value: 'Kofi Mensah', theme: 'SOLAR', root: 'Mensah' },
  ],
  FLEET: [
    { value: 'Armada Aurore', theme: 'SOLAR', root: 'Aurore' },
    { value: 'Flotte Horizon-2050', theme: 'ORBIT', root: 'Horizon' },
    { value: 'Escadre Égide', theme: 'SHIELD', root: 'Égide' },
    { value: 'Corps Expéditionnaire Méridien', theme: 'ORBIT', root: 'Méridien' },
    { value: 'Flottille Thalassa', theme: 'OCEAN', root: 'Thalassa' },
    { value: 'Garde Solaire', theme: 'SOLAR', root: 'Solaire' },
    { value: 'Vent d’Émeraude', theme: 'FLORA', root: 'Émeraude' },
    { value: 'Avant-Garde Boréale', theme: 'CRYO', root: 'Boréal' },
    { value: 'Ligne Atlantique', theme: 'OCEAN', root: 'Atlantique' },
    { value: 'Veille Stellaire', theme: 'ORBIT', root: 'Stellaire' },
    { value: 'Escadrille Alcyon', theme: 'OCEAN', root: 'Alcyon' },
    { value: 'Bouclier Fédéral', theme: 'SHIELD', root: 'Fédéral' },
  ],
});

export interface DifficultyPresetSpec {
  readonly id: 'EXPLORATEUR' | 'COMMANDANT' | 'STRATEGE';
  readonly label: string;
  readonly summary: string;
  readonly creditsMult: number;
  readonly rivalStrengthMult: number;
}

export const DIFFICULTY_PRESETS_CATALOG: readonly DifficultyPresetSpec[] = Object.freeze([
  {
    id: 'EXPLORATEUR',
    label: 'Explorateur',
    summary: 'Réserves confortables (+25 % crédits), rivaux modérés.',
    creditsMult: 1.25,
    rivalStrengthMult: 0.85,
  },
  {
    id: 'COMMANDANT',
    label: 'Commandant (Standard)',
    summary: 'Équilibre officiel EXO WORLD : 2050.',
    creditsMult: 1.0,
    rivalStrengthMult: 1.0,
  },
  {
    id: 'STRATEGE',
    label: 'Stratège Exigeant',
    summary: 'Budget serré (-15 % crédits) et rivaux compétitifs (+15 %).',
    creditsMult: 0.85,
    rivalStrengthMult: 1.15,
  },
]);

export interface ResourceAbundanceSpec {
  readonly id: 'SOBRE' | 'EQUILIBRE' | 'ABONDANT';
  readonly label: string;
  readonly summary: string;
  readonly multiplier: number;
}

export const RESOURCE_ABUNDANCE_CATALOG: readonly ResourceAbundanceSpec[] = Object.freeze([
  {
    id: 'SOBRE',
    label: 'Monde Sobre (80 %)',
    summary: 'Gisements rares exigeant commerce maritime et recyclage.',
    multiplier: 0.8,
  },
  {
    id: 'EQUILIBRE',
    label: 'Équilibré (100 %)',
    summary: 'Dotation géologique standard de zone habitable.',
    multiplier: 1.0,
  },
  {
    id: 'ABONDANT',
    label: 'Richesses Abondantes (125 %)',
    summary: 'Veines minérales et nappes phréatiques généreuses.',
    multiplier: 1.25,
  },
]);
