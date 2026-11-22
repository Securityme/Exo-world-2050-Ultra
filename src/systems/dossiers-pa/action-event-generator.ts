import type { DossierActionPayload, ExecutiveDossier } from '../../contracts/pa-dossiers.schema.ts';
import { err, ok, type ExwResult } from '../../contracts/trigger-bus.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import { computeStateHash } from '../../core/hashing/state-hasher.ts';

/**
 * [L3] Event-Only Action Gateway Generator.
 * Every operational action passes through the Event Generator to create a clear,
 * grounded multi-choice dossier (4 primary choices + 3 sub-choices each).
 */
export type ActionEventRequest = Exclude<DossierActionPayload, { kind: 'DEFER_ACTION' }>;

const ZERO_EFFECTS = {
  credits: 0,
  energy: 0,
  materials: 0,
  water: 0,
  food: 0,
  electronics: 0,
  compute: 0,
  breathingKits: 0,
  approvalDelta: 0,
  atmosphereDelta: 0,
  maintenanceDelta: 0,
  allianceTrustDelta: 0,
  eraStarsDelta: 0,
  xpCiv: 0,
  xpCabinet: 0,
  xpAlliance: 0,
  oracleImpactFactor: 0,
} as const;

const RESOURCE_LABELS: Record<'materials' | 'water' | 'food' | 'electronics' | 'helium3', string> = {
  materials: 'Matériaux',
  water: 'Eau',
  food: 'Vivres',
  electronics: 'Électronique',
  helium3: 'Hélium-3',
};

const DRONE_LABELS: Record<'construction' | 'defense' | 'attack' | 'recon', string> = {
  construction: 'Construction',
  defense: 'Défense',
  attack: 'Attaque',
  recon: 'Reconnaissance',
};

const UNIT_LABELS: Record<string, string> = {
  INFANTRY_EXO: 'Infanterie',
  ARMOR_MECH: 'Blindés',
  DRONE_SWARM: 'Escadrille drones',
  ORBITAL_CORVETTE: 'Frégate orbitale',
  CYBER_EW: 'Unité informatique',
};

export interface GeneratedActionEventResult {
  readonly nextState: WorldState;
  readonly dossier: ExecutiveDossier;
}

export function generateActionEventDossier(
  state: WorldState,
  request: ActionEventRequest,
): ExwResult<GeneratedActionEventResult> {
  const idSuffix = `${state.cycle}-${state.tick}-${state.activeDossiers.length}`;
  let dossier: ExecutiveDossier | null = null;

  switch (request.kind) {
    case 'GRAFT_MODULE': {
      const dist = state.districts.find((d) => d.id === request.districtId);
      if (!dist) return err('EXW_ERR_SCHEMA', 'Quartier introuvable.');
      dossier = {
        id: `evt-graft-${dist.id}-${idSuffix}`,
        code: `URB-C${state.cycle}`,
        dossierClass: 'C2',
        title: `Extension de quartier : ${dist.name}`,
        briefing: `Construction de l’extension ${dist.modulesCount + 1}/3 sur ${dist.name} (Niv.${dist.level}, état ${dist.integrity}%). Coût de base : 140 Cr et 30 Matériaux. Choisissez votre approche et vos modalités d’exécution.`,
        source: 'ACTION_GATEWAY',
        slotIndex: state.activeSlotIndex,
        tileIndex: 12,
        expiresInCycles: 2,
        scientificTag: 'Urbanisme · Extension',
        options: [
          {
            id: `opt-graft-std-${idSuffix}`,
            label: 'Chantier standard (-140 Cr · -30 Mat.)',
            doctrineTag: 'FEDERAL',
            description: 'Construit immédiatement l’extension (+8% état, +14 Cr/cycle et hausse de production).',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS, xpCiv: 10 },
            actionPayload: request,
          },
          {
            id: `opt-graft-opt-${idSuffix}`,
            label: 'Chantier optimisé (1 PA Gestion)',
            doctrineTag: 'SCIENTIFIC',
            description: 'Supervisé par votre conseiller : construit l’extension, répare +6% et ajoute +12 Énergie.',
            paGeneralCost: 0,
            subPaDomain: 'PA_GES',
            subPaCost: 1,
            skillCheck: {
              attribute: 'engineering',
              threshold: 9,
              successBonusLabel: '+25% rendement',
              failureRiskLabel: 'Exécution normale',
            },
            effects: { ...ZERO_EFFECTS, energy: 12, maintenanceDelta: 6, xpCiv: 20, xpCabinet: 15 },
            actionPayload: request,
          },
          {
            id: `opt-graft-eco-${idSuffix}`,
            label: 'Chantier écologique (1 PA Climat)',
            doctrineTag: 'SOLARPUNK',
            description: 'Ajoute des filtres à air et récupérateurs d’eau (+15 Eau, +6 Kits O₂, +3% Atmosphère).',
            paGeneralCost: 0,
            subPaDomain: 'PA_BIO',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, water: 15, breathingKits: 6, atmosphereDelta: 3, xpCiv: 18 },
            actionPayload: request,
          },
          {
            id: `opt-graft-cancel-${idSuffix}`,
            label: 'Reporter les travaux (0 coût)',
            doctrineTag: 'CORPORATE',
            description: 'Ferme ce dossier sans dépenser de crédits ni de matériaux.',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS },
            actionPayload: { kind: 'DEFER_ACTION' },
          },
        ],
      };
      break;
    }

    case 'BANK_LOAN': {
      const ratePct = Math.round(
        (state.finance.solvencyRating === 'AAA'
          ? 0.04
          : state.finance.solvencyRating === 'AA'
            ? 0.06
            : 0.1) * 100,
      );
      dossier = {
        id: `evt-loan-${request.principal}-${idSuffix}`,
        code: `FIN-C${state.cycle}`,
        dossierClass: 'C2',
        title: `Emprunt bancaire (+${request.principal} Cr)`,
        briefing: `La banque (note ${state.finance.solvencyRating}, taux ~${ratePct}%) propose un prêt de +${request.principal} Crédits sur 6 cycles (${state.finance.loans.length}/3 prêts actifs).`,
        source: 'ACTION_GATEWAY',
        slotIndex: state.activeSlotIndex,
        tileIndex: 11,
        expiresInCycles: 2,
        scientificTag: 'Finances · Trésorerie',
        options: [
          {
            id: `opt-loan-std-${idSuffix}`,
            label: `Accepter le prêt (+${request.principal} Cr)`,
            doctrineTag: 'CORPORATE',
            description: 'Verse immédiatement les fonds sur la trésorerie.',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS, xpCiv: 5 },
            actionPayload: request,
          },
          {
            id: `opt-loan-neg-${idSuffix}`,
            label: 'Négocier une prime publique (1 PA Politique)',
            doctrineTag: 'FEDERAL',
            description: 'Ajoute +40 Cr de subvention et +4% de confiance avec l’Alliance.',
            paGeneralCost: 0,
            subPaDomain: 'PA_POL',
            subPaCost: 1,
            skillCheck: {
              attribute: 'diplomacy',
              threshold: 9,
              successBonusLabel: 'Prime majorée',
              failureRiskLabel: 'Conditions standards',
            },
            effects: { ...ZERO_EFFECTS, credits: 40, allianceTrustDelta: 4, xpCabinet: 15, xpAlliance: 10 },
            actionPayload: request,
          },
          {
            id: `opt-loan-green-${idSuffix}`,
            label: 'Prêt fléché transition verte (1 PA Climat)',
            doctrineTag: 'SOLARPUNK',
            description: 'Débloque le prêt et finance +15 Énergie et +10 Eau sur les réseaux locaux.',
            paGeneralCost: 0,
            subPaDomain: 'PA_BIO',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, energy: 15, water: 10, atmosphereDelta: 2, xpCiv: 12 },
            actionPayload: request,
          },
          {
            id: `opt-loan-cancel-${idSuffix}`,
            label: 'Refuser le prêt (0 coût)',
            doctrineTag: 'SCIENTIFIC',
            description: 'Ferme l’offre bancaire sans nouvel emprunt.',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS },
            actionPayload: { kind: 'DEFER_ACTION' },
          },
        ],
      };
      break;
    }

    case 'MARKET_TRADE': {
      const label = RESOURCE_LABELS[request.resource];
      const unitPrice = state.marketPrices[request.resource];
      const total = unitPrice * request.quantity;
      const isBuy = request.action === 'BUY';
      dossier = {
        id: `evt-mkt-${request.resource}-${request.action}-${idSuffix}`,
        code: `MKT-C${state.cycle}`,
        dossierClass: 'C2',
        title: `Marché : ${isBuy ? 'Achat' : 'Vente'} de ${request.quantity} ${label}`,
        briefing: `Cours actuel de ${label} : ${unitPrice} Cr/u. Opération : ${isBuy ? `acheter ${request.quantity} ${label} pour ${total} Cr` : `vendre ${request.quantity} ${label} pour +${Math.round(total * 0.92)} Cr`}.`,
        source: 'ACTION_GATEWAY',
        slotIndex: state.activeSlotIndex,
        tileIndex: 13,
        expiresInCycles: 2,
        scientificTag: 'Marché · Logistique',
        options: [
          {
            id: `opt-mkt-std-${idSuffix}`,
            label: isBuy
              ? `Acheter au comptant (+${request.quantity} ${label} / -${total} Cr)`
              : `Vendre au comptant (-${request.quantity} ${label} / +${Math.round(total * 0.92)} Cr)`,
            doctrineTag: 'CORPORATE',
            description: 'Transaction immédiate au prix du cycle en cours.',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS, xpCiv: 5 },
            actionPayload: request,
          },
          {
            id: `opt-mkt-escort-${idSuffix}`,
            label: 'Transport groupé (1 PA Gestion)',
            doctrineTag: 'FEDERAL',
            description: 'Réduit les frais de transport (+35 Cr d’économie et +6 Énergie).',
            paGeneralCost: 0,
            subPaDomain: 'PA_GES',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, credits: 35, energy: 6, xpCabinet: 10 },
            actionPayload: request,
          },
          {
            id: `opt-mkt-partner-${idSuffix}`,
            label: 'Contrat partenaire Alliance (1 PA Politique)',
            doctrineTag: 'SOLARPUNK',
            description: 'Renforce les échanges (+4% confiance Alliance et +8 Vivres en bonus).',
            paGeneralCost: 0,
            subPaDomain: 'PA_POL',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, food: 8, allianceTrustDelta: 4, xpAlliance: 12 },
            actionPayload: request,
          },
          {
            id: `opt-mkt-cancel-${idSuffix}`,
            label: 'Annuler la transaction (0 coût)',
            doctrineTag: 'SCIENTIFIC',
            description: 'Annule l’ordre et conserve vos stocks intacts.',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS },
            actionPayload: { kind: 'DEFER_ACTION' },
          },
        ],
      };
      break;
    }

    case 'REASSIGN_DRONE': {
      dossier = {
        id: `evt-drn-${request.fromRole}-${request.toRole}-${idSuffix}`,
        code: `DRN-C${state.cycle}`,
        dossierClass: 'C3',
        title: `Réaffectation drones : ${DRONE_LABELS[request.fromRole]} → ${DRONE_LABELS[request.toRole]}`,
        briefing: `Transfert d’un drone de ${DRONE_LABELS[request.fromRole]} vers ${DRONE_LABELS[request.toRole]}. Un cycle de recalibrage est nécessaire après transfert.`,
        source: 'ACTION_GATEWAY',
        slotIndex: state.activeSlotIndex,
        tileIndex: 18,
        expiresInCycles: 2,
        scientificTag: 'Drones · Maintenance',
        options: [
          {
            id: `opt-drn-std-${idSuffix}`,
            label: `Transférer 1 drone (${DRONE_LABELS[request.fromRole]} → ${DRONE_LABELS[request.toRole]})`,
            doctrineTag: 'SECURITY',
            description: 'Réaffecte immédiatement 1 drone sur le nouveau rôle.',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS, xpCiv: 5 },
            actionPayload: request,
          },
          {
            id: `opt-drn-mnt-${idSuffix}`,
            label: 'Révision des quartiers au passage (1 PA Technique)',
            doctrineTag: 'SCIENTIFIC',
            description: 'Profite du redéploiement pour réparer +8% d’état sur la ville.',
            paGeneralCost: 0,
            subPaDomain: 'PA_MNT',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, maintenanceDelta: 8, xpCabinet: 12 },
            actionPayload: request,
          },
          {
            id: `opt-drn-scan-${idSuffix}`,
            label: 'Collecte de données terrain (1 PA Gestion)',
            doctrineTag: 'SOLARPUNK',
            description: 'Récupère +12 Calcul et +10 Matériaux recyclés pendant le trajet.',
            paGeneralCost: 0,
            subPaDomain: 'PA_GES',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, compute: 12, materials: 10, xpCiv: 10 },
            actionPayload: request,
          },
          {
            id: `opt-drn-cancel-${idSuffix}`,
            label: 'Conserver la répartition actuelle (0 coût)',
            doctrineTag: 'FEDERAL',
            description: 'Annule le changement de rôle.',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS },
            actionPayload: { kind: 'DEFER_ACTION' },
          },
        ],
      };
      break;
    }

    case 'CYBER_PARALYSIS': {
      const rival = state.rivals.find((r) => r.id === request.rivalId);
      if (!rival) return err('EXW_ERR_SCHEMA', 'Faction rivale introuvable.');
      const needed = Math.ceil(rival.computeDefense * 2);
      dossier = {
        id: `evt-cyb-${rival.id}-${idSuffix}`,
        code: `CYB-C${state.cycle}`,
        dossierClass: 'C5',
        title: `Opération informatique : ${rival.name}`,
        briefing: `Action ciblée sur les réseaux de ${rival.name} (Défense : ${rival.computeDefense}, seuil requis : ${needed} Calcul ; disponible : ${state.resources.compute}). Succès : 2 cycles de blocage.`,
        source: 'ACTION_GATEWAY',
        slotIndex: state.activeSlotIndex,
        tileIndex: 24,
        expiresInCycles: 2,
        scientificTag: 'Sécurité · Réseaux',
        options: [
          {
            id: `opt-cyb-std-${idSuffix}`,
            label: `Lancer le blocage sur ${rival.name}`,
            doctrineTag: 'SECURITY',
            description: 'Bloque le rival pendant 2 cycles si votre Calcul est suffisant.',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS, xpCiv: 15 },
            actionPayload: request,
          },
          {
            id: `opt-cyb-intel-${idSuffix}`,
            label: 'Collecte technique associée (1 PA Politique)',
            doctrineTag: 'SCIENTIFIC',
            description: 'Récupère +20 Électronique et +15 Calcul pendant l’opération.',
            paGeneralCost: 0,
            subPaDomain: 'PA_POL',
            subPaCost: 1,
            skillCheck: {
              attribute: 'cyber',
              threshold: 9,
              successBonusLabel: '+25% données récupérées',
              failureRiskLabel: 'Opération standard',
            },
            effects: { ...ZERO_EFFECTS, electronics: 20, compute: 15, xpCabinet: 20 },
            actionPayload: request,
          },
          {
            id: `opt-cyb-shield-${idSuffix}`,
            label: 'Renforcer nos pare-feu en parallèle (1 PA Technique)',
            doctrineTag: 'FEDERAL',
            description: 'Sécurise nos propres réseaux (+8% état des installations et +10 Énergie).',
            paGeneralCost: 0,
            subPaDomain: 'PA_MNT',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, maintenanceDelta: 8, energy: 10, xpCiv: 12 },
            actionPayload: request,
          },
          {
            id: `opt-cyb-cancel-${idSuffix}`,
            label: 'Annuler l’opération (0 coût)',
            doctrineTag: 'SOLARPUNK',
            description: 'Conserve votre Calcul et évite toute tension diplomatique.',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS },
            actionPayload: { kind: 'DEFER_ACTION' },
          },
        ],
      };
      break;
    }

    case 'RECRUIT_UNIT': {
      const unitName = UNIT_LABELS[request.unitClass] ?? request.unitClass;
      const costCr = 70 * request.level;
      const costMat = 15 * request.level;
      dossier = {
        id: `evt-rec-${request.unitClass}-l${request.level}-${idSuffix}`,
        code: `MIL-C${state.cycle}`,
        dossierClass: 'C3',
        title: `Recrutement : +3 ${unitName} Niv.${request.level}`,
        briefing: `Déploiement de +3 unités ${unitName} (Niveau ${request.level}). Coût matériel : ${costCr} Crédits et ${costMat} Matériaux.`,
        source: 'ACTION_GATEWAY',
        slotIndex: state.activeSlotIndex,
        tileIndex: 19,
        expiresInCycles: 2,
        scientificTag: 'Défense · Recrutement',
        options: [
          {
            id: `opt-rec-std-${idSuffix}`,
            label: `Déployer +3 ${unitName} (-${costCr} Cr · -${costMat} Mat.)`,
            doctrineTag: 'SECURITY',
            description: 'Ajoute immédiatement 3 unités opérationnelles à la garnison.',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS, xpCiv: 10 },
            actionPayload: request,
          },
          {
            id: `opt-rec-drill-${idSuffix}`,
            label: 'Dotation complète O₂ & Énergie (1 PA Technique)',
            doctrineTag: 'FEDERAL',
            description: 'Déploie les unités avec +10 Kits O₂ et +10 Énergie de réserve.',
            paGeneralCost: 0,
            subPaDomain: 'PA_MNT',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, breathingKits: 10, energy: 10, xpCabinet: 15 },
            actionPayload: request,
          },
          {
            id: `opt-rec-logi-${idSuffix}`,
            label: 'Ravitaillement local (1 PA Gestion)',
            doctrineTag: 'SOLARPUNK',
            description: 'Déploie les unités tout en sécurisant +15 Vivres et +10 Eau.',
            paGeneralCost: 0,
            subPaDomain: 'PA_GES',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, food: 15, water: 10, xpCiv: 12 },
            actionPayload: request,
          },
          {
            id: `opt-rec-cancel-${idSuffix}`,
            label: 'Reporter le recrutement (0 coût)',
            doctrineTag: 'CORPORATE',
            description: 'Ferme le dossier sans dépenser de ressources.',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS },
            actionPayload: { kind: 'DEFER_ACTION' },
          },
        ],
      };
      break;
    }

    case 'LAUNCH_COMBAT': {
      dossier = {
        id: `evt-cbt-t${request.targetTileIndex}-${idSuffix}`,
        code: `OPS-C${state.cycle}`,
        dossierClass: 'C5',
        title: `Opération sur le Secteur #${request.targetTileIndex}`,
        briefing: `Engagement tactique pour contrôler le Secteur #${request.targetTileIndex}. Vous pouvez inspecter le secteur en 3D avant de valider l’opération.`,
        source: 'ACTION_GATEWAY',
        slotIndex: state.activeSlotIndex,
        tileIndex: request.targetTileIndex,
        expiresInCycles: 2,
        scientificTag: 'Défense · Territoire',
        options: [
          {
            id: `opt-cbt-std-${idSuffix}`,
            label: `Lancer l’opération sur le Secteur #${request.targetTileIndex}`,
            doctrineTag: 'SECURITY',
            description: 'Engage votre garnison actuelle pour sécuriser le secteur.',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS, xpCiv: 15 },
            actionPayload: request,
          },
          {
            id: `opt-cbt-sup-${idSuffix}`,
            label: 'Appui satellite & récupération (1 PA Politique)',
            doctrineTag: 'SCIENTIFIC',
            description: 'Engage l’opération avec repérage précis : récupère +30 Matériaux sur place.',
            paGeneralCost: 0,
            subPaDomain: 'PA_POL',
            subPaCost: 1,
            skillCheck: {
              attribute: 'strategy',
              threshold: 9,
              successBonusLabel: 'Coordination optimale',
              failureRiskLabel: 'Opération standard',
            },
            effects: { ...ZERO_EFFECTS, materials: 30, xpCabinet: 15, xpAlliance: 10 },
            actionPayload: request,
          },
          {
            id: `opt-cbt-care-${idSuffix}`,
            label: 'Couloir humanitaire & protection civile (1 PA Climat)',
            doctrineTag: 'SOLARPUNK',
            description: 'Sécurise le secteur en préservant les infrastructures (+12 Kits O₂, +5% Alliance).',
            paGeneralCost: 0,
            subPaDomain: 'PA_BIO',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, breathingKits: 12, allianceTrustDelta: 5, xpCiv: 18 },
            actionPayload: request,
          },
          {
            id: `opt-cbt-cancel-${idSuffix}`,
            label: 'Annuler l’opération (0 coût)',
            doctrineTag: 'FEDERAL',
            description: 'Laisse le secteur intact et préserve vos troupes.',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS },
            actionPayload: { kind: 'DEFER_ACTION' },
          },
        ],
      };
      break;
    }
  }

  if (!dossier) {
    return err('EXW_ERR_SCHEMA', 'Impossible de créer cet événement.');
  }

  const draft: WorldState = {
    ...state,
    activeDossiers: [dossier, ...state.activeDossiers].slice(0, 12),
  };
  const nextState: WorldState = { ...draft, stateHash: computeStateHash(draft) };
  return ok({ nextState, dossier });
}
