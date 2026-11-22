import { LLM_FREETIER_CONSTANTS } from '../config/llm-freetier.constants.ts';
import type { WorldState } from '../contracts/world-state.schema.ts';
import { retrieveChronicleTurns } from './chronicle-turns.retriever.ts';
import { retrieveActionManifest } from './action-manifest.retriever.ts';

/**
 * [L5] FUP-006 / FUP-012 | SM-05 | SADT A4.1
 * Hybrid RAG Retriever combining recent Chronicle turns & Action Manifest within <= 180 ms budget.
 */
export interface HybridRagContext {
  readonly summaryPromptBlock: string;
  readonly latencyBudgetMs: number;
  readonly turnsIncluded: number;
}

export function buildHybridRagContext(state: WorldState, maxTurns = 6): HybridRagContext {
  const turns = retrieveChronicleTurns(state.chronicle, maxTurns);
  const manifest = retrieveActionManifest(state);
  const lines = [
    `[EXO-HYBRID-RAG] Cycle=${state.cycle} | Ère=${state.era} | Atmo=${state.atmosphereTier} (${state.atmosphereProgress}%)`,
    `[MANIFESTO] ${manifest.allowedClasses.join(', ')} | PA=${state.pa.general}`,
    ...turns.map((t) => `- C${t.cycle} [${t.category}] ${t.title}: ${t.detail}`),
  ];
  return {
    summaryPromptBlock: lines.join('\n'),
    latencyBudgetMs: LLM_FREETIER_CONSTANTS.RAG_LATENCY_BUDGET_MS,
    turnsIncluded: turns.length,
  };
}
