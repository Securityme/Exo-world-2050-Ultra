import { z } from 'zod';

/**
 * [L0 — ISOLATED GOVERNANCE DOMAIN]
 * Strictly separated from gameplay simulation (src/core/, src/systems/, src/engine3d/).
 * Used exclusively by the Google Drive & Google Docs documentation update module.
 */
export const DriveDocItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  mimeType: z.string(),
  modifiedTime: z.string().optional(),
  webViewLink: z.string().optional(),
});

export const DocSyncPatchProposalSchema = z.object({
  documentId: z.string().min(1),
  documentTitle: z.string().min(1),
  targetSection: z.string().min(1).max(120),
  fupTag: z.string().min(3).max(24),
  appendText: z.string().min(10).max(4000),
});

export type DriveDocItem = z.infer<typeof DriveDocItemSchema>;
export type DocSyncPatchProposal = z.infer<typeof DocSyncPatchProposalSchema>;
