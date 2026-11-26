import {
  TurnEvents4TResponseSchema,
  type TurnEvents4TResponse,
} from '../contracts/v4-systems.schema.ts';
import type { WorldState } from '../contracts/world-state.schema.ts';
import { resolveSuperpowerV4 } from '../data/v4-catalog.data.ts';
import { getNoRep3tExcludedCodes } from '../systems/dossiers-pa/genese-promises.ts';
import { buildCombinatorialScenarioBrief } from '../systems/turn-orchestration/scenario-combinator.ts';

/**
 * [L5] EXW.L5.TURN_EVENTS_4T | v5.2.0 | SADT A4.1
 * Client bridge to server-side POST /api/gemini/generate-turn-events (4-Tier Cascade).
 * Sends a live combinatorial brief (Era/Sub-Era/Branch, Quests, World Tensions, Entity Matrix).
 */
export async function requestTurnEvents4T(world: WorldState): Promise<TurnEvents4TResponse> {
  const sp = resolveSuperpowerV4(world.superpowerId);
  const excludedCodes = Array.from(getNoRep3tExcludedCodes(world.livingCatalog));
  const combinatorialBrief = buildCombinatorialScenarioBrief(world);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch('/api/gemini/generate-turn-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        sessionId: world.campaignId,
        cycle: world.cycle,
        year: world.year,
        era: world.era,
        atmosphereTier: world.atmosphereTier,
        superpowerName: sp.name,
        aiPersonaName: world.aiPersona?.name ?? 'AURA-2050',
        aiPersonality: world.aiPersona?.personality ?? 'ANALYTIQUE',
        approval: world.approval,
        credits: world.resources.credits,
        excludedCodes,
        combinatorialBrief,
      }),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json: unknown = await res.json();
    const parsed = TurnEvents4TResponseSchema.safeParse(json);
    if (parsed.success) return parsed.data;
    throw new Error('Réponse BFF invalide');
  } catch (err) {
    return {
      tier: 'T4_OFFLINE_CV',
      modelUsed: 'catalog-cv-local',
      degraded: true,
      latencyMs: 0,
      errorMessage:
        err instanceof Error
          ? `Mode hors-ligne actif (${err.message}) — continuité Catalogue Vivant.`
          : 'Mode hors-ligne actif — continuité Catalogue Vivant.',
      dossiers: [],
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}
