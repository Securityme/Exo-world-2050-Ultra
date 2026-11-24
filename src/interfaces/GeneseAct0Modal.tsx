import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Compass,
  FastForward,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { getColonistPortrait, getEraBanner } from '../data/art-manifest.data.ts';
import { AI_PERSONALITIES_CATALOG, GENESE_ACT0_CHOICES, resolveSuperpowerV4 } from '../data/v4-catalog.data.ts';
import { handleCompleteGeneseAct0 } from '../pipelines/game-actions.pipeline.ts';
import { useExoStore } from '../stores/game.store.ts';
import { formatSpecialtyLabel } from '../systems/economy-urban/workforce-assignments.ts';
import { formatAtmosphereStageName } from '../utils/atmosphere-labels.ts';

/**
 * [L7] EXW.L7.GENESE_ACT0 | v4.1.0 | <= 200 lines (R-14)
 * 2-Step Anno/Idle Startup Sequence (Briefing Opérationnel + Charte Fondatrice).
 */
export function GeneseAct0Modal() {
  const world = useExoStore((s) => s.world);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedId, setSelectedId] = useState<string>(GENESE_ACT0_CHOICES[0]!.id);

  if (!world.genese || world.genese.act0Completed) return null;

  const sp = resolveSuperpowerV4(world.superpowerId);
  const aiSpec =
    AI_PERSONALITIES_CATALOG.find((p) => p.id === world.aiPersona?.personality) ??
    AI_PERSONALITIES_CATALOG[0]!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6">
      <div
        role="dialog"
        aria-label="Protocole Genèse 2050 — Séquence de Démarrage"
        className="exo-bento-card exo-astral-ticks flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden"
      >
        <div className="relative h-32 w-full shrink-0 overflow-hidden sm:h-40">
          <img src={getEraBanner(1)} alt="Protocole Genèse 2050" className="h-full w-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, var(--exo-surface) 4%, color-mix(in srgb, var(--exo-void) 65%, transparent) 55%, transparent 100%)',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-4 sm:p-5">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-md border exo-accent-border bg-[var(--exo-surface)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider exo-accent-text">
                <Sparkles className="h-3 w-3 exo-accent-2-text" />
                Protocole Genèse 2050 · Étape {step}/2
              </div>
              <h2 className="mt-1 font-display text-lg font-bold text-white drop-shadow sm:text-2xl">
                {step === 1 ? `Déploiement Initial — ${sp.name}` : `Charte Fondatrice — ${sp.name}`}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => handleCompleteGeneseAct0(selectedId, true)}
              className="exo-accent-chip inline-flex min-h-[36px] items-center gap-1.5 px-3 font-mono text-[11px] font-semibold"
            >
              <FastForward className="h-3.5 w-3.5 exo-accent-2-text" />
              <span>Passer (Mode Expert)</span>
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {step === 1 ? (
            <>
              <div className="exo-surface-sub flex items-start gap-3 rounded-xl p-3.5 text-xs">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border exo-accent-border bg-[var(--exo-accent-soft)] exo-accent-text">
                  <Bot className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[10.5px] font-bold exo-accent-text">
                    <span>{aiSpec.voicePrefix} {world.aiPersona?.name ?? 'AURA-2050'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatAtmosphereStageName(world.atmosphereTier)}</span>
                    <span aria-hidden="true">·</span>
                    <span>Tour 1 ({world.year})</span>
                  </div>
                  <p className="mt-1 leading-relaxed text-[var(--exo-text)] opacity-90">
                    Contact établi sur <strong>Novaterra-1</strong>. Votre périmètre à ciel ouvert est prêt : <strong>{world.districts.length} quartiers</strong> actifs, <strong>{world.activeDossiers.length} dossiers</strong> prioritaires et votre premier équipage de 4 spécialistes attendent vos ordres.
                  </p>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {world.colonists.slice(0, 4).map((col) => (
                  <div key={col.id} className="exo-surface-sub flex items-center gap-2.5 rounded-xl p-2.5 text-xs">
                    <img
                      src={getColonistPortrait(col.id, col.specialty)}
                      alt={col.name}
                      className="h-11 w-11 shrink-0 rounded-lg border exo-accent-border object-cover"
                    />
                    <div className="min-w-0">
                      <div className="truncate font-display font-bold text-[var(--exo-text)]">{col.name}</div>
                      <div className="truncate font-mono text-[10px] exo-accent-text">
                        {formatSpecialtyLabel(col.specialty)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3 text-xs">
                {[
                  ['1. Explorer la cité 3D', 'Basculez entre Espace, Planète et Ville pour inspecter vos quartiers et cliquer sur les repères.'],
                  ['2. Traiter vos événements', 'Ouvrez l’onglet Événements : choisissez une option principale puis affinez sa modalité (sous-choix).'],
                  ['3. Valider la Fin de tour', 'Appuyez sur « Fin de tour → » pour récolter vos flux, faire progresser l’atmosphère et passer au cycle suivant.'],
                ].map(([title, desc]) => (
                  <div key={title} className="exo-surface-sub rounded-xl p-3">
                    <div className="font-display font-bold exo-accent-text">{title}</div>
                    <p className="mt-1 leading-relaxed exo-muted-text">{desc}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-xs leading-relaxed exo-muted-text">
                Choisissez l’orientation fondatrice de votre colonie. Elle octroie un bonus immédiat et fixe votre premier cap d’engagement sur 6 tours.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {GENESE_ACT0_CHOICES.map((choice) => {
                  const active = choice.id === selectedId;
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => setSelectedId(choice.id)}
                      className={`flex flex-col justify-between p-3.5 text-left transition ${
                        active ? 'exo-accent-chip-active ring-1 ring-[var(--exo-accent)]' : 'exo-accent-chip'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-[10px] font-bold exo-accent-text">
                            Orientation · {choice.doctrineTag}
                          </span>
                          {active && <CheckCircle2 className="h-4 w-4 exo-accent-text" />}
                        </div>
                        <h3 className="mt-1.5 font-display text-sm font-bold text-[var(--exo-text)]">
                          {choice.title}
                        </h3>
                        <p className="mt-1 text-[11.5px] leading-relaxed exo-muted-text">
                          {choice.subtitle}
                        </p>
                      </div>
                      <div className="mt-3 space-y-1.5 border-t exo-accent-border pt-2.5 text-[11px]">
                        <div className="font-mono font-semibold text-emerald-600 dark:text-emerald-300">
                          {choice.immediateSummary}
                        </div>
                        <div className="flex items-start gap-1 exo-accent-2-text">
                          <Compass className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span><strong>Cap :</strong> {choice.promiseDescription}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t exo-accent-border px-4 py-3 sm:px-5">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="exo-accent-chip inline-flex min-h-[42px] items-center gap-1.5 px-4 text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour</span>
            </button>
          ) : (
            <span className="text-xs exo-muted-text">Bienvenue sur Novaterra-1 · Prise en main rapide</span>
          )}

          {step === 1 ? (
            <button
              type="button"
              data-testid="genese-next-step-btn"
              onClick={() => setStep(2)}
              className="exo-accent-btn inline-flex min-h-[44px] items-center gap-2 px-5 text-xs font-bold transition"
            >
              <span>Choisir la Charte Fondatrice</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              data-testid="ratify-act0-btn"
              onClick={() => handleCompleteGeneseAct0(selectedId, false)}
              className="exo-accent-btn inline-flex min-h-[44px] items-center gap-2 px-5 text-xs font-bold transition"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Ratifier et démarrer</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
