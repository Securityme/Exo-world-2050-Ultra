import type {
  GeminiChannelId,
  GeminiCostLedger,
  TurnChoiceLogEntry,
  TurnGroupedChoiceSummary,
} from '../../contracts/gemini-router.schema.ts';
import type { ExecutiveDossier } from '../../contracts/pa-dossiers.schema.ts';
import type { UserContext3D } from '../../contracts/user-context.schema.ts';
import type { BinarySpectra } from '../../contracts/v4-systems.schema.ts';

/**
 * [L3] EXW.L3.GEMINI_COST_LEDGER | v5.0.0 | SADT A2.1/A5.2
 * Pure 6-Channel Free-Tier Gemini Cost Ledger, Turn Choice Grouping & Non-Restrictive AI Ranking.
 */
export const FREE_TIER_CHANNEL_MODELS: Readonly<Record<GeminiChannelId, string>> = Object.freeze({
  text: 'gemini-4-hydrogen',
  entities: 'gemini-4-hydrogen',
  consequences: 'gemini-decision-1',
  digest: 'gemini-3.1-flash-lite',
  image: 'local-svg-procedural',
  video: 'local-webm-3d-capture',
});

export function createInitialGeminiCostLedger(): GeminiCostLedger {
  return {
    freeTierStrict: true,
    billedUsd: 0,
    totalCalls: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    channels: {
      text: { channel: 'text', modelId: FREE_TIER_CHANNEL_MODELS.text, calls: 0, inputTokens: 0, outputTokens: 0, referenceUsdEquivalent: 0 },
      entities: { channel: 'entities', modelId: FREE_TIER_CHANNEL_MODELS.entities, calls: 0, inputTokens: 0, outputTokens: 0, referenceUsdEquivalent: 0 },
      consequences: { channel: 'consequences', modelId: FREE_TIER_CHANNEL_MODELS.consequences, calls: 0, inputTokens: 0, outputTokens: 0, referenceUsdEquivalent: 0 },
      digest: { channel: 'digest', modelId: FREE_TIER_CHANNEL_MODELS.digest, calls: 0, inputTokens: 0, outputTokens: 0, referenceUsdEquivalent: 0 },
      image: { channel: 'image', modelId: FREE_TIER_CHANNEL_MODELS.image, calls: 0, inputTokens: 0, outputTokens: 0, referenceUsdEquivalent: 0 },
      video: { channel: 'video', modelId: FREE_TIER_CHANNEL_MODELS.video, calls: 0, inputTokens: 0, outputTokens: 0, referenceUsdEquivalent: 0 },
    },
  };
}

export function recordGeminiChannelCall(
  ledger: GeminiCostLedger,
  input: {
    readonly channel: GeminiChannelId;
    readonly modelId?: string;
    readonly inputTokens: number;
    readonly outputTokens: number;
  },
): GeminiCostLedger {
  const prev = ledger.channels[input.channel];
  const inTok = Math.max(0, Math.round(input.inputTokens));
  const outTok = Math.max(0, Math.round(input.outputTokens));
  const refUsd = Number(((inTok * 0.00000015) + (outTok * 0.0000006)).toFixed(6));

  return {
    ...ledger,
    freeTierStrict: true,
    billedUsd: 0,
    totalCalls: ledger.totalCalls + 1,
    totalInputTokens: ledger.totalInputTokens + inTok,
    totalOutputTokens: ledger.totalOutputTokens + outTok,
    channels: {
      ...ledger.channels,
      [input.channel]: {
        ...prev,
        modelId: input.modelId ?? prev.modelId,
        calls: prev.calls + 1,
        inputTokens: prev.inputTokens + inTok,
        outputTokens: prev.outputTokens + outTok,
        referenceUsdEquivalent: Number((prev.referenceUsdEquivalent + refUsd).toFixed(6)),
      },
    },
  };
}

export function buildTurnGroupedChoiceSummary(
  cycle: number,
  entries: readonly TurnChoiceLogEntry[],
): TurnGroupedChoiceSummary {
  const filtered = entries.filter((e) => e.turn === cycle);
  const byCategory: Record<string, number> = {};
  const byModel: Record<string, number> = {};
  const byPhilosophy: Record<string, number> = {};

  for (const item of filtered) {
    byCategory[item.dossierClass] = (byCategory[item.dossierClass] ?? 0) + 1;
    byModel[item.sourceModel] = (byModel[item.sourceModel] ?? 0) + 1;
    byPhilosophy[item.philosophySchoolId] = (byPhilosophy[item.philosophySchoolId] ?? 0) + 1;
  }

  return {
    cycle,
    totalDecisions: filtered.length,
    byCategory,
    byModel,
    byPhilosophy,
    entries: [...filtered],
  };
}

export type AiPriorityTier = 'RECOMMENDED' | 'AI_PREFERENCE' | 'OTHER';

export interface RankedDossierItem {
  readonly dossier: ExecutiveDossier;
  readonly tier: AiPriorityTier;
  readonly tierLabel: string;
  readonly score: number;
  readonly reason: string;
}

/**
 * Non-restrictive ranking: ALWAYS preserves 100% of dossiers enabled and actionable.
 */
export function rankDossiersByAiContext(
  dossiers: readonly ExecutiveDossier[],
  userContext: UserContext3D | null,
  spectra?: BinarySpectra,
): readonly RankedDossierItem[] {
  const recentTraces = userContext?.simulationTraceabilityProfile.traceabilityMatrix ?? [];
  const freqByPole: Record<string, number> = {};
  for (const tr of recentTraces.slice(0, 15)) {
    freqByPole[tr.philosophyPole] = (freqByPole[tr.philosophyPole] ?? 0) + 1;
  }

  const ranked = dossiers.map((dossier) => {
    let score = 50;
    let reason = 'Équilibre standard de campagne';

    if (dossier.dossierClass === 'P0') {
      score += 45;
      reason = 'Crise urgente prioritaire (P0)';
    } else if (dossier.source === 'ORACLE_GEMINI') {
      score += 22;
      reason = 'Contexte narratif Gemini Live adapté au tour';
    }

    const ecoFocus = (spectra?.ecologyVsIndustry ?? 0) >= 10;
    if (ecoFocus && (dossier.dossierClass === 'C4' || dossier.title.toLowerCase().includes('atmo'))) {
      score += 18;
      reason = 'Aligné sur votre spectre Éco-Symbiose';
    }

    if (dossier.options.some((o) => o.paGeneralCost === 0 && o.subPaCost === 0)) {
      score += 8;
    }

    if ((freqByPole['POLE_I'] ?? 0) > 0 && dossier.dossierClass === 'C1') {
      score += 12;
      reason = 'Cohérent avec votre historique Bien Commun';
    }

    const tier: AiPriorityTier =
      score >= 82 ? 'RECOMMENDED' : score >= 66 ? 'AI_PREFERENCE' : 'OTHER';
    const tierLabel =
      tier === 'RECOMMENDED'
        ? 'Recommandé'
        : tier === 'AI_PREFERENCE'
          ? 'Préférence IA'
          : 'Autres';

    return { dossier, tier, tierLabel, score, reason };
  });

  return ranked.sort((a, b) => b.score - a.score);
}
