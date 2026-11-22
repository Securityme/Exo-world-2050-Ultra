import { useEffect, useMemo, useState } from 'react';
import { flexRender } from '@tanstack/react-table';
import {
  getCoreRowModel,
  getFilteredRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from '@tanstack/react-table/legacy';
import { useSetAtom } from 'jotai';
import { CloudDownload, CloudUpload, HardDrive, History, Save, Trash2 } from 'lucide-react';
import { RichEntityText } from '../../components/RichEntityText.tsx';
import type { ChronicleEntry } from '../../contracts/world-state.schema.ts';
import { handleCloudSave } from '../../pipelines/game-actions.pipeline.ts';
import {
  auth,
  listUserCloudCampaigns,
  loadCloudCampaign,
  type CampaignSaveMeta,
} from '../../services/firebase/firebase-client.ts';
import {
  deleteLocalCampaign,
  listLocalCampaigns,
  type LocalCampaignMeta,
} from '../../services/saves/local-saves.service.ts';
import { useExoStore } from '../../stores/game.store.ts';
import { activeSubscreenAtom, toastNoticeAtom } from '../../stores/selection.atoms.ts';

/**
 * [L7] FUP-008 | SM-01 | SADT A5.1
 * TanStack Table filterable Chronicle + Local Browser Saves & Firebase Cloud Saves.
 */
export function ChronicleSavesTab() {
  const world = useExoStore((s) => s.world);
  const loadCampaignState = useExoStore((s) => s.loadCampaignState);
  const loadLocalCampaignById = useExoStore((s) => s.loadLocalCampaignById);
  const saveCurrentCampaignLocal = useExoStore((s) => s.saveCurrentCampaignLocal);
  const setScreen = useExoStore((s) => s.setScreen);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
  const setToast = useSetAtom(toastNoticeAtom);

  const [globalFilter, setGlobalFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [cloudSaves, setCloudSaves] = useState<CampaignSaveMeta[]>([]);
  const [localSaves, setLocalSaves] = useState<LocalCampaignMeta[]>(() => listLocalCampaigns());
  const [busy, setBusy] = useState(false);

  const refreshSaves = async () => {
    setLocalSaves(listLocalCampaigns());
    const [, items] = await listUserCloudCampaigns();
    if (items) setCloudSaves(items);
  };

  useEffect(() => {
    void refreshSaves();
  }, []);

  const categories = useMemo(() => {
    const uniq = Array.from(new Set(world.chronicle.map((c) => c.category)));
    return ['ALL', ...uniq];
  }, [world.chronicle]);

  const filteredChronicle = useMemo(
    () =>
      categoryFilter === 'ALL'
        ? world.chronicle
        : world.chronicle.filter((entry) => entry.category === categoryFilter),
    [world.chronicle, categoryFilter],
  );

  const columns = useMemo<LegacyColumnDef<ChronicleEntry>[]>(
    () => [
      { accessorKey: 'cycle', header: 'Cycle', cell: (i) => `C${String(i.getValue())}` },
      { accessorKey: 'category', header: 'Catégorie' },
      {
        accessorKey: 'title',
        header: 'Événement',
        cell: (i) => <RichEntityText text={String(i.getValue())} interactive />,
      },
      {
        accessorKey: 'detail',
        header: 'Détail',
        cell: (i) => <RichEntityText text={String(i.getValue())} interactive />,
      },
      {
        accessorKey: 'stateHash',
        header: 'Empreinte',
        cell: (i) => String(i.getValue()).slice(0, 10),
      },
    ],
    [],
  );

  const table = useLegacyTable({
    data: filteredChronicle,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const onLocalSave = () => {
    saveCurrentCampaignLocal();
    setLocalSaves(listLocalCampaigns());
    setToast({ id: Date.now(), tone: 'success', text: `Archive locale ${world.campaignId} enregistrée.` });
  };

  const onLocalLoad = (campaignId: string) => {
    const ok = loadLocalCampaignById(campaignId);
    if (!ok) {
      setToast({ id: Date.now(), tone: 'error', text: 'Archive locale corrompue ou introuvable.' });
      return;
    }
    setSubscreen('NONE');
    setToast({ id: Date.now(), tone: 'success', text: `Campagne ${campaignId} chargée.` });
  };

  const onLocalDelete = (campaignId: string) => {
    deleteLocalCampaign(campaignId);
    setLocalSaves(listLocalCampaigns());
  };

  const onCloudSave = async () => {
    setBusy(true);
    const [e, id] = await handleCloudSave();
    setBusy(false);
    if (e) {
      setToast({ id: Date.now(), tone: 'error', text: e.message });
      return;
    }
    setToast({ id: Date.now(), tone: 'success', text: `Campagne ${id} sauvegardée dans le Cloud.` });
    await refreshSaves();
  };

  const onCloudLoad = async (campaignId: string) => {
    setBusy(true);
    const [e, loaded] = await loadCloudCampaign(campaignId);
    setBusy(false);
    if (e || !loaded) {
      setToast({ id: Date.now(), tone: 'error', text: e?.message ?? 'Chargement échoué.' });
      return;
    }
    loadCampaignState(loaded);
    setSubscreen('NONE');
    setToast({ id: Date.now(), tone: 'success', text: `Campagne Cloud ${campaignId} restaurée.` });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200/90 bg-white/85 p-4 dark:border-rose-900/60 dark:bg-[#190d1f]">
        <div>
          <div className="font-display text-sm font-bold text-[#1f1224] dark:text-rose-100">
            Sauvegardes Locales &amp; Cloud
          </div>
          <div className="font-mono text-xs text-rose-900/65 dark:text-rose-200/70">
            Empreinte : {world.stateHash.slice(0, 14)}… · Graine #{world.worldSeed}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onLocalSave}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3.5 text-xs font-bold text-rose-800 hover:border-rose-500 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-100"
          >
            <Save className="h-4 w-4 text-rose-600 dark:text-rose-300" />
            Sauvegarde Locale
          </button>
          {!auth.currentUser ? (
            <button
              type="button"
              onClick={() => {
                setSubscreen('NONE');
                setScreen('EXO_AUTH');
              }}
              className="min-h-[44px] rounded-lg bg-rose-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-rose-500"
            >
              Connecter Compte Google
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onCloudSave()}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              <CloudUpload className="h-4 w-4" />
              Sauvegarder dans le Cloud
            </button>
          )}
        </div>
      </div>

      {localSaves.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 font-mono text-xs uppercase text-rose-700 dark:text-rose-300">
            <HardDrive className="h-3.5 w-3.5" />
            Archives Locales ({localSaves.length})
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {localSaves.map((s) => (
              <div
                key={s.campaignId}
                className="flex items-center justify-between gap-2 rounded-lg border border-rose-200/80 bg-white/85 px-3 py-2 text-xs dark:border-rose-900/50 dark:bg-[#190d1f]"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-[#1f1224] dark:text-rose-50">{s.campaignId}</div>
                  <div className="font-mono text-[10px] text-rose-900/65 dark:text-rose-200/70">
                    Ère {s.era} · C{s.cycle} · {s.atmosphereTier}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onLocalLoad(s.campaignId)}
                    className="min-h-[44px] rounded-lg border border-emerald-400/60 bg-emerald-500/12 px-3 font-mono text-[11px] font-semibold text-emerald-800 hover:bg-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-200"
                  >
                    Charger
                  </button>
                  <button
                    type="button"
                    onClick={() => onLocalDelete(s.campaignId)}
                    aria-label={`Supprimer ${s.campaignId}`}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-rose-200 text-rose-700 hover:border-rose-500 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cloudSaves.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {cloudSaves.map((s) => (
            <div
              key={s.campaignId}
              className="flex items-center justify-between gap-2 rounded-lg border border-rose-200/80 bg-white/85 px-3 py-2 text-xs dark:border-rose-900/50 dark:bg-[#190d1f]"
            >
              <div className="min-w-0">
                <div className="truncate font-semibold text-[#1f1224] dark:text-rose-50">{s.campaignId}</div>
                <div className="font-mono text-[10px] text-rose-900/65 dark:text-rose-200/70">
                  Ère {s.era} · C{s.cycle} · {s.atmosphereTier}
                </div>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onCloudLoad(s.campaignId)}
                className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-3 font-mono text-[11px] font-semibold text-rose-800 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-100"
              >
                <CloudDownload className="h-3.5 w-3.5" />
                Charger
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 font-display text-sm font-bold text-[#1f1224] dark:text-rose-100">
            <History className="h-4 w-4 text-rose-600 dark:text-rose-300" />
            Chronique Souveraine ({filteredChronicle.length}/{world.chronicle.length} entrées)
          </h3>
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Filtrer la chronique..."
            className="min-h-[44px] w-full rounded-lg border border-rose-200 bg-white px-3 text-xs text-[#1f1224] placeholder:text-rose-900/45 dark:border-rose-800 dark:bg-[#190d1f] dark:text-rose-50 sm:w-64"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`min-h-[34px] rounded-lg border px-2.5 font-mono text-[11px] font-semibold transition ${
                categoryFilter === cat
                  ? 'border-rose-500 bg-rose-500/15 text-rose-800 dark:border-rose-400 dark:bg-rose-500/25 dark:text-rose-100'
                  : 'border-rose-200 bg-white/85 text-rose-900/75 hover:border-rose-400 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200'
              }`}
            >
              {cat === 'ALL' ? 'Toutes catégories' : cat}
            </button>
          ))}
        </div>

        <div className="max-h-64 overflow-auto rounded-xl border border-rose-200/90 bg-white/90 dark:border-rose-900/60 dark:bg-[#190d1f]">
          <table className="min-w-[560px] w-full text-left text-xs">
            <thead className="sticky top-0 border-b border-rose-200 bg-rose-50 font-mono text-[11px] uppercase text-rose-900/75 dark:border-rose-900/60 dark:bg-rose-950/80 dark:text-rose-200/75">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} className="px-3 py-2.5">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-rose-200/60 dark:divide-rose-900/40">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="text-[#1f1224] dark:text-rose-100">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 font-mono text-[11px]">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
