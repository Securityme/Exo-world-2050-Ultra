import { useEffect, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { Check, Compass, Crown, Layers, Sparkles, X } from 'lucide-react';
import { getEraBanner } from '../../data/art-manifest.data.ts';
import {
  ERA_BRANCHES,
  formatSubEraLetter,
  getMacroEraMeta,
  getSpecializationsForStep,
  getSubEraScaleTitle,
  MACRO_ERAS_8,
  MAX_MACRO_ERA,
} from '../../data/eras-specializations.data.ts';
import { handleApplySpecializationAdvance } from '../../pipelines/game-actions.pipeline.ts';
import { useExoStore } from '../../stores/game.store.ts';
import { eraAdvanceModalOpenAtom, toastNoticeAtom } from '../../stores/selection.atoms.ts';
import { getSubEraStarThreshold } from '../../systems/geopolitics/humankind-progression.ts';

/**
 * [L7] EXW.L7.ERA_SPECIALIZATION_MODAL | v5.2.0 | SADT A5.1
 * Interactive 8-Macro-Era & Branch-Adaptive Sub-Era (.a/.b/.c) Progression Drawer/Modal.
 * Lets the player inspect all 8 Eras, review chosen branch specializations, and select
 * among 4 distinct Specializations at every Sub-Era (3★ / 5★) or Macro-Era (7★) milestone.
 */

export function EraSpecializationModal() {
  const [open, setOpen] = useAtom(eraAdvanceModalOpenAtom);
  const setToast = useSetAtom(toastNoticeAtom);
  const world = useExoStore((s) => s.world);
  const hk = world.hk;

  const currentEra = world.era;
  const currentSubEra = (hk?.subEra ?? 1) as 1 | 2 | 3;
  const activeBranch = hk?.activeBranchId ?? 'BIOSPHERE';
  const totalStars = hk
    ? Object.values(hk.starsByDomain).reduce<number>((a, b) => a + b, 0)
    : world.eraStars;

  const canAdvanceSubEra =
    currentSubEra < 3 && (Boolean(hk?.subEraAdvanceReady) || totalStars >= getSubEraStarThreshold(currentSubEra));
  const canAdvanceMacroEra =
    currentEra < MAX_MACRO_ERA && (Boolean(hk?.eraAdvanceReady) || totalStars >= 7);

  const [mode, setMode] = useState<'SUB_ERA' | 'EVOLVE' | 'TRANSCEND'>(() =>
    canAdvanceMacroEra ? 'EVOLVE' : 'SUB_ERA',
  );
  const [previewEra, setPreviewEra] = useState<number>(currentEra);

  const targetEra =
    mode === 'SUB_ERA' ? currentEra : Math.min(MAX_MACRO_ERA, currentEra + 1);
  const targetSubEra: 1 | 2 | 3 =
    mode === 'SUB_ERA' ? (Math.min(3, currentSubEra + 1) as 1 | 2 | 3) : 1;

  const specializationChoices = getSpecializationsForStep(targetEra, targetSubEra);
  const [selectedSpecId, setSelectedSpecId] = useState<string>(
    specializationChoices[0]?.id ?? '',
  );

  useEffect(() => {
    if (!open) return;
    const nextMode: 'SUB_ERA' | 'EVOLVE' = canAdvanceMacroEra ? 'EVOLVE' : 'SUB_ERA';
    setMode(nextMode);
    setPreviewEra(currentEra);
  }, [open, canAdvanceMacroEra, currentEra]);

  useEffect(() => {
    if (!specializationChoices.some((s) => s.id === selectedSpecId)) {
      setSelectedSpecId(specializationChoices[0]?.id ?? '');
    }
  }, [specializationChoices, selectedSpecId]);

  if (!open) return null;

  const isTransitionAllowed =
    mode === 'SUB_ERA' ? canAdvanceSubEra : canAdvanceMacroEra;
  const requiredStars =
    mode === 'SUB_ERA' ? getSubEraStarThreshold(currentSubEra) : 7;
  const activeMacroMeta = getMacroEraMeta(currentEra);
  const activeSubTitle = getSubEraScaleTitle(currentEra, currentSubEra, activeBranch);
  const chosenHistory = hk?.chosenSpecializations ?? [];
  const inspectedEraMeta = getMacroEraMeta(previewEra);

  const handleConfirmTransition = () => {
    if (!isTransitionAllowed) return;
    const [err, nextWorld] = handleApplySpecializationAdvance({
      kind: mode,
      specializationId: selectedSpecId,
    });
    if (err || !nextWorld) {
      setToast({
        id: Date.now(),
        tone: 'warn',
        text: err?.message ?? 'Transition indisponible.',
      });
      return;
    }
    const chosen = specializationChoices.find((s) => s.id === selectedSpecId);
    setToast({
      id: Date.now(),
      tone: 'success',
      text: chosen
        ? `Spécialisation activée : ${chosen.title} (${chosen.bonusSummary})`
        : `Transition vers l’Ère ${nextWorld.era}.${formatSubEraLetter(nextWorld.hk?.subEra ?? 1)} validée.`,
    });
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Feuille de route des 8 Ères et 4 Spécialisations"
      data-testid="era-specialization-modal"
    >
      <div className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
        {/* Hero Banner preserving bespoke Era art */}
        <div className="relative h-32 shrink-0 overflow-hidden border-b border-slate-200 dark:border-slate-800">
          <img
            src={getEraBanner(previewEra)}
            alt={`Illustration ${inspectedEraMeta.name}`}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/20" />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-4 text-white">
            <div>
              <div className="text-[11px] font-medium text-amber-300">
                Ère active {currentEra}.{formatSubEraLetter(currentSubEra)} / {MAX_MACRO_ERA} ·{' '}
                {ERA_BRANCHES[activeBranch].label} · {totalStars}★ cumulées
              </div>
              <h2 className="text-lg font-bold tracking-tight">
                {activeMacroMeta.name} — {activeSubTitle}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-slate-900/75 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <X className="h-3.5 w-3.5" />
              Fermer
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
          {/* 8 Macro-Eras Timeline Selector */}
          <section>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Frise des 8 Macro-Ères & Sous-Échelles (.a / .b / .c)
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Branche actuelle : {ERA_BRANCHES[activeBranch].shortLabel}
              </span>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {MACRO_ERAS_8.map((meta) => {
                const isCurrent = meta.era === currentEra;
                const isUnlocked = meta.era <= currentEra;
                const isSelectedPreview = meta.era === previewEra;
                const subLabels = meta.branchSubScaleTitles[activeBranch];
                return (
                  <button
                    key={meta.era}
                    type="button"
                    onClick={() => setPreviewEra(meta.era)}
                    className={`flex flex-col rounded-xl border p-2.5 text-left transition-colors ${
                      isSelectedPreview
                        ? 'border-amber-500 bg-amber-50/90 dark:border-amber-400 dark:bg-amber-950/35'
                        : isCurrent
                          ? 'border-emerald-500/80 bg-emerald-50/60 dark:border-emerald-500/60 dark:bg-emerald-950/25'
                          : isUnlocked
                            ? 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80'
                            : 'border-slate-200/70 bg-white/70 opacity-75 hover:opacity-100 dark:border-slate-800/70 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                      <span>{meta.code}</span>
                      {isCurrent && (
                        <span className="text-emerald-700 dark:text-emerald-300">
                          .{formatSubEraLetter(currentSubEra)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 truncate text-xs font-semibold">{meta.name}</div>
                    <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                      {meta.yearHorizon}
                    </div>
                    <div className="mt-1.5 flex gap-1">
                      {[1, 2, 3].map((sIdx) => {
                        const done =
                          meta.era < currentEra ||
                          (meta.era === currentEra && sIdx <= currentSubEra);
                        return (
                          <span
                            key={sIdx}
                            title={subLabels[sIdx - 1]}
                            className={`h-1.5 flex-1 rounded-full ${
                              done
                                ? 'bg-amber-500'
                                : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Branch-adapted Sub-Era scale preview for the clicked Era */}
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900/70">
              <div className="font-medium">
                {inspectedEraMeta.code} · {inspectedEraMeta.name} :{' '}
                <span className="text-slate-600 dark:text-slate-300">
                  {inspectedEraMeta.branchSubScaleTitles[activeBranch].join(' → ')}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {inspectedEraMeta.summary}
              </div>
            </div>
          </section>

          {/* 4-Specialization Selector Section */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold">
                  Choix parmi 4 Spécialisations — Palier {targetEra}.{formatSubEraLetter(targetSubEra)}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chaque palier de Sous-Ère (3★ / 5★) ou de Macro-Ère (7★) adapte votre sous-échelle et débloque un fil de quêtes dédié.
                </p>
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
                {currentSubEra < 3 && (
                  <button
                    type="button"
                    onClick={() => setMode('SUB_ERA')}
                    className={`rounded-md px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                      mode === 'SUB_ERA'
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    Sous-Ère {currentEra}.{formatSubEraLetter(currentSubEra + 1)} ({getSubEraStarThreshold(currentSubEra)}★)
                  </button>
                )}
                {currentEra < MAX_MACRO_ERA && (
                  <button
                    type="button"
                    onClick={() => setMode('EVOLVE')}
                    className={`rounded-md px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                      mode === 'EVOLVE'
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    Ère {currentEra + 1}.a (7★)
                  </button>
                )}
                {currentEra < MAX_MACRO_ERA && (
                  <button
                    type="button"
                    onClick={() => setMode('TRANSCEND')}
                    className={`rounded-md px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                      mode === 'TRANSCEND'
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    Transcender (+10% Gloire)
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {specializationChoices.map((spec) => {
                const selected = spec.id === selectedSpecId;
                const branch = ERA_BRANCHES[spec.branchId];
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => setSelectedSpecId(spec.id)}
                    className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-colors ${
                      selected
                        ? 'border-amber-500 bg-amber-50/90 ring-1 ring-amber-500/50 dark:border-amber-400 dark:bg-amber-950/35'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/75 dark:hover:border-slate-700'
                    }`}
                    data-testid={`spec-card-${spec.branchId.toLowerCase()}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                        <span className={branch.accentClass}>{branch.shortLabel}</span>
                        {selected && <Check className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" />}
                      </div>
                      <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                        {spec.title}
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {spec.tagline}
                      </p>
                    </div>
                    <div className="mt-3 border-t border-slate-200/80 pt-2 font-mono text-[11px] font-semibold text-emerald-700 dark:border-slate-800 dark:text-emerald-300">
                      {spec.bonusSummary}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex items-center gap-2 text-xs">
                <Crown className="h-4 w-4 shrink-0 text-amber-500" />
                {isTransitionAllowed ? (
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    Palier débloqué ({totalStars}/{requiredStars}★) — prêt à activer votre spécialisation.
                  </span>
                ) : (
                  <span className="text-slate-600 dark:text-slate-300">
                    Progression vers ce palier :{' '}
                    <strong className="font-mono tabular-nums">
                      {totalStars}/{requiredStars}★
                    </strong>{' '}
                    (continuez vos dossiers, extensions et quêtes).
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={!isTransitionAllowed}
                onClick={handleConfirmTransition}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
                  isTransitionAllowed
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {mode === 'SUB_ERA'
                  ? `Activer Sous-Ère ${targetEra}.${formatSubEraLetter(targetSubEra)}`
                  : `Passer en Ère ${targetEra}.a`}
              </button>
            </div>
          </section>

          {/* Chosen Specializations Lineage */}
          {chosenHistory.length > 0 && (
            <section>
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Layers className="h-3.5 w-3.5" />
                Spécialisations déjà adoptées ({chosenHistory.length})
              </h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {chosenHistory.map((item) => (
                  <div
                    key={`${item.era}-${item.subEra}-${item.specializationId}`}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900/70"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                      <span className={ERA_BRANCHES[item.branchId].accentClass}>
                        Ère {item.era}.{formatSubEraLetter(item.subEra)} · {ERA_BRANCHES[item.branchId].shortLabel}
                      </span>
                      <Compass className="h-3 w-3 text-slate-400" />
                    </div>
                    <div className="mt-0.5 font-semibold">{item.title}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      {item.bonusSummary}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
