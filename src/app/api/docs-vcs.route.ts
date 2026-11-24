import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { z } from 'zod';
import {
  DocVcsCategorySchema,
  DocVcsStoreStateSchema,
  SkillDomainSchema,
  type DocVcsStoreState,
} from '../../contracts/skills-vcs.schema.ts';
import {
  bumpSkillSemver,
  createInitialDocVcsStoreState,
  createNewDocEntry,
  createRevisionFromEdit,
  revertDocToRevision,
  toggleSkillEnabled,
  updateSkillConfig,
} from '../../systems/governance/skills-vcs.engine.ts';

/**
 * [L5/L8] EXW.L8.DOCS_VCS_ROUTE | v5.1.0 | SADT A5.4
 * Express router for isolated Documentation VCS (create, revise, revert, history)
 * and independent Modular Skills Registry management.
 */

const STORE_FILE_PATH = path.resolve(process.cwd(), '.exo-vcs-store.json');

function loadPersistedStore(): DocVcsStoreState {
  try {
    if (fs.existsSync(STORE_FILE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(STORE_FILE_PATH, 'utf8')) as unknown;
      const parsed = DocVcsStoreStateSchema.safeParse(raw);
      if (parsed.success) return parsed.data;
    }
  } catch {
    // Fall back cleanly to initial catalog state
  }
  return createInitialDocVcsStoreState();
}

function savePersistedStore(store: DocVcsStoreState): void {
  try {
    const tmpPath = `${STORE_FILE_PATH}.tmp`;
    fs.writeFileSync(tmpPath, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
    fs.renameSync(tmpPath, STORE_FILE_PATH);
  } catch {
    // Non-fatal in read-only sandbox environments
  }
}

const CreateDocSchema = z.object({
  docId: z.string().min(2).max(80).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  title: z.string().min(2).max(140),
  category: DocVcsCategorySchema.default('OPERATIONS'),
  domain: SkillDomainSchema.or(z.literal('SYSTEM')).default('SYSTEM'),
  linkedSkillId: z.string().nullable().optional(),
  content: z.string().min(1),
  author: z.string().min(1).max(80).default('Commandant'),
  tags: z.array(z.string()).optional(),
});

const CreateRevisionSchema = z.object({
  nextContent: z.string().min(1),
  nextTitle: z.string().min(2).max(140).optional(),
  summary: z.string().min(2).max(240),
  author: z.string().min(1).max(80).default('Commandant'),
  bumpKind: z.enum(['patch', 'minor', 'major']).default('patch'),
  source: z.enum(['LOCAL', 'REVERT', 'DRIVE_IMPORT']).default('LOCAL'),
  driveFileId: z.string().nullable().optional(),
  driveUrl: z.string().max(320).nullable().optional(),
});

const RevertDocSchema = z.object({
  targetRevisionId: z.string().min(3).max(96),
  author: z.string().min(1).max(80).default('Commandant'),
});

const UpdateSkillSchema = z.object({
  toggleEnabled: z.boolean().optional(),
  bumpSemver: z.enum(['patch', 'minor', 'major']).optional(),
  config: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export function createDocsVcsRouter(): Router {
  const router = Router();
  let store: DocVcsStoreState = loadPersistedStore();

  router.get('/state', (_req, res) => {
    res.json(store);
  });

  router.post('/docs', (req, res) => {
    const parsed = CreateDocSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Payload de création document invalide.', details: parsed.error.issues });
      return;
    }
    const nowIso = new Date().toISOString();
    const safeSlug = parsed.data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 36);
    const docId = parsed.data.docId ?? `doc-${safeSlug || 'entry'}-${Date.now().toString(36)}`;

    if (store.docs.some((d) => d.docId === docId)) {
      res.status(409).json({ error: `Un document avec l’identifiant ${docId} existe déjà.` });
      return;
    }

    const result = createNewDocEntry(store, {
      docId,
      title: parsed.data.title,
      category: parsed.data.category,
      domain: parsed.data.domain,
      linkedSkillId: parsed.data.linkedSkillId ?? null,
      content: parsed.data.content,
      author: parsed.data.author,
      createdAtIso: nowIso,
      tags: parsed.data.tags,
    });
    store = result.nextStore;
    savePersistedStore(store);
    res.status(201).json({ doc: result.createdDoc, state: store });
  });

  router.post('/docs/:docId/revisions', (req, res) => {
    const docId = String(req.params.docId ?? '').trim();
    const parsed = CreateRevisionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Payload de révision invalide.', details: parsed.error.issues });
      return;
    }
    const result = createRevisionFromEdit(store, {
      docId,
      nextContent: parsed.data.nextContent,
      nextTitle: parsed.data.nextTitle,
      summary: parsed.data.summary,
      author: parsed.data.author,
      bumpKind: parsed.data.bumpKind,
      source: parsed.data.source,
      createdAtIso: new Date().toISOString(),
      driveFileId: parsed.data.driveFileId,
      driveUrl: parsed.data.driveUrl,
    });
    if (!result.createdRevision) {
      res.status(404).json({ error: 'Document introuvable.' });
      return;
    }
    store = result.nextStore;
    savePersistedStore(store);
    res.status(201).json({ revision: result.createdRevision, state: store });
  });

  router.post('/docs/:docId/revert', (req, res) => {
    const docId = String(req.params.docId ?? '').trim();
    const parsed = RevertDocSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Payload de revert invalide.', details: parsed.error.issues });
      return;
    }
    const result = revertDocToRevision(store, {
      docId,
      targetRevisionId: parsed.data.targetRevisionId,
      author: parsed.data.author,
      createdAtIso: new Date().toISOString(),
    });
    if (!result.revertRevision) {
      res.status(404).json({ error: 'Révision cible introuvable pour ce document.' });
      return;
    }
    store = result.nextStore;
    savePersistedStore(store);
    res.status(201).json({ revision: result.revertRevision, state: store });
  });

  router.patch('/skills/:skillId', (req, res) => {
    const skillId = String(req.params.skillId ?? '').trim();
    const exists = store.skills.some((s) => s.id === skillId);
    if (!exists) {
      res.status(404).json({ error: 'Skill modulaire introuvable.' });
      return;
    }
    const parsed = UpdateSkillSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Payload skill invalide.', details: parsed.error.issues });
      return;
    }
    const nowIso = new Date().toISOString();
    let next = store;
    if (parsed.data.toggleEnabled) {
      next = toggleSkillEnabled(next, skillId, nowIso);
    }
    if (parsed.data.bumpSemver) {
      next = bumpSkillSemver(next, skillId, parsed.data.bumpSemver, nowIso);
    }
    if (parsed.data.config) {
      next = updateSkillConfig(next, skillId, parsed.data.config, nowIso);
    }
    store = next;
    savePersistedStore(store);
    res.json({
      skill: store.skills.find((s) => s.id === skillId),
      state: store,
    });
  });

  return router;
}
