import { Bot, Building2, Cpu, Leaf, Scale, Shield } from 'lucide-react';
import { getSuperpowerEmblem } from '../../data/art-manifest.data.ts';
import { GOVERNMENT_TYPES_CATALOG } from '../../data/campaign-genesis.catalog.ts';
import { AI_PERSONALITIES_CATALOG, SUPERPOWERS_V4_CATALOG } from '../../data/v4-catalog.data.ts';
import type { DraftCampaignConfig } from '../../stores/game.store.ts';
import { SuggestionBubbleField } from './SuggestionBubbleField.tsx';

interface GenesisGovernanceStepProps {
  readonly draft: DraftCampaignConfig;
  readonly updateDraft: (patch: Partial<DraftCampaignConfig>) => void;
}

const GOV_ICONS = {
  LEAF: Leaf,
  CPU: Cpu,
  BUILDING: Building2,
  SCALE: Scale,
  SHIELD: Shield,
} as const;

const DOCTRINE_PRESETS = [
  { id: 'SOLARPUNK', label: 'Solarpunk', summary: 'Priorité à la biosphère, aux parcs ouverts et à la qualité de vie.' },
  { id: 'SCIENTIFIC', label: 'Scientifique', summary: 'Accélère la recherche partagée et les percées technologiques.' },
  { id: 'FEDERAL', label: 'Fédérale', summary: 'Équilibre diplomatie, contrats civiques et cohésion d’alliance.' },
  { id: 'CORPORATE', label: 'Industrielle', summary: 'Maximise la trésorerie, les matériaux et le rendement logistique.' },
  { id: 'SECURITY', label: 'Souveraine', summary: 'Renforce la défense orbitale, la résilience et le contrôle territorial.' },
] as const;

/**
 * [L7] Step 2 of 4-Step Campaign Genesis:
 * Superpower, 5 Government Types, Leader Name Suggestion Bubbles, Founding Doctrine & AI Co-pilot.
 */
export function GenesisGovernanceStep({ draft, updateDraft }: GenesisGovernanceStepProps) {
  const selectedDoctrine =
    DOCTRINE_PRESETS.find((d) => d.id === draft.doctrineId) ?? DOCTRINE_PRESETS[0]!;
  const selectedAi =
    AI_PERSONALITIES_CATALOG.find((p) => p.id === draft.aiPersonality) ?? AI_PERSONALITIES_CATALOG[0]!;

  return (
    <div className="space-y-4" data-testid="genesis-step-2">
      {/* 2.1 Superpower */}
      <section className="exo-bento-card space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-base font-bold text-[var(--exo-text)]">
            2.1 Puissance Fondatrice
          </h2>
          <span className="font-mono text-[11px] exo-muted-text">
            5 Superpuissances · Emblèmes officiels 2050
          </span>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
          {SUPERPOWERS_V4_CATALOG.map((sp) => {
            const selected = draft.superpowerId === sp.id;
            return (
              <button
                key={sp.id}
                type="button"
                onClick={() => updateDraft({ superpowerId: sp.id })}
                className={`flex flex-col items-center rounded-xl border p-3 text-center transition ${
                  selected
                    ? 'border-[var(--exo-accent)] bg-[var(--exo-accent-soft)] ring-1 ring-[var(--exo-accent)]'
                    : 'exo-accent-border bg-[var(--exo-surface)] hover:border-[var(--exo-accent)]'
                }`}
              >
                <img
                  src={getSuperpowerEmblem(sp.id)}
                  alt={sp.name}
                  className="h-12 w-12 rounded-full border exo-accent-border object-cover shadow-sm"
                />
                <span className="mt-2 font-mono text-[10px] font-bold exo-accent-text">
                  {sp.code}
                </span>
                <div className="mt-0.5 font-display text-xs font-bold leading-snug text-[var(--exo-text)]">
                  {sp.name}
                </div>
                <p className="mt-1 text-[10px] leading-snug exo-muted-text">{sp.startingBonus}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2.2 Government Type */}
      <section className="exo-bento-card space-y-3 p-4 sm:p-5">
        <h2 className="font-display text-base font-bold text-[var(--exo-text)]">
          2.2 Type de Gouvernement
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {GOVERNMENT_TYPES_CATALOG.map((gov) => {
            const Icon = GOV_ICONS[gov.iconKey];
            const selected = draft.governmentTypeId === gov.id;
            return (
              <button
                key={gov.id}
                type="button"
                data-testid={`gov-card-${gov.id.toLowerCase()}`}
                onClick={() => updateDraft({ governmentTypeId: gov.id })}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                  selected
                    ? 'border-[var(--exo-accent)] bg-[var(--exo-accent-soft)] ring-1 ring-[var(--exo-accent)]'
                    : 'exo-accent-border bg-[var(--exo-surface)] hover:border-[var(--exo-accent)]'
                }`}
              >
                <span
                  className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border exo-accent-border"
                  style={{ color: gov.accentHex }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-sm font-bold text-[var(--exo-text)]">
                    {gov.name}
                  </div>
                  <p className="mt-0.5 text-[11px] exo-muted-text">{gov.tagline}</p>
                  <div className="mt-1 font-mono text-[10px] font-semibold text-emerald-500 dark:text-emerald-300">
                    {gov.bonusLabel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2.3 Leader Name Suggestion Bubbles */}
      <SuggestionBubbleField
        label="2.3 Nom du Dirigeant Fondateur"
        fieldKind="LEADER"
        value={draft.leaderName}
        seed={draft.worldSeed}
        placeholder="Ex. Hélène Vance"
        testIdPrefix="genesis-leader-name"
        onChange={(leaderName) => updateDraft({ leaderName })}
      />

      {/* 2.4 Doctrine & Co-pilot */}
      <section className="exo-bento-card space-y-3 p-4 sm:p-5">
        <h2 className="font-display text-base font-bold text-[var(--exo-text)]">
          2.4 Doctrine Initiale &amp; Co-Pilote IA
        </h2>
        <div className="grid gap-2 sm:grid-cols-5">
          {DOCTRINE_PRESETS.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => updateDraft({ doctrineId: doc.id })}
              className={`min-h-[36px] rounded-lg border px-2 font-mono text-[11px] font-bold transition ${
                draft.doctrineId === doc.id ? 'exo-accent-btn' : 'exo-accent-chip'
              }`}
            >
              {doc.label}
            </button>
          ))}
        </div>
        <p className="text-xs exo-muted-text">{selectedDoctrine.summary}</p>

        <div className="grid gap-2 border-t exo-accent-border pt-3 sm:grid-cols-2">
          <label className="block text-xs">
            <span className="font-semibold exo-muted-text">Identifiant Co-pilote IA</span>
            <input
              type="text"
              maxLength={32}
              value={draft.aiPersonaName}
              onChange={(e) => updateDraft({ aiPersonaName: e.target.value })}
              className="mt-1 min-h-[38px] w-full rounded-xl border exo-accent-border bg-[var(--exo-surface)] px-3 font-mono text-xs font-semibold text-[var(--exo-text)]"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => updateDraft({ aiAdaptability: !draft.aiAdaptability })}
              className={`flex min-h-[38px] w-full items-center justify-between rounded-xl border px-3 text-xs font-semibold ${
                draft.aiAdaptability ? 'border-emerald-400 bg-emerald-500/12 text-emerald-500' : 'exo-accent-chip'
              }`}
            >
              <span>Adaptation style de jeu</span>
              <span className="font-mono font-bold">{draft.aiAdaptability ? 'Active' : 'Fixe'}</span>
            </button>
          </div>
        </div>

        <div className="grid gap-1.5 sm:grid-cols-5">
          {AI_PERSONALITIES_CATALOG.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => updateDraft({ aiPersonality: p.id })}
              className={`rounded-lg border px-2 py-1.5 font-mono text-[11px] font-bold transition ${
                draft.aiPersonality === p.id ? 'exo-accent-btn' : 'exo-accent-chip'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-xs exo-muted-text">
          <Bot className="mr-1 inline h-3.5 w-3.5 exo-accent-text" />
          {selectedAi.voicePrefix} {selectedAi.tagline}
        </p>
      </section>
    </div>
  );
}
