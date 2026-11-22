import {
  DocSyncPatchProposalSchema,
  DriveDocItemSchema,
  type DocSyncPatchProposal,
  type DriveDocItem,
} from '../contracts/doc-sync.schema.ts';
import { err, ok, type ExwResult } from '../contracts/trigger-bus.schema.ts';
import { getWorkspaceAccessToken } from '../services/firebase/firebase-client.ts';

/**
 * [L5 — STRICTLY ISOLATED GOOGLE DRIVE & DOCS SERVICE]
 * Zero imports from src/core/, src/systems/, src/engine3d/, or src/pipelines/.
 * Uses in-memory OAuth access token only. Every write requires explicit UI confirmation.
 */
function requireAccessToken(): ExwResult<string> {
  const token = getWorkspaceAccessToken();
  if (!token) {
    return err(
      'EXW_ERR_DOC_SYNC',
      'Autorisation Google Drive & Docs requise. Cliquez sur « Connecter Drive & Docs ».',
    );
  }
  return ok(token);
}

export async function listProjectDriveFiles(searchTerm: string): Promise<ExwResult<DriveDocItem[]>> {
  const [tokenErr, token] = requireAccessToken();
  if (tokenErr || !token) return err(tokenErr?.code ?? 'EXW_ERR_DOC_SYNC', tokenErr?.message ?? 'Non connecté.');

  const safeTerm = searchTerm.trim().replace(/'/g, "\\'");
  const queryParts = ['trashed = false'];
  if (safeTerm.length > 0) {
    queryParts.push(`name contains '${safeTerm}'`);
  }
  const q = encodeURIComponent(queryParts.join(' and '));
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=20&fields=files(id,name,mimeType,modifiedTime,webViewLink)`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return err('EXW_ERR_DOC_SYNC', `Google Drive HTTP ${res.status}. Vérifiez vos droits OAuth.`);
    }
    const json = (await res.json()) as { files?: unknown[] };
    const parsed: DriveDocItem[] = [];
    for (const item of json.files ?? []) {
      const check = DriveDocItemSchema.safeParse(item);
      if (check.success) parsed.push(check.data);
    }
    return ok(parsed);
  } catch (error) {
    return err('EXW_ERR_DOC_SYNC', error instanceof Error ? error.message : 'Erreur réseau Drive.');
  }
}

export async function readGoogleDocContent(
  documentId: string,
): Promise<ExwResult<{ title: string; text: string }>> {
  const [tokenErr, token] = requireAccessToken();
  if (tokenErr || !token) return err(tokenErr?.code ?? 'EXW_ERR_DOC_SYNC', tokenErr?.message ?? 'Non connecté.');

  try {
    const res = await fetch(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return err('EXW_ERR_DOC_SYNC', `Google Docs HTTP ${res.status} (sélectionnez un Google Doc natif).`);
    }
    const docJson = (await res.json()) as {
      title?: string;
      body?: {
        content?: Array<{
          paragraph?: {
            elements?: Array<{ textRun?: { content?: string } }>;
          };
        }>;
      };
    };

    const chunks: string[] = [];
    for (const block of docJson.body?.content ?? []) {
      for (const el of block.paragraph?.elements ?? []) {
        if (el.textRun?.content) chunks.push(el.textRun.content);
      }
    }

    return ok({
      title: docJson.title ?? 'Document sans titre',
      text: chunks.join(''),
    });
  } catch (error) {
    return err('EXW_ERR_DOC_SYNC', error instanceof Error ? error.message : 'Erreur lecture Google Docs.');
  }
}

export async function appendConfirmedPatchToGoogleDoc(
  rawProposal: DocSyncPatchProposal,
): Promise<ExwResult<{ revisionNote: string }>> {
  const [tokenErr, token] = requireAccessToken();
  if (tokenErr || !token) return err(tokenErr?.code ?? 'EXW_ERR_DOC_SYNC', tokenErr?.message ?? 'Non connecté.');

  const parsed = DocSyncPatchProposalSchema.safeParse(rawProposal);
  if (!parsed.success) {
    return err('EXW_ERR_SCHEMA', 'Proposition de mise à jour documentaire invalide.');
  }
  const proposal = parsed.data;
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const formattedBlock = `\n[${proposal.fupTag} · ${stamp} UTC · ${proposal.targetSection}]\n${proposal.appendText.trim()}\n`;

  try {
    const res = await fetch(
      `https://docs.googleapis.com/v1/documents/${encodeURIComponent(proposal.documentId)}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                endOfSegmentLocation: { segmentId: '' },
                text: formattedBlock,
              },
            },
          ],
        }),
      },
    );
    if (!res.ok) {
      return err('EXW_ERR_DOC_SYNC', `Échec batchUpdate HTTP ${res.status}.`);
    }
    return ok({
      revisionNote: `Mise à jour ${proposal.fupTag} ajoutée avec succès dans « ${proposal.documentTitle} ».`,
    });
  } catch (error) {
    return err('EXW_ERR_DOC_SYNC', error instanceof Error ? error.message : 'Erreur écriture Google Docs.');
  }
}

export async function uploadContextFileToDrive(input: {
  readonly fileName: string;
  readonly mimeType: string;
  readonly content: string;
}): Promise<ExwResult<{ fileId: string; webViewLink: string }>> {
  const [tokenErr, token] = requireAccessToken();
  if (tokenErr || !token) return err(tokenErr?.code ?? 'EXW_ERR_DOC_SYNC', tokenErr?.message ?? 'Non connecté.');

  const boundary = 'exo_ctx_boundary_2050';
  const metadata = JSON.stringify({
    name: input.fileName.slice(0, 120),
    mimeType: input.mimeType,
  });
  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${metadata}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${input.mimeType}; charset=UTF-8\r\n\r\n` +
    `${input.content}\r\n` +
    `--${boundary}--`;

  try {
    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      },
    );
    if (!res.ok) {
      return err('EXW_ERR_DOC_SYNC', `Échec export Drive HTTP ${res.status}.`);
    }
    const data = (await res.json()) as { id?: string; webViewLink?: string };
    return ok({
      fileId: data.id ?? '',
      webViewLink: data.webViewLink ?? '',
    });
  } catch (error) {
    return err('EXW_ERR_DOC_SYNC', error instanceof Error ? error.message : 'Erreur export Drive.');
  }
}
