import { create } from 'zustand';
import type {
  GeminiChannelId,
  GeminiCostLedger,
  TurnChoiceLogEntry,
} from '../contracts/gemini-router.schema.ts';
import {
  MetaPlayerShowcaseSchema,
  type MetaPlayerShowcase,
} from '../contracts/honors.schema.ts';
import type { WorldState } from '../contracts/world-state.schema.ts';
import {
  loadMetaHonorsFromFirestore,
  saveMetaHonorsToFirestore,
} from '../services/firebase/firestore-archives.service.ts';
import {
  createDefaultMetaShowcase,
  evaluateMetaShowcaseFromWorld,
  mergeCatalogHonors,
} from '../systems/honors/honors-evaluator.ts';
import {
  createInitialGeminiCostLedger,
  recordGeminiChannelCall,
} from '../systems/turn-orchestration/gemini-cost-ledger.ts';

/**
 * [L6] EXW.L6.META_HONORS_STORE | v5.0.0 | SADT A5.1
 * Persists Tier 1 Multi-Campaign Showcase (Avatar, Blason, Title, 4 Pinned Badges, Medals),
 * Cumulative Philosophy/Ethics decision counters, and 6-Channel Free-Tier Gemini Cost Ledger.
 */
export const META_HONORS_STORAGE_KEY = 'exo_meta_honors_v5';
export const GEMINI_LEDGER_STORAGE_KEY = 'exo_gemini_ledger_v5';

function normalizeCallsign(raw: string): string {
  const stripped = raw.replace(/^commandant\s+/i, '').trim();
  if (!stripped || /^commandant$/i.test(stripped)) return 'Baptiste';
  return stripped.slice(0, 40);
}

function loadShowcaseLocal(): MetaPlayerShowcase {
  if (typeof window === 'undefined') return createDefaultMetaShowcase();
  try {
    const raw = window.localStorage.getItem(META_HONORS_STORAGE_KEY);
    if (!raw) return createDefaultMetaShowcase();
    const parsed = MetaPlayerShowcaseSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return createDefaultMetaShowcase();
    const merged = mergeCatalogHonors(parsed.data);
    const cleanedCallsign = normalizeCallsign(merged.callsign);
    return cleanedCallsign === merged.callsign
      ? merged
      : { ...merged, callsign: cleanedCallsign };
  } catch {
    return createDefaultMetaShowcase();
  }
}

function saveShowcaseLocal(showcase: MetaPlayerShowcase): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(META_HONORS_STORAGE_KEY, JSON.stringify(showcase));
  } catch {
    // ignore quota errors
  }
}

export interface MetaHonorsStoreState {
  readonly showcase: MetaPlayerShowcase;
  readonly geminiLedger: GeminiCostLedger;
  readonly philosophyCumulative: Readonly<Record<string, number>>;
  readonly turnChoiceLog: readonly TurnChoiceLogEntry[];
  readonly priorizeByAiContext: boolean;
  setCallsign: (callsign: string) => void;
  setAvatarPreset: (presetId: string) => void;
  setCustomAvatar: (dataUrl: string | null) => void;
  setBannerStyle: (bannerStyleId: MetaPlayerShowcase['bannerStyleId']) => void;
  setEmblem: (emblemId: MetaPlayerShowcase['emblemId']) => void;
  setEquippedTitle: (titleId: string) => void;
  togglePinnedBadge: (badgeId: string) => void;
  syncShowcaseFromWorld: (world: WorldState) => void;
  hydrateFromCloud: () => Promise<void>;
  pushToCloud: () => Promise<boolean>;
  logGeminiUsage: (channel: GeminiChannelId, modelId: string, inTok: number, outTok: number) => void;
  recordTurnChoice: (entry: TurnChoiceLogEntry) => void;
  setPriorizeByAiContext: (enabled: boolean) => void;
}

export const useMetaHonorsStore = create<MetaHonorsStoreState>((set, get) => ({
  showcase: loadShowcaseLocal(),
  geminiLedger: createInitialGeminiCostLedger(),
  philosophyCumulative: {
    THOMISM: 2,
    CIVIC_HUMANISM: 1,
    ECO_SYMBIOSIS: 2,
  },
  turnChoiceLog: [],
  priorizeByAiContext: false,

  setCallsign: (callsign) =>
    set((s) => {
      const next: MetaPlayerShowcase = {
        ...s.showcase,
        callsign: normalizeCallsign(callsign),
        updatedAtIso: new Date().toISOString(),
      };
      saveShowcaseLocal(next);
      return { showcase: next };
    }),

  setAvatarPreset: (avatarPresetId) =>
    set((s) => {
      const next: MetaPlayerShowcase = {
        ...s.showcase,
        avatarPresetId,
        customAvatarDataUrl: null,
        updatedAtIso: new Date().toISOString(),
      };
      saveShowcaseLocal(next);
      return { showcase: next };
    }),

  setCustomAvatar: (customAvatarDataUrl) =>
    set((s) => {
      const next: MetaPlayerShowcase = {
        ...s.showcase,
        customAvatarDataUrl,
        updatedAtIso: new Date().toISOString(),
      };
      saveShowcaseLocal(next);
      return { showcase: next };
    }),

  setBannerStyle: (bannerStyleId) =>
    set((s) => {
      const next: MetaPlayerShowcase = {
        ...s.showcase,
        bannerStyleId,
        updatedAtIso: new Date().toISOString(),
      };
      saveShowcaseLocal(next);
      return { showcase: next };
    }),

  setEmblem: (emblemId) =>
    set((s) => {
      const next: MetaPlayerShowcase = {
        ...s.showcase,
        emblemId,
        updatedAtIso: new Date().toISOString(),
      };
      saveShowcaseLocal(next);
      return { showcase: next };
    }),

  setEquippedTitle: (equippedTitleId) =>
    set((s) => {
      const next: MetaPlayerShowcase = {
        ...s.showcase,
        equippedTitleId,
        updatedAtIso: new Date().toISOString(),
      };
      saveShowcaseLocal(next);
      return { showcase: next };
    }),

  togglePinnedBadge: (badgeId) =>
    set((s) => {
      const cur = s.showcase.pinnedBadgeIds;
      const exists = cur.includes(badgeId);
      const pinnedBadgeIds = exists
        ? cur.filter((id) => id !== badgeId)
        : [...cur, badgeId].slice(-4);
      const next: MetaPlayerShowcase = {
        ...s.showcase,
        pinnedBadgeIds,
        updatedAtIso: new Date().toISOString(),
      };
      saveShowcaseLocal(next);
      return { showcase: next };
    }),

  syncShowcaseFromWorld: (world) =>
    set((s) => {
      const next = evaluateMetaShowcaseFromWorld(s.showcase, world, new Date().toISOString());
      saveShowcaseLocal(next);
      return { showcase: next };
    }),

  hydrateFromCloud: async () => {
    const [err, payload] = await loadMetaHonorsFromFirestore('showcase');
    if (err || !payload) return;
    const parsed = MetaPlayerShowcaseSchema.safeParse(payload);
    if (parsed.success) {
      const merged = mergeCatalogHonors(parsed.data);
      saveShowcaseLocal(merged);
      set({ showcase: merged });
    }
  },

  pushToCloud: async () => {
    const [err] = await saveMetaHonorsToFirestore(
      get().showcase as unknown as Record<string, unknown>,
      'showcase',
    );
    return !err;
  },

  logGeminiUsage: (channel, modelId, inTok, outTok) =>
    set((s) => ({
      geminiLedger: recordGeminiChannelCall(s.geminiLedger, {
        channel,
        modelId,
        inputTokens: inTok,
        outputTokens: outTok,
      }),
    })),

  recordTurnChoice: (entry) =>
    set((s) => ({
      turnChoiceLog: [entry, ...s.turnChoiceLog].slice(0, 120),
      philosophyCumulative: {
        ...s.philosophyCumulative,
        [entry.philosophySchoolId]: (s.philosophyCumulative[entry.philosophySchoolId] ?? 0) + 1,
      },
    })),

  setPriorizeByAiContext: (priorizeByAiContext) => set({ priorizeByAiContext }),
}));
