import { z } from 'zod';

/**
 * [L0] FUP-003 / FUP-010 | SM-02 | SADT A3.1–A3.2
 * 72 Geodesic Tiles, 6 Biomes, 6 Open-Sky Worlds (zero dome R-16), and Weather States.
 */
export const GeodesicBiomeSchema = z.enum([
  'BARREN',
  'CANYON',
  'ICE_SHELF',
  'TEMPERATE',
  'HIGHLAND',
  'METROPOLIS',
]);

export const GeodesicTileSchema = z.object({
  tileIndex: z.number().int().min(0).max(71),
  slotIndex: z.number().int().min(1).max(6),
  biome: GeodesicBiomeSchema,
  elevation: z.number().min(-1).max(1),
  moisture: z.number().min(0).max(1),
  ownerFactionId: z.string().nullable(),
  hasOpenSkySettlement: z.boolean().default(false),
  scientificTag: z.string().max(80).nullable().default(null),
  garrisonStrength: z.number().int().min(0).default(0),
});

export const ExoWorldSlotSchema = z.object({
  slotIndex: z.number().int().min(1).max(6),
  name: z.string().min(2).max(64),
  archetype: z.enum(['CRUSTAL_DESERT', 'OCEANIC_SHELF', 'BASALT_RIDGE', 'CRYO_GLACIER', 'SOLAR_VALLEY', 'ORBITAL_CORE']),
  unlocked: z.boolean(),
  atmosphereTier: z.enum(['P1', 'P2', 'P3', 'P4']),
  atmosphereProgress: z.number().min(0).max(100),
});

export type GeodesicBiome = z.infer<typeof GeodesicBiomeSchema>;
export type GeodesicTile = z.infer<typeof GeodesicTileSchema>;
export type ExoWorldSlot = z.infer<typeof ExoWorldSlotSchema>;
