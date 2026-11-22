import { projectWorldToSceneDiff } from '../adapters/scene-diff-projector.ts';
import type { RenderAdapterInterface } from '../adapters/render-adapter.interface.ts';
import { SceneDiffPacketSchema, type SceneDiffPacket } from '../contracts/render-bridge.schema.ts';
import type { WorldState } from '../contracts/world-state.schema.ts';
import { parseWithZodSchema } from '../parsers/zod-boundary.parser.ts';

/**
 * [L4/L5] FUP-007 | SM-05 | SADT A5.3 | OPT-02 A
 * Dual-Adapter 3D Render Bridge routing validated SceneDiffPacket snapshots to Three.js or Unity 6 URP.
 */
export function syncWorldToRenderAdapter(
  adapter: RenderAdapterInterface,
  state: WorldState,
  selectedTileIndex: number | null,
  hologramPreviewDistrict: string | null = null,
): SceneDiffPacket | null {
  const projected = projectWorldToSceneDiff(state, {
    selectedTileIndex,
    themeMode: 'DARK_BENTO',
    hologramPreviewDistrict,
  });
  const [parseErr, validated] = parseWithZodSchema(
    SceneDiffPacketSchema,
    projected,
    'SceneDiffPacket',
  );
  if (parseErr !== null) return null;
  adapter.applySceneDiff(validated);
  return validated;
}
