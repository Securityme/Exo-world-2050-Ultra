import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Download,
  Edit3,
  FilePlus2,
  FolderKanban,
  GitPullRequest,
  History,
  Lock,
  RotateCcw,
  Search,
  Send,
  Shield,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { ExoTooltip } from '../../components/bento/ExoTooltip.tsx';
import type {
  DocCategoryCode,
  DocDomainScope,
  GovernedDocument,
  GovernanceRoleId,
  RoleAssignment,
  WorkflowAction,
  WorkflowStage,
} from '../../contracts/doc-governance.schema.ts';
import {
  DOC_CATEGORIES_CATALOG,
  GOVERNANCE_ROLES_CATALOG,
  INITIAL_GOVERNED_DOCUMENTS,
  INITIAL_ROLE_ASSIGNMENTS,
  WORKFLOW_STAGE_LABELS,
} from '../../data/doc-governance.catalog.ts';
import {
  apiCreateGovernedDocument,
  apiTransitionGovernedDocument,
  apiUpdateGovernedDocument,
  apiUpdateRoleAssignment,
  fetchGovernanceState,
} from '../../services/governance/doc-governance.service.ts';
import {
  evaluateQualityStandards,
  exportGovernanceHandbookMarkdown,
  getCategorySpec,
  getRequiredReviewPermission,
  getRequiredReviewStage,
  getRoleSpec,
  hasPermission,
} from '../../systems/governance/doc-governance.engine.ts';
import { DocGovernanceRolesView } from './DocGovernanceRolesView.tsx';
import { DocGovernanceTaxonomyView } from './DocGovernanceTaxonomyView.tsx';

type GovernanceSubTab = 'WORKFLOW' | 'ROLES' | 'TAXONOMY';

const STAGE_TEXT_TONE: Record<WorkflowStage, string> = {
  DRAFT: 'exo-muted-text',
  TECH_REVIEW: 'text-amber-600 dark:text-amber-300',
  SKILLS_REVIEW: 'text-amber-600 dark:text-amber-300',
  GAME_REVIEW: 'text-amber-600 dark:text-amber-300',
  CHANGES_REQUESTED: 'text-rose-600 dark:text-rose-300',
  READY_FOR_APPROVAL: 'exo-accent-text',
  PUBLISHED: 'text-emerald-600 dark:text-emerald-400',
  ARCHIVED: 'exo-muted-text opacity-70',
};

export function DocGovernancePanel() {
  const [subTab, setSubTab] = useState<GovernanceSubTab>('WORKFLOW');
  const [documents, setDocuments] = useState<readonly GovernedDocument[]>(INITIAL_GOVERNED_DOCUMENTS);
  const [assignments, setAssignments] = useState<readonly RoleAssignment[]>(INITIAL_ROLE_ASSIGNMENTS);
  const [loading, setLoading] = useState(true);

  // Active simulated/selected member from the RBAC directory
  const [activeMemberId, setActiveMemberId] = useState<string>('usr-baptiste');

  // Filters & search
  const [domainFilter, setDomainFilter] = useState<'ALL' | DocDomainScope>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | DocCategoryCode>('ALL');
  const [stageFilter, setStageFilter] = useState<'ALL' | WorkflowStage>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(INITIAL_GOVERNED_DOCUMENTS[0]?.id ?? null);

  // Feedback banner
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Create form state
  const [createOpen, setCreateOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<DocCategoryCode>('APP-UPD');
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newVersion, setNewVersion] = useState('5.1.0');

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editVersion, setEditVersion] = useState('');

  // Workflow review comment
  const [actionComment, setActionComment] = useState('');

  useEffect(() => {
    let active = true;
    void fetchGovernanceState().then((state) => {
      if (!active) return;
      setDocuments(state.documents);
      setAssignments(state.assignments);
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
  const activeRoleSpec = getRoleSpec(activeRole);

  const allowedCreateCategories = useMemo(
    () =>
      DOC_CATEGORIES_CATALOG.filter((cat) => hasPermission(activeRole, cat.track, 'CREATE').allowed),
    [activeRole],
  );

  useEffect(() => {
    if (allowedCreateCategories.length > 0 && !allowedCreateCategories.some((c) => c.code === newCategory)) {
      setNewCategory(allowedCreateCategories[0]!.code);
    }
  }, [allowedCreateCategories, newCategory]);

  const visibleCategories = useMemo(() => {
    if (domainFilter === 'ALL') return DOC_CATEGORIES_CATALOG;
    return DOC_CATEGORIES_CATALOG.filter((c) => c.domain === domainFilter);
  }, [domainFilter]);

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return documents.filter((d) => {
      if (domainFilter !== 'ALL' && d.domain !== domainFilter) return false;
      if (categoryFilter !== 'ALL' && d.categoryCode !== categoryFilter) return false;
      if (stageFilter !== 'ALL' && d.stage !== stageFilter) return false;
      if (!q) return true;
      return `${d.filingCode} ${d.title} ${d.summary} ${d.categoryCode} ${d.tags.join(' ')}`
        .toLowerCase()
        .includes(q);
    });
  }, [documents, domainFilter, categoryFilter, stageFilter, searchQuery]);

  const activeDoc = useMemo(
    () => filteredDocs.find((d) => d.id === selectedDocId) ?? filteredDocs[0] ?? null,
    [filteredDocs, selectedDocId],
  );

  const activeQuality = useMemo(
    () => (activeDoc ? evaluateQualityStandards(activeDoc) : null),
    [activeDoc],
  );

  const appCount = useMemo(() => documents.filter((d) => d.domain === 'APP').length, [documents]);
  const gameCount = useMemo(() => documents.filter((d) => d.domain === 'GAME').length, [documents]);
  const pendingReviewCount = useMemo(
    () =>
      documents.filter(
        (d) =>
          d.stage === 'TECH_REVIEW' ||
          d.stage === 'SKILLS_REVIEW' ||
          d.stage === 'GAME_REVIEW' ||
          d.stage === 'READY_FOR_APPROVAL',
      ).length,
    [documents],
  );

  const handleDomainSelect = (domain: 'ALL' | DocDomainScope) => {
    setDomainFilter(domain);
    setCategoryFilter('ALL');
  };

  const handleCreateDocument = async () => {
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    const res = await apiCreateGovernedDocument(
      {
        categoryCode: newCategory,
        title: newTitle,
        summary: newSummary,
        content: newContent,
        version: newVersion,
        tags: [newCategory.toLowerCase()],
        actorName: activeMember.displayName,
        actorRole: activeRole,
      },
      documents,
    );
    setBusy(false);
    if (!res.ok || !res.data) {
      setFeedback({ tone: 'err', text: res.error ?? 'Création impossible.' });
      return;
    }
    const created = res.data;
    setDocuments((prev) => [created, ...prev]);
    setSelectedDocId(created.id);
    setDomainFilter(created.domain);
    setCategoryFilter('ALL');
    setCreateOpen(false);
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
    setFeedback({ tone: 'ok', text: `Document ${created.filingCode} créé en brouillon (${created.domain}).` });
  };

  const startEditingDoc = (doc: GovernedDocument) => {
    setEditTitle(doc.title);
    setEditSummary(doc.summary);
    setEditContent(doc.content);
    setEditVersion(doc.version);
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!activeDoc || busy) return;
    setBusy(true);
    setFeedback(null);
    const res = await apiUpdateGovernedDocument(
      activeDoc.id,
      {
        title: editTitle,
        summary: editSummary,
        content: editContent,
        version: editVersion,
        actorName: activeMember.displayName,
        actorRole: activeRole,
      },
      activeDoc,
    );
    setBusy(false);
    if (!res.ok || !res.data) {
      setFeedback({ tone: 'err', text: res.error ?? 'Enregistrement refusé.' });
      return;
    }
    const updated = res.data;
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setEditing(false);
    setFeedback({ tone: 'ok', text: `${updated.filingCode} mis à jour (v${updated.version}).` });
  };

  const handleToggleManualStandard = async (standardId: string) => {
    if (!activeDoc || busy) return;
    const exists = activeDoc.verifiedStandardIds.includes(standardId);
    const nextIds = exists
      ? activeDoc.verifiedStandardIds.filter((id) => id !== standardId)
      : [...activeDoc.verifiedStandardIds, standardId];
    setBusy(true);
    setFeedback(null);
    const res = await apiUpdateGovernedDocument(
      activeDoc.id,
      {
        verifiedStandardIds: nextIds,
        actorName: activeMember.displayName,
        actorRole: activeRole,
      },
      activeDoc,
    );
    setBusy(false);
    if (!res.ok || !res.data) {
      setFeedback({ tone: 'err', text: res.error ?? 'Impossible de modifier la grille de révision.' });
      return;
    }
    const updated = res.data;
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleWorkflowAction = async (action: WorkflowAction) => {
    if (!activeDoc || busy) return;
    setBusy(true);
    setFeedback(null);
    const res = await apiTransitionGovernedDocument(
      activeDoc.id,
      {
        action,
        actorName: activeMember.displayName,
        actorRole: activeRole,
        comment: actionComment,
        verifiedStandardIds: activeDoc.verifiedStandardIds,
      },
      activeDoc,
    );
    setBusy(false);
    if (!res.ok || !res.data) {
      setFeedback({ tone: 'err', text: res.error ?? 'Transition bloquée.' });
      return;
    }
    const updated = res.data;
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setActionComment('');
    setEditing(false);
    setFeedback({
      tone: 'ok',
      text: `${updated.filingCode} passé au statut « ${WORKFLOW_STAGE_LABELS[updated.stage]} ».`,
    });
  };

  const handleChangeMemberRole = async (memberId: string, newRoleId: GovernanceRoleId) => {
    setFeedback(null);
    const res = await apiUpdateRoleAssignment(
      {
        memberId,
        newRoleId,
        actorName: activeMember.displayName,
        actorRole: activeRole,
      },
      assignments,
    );
    if (!res.ok || !res.data) {
      setFeedback({ tone: 'err', text: res.error ?? 'Modification de rôle refusée.' });
      return;
    }
    setAssignments(res.data);
    setFeedback({ tone: 'ok', text: 'Attribution de rôle mise à jour et enregistrée.' });
  };

  const handleExportHandbook = () => {
    const md = exportGovernanceHandbookMarkdown(documents, assignments);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'exo-world-2050-gouvernance-rbac-validation.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Evaluate permissions for selected doc
  const docPerms = useMemo(() => {
    if (!activeDoc) return null;
    const expectedReviewStage = getRequiredReviewStage(activeDoc.track);
    const reviewPerm = getRequiredReviewPermission(activeDoc.track);
    return {
      edit: hasPermission(activeRole, activeDoc.track, 'EDIT'),
      submit: hasPermission(activeRole, activeDoc.track, 'SUBMIT_REVIEW'),
      review: hasPermission(activeRole, activeDoc.track, reviewPerm),
      requestChanges: hasPermission(activeRole, activeDoc.track, 'REQUEST_CHANGES'),
      approve: hasPermission(activeRole, activeDoc.track, 'APPROVE_PUBLISH'),
      archive: hasPermission(activeRole, activeDoc.track, 'ARCHIVE'),
      expectedReviewStage,
    };
  }, [activeDoc, activeRole]);

  const stepperStages = useMemo(() => {
    if (!activeDoc) return [];
    const reviewStage = getRequiredReviewStage(activeDoc.track);
    return [
      { id: 'DRAFT' as const, label: '1. Brouillon' },
      { id: reviewStage, label: `2. ${WORKFLOW_STAGE_LABELS[reviewStage]}` },
      { id: 'READY_FOR_APPROVAL' as const, label: '3. Prêt validation' },
      { id: 'PUBLISHED' as const, label: '4. Publié' },
    ];
  }, [activeDoc]);

  const getStepRank = (stage: WorkflowStage): number => {
    if (stage === 'DRAFT' || stage === 'CHANGES_REQUESTED') return 0;
    if (stage === 'TECH_REVIEW' || stage === 'SKILLS_REVIEW' || stage === 'GAME_REVIEW') return 1;
    if (stage === 'READY_FOR_APPROVAL') return 2;
    return 3;
  };

  return (
    <div className="space-y-4" data-testid="doc-governance-panel">
      {/* Top Role Context Bar & Key Counts */}
      <div className="rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold text-[var(--exo-text)]">
              Gouvernance Documentaire, Accès RBAC &amp; Validation
            </h3>
            <p className="mt-0.5 text-xs exo-muted-text">
              {appCount} docs Application · {gameCount} docs Jeu · {pendingReviewCount} en attente de validation
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="active-rbac-member" className="text-xs font-medium exo-muted-text whitespace-nowrap">
              Profil actif :
            </label>
            <select
              id="active-rbac-member"
              data-testid="governance-role-switcher"
              value={activeMember.memberId}
              onChange={(e) => {
                setActiveMemberId(e.target.value);
                setEditing(false);
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

            <button
              type="button"
              onClick={handleExportHandbook}
              className="exo-accent-chip inline-flex min-h-[44px] items-center gap-1.5 px-3 text-xs font-semibold whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5 exo-accent-text" />
              <span>Exporter Manuel .MD</span>
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t exo-accent-border pt-2.5 text-xs">
          <div className="text-[var(--exo-text)]">
            <span className="font-semibold exo-accent-text">{activeRoleSpec.label}</span>
            <span aria-hidden="true" className="mx-1.5 exo-muted-text">·</span>
            <span className="exo-muted-text">{activeRoleSpec.summary}</span>
          </div>
          <span className="font-mono-num text-[11px] exo-muted-text">
            {activeRoleSpec.separationRule}
          </span>
        </div>
      </div>

      {/* Feedback Notice */}
      {feedback && (
        <div
          role="status"
          data-testid="governance-feedback"
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
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="min-h-[32px] px-2 text-[11px] underline"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'WORKFLOW' as const, label: 'Registre Séparé & Validation', icon: GitPullRequest },
          { id: 'ROLES' as const, label: 'Rôles & Permissions (RBAC)', icon: Shield },
          { id: 'TAXONOMY' as const, label: 'Classement App / Jeu & Standards', icon: FolderKanban },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`gov-subtab-${item.id.toLowerCase()}`}
              onClick={() => setSubTab(item.id)}
              className={`inline-flex min-h-[44px] items-center gap-2 px-3.5 text-xs font-semibold transition whitespace-nowrap ${
                subTab === item.id ? 'exo-accent-chip-active' : 'exo-accent-chip'
              }`}
            >
              <Icon className="h-3.5 w-3.5 exo-accent-text" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* === TAB 1: WORKFLOW & SEPARATED REGISTRY === */}
      {subTab === 'WORKFLOW' && (
        <div className="space-y-4">
          {/* Separated Domain Bar + Search + New Entry */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL' as const, label: `Tous (${documents.length})` },
                { id: 'APP' as const, label: `Documentation Application (${appCount})` },
                { id: 'GAME' as const, label: `Documentation Jeu (${gameCount})` },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  data-testid={`gov-domain-${d.id.toLowerCase()}`}
                  onClick={() => handleDomainSelect(d.id)}
                  className={`min-h-[44px] px-3 text-xs font-semibold transition whitespace-nowrap ${
                    domainFilter === d.id ? 'exo-accent-chip-active' : 'exo-accent-chip'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 exo-muted-text" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher code, titre..."
                  aria-label="Rechercher un document gouverné"
                  className="min-h-[44px] w-48 rounded-lg border exo-accent-border bg-[var(--exo-surface)] pl-8 pr-3 text-xs text-[var(--exo-text)] sm:w-56"
                />
              </div>

              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value as 'ALL' | WorkflowStage)}
                aria-label="Filtrer par statut de validation"
                className="min-h-[44px] rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2.5 text-xs text-[var(--exo-text)]"
              >
                <option value="ALL">Tous statuts</option>
                {(Object.keys(WORKFLOW_STAGE_LABELS) as WorkflowStage[]).map((st) => (
                  <option key={st} value={st}>
                    {WORKFLOW_STAGE_LABELS[st]}
                  </option>
                ))}
              </select>

              <ExoTooltip
                title="Création soumise au rôle RBAC"
                body={
                  allowedCreateCategories.length > 0
                    ? `Catégories autorisées pour ${activeRoleSpec.shortLabel} : ${allowedCreateCategories.map((c) => c.code).join(', ')}.`
                    : `Le rôle ${activeRoleSpec.shortLabel} ne possède pas la permission de création.`
                }
              >
                <button
                  type="button"
                  data-testid="gov-new-doc-btn"
                  disabled={allowedCreateCategories.length === 0}
                  onClick={() => setCreateOpen((v) => !v)}
                  className="exo-accent-btn inline-flex min-h-[44px] items-center gap-1.5 px-3.5 text-xs font-semibold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <FilePlus2 className="h-3.5 w-3.5" />
                  <span>Nouvelle mise à jour</span>
                </button>
              </ExoTooltip>
            </div>
          </div>

          {/* Sub-category filter bar */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`min-h-[38px] px-2.5 font-mono-num text-[11px] font-semibold transition whitespace-nowrap ${
                categoryFilter === 'ALL' ? 'exo-accent-chip-active' : 'exo-accent-chip'
              }`}
            >
              Toutes catégories
            </button>
            {visibleCategories.map((cat) => (
              <button
                key={cat.code}
                type="button"
                onClick={() => setCategoryFilter(cat.code)}
                className={`min-h-[38px] px-2.5 font-mono-num text-[11px] font-semibold transition whitespace-nowrap ${
                  categoryFilter === cat.code ? 'exo-accent-chip-active' : 'exo-accent-chip'
                }`}
              >
                {cat.code} · {cat.shortLabel}
              </button>
            ))}
          </div>

          {/* Create Form Drawer */}
          {createOpen && allowedCreateCategories.length > 0 && (
            <div
              data-testid="gov-create-form"
              className="space-y-3 rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-4"
            >
              <div className="flex items-center justify-between border-b exo-accent-border pb-2">
                <h4 className="font-display text-sm font-bold text-[var(--exo-text)]">
                  Créer une nouvelle fiche ou proposition de mise à jour
                </h4>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="min-h-[36px] px-2 text-xs exo-muted-text underline"
                >
                  Annuler
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1 text-xs">
                  <span className="font-medium text-[var(--exo-text)]">Catégorie &amp; Pôle</span>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as DocCategoryCode)}
                    className="min-h-[44px] w-full rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-2.5 text-xs text-[var(--exo-text)]"
                  >
                    {allowedCreateCategories.map((c) => (
                      <option key={c.code} value={c.code}>
                        [{c.domain}] {c.code} — {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-xs">
                  <span className="font-medium text-[var(--exo-text)]">Version SemVer</span>
                  <input
                    type="text"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    placeholder="5.1.0"
                    className="min-h-[44px] w-full rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-3 font-mono-num text-xs text-[var(--exo-text)]"
                  />
                </label>
                <label className="space-y-1 text-xs sm:col-span-3">
                  <span className="font-medium text-[var(--exo-text)]">Titre</span>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Guide de révision des scénarios d'Ère 5"
                    className="min-h-[44px] w-full rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-3 text-xs text-[var(--exo-text)]"
                  />
                </label>
                <label className="space-y-1 text-xs sm:col-span-3">
                  <span className="font-medium text-[var(--exo-text)]">Résumé exécutif</span>
                  <input
                    type="text"
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    placeholder="Résumé clair des changements et objectifs (minimum 15 caractères)"
                    className="min-h-[44px] w-full rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-3 text-xs text-[var(--exo-text)]"
                  />
                </label>
                <label className="space-y-1 text-xs sm:col-span-3">
                  <span className="font-medium text-[var(--exo-text)]">Contenu détaillé</span>
                  <textarea
                    rows={4}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Détaillez les spécifications, compétences ou règles de jeu (minimum 40 caractères)..."
                    className="w-full rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] p-3 font-mono text-xs text-[var(--exo-text)]"
                  />
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleCreateDocument()}
                  className="exo-accent-btn inline-flex min-h-[44px] items-center gap-2 px-4 text-xs font-semibold"
                >
                  <FilePlus2 className="h-3.5 w-3.5" />
                  <span>Enregistrer le brouillon</span>
                </button>
              </div>
            </div>
          )}

          {/* Split Master-Detail Registry & Validation Workspace */}
          <div className="grid gap-4 lg:grid-cols-[310px_1fr]">
            {/* Left List */}
            <div className="max-h-[58vh] space-y-2 overflow-y-auto pr-1">
              {loading && (
                <p className="text-xs exo-muted-text">Chargement du registre de gouvernance…</p>
              )}
              {!loading && filteredDocs.length === 0 && (
                <div className="rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-4 text-xs exo-muted-text">
                  Aucun document ne correspond aux filtres sélectionnés.
                </div>
              )}
              {filteredDocs.map((doc) => {
                const q = evaluateQualityStandards(doc);
                const selected = activeDoc?.id === doc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    data-testid={`gov-doc-row-${doc.filingCode}`}
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setEditing(false);
                    }}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selected
                        ? 'exo-accent-chip-active border-[var(--exo-accent)]'
                        : 'exo-accent-border bg-[var(--exo-surface)] hover:border-[var(--exo-accent)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 font-mono-num text-[11px]">
                      <span className="font-bold exo-accent-text">{doc.filingCode}</span>
                      <span className={`font-semibold ${STAGE_TEXT_TONE[doc.stage]}`}>
                        {WORKFLOW_STAGE_LABELS[doc.stage]}
                      </span>
                    </div>
                    <div className="mt-1 text-xs font-semibold leading-snug text-[var(--exo-text)]">
                      {doc.title}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 font-mono-num text-[10.5px] exo-muted-text">
                      <span>{doc.domain === 'APP' ? 'Application' : 'Jeu'}</span>
                      <span aria-hidden="true">·</span>
                      <span>v{doc.version}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {q.passedCount}/{q.totalCount} standards
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Detail & Workflow Workspace */}
            <div className="space-y-4 rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-4">
              {activeDoc && activeQuality && docPerms ? (
                <>
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b exo-accent-border pb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 font-mono-num text-xs">
                        <span className="font-bold exo-accent-text">{activeDoc.filingCode}</span>
                        <span aria-hidden="true" className="exo-muted-text">·</span>
                        <span className="exo-muted-text">
                          {activeDoc.domain === 'APP' ? 'Pôle Application' : 'Pôle Jeu'}
                        </span>
                        <span aria-hidden="true" className="exo-muted-text">·</span>
                        <span className="exo-muted-text">{getCategorySpec(activeDoc.categoryCode).label}</span>
                        <span aria-hidden="true" className="exo-muted-text">·</span>
                        <span className="exo-muted-text">v{activeDoc.version}</span>
                      </div>
                      <h4 className="mt-1 font-display text-base font-bold text-[var(--exo-text)]">
                        {activeDoc.title}
                      </h4>
                      <p className="mt-1 text-xs exo-muted-text">{activeDoc.summary}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {(activeDoc.stage === 'DRAFT' || activeDoc.stage === 'CHANGES_REQUESTED') && (
                        <ExoTooltip
                          title="Édition du contenu"
                          body={docPerms.edit.reason}
                        >
                          <button
                            type="button"
                            disabled={!docPerms.edit.allowed}
                            onClick={() => (editing ? setEditing(false) : startEditingDoc(activeDoc))}
                            className="exo-accent-chip inline-flex min-h-[44px] items-center gap-1.5 px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <Edit3 className="h-3.5 w-3.5 exo-accent-text" />
                            <span>{editing ? 'Annuler édition' : 'Modifier'}</span>
                          </button>
                        </ExoTooltip>
                      )}
                    </div>
                  </div>

                  {/* Visual Workflow Stepper */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[var(--exo-text)]">
                        Progression du flux de validation
                      </span>
                      <span className={`font-mono-num font-semibold ${STAGE_TEXT_TONE[activeDoc.stage]}`}>
                        Statut actuel : {WORKFLOW_STAGE_LABELS[activeDoc.stage]}
                      </span>
                    </div>
                    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {stepperStages.map((step, idx) => {
                        const rank = getStepRank(activeDoc.stage);
                        const reached = idx <= rank && activeDoc.stage !== 'ARCHIVED';
                        const current = idx === rank && activeDoc.stage !== 'CHANGES_REQUESTED' && activeDoc.stage !== 'ARCHIVED';
                        return (
                          <li
                            key={step.id}
                            className={`rounded-lg border px-2.5 py-2 text-xs ${
                              current
                                ? 'border-[var(--exo-accent)] bg-[var(--exo-surface-alt)] font-semibold text-[var(--exo-text)]'
                                : reached
                                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                  : 'exo-accent-border bg-[var(--exo-surface-alt)]/50 exo-muted-text'
                            }`}
                          >
                            {step.label}
                          </li>
                        );
                      })}
                    </ol>
                  </div>

                  {/* Content Viewer or Inline Editor */}
                  {editing ? (
                    <div className="space-y-2.5 rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] p-3">
                      <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          aria-label="Titre du document"
                          className="min-h-[44px] rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-3 text-xs text-[var(--exo-text)]"
                        />
                        <input
                          type="text"
                          value={editVersion}
                          onChange={(e) => setEditVersion(e.target.value)}
                          aria-label="Version SemVer"
                          className="min-h-[44px] rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-3 font-mono-num text-xs text-[var(--exo-text)]"
                        />
                      </div>
                      <input
                        type="text"
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                        aria-label="Résumé"
                        className="min-h-[44px] w-full rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-3 text-xs text-[var(--exo-text)]"
                      />
                      <textarea
                        rows={6}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        aria-label="Contenu documentaire"
                        className="w-full rounded-lg border exo-accent-border bg-[var(--exo-surface)] p-3 font-mono text-xs text-[var(--exo-text)]"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(false)}
                          className="exo-accent-chip min-h-[44px] px-3 text-xs font-semibold"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleSaveEdit()}
                          className="exo-accent-btn min-h-[44px] px-4 text-xs font-semibold"
                        >
                          Enregistrer les modifications
                        </button>
                      </div>
                    </div>
                  ) : (
                    <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] p-3 font-mono text-[11px] leading-relaxed text-[var(--exo-text)]">
                      {activeDoc.content}
                    </pre>
                  )}

                  {/* Quality Standards Gate */}
                  <div className="space-y-2 border-t exo-accent-border pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--exo-text)]">
                        <ShieldCheck className="h-4 w-4 exo-accent-text" />
                        <span>Standards de Conformité Requis</span>
                      </div>
                      <span className="font-mono-num text-xs exo-muted-text">
                        {activeQuality.passedCount} / {activeQuality.totalCount} conformes
                      </span>
                    </div>

                    <div className="divide-y divide-[rgba(var(--exo-accent-rgb),0.14)] rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)]/55">
                      {activeQuality.checks.map((chk) => {
                        const canToggle =
                          !chk.automated &&
                          activeDoc.stage === docPerms.expectedReviewStage &&
                          docPerms.review.allowed;
                        return (
                          <div key={chk.id} className="flex items-start justify-between gap-3 px-3 py-2 text-xs">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                {chk.automated ? (
                                  chk.passed ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                                  )
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={chk.passed}
                                    disabled={!canToggle || busy}
                                    onChange={() => void handleToggleManualStandard(chk.id)}
                                    aria-label={chk.label}
                                    className="h-4 w-4 shrink-0 accent-[var(--exo-accent)] disabled:opacity-50"
                                  />
                                )}
                                <span className="font-medium text-[var(--exo-text)]">{chk.label}</span>
                              </div>
                              <p className="mt-0.5 pl-5 text-[11px] exo-muted-text">{chk.detail}</p>
                            </div>
                            <span className="shrink-0 font-mono-num text-[10.5px] exo-muted-text">
                              {chk.automated ? 'Auto' : 'Réviseur'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Workflow Actions & Comment */}
                  <div className="space-y-2.5 border-t exo-accent-border pt-3">
                    <label className="block space-y-1 text-xs">
                      <span className="font-medium text-[var(--exo-text)]">
                        Note de révision / motif de décision (obligatoire pour demander des corrections)
                      </span>
                      <input
                        type="text"
                        value={actionComment}
                        onChange={(e) => setActionComment(e.target.value)}
                        placeholder="Ex: Conformité L0-L8 et nomenclature R-50 vérifiées."
                        className="min-h-[44px] w-full rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-3 text-xs text-[var(--exo-text)]"
                      />
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {(activeDoc.stage === 'DRAFT' || activeDoc.stage === 'CHANGES_REQUESTED') && (
                        <ExoTooltip title="Soumettre en révision" body={docPerms.submit.reason}>
                          <button
                            type="button"
                            data-testid="gov-action-submit"
                            disabled={busy || !docPerms.submit.allowed}
                            onClick={() => void handleWorkflowAction('SUBMIT_REVIEW')}
                            className="exo-accent-btn inline-flex min-h-[44px] items-center gap-1.5 px-3.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {docPerms.submit.allowed ? <Send className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                            <span>Soumettre en révision</span>
                          </button>
                        </ExoTooltip>
                      )}

                      {activeDoc.stage === docPerms.expectedReviewStage && (
                        <>
                          <ExoTooltip
                            title="Valider l’étape de révision spécialisée"
                            body={docPerms.review.reason}
                          >
                            <button
                              type="button"
                              data-testid="gov-action-pass-review"
                              disabled={busy || !docPerms.review.allowed}
                              onClick={() => void handleWorkflowAction('PASS_SPECIALIZED_REVIEW')}
                              className="exo-accent-btn inline-flex min-h-[44px] items-center gap-1.5 px-3.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              {docPerms.review.allowed ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : (
                                <Lock className="h-3.5 w-3.5" />
                              )}
                              <span>Valider la révision</span>
                            </button>
                          </ExoTooltip>

                          <ExoTooltip title="Demander des corrections" body={docPerms.requestChanges.reason}>
                            <button
                              type="button"
                              data-testid="gov-action-request-changes"
                              disabled={busy || !docPerms.requestChanges.allowed}
                              onClick={() => void handleWorkflowAction('REQUEST_CHANGES')}
                              className="exo-accent-chip inline-flex min-h-[44px] items-center gap-1.5 px-3.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                              <span>Demander corrections</span>
                            </button>
                          </ExoTooltip>
                        </>
                      )}

                      {activeDoc.stage === 'READY_FOR_APPROVAL' && (
                        <>
                          <ExoTooltip title="Validation finale & Publication" body={docPerms.approve.reason}>
                            <button
                              type="button"
                              data-testid="gov-action-approve"
                              disabled={busy || !docPerms.approve.allowed}
                              onClick={() => void handleWorkflowAction('APPROVE_PUBLISH')}
                              className="exo-accent-btn inline-flex min-h-[44px] items-center gap-1.5 px-3.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              {docPerms.approve.allowed ? (
                                <ShieldCheck className="h-3.5 w-3.5" />
                              ) : (
                                <Lock className="h-3.5 w-3.5" />
                              )}
                              <span>Approuver &amp; Publier</span>
                            </button>
                          </ExoTooltip>

                          <ExoTooltip title="Renvoyer en correction" body={docPerms.requestChanges.reason}>
                            <button
                              type="button"
                              disabled={busy || !docPerms.requestChanges.allowed}
                              onClick={() => void handleWorkflowAction('REQUEST_CHANGES')}
                              className="exo-accent-chip inline-flex min-h-[44px] items-center gap-1.5 px-3.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                              <span>Demander corrections</span>
                            </button>
                          </ExoTooltip>
                        </>
                      )}

                      {(activeDoc.stage === 'PUBLISHED' || activeDoc.stage === 'ARCHIVED') && (
                        <ExoTooltip title="Ouvrir une nouvelle révision" body={docPerms.edit.reason}>
                          <button
                            type="button"
                            disabled={busy || !docPerms.edit.allowed}
                            onClick={() => void handleWorkflowAction('REOPEN_DRAFT')}
                            className="exo-accent-chip inline-flex min-h-[44px] items-center gap-1.5 px-3.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <RotateCcw className="h-3.5 w-3.5 exo-accent-text" />
                            <span>Nouvelle révision</span>
                          </button>
                        </ExoTooltip>
                      )}

                      {activeDoc.stage !== 'ARCHIVED' && (
                        <ExoTooltip title="Archiver le document" body={docPerms.archive.reason}>
                          <button
                            type="button"
                            disabled={busy || !docPerms.archive.allowed}
                            onClick={() => void handleWorkflowAction('ARCHIVE')}
                            className="exo-accent-chip inline-flex min-h-[44px] items-center gap-1.5 px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <Archive className="h-3.5 w-3.5 exo-muted-text" />
                            <span>Archiver</span>
                          </button>
                        </ExoTooltip>
                      )}
                    </div>
                  </div>

                  {/* Audit Trail */}
                  <div className="space-y-2 border-t exo-accent-border pt-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--exo-text)]">
                      <History className="h-3.5 w-3.5 exo-accent-text" />
                      <span>Journal d’Audit ({activeDoc.auditLog.length} événements)</span>
                    </div>
                    <ul className="max-h-36 space-y-1.5 overflow-y-auto text-[11px]">
                      {[...activeDoc.auditLog].reverse().map((evt) => (
                        <li
                          key={evt.id}
                          className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[rgba(var(--exo-accent-rgb),0.14)] pb-1.5"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-[var(--exo-text)]">{evt.actorName}</span>
                            <span aria-hidden="true" className="mx-1 exo-muted-text">·</span>
                            <span className="font-mono-num exo-accent-text">{evt.actorRole}</span>
                            <span aria-hidden="true" className="mx-1 exo-muted-text">·</span>
                            <span className="exo-muted-text">
                              {WORKFLOW_STAGE_LABELS[evt.fromStage]} → {WORKFLOW_STAGE_LABELS[evt.toStage]}
                            </span>
                            {evt.comment && (
                              <div className="mt-0.5 exo-muted-text">{evt.comment}</div>
                            )}
                          </div>
                          <span className="shrink-0 font-mono-num text-[10px] exo-muted-text">
                            {evt.timestampIso.slice(0, 16).replace('T', ' ')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-xs exo-muted-text">Sélectionnez un document dans le registre pour consulter son cycle de validation.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === TAB 2: ROLES & PERMISSIONS MATRIX === */}
      {subTab === 'ROLES' && (
        <DocGovernanceRolesView
          activeRole={activeRole}
          activeActorName={activeMember.displayName}
          assignments={assignments}
          onChangeMemberRole={handleChangeMemberRole}
        />
      )}

      {/* === TAB 3: CLASSIFICATION PLAN & STANDARDS === */}
      {subTab === 'TAXONOMY' && (
        <DocGovernanceTaxonomyView
          documents={documents}
          onFilterByCategory={(catCode, domain) => {
            setDomainFilter(domain);
            setCategoryFilter(catCode as DocCategoryCode);
            setSubTab('WORKFLOW');
          }}
        />
      )}
    </div>
  );
}
