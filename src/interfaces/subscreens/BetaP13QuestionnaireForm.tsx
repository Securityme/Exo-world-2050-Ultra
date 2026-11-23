import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import type {
  BetaCriterionId,
  BetaQuestionnaireSubmission,
  BetaRatingsMap,
  BetaTesterProfileId,
} from '../../contracts/beta-p13.schema.ts';
import {
  BETA_CRITERIA_CATALOG,
  BETA_PROFILE_OPTIONS,
  BETA_SUGGESTION_CHIPS,
} from '../../data/beta-p13.catalog.ts';
import {
  createDefaultRatings,
  validateCommunityQuestionnaireInput,
} from '../../systems/playtest/beta-p13-engine.ts';

interface BetaP13QuestionnaireFormProps {
  readonly nextSequence: number;
  readonly onSubmit: (submission: BetaQuestionnaireSubmission) => void;
}

/**
 * [L7] EXW.L7.BETA_P13_FORM | v5.0.0 | SADT A5.3
 * Structured Community Improvement Questionnaire (10 criteria 1..5, priority track,
 * clickable suggestion chips, strict Result-Pattern validation).
 */
export function BetaP13QuestionnaireForm({ nextSequence, onSubmit }: BetaP13QuestionnaireFormProps) {
  const [authorName, setAuthorName] = useState('');
  const [profileId, setProfileId] = useState<BetaTesterProfileId>('COMMUNITY_PLAYER');
  const [ratings, setRatings] = useState<BetaRatingsMap>(() => createDefaultRatings(5));
  const [priorityCriterionId, setPriorityCriterionId] = useState<BetaCriterionId>('MOBILE_SAFARI');
  const [comment, setComment] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const setScore = (criterionId: BetaCriterionId, score: number) => {
    setRatings((prev) => ({ ...prev, [criterionId]: score }));
  };

  const handleChipClick = (chip: string) => {
    setComment((prev) => (prev.trim() ? `${prev.trim()} ${chip}` : chip));
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    const [err, parsed] = validateCommunityQuestionnaireInput({
      authorName,
      profileId,
      ratings,
      priorityCriterionId,
      comment,
      submittedAtIso: new Date().toISOString(),
      sequenceNumber: nextSequence,
    });
    if (err || !parsed) {
      setErrorMsg(err?.message ?? 'Formulaire incomplet.');
      return;
    }
    setErrorMsg(null);
    onSubmit(parsed);
    setAuthorName('');
    setComment('');
    setRatings(createDefaultRatings(5));
    setSuccessMsg(`Merci ${parsed.authorName} : votre évaluation est intégrée au rapport P13.`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-rose-200 bg-white/90 p-4 dark:border-rose-900/60 dark:bg-rose-950/25"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-[#1f1224] dark:text-rose-100">
          Prénom ou pseudo du testeur
          <input
            type="text"
            value={authorName}
            onChange={(e) => {
              setAuthorName(e.target.value);
              setErrorMsg(null);
            }}
            placeholder="Ex. Baptiste, Camille, Alex..."
            className="mt-1 min-h-[42px] w-full rounded-lg border border-rose-200 bg-white px-3 text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-50"
          />
        </label>

        <label className="block text-xs font-semibold text-[#1f1224] dark:text-rose-100">
          Profil de joueur
          <select
            value={profileId}
            onChange={(e) => setProfileId(e.target.value as BetaTesterProfileId)}
            className="mt-1 min-h-[42px] w-full rounded-lg border border-rose-200 bg-white px-3 text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-50"
          >
            {BETA_PROFILE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label} — {opt.focus}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <div className="font-mono text-[11px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
          Grille d’évaluation (1 = À corriger · 5 = Prêt pour la sortie)
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {BETA_CRITERIA_CATALOG.map((crit) => (
            <div
              key={crit.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-rose-200/80 bg-rose-50/40 px-2.5 py-2 dark:border-rose-900/50 dark:bg-rose-950/40"
            >
              <span className="min-w-0 text-[11.5px] font-medium text-[#1f1224] dark:text-rose-100">
                {crit.label}
              </span>
              <div className="flex shrink-0 gap-1" role="group" aria-label={`Note pour ${crit.shortLabel}`}>
                {[1, 2, 3, 4, 5].map((score) => {
                  const selected = ratings[crit.id] === score;
                  return (
                    <button
                      key={score}
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${crit.shortLabel} note ${score} sur 5`}
                      onClick={() => setScore(crit.id, score)}
                      className={`h-8 w-8 rounded-md border font-mono text-xs font-bold transition ${
                        selected
                          ? 'border-rose-500 bg-rose-600 text-white'
                          : 'border-rose-200 bg-white text-rose-900 hover:border-rose-400 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200'
                      }`}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <label className="block text-xs font-semibold text-[#1f1224] dark:text-rose-100">
        Priorité d’amélioration recommandée (v5.1)
        <select
          value={priorityCriterionId}
          onChange={(e) => setPriorityCriterionId(e.target.value as BetaCriterionId)}
          className="mt-1 min-h-[42px] w-full rounded-lg border border-rose-200 bg-white px-3 text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-50"
        >
          {BETA_CRITERIA_CATALOG.map((crit) => (
            <option key={crit.id} value={crit.id}>
              {crit.shortLabel} — {crit.v51Action}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-[#1f1224] dark:text-rose-100">
          Retour détaillé & proposition d’amélioration (min. 10 caractères)
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setErrorMsg(null);
            }}
            placeholder="Décrivez ce qui fonctionne bien et l’amélioration que vous souhaitez voir en priorité..."
            className="mt-1 w-full rounded-lg border border-rose-200 bg-white p-2.5 text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-50"
          />
        </label>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-rose-700 dark:text-rose-300">
            <Sparkles className="h-3 w-3" />
            Suggestions rapides :
          </span>
          {BETA_SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="rounded-lg border border-rose-300/80 bg-rose-50/70 px-2.5 py-1 text-left text-[11px] text-rose-900 hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <p role="alert" className="rounded-lg border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
          {errorMsg}
        </p>
      )}
      {successMsg && (
        <p role="status" className="rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          {successMsg}
        </p>
      )}

      <button
        type="submit"
        className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-rose-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-rose-500"
      >
        <Send className="h-3.5 w-3.5" />
        <span>Enregistrer mon questionnaire P13</span>
      </button>
    </form>
  );
}
