import { create } from 'zustand';
import type { WorldState } from '../contracts/world-state.schema.ts';
import type { CameraScale } from '../contracts/render-bridge.schema.ts';
import type { AiPersonality } from '../contracts/v4-systems.schema.ts';
import {
  UiThemeStudioConfigSchema,
  type ThemePresetId,
  type UiThemeStudioConfig,
} from '../contracts/ui-theme.schema.ts';
import { createInitialWorldState } from '../core/loop/cycle-orchestrator.ts';
import {
  getLatestLocalCampaign,
  loadLocalCampaign,
  saveLocalCampaign,
} from '../services/saves/local-saves.service.ts';
import { migrateWorldStateV3ToV4 } from '../services/persistence/save-migration.service.ts';
import {
  DEFAULT_UI_THEME_STUDIO_CONFIG,
  getThemePreset,
  UI_THEME_STORAGE_KEY,
} from '../data/ui-themes.catalog.ts';
import type {
  PlanetBiomeId,
  PlanetClimateId,
  PlanetReliefId,
} from '../data/world.catalog.ts';
import { PLANET_BIOME_PROFILES_CATALOG } from '../data/world.catalog.ts';
import {
  COLONY_SPECIALIZATIONS_CATALOG,
  GOVERNMENT_TYPES_CATALOG,
  LANDING_SITES_CATALOG,
  SUGGESTION_LEXICON_BANKS,
} from '../data/campaign-genesis.catalog.ts';
import {
  AI_PERSONALITIES_CATALOG,
  INITIAL_FLEET_SHIPS,
  resolveSuperpowerV4,
  SUPERPOWERS_V4_CATALOG,
} from '../data/v4-catalog.data.ts';
import { resolveDeterministicCombat } from '../systems/combat-conquest/combat-engine.ts';
import { createDefaultHkProgress } from '../systems/geopolitics/humankind-progression.ts';
import { ensureZeroPaOption } from '../systems/turn-orchestration/turn-gate-v4.ts';

/**
 * [L6] EXW.L6.GAME_STORE | v4.0.0-rc.1 | SADT A0 / A5.1
 * Zustand Store owning canonical WorldState v4.0, AI Co-pilot config,
 * v3.1->v4.0 auto-migration, and 7-screen EXO-SHELL state machine.
 */
export type ExoScreenId =
  | 'EXO_BOOT'
  | 'EXO_AUTH'
  | 'EXO_MAIN_MENU'
  | 'EXO_NEW_SIMULATION'
  | 'EXO_SETTINGS'
  | 'EXO_BRIEFING_LOBBY'
  | 'EXO_GAME_SCREEN';

export type SimulationSpeed = 0 | 1 | 2 | 4;

export interface AudioSettings {
  readonly muted: boolean;
  readonly volume: number;
  readonly stationId: string;
}

export interface GraphicsSettings {
  readonly lowPowerMode: boolean;
  readonly themeMode: 'DARK_BENTO' | 'LIGHT_ANNO';
  readonly layoutMode: 'AUTO' | 'MOBILE' | 'DESKTOP';
  readonly dynamicSvgBackdrop: boolean;
}

export interface DraftCampaignConfig {
  superpowerId: string;
  doctrineId: string;
  worldSeed: number;
  mode: 'CAMPAIGN' | 'INFINITE_SANDBOX';
  aiPersonaName: string;
  aiPersonality: AiPersonality;
  aiAdaptability: boolean;
  enabledExtensions: string[];
  skipGeneseAct0: boolean;
  biomeId: PlanetBiomeId;
  oceanCoveragePct: number;
  relief: PlanetReliefId;
  climate: PlanetClimateId;
  planetName: string;
  governmentTypeId: string;
  leaderName: string;
  capitalName: string;
  fleetName: string;
  landingSiteId: string;
  startingSpecializationId: string;
  rivalCount: number;
  difficultyPreset: 'EXPLORATEUR' | 'COMMANDANT' | 'STRATEGE';
  resourceAbundance: 'SOBRE' | 'EQUILIBRE' | 'ABONDANT';
  initialDiplomaticTension: 'DETENDUE' | 'EQUILIBREE' | 'TENDUE';
}

export interface ExoStoreState {
  screen: ExoScreenId;
  previousScreen: ExoScreenId;
  paused: boolean;
  speed: SimulationSpeed;
  world: WorldState;
  hasActiveCampaign: boolean;
  migrationNotice: string | null;
  draftConfig: DraftCampaignConfig;
  audio: AudioSettings;
  graphics: GraphicsSettings;
  uiTheme: UiThemeStudioConfig;
  oracleEnabled: boolean;
  setScreen: (screen: ExoScreenId) => void;
  setPaused: (paused: boolean) => void;
  setSpeed: (speed: SimulationSpeed) => void;
  setWorld: (world: WorldState) => void;
  setActiveScale: (scale: CameraScale) => void;
  setActiveSlot: (slotIndex: number) => void;
  updateDraftConfig: (patch: Partial<DraftCampaignConfig>) => void;
  randomizeDraftCampaign: () => void;
  startNewCampaign: () => void;
  resumeCampaign: () => boolean;
  loadCampaignState: (loaded: WorldState) => void;
  loadLocalCampaignById: (campaignId: string) => boolean;
  saveCurrentCampaignLocal: () => void;
  continueInfiniteSandbox: () => void;
  updateAudio: (patch: Partial<AudioSettings>) => void;
  updateGraphics: (patch: Partial<GraphicsSettings>) => void;
  updateUiTheme: (patch: Partial<UiThemeStudioConfig>) => void;
  selectThemePreset: (presetId: ThemePresetId) => void;
  resetUiTheme: () => void;
  setOracleEnabled: (enabled: boolean) => void;
}

function syncBodyDataset(screen: ExoScreenId, paused: boolean, victoryState: WorldState['victoryState']): void {
  if (typeof document === 'undefined') return;
  if (screen !== 'EXO_GAME_SCREEN') {
    document.body.dataset.state = 'title';
  } else if (victoryState !== 'ACTIVE') {
    document.body.dataset.state = 'gameover';
  } else if (paused) {
    document.body.dataset.state = 'paused';
  } else {
    document.body.dataset.state = 'playing';
  }
}

function hydrateV4World(base: WorldState, cfg?: Partial<DraftCampaignConfig>): WorldState {
  const sp = resolveSuperpowerV4(base.superpowerId);
  const act0Done = cfg?.skipGeneseAct0 ?? false;
  return {
    ...base,
    superpowerId: sp.id,
    superAllianceName: sp.allianceName,
    mode: cfg?.mode ?? base.mode,
    activeDossiers: base.activeDossiers.slice(0, 3).map(ensureZeroPaOption),
    colonists: base.colonists.map((c) => ({
      ...c,
      health: c.health ?? 88,
      happiness: c.happiness ?? c.morale,
      level: c.level ?? 1,
      xp: c.xp ?? 20,
      gear: c.gear ?? { outfitTier: 1, toolTier: 1, weaponTier: 1 },
    })),
    aiPersona: base.aiPersona ?? {
      name: cfg?.aiPersonaName?.trim() || 'AURA-2050',
      personality: cfg?.aiPersonality ?? 'ANALYTIQUE',
      adaptability: cfg?.aiAdaptability ?? true,
      driftCounter: 0,
    },
    spectra: base.spectra ?? {
      ecologyVsIndustry: 10,
      federalVsSovereign: 0,
      openScienceVsCyberControl: 5,
      civicWelfareVsEfficiency: 10,
    },
    terra: base.terra ?? {
      atmo: base.atmosphereProgress,
      hydro: 22,
      bio: 16,
      radShield: 28,
      compositeScore: base.atmosphereProgress,
    },
    promises: base.promises ?? [],
    hk: base.hk ?? createDefaultHkProgress(sp.id),
    genese: base.genese ?? {
      act0Completed: act0Done,
      expertBypass: act0Done,
      hudStage: act0Done ? 4 : 1,
      foundingChoiceId: act0Done ? 'genese-biosphere' : null,
      nextArrivalCycle: 4,
      completedCalEventIds: [],
    },
    colonistGear: base.colonistGear ?? { outfitTier: 1, toolTier: 1, weaponTier: 1 },
    fleetShips: (base.fleetShips ?? INITIAL_FLEET_SHIPS).map((ship) => ({
      ...ship,
      maxSlots: ship.maxSlots ?? 4,
      loadout: Array.isArray(ship.loadout) ? [...ship.loadout] : [],
    })),
    livingCatalog: base.livingCatalog ?? { recentCodes: [], lastThreeTurnsCodes: [], totalGenerated: 0 },
    lastTurnSummary: base.lastTurnSummary ?? null,
    turn_snapshots:
      base.turn_snapshots && base.turn_snapshots.length > 0
        ? base.turn_snapshots
        : (() => {
            const [, vanguard] = resolveDeterministicCombat(
              {
                orderId: `ord-vanguard-c0-${base.worldSeed}`,
                targetZoneId: 'zone-12',
                targetZoneName: 'Crête d’Atterrissage #12 (Avant-garde)',
                defenderFactionId: base.rivals[0]?.id ?? 'rival-orbit',
                biome: 'CANYON',
                atmosphereTier: base.atmosphereTier,
                attackerComputeSurplus: Math.max(65, base.resources.compute),
                defenderComputeDefense: 28,
                orbitalSupportLevel: 2,
                attackers: base.militaryRoster,
                defenders: [
                  {
                    id: 'vanguard-def-1',
                    unitClass: 'DRONE_SWARM',
                    level: 1,
                    count: 8,
                    basePower: 9,
                    armor: 0.15,
                    supplyFactor: 1,
                  },
                ],
              },
              base.worldSeed,
              0,
            );
            const reports = vanguard
              ? [vanguard, ...base.combatReports]
              : [...base.combatReports];
            return [
              {
                id: `snap-c0-${base.stateHash.slice(0, 8)}`,
                campaignId: base.campaignId,
                cycle: base.cycle,
                year: base.year,
                season: base.season,
                era: base.era,
                stateHash: base.stateHash,
                combatReports: reports,
              },
            ];
          })(),
    enabledExtensions: cfg?.enabledExtensions ?? base.enabledExtensions ?? ['GENESE_2050', 'HK_STARS', 'FP_WORKFORCE', 'GEMINI_4T'],
  };
}

const DEFAULT_WORLD = hydrateV4World(
  createInitialWorldState({
    campaignId: 'exw-camp-2050',
    worldSeed: 20500409,
    superpowerId: 'eurasia-solar',
    doctrineId: 'SOLARPUNK',
    rivalCount: 5,
  }),
);

function loadMigratedInitial(): { world: WorldState | null; notice: string | null } {
  const raw = getLatestLocalCampaign();
  if (!raw) return { world: null, notice: null };
  const mig = migrateWorldStateV3ToV4(raw);
  if (mig.world) {
    return {
      world: hydrateV4World(mig.world),
      notice: mig.migrated ? 'Sauvegarde v3.1 migrée automatiquement vers v4.0 (backup exow_backup_v3 créé).' : null,
    };
  }
  return { world: null, notice: mig.warning };
}

function loadStoredUiTheme(): UiThemeStudioConfig {
  if (typeof window === 'undefined') return DEFAULT_UI_THEME_STUDIO_CONFIG;
  try {
    const raw = window.localStorage.getItem(UI_THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_UI_THEME_STUDIO_CONFIG;
    const parsed = UiThemeStudioConfigSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_UI_THEME_STUDIO_CONFIG;
  } catch {
    return DEFAULT_UI_THEME_STUDIO_CONFIG;
  }
}

const INITIAL_BOOT = loadMigratedInitial();
const INITIAL_UI_THEME = loadStoredUiTheme();

export const useExoStore = create<ExoStoreState>((set, get) => ({
  screen: 'EXO_MAIN_MENU',
  previousScreen: 'EXO_MAIN_MENU',
  paused: false,
  speed: 1,
  world: INITIAL_BOOT.world ?? DEFAULT_WORLD,
  hasActiveCampaign: INITIAL_BOOT.world !== null,
  migrationNotice: INITIAL_BOOT.notice,
  draftConfig: {
    superpowerId: 'sp-uea',
    doctrineId: 'SOLARPUNK',
    worldSeed: 20500409,
    mode: 'CAMPAIGN',
    aiPersonaName: 'AURA-2050',
    aiPersonality: 'ANALYTIQUE',
    aiAdaptability: true,
    enabledExtensions: ['GENESE_2050', 'HK_STARS', 'FP_WORKFORCE', 'GEMINI_4T'],
    skipGeneseAct0: false,
    biomeId: 'ARCHIPEL_EMERAUDE',
    oceanCoveragePct: 72,
    relief: 'EQUILIBRE',
    climate: 'TROPICAL',
    planetName: 'Nouvelle-Aurore',
    governmentTypeId: 'REPUBLIQUE_SOLAIRE',
    leaderName: 'Hélène Vance',
    capitalName: 'Port-Lumière',
    fleetName: 'Armada Aurore',
    landingSiteId: 'BAIE_AUBE',
    startingSpecializationId: 'BIOSCIENCES_AGRO',
    rivalCount: 5,
    difficultyPreset: 'COMMANDANT',
    resourceAbundance: 'EQUILIBRE',
    initialDiplomaticTension: 'EQUILIBREE',
  },
  audio: {
    muted: false, // Active by default on first user gesture (V1 user lock)
    volume: 0.35,
    stationId: 'DIRECT',
  },
  graphics: {
    lowPowerMode: false,
    themeMode: INITIAL_UI_THEME.colorScheme === 'LIGHT' ? 'LIGHT_ANNO' : 'DARK_BENTO',
    layoutMode: 'AUTO',
    dynamicSvgBackdrop: true,
  },
  uiTheme: INITIAL_UI_THEME,
  oracleEnabled: true,

  setScreen: (screen) => {
    const { paused, world, screen: currentScreen } = get();
    syncBodyDataset(screen, paused, world.victoryState);
    const nextPrev =
      screen === 'EXO_SETTINGS' || screen === 'EXO_AUTH'
        ? currentScreen !== 'EXO_SETTINGS' && currentScreen !== 'EXO_AUTH'
          ? currentScreen
          : get().previousScreen
        : 'EXO_MAIN_MENU';
    set({ screen, previousScreen: nextPrev });
  },

  setPaused: (paused) => {
    const { screen, world } = get();
    syncBodyDataset(screen, paused, world.victoryState);
    set({ paused });
  },

  setSpeed: (speed) => {
    const paused = speed === 0;
    const { screen, world } = get();
    syncBodyDataset(screen, paused, world.victoryState);
    set({ speed, paused });
  },

  setWorld: (world) => {
    const { screen, paused } = get();
    syncBodyDataset(screen, paused, world.victoryState);
    saveLocalCampaign(world);
    set({ world, hasActiveCampaign: true });
  },

  setActiveScale: (scale) => {
    const current = get().world;
    set({ world: { ...current, activeScale: scale } });
  },

  setActiveSlot: (slotIndex) => {
    const current = get().world;
    if (slotIndex < 1 || slotIndex > current.unlockedSlots) return;
    set({ world: { ...current, activeSlotIndex: slotIndex } });
  },

  updateDraftConfig: (patch) =>
    set((s) => ({ draftConfig: { ...s.draftConfig, ...patch } })),

  randomizeDraftCampaign: () => {
    const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
    const biome = pick(PLANET_BIOME_PROFILES_CATALOG);
    const sp = pick(SUPERPOWERS_V4_CATALOG);
    const gov = pick(GOVERNMENT_TYPES_CATALOG);
    const site = pick(LANDING_SITES_CATALOG);
    const spec = pick(COLONY_SPECIALIZATIONS_CATALOG);
    const ai = pick(AI_PERSONALITIES_CATALOG);
    const doctrines = ['SOLARPUNK', 'SCIENTIFIC', 'FEDERAL', 'CORPORATE', 'SECURITY'] as const;
    const difficulties = ['EXPLORATEUR', 'COMMANDANT', 'STRATEGE'] as const;
    const abundances = ['SOBRE', 'EQUILIBRE', 'ABONDANT'] as const;
    const tensions = ['DETENDUE', 'EQUILIBREE', 'TENDUE'] as const;
    const seed = Math.floor(10_000_000 + Math.random() * 89_000_000);
    const oceanJitter = Math.max(0, Math.min(90, biome.defaultOceanPct + Math.floor(Math.random() * 13) - 6));

    set((s) => ({
      draftConfig: {
        ...s.draftConfig,
        worldSeed: seed,
        biomeId: biome.id,
        oceanCoveragePct: biome.hasOcean ? oceanJitter : Math.min(25, oceanJitter),
        relief: biome.defaultRelief,
        climate: biome.defaultClimate,
        superpowerId: sp.id,
        doctrineId: pick(doctrines),
        governmentTypeId: gov.id,
        landingSiteId: site.id,
        startingSpecializationId: spec.id,
        aiPersonality: ai.id,
        planetName: pick(SUGGESTION_LEXICON_BANKS.PLANET).value,
        capitalName: pick(SUGGESTION_LEXICON_BANKS.CAPITAL).value,
        leaderName: pick(SUGGESTION_LEXICON_BANKS.LEADER).value,
        fleetName: pick(SUGGESTION_LEXICON_BANKS.FLEET).value,
        rivalCount: 3 + Math.floor(Math.random() * 3),
        difficultyPreset: pick(difficulties),
        resourceAbundance: pick(abundances),
        initialDiplomaticTension: pick(tensions),
      },
    }));
  },

  startNewCampaign: () => {
    const { draftConfig } = get();
    const sp = resolveSuperpowerV4(draftConfig.superpowerId);
    const base = createInitialWorldState({
      campaignId: `exw-${draftConfig.worldSeed}`,
      worldSeed: draftConfig.worldSeed,
      superpowerId: sp.legacyCatalogId,
      doctrineId: draftConfig.doctrineId,
      rivalCount: draftConfig.rivalCount,
      biomeId: draftConfig.biomeId,
      oceanCoveragePct: draftConfig.oceanCoveragePct,
      relief: draftConfig.relief,
      climate: draftConfig.climate,
      planetName: draftConfig.planetName,
      governmentTypeId: draftConfig.governmentTypeId,
      leaderName: draftConfig.leaderName,
      capitalName: draftConfig.capitalName,
      fleetName: draftConfig.fleetName,
      landingSiteId: draftConfig.landingSiteId,
      startingSpecializationId: draftConfig.startingSpecializationId,
      difficultyPreset: draftConfig.difficultyPreset,
      resourceAbundance: draftConfig.resourceAbundance,
      initialDiplomaticTension: draftConfig.initialDiplomaticTension,
    });
    const fresh = hydrateV4World({ ...base, superpowerId: sp.id }, draftConfig);
    saveLocalCampaign(fresh);
    syncBodyDataset('EXO_GAME_SCREEN', false, fresh.victoryState);
    set({ world: fresh, screen: 'EXO_GAME_SCREEN', paused: false, speed: 1, hasActiveCampaign: true });
  },

  resumeCampaign: () => {
    const state = get();
    const target = state.hasActiveCampaign ? state.world : loadMigratedInitial().world;
    if (!target) return false;
    syncBodyDataset('EXO_GAME_SCREEN', false, target.victoryState);
    set({ world: target, screen: 'EXO_GAME_SCREEN', paused: false, hasActiveCampaign: true });
    return true;
  },

  loadCampaignState: (loaded) => {
    const mig = migrateWorldStateV3ToV4(loaded);
    const ready = hydrateV4World(mig.world ?? loaded);
    saveLocalCampaign(ready);
    syncBodyDataset('EXO_GAME_SCREEN', false, ready.victoryState);
    set({ world: ready, screen: 'EXO_GAME_SCREEN', paused: false, hasActiveCampaign: true });
  },

  loadLocalCampaignById: (campaignId) => {
    const found = loadLocalCampaign(campaignId);
    if (!found) return false;
    const mig = migrateWorldStateV3ToV4(found);
    const ready = hydrateV4World(mig.world ?? found);
    syncBodyDataset('EXO_GAME_SCREEN', false, ready.victoryState);
    set({ world: ready, screen: 'EXO_GAME_SCREEN', paused: false, hasActiveCampaign: true });
    return true;
  },

  saveCurrentCampaignLocal: () => {
    saveLocalCampaign(get().world);
    set({ hasActiveCampaign: true });
  },

  continueInfiniteSandbox: () => {
    const current = get().world;
    const next: WorldState = {
      ...current,
      mode: 'INFINITE_SANDBOX',
      victoryState: 'ACTIVE',
      victoryReason: null,
    };
    saveLocalCampaign(next);
    syncBodyDataset('EXO_GAME_SCREEN', false, 'ACTIVE');
    set({ world: next, paused: false, hasActiveCampaign: true });
  },

  updateAudio: (patch) => set((s) => ({ audio: { ...s.audio, ...patch } })),
  updateGraphics: (patch) => set((s) => ({ graphics: { ...s.graphics, ...patch } })),
  updateUiTheme: (patch) =>
    set((s) => ({ uiTheme: { ...s.uiTheme, ...patch } })),
  selectThemePreset: (presetId) => {
    const preset = getThemePreset(presetId);
    set((s) => ({
      uiTheme: {
        ...s.uiTheme,
        presetId: preset.id,
        colorScheme:
          preset.id === 'ANNO_DAYLIGHT'
            ? 'LIGHT'
            : s.uiTheme.colorScheme === 'AUTO'
              ? 'AUTO'
              : preset.defaultColorScheme,
      },
    }));
  },
  resetUiTheme: () => set({ uiTheme: { ...DEFAULT_UI_THEME_STUDIO_CONFIG } }),
  setOracleEnabled: (oracleEnabled) => set({ oracleEnabled }),
}));
