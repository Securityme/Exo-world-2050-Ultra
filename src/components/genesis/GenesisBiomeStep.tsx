import { Droplets, Mountain, Thermometer } from 'lucide-react';
import {
  PLANET_BIOME_PROFILES_CATALOG,
  type PlanetClimateId,
  type PlanetReliefId,
} from '../../data/world.catalog.ts';
import type { DraftCampaignConfig } from '../../stores/game.store.ts';
import { SuggestionBubbleField } from './SuggestionBubbleField.tsx';

interface GenesisBiomeStepProps {
  readonly draft: DraftCampaignConfig;
  readonly updateDraft: (patch: Partial<DraftCampaignConfig>) => void;
}

const RELIEF_OPTIONS: readonly { id: PlanetReliefId; label: string; desc: string }[] = [
  { id: 'DOUX', label: 'Doux', desc: 'Plaines larges et côtes calmes' },
  { id: 'EQUILIBRE', label: 'Équilibré', desc: 'Vallées et chaînes modérées' },
  { id: 'ESCARPE', label: 'Escarpé', desc: 'Fjords profonds et pics alpins' },
];

const CLIMATE_OPTIONS: readonly { id: PlanetClimateId; label: string }[] = [
  { id: 'TEMPERE', label: 'Tempéré' },
  { id: 'TROPICAL', label: 'Tropical' },
  { id: 'ARIDE', label: 'Aride' },
  { id: 'POLAIRE', label: 'Polaire' },
];

/**
 * [L7] Step 1 of 4-Step Campaign Genesis:
 * Vertical Parameter Cards for Planetary Biomes (8 archetypes w/ oceans),
 * Ocean Coverage slider, Relief & Climate, and Planet Name Suggestion Bubbles.
 */
export function GenesisBiomeStep({ draft, updateDraft }: GenesisBiomeStepProps) {
  return (
    <div className="space-y-4" data-testid="genesis-step-1">
      <section className="exo-bento-card space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-base font-bold text-[var(--exo-text)]">
            1.1 Choisir l&apos;archétype planétaire &amp; les biomes
          </h2>
          <span className="font-mono text-[11px] exo-muted-text">
            8 biomes dont mondes océaniques et archipels
          </span>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {PLANET_BIOME_PROFILES_CATALOG.map((biome) => {
            const selected = draft.biomeId === biome.id;
            return (
              <button
                key={biome.id}
                type="button"
                data-testid={`biome-card-${biome.id.toLowerCase()}`}
                onClick={() =>
                  updateDraft({
                    biomeId: biome.id,
                    oceanCoveragePct: biome.defaultOceanPct,
                    relief: biome.defaultRelief,
                    climate: biome.defaultClimate,
                  })
                }
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                  selected
                    ? 'border-[var(--exo-accent)] bg-[var(--exo-accent-soft)] ring-1 ring-[var(--exo-accent)]'
                    : 'exo-accent-border bg-[var(--exo-surface)] hover:border-[var(--exo-accent)]'
                }`}
              >
                {/* Mini SVG Planet Biome Vignette */}
                <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0 rounded-full border exo-accent-border bg-[#040814]">
                  <circle cx="32" cy="32" r="28" fill={biome.swatchOcean} />
                  <ellipse cx="26" cy="28" rx={Math.max(6, (100 - biome.defaultOceanPct) * 0.24)} ry={Math.max(5, (100 - biome.defaultOceanPct) * 0.16)} fill={biome.swatchLand} />
                  <ellipse cx="42" cy="39" rx={Math.max(4, (100 - biome.defaultOceanPct) * 0.16)} ry={Math.max(4, (100 - biome.defaultOceanPct) * 0.12)} fill={biome.swatchHighlight} opacity="0.85" />
                </svg>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-display text-sm font-bold text-[var(--exo-text)]">
                      {biome.name}
                    </span>
                    <span className="rounded bg-black/20 px-1.5 py-0.5 font-mono text-[10px] font-bold exo-accent-text">
                      {biome.defaultOceanPct}% Eau
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug exo-muted-text">
                    {biome.subtitle}
                  </p>
                  <div className="mt-1.5 font-mono text-[10px] font-semibold text-emerald-500 dark:text-emerald-300">
                    {biome.bonusSummary}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Vertical Parameter Card: Oceans, Relief & Climate */}
      <section className="exo-bento-card space-y-4 p-4 sm:p-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-[var(--exo-text)]">
              <Droplets className="h-4 w-4 exo-accent-text" />
              1.2 Couverture Océanique
            </span>
            <strong className="font-mono text-sm exo-accent-text">{draft.oceanCoveragePct} %</strong>
          </div>
          <input
            type="range"
            aria-label="Couverture océanique"
            data-testid="ocean-coverage-slider"
            min={0}
            max={92}
            step={2}
            value={draft.oceanCoveragePct}
            onChange={(e) => updateDraft({ oceanCoveragePct: Number(e.target.value) })}
            className="w-full accent-[var(--exo-accent)]"
          />
        </div>

        <div className="grid gap-3 border-t exo-accent-border pt-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-display text-xs font-bold uppercase text-[var(--exo-text)]">
              <Mountain className="h-3.5 w-3.5 exo-accent-2-text" />
              <span>1.3 Relief Géologique</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {RELIEF_OPTIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => updateDraft({ relief: r.id })}
                  title={r.desc}
                  className={`min-h-[36px] rounded-lg border px-2 font-mono text-[11px] font-bold transition ${
                    draft.relief === r.id ? 'exo-accent-btn' : 'exo-accent-chip'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-display text-xs font-bold uppercase text-[var(--exo-text)]">
              <Thermometer className="h-3.5 w-3.5 exo-accent-text" />
              <span>1.4 Régime Climatique</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {CLIMATE_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => updateDraft({ climate: c.id })}
                  className={`min-h-[36px] rounded-lg border px-2 font-mono text-[11px] font-bold transition ${
                    draft.climate === c.id ? 'exo-accent-btn' : 'exo-accent-chip'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vertical Parameter Card: Planet Name with Suggestion Bubbles */}
      <SuggestionBubbleField
        label="1.5 Nom de la Planète d'Origine"
        fieldKind="PLANET"
        value={draft.planetName}
        seed={draft.worldSeed}
        placeholder="Ex. Nouvelle-Aurore"
        testIdPrefix="genesis-planet-name"
        onChange={(planetName) => updateDraft({ planetName })}
      />
    </div>
  );
}
