import { useEffect, useState } from 'react';
import { BookMarked, Cpu, RefreshCw, ShieldCheck, X } from 'lucide-react';
import type { DocVcsStoreState } from '../contracts/skills-vcs.schema.ts';
import {
  fetchDocsVcsState,
  loadFirestoreDocSyncStatus,
} from '../services/governance/docs-vcs.service.ts';
import { createInitialDocVcsStoreState } from '../systems/governance/skills-vcs.engine.ts';
import { DocsVcsLibraryPanel } from '../components/governance/DocsVcsLibraryPanel.tsx';
import { ModularSkillsRegistryPanel } from '../components/governance/ModularSkillsRegistryPanel.tsx';

type StudioWing = 'DOCS_VCS' | 'SKILLS_REGISTRY';

interface DocsSkillsHubScreenProps {
  readonly onClose: () => void;
}

/**
 * [L7] EXW.L7.DOCS_SKILLS_HUB_SCREEN | v5.1.0 | <= 135 lines (R-14)
 * Dedicated Studio uniting strictly separated Documentation VCS and Modular Skills Registry.
 * Reachable from both Main Menu and Settings.
 */
export function DocsSkillsHubScreen({ onClose }: DocsSkillsHubScreenProps) {
  const [wing, setWing] = useState<StudioWing>('DOCS_VCS');
  const [vcsState, setVcsState] = useState<DocVcsStoreState>(() => createInitialDocVcsStoreState());
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [cloudCount, setCloudCount] = useState<{ docs: number; skills: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshState = async () => {
    setLoading(true);
    const [nextState, cloudStatus] = await Promise.all([
      fetchDocsVcsState(),
      loadFirestoreDocSyncStatus(),
    ]);
    setVcsState(nextState);
    setCloudCount({ docs: cloudStatus.syncedDocsCount, skills: cloudStatus.syncedSkillsCount });
    setLoading(false);
  };

  useEffect(() => {
    void refreshState();
  }, []);

  const handleOpenLinkedDoc = (docId: string) => {
    setSelectedDocId(docId);
    setWing('DOCS_VCS');
  };

  return (
    <div
      data-testid="docs-skills-hub"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-0 sm:p-5"
    >
      <div className="exo-bento-card exo-astral-ticks flex h-[100dvh] w-full max-w-6xl flex-col rounded-none sm:h-auto sm:max-h-[92vh] sm:rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b exo-accent-border px-4 py-3 sm:px-5">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider exo-accent-text">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Atelier Isolé · Documentation VCS &amp; Skills Modulaires</span>
            </div>
            <h2 className="font-display text-base font-bold text-[var(--exo-text)] sm:text-lg">
              Gestion Documentaire (SemVer / Diff / Revert) &amp; Registre Skills Autonomes
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {cloudCount && (
              <span className="hidden rounded-lg border exo-accent-border px-2.5 py-1 font-mono text-[10.5px] exo-muted-text md:inline-flex">
                Firestore : {cloudCount.docs} docs · {cloudCount.skills} skills
              </span>
            )}
            <button
              type="button"
              onClick={() => void refreshState()}
              disabled={loading}
              aria-label="Actualiser l'état VCS et Skills"
              className="exo-accent-chip inline-flex h-10 w-10 items-center justify-center"
            >
              <RefreshCw className={`h-4 w-4 exo-accent-text ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer l'atelier Docs & Skills"
              className="exo-accent-chip inline-flex h-10 w-10 items-center justify-center"
            >
              <X className="h-5 w-5 exo-accent-text" />
            </button>
          </div>
        </div>

        {/* Strict Separation Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b exo-accent-border bg-[var(--exo-surface-alt)] px-4 py-2.5 sm:px-5">
          <div role="tablist" aria-label="Pôles Docs VCS et Skills" className="flex flex-wrap gap-2">
            <button
              type="button"
              role="tab"
              aria-selected={wing === 'DOCS_VCS'}
              data-testid="hub-wing-docs-vcs"
              onClick={() => setWing('DOCS_VCS')}
              className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 text-xs font-bold transition ${
                wing === 'DOCS_VCS' ? 'exo-window-tab-active' : 'exo-window-tab'
              }`}
            >
              <BookMarked className="h-4 w-4" />
              <span>Bibliothèque &amp; VCS Docs ({vcsState.docs.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={wing === 'SKILLS_REGISTRY'}
              data-testid="hub-wing-skills-registry"
              onClick={() => setWing('SKILLS_REGISTRY')}
              className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 text-xs font-bold transition ${
                wing === 'SKILLS_REGISTRY' ? 'exo-window-tab-active' : 'exo-window-tab'
              }`}
            >
              <Cpu className="h-4 w-4" />
              <span>Registre Skills Modulaires ({vcsState.skills.length})</span>
            </button>
          </div>

          <span className="font-mono text-[10px] exo-muted-text">
            {vcsState.revisions.length} révisions tracées · Séparation code/doc garantie
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {wing === 'DOCS_VCS' ? (
            <DocsVcsLibraryPanel
              vcsState={vcsState}
              selectedDocId={selectedDocId}
              onSelectDocId={setSelectedDocId}
              onStateChange={setVcsState}
            />
          ) : (
            <ModularSkillsRegistryPanel
              vcsState={vcsState}
              onStateChange={setVcsState}
              onOpenLinkedDoc={handleOpenLinkedDoc}
            />
          )}
        </div>
      </div>
    </div>
  );
}
