import { err, ok, type ExwResult } from '../../contracts/trigger-bus.schema.ts';
import type { FleetShip, ShipInstalledModule } from '../../contracts/v4-systems.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';
import {
  COLONIST_GEAR_UPGRADE_SPECS,
  findShipBlueprint,
  findShipModuleSpec,
  SHIP_CLASS_LABELS,
  toInstalledModule,
} from '../../data/ship-equipment.catalog.ts';
import { SHARED_TECHS_30 } from '../../data/v4-catalog.data.ts';
import { createDefaultHkProgress } from '../geopolitics/humankind-progression.ts';

/**
 * [L3] EXW.L3.SHIP_LOADOUT_ENGINE | v5.1.0 | SADT A3.3/A4.4
 * 100% Pure Deterministic Fleet Loadout, Refit, Commissioning, Colonist Gear & Research Engine.
 * Invoked exclusively by PA Engine via Event-Only Action Gateway (R-24).
 */

export interface ShipComputedStats {
  readonly firepower: number;
  readonly defense: number;
  readonly speed: number;
  readonly utilityYield: number;
  readonly combatRating: number;
  readonly slotsUsed: number;
  readonly maxSlots: number;
}

export interface FleetAggregateStats {
  readonly shipCount: number;
  readonly totalFirepower: number;
  readonly totalDefense: number;
  readonly totalSpeed: number;
  readonly totalUtilityYield: number;
  readonly totalModulesFitted: number;
  readonly totalCombatRating: number;
  readonly orbitalSupportBonus: number;
}

const BASE_CLASS_STATS: Record<
  FleetShip['shipClass'],
  { readonly firepower: number; readonly defense: number; readonly speed: number; readonly utility: number }
> = {
  SHUTTLE_CARGO: { firepower: 4, defense: 10, speed: 18, utility: 12 },
  SCIENCE_PROBE: { firepower: 6, defense: 12, speed: 24, utility: 16 },
  CORVETTE_ORBITAL: { firepower: 22, defense: 20, speed: 22, utility: 4 },
  FRIGATE_SOLAR: { firepower: 36, defense: 34, speed: 18, utility: 8 },
  COLONY_ARK: { firepower: 18, defense: 45, speed: 12, utility: 32 },
};

export function computeShipStats(ship: FleetShip): ShipComputedStats {
  const base = BASE_CLASS_STATS[ship.shipClass] ?? BASE_CLASS_STATS.SHUTTLE_CARGO;
  const levelMult = 1 + Math.max(0, ship.level - 1) * 0.22;
  const integrityFactor = Math.max(0.45, Math.min(1, ship.integrity / 100));
  const loadout: readonly ShipInstalledModule[] = ship.loadout ?? [];
  const maxSlots = ship.maxSlots ?? 4;

  let modFire = 0;
  let modDef = 0;
  let modSpd = 0;
  let modUtil = 0;
  for (const mod of loadout) {
    modFire += mod.firepower;
    modDef += mod.defense;
    modSpd += mod.speed;
    modUtil += mod.utilityYield;
  }

  const firepower = Math.round((base.firepower * levelMult + modFire) * integrityFactor);
  const defense = Math.round((base.defense * levelMult + modDef) * integrityFactor);
  const speed = Math.round((base.speed + modSpd) * Math.max(0.65, integrityFactor));
  const utilityYield = Math.round((base.utility * levelMult + modUtil) * integrityFactor);
  const combatRating = Math.round(firepower * 1.35 + defense * 0.95 + speed * 0.35);

  return {
    firepower,
    defense,
    speed,
    utilityYield,
    combatRating,
    slotsUsed: loadout.length,
    maxSlots,
  };
}

export function computeFleetTotals(ships: readonly FleetShip[]): FleetAggregateStats {
  let totalFirepower = 0;
  let totalDefense = 0;
  let totalSpeed = 0;
  let totalUtilityYield = 0;
  let totalModulesFitted = 0;
  let totalCombatRating = 0;

  for (const ship of ships) {
    const s = computeShipStats(ship);
    totalFirepower += s.firepower;
    totalDefense += s.defense;
    totalSpeed += s.speed;
    totalUtilityYield += s.utilityYield;
    totalModulesFitted += s.slotsUsed;
    totalCombatRating += s.combatRating;
  }

  const orbitalSupportBonus = Math.min(3, Math.floor(totalFirepower / 45));

  return {
    shipCount: ships.length,
    totalFirepower,
    totalDefense,
    totalSpeed,
    totalUtilityYield,
    totalModulesFitted,
    totalCombatRating,
    orbitalSupportBonus,
  };
}

export function installShipModulePure(
  state: WorldState,
  shipId: string,
  moduleId: string,
): ExwResult<{ readonly nextState: WorldState; readonly note: string }> {
  const ships = state.fleetShips ?? [];
  const ship = ships.find((s) => s.id === shipId);
  if (!ship) {
    return err('EXW_ERR_SCHEMA', 'Vaisseau introuvable dans la flotte.');
  }
  const spec = findShipModuleSpec(moduleId);
  if (!spec) {
    return err('EXW_ERR_SCHEMA', 'Module d’équipement introuvable.');
  }
  if (state.era < spec.minEra) {
    return err(
      'EXW_ERR_FINANCE_LIMIT',
      `« ${spec.name} » requiert l’Ère ${spec.minEra} (actuelle : Ère ${state.era}).`,
    );
  }

  const currentLoadout = ship.loadout ?? [];
  const maxSlots = ship.maxSlots ?? 4;
  if (currentLoadout.some((m) => m.id === spec.id)) {
    return err(
      'EXW_ERR_FINANCE_LIMIT',
      `« ${spec.name} » est déjà monté sur ${ship.name}.`,
    );
  }

  if (
    state.resources.credits < spec.costCredits ||
    state.resources.materials < spec.costMaterials ||
    state.resources.electronics < spec.costElectronics ||
    state.resources.compute < spec.costCompute
  ) {
    return err(
      'EXW_ERR_FINANCE_LIMIT',
      `Ressources insuffisantes pour « ${spec.name} » (${spec.costCredits} Cr, ${spec.costMaterials} Mat., ${spec.costElectronics} Élec.${spec.costCompute > 0 ? `, ${spec.costCompute} Calc.` : ''}).`,
    );
  }

  const installed = toInstalledModule(spec);
  let nextLoadout: ShipInstalledModule[];
  let replacedName: string | null = null;

  if (currentLoadout.length < maxSlots) {
    nextLoadout = [...currentLoadout, installed];
  } else {
    // Full bay: allow upgrading/replacing a lower-tier or oldest module of the same slot
    const replaceIdx = currentLoadout.findIndex((m) => m.slot === spec.slot && m.tier <= spec.tier);
    if (replaceIdx === -1) {
      return err(
        'EXW_ERR_FINANCE_LIMIT',
        `Toutes les baies de ${ship.name} (${currentLoadout.length}/${maxSlots}) sont occupées. Améliorez le niveau du vaisseau ou remplacez un module du même emplacement.`,
      );
    }
    replacedName = currentLoadout[replaceIdx]!.name;
    nextLoadout = currentLoadout.map((m, idx) => (idx === replaceIdx ? installed : m));
  }

  const nextShips = ships.map((s) =>
    s.id === ship.id ? { ...s, loadout: nextLoadout, maxSlots } : s,
  );

  const nextState: WorldState = {
    ...state,
    fleetShips: nextShips,
    resources: {
      ...state.resources,
      credits: state.resources.credits - spec.costCredits,
      materials: state.resources.materials - spec.costMaterials,
      electronics: state.resources.electronics - spec.costElectronics,
      compute: state.resources.compute - spec.costCompute,
    },
  };

  const note = replacedName
    ? `${spec.name} monté sur ${ship.name} (remplace ${replacedName}).`
    : `${spec.name} installé sur ${ship.name} (${nextLoadout.length}/${maxSlots} baies).`;

  return ok({ nextState, note });
}

export function getShipRefitCosts(
  ship: FleetShip,
  mode: 'REPAIR' | 'UPGRADE_LEVEL',
): { readonly credits: number; readonly materials: number; readonly electronics: number } {
  if (mode === 'REPAIR') {
    const missing = Math.max(10, Math.round(100 - ship.integrity));
    return {
      credits: 40 + Math.round(missing * 1.4),
      materials: 8 + Math.round(missing * 0.35),
      electronics: 4,
    };
  }
  const nextLv = Math.min(5, ship.level + 1);
  return {
    credits: 130 * nextLv,
    materials: 26 * nextLv,
    electronics: 10 * nextLv,
  };
}

export function refitShipPure(
  state: WorldState,
  shipId: string,
  mode: 'REPAIR' | 'UPGRADE_LEVEL',
): ExwResult<{ readonly nextState: WorldState; readonly note: string }> {
  const ships = state.fleetShips ?? [];
  const ship = ships.find((s) => s.id === shipId);
  if (!ship) {
    return err('EXW_ERR_SCHEMA', 'Vaisseau introuvable.');
  }
  if (mode === 'UPGRADE_LEVEL' && ship.level >= 5) {
    return err('EXW_ERR_FINANCE_LIMIT', `${ship.name} est déjà au Niveau maximal (Niv.5).`);
  }

  const costs = getShipRefitCosts(ship, mode);
  if (
    state.resources.credits < costs.credits ||
    state.resources.materials < costs.materials ||
    state.resources.electronics < costs.electronics
  ) {
    return err(
      'EXW_ERR_FINANCE_LIMIT',
      `Ressources insuffisantes (${costs.credits} Cr, ${costs.materials} Mat., ${costs.electronics} Élec.).`,
    );
  }

  const nextLevel = mode === 'UPGRADE_LEVEL' ? Math.min(5, ship.level + 1) : ship.level;
  const currentMaxSlots = ship.maxSlots ?? 4;
  const nextMaxSlots =
    mode === 'UPGRADE_LEVEL' && (nextLevel === 3 || nextLevel === 5)
      ? Math.min(6, currentMaxSlots + 1)
      : currentMaxSlots;

  const nextShips = ships.map((s) =>
    s.id === ship.id
      ? {
          ...s,
          level: nextLevel,
          integrity: 100,
          maxSlots: nextMaxSlots,
        }
      : s,
  );

  const nextState: WorldState = {
    ...state,
    fleetShips: nextShips,
    resources: {
      ...state.resources,
      credits: state.resources.credits - costs.credits,
      materials: state.resources.materials - costs.materials,
      electronics: state.resources.electronics - costs.electronics,
    },
  };

  const slotBonus = nextMaxSlots > currentMaxSlots ? ` (+1 baie → ${nextMaxSlots})` : '';
  const note =
    mode === 'UPGRADE_LEVEL'
      ? `${ship.name} modernisé au Niv.${nextLevel}${slotBonus} et restauré à 100%.`
      : `${ship.name} révisé et restauré à 100% d’intégrité.`;

  return ok({ nextState, note });
}

export function commissionShipPure(
  state: WorldState,
  shipClass: FleetShip['shipClass'],
  customName?: string,
): ExwResult<{ readonly nextState: WorldState; readonly note: string }> {
  const bp = findShipBlueprint(shipClass);
  const ships = state.fleetShips ?? [];
  if (ships.length >= 10) {
    return err('EXW_ERR_FINANCE_LIMIT', 'Capacité orbitale maximale atteinte (10 vaisseaux).');
  }
  if (state.era < bp.minEra) {
    return err(
      'EXW_ERR_FINANCE_LIMIT',
      `${bp.label} requiert l’Ère ${bp.minEra} (actuelle : Ère ${state.era}).`,
    );
  }
  if (
    state.resources.credits < bp.costCredits ||
    state.resources.materials < bp.costMaterials ||
    state.resources.electronics < bp.costElectronics
  ) {
    return err(
      'EXW_ERR_FINANCE_LIMIT',
      `Ressources insuffisantes pour construire « ${bp.label} » (${bp.costCredits} Cr, ${bp.costMaterials} Mat., ${bp.costElectronics} Élec.).`,
    );
  }

  const starterSpec = findShipModuleSpec(bp.defaultModuleId);
  const ordinal = ships.length + 1;
  const cleanCustom = customName?.trim();
  const shipName =
    cleanCustom && cleanCustom.length >= 2
      ? cleanCustom
      : `${SHIP_CLASS_LABELS[shipClass]} #${ordinal}`;

  const newShip: FleetShip = {
    id: `ship-${shipClass.toLowerCase()}-c${state.cycle}-${ordinal}`,
    name: shipName,
    shipClass,
    level: 1,
    integrity: 100,
    assignedRole: bp.defaultRole,
    maxSlots: bp.baseSlots,
    loadout: starterSpec ? [toInstalledModule(starterSpec)] : [],
  };

  const nextState: WorldState = {
    ...state,
    fleetShips: [...ships, newShip],
    resources: {
      ...state.resources,
      credits: state.resources.credits - bp.costCredits,
      materials: state.resources.materials - bp.costMaterials,
      electronics: state.resources.electronics - bp.costElectronics,
    },
  };

  return ok({
    nextState,
    note: `Nouveau vaisseau mis en orbite : ${newShip.name} (${bp.baseSlots} baies modulaires).`,
  });
}

export function upgradeColonistGearPure(
  state: WorldState,
  gearSlot: 'outfitTier' | 'toolTier' | 'weaponTier',
  colonistId?: string,
): ExwResult<{ readonly nextState: WorldState; readonly note: string }> {
  const spec = COLONIST_GEAR_UPGRADE_SPECS[gearSlot];
  const baseGear = state.colonistGear ?? { outfitTier: 1, toolTier: 1, weaponTier: 1 };
  const targetColonist = colonistId
    ? state.colonists.find((c) => c.id === colonistId) ?? null
    : null;

  const currentTier = targetColonist?.gear?.[gearSlot] ?? baseGear[gearSlot];
  if (currentTier >= 3) {
    return err('EXW_ERR_FINANCE_LIMIT', `${spec.label} est déjà au palier maximal (T3).`);
  }
  const nextTier = (currentTier + 1) as 2 | 3;
  const costCr = spec.costCreditsPerTier * currentTier;
  const costMat = spec.costMaterialsPerTier * currentTier;
  const costElec = spec.costElectronicsPerTier * currentTier;

  if (
    state.resources.credits < costCr ||
    state.resources.materials < costMat ||
    state.resources.electronics < costElec
  ) {
    return err(
      'EXW_ERR_FINANCE_LIMIT',
      `Ressources insuffisantes pour ${spec.label} T${nextTier} (${costCr} Cr, ${costMat} Mat., ${costElec} Élec.).`,
    );
  }

  const nextColonists = state.colonists.map((c) => {
    if (targetColonist && c.id !== targetColonist.id) return c;
    const prevGear = c.gear ?? { outfitTier: 1, toolTier: 1, weaponTier: 1 };
    const updatedTier = Math.max(prevGear[gearSlot], nextTier) as 1 | 2 | 3;
    return {
      ...c,
      morale: Math.min(100, c.morale + 4),
      gear: { ...prevGear, [gearSlot]: updatedTier },
    };
  });

  const nextColonyGear = targetColonist
    ? baseGear
    : { ...baseGear, [gearSlot]: nextTier };

  const nextState: WorldState = {
    ...state,
    colonistGear: nextColonyGear,
    colonists: nextColonists,
    resources: {
      ...state.resources,
      credits: state.resources.credits - costCr,
      materials: state.resources.materials - costMat,
      electronics: state.resources.electronics - costElec,
    },
  };

  const scopeLabel = targetColonist ? targetColonist.name : 'tous les colons';
  return ok({
    nextState,
    note: `${spec.label} amélioré en T${nextTier} pour ${scopeLabel}.`,
  });
}

export function startResearchPure(
  state: WorldState,
  techId: string,
): ExwResult<{ readonly nextState: WorldState; readonly note: string }> {
  const tech = SHARED_TECHS_30.find((t) => t.id === techId);
  if (!tech) {
    return err('EXW_ERR_SCHEMA', 'Technologie introuvable dans le catalogue.');
  }
  if (tech.era > state.era) {
    return err(
      'EXW_ERR_FINANCE_LIMIT',
      `« ${tech.name} » requiert l’Ère ${tech.era} (actuelle : Ère ${state.era}).`,
    );
  }
  const currentHk = state.hk ?? createDefaultHkProgress(state.superpowerId);
  if (currentHk.unlockedTechIds.includes(tech.id)) {
    return err('EXW_ERR_FINANCE_LIMIT', `« ${tech.name} » est déjà acquise.`);
  }

  const nextState: WorldState = {
    ...state,
    hk: {
      ...currentHk,
      activeResearchTechId: tech.id,
      researchTurnsLeft: tech.turnsBase,
    },
  };

  return ok({
    nextState,
    note: `Programme scientifique orienté sur « ${tech.name} » (${tech.turnsBase} tours).`,
  });
}
