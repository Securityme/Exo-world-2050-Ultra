import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Dices,
  Play,
} from 'lucide-react';
import { GenesisBiomeStep } from '../components/genesis/GenesisBiomeStep.tsx';
import { GenesisColonyLaunchStep } from '../components/genesis/GenesisColonyLaunchStep.tsx';
import { GenesisGovernanceStep } from '../components/genesis/GenesisGovernanceStep.tsx';
import { PlanetLivePreview } from '../components/genesis/PlanetLivePreview.tsx';
import { ART_MANIFEST } from '../data/art-manifest.data.ts';
import { useExoStore } from '../stores/game.store.ts';

type GenesisStepId = 1 | 2 | 3 | 4;

const GENESIS_STEPS: readonly { readonly id: GenesisStepId; readonly label: string }[] = [
  { id: 1, label: '1. Planète & Biomes' },
  { id: 2, label: '2. Gouvernance' },
  { id: 3, label: '3. Site & Cité' },
  { id: 4, label: '4. Équilibre & Lancement' },
];

/**
 * [L7] EXW.L7.NEW_SIMULATION | v5.1.0 | SADT A5.1
 * 4-Step Sequential Campaign Genesis with:
 * - Top "Génération aléatoire complète" button
 * - Vertical parameter cards inside each step
 * - Sticky real-time PlanetLivePreview SVG globe & biome composition bar
 * - Combinatorial Suggestion Bubbles for Planet, Leader, Capital & Fleet names
 */
export function NewSimulationScreen() {
  const [step, setStep] = useState<GenesisStepId>(1);
  const draft = useExoStore((s) => s.draftConfig);
  const updateDraft = useExoStore((s) => s.updateDraftConfig);
  const randomizeDraft = useExoStore((s) => s.randomizeDraftCampaign);
  const startNewCampaign = useExoStore((s) => s.startNewCampaign);
  const setScreen = useExoStore((s) => s.setScreen);

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-[var(--exo-void)] px-4 py-5 sm:px-8 sm:py-7">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Top Banner + Full Randomize Action */}
        <div className="exo-bento-card relative overflow-hidden rounded-2xl">
          <img
            src={ART_MANIFEST.menuBackground}
            alt="Panorama Exo World 2050"
            className="h-36 w-full object-cover sm:h-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050811]/95 via-[#050811]/78 to-[#050811]/35" />
          <div className="absolute inset-0 flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="max-w-xl">
              <button
                type="button"
                onClick={() => setScreen('EXO_MAIN_MENU')}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/25 bg-black/50 px-3 font-mono text-[11px] font-semibold text-cyan-100 hover:bg-black/75"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Menu principal</span>
              </button>
              <h1 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
                Genèse de Campagne · 2050
              </h1>
              <p className="mt-1 text-xs text-cyan-100/85 sm:text-sm">
                Façonnez votre exoplanète, ses océans, son régime politique et son identité en 4 étapes guidées.
              </p>
            </div>

            <button
              type="button"
              data-testid="genesis-randomize-all-btn"
              onClick={randomizeDraft}
              className="exo-accent-btn inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 font-mono text-xs font-bold shadow-lg"
            >
              <Dices className="h-4 w-4" />
              <span>Génération aléatoire complète</span>
            </button>
          </div>
        </div>

        {/* 4-Step Stepper Rail */}
        <nav
          aria-label="Étapes de configuration de partie"
          className="exo-bento-card grid grid-cols-2 gap-2 p-2 sm:grid-cols-4"
        >
          {GENESIS_STEPS.map((st) => {
            const active = step === st.id;
            const done = step > st.id;
            return (
              <button
                key={st.id}
                type="button"
                data-testid={`genesis-step-tab-${st.id}`}
                onClick={() => setStep(st.id)}
                className={`inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl px-3 font-mono text-xs font-bold transition ${
                  active
                    ? 'exo-accent-btn'
                    : done
                      ? 'border border-emerald-400/60 bg-emerald-500/12 text-emerald-500 dark:text-emerald-300'
                      : 'exo-accent-chip'
                }`}
              >
                {done && <Check className="h-3.5 w-3.5" />}
                <span>{st.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Main 2-Column Workspace: Vertical Parameter Cards + Sticky PlanetLivePreview */}
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            {step === 1 && <GenesisBiomeStep draft={draft} updateDraft={updateDraft} />}
            {step === 2 && <GenesisGovernanceStep draft={draft} updateDraft={updateDraft} />}
            {(step === 3 || step === 4) && (
              <GenesisColonyLaunchStep step={step} draft={draft} updateDraft={updateDraft} />
            )}

            {/* Step Navigation Bar */}
            <div className="exo-bento-card flex flex-wrap items-center justify-between gap-2 p-3.5">
              <button
                type="button"
                disabled={step === 1}
                onClick={() => setStep((s) => (s > 1 ? ((s - 1) as GenesisStepId) : s))}
                className="exo-accent-chip inline-flex min-h-[42px] items-center gap-1.5 px-4 font-mono text-xs font-bold disabled:opacity-40"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Étape précédente</span>
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  data-testid="genesis-next-step-btn"
                  onClick={() => setStep((s) => (s < 4 ? ((s + 1) as GenesisStepId) : s))}
                  className="exo-accent-btn inline-flex min-h-[42px] items-center gap-1.5 px-4 font-mono text-xs font-bold"
                >
                  <span>Étape suivante</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="config-launch-campaign-btn"
                  onClick={startNewCampaign}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-500 px-5 font-display text-sm font-bold text-slate-950 shadow-md hover:bg-emerald-400"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Lancer la campagne</span>
                </button>
              )}
            </div>
          </div>

          <aside className="space-y-3 lg:col-span-4">
            <div className="sticky top-5 space-y-3">
              <PlanetLivePreview
                biomeId={draft.biomeId}
                oceanCoveragePct={draft.oceanCoveragePct}
                relief={draft.relief}
                climate={draft.climate}
                worldSeed={draft.worldSeed}
                planetName={draft.planetName}
                capitalName={draft.capitalName}
                leaderName={draft.leaderName}
                fleetName={draft.fleetName}
              />

              <div className="exo-bento-card space-y-2 p-4">
                <button
                  type="button"
                  onClick={startNewCampaign}
                  className="exo-accent-btn inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl px-4 font-display text-sm font-bold"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Démarrer immédiatement</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScreen('EXO_BRIEFING_LOBBY')}
                  className="exo-accent-chip inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl px-4 font-mono text-xs font-semibold"
                >
                  <Compass className="h-3.5 w-3.5 exo-accent-text" />
                  <span>Briefing diplomatique</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
