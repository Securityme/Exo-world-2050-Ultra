import { z } from 'zod';

/**
 * [L0] V0-BOOT | ARCH-TOC-7PIVOTS × ARCH-TOC-TENSOR-6D | ISO 2145
 * Zod contract for the 7-Pivot Master Blueprint topology (P0 + P1..P7)
 * and 6-Dimensional Tensor metadata partitions.
 */
export const PivotIdSchema = z.enum(['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7']);

export const DisplayModeSchema = z.enum([
  'MODE_1_NORMAL_ETENDU',
  'MODE_2_ULTRA_DENSE_MATRICIEL',
]);

export const HolonRingSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const PivotTensorNodeSchema = z.object({
  pivot: PivotIdSchema,
  partitionLabel: z.string().min(3),
  gus3Units: z.number().int().min(1),
  masterRefs: z.array(z.enum(['CdCF', 'GDD', 'MAD', 'DAT', 'MBE', 'DMT-SW'])).min(1),
  srcLayers: z.string().min(2),
  holonRing: HolonRingSchema,
  zoomLevel: z.enum(['Z1', 'Z2', 'Z3', 'Z4']),
  maxTokensFmtM: z.number().int().min(200).max(6000),
});

export const Toc7PivotsManifestSchema = z.object({
  blueprintId: z.literal('DOC-EXW-ARCH-001'),
  docSemver: z.string().min(5),
  activeMode: DisplayModeSchema,
  totalGus3Units: z.number().int().positive(),
  fmtMTokenHardCap: z.number().int().max(20000),
  pivots: z.array(PivotTensorNodeSchema).length(8),
});

export type PivotId = z.infer<typeof PivotIdSchema>;
export type DisplayMode = z.infer<typeof DisplayModeSchema>;
export type PivotTensorNode = z.infer<typeof PivotTensorNodeSchema>;
export type Toc7PivotsManifest = z.infer<typeof Toc7PivotsManifestSchema>;
