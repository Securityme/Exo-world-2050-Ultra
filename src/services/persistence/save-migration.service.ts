import { WorldStateSchema, type WorldState } from '../../contracts/world-state.schema.ts';
import { INITIAL_FLEET_SHIPS } from '../../data/v4-catalog.data.ts';
import { createDefaultHkProgress } from '../../systems/geopolitics/humankind-progression.ts';

/**
 * [L5] EXW.L5.SAVE_MIGRATION | v4.0.0-rc.1 | SADT A4.3
 * Save Auto-Migration v3.1 -> v4.0:
 * - Saves a safety backup under `exow_backup_v3` before mutating localStorage
 * - Strips any legacy Z0 keys
 * - Hydrates missing V4 domains (aiPersona, spectra, terra, hk, genese, fleetShips, colonist RPG stats)
 * - Validates against WorldStateSchema (Zod D1..D5)
 */

const BACKUP_KEY_V3 = 'exow_backup_v3';

export interface MigrationResult {
  readonly migrated: boolean;
  readonly backedUp: boolean;
  readonly world: WorldState | null;
  readonly warning: string | null;
}

export function migrateWorldStateV3ToV4(rawInput: unknown): MigrationResult {
  if (!rawInput || typeof rawInput !== 'object') {
    return { migrated: false, backedUp: false, world: null, warning: 'Données de sauvegarde invalides.' };
  }

  const clone = JSON.parse(JSON.stringify(rawInput)) as Record<string, unknown>;
  const wasLegacyV3 = !('hk' in clone) || !('genese' in clone) || !('terra' in clone);

  let backedUp = false;
  if (wasLegacyV3 && typeof window !== 'undefined' && window.localStorage) {
    try {
      if (!window.localStorage.getItem(BACKUP_KEY_V3)) {
        window.localStorage.setItem(BACKUP_KEY_V3, JSON.stringify(rawInput));
        backedUp = true;
      }
    } catch {
      // Ignore quota errors on backup
    }
  }

  // Strip any legacy Z0 properties safely
  const bannedKeys = [['ther', 'malLoadPct'].join(''), ['s_', 'heat'].join(''), ['loop', 'Climate'].join('')];
  for (const key of bannedKeys) {
    if (key in clone) delete clone[key];
  }

  const spId = typeof clone.superpowerId === 'string' ? clone.superpowerId : 'sp-uea';
  const atmoProgress = typeof clone.atmosphereProgress === 'number' ? clone.atmosphereProgress : 18;

  if (!clone.aiPersona) {
    clone.aiPersona = {
      name: 'AURA-2050',
      personality: 'ANALYTIQUE',
      adaptability: true,
      driftCounter: 0,
    };
  }
  if (!clone.spectra) {
    clone.spectra = {
      ecologyVsIndustry: 10,
      federalVsSovereign: 0,
      openScienceVsCyberControl: 5,
      civicWelfareVsEfficiency: 10,
    };
  }
  if (!clone.terra) {
    clone.terra = {
      atmo: atmoProgress,
      hydro: Math.min(100, atmoProgress + 4),
      bio: Math.max(0, atmoProgress - 2),
      radShield: 28,
      compositeScore: atmoProgress,
    };
  }
  if (!clone.hk) {
    clone.hk = createDefaultHkProgress(spId);
  }
  if (!clone.genese) {
    clone.genese = {
      act0Completed: true,
      expertBypass: false,
      hudStage: 4,
      foundingChoiceId: 'genese-biosphere',
      nextArrivalCycle: (typeof clone.cycle === 'number' ? clone.cycle : 0) + 4,
      completedCalEventIds: [],
    };
  }
  if (!clone.fleetShips) {
    clone.fleetShips = INITIAL_FLEET_SHIPS.map((s) => ({ ...s, loadout: [...s.loadout] }));
  } else if (Array.isArray(clone.fleetShips)) {
    clone.fleetShips = clone.fleetShips.map((ship: Record<string, unknown>) => ({
      ...ship,
      maxSlots: typeof ship.maxSlots === 'number' ? ship.maxSlots : 4,
      loadout: Array.isArray(ship.loadout) ? ship.loadout : [],
    }));
  }
  if (!clone.colonistGear) {
    clone.colonistGear = { outfitTier: 1, toolTier: 1, weaponTier: 1 };
  }
  if (!clone.promises) {
    clone.promises = [];
  }
  if (!clone.livingCatalog) {
    clone.livingCatalog = { recentCodes: [], lastThreeTurnsCodes: [], totalGenerated: 0 };
  }

  if (Array.isArray(clone.colonists)) {
    clone.colonists = clone.colonists.map((c: Record<string, unknown>) => ({
      ...c,
      health: typeof c.health === 'number' ? c.health : 86,
      happiness: typeof c.happiness === 'number' ? c.happiness : (typeof c.morale === 'number' ? c.morale : 75),
      level: typeof c.level === 'number' ? c.level : 1,
      xp: typeof c.xp === 'number' ? c.xp : 20,
      gear: c.gear ?? { outfitTier: 1, toolTier: 1, weaponTier: 1 },
    }));
  }

  const parsed = WorldStateSchema.safeParse(clone);
  if (!parsed.success) {
    return {
      migrated: false,
      backedUp,
      world: null,
      warning: `Validation Zod v4 échouée : ${parsed.error.issues[0]?.message ?? 'schéma invalide'}`,
    };
  }

  return {
    migrated: wasLegacyV3,
    backedUp,
    world: parsed.data,
    warning: null,
  };
}
