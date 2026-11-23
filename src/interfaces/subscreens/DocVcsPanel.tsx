import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  GitCommitHorizontal,
  History,
  RotateCcw,
  Save,
  Tag,
} from 'lucide-react';
import { ExoTooltip } from '../../components/bento/ExoTooltip.tsx';
import type {
  DocDomainScope,
  DocVcsBranch,
  DocVcsCommit,
  DocVcsSurface,
  GovernedDocument,
  GovernanceRoleId,
  RoleAssignment,
} from '../../contracts/doc-governance.schema.ts';
import {
  GOVERNANCE_ROLES_CATALOG,
  INITIAL_GOVERNED_DOCUMENTS,
  INITIAL_ROLE_ASSIGNMENTS,
} from '../../data/doc-governance.catalog.ts';
import {
  apiCommitDocVcsSnapshot,
  apiRollbackDocumentToCommit,
  fetchGovernanceState,
} from '../../services/governance/doc-governance.service.ts';
import { hasPermission } from '../../systems/governance/doc-governance.engine.ts';
import {
  computeDocLineDiff,
  seedInitialDocVcsCommits,
} from '../../systems/governance/doc-vcs.engine.ts';

const SURFACE_LABELS: Readonly<Record<DocVcsSurface, string>> = {
  DRIVE_DOC: 'Google Drive / Docs',
  APP_HUB: 'Studio Documentaire',
  LOCAL_MIRROR: 'Miroir Dépôt',
};

const OPERATION_LABELS: Readonly<Record<DocVcsCommit['operation'], string>> = {
  INIT: 'Création',
  EDIT: 'Édition',
  WORKFLOW_TRANSITION: 'Workflow',
  DRIVE_PATCH_SYNC: 'Sync Drive/Docs',
  ROLLBACK: 'Rollback',
  TAG_RELEASE: 'Tag Publication',
};

export function DocVcsPanel() {
  const [documents, setDocuments] = useState<readonly GovernedDocument[]>(INITIAL_GOVERNED_DOCUMENTS);
  const [assignments, setAssignments] = useState<readonly RoleAssignment[]>(INITIAL_ROLE_ASSIGNMENTS);
  const [commits, setCommits] = useState<readonly DocVcsCommit[]>(() =>
    seedInitialDocVcsCommits(INITIAL_GOVERNED_DOCUMENTS),
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [activeMemberId, setActiveMemberId] = useState('usr-karim-app');
  const [branchFilter, setBranchFilter] = useState<'ALL' | DocVcsBranch>('ALL');
  const [selectedDocId, setSelectedDocId] = useState<string>(INITIAL_GOVERNED_DOCUMENTS[0]?.id ?? '');
  const [selectedCommitId, setSelectedCommitId] = useState<string>('');
  const [compareCommitId, setCompareCommitId] = useState<string>('PARENT');

  // Snapshot commit form
  const [commitMessage, setCommitMessage] = useState('');
  const [commitSurface, setCommitSurface] = useState<DocVcsSurface>('DRIVE_DOC');
  const [commitTag, setCommitTag] = useState('');
  const [rollbackReason, setRollbackReason] = useState('');
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    void fetchGovernanceState().then((state) => {
      if (!active) return;
      setDocuments(state.documents);
      setAssignments(state.assignments);
      setCommits(state.vcsCommits);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const activeMember = useMemo(
    () => assignments.find((a) => a.memberId === activeMemberId) ?? assignments[0]!,
    [assignments, activeMemberId],
  );
  const activeRole: GovernanceRoleId = activeMember.roleId;

  const filteredDocs = useMemo(() => {
    if (branchFilter === 'ALL') return documents;
    const targetDomain: DocDomainScope = branchFilter === 'docs/drive-sovereign' ? 'APP' : 'GAME';
    return documents.filter((d) => d.domain === targetDomain);
  }, [documents, branchFilter]);

  const activeDoc = useMemo(
    () => filteredDocs.find((d) => d.id === selectedDocId) ?? filteredDocs[0] ?? null,
    [filteredDocs, selectedDocId],
  );

  const docCommits = useMemo(() => {
    if (!activeDoc) return [];
    return commits.filter((c) => c.docId === activeDoc.id).slice().reverse();
  }, [commits, activeDoc]);

  const activeCommit = useMemo(
    () => docCommits.find((c) => c.commitId === selectedCommitId) ?? docCommits[0] ?? null,
    [docCommits, selectedCommitId],
  );

  const baselineCommit = useMemo(() => {
    if (!activeCommit) return null;
    if (compareCommitId === 'PARENT') {
      return activeCommit.parentHash
        ? docCommits.find((c) => c.commitHash === activeCommit.parentHash) ?? null
        : null;
    }
    return docCommits.find((c) => c.commitId === compareCommitId) ?? null;
  }, [activeCommit, compareCommitId, docCommits]);

  const lineDiff = useMemo(() => {
    if (!activeCommit) return null;
    const beforeText = baselineCommit ? baselineCommit.contentSnapshot : '';
    return computeDocLineDiff(beforeText, activeCommit.contentSnapshot);
  }, [activeCommit, baselineCommit]);

  const editPerm = useMemo(
    () => (activeDoc ? hasPermission(activeRole, activeDoc.track, 'EDIT') : { allowed: false, reason: '' }),
    [activeDoc, activeRole],
  );

  const handleCreateSnapshotCommit = async () => {
    if (!activeDoc || busy) return;
    setBusy(true);
    setFeedback(null);
    const res = await apiCommitDocVcsSnapshot(
      {
        docId: activeDoc.id,
        surface: commitSurface,
        commitMessage: commitMessage.trim(),
        tag: commitTag.trim() || null,
        actorName: activeMember.displayName,
        actorRole: activeRole,
      },
      activeDoc,
      commits,
    );
    setBusy(false);
    if (!res.ok) {
      setFeedback({ tone: 'err', text: res.error ?? 'Échec du commit documentaire.' });
      return;
    }
    if (res.vcsCommits) {
      setCommits(res.vcsCommits);
      const latest = res.vcsCommits[res.vcsCommits.length - 1];
      if (latest) setSelectedCommitId(latest.commitId);
    }
    setCommitMessage('');
    setCommitTag('');
    setFeedback({
      tone: 'ok',
      text: `Commit enregistré sur la branche documentaire (${SURFACE_LABELS[commitSurface]}).`,
    });
  };

  const handleRollback = async () => {
    if (!activeDoc || !activeCommit || busy) return;
    setBusy(true);
    setFeedback(null);
    const res = await apiRollbackDocumentToCommit(
      activeDoc.id,
      {
        targetCommitId: activeCommit.commitId,
        reason: rollbackReason.trim(),
        actorName: activeMember.displayName,
        actorRole: activeRole,
      },
      activeDoc,
      commits,
    );
    setBusy(false);
    if (!res.ok || !res.data) {
      setFeedback({ tone: 'err', text: res.error ?? 'Restauration refusée.' });
      return;
    }
    const restored = res.data;
    setDocuments((prev) => prev.map((d) => (d.id === restored.id ? restored : d)));
    if (res.vcsCommits) {
      setCommits(res.vcsCommits);
      const latest = res.vcsCommits[res.vcsCommits.length - 1];
      if (latest) setSelectedCommitId(latest.commitId);
    }
    setRollbackReason('');
    setFeedback({
      tone: 'ok',
      text: `${restored.filingCode} restauré vers ${activeCommit.shortHash} en Brouillon (révision requise avant publication).`,
    });
  };

  return (
    <div className="space-y-4" data-testid="doc-vcs-panel">
      {/* Separation Banner: Docs VCS vs App/Game Code Git */}
      <div className="rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 exo-accent-text" />
              <h3 className="font-display text-base font-bold text-[var(--exo-text)]">
                Système de Contrôle de Version Documentaire (VCS Séparé du Code)
              </h3>
            </div>
            <p className="mt-1 text-xs exo-muted-text">
              Branches isolées <span className="font-mono-num font-semibold exo-accent-text">docs/drive-sovereign</span> (Drive/Docs App) et{' '}
              <span className="font-mono-num font-semibold exo-accent-2-text">docs/game-assets-mirror</span> (Jeu), indépendantes de la branche code{' '}
              <span className="font-mono-num">main</span> · {commits.length} commits immuables.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="vcs-active-actor" className="text-xs font-medium exo-muted-text whitespace-nowrap">
              Opérateur VCS :
            </label>
            <select
              id="vcs-active-actor"
              data-testid="vcs-actor-select"
              value={activeMember.memberId}
              onChange={(e) => {
                setActiveMemberId(e.target.value);
                setFeedback(null);
              }}
              className="min-h-[44px] rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-3 text-xs font-semibold text-[var(--exo-text)]"
            >
              {assignments.map((member) => {
                const role = GOVERNANCE_ROLES_CATALOG.find((r) => r.id === member.roleId);
                return (
                  <option key={member.memberId} value={member.memberId}>
                    {member.displayName} — {role?.shortLabel ?? member.roleId}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Branch switchers */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t exo-accent-border pt-3">
          {[
            { id: 'ALL' as const, label: `Toutes branches docs (${commits.length} commits)` },
            {
              id: 'docs/drive-sovereign' as const,
              label: `docs/drive-sovereign · App & Drive (${commits.filter((c) => c.branch === 'docs/drive-sovereign').length})`,
            },
            {
              id: 'docs/game-assets-mirror' as const,
              label: `docs/game-assets-mirror · Jeu (${commits.filter((c) => c.branch === 'docs/game-assets-mirror').length})`,
            },
          ].map((b) => (
            <button
              key={b.id}
              type="button"
              data-testid={`vcs-branch-${b.id === 'ALL' ? 'all' : b.id === 'docs/drive-sovereign' ? 'drive' : 'game'}`}
              onClick={() => setBranchFilter(b.id)}
              className={`min-h-[44px] px-3 font-mono-num text-xs font-semibold transition whitespace-nowrap ${
                branchFilter === b.id ? 'exo-accent-chip-active' : 'exo-accent-chip'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          data-testid="vcs-feedback"
          className={`flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-medium ${
            feedback.tone === 'ok'
              ? 'border-emerald-500/45 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-300'
          }`}
        >
          <span className="flex items-center gap-2">
            {feedback.tone === 'ok' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </span>
          <button type="button" onClick={() => setFeedback(null)} className="min-h-[32px] px-2 underline">
            Fermer
          </button>
        </div>
      )}

      {/* 3-Column VCS Workspace: Docs -> Commits -> Diff & Rollback */}
      <div className="grid gap-4 xl:grid-cols-[260px_320px_1fr]">
        {/* Column 1: Document selector */}
        <div className="space-y-2 rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-3">
          <div className="text-xs font-semibold text-[var(--exo-text)]">
            Fiches versionnées ({filteredDocs.length})
          </div>
          <div className="max-h-[54vh] space-y-1.5 overflow-y-auto pr-1">
            {loading && <p className="text-xs exo-muted-text">Chargement de l’historique…</p>}
            {filteredDocs.map((doc) => {
              const docCommitCount = commits.filter((c) => c.docId === doc.id).length;
              const selected = activeDoc?.id === doc.id;
              return (
                <button
                  key={doc.id}
                  type="button"
                  data-testid={`vcs-doc-${doc.filingCode}`}
                  onClick={() => {
                    setSelectedDocId(doc.id);
                    setSelectedCommitId('');
                    setCompareCommitId('PARENT');
                  }}
                  className={`w-full rounded-lg border p-2.5 text-left transition ${
                    selected
                      ? 'exo-accent-chip-active border-[var(--exo-accent)]'
                      : 'exo-accent-border bg-[var(--exo-surface-alt)]/55 hover:border-[var(--exo-accent)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 font-mono-num text-[11px]">
                    <span className="font-bold exo-accent-text">{doc.filingCode}</span>
                    <span className="exo-muted-text">{docCommitCount} commits</span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs font-medium text-[var(--exo-text)]">
                    {doc.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 2: Commit graph & Snapshot commit creator */}
        <div className="space-y-3 rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-3">
          <div className="flex items-center justify-between gap-2 border-b exo-accent-border pb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--exo-text)]">
              <History className="h-3.5 w-3.5 exo-accent-text" />
              <span>Historique des commits</span>
            </div>
            {activeDoc && (
              <span className="font-mono-num text-[11px] exo-muted-text">
                {activeDoc.domain === 'APP' ? 'docs/drive-sovereign' : 'docs/game-assets-mirror'}
              </span>
            )}
          </div>

          <div className="max-h-[36vh] space-y-2 overflow-y-auto pr-1">
            {docCommits.map((c) => {
              const isSelected = activeCommit?.commitId === c.commitId;
              return (
                <button
                  key={c.commitId}
                  type="button"
                  data-testid={`vcs-commit-${c.shortHash}`}
                  onClick={() => setSelectedCommitId(c.commitId)}
                  className={`w-full rounded-lg border p-2.5 text-left transition ${
                    isSelected
                      ? 'exo-accent-chip-active border-[var(--exo-accent)]'
                      : 'exo-accent-border bg-[var(--exo-surface-alt)]/55 hover:border-[var(--exo-accent)]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1 font-mono-num text-[11px]">
                    <span className="inline-flex items-center gap-1 font-bold exo-accent-text">
                      <GitCommitHorizontal className="h-3.5 w-3.5" />
                      {c.shortHash}
                    </span>
                    <span className="exo-muted-text">{OPERATION_LABELS[c.operation]}</span>
                  </div>
                  <div className="mt-1 text-xs font-medium text-[var(--exo-text)]">{c.commitMessage}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono-num text-[10.5px] exo-muted-text">
                    <span>{c.authorName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{SURFACE_LABELS[c.surface]}</span>
                    <span aria-hidden="true">·</span>
                    <span>v{c.version}</span>
                    {c.tag && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                          <Tag className="h-2.5 w-2.5" />
                          {c.tag}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explicit Snapshot / Drive Sync Commit */}
          {activeDoc && (
            <div className="space-y-2 border-t exo-accent-border pt-3">
              <div className="text-xs font-semibold text-[var(--exo-text)]">
                Nouveau commit sur branche doc
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={commitSurface}
                  onChange={(e) => setCommitSurface(e.target.value as DocVcsSurface)}
                  aria-label="Surface d'origine du commit"
                  className="min-h-[40px] rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-2 text-xs text-[var(--exo-text)]"
                >
                  <option value="DRIVE_DOC">Google Drive / Docs</option>
                  <option value="APP_HUB">Studio Documentaire</option>
                  <option value="LOCAL_MIRROR">Miroir Dépôt</option>
                </select>
                <input
                  type="text"
                  value={commitTag}
                  onChange={(e) => setCommitTag(e.target.value)}
                  placeholder="Tag optionnel (ex: drive-v5.1)"
                  aria-label="Tag de version optionnel"
                  className="min-h-[40px] rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-2.5 font-mono-num text-xs text-[var(--exo-text)]"
                />
              </div>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Message de commit (ex: Sync patch Google Doc section 3)..."
                aria-label="Message du commit documentaire"
                className="min-h-[44px] w-full rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-3 text-xs text-[var(--exo-text)]"
              />
              <ExoTooltip title="Enregistrer un snapshot VCS" body={editPerm.reason}>
                <button
                  type="button"
                  data-testid="vcs-create-commit-btn"
                  disabled={busy || !editPerm.allowed || commitMessage.trim().length < 4}
                  onClick={() => void handleCreateSnapshotCommit()}
                  className="exo-accent-btn inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Enregistrer Snapshot ({activeDoc.filingCode})</span>
                </button>
              </ExoTooltip>
            </div>
          )}
        </div>

        {/* Column 3: Diff Viewer & RBAC Rollback */}
        <div className="space-y-3 rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-4">
          {activeCommit && activeDoc && lineDiff ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2 border-b exo-accent-border pb-2.5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 font-mono-num text-xs">
                    <span className="font-bold exo-accent-text">{activeCommit.commitHash.slice(0, 12)}</span>
                    <span aria-hidden="true" className="exo-muted-text">·</span>
                    <span className="exo-muted-text">
                      Parent : {activeCommit.parentHash ? activeCommit.parentHash.slice(0, 8) : 'ROOT'}
                    </span>
                    <span aria-hidden="true" className="exo-muted-text">·</span>
                    <span className="text-emerald-600 dark:text-emerald-400">+{lineDiff.addedCount}</span>
                    <span className="text-rose-600 dark:text-rose-400">-{lineDiff.removedCount}</span>
                  </div>
                  <h4 className="mt-1 font-display text-sm font-bold text-[var(--exo-text)]">
                    {activeCommit.commitMessage}
                  </h4>
                  <div className="mt-0.5 text-[11px] exo-muted-text">
                    {activeCommit.timestampIso.slice(0, 16).replace('T', ' ')} UTC · {activeCommit.authorName} · {SURFACE_LABELS[activeCommit.surface]}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs">
                  <span className="exo-muted-text whitespace-nowrap">Comparer à :</span>
                  <select
                    value={compareCommitId}
                    onChange={(e) => setCompareCommitId(e.target.value)}
                    aria-label="Commit de référence pour le diff"
                    className="min-h-[40px] rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-2 font-mono-num text-xs text-[var(--exo-text)]"
                  >
                    <option value="PARENT">Commit parent</option>
                    {docCommits
                      .filter((c) => c.commitId !== activeCommit.commitId)
                      .map((c) => (
                        <option key={c.commitId} value={c.commitId}>
                          {c.shortHash} · v{c.version}
                        </option>
                      ))}
                  </select>
                </label>
              </div>

              {/* Line-by-line Diff Output */}
              <div
                data-testid="vcs-diff-viewer"
                className="max-h-64 overflow-y-auto rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] font-mono text-[11px] leading-relaxed"
              >
                {lineDiff.lines.map((line, i) => {
                  const rowCls =
                    line.kind === 'ADD'
                      ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                      : line.kind === 'DEL'
                        ? 'bg-rose-500/15 text-rose-800 dark:text-rose-200'
                        : 'text-[var(--exo-text)] opacity-85';
                  const marker = line.kind === 'ADD' ? '+' : line.kind === 'DEL' ? '-' : ' ';
                  return (
                    <div key={`${i}-${line.kind}`} className={`flex gap-2 px-2.5 py-0.5 ${rowCls}`}>
                      <span className="w-6 shrink-0 select-none text-right font-mono-num opacity-55">
                        {line.oldLine ?? ''}
                      </span>
                      <span className="w-6 shrink-0 select-none text-right font-mono-num opacity-55">
                        {line.newLine ?? ''}
                      </span>
                      <span className="w-3 shrink-0 select-none font-bold">{marker}</span>
                      <span className="min-w-0 whitespace-pre-wrap break-words">{line.text || ' '}</span>
                    </div>
                  );
                })}
              </div>

              {/* RBAC-guarded Rollback to selected commit */}
              <div className="space-y-2 border-t exo-accent-border pt-3">
                <div className="text-xs font-semibold text-[var(--exo-text)]">
                  Restauration contrôlée vers {activeCommit.shortHash} (v{activeCommit.version})
                </div>
                <p className="text-[11px] exo-muted-text">
                  Une restauration remet la fiche en statut Brouillon, crée un nouveau commit de rollback (historique préservé) et exige une nouvelle révision avant publication.
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={rollbackReason}
                    onChange={(e) => setRollbackReason(e.target.value)}
                    placeholder="Motif de restauration (min. 6 caractères)..."
                    aria-label="Motif du rollback documentaire"
                    className="min-h-[44px] flex-1 rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-3 text-xs text-[var(--exo-text)]"
                  />
                  <ExoTooltip title="Restaurer en brouillon" body={editPerm.reason}>
                    <button
                      type="button"
                      data-testid="vcs-rollback-btn"
                      disabled={busy || !editPerm.allowed || rollbackReason.trim().length < 6}
                      onClick={() => void handleRollback()}
                      className="exo-accent-chip inline-flex min-h-[44px] items-center gap-1.5 px-3.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <RotateCcw className="h-3.5 w-3.5 exo-accent-text" />
                      <span>Restaurer cette révision</span>
                    </button>
                  </ExoTooltip>
                </div>
              </div>
            </>
          ) : (
            <p className="py-10 text-center text-xs exo-muted-text">
              Sélectionnez une fiche et un commit pour inspecter le diff ligne par ligne.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
