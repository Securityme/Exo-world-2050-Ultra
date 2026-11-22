import type { EventGeneratorResponse } from '../contracts/event-generator.schema.ts';
import type { ExecutiveDecisionIntent, ExecutiveDossier } from '../contracts/pa-dossiers.schema.ts';
import { err, ok, type ExwResult } from '../contracts/trigger-bus.schema.ts';
import type { TurnEvents4TResponse, TurnSummaryReport } from '../contracts/v4-systems.schema.ts';
import type { WorldState } from '../contracts/world-state.schema.ts';
import { computeStateHash } from '../core/hashing/state-hasher.ts';
import { requestTurnEvents4T } from '../pipelines/turn-events-4t.pipeline.ts';
import { fipRadioService } from '../services/audio/fip-radio.service.ts';
import { saveCampaignToCloud } from '../services/firebase/firebase-client.ts';
import { useExoStore } from '../stores/game.store.ts';
import { useMetaHonorsStore } from '../stores/meta-honors.store.ts';
import { useUserContextStore } from '../stores/user-context.store.ts';
import {
  generateActionEventDossier,
  type ActionEventRequest,
} from '../systems/dossiers-pa/action-event-generator.ts';
import { resolvePhilosophySchoolForOption } from '../systems/dossiers-pa/badge-taxonomy.ts';
import { applyGeneseAct0Choice } from '../systems/dossiers-pa/genese-promises.ts';
import { createDirectInitiativeDossier, executeDossierDecision } from '../systems/dossiers-pa/pa-engine.ts';
import { computeOptimalAssignments } from '../systems/economy-urban/workforce-assignments.ts';
import { applyManualEraAdvance } from '../systems/geopolitics/humankind-progression.ts';
import {
  applyQuestRewardToWorld,
  type CampaignQuestStatus,
  type QuestUiMilestones,
} from '../systems/quests/campaign-quests.ts';
import {
  commitEndOfTurnV4,
  ensureZeroPaOption,
  evaluateTurnGateM7,
} from '../systems/turn-orchestration/turn-gate-v4.ts';

/**
 * [L6] EXW.L6.GAME_ACTIONS | v4.0.0-rc.1 | SADT A2/A3/A4
 * Event-Only Command Gateway & Turn-Based End-of-Turn Orchestrator:
 * - Operational actions route through Executive Dossiers (R-24)
 * - T_END_TURN enforces Karnaugh M7 Turn Gate + atomic Phi01..Phi12 commit + BFF Gemini 4T pre-gen
 */

export function handleExecuteDossier(intent: ExecutiveDecisionIntent): ExwResult<string> {
  const { world, setWorld } = useExoStore.getState();
  const targetDossier = world.activeDossiers.find((d) => d.id === intent.dossierId);
  const chosenOption = targetDossier?.options.find((o) => o.id === intent.optionId);
  const [error, report] = executeDossierDecision(world, intent);
  if (error || !report) return err(error?.code ?? 'EXW_ERR_SCHEMA', error?.message ?? 'Échec exécution.');
  setWorld(report.nextState);
  fipRadioService.playUiCue('SIGNATURE');

  if (targetDossier && chosenOption) {
    const school = resolvePhilosophySchoolForOption(chosenOption);
    const honors = useMetaHonorsStore.getState();
    honors.recordTurnChoice({
      id: `ch-${world.cycle}-${targetDossier.id}`,
      turn: world.cycle,
      dossierCode: targetDossier.code,
      dossierTitle: targetDossier.title,
      dossierClass: targetDossier.dossierClass,
      optionLabel: chosenOption.label,
      sourceModel: targetDossier.source === 'ORACLE_GEMINI' ? 'gemini-4-hydrogen' : 'catalog-cv-local',
      channel: 'text',
      philosophySchoolId: school.id,
      paSpent: chosenOption.paGeneralCost + chosenOption.subPaCost,
    });
    honors.syncShowcaseFromWorld(report.nextState);

    const ctxStore = useUserContextStore.getState();
    ctxStore.addTraceabilityEntry({
      id: `tr-${world.cycle}-${targetDossier.id}`,
      campaignId: world.campaignId,
      turn: world.cycle,
      actionType: `${targetDossier.dossierClass}:${targetDossier.code}`,
      sourceChannel: targetDossier.source === 'ORACLE_GEMINI' ? 'gemini-4-hydrogen' : 'catalog-local',
      philosophyPole: school.poleId,
      paSpent: chosenOption.paGeneralCost + chosenOption.subPaCost,
      deltaSummary: report.summary.slice(0, 120),
    });
  }

  return ok(report.summary);
}

export function handleGenerateActionEvent(request: ActionEventRequest): ExwResult<ExecutiveDossier> {
  const { world, setWorld } = useExoStore.getState();
  const [error, res] = generateActionEventDossier(world, request);
  if (error || !res) {
    return err(error?.code ?? 'EXW_ERR_SCHEMA', error?.message ?? 'Échec génération événement.');
  }
  const safeDossier = ensureZeroPaOption(res.dossier);
  const patchedState: WorldState = {
    ...res.nextState,
    activeDossiers: res.nextState.activeDossiers.map((d) =>
      d.id === safeDossier.id ? safeDossier : d,
    ),
  };
  setWorld(patchedState);
  fipRadioService.playUiCue('CLICK');
  return ok(safeDossier);
}

export function handleDirectInitiative(dossierClass: 'C2' | 'C3' | 'C4' | 'C5'): ExwResult<string> {
  const { world, setWorld } = useExoStore.getState();
  const [error, next] = createDirectInitiativeDossier(world, dossierClass);
  if (error || !next) return err(error?.code ?? 'EXW_ERR_PA_INSUFFICIENT', error?.message ?? 'Échec initiative.');
  setWorld({
    ...next,
    activeDossiers: next.activeDossiers.map(ensureZeroPaOption),
  });
  fipRadioService.playUiCue('CLICK');
  return ok(`Initiative Directe ${dossierClass} ajoutée à la pile exécutive.`);
}

export async function handleCommitEndOfTurn(
  onLiveEventsReady?: (res: TurnEvents4TResponse) => void,
): Promise<ExwResult<TurnSummaryReport>> {
  const { world, setWorld, oracleEnabled } = useExoStore.getState();
  const gate = evaluateTurnGateM7(world);
  if (!gate.allowed) {
    fipRadioService.playUiCue('ALERT_P0');
    return err('EXW_ERR_SCHEMA', gate.reason);
  }

  const { nextState, summary } = commitEndOfTurnV4(world);
  setWorld(nextState);
  useMetaHonorsStore.getState().syncShowcaseFromWorld(nextState);
  fipRadioService.playUiCue(summary.starsEarnedThisTurn > 0 ? 'FANFARE' : 'CHIME');

  // Fire non-blocking BFF 4T Gemini generation while player reads the Humankind Turn Summary modal
  if (oracleEnabled) {
    void requestTurnEvents4T(nextState).then((liveRes) => {
      onLiveEventsReady?.(liveRes);
      if (liveRes.modelUsed !== 'catalog-cv-local') {
        useMetaHonorsStore.getState().logGeminiUsage(
          'text',
          liveRes.modelUsed,
          420,
          liveRes.dossiers.length * 260,
        );
      }
      if (liveRes.dossiers.length > 0) {
        const cur = useExoStore.getState().world;
        const merged = [
          ...liveRes.dossiers.map(ensureZeroPaOption),
          ...cur.activeDossiers,
        ].slice(0, 4);
        const draft = { ...cur, activeDossiers: merged };
        useExoStore.getState().setWorld({ ...draft, stateHash: computeStateHash(draft) });
      }
    });
  }

  return ok(summary);
}

export function handleCompleteGeneseAct0(choiceId: string, expertBypass = false): void {
  const { world, setWorld } = useExoStore.getState();
  const next = applyGeneseAct0Choice(world, choiceId, expertBypass);
  setWorld({ ...next, stateHash: computeStateHash(next) });
  fipRadioService.playUiCue('FANFARE');
}

export function handleManualEraAdvance(mode: 'EVOLVE' | 'TRANSCEND', doctrineId: string): void {
  const { world, setWorld } = useExoStore.getState();
  const next = applyManualEraAdvance(world, mode, doctrineId);
  setWorld({ ...next, stateHash: computeStateHash(next) });
  fipRadioService.playUiCue('FANFARE');
}

export function handleSelectResearchTech(techId: string): void {
  const { world, setWorld } = useExoStore.getState();
  if (!world.hk) return;
  const next: WorldState = {
    ...world,
    hk: { ...world.hk, activeResearchTechId: techId, researchTurnsLeft: 3 },
  };
  setWorld({ ...next, stateHash: computeStateHash(next) });
  fipRadioService.playUiCue('CLICK');
}

export function handleAssignColonistToDistrict(colonistId: string, districtId: string | null): void {
  const { world, setWorld } = useExoStore.getState();
  const next: WorldState = {
    ...world,
    colonists: world.colonists.map((c) =>
      c.id === colonistId ? { ...c, assignedDistrictId: districtId } : c,
    ),
  };
  setWorld({ ...next, stateHash: computeStateHash(next) });
  fipRadioService.playUiCue('CLICK');
}

export function handleAutoAssignColonists(): number {
  const { world, setWorld } = useExoStore.getState();
  const optimalMap = computeOptimalAssignments(world);
  const nextColonists = world.colonists.map((c) => ({
    ...c,
    assignedDistrictId: optimalMap[c.id] ?? null,
  }));
  const next: WorldState = { ...world, colonists: nextColonists };
  setWorld({ ...next, stateHash: computeStateHash(next) });
  fipRadioService.playUiCue('CHIME');
  return nextColonists.filter((c) => c.assignedDistrictId !== null).length;
}

export function handleClaimQuestReward(
  questId: string,
  uiMilestones: QuestUiMilestones = {},
): ExwResult<CampaignQuestStatus> {
  const { world, setWorld } = useExoStore.getState();
  const applied = applyQuestRewardToWorld(world, questId, uiMilestones);
  if (!applied) {
    return err('EXW_ERR_SCHEMA', 'Quête non validée ou récompense déjà réclamée.');
  }
  setWorld({ ...applied.nextState, stateHash: computeStateHash(applied.nextState) });
  fipRadioService.playUiCue('FANFARE');
  return ok(applied.quest);
}

export function handleInjectOracleDossier(oracleRes: EventGeneratorResponse): ExwResult<ExecutiveDossier> {
  const { world, setWorld } = useExoStore.getState();
  const dossier: ExecutiveDossier = ensureZeroPaOption({
    ...oracleRes.dossier,
    slotIndex: world.activeSlotIndex,
    tileIndex: (world.tick * 7 + 19) % 72,
  });
  const draft: WorldState = {
    ...world,
    activeDossiers: [dossier, ...world.activeDossiers].slice(0, 12),
  };
  setWorld({ ...draft, stateHash: computeStateHash(draft) });
  return ok(dossier);
}

export async function handleCloudSave(): Promise<ExwResult<string>> {
  const { world } = useExoStore.getState();
  return saveCampaignToCloud(world);
}
