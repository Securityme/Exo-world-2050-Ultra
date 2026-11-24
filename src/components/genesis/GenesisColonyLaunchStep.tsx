import { useState } from 'react';
import {
  Anchor,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  Handshake,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  COLONY_SPECIALIZATIONS_CATALOG,
  DIFFICULTY_PRESETS_CATALOG,
  LANDING_SITES_CATALOG,
  RESOURCE_ABUNDANCE_CATALOG,
} from '../../data/campaign-genesis.catalog.ts';
import type { DraftCampaignConfig } from '../../stores/game.store.ts';
import { SuggestionBubbleField } from './SuggestionBubbleField.tsx';

interface GenesisColonyStepProps {
  readonly step: 3 | 4;
  readonly draft: DraftCampaignConfig;
  readonly updateDraft: (patch: Partial<DraftCampaignConfig>) => void;
}

const EXTENSION_OPTIONS = [
  { id: 'GENESE_2050', label: 'Protocole Genèse 2050', desc: 'Introduction guidée & charte fondatrice' },
  { id: 'HK_STARS', label: 'Étoiles & Gloire', desc: 'Progression en 6 ères et doctrines évolutives' },
  { id: 'FP_WORKFORCE', label: 'Colons RPG', desc: 'Spécialistes, moral et équipement évolutif' },
  { id: 'GEMINI_4T', label: 'Événements dynamiques', desc: 'Dépêches adaptées au contexte de votre colonie' },
] as const;

const TENSION_OPTIONS: readonly {
  id: DraftCampaignConfig['initialDiplomaticTension'];
  label: string;
  desc: string;
}[] = [
  { id: 'DETENDUE', label: 'Détendue (+14 rel.)', desc: 'Climat coopératif initial favorable aux traités' },
  { id: 'EQUILIBREE', label: 'Équilibrée (0 rel.)', desc: 'Rivalité diplomatique réaliste 2050' },
  { id: 'TENDUE', label: 'Tendue (-18 rel.)', desc: 'Embargos précoces et compétition frontalière' },
];

/**
 * [L7] Steps 3 & 4 of 4-Step Campaign Genesis:
 * - Step 3: Landing Site, Starting Specialization, Capital & Fleet Name Suggestion Bubbles
 * - Step 4: Difficulty, Resources, Diplomatic Tension, Rivals count, Mode & Collapsible Advanced Drawer
 */
export function GenesisColonyLaunchStep({ step, draft, updateDraft }: GenesisColonyStepProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const toggleExtension = (id: string) => {
    const exists = draft.enabledExtensions.includes(id);
    updateDraft({
      enabledExtensions: exists
        ? draft.enabledExtensions.filter((e) => e !== id)
        : [...draft.enabledExtensions, id],
    });
  };

  if (step === 3) {
    return (
      <div className="space-y-4" data-testid="genesis-step-3">
        <section className="exo-bento-card space-y-3 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Anchor className="h-4 w-4 exo-accent-text" />
            <h2 className="font-display text-base font-bold text-[var(--exo-text)]">
              3.1 Site d&apos;Atterrissage Initial
            </h2>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {LANDING_SITES_CATALOG.map((site) => {
              const selected = draft.landingSiteId === site.id;
              return (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => updateDraft({ landingSiteId: site.id })}
                  className={`rounded-xl border p-3 text-left transition ${
                    selected
                      ? 'border-[var(--exo-accent)] bg-[var(--exo-accent-soft)] ring-1 ring-[var(--exo-accent)]'
                      : 'exo-accent-border bg-[var(--exo-surface)] hover:border-[var(--exo-accent)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-bold text-[var(--exo-text)]">
                      {site.name}
                    </span>
                    <span className="font-mono text-[10px] font-bold exo-accent-text">
                      Secteur #{site.tileIndex}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] exo-muted-text">{site.subtitle}</p>
                  <div className="mt-1.5 font-mono text-[10px] font-semibold text-emerald-500 dark:text-emerald-300">
                    {site.bonusSummary}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="exo-bento-card space-y-3 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 exo-accent-2-text" />
            <h2 className="font-display text-base font-bold text-[var(--exo-text)]">
              3.2 Spécialisation de Départ
            </h2>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {COLONY_SPECIALIZATIONS_CATALOG.map((spec) => {
              const selected = draft.startingSpecializationId === spec.id;
              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => updateDraft({ startingSpecializationId: spec.id })}
                  className={`rounded-xl border p-3 text-left transition ${
                    selected
                      ? 'border-[var(--exo-accent)] bg-[var(--exo-accent-soft)] ring-1 ring-[var(--exo-accent)]'
                      : 'exo-accent-border bg-[var(--exo-surface)] hover:border-[var(--exo-accent)]'
                  }`}
                >
                  <div className="font-display text-sm font-bold text-[var(--exo-text)]">
                    {spec.name}
                  </div>
                  <p className="mt-1 text-[11px] exo-muted-text">{spec.subtitle}</p>
                  <div className="mt-1.5 font-mono text-[10px] font-semibold text-emerald-500 dark:text-emerald-300">
                    {spec.bonusSummary}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <SuggestionBubbleField
          label="3.3 Nom de la Capitale"
          fieldKind="CAPITAL"
          value={draft.capitalName}
          seed={draft.worldSeed}
          placeholder="Ex. Port-Lumière"
          testIdPrefix="genesis-capital-name"
          onChange={(capitalName) => updateDraft({ capitalName })}
        />

        <SuggestionBubbleField
          label="3.4 Nom de la Flotte d'Expédition"
          fieldKind="FLEET"
          value={draft.fleetName}
          seed={draft.worldSeed}
          placeholder="Ex. Armada Aurore"
          testIdPrefix="genesis-fleet-name"
          onChange={(fleetName) => updateDraft({ fleetName })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="genesis-step-4">
      <section className="exo-bento-card space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 exo-accent-text" />
          <h2 className="font-display text-base font-bold text-[var(--exo-text)]">
            4.1 Difficulté &amp; Abondance des Ressources
          </h2>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-3">
          {DIFFICULTY_PRESETS_CATALOG.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => updateDraft({ difficultyPreset: d.id })}
              className={`rounded-xl border p-3 text-left transition ${
                draft.difficultyPreset === d.id
                  ? 'border-[var(--exo-accent)] bg-[var(--exo-accent-soft)] ring-1 ring-[var(--exo-accent)]'
                  : 'exo-accent-border bg-[var(--exo-surface)]'
              }`}
            >
              <div className="font-display text-sm font-bold text-[var(--exo-text)]">{d.label}</div>
              <p className="mt-1 text-[11px] exo-muted-text">{d.summary}</p>
            </button>
          ))}
        </div>

        <div className="grid gap-2.5 border-t exo-accent-border pt-3 sm:grid-cols-3">
          {RESOURCE_ABUNDANCE_CATALOG.map((ab) => (
            <button
              key={ab.id}
              type="button"
              onClick={() => updateDraft({ resourceAbundance: ab.id })}
              className={`rounded-xl border p-3 text-left transition ${
                draft.resourceAbundance === ab.id
                  ? 'border-[var(--exo-accent)] bg-[var(--exo-accent-soft)] ring-1 ring-[var(--exo-accent)]'
                  : 'exo-accent-border bg-[var(--exo-surface)]'
              }`}
            >
              <div className="font-display text-sm font-bold text-[var(--exo-text)]">{ab.label}</div>
              <p className="mt-1 text-[11px] exo-muted-text">{ab.summary}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="exo-bento-card space-y-4 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 font-display text-base font-bold text-[var(--exo-text)]">
            <Handshake className="h-4 w-4 exo-accent-2-text" />
            4.2 Rivaux IA &amp; Tension Diplomatique Initiale
          </span>
          <strong className="font-mono text-sm exo-accent-text">{draft.rivalCount} Superpuissances IA</strong>
        </div>

        <input
          type="range"
          aria-label="Nombre de superpuissances rivales"
          min={1}
          max={5}
          step={1}
          value={draft.rivalCount}
          onChange={(e) => updateDraft({ rivalCount: Number(e.target.value) })}
          className="w-full accent-[var(--exo-accent)]"
        />

        <div className="grid gap-2.5 sm:grid-cols-3">
          {TENSION_OPTIONS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => updateDraft({ initialDiplomaticTension: t.id })}
              className={`rounded-xl border p-3 text-left transition ${
                draft.initialDiplomaticTension === t.id
                  ? 'border-[var(--exo-accent)] bg-[var(--exo-accent-soft)] ring-1 ring-[var(--exo-accent)]'
                  : 'exo-accent-border bg-[var(--exo-surface)]'
              }`}
            >
              <div className="font-display text-xs font-bold text-[var(--exo-text)]">{t.label}</div>
              <p className="mt-1 text-[10.5px] exo-muted-text">{t.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Collapsible Advanced Options Drawer */}
      <section className="exo-bento-card p-4 sm:p-5">
        <button
          type="button"
          data-testid="genesis-advanced-drawer-btn"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="inline-flex items-center gap-2 font-display text-sm font-bold text-[var(--exo-text)]">
            <SlidersHorizontal className="h-4 w-4 exo-accent-text" />
            4.3 Paramètres Avancés, Extensions &amp; Graine Déterministe
          </span>
          {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {advancedOpen && (
          <div className="mt-4 space-y-3 border-t exo-accent-border pt-3">
            <div className="flex flex-wrap gap-2">
              {(['CAMPAIGN', 'INFINITE_SANDBOX'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => updateDraft({ mode: m })}
                  className={`min-h-[38px] rounded-xl border px-3 font-mono text-xs font-bold ${
                    draft.mode === m ? 'exo-accent-btn' : 'exo-accent-chip'
                  }`}
                >
                  {m === 'CAMPAIGN' ? 'Campagne Officielle (6 Ères)' : 'Mode Bac à Sable Infini'}
                </button>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {EXTENSION_OPTIONS.map((ext) => {
                const on = draft.enabledExtensions.includes(ext.id);
                return (
                  <button
                    key={ext.id}
                    type="button"
                    onClick={() => toggleExtension(ext.id)}
                    className={`flex items-start gap-2 rounded-xl border p-2.5 text-left text-xs ${
                      on ? 'border-emerald-400 bg-emerald-500/12' : 'exo-accent-border opacity-75'
                    }`}
                  >
                    <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${on ? 'text-emerald-400' : 'opacity-20'}`} />
                    <div>
                      <div className="font-bold">{ext.label}</div>
                      <div className="text-[10.5px] exo-muted-text">{ext.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={!draft.skipGeneseAct0}
                  onChange={(e) => updateDraft({ skipGeneseAct0: !e.target.checked })}
                  className="h-4 w-4 accent-[var(--exo-accent)]"
                />
                <span>Inclure l&apos;introduction narrative Acte 0</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="rounded-lg border exo-accent-border px-2.5 py-1 font-mono text-xs">
                  Graine : <strong>{draft.worldSeed}</strong>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateDraft({ worldSeed: Math.floor(10_000_000 + Math.random() * 89_000_000) })
                  }
                  aria-label="Nouvelle graine"
                  className="exo-accent-chip inline-flex h-9 w-9 items-center justify-center"
                >
                  <Shuffle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
