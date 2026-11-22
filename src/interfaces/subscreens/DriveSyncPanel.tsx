import { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  FolderOpen,
  FolderSearch,
  Link2,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { GoogleSignInButton } from '../../components/GoogleSignInButton.tsx';
import type { DriveDocItem } from '../../contracts/doc-sync.schema.ts';
import {
  appendConfirmedPatchToGoogleDoc,
  listProjectDriveFiles,
  readGoogleDocContent,
} from '../../doc-sync/drive-docs.service.ts';
import {
  downloadPickedDriveFileText,
  openGoogleDrivePicker,
  type PickedDriveFile,
} from '../../doc-sync/google-picker.service.ts';
import {
  auth,
  connectGoogleWorkspaceDocsOAuth,
  getWorkspaceAccessToken,
} from '../../services/firebase/firebase-client.ts';
import { saveDriveLinkToFirestore } from '../../services/firebase/firestore-archives.service.ts';
import { useExoStore } from '../../stores/game.store.ts';

/**
 * [L7 — STRICTLY ISOLATED GOVERNANCE PANEL]
 * Handles Google Picker file selection, Google Drive browsing, Google Docs reading,
 * and explicitly confirmed documentary updates separate from gameplay runtime.
 */
export function DriveSyncPanel() {
  const campaignId = useExoStore((s) => s.world?.campaignId ?? null);
  const [connected, setConnected] = useState<boolean>(() => Boolean(getWorkspaceAccessToken()));
  const [searchTerm, setSearchTerm] = useState('EXW');
  const [files, setFiles] = useState<DriveDocItem[]>([]);
  const [pickedFile, setPickedFile] = useState<PickedDriveFile | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<{
    id: string;
    title: string;
    text: string;
    mimeType: string;
    url?: string;
  } | null>(null);
  const [fupTag, setFupTag] = useState('FUP-011');
  const [targetSection, setTargetSection] = useState('Journal d’Architecture & Contrats');
  const [appendText, setAppendText] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleConnect = async (): Promise<string | null> => {
    setBusy(true);
    setStatusMsg(null);
    const [error, payload] = await connectGoogleWorkspaceDocsOAuth();
    setBusy(false);
    if (error || !payload) {
      setStatusMsg(error?.message ?? 'Autorisation Google Drive annulée.');
      return null;
    }
    setConnected(true);
    setStatusMsg('Connexion Google Drive & Picker active (jeton en mémoire uniquement).');
    await handleSearch();
    return payload.accessToken;
  };

  const handleSearch = async () => {
    setBusy(true);
    const [error, items] = await listProjectDriveFiles(searchTerm);
    setBusy(false);
    if (error || !items) {
      setStatusMsg(error?.message ?? 'Erreur Drive.');
      return;
    }
    setFiles(items);
    setStatusMsg(`${items.length} document(s) Google Drive listés.`);
  };

  const handleOpenPicker = async () => {
    let token = getWorkspaceAccessToken();
    if (!token) {
      token = await handleConnect();
      if (!token) return;
    }
    setBusy(true);
    setStatusMsg('Ouverture de Google Picker…');
    const [pickErr, picked] = await openGoogleDrivePicker({
      title: 'Sélectionner un document ou snapshot dans Google Drive',
      accessToken: token,
    });
    if (pickErr) {
      setBusy(false);
      setStatusMsg(pickErr.message);
      return;
    }
    if (!picked) {
      setBusy(false);
      setStatusMsg('Sélection Google Picker annulée.');
      return;
    }

    setPickedFile(picked);
    setFiles((prev) =>
      prev.some((f) => f.id === picked.id)
        ? prev
        : [
            {
              id: picked.id,
              name: picked.name,
              mimeType: picked.mimeType,
              webViewLink: picked.url,
            },
            ...prev,
          ],
    );

    if (picked.mimeType === 'application/vnd.google-apps.document') {
      const [docErr, content] = await readGoogleDocContent(picked.id);
      setBusy(false);
      if (docErr || !content) {
        setStatusMsg(docErr?.message ?? 'Fichier sélectionné mais lecture impossible.');
        return;
      }
      setSelectedDoc({
        id: picked.id,
        title: content.title,
        text: content.text,
        mimeType: picked.mimeType,
        url: picked.url,
      });
      setStatusMsg(`Google Doc « ${content.title} » ouvert via Google Picker.`);
      return;
    }

    const [dlErr, text] = await downloadPickedDriveFileText(picked, token);
    setBusy(false);
    if (dlErr || text === null) {
      setSelectedDoc({
        id: picked.id,
        title: picked.name,
        text: '(Aperçu binaire indisponible — métadonnées sélectionnées via Google Picker)',
        mimeType: picked.mimeType,
        url: picked.url,
      });
      setStatusMsg(`Fichier « ${picked.name} » sélectionné via Google Picker.`);
      return;
    }

    setSelectedDoc({
      id: picked.id,
      title: picked.name,
      text,
      mimeType: picked.mimeType,
      url: picked.url,
    });
    setStatusMsg(`Fichier « ${picked.name} » importé via Google Picker (${text.length} caractères).`);
  };

  const handleLinkPickedToCampaign = async () => {
    if (!pickedFile || !campaignId) return;
    setBusy(true);
    const [linkErr] = await saveDriveLinkToFirestore(campaignId, pickedFile);
    setBusy(false);
    if (linkErr) {
      setStatusMsg(linkErr.message);
      return;
    }
    setStatusMsg(`Référence « ${pickedFile.name} » enregistrée dans Firestore pour cette campagne.`);
  };

  const handleReadDoc = async (item: DriveDocItem) => {
    setBusy(true);
    const [error, content] = await readGoogleDocContent(item.id);
    setBusy(false);
    if (error || !content) {
      setStatusMsg(error?.message ?? 'Lecture impossible.');
      return;
    }
    setSelectedDoc({
      id: item.id,
      title: content.title,
      text: content.text,
      mimeType: item.mimeType,
      url: item.webViewLink,
    });
  };

  const handleConfirmWrite = async () => {
    if (!selectedDoc) return;
    setBusy(true);
    const [error, res] = await appendConfirmedPatchToGoogleDoc({
      documentId: selectedDoc.id,
      documentTitle: selectedDoc.title,
      targetSection,
      fupTag,
      appendText,
    });
    setBusy(false);
    setConfirmOpen(false);
    if (error || !res) {
      setStatusMsg(error?.message ?? 'Écriture annulée.');
      return;
    }
    setAppendText('');
    setStatusMsg(res.revisionNote);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-300 bg-rose-50/90 p-3 dark:border-rose-500/40 dark:bg-rose-950/30">
        <div className="flex items-start gap-2.5 text-xs text-rose-950 dark:text-rose-100">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <div>
            <p className="font-semibold text-rose-900 dark:text-rose-200">
              Enclave Documentaire Isolée (Google Picker, Drive &amp; Docs)
            </p>
            <p className="text-rose-800/80 dark:text-rose-200/80">
              Parcourez vos fichiers avec Google Picker. Jeton OAuth conservé en mémoire ; aucune écriture sans validation explicite.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleOpenPicker()}
            disabled={busy}
            data-testid="google-picker-open-btn"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-rose-500 disabled:opacity-50"
          >
            <FolderSearch className="h-3.5 w-3.5" />
            <span>Ouvrir Google Picker</span>
          </button>
          {!connected ? (
            <GoogleSignInButton label="Connecter Drive & Docs" onClick={() => void handleConnect()} disabled={busy} />
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Drive / Picker prêts
            </span>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className="rounded-lg border border-rose-200 bg-white/90 px-3 py-2 font-mono text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          {statusMsg}
        </div>
      )}

      {pickedFile && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-fuchsia-300/70 bg-fuchsia-50/75 px-3 py-2 text-xs dark:border-fuchsia-800/60 dark:bg-fuchsia-950/30">
          <div className="min-w-0">
            <div className="font-semibold text-fuchsia-950 dark:text-fuchsia-100">
              Sélection Google Picker : {pickedFile.name}
            </div>
            <div className="font-mono text-[10.5px] text-fuchsia-800/80 dark:text-fuchsia-300/80">
              ID: {pickedFile.id} · {pickedFile.mimeType}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pickedFile.url && (
              <a
                href={pickedFile.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-fuchsia-300 bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-fuchsia-900 hover:border-fuchsia-500 dark:border-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-100"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Ouvrir</span>
              </a>
            )}
            {campaignId && auth.currentUser && (
              <button
                type="button"
                onClick={() => void handleLinkPickedToCampaign()}
                disabled={busy}
                className="exo-accent-btn inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold disabled:opacity-50"
              >
                <Link2 className="h-3 w-3" />
                <span>Lier à la campagne</span>
              </button>
            )}
          </div>
        </div>
      )}

      {connected && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-rose-200 bg-white/85 p-3 dark:border-rose-900/60 dark:bg-rose-950/25">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtre dossier Drive (ex: EXW)"
                className="min-h-[40px] flex-1 rounded-lg border border-rose-200 bg-white px-3 text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-50"
              />
              <button
                type="button"
                onClick={() => void handleSearch()}
                disabled={busy}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-500"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Lister
              </button>
            </div>
            <div className="max-h-60 space-y-1.5 overflow-y-auto">
              {files.length === 0 ? (
                <p className="py-4 text-center text-xs text-rose-900/65 dark:text-rose-200/70">
                  Lancez une recherche ou cliquez sur « Ouvrir Google Picker » pour sélectionner un document Drive.
                </p>
              ) : (
                files.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => void handleReadDoc(f)}
                    className="flex w-full items-center justify-between rounded-lg border border-rose-200/80 bg-rose-50/50 px-3 py-2 text-left text-xs hover:border-rose-500 dark:border-rose-900/60 dark:bg-rose-950/40"
                  >
                    <span className="flex items-center gap-2 truncate text-[#1f1224] dark:text-rose-100">
                      {f.mimeType.includes('folder') ? (
                        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                      )}
                      <span className="truncate">{f.name}</span>
                    </span>
                    <span className="ml-2 shrink-0 font-mono text-[10px] text-rose-600 dark:text-rose-300">Lire</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-rose-200 bg-white/85 p-3 dark:border-rose-900/60 dark:bg-rose-950/25">
            {selectedDoc ? (
              <>
                <div className="font-display text-sm font-semibold text-rose-700 dark:text-rose-300">{selectedDoc.title}</div>
                <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded border border-rose-200 bg-rose-50/40 p-2 font-mono text-[11px] text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-100">
                  {selectedDoc.text.slice(0, 1400) || '(Document vide)'}
                </pre>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={fupTag}
                    onChange={(e) => setFupTag(e.target.value)}
                    placeholder="Référence note"
                    className="rounded border border-rose-200 bg-white px-2.5 py-1.5 text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-50"
                  />
                  <input
                    value={targetSection}
                    onChange={(e) => setTargetSection(e.target.value)}
                    placeholder="Section cible"
                    className="rounded border border-rose-200 bg-white px-2.5 py-1.5 text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-50"
                  />
                </div>
                <textarea
                  rows={3}
                  value={appendText}
                  onChange={(e) => setAppendText(e.target.value)}
                  placeholder="Note de mise à jour documentaire à proposer (min. 10 caractères)..."
                  className="w-full rounded border border-rose-200 bg-white p-2 text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-50"
                />
                {!confirmOpen ? (
                  <button
                    type="button"
                    disabled={appendText.trim().length < 10 || busy}
                    onClick={() => setConfirmOpen(true)}
                    className="min-h-[40px] w-full rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-40"
                  >
                    Préparer l’ajout au document (Validation requise)
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-400/60 bg-amber-50 p-2.5 dark:bg-amber-950/30">
                    <span className="text-xs text-amber-950 dark:text-amber-100">Confirmer l’écriture dans « {selectedDoc.title} » ?</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmOpen(false)}
                        className="rounded border border-rose-300 px-2.5 py-1 text-xs text-rose-900 dark:border-rose-700 dark:text-rose-100"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleConfirmWrite()}
                        disabled={busy}
                        className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                      >
                        Confirmer l’envoi
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="py-10 text-center text-xs text-rose-900/65 dark:text-rose-200/70">
                Sélectionnez un document à gauche pour inspecter son contenu ou préparer une mise à jour documentaire.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
