import { err, ok, type ExwResult } from '../../contracts/trigger-bus.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import { SHARED_TECHS_30 } from '../../data/v4-catalog.data.ts';
import { computeFleetTotals } from '../fleet/ship-loadout.engine.ts';
import type { ActionEventRequest } from './action-event-generator.ts';

/**
 * [L3] EXW.L3.EVENT_ACTION_TAXONOMY | v5.1.0 | SADT A2.1/A3.3
 * 100% Pure classification & deterministic diplomatic execution for the
 * 3 strategic action pillars in Événements: Recherche, Militaire, Diplomatique.
 */

export type EventActionPillarId = 'RESEARCH' | 'MILITARY' | 'DIPLOMATIC';

export type EventActionIconKey =
  | 'FLASK'
  | 'CPU'
  | 'WRENCH'
  | 'SPARKLES'
  | 'ROCKET'
  | 'SWORDS'
  | 'CROSSHAIR'
  | 'SHIELD'
  | 'HANDSHAKE'
  | 'GLOBE'
  | 'COINS'
  | 'SCALE';

export interface EventActionGridItem {
  readonly id: string;
  readonly pillar: EventActionPillarId;
  readonly iconKey: EventActionIconKey;
  readonly title: string;
  readonly badge: string;
  readonly description: string;
  readonly disabled?: boolean;
  readonly actionPayload?: ActionEventRequest;
  readonly opensAtelier?: 'FLEET_ARMORY' | 'TECH_COLONISTS' | 'MILITARY_OPS' | 'DIPLOMACY_MARKET';
  readonly generatesSynthClass?: 'C1' | 'C2' | 'C3';
}

export interface EventActionPillarGroup {
  readonly id: EventActionPillarId;
  readonly title: string;
  readonly subtitle: string;
  readonly statusPill: string;
  readonly items: readonly EventActionGridItem[];
}

export function executeDiplomaticInitiativePure(
  state: WorldState,
  mode: 'ALLIANCE_PACT' | 'RIVAL_DETENTE' | 'TRADE_ACCORD',
  rivalId?: string,
): ExwResult<{ readonly nextState: WorldState; readonly note: string }> {
  const sortedRivals = [...state.rivals].sort((a, b) => a.relationWithPlayer - b.relationWithPlayer);
  const targetRival =
    (rivalId ? state.rivals.find((r) => r.id === rivalId) : undefined) ?? sortedRivals[0] ?? null;

  if (mode === 'ALLIANCE_PACT') {
    const nextTrust = Math.min(100, state.superAllianceTrust + 6);
    const nextApproval = Math.min(100, state.approval + 2);
    const grantCredits = 45;
    const nextState: WorldState = {
      ...state,
      superAllianceTrust: nextTrust,
      approval: nextApproval,
      resources: {
        ...state.resources,
        credits: state.resources.credits + grantCredits,
      },
      xp: {
        ...state.xp,
        alliance: state.xp.alliance + 18,
      },
    };
    return ok({
      nextState,
      note: `Pacte Super-Alliance ratifié (+6% Confiance → ${nextTrust}%, +${grantCredits} Cr).`,
    });
  }

  if (mode === 'RIVAL_DETENTE') {
    if (!targetRival) {
      return err('EXW_ERR_SCHEMA', 'Aucune superpuissance rivale disponible.');
    }
    const nextRivals = state.rivals.map((r) =>
      r.id === targetRival.id
        ? { ...r, relationWithPlayer: Math.min(100, r.relationWithPlayer + 14) }
        : r,
    );
    const updatedRel = nextRivals.find((r) => r.id === targetRival.id)?.relationWithPlayer ?? targetRival.relationWithPlayer;
    const nextState: WorldState = {
      ...state,
      rivals: nextRivals,
      superAllianceTrust: Math.min(100, state.superAllianceTrust + 2),
      xp: {
        ...state.xp,
        alliance: state.xp.alliance + 20,
      },
    };
    return ok({
      nextState,
      note: `Protocole de détente signé avec ${targetRival.name} (+14 Relation → ${updatedRel}).`,
    });
  }

  // TRADE_ACCORD
  const materialBatch = 12;
  if (state.resources.materials < materialBatch) {
    return err(
      'EXW_ERR_FINANCE_LIMIT',
      `Accord commercial impossible : ${materialBatch} Matériaux requis.`,
    );
  }
  const creditGain = 95;
  const nextRivals = targetRival
    ? state.rivals.map((r) =>
        r.id === targetRival.id
          ? { ...r, relationWithPlayer: Math.min(100, r.relationWithPlayer + 6) }
          : r,
      )
    : state.rivals;

  const nextState: WorldState = {
    ...state,
    rivals: nextRivals,
    resources: {
      ...state.resources,
      materials: state.resources.materials - materialBatch,
      credits: state.resources.credits + creditGain,
    },
    xp: {
      ...state.xp,
      civilization: state.xp.civilization + 10,
      alliance: state.xp.alliance + 12,
    },
  };
  return ok({
    nextState,
    note: `Accord commercial exécuté (-${materialBatch} Mat. → +${creditGain} Cr${targetRival ? `, +6 ${targetRival.name}` : ''}).`,
  });
}

export function buildEventActionPillars(state: WorldState): readonly EventActionPillarGroup[] {
  const fleetTotals = computeFleetTotals(state.fleetShips ?? []);
  const ships = state.fleetShips ?? [];
  const primaryShip = ships.find((s) => s.shipClass === 'CORVETTE_ORBITAL') ?? ships[0] ?? null;
  const scienceShip = ships.find((s) => s.shipClass === 'SCIENCE_PROBE') ?? ships[0] ?? null;
  const unlockedIds = state.hk?.unlockedTechIds ?? [];
  const activeTech = SHARED_TECHS_30.find((t) => t.id === state.hk?.activeResearchTechId) ?? null;
  const nextTech =
    SHARED_TECHS_30.find(
      (t) =>
        t.era <= state.era &&
        !unlockedIds.includes(t.id) &&
        t.id !== state.hk?.activeResearchTechId,
    ) ??
    SHARED_TECHS_30.find((t) => t.era <= state.era && !unlockedIds.includes(t.id)) ??
    null;

  const targetTile = state.rivalTiles[0] ?? 24;
  const primaryRival = [...state.rivals].sort((a, b) => a.relationWithPlayer - b.relationWithPlayer)[0] ?? state.rivals[0] ?? null;
  const expandableDistrict = state.districts.find((d) => d.modulesCount < 3) ?? state.districts[0] ?? null;
  const toolTier = state.colonistGear?.toolTier ?? 1;

  return [
    {
      id: 'RESEARCH',
      title: 'Recherche',
      subtitle: 'Technologies, sondes scientifiques et dotation colons',
      statusPill: activeTech
        ? `${activeTech.name} · ${state.hk?.researchTurnsLeft ?? activeTech.turnsBase}t`
        : `${unlockedIds.length}/30 acquises`,
      items: [
        {
          id: 'act-res-tech',
          pillar: 'RESEARCH',
          iconKey: 'FLASK',
          title: nextTech ? `Étudier : ${nextTech.name}` : 'Programme Scientifique',
          badge: nextTech ? `${nextTech.turnsBase} tours · 0 PA` : 'Catalogue',
          description: nextTech ? nextTech.effectLabel : 'Sélectionner une technologie dans l’atelier.',
          actionPayload: nextTech ? { kind: 'START_RESEARCH', techId: nextTech.id } : undefined,
          opensAtelier: nextTech ? undefined : 'TECH_COLONISTS',
        },
        {
          id: 'act-res-probe',
          pillar: 'RESEARCH',
          iconKey: 'CPU',
          title: 'Module Sonde & Calcul',
          badge: scienceShip ? `${scienceShip.name}` : 'Sonde 3D',
          description: 'Installer un module utilitaire ou de calcul sur la flotte scientifique.',
          opensAtelier: 'FLEET_ARMORY',
        },
        {
          id: 'act-res-gear',
          pillar: 'RESEARCH',
          iconKey: 'WRENCH',
          title: toolTier < 3 ? `Outils Colons T${toolTier + 1}` : 'Dotation Colons Max',
          badge: `Palier T${toolTier}/3`,
          description: 'Améliore le rendement d’extraction des équipes coloniales.',
          disabled: toolTier >= 3,
          actionPayload:
            toolTier < 3
              ? { kind: 'UPGRADE_COLONIST_GEAR', gearSlot: 'toolTier' }
              : undefined,
        },
        {
          id: 'act-res-dossier',
          pillar: 'RESEARCH',
          iconKey: 'SPARKLES',
          title: 'Dossier Technique C3',
          badge: expandableDistrict ? 'Extension / Audit' : 'Ingénierie',
          description: expandableDistrict
            ? `Étendre ${expandableDistrict.name} (${expandableDistrict.modulesCount}/3) ou lancer une étude.`
            : 'Ouvrir un dossier technique prioritaire.',
          actionPayload: expandableDistrict
            ? { kind: 'GRAFT_MODULE', districtId: expandableDistrict.id }
            : undefined,
          generatesSynthClass: expandableDistrict ? undefined : 'C3',
        },
      ],
    },
    {
      id: 'MILITARY',
      title: 'Militaire',
      subtitle: 'Armement vaisseaux, garnison, cyber et conquête',
      statusPill: `${ships.length} vaisseaux · Puiss. ${fleetTotals.totalFirepower}`,
      items: [
        {
          id: 'act-mil-armory',
          pillar: 'MILITARY',
          iconKey: 'ROCKET',
          title: 'Armer & Construire Vaisseau',
          badge: `${fleetTotals.totalModulesFitted} modules`,
          description: primaryShip
            ? `Armurerie 12 modules, refit et chantier orbital (${primaryShip.name}).`
            : 'Configurer l’armement et la flotte orbitale.',
          opensAtelier: 'FLEET_ARMORY',
        },
        {
          id: 'act-mil-recruit',
          pillar: 'MILITARY',
          iconKey: 'SHIELD',
          title: 'Recruter +3 Infanterie Exo',
          badge: `${state.militaryRoster.reduce((a, u) => a + u.count, 0)} unités`,
          description: 'Renforce les garnisons avant un déploiement tactique.',
          actionPayload: { kind: 'RECRUIT_UNIT', unitClass: 'INFANTRY_EXO', level: 1 },
        },
        {
          id: 'act-mil-combat',
          pillar: 'MILITARY',
          iconKey: 'SWORDS',
          title: `Assaut Secteur #${targetTile}`,
          badge: `4 Phases · +${fleetTotals.totalFirepower}`,
          description: 'Ordre de conquête combinant flotte orbitale et unités au sol.',
          actionPayload: { kind: 'LAUNCH_COMBAT', targetTileIndex: targetTile },
        },
        {
          id: 'act-mil-cyber',
          pillar: 'MILITARY',
          iconKey: 'CROSSHAIR',
          title: primaryRival ? `Cyber-Frappe · ${primaryRival.name}` : 'Opérations & Drones',
          badge: `Calcul ${state.resources.compute}`,
          description: 'Neutraliser les défenses adverses ou réaffecter les escadrilles.',
          actionPayload: primaryRival
            ? { kind: 'CYBER_PARALYSIS', rivalId: primaryRival.id }
            : undefined,
          opensAtelier: primaryRival ? undefined : 'MILITARY_OPS',
        },
      ],
    },
    {
      id: 'DIPLOMATIC',
      title: 'Diplomatique',
      subtitle: 'Super-Alliance, traités bilatéraux, accords & banque',
      statusPill: `Alliance ${state.superAllianceTrust}% · Rang #${state.superAllianceRank}`,
      items: [
        {
          id: 'act-dip-alliance',
          pillar: 'DIPLOMATIC',
          iconKey: 'GLOBE',
          title: 'Sommet Super-Alliance',
          badge: '+6% Confiance',
          description: 'Consolide votre mandat fédéral et débloque des dotations.',
          actionPayload: { kind: 'DIPLOMATIC_INITIATIVE', mode: 'ALLIANCE_PACT' },
        },
        {
          id: 'act-dip-detente',
          pillar: 'DIPLOMATIC',
          iconKey: 'HANDSHAKE',
          title: primaryRival ? `Détente : ${primaryRival.name}` : 'Traité Bilatéral',
          badge: primaryRival ? `Rel. ${primaryRival.relationWithPlayer}` : '+14 Rel.',
          description: 'Améliore les relations diplomatiques et apaise les frontières.',
          disabled: !primaryRival,
          actionPayload: primaryRival
            ? {
                kind: 'DIPLOMATIC_INITIATIVE',
                mode: 'RIVAL_DETENTE',
                rivalId: primaryRival.id,
              }
            : undefined,
        },
        {
          id: 'act-dip-trade',
          pillar: 'DIPLOMATIC',
          iconKey: 'COINS',
          title: 'Accord Commercial & Marché',
          badge: '-12 Mat. → +95 Cr',
          description: 'Échange bilatéral de matériaux ou ouverture du marché & banque.',
          actionPayload: {
            kind: 'DIPLOMATIC_INITIATIVE',
            mode: 'TRADE_ACCORD',
            rivalId: primaryRival?.id,
          },
        },
        {
          id: 'act-dip-politics',
          pillar: 'DIPLOMATIC',
          iconKey: 'SCALE',
          title: 'Dossier Politique & Banque',
          badge: 'C1 · Trésorerie',
          description: 'Arbitrer un dossier civique C1 ou ajuster vos échanges.',
          opensAtelier: 'DIPLOMACY_MARKET',
        },
      ],
    },
  ];
}
