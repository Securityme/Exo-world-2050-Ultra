import type { StackedBadgeTriplet } from '../../contracts/nested-badges.schema.ts';
import type {
  DossierClass,
  DossierOption,
  DossierSubChoice,
  ExecutiveDossier,
  SubChoiceBadgeMeta,
} from '../../contracts/pa-dossiers.schema.ts';
import {
  PHILOSOPHY_ETHICS_CATALOG,
  type PhilosophySchoolSpec,
} from '../../data/philosophy-ethics.catalog.ts';

/**
 * [L3] EXW.L3.BADGE_TAXONOMY | v5.1.0 | SADT A2.1
 * Builds 3-Tier Stacked Badges (Master -> Level 1 -> Level 2) for:
 * 1) Provenance (Gemini Live / Catalogue Vivant / Action Monde)
 * 2) 3-Level Philosophy & Ethics (Pole I..V -> School -> Sub-Badge)
 * 3) Sub-Choice Execution Modes (Modalité -> Axe d'impact -> Coût/Profil)
 */
export function resolvePhilosophySchoolForOption(option: DossierOption): PhilosophySchoolSpec {
  const txt = `${option.label} ${option.description}`.toLowerCase();
  if (txt.includes('commun') || txt.includes('équit') || txt.includes('just') || txt.includes('partag')) {
    return PHILOSOPHY_ETHICS_CATALOG.find((p) => p.id === 'THOMISM')!;
  }
  if (txt.includes('éco') || txt.includes('atmo') || txt.includes('bio') || option.effects.atmosphereDelta >= 2) {
    return PHILOSOPHY_ETHICS_CATALOG.find((p) => p.id === 'ECO_SYMBIOSIS')!;
  }
  if (txt.includes('santé') || txt.includes('citoy') || txt.includes('éduc') || option.effects.approvalDelta >= 4) {
    return PHILOSOPHY_ETHICS_CATALOG.find((p) => p.id === 'CIVIC_HUMANISM')!;
  }
  if (txt.includes('promesse') || txt.includes('charte') || txt.includes('droit') || option.effects.allianceTrustDelta >= 3) {
    return PHILOSOPHY_ETHICS_CATALOG.find((p) => p.id === 'KANTIAN')!;
  }
  if (option.paGeneralCost === 0 && option.subPaCost === 0) {
    return PHILOSOPHY_ETHICS_CATALOG.find((p) => p.id === 'NEUTRAL_TECH')!;
  }
  if (option.doctrineTag === 'SECURITY') {
    return PHILOSOPHY_ETHICS_CATALOG.find((p) => p.id === 'REALPOLITIK')!;
  }
  if (option.doctrineTag === 'CORPORATE') {
    return PHILOSOPHY_ETHICS_CATALOG.find((p) => p.id === 'COLLECTIVE_UTILITARIAN')!;
  }
  if (option.doctrineTag === 'FEDERAL') {
    return PHILOSOPHY_ETHICS_CATALOG.find((p) => p.id === 'SPATIAL_CONTRACT')!;
  }
  return PHILOSOPHY_ETHICS_CATALOG.find((p) => p.id === 'STOICISM')!;
}

export function buildProvenanceBadgeTriplet(dossier: ExecutiveDossier): StackedBadgeTriplet {
  if (dossier.source === 'ORACLE_GEMINI') {
    return {
      id: `prov-${dossier.id}`,
      kind: 'PROVENANCE',
      master: {
        id: 'gemini-live',
        label: 'Gemini Live',
        shortLabel: 'Gemini Live',
        tone: 'ROSE',
        description: 'Contenu généré dynamiquement via le routeur serveur Free Tier.',
      },
      level1: {
        id: 'channel-text',
        label: 'Canal Texte · gemini-4-hydrogen',
        shortLabel: 'gemini-4-hydrogen',
        tone: 'VIOLET',
        description: 'Modèle principal de narration structurée Zod.',
      },
      level2: {
        id: 'handler-turn',
        label: 'Handler Tour · Cascade M7',
        shortLabel: 'Tour / Cascade',
        tone: 'INDIGO',
        description: 'Généré en tâche de fond avec garde-fou Z0 & R-50.',
      },
    };
  }
  if (dossier.source === 'ACTION_GATEWAY') {
    return {
      id: `prov-${dossier.id}`,
      kind: 'PROVENANCE',
      master: {
        id: 'world-initiative',
        label: 'Initiative Monde',
        shortLabel: 'Action Monde',
        tone: 'EMERALD',
        description: 'Choix déclenché directement depuis les gestionnaires Monde avec vos PA restants.',
      },
      level1: {
        id: 'gateway-l3',
        label: 'Passerelle R-24',
        shortLabel: 'Passerelle R-24',
        tone: 'AMBER',
        description: 'Validation déterministe 4 choix dont 0-PA garanti.',
      },
      level2: {
        id: 'handler-entity',
        label: 'Entité & Quartier',
        shortLabel: 'Entité Monde',
        tone: 'SLATE',
        description: 'Lié directement au bâtiment, à la flotte ou à la banque.',
      },
    };
  }
  if (dossier.source === 'WATCHDOG') {
    return {
      id: `prov-${dossier.id}`,
      kind: 'PROVENANCE',
      master: {
        id: 'watchdog-p0',
        label: 'Alerte Watchdog',
        shortLabel: 'Alerte P0',
        tone: 'CORAL',
        description: 'Déclencheur automatique sur seuil critique (atmosphère, pénurie, pression civile).',
      },
      level1: {
        id: 'guard-osc',
        label: 'Anti-Oscillation',
        shortLabel: 'Max 2 P0',
        tone: 'AMBER',
        description: 'Régulé à 2 crises majeures par tour maximum.',
      },
      level2: {
        id: 'handler-crisis',
        label: 'Urgence Tour',
        shortLabel: 'Prioritaire',
        tone: 'ROSE',
        description: 'À résoudre avant la porte Fin de tour M7.',
      },
    };
  }
  return {
    id: `prov-${dossier.id}`,
    kind: 'PROVENANCE',
    master: {
      id: 'catalog-cv',
      label: 'Catalogue Vivant',
      shortLabel: 'Catalogue',
      tone: 'SLATE',
      description: 'Moteur narratif déterministe local avec mémoire anti-répétition.',
    },
    level1: {
      id: 'sim-pcg',
      label: 'PCG32 · Seed',
      shortLabel: 'Déterministe',
      tone: 'INDIGO',
      description: 'Reproductible avec empreinte SHA-256.',
    },
    level2: {
      id: 'handler-cv',
      label: `Classe ${dossier.dossierClass}`,
      shortLabel: dossier.dossierClass,
      tone: 'EMERALD',
      description: 'Option 0-PA toujours garantie.',
    },
  };
}

export function buildPhilosophyBadgeTriplet(
  option: DossierOption,
  cumulativeBySchool: Readonly<Record<string, number>> = {},
): StackedBadgeTriplet {
  const school = resolvePhilosophySchoolForOption(option);
  return {
    id: `eth-${option.id}-${school.id}`,
    kind: 'ETHICS',
    master: {
      id: school.poleId,
      label: school.poleLabel,
      shortLabel: school.poleShort,
      tone: school.tone,
      description: school.description,
    },
    level1: {
      id: school.id,
      label: school.schoolLabel,
      shortLabel: school.schoolShort,
      tone: school.tone,
      description: school.description,
    },
    level2: {
      id: `${school.id}-sub`,
      label: school.subBadgeLabel,
      shortLabel: school.subBadgeShort,
      tone: school.tone,
      description: `Nuance opérationnelle : ${school.subBadgeLabel}`,
    },
    cumulativeCount: cumulativeBySchool[school.id] ?? 0,
    punctualDelta: 1,
  };
}

export function getSubChoiceBadgeMeta(subChoice: DossierSubChoice): SubChoiceBadgeMeta {
  if (subChoice.badgeMeta) {
    return subChoice.badgeMeta;
  }
  const bx = subChoice.bonusEffects;
  const credits = bx?.credits ?? 0;
  const atmo = bx?.atmosphereDelta ?? 0;
  const maint = bx?.maintenanceDelta ?? 0;
  const alliance = bx?.allianceTrustDelta ?? 0;
  const hasCost = credits < 0 || subChoice.extraPaGeneralCost > 0 || subChoice.extraSubPaCost > 0;
  const costTag =
    credits < 0
      ? `${credits} CR`
      : credits > 0
        ? `+${credits} CR`
        : subChoice.extraPaGeneralCost > 0
          ? `+${subChoice.extraPaGeneralCost} PA`
          : '0 SURCOÛT';

  if (atmo > 0 || (bx?.water ?? 0) > 0 || (bx?.breathingKits ?? 0) > 0) {
    return { modeTag: 'BIOSPHÈRE', focusTag: 'AIR & EAU', costTag, tone: 'EMERALD' };
  }
  if (maint > 0 || (bx?.materials ?? 0) > 0) {
    return {
      modeTag: hasCost ? 'RENFORT TECH' : 'VEILLE TECH',
      focusTag: maint > 0 ? 'MAINTENANCE' : 'MATÉRIAUX',
      costTag,
      tone: hasCost ? 'CORAL' : 'INDIGO',
    };
  }
  if (alliance > 0 || (bx?.compute ?? 0) > 0) {
    return { modeTag: 'DÉPLOIEMENT', focusTag: 'CALCUL & ALLIANCE', costTag, tone: 'VIOLET' };
  }
  if (credits > 0 || (bx?.energy ?? 0) > 0) {
    return { modeTag: 'OPTIMISATION', focusTag: 'TRÉSORERIE', costTag, tone: 'AMBER' };
  }
  return { modeTag: 'STANDARD', focusTag: 'ÉQUILIBRE', costTag, tone: 'GOLD' };
}

export function buildSubChoiceBadgeTriplet(
  subChoice: DossierSubChoice,
  option: DossierOption,
  dossierClass: DossierClass,
): StackedBadgeTriplet {
  const meta = getSubChoiceBadgeMeta(subChoice);
  return {
    id: `sub-${subChoice.id}`,
    kind: 'SUBCHOICE',
    master: {
      id: `mode-${meta.modeTag}`,
      label: `Modalité : ${meta.modeTag}`,
      shortLabel: meta.modeTag,
      tone: meta.tone,
      description: `${subChoice.label} (${dossierClass} · ${option.label})`,
    },
    level1: {
      id: `focus-${meta.focusTag}`,
      label: `Axe : ${meta.focusTag}`,
      shortLabel: meta.focusTag,
      tone: meta.tone,
      description: subChoice.description,
    },
    level2: {
      id: `cost-${meta.costTag}`,
      label: `Profil coût : ${meta.costTag}`,
      shortLabel: meta.costTag,
      tone: meta.costTag.startsWith('-') ? 'ROSE' : meta.costTag.startsWith('+') ? 'EMERALD' : 'SLATE',
      description: 'Impact budgétaire net du sous-choix sélectionné.',
    },
  };
}
