import { Award, Infinity as InfinityIcon, Play, RotateCcw, Settings, ShieldAlert } from 'lucide-react';
import { useExoStore } from '../stores/game.store.ts';
import { formatAtmosphereStageName } from '../utils/atmosphere-labels.ts';

/**
 * [L7] Pause, Campaign Victory (with Infinite Sandbox Continuation), and Defeat modal.
 */
export function OutcomeModal() {
  const paused = useExoStore((s) => s.paused);
  const world = useExoStore((s) => s.world);
  const setPaused = useExoStore((s) => s.setPaused);
  const setScreen = useExoStore((s) => s.setScreen);
  const startNewCampaign = useExoStore((s) => s.startNewCampaign);
  const continueInfiniteSandbox = useExoStore((s) => s.continueInfiniteSandbox);

  if (world.victoryState === 'ACTIVE' && !paused) return null;

  const isVictory = world.victoryState === 'VICTORY';
  const isDefeat = world.victoryState === 'DEFEAT';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-rose-950/35 p-0 dark:bg-[#0d0611]/85 sm:items-center sm:p-4">
      <div className="exo-bento-card w-full max-w-md rounded-t-2xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center sm:rounded-2xl">
        {isVictory ? (
          <Award className="mx-auto h-11 w-11 text-emerald-600 dark:text-emerald-400" />
        ) : isDefeat ? (
          <ShieldAlert className="mx-auto h-11 w-11 text-rose-600 dark:text-rose-400" />
        ) : (
          <Play className="mx-auto h-10 w-10 text-rose-600 dark:text-rose-400" />
        )}

        <h2 className="mt-3 font-display text-2xl font-bold text-[#1f1224] dark:text-rose-50">
          {isVictory ? 'Victoire de Campagne' : isDefeat ? 'Destitution Fédérale' : 'Simulation en Pause'}
        </h2>

        <p className="mt-2 text-sm text-rose-950/80 dark:text-rose-100/80">
          {isVictory || isDefeat
            ? (world.victoryReason ?? 'Bilan de mandat archivé dans la chronique.')
            : `Cycle ${world.cycle} · Année ${world.year} · Ère ${world.era}/6 · ${formatAtmosphereStageName(world.atmosphereTier)}`}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-rose-200 bg-rose-50/75 p-3 font-mono text-xs dark:border-rose-900/60 dark:bg-rose-950/30">
          <div>
            <div className="text-[10px] text-rose-900/65 dark:text-rose-200/65">Étoiles</div>
            <div className="font-bold text-amber-700 dark:text-amber-300">{world.eraStars}★</div>
          </div>
          <div>
            <div className="text-[10px] text-rose-900/65 dark:text-rose-200/65">Secteurs</div>
            <div className="font-bold text-emerald-700 dark:text-emerald-300">{world.capturedTiles.length}/72</div>
          </div>
          <div>
            <div className="text-[10px] text-rose-900/65 dark:text-rose-200/65">Prestige</div>
            <div className="font-bold text-rose-700 dark:text-rose-300">{world.xp.civilization}</div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          {isVictory && (
            <button
              type="button"
              onClick={continueInfiniteSandbox}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-500"
            >
              <InfinityIcon className="h-4 w-4" />
              Continuer en Mode Infini
            </button>
          )}
          {!isVictory && !isDefeat && (
            <button
              type="button"
              onClick={() => setPaused(false)}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-500 px-4 text-sm font-bold text-white shadow-md hover:from-rose-500 hover:to-pink-400"
            >
              <Play className="h-4 w-4" />
              Reprendre la Simulation
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setPaused(false);
              setScreen('EXO_SETTINGS');
            }}
            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-medium text-[#1f1224] hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
          >
            <Settings className="h-4 w-4 text-rose-600 dark:text-rose-300" />
            Paramètres &amp; Mode d&apos;Affichage
          </button>
          <button
            type="button"
            onClick={startNewCampaign}
            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-medium text-[#1f1224] hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
          >
            <RotateCcw className="h-4 w-4 text-rose-600 dark:text-rose-300" />
            Nouvelle Campagne
          </button>
          <button
            type="button"
            onClick={() => {
              setPaused(false);
              setScreen('EXO_MAIN_MENU');
            }}
            className="min-h-[44px] w-full rounded-xl text-xs font-medium text-rose-900/75 hover:text-rose-950 dark:text-rose-200/75 dark:hover:text-rose-50"
          >
            Retour au Menu Principal
          </button>
        </div>
      </div>
    </div>
  );
}
