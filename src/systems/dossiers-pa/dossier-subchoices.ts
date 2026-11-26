import type {
  DossierClass,
  DossierOption,
  DossierSubChoice,
  ExecutiveDossier,
} from '../../contracts/pa-dossiers.schema.ts';

/**
 * [L3] Pure Deterministic Dossier Choices & Sub-Choices Expander.
 * Ensures every event dossier provides at least 4 clear primary choices and
 * 3 concrete execution sub-choices per choice (zero I/O, zero Math.random).
 */
const ZERO_SUB_BONUS = {
  credits: 0, energy: 0, materials: 0, water: 0, food: 0, electronics: 0,
  compute: 0, breathingKits: 0, atmosphereDelta: 0, maintenanceDelta: 0, allianceTrustDelta: 0,
} as const;

const ZERO_OPTION_EFFECTS = {
  credits: 0, energy: 0, materials: 0, water: 0, food: 0, electronics: 0,
  compute: 0, breathingKits: 0, approvalDelta: 0, atmosphereDelta: 0,
  maintenanceDelta: 0, allianceTrustDelta: 0, eraStarsDelta: 0,
  xpCiv: 0, xpCabinet: 0, xpAlliance: 0, oracleImpactFactor: 0,
} as const;

export function getEffectiveOptionsForDossier(dossier: ExecutiveDossier): readonly DossierOption[] {
  const options: DossierOption[] = [...dossier.options];
  const isP0 = dossier.dossierClass === 'P0';

  if (options.length < 3) {
    options.push({
      id: `${dossier.id}-opt-eco`,
      label: isP0 ? 'Mesure de sauvegarde écologique' : 'Plan équilibré & durable',
      doctrineTag: 'SOLARPUNK',
      description: isP0
        ? 'Protège en priorité les quartiers et l’air respirable, avec un budget modéré.'
        : 'Répartit l’effort entre écologie, entretien des bâtiments et économie locale.',
      paGeneralCost: isP0 ? 1 : 0,
      subPaDomain: isP0 ? null : 'PA_BIO',
      subPaCost: isP0 ? 0 : 1,
      effects: {
        ...ZERO_OPTION_EFFECTS,
        credits: isP0 ? -60 : -40,
        water: 15,
        food: 10,
        breathingKits: 8,
        atmosphereDelta: 4,
        maintenanceDelta: 6,
        xpCiv: 12,
        xpCabinet: 10,
      },
    });
  }

  if (options.length < 4) {
    options.push({
      id: `${dossier.id}-opt-prud`,
      label: isP0 ? 'Gestion minimale de crise' : 'Approche économe (faible coût)',
      doctrineTag: 'FEDERAL',
      description: isP0
        ? 'Limite les pertes financières immédiates avec une intervention ciblée des équipes techniques.'
        : 'Préserve la trésorerie et les stocks tout en maintenant un suivi administratif.',
      paGeneralCost: 0,
      subPaDomain: isP0 ? null : 'PA_GES',
      subPaCost: isP0 ? 0 : 1,
      effects: {
        ...ZERO_OPTION_EFFECTS,
        credits: isP0 ? 20 : 55,
        energy: 8,
        materials: 8,
        maintenanceDelta: isP0 ? 4 : 2,
        allianceTrustDelta: 2,
        xpCiv: 8,
      },
    });
  }

  const hasSpecialistOption = options.some(
    (o) => Boolean(o.unlockConditions?.requiredColonistSpecialty || o.unlockConditions?.minSkillThreshold),
  );
  if (options.length < 5 && !hasSpecialistOption) {
    const specByClass: Record<
      DossierClass,
      {
        readonly specialty: 'ENGINEERING' | 'EXOBIOLOGY' | 'CYBERNETICS' | 'SECURITY' | 'AGRONOMY';
        readonly attr: 'engineering' | 'ecology' | 'cyber' | 'strategy' | 'diplomacy';
        readonly subPa: 'PA_MNT' | 'PA_BIO' | 'PA_POL' | 'PA_GES';
        readonly label: string;
        readonly desc: string;
      }
    > = {
      P0: {
        specialty: 'ENGINEERING',
        attr: 'engineering',
        subPa: 'PA_MNT',
        label: 'Intervention experte de crise (Coéquipier + Compétence)',
        desc: 'Mobilise un ingénieur terrain pour neutraliser l’incident avec un gain net de stabilité.',
      },
      C1: {
        specialty: 'AGRONOMY',
        attr: 'diplomacy',
        subPa: 'PA_POL',
        label: 'Médiation civique experte (Coéquipier + Compétence)',
        desc: 'Un coéquipier qualifié fédère les quartiers et double le rayonnement de l’accord.',
      },
      C2: {
        specialty: 'ENGINEERING',
        attr: 'engineering',
        subPa: 'PA_GES',
        label: 'Architecture industrielle avancée (Coéquipier + Compétence)',
        desc: 'Débloque une optimisation de chaîne à haut rendement grâce au binôme Conseiller/Ingénieur.',
      },
      C3: {
        specialty: 'ENGINEERING',
        attr: 'engineering',
        subPa: 'PA_MNT',
        label: 'Refonte technique haute précision (Coéquipier Niv.2+)',
        desc: 'Restaure fortement l’intégrité et produit du Calcul sans usure collatérale.',
      },
      C4: {
        specialty: 'EXOBIOLOGY',
        attr: 'ecology',
        subPa: 'PA_BIO',
        label: 'Protocole exobiologique avancé (Coéquipier + Écologie)',
        desc: 'Accélère la terraformation grâce à un exobiologiste affecté sur site.',
      },
      C5: {
        specialty: 'CYBERNETICS',
        attr: 'cyber',
        subPa: 'PA_POL',
        label: 'Contre-mesure cyber-diplomatique (Coéquipier + Cyber)',
        desc: 'Sécurise les liaisons stratégiques et accroît Calcul et Confiance Alliance.',
      },
    };
    const cfg = specByClass[dossier.dossierClass];
    options.push({
      id: `${dossier.id}-opt-expert`,
      label: cfg.label,
      doctrineTag: 'SCIENTIFIC',
      description: cfg.desc,
      paGeneralCost: 0,
      subPaDomain: cfg.subPa,
      subPaCost: 1,
      unlockConditions: {
        requiredColonistSpecialty: cfg.specialty,
        minColonistLevel: dossier.dossierClass === 'C3' ? 2 : 1,
        minSkillThreshold: { attribute: cfg.attr, level: 11 },
      },
      effects: {
        ...ZERO_OPTION_EFFECTS,
        credits: dossier.dossierClass === 'C2' ? 95 : -45,
        energy: 14,
        materials: 16,
        compute: 18,
        atmosphereDelta: dossier.dossierClass === 'C4' ? 7 : 2,
        maintenanceDelta: 12,
        approvalDelta: 4,
        allianceTrustDelta: 5,
        eraStarsDelta: 1,
        xpCiv: 32,
        xpCabinet: 28,
        xpAlliance: 18,
      },
    });
  }

  return options;
}

export function getSubChoicesForOption(
  option: DossierOption,
  dossierClass: DossierClass,
): readonly DossierSubChoice[] {
  if (option.subChoices && option.subChoices.length > 0) {
    return option.subChoices;
  }

  // Defer/Cancel actions get 3 lightweight follow-up modes
  if (option.actionPayload?.kind === 'DEFER_ACTION') {
    return [
      {
        id: `${option.id}-sub-std`,
        label: 'Classer sans suite',
        description: 'Ferme simplement le dossier sans dépense.',
        extraPaGeneralCost: 0,
        extraSubPaCost: 0,
        bonusEffects: { ...ZERO_SUB_BONUS },
        badgeMeta: {
          modeTag: 'CLASSEMENT',
          focusTag: 'NEUTRE',
          costTag: '0 SURCOÛT',
          tone: 'SLATE',
        },
      },
      {
        id: `${option.id}-sub-audit`,
        label: 'Garder en veille technique',
        description: 'Les équipes surveillent la situation (+4% entretien des quartiers).',
        extraPaGeneralCost: 0,
        extraSubPaCost: 0,
        bonusEffects: { ...ZERO_SUB_BONUS, maintenanceDelta: 4 },
        badgeMeta: {
          modeTag: 'VEILLE TECH',
          focusTag: 'ENTRETIEN +4%',
          costTag: '0 SURCOÛT',
          tone: 'INDIGO',
        },
      },
      {
        id: `${option.id}-sub-reserve`,
        label: 'Réaffecter le budget prévu',
        description: 'Récupère une petite réserve logistique (+25 Cr).',
        extraPaGeneralCost: 0,
        extraSubPaCost: 0,
        bonusEffects: { ...ZERO_SUB_BONUS, credits: 25 },
        badgeMeta: {
          modeTag: 'RÉALLOCATION',
          focusTag: 'TRÉSORERIE +25',
          costTag: 'GAIN NET',
          tone: 'AMBER',
        },
      },
    ];
  }

  const isTechOrSecurity =
    dossierClass === 'C3' || dossierClass === 'C5' || option.doctrineTag === 'SECURITY';
  const isEco = dossierClass === 'C4' || option.doctrineTag === 'SOLARPUNK';

  return [
    {
      id: `${option.id}-sub-balanced`,
      label: 'Exécution standard',
      description: 'Applique le plan prévu sans frais ni risque supplémentaire.',
      extraPaGeneralCost: 0,
      extraSubPaCost: 0,
      bonusEffects: { ...ZERO_SUB_BONUS },
      badgeMeta: {
        modeTag: 'STANDARD',
        focusTag: 'ÉQUILIBRE',
        costTag: '0 SURCOÛT',
        tone: 'GOLD',
      },
    },
    {
      id: `${option.id}-sub-budget`,
      label: isEco ? 'Priorité eau & air (+Eau, +Atmo)' : 'Optimisation budget (+45 Cr)',
      description: isEco
        ? 'Ajoute des filtres locaux : +12 Eau, +5 Kits O₂ et +3% Atmosphère (coût : -25 Cr).'
        : 'Négocie les contrats locaux pour économiser +45 Cr et +8 Énergie.',
      extraPaGeneralCost: 0,
      extraSubPaCost: 0,
      bonusEffects: isEco
        ? { ...ZERO_SUB_BONUS, credits: -25, water: 12, breathingKits: 5, atmosphereDelta: 3 }
        : { ...ZERO_SUB_BONUS, credits: 45, energy: 8 },
      badgeMeta: isEco
        ? {
            modeTag: 'BIOSPHÈRE',
            focusTag: 'AIR & EAU',
            costTag: '-25 CR',
            tone: 'EMERALD',
          }
        : {
            modeTag: 'OPTIMISATION',
            focusTag: 'TRÉSORERIE',
            costTag: '+45 CR',
            tone: 'AMBER',
          },
    },
    {
      id: `${option.id}-sub-boost`,
      label: isTechOrSecurity
        ? 'Renfort matériel (+15 Mat., +8% Entretien)'
        : 'Déploiement renforcé (+15 Mat., +10 Calcul)',
      description: isTechOrSecurity
        ? 'Mobilise des pièces de rechange pour consolider les installations (-40 Cr, +15 Mat., +8% entretien).'
        : 'Investit dans la qualité d’exécution (-45 Cr, +15 Matériaux, +10 Calcul, +3% Alliance).',
      extraPaGeneralCost: 0,
      extraSubPaCost: 0,
      bonusEffects: isTechOrSecurity
        ? { ...ZERO_SUB_BONUS, credits: -40, materials: 15, maintenanceDelta: 8 }
        : { ...ZERO_SUB_BONUS, credits: -45, materials: 15, compute: 10, allianceTrustDelta: 3 },
      badgeMeta: isTechOrSecurity
        ? {
            modeTag: 'RENFORT TECH',
            focusTag: 'MAINTENANCE',
            costTag: '-40 CR',
            tone: 'CORAL',
          }
        : {
            modeTag: 'DÉPLOIEMENT',
            focusTag: 'CALCUL & ALLIANCE',
            costTag: '-45 CR',
            tone: 'VIOLET',
          },
    },
  ];
}
