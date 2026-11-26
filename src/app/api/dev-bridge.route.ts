import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { z } from 'zod';
import {
  DataAgentDiagnosticsSchema,
  DevBridgeStateSchema,
  DevCommsKindSchema,
  DevSurfaceActorSchema,
  TriSurfaceSyncLogSchema,
  type DevBridgeState,
} from '../../contracts/dev-bridge.schema.ts';
import {
  evaluateMatrixArchitecture,
  type M0Manifest,
  type M13Manifest,
} from '../../services/architecture/matrix-engine.ts';
import {
  appendDevCommsMessage,
  appendTriSurfaceSyncLog,
  createInitialDevBridgeState,
  sanitizeWorkspaceRelativePath,
} from '../../systems/governance/dev-bridge.engine.ts';
import {
  handleGithubCommitRoute,
  handleVercelTriggerRoute,
} from './dev-bridge-remotes.ts';

/**
 * [L8] EXW.L8.DEV_BRIDGE_ROUTE | v5.1.0 | SADT A5.4
 * Express router for Multi-Surface Dev Communication Bus, Safe Local AI Studio File Writes,
 * GitHub Contents API Commits, Data Agent Kit Live Audit, and Vercel Deploy Hook Relay.
 */

const BRIDGE_STORE_PATH = path.resolve(process.cwd(), '.exo-dev-bridge.json');

function loadBridgeStore(): DevBridgeState {
  try {
    if (fs.existsSync(BRIDGE_STORE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(BRIDGE_STORE_PATH, 'utf8')) as unknown;
      const parsed = DevBridgeStateSchema.safeParse(raw);
      if (parsed.success) return parsed.data;
    }
  } catch {
    // Fallback cleanly
  }
  return createInitialDevBridgeState();
}

function saveBridgeStore(state: DevBridgeState): void {
  try {
    const tmp = `${BRIDGE_STORE_PATH}.tmp`;
    fs.writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    fs.renameSync(tmp, BRIDGE_STORE_PATH);
  } catch {
    // Ignore in read-only runtimes
  }
}

function collectSrcFiles(dir: string, rootDir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'assets' || entry.name === 'node_modules') continue;
      collectSrcFiles(full, rootDir, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(path.relative(rootDir, full).replace(/\\/g, '/'));
    }
  }
  return acc.sort();
}

const PostMessageSchema = z.object({
  sender: DevSurfaceActorSchema.default('USER'),
  target: DevSurfaceActorSchema.default('ANTIGRAVITY'),
  kind: DevCommsKindSchema.default('DIRECTIVE'),
  content: z.string().min(2).max(2000),
  linkedPath: z.string().max(180).optional(),
  linkedDocId: z.string().max(80).optional(),
});

const WriteWorkspaceSchema = z.object({
  relativePath: z.string().min(3).max(180),
  content: z.string().min(1).max(200_000),
});

export function createDevBridgeRouter(): Router {
  const router = Router();
  let state: DevBridgeState = loadBridgeStore();

  const enrichState = (base: DevBridgeState): DevBridgeState => ({
    ...base,
    vercelHookConfigured: Boolean(process.env.VERCEL_DEPLOY_HOOK_URL),
    githubOAuthConfigured: Boolean(
      process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET,
    ),
  });

  router.get('/state', (_req, res) => {
    res.json(enrichState(state));
  });

  router.post('/messages', (req, res) => {
    const parsed = PostMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Payload message invalide.', details: parsed.error.issues });
      return;
    }
    const createdAtIso = new Date().toISOString();
    const msgId = `bus-${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`;
    state = appendDevCommsMessage(state, {
      id: msgId,
      sender: parsed.data.sender,
      target: parsed.data.target,
      kind: parsed.data.kind,
      content: parsed.data.content,
      linkedPath: parsed.data.linkedPath,
      linkedDocId: parsed.data.linkedDocId,
      createdAtIso,
    });
    saveBridgeStore(state);
    res.status(201).json({ message: state.messages[0], state: enrichState(state) });
  });

  router.get('/workspace/read', (req, res) => {
    const rawPath = String(req.query.path ?? '');
    const check = sanitizeWorkspaceRelativePath(rawPath);
    if (!check.ok) {
      res.status(400).json({ error: check.error });
      return;
    }
    const rootDir = process.cwd();
    const abs = path.resolve(rootDir, check.normalized);
    if (!abs.startsWith(rootDir + path.sep) || !fs.existsSync(abs)) {
      res.status(404).json({ error: `Fichier introuvable : ${check.normalized}` });
      return;
    }
    const content = fs.readFileSync(abs, 'utf8');
    const sha256 = crypto.createHash('sha256').update(content, 'utf8').digest('hex');
    res.json({ relativePath: check.normalized, content: content.slice(0, 120_000), sha256 });
  });

  router.post('/workspace/write', (req, res) => {
    const parsed = WriteWorkspaceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Payload écriture locale invalide.' });
      return;
    }
    const check = sanitizeWorkspaceRelativePath(parsed.data.relativePath);
    if (!check.ok) {
      res.status(400).json({ error: check.error });
      return;
    }
    const rootDir = process.cwd();
    const abs = path.resolve(rootDir, check.normalized);
    if (!abs.startsWith(rootDir + path.sep)) {
      res.status(403).json({ error: 'Sortie du workspace refusée.' });
      return;
    }
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    const tmp = `${abs}.tmp-${Date.now().toString(36)}`;
    fs.writeFileSync(tmp, parsed.data.content, 'utf8');
    fs.renameSync(tmp, abs);
    const sha256 = crypto.createHash('sha256').update(parsed.data.content, 'utf8').digest('hex');
    res.status(201).json({
      ok: true,
      relativePath: check.normalized,
      sha256,
      bytes: Buffer.byteLength(parsed.data.content, 'utf8'),
    });
  });

  router.post('/github/commit', (req, res) => {
    void handleGithubCommitRoute(req, res);
  });

  router.post('/logs', (req, res) => {
    const parsed = TriSurfaceSyncLogSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Journal tri-surface invalide.' });
      return;
    }
    state = appendTriSurfaceSyncLog(state, parsed.data);
    saveBridgeStore(state);
    res.status(201).json({ state: enrichState(state) });
  });

  router.post('/data-agent/audit', (_req, res) => {
    try {
      const rootDir = process.cwd();
      const bpDir = path.join(rootDir, 'docs', 'master-blueprint');
      const m0 = JSON.parse(fs.readFileSync(path.join(bpDir, 'M0_MetaSemVer.json'), 'utf8')) as M0Manifest;
      const m13 = JSON.parse(fs.readFileSync(path.join(bpDir, 'M13_SADT_Mapping.json'), 'utf8')) as M13Manifest;
      const srcFiles = collectSrcFiles(path.join(rootDir, 'src'), rootDir);
      const report = evaluateMatrixArchitecture(m0, m13, srcFiles);
      const passCount = report.matrices.filter((m) => m.status === 'PASS').length;
      const diag = DataAgentDiagnosticsSchema.parse({
        modulesCount: srcFiles.length,
        matricesPass: passCount,
        totalMatrices: report.matrices.length,
        dsmCycleCount: report.dsmCycleCount,
        gate: report.gate,
        githubParity: 'SYNCED',
        generatedAtIso: new Date().toISOString(),
        details: [
          `SemVer SSoT : ${m0.rootSemver}`,
          `Modules non mappés : ${report.unmappedSrcPaths.length}`,
          `Références orphelines : ${report.orphanMappings.length}`,
        ],
      });
      state = { ...state, lastAudit: diag };
      saveBridgeStore(state);
      res.json({ diagnostics: diag, state: enrichState(state) });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Échec Data Agent Kit audit.' });
    }
  });

  router.post('/vercel/trigger', (req, res) => {
    void handleVercelTriggerRoute(
      req,
      res,
      () => state,
      (url) => {
        state = { ...state, vercelProjectUrl: url };
        saveBridgeStore(state);
      },
      enrichState,
    );
  });

  return router;
}
