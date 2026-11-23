import {
  BetaQuestionnaireSubmissionSchema,
  type BetaCriterionId,
  type BetaCriterionSummary,
  type BetaQuestionnaireSubmission,
  type BetaRatingsMap,
  type BetaReleaseVerdict,
  type BetaTesterProfileId,
  type ConsolidatedBetaReport,
} from '../../contracts/beta-p13.schema.ts';
import {
  BETA_CRITERIA_CATALOG,
  BETA_PROFILE_OPTIONS,
  VIRTUAL_BETA_PERSONAS_CATALOG,
} from '../../data/beta-p13.catalog.ts';
import {
  DEFAULT_PLAYTEST_SEED,
  runDeterministicPlaytest6Turns,
  type Playtest6TurnsReport,
} from './playtest-6-turns.ts';

/**
 * [L3] EXW.L3.BETA_P13_ENGINE | v5.0.0 | SADT A5.3
 * 100% pure deterministic Wave P13 engine:
 * - Virtual Beta-Tester multi-persona campaign simulation (coupled with 6-turn deterministic playtest)
 * - Strict Result-Pattern community questionnaire validator
 * - Consolidated scoring, prioritized v5.1 backlog & Release Verdict evaluator
 * - Exportable Markdown report builder
 * Zero I/O, zero Math.random(), zero Date.now().
 */
export interface VirtualBetaCampaignRun {
  readonly playtest: Playtest6TurnsReport;
  readonly personas: readonly BetaQuestionnaireSubmission[];
  readonly consolidated: ConsolidatedBetaReport;
}

export interface CommunitySubmissionDraft {
  readonly authorName: string;
  readonly profileId: BetaTesterProfileId;
  readonly ratings: BetaRatingsMap;
  readonly priorityCriterionId: BetaCriterionId;
  readonly comment: string;
  readonly submittedAtIso: string;
  readonly sequenceNumber: number;
}

export function createDefaultRatings(defaultScore = 4): BetaRatingsMap {
  const clamped = Math.max(1, Math.min(5, Math.round(defaultScore)));
  return {
    LOOP_PA: clamped,
    HUD_DESKTOP: clamped,
    MOBILE_SAFARI: clamped,
    THEME_ASTRALIS: clamped,
    BADGES_ETHICS: clamped,
    SCENARIO_MATRIX: clamped,
    HONORS_2TIER: clamped,
    CITY_3D_CLIMATE: clamped,
    GEMINI_FREE_TIER: clamped,
    DOC_GOVERNANCE: clamped,
  };
}

export function runVirtualBetaPlaytestCampaign(
  seed: number = DEFAULT_PLAYTEST_SEED,
): VirtualBetaCampaignRun {
  const playtest = runDeterministicPlaytest6Turns(seed);
  const personas = VIRTUAL_BETA_PERSONAS_CATALOG.map((p) => ({
    ...p,
    ratings: { ...p.ratings },
    strengths: [...p.strengths],
    recommendations: [...p.recommendations],
  }));
  const consolidated = consolidateBetaFeedbackReport(personas);
  return { playtest, personas, consolidated };
}

export function validateCommunityQuestionnaireInput(
  draft: CommunitySubmissionDraft,
): [Error, null] | [null, BetaQuestionnaireSubmission] {
  const authorName = draft.authorName.trim();
  if (authorName.length < 2) {
    return [new Error('Indiquez votre prénom ou pseudo (au moins 2 caractères).'), null];
  }
  const comment = draft.comment.trim();
  if (comment.length < 10) {
    return [new Error('Partagez un retour concret d’au moins 10 caractères.'), null];
  }

  const profileSpec = BETA_PROFILE_OPTIONS.find((p) => p.id === draft.profileId) ?? BETA_PROFILE_OPTIONS[0]!;
  const candidate = {
    id: `p13-community-${draft.sequenceNumber}`,
    authorName: authorName.slice(0, 48),
    profileId: draft.profileId,
    profileLabel: profileSpec.label,
    source: 'COMMUNITY' as const,
    ratings: draft.ratings,
    priorityCriterionId: draft.priorityCriterionId,
    strengths: [],
    recommendations: [comment.slice(0, 220)],
    comment: comment.slice(0, 1200),
    submittedAtIso: draft.submittedAtIso,
  };

  const parsed = BetaQuestionnaireSubmissionSchema.safeParse(candidate);
  if (!parsed.success) {
    return [new Error('Certaines notes du questionnaire sont hors plage (1 à 5).'), null];
  }
  return [null, parsed.data];
}

export function computeSubmissionAverage(sub: BetaQuestionnaireSubmission): number {
  const values = BETA_CRITERIA_CATALOG.map((c) => sub.ratings[c.id]);
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Number((sum / values.length).toFixed(2));
}

export function consolidateBetaFeedbackReport(
  submissions: readonly BetaQuestionnaireSubmission[],
): ConsolidatedBetaReport {
  const totalResponses = submissions.length;
  const virtualCount = submissions.filter((s) => s.source === 'VIRTUAL_PERSONA').length;
  const communityCount = submissions.filter((s) => s.source === 'COMMUNITY').length;

  const criteriaSummaries: BetaCriterionSummary[] = BETA_CRITERIA_CATALOG.map((spec) => {
    const avg =
      totalResponses === 0
        ? 0
        : Number(
            (
              submissions.reduce((acc, sub) => acc + sub.ratings[spec.id], 0) / totalResponses
            ).toFixed(2),
          );
    const priorityVotes = submissions.filter((sub) => sub.priorityCriterionId === spec.id).length;
    return {
      criterionId: spec.id,
      label: spec.label,
      category: spec.category,
      averageScore: avg,
      priorityVotes,
      v51Action: spec.v51Action,
    };
  });

  const globalAverage =
    criteriaSummaries.length === 0 || totalResponses === 0
      ? 0
      : Number(
          (
            criteriaSummaries.reduce((acc, c) => acc + c.averageScore, 0) / criteriaSummaries.length
          ).toFixed(2),
        );

  const sortedAsc = [...criteriaSummaries].sort((a, b) => {
    if (a.averageScore !== b.averageScore) return a.averageScore - b.averageScore;
    return b.priorityVotes - a.priorityVotes;
  });

  const sortedDesc = [...criteriaSummaries].sort((a, b) => b.averageScore - a.averageScore);
  const lowestCriterionId: BetaCriterionId = sortedAsc[0]?.criterionId ?? 'LOOP_PA';
  const highestCriterionId: BetaCriterionId = sortedDesc[0]?.criterionId ?? 'GEMINI_FREE_TIER';

  const minScore = sortedAsc[0]?.averageScore ?? 0;
  let verdict: BetaReleaseVerdict = 'NEEDS_FIX';
  if (totalResponses > 0 && globalAverage >= 4.2 && minScore >= 3.5) {
    verdict = 'GO_RELEASE';
  } else if (totalResponses > 0 && globalAverage >= 3.5) {
    verdict = 'CONDITIONAL';
  }

  // Prioritize backlog by highest community priority votes first, then lowest average score
  const prioritizedBacklog = [...criteriaSummaries].sort((a, b) => {
    if (b.priorityVotes !== a.priorityVotes) return b.priorityVotes - a.priorityVotes;
    return a.averageScore - b.averageScore;
  });

  return {
    totalResponses,
    virtualCount,
    communityCount,
    globalAverage,
    lowestCriterionId,
    highestCriterionId,
    verdict,
    criteriaSummaries,
    prioritizedBacklog,
  };
}

export function formatBetaReportMarkdown(
  report: ConsolidatedBetaReport,
  submissions: readonly BetaQuestionnaireSubmission[],
  playtest?: Playtest6TurnsReport | null,
): string {
  const verdictLabel =
    report.verdict === 'GO_RELEASE'
      ? 'APPROUVÉ — GO PRODUCTION v5.0.0'
      : report.verdict === 'CONDITIONAL'
        ? 'CONDITIONNEL — AJUSTEMENTS MINEURS RECOMMANDÉS'
        : 'CORRECTIFS REQUIS AVANT RELEASE';

  const lines: string[] = [
    '# EXO WORLD : 2050 — Rapport Consolidé Vague P13 (Bêta Virtuelle & Communauté)',
    '',
    `- **Score Global** : **${report.globalAverage.toFixed(2)} / 5**`,
    `- **Évaluations** : ${report.totalResponses} (${report.virtualCount} personas virtuels · ${report.communityCount} retours communauté)`,
    `- **Verdict Release** : ${verdictLabel}`,
  ];

  if (playtest) {
    lines.push(
      `- **Playtest Déterministe 6 Tours** : Seed \`${playtest.seedHex}\` · ${playtest.totalTicks} ticks · Chaîne \`${playtest.finalChainHash.slice(0, 16)}\``,
    );
  }

  lines.push('', '## Synthèse des 10 Critères & Backlog v5.1', '');
  lines.push('| Critère | Note / 5 | Votes Priorité | Action v5.1 |');
  lines.push('| :--- | :---: | :---: | :--- |');
  for (const row of report.prioritizedBacklog) {
    lines.push(
      `| ${row.label} | ${row.averageScore.toFixed(2)} | ${row.priorityVotes} | ${row.v51Action} |`,
    );
  }

  lines.push('', '## Retours Détaillés (Personas & Communauté)', '');
  for (const sub of submissions) {
    const avg = computeSubmissionAverage(sub);
    const origin = sub.source === 'COMMUNITY' ? 'Communauté' : 'Bêta-Testeur Virtuel';
    lines.push(`### ${sub.authorName} — ${sub.profileLabel} (${origin} · ${avg.toFixed(2)} / 5)`);
    lines.push(`> ${sub.comment}`, '');
  }

  return lines.join('\n');
}
