import { create } from 'zustand';
import {
  UserContext3DSchema,
  type ContextEventLogEntry,
  type DisplaySettingsProfile,
  type ShellUxHabits,
  type TraceabilityMatrixEntry,
  type UserContext3D,
} from '../contracts/user-context.schema.ts';
import {
  appendContextEventLog,
  appendTraceabilityRecord,
  createDefaultUserContext3D,
  setRememberedAccordion,
  updateDisplayProfileInContext,
} from '../systems/turn-orchestration/user-context-3d.ts';

/**
 * [L6] EXW.L6.USER_CONTEXT_STORE | v5.0.0 | SADT A5.1
 * Holds the 3-Dimension User Context in Zustand + localStorage persistence.
 */
export const USER_CONTEXT_STORAGE_KEY = 'exo_user_context_3d_v5';

function loadInitialContext(): UserContext3D {
  if (typeof window === 'undefined') return createDefaultUserContext3D();
  try {
    const raw = window.localStorage.getItem(USER_CONTEXT_STORAGE_KEY);
    if (!raw) return createDefaultUserContext3D();
    const parsed = UserContext3DSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : createDefaultUserContext3D();
  } catch {
    return createDefaultUserContext3D();
  }
}

function persistLocal(ctx: UserContext3D): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(USER_CONTEXT_STORAGE_KEY, JSON.stringify(ctx));
  } catch {
    // ignore storage quota errors
  }
}

export interface UserContextStoreState {
  readonly context: UserContext3D;
  readonly cloudSynced: boolean;
  setContext: (next: UserContext3D, synced?: boolean) => void;
  setAccordion: (key: string, open: boolean) => void;
  toggleAccordion: (key: string, defaultOpen?: boolean) => void;
  updateShellHabits: (patch: Partial<ShellUxHabits>) => void;
  syncDisplayProfile: (patch: Partial<DisplaySettingsProfile>) => void;
  addTraceabilityEntry: (entry: TraceabilityMatrixEntry) => void;
  addEventLogEntry: (entry: ContextEventLogEntry) => void;
}

export const useUserContextStore = create<UserContextStoreState>((set) => ({
  context: loadInitialContext(),
  cloudSynced: false,

  setContext: (next, synced = false) => {
    persistLocal(next);
    set({ context: next, cloudSynced: synced });
  },

  setAccordion: (key, open) =>
    set((s) => {
      const next = setRememberedAccordion(s.context, key, open, new Date().toISOString());
      persistLocal(next);
      return { context: next, cloudSynced: false };
    }),

  toggleAccordion: (key, defaultOpen = false) =>
    set((s) => {
      const current = s.context.shellUxHabits.accordionStates[key] ?? defaultOpen;
      const next = setRememberedAccordion(s.context, key, !current, new Date().toISOString());
      persistLocal(next);
      return { context: next, cloudSynced: false };
    }),

  updateShellHabits: (patch) =>
    set((s) => {
      const next: UserContext3D = {
        ...s.context,
        shellUxHabits: { ...s.context.shellUxHabits, ...patch },
        updatedAtIso: new Date().toISOString(),
      };
      persistLocal(next);
      return { context: next, cloudSynced: false };
    }),

  syncDisplayProfile: (patch) =>
    set((s) => {
      const next = updateDisplayProfileInContext(s.context, patch, new Date().toISOString());
      persistLocal(next);
      return { context: next, cloudSynced: false };
    }),

  addTraceabilityEntry: (entry) =>
    set((s) => {
      const next = appendTraceabilityRecord(s.context, entry, new Date().toISOString());
      persistLocal(next);
      return { context: next, cloudSynced: false };
    }),

  addEventLogEntry: (entry) =>
    set((s) => {
      const next = appendContextEventLog(s.context, entry, new Date().toISOString());
      persistLocal(next);
      return { context: next, cloudSynced: false };
    }),
}));
