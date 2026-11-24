import type {
  CityColonistPacket,
  DiplomaticArcPacket,
  SceneDiffPacket,
  ViewportOverlayMode,
  CameraFocusTarget,
} from '../contracts/render-bridge.schema.ts';
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
  readonly cameraFocusTarget?: CameraFocusTarget | null;
}

export function projectWorldToSceneDiff(
  world: WorldState,
  opts: SceneProjectionOptions,
): SceneDiffPacket {
  const totalDrones =
    world.drones.construction + world.drones.defense + world.drones.attack + world.drones.recon;

  const colonists: CityColonistPacket[] = world.colonists.map((c) => ({
    id: c.id,
    name: c.name,
    specialty: c.specialty,
    morale: c.morale,
    fatigue: c.fatigue,
    assignedDistrictId: c.assignedDistrictId,
  }));

  const homeTile = world.capturedTiles[0] ?? 12;
  const activeTreaties = (world.planetaryDiplomacy?.treaties ?? []).filter(
    (t) => t.remainingCycles > 0,
  );
  const diplomaticArcs: DiplomaticArcPacket[] = activeTreaties.map((treaty, idx) => {
    const rivalIdx = world.rivals.findIndex((r) => r.id === treaty.partnerRivalId);
    const resolvedIdx = rivalIdx >= 0 ? rivalIdx : idx;
    const rivalTile =
      world.rivalTiles[resolvedIdx % Math.max(1, world.rivalTiles.length)] ??
      (homeTile + 14 + idx * 7) % 72;
    const arcKind: DiplomaticArcPacket['kind'] =
      treaty.kind === 'ORBITAL_EMBARGO'
        ? 'EMBARGO'
        : treaty.kind === 'NON_AGGRESSION' || treaty.kind === 'PLANETARY_SUMMIT'
          ? 'ALLY'
          : 'TRADE';
    return {
      id: treaty.id,
      fromTile: homeTile,
      toTile: rivalTile,
      kind: arcKind,
    };
  });

  // Add embargo/tension arcs when rival relations fall below -45
  world.rivals.forEach((r, idx) => {
    if (r.relationWithPlayer <= -45) {
      const targetTile =
        world.rivalTiles[(idx + 2) % Math.max(1, world.rivalTiles.length)] ??
        (homeTile + 23 + idx * 9) % 72;
      diplomaticArcs.push({
        id: `embargo-${r.id}`,
        fromTile: homeTile,
        toTile: targetTile,
        kind: 'EMBARGO',
      });
    }
  });

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
    colonists,
    droneCount: totalDrones,
    themeMode: opts.themeMode,
    hologramPreviewDistrict: opts.hologramPreviewDistrict,
    overlayMode: opts.overlayMode ?? 'STANDARD',
    season: world.season,
    themeAccentHex: opts.themeAccentHex,
    themeAccent2Hex: opts.themeAccent2Hex,
    worldSeed: world.worldSeed,
    planetBiomeProfile: world.planetProfile?.biomeId,
    oceanCoveragePct: world.planetProfile?.oceanCoveragePct,
    planetRelief: world.planetProfile?.relief,
    planetClimate: world.planetProfile?.climate,
    cameraFocusTarget: opts.cameraFocusTarget ?? null,
    diplomaticArcs,
  };
}
