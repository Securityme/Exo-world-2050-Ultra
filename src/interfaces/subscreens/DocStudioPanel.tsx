import { useState } from 'react';
import { BookMarked, BookOpen, Cloud, Compass, Database } from 'lucide-react';
import { useProjectDocsQuery } from '../../hooks/use-oracle-query.ts';
import { BlueprintAtlasView } from './BlueprintAtlasView.tsx';
import { DriveSyncPanel } from './DriveSyncPanel.tsx';
import { LlmLexiconPanel } from './LlmLexiconPanel.tsx';

export type DocStudioTabId = 'PROJECT_DOCS' | 'CATALOGS' | 'LLM_LEXICON' | 'ATLAS' | 'DRIVE_SYNC';

interface DocStudioPanelProps {
  readonly initialTab?: DocStudioTabId;
}

/**
 * [L7 — ISOLATED GOVERNANCE & PROJECT DOCS PANEL]
 * Reusable inside Paramètres and DocSyncStudioModal:
 * 1. Read-only Project Folder Documents & Structured Game Catalogs
 * 2. Interactive Maps, Plans, Flowcharts & Orbital Diagrams
 * 3. Strictly isolated Google Drive & Google Docs documentary sync
 */
export function DocStudioPanel({ initialTab = 'PROJECT_DOCS' }: DocStudioPanelProps) {
  const [tab, setTab] = useState<DocStudioTabId>(initialTab);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docCategoryFilter, setDocCategoryFilter] = useState<string>('ALL');
  const { data, isLoading } = useProjectDocsQuery();

  const docs = data?.documents ?? [];
  const filteredDocs = docs.filter((d) => {
    if (docCategoryFilter === 'ALL') return true;
    const low = `${d.code} ${d.title} ${d.category}`.toLowerCase();
    if (docCategoryFilter === 'USER_GUIDES') return low.includes('guide') || low.includes('readme');
    if (docCategoryFilter === 'DESIGN') return low.includes('design') || low.includes('pax') || low.includes('ui');
    if (docCategoryFilter === 'LORE_PLAYTEST') return low.includes('playtest') || low.includes('beta') || low.includes('changelog') || low.includes('lore');
    return !low.includes('guide') && !low.includes('pax') && !low.includes('playtest') && !low.includes('beta');
  });
  const activeDoc = filteredDocs.find((d) => d.id === selectedDocId) ?? filteredDocs[0] ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'PROJECT_DOCS' as const, label: 'Dossier Projet (4 Catégories)', icon: BookOpen },
          { id: 'CATALOGS' as const, label: 'Catalogues', icon: Database },
          { id: 'LLM_LEXICON' as const, label: 'Dico LLM', icon: BookMarked },
          { id: 'ATLAS' as const, label: 'Plans 3D', icon: Compass },
          { id: 'DRIVE_SYNC' as const, label: 'Google Drive (Isolé)', icon: Cloud },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex min-h-[38px] items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${
                active
                  ? 'border-rose-500 bg-rose-500/15 text-rose-800 dark:border-rose-400 dark:bg-rose-500/25 dark:text-rose-100'
                  : 'border-rose-200 bg-white/80 text-rose-950/75 hover:border-rose-400 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'PROJECT_DOCS' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5 font-mono text-[10.5px]">
            {[
              { id: 'ALL', label: `Toutes (${docs.length})` },
              { id: 'TECH_SPECS', label: '1. Spécifications Techniques' },
              { id: 'USER_GUIDES', label: '2. Guides Utilisateur (Drive)' },
              { id: 'DESIGN', label: '3. Maquettes Design' },
              { id: 'LORE_PLAYTEST', label: '4. Lore, Règles, Playtest' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setDocCategoryFilter(cat.id)}
                className={`min-h-[30px] rounded-lg px-2.5 font-semibold transition ${
                  docCategoryFilter === cat.id ? 'exo-accent-chip-active' : 'exo-accent-chip'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <div className="max-h-[48vh] space-y-2 overflow-y-auto pr-1">
              {isLoading && <p className="text-xs text-rose-700/70 dark:text-rose-200/70">Chargement du dossier projet…</p>}
              {filteredDocs.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDocId(d.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    activeDoc?.id === d.id
                      ? 'border-rose-500 bg-rose-50 dark:border-rose-400 dark:bg-rose-500/20'
                      : 'border-rose-200/80 bg-white/85 hover:border-rose-400 dark:border-rose-900/60 dark:bg-rose-950/25'
                  }`}
                >
                  <div className="font-mono text-[11px] font-semibold text-rose-600 dark:text-rose-300">{d.code}</div>
                  <div className="mt-0.5 text-xs font-semibold text-[#1f1224] dark:text-rose-50">{d.title}</div>
                  <div className="mt-1 font-mono text-[10px] text-rose-900/60 dark:text-rose-200/60">
                    {Math.round(d.sizeBytes / 1024)} Ko · {d.category}
                  </div>
                </button>
              ))}
            </div>
          <div className="rounded-xl border border-rose-200 bg-white/90 p-4 dark:border-rose-900/60 dark:bg-[#190d1f]">
            {activeDoc ? (
              <>
                <div className="mb-2 flex items-center justify-between border-b border-rose-200 pb-2 dark:border-rose-900/60">
                  <span className="font-display text-sm font-bold text-[#1f1224] dark:text-rose-50">{activeDoc.title}</span>
                  <span className="font-mono text-[11px] text-rose-600 dark:text-rose-300">{activeDoc.code}</span>
                </div>
                <pre className="max-h-[44vh] overflow-y-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-rose-950/85 dark:text-rose-100/85">
                  {activeDoc.fullText}
                </pre>
              </>
            ) : (
              <p className="text-xs text-rose-900/65 dark:text-rose-200/65">Aucun document trouvé dans cette catégorie.</p>
            )}
          </div>
          </div>
        </div>
      )}

      {tab === 'CATALOGS' && data && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-rose-200 bg-white/85 p-4 dark:border-rose-900/60 dark:bg-rose-950/25">
            <h3 className="font-display text-sm font-bold text-rose-700 dark:text-rose-300">
              Contrat Générateur d’Événements Contextuels
            </h3>
            <dl className="mt-2 space-y-1.5 text-xs text-rose-950/85 dark:text-rose-100/85">
              <div>
                <dt className="font-mono text-[11px] text-rose-600 dark:text-rose-300">Format d’Échange</dt>
                <dd>{data.catalogs.eventGeneratorContractSummary.schemaName}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] text-rose-600 dark:text-rose-300">Cohérence Narrative</dt>
                <dd>Graphe orienté acyclique contrôlé avant publication</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] text-rose-600 dark:text-rose-300">Équilibrage d’Impact</dt>
                <dd>Modulateurs bornés entre -15 % et +15 %</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] text-rose-600 dark:text-rose-300">Nomenclature Éditoriale</dt>
                <dd>Découvertes scientifiques et diplomatiques vérifiées</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-rose-200 bg-white/85 p-4 dark:border-rose-900/60 dark:bg-rose-950/25">
            <h3 className="font-display text-sm font-bold text-emerald-700 dark:text-emerald-300">
              Catalogue des Découvertes ({data.catalogs.scientificDiscoveries.length} entrées)
            </h3>
            <ul className="mt-2 space-y-1.5 text-xs text-rose-950/85 dark:text-rose-100/85">
              {data.catalogs.scientificDiscoveries.map((label, idx) => (
                <li
                  key={label}
                  className="flex justify-between gap-2 border-b border-rose-100 pb-1 dark:border-rose-900/40"
                >
                  <span className="font-medium">{label}</span>
                  <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-300">SCI-0{idx + 1}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-rose-200 bg-white/85 p-4 dark:border-rose-900/60 dark:bg-rose-950/25">
            <h3 className="font-display text-sm font-bold text-amber-700 dark:text-amber-300">
              6 Ères de Campagne &amp; Plafonds Technologiques
            </h3>
            <ul className="mt-2 space-y-1 text-xs text-rose-950/85 dark:text-rose-100/85">
              {data.catalogs.eras.map((e) => (
                <li
                  key={e.era}
                  className="flex justify-between border-b border-rose-100 py-1 dark:border-rose-900/40"
                >
                  <span>{e.name}</span>
                  <span className="font-mono text-amber-700 dark:text-amber-300">
                    Rang {e.maxUnitLevel} · {e.starsRequired}★
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-rose-200 bg-white/85 p-4 dark:border-rose-900/60 dark:bg-rose-950/25">
            <h3 className="font-display text-sm font-bold text-rose-700 dark:text-rose-300">
              6 Destinations Orbitales &amp; Corps Célestes
            </h3>
            <ul className="mt-2 space-y-1 text-xs text-rose-950/85 dark:text-rose-100/85">
              {data.catalogs.planetarySlots.map((slot) => (
                <li
                  key={slot.slotIndex}
                  className="flex justify-between border-b border-rose-100 py-1 dark:border-rose-900/40"
                >
                  <span>{slot.name}</span>
                  <span className="font-mono text-rose-600 dark:text-rose-300">
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
      {tab === 'DRIVE_SYNC' && <DriveSyncPanel />}
    </div>
  );
}
