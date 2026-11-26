import type {
  DocVcsEntry,
  DocVcsRevision,
  ModularSkillSpec,
} from '../contracts/skills-vcs.schema.ts';

/**
 * [L1] EXW.L1.SKILLS_VCS_CATALOG | v5.1.0 | SADT A1.1
 * Strictly decoupled catalog of:
 * 1) 9 Autonomous Modular Skills (App, Game World, Game Ethics, Narrative) — referencing external docId only.
 * 2) Initial Version-Controlled Documentation Library (VCS Docs).
 * 3) NF / AFNOR & DMT-SW Engineering Compliance Matrix.
 */

export interface NfAfnorComplianceRow {
  readonly code: string;
  readonly normTitle: string;
  readonly scope: string;
  readonly status: 'CONFORME' | 'OBSERVE' | 'CIBLE';
  readonly evidence: string;
}

export const NF_AFNOR_DMTSW_NORMS_CATALOG: readonly NfAfnorComplianceRow[] = Object.freeze([
  {
    code: 'DMT-SW',
    normTitle: 'Dossier Technique Logiciel & Traçabilité Exigences-Tests',
    scope: 'Gouvernance SSoT, SADT A0..A5 & Chaîne Exigences → Code → Tests',
    status: 'CONFORME',
    evidence: 'Matrices M0..M15, scripts/exo-audit.ts (17/17 PASS GO) & VCS Docs isolé',
  },
  {
    code: 'NF ISO/IEC/IEEE 42010',
    normTitle: 'Description d’architecture des systèmes et logiciels',
    scope: 'Architecture 9 couches L0..L8, Frontières ESLint & Diagrammes SADT/DSM',
    status: 'CONFORME',
    evidence: 'M13_SADT_Mapping.json (couverture 1:1 src/) + eslint.config.mjs',
  },
  {
    code: 'NF ISO/IEC 25010',
    normTitle: 'Modèle de qualité produit & qualité en utilisation',
    scope: 'Déterminisme PCG32, Ergonomie Bento V7, Accessibilité tactile ≥ 44px, Mémoire WebKit',
    status: 'CONFORME',
    evidence: 'Tests déterminisme 360 ticks + guardrails webkit-memory + Audit Playwright',
  },
  {
    code: 'NF ISO/IEC/IEEE 29148',
    normTitle: 'Ingénierie des exigences (FUP-001..018, R-01..R-69)',
    scope: 'Traçabilité unitaire des exigences, arbitrages verrouillés (OPT-02 A+ Unity 6 URP Principal + Aperçu Three.js) & invariants R-24/R-26/R-50',
    status: 'CONFORME',
    evidence: 'RTM-XSC + Master Blueprint DOC-EXW-ARCH-001 v2.14.0-MAITRE (Annexes A–N)',
  },
  {
    code: 'NF Z67-100 / NF203 / NF552',
    normTitle: 'Cahier de tests, Coffre-fort intégrité SHA-256 & Archivage pérenne',
    scope: 'Empreintes SHA-256 à chaque tour & chaque révision documentaire VCS non destructive',
    status: 'CONFORME',
    evidence: 'state-hasher.ts + docs-vcs.engine.ts (révisions SHA-256 + Revert non destructif)',
  },
]);

const RAW_MODULAR_SKILLS: readonly ModularSkillSpec[] = [
  // --- APP SKILLS ---
  {
    id: 'skill-app-ssot-audit',
    code: 'SKL-APP-01',
    name: 'Audit SSoT MX16-ICOM & Couches L0–L8',
    domain: 'APP',
    hookKind: 'SSOT_AUDIT',
    semver: '2.1.0',
    enabled: true,
    entryModule: 'src/services/architecture/matrix-engine.ts',
    docId: 'doc-skill-app-ssot',
    dependencies: [],
    config: {
      strictLayerGuards: true,
      maxCyclomaticWarn: 85,
      enforceZ0Ban: true,
    },
    updatedAtIso: '2026-11-24T12:00:00.000Z',
  },
  {
    id: 'skill-app-drive-sync',
    code: 'SKL-APP-02',
    name: 'Synchronisation Google Drive & Docs (OAuth)',
    domain: 'APP',
    hookKind: 'DRIVE_SYNC',
    semver: '1.8.0',
    enabled: true,
    entryModule: 'src/doc-sync/drive-docs.service.ts',
    docId: 'doc-skill-app-drive',
    dependencies: ['skill-app-vcs-docs'],
    config: {
      confirmBeforeWrite: true,
      keepTokenInMemoryOnly: true,
      autoImportPickerMetadata: true,
    },
    updatedAtIso: '2026-11-24T12:00:00.000Z',
  },
  {
    id: 'skill-app-vcs-docs',
    code: 'SKL-APP-03',
    name: 'VCS Documentaire SemVer & Diff/Revert',
    domain: 'APP',
    hookKind: 'DOCS_VCS',
    semver: '1.4.0',
    enabled: true,
    entryModule: 'src/systems/governance/skills-vcs.engine.ts',
    docId: 'doc-skill-app-vcs',
    dependencies: [],
    config: {
      hashAlgo: 'SHA-256',
      nonDestructiveRevert: true,
      mirrorToFirestore: true,
    },
    updatedAtIso: '2026-11-24T12:00:00.000Z',
  },

  // --- GAME WORLD & DIPLOMACY SKILLS ---
  {
    id: 'skill-game-5div-biohealth',
    code: 'SKL-GAM-01',
    name: '5 Divisions Scientifiques & BioHealth (FEAT-53/54)',
    domain: 'GAME_WORLD',
    hookKind: 'BIOCLIMATE_5DIV',
    semver: '2.4.0',
    enabled: true,
    entryModule: 'src/systems/biosphere-cabinet/bioclimate-health.ts',
    docId: 'doc-skill-game-biohealth',
    dependencies: [],
    config: {
      divisionsCount: 5,
      catastropheP0MaxPerCycle: 2,
      edenThresholdPct: 80,
    },
    updatedAtIso: '2026-11-24T12:00:00.000Z',
  },
  {
    id: 'skill-game-biomes-oceans',
    code: 'SKL-GAM-02',
    name: 'Générateur Planètes, Biomes & Océans 3D',
    domain: 'GAME_WORLD',
    hookKind: 'BIOME_OCEAN_GEN',
    semver: '2.0.0',
    enabled: true,
    entryModule: 'src/data/world.catalog.ts',
    docId: 'doc-skill-game-biomes',
    dependencies: ['skill-game-5div-biohealth'],
    config: {
      archetypesCount: 8,
      maxOceanCoveragePct: 92,
      enableSpecularAtolls: true,
    },
    updatedAtIso: '2026-11-24T12:00:00.000Z',
  },
  {
    id: 'skill-game-planetary-diplomacy',
    code: 'SKL-GAM-03',
    name: 'Diplomatie Planétaire, Traités & Arcs Orbitaux',
    domain: 'GAME_WORLD',
    hookKind: 'PLANETARY_DIPLOMACY',
    semver: '1.6.0',
    enabled: true,
    entryModule: 'src/systems/geopolitics/planetary-diplomacy.ts',
    docId: 'doc-skill-game-diplomacy',
    dependencies: [],
    config: {
      treatyKinds: 5,
      defaultTreatyDurationCycles: 6,
      renderOrbitalArcs: true,
    },
    updatedAtIso: '2026-11-24T12:00:00.000Z',
  },

  // --- GAME ETHICS & CIVILIZATION SKILLS ---
  {
    id: 'skill-ethics-thomistic-discernment',
    code: 'SKL-ETH-01',
    name: 'Éthique Thomiste, Maslow & Discernement (FEAT-55/56)',
    domain: 'GAME_ETHICS',
    hookKind: 'THOMISTIC_DISCERNMENT',
    semver: '1.5.0',
    enabled: true,
    entryModule: 'src/systems/geopolitics/planetary-diplomacy.ts',
    docId: 'doc-skill-ethics-thomism',
    dependencies: ['skill-game-planetary-diplomacy'],
    config: {
      badgesCount: 11,
      freedomOfConscienceMin: 100,
      pedagogicalScale: '+3_TO_-2',
    },
    updatedAtIso: '2026-11-24T12:00:00.000Z',
  },

  // --- NARRATIVE & AI SKILLS ---
  {
    id: 'skill-narr-lexicon',
    code: 'SKL-NAR-01',
    name: 'Lexique Narratif R-50 & Filtre Zéro Z0',
    domain: 'NARRATIVE',
    hookKind: 'LLM_LEXICON',
    semver: '1.9.0',
    enabled: true,
    entryModule: 'src/utils/llm-lexicon.ts',
    docId: 'doc-skill-narr-lexicon',
    dependencies: [],
    config: {
      strictR50Filter: true,
      frenchPrecision2050: true,
    },
    updatedAtIso: '2026-11-24T12:00:00.000Z',
  },
  {
    id: 'skill-narr-bff-cascade',
    code: 'SKL-NAR-02',
    name: 'Cascade BFF Gemini 4T (Free Tier Strict 0 USD)',
    domain: 'NARRATIVE',
    hookKind: 'BFF_CASCADE_ZERO',
    semver: '2.2.0',
    enabled: true,
    entryModule: 'server.ts',
    docId: 'doc-skill-narr-cascade',
    dependencies: ['skill-narr-lexicon'],
    config: {
      strictFreeTierUsd0: true,
      rejectPaidModelsHttp: 403,
      rateLimitPerMin: 12,
    },
    updatedAtIso: '2026-11-24T12:00:00.000Z',
  },
];

export const DEFAULT_MODULAR_SKILLS: readonly ModularSkillSpec[] = Object.freeze(RAW_MODULAR_SKILLS);

interface SeedDocDef {
  readonly docId: string;
  readonly title: string;
  readonly category: DocVcsEntry['category'];
  readonly domain: DocVcsEntry['domain'];
  readonly linkedSkillId: string | null;
  readonly semver: string;
  readonly tags: readonly string[];
  readonly content: string;
}

const SEED_DOCS: readonly SeedDocDef[] = [
  {
    docId: 'doc-master-blueprint-ssot',
    title: 'DOC-EXW-ARCH-001 — Master Blueprint Unifié v2.14.0-MAITRE (NF/AFNOR & DMT-SW)',
    category: 'BLUEPRINT',
    domain: 'SYSTEM',
    linkedSkillId: null,
    semver: '2.14.0',
    tags: ['SSoT', 'NF-AFNOR', 'DMT-SW', 'EXOW-ROOT', 'EXO-DEV-BRIDGE', 'FUP-018'],
    content: [
      '# DOC-EXW-ARCH-001 — Master Blueprint Unifié en 1 Fichier (v2.14.0-MAITRE)',
      '',
      '## 1. Dossier Unique `/docs` & Cartouche Normative NF / AFNOR & DMT-SW',
      '- **Dossier Unifié Niveau 0** : Toute la documentation racine (`00_INDEX_DOCS.md`, `CHANGELOG.txt`, `DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md`, `SYSTEM_INSTRUCTION_LIVE.md`, `inter-ia/`, `master-blueprint/`, `archive/`) est consolidée exclusivement sous `/docs/` sans doublon racine.',
      '- **DMT-SW** : Dossier Technique Logiciel & Traçabilité bidirectionnelle Exigences → Architecture → Tests (Annexes A..N intégrées).',
      '- **NF ISO/IEC/IEEE 42010** : Architecture 9 couches (L0 Contrats → L8 BFF Express) sans cycle DSM.',
      '- **NF ISO/IEC 25010** : Qualité produit, déterminisme PCG32 et accessibilité tactile ≥ 44×44 px.',
      '- **NF ISO/IEC/IEEE 29148** : Spécification des exigences FUP-001..018, AR-01..19 et R-01..69.',
      '- **NF Z67-100 / NF203 / NF552** : Empreinte SHA-256 par cycle et par révision documentaire VCS.',
      '',
      '## 2. Invariants Verrouillés, FUP-018 & Connectivité Multi-Surfaces (EXO-DEV-BRIDGE)',
      '- **R-16** : Ciel ouvert intégral en 3D (zéro dôme géométrique).',
      '- **R-24 & FUP-018** : Dossiers Exécutifs (P0 + C1..C5) supportant 5 à 10 options, mode Multi-Choix Budgété (plafonds PA/Crédits), déblocage conditionnel multi-factoriel (coéquipier, niveau, compétence, ère, atmosphère, techno, confiance) et option 0-PA garantie.',
      '- **R-50** : Lexique scientifique réaliste 2050 strict.',
      '- **R-68** : Budget 0 USD strict (modèles gratuits uniquement, rejet HTTP 403 sinon).',
      '- **EXO-DEV-BRIDGE** : Espace Dev & Connectivité Multi-Surfaces dans `DocsSkillsHubScreen` (Bus `BUS-EXW-001`, écriture tri-surface confirmée AI Studio + Google Drive + GitHub, Data Agent Kit, Firebase & Vercel).',
    ].join('\n'),
  },
  {
    docId: 'doc-norms-nf-afnor-dmtsw',
    title: 'Référentiel Conformité NF / AFNOR & DMT-SW',
    category: 'NORMS_NF_AFNOR',
    domain: 'SYSTEM',
    linkedSkillId: null,
    semver: '1.3.0',
    tags: ['AFNOR', 'ISO-42010', 'ISO-25010', 'DMT-SW'],
    content: [
      '# Référentiel Normatif NF / AFNOR & DMT-SW — EXO WORLD : 2050',
      '',
      '## Périmètre vérifié automatiquement',
      '1. **NF ISO/IEC/IEEE 42010** : Découpage strict L0..L8 vérifié par ESLint et `npm run exo:audit`.',
      '2. **DMT-SW** : Chaque module `src/` est mappé 1:1 dans `M13_SADT_Mapping.json`.',
      '3. **NF ISO/IEC/IEEE 29148** : Arbitrages `AR-01..AR-19`, `OPT-01..12` et `R-01..69` figés sauf validation R-25.',
      '4. **NF Z67-100 & NF203/NF552** : Historique documentaire VCS non destructif avec empreinte SHA-256.',
    ].join('\n'),
  },
  {
    docId: 'doc-skill-app-ssot',
    title: 'Guide Skill · Audit SSoT MX16-ICOM & Couches L0–L8',
    category: 'SKILL_GUIDE',
    domain: 'APP',
    linkedSkillId: 'skill-app-ssot-audit',
    semver: '2.1.0',
    tags: ['Skill', 'Audit', 'MX16-ICOM', 'L0-L8'],
    content: [
      '# Skill SKL-APP-01 — Audit SSoT MX16-ICOM',
      '',
      '## Rôle fonctionnel',
      'Vérifie la couverture 1:1 de tous les fichiers `src/` dans `M13_SADT_Mapping.json`, l’absence de cycle DSM (algorithme de Kahn) et la pureté déterministe des couches L2/L3.',
      '',
      '## Commandes associées',
      '- `npm run exo:sync-bp` : Synchronise les manifestes et projections Tri-Format.',
      '- `npm run exo:audit` : Exécute la porte de validation 17/17 PASS GO.',
    ].join('\n'),
  },
  {
    docId: 'doc-skill-app-drive',
    title: 'Guide Skill · Synchronisation Google Drive & Docs',
    category: 'SKILL_GUIDE',
    domain: 'APP',
    linkedSkillId: 'skill-app-drive-sync',
    semver: '1.8.0',
    tags: ['Skill', 'Google-Drive', 'Google-Docs', 'OAuth'],
    content: [
      '# Skill SKL-APP-02 — Synchronisation Google Drive & Docs',
      '',
      '## Règles de sécurité OAuth',
      '- Les jetons d’accès OAuth restent exclusivement en mémoire vive client (`workspaceAccessTokenInMemory`).',
      '- Toute écriture ou création de Google Doc exige une modale de confirmation explicite avant envoi.',
      '- Chaque import Drive crée automatiquement une nouvelle révision VCS (`DRIVE_IMPORT`).',
    ].join('\n'),
  },
  {
    docId: 'doc-skill-app-vcs',
    title: 'Guide Skill · VCS Documentaire SemVer & Diff/Revert',
    category: 'SKILL_GUIDE',
    domain: 'APP',
    linkedSkillId: 'skill-app-vcs-docs',
    semver: '1.4.0',
    tags: ['Skill', 'VCS', 'Diff', 'Revert', 'SHA-256'],
    content: [
      '# Skill SKL-APP-03 — VCS Documentaire Isolé',
      '',
      '## Principe d’isolation',
      'La documentation évolue selon son propre cycle SemVer (`patch`, `minor`, `major`) indépendamment des mises à jour du moteur de simulation et des skills.',
      '',
      '## Opérations supportées',
      '- Création d’une révision signée par empreinte SHA-256.',
      '- Comparaison ligne à ligne (Diff) entre deux révisions.',
      '- Restauration (Revert) non destructive créant une nouvelle révision avec `source = REVERT`.',
    ].join('\n'),
  },
  {
    docId: 'doc-skill-game-biohealth',
    title: 'Guide Skill · 5 Divisions Scientifiques & BioHealth (FEAT-53/54)',
    category: 'SKILL_GUIDE',
    domain: 'GAME_WORLD',
    linkedSkillId: 'skill-game-5div-biohealth',
    semver: '2.4.0',
    tags: ['Skill', '5-Divisions', 'BioHealth', 'FEAT-53', 'FEAT-54'],
    content: [
      '# Skill SKL-GAM-01 — 5 Divisions Scientifiques & Simulateur BioHealth',
      '',
      '## Architecture des 5 Divisions',
      'EXOSPHERE_0 · THERMOSPHERE_1 · MESOSPHERE_2 · STRATOSPHERE_3 · TROPOSPHERE_4.',
      '',
      '## Formule BioHealth (FEAT-53)',
      '`BioHealth = clamp(0, 0.25·Air + 0.20·Sols + 0.20·Hydro + 0.20·Flore + 0.15·Faune − MalusCatastrophe, 100)`.',
      '- Plafonnement strict des crises majeures P0 (FEAT-54) à 2 dossiers par cycle.',
    ].join('\n'),
  },
  {
    docId: 'doc-skill-game-biomes',
    title: 'Guide Skill · Biomes, Océans & Planètes 3D Procédurales',
    category: 'SKILL_GUIDE',
    domain: 'GAME_WORLD',
    linkedSkillId: 'skill-game-biomes-oceans',
    semver: '2.0.0',
    tags: ['Skill', 'Biomes', 'Océans', 'Three.js'],
    content: [
      '# Skill SKL-GAM-02 — Générateur Planètes, Biomes & Océans',
      '',
      '## Archétypes supportés (8 biomes)',
      'Archipel Émeraude · Monde Océanique · Pangée Tempérée · Cryo-Océan Boréal · Biosphère Fongique · Alpin & Fjords · Basalte & Caldeiras · Canyons Ocres.',
      '',
      '## Paramétrage 3D',
      'Contrôle la couverture océanique (0%–92%), le relief (Doux/Équilibré/Escarpé) et les textures PBR spéculaires des océans en Échelle 2.',
    ].join('\n'),
  },
  {
    docId: 'doc-skill-game-diplomacy',
    title: 'Guide Skill · Diplomatie Planétaire & Traités Bilatéraux',
    category: 'SKILL_GUIDE',
    domain: 'GAME_WORLD',
    linkedSkillId: 'skill-game-planetary-diplomacy',
    semver: '1.6.0',
    tags: ['Skill', 'Diplomatie', 'Traités', 'R-24'],
    content: [
      '# Skill SKL-GAM-03 — Diplomatie Planétaire & Traités',
      '',
      '## 5 Traités Planétaires (R-24)',
      '1. Route Commerciale Maritime (`MARITIME_TRADE`)',
      '2. Pacte de Non-Agression (`NON_AGGRESSION`)',
      '3. Partage Scientifique (`SCIENCE_SHARE`)',
      '4. Embargo Orbital (`ORBITAL_EMBARGO`)',
      '5. Sommet Planétaire (`PLANETARY_SUMMIT`)',
      '',
      'Les accords actifs projettent des arcs logistiques et diplomatiques sur la sphère planétaire 3D.',
    ].join('\n'),
  },
  {
    docId: 'doc-skill-ethics-thomism',
    title: 'Guide Skill · Éthique Thomiste, Maslow & Discernement (FEAT-55/56)',
    category: 'SKILL_GUIDE',
    domain: 'GAME_ETHICS',
    linkedSkillId: 'skill-ethics-thomistic-discernment',
    semver: '1.5.0',
    tags: ['Skill', 'Éthique', 'Maslow', 'FEAT-55', 'FEAT-56', 'AR-19'],
    content: [
      '# Skill SKL-ETH-01 — Éthique Thomiste, Maslow & Discernement',
      '',
      '## Invariants AR-17, AR-18 & AR-19',
      '- **Onglet 6 Lecture Seule (AR-17)** : Observation des 11 badges thomistes et des strates de Maslow sans micromanagement direct.',
      '- **Échelle Pédagogique 6 niveaux (AR-18)** : `+3 Grâce` jusqu’à `−2`.',
      '- **Église Catholique & Liberté de Conscience (FEAT-55/56, AR-19)** : Développement pastoral, caritatif et contemplatif dans le respect absolu de la liberté de conscience (score plancher 100%, aucune coercition).',
    ].join('\n'),
  },
  {
    docId: 'doc-skill-narr-lexicon',
    title: 'Guide Skill · Lexique Narratif R-50 & Garde Zéro Z0',
    category: 'SKILL_GUIDE',
    domain: 'NARRATIVE',
    linkedSkillId: 'skill-narr-lexicon',
    semver: '1.9.0',
    tags: ['Skill', 'R-50', 'Lexique', 'Narratif'],
    content: [
      '# Skill SKL-NAR-01 — Lexique Narratif R-50',
      '',
      'Garantit la précision terminologique 2050 en français pour toutes les sorties LLM et les dossiers générés, sans vocabulaire fantastique ni lexique obsolète.',
    ].join('\n'),
  },
  {
    docId: 'doc-skill-narr-cascade',
    title: 'Guide Skill · Cascade BFF Gemini 4 Tiers (Free Tier Strict 0 USD)',
    category: 'SKILL_GUIDE',
    domain: 'NARRATIVE',
    linkedSkillId: 'skill-narr-bff-cascade',
    semver: '2.2.0',
    tags: ['Skill', 'Gemini', 'Free-Tier', 'R-68'],
    content: [
      '# Skill SKL-NAR-02 — Cascade BFF Gemini 4T (0 USD Strict)',
      '',
      '## Chaîne d’exécution BFF (`server.ts`)',
      '- **T1 / T2** : `gemini-4-hydrogen` (Thinking LOW, 2.2s puis retry 1.3s)',
      '- **T3** : `gemini-3.1-flash-lite` (2.5s)',
      '- **Décisions calibrées** : `gemini-decision-1` (0 jeton de sortie)',
      '- **T4** : Repli déterministe transparent sur le Catalogue Vivant hors-ligne.',
      '- **R-68** : Toute requête spécifiant un modèle payant hors liste blanche est rejetée avec `HTTP 403`.',
    ].join('\n'),
  },
];

function deterministicHashSeed(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + i;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const partA = (h1 >>> 0).toString(16).padStart(8, '0');
  const partB = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${partA}${partB}${partA}${partB}`;
}

export const INITIAL_DOC_VCS_REVISIONS: readonly DocVcsRevision[] = Object.freeze(
  SEED_DOCS.map((doc) => ({
    revisionId: `rev-${doc.docId}-v${doc.semver.replace(/\./g, '_')}`,
    docId: doc.docId,
    semver: doc.semver,
    contentHash: deterministicHashSeed(`${doc.docId}:${doc.semver}:${doc.content}`),
    author: 'Architecte SSoT EXW',
    summary: `Version initiale consolidée (${doc.semver})`,
    parentRevisionId: null,
    source: 'LOCAL' as const,
    createdAtIso: '2026-11-24T12:00:00.000Z',
    content: doc.content,
  })),
);

export const INITIAL_DOC_VCS_ENTRIES: readonly DocVcsEntry[] = Object.freeze(
  SEED_DOCS.map((doc, idx) => {
    const rev = INITIAL_DOC_VCS_REVISIONS[idx]!;
    return {
      docId: doc.docId,
      title: doc.title,
      category: doc.category,
      domain: doc.domain,
      linkedSkillId: doc.linkedSkillId,
      driveFileId: null,
      driveUrl: null,
      currentSemver: doc.semver,
      currentRevisionId: rev.revisionId,
      currentContentHash: rev.contentHash,
      tags: [...doc.tags],
      updatedAtIso: rev.createdAtIso,
    };
  }),
);
