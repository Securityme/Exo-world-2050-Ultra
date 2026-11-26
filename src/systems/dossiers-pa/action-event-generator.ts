import type { DossierActionPayload, ExecutiveDossier } from '../../contracts/pa-dossiers.schema.ts';
import { err, ok, type ExwResult } from '../../contracts/trigger-bus.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import { computeStateHash } from '../../core/hashing/state-hasher.ts';
import {
  COLONIST_GEAR_UPGRADE_SPECS,
  findShipBlueprint,
  findShipModuleSpec,
  SHIP_MODULE_SLOT_LABELS,
} from '../../data/ship-equipment.catalog.ts';
import { SHARED_TECHS_30 } from '../../data/v4-catalog.data.ts';
import { getShipRefitCosts } from '../fleet/ship-loadout.engine.ts';

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
        selectionBudget: {
          mode: 'BUDGETED_MULTI',
          maxSelections: 2,
          paBudgetCap: 2,
          creditsBudgetCap: 350,
          requireColonistOnBundle: false,
        },
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
            id: `opt-graft-expert-${idSuffix}`,
            label: 'Ingénierie modulaire avancée (Ingénieur Niv.2+)',
            doctrineTag: 'SCIENTIFIC',
            description: 'Un ingénieur de niveau 2+ intègre un noyau haute efficience (+20 Élec., +12% État, +55 Cr économisés).',
            paGeneralCost: 0,
            subPaDomain: 'PA_MNT',
            subPaCost: 1,
            unlockConditions: {
              requiredColonistSpecialty: 'ENGINEERING',
              minColonistLevel: 2,
              minSkillThreshold: { attribute: 'engineering', level: 12 },
            },
            effects: { ...ZERO_EFFECTS, credits: 55, electronics: 20, maintenanceDelta: 12, xpCiv: 28, xpCabinet: 22 },
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
            id: `opt-cyb-specialist-${idSuffix}`,
            label: 'Intrusion quantique ciblée (Cybernéticien Niv.2+)',
            doctrineTag: 'SCIENTIFIC',
            description: 'Mobilise un cybernéticien Niv.2+ : siphon de données (+30 Calcul, +25 Élec., +75 Cr).',
            paGeneralCost: 0,
            subPaDomain: 'PA_POL',
            subPaCost: 1,
            unlockConditions: {
              requiredColonistSpecialty: 'CYBERNETICS',
              minColonistLevel: 2,
              minSkillThreshold: { attribute: 'cyber', level: 11 },
            },
            effects: { ...ZERO_EFFECTS, credits: 75, electronics: 25, compute: 30, xpCabinet: 25, xpCiv: 22 },
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

    case 'EQUIP_SHIP_MODULE': {
      const ship = (state.fleetShips ?? []).find((s) => s.id === request.shipId);
      if (!ship) return err('EXW_ERR_SCHEMA', 'Vaisseau introuvable dans la flotte.');
      const mod = findShipModuleSpec(request.moduleId);
      if (!mod) return err('EXW_ERR_SCHEMA', 'Module d’armement ou système introuvable.');
      const slotLabel = SHIP_MODULE_SLOT_LABELS[mod.slot];
      const costText = `${mod.costCredits} Cr · ${mod.costMaterials} Mat · ${mod.costElectronics} Élec${mod.costCompute > 0 ? ` · ${mod.costCompute} Calc` : ''}`;
      const bonusParts = [
        mod.firepower > 0 ? `+${mod.firepower} Puissance` : null,
        mod.defense > 0 ? `+${mod.defense} Défense` : null,
        mod.speed > 0 ? `+${mod.speed} Vitesse` : null,
        mod.utilityYield > 0 ? `+${mod.utilityYield} Utilité` : null,
      ].filter(Boolean);

      dossier = {
        id: `evt-ship-mod-${ship.id}-${mod.id}-${idSuffix}`,
        code: `FLT-C${state.cycle}`,
        dossierClass: 'C3',
        title: `Équipement Vaisseau : ${mod.name} → ${ship.name}`,
        briefing: `Montage du module « ${mod.name} » (${slotLabel} · T${mod.tier}) sur ${ship.name} (${ship.loadout?.length ?? 0}/${ship.maxSlots ?? 4} baies). Bonus : ${bonusParts.join(', ')}. Coût d’installation : ${costText}.`,
        source: 'ACTION_GATEWAY',
        slotIndex: state.activeSlotIndex,
        tileIndex: 15,
        expiresInCycles: 2,
        scientificTag: `Flotte · ${slotLabel}`,
        options: [
          {
            id: `opt-mod-std-${idSuffix}`,
            label: `Installer « ${mod.name} » (-${mod.costCredits} Cr · -${mod.costMaterials} Mat.)`,
            doctrineTag: 'SECURITY',
            description: `Monte immédiatement le module sur ${ship.name} (${bonusParts.join(' · ')}).`,
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS, xpCiv: 14 },
            actionPayload: request,
          },
          {
            id: `opt-mod-cal-${idSuffix}`,
            label: 'Calibrage de précision en cale sèche (1 PA Technique)',
            doctrineTag: 'SCIENTIFIC',
            description: 'Monte le module avec tests complets (+14 Énergie, +8 Calcul, +6% entretien ville).',
            paGeneralCost: 0,
            subPaDomain: 'PA_MNT',
            subPaCost: 1,
            skillCheck: {
              attribute: 'engineering',
              threshold: 9,
              successBonusLabel: 'Synchronisation orbitale optimale',
              failureRiskLabel: 'Montage nominal',
            },
            effects: { ...ZERO_EFFECTS, energy: 14, compute: 8, maintenanceDelta: 6, xpCiv: 20, xpCabinet: 15 },
            actionPayload: request,
          },
          {
            id: `opt-mod-joint-${idSuffix}`,
            label: 'Standardisation Alliance & réserves (1 PA Politique)',
            doctrineTag: 'FEDERAL',
            description: 'Homologue le montage auprès de la Super-Alliance (+5% Confiance, +45 Cr subvention).',
            paGeneralCost: 0,
            subPaDomain: 'PA_POL',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, credits: 45, allianceTrustDelta: 5, xpAlliance: 15, xpCiv: 14 },
            actionPayload: request,
          },
          {
            id: `opt-mod-cancel-${idSuffix}`,
            label: 'Reporter le montage (0 coût)',
            doctrineTag: 'SOLARPUNK',
            description: 'Conserve vos stocks et laisse la baie libre pour un autre système.',
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

    case 'REFIT_SHIP': {
      const ship = (state.fleetShips ?? []).find((s) => s.id === request.shipId);
      if (!ship) return err('EXW_ERR_SCHEMA', 'Vaisseau introuvable.');
      const costs = getShipRefitCosts(ship, request.mode);
      const isUpgrade = request.mode === 'UPGRADE_LEVEL';
      dossier = {
        id: `evt-refit-${ship.id}-${request.mode}-${idSuffix}`,
        code: `RFT-C${state.cycle}`,
        dossierClass: 'C3',
        title: isUpgrade
          ? `Modernisation Niv.${Math.min(5, ship.level + 1)} : ${ship.name}`
          : `Révision coque : ${ship.name} (${ship.integrity}%)`,
        briefing: isUpgrade
          ? `Passage de ${ship.name} au Niveau ${Math.min(5, ship.level + 1)} (+22% rendement structurel, intégrité 100%, nouvelle baie aux Niv.3 et Niv.5). Coût : ${costs.credits} Cr, ${costs.materials} Mat., ${costs.electronics} Élec.`
          : `Réparation intégrale de ${ship.name} (de ${ship.integrity}% à 100%). Coût : ${costs.credits} Cr, ${costs.materials} Mat., ${costs.electronics} Élec.`,
        source: 'ACTION_GATEWAY',
        slotIndex: state.activeSlotIndex,
        tileIndex: 16,
        expiresInCycles: 2,
        scientificTag: 'Chantier Orbital · Refit',
        options: [
          {
            id: `opt-refit-std-${idSuffix}`,
            label: isUpgrade
              ? `Moderniser Niv.${Math.min(5, ship.level + 1)} (-${costs.credits} Cr · -${costs.materials} Mat.)`
              : `Réparer à 100% (-${costs.credits} Cr · -${costs.materials} Mat.)`,
            doctrineTag: 'SECURITY',
            description: isUpgrade
              ? 'Lance immédiatement la refonte de classe et restaure la coque.'
              : 'Remet le vaisseau en pleine capacité opérationnelle.',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS, xpCiv: 14 },
            actionPayload: request,
          },
          {
            id: `opt-refit-eng-${idSuffix}`,
            label: 'Optimisation chantier & recyclage (1 PA Technique)',
            doctrineTag: 'SCIENTIFIC',
            description: 'Récupère +18 Matériaux et +12 Énergie durant l’opération en cale.',
            paGeneralCost: 0,
            subPaDomain: 'PA_MNT',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, materials: 18, energy: 12, xpCabinet: 15, xpCiv: 18 },
            actionPayload: request,
          },
          {
            id: `opt-refit-crew-${idSuffix}`,
            label: 'Dotation équipage & Kits O₂ (1 PA Climat)',
            doctrineTag: 'SOLARPUNK',
            description: 'Complète le refit avec +12 Kits O₂ et +3% Approbation civique.',
            paGeneralCost: 0,
            subPaDomain: 'PA_BIO',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, breathingKits: 12, approvalDelta: 3, xpCiv: 16 },
            actionPayload: request,
          },
          {
            id: `opt-refit-cancel-${idSuffix}`,
            label: 'Ajournement chantier (0 coût)',
            doctrineTag: 'CORPORATE',
            description: 'Ferme l’ordre sans dépense.',
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

    case 'COMMISSION_SHIP': {
      const bp = findShipBlueprint(request.shipClass);
      const displayName = request.customName?.trim() || bp.label;
      dossier = {
        id: `evt-build-ship-${request.shipClass}-${idSuffix}`,
        code: `SHP-C${state.cycle}`,
        dossierClass: 'C3',
        title: `Construction Orbitale : ${displayName}`,
        briefing: `Mise en chantier d’un nouveau vaisseau « ${bp.label} » (${bp.baseSlots} baies modulaires, module initial inclus). ${bp.summary} Coût : ${bp.costCredits} Cr, ${bp.costMaterials} Mat., ${bp.costElectronics} Élec.`,
        source: 'ACTION_GATEWAY',
        slotIndex: state.activeSlotIndex,
        tileIndex: 14,
        expiresInCycles: 2,
        scientificTag: 'Chantier Orbital · Flotte',
        options: [
          {
            id: `opt-shp-std-${idSuffix}`,
            label: `Lancer la construction (-${bp.costCredits} Cr · -${bp.costMaterials} Mat.)`,
            doctrineTag: 'SECURITY',
            description: `Assemble et met en orbite « ${displayName} » immédiatement.`,
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS, xpCiv: 22 },
            actionPayload: request,
          },
          {
            id: `opt-shp-rush-${idSuffix}`,
            label: 'Cale prioritaire & télémétrie (1 PA Technique)',
            doctrineTag: 'SCIENTIFIC',
            description: 'Assemble le vaisseau avec +16 Calcul et +14 Énergie sur le réseau orbital.',
            paGeneralCost: 0,
            subPaDomain: 'PA_MNT',
            subPaCost: 1,
            skillCheck: {
              attribute: 'engineering',
              threshold: 10,
              successBonusLabel: 'Qualité chantier supérieure',
              failureRiskLabel: 'Assemblage nominal',
            },
            effects: { ...ZERO_EFFECTS, compute: 16, energy: 14, xpCiv: 28, xpCabinet: 18 },
            actionPayload: request,
          },
          {
            id: `opt-shp-ceremony-${idSuffix}`,
            label: 'Baptême civique & cofinancement (1 PA Politique)',
            doctrineTag: 'FEDERAL',
            description: 'Mobilise les partenaires (+65 Cr de subvention, +4% Approbation, +4% Alliance).',
            paGeneralCost: 0,
            subPaDomain: 'PA_POL',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, credits: 65, approvalDelta: 4, allianceTrustDelta: 4, xpAlliance: 18 },
            actionPayload: request,
          },
          {
            id: `opt-shp-cancel-${idSuffix}`,
            label: 'Annuler la mise en chantier (0 coût)',
            doctrineTag: 'CORPORATE',
            description: 'Conserve vos matériaux et crédits.',
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

    case 'UPGRADE_COLONIST_GEAR': {
      const spec = COLONIST_GEAR_UPGRADE_SPECS[request.gearSlot];
      const targetColonist = request.colonistId
        ? state.colonists.find((c) => c.id === request.colonistId) ?? null
        : null;
      const baseTier = targetColonist?.gear?.[request.gearSlot] ?? state.colonistGear?.[request.gearSlot] ?? 1;
      const nextTier = Math.min(3, baseTier + 1);
      const costCr = spec.costCreditsPerTier * baseTier;
      const costMat = spec.costMaterialsPerTier * baseTier;
      const costElec = spec.costElectronicsPerTier * baseTier;
      const scopeLabel = targetColonist ? targetColonist.name : 'Toute la colonie';

      dossier = {
        id: `evt-gear-${request.gearSlot}-${idSuffix}`,
        code: `EQP-C${state.cycle}`,
        dossierClass: 'C2',
        title: `Équipement Colons : ${spec.label} T${nextTier}`,
        briefing: `Dotation « ${spec.label} » palier T${nextTier} (${scopeLabel}). ${spec.summary} Coût : ${costCr} Cr, ${costMat} Mat., ${costElec} Élec.`,
        source: 'ACTION_GATEWAY',
        slotIndex: state.activeSlotIndex,
        tileIndex: 12,
        expiresInCycles: 2,
        scientificTag: 'Colons · Dotation',
        options: [
          {
            id: `opt-gear-std-${idSuffix}`,
            label: `Déployer ${spec.label} T${nextTier} (-${costCr} Cr · -${costMat} Mat.)`,
            doctrineTag: 'SOLARPUNK',
            description: 'Équipe immédiatement les colons (+4 Moral et rendement accru).',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS, approvalDelta: 2, xpCiv: 14 },
            actionPayload: request,
          },
          {
            id: `opt-gear-ergo-${idSuffix}`,
            label: 'Atelier ergonomie & formation (1 PA Gestion)',
            doctrineTag: 'SCIENTIFIC',
            description: 'Accompagne la dotation (+10 Kits O₂, +4% Approbation, +15 XP Cabinet).',
            paGeneralCost: 0,
            subPaDomain: 'PA_GES',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, breathingKits: 10, approvalDelta: 4, xpCabinet: 15, xpCiv: 18 },
            actionPayload: request,
          },
          {
            id: `opt-gear-bio-${idSuffix}`,
            label: 'Programme santé & filtration (1 PA Climat)',
            doctrineTag: 'FEDERAL',
            description: 'Combine la dotation avec +12 Eau et +12 Vivres pour les équipes terrain.',
            paGeneralCost: 0,
            subPaDomain: 'PA_BIO',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, water: 12, food: 12, xpCiv: 16 },
            actionPayload: request,
          },
          {
            id: `opt-gear-cancel-${idSuffix}`,
            label: 'Reporter la dotation (0 coût)',
            doctrineTag: 'CORPORATE',
            description: 'Ferme ce dossier sans dépense.',
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

    case 'START_RESEARCH': {
      const tech = SHARED_TECHS_30.find((t) => t.id === request.techId);
      if (!tech) return err('EXW_ERR_SCHEMA', 'Technologie introuvable.');
      dossier = {
        id: `evt-tech-${tech.id}-${idSuffix}`,
        code: `TEC-C${state.cycle}`,
        dossierClass: 'C4',
        title: `Programme Scientifique : ${tech.name}`,
        briefing: `Réorientation des laboratoires vers « ${tech.name} » (Ère ${tech.era} · Domaine ${tech.domain} · ${tech.turnsBase} tours). Effet visé : ${tech.effectLabel}.`,
        source: 'ACTION_GATEWAY',
        slotIndex: state.activeSlotIndex,
        tileIndex: 17,
        expiresInCycles: 2,
        scientificTag: `Recherche · ${tech.domain}`,
        selectionBudget: {
          mode: 'BUDGETED_MULTI',
          maxSelections: 2,
          paBudgetCap: 2,
          creditsBudgetCap: 250,
          requireColonistOnBundle: false,
        },
        options: [
          {
            id: `opt-tech-std-${idSuffix}`,
            label: `Lancer « ${tech.name} » (${tech.turnsBase} tours · 0 PA)`,
            doctrineTag: 'SCIENTIFIC',
            description: 'Active immédiatement cette technologie dans le plan de recherche.',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS, xpCiv: 12 },
            actionPayload: request,
          },
          {
            id: `opt-tech-osmosis-${idSuffix}`,
            label: 'Partage brevets Super-Alliance (1 PA Politique)',
            doctrineTag: 'FEDERAL',
            description: 'Active la recherche avec +18 Calcul et +5% Confiance Alliance.',
            paGeneralCost: 0,
            subPaDomain: 'PA_POL',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, compute: 18, allianceTrustDelta: 5, xpAlliance: 14, xpCiv: 16 },
            actionPayload: request,
          },
          {
            id: `opt-tech-lab-${idSuffix}`,
            label: 'Allocation énergie & prototypes (1 PA Technique)',
            doctrineTag: 'SOLARPUNK',
            description: 'Active la recherche et produit +12 Électronique et +10 Énergie.',
            paGeneralCost: 0,
            subPaDomain: 'PA_MNT',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, electronics: 12, energy: 10, xpCabinet: 15, xpCiv: 16 },
            actionPayload: request,
          },
          {
            id: `opt-tech-fellow-${idSuffix}`,
            label: 'Chaire de recherche avancée (Coéquipier Exobiologie)',
            doctrineTag: 'SCIENTIFIC',
            description: 'Affecte un chercheur dédié : +28 Calcul, +4% Atmosphère et +22 XP Cabinet.',
            paGeneralCost: 0,
            subPaDomain: 'PA_BIO',
            subPaCost: 1,
            unlockConditions: {
              requiredColonistSpecialty: 'EXOBIOLOGY',
              minColonistLevel: 1,
              minSkillThreshold: { attribute: 'ecology', level: 11 },
            },
            effects: { ...ZERO_EFFECTS, compute: 28, atmosphereDelta: 4, xpCabinet: 22, xpCiv: 24 },
            actionPayload: request,
          },
          {
            id: `opt-tech-cancel-${idSuffix}`,
            label: 'Conserver la recherche en cours (0 coût)',
            doctrineTag: 'CORPORATE',
            description: 'Ne modifie pas le programme scientifique actuel.',
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

    case 'DIPLOMATIC_INITIATIVE': {
      const targetRival =
        (request.rivalId ? state.rivals.find((r) => r.id === request.rivalId) : undefined) ??
        [...state.rivals].sort((a, b) => a.relationWithPlayer - b.relationWithPlayer)[0] ??
        null;

      const metaByMode: Record<
        'ALLIANCE_PACT' | 'RIVAL_DETENTE' | 'TRADE_ACCORD',
        {
          readonly title: string;
          readonly briefing: string;
          readonly stdLabel: string;
          readonly stdDesc: string;
          readonly tag: string;
        }
      > = {
        ALLIANCE_PACT: {
          title: 'Sommet fédéral : Pacte Super-Alliance',
          briefing: `Renforcement de votre mandat auprès de ${state.superAllianceName} (confiance actuelle ${state.superAllianceTrust}%, rang #${state.superAllianceRank}/6).`,
          stdLabel: 'Ratifier le pacte Alliance (+6% Confiance · +45 Cr)',
          stdDesc: 'Valide immédiatement le protocole fédéral et libère une dotation.',
          tag: 'Diplomatie · Super-Alliance',
        },
        RIVAL_DETENTE: {
          title: targetRival ? `Détente bilatérale : ${targetRival.name}` : 'Protocole de détente bilatérale',
          briefing: targetRival
            ? `Ouverture d’un dialogue apaisé avec ${targetRival.name} (relation actuelle ${targetRival.relationWithPlayer}, puissance ${targetRival.militaryPower}).`
            : 'Ouverture d’un dialogue diplomatique inter-puissances.',
          stdLabel: targetRival
            ? `Signer le protocole avec ${targetRival.name} (+14 Relation)`
            : 'Signer le protocole diplomatique',
          stdDesc: 'Réduit les frictions frontalières et renforce votre crédit diplomatique.',
          tag: 'Diplomatie · Détente',
        },
        TRADE_ACCORD: {
          title: targetRival ? `Accord commercial : ${targetRival.name}` : 'Accord commercial orbital',
          briefing: `Échange logistique de 12 Matériaux contre +95 Crédits et un rapprochement diplomatique${targetRival ? ` avec ${targetRival.name}` : ''}.`,
          stdLabel: 'Exécuter l’accord (-12 Mat. · +95 Cr · +6 Rel.)',
          stdDesc: 'Convertit des surplus de matériaux en crédits et consolide les relations.',
          tag: 'Diplomatie · Commerce',
        },
      };

      const m = metaByMode[request.mode];
      dossier = {
        id: `evt-dip-${request.mode}-${idSuffix}`,
        code: `DIP-C${state.cycle}`,
        dossierClass: 'C1',
        title: m.title,
        briefing: m.briefing,
        source: 'ACTION_GATEWAY',
        slotIndex: state.activeSlotIndex,
        tileIndex: 11,
        expiresInCycles: 2,
        scientificTag: m.tag,
        options: [
          {
            id: `opt-dip-std-${idSuffix}`,
            label: m.stdLabel,
            doctrineTag: 'FEDERAL',
            description: m.stdDesc,
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS, xpAlliance: 15, xpCiv: 10 },
            actionPayload: request,
          },
          {
            id: `opt-dip-env-${idSuffix}`,
            label: 'Émissaires & garantie de charte (1 PA Politique)',
            doctrineTag: 'SOLARPUNK',
            description: 'Ajoute un volet écologique et civique (+4% Approbation, +10 Kits O₂).',
            paGeneralCost: 0,
            subPaDomain: 'PA_POL',
            subPaCost: 1,
            skillCheck: {
              attribute: 'diplomacy',
              threshold: 9,
              successBonusLabel: 'Rayonnement diplomatique exemplaire',
              failureRiskLabel: 'Portée diplomatique standard',
            },
            effects: { ...ZERO_EFFECTS, approvalDelta: 4, breathingKits: 10, xpCabinet: 15, xpAlliance: 22 },
            actionPayload: request,
          },
          {
            id: `opt-dip-esc-${idSuffix}`,
            label: 'Clauses logistiques & calcul partagé (1 PA Gestion)',
            doctrineTag: 'CORPORATE',
            description: 'Complète l’accord avec +40 Cr et +12 Calcul partagé.',
            paGeneralCost: 0,
            subPaDomain: 'PA_GES',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, credits: 40, compute: 12, xpCiv: 16 },
            actionPayload: request,
          },
          {
            id: `opt-dip-cancel-${idSuffix}`,
            label: 'Ajournement diplomatique (0 coût)',
            doctrineTag: 'SCIENTIFIC',
            description: 'Reporte la négociation sans modification.',
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

    case 'SIGN_PLANETARY_TREATY': {
      const rival =
        (request.rivalId ? state.rivals.find((r) => r.id === request.rivalId) : undefined) ??
        state.rivals[0] ??
        null;
      const treatyNames: Record<typeof request.treatyKind, string> = {
        MARITIME_TRADE: 'Route Commerciale Maritime',
        NON_AGGRESSION: 'Pacte de Non-Agression Planétaire',
        SCIENCE_SHARE: 'Partage Scientifique & Biosphère',
        ORBITAL_EMBARGO: 'Embargo Logistique Orbital',
        PLANETARY_SUMMIT: 'Sommet Planétaire de Paix',
      };
      const titleName = treatyNames[request.treatyKind];
      dossier = {
        id: `evt-treaty-${request.treatyKind}-${idSuffix}`,
        code: `TRT-C${state.cycle}`,
        dossierClass: 'C1',
        title: `Traité Planétaire : ${titleName}`,
        briefing: `Proposition bilatérale (${titleName})${rival ? ` avec ${rival.name}` : ` à l’échelle planétaire`}. Ce traité projette une liaison active sur le globe et renforce votre influence.`,
        source: 'ACTION_GATEWAY',
        slotIndex: state.activeSlotIndex,
        tileIndex: 11,
        expiresInCycles: 2,
        scientificTag: 'Diplomatie Planétaire',
        options: [
          {
            id: `opt-trt-std-${idSuffix}`,
            label: `Ratifier : ${titleName} (0 PA)`,
            doctrineTag: 'FEDERAL',
            description: 'Signature officielle du traité avec effets immédiats et durée multi-cycles.',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS, xpAlliance: 20, xpCiv: 14 },
            actionPayload: request,
          },
          {
            id: `opt-trt-envoy-${idSuffix}`,
            label: 'Mission d’ambassadeurs renforcée (1 PA Politique)',
            doctrineTag: 'SOLARPUNK',
            description: 'Consolide la signature avec +4 % Approbation et +10 Kits O₂ humanitaires.',
            paGeneralCost: 0,
            subPaDomain: 'PA_POL',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, approvalDelta: 4, breathingKits: 10, xpAlliance: 24 },
            actionPayload: request,
          },
          {
            id: `opt-trt-cancel-${idSuffix}`,
            label: 'Ajourner le traité (0 coût)',
            doctrineTag: 'CORPORATE',
            description: 'Conserve le statu quo diplomatique.',
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

    case 'DISPATCH_COLONIST_MISSION': {
      const target = state.colonists.find((c) => c.id === request.colonistId);
      if (!target) return err('EXW_ERR_SCHEMA', 'Citoyen introuvable.');
      dossier = {
        id: `evt-col-mis-${target.id}-${idSuffix}`,
        code: `CIT-C${state.cycle}`,
        dossierClass: 'C2',
        title: `Mission de terrain : ${target.name}`,
        briefing: `Déploiement ciblé de ${target.name} (${target.specialty}, Moral ${target.morale} %, Fatigue ${target.fatigue} %) en opération de proximité.`,
        source: 'ACTION_GATEWAY',
        slotIndex: state.activeSlotIndex,
        tileIndex: 12,
        expiresInCycles: 2,
        scientificTag: 'Citoyens · Mission',
        options: [
          {
            id: `opt-cmis-std-${idSuffix}`,
            label: 'Exécuter la mission de terrain (0 PA)',
            doctrineTag: 'SCIENTIFIC',
            description: 'Génère un bonus immédiat selon la spécialité et +28 XP citoyen.',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS, xpCiv: 12 },
            actionPayload: request,
          },
          {
            id: `opt-cmis-esc-${idSuffix}`,
            label: 'Soutien logistique complet (1 PA Gestion)',
            doctrineTag: 'SOLARPUNK',
            description: 'Ajoute +12 Eau et +12 Vivres pour l’équipe de terrain.',
            paGeneralCost: 0,
            subPaDomain: 'PA_GES',
            subPaCost: 1,
            effects: { ...ZERO_EFFECTS, water: 12, food: 12, xpCabinet: 12 },
            actionPayload: request,
          },
          {
            id: `opt-cmis-cancel-${idSuffix}`,
            label: 'Annuler la mission (0 coût)',
            doctrineTag: 'FEDERAL',
            description: 'Laisse le citoyen à son poste actuel.',
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

    case 'REST_COLONIST': {
      const target = state.colonists.find((c) => c.id === request.colonistId);
      if (!target) return err('EXW_ERR_SCHEMA', 'Citoyen introuvable.');
      dossier = {
        id: `evt-col-rest-${target.id}-${idSuffix}`,
        code: `REP-C${state.cycle}`,
        dossierClass: 'C2',
        title: `Permission & Repos : ${target.name}`,
        briefing: `Accorder une période de récupération à ${target.name} (Fatigue actuelle ${target.fatigue} %, Moral ${target.morale} %) dans les quartiers côtiers.`,
        source: 'ACTION_GATEWAY',
        slotIndex: state.activeSlotIndex,
        tileIndex: 12,
        expiresInCycles: 2,
        scientificTag: 'Citoyens · Bien-être',
        options: [
          {
            id: `opt-crest-std-${idSuffix}`,
            label: 'Accorder le repos (-28 % Fatigue · +10 Moral · 0 PA)',
            doctrineTag: 'SOLARPUNK',
            description: 'Restaure la forme et le moral sans dépense budgétaire.',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS, approvalDelta: 1 },
            actionPayload: request,
          },
          {
            id: `opt-crest-cancel-${idSuffix}`,
            label: 'Maintenir en poste (0 coût)',
            doctrineTag: 'CORPORATE',
            description: 'Reporte la permission.',
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

    case 'ECCLESIA_DISCERNMENT': {
      dossier = {
        id: `evt-ecc-${request.axis}-${idSuffix}`,
        code: `ECC-C${state.cycle}`,
        dossierClass: 'C1',
        title: `Discernement & Subsidiarité (${request.axis})`,
        briefing: `Initiative pastorale et caritative (FEAT-55/56) menée dans le respect absolu de la liberté de conscience (AR-19) et évaluée selon l’échelle éthique (+3 Grâce à −2).`,
        source: 'ACTION_GATEWAY',
        slotIndex: state.activeSlotIndex,
        tileIndex: 12,
        expiresInCycles: 2,
        scientificTag: 'Éthique · AR-19',
        options: [
          {
            id: `opt-ecc-std-${idSuffix}`,
            label: 'Encourager librement sans contrainte (0 PA)',
            doctrineTag: 'SOLARPUNK',
            description: 'Soutient les œuvres locales tout en maintenant 100 % de liberté de conscience.',
            paGeneralCost: 0,
            subPaDomain: null,
            subPaCost: 0,
            effects: { ...ZERO_EFFECTS, approvalDelta: 2, xpCiv: 14 },
            actionPayload: request,
          },
          {
            id: `opt-ecc-cancel-${idSuffix}`,
            label: 'Laisser en observation (0 coût)',
            doctrineTag: 'FEDERAL',
            description: 'Conserve la posture actuelle.',
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
