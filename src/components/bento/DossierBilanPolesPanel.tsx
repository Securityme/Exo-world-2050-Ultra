import { Building2, Coins, Leaf, Users, Wrench } from 'lucide-react';
import type {
  ModuleExtCode,
  PartitionedEventBilan,
} from '../../systems/dossiers-pa/dossier-bilan-poles.ts';

/**
 * [L7] EXW.L7.DOSSIER_BILAN_POLES_PANEL | v5.1.0 | SADT A2.1
 * Renders the 4-pole partitioned event outcome summary with a 1-click building module action.
 */
interface DossierBilanPolesPanelProps {
  readonly bilan: PartitionedEventBilan;
  readonly moduleExt: ModuleExtCode;
  readonly onQuickBuildModule: (ext: ModuleExtCode) => void;
}

export function DossierBilanPolesPanel({
  bilan,
  moduleExt,
  onQuickBuildModule,
}: DossierBilanPolesPanelProps) {
  return (
    <div data-testid="dossier-bilan-poles" className="grid gap-2.5 sm:grid-cols-2">
      {/* Pôle 1 : Actions & Chantiers Bâtiments */}
      <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-2.5">
        <div className="mb-1.5 flex items-center justify-between gap-1 font-mono text-[10px] font-bold uppercase text-amber-900 dark:text-amber-300">
          <span className="inline-flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" />
            Pôle Actions &amp; Chantiers
          </span>
          <button
            type="button"
            data-testid="bilan-quick-build-btn"
            onClick={() => onQuickBuildModule(moduleExt === 'NONE' ? 'ENERGY_BOOST' : 'NONE')}
            className="inline-flex items-center gap-1 rounded border border-amber-500/50 bg-amber-500/20 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-950 hover:bg-amber-500/30 dark:text-amber-100"
          >
            <Wrench className="h-2.5 w-2.5" />
            {moduleExt === 'NONE' ? '+ Build Module' : 'Module inclus ✓'}
          </button>
        </div>
        <ul className="space-y-1 text-[11px] text-[#1f1224] dark:text-rose-100">
          {bilan.actionsPole.map((act) => (
            <li key={act} className="truncate font-medium" title={act}>
              • {act}
            </li>
          ))}
        </ul>
      </div>

      {/* Pôle 2 : Économie & Ressources */}
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/8 p-2.5">
        <div className="mb-1.5 flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-emerald-900 dark:text-emerald-300">
          <Coins className="h-3.5 w-3.5" />
          Pôle Économie &amp; Ressources
        </div>
        <div className="flex flex-wrap gap-1">
          {bilan.economyPole.length > 0 ? (
            bilan.economyPole.map((c) => (
              <span
                key={c.label}
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                  c.positive
                    ? 'bg-emerald-500/15 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200'
                    : 'bg-rose-500/15 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200'
                }`}
              >
                {c.label}
              </span>
            ))
          ) : (
            <span className="font-mono text-[10px] opacity-75">Flux ressources neutre</span>
          )}
        </div>
      </div>

      {/* Pôle 3 : Biosphère & État Cité */}
      <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/8 p-2.5">
        <div className="mb-1.5 flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-cyan-900 dark:text-cyan-300">
          <Leaf className="h-3.5 w-3.5" />
          Pôle Biosphère &amp; État Cité
        </div>
        <div className="flex flex-wrap gap-1">
          {bilan.biospherePole.length > 0 ? (
            bilan.biospherePole.map((c) => (
              <span
                key={c.label}
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                  c.positive
                    ? 'bg-emerald-500/15 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200'
                    : 'bg-rose-500/15 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200'
                }`}
              >
                {c.label}
              </span>
            ))
          ) : (
            <span className="font-mono text-[10px] opacity-75">Atmosphère &amp; état stables</span>
          )}
        </div>
      </div>

      {/* Pôle 4 : Humain, Politique & Équipe */}
      <div className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/8 p-2.5">
        <div className="mb-1.5 flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-fuchsia-900 dark:text-fuchsia-300">
          <Users className="h-3.5 w-3.5" />
          Pôle Humain, Politique &amp; Équipe
        </div>
        <div className="flex flex-wrap gap-1">
          {bilan.humanPoliticsPole.length > 0 ? (
            bilan.humanPoliticsPole.map((c) => (
              <span
                key={c.label}
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                  c.positive
                    ? 'bg-fuchsia-500/15 text-fuchsia-900 dark:bg-fuchsia-500/20 dark:text-fuchsia-200'
                    : 'bg-rose-500/15 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200'
                }`}
              >
                {c.label}
              </span>
            ))
          ) : (
            <span className="font-mono text-[10px] opacity-75">Équilibre politique maintenu</span>
          )}
        </div>
      </div>
    </div>
  );
}
