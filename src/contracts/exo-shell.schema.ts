import { z } from 'zod';

/**
 * [L0] FUP-007 / FUP-010 | SM-01 | SADT A0
 * EXO-SHELL 8-screen state machine, audio/graphics settings & save-slot envelope contracts.
 */
export const ExoShellScreenSchema = z.enum([
  'EXO_BOOT',
  'EXO_AUTH',
  'EXO_MAIN_MENU',
  'EXO_NEW_SIMULATION',
  'EXO_SETTINGS',
  'EXO_BRIEFING_LOBBY',
  'EXO_GAME_SCREEN',
  'EXO_OUTCOME_MODAL',
]);

export const ExoSubscreenSchema = z.enum([
  'NONE',
  'WORLD_CITIES',
  'BIOSPHERE_CABINET',
  'MILITARY_COMBAT',
  'GEOPOLITICS',
  'CHRONICLE_SAVES',
  'DOC_SYNC_STUDIO',
  'BLUEPRINT_ATLAS',
]);

export const LayoutModeSchema = z.enum(['AUTO', 'MOBILE', 'DESKTOP']);

export const ShellSettingsSchema = z.object({
  audioMuted: z.boolean().default(true),
  audioVolume: z.number().min(0).max(1).default(0.45),
  stationId: z.string().min(2).max(40).default('FIP_DIRECT'),
  lowPowerMode: z.boolean().default(false),
  themeMode: z.enum(['DARK_BENTO', 'LIGHT_ANNO']).default('LIGHT_ANNO'),
  layoutMode: LayoutModeSchema.default('AUTO'),
  dynamicSvgBackdrop: z.boolean().default(true),
  oracleEnabled: z.boolean().default(true),
});

export const CampaignDraftConfigSchema = z.object({
  superpowerId: z.string().min(2).max(48),
  doctrineId: z.string().min(2).max(48),
  worldSeed: z.number().int().min(1).max(2147483647),
  rivalCount: z.number().int().min(1).max(5).default(5),
});

export type ExoShellScreen = z.infer<typeof ExoShellScreenSchema>;
export type ExoSubscreen = z.infer<typeof ExoSubscreenSchema>;
export type LayoutMode = z.infer<typeof LayoutModeSchema>;
export type ShellSettings = z.infer<typeof ShellSettingsSchema>;
export type CampaignDraftConfig = z.infer<typeof CampaignDraftConfigSchema>;
