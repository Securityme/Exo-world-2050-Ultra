import { useCallback, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { uploadContextFileToDrive } from '../doc-sync/drive-docs.service.ts';
import { auth } from '../services/firebase/firebase-client.ts';
import {
  loadUserContext3DFromFirestore,
  saveUserContext3DToFirestore,
} from '../services/firebase/firestore-archives.service.ts';
import { useExoStore } from '../stores/game.store.ts';
import { useUserContextStore } from '../stores/user-context.store.ts';
import {
  serializeUserContextJson,
  serializeUserContextMarkdown,
} from '../systems/turn-orchestration/user-context-3d.ts';

/**
 * [L6] EXW.L6.USE_USER_CONTEXT | v5.0.0 | SADT A5.1
 * Connects 3-Dimension User Context store with:
 * - uiTheme -> displaySettingsProfile live sync
 * - Remembered accordions (shellUxHabits)
 * - Firestore sync (players/{uid}/context/primary) + local JSON/MD & isolated Drive upload
 */
export function useUserContext() {
  const context = useUserContextStore((s) => s.context);
  const cloudSynced = useUserContextStore((s) => s.cloudSynced);
  const setContext = useUserContextStore((s) => s.setContext);
  const setAccordion = useUserContextStore((s) => s.setAccordion);
  const toggleAccordion = useUserContextStore((s) => s.toggleAccordion);
  const updateShellHabits = useUserContextStore((s) => s.updateShellHabits);
  const syncDisplayProfile = useUserContextStore((s) => s.syncDisplayProfile);
  const addTraceabilityEntry = useUserContextStore((s) => s.addTraceabilityEntry);
  const addEventLogEntry = useUserContextStore((s) => s.addEventLogEntry);

  const uiTheme = useExoStore((s) => s.uiTheme);
  const loadedUidRef = useRef<string | null>(null);

  // Sync display settings profile whenever uiTheme changes
  useEffect(() => {
    const dp = context.displaySettingsProfile;
    const same =
      dp.presetId === uiTheme.presetId &&
      dp.colorScheme === uiTheme.colorScheme &&
      dp.hudOpacity === uiTheme.hudOpacity &&
      dp.saturationPct === (uiTheme.saturationPct ?? 100) &&
      dp.glowIntensity === uiTheme.glowIntensity &&
      dp.uiDensity === uiTheme.uiDensity &&
      dp.fontScalePct === (uiTheme.fontScalePct ?? 100) &&
      dp.safariTextSync === (uiTheme.safariTextSync ?? true) &&
      dp.tactileTargetBoost === (uiTheme.tactileTargetBoost ?? true);
    if (!same) {
      syncDisplayProfile({
        presetId: uiTheme.presetId,
        colorScheme: uiTheme.colorScheme,
        hudOpacity: uiTheme.hudOpacity,
        saturationPct: uiTheme.saturationPct ?? 100,
        glowIntensity: uiTheme.glowIntensity,
        uiDensity: uiTheme.uiDensity,
        fontScalePct: uiTheme.fontScalePct ?? 100,
        safariTextSync: uiTheme.safariTextSync ?? true,
        tactileTargetBoost: uiTheme.tactileTargetBoost ?? true,
      });
    }
  }, [uiTheme, context.displaySettingsProfile, syncDisplayProfile]);

  // Hydrate from Firestore once per authenticated session
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        loadedUidRef.current = null;
        return;
      }
      if (loadedUidRef.current === user.uid) return;
      loadedUidRef.current = user.uid;
      const [err, remote] = await loadUserContext3DFromFirestore('primary');
      if (!err && remote) {
        setContext(remote, true);
      }
    });
    return () => unsub();
  }, [setContext]);

  const isAccordionOpen = useCallback(
    (key: string, defaultOpen = false): boolean =>
      context.shellUxHabits.accordionStates[key] ?? defaultOpen,
    [context.shellUxHabits.accordionStates],
  );

  const syncToCloud = useCallback(async () => {
    const res = await saveUserContext3DToFirestore(context);
    if (!res[0]) {
      setContext(context, true);
    }
    return res;
  }, [context, setContext]);

  const downloadContextFile = useCallback(
    (format: 'json' | 'md') => {
      if (typeof document === 'undefined') return;
      const isJson = format === 'json';
      const content = isJson
        ? serializeUserContextJson(context)
        : serializeUserContextMarkdown(context);
      const blob = new Blob([content], {
        type: isJson ? 'application/json;charset=utf-8' : 'text/markdown;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = isJson ? 'exo-world-user-context.json' : 'exo-world-user-context.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [context],
  );

  const exportContextToDrive = useCallback(
    async (format: 'json' | 'md') => {
      const isJson = format === 'json';
      const content = isJson
        ? serializeUserContextJson(context)
        : serializeUserContextMarkdown(context);
      return uploadContextFileToDrive({
        fileName: isJson ? 'EXO_WORLD_2050_Context.json' : 'EXO_WORLD_2050_Context.md',
        mimeType: isJson ? 'application/json' : 'text/markdown',
        content,
      });
    },
    [context],
  );

  return {
    context,
    cloudSynced,
    isAccordionOpen,
    setAccordion,
    toggleAccordion,
    updateShellHabits,
    addTraceabilityEntry,
    addEventLogEntry,
    syncToCloud,
    downloadContextFile,
    exportContextToDrive,
  };
}
