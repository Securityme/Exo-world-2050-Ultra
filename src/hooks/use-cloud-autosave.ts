import { useEffect, useRef } from 'react';
import { subscribeAuthState } from '../services/firebase/firebase-client.ts';
import {
  flushCloudAutoSaveOutbox,
  flushPendingDebouncedCloudSave,
  refreshCloudSavesAndCheckpoints,
  triggerCloudAutoSave,
} from '../services/saves/cloud-autosave.service.ts';
import { useCloudAutoSaveStore } from '../stores/cloud-autosave.store.ts';
import { useExoStore } from '../stores/game.store.ts';

/**
 * [L6] EXW.L6.USE_CLOUD_AUTOSAVE | v5.1.0 | SADT A5.1
 * Lifecycle hook mounting automatic Cloud Save listeners:
 * - Auth state changes: flushes pending local outbox & loads cloud saves / checkpoints
 * - Network reconnect ('online' / 'offline'): flushes queued turn saves automatically
 * - Page hide / tab switch ('visibilitychange', 'pagehide'): flushes debounced saves
 * - Campaign creation / infinite sandbox transition: triggers milestone cloud save
 */
export function useCloudAutoSave(): void {
  const screen = useExoStore((s) => s.screen);
  const campaignId = useExoStore((s) => s.world.campaignId);
  const mode = useExoStore((s) => s.world.mode);
  const prevCampaignRef = useRef<string | null>(null);
  const prevModeRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeAuthState((user) => {
      const cloudStore = useCloudAutoSaveStore.getState();
      cloudStore.setAuthSnapshot(Boolean(user), user?.email ?? null);
      if (user) {
        const currentWorld = useExoStore.getState().world;
        void (async () => {
          await flushCloudAutoSaveOutbox(currentWorld);
          await refreshCloudSavesAndCheckpoints(currentWorld.campaignId, currentWorld);
        })();
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const onOnline = () => {
      useCloudAutoSaveStore.getState().setOnline(true);
      const currentWorld = useExoStore.getState().world;
      void flushCloudAutoSaveOutbox(currentWorld);
    };
    const onOffline = () => {
      useCloudAutoSaveStore.getState().setOnline(false);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const { screen: curScreen, world } = useExoStore.getState();
        if (curScreen === 'EXO_GAME_SCREEN') {
          flushPendingDebouncedCloudSave(world);
        }
      }
    };
    const onPageHide = () => {
      const { screen: curScreen, world } = useExoStore.getState();
      if (curScreen === 'EXO_GAME_SCREEN') {
        flushPendingDebouncedCloudSave(world);
      }
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  // Automatically snapshot on fresh campaign entry or switch into Infinite Sandbox
  useEffect(() => {
    if (screen !== 'EXO_GAME_SCREEN') return;
    const isNewCampaign = prevCampaignRef.current !== campaignId;
    const enteredSandbox = prevModeRef.current !== null && prevModeRef.current !== mode && mode === 'INFINITE_SANDBOX';
    prevCampaignRef.current = campaignId;
    prevModeRef.current = mode;

    if (isNewCampaign || enteredSandbox) {
      const currentWorld = useExoStore.getState().world;
      void triggerCloudAutoSave(currentWorld, 'MILESTONE');
    }
  }, [screen, campaignId, mode]);
}
