import { useMemo, useState } from 'react';
import { RefreshCw, Sparkles, Wand2, X } from 'lucide-react';
import type { SuggestionFieldKind } from '../../contracts/skills-vcs.schema.ts';
import {
  generateCloseVariantsFromSelection,
  generateInitialSuggestions,
  generateNextSuggestionsBatch,
} from '../../systems/governance/skills-vcs.engine.ts';

interface SuggestionBubbleFieldProps {
  readonly label: string;
  readonly fieldKind: SuggestionFieldKind;
  readonly value: string;
  readonly seed: number;
  readonly placeholder?: string;
  readonly testIdPrefix: string;
  readonly onChange: (nextValue: string) => void;
}

/**
 * [L7] Interactive Suggestion Bubble Field for New Game Genesis:
 * - Auto quick pick ("Auto")
 * - Clickable suggestion bubbles
 * - Multi-select 1..N bubbles -> "Variantes proches" combinatorial cousin synthesis
 * - Persistent "x" dismiss per bubble + "Autres propositions" fresh rotation
 */
export function SuggestionBubbleField({
  label,
  fieldKind,
  value,
  seed,
  placeholder,
  testIdPrefix,
  onChange,
}: SuggestionBubbleFieldProps) {
  const [batchIndex, setBatchIndex] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  const [variantMode, setVariantMode] = useState(false);

  const suggestions = useMemo(() => {
    if (variantMode && multiSelected.length > 0) {
      return generateCloseVariantsFromSelection(
        fieldKind,
        multiSelected,
        seed + batchIndex * 31,
        dismissed,
        6,
      );
    }
    if (batchIndex === 0) {
      return generateInitialSuggestions(fieldKind, seed, dismissed, 6);
    }
    return generateNextSuggestionsBatch(fieldKind, batchIndex, seed, dismissed, 6);
  }, [variantMode, multiSelected, fieldKind, seed, batchIndex, dismissed]);

  const handleAutoPick = () => {
    const candidate = suggestions[0] ?? generateInitialSuggestions(fieldKind, seed + batchIndex + 5, [], 1)[0];
    if (candidate) onChange(candidate);
  };

  const toggleMultiSample = (item: string) => {
    setMultiSelected((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );
  };

  const dismissBubble = (item: string) => {
    setDismissed((prev) => (prev.includes(item) ? prev : [...prev, item]));
    setMultiSelected((prev) => prev.filter((x) => x !== item));
  };

  const handleProposeCloseVariants = () => {
    const basis = multiSelected.length > 0 ? multiSelected : value.trim() ? [value.trim()] : [];
    if (basis.length === 0) return;
    setMultiSelected(basis);
    setVariantMode(true);
    setBatchIndex((b) => b + 1);
  };

  const handleOtherProposals = () => {
    setVariantMode(false);
    setBatchIndex((b) => b + 1);
  };

  return (
    <div className="exo-surface-sub space-y-2.5 rounded-xl border exo-accent-border p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={`${testIdPrefix}-input`}
          className="font-display text-xs font-bold uppercase tracking-wide text-[var(--exo-text)]"
        >
          {label}
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            data-testid={`${testIdPrefix}-auto-btn`}
            onClick={handleAutoPick}
            className="exo-accent-chip inline-flex min-h-[30px] items-center gap-1 rounded-lg px-2.5 font-mono text-[10.5px] font-bold"
          >
            <Wand2 className="h-3 w-3 exo-accent-text" />
            <span>Auto</span>
          </button>
          <button
            type="button"
            data-testid={`${testIdPrefix}-variants-btn`}
            onClick={handleProposeCloseVariants}
            disabled={multiSelected.length === 0 && !value.trim()}
            title="Sélectionnez 1 ou plusieurs bulles avec + puis cliquez pour générer des variantes proches"
            className="exo-accent-chip inline-flex min-h-[30px] items-center gap-1 rounded-lg px-2.5 font-mono text-[10.5px] font-bold disabled:opacity-45"
          >
            <Sparkles className="h-3 w-3 exo-accent-2-text" />
            <span>Variantes proches{multiSelected.length > 0 ? ` (${multiSelected.length})` : ''}</span>
          </button>
          <button
            type="button"
            data-testid={`${testIdPrefix}-more-btn`}
            onClick={handleOtherProposals}
            className="exo-accent-chip inline-flex min-h-[30px] items-center gap-1 rounded-lg px-2.5 font-mono text-[10.5px] font-bold"
          >
            <RefreshCw className="h-3 w-3 exo-accent-text" />
            <span>Autres propositions</span>
          </button>
        </div>
      </div>

      <input
        id={`${testIdPrefix}-input`}
        data-testid={`${testIdPrefix}-input`}
        type="text"
        maxLength={48}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[40px] w-full rounded-xl border exo-accent-border bg-[var(--exo-surface)] px-3 font-mono text-xs font-semibold text-[var(--exo-text)] focus:border-[var(--exo-accent)] focus:outline-none"
      />

      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((item) => {
          const isChosen = value.trim().toLowerCase() === item.toLowerCase();
          const inMulti = multiSelected.includes(item);
          return (
            <div
              key={item}
              className={`inline-flex items-center overflow-hidden rounded-lg border text-[11px] font-semibold transition ${
                isChosen
                  ? 'border-[var(--exo-accent)] bg-[var(--exo-accent)] text-slate-950'
                  : inMulti
                    ? 'border-amber-400 bg-amber-500/20 text-[var(--exo-text)]'
                    : 'exo-accent-border bg-[var(--exo-surface)] text-[var(--exo-text)] hover:border-[var(--exo-accent)]'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleMultiSample(item)}
                title={inMulti ? 'Retirer de la multi-sélection' : 'Ajouter à la multi-sélection pour variantes proches'}
                className={`px-1.5 py-1 font-mono text-[10px] font-bold border-r exo-accent-border ${
                  inMulti ? 'bg-amber-400 text-slate-950' : 'opacity-70 hover:opacity-100'
                }`}
              >
                {inMulti ? '✓' : '+'}
              </button>
              <button
                type="button"
                data-testid={`${testIdPrefix}-bubble`}
                onClick={() => onChange(item)}
                className="px-2 py-1 text-left"
              >
                {item}
              </button>
              <button
                type="button"
                data-testid={`${testIdPrefix}-dismiss`}
                onClick={() => dismissBubble(item)}
                aria-label={`Supprimer la proposition ${item}`}
                className="px-1.5 py-1 opacity-65 hover:bg-rose-500/20 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
