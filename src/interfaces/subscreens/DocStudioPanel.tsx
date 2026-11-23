import { useMemo, useState } from 'react';
import {
  AppWindow,
  BookMarked,
  BookOpen,
  ClipboardCheck,
  Cloud,
  Compass,
  Database,
  Gamepad2,
  GitBranch,
  GitCommitHorizontal,
  Network,
  Radio,
  Search,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import type { DocCategoryCode, DocDomainScope } from '../../contracts/doc-governance.schema.ts';
import { DOC_CATEGORIES_CATALOG } from '../../data/doc-governance.catalog.ts';
import { useProjectDocsQuery } from '../../hooks/use-oracle-query.ts';
import { AgentPyramidPanel } from './AgentPyramidPanel.tsx';
import { BetaP13HubPanel } from './BetaP13HubPanel.tsx';
import { BlueprintAtlasView } from './BlueprintAtlasView.tsx';
import { DocGovernancePanel } from './DocGovernancePanel.tsx';
import { DocVcsPanel } from './DocVcsPanel.tsx';
import { DriveSyncPanel } from './DriveSyncPanel.tsx';
import { ExternalSyncPanel } from './ExternalSyncPanel.tsx';
import { LlmLexiconPanel } from './LlmLexiconPanel.tsx';
import { SwarmRelayPanel } from './SwarmRelayPanel.tsx';
import { WorkflowComparisonPanel } from './WorkflowComparisonPanel.tsx';

export type DocStudioTabId =
  | 'GOVERNANCE'
  | 'DOC_VCS'
  | 'DRIVE_SYNC'
  | 'EXTERNAL_SYNC'
  | 'PROJECT_DOCS'
  | 'CATALOGS'
  | 'LLM_LEXICON'
  | 'ATLAS'
  | 'BETA_P13'
  | 'WORKFLOWS'
  | 'AGENTS_PYRAMID'
  | 'SWARM_BRIDGE';

export type HubWingId = 'APP_CORE' | 'GAME_ASSETS' | 'WORKFLOWS_SWARM';

interface DocStudioPanelProps {
  readonly initialTab?: DocStudioTabId;
}

const TAB_TO_WING: Readonly<Record<DocStudioTabId, HubWingId>> = {
  GOVERNANCE: 'APP_CORE',
  DOC_VCS: 'APP_CORE',
  DRIVE_SYNC: 'APP_CORE',
  EXTERNAL_SYNC: 'APP_CORE',
  PROJECT_DOCS: 'GAME_ASSETS',
  CATALOGS: 'GAME_ASSETS',
  LLM_LEXICON: 'GAME_ASSETS',
  ATLAS: 'GAME_ASSETS',
  BETA_P13: 'GAME_ASSETS',
  WORKFLOWS: 'WORKFLOWS_SWARM',
  AGENTS_PYRAMID: 'WORKFLOWS_SWARM',
  SWARM_BRIDGE: 'WORKFLOWS_SWARM',
};

const HUB_WINGS = [
  {
    id: 'APP_CORE' as const,
    title: 'Pôle 1 · Application Core (Drive / Docs & VCS)',
    subtitle: 'Architecture, Skills, RBAC, Drive Picker & contrôle de version documentaire séparé du code',
    defaultTab: 'GOVERNANCE' as const,
    icon: AppWindow,
  },
  {
    id: 'GAME_ASSETS' as const,
    title: 'Pôle 2 · Jeu, Règles & Assets 3D',
    subtitle: 'Règles PA, scénarios 6 Ères, catalogues gameplay, Dico LLM, plans 3D/Unity & Bêta P13',
    defaultTab: 'PROJECT_DOCS' as const,
    icon: Gamepad2,
  },
  {
    id: 'WORKFLOWS_SWARM' as const,
    title: 'Pôle 3 · Workflows, Essaim & Communication',
    subtitle: 'Flux Drive/Doc vs Code, pyramide 15 agents & pont Preview ↔ AI Studio ↔ Antigravity',
    defaultTab: 'WORKFLOWS' as const,
    icon: Workflow,
  },
] as const;

const TABS_BY_WING: Readonly<
  Record<
    HubWingId,
    readonly { readonly id: DocStudioTabId; readonly label: string; readonly icon: typeof ShieldCheck }[]
  >
> = {
  APP_CORE: [
    { id: 'GOVERNANCE', label: 'Gouvernance, Rôles & Validation', icon: ShieldCheck },
    { id: 'DOC_VCS', label: 'Git Docs (VCS Séparé)', icon: GitCommitHorizontal },
    { id: 'DRIVE_SYNC', label: 'Google Drive & Docs (Isolé)', icon: Cloud },
    { id: 'EXTERNAL_SYNC', label: 'GitHub & Notebook', icon: GitBranch },
  ],
  GAME_ASSETS: [
    { id: 'PROJECT_DOCS', label: 'Archives Séparées (Jeu / App)', icon: BookOpen },
    { id: 'CATALOGS', label: 'Catalogues Gameplay', icon: Database },
    { id: 'LLM_LEXICON', label: 'Dico LLM', icon: BookMarked },
    { id: 'ATLAS', label: 'Plans 3D & Unity', icon: Compass },
    { id: 'BETA_P13', label: 'Bêta P13', icon: ClipboardCheck },
  ],
  WORKFLOWS_SWARM: [
    { id: 'WORKFLOWS', label: 'Workflows Drive/Doc vs Code', icon: Workflow },
    { id: 'AGENTS_PYRAMID', label: 'Organigramme Agents (Triangle)', icon: Network },
    { id: 'SWARM_BRIDGE', label: 'Pont Preview ↔ Antigravity / Swarm', icon: Radio },
  ],
};

/**
 * [L7 — SEPARATED DOCUMENTATION HUB, DOC VCS & MULTI-SURFACE SWARM STUDIO]
 * Clearly isolates:
 * 1. Application Core Documentation (Drive / Google Docs + dedicated Doc VCS)
 * 2. Game, Rules & 3D/Asset Documentation
 * 3. Explicit Dual Workflows & Preview ↔ AI Studio ↔ Antigravity Swarm Bridge
 */
export function DocStudioPanel({ initialTab = 'GOVERNANCE' }: DocStudioPanelProps) {
  const [tab, setTab] = useState<DocStudioTabId>(initialTab);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState<'ALL' | DocDomainScope>(
    initialTab === 'PROJECT_DOCS' ? 'GAME' : 'ALL',
  );
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | DocCategoryCode>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading } = useProjectDocsQuery();

  const activeWing = TAB_TO_WING[tab];
  const docs = data?.documents ?? [];
  const appDocsCount = useMemo(() => docs.filter((d) => d.domain === 'APP').length, [docs]);
  const gameDocsCount = useMemo(() => docs.filter((d) => d.domain === 'GAME').length, [docs]);

  const selectWing = (wingId: HubWingId) => {
    const wing = HUB_WINGS.find((w) => w.id === wingId);
    if (!wing) return;
    if (wingId === 'GAME_ASSETS') {
      setDomainFilter('GAME');
      setCategoryFilter('ALL');
    }
    setTab(wing.defaultTab);
  };

  const visibleCategories = useMemo(
    () =>
      domainFilter === 'ALL'
        ? DOC_CATEGORIES_CATALOG
        : DOC_CATEGORIES_CATALOG.filter((c) => c.domain === domainFilter),
    [domainFilter],
  );

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return docs.filter((d) => {
      if (domainFilter !== 'ALL' && d.domain !== domainFilter) return false;
      if (categoryFilter !== 'ALL' && d.categoryCode !== categoryFilter) return false;
      if (!q) return true;
      return `${d.filingCode} ${d.code} ${d.title} ${d.category}`.toLowerCase().includes(q);
    });
  }, [docs, domainFilter, categoryFilter, searchQuery]);

  const activeDoc = filteredDocs.find((d) => d.id === selectedDocId) ?? filteredDocs[0] ?? null;

  return (
    <div className="space-y-4" data-testid="doc-hub-root">
      {/* Top Level Hub Wing Selector: Strictly separates App Core (Drive/Doc) vs Game & Assets vs Workflows/Swarm */}
      <div className="grid gap-2.5 md:grid-cols-3">
        {HUB_WINGS.map((wing) => {
          const Icon = wing.icon;
          const isCurrent = activeWing === wing.id;
          return (
            <button
              key={wing.id}
              type="button"
              data-testid={`doc-hub-wing-${wing.id.toLowerCase()}`}
              onClick={() => selectWing(wing.id)}
              className={`flex min-h-[56px] flex-col items-start justify-between rounded-xl border p-3 text-left transition ${
                isCurrent
                  ? 'exo-accent-chip-active border-[var(--exo-accent)]'
                  : 'exo-accent-border bg-[var(--exo-surface)] hover:border-[var(--exo-accent)]'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--exo-text)]">
                <Icon className="h-4 w-4 shrink-0 exo-accent-text" />
                <span>{wing.title}</span>
              </div>
              <p className="mt-1 text-[11px] leading-snug exo-muted-text">{wing.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Sub-navigation within the active Hub Wing */}
      <div className="flex flex-wrap gap-2 border-b exo-accent-border pb-3">
        {TABS_BY_WING[activeWing].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`doc-studio-tab-${item.id.toLowerCase()}`}
              onClick={() => setTab(item.id)}
              className={`inline-flex min-h-[44px] items-center gap-2 px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                active ? 'exo-accent-chip-active' : 'exo-accent-chip'
              }`}
            >
              <Icon className="h-3.5 w-3.5 exo-accent-text" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'GOVERNANCE' && <DocGovernancePanel />}
      {tab === 'DOC_VCS' && <DocVcsPanel />}
      {tab === 'DRIVE_SYNC' && <DriveSyncPanel />}
      {tab === 'EXTERNAL_SYNC' && <ExternalSyncPanel />}

      {tab === 'PROJECT_DOCS' && (
        <div className="space-y-3" data-testid="separated-project-docs-view">
          {/* Separated Domain Selector: Application vs Game */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'GAME' as const, label: `Pôle Jeu & Assets (${gameDocsCount})` },
                { id: 'APP' as const, label: `Pôle Application (${appDocsCount})` },
                { id: 'ALL' as const, label: `Toutes archives (${docs.length})` },
              ].map((pole) => (
                <button
                  key={pole.id}
                  type="button"
                  data-testid={`archive-domain-${pole.id.toLowerCase()}`}
                  onClick={() => {
                    setDomainFilter(pole.id);
                    setCategoryFilter('ALL');
                  }}
                  className={`min-h-[44px] px-3 text-xs font-semibold transition whitespace-nowrap ${
                    domainFilter === pole.id ? 'exo-accent-chip-active' : 'exo-accent-chip'
                  }`}
                >
                  {pole.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 exo-muted-text" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer par code ou mot-clé..."
                aria-label="Rechercher dans les archives documentaires"
                className="min-h-[44px] w-56 rounded-lg border exo-accent-border bg-[var(--exo-surface)] pl-8 pr-3 text-xs text-[var(--exo-text)]"
              />
            </div>
          </div>

          {/* Sub-categories for the selected pole */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`min-h-[38px] px-2.5 font-mono-num text-[11px] font-semibold transition whitespace-nowrap ${
                categoryFilter === 'ALL' ? 'exo-accent-chip-active' : 'exo-accent-chip'
              }`}
            >
              Toutes sous-catégories
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

          <div className="grid gap-4 lg:grid-cols-[290px_1fr]">
            <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
              {isLoading && <p className="text-xs exo-muted-text">Chargement des archives séparées…</p>}
              {filteredDocs.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDocId(d.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    activeDoc?.id === d.id
                      ? 'exo-accent-chip-active border-[var(--exo-accent)]'
                      : 'exo-accent-border bg-[var(--exo-surface)] hover:border-[var(--exo-accent)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 font-mono-num text-[11px]">
                    <span className="font-bold exo-accent-text">{d.filingCode}</span>
                    <span className="exo-muted-text">{d.domain === 'APP' ? 'Application' : 'Jeu'}</span>
                  </div>
                  <div className="mt-1 text-xs font-semibold text-[var(--exo-text)]">{d.title}</div>
                  <div className="mt-1 font-mono-num text-[10px] exo-muted-text">
                    {d.category} · {Math.max(1, Math.round(d.sizeBytes / 1024))} Ko
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-4">
              {activeDoc ? (
                <>
                  <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2 border-b exo-accent-border pb-2">
                    <div>
                      <div className="font-mono-num text-[11px] exo-accent-text">
                        {activeDoc.filingCode} · {activeDoc.domain === 'APP' ? 'Pôle Application' : 'Pôle Jeu'} · {activeDoc.category}
                      </div>
                      <span className="font-display text-sm font-bold text-[var(--exo-text)]">
                        {activeDoc.title}
                      </span>
                    </div>
                    <span className="font-mono-num text-[11px] exo-muted-text">{activeDoc.code}</span>
                  </div>
                  <pre className="max-h-[46vh] overflow-y-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-[var(--exo-text)] opacity-90">
                    {activeDoc.fullText}
                  </pre>
                </>
              ) : (
                <p className="text-xs exo-muted-text">Aucun document trouvé dans cette catégorie.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'CATALOGS' && data && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-4">
            <h3 className="font-display text-sm font-bold exo-accent-text">
              Contrat Générateur d’Événements Contextuels
            </h3>
            <dl className="mt-2 space-y-1.5 text-xs text-[var(--exo-text)]">
              <div>
                <dt className="font-mono-num text-[11px] exo-muted-text">Format d’Échange</dt>
                <dd>{data.catalogs.eventGeneratorContractSummary.schemaName}</dd>
              </div>
              <div>
                <dt className="font-mono-num text-[11px] exo-muted-text">Cohérence Narrative</dt>
                <dd>Graphe orienté acyclique contrôlé avant publication</dd>
              </div>
              <div>
                <dt className="font-mono-num text-[11px] exo-muted-text">Équilibrage d’Impact</dt>
                <dd>Modulateurs bornés entre -15 % et +15 %</dd>
              </div>
              <div>
                <dt className="font-mono-num text-[11px] exo-muted-text">Nomenclature Éditoriale</dt>
                <dd>Découvertes scientifiques et diplomatiques vérifiées</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-4">
            <h3 className="font-display text-sm font-bold text-emerald-600 dark:text-emerald-400">
              Catalogue des Découvertes ({data.catalogs.scientificDiscoveries.length} entrées)
            </h3>
            <ul className="mt-2 space-y-1.5 text-xs text-[var(--exo-text)]">
              {data.catalogs.scientificDiscoveries.map((label, idx) => (
                <li
                  key={label}
                  className="flex justify-between gap-2 border-b border-[rgba(var(--exo-accent-rgb),0.15)] pb-1"
                >
                  <span className="font-medium">{label}</span>
                  <span className="font-mono-num text-[10px] text-emerald-600 dark:text-emerald-400">SCI-0{idx + 1}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-4">
            <h3 className="font-display text-sm font-bold exo-accent-2-text">
              6 Ères de Campagne &amp; Plafonds Technologiques
            </h3>
            <ul className="mt-2 space-y-1 text-xs text-[var(--exo-text)]">
              {data.catalogs.eras.map((e) => (
                <li
                  key={e.era}
                  className="flex justify-between border-b border-[rgba(var(--exo-accent-rgb),0.15)] py-1"
                >
                  <span>{e.name}</span>
                  <span className="font-mono-num exo-accent-2-text">
                    Rang {e.maxUnitLevel} · {e.starsRequired}★
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-4">
            <h3 className="font-display text-sm font-bold exo-accent-text">
              6 Destinations Orbitales &amp; Corps Célestes
            </h3>
            <ul className="mt-2 space-y-1 text-xs text-[var(--exo-text)]">
              {data.catalogs.planetarySlots.map((slot) => (
                <li
                  key={slot.slotIndex}
                  className="flex justify-between border-b border-[rgba(var(--exo-accent-rgb),0.15)] py-1"
                >
                  <span>{slot.name}</span>
                  <span className="font-mono-num exo-muted-text">
                    {slot.bodyType} (Ère {slot.unlockEra})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'LLM_LEXICON' && <LlmLexiconPanel />}
      {tab === 'ATLAS' && <BlueprintAtlasView />}
      {tab === 'BETA_P13' && <BetaP13HubPanel />}
      {tab === 'WORKFLOWS' && (
        <WorkflowComparisonPanel
          onOpenDocVcs={() => setTab('DOC_VCS')}
          onOpenDriveSync={() => setTab('DRIVE_SYNC')}
          onOpenGovernance={() => setTab('GOVERNANCE')}
          onOpenSwarmBridge={() => setTab('SWARM_BRIDGE')}
        />
      )}
      {tab === 'AGENTS_PYRAMID' && <AgentPyramidPanel />}
      {tab === 'SWARM_BRIDGE' && <SwarmRelayPanel />}
    </div>
  );
}
