import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CloudUpload,
  FilePlus2,
  FolderSearch,
  Save,
  Search,
  ShieldAlert,
} from 'lucide-react';
import type { DocVcsEntry, DocVcsStoreState } from '../../contracts/skills-vcs.schema.ts';
import {
  appendConfirmedPatchToGoogleDoc,
  readGoogleDocContent,
  uploadContextFileToDrive,
} from '../../doc-sync/drive-docs.service.ts';
import {
  downloadPickedDriveFileText,
  openGoogleDrivePicker,
} from '../../doc-sync/google-picker.service.ts';
import {
  connectGoogleWorkspaceDocsOAuth,
  getWorkspaceAccessToken,
} from '../../services/firebase/firebase-client.ts';
import {
  createDocsVcsDocument,
  createDocsVcsRevision,
  revertDocsVcsRevision,
} from '../../services/governance/docs-vcs.service.ts';
import type { SemverBumpKind } from '../../systems/governance/skills-vcs.engine.ts';
import { DocRevisionTimelineDiff } from './DocRevisionTimelineDiff.tsx';

interface DocsVcsLibraryPanelProps {
  readonly vcsState: DocVcsStoreState;
  readonly selectedDocId: string | null;
  readonly onSelectDocId: (docId: string) => void;
  readonly onStateChange: (next: DocVcsStoreState) => void;
}

const CATEGORIES: readonly ('ALL' | DocVcsEntry['category'])[] = [
  'ALL',
  'BLUEPRINT',
  'NORMS_NF_AFNOR',
  'SKILL_GUIDE',
  'ARCHITECTURE',
  'GAME_DESIGN',
  'OPERATIONS',
];

/**
 * [L7] EXW.L7.DOCS_VCS_LIBRARY_PANEL | v5.1.0 | <= 295 lines (R-14)
 * Strictly isolated Documentation VCS workspace:
 * - Search, category/domain filter, Markdown editor, SemVer commit, SHA timeline, Line Diff, Revert
 * - Google Drive Picker import & explicit confirm-before-write modal for Drive/Docs
 */
export function DocsVcsLibraryPanel({
  vcsState,
  selectedDocId,
  onSelectDocId,
  onStateChange,
}: DocsVcsLibraryPanelProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | DocVcsEntry['category']>('ALL');
  const [newDocMode, setNewDocMode] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<DocVcsEntry['category']>('ARCHITECTURE');
  const [newDomain, setNewDomain] = useState<DocVcsEntry['domain']>('SYSTEM');
  const [newContent, setNewContent] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [commitSummary, setCommitSummary] = useState('');
  const [bumpKind, setBumpKind] = useState<SemverBumpKind>('patch');
  const [compareRevId, setCompareRevId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [driveConfirmOpen, setDriveConfirmOpen] = useState(false);

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vcsState.docs.filter((d) => {
      if (categoryFilter !== 'ALL' && d.category !== categoryFilter) return false;
      if (!q) return true;
      return `${d.title} ${d.docId} ${d.tags.join(' ')}`.toLowerCase().includes(q);
    });
  }, [vcsState.docs, categoryFilter, search]);

  const activeDoc =
    vcsState.docs.find((d) => d.docId === selectedDocId) ?? filteredDocs[0] ?? vcsState.docs[0] ?? null;

  const docRevisions = useMemo(
    () =>
      activeDoc
        ? vcsState.revisions.filter((r) => r.docId === activeDoc.docId)
        : [],
    [vcsState.revisions, activeDoc],
  );

  const latestRev =
    docRevisions.find((r) => r.revisionId === activeDoc?.currentRevisionId) ??
    docRevisions[0] ??
    null;

  useEffect(() => {
    if (latestRev) {
      setDraftContent(latestRev.content);
      setCompareRevId(docRevisions[1]?.revisionId ?? latestRev.revisionId);
    }
  }, [activeDoc?.docId, latestRev?.revisionId]);

  const handleCreateDoc = async () => {
    if (newTitle.trim().length < 2 || newContent.trim().length < 5) {
      setStatusMsg('Renseignez un titre (min. 2 car.) et un contenu Markdown.');
      return;
    }
    setBusy(true);
    const res = await createDocsVcsDocument({
      title: newTitle.trim(),
      category: newCategory,
      domain: newDomain,
      content: newContent,
      author: 'Lead Architecte EXW',
      tags: ['VCS', newCategory],
    });
    setBusy(false);
    if (!res.ok || !res.state) {
      setStatusMsg(res.error ?? 'Échec création document.');
      return;
    }
    onStateChange(res.state);
    if (res.state.docs[0]) onSelectDocId(res.state.docs[0].docId);
    setNewDocMode(false);
    setNewTitle('');
    setNewContent('');
    setStatusMsg('Nouveau document créé et versionné (v1.0.0).');
  };

  const handleCommitRevision = async () => {
    if (!activeDoc) return;
    setBusy(true);
    const res = await createDocsVcsRevision(activeDoc.docId, {
      nextContent: draftContent,
      summary: commitSummary.trim() || `Mise à jour ${bumpKind}`,
      author: 'Lead Architecte EXW',
      bumpKind,
      source: 'LOCAL',
    });
    setBusy(false);
    if (!res.ok || !res.state) {
      setStatusMsg(res.error ?? 'Erreur commit VCS.');
      return;
    }
    onStateChange(res.state);
    setCommitSummary('');
    setStatusMsg(`Révision enregistrée pour « ${activeDoc.title} ».`);
  };

  const handleRevert = async (targetRevisionId: string) => {
    if (!activeDoc) return;
    setBusy(true);
    const res = await revertDocsVcsRevision(activeDoc.docId, targetRevisionId, 'Lead Architecte EXW');
    setBusy(false);
    if (!res.ok || !res.state) {
      setStatusMsg(res.error ?? 'Échec revert.');
      return;
    }
    onStateChange(res.state);
    setStatusMsg('Restauration non destructive effectuée (nouvelle révision REVERT créée).');
  };

  const handleImportFromDrivePicker = async () => {
    if (!activeDoc) return;
    let token = getWorkspaceAccessToken();
    if (!token) {
      const [err, payload] = await connectGoogleWorkspaceDocsOAuth();
      if (err || !payload) {
        setStatusMsg(err?.message ?? 'Connexion Google Drive requise pour importer.');
        return;
      }
      token = payload.accessToken;
    }
    setBusy(true);
    const [pickErr, picked] = await openGoogleDrivePicker({
      title: 'Importer une révision documentaire depuis Google Drive',
      accessToken: token,
    });
    if (pickErr || !picked) {
      setBusy(false);
      setStatusMsg(pickErr?.message ?? 'Import Drive annulé.');
      return;
    }
    let importedText = '';
    if (picked.mimeType === 'application/vnd.google-apps.document') {
      const [docErr, docData] = await readGoogleDocContent(picked.id);
      if (docErr || !docData) {
        setBusy(false);
        setStatusMsg(docErr?.message ?? 'Lecture Google Doc impossible.');
        return;
      }
      importedText = docData.text;
    } else {
      const [dlErr, txt] = await downloadPickedDriveFileText(picked, token);
      if (dlErr || txt === null) {
        setBusy(false);
        setStatusMsg(dlErr?.message ?? 'Téléchargement fichier impossible.');
        return;
      }
      importedText = txt;
    }
    const res = await createDocsVcsRevision(activeDoc.docId, {
      nextContent: importedText,
      summary: `Import Drive (${picked.name})`,
      author: 'Sync Google Drive',
      bumpKind: 'minor',
      source: 'DRIVE_IMPORT',
      driveFileId: picked.id,
      driveUrl: picked.url ?? null,
    });
    setBusy(false);
    if (res.ok && res.state) {
      onStateChange(res.state);
      setStatusMsg(`Révision DRIVE_IMPORT créée depuis « ${picked.name} ».`);
    } else {
      setStatusMsg(res.error ?? 'Erreur enregistrement import Drive.');
    }
  };

  const handleConfirmedDriveWrite = async () => {
    if (!activeDoc) return;
    if (!getWorkspaceAccessToken()) {
      const [err] = await connectGoogleWorkspaceDocsOAuth();
      if (err) {
        setDriveConfirmOpen(false);
        setStatusMsg(err.message);
        return;
      }
    }
    setBusy(true);
    if (activeDoc.driveFileId) {
      const [err, res] = await appendConfirmedPatchToGoogleDoc({
        documentId: activeDoc.driveFileId,
        documentTitle: activeDoc.title,
        targetSection: `VCS v${activeDoc.currentSemver}`,
        fupTag: `DOC-VCS-${activeDoc.currentSemver}`,
        appendText: draftContent.slice(0, 2000),
      });
      setBusy(false);
      setDriveConfirmOpen(false);
      setStatusMsg(err ? err.message : (res?.revisionNote ?? 'Synchronisé vers Google Docs.'));
      return;
    }
    const [upErr, upRes] = await uploadContextFileToDrive({
      fileName: `${activeDoc.docId}_v${activeDoc.currentSemver}.md`,
      mimeType: 'text/markdown',
      content: draftContent,
    });
    setBusy(false);
    setDriveConfirmOpen(false);
    setStatusMsg(
      upErr
        ? upErr.message
        : `Exporté sur Google Drive (${upRes?.fileId ?? 'OK'}) après confirmation explicite.`,
    );
  };

  return (
    <div className="space-y-3" data-testid="docs-vcs-wing">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 exo-muted-text" />
            <input
              type="search"
              data-testid="docs-vcs-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un document, tag…"
              className="min-h-[38px] w-56 rounded-lg border exo-accent-border bg-[var(--exo-surface)] pl-8 pr-3 text-xs text-[var(--exo-text)]"
            />
          </div>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`min-h-[34px] rounded-lg px-2.5 font-mono text-[10px] font-bold transition ${
                categoryFilter === cat ? 'exo-accent-chip-active' : 'exo-accent-chip'
              }`}
            >
              {cat === 'ALL' ? 'Tous' : cat}
            </button>
          ))}
        </div>

        <button
          type="button"
          data-testid="docs-vcs-new-doc-btn"
          onClick={() => setNewDocMode((v) => !v)}
          className="exo-accent-btn inline-flex min-h-[38px] items-center gap-1.5 px-3 font-mono text-[11px] font-bold"
        >
          <FilePlus2 className="h-3.5 w-3.5" />
          <span>{newDocMode ? 'Annuler création' : 'Nouveau document'}</span>
        </button>
      </div>

      {statusMsg && (
        <div className="flex items-center gap-2 rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-3 py-2 font-mono text-[11px] text-[var(--exo-text)]">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
          <span>{statusMsg}</span>
        </div>
      )}

      {newDocMode && (
        <div className="exo-bento-card space-y-2.5 p-3.5 text-xs" data-testid="docs-vcs-create-form">
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Titre du document (ex. Guide BioHealth)"
              className="min-h-[38px] rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2.5 text-xs"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as DocVcsEntry['category'])}
              className="min-h-[38px] rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2 text-xs"
            >
              {CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value as DocVcsEntry['domain'])}
              className="min-h-[38px] rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2 text-xs"
            >
              <option value="SYSTEM">SYSTEM</option>
              <option value="APP">APP</option>
              <option value="GAME_WORLD">GAME_WORLD</option>
              <option value="GAME_ETHICS">GAME_ETHICS</option>
              <option value="NARRATIVE">NARRATIVE</option>
            </select>
          </div>
          <textarea
            rows={4}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="# Titre&#10;&#10;Contenu Markdown structuré..."
            className="w-full rounded-lg border exo-accent-border bg-[var(--exo-surface)] p-2.5 font-mono text-xs"
          />
          <button
            type="button"
            disabled={busy}
            data-testid="docs-vcs-create-submit"
            onClick={() => void handleCreateDoc()}
            className="exo-accent-btn inline-flex min-h-[38px] items-center gap-1.5 px-4 font-mono text-xs font-bold"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Créer &amp; Versionner v1.0.0</span>
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[270px_1fr]">
        {/* Left List */}
        <div className="max-h-[58vh] space-y-2 overflow-y-auto pr-1">
          {filteredDocs.map((doc) => (
            <button
              key={doc.docId}
              type="button"
              data-testid={`vcs-doc-item-${doc.docId}`}
              onClick={() => onSelectDocId(doc.docId)}
              className={`w-full rounded-xl border p-2.5 text-left transition ${
                activeDoc?.docId === doc.docId
                  ? 'exo-accent-chip-active border-[var(--exo-accent)]'
                  : 'exo-accent-border bg-[var(--exo-surface)] hover:border-[var(--exo-accent)]'
              }`}
            >
              <div className="flex items-center justify-between gap-1 font-mono text-[10px]">
                <span className="font-bold exo-accent-text">v{doc.currentSemver}</span>
                <span className="exo-muted-text">{doc.category}</span>
              </div>
              <div className="mt-0.5 text-xs font-semibold text-[var(--exo-text)]">{doc.title}</div>
              <div className="mt-1 font-mono text-[9.5px] exo-muted-text">
                SHA {doc.currentContentHash.slice(0, 8)} · {doc.domain}
              </div>
            </button>
          ))}
        </div>

        {/* Right Editor + History + Diff */}
        {activeDoc && (
          <div className="space-y-3">
            <div className="exo-surface-sub space-y-2.5 rounded-xl p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-mono text-[10px] font-bold uppercase exo-accent-text">
                    {activeDoc.docId} · v{activeDoc.currentSemver} · {activeDoc.domain}
                  </div>
                  <h3 className="font-display text-sm font-bold text-[var(--exo-text)]">{activeDoc.title}</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleImportFromDrivePicker()}
                    className="exo-accent-chip inline-flex min-h-[34px] items-center gap-1 px-2.5 font-mono text-[10.5px] font-bold"
                  >
                    <FolderSearch className="h-3.5 w-3.5 exo-accent-text" />
                    <span>Importer Drive</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    data-testid="docs-vcs-drive-write-btn"
                    onClick={() => setDriveConfirmOpen(true)}
                    className="exo-accent-chip inline-flex min-h-[34px] items-center gap-1 px-2.5 font-mono text-[10.5px] font-bold"
                  >
                    <CloudUpload className="h-3.5 w-3.5 exo-accent-2-text" />
                    <span>Pousser Drive</span>
                  </button>
                </div>
              </div>

              {driveConfirmOpen && (
                <div
                  data-testid="drive-write-confirm-modal"
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-400/70 bg-amber-500/15 p-2.5 text-xs"
                >
                  <span className="inline-flex items-center gap-1.5 font-medium text-[var(--exo-text)]">
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                    Confirmer l’écriture explicite vers Google Drive / Docs pour « {activeDoc.title} » ?
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDriveConfirmOpen(false)}
                      className="exo-accent-chip min-h-[30px] px-2.5 font-mono text-[10.5px] font-bold"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleConfirmedDriveWrite()}
                      className="rounded-lg bg-emerald-600 px-3 py-1 font-mono text-[10.5px] font-bold text-white"
                    >
                      Confirmer écriture Drive
                    </button>
                  </div>
                </div>
              )}

              <textarea
                rows={7}
                data-testid="docs-vcs-editor-textarea"
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                className="w-full rounded-lg border exo-accent-border bg-[var(--exo-surface)] p-2.5 font-mono text-[11.5px] leading-relaxed text-[var(--exo-text)]"
              />

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  data-testid="docs-vcs-commit-summary"
                  value={commitSummary}
                  onChange={(e) => setCommitSummary(e.target.value)}
                  placeholder="Résumé du commit documentaire…"
                  className="min-h-[38px] flex-1 rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2.5 text-xs"
                />
                <select
                  value={bumpKind}
                  onChange={(e) => setBumpKind(e.target.value as SemverBumpKind)}
                  className="min-h-[38px] rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2 font-mono text-xs"
                >
                  <option value="patch">Patch (+0.0.1)</option>
                  <option value="minor">Minor (+0.1.0)</option>
                  <option value="major">Major (+1.0.0)</option>
                </select>
                <button
                  type="button"
                  disabled={busy}
                  data-testid="docs-vcs-commit-btn"
                  onClick={() => void handleCommitRevision()}
                  className="exo-accent-btn inline-flex min-h-[38px] items-center gap-1.5 px-3.5 font-mono text-xs font-bold"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Commiter Révision</span>
                </button>
              </div>
            </div>

            <DocRevisionTimelineDiff
              revisions={docRevisions}
              activeRevisionId={activeDoc.currentRevisionId}
              compareRevisionId={compareRevId}
              busy={busy}
              onSelectCompare={(id) => setCompareRevId(id)}
              onRevert={(id) => void handleRevert(id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
