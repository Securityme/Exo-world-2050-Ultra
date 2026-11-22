import type { SceneDiffPacket, ViewportOverlayMode } from '../contracts/render-bridge.schema.ts';
import type { WorldState } from '../contracts/world-state.schema.ts';

/**
 * [L4] FUP-007 | SM-05 | SADT A5.3 | R-15
 * Pure unidirectional projector from canonical WorldState -> SceneDiffPacket.
 */
export interface SceneProjectionOptions {
  readonly selectedTileIndex: number | null;
  readonly themeMode: 'DARK_BENTO' | 'LIGHT_ANNO';
  readonly hologramPreviewDistrict: string | null;
  readonly overlayMode?: ViewportOverlayMode;
  readonly themeAccentHex?: string;
  readonly themeAccent2Hex?: string;
}

export function projectWorldToSceneDiff(
  world: WorldState,
  opts: SceneProjectionOptions,
): SceneDiffPacket {
  const totalDrones =
    world.drones.construction + world.drones.defense + world.drones.attack + world.drones.recon;

  return {
    tick: world.tick,
    cycle: world.cycle,
    activeScale: world.activeScale,
    activeSlotIndex: world.activeSlotIndex,
    unlockedSlots: world.unlockedSlots,
    atmosphereTier: world.atmosphereTier,
    atmosphereProgress: world.atmosphereProgress,
    weatherState: world.weatherState,
    selectedTileIndex: opts.selectedTileIndex,
    capturedTiles: world.capturedTiles,
    rivalTiles: world.rivalTiles,
    activeDossierPins: world.activeDossiers.slice(0, 6).map((d) => ({
      dossierId: d.id,
      dossierClass: d.dossierClass,
      tileIndex: d.tileIndex,
      label: d.code,
    })),
    districts: world.districts,
    droneCount: totalDrones,
    themeMode: opts.themeMode,
    hologramPreviewDistrict: opts.hologramPreviewDistrict,
    overlayMode: opts.overlayMode ?? 'STANDARD',
    season: world.season,
    themeAccentHex: opts.themeAccentHex,
    themeAccent2Hex: opts.themeAccent2Hex,
  };
}
