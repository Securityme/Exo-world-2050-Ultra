import { Sparkles } from 'lucide-react';
import {
  PROMPT_SUGGESTION_CHIPS,
  type SuggestionDomain,
} from '../../data/prompt-suggestions.catalog.ts';

/**
 * [L7] EXW.L7.PROMPT_SUGGESTION_CHIPS | v5.0.0 | SADT A2.1
 * Clickable suggestion bubbles that inject curated prompts directly into text inputs.
 */
interface PromptSuggestionChipsProps {
  readonly domain: SuggestionDomain;
  readonly onInject: (text: string) => void;
  readonly label?: string;
}

export function PromptSuggestionChips({
  domain,
  onInject,
  label = 'Suggestions rapides (cliquer pour injecter) :',
}: PromptSuggestionChipsProps) {
  const chips = PROMPT_SUGGESTION_CHIPS[domain];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1 font-mono text-[10px] font-semibold exo-muted-text">
        <Sparkles className="h-3 w-3 exo-accent-text" />
        <span>{label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((text, idx) => (
          <button
            key={idx}
            type="button"
            data-testid={`suggestion-chip-${domain.toLowerCase()}-${idx}`}
            onClick={() => onInject(text)}
            className="exo-accent-chip max-w-full rounded-full px-2.5 py-1 text-left text-[10.5px] font-medium transition hover:ring-1 hover:ring-[var(--exo-accent)]"
          >
            + {text}
          </button>
        ))}
      </div>
    </div>
  );
}
