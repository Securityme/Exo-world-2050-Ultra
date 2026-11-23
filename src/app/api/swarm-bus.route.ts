import { Router } from 'express';
import {
  SwarmHandoffInputSchema,
  type SwarmRelayMessage,
} from '../../contracts/swarm-relay.schema.ts';
import { AGENT_PYRAMID_TIERS, INITIAL_AGENT_PYRAMID_NODES } from '../../data/agent-hierarchy.catalog.ts';
import { PREVIEW_BRIDGE_CHANNELS } from '../../data/workflow-dual-tracks.catalog.ts';
import { INTER_IA_BUS_MIRROR } from '../../doc-sync/bus-mirror.ts';
import { EXTERNAL_SSOT_SURFACES } from '../../doc-sync/sot-manifest.ts';
import { buildSwarmHandoffEnvelope } from '../../systems/governance/swarm-relay.engine.ts';

/**
 * [L8] EXW.L8.SWARM_BUS_ROUTE | v5.1.0 | SADT A5.4
 * Express router providing live Preview ↔ Google AI Studio ↔ Antigravity ↔ Agent Swarm
 * telemetry, parity manifest, and structured [EXO-SWARM-HANDOFF] relay envelopes.
 */
export function createSwarmBusRouter(): Router {
  const router = Router();

  let liveMessages: SwarmRelayMessage[] = [
    {
      ticketId: 'EXW-SWARM-001',
      fromSurface: 'AISTUDIO_BUILD',
      toSurface: 'ANTIGRAVITY_IDE',
      targetAgentCode: 'N2 · BORE',
      workflowTrack: 'DRIVE_DOC_VCS',
      priority: 'HIGH',
      status: 'DISPATCHED',
      title: 'Séparation VCS Documentation Drive/Docs & Pont Preview Swarm',
      objective:
        'Synchroniser la branche documentaire docs/drive-sovereign séparée du code main et valider les enveloppes BUS-EXW-001.',
      targetFiles: [
        'docs/governance/DOC-APP-GOV-001_ROLES_PERMISSIONS_WORKFLOW.md',
        'src/systems/governance/doc-vcs.engine.ts',
        'src/app/api/swarm-bus.route.ts',
      ],
      docVcsHeadHash: 'v5.1.0-drive-vcs',
      previewOrigin: 'https://ais-dev-opxn7hr3lsy5xfjqnwz27o-802398497019.europe-west2.run.app',
      promptPayload:
        '[EXO-SWARM-HANDOFF · EXW-SWARM-001]\nOrigine: AISTUDIO_BUILD -> Cible: ANTIGRAVITY_IDE (N2 · BORE)\nFilière: DRIVE_DOC_VCS | Objectif: Vérifier la séparation VCS Docs vs Code GitHub main.',
      createdAtIso: '2026-11-22T15:30:00Z',
      acknowledgedAtIso: null,
    },
  ];

  router.get('/state', (_req, res) => {
    res.json({
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
      liveMessages,
    });
  });

  router.post('/handoff', (req, res) => {
    const parsed = SwarmHandoffInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Enveloppe de handoff invalide.',
        details: parsed.error.issues,
      });
      return;
    }

    const result = buildSwarmHandoffEnvelope(
      parsed.data,
      liveMessages.length + 1,
      '5.1.0',
      new Date().toISOString(),
    );

    if (!result.ok || !result.message) {
      res.status(400).json({ error: result.error ?? 'Rejet de conformité sur le message Swarm.' });
      return;
    }

    liveMessages = [result.message, ...liveMessages].slice(0, 30);
    res.status(201).json({
      message: result.message,
      liveMessages,
    });
  });

  router.post('/ack/:ticketId', (req, res) => {
    const ticketId = String(req.params.ticketId ?? '').trim();
    const idx = liveMessages.findIndex((m) => m.ticketId === ticketId);
    if (idx === -1) {
      res.status(404).json({ error: `Ticket ${ticketId} introuvable dans la file Swarm.` });
      return;
    }

    const updated: SwarmRelayMessage = {
      ...liveMessages[idx]!,
      status: 'ACKNOWLEDGED',
      acknowledgedAtIso: new Date().toISOString(),
    };
    liveMessages[idx] = updated;
    res.json({ message: updated, liveMessages });
  });

  return router;
}
