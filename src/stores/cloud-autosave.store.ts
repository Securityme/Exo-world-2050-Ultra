import { create } from 'zustand';
import type { CampaignSaveMeta } from '../services/firebase/firebase-client.ts';
import type { CloudTurnCheckpoint } from '../services/firebase/firestore-archives.service.ts';
import {
  DEFAULT_CLOUD_AUTOSAVE_CONFIG,
  enqueueCloudSaveItem,
  removeCloudSaveItem,
  type CloudAutoSaveConfig,
  type CloudAutoSaveReason,
  type CloudAutoSaveStatus,
  type QueuedCloudSave,
} from '../utils/cloud-autosave-policy.ts';

/**
 * [L6] EXW.L6.CLOUD_AUTOSAVE_STORE | v5.1.0 | SADT A5.1
 * Reactive Zustand state + localStorage persistence for Cloud Auto-Save preferences,
 * offline/unauthenticated outbox queue, sync status, cloud saves list, and turn checkpoints.
 */

const CONFIG_STORAGE_KEY = 'exow_cloud_autosave_config_v1';
const OUTBOX_STORAGE_KEY = 'exow_cloud_autosave_outbox_v1';

function readStoredConfig(): CloudAutoSaveConfig {
  if (typeof window === 'undefined') return DEFAULT_CLOUD_AUTOSAVE_CONFIG;
  try {
    const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_CLOUD_AUTOSAVE_CONFIG;
    const parsed = JSON.parse(raw) as Partial<CloudAutoSaveConfig>;
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
      saveOnTurnEnd: typeof parsed.saveOnTurnEnd === 'boolean' ? parsed.saveOnTurnEnd : true,
      saveOnDossierDecision:
        typeof parsed.saveOnDossierDecision === 'boolean' ? parsed.saveOnDossierDecision : true,
      archiveTurnSnapshots:
        typeof parsed.archiveTurnSnapshots === 'boolean' ? parsed.archiveTurnSnapshots : true,
      maxQueuedItems:
        typeof parsed.maxQueuedItems === 'number' && parsed.maxQueuedItems >= 1
          ? Math.min(30, Math.floor(parsed.maxQueuedItems))
          : 12,
    };
  } catch {
    return DEFAULT_CLOUD_AUTOSAVE_CONFIG;
  }
}

function writeStoredConfig(config: CloudAutoSaveConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore quota errors
  }
}

function readStoredOutbox(): QueuedCloudSave[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(OUTBOX_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedCloudSave[]) : [];
  } catch {
    return [];
  }
}

function writeStoredOutbox(items: readonly QueuedCloudSave[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Fallback: keep only the latest item if localStorage quota is tight
    try {
      const latest = items.slice(-1);
      window.localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(latest));
    } catch {
      // ignore storage errors
    }
  }
}

export interface CloudAutoSaveState {
  config: CloudAutoSaveConfig;
  status: CloudAutoSaveStatus;
  authenticated: boolean;
  userEmail: string | null;
  online: boolean;
  lastSyncedFingerprint: string | null;
  lastSyncedCampaignId: string | null;
  lastSyncedCycle: number | null;
  lastSyncedAtIso: string | null;
  lastSyncReason: CloudAutoSaveReason | null;
  lastCheckpointId: string | null;
  lastError: string | null;
  outbox: QueuedCloudSave[];
  cloudCampaigns: CampaignSaveMeta[];
  turnCheckpoints: CloudTurnCheckpoint[];
  newerCloudCampaign: CampaignSaveMeta | null;

  updateConfig: (patch: Partial<CloudAutoSaveConfig>) => void;
  setAuthSnapshot: (authenticated: boolean, userEmail: string | null) => void;
  setOnline: (online: boolean) => void;
  setStatus: (status: CloudAutoSaveStatus, error?: string | null) => void;
  recordSyncSuccess: (meta: {
    fingerprint: string;
    campaignId: string;
    cycle: number;
    reason: CloudAutoSaveReason;
    checkpointId?: string | null;
  }) => void;
  enqueueOutbox: (item: QueuedCloudSave) => void;
  dequeueOutbox: (itemId: string) => void;
  clearOutbox: () => void;
  setCloudCampaigns: (items: CampaignSaveMeta[]) => void;
  setTurnCheckpoints: (items: CloudTurnCheckpoint[]) => void;
  setNewerCloudCampaign: (item: CampaignSaveMeta | null) => void;
}

const initialConfig = readStoredConfig();
const initialOutbox = readStoredOutbox();

export const useCloudAutoSaveStore = create<CloudAutoSaveState>((set, get) => ({
  config: initialConfig,
  status: initialOutbox.length > 0 ? 'QUEUED_OFFLINE' : 'IDLE',
  authenticated: false,
  userEmail: null,
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  lastSyncedFingerprint: null,
  lastSyncedCampaignId: null,
  lastSyncedCycle: null,
  lastSyncedAtIso: null,
  lastSyncReason: null,
  lastCheckpointId: null,
  lastError: null,
  outbox: initialOutbox,
  cloudCampaigns: [],
  turnCheckpoints: [],
  newerCloudCampaign: null,

  updateConfig: (patch) => {
    const next: CloudAutoSaveConfig = { ...get().config, ...patch };
    writeStoredConfig(next);
    set({ config: next });
  },

  setAuthSnapshot: (authenticated, userEmail) =>
    set((state) => ({
      authenticated,
      userEmail,
      cloudCampaigns: authenticated ? state.cloudCampaigns : [],
      turnCheckpoints: authenticated ? state.turnCheckpoints : [],
      newerCloudCampaign: authenticated ? state.newerCloudCampaign : null,
      status: !authenticated && state.outbox.length > 0 ? 'AUTH_REQUIRED' : state.status,
    })),

  setOnline: (online) =>
    set((state) => ({
      online,
      status: !online && state.outbox.length > 0 ? 'QUEUED_OFFLINE' : state.status,
    })),

  setStatus: (status, error = null) => set({ status, lastError: error }),

  recordSyncSuccess: ({ fingerprint, campaignId, cycle, reason, checkpointId }) =>
    set({
      status: 'SYNCED',
      lastSyncedFingerprint: fingerprint,
      lastSyncedCampaignId: campaignId,
      lastSyncedCycle: cycle,
      lastSyncedAtIso: new Date().toISOString(),
      lastSyncReason: reason,
      lastCheckpointId: checkpointId ?? null,
      lastError: null,
    }),

  enqueueOutbox: (item) => {
    const next = enqueueCloudSaveItem(get().outbox, item, get().config.maxQueuedItems);
    writeStoredOutbox(next);
    set({ outbox: next });
  },

  dequeueOutbox: (itemId) => {
    const next = removeCloudSaveItem(get().outbox, itemId);
    writeStoredOutbox(next);
    set({ outbox: next });
  },

  clearOutbox: () => {
    writeStoredOutbox([]);
    set({ outbox: [] });
  },

  setCloudCampaigns: (cloudCampaigns) => set({ cloudCampaigns }),
  setTurnCheckpoints: (turnCheckpoints) => set({ turnCheckpoints }),
  setNewerCloudCampaign: (newerCloudCampaign) => set({ newerCloudCampaign }),
}));
