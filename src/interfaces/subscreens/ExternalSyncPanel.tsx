import { useCallback, useEffect, useState } from 'react';
import { BookOpenCheck, CheckCircle2, ExternalLink, GitBranch, Lock, RefreshCw, Upload } from 'lucide-react';
import {
  buildFallbackExternalSyncSnapshot,
  fetchExternalSyncStatus,
  parseNotebookImportText,
  type ExternalSyncSnapshot,
  type ImportedNotebookNote,
} from '../../doc-sync/external-sync.service.ts';

const STORAGE_KEY = 'exo_notebook_imported_notes_v1';

function loadSavedNotes(): ImportedNotebookNote[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ImportedNotebookNote[]) : [];
  } catch {
    return [];
  }
}

/**
 * [L7 — EXTERNAL SSoT SYNC PANEL: GITHUB ULTRA + GEMINI NOTEBOOK]
 * Verifies live commit parity with Securityme/Exo-world-2050-Ultra and lets the user
 * open or import notes from their private Gemini Notebook.
 */
export function ExternalSyncPanel() {
  const [snapshot, setSnapshot] = useState<ExternalSyncSnapshot>(() => buildFallbackExternalSyncSnapshot());
  const [loading, setLoading] = useState(true);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [notes, setNotes] = useState<ImportedNotebookNote[]>(() => loadSavedNotes());

  const refreshSync = useCallback(async () => {
    setLoading(true);
    const [err, data] = await fetchExternalSyncStatus();
    setLoading(false);
    if (err || !data) {
      setSnapshot(buildFallbackExternalSyncSnapshot(err?.message));
      return;
    }
    setSnapshot(data);
  }, []);

  useEffect(() => {
    void refreshSync();
  }, [refreshSync]);

  const handleImportNote = () => {
    const [err, parsed] = parseNotebookImportText(noteTitle, noteBody);
    if (err || !parsed) {
      setNoteError(err?.message ?? 'Contenu invalide.');
      return;
    }
    setNoteError(null);
    const next = [parsed, ...notes].slice(0, 12);
    setNotes(next);
    setNoteTitle('');
    setNoteBody('');
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
  };

  const gh = snapshot.github;
  const nb = snapshot.geminiNotebook;
  const parityBadge =
    gh.parity === 'SYNCED'
      ? { label: 'Synchronisé (0 diff)', tone: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' }
      : gh.parity === 'REMOTE_AHEAD'
        ? { label: 'Dépôt distant en avance', tone: 'border-amber-500/50 bg-amber-500/15 text-amber-800 dark:text-amber-300' }
        : { label: 'Vérification hors-ligne', tone: 'border-rose-400/50 bg-rose-500/10 text-rose-700 dark:text-rose-300' };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="space-y-3 rounded-xl border border-rose-200 bg-white/90 p-4 dark:border-rose-900/60 dark:bg-rose-950/25">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 font-display text-sm font-bold text-[#1f1224] dark:text-rose-50">
              <GitBranch className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <span>GitHub · {gh.repoFullName}</span>
            </div>
            <p className="mt-0.5 text-xs text-rose-900/70 dark:text-rose-200/75">
              {gh.description ?? 'Dépôt public de référence EXO WORLD : 2050'}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[11px] font-semibold ${parityBadge.tone}`}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{loading ? 'Vérification…' : parityBadge.label}</span>
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-2 rounded-lg border border-rose-200/80 bg-rose-50/50 p-3 font-mono text-[11px] dark:border-rose-900/50 dark:bg-rose-950/40">
          <div>
            <dt className="text-rose-700/75 dark:text-rose-300/75">Branche</dt>
            <dd className="font-semibold text-[#1f1224] dark:text-rose-50">{gh.branch}</dd>
          </div>
          <div>
            <dt className="text-rose-700/75 dark:text-rose-300/75">Baseline locale</dt>
            <dd className="font-semibold text-[#1f1224] dark:text-rose-50">{gh.baselineSha.slice(0, 7)}</dd>
          </div>
          <div>
            <dt className="text-rose-700/75 dark:text-rose-300/75">Commit distant</dt>
            <dd className="font-semibold text-[#1f1224] dark:text-rose-50">
              {gh.remoteSha ? gh.remoteSha.slice(0, 7) : 'Indisponible'}
            </dd>
          </div>
          <div>
            <dt className="text-rose-700/75 dark:text-rose-300/75">Dernier push</dt>
            <dd className="truncate font-semibold text-[#1f1224] dark:text-rose-50">
              {gh.remoteCommitDate ? gh.remoteCommitDate.slice(0, 16).replace('T', ' ') : '—'}
            </dd>
          </div>
        </dl>

        {gh.remoteCommitMessage && (
          <p className="rounded-lg border border-rose-200/70 bg-white/80 px-3 py-2 font-mono text-[11px] text-rose-950/85 dark:border-rose-900/50 dark:bg-rose-950/35 dark:text-rose-100">
            HEAD : {gh.remoteCommitMessage}
          </p>
        )}

        {gh.errorDetail && (
          <p className="text-xs text-amber-700 dark:text-amber-300">{gh.errorDetail}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void refreshSync()}
            disabled={loading}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Vérifier GitHub</span>
          </button>
          <a
            href={gh.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 text-xs font-semibold text-rose-900 hover:border-rose-500 dark:border-rose-700 dark:bg-rose-950/50 dark:text-rose-100"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Ouvrir le dépôt GitHub</span>
          </a>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-rose-200 bg-white/90 p-4 dark:border-rose-900/60 dark:bg-rose-950/25">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 font-display text-sm font-bold text-[#1f1224] dark:text-rose-50">
              <BookOpenCheck className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <span>Gemini Notebook · {nb.notebookId.slice(0, 8)}</span>
            </div>
            <p className="mt-0.5 text-xs text-rose-900/70 dark:text-rose-200/75">{nb.reason}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/45 bg-amber-500/15 px-2 py-1 font-mono text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            <Lock className="h-3.5 w-3.5" />
            <span>Accès privé Google</span>
          </span>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-rose-950 dark:text-rose-100">
            Titre de l’extrait Notebook
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Ex. Directives V5.1 — Synthèse Notebook"
              className="mt-1 w-full rounded-lg border border-rose-200 bg-white px-2.5 py-2 text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-50"
            />
          </label>
          <label className="block text-xs font-medium text-rose-950 dark:text-rose-100">
            Coller un extrait ou résumé du Notebook Gemini
            <textarea
              rows={3}
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder="Collez ici les notes ou décisions de votre Notebook Gemini pour les archiver dans l'atelier local..."
              className="mt-1 w-full rounded-lg border border-rose-200 bg-white p-2.5 text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-50"
            />
          </label>
          {noteError && <p className="text-xs font-medium text-rose-600 dark:text-rose-300">{noteError}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleImportNote}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-500"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Importer l’extrait Notebook</span>
            </button>
            <a
              href={nb.notebookUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 text-xs font-semibold text-rose-900 hover:border-rose-500 dark:border-rose-700 dark:bg-rose-950/50 dark:text-rose-100"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Ouvrir le Notebook Gemini</span>
            </a>
          </div>
        </div>

        {notes.length > 0 && (
          <div className="space-y-1.5 border-t border-rose-200/80 pt-2.5 dark:border-rose-900/50">
            <div className="font-mono text-[10.5px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
              Extraits importés ({notes.length})
            </div>
            <ul className="max-h-28 space-y-1.5 overflow-y-auto">
              {notes.map((n) => (
                <li
                  key={n.id}
                  className="rounded-lg border border-rose-200/70 bg-rose-50/40 px-2.5 py-1.5 text-xs dark:border-rose-900/50 dark:bg-rose-950/40"
                >
                  <div className="font-semibold text-[#1f1224] dark:text-rose-50">{n.title}</div>
                  <p className="line-clamp-2 text-[11px] text-rose-900/75 dark:text-rose-200/75">{n.body}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
