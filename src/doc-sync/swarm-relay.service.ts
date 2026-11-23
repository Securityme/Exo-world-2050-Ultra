import type { SwarmHandoffInput, SwarmRelayMessage } from '../contracts/swarm-relay.schema.ts';
import { AGENT_PYRAMID_TIERS, INITIAL_AGENT_PYRAMID_NODES } from '../data/agent-hierarchy.catalog.ts';
import {
  PREVIEW_BRIDGE_CHANNELS,
  type PreviewBridgeChannelSpec,
} from '../data/workflow-dual-tracks.catalog.ts';
import { buildSwarmHandoffEnvelope } from '../systems/governance/swarm-relay.engine.ts';
import { INTER_IA_BUS_MIRROR, type InterIaBusEnvelope } from './bus-mirror.ts';
import { EXTERNAL_SSOT_SURFACES, type ExternalSsotSurface } from './sot-manifest.ts';

/**
 * [L5] EXW.L5.SWARM_RELAY_SERVICE | v5.1.0 | SADT A5.4
 * Client bridge to /api/swarm-bus and optional parent iframe window.postMessage broadcast.
 */
export interface SwarmBusStatePayload {
  readonly service: string;
  readonly appVersion: string;
  readonly surfaces: readonly ExternalSsotSurface[];
  readonly busMirror: readonly InterIaBusEnvelope[];
  readonly bridgeChannels: readonly PreviewBridgeChannelSpec[];
  readonly agentPyramidSummary: {
    readonly totalAgents: number;
    readonly tiers: readonly { readonly code: string; readonly label: string; readonly count: number }[];
  };
  readonly liveMessages: readonly SwarmRelayMessage[];
}

export function buildFallbackSwarmBusState(): SwarmBusStatePayload {
  return {
    service: 'exo-swarm-relay',
    appVersion: '5.1.0',
    surfaces: EXTERNAL_SSOT_SURFACES,
    busMirror: INTER_IA_BUS_MIRROR,
    bridgeChannels: PREVIEW_BRIDGE_CHANNELS,
    agentPyramidSummary: {
      totalAgents: INITIAL_AGENT_PYRAMID_NODES.length,
      tiers: AGENT_PYRAMID_TIERS.map((t) => ({
        code: t.code,
        label: t.label,
        count: INITIAL_AGENT_PYRAMID_NODES.filter((n) => n.level === t.level).length,
      })),
    },
    liveMessages: [],
  };
}

export async function fetchSwarmBusState(): Promise<SwarmBusStatePayload> {
  try {
    const res = await fetch('/api/swarm-bus/state');
    if (res.ok) {
      return (await res.json()) as SwarmBusStatePayload;
    }
  } catch {
    // Fallback cleanly if endpoint unreachable
  }
  return buildFallbackSwarmBusState();
}

export async function dispatchSwarmHandoff(
  input: SwarmHandoffInput,
  fallbackSequence: number = 1,
): Promise<{ ok: boolean; message?: SwarmRelayMessage; liveMessages?: readonly SwarmRelayMessage[]; error?: string }> {
  try {
    const res = await fetch('/api/swarm-bus/handoff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const json = (await res.json()) as {
      message?: SwarmRelayMessage;
      liveMessages?: SwarmRelayMessage[];
      error?: string;
    };
    if (!res.ok) {
      return { ok: false, error: json.error ?? `Rejet serveur (${res.status})` };
    }
    if (json.message && typeof window !== 'undefined' && window.parent && window.parent !== window) {
      try {
        window.parent.postMessage(
          { type: 'EXO_WORLD_SWARM_HANDOFF', payload: json.message },
          '*',
        );
      } catch {
        // Ignore sandboxed iframe parent restrictions
      }
    }
    return { ok: true, message: json.message, liveMessages: json.liveMessages };
  } catch {
    const local = buildSwarmHandoffEnvelope(
      input,
      fallbackSequence,
      '5.1.0',
      new Date().toISOString(),
    );
    return local.ok && local.message
      ? { ok: true, message: local.message }
      : { ok: false, error: local.error ?? 'Échec de préparation du paquet Swarm.' };
  }
}

export async function acknowledgeSwarmTicket(
  ticketId: string,
): Promise<{ ok: boolean; liveMessages?: readonly SwarmRelayMessage[]; error?: string }> {
  try {
    const res = await fetch(`/api/swarm-bus/ack/${encodeURIComponent(ticketId)}`, {
      method: 'POST',
    });
    const json = (await res.json()) as { liveMessages?: SwarmRelayMessage[]; error?: string };
    if (!res.ok) {
      return { ok: false, error: json.error ?? `Erreur serveur (${res.status})` };
    }
    return { ok: true, liveMessages: json.liveMessages };
  } catch {
    return { ok: false, error: 'Serveur Swarm Bus injoignable.' };
  }
}
