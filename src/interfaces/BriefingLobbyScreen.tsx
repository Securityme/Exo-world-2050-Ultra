import { ArrowLeft, Rocket } from 'lucide-react';
import { SUPERPOWERS_CATALOG } from '../data/world.catalog.ts';
import { useExoStore } from '../stores/game.store.ts';

/**
 * [L7] Solo Briefing Lobby before entering the simulation.
 */
export function BriefingLobbyScreen() {
  const draft = useExoStore((s) => s.draftConfig);
  const setScreen = useExoStore((s) => s.setScreen);
  const startNewCampaign = useExoStore((s) => s.startNewCampaign);

  const chosen = SUPERPOWERS_CATALOG.find((s) => s.id === draft.superpowerId) ?? SUPERPOWERS_CATALOG[0]!;
  const rivals = SUPERPOWERS_CATALOG.filter((s) => s.id !== chosen.id);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-rose-950/35 p-0 dark:bg-[#0d0611]/85 sm:items-center sm:p-4">
      <div className="exo-bento-card max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-t-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-2xl sm:p-6">
        <div className="flex items-center justify-between gap-2 border-b border-rose-200 pb-4 dark:border-rose-900/60">
          <div>
            <div className="font-mono text-xs font-semibold text-rose-700 dark:text-rose-300">
              BRIEFING EXÉCUTIF · GRAINE #{draft.worldSeed}
            </div>
            <h1 className="mt-0.5 font-display text-xl font-bold text-[#1f1224] dark:text-rose-50 sm:text-2xl">
              {chosen.name}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setScreen('EXO_NEW_SIMULATION')}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-rose-200 bg-white/85 px-3 text-xs font-medium text-rose-900 hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Modifier
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-rose-200 bg-white/85 p-4 text-xs text-rose-950/85 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-100/85">
            <h2 className="font-display text-sm font-bold text-emerald-700 dark:text-emerald-300">
              Objectifs de Campagne (6 Ères)
            </h2>
            <ul className="mt-2 space-y-1.5 leading-relaxed">
              <li>• Déployer des cités à ciel ouvert et greffer jusqu’à 3 extensions par quartier.</li>
              <li>• Porter l’atmosphère d’Atmosphère Hostile (Air Toxique) à Atmosphère Éden (Air Pur).</li>
              <li>• Débloquer jusqu’à 6 mondes orbitaux et gravir le rang de la Super-Alliance.</li>
              <li>• Victoire : 24 Étoiles d’Ère ou 28 secteurs géodésiques, puis poursuite en Mode Infini.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-rose-200 bg-white/85 p-4 text-xs text-rose-950/85 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-100/85">
            <h2 className="font-display text-sm font-bold text-rose-700 dark:text-rose-300">
              5 Puissances Rivales Autonomes
            </h2>
            <ul className="mt-2 space-y-1.5">
              {rivals.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between border-b border-rose-200/70 pb-1 dark:border-rose-900/50"
                >
                  <span className="font-medium text-[#1f1224] dark:text-rose-50">{r.name}</span>
                  <span className="font-mono text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                    {r.code}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={startNewCampaign}
            className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-500 px-6 font-display text-sm font-bold uppercase tracking-wider text-white shadow-lg hover:from-rose-500 hover:to-pink-400 sm:w-auto"
          >
            <Rocket className="h-4 w-4" />
            Déployer sur Exo-Monde 2050
          </button>
        </div>
      </div>
    </div>
  );
}
