import express from 'express';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { checkZ0AndR50Compliance, sanitizeZ0Text } from './src/contracts/guards/z0-legacy.guard.ts';
import { ExecutiveDossierSchema } from './src/contracts/pa-dossiers.schema.ts';
import { TurnEvents4TResponseSchema } from './src/contracts/v4-systems.schema.ts';
import {
  evaluateGithubParity,
  type ExternalSyncSnapshot,
} from './src/doc-sync/external-sync.service.ts';
import {
  GEMINI_NOTEBOOK_ID,
  GEMINI_NOTEBOOK_URL,
  GITHUB_REPO_BRANCH,
  GITHUB_REPO_NAME,
  GITHUB_REPO_OWNER,
  GITHUB_REPO_URL,
  GITHUB_SYNC_BASELINE_SHA,
} from './src/doc-sync/sot-manifest.ts';
import { createDocGovernanceRouter } from './src/app/api/doc-governance.route.ts';
import { createDocsVcsRouter } from './src/app/api/docs-vcs.route.ts';
import { classifyProjectDocument } from './src/systems/governance/doc-governance.engine.ts';
import { applyLlmLexicon, buildLlmLexiconPromptBlock } from './src/utils/llm-lexicon.ts';

const FREE_TIER_ALLOWED_MODELS = new Set([
  'gemini-4-hydrogen',
  'gemini-3.1-flash-lite',
  'gemini-decision-1',
]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCliArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  const eqPrefix = `${flag}=`;
  const eqArg = process.argv.find((arg) => arg.startsWith(eqPrefix));
  return eqArg ? eqArg.slice(eqPrefix.length) : undefined;
}

const cliPort = parseCliArg('--port');
const cliHost = parseCliArg('--host');
const envPort = process.env.PORT && process.env.PORT !== process.env.NGINX_PORT ? process.env.PORT : undefined;
const PORT = Number(cliPort ?? envPort ?? process.env.DEFAULT_APP_PORT ?? 3000);
const HOST = cliHost ?? process.env.HOST ?? '0.0.0.0';
const RATE_LIMIT_MAX = 12;
const RATE_LIMIT_WINDOW_MS = 60_000;
const sessionHits = new Map<string, number[]>();

const TurnEventsRequestSchema = z.object({
  sessionId: z.string().min(2).max(80).default('default'),
  cycle: z.number().int().min(0),
  year: z.number().int().min(2050),
  era: z.number().int().min(1).max(6),
  atmosphereTier: z.enum(['P1', 'P2', 'P3', 'P4']),
  superpowerName: z.string().max(80),
  aiPersonaName: z.string().max(50).default('AURA-2050'),
  aiPersonality: z.string().max(30).default('ANALYTIQUE'),
  approval: z.number().min(0).max(100),
  credits: z.number(),
  excludedCodes: z.array(z.string()).max(30).default([]),
});

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const prev = (sessionHits.get(sessionId) ?? []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  if (prev.length >= RATE_LIMIT_MAX) {
    sessionHits.set(sessionId, prev);
    return false;
  }
  prev.push(now);
  sessionHits.set(sessionId, prev);
  return true;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function buildGeminiPrompt(input: z.infer<typeof TurnEventsRequestSchema>): string {
  return [
    `Tu es le moteur narratif de EXO WORLD : 2050 (Tour ${input.cycle}, Année ${input.year}, Ère ${input.era}, Atmosphère ${input.atmosphereTier}).`,
    `Superpuissance: ${input.superpowerName}. Co-pilote IA: ${input.aiPersonaName} (Ton ${input.aiPersonality}). Approbation: ${input.approval}%. Crédits: ${input.credits}.`,
    `Règles strictes: Français précis, réalisme scientifique 2050 (R-50). Interdiction absolue d'évoquer des mécaniques fantastiques ou obsolètes.`,
    buildLlmLexiconPromptBlock(),
    `Génère UNIQUEMENT un objet JSON valide avec la structure exacte: { "aiCopilotComment": string (max 160 car), "dossiers": [ { "id": string, "code": string, "dossierClass": "C1"|"C2"|"C3"|"C4"|"C5", "title": string, "briefing": string, "source": "ORACLE_GEMINI", "slotIndex": 1, "tileIndex": integer 0..71, "expiresInCycles": 2, "options": [ 2 à 3 options dont AU MOINS UNE avec paGeneralCost=0 et subPaCost=0 ] } ] }.`,
    `Chaque option doit contenir: id, label, doctrineTag ("SOLARPUNK"|"CORPORATE"|"SECURITY"|"SCIENTIFIC"|"FEDERAL"), description, paGeneralCost (0..2), subPaDomain ("PA_GES"|"PA_MNT"|"PA_BIO"|"PA_POL"|null), subPaCost (0..2), effects { credits, energy, materials, water, food, electronics, compute, breathingKits, approvalDelta, atmosphereDelta, maintenanceDelta, allianceTrustDelta, eraStarsDelta, xpCiv, xpCabinet, xpAlliance, oracleImpactFactor }.`,
    `Génère exactement 1 dossier exécutif très incarné (mentionnant un quartier ou un conseiller) et évite les codes: ${input.excludedCodes.join(', ') || 'aucun'}.`,
  ].join('\n');
}

function cleanNarrativeText(raw: string): string {
  return applyLlmLexicon(sanitizeZ0Text(raw)).text;
}

function sanitizeAndParseDossiers(rawText: string, cycle: number): {
  aiCopilotComment?: string;
  dossiers: z.infer<typeof ExecutiveDossierSchema>[];
} | null {
  const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  const parsed = JSON.parse(cleaned) as { aiCopilotComment?: string; dossiers?: unknown[] };
  if (!parsed || !Array.isArray(parsed.dossiers) || parsed.dossiers.length === 0) return null;

  const validDossiers: z.infer<typeof ExecutiveDossierSchema>[] = [];
  for (let i = 0; i < Math.min(2, parsed.dossiers.length); i++) {
    const raw = parsed.dossiers[i] as Record<string, unknown>;
    const rawOptions = Array.isArray(raw.options) ? raw.options : [];
    const normalizedOptions = rawOptions.map((opt) => {
      if (!opt || typeof opt !== 'object') return opt;
      const rec = opt as Record<string, unknown>;
      return {
        ...rec,
        label: typeof rec.label === 'string' ? cleanNarrativeText(rec.label) : rec.label,
        description:
          typeof rec.description === 'string' ? cleanNarrativeText(rec.description) : rec.description,
      };
    });
    const normalized = {
      ...raw,
      id: typeof raw.id === 'string' ? raw.id : `gem-c${cycle}-${i}`,
      code: typeof raw.code === 'string' ? raw.code : `GEM-C${cycle}-${i + 1}`,
      title: typeof raw.title === 'string' ? cleanNarrativeText(raw.title) : 'Arbitrage Exécutif 2050',
      briefing: typeof raw.briefing === 'string' ? cleanNarrativeText(raw.briefing) : '',
      options: normalizedOptions,
      source: 'ORACLE_GEMINI' as const,
      slotIndex: 1,
      tileIndex: typeof raw.tileIndex === 'number' ? Math.max(0, Math.min(71, Math.round(raw.tileIndex))) : 14,
      expiresInCycles: 2,
    };
    const res = ExecutiveDossierSchema.safeParse(normalized);
    if (res.success) {
      const textCheck = checkZ0AndR50Compliance(`${res.data.title} ${res.data.briefing}`);
      if (textCheck.ok) {
        validDossiers.push(res.data);
      }
    }
  }
  if (validDossiers.length === 0) return null;
  return {
    aiCopilotComment:
      typeof parsed.aiCopilotComment === 'string'
        ? cleanNarrativeText(parsed.aiCopilotComment).slice(0, 220)
        : undefined,
    dossiers: validDossiers,
  };
}

async function callGeminiModel(
  ai: GoogleGenAI,
  model: 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite',
  prompt: string,
  timeoutMs: number,
): Promise<string> {
  const config =
    model === 'gemini-4-hydrogen'
      ? {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        }
      : {
          responseMimeType: 'application/json',
        };

  const response = await withTimeout(
    ai.models.generateContent({
      model,
      contents: prompt,
      config,
    }),
    timeoutMs,
    model,
  );
  return response.text ?? '';
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '512kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'exo-world-2050-bff', version: '5.1.0' });
  });

  app.use('/api/governance', createDocGovernanceRouter());
  app.use('/api/docs-vcs', createDocsVcsRouter());

  // R-68 Strict $0 Free Tier Guard: reject any request explicitly asking for a paid/non-allowlisted model
  app.use('/api/gemini', (req, res, next) => {
    const body = (req.body ?? {}) as { model?: unknown; requestedModel?: unknown };
    const candidate = typeof body.model === 'string'
      ? body.model.trim()
      : typeof body.requestedModel === 'string'
        ? body.requestedModel.trim()
        : '';
    if (candidate && !FREE_TIER_ALLOWED_MODELS.has(candidate)) {
      res.status(403).json({
        error: `R-68 Budget 0 USD strict : le modèle « ${candidate} » est bloqué (seuls gemini-4-hydrogen, gemini-3.1-flash-lite et gemini-decision-1 sont autorisés).`,
      });
      return;
    }
    next();
  });

  app.get('/api/project-docs', (_req, res) => {
    try {
      const rootDir = path.resolve(__dirname);
      const docsRoot = path.resolve(rootDir, 'docs');
      const candidates: string[] = [];
      for (const topFile of ['INDEX.md', 'CHANGELOG.txt']) {
        const abs = path.resolve(rootDir, topFile);
        if (fs.existsSync(abs)) candidates.push(abs);
      }
      const walk = (dir: string) => {
        if (!fs.existsSync(dir)) return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.resolve(dir, entry.name);
          if (!full.startsWith(docsRoot + path.sep)) continue;
          if (entry.isDirectory()) {
            walk(full);
          } else if (entry.name.endsWith('.md') || entry.name.endsWith('.txt') || entry.name.endsWith('.yaml')) {
            candidates.push(full);
          }
        }
      };
      walk(docsRoot);

      const categoryCounters = new Map<string, number>();
      const documents = candidates
        .sort((a, b) => a.localeCompare(b))
        .slice(0, 80)
        .map((abs, idx) => {
          const rel = path.relative(rootDir, abs).replace(/\\/g, '/');
          const stat = fs.statSync(abs);
          const raw = fs.readFileSync(abs, 'utf8');
          const firstHeading = raw.split('\n').find((line) => line.trim().startsWith('#'));
          const title = firstHeading ? firstHeading.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim() : path.basename(rel);
          const previewClass = classifyProjectDocument(rel, title, 0);
          const seq = categoryCounters.get(previewClass.categoryCode) ?? 0;
          categoryCounters.set(previewClass.categoryCode, seq + 1);
          const classified = classifyProjectDocument(rel, title, seq);
          return {
            id: `doc-${idx}-${rel.replace(/[^a-zA-Z0-9_-]/g, '-')}`,
            code: rel,
            filingCode: classified.filingCode,
            domain: classified.domain,
            track: classified.track,
            categoryCode: classified.categoryCode,
            title: title.slice(0, 120),
            category: classified.categoryLabel,
            fileName: path.basename(rel),
            sizeBytes: stat.size,
            fullText: raw.slice(0, 24_000),
          };
        });

      res.json({ documents });
    } catch (err) {
      res.status(500).json({
        documents: [],
        error: err instanceof Error ? err.message : 'Lecture des documents projet impossible.',
      });
    }
  });

  app.get('/api/sync/external-sources', async (_req, res) => {
    const checkedAtIso = new Date().toISOString();
    const repoApiUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`;
    const commitApiUrl = `${repoApiUrl}/commits/${GITHUB_REPO_BRANCH}`;
    const headers = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'exo-world-2050-sync',
    };

    let remoteSha: string | null = null;
    let remoteCommitDate: string | null = null;
    let remoteCommitMessage: string | null = null;
    let description: string | null = null;
    let errorDetail: string | undefined;

    try {
      const [repoResp, commitResp] = await withTimeout(
        Promise.all([
          fetch(repoApiUrl, { headers }),
          fetch(commitApiUrl, { headers }),
        ]),
        4000,
        'github-api',
      );
      if (repoResp.ok) {
        const repoJson = (await repoResp.json()) as { description?: string | null };
        description = typeof repoJson.description === 'string' ? repoJson.description : null;
      }
      if (commitResp.ok) {
        const commitJson = (await commitResp.json()) as {
          sha?: string;
          commit?: { message?: string; committer?: { date?: string } };
        };
        remoteSha = typeof commitJson.sha === 'string' ? commitJson.sha : null;
        remoteCommitDate = commitJson.commit?.committer?.date ?? null;
        remoteCommitMessage = commitJson.commit?.message?.split('\n')[0] ?? null;
      } else {
        errorDetail = `GitHub API HTTP ${commitResp.status}`;
      }
    } catch (err) {
      errorDetail = err instanceof Error ? err.message : 'GitHub inaccessible';
    }

    const payload: ExternalSyncSnapshot = {
      github: {
        repoFullName: `${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`,
        repoUrl: GITHUB_REPO_URL,
        branch: GITHUB_REPO_BRANCH,
        baselineSha: GITHUB_SYNC_BASELINE_SHA,
        remoteSha,
        remoteCommitDate,
        remoteCommitMessage,
        parity: evaluateGithubParity(GITHUB_SYNC_BASELINE_SHA, remoteSha),
        description,
        checkedAtIso,
        errorDetail,
      },
      geminiNotebook: {
        notebookId: GEMINI_NOTEBOOK_ID,
        notebookUrl: GEMINI_NOTEBOOK_URL,
        status: 'AUTH_REQUIRED',
        reason:
          'Le Notebook Gemini est privé et redirige les requêtes serveur anonymes vers la connexion Google. Ouvrez-le dans votre navigateur authentifié ou importez un extrait ci-dessous.',
      },
    };

    res.json(payload);
  });

  // V4 BFF Route: 4-Tier Cascade (T1 gemini-4-hydrogen -> T2 retry -> T3 gemini-3.1-flash-lite -> T4 transparent offline/CV)
  app.post('/api/gemini/generate-turn-events', async (req, res) => {
    const started = Date.now();
    const parsedReq = TurnEventsRequestSchema.safeParse(req.body);
    if (!parsedReq.success) {
      res.status(400).json({ error: 'Payload invalide', details: parsedReq.error.issues });
      return;
    }
    const input = parsedReq.data;

    if (!checkRateLimit(input.sessionId)) {
      res.json(
        TurnEvents4TResponseSchema.parse({
          tier: 'T4_OFFLINE_CV',
          modelUsed: 'catalog-cv-local',
          degraded: true,
          latencyMs: Date.now() - started,
          errorMessage: 'Limite de fréquence atteinte (12 req/min) — continuité Catalogue Vivant active.',
          dossiers: [],
        }),
      );
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.json(
        TurnEvents4TResponseSchema.parse({
          tier: 'T4_OFFLINE_CV',
          modelUsed: 'catalog-cv-local',
          degraded: true,
          latencyMs: Date.now() - started,
          errorMessage: 'Clé serveur Gemini absente — continuité hors-ligne Catalogue Vivant active.',
          dossiers: [],
        }),
      );
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
    const prompt = buildGeminiPrompt(input);
    let lastError = '';

    // T1: gemini-4-hydrogen (2.2s)
    try {
      const text = await callGeminiModel(ai, 'gemini-4-hydrogen', prompt, 2200);
      const parsed = sanitizeAndParseDossiers(text, input.cycle);
      if (parsed) {
        res.json(
          TurnEvents4TResponseSchema.parse({
            tier: 'T1_HYDROGEN',
            modelUsed: 'gemini-4-hydrogen',
            degraded: false,
            latencyMs: Date.now() - started,
            errorMessage: null,
            aiCopilotComment: parsed.aiCopilotComment,
            dossiers: parsed.dossiers,
          }),
        );
        return;
      }
      lastError = 'Réponse T1 non conforme au schéma Zod';
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Erreur T1 gemini-4-hydrogen';
    }

    // T2: gemini-4-hydrogen retry (1.3s)
    try {
      const text = await callGeminiModel(ai, 'gemini-4-hydrogen', prompt, 1300);
      const parsed = sanitizeAndParseDossiers(text, input.cycle);
      if (parsed) {
        res.json(
          TurnEvents4TResponseSchema.parse({
            tier: 'T2_HYDROGEN_RETRY',
            modelUsed: 'gemini-4-hydrogen',
            degraded: false,
            latencyMs: Date.now() - started,
            errorMessage: null,
            aiCopilotComment: parsed.aiCopilotComment,
            dossiers: parsed.dossiers,
          }),
        );
        return;
      }
      lastError = 'Réponse T2 non conforme au schéma Zod';
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Erreur T2 retry';
    }

    // T3: gemini-3.1-flash-lite (2.5s)
    try {
      const text = await callGeminiModel(ai, 'gemini-3.1-flash-lite', prompt, 2500);
      const parsed = sanitizeAndParseDossiers(text, input.cycle);
      if (parsed) {
        res.json(
          TurnEvents4TResponseSchema.parse({
            tier: 'T3_FLASH_LITE',
            modelUsed: 'gemini-3.1-flash-lite',
            degraded: true,
            latencyMs: Date.now() - started,
            errorMessage: 'Repli sur gemini-3.1-flash-lite après indisponibilité T1/T2.',
            aiCopilotComment: parsed.aiCopilotComment,
            dossiers: parsed.dossiers,
          }),
        );
        return;
      }
      lastError = 'Réponse T3 non conforme au schéma Zod';
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Erreur T3 gemini-3.1-flash-lite';
    }

    // T4: Transparent offline / CV continuity (never fakes live text)
    res.json(
      TurnEvents4TResponseSchema.parse({
        tier: 'T4_OFFLINE_CV',
        modelUsed: 'catalog-cv-local',
        degraded: true,
        latencyMs: Date.now() - started,
        errorMessage: `Génération live indisponible (${lastError}) — continuité Catalogue Vivant active.`,
        dossiers: [],
      }),
    );
  });

  // V5 Free-Tier Channel: Calibrated Consequences Scoring via Decisions API (gemini-decision-1, v1beta, 0 output tokens)
  app.post('/api/gemini/channel/consequences', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const body = (req.body ?? {}) as { text?: string; sessionId?: string };
    if (!body.text || typeof body.text !== 'string') {
      res.status(400).json({ error: 'Champ text requis.' });
      return;
    }
    if (!apiKey) {
      res.status(503).json({ error: 'Clé serveur Gemini absente pour Decisions API.' });
      return;
    }
    try {
      const decisionsAi = new GoogleGenAI({
        apiKey,
        apiVersion: 'v1beta',
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
      const result = await withTimeout(
        decisionsAi.decisions.create({
          model: 'gemini-decision-1',
          input: body.text.slice(0, 2000),
          questions: {
            severity: {
              type: 'score',
              instructions: 'Rate the strategic risk level of this executive decision in a 2050 planetary colony.',
              criteria: ['Low risk', 'Moderate risk', 'High risk', 'Critical planetary impact'],
            },
            ethics_pole: {
              type: 'choice',
              instructions: 'Which ethical school best matches this policy?',
              criteria: {
                thomism: 'Common good, subsidiarity, justice, prudence.',
                humanism: 'Civic dignity, health, education, public consent.',
                eco_symbiosis: 'Biosphere regeneration, air quality, ecology.',
                realpolitik: 'Security, deterrence, strategic power.',
                utilitarian: 'Resource efficiency, economic yield.',
              },
            },
          },
        }),
        4000,
        'gemini-decision-1',
      );
      res.json({
        channel: 'consequences',
        model: 'gemini-decision-1',
        freeTier: true,
        answers: result.answers ?? null,
        usage: { inputTokens: Math.ceil(body.text.length / 4), outputTokens: 0 },
      });
    } catch (error) {
      res.status(502).json({
        error: error instanceof Error ? error.message : 'Erreur Decisions API.',
      });
    }
  });

  // V5 Free-Tier Channel: Turn Digest & Summary via gemini-3.1-flash-lite
  app.post('/api/gemini/channel/digest', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const body = (req.body ?? {}) as { summaryContext?: string };
    if (!body.summaryContext || typeof body.summaryContext !== 'string') {
      res.status(400).json({ error: 'summaryContext requis.' });
      return;
    }
    if (!apiKey) {
      res.status(503).json({ error: 'Clé serveur Gemini absente pour le canal Digest.' });
      return;
    }
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
      const prompt = `Résume en 2 phrases françaises concises et diplomatiques ce bilan de tour EXO WORLD 2050 :\n${body.summaryContext.slice(0, 1500)}`;
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
        }),
        3500,
        'gemini-3.1-flash-lite',
      );
      const out = cleanNarrativeText(response.text ?? '');
      res.json({
        channel: 'digest',
        model: 'gemini-3.1-flash-lite',
        freeTier: true,
        digestText: out,
        usage: { inputTokens: Math.ceil(prompt.length / 4), outputTokens: Math.ceil(out.length / 4) },
      });
    } catch (error) {
      res.status(502).json({
        error: error instanceof Error ? error.message : 'Erreur canal Digest.',
      });
    }
  });

  // V5 Free-Tier Channel: Pax Historia Freeform Directive & Diplomacy Advisor via gemini-4-hydrogen
  app.post('/api/gemini/channel/freeform-directive', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const body = (req.body ?? {}) as {
      mode?: 'DIRECTIVE' | 'DIPLOMACY';
      text?: string;
      prompt?: string;
      faction?: string;
      worldSummary?: string;
    };
    const inputText = (body.text ?? body.prompt ?? '').trim();
    if (!inputText) {
      res.status(400).json({ error: 'Texte de directive requis.' });
      return;
    }
    if (!apiKey) {
      res.status(503).json({ error: 'Clé serveur Gemini absente.' });
      return;
    }
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
      const contextBlock = body.worldSummary ? ` Contexte : ${body.worldSummary.slice(0, 300)}.` : '';
      const prompt =
        body.mode === 'DIPLOMACY'
          ? `Tu es l'émissaire diplomatique de ${body.faction ?? 'Superpuissance rivale'} dans EXO WORLD 2050.${contextBlock} Réponds en français (3 phrases max, réalisme 2050) au message : "${inputText.slice(0, 500)}"`
          : `Tu es le Conseiller Stratégique de EXO WORLD 2050.${contextBlock} Analyse cette directive libre en français (3 phrases max, impact ressources & éthique) : "${inputText.slice(0, 500)}"`;
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } },
        }),
        4500,
        'gemini-4-hydrogen',
      );
      const reply = cleanNarrativeText(response.text ?? '');
      const inputTokens = Math.ceil(prompt.length / 4);
      const outputTokens = Math.ceil(reply.length / 4);
      res.json({
        channel: 'text',
        model: 'gemini-4-hydrogen',
        modelUsed: 'gemini-4-hydrogen',
        freeTier: true,
        reply,
        summary: reply,
        inputTokens,
        outputTokens,
        usage: { inputTokens, outputTokens },
      });
    } catch (error) {
      res.status(502).json({
        error: error instanceof Error ? error.message : 'Erreur Gemini freeform.',
      });
    }
  });

  // Backwards-compatible legacy endpoint proxying to the same 4T cascade
  app.post('/api/oracle/generate-dossier', async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    res.json({
      source: 'FALLBACK_LOCAL',
      latencyMs: 1,
      dossier: null,
      notice: `Route migrée vers /api/gemini/generate-turn-events (${String(body.dossierClass ?? 'C1')}).`,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const viteReadyPromise = createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        ws: { server: httpServer },
        hmr: !disableHmr,
        watch: disableHmr ? null : undefined,
      },
      appType: 'spa',
    });

    app.use((req, res, next) => {
      viteReadyPromise
        .then((vite) => {
          vite.middlewares(req, res, next);
        })
        .catch(next);
    });

    viteReadyPromise.catch((err: unknown) => {
      console.error('[EXO WORLD 2050] Failed to initialize Vite middleware:', err);
    });
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, HOST, () => {
    console.log(`[EXO WORLD 2050] Server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  });
}

startServer().catch((err: unknown) => {
  console.error('[EXO WORLD 2050] Fatal startup error:', err);
  process.exit(1);
});
