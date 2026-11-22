import type { RenderToGameEvent, SceneDiffPacket } from '../contracts/render-bridge.schema.ts';
import { err, ok, type ExwResult } from '../contracts/trigger-bus.schema.ts';
import { parseRenderInboundEvent, serializeSceneDiffPacket } from '../parsers/unity-bridge.parser.ts';

/**
 * [L4/L5] FUP-007 | SM-05 | SADT A5.3
 * Dual-Adapter 3D Render Bridge (Three.js WebGL <-> Unity 6 URP V5 IPC Bridge).
 */
export interface UnityIpcTransport {
  readonly sendDiffJson: (json: string) => void;
  readonly isUnityAttached: () => boolean;
}

export function forwardSceneDiffToBridge(
  packet: SceneDiffPacket,
  transport?: UnityIpcTransport,
): ExwResult<string> {
  const [serializeErr, serialized] = serializeSceneDiffPacket(packet);
  if (serializeErr !== null || !serialized) {
    return err(
      serializeErr?.code ?? 'EXW_ERR_SCHEMA',
      serializeErr?.message ?? 'Sérialisation SceneDiffPacket impossible.',
      serializeErr?.detail,
    );
  }
  if (transport && transport.isUnityAttached()) {
    transport.sendDiffJson(serialized);
  }
  return ok(serialized);
}

export function receiveBridgeEvent(rawEvent: unknown): ExwResult<RenderToGameEvent> {
  return parseRenderInboundEvent(rawEvent);
}
