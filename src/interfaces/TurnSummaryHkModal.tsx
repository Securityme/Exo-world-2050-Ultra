import { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Crown,
  Loader2,
  Sparkles,
  Star,
  WifiOff,
  X,
} from 'lucide-react';
import { getEraBanner } from '../data/art-manifest.data.ts';
import {
  ERA_BRANCHES,
  formatSubEraLetter,
  getSpecializationsForStep,
  getSubEraScaleTitle,
  MAX_MACRO_ERA,
} from '../data/eras-specializations.data.ts';
import {
  HK_STAR_DOMAINS,
  resolveSuperpowerV4,
} from '../data/v4-catalog.data.ts';
import { handleApplySpecializationAdvance } from '../pipelines/game-actions.pipeline.ts';
import { useExoStore } from '../stores/game.store.ts';
import { useMetaHonorsStore } from '../stores/meta-honors.store.ts';
import {
  eraAdvanceModalOpenAtom,
  latestTurnEvents4TAtom,
  toastNoticeAtom,
  turnEventsLoadingAtom,
  turnSummaryModalOpenAtom,
} from '../stores/selection.atoms.ts';
import { buildTurnGroupedChoiceSummary } from '../systems/turn-orchestration/gemini-cost-ledger.ts';

/**
 * [L7] EXW.L7.TURN_SUMMARY_HK | v5.2.0 | SADT A5.1
 * Humankind End-of-Turn Summary Modal with 8 Macro-Eras, Sub-Eras (.a/.b/.c) & 4 Specializations picker.
 */
export function TurnSummaryHkModal() {
  const [open, setOpen] = useAtom(turnSummaryModalOpenAtom);
  const setEraModalOpen = useSetAtom(eraAdvanceModalOpenAtom);
  const setToast = useSetAtom(toastNoticeAtom);
  const [liveStatus] = useAtom(latestTurnEvents4TAtom);
  const [loadingLive] = useAtom(turnEventsLoadingAtom);
  const world = useExoStore((s) => s.world);
  const geminiLedger = useMetaHonorsStore((s) => s.geminiLedger);
  const turnChoiceLog = useMetaHonorsStore((s) => s.turnChoiceLog);
  const [selectedSpecId, setSelectedSpecId] = useState<string>('');
  const [showEraPicker, setShowEraPicker] = useState(false);

  if (!open || !world.lastTurnSummary) return null;

  const summary = world.lastTurnSummary;
  const groupedDigest = buildTurnGroupedChoiceSummary(Math.max(0, summary.cycleCompleted - 1), turnChoiceLog);
  const hk = world.hk;
  const sp = resolveSuperpowerV4(world.superpowerId);
  const currentSubEra = (hk?.subEra ?? 1) as 1 | 2 | 3;
  const activeBranch = hk?.activeBranchId ?? 'BIOSPHERE';
  const subEraTitle = getSubEraScaleTitle(world.era, currentSubEra, activeBranch);
  const isMacroReady = summary.eraAdvanceReady && world.era < MAX_MACRO_ERA;
  const isSubReady = Boolean(summary.subEraAdvanceReady) && currentSubEra < 3;
  const pickerTargetEra = isMacroReady ? Math.min(MAX_MACRO_ERA, world.era + 1) : world.era;
  const pickerTargetSubEra: 1 | 2 | 3 = isMacroReady ? 1 : (Math.min(3, currentSubEra + 1) as 1 | 2 | 3);
  const stepSpecs = getSpecializationsForStep(pickerTargetEra, pickerTargetSubEra);
  const effectiveSpecId = stepSpecs.some((s) => s.id === selectedSpecId)
    ? selectedSpecId
    : stepSpecs[0]?.id ?? '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0612]/80 p-3 sm:p-6">
      <div
        role="dialog"
        aria-label={`Bilan de fin de tour ${summary.cycleCompleted}`}
        className="exo-bento-card flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl"
      >
        {/* Era Banner Header */}
        <div className="relative h-32 w-full shrink-0 overflow-hidden sm:h-36">
          <img src={getEraBanner(world.era)} alt={`Ère ${world.era}`} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#160a1e] via-[#160a1e]/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-300">
                Bilan Humankind · Tour {summary.cycleCompleted} · {summary.season} {summary.year}
              </div>
              <h2 className="font-display text-xl font-bold text-white">
                {hk?.factionEraTitle ?? sp.name} · Ère {world.era}.{formatSubEraLetter(currentSubEra)}/{MAX_MACRO_ERA} — {subEraTitle}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le bilan"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-black/45 text-white hover:bg-black/65"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {/* Fame + Stars KPI Strip */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-xl border border-amber-300/80 bg-amber-50/75 p-3 dark:border-amber-700/60 dark:bg-amber-950/30">
              <div className="font-mono text-[10px] uppercase text-amber-800 dark:text-amber-300">Gloire</div>
              <div className="mt-1 font-display text-lg font-bold text-[#1f1224] dark:text-amber-100">
                {summary.totalFame} <span className="text-xs text-emerald-700 dark:text-emerald-300">+{summary.fameEarnedThisTurn}</span>
              </div>
            </div>
            <div className="rounded-xl border border-rose-200 bg-white/85 p-3 dark:border-rose-900/60 dark:bg-[#190d1f]">
              <div className="font-mono text-[10px] uppercase text-rose-700 dark:text-rose-300">Étoiles d’Ère</div>
              <div className="mt-1 font-display text-lg font-bold text-[#1f1224] dark:text-rose-50">
                {summary.totalEraStars} / 7{' '}
                {summary.starsEarnedThisTurn > 0 && (
                  <span className="text-xs text-amber-600 dark:text-amber-300">+{summary.starsEarnedThisTurn}</span>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-rose-200 bg-white/85 p-3 dark:border-rose-900/60 dark:bg-[#190d1f]">
              <div className="font-mono text-[10px] uppercase text-rose-700 dark:text-rose-300">Solde Net</div>
              <div
                className={`mt-1 font-display text-lg font-bold ${
                  summary.ledger.credits >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {summary.ledger.credits >= 0 ? `+${summary.ledger.credits}` : summary.ledger.credits} Cr
              </div>
            </div>
          </div>

          {/* Entity Resource Ledger Strip */}
          <div className="rounded-xl border border-rose-200/80 bg-white/85 p-3.5 dark:border-rose-900/60 dark:bg-[#190d1f]">
            <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              Registre Économique des Entités (Tour {summary.cycleCompleted})
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 font-mono text-xs sm:grid-cols-7">
              {[
                ['Énerg.', summary.ledger.energy],
                ['Mat.', summary.ledger.materials],
                ['Eau', summary.ledger.water],
                ['Vivres', summary.ledger.food],
                ['Calcul', summary.ledger.compute],
                ['Kits O₂', summary.ledger.breathingKits],
                ['Élec.', summary.ledger.electronics],
              ].map(([lbl, val]) => (
                <div key={String(lbl)} className="rounded-lg border border-rose-200/60 bg-rose-50/50 p-2 text-center dark:border-rose-900/50 dark:bg-rose-950/30">
                  <div className="text-[10px] text-rose-900/65 dark:text-rose-200/65">{lbl}</div>
                  <div className={`font-bold ${Number(val) >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'}`}>
                    {Number(val) >= 0 ? `+${val}` : val}
                  </div>
                </div>
              ))}
            </div>
            {summary.ledger.shortages.length > 0 && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-rose-400/70 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-200">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Pénuries détectées : {summary.ledger.shortages.join(' · ')}</span>
              </div>
            )}
          </div>

          {/* 7 Humankind Star Domains */}
          {hk && (
            <div className="rounded-xl border border-rose-200/80 bg-white/85 p-3.5 dark:border-rose-900/60 dark:bg-[#190d1f]">
              <div className="mb-2 flex items-center justify-between font-mono text-[10.5px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                <span>7 Domaines d’Étoiles Humankind</span>
                <span>Seuil Avance d’Ère : 7 Étoiles</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {HK_STAR_DOMAINS.map((dom) => {
                  const stars = hk.starsByDomain[dom.id];
                  return (
                    <div
                      key={dom.id}
                      className="rounded-lg border border-rose-200/60 bg-rose-50/40 p-2 text-xs dark:border-rose-900/50 dark:bg-rose-950/25"
                    >
                      <div className="flex items-center justify-between font-semibold text-[#1f1224] dark:text-rose-50">
                        <span>{dom.label}</span>
                        <span className="inline-flex items-center gap-0.5 text-amber-500">
                          {[1, 2, 3].map((i) => (
                            <Star key={i} className={`h-3 w-3 ${i <= stars ? 'fill-amber-500' : 'opacity-25'}`} />
                          ))}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[10px] text-rose-900/65 dark:text-rose-200/65">{dom.metricHint}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Promises, Arrivals, CalEvents */}
          {(summary.promisesResolved.length > 0 || summary.arrivalNotice || summary.calEventNotice) && (
            <div className="space-y-1.5 rounded-xl border border-emerald-300/80 bg-emerald-50/70 p-3 text-xs text-emerald-950 dark:border-emerald-800/60 dark:bg-emerald-950/35 dark:text-emerald-100">
              {summary.promisesResolved.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2 font-semibold">
                  <Award className="h-4 w-4 shrink-0" />
                  <span>
                    Promesse {p.status === 'KEPT' ? 'TENUE' : 'ROMPUE'} : {p.title}
                  </span>
                </div>
              ))}
              {summary.arrivalNotice && <div>• {summary.arrivalNotice}</div>}
              {summary.calEventNotice && <div>• {summary.calEventNotice}</div>}
            </div>
          )}

          {/* Manual Sub-Era / Macro-Era 4-Specializations Picker */}
          {(isMacroReady || isSubReady) && (
            <div className="rounded-xl border border-amber-400 bg-amber-50/85 p-3.5 dark:border-amber-600/70 dark:bg-amber-950/40">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-950 dark:text-amber-100">
                  <Crown className="h-4.5 w-4.5 text-amber-600 dark:text-amber-300" />
                  <span>
                    {isMacroReady
                      ? `Passage vers l’Ère ${pickerTargetEra}.a disponible — 4 Spécialisations à choisir`
                      : `Palier Sous-Ère ${pickerTargetEra}.${formatSubEraLetter(pickerTargetSubEra)} débloqué — 4 Spécialisations disponibles`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowEraPicker((v) => !v)}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500"
                  >
                    {showEraPicker ? 'Masquer' : 'Choisir parmi 4 Spécialisations'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setEraModalOpen(true);
                    }}
                    className="rounded-lg border border-amber-500/70 bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-amber-950 hover:bg-white dark:bg-slate-900 dark:text-amber-200"
                  >
                    Frise 8 Ères
                  </button>
                </div>
              </div>

              {showEraPicker && (
                <div className="mt-3 space-y-2.5 border-t border-amber-300/70 pt-3 dark:border-amber-700/60">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {stepSpecs.map((spec) => (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => setSelectedSpecId(spec.id)}
                        className={`rounded-lg border p-2.5 text-left text-xs transition ${
                          effectiveSpecId === spec.id
                            ? 'border-rose-500 bg-white ring-1 ring-rose-400/50 dark:bg-rose-950/60'
                            : 'border-amber-300/60 bg-white/60 hover:border-amber-400 dark:bg-black/20'
                        }`}
                      >
                        <div className={`text-[10px] font-bold ${ERA_BRANCHES[spec.branchId].accentClass}`}>
                          {ERA_BRANCHES[spec.branchId].shortLabel}
                        </div>
                        <div className="mt-0.5 font-bold text-[#1f1224] dark:text-rose-50">{spec.title}</div>
                        <div className="text-[11px] text-rose-900/75 dark:text-rose-200/80">{spec.tagline}</div>
                        <div className="mt-1 font-mono text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-300">
                          {spec.bonusSummary}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isSubReady && (
                      <button
                        type="button"
                        onClick={() => {
                          const [err] = handleApplySpecializationAdvance({
                            kind: 'SUB_ERA',
                            specializationId: effectiveSpecId,
                          });
                          if (!err) {
                            setShowEraPicker(false);
                            setToast({
                              id: Date.now(),
                              tone: 'success',
                              text: `Sous-Ère ${world.era}.${formatSubEraLetter(currentSubEra + 1)} activée.`,
                            });
                          }
                        }}
                        className="rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-500"
                      >
                        Activer Sous-Ère {world.era}.{formatSubEraLetter(currentSubEra + 1)}
                      </button>
                    )}
                    {isMacroReady && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const [err] = handleApplySpecializationAdvance({
                              kind: 'EVOLVE',
                              specializationId: effectiveSpecId,
                            });
                            if (!err) {
                              setShowEraPicker(false);
                              setToast({
                                id: Date.now(),
                                tone: 'success',
                                text: `Passage en Ère ${world.era + 1}.a validé.`,
                              });
                            }
                          }}
                          className="rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-500"
                        >
                          Évoluer → Ère {world.era + 1}.a
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const [err] = handleApplySpecializationAdvance({
                              kind: 'TRANSCEND',
                              specializationId: effectiveSpecId,
                            });
                            if (!err) {
                              setShowEraPicker(false);
                              setToast({
                                id: Date.now(),
                                tone: 'success',
                                text: `Transcendance Ère ${world.era + 1}.a (+10% Gloire) activée.`,
                              });
                            }
                          }}
                          className="rounded-xl border border-amber-500 bg-amber-500/20 px-3.5 py-2 text-xs font-bold text-amber-950 dark:text-amber-100"
                        >
                          Transcender (+10% Gloire cumulatif)
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* V5 P4: Grouped Turn Choices Digest & Free-Tier 6-Channel Gemini Cost Ledger */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="exo-surface-sub rounded-xl border p-3 text-xs exo-accent-border">
              <div className="font-mono text-[10.5px] font-bold uppercase exo-accent-text">
                Synthèse Groupée des Choix ({groupedDigest.totalDecisions} décision(s))
              </div>
              {groupedDigest.totalDecisions === 0 ? (
                <p className="mt-1.5 text-[11px] exo-muted-text">
                  Aucun dossier additionnel signé sur ce cycle — continuité administrative appliquée.
                </p>
              ) : (
                <div className="mt-2 space-y-1 text-[11px]">
                  <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                    {Object.entries(groupedDigest.byCategory).map(([cat, count]) => (
                      <span key={cat} className="exo-accent-chip px-1.5 py-0.5">
                        {cat}: {count}
                      </span>
                    ))}
                    {Object.entries(groupedDigest.byModel).map(([mod, count]) => (
                      <span key={mod} className="exo-accent-chip px-1.5 py-0.5">
                        {mod}: {count}
                      </span>
                    ))}
                  </div>
                  {groupedDigest.entries.slice(0, 3).map((e) => (
                    <div key={e.id} className="truncate exo-muted-text">
                      • [{e.dossierCode}] {e.optionLabel} ({e.paSpent} PA)
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="exo-surface-sub rounded-xl border p-3 text-xs exo-accent-border">
              <div className="flex items-center justify-between font-mono text-[10.5px] font-bold uppercase exo-accent-text">
                <span>Routeur Gemini 6 Canaux</span>
                <span className="text-emerald-500 dark:text-emerald-300">
                  Free Tier ({geminiLedger.billedUsd.toFixed(2)} $)
                </span>
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1 font-mono text-[10px] exo-muted-text">
                <span>Appels cumulés : {geminiLedger.totalCalls}</span>
                <span>Tokens : {geminiLedger.totalInputTokens + geminiLedger.totalOutputTokens}</span>
                <span>Texte : gemini-4-hydrogen</span>
                <span>Décision : gemini-decision-1</span>
                <span>Digest : gemini-3.1-flash-lite</span>
                <span>Média : Local SVG / WebM 3D</span>
              </div>
            </div>
          </div>

          {/* Transparent BFF Gemini 4T Pre-Generation Status */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200/80 bg-rose-50/70 px-3.5 py-2.5 text-xs dark:border-rose-900/60 dark:bg-rose-950/35">
            {loadingLive ? (
              <span className="inline-flex items-center gap-2 font-mono text-rose-800 dark:text-rose-200">
                <Loader2 className="h-4 w-4 animate-spin" />
                Pré-génération des événements du Tour {summary.cycleCompleted} (Cascade Gemini 4T)…
              </span>
            ) : liveStatus ? (
              <span className="inline-flex items-center gap-2 text-[#1f1224] dark:text-rose-100">
                {liveStatus.degraded ? (
                  <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                ) : (
                  <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                )}
                <span>
                  <strong>{liveStatus.modelUsed}</strong> ({liveStatus.tier}) —{' '}
                  {liveStatus.errorMessage ?? liveStatus.aiCopilotComment ?? 'Dossier live intégré au tour.'}
                </span>
              </span>
            ) : (
              <span className="font-mono text-rose-900/70 dark:text-rose-200/70">
                Catalogue Vivant (CV) synchronisé · Empreinte {summary.stateHash.slice(0, 10)}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-rose-200 px-4 py-3 dark:border-rose-900/60 sm:px-5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-rose-500"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Démarrer le Tour {summary.cycleCompleted}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
