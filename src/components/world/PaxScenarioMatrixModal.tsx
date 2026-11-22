import { useMemo, useState } from 'react';
import { useSetAtom } from 'jotai';
import { Sliders, Sparkles, Wand2, X } from 'lucide-react';
import { PromptSuggestionChips } from '../bento/PromptSuggestionChips.tsx';
import { useExoStore } from '../../stores/game.store.ts';
import { activeDossierIdAtom, toastNoticeAtom } from '../../stores/selection.atoms.ts';
import {
  compileScenarioMatrix,
  DEFAULT_SCENARIO_MATRIX,
  type ScenarioMatrixConfig,
} from '../../systems/dossiers-pa/pax-scenario-matrix.ts';

interface PaxScenarioMatrixModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

/**
 * [L7] EXW.L7.PAX_SCENARIO_MATRIX_MODAL | v5.0.0 | SADT A2.1/A5.1
 * Parameterized Matrix-Bound Scenario Generator (Standard <-> Advanced + Manual Overrides)
 * operationally linked to WorldState & Executive Dossiers (solving Pax Historia's filter gap).
 */
export function PaxScenarioMatrixModal({ open, onClose }: PaxScenarioMatrixModalProps) {
  const world = useExoStore((s) => s.world);
  const setWorld = useExoStore((s) => s.setWorld);
  const setActiveDossierId = useSetAtom(activeDossierIdAtom);
  const setToast = useSetAtom(toastNoticeAtom);

  const [cfg, setCfg] = useState<ScenarioMatrixConfig>(DEFAULT_SCENARIO_MATRIX);

  const preview = useMemo(() => compileScenarioMatrix(world, cfg), [world, cfg]);

  if (!open) return null;

  const applyScenario = () => {
    setWorld({
      ...world,
      ...preview.worldPatch,
    });
    setActiveDossierId(preview.openingDossier.id);
    setToast({
      id: Date.now(),
      tone: 'success',
      text: `Scénario matriciel « ${cfg.title} » (${preview.matrixFingerprint}) appliqué au moteur !`,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-5"
      onClick={onClose}
    >
      <div
        role="dialog"
        data-testid="pax-scenario-matrix-modal"
        aria-label="Générateur de Scénario Matriciel"
        onClick={(e) => e.stopPropagation()}
        className="exo-bento-card flex max-h-[92dvh] w-full max-w-3xl flex-col rounded-t-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-2 border-b exo-accent-border px-4 py-3 sm:px-5">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase exo-accent-text">
              <Wand2 className="h-3.5 w-3.5" />
              <span>Générateur de Scénario Matriciel · {preview.matrixFingerprint}</span>
            </div>
            <h2 className="font-display text-base font-bold text-[var(--exo-text)]">
              Paramétrage Opérationnel lié au Moteur de Simulation
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le générateur de scénario"
            className="exo-accent-chip inline-flex h-9 w-9 items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs sm:p-5">
          {/* Standard <-> Advanced Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold exo-muted-text">
              <Sliders className="h-3.5 w-3.5 exo-accent-text" />
              Mode de configuration :
            </span>
            <div className="flex gap-1.5">
              {(['STANDARD', 'ADVANCED'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCfg((prev) => ({ ...prev, complexityMode: m }))}
                  className={`min-h-[34px] rounded-lg px-3 font-mono text-[11px] font-bold ${
                    cfg.complexityMode === m ? 'exo-accent-btn' : 'exo-accent-chip'
                  }`}
                >
                  {m === 'STANDARD' ? 'Standard' : 'Avancé (Filtres Complets)'}
                </button>
              ))}
            </div>
          </div>

          {/* Clickable Suggestions */}
          <PromptSuggestionChips
            domain="SCENARIO"
            onInject={(txt) =>
              setCfg((prev) => ({
                ...prev,
                title: txt.split(':')[0]?.trim() || prev.title,
                synopsis: txt,
              }))
            }
          />

          {/* Manual Title & Synopsis */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="font-mono text-[10px] uppercase exo-muted-text">Titre du Scénario</span>
              <input
                type="text"
                value={cfg.title}
                onChange={(e) => setCfg((prev) => ({ ...prev, title: e.target.value }))}
                className="min-h-[38px] w-full rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2.5 text-xs text-[var(--exo-text)]"
              />
            </label>
            <label className="space-y-1">
              <span className="font-mono text-[10px] uppercase exo-muted-text">Boussole Éthique Dominante</span>
              <select
                value={cfg.ethicalEmphasis}
                onChange={(e) =>
                  setCfg((prev) => ({
                    ...prev,
                    ethicalEmphasis: e.target.value as ScenarioMatrixConfig['ethicalEmphasis'],
                  }))
                }
                className="min-h-[38px] w-full rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2.5 text-xs text-[var(--exo-text)]"
              >
                <option value="THOMISM">Thomisme &amp; Bien Commun</option>
                <option value="CIVIC_HUMANISM">Humanisme Civique</option>
                <option value="ECO_SYMBIOSIS">Éco-Symbiose</option>
                <option value="REALPOLITIK">Realpolitik Stratégique</option>
                <option value="BALANCED">Équilibre Neutre</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1">
            <span className="font-mono text-[10px] uppercase exo-muted-text">Synopsis &amp; Enjeu Narratif</span>
            <textarea
              rows={2}
              value={cfg.synopsis}
              onChange={(e) => setCfg((prev) => ({ ...prev, synopsis: e.target.value }))}
              className="w-full rounded-lg border exo-accent-border bg-[var(--exo-surface)] p-2.5 text-xs text-[var(--exo-text)]"
            />
          </label>

          {/* 4 Structured Simulation Sliders */}
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { key: 'climateHarshness', label: 'Rigueur Climatique (1..5)' },
                { key: 'economicScarcity', label: 'Tension Budgétaire (1..5)' },
                { key: 'rivalAggression', label: 'Agressivité Rivaux IA (1..5)' },
                { key: 'diplomacyOpenness', label: 'Ouverture Diplomatique (1..5)' },
              ] as const
            ).map((sl) => (
              <label key={sl.key} className="exo-surface-sub rounded-xl p-3">
                <div className="flex justify-between font-mono text-[11px]">
                  <span>{sl.label}</span>
                  <strong className="exo-accent-text">{cfg[sl.key]}/5</strong>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={cfg[sl.key]}
                  onChange={(e) =>
                    setCfg((prev) => ({
                      ...prev,
                      [sl.key]: Number(e.target.value) as 1 | 2 | 3 | 4 | 5,
                    }))
                  }
                  className="exo-range mt-2 w-full"
                />
              </label>
            ))}
          </div>

          {cfg.complexityMode === 'ADVANCED' && (
            <div className="grid gap-3 border-t exo-accent-border pt-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="font-mono text-[10px] uppercase exo-muted-text">Ère de Départ (1..3)</span>
                <select
                  value={cfg.startingEra}
                  onChange={(e) =>
                    setCfg((prev) => ({
                      ...prev,
                      startingEra: Number(e.target.value) as 1 | 2 | 3,
                    }))
                  }
                  className="min-h-[38px] w-full rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2.5 text-xs text-[var(--exo-text)]"
                >
                  <option value={1}>Ère 1 — Pionniers Orbitaux</option>
                  <option value={2}>Ère 2 — Consolidation Planétaire</option>
                  <option value={3}>Ère 3 — Réseau Maglev &amp; Éden</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-mono text-[10px] uppercase exo-muted-text">Règle Directrice Manuelle</span>
                <input
                  type="text"
                  value={cfg.customDirectiveRule}
                  onChange={(e) =>
                    setCfg((prev) => ({ ...prev, customDirectiveRule: e.target.value }))
                  }
                  className="min-h-[38px] w-full rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2.5 text-xs text-[var(--exo-text)]"
                />
              </label>
            </div>
          )}

          {/* Operational Coupling Preview */}
          <div className="exo-surface-sub rounded-xl border exo-accent-border p-3 font-mono text-[11px]">
            <div className="font-bold exo-accent-text">
              Couplage Moteur Immédiat ({preview.matrixFingerprint}) :
            </div>
            <div className="mt-1 flex flex-wrap gap-3 exo-muted-text">
              <span>Ère : {preview.worldPatch.era}</span>
              <span>Air : {preview.worldPatch.atmosphereProgress}%</span>
              <span>Météo : {preview.worldPatch.weatherState}</span>
              <span>Crédits : {preview.worldPatch.resources?.credits}</span>
              <span>Dossier d’ouverture : {preview.openingDossier.dossierClass}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t exo-accent-border px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="exo-accent-chip min-h-[40px] px-4 text-xs font-semibold"
          >
            Annuler
          </button>
          <button
            type="button"
            data-testid="apply-scenario-matrix-btn"
            onClick={applyScenario}
            className="exo-accent-btn inline-flex min-h-[40px] items-center gap-1.5 px-4 text-xs font-bold"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Compiler &amp; Injecter dans la Partie</span>
          </button>
        </div>
      </div>
    </div>
  );
}
