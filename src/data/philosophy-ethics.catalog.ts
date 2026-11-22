import type { BadgeColorTone } from '../contracts/nested-badges.schema.ts';

/**
 * [L1] EXW.L1.PHILOSOPHY_ETHICS | v5.0.0 | SADT A2.1
 * 3-Level Philosophical & Ethical Classification:
 * Master (Macro Pole I..V) -> Level 1 (School, e.g. Thomisme St Thomas d'Aquin) -> Level 2 (Operational Sub-Badge)
 */
export interface PhilosophySchoolSpec {
  readonly id: string;
  readonly poleId: 'POLE_I' | 'POLE_II' | 'POLE_III' | 'POLE_IV' | 'POLE_V';
  readonly poleLabel: string;
  readonly poleShort: string;
  readonly schoolLabel: string;
  readonly schoolShort: string;
  readonly subBadgeLabel: string;
  readonly subBadgeShort: string;
  readonly tone: BadgeColorTone;
  readonly doctrineTags: readonly string[];
  readonly description: string;
}

export const PHILOSOPHY_ETHICS_CATALOG: readonly PhilosophySchoolSpec[] = Object.freeze([
  {
    id: 'THOMISM',
    poleId: 'POLE_I',
    poleLabel: 'Pôle I · Éthique & Bien Commun',
    poleShort: 'Pôle I · Bien Commun',
    schoolLabel: "Thomisme (St Thomas d'Aquin)",
    schoolShort: 'Thomisme',
    subBadgeLabel: 'Subsidiarité · Justice Distributive',
    subBadgeShort: 'Subsidiarité',
    tone: 'GOLD',
    doctrineTags: ['FEDERAL', 'SOLARPUNK'],
    description: 'Équilibre entre loi naturelle, dignité des personnes, prudence gouvernante et bien commun.',
  },
  {
    id: 'CIVIC_HUMANISM',
    poleId: 'POLE_I',
    poleLabel: 'Pôle I · Éthique & Bien Commun',
    poleShort: 'Pôle I · Bien Commun',
    schoolLabel: 'Humanisme Civique',
    schoolShort: 'Humanisme',
    subBadgeLabel: 'Dignité Citoyenne · Éducation',
    subBadgeShort: 'Dignité Civique',
    tone: 'ROSE',
    doctrineTags: ['FEDERAL'],
    description: 'Priorité à la santé publique, aux libertés civiques, à la culture et au consentement.',
  },
  {
    id: 'STOICISM',
    poleId: 'POLE_II',
    poleLabel: 'Pôle II · Raison & Devoir',
    poleShort: 'Pôle II · Devoir',
    schoolLabel: 'Stoïcisme',
    schoolShort: 'Stoïcisme',
    subBadgeLabel: 'Résilience · Sobriété Stratégique',
    subBadgeShort: 'Résilience',
    tone: 'SLATE',
    doctrineTags: ['SECURITY'],
    description: 'Maîtrise de soi face aux crises atmosphériques, discipline sobre et constance morale.',
  },
  {
    id: 'KANTIAN',
    poleId: 'POLE_II',
    poleLabel: 'Pôle II · Raison & Devoir',
    poleShort: 'Pôle II · Devoir',
    schoolLabel: 'Déontologie Kantienne',
    schoolShort: 'Kantien',
    subBadgeLabel: 'Impératif Universel · Droit',
    subBadgeShort: 'Droit Universel',
    tone: 'INDIGO',
    doctrineTags: ['SCIENTIFIC', 'FEDERAL'],
    description: 'Respect strict des promesses, traités et règles universalisables sans instrumentaliser les colons.',
  },
  {
    id: 'SPATIAL_CONTRACT',
    poleId: 'POLE_II',
    poleLabel: 'Pôle II · Raison & Devoir',
    poleShort: 'Pôle II · Devoir',
    schoolLabel: 'Contractualisme Spatial',
    schoolShort: 'Contractualisme',
    subBadgeLabel: 'Pacte Colonial · Équité',
    subBadgeShort: 'Pacte Colonial',
    tone: 'VIOLET',
    doctrineTags: ['FEDERAL'],
    description: 'Légitimité fondée sur le contrat social inter-quartiers et le référendum citoyen.',
  },
  {
    id: 'COLLECTIVE_UTILITARIAN',
    poleId: 'POLE_III',
    poleLabel: 'Pôle III · Conséquentialisme',
    poleShort: 'Pôle III · Résultat',
    schoolLabel: 'Utilitarisme Collectif',
    schoolShort: 'Utilitarisme',
    subBadgeLabel: 'Rendement Net · Bien-Être Global',
    subBadgeShort: 'Rendement Net',
    tone: 'AMBER',
    doctrineTags: ['CORPORATE'],
    description: 'Maximisation mesurable des ressources, de la survie globale et de l’efficacité logistique.',
  },
  {
    id: 'REALPOLITIK',
    poleId: 'POLE_IV',
    poleLabel: 'Pôle IV · Souveraineté',
    poleShort: 'Pôle IV · Puissance',
    schoolLabel: 'Réalpolitique',
    schoolShort: 'Réalpolitique',
    subBadgeLabel: 'Dissuasion · Rapport de Force',
    subBadgeShort: 'Dissuasion',
    tone: 'CORAL',
    doctrineTags: ['SECURITY', 'CORPORATE'],
    description: 'Primat de la sécurité de l’État, de l’équilibre des puissances et de l’avantage tactique.',
  },
  {
    id: 'ECO_SYMBIOSIS',
    poleId: 'POLE_V',
    poleLabel: 'Pôle V · Symbiose & Futur',
    poleShort: 'Pôle V · Symbiose',
    schoolLabel: 'Éco-Symbiose',
    schoolShort: 'Éco-Symbiose',
    subBadgeLabel: 'Régénération · Biosphère Éden',
    subBadgeShort: 'Régénération',
    tone: 'EMERALD',
    doctrineTags: ['SOLARPUNK', 'SCIENTIFIC'],
    description: 'Co-évolution durable entre cité humaine ouverte, atmosphère vivante et cycles naturels.',
  },
  {
    id: 'NEUTRAL_TECH',
    poleId: 'POLE_III',
    poleLabel: 'Pôle III · Conséquentialisme',
    poleShort: 'Pôle III · Résultat',
    schoolLabel: 'Pragmatisme Technique',
    schoolShort: 'Pragmatisme',
    subBadgeLabel: 'Maintenance · Continuité 0-PA',
    subBadgeShort: 'Continuité',
    tone: 'SLATE',
    doctrineTags: ['SCIENTIFIC'],
    description: 'Arbitrage technique neutre garantissant la continuité opérationnelle sans biais idéologique.',
  },
]);

export const BADGE_COLOR_LEGEND = Object.freeze([
  { tone: 'GOLD' as const, label: 'Or — Thomisme & Bien Commun', meaning: "Équilibre prudence, subsidiarité et justice distributive (St Thomas d'Aquin)." },
  { tone: 'ROSE' as const, label: 'Rose — Humanisme & Gemini Live', meaning: 'Choix centré sur la dignité civique ou contenu généré en direct par Gemini.' },
  { tone: 'EMERALD' as const, label: 'Émeraude — Éco-Symbiose & 0-PA', meaning: 'Régénération atmosphérique, biosphère ou option gratuite 0-PA garantie.' },
  { tone: 'INDIGO' as const, label: 'Indigo — Déontologie & Droit', meaning: 'Principes kantiens, promesses tenues et règles universelles.' },
  { tone: 'VIOLET' as const, label: 'Violet — Contractualisme & IA Décision', meaning: 'Pacte colonial, référendum ou scoring Gemini Decisions API.' },
  { tone: 'AMBER' as const, label: 'Ambre — Utilitarisme & Économie', meaning: 'Arbitrage rendement, logistique et trésorerie.' },
  { tone: 'CORAL' as const, label: 'Corail — Réalpolitique & Urgence P0', meaning: 'Dissuasion, pression civile ou crise prioritaire P0.' },
  { tone: 'SLATE' as const, label: 'Ardoise — Stoïcisme & Catalogue Local', meaning: 'Sobriété stoïcienne, continuité technique ou moteur déterministe local.' },
]);
