import {
  LLM_LEXICON_RULES,
  PREFERRED_GAME_TERMS,
  type LlmLexiconCategory,
  type LlmLexiconRule,
} from '../data/llm-lexicon.data.ts';

/**
 * [L5] EXW.L5.LLM_LEXICON_ENGINE | v4.0.0-rc.1 | SADT A4.2
 * Pure deterministic lexical normalizer & compact prompt-injection builder.
 * - Rewrites archaic/legal/technical jargon (e.g. "aFFermer", "péréquation", "stochastique")
 *   into crystal-clear RPG / Citybuilder / 4X 2050 vocabulary with Unicode word boundaries.
 * - Preserves capitalization (Sentence Case, ALL CAPS, lowercase).
 * - Builds a token-compact directive block injected directly into Gemini prompts.
 */

export interface CustomLexiconEntry {
  readonly id: string;
  readonly source: string;
  readonly replacement: string;
  readonly category: LlmLexiconCategory;
}

export interface LexiconReplacementHit {
  readonly ruleId: string;
  readonly category: LlmLexiconCategory;
  readonly original: string;
  readonly replacement: string;
}

export interface LexiconRewriteResult {
  readonly text: string;
  readonly replacements: readonly LexiconReplacementHit[];
}

function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchCase(original: string, replacement: string): string {
  if (original.length === 0 || replacement.length === 0) return replacement;
  const isAllUpper =
    original === original.toLocaleUpperCase('fr-FR') &&
    original !== original.toLocaleLowerCase('fr-FR');
  if (isAllUpper) {
    return replacement.toLocaleUpperCase('fr-FR');
  }
  const firstChar = original.charAt(0);
  const rest = original.slice(1);
  const startsCapitalized =
    firstChar === firstChar.toLocaleUpperCase('fr-FR') &&
    firstChar !== firstChar.toLocaleLowerCase('fr-FR') &&
    rest === rest.toLocaleLowerCase('fr-FR');
  if (startsCapitalized) {
    return replacement.charAt(0).toLocaleUpperCase('fr-FR') + replacement.slice(1);
  }
  return replacement;
}

const VOWEL_START_RE = /^[aeiouyéèêëàâîïôöùûüœ]/iu;
const CONSONANT_START_RE = /^[bcdfghjklmnpqrstvwxzç]/iu;

function buildPatternRegex(patterns: readonly string[]): RegExp {
  const sorted = [...patterns]
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);
  // Capture optional French elision/preposition prefix (d’ / d' / de ) right before the matched term
  return new RegExp(
    `(?<![\\p{L}\\p{N}_])(?:((?:[dD]['’])|(?:[dD]e\\s+))(?=[\\p{L}]))?(${sorted.join('|')})(?![\\p{L}\\p{N}_])`,
    'giu',
  );
}

function repairFrenchPrefix(prefix: string | undefined, replacement: string): string {
  if (!prefix) return '';
  const isUpperD = prefix.startsWith('D');
  const isDeWithSpace = /^[dD]e\s+$/.test(prefix);
  const isDApostrophe = /^[dD]['’]$/.test(prefix);

  if (isDApostrophe && CONSONANT_START_RE.test(replacement)) {
    return isUpperD ? 'De ' : 'de ';
  }
  if (isDeWithSpace && VOWEL_START_RE.test(replacement)) {
    return isUpperD ? 'D’' : 'd’';
  }
  return prefix;
}

const COMPILED_CORE_RULES: ReadonlyArray<{
  readonly rule: LlmLexiconRule;
  readonly regex: RegExp;
}> = LLM_LEXICON_RULES.map((rule) => ({
  rule,
  regex: buildPatternRegex(rule.patterns),
}));

export function applyLlmLexicon(
  inputText: string,
  customEntries: readonly CustomLexiconEntry[] = [],
): LexiconRewriteResult {
  if (!inputText) return { text: '', replacements: [] };

  let output = inputText;
  const replacements: LexiconReplacementHit[] = [];

  // Apply custom user rules first so user overrides take priority
  for (const entry of customEntries) {
    const src = entry.source.trim();
    const rep = entry.replacement.trim();
    if (!src || !rep) continue;
    const regex = buildPatternRegex([src]);
    output = output.replace(regex, (_full, prefix: string | undefined, matched: string) => {
      const cased = matchCase(matched, rep);
      replacements.push({
        ruleId: entry.id,
        category: entry.category,
        original: matched,
        replacement: cased,
      });
      return `${repairFrenchPrefix(prefix, cased)}${cased}`;
    });
  }

  for (const { rule, regex } of COMPILED_CORE_RULES) {
    output = output.replace(regex, (_full, prefix: string | undefined, matched: string) => {
      const cased = matchCase(matched, rule.replacement);
      replacements.push({
        ruleId: rule.id,
        category: rule.category,
        original: matched,
        replacement: cased,
      });
      return `${repairFrenchPrefix(prefix, cased)}${cased}`;
    });
  }

  return { text: output, replacements };
}

export function buildLlmLexiconPromptBlock(
  customEntries: readonly CustomLexiconEntry[] = [],
): string {
  const corePairs = LLM_LEXICON_RULES.slice(0, 18).map(
    (r) => `${r.patterns[0]}→${r.replacement}`,
  );
  const customPairs = customEntries
    .filter((c) => c.source.trim().length > 0 && c.replacement.trim().length > 0)
    .map((c) => `${c.source.trim()}→${c.replacement.trim()}`);
  const preferred = PREFERRED_GAME_TERMS.map((t) => t.term).join(', ');

  return [
    'DICO LEXICAL JEU (RPG / Citybuilder / 4X 2050) — OBLIGATOIRE :',
    '- Écris dans un français vivant, concret et immédiatement compréhensible par un joueur de Citybuilder / RPG / 4X.',
    `- Remplace systématiquement les termes juridiques, archaïques ou jargonneux : ${[...customPairs, ...corePairs].join(' ; ')}.`,
    `- Utilise en priorité le vocabulaire métier du jeu : ${preferred}.`,
  ].join('\n');
}
