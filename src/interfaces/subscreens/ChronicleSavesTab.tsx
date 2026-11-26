import { useEffect, useMemo, useState } from 'react';
import { flexRender } from '@tanstack/react-table';
import {
  getCoreRowModel,
  getFilteredRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from '@tanstack/react-table/legacy';
import { useSetAtom } from 'jotai';
import {
  Clock,
  Cloud,
  CloudDownload,
  CloudOff,
  CloudUpload,
  HardDrive,
  History,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import { RichEntityText } from '../../components/RichEntityText.tsx';
import type { ChronicleEntry } from '../../contracts/world-state.schema.ts';
import { handleCloudSave } from '../../pipelines/game-actions.pipeline.ts';
import {
  auth,
  loadCloudCampaign,
} from '../../services/firebase/firebase-client.ts';
import type { CloudTurnCheckpoint } from '../../services/firebase/firestore-archives.service.ts';
import {
  flushCloudAutoSaveOutbox,
  refreshCloudSavesAndCheckpoints,
  removeCloudCampaignAndRefresh,
  removeCloudTurnCheckpointAndRefresh,
} from '../../services/saves/cloud-autosave.service.ts';
import {
  deleteLocalCampaign,
  listLocalCampaigns,
  type LocalCampaignMeta,
} from '../../services/saves/local-saves.service.ts';
import { useCloudAutoSaveStore } from '../../stores/cloud-autosave.store.ts';
import { useExoStore } from '../../stores/game.store.ts';
import { activeSubscreenAtom, toastNoticeAtom } from '../../stores/selection.atoms.ts';
import type { CloudAutoSaveReason } from '../../utils/cloud-autosave-policy.ts';

function formatReasonLabel(reason: CloudAutoSaveReason): string {
  switch (reason) {
    case 'TURN_END':
      return 'Fin de tour';
    case 'DOSSIER':
      return 'Décision';
    case 'MILESTONE':
      return 'Jalon';
    case 'MANUAL':
      return 'Manuel';
    case 'PAGE_HIDE':
      return 'Fermeture';
  }
}

function formatShortTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/**
 * [L7] FUP-008 | SM-01 | SADT A5.1
 * TanStack Table filterable Chronicle + Automatic Turn-by-Turn Cloud Saves,
 * Offline Outbox Sync, Turn Checkpoint Rewind, and Local Browser Archives.
 */
export function ChronicleSavesTab() {
  const world = useExoStore((s) => s.world);
  const loadCampaignState = useExoStore((s) => s.loadCampaignState);
  const loadLocalCampaignById = useExoStore((s) => s.loadLocalCampaignById);
  const saveCurrentCampaignLocal = useExoStore((s) => s.saveCurrentCampaignLocal);
  const setScreen = useExoStore((s) => s.setScreen);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
  const setToast = useSetAtom(toastNoticeAtom);

  const cloudConfig = useCloudAutoSaveStore((s) => s.config);
  const updateCloudConfig = useCloudAutoSaveStore((s) => s.updateConfig);
  const cloudStatus = useCloudAutoSaveStore((s) => s.status);
  const cloudAuthenticated = useCloudAutoSaveStore((s) => s.authenticated);
  const cloudUserEmail = useCloudAutoSaveStore((s) => s.userEmail);
  const cloudLastSyncedCycle = useCloudAutoSaveStore((s) => s.lastSyncedCycle);
  const cloudLastSyncedAtIso = useCloudAutoSaveStore((s) => s.lastSyncedAtIso);
  const cloudOutbox = useCloudAutoSaveStore((s) => s.outbox);
  const cloudSaves = useCloudAutoSaveStore((s) => s.cloudCampaigns);
  const turnCheckpoints = useCloudAutoSaveStore((s) => s.turnCheckpoints);

  const [globalFilter, setGlobalFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [localSaves, setLocalSaves] = useState<LocalCampaignMeta[]>(() => listLocalCampaigns());
  const [busy, setBusy] = useState(false);

  const refreshSaves = async () => {
    setLocalSaves(listLocalCampaigns());
    await refreshCloudSavesAndCheckpoints(world.campaignId, world);
  };

  useEffect(() => {
    void refreshSaves();
  }, [world.campaignId, cloudAuthenticated]);

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
    setToast({ id: Date.now(), tone: 'success', text: `Campagne ${id} synchronisée dans le Cloud (T${world.cycle}).` });
    await refreshSaves();
  };

  const onFlushOutbox = async () => {
    setBusy(true);
    const { synced, remaining } = await flushCloudAutoSaveOutbox(world);
    setBusy(false);
    if (synced > 0) {
      setToast({
        id: Date.now(),
        tone: 'success',
        text: `${synced} sauvegarde(s) en attente synchronisée(s) vers le Cloud.`,
      });
    } else if (remaining > 0) {
      setToast({
        id: Date.now(),
        tone: 'warn',
        text: 'Synchronisation impossible pour le moment (vérifiez la connexion Google/réseau).',
      });
    }
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

  const onCloudDelete = async (campaignId: string) => {
    setBusy(true);
    const [e] = await removeCloudCampaignAndRefresh(campaignId, world.campaignId, world);
    setBusy(false);
    if (e) {
      setToast({ id: Date.now(), tone: 'error', text: e.message });
      return;
    }
    setToast({ id: Date.now(), tone: 'info', text: `Archive Cloud ${campaignId} supprimée.` });
  };

  const onRestoreCheckpoint = (cp: CloudTurnCheckpoint) => {
    if (!cp.worldState) {
      setToast({
        id: Date.now(),
        tone: 'warn',
        text: 'Ce point de contrôle ne contient que les métadonnées (taille maximale atteinte).',
      });
      return;
    }
    loadCampaignState(cp.worldState);
    setSubscreen('NONE');
    setToast({
      id: Date.now(),
      tone: 'success',
      text: `Retour arrière Cloud réussi : Tour T${cp.cycle} (Ère ${cp.era} · ${cp.year}).`,
    });
  };

  const onDeleteCheckpoint = async (cp: CloudTurnCheckpoint) => {
    setBusy(true);
    const [e] = await removeCloudTurnCheckpointAndRefresh(cp.campaignId, cp.snapshotId);
    setBusy(false);
    if (e) {
      setToast({ id: Date.now(), tone: 'error', text: e.message });
    }
  };

  const isSignedIn = Boolean(auth.currentUser) || cloudAuthenticated;

  return (
    <div className="space-y-4">
      {/* Main Local & Cloud Auto-Save Control Card */}
      <div
        data-testid="cloud-autosave-panel"
        className="space-y-3 rounded-xl border border-rose-200/90 bg-white/85 p-4 dark:border-rose-900/60 dark:bg-[#190d1f]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 font-display text-sm font-bold text-[#1f1224] dark:text-rose-100">
              {cloudStatus === 'SAVING' ? (
                <RefreshCw className="h-4 w-4 animate-spin text-cyan-600 dark:text-cyan-300" />
              ) : isSignedIn && cloudConfig.enabled ? (
                <Cloud className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <CloudOff className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              )}
              <span>Sauvegarde Auto Cloud (Tour par tour)</span>
              <span
                data-testid="cloud-autosave-status-badge"
                className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                  cloudStatus === 'SYNCED'
                    ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                    : cloudStatus === 'SAVING'
                      ? 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-200'
                      : cloudStatus === 'ERROR'
                        ? 'bg-rose-500/15 text-rose-800 dark:text-rose-200'
                        : 'bg-amber-500/15 text-amber-900 dark:text-amber-200'
                }`}
              >
                {cloudStatus === 'SYNCED'
                  ? `Synchronisé · T${cloudLastSyncedCycle ?? world.cycle}`
                  : cloudStatus === 'SAVING'
                    ? 'Synchronisation…'
                    : cloudOutbox.length > 0
                      ? `${cloudOutbox.length} en file d’attente`
                      : isSignedIn
                        ? 'Actif'
                        : 'Connexion requise'}
              </span>
            </div>
            <div className="mt-0.5 font-mono text-xs text-rose-900/65 dark:text-rose-200/70">
              Campagne {world.campaignId} · Empreinte {world.stateHash.slice(0, 12)}… · Graine #{world.worldSeed}
              {cloudLastSyncedAtIso ? ` · Dernière sync : ${formatShortTime(cloudLastSyncedAtIso)}` : ''}
              {cloudUserEmail ? ` · ${cloudUserEmail}` : ''}
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
            {!isSignedIn ? (
              <button
                type="button"
                data-testid="cloud-connect-google-btn"
                onClick={() => {
                  setSubscreen('NONE');
                  setScreen('EXO_AUTH');
                }}
                className="min-h-[44px] rounded-lg bg-rose-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-rose-500"
              >
                Connecter Google (Cloud)
              </button>
            ) : (
              <>
                {cloudOutbox.length > 0 && (
                  <button
                    type="button"
                    data-testid="cloud-flush-outbox-btn"
                    disabled={busy}
                    onClick={() => void onFlushOutbox()}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-amber-400 bg-amber-500/15 px-3.5 text-xs font-bold text-amber-900 hover:bg-amber-500/25 disabled:opacity-50 dark:text-amber-100"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Vider la file ({cloudOutbox.length})
                  </button>
                )}
                <button
                  type="button"
                  data-testid="cloud-save-now-btn"
                  disabled={busy}
                  onClick={() => void onCloudSave()}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  <CloudUpload className="h-4 w-4" />
                  Synchroniser maintenant
                </button>
              </>
            )}
          </div>
        </div>

        {/* Auto-Save Granular Toggles */}
        <div className="grid gap-2 border-t border-rose-200/70 pt-3 sm:grid-cols-3 dark:border-rose-900/50">
          <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-rose-200/70 bg-rose-50/40 px-3 py-2 text-xs dark:border-rose-900/50 dark:bg-rose-950/30">
            <span className="font-medium text-[#1f1224] dark:text-rose-100">
              Auto-Save fin de tour
            </span>
            <input
              type="checkbox"
              data-testid="toggle-cloud-autosave-turn"
              checked={cloudConfig.enabled && cloudConfig.saveOnTurnEnd}
              onChange={(e) =>
                updateCloudConfig({
                  enabled: e.target.checked || cloudConfig.saveOnDossierDecision,
                  saveOnTurnEnd: e.target.checked,
                })
              }
              className="h-4 w-4 accent-emerald-600"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-rose-200/70 bg-rose-50/40 px-3 py-2 text-xs dark:border-rose-900/50 dark:bg-rose-950/30">
            <span className="font-medium text-[#1f1224] dark:text-rose-100">
              Auto-Save décisions &amp; jalons
            </span>
            <input
              type="checkbox"
              data-testid="toggle-cloud-autosave-dossier"
              checked={cloudConfig.enabled && cloudConfig.saveOnDossierDecision}
              onChange={(e) =>
                updateCloudConfig({
                  enabled: e.target.checked || cloudConfig.saveOnTurnEnd,
                  saveOnDossierDecision: e.target.checked,
                })
              }
              className="h-4 w-4 accent-emerald-600"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-rose-200/70 bg-rose-50/40 px-3 py-2 text-xs dark:border-rose-900/50 dark:bg-rose-950/30">
            <span className="font-medium text-[#1f1224] dark:text-rose-100">
              Historique tour par tour (Rewind)
            </span>
            <input
              type="checkbox"
              data-testid="toggle-cloud-turn-checkpoints"
              checked={cloudConfig.archiveTurnSnapshots}
              onChange={(e) => updateCloudConfig({ archiveTurnSnapshots: e.target.checked })}
              className="h-4 w-4 accent-emerald-600"
            />
          </label>
        </div>

        {cloudOutbox.length > 0 && !isSignedIn && (
          <div className="rounded-lg border border-amber-300/80 bg-amber-50/80 px-3 py-2 font-mono text-[11px] text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100">
            {cloudOutbox.length} tour(s) sauvegardé(s) en file locale — synchronisation automatique dès connexion à votre compte Google.
          </div>
        )}
      </div>

      {/* Turn-by-Turn Cloud Checkpoint History (Time-Travel Rewind) */}
      {isSignedIn && (
        <div
          data-testid="cloud-turn-checkpoints-section"
          className="space-y-1.5 rounded-xl border border-emerald-200/80 bg-white/85 p-3.5 dark:border-emerald-900/50 dark:bg-[#141922]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300">
              <Clock className="h-3.5 w-3.5" />
              Historique Cloud Tour par Tour ({turnCheckpoints.length})
            </div>
            <button
              type="button"
              onClick={() => void refreshSaves()}
              className="inline-flex min-h-[32px] items-center gap-1 rounded-md border border-emerald-300/70 px-2.5 font-mono text-[10px] font-semibold text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
            >
              <RefreshCw className="h-3 w-3" />
              Actualiser
            </button>
          </div>
          {turnCheckpoints.length === 0 ? (
            <p className="font-mono text-[11px] text-rose-900/60 dark:text-rose-200/65">
              Aucun point de contrôle archivé pour cette campagne. Terminez un tour ou cliquez sur « Synchroniser maintenant ».
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {turnCheckpoints.slice(0, 12).map((cp) => (
                <div
                  key={cp.snapshotId}
                  className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200/75 bg-emerald-50/35 px-3 py-2 text-xs dark:border-emerald-900/50 dark:bg-emerald-950/25"
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-[#1f1224] dark:text-emerald-50">
                      Tour T{cp.cycle} · Ère {cp.era} ({cp.year})
                    </div>
                    <div className="font-mono text-[10px] text-rose-900/65 dark:text-emerald-200/75">
                      {formatReasonLabel(cp.reason)} · {cp.season} · {formatShortTime(cp.createdAtIso)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={busy || !cp.checkpointIncluded}
                      onClick={() => onRestoreCheckpoint(cp)}
                      title={
                        cp.checkpointIncluded
                          ? `Revenir au Tour T${cp.cycle}`
                          : 'Métadonnées seules (état complet indisponible)'
                      }
                      className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-emerald-400/70 bg-emerald-500/15 px-2.5 font-mono text-[10.5px] font-bold text-emerald-900 hover:bg-emerald-500/25 disabled:opacity-45 dark:text-emerald-100"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Revenir
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onDeleteCheckpoint(cp)}
                      aria-label={`Supprimer le point de contrôle Tour ${cp.cycle}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200/80 text-rose-700 hover:border-rose-500 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                    Ère {s.era} · T{s.cycle} · {s.atmosphereTier}
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
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 font-mono text-xs uppercase text-emerald-700 dark:text-emerald-300">
            <Cloud className="h-3.5 w-3.5" />
            Sauvegardes Cloud ({cloudSaves.length})
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {cloudSaves.map((s) => (
              <div
                key={s.campaignId}
                className="flex items-center justify-between gap-2 rounded-lg border border-rose-200/80 bg-white/85 px-3 py-2 text-xs dark:border-rose-900/50 dark:bg-[#190d1f]"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-[#1f1224] dark:text-rose-50">{s.campaignId}</div>
                  <div className="font-mono text-[10px] text-rose-900/65 dark:text-rose-200/70">
                    Ère {s.era} · T{s.cycle} · {s.atmosphereTier} · {formatShortTime(s.updatedAtIso)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onCloudLoad(s.campaignId)}
                    className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-3 font-mono text-[11px] font-semibold text-rose-800 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-100"
                  >
                    <CloudDownload className="h-3.5 w-3.5" />
                    Charger
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onCloudDelete(s.campaignId)}
                    aria-label={`Supprimer la sauvegarde Cloud ${s.campaignId}`}
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
