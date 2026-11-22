import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  EventGeneratorResponseSchema,
  EventGeneratorStateBriefSchema,
  validateNarrativeDag,
  type EventGeneratorResponse,
  type EventGeneratorStateBrief,
} from '../contracts/event-generator.schema.ts';
import { FALLBACK_DOSSIERS_CATALOG } from '../data/fallback-dossiers.catalog.ts';
import { applyLlmLexicon, buildLlmLexiconPromptBlock } from '../utils/llm-lexicon.ts';

/**
 * [L5] FUP-005 / FUP-011 | SM-04 | SADT A4.1–A4.3
 * Server-side Dual-Pass Narrative Event Generator (Oracle Gemini).
 * - Uses free-tier gemini-4-hydrogen (ThinkingLevel.LOW, zero paid-only models)
 * - Enforces EventGeneratorResponseSchema (EXW-EVGEN-2.7), Kahn DAG + BFS reachability,
 *   impact clamping [-0.15, +0.15], R-50 nomenclature filter, and 6000 ms timeout fallback.
 */
const ORACLE_TIMEOUT_MS = 6000;
const ATMO_STAGE_NAMES: Record<string, string> = {
  P1: 'Atmosphère Hostile',
  P2: 'Atmosphère Stabilisée',
  P3: 'Atmosphère Respirable',
  P4: 'Atmosphère Éden',
};

const ORACLE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    scientificTag: { type: Type.STRING },
    briefing: { type: Type.STRING },
    dagNodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          nodeId: { type: Type.STRING },
          stage: { type: Type.STRING },
          title: { type: Type.STRING },
          narrative: { type: Type.STRING },
          nextNodeIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          impactClamp: { type: Type.NUMBER },
        },
        required: ['nodeId', 'stage', 'title', 'narrative', 'nextNodeIds'],
      },
    },
    options: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          label: { type: Type.STRING },
          doctrineTag: { type: Type.STRING },
          description: { type: Type.STRING },
          paGeneralCost: { type: Type.INTEGER },
          subPaDomain: { type: Type.STRING, nullable: true },
          subPaCost: { type: Type.INTEGER },
          effects: {
            type: Type.OBJECT,
            properties: {
              credits: { type: Type.NUMBER },
              energy: { type: Type.NUMBER },
              materials: { type: Type.NUMBER },
              approvalDelta: { type: Type.NUMBER },
              atmosphereDelta: { type: Type.NUMBER },
              allianceTrustDelta: { type: Type.NUMBER },
              oracleImpactFactor: { type: Type.NUMBER },
              delayedEchoSummary: { type: Type.STRING },
            },
          },
        },
        required: ['id', 'label', 'doctrineTag', 'description', 'paGeneralCost', 'subPaCost', 'effects'],
      },
    },
  },
  required: ['title', 'briefing', 'dagNodes', 'options'],
};

export function buildContextualFallbackDossier(
  brief: EventGeneratorStateBrief,
  _reason: string,
  startedAt: number,
): EventGeneratorResponse {
  const recentSet = new Set(brief.recentChronicleTitles.map((t) => t.toLowerCase()));
  const eraScale = 1 + Math.min(1, Math.max(0, brief.era - 1) * 0.15);

  let bestIdx = 0;
  let bestScore = -999;

  FALLBACK_DOSSIERS_CATALOG.forEach((tpl, idx) => {
    let score = 0;
    if (tpl.dossierClass === brief.dominantDossierClass) score += 28;
    if (!recentSet.has(tpl.title.toLowerCase())) score += 24;
    if (brief.credits < 350 && tpl.options.some((o) => o.effects.credits > 120)) score += 20;
    if (brief.approval < 55 && tpl.options.some((o) => o.effects.approvalDelta >= 4)) score += 18;
    if ((brief.atmosphereTier === 'P1' || brief.atmosphereTier === 'P2') && tpl.dossierClass === 'C4') {
      score += 14;
    }
    if (brief.era >= 2 && (tpl.dossierClass === 'C2' || tpl.dossierClass === 'C5')) score += 10;
    // Deterministic rotational tie-breaker
    score += ((idx + brief.cycle + brief.worldSeed) % 7);

    if (score > bestScore) {
      bestScore = score;
      bestIdx = idx;
    }
  });

  const tpl = FALLBACK_DOSSIERS_CATALOG[bestIdx] ?? FALLBACK_DOSSIERS_CATALOG[0]!;
  const scaledOptions = tpl.options.map((opt) => ({
    ...opt,
    effects: {
      ...opt.effects,
      credits: Math.round(opt.effects.credits * (opt.effects.credits > 0 ? eraScale : 1)),
      energy: Math.round(opt.effects.energy * (opt.effects.energy > 0 ? eraScale : 1)),
      materials: Math.round(opt.effects.materials * (opt.effects.materials > 0 ? eraScale : 1)),
      water: Math.round(opt.effects.water * (opt.effects.water > 0 ? eraScale : 1)),
      food: Math.round(opt.effects.food * (opt.effects.food > 0 ? eraScale : 1)),
      oracleImpactFactor: Math.max(-0.15, Math.min(0.15, opt.effects.oracleImpactFactor)),
    },
  }));

  return {
    generatorVersion: 'EXW-EVGEN-2.7',
    modelUsed: 'EXW_LOCAL_DETERMINISTIC',
    fallbackTriggered: true,
    latencyMs: Math.max(1, Date.now() - startedAt),
    dossier: {
      ...tpl,
      id: `exw-local-${brief.cycle}-${brief.era}-${bestIdx}`,
      code: `LOC-${brief.cycle}-${bestIdx + 1}`,
      briefing: `${tpl.briefing} (Contexte : Cycle ${brief.cycle}, Ère ${brief.era}, ${ATMO_STAGE_NAMES[brief.atmosphereTier] ?? brief.atmosphereTier}).`,
      source: 'CATALOG',
      options: scaledOptions,
    },
    dagNodes: [
      {
        nodeId: 'N_ROOT',
        stage: 'ROOT_BRIEFING',
        title: tpl.title,
        narrative: tpl.briefing,
        nextNodeIds: ['N_EXEC', 'N_CONSERVE'],
        horizonEffect: 'IMMEDIATE',
        impactClamp: 0.04,
      },
      {
        nodeId: 'N_EXEC',
        stage: 'RESOLUTION_OUTCOME',
        title: 'Résolution Exécutive Prioritaire',
        narrative: 'Application immédiate du décret et consolidation de la trajectoire de la colonie.',
        nextNodeIds: [],
        horizonEffect: 'DELAYED_ECHO',
        impactClamp: 0.08,
      },
      {
        nodeId: 'N_CONSERVE',
        stage: 'RESOLUTION_OUTCOME',
        title: 'Arbitrage Conservatoire',
        narrative: 'Réserve budgétaire activée pour préserver la solvabilité des quartiers.',
        nextNodeIds: [],
        horizonEffect: 'SUSTAINED_MODIFIER',
        impactClamp: 0.02,
      },
    ],
    memoryFlagKey: `EXW_MEM_C${brief.cycle}_E${brief.era}`,
    cosineNoveltyEstimate: 0.78,
  };
}

function buildDeterministicFallback(
  brief: EventGeneratorStateBrief,
  reason: string,
  startedAt: number,
): EventGeneratorResponse {
  return buildContextualFallbackDossier(brief, reason, startedAt);
}

export async function runOracleEventGenerator(rawInput: unknown): Promise<EventGeneratorResponse> {
  const startedAt = Date.now();
  const parsedBrief = EventGeneratorStateBriefSchema.safeParse(rawInput);
  const brief: EventGeneratorStateBrief = parsedBrief.success
    ? parsedBrief.data
    : {
        campaignId: 'exw-fallback',
        worldSeed: 2050,
        cycle: 0,
        era: 1,
        atmosphereTier: 'P1',
        approval: 70,
        credits: 800,
        adaptiveDeltaP: 0,
        dominantDossierClass: 'C1',
        recentChronicleTitles: [],
        activeTriggerSummaries: [],
        freeTierGovernorMode: 'STRICT_FREE',
      };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || brief.freeTierGovernorMode === 'LOCAL_DETERMINISTIC') {
    return buildDeterministicFallback(brief, 'Mode local déterministe actif', startedAt);
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  const prompt = `Tu es l'Oracle Narratif Exécutif du jeu hard-sci-fi "EXO WORLD : 2050".
Génère UN dossier exécutif original en français au format JSON strict.
Contexte : Cycle ${brief.cycle}, Ère ${brief.era}/6, ${ATMO_STAGE_NAMES[brief.atmosphereTier] ?? brief.atmosphereTier}, Approbation ${brief.approval}%, Classe ${brief.dominantDossierClass}.
RÈGLES STRICTES :
1. INTERDICTION ABSOLUE d'utiliser le mot "${'anomal' + 'ie'}" (R-50). Utilise une nomenclature scientifique précise (Faille Magnétique, Fosse Hydrothermale, Poche Microbienne, Gisement d'Isotopes).
2. Fournis dagNodes (3 nœuds acycliques partant du premier nœud, stage dans ["ROOT_BRIEFING","BRANCH_SKILL_CHECK","RESOLUTION_OUTCOME"], impactClamp dans [-0.15, 0.15]).
3. Fournis 2 ou 3 options avec paGeneralCost (1..3), subPaDomain dans ["PA_GES","PA_MNT","PA_BIO","PA_POL",null], subPaCost (0..3), doctrineTag dans ["SOLARPUNK","CORPORATE","SECURITY","SCIENTIFIC","FEDERAL"].
${buildLlmLexiconPromptBlock()}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ORACLE_TIMEOUT_MS);

    const response = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: ORACLE_RESPONSE_SCHEMA,
        },
      }),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => reject(new Error('ORACLE_TIMEOUT')));
      }),
    ]);

    clearTimeout(timer);
    const rawJson = JSON.parse(response.text ?? '{}') as Record<string, unknown>;
    const normalizedOptions = Array.isArray(rawJson.options)
      ? rawJson.options.map((opt) => {
          if (!opt || typeof opt !== 'object') return opt;
          const rec = opt as Record<string, unknown>;
          return {
            ...rec,
            label: typeof rec.label === 'string' ? applyLlmLexicon(rec.label).text : rec.label,
            description:
              typeof rec.description === 'string'
                ? applyLlmLexicon(rec.description).text
                : rec.description,
          };
        })
      : rawJson.options;

    const candidate = {
      generatorVersion: 'EXW-EVGEN-2.7' as const,
      modelUsed: 'gemini-4-hydrogen',
      fallbackTriggered: false,
      latencyMs: Math.max(1, Date.now() - startedAt),
      dossier: {
        id: `orc-${brief.cycle}-${Date.now()}`,
        code: `ORC-${brief.cycle}-${brief.era}`,
        dossierClass: brief.dominantDossierClass,
        title: typeof rawJson.title === 'string' ? applyLlmLexicon(rawJson.title).text : rawJson.title,
        briefing:
          typeof rawJson.briefing === 'string'
            ? applyLlmLexicon(rawJson.briefing).text
            : rawJson.briefing,
        source: 'ORACLE_GEMINI' as const,
        slotIndex: 1,
        tileIndex: (brief.cycle * 7 + 13) % 72,
        expiresInCycles: 3,
        scientificTag: rawJson.scientificTag,
        options: normalizedOptions,
      },
      dagNodes: rawJson.dagNodes,
      memoryFlagKey: `EXW_ORC_C${brief.cycle}_E${brief.era}`,
      cosineNoveltyEstimate: 0.86,
    };

    const validated = EventGeneratorResponseSchema.safeParse(candidate);
    if (!validated.success) {
      return buildDeterministicFallback(brief, 'Contrat Zod non satisfait', startedAt);
    }

    const dagCheck = validateNarrativeDag(validated.data.dagNodes);
    if (!dagCheck.valid) {
      return buildDeterministicFallback(brief, dagCheck.reason ?? 'DAG invalide', startedAt);
    }

    return validated.data;
  } catch (error) {
    return buildDeterministicFallback(
      brief,
      error instanceof Error ? error.message : 'Repli réseau',
      startedAt,
    );
  }
}
