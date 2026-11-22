import { Star } from 'lucide-react';
import { getEraBanner } from '../../data/art-manifest.data.ts';
import { HK_STAR_DOMAINS } from '../../data/v4-catalog.data.ts';
import { useExoStore } from '../../stores/game.store.ts';
import {
  formatAtmosphereStageName,
  formatSeasonLabel,
  formatWeatherLabel,
} from '../../utils/atmosphere-labels.ts';

interface WorldBiospherePanelProps {
  readonly subView: 'CLIMATE' | 'SPECTRA_HK';
}

/**
 * [L7] EXW.L7.WORLD_BIOSPHERE_PANEL | v4.1.0 | <= 200 lines (R-14)
 * Level-2 views under Monde -> Climat & Biosphère using named atmospheric stages.
 */
export function WorldBiospherePanel({ subView }: WorldBiospherePanelProps) {
  const world = useExoStore((s) => s.world);
  const stageName = formatAtmosphereStageName(world.atmosphereTier);
  const terra = world.terra ?? {
    atmo: world.atmosphereProgress,
    hydro: 22,
    bio: 16,
    radShield: 28,
    compositeScore: world.atmosphereProgress,
  };

  return (
    <div className="space-y-4">
      <div className="exo-bento-card relative overflow-hidden rounded-2xl">
        <img src={getEraBanner(world.era)} alt={`Ère ${world.era}`} className="h-32 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#160a1e]/90 via-[#160a1e]/60 to-transparent" />
        <div className="absolute inset-0 flex flex-wrap items-center justify-between gap-2 p-4 text-white">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase text-amber-300">
              {stageName} · {formatSeasonLabel(world.season)} · {formatWeatherLabel(world.weatherState)}
            </div>
            <div className="font-display text-lg font-bold">
              Score Terraformation : {terra.compositeScore}%
            </div>
          </div>
          <div className="text-right font-mono text-xs">
            <div>Kits O₂ : {world.atmosphereTier === 'P4' ? 'Gratuits (Air Pur)' : `${world.resources.breathingKits} unités`}</div>
            <div>Approbation : {world.approval}% · Cycles stables : {world.biomeStabilityCycles}</div>
          </div>
        </div>
      </div>

      {subView === 'CLIMATE' ? (
        <div className="exo-bento-card space-y-3 p-4 text-xs">
          <div className="font-display text-sm font-bold text-[var(--exo-text)]">
            4 Piliers de Terraformation (Vers Atmosphère Éden)
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ['Atmosphère (35%)', terra.atmo, 'bg-[var(--exo-accent)]'],
              ['Hydrosphère (30%)', terra.hydro, 'bg-teal-500'],
              ['Biosphère (25%)', terra.bio, 'bg-emerald-500'],
              ['Bouclier Radiatif (10%)', terra.radShield, 'bg-amber-500'],
            ].map(([label, val, barClass]) => (
              <div key={String(label)} className="exo-surface-sub rounded-xl p-3">
                <div className="flex justify-between font-mono text-[11px]">
                  <span>{label}</span>
                  <strong>{Math.round(Number(val))}%</strong>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-black/20 dark:bg-white/10">
                  <div
                    className={`h-2 rounded-full ${barClass}`}
                    style={{ width: `${Math.min(100, Math.max(0, Number(val)))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="exo-bento-card space-y-2.5 p-4 text-xs">
            <div className="font-display text-sm font-bold text-[var(--exo-text)]">
              4 Spectres Civiques (-100 à +100)
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ['Industrie', 'Écologie', world.spectra?.ecologyVsIndustry ?? 10],
                ['Souverain', 'Fédéral', world.spectra?.federalVsSovereign ?? 0],
                ['Contrôle Cyber', 'Science Ouverte', world.spectra?.openScienceVsCyberControl ?? 5],
                ['Efficacité', 'Bien-Être', world.spectra?.civicWelfareVsEfficiency ?? 10],
              ].map(([left, right, val]) => (
                <div key={String(left)} className="exo-surface-sub rounded-xl p-3">
                  <div className="flex justify-between font-mono text-[10.5px]">
                    <span>{left}</span>
                    <strong>{Number(val) >= 0 ? `+${val}` : val}</strong>
                    <span>{right}</span>
                  </div>
                  <div className="relative mt-1.5 h-2 rounded-full bg-black/20 dark:bg-white/10">
                    <div
                      className="absolute top-0 h-2 w-3 -translate-x-1/2 rounded-full bg-[var(--exo-accent)]"
                      style={{ left: `${((Number(val) + 100) / 200) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {world.hk && (
            <div className="exo-bento-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-[var(--exo-text)]">
                  Étoiles d’Ère Humankind ({world.eraStars} / 7)
                </h3>
                <span className="font-mono text-xs font-bold exo-accent-2-text">
                  Renommée totale : {world.hk.fame}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {HK_STAR_DOMAINS.map((dom) => {
                  const s = world.hk!.starsByDomain[dom.id];
                  return (
                    <div key={dom.id} className="exo-surface-sub rounded-xl p-2.5 text-xs">
                      <div className="flex items-center justify-between font-bold">
                        <span>{dom.label}</span>
                        <span className="inline-flex gap-0.5 text-amber-500">
                          {[1, 2, 3].map((i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i <= s ? 'fill-amber-500' : 'opacity-25'}`} />
                          ))}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[10.5px] exo-muted-text">{dom.metricHint}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
