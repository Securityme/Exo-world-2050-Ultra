import { projectWorldToSceneDiff } from '../adapters/scene-diff-projector.ts';
import type { RenderAdapterInterface } from '../adapters/render-adapter.interface.ts';
import {
  SceneDiffPacketSchema,
  type RenderEngineTarget,
  type SceneDiffPacket,
} from '../contracts/render-bridge.schema.ts';
import type { WorldState } from '../contracts/world-state.schema.ts';
import { parseWithZodSchema } from '../parsers/zod-boundary.parser.ts';
import { isUnity6RuntimeAvailable } from './render-unity.bridge.ts';

/**
 * [L4/L5] FUP-007 | SM-05 | SADT A5.3 | OPT-02 A+
 * Unity-First Dual Render Bridge:
 * - Prioritizes Unity 6 URP (Primary Engine — C#/URP/Burst/IL2CPP/.jslib)
 * - Falls back seamlessly to Three.js r170+ Web Preview in browser environments without Unity WebGL runtime.
 */
export function resolvePreferredRenderEngine(): RenderEngineTarget {
  return isUnity6RuntimeAvailable() ? 'UNITY_6_URP' : 'THREEJS_WEB_PREVIEW';
}

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
