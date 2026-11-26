import type { Request, Response } from 'express';
import { z } from 'zod';
import type { DevBridgeState } from '../../contracts/dev-bridge.schema.ts';
import {
  GITHUB_REPO_BRANCH,
  GITHUB_REPO_NAME,
  GITHUB_REPO_OWNER,
} from '../../doc-sync/sot-manifest.ts';
import { sanitizeWorkspaceRelativePath } from '../../systems/governance/dev-bridge.engine.ts';

/**
 * [L8] EXW.L8.DEV_BRIDGE_REMOTES | v5.1.0 | SADT A5.4
 * Express sub-handlers for GitHub Contents API commits and Vercel Deploy Hook triggers.
 */

const GithubCommitSchema = z.object({
  relativePath: z.string().min(3).max(180),
  content: z.string().min(1).max(200_000),
  commitMessage: z.string().min(2).max(240),
  branch: z.string().min(1).max(80).default(GITHUB_REPO_BRANCH),
});

const VercelTriggerSchema = z.object({
  hookUrl: z.string().max(320).optional(),
  projectUrl: z.string().max(240).optional(),
});

export async function handleGithubCommitRoute(req: Request, res: Response): Promise<void> {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Jeton GitHub requis dans Authorization Bearer.' });
    return;
  }
  const parsed = GithubCommitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload commit GitHub invalide.' });
    return;
  }
  const check = sanitizeWorkspaceRelativePath(parsed.data.relativePath);
  if (!check.ok) {
    res.status(400).json({ error: check.error });
    return;
  }
  const encodedPath = check.normalized.split('/').map(encodeURIComponent).join('/');
  const apiBase = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${encodedPath}`;
  const ghHeaders = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'exo-world-2050-dev-bridge',
    'Content-Type': 'application/json',
  };

  try {
    let existingSha: string | undefined;
    const headRes = await fetch(`${apiBase}?ref=${encodeURIComponent(parsed.data.branch)}`, {
      headers: ghHeaders,
    });
    if (headRes.ok) {
      const meta = (await headRes.json()) as { sha?: string };
      existingSha = meta.sha;
    } else if (headRes.status !== 404) {
      res.status(headRes.status).json({ error: `Lecture GitHub HTTP ${headRes.status}` });
      return;
    }

    const putRes = await fetch(apiBase, {
      method: 'PUT',
      headers: ghHeaders,
      body: JSON.stringify({
        message: parsed.data.commitMessage,
        content: Buffer.from(parsed.data.content, 'utf8').toString('base64'),
        branch: parsed.data.branch,
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    });
    const putJson = (await putRes.json()) as {
      message?: string;
      commit?: { sha?: string; html_url?: string };
      content?: { html_url?: string };
    };
    if (!putRes.ok) {
      res.status(putRes.status).json({ error: putJson.message ?? `GitHub PUT HTTP ${putRes.status}` });
      return;
    }
    res.status(201).json({
      ok: true,
      commitSha: putJson.commit?.sha ?? '',
      commitUrl: putJson.commit?.html_url ?? '',
      htmlUrl: putJson.content?.html_url ?? '',
    });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Erreur réseau API GitHub.' });
  }
}

export async function handleVercelTriggerRoute(
  req: Request,
  res: Response,
  getState: () => DevBridgeState,
  updateProjectUrl: (url: string) => void,
  enrichState: (base: DevBridgeState) => DevBridgeState,
): Promise<void> {
  const parsed = VercelTriggerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload Vercel invalide.' });
    return;
  }
  if (parsed.data.projectUrl) {
    updateProjectUrl(parsed.data.projectUrl.trim().slice(0, 240));
  }
  const targetHook = (parsed.data.hookUrl?.trim() || process.env.VERCEL_DEPLOY_HOOK_URL || '').trim();
  if (!targetHook) {
    res.status(400).json({
      error: 'Aucun Deploy Hook Vercel configuré (renseignez VERCEL_DEPLOY_HOOK_URL ou l’URL du hook).',
    });
    return;
  }
  if (!targetHook.startsWith('https://api.vercel.com/v1/integrations/deploy/')) {
    res.status(400).json({
      error: 'URL Deploy Hook invalide (doit commencer par https://api.vercel.com/v1/integrations/deploy/).',
    });
    return;
  }
  try {
    const hookResp = await fetch(targetHook, { method: 'POST' });
    const body = (await hookResp.json().catch(() => ({}))) as { job?: { id?: string; state?: string } };
    if (!hookResp.ok) {
      res.status(hookResp.status).json({ error: `Vercel Deploy Hook HTTP ${hookResp.status}` });
      return;
    }
    res.json({
      ok: true,
      jobId: body.job?.id ?? 'vercel-queued',
      jobState: body.job?.state ?? 'PENDING',
      state: enrichState(getState()),
    });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Erreur réseau Vercel.' });
  }
}
