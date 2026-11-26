import { z } from 'zod';

/**
 * [L0] FUP-007 / FUP-010 | SM-05 | SADT A5.3 | OPT-02 A+
 * Unity-First Dual-Adapter 3D Render Contract:
 * Primary: Unity 6 URP (C# / Shader Graph / Burst / IL2CPP / .jslib)
 * Web Preview Fallback: Three.js r170+ WebGL2/WebGPU (R-15).
 */
export const RenderEngineTargetSchema = z.enum(['UNITY_6_URP', 'THREEJS_WEB_PREVIEW']);

export const UnityUrpQualityPresetSchema = z.enum(['URP_MOBILE_BALANCED', 'URP_DESKTOP_AAA', 'URP_WEBGPU_HIGH']);

export const UnityUrpRenderProfileSchema = z.object({
  engineTarget: RenderEngineTargetSchema.default('UNITY_6_URP'),
  urpPipelineAsset: z.string().default('Assets/Settings/URP_ExoWorld2050_AAA.asset'),
  shaderGraphPreset: z.string().default('Assets/Shaders/SG_RayleighMie_OpenSky.shadergraph'),
  qualityPreset: UnityUrpQualityPresetSchema.default('URP_DESKTOP_AAA'),
  burstJobsEnabled: z.boolean().default(true),
  il2cppTarget: z.enum(['METAL_IOS', 'VULKAN_ANDROID', 'WEBGPU_WASM', 'DX12_DESKTOP']).default('WEBGPU_WASM'),
  jslibBridgeObject: z.string().default('ExoWorldBridge'),
  addressablesGroup: z.string().default('ExoWorld2050_Prefabs_URP'),
});

export const CameraScaleSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const AtmosphereTierSchema = z.enum(['P1', 'P2', 'P3', 'P4']);

export const ViewportOverlayModeSchema = z.enum([
  'STANDARD',
  'MAINTENANCE',
  'LOGISTICS',
  'TACTICAL',
  'BIOSPHERE',
]);

export const PlanetBiomeProfileSchema = z.enum([
  'ARCHIPEL_EMERAUDE',
  'MONDE_OCEANIQUE',
  'PANGEE_TEMPEREE',
  'CANYONS_OCRES',
  'CRYO_OCEAN',
  'VOLCANIQUE_BASALTE',
  'BIOSPHERE_FONGIQUE',
  'ALPIN_SAUVAGE',
]);

export const PlanetReliefPresetSchema = z.enum(['DOUX', 'EQUILIBRE', 'ESCARPE']);
export const PlanetClimatePresetSchema = z.enum(['TEMPERE', 'TROPICAL', 'ARIDE', 'POLAIRE']);

export const DossierPinPacketSchema = z.object({
  dossierId: z.string(),
  dossierClass: z.enum(['P0', 'C1', 'C2', 'C3', 'C4', 'C5']),
  tileIndex: z.number().int().min(0).max(71),
  label: z.string(),
});

export const CityDistrictPacketSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(['COMMAND', 'HABITAT', 'ENERGY', 'INDUSTRY', 'DATACENTER', 'BIOPARK', 'SPACEPORT']),
  level: z.number().int().min(1).max(5),
  modulesCount: z.number().int().min(0).max(3),
  integrity: z.number().min(0).max(100),
  gridX: z.number().int(),
  gridZ: z.number().int(),
});

export const CityColonistPacketSchema = z.object({
  id: z.string(),
  name: z.string(),
  specialty: z.enum(['ENGINEERING', 'AGRONOMY', 'CYBERNETICS', 'SECURITY', 'EXOBIOLOGY']),
  morale: z.number().min(0).max(100),
  fatigue: z.number().min(0).max(100),
  assignedDistrictId: z.string().nullable(),
});

export const CameraFocusTargetSchema = z.object({
  scale: CameraScaleSchema.optional(),
  targetType: z.enum(['SLOT', 'TILE', 'DISTRICT', 'COLONIST']),
  slotIndex: z.number().int().min(1).max(6).optional(),
  tileIndex: z.number().int().min(0).max(71).optional(),
  districtId: z.string().optional(),
  colonistId: z.string().optional(),
  focusNonce: z.number().int().nonnegative(),
});

export const DiplomaticArcPacketSchema = z.object({
  id: z.string(),
  fromTile: z.number().int().min(0).max(71),
  toTile: z.number().int().min(0).max(71),
  kind: z.enum(['TRADE', 'ALLY', 'EMBARGO']),
});

export const SceneDiffPacketSchema = z.object({
  tick: z.number().int().nonnegative(),
  cycle: z.number().int().nonnegative(),
  activeScale: CameraScaleSchema,
  activeSlotIndex: z.number().int().min(1).max(6),
  unlockedSlots: z.number().int().min(1).max(6),
  atmosphereTier: AtmosphereTierSchema,
  atmosphereProgress: z.number().min(0).max(100),
  weatherState: z.enum(['CLEAR', 'DUST_STORM', 'SOLAR_FLARE', 'RAIN', 'CRYO_FRONT']),
  selectedTileIndex: z.number().int().min(0).max(71).nullable(),
  capturedTiles: z.array(z.number().int().min(0).max(71)),
  rivalTiles: z.array(z.number().int().min(0).max(71)),
  activeDossierPins: z.array(DossierPinPacketSchema),
  districts: z.array(CityDistrictPacketSchema),
  colonists: z.array(CityColonistPacketSchema).optional(),
  droneCount: z.number().int().min(0),
  themeMode: z.enum(['DARK_BENTO', 'LIGHT_ANNO']),
  hologramPreviewDistrict: z.string().nullable(),
  overlayMode: ViewportOverlayModeSchema.optional(),
  season: z.enum(['PRINTEMPS', 'ETE', 'AUTOMNE', 'HIVER']).optional(),
  themeAccentHex: z.string().optional(),
  themeAccent2Hex: z.string().optional(),
  worldSeed: z.number().int().nonnegative().optional(),
  planetBiomeProfile: PlanetBiomeProfileSchema.optional(),
  oceanCoveragePct: z.number().min(0).max(95).optional(),
  planetRelief: PlanetReliefPresetSchema.optional(),
  planetClimate: PlanetClimatePresetSchema.optional(),
  cameraFocusTarget: CameraFocusTargetSchema.nullable().optional(),
  diplomaticArcs: z.array(DiplomaticArcPacketSchema).optional(),
});

export const RenderToGameEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('TILE_SELECTED'), tileIndex: z.number().int().min(0).max(71) }),
  z.object({ type: z.literal('SLOT_SELECTED'), slotIndex: z.number().int().min(1).max(6) }),
  z.object({ type: z.literal('DOSSIER_PIN_CLICKED'), dossierId: z.string() }),
  z.object({ type: z.literal('DISTRICT_CLICKED'), districtId: z.string() }),
  z.object({ type: z.literal('COLONIST_CLICKED'), colonistId: z.string() }),
  z.object({ type: z.literal('SCALE_CHANGED'), scale: CameraScaleSchema }),
]);

export type RenderEngineTarget = z.infer<typeof RenderEngineTargetSchema>;
export type UnityUrpQualityPreset = z.infer<typeof UnityUrpQualityPresetSchema>;
export type UnityUrpRenderProfile = z.infer<typeof UnityUrpRenderProfileSchema>;
export type CameraScale = z.infer<typeof CameraScaleSchema>;
export type AtmosphereTier = z.infer<typeof AtmosphereTierSchema>;
export type ViewportOverlayMode = z.infer<typeof ViewportOverlayModeSchema>;
export type PlanetBiomeProfile = z.infer<typeof PlanetBiomeProfileSchema>;
export type PlanetReliefPreset = z.infer<typeof PlanetReliefPresetSchema>;
export type PlanetClimatePreset = z.infer<typeof PlanetClimatePresetSchema>;
export type DossierPinPacket = z.infer<typeof DossierPinPacketSchema>;
export type CityDistrictPacket = z.infer<typeof CityDistrictPacketSchema>;
export type CityColonistPacket = z.infer<typeof CityColonistPacketSchema>;
export type CameraFocusTarget = z.infer<typeof CameraFocusTargetSchema>;
export type DiplomaticArcPacket = z.infer<typeof DiplomaticArcPacketSchema>;
export type SceneDiffPacket = z.infer<typeof SceneDiffPacketSchema>;
export type RenderToGameEvent = z.infer<typeof RenderToGameEventSchema>;
