import type {
  DocVcsEntry,
  DocVcsRevision,
  DocVcsSource,
  DocVcsStoreState,
  ModularSkillSpec,
  SuggestionFieldKind,
} from '../../contracts/skills-vcs.schema.ts';
import { Pcg32 } from '../../core/prng/pcg32.ts';
import {
  DEFAULT_MODULAR_SKILLS,
  INITIAL_DOC_VCS_ENTRIES,
  INITIAL_DOC_VCS_REVISIONS,
} from '../../data/skills-vcs.catalog.ts';
import { SUGGESTION_LEXICON_BANKS } from '../../data/campaign-genesis.catalog.ts';

/**
 * [L3] EXW.L3.SKILLS_VCS_ENGINE | v5.1.0 | SADT A3.1
 * 100% Pure, deterministic:
 * - Isolated Documentation Version Control System (SemVer bump, SHA-style hash, Line Diff, Non-destructive Revert)
 * - Autonomous Modular Skills Registry mutations (strictly separated from docs via docId)
 * - Combinatorial Suggestion Bubble Generator (multi-select close variants & persistent dismissal filter)
 * Zero Math.random(), zero Date.now(), zero I/O.
 */

export type SemverBumpKind = 'patch' | 'minor' | 'major';

export function bumpSemver(semver: string, kind: SemverBumpKind): string {
  const core = (semver.split('-')[0] ?? '1.0.0').split('+')[0] ?? '1.0.0';
  const parts = core.split('.').map((n) => Math.max(0, Number.parseInt(n, 10) || 0));
  const maj = parts[0] ?? 1;
  const min = parts[1] ?? 0;
  const pat = parts[2] ?? 0;
  if (kind === 'major') return `${maj + 1}.0.0`;
  if (kind === 'minor') return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

export function computeContentDigestPure(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  let h3 = 0x243f6a88;
  let h4 = 0xb7e15162;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193);
    h2 = Math.imul(h2 ^ (ch + i), 0x85ebca6b);
    h3 = Math.imul(h3 ^ (ch * 31 + i), 0xc2b2ae35);
    h4 = Math.imul(h4 ^ ((ch << 3) + i), 0x27d4eb2f);
  }
  return [h1, h2, h3, h4]
    .map((n) => (n >>> 0).toString(16).padStart(8, '0'))
    .join('');
}

export interface DiffLineEntry {
  readonly kind: 'SAME' | 'ADDED' | 'REMOVED';
  readonly lineNumberPrev: number | null;
  readonly lineNumberNext: number | null;
  readonly text: string;
}

export function computeLineDiff(prevText: string, nextText: string): readonly DiffLineEntry[] {
  const a = prevText.split('\n');
  const b = nextText.split('\n');
  const m = a.length;
  const n = b.length;

  // Guard size for huge documents using O(min(m,n)) fallback if > 260 lines
  if (m * n > 65_000) {
    const out: DiffLineEntry[] = [];
    const maxLen = Math.max(m, n);
    for (let i = 0; i < maxLen; i++) {
      const la = a[i];
      const lb = b[i];
      if (la !== undefined && lb !== undefined && la === lb) {
        out.push({ kind: 'SAME', lineNumberPrev: i + 1, lineNumberNext: i + 1, text: la });
      } else {
        if (la !== undefined) out.push({ kind: 'REMOVED', lineNumberPrev: i + 1, lineNumberNext: null, text: la });
        if (lb !== undefined) out.push({ kind: 'ADDED', lineNumberPrev: null, lineNumberNext: i + 1, text: lb });
      }
    }
    return out;
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    const row = dp[i]!;
    const nextRow = dp[i + 1]!;
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) {
        row[j] = 1 + (nextRow[j + 1] ?? 0);
      } else {
        row[j] = Math.max(nextRow[j] ?? 0, row[j + 1] ?? 0);
      }
    }
  }

  const result: DiffLineEntry[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      result.push({ kind: 'SAME', lineNumberPrev: i + 1, lineNumberNext: j + 1, text: a[i]! });
      i++;
      j++;
    } else if ((dp[i + 1]?.[j] ?? 0) >= (dp[i]?.[j + 1] ?? 0)) {
      result.push({ kind: 'REMOVED', lineNumberPrev: i + 1, lineNumberNext: null, text: a[i]! });
      i++;
    } else {
      result.push({ kind: 'ADDED', lineNumberPrev: null, lineNumberNext: j + 1, text: b[j]! });
      j++;
    }
  }
  while (i < m) {
    result.push({ kind: 'REMOVED', lineNumberPrev: i + 1, lineNumberNext: null, text: a[i]! });
    i++;
  }
  while (j < n) {
    result.push({ kind: 'ADDED', lineNumberPrev: null, lineNumberNext: j + 1, text: b[j]! });
    j++;
  }
  return result;
}

export function createInitialDocVcsStoreState(): DocVcsStoreState {
  return {
    docs: [...INITIAL_DOC_VCS_ENTRIES],
    revisions: [...INITIAL_DOC_VCS_REVISIONS],
    skills: [...DEFAULT_MODULAR_SKILLS],
  };
}

export interface CreateRevisionParams {
  readonly docId: string;
  readonly nextContent: string;
  readonly nextTitle?: string;
  readonly summary: string;
  readonly author: string;
  readonly bumpKind: SemverBumpKind;
  readonly source: DocVcsSource;
  readonly createdAtIso: string;
  readonly driveFileId?: string | null;
  readonly driveUrl?: string | null;
}

export function createRevisionFromEdit(
  store: DocVcsStoreState,
  params: CreateRevisionParams,
): { readonly nextStore: DocVcsStoreState; readonly createdRevision: DocVcsRevision | null } {
  const doc = store.docs.find((d) => d.docId === params.docId);
  if (!doc) return { nextStore: store, createdRevision: null };

  const nextSemver = bumpSemver(doc.currentSemver, params.bumpKind);
  const contentHash = computeContentDigestPure(`${params.docId}:${nextSemver}:${params.nextContent}`);
  const revSeq = store.revisions.filter((r) => r.docId === params.docId).length + 1;
  const revisionId = `rev-${params.docId}-r${revSeq}-${contentHash.slice(0, 6)}`;

  const createdRevision: DocVcsRevision = {
    revisionId,
    docId: params.docId,
    semver: nextSemver,
    contentHash,
    author: params.author.trim() || 'Architecte SSoT',
    summary: params.summary.trim() || `Mise à jour ${nextSemver}`,
    parentRevisionId: doc.currentRevisionId,
    source: params.source,
    createdAtIso: params.createdAtIso,
    content: params.nextContent,
  };

  const nextDocs = store.docs.map((d) =>
    d.docId === params.docId
      ? {
          ...d,
          title: params.nextTitle?.trim() || d.title,
          currentSemver: nextSemver,
          currentRevisionId: revisionId,
          currentContentHash: contentHash,
          driveFileId: params.driveFileId !== undefined ? params.driveFileId : d.driveFileId,
          driveUrl: params.driveUrl !== undefined ? params.driveUrl : d.driveUrl,
          updatedAtIso: params.createdAtIso,
        }
      : d,
  );

  return {
    nextStore: {
      ...store,
      docs: nextDocs,
      revisions: [createdRevision, ...store.revisions],
    },
    createdRevision,
  };
}

export function createNewDocEntry(
  store: DocVcsStoreState,
  params: {
    readonly docId: string;
    readonly title: string;
    readonly category: DocVcsEntry['category'];
    readonly domain: DocVcsEntry['domain'];
    readonly linkedSkillId?: string | null;
    readonly content: string;
    readonly author: string;
    readonly createdAtIso: string;
    readonly tags?: readonly string[];
  },
): { readonly nextStore: DocVcsStoreState; readonly createdDoc: DocVcsEntry } {
  const semver = '1.0.0';
  const contentHash = computeContentDigestPure(`${params.docId}:${semver}:${params.content}`);
  const revisionId = `rev-${params.docId}-r1-${contentHash.slice(0, 6)}`;

  const rev: DocVcsRevision = {
    revisionId,
    docId: params.docId,
    semver,
    contentHash,
    author: params.author.trim() || 'Architecte SSoT',
    summary: 'Création initiale du document',
    parentRevisionId: null,
    source: 'LOCAL',
    createdAtIso: params.createdAtIso,
    content: params.content,
  };

  const entry: DocVcsEntry = {
    docId: params.docId,
    title: params.title.trim(),
    category: params.category,
    domain: params.domain,
    linkedSkillId: params.linkedSkillId ?? null,
    driveFileId: null,
    driveUrl: null,
    currentSemver: semver,
    currentRevisionId: revisionId,
    currentContentHash: contentHash,
    tags: [...(params.tags ?? ['VCS'])],
    updatedAtIso: params.createdAtIso,
  };

  return {
    nextStore: {
      ...store,
      docs: [entry, ...store.docs],
      revisions: [rev, ...store.revisions],
    },
    createdDoc: entry,
  };
}

export function revertDocToRevision(
  store: DocVcsStoreState,
  params: {
    readonly docId: string;
    readonly targetRevisionId: string;
    readonly author: string;
    readonly createdAtIso: string;
  },
): { readonly nextStore: DocVcsStoreState; readonly revertRevision: DocVcsRevision | null } {
  const targetRev = store.revisions.find(
    (r) => r.docId === params.docId && r.revisionId === params.targetRevisionId,
  );
  if (!targetRev) return { nextStore: store, revertRevision: null };

  const res = createRevisionFromEdit(store, {
    docId: params.docId,
    nextContent: targetRev.content,
    summary: `Revert non destructif vers ${targetRev.semver} (${targetRev.revisionId.slice(-6)})`,
    author: params.author,
    bumpKind: 'patch',
    source: 'REVERT',
    createdAtIso: params.createdAtIso,
  });

  return {
    nextStore: res.nextStore,
    revertRevision: res.createdRevision,
  };
}

export function toggleSkillEnabled(
  store: DocVcsStoreState,
  skillId: string,
  updatedAtIso: string,
): DocVcsStoreState {
  return {
    ...store,
    skills: store.skills.map((s) =>
      s.id === skillId ? { ...s, enabled: !s.enabled, updatedAtIso } : s,
    ),
  };
}

export function updateSkillConfig(
  store: DocVcsStoreState,
  skillId: string,
  nextConfig: ModularSkillSpec['config'],
  updatedAtIso: string,
): DocVcsStoreState {
  return {
    ...store,
    skills: store.skills.map((s) =>
      s.id === skillId ? { ...s, config: { ...nextConfig }, updatedAtIso } : s,
    ),
  };
}

export function bumpSkillSemver(
  store: DocVcsStoreState,
  skillId: string,
  kind: SemverBumpKind,
  updatedAtIso: string,
): DocVcsStoreState {
  return {
    ...store,
    skills: store.skills.map((s) =>
      s.id === skillId ? { ...s, semver: bumpSemver(s.semver, kind), updatedAtIso } : s,
    ),
  };
}

/**
 * Pure Combinatorial Suggestion Bubble Engine for Campaign Genesis
 * Supports:
 * - Initial batch (never contains dismissed strings)
 * - Multi-select close variants (synthesizes thematic/root cousins & hybrids)
 * - "Autres propositions" fresh rotation excluding dismissed/already displayed items
 */
const CLOSE_VARIANT_SUFFIXES: Readonly<Record<SuggestionFieldKind, readonly string[]>> = {
  PLANET: ['Prime', 'Nova', 'Majoris', 'II', 'IV', 'Sur-Mer', 'Val', 'Horizon'],
  CAPITAL: ['Port', 'Nord', 'Solaire', 'sur-Mer', '2050', 'Aurore', 'Havre', 'Lac'],
  LEADER: ['Saint-Clair', 'Valmont', 'Kowalski', 'Vance', 'Moreau', 'Solberg', 'Ferreira', 'Chen'],
  FLEET: ['Horizon', 'Aurore', 'Égide', 'Solaire', 'Méridien', 'Boréale', 'Atlantique', 'Thalassa'],
};

export function generateInitialSuggestions(
  fieldKind: SuggestionFieldKind,
  seed: number,
  excluded: readonly string[] = [],
  count = 6,
): readonly string[] {
  const excludedSet = new Set(excluded.map((s) => s.toLowerCase()));
  const bank = SUGGESTION_LEXICON_BANKS[fieldKind].filter(
    (entry) => !excludedSet.has(entry.value.toLowerCase()),
  );
  const prng = new Pcg32(seed ^ (fieldKind.length * 97 + 13));
  const pool = [...bank];
  const out: string[] = [];

  while (pool.length > 0 && out.length < count) {
    const idx = prng.nextInt(0, pool.length - 1);
    const picked = pool.splice(idx, 1)[0];
    if (picked) out.push(picked.value);
  }
  return out;
}

export function generateCloseVariantsFromSelection(
  fieldKind: SuggestionFieldKind,
  selectedValues: readonly string[],
  seed: number,
  excluded: readonly string[] = [],
  count = 6,
): readonly string[] {
  if (selectedValues.length === 0) {
    return generateInitialSuggestions(fieldKind, seed + 17, excluded, count);
  }
  const excludedSet = new Set([
    ...excluded.map((s) => s.toLowerCase()),
    ...selectedValues.map((s) => s.toLowerCase()),
  ]);
  const bank = SUGGESTION_LEXICON_BANKS[fieldKind];
  const selectedEntries = selectedValues.map((val) => {
    const match = bank.find((b) => b.value.toLowerCase() === val.toLowerCase());
    if (match) return match;
    const parts = val.trim().split(/[\s-]+/);
    return { value: val, theme: 'CUSTOM', root: parts[parts.length - 1] || val };
  });

  const targetThemes = new Set(selectedEntries.map((e) => e.theme));
  const thematicNeighbors = bank.filter(
    (b) => targetThemes.has(b.theme) && !excludedSet.has(b.value.toLowerCase()),
  );

  const prng = new Pcg32(seed ^ (selectedValues.join('|').length * 131));
  const candidates: string[] = [];
  for (const neighbor of thematicNeighbors) {
    candidates.push(neighbor.value);
  }

  // Synthesize fresh hybrid variants from selected roots + field-specific suffixes
  const suffixes = CLOSE_VARIANT_SUFFIXES[fieldKind];
  for (const sel of selectedEntries) {
    const firstWord = sel.value.split(/[\s-]+/)[0] || sel.root;
    for (let k = 0; k < 3; k++) {
      const suf = suffixes[prng.nextInt(0, suffixes.length - 1)]!;
      let hybrid: string;
      if (fieldKind === 'LEADER') {
        hybrid = `${firstWord} ${suf}`;
      } else if (fieldKind === 'FLEET') {
        hybrid = `${firstWord === 'Flotte' || firstWord === 'Armada' || firstWord === 'Escadre' ? firstWord : 'Escadre'} ${sel.root}-${suf}`;
      } else if (sel.root.toLowerCase() === suf.toLowerCase()) {
        hybrid = `${sel.root}-2050`;
      } else {
        hybrid = `${sel.root}-${suf}`;
      }
      if (!excludedSet.has(hybrid.toLowerCase()) && !candidates.some((c) => c.toLowerCase() === hybrid.toLowerCase())) {
        candidates.push(hybrid);
      }
    }
  }

  // Top up from remaining bank if still under count
  for (const b of bank) {
    if (!excludedSet.has(b.value.toLowerCase()) && !candidates.some((c) => c.toLowerCase() === b.value.toLowerCase())) {
      candidates.push(b.value);
    }
  }

  return candidates.slice(0, count);
}

export function generateNextSuggestionsBatch(
  fieldKind: SuggestionFieldKind,
  batchIndex: number,
  seed: number,
  excluded: readonly string[] = [],
  count = 6,
): readonly string[] {
  return generateInitialSuggestions(fieldKind, seed + (batchIndex + 1) * 7919, excluded, count);
}
