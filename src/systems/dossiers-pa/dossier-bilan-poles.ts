import type {
  DossierOption,
  DossierSubChoice,
  RefinementLevel,
} from '../../contracts/pa-dossiers.schema.ts';
import type { Colonist } from '../../contracts/world-state.schema.ts';

/**
 * [L3 Pure] EXW.L3.DOSSIER_BILAN_POLES | v5.1.0 | SADT A2.1
 * Partitions event decision outcomes into 4 operational poles:
 * 1. Pôle Actions & Chantiers (building construction/extension, drone/cyber ops, laws, assignments)
 * 2. Pôle Économie & Ressources
 * 3. Pôle Biosphère & État Cité
 * 4. Pôle Humain, Politique & Équipe
 */

export interface BilanChip {
  readonly label: string;
  readonly positive: boolean;
}

export interface PartitionedEventBilan {
  readonly actionsPole: readonly string[];
  readonly economyPole: readonly BilanChip[];
  readonly biospherePole: readonly BilanChip[];
  readonly humanPoliticsPole: readonly BilanChip[];
}

export type ModuleExtCode = 'NONE' | 'ENERGY_BOOST' | 'STORAGE_BAY' | 'OUTPUT_CORE';

const MODULE_EXT_ACTION_LABEL: Readonly<Record<ModuleExtCode, string | null>> = {
  NONE: null,
  ENERGY_BOOST: 'Construction bâtiment : Module Panneaux Solaires (+Énergie)',
  STORAGE_BAY: 'Construction bâtiment : Entrepôt Modulaire (+Stockage)',
  OUTPUT_CORE: 'Construction bâtiment : Ligne de Production (+Rendement)',
};

function describeOptionAction(opt: DossierOption): string {
  const payload = opt.actionPayload;
  if (payload) {
    switch (payload.kind) {
      case 'GRAFT_MODULE':
        return `Chantier Bâtiment : Construction / Greffe Module (${payload.districtId})`;
      case 'BANK_LOAN':
        return `Opération Financière : Prêt Bancaire (${payload.principal} Cr)`;
      case 'MARKET_TRADE':
        return `Marché : ${payload.action === 'BUY' ? 'Achat' : 'Vente'} ${payload.quantity} ${payload.resource}`;
      case 'REASSIGN_DRONE':
        return `Opération Drone : Réaffectation ${payload.fromRole} → ${payload.toRole}`;
      case 'CYBER_PARALYSIS':
        return `Opération Cyber : Neutralisation (${payload.rivalId})`;
      case 'RECRUIT_UNIT':
        return `Recrutement Unité : ${payload.unitClass} Niv.${payload.level}`;
      case 'LAUNCH_COMBAT':
        return `Opération Tactique : Intervention secteur #${payload.targetTileIndex}`;
      case 'COMMISSION_SHIP':
        return `Chantier Spatial : Mise en cale ${payload.shipClass}`;
      case 'REFIT_SHIP':
        return `Chantier Spatial : ${payload.mode === 'REPAIR' ? 'Réparation' : 'Amélioration'} (${payload.shipId})`;
      case 'EQUIP_SHIP_MODULE':
        return `Chantier Spatial : Module ${payload.moduleId} (${payload.shipId})`;
      case 'UPGRADE_COLONIST_GEAR':
        return `Atelier Équipement : Amélioration ${payload.gearSlot}`;
      case 'START_RESEARCH':
        return `Programme R&D : Recherche ${payload.techId}`;
      case 'DIPLOMATIC_INITIATIVE':
        return `Acte Diplomatique : ${payload.mode}`;
      case 'SIGN_PLANETARY_TREATY':
        return `Traité Planétaire : ${payload.treatyKind}`;
      case 'DISPATCH_COLONIST_MISSION':
        return `Mission Terrain : ${payload.missionFocus} (${payload.colonistId})`;
      case 'REST_COLONIST':
        return `Récupération Équipe : Repos (${payload.colonistId})`;
      case 'ECCLESIA_DISCERNMENT':
        return `Discernement Éthique : Axe ${payload.axis}`;
      case 'DEFER_ACTION':
        return 'Report Tactique (0 PA) : Veille sans chantier immédiat';
    }
  }
  const lower = opt.label.toLowerCase();
  if (/constru|bâti|extens|centrale|usine|station|tour|module|quartier|biofiltre|liaison|micro-réseau/.test(lower)) {
    return `Chantier Bâtiment : ${opt.label}`;
  }
  if (/charte|loi|accord|traité|pacte|réforme|assemblée/.test(lower)) {
    return `Acte Politique / Loi : ${opt.label}`;
  }
  return `Action Exécutive : ${opt.label}`;
}

export function buildPartitionedEventBilan(
  selectedOptions: readonly DossierOption[],
  sub: DossierSubChoice | undefined,
  refinement: RefinementLevel,
  moduleExt: ModuleExtCode,
  assignedColonists: readonly Colonist[],
): PartitionedEventBilan {
  const mult = refinement === 2 ? 1.4 : refinement === 1 ? 1.2 : 1.0;
  const bx = sub?.bonusEffects;
  const scale = (v: number) => (v > 0 ? Math.round(v * mult) : v);

  const actionsPole: string[] = selectedOptions.map(describeOptionAction);
  const extAction = MODULE_EXT_ACTION_LABEL[moduleExt];
  if (extAction) actionsPole.push(extAction);
  if (sub) actionsPole.push(`Modalité : ${sub.label}`);
  for (const col of assignedColonists) {
    actionsPole.push(`Affectation : ${col.name} (${col.specialty} Niv.${col.level} · +18 XP / +12% Fat.)`);
  }

  const sum = selectedOptions.reduce(
    (acc, opt) => ({
      credits: acc.credits + scale(opt.effects.credits),
      energy: acc.energy + scale(opt.effects.energy),
      materials: acc.materials + scale(opt.effects.materials),
      water: acc.water + scale(opt.effects.water),
      food: acc.food + scale(opt.effects.food),
      compute: acc.compute + scale(opt.effects.compute),
      breathingKits: acc.breathingKits + scale(opt.effects.breathingKits),
      atmosphereDelta: acc.atmosphereDelta + scale(opt.effects.atmosphereDelta),
      maintenanceDelta: acc.maintenanceDelta + scale(opt.effects.maintenanceDelta),
      allianceTrustDelta: acc.allianceTrustDelta + scale(opt.effects.allianceTrustDelta),
      eraStarsDelta: acc.eraStarsDelta + opt.effects.eraStarsDelta,
    }),
    {
      credits: 0,
      energy: 0,
      materials: 0,
      water: 0,
      food: 0,
      compute: 0,
      breathingKits: 0,
      atmosphereDelta: 0,
      maintenanceDelta: 0,
      allianceTrustDelta: 0,
      eraStarsDelta: 0,
    },
  );

  const toChips = (rows: readonly { key: string; val: number }[]): BilanChip[] =>
    rows
      .filter((r) => r.val !== 0)
      .map((r) => ({
        label: `${r.val > 0 ? '+' : ''}${r.val}${r.key.startsWith('%') || r.key.startsWith('★') ? r.key : ` ${r.key}`}`,
        positive: r.val > 0,
      }));

  const economyPole = toChips([
    { key: 'Cr', val: sum.credits + (bx?.credits ?? 0) },
    { key: 'Énerg.', val: sum.energy + (bx?.energy ?? 0) },
    { key: 'Mat.', val: sum.materials + (bx?.materials ?? 0) },
    { key: 'Eau', val: sum.water + (bx?.water ?? 0) },
    { key: 'Vivres', val: sum.food + (bx?.food ?? 0) },
    { key: 'Calcul', val: sum.compute + (bx?.compute ?? 0) },
    { key: 'Kits O₂', val: sum.breathingKits + (bx?.breathingKits ?? 0) },
  ]);

  const biospherePole = toChips([
    { key: '% Air', val: sum.atmosphereDelta + (bx?.atmosphereDelta ?? 0) },
    { key: '% État', val: sum.maintenanceDelta + (bx?.maintenanceDelta ?? 0) },
  ]);

  const humanPoliticsPole = toChips([
    { key: '% Alliance', val: sum.allianceTrustDelta + (bx?.allianceTrustDelta ?? 0) },
    { key: '★ Ère', val: sum.eraStarsDelta },
  ]);
  if (assignedColonists.length > 0) {
    humanPoliticsPole.push({
      label: `${assignedColonists.length} coéquipier${assignedColonists.length > 1 ? 's' : ''} actif${assignedColonists.length > 1 ? 's' : ''}`,
      positive: true,
    });
  }

  return { actionsPole, economyPole, biospherePole, humanPoliticsPole };
}
