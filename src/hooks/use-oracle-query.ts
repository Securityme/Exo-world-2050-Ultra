import { useMutation, useQuery } from '@tanstack/react-query';
import {
  EventGeneratorResponseSchema,
  type EventGeneratorResponse,
} from '../contracts/event-generator.schema.ts';
import type { DossierClass } from '../contracts/pa-dossiers.schema.ts';
import { fetchProjectDocumentsAndCatalogs } from '../doc-sync/project-docs.catalog.ts';
import { handleInjectOracleDossier } from '../pipelines/game-actions.pipeline.ts';
import { useExoStore } from '../stores/game.store.ts';

/**
 * [L6] FUP-005 / FUP-011 | TanStack Query Hooks
 * - useOracleDossierMutation: invokes server-side /api/oracle/generate (Gemini Dual-Pass + local fallback)
 * - useProjectDocsQuery: fetches isolated local project documents & structured catalogs
 */
export function useOracleDossierMutation() {
  return useMutation({
    mutationFn: async (requestedClass: DossierClass): Promise<EventGeneratorResponse> => {
      const world = useExoStore.getState().world;
      const res = await fetch('/api/oracle/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: world.campaignId,
          worldSeed: world.worldSeed,
          cycle: world.cycle,
          era: world.era,
          atmosphereTier: world.atmosphereTier,
          approval: world.approval,
          credits: world.resources.credits,
          adaptiveDeltaP: world.adaptiveDeltaP,
          dominantDossierClass: requestedClass,
          recentChronicleTitles: world.chronicle.slice(0, 6).map((c) => c.title),
          activeTriggerSummaries: world.triggerBus.slice(0, 4).map((t) => t.summary),
          freeTierGovernorMode: 'STRICT_FREE',
        }),
      });
      if (!res.ok) {
        throw new Error(`Oracle HTTP ${res.status}`);
      }
      const raw: unknown = await res.json();
      const parsed = EventGeneratorResponseSchema.parse(raw);
      handleInjectOracleDossier(parsed);
      return parsed;
    },
  });
}

export function useProjectDocsQuery() {
  return useQuery({
    queryKey: ['exo-project-docs-catalogs'],
    queryFn: fetchProjectDocumentsAndCatalogs,
    staleTime: 5 * 60 * 1000,
  });
}
