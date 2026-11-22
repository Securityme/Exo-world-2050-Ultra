import {
  RenderToGameEventSchema,
  SceneDiffPacketSchema,
  type RenderToGameEvent,
  type SceneDiffPacket,
} from '../contracts/render-bridge.schema.ts';
import { type ExwResult } from '../contracts/trigger-bus.schema.ts';
import { parseJsonBoundary, parseWithZodSchema } from './zod-boundary.parser.ts';

/**
 * [L0] FUP-007 | SM-05 | SADT A5.3
 * Dual-Adapter Bridge Parser (Three.js r170+ <-> Unity 6 URP V5 IPC JSON protocol).
 */
export function parseRenderInboundEvent(raw: unknown): ExwResult<RenderToGameEvent> {
  if (typeof raw === 'string') {
    return parseJsonBoundary(RenderToGameEventSchema, raw, 'UnityBridgeInbound');
  }
  return parseWithZodSchema(RenderToGameEventSchema, raw, 'UnityBridgeInbound');
}

export function serializeSceneDiffPacket(packet: SceneDiffPacket): ExwResult<string> {
  const [e, valid] = parseWithZodSchema(SceneDiffPacketSchema, packet, 'UnityBridgeOutbound');
  if (e || !valid) return [e, null];
  return [null, JSON.stringify(valid)];
}
