import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookMarked,
  Check,
  Copy,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  LEXICON_CATEGORY_LABELS,
  LLM_LEXICON_RULES,
  PREFERRED_GAME_TERMS,
  type LlmLexiconCategory,
} from '../../data/llm-lexicon.data.ts';
import {
  applyLlmLexicon,
  buildLlmLexiconPromptBlock,
  type CustomLexiconEntry,
} from '../../utils/llm-lexicon.ts';

/**
 * [L7] EXW.L7.LLM_LEXICON_PANEL | v4.0.0-rc.1 | SADT A5.1
 * Interactive LLM Dictionary ("Dico LLM RPG & Citybuilder") inside Atlas Blueprint:
 * - Live sandbox rewriting archaic/jargon words (e.g. aFFermer -> mettre en concession)
 * - Custom user dictionary entries persisted locally
 * - Filterable canonical rules + preferred RPG/Citybuilder/4X 2050 glossary
 * - 1-click copy of the compact LLM prompt directive block
 */

const STORAGE_KEY = 'exow_custom_llm_lexicon_v1';

const DEFAULT_SAMPLE =
  'Le conseil propose d’aFFermer la centrale sous emphytéose, d’appliquer une péréquation stochastique et de subroger le délégataire en cas de fallback du pipeline.';

function loadCustomEntries(): CustomLexiconEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is CustomLexiconEntry =>
        Boolean(
          x &&
            typeof x === 'object' &&
            typeof (x as CustomLexiconEntry).id === 'string' &&
            typeof (x as CustomLexiconEntry).source === 'string' &&
            typeof (x as CustomLexiconEntry).replacement === 'string',
        ),
    );
  } catch {
    return [];
  }
}

export function LlmLexiconPanel() {
  const [category, setCategory] = useState<'ALL' | LlmLexiconCategory>('ALL');
  const [query, setQuery] = useState('');
  const [sampleText, setSampleText] = useState(DEFAULT_SAMPLE);
  const [customEntries, setCustomEntries] = useState<CustomLexiconEntry[]>(() => loadCustomEntries());
  const [newSource, setNewSource] = useState('');
  const [newReplacement, setNewReplacement] = useState('');
  const [newCategory, setNewCategory] = useState<LlmLexiconCategory>('CITYBUILDER');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const rewrite = useMemo(
    () => applyLlmLexicon(sampleText, customEntries),
    [sampleText, customEntries],
  );

  const filteredRules = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LLM_LEXICON_RULES.filter((rule) => {
      if (category !== 'ALL' && rule.category !== category) return false;
      if (!q) return true;
      return (
        rule.sourceLabel.toLowerCase().includes(q) ||
        rule.replacement.toLowerCase().includes(q) ||
        rule.note.toLowerCase().includes(q)
      );
    });
  }, [category, query]);

  const filteredTerms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PREFERRED_GAME_TERMS.filter((item) => {
      if (category !== 'ALL' && item.category !== category) return false;
      if (!q) return true;
      return item.term.toLowerCase().includes(q) || item.meaning.toLowerCase().includes(q);
    });
  }, [category, query]);

  const persistCustom = (next: CustomLexiconEntry[]) => {
    setCustomEntries(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  };

  const handleAddCustom = () => {
    const src = newSource.trim();
    const rep = newReplacement.trim();
    if (!src || !rep) return;
    persistCustom([
      {
        id: `usr-${Date.now()}`,
        source: src,
        replacement: rep,
        category: newCategory,
      },
      ...customEntries,
    ]);
    setNewSource('');
    setNewReplacement('');
  };

  const handleCopyPrompt = async () => {
    const block = buildLlmLexiconPromptBlock(customEntries);
    try {
      await navigator.clipboard.writeText(block);
      setCopiedPrompt(true);
      window.setTimeout(() => setCopiedPrompt(false), 1800);
    } catch {
      setCopiedPrompt(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="llm-lexicon-panel">
      {/* Header & Copy Prompt CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50/75 p-3.5 dark:border-rose-900/60 dark:bg-rose-950/30">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-300">
            <BookMarked className="h-3.5 w-3.5" />
            <span>Dictionnaire Actif Gemini · {LLM_LEXICON_RULES.length + customEntries.length} règles</span>
          </div>
          <h3 className="mt-0.5 font-display text-sm font-bold text-[#1f1224] dark:text-rose-50">
            Dico LLM : Traduction Automatique en Langage RPG, Citybuilder &amp; 4X
          </h3>
          <p className="mt-0.5 text-xs text-rose-900/75 dark:text-rose-200/75">
            Injecté dans les prompts Gemini et appliqué automatiquement aux textes générés (ex. <code className="font-mono">aFFermer</code> → <strong className="font-semibold">mettre en concession</strong>).
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleCopyPrompt()}
          data-testid="copy-lexicon-prompt-btn"
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-rose-500"
        >
          {copiedPrompt ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copiedPrompt ? 'Dico Prompt copié' : 'Copier le Dico Prompt LLM'}</span>
        </button>
      </div>

      {/* Live Sandbox Tester */}
      <div className="grid gap-3 rounded-xl border border-rose-200 bg-white/90 p-3.5 lg:grid-cols-2 dark:border-rose-900/60 dark:bg-[#190d1f]">
        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] font-semibold text-rose-700 dark:text-rose-300">
            Texte brut du LLM (test en direct)
            <textarea
              rows={3}
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              className="mt-1 w-full rounded-lg border border-rose-200 bg-rose-50/40 p-2 font-sans text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-50"
            />
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              Texte réécrit RPG / Citybuilder
            </span>
            <span>{rewrite.replacements.length} remplacement(s)</span>
          </div>
          <div
            data-testid="lexicon-live-output"
            className="min-h-[68px] rounded-lg border border-emerald-300/70 bg-emerald-50/50 p-2.5 text-xs leading-relaxed text-[#1f1224] dark:border-emerald-800/60 dark:bg-emerald-950/25 dark:text-emerald-50"
          >
            {rewrite.text || 'Saisissez un texte à gauche pour tester le dictionnaire.'}
          </div>
          {rewrite.replacements.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {rewrite.replacements.map((hit, idx) => (
                <span
                  key={`${hit.ruleId}-${idx}`}
                  className="inline-flex items-center gap-1 rounded border border-emerald-300/70 bg-white px-2 py-0.5 font-mono text-[10.5px] text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                >
                  <span className="line-through opacity-70">{hit.original}</span>
                  <ArrowRight className="h-2.5 w-2.5" />
                  <span className="font-bold">{hit.replacement}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Custom Rule */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-rose-200/80 bg-white/85 p-3 dark:border-rose-900/60 dark:bg-rose-950/25">
        <input
          type="text"
          value={newSource}
          onChange={(e) => setNewSource(e.target.value)}
          placeholder="Mot complexe (ex: affermer)"
          className="min-h-[36px] flex-1 min-w-[160px] rounded-lg border border-rose-200 bg-white px-2.5 text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-50"
        />
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-rose-500" />
        <input
          type="text"
          value={newReplacement}
          onChange={(e) => setNewReplacement(e.target.value)}
          placeholder="Terme RPG / Citybuilder clair"
          className="min-h-[36px] flex-1 min-w-[180px] rounded-lg border border-rose-200 bg-white px-2.5 text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-50"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value as LlmLexiconCategory)}
          className="min-h-[36px] rounded-lg border border-rose-200 bg-white px-2 text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-50"
        >
          {(Object.keys(LEXICON_CATEGORY_LABELS) as LlmLexiconCategory[]).map((cat) => (
            <option key={cat} value={cat}>
              {LEXICON_CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAddCustom}
          disabled={!newSource.trim() || !newReplacement.trim()}
          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Ajouter</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'CITYBUILDER', 'RPG', 'STRATEGY_4X', 'TECH_CLEAN'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`min-h-[32px] rounded-lg border px-2.5 text-xs font-semibold transition ${
                category === cat
                  ? 'border-rose-500 bg-rose-600 text-white'
                  : 'border-rose-200 bg-white/85 text-rose-900 hover:border-rose-400 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100'
              }`}
            >
              {cat === 'ALL' ? 'Toutes catégories' : LEXICON_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
        <div className="relative min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-rose-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer le dictionnaire…"
            className="min-h-[34px] w-full rounded-lg border border-rose-200 bg-white pl-8 pr-2.5 text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-50"
          />
        </div>
      </div>

      {/* Rules Table & Preferred Vocabulary */}
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="max-h-[40vh] space-y-1.5 overflow-y-auto pr-1">
          {customEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-fuchsia-300/70 bg-fuchsia-50/70 px-3 py-2 text-xs dark:border-fuchsia-800 dark:bg-fuchsia-950/30"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono font-semibold text-fuchsia-900 dark:text-fuchsia-200">{entry.source}</span>
                <ArrowRight className="h-3 w-3 text-fuchsia-500" />
                <span className="font-bold text-emerald-800 dark:text-emerald-300">{entry.replacement}</span>
                <span className="font-mono text-[10px] text-fuchsia-700/80 dark:text-fuchsia-300/80">Perso</span>
              </div>
              <button
                type="button"
                aria-label={`Supprimer ${entry.source}`}
                onClick={() => persistCustom(customEntries.filter((c) => c.id !== entry.id))}
                className="rounded p-1 text-rose-600 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-950/60"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              className="rounded-lg border border-rose-200/80 bg-white/90 px-3 py-2 text-xs dark:border-rose-900/60 dark:bg-[#190d1f]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono font-semibold text-rose-700 line-through dark:text-rose-300">
                    {rule.sourceLabel}
                  </span>
                  <ArrowRight className="h-3 w-3 text-rose-400" />
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">
                    {rule.replacement}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-rose-900/60 dark:text-rose-200/60">
                  {LEXICON_CATEGORY_LABELS[rule.category]}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-rose-900/75 dark:text-rose-200/75">{rule.note}</p>
            </div>
          ))}
        </div>

        <div className="max-h-[40vh] space-y-2 overflow-y-auto rounded-xl border border-rose-200 bg-white/85 p-3 dark:border-rose-900/60 dark:bg-rose-950/25">
          <h4 className="font-display text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
            Vocabulaire Métier Conseillé au LLM ({filteredTerms.length})
          </h4>
          {filteredTerms.map((item) => (
            <div
              key={item.term}
              className="border-b border-rose-100 pb-1.5 last:border-b-0 dark:border-rose-900/40"
            >
              <div className="font-semibold text-xs text-[#1f1224] dark:text-rose-50">{item.term}</div>
              <div className="text-[11px] text-rose-900/75 dark:text-rose-200/75">{item.meaning}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
