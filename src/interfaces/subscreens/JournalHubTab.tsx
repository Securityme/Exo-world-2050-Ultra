import { useState } from 'react';
import { useSetAtom } from 'jotai';
import { BarChart3, ClipboardCheck, FileJson, History, PlayCircle } from 'lucide-react';
import { JournalArchivesSuite } from '../../components/world/JournalArchivesSuite.tsx';
import { SUPERPOWERS_CATALOG } from '../../data/world.catalog.ts';
import { useExoStore } from '../../stores/game.store.ts';
import { toastNoticeAtom } from '../../stores/selection.atoms.ts';
import { formatAtmosphereStageName } from '../../utils/atmosphere-labels.ts';
import { BetaP13HubPanel } from './BetaP13HubPanel.tsx';
import { ChronicleSavesTab } from './ChronicleSavesTab.tsx';
import { JournalChroniclePanel } from './JournalChroniclePanel.tsx';

type JournalSubTab = 'CHRONICLE' | 'PLAYTEST_6T' | 'BETA_P13' | 'DIGEST';

/**
 * [L7] Primary Game Tab 3 — Journal
 * Sovereign Chronicle, Local & Cloud Saves, JSON/CSV/HTML Campaign Digest Exports,
 * Interactive Timeline Replay & Multi-Campaign Comparator.
 */
export function JournalHubTab() {
  const [subTab, setSubTab] = useState<JournalSubTab>('CHRONICLE');
  const world = useExoStore((s) => s.world);
  const setToast = useSetAtom(toastNoticeAtom);
  const superpower = SUPERPOWERS_CATALOG.find((s) => s.id === world.superpowerId);

  const onExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      campaignId: world.campaignId,
      superpower: superpower?.name ?? world.superpowerId,
      era: world.era,
      cycle: world.cycle,
      year: world.year,
      atmosphereTier: world.atmosphereTier,
      atmosphereProgress: world.atmosphereProgress,
      capturedTiles: world.capturedTiles.length,
      unlockedSlots: world.unlockedSlots,
      resources: world.resources,
      stateHash: world.stateHash,
      combatReports: world.combatReports,
      turn_snapshots: world.turn_snapshots ?? [],
      chronicle: world.chronicle,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exo-world-journal-${world.campaignId}-c${world.cycle}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setToast({
      id: Date.now(),
      tone: 'success',
      text: `Journal souverain (${world.chronicle.length} entrées) exporté en JSON.`,
    });
  };

  const tabs: readonly { id: JournalSubTab; label: string; icon: typeof History }[] = [
    { id: 'CHRONICLE', label: 'Chronique', icon: History },
    { id: 'PLAYTEST_6T', label: 'Playtest 6 Tours', icon: PlayCircle },
    { id: 'BETA_P13', label: 'Bêta P13', icon: ClipboardCheck },
    { id: 'DIGEST', label: 'Archives', icon: BarChart3 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav
          role="tablist"
          aria-label="Sections du journal"
          className="exo-window-tabs-rail flex shrink-0 flex-nowrap gap-1.5 overflow-x-auto sm:flex-wrap sm:overflow-visible"
        >
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = subTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSubTab(item.id)}
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 px-3.5 text-[13px] font-bold transition whitespace-nowrap ${
                  active ? 'exo-window-tab-active' : 'exo-window-tab'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-current' : 'exo-accent-text'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={onExportJson}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 text-xs font-semibold text-rose-800 hover:border-rose-500 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-100 whitespace-nowrap"
        >
          <FileJson className="h-3.5 w-3.5 text-rose-600 dark:text-rose-300" />
          <span>Exporter JSON</span>
        </button>
      </div>

      {subTab === 'CHRONICLE' && <ChronicleSavesTab />}
      {subTab === 'PLAYTEST_6T' && <JournalChroniclePanel />}
      {subTab === 'BETA_P13' && <BetaP13HubPanel />}

      {subTab === 'DIGEST' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="rounded-xl border border-rose-200/90 bg-white/85 p-3 dark:border-rose-900/60 dark:bg-[#190d1f]">
              <div className="font-mono text-[10px] uppercase text-rose-900/65 dark:text-rose-200/70">Campagne</div>
              <div className="mt-1 truncate font-display text-sm font-bold text-[#1f1224] dark:text-rose-50">
                {superpower?.code ?? world.superpowerId} · Ère {world.era}
              </div>
              <div className="font-mono text-[11px] tabular-nums text-rose-700 dark:text-rose-300">
                Cycle {world.cycle} ({world.year})
              </div>
            </div>

            <div className="rounded-xl border border-rose-200/90 bg-white/85 p-3 dark:border-rose-900/60 dark:bg-[#190d1f]">
              <div className="font-mono text-[10px] uppercase text-rose-900/65 dark:text-rose-200/70">Territoire</div>
              <div className="mt-1 font-display text-sm font-bold tabular-nums text-[#1f1224] dark:text-rose-50">
                {world.capturedTiles.length} / 72 secteurs
              </div>
              <div className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
                {world.unlockedSlots}/6 mondes · {formatAtmosphereStageName(world.atmosphereTier)}
              </div>
            </div>

            <div className="rounded-xl border border-rose-200/90 bg-white/85 p-3 dark:border-rose-900/60 dark:bg-[#190d1f]">
              <div className="font-mono text-[10px] uppercase text-rose-900/65 dark:text-rose-200/70">Économie</div>
              <div className="mt-1 font-display text-sm font-bold tabular-nums text-[#1f1224] dark:text-rose-50">
                {world.resources.credits} Crédits
              </div>
              <div className="font-mono text-[11px] text-amber-700 dark:text-amber-300">
                Cote {world.finance.solvencyRating} · {world.finance.loans.length}/3 prêts
              </div>
            </div>

            <div className="rounded-xl border border-rose-200/90 bg-white/85 p-3 dark:border-rose-900/60 dark:bg-[#190d1f]">
              <div className="font-mono text-[10px] uppercase text-rose-900/65 dark:text-rose-200/70">Rapports</div>
              <div className="mt-1 font-display text-sm font-bold tabular-nums text-[#1f1224] dark:text-rose-50">
                {world.chronicle.length} entrées
              </div>
              <div className="font-mono text-[11px] text-rose-700 dark:text-rose-300">
                {world.combatReports.length} rapport(s) tactique(s)
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-rose-200/90 bg-white/85 p-3.5 dark:border-rose-900/60 dark:bg-[#190d1f]">
            <div className="mb-2 font-display text-xs font-bold text-rose-700 dark:text-rose-300">
              Inventaire stratégique instantané
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px] tabular-nums sm:grid-cols-6">
              {[
                { label: 'Énergie', value: world.resources.energy },
                { label: 'Calcul', value: world.resources.compute },
                { label: 'Matériaux', value: world.resources.materials },
                { label: 'Eau', value: world.resources.water },
                { label: 'Vivres', value: world.resources.food },
                { label: 'Hélium-3', value: world.resources.helium3 },
              ].map((res) => (
                <div
                  key={res.label}
                  className="rounded-lg border border-rose-200/70 bg-rose-50/55 px-2.5 py-2 dark:border-rose-900/50 dark:bg-rose-950/30"
                >
                  <div className="text-[10px] text-rose-900/65 dark:text-rose-200/65">{res.label}</div>
                  <div className="font-bold text-[#1f1224] dark:text-rose-50">{res.value}</div>
                </div>
              ))}
            </div>
          </div>

          <JournalArchivesSuite world={world} />
        </div>
      )}
    </div>
  );
}
