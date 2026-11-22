import type {
  MetaBadgeRecord,
  MetaMedalRecord,
  MetaTitleRecord,
} from '../contracts/honors.schema.ts';

/**
 * [L1] EXW.L1.HONORS_CATALOG | v5.0.0 | SADT A5.1
 * Static frozen catalog for Multi-Campaign Showcase (Avatar presets, Medals, Badges, Titles)
 * including the symbolic Project Conception Global Platinum Trophy.
 */
export interface AvatarPresetSpec {
  readonly id: string;
  readonly label: string;
  readonly role: string;
  readonly gradientFrom: string;
  readonly gradientTo: string;
  readonly monogram: string;
}

export const AVATAR_PRESETS: readonly AvatarPresetSpec[] = Object.freeze([
  { id: 'cmd-solaris', label: 'Commandant Solaris', role: 'Architecte Orbital', gradientFrom: '#f43f5e', gradientTo: '#f59e0b', monogram: 'CS' },
  { id: 'archon-lyra', label: 'Archonte Lyra', role: 'Stratège Biosphère', gradientFrom: '#10b981', gradientTo: '#14b8a6', monogram: 'AL' },
  { id: 'consul-kane', label: 'Consul Kane', role: 'Amiral de Flotte', gradientFrom: '#8b5cf6', gradientTo: '#ec4899', monogram: 'CK' },
  { id: 'director-nova', label: 'Directrice Nova', role: 'Diplomate Fédérale', gradientFrom: '#f97316', gradientTo: '#e11d48', monogram: 'DN' },
  { id: 'savant-aquin', label: 'Savant Aquin', role: 'Éthicien & Penseur', gradientFrom: '#eab308', gradientTo: '#f43f5e', monogram: 'SA' },
  { id: 'pioneer-kepler', label: 'Pionnier Kepler', role: 'Bâtisseur 2050', gradientFrom: '#ec4899', gradientTo: '#6366f1', monogram: 'PK' },
]);

export const INITIAL_META_MEDALS: readonly MetaMedalRecord[] = Object.freeze([
  {
    id: 'medal-founder-global-conception',
    title: "Architecte Fondateur d'EXO WORLD : 2050 (Conception Globale)",
    category: 'CONCEPTION',
    tier: 'PLATINUM',
    description:
      'Distinction honorifique symbolique intégrée au jeu saluant la vision système, l’architecture multi-échelle, le design éthique et l’orchestration complète du projet.',
    unlocked: true,
    progressCurrent: 13,
    progressTarget: 13,
    isSymbolicDistinction: true,
    unlockedAtIso: '2050-01-01T00:00:00.000Z',
  },
  {
    id: 'medal-first-colony',
    title: 'Première Empreinte Orbitale',
    category: 'EXPLORATION',
    tier: 'BRONZE',
    description: 'Fonder et stabiliser votre première cité ouverte sur Kepler-442b.',
    unlocked: true,
    progressCurrent: 1,
    progressTarget: 1,
    isSymbolicDistinction: false,
    unlockedAtIso: '2050-01-01T00:00:00.000Z',
  },
  {
    id: 'medal-eden-architect',
    title: "Gardien de l'Atmosphère Éden",
    category: 'BIOSPHERE',
    tier: 'GOLD',
    description: 'Atteindre le stade Atmosphère Éden (Air Pur) sur un monde colonisé.',
    unlocked: false,
    progressCurrent: 18,
    progressTarget: 90,
    isSymbolicDistinction: false,
    unlockedAtIso: null,
  },
  {
    id: 'medal-civic-philosopher',
    title: 'Synthèse Éthique & Bien Commun',
    category: 'PHILOSOPHY',
    tier: 'SILVER',
    description: 'Cumuler 10 décisions souveraines alignées sur les écoles éthiques (Thomisme, Humanisme, Éco-Symbiose).',
    unlocked: false,
    progressCurrent: 2,
    progressTarget: 10,
    isSymbolicDistinction: false,
    unlockedAtIso: null,
  },
  {
    id: 'medal-stellar-diplomat',
    title: 'Concorde Interstellaire',
    category: 'DIPLOMACY',
    tier: 'GOLD',
    description: 'Maintenir une confiance Super-Alliance supérieure à 85% et 2 traités actifs.',
    unlocked: false,
    progressCurrent: 60,
    progressTarget: 85,
    isSymbolicDistinction: false,
    unlockedAtIso: null,
  },
  {
    id: 'medal-four-theaters',
    title: 'Maître des 4 Théâtres',
    category: 'MILITARY',
    tier: 'PLATINUM',
    description: 'Déployer une force opérationnelle combinée Spatial, Ciel, Terrestre et Maritime.',
    unlocked: false,
    progressCurrent: 1,
    progressTarget: 4,
    isSymbolicDistinction: false,
    unlockedAtIso: null,
  },
]);

export const INITIAL_META_BADGES: readonly MetaBadgeRecord[] = Object.freeze([
  {
    id: 'badge-integral-vision',
    label: 'Vision Architecturale Intégrale',
    tier: 'PLATINUM',
    colorHex: '#f43f5e',
    description: 'Badge symbolique de conception globale multi-vagues P1→P13.',
    unlocked: true,
    isSymbolicDistinction: true,
  },
  {
    id: 'badge-pioneer-2050',
    label: 'Pionnier 2050',
    tier: 'BRONZE',
    colorHex: '#f59e0b',
    description: 'A pris le commandement de la première expédition.',
    unlocked: true,
    isSymbolicDistinction: false,
  },
  {
    id: 'badge-thomist-common-good',
    label: 'Bien Commun (St Thomas)',
    tier: 'SILVER',
    colorHex: '#10b981',
    description: 'Alignement éthique sur la justice distributive et la subsidiarité.',
    unlocked: true,
    isSymbolicDistinction: false,
  },
  {
    id: 'badge-urban-maglev',
    label: 'Urbaniste 24-Hex',
    tier: 'GOLD',
    colorHex: '#8b5cf6',
    description: 'Maîtrise de la planification urbaine modulaire et du réseau Maglev.',
    unlocked: true,
    isSymbolicDistinction: false,
  },
  {
    id: 'badge-pax-director',
    label: 'Architecte Scénariste',
    tier: 'GOLD',
    colorHex: '#ec4899',
    description: 'A conçu et lancé un scénario matriciel personnalisé.',
    unlocked: false,
    isSymbolicDistinction: false,
  },
]);

export const INITIAL_META_TITLES: readonly MetaTitleRecord[] = Object.freeze([
  {
    id: 'title-founder-2050',
    label: 'Fondateur de la Synthèse 2050',
    requirement: 'Distinction symbolique — Conception Globale du Projet',
    unlocked: true,
    isSymbolicDistinction: true,
  },
  {
    id: 'title-first-commander',
    label: 'Commandant Pionnier',
    requirement: 'Démarrer votre première simulation',
    unlocked: true,
    isSymbolicDistinction: false,
  },
  {
    id: 'title-eden-shepherd',
    label: "Architecte d'Éden",
    requirement: "Débloquer le stade Atmosphère Éden",
    unlocked: false,
    isSymbolicDistinction: false,
  },
  {
    id: 'title-grand-strategist',
    label: 'Grand Stratège des 4 Théâtres',
    requirement: 'Remporter 3 campagnes ou 4 théâtres actifs',
    unlocked: false,
    isSymbolicDistinction: false,
  },
]);
