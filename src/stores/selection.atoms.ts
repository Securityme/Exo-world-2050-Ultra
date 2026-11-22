import { atom } from 'jotai';
import type { ViewportOverlayMode } from '../contracts/render-bridge.schema.ts';
import type { TurnEvents4TResponse } from '../contracts/v4-systems.schema.ts';
import type { QuestUiMilestones } from '../systems/quests/campaign-quests.ts';

/**
 * [L6] EXW.L6.SELECTION_ATOMS | v4.1.0 | SADT A5.1
 * Fine-Grained UI Selection, Colonist RPG Sheet, Worlds 2-Level Navigation, Quests & Overlays.
 */
export type ExoSubscreenId =
  | 'NONE'
  | 'WORLDS_HUB'
  | 'EVENTS_HUB'
  | 'JOURNAL_HUB'
  | 'PROFILE'
  | 'WORLD_CITIES'
  | 'BIOSPHERE_CABINET'
  | 'MILITARY_COMBAT'
  | 'GEOPOLITICS'
  | 'CHRONICLE_SAVES'
  | 'DOC_SYNC_STUDIO'
  | 'BLUEPRINT_ATLAS';

export type WorldsHubDomain =
  | 'TERRITORIES'
  | 'POPULATION'
  | 'BIOSPHERE'
  | 'MILITARY'
  | 'TECHNOLOGIES';

export interface ToastNotice {
  readonly id: number;
  readonly tone: 'info' | 'success' | 'warn' | 'error';
  readonly text: string;
}

export type InspectedEntity =
  | { readonly kind: 'WORLD'; readonly slotIndex: number }
  | { readonly kind: 'SECTOR'; readonly tileIndex: number }
  | { readonly kind: 'DISTRICT'; readonly districtId: string }
  | null;

export type Isolated3DModalTarget =
  | { readonly mode: 'BUILDING'; readonly districtId: string }
  | { readonly mode: 'HANGAR' }
  | null;

export const selectedTileAtom = atom<number | null>(12);
export const selectedDistrictIdAtom = atom<string | null>(null);
export const inspectedEntityAtom = atom<InspectedEntity>(null);
export const inspectedColonistIdAtom = atom<string | null>(null);
export const isolated3DModalAtom = atom<Isolated3DModalTarget>(null);
export const activeDossierIdAtom = atom<string | null>(null);
export const activeSubscreenAtom = atom<ExoSubscreenId>('NONE');
export const worldsHubDomainAtom = atom<WorldsHubDomain>('TERRITORIES');
export const worldsHubSubViewAtom = atom<string>('PRIMARY');
export const dockCollapsedAtom = atom<boolean>(false);
export const hologramPreviewDistrictAtom = atom<string | null>(null);
export const toastNoticeAtom = atom<ToastNotice | null>(null);

/** 3D Telemetry Overlay (Standard | Maintenance | Flux) */
export const viewportOverlayModeAtom = atom<ViewportOverlayMode>('STANDARD');
/** Dossiers inspected via 3D inspection probe */
export const inspectedDossierIdsAtom = atom<readonly string[]>([]);
/** Currently active 3D inspection probe linked to a dossier */
export const activeInvestigationDossierIdAtom = atom<string | null>(null);
/** Interactive campaign tutorial overlay visibility */
export const tutorialOpenAtom = atom<boolean>(false);
/** Humankind End-of-Turn Summary modal visibility */
export const turnSummaryModalOpenAtom = atom<boolean>(false);
/** Manual Era Advance & Doctrine picker modal visibility */
export const eraAdvanceModalOpenAtom = atom<boolean>(false);
/** Latest Gemini 4T turn-events generation status */
export const latestTurnEvents4TAtom = atom<TurnEvents4TResponse | null>(null);
/** Whether BFF Gemini 4T pre-generation is currently running */
export const turnEventsLoadingAtom = atom<boolean>(false);
/** 3D D3 Tactical Heatmap overlay visibility (L1-L5 x atmospheric zones) */
export const tacticalHeatmapOpenAtom = atom<boolean>(false);
/** Live Anno/Idle quest UI progression flags */
export const questUiMilestonesAtom = atom<QuestUiMilestones>({});
/** Collapsible Anno/Idle quest HUD widget state */
export const questTrackerCollapsedAtom = atom<boolean>(false);
/** Full 100% HUD hide toggle (hides header, quest tracker, resource ribbon, footer) */
export const hudHiddenAtom = atom<boolean>(false);
/** On-demand TanStack ReactQueryDevtools visibility toggled from the Palmtree Studio drawer */
export const showQueryDevtoolsAtom = atom<boolean>(false);
