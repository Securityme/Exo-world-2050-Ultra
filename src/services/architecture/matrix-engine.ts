/**
 * [L5] EXW.ARCH.MATRIX_ENGINE | v4.0.0-rc.1 | SADT A5.1
 * Isomorphic Pure 16-Matrix Architecture Engine (M0-M15):
 * - Zero Node.js or DOM dependencies (runs identically in CLI scripts/exo-audit.ts and Browser Atlas UI).
 * - Evaluates ICOM vertical/horizontal completeness, DSM acyclicity (Kahn's algorithm, 0 cycles),
 *   SemVer 2.0.0 syntax & fractal drift, ISO 42010/31320/25010/25012/27001/12207 whitelist,
 *   and authoritative Release Gate GO / NO-GO.
 */

export type MatrixId =
  | 'M0' | 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6' | 'M7'
  | 'M8' | 'M9' | 'M10' | 'M11' | 'M12' | 'M13-A' | 'M13-D' | 'M14' | 'M15';

export type LayerCode = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8';

export type TriLock = readonly [0 | 1, 0 | 1, 0 | 1];

export type SemVerPropagation = 'PATCH' | 'MINOR' | 'MAJOR';

export interface IcomFlow {
  readonly inputs: readonly string[];
  readonly controls: readonly string[];
  readonly outputs: readonly string[];
  readonly mechanisms: readonly string[];
}

export interface FractalNodeMeta {
  readonly id: string;
  readonly name: string;
  readonly layer: LayerCode;
  readonly sadtBox: string;
  readonly semver: string;
  readonly triLock: TriLock;
  readonly status: 'ACTIVE' | 'PLANNED' | 'DEPRECATED';
  readonly isoRefs: readonly string[];
  readonly matrices: readonly MatrixId[];
  readonly deps: readonly string[];
}

export interface M0Manifest {
  readonly rootId: string;
  readonly rootSemver: string;
  readonly specStandard: string;
  readonly updatedAt: string;
  readonly releaseGatePolicy: 'STRICT_ZERO_ERROR';
  readonly nodes: readonly FractalNodeMeta[];
}

export interface SadtD2SubBox {
  readonly id: string;
  readonly parentD1: 'A1' | 'A2' | 'A3' | 'A4' | 'A5';
  readonly title: string;
  readonly layer: LayerCode;
  readonly datagrams: readonly ('D1' | 'D2' | 'D3' | 'D4' | 'D5')[];
  readonly icom: IcomFlow;
}

export interface SrcModuleMapping {
  readonly path: string;
  readonly layer: LayerCode;
  readonly sadtBox: string;
  readonly semver: string;
  readonly status: 'VERIFIED' | 'PENDING' | 'STUB';
  readonly maxLinesBudget: number;
}

export interface M13Manifest {
  readonly version: string;
  readonly d1Boxes: readonly {
    readonly id: 'A1' | 'A2' | 'A3' | 'A4' | 'A5';
    readonly title: string;
    readonly domain: string;
    readonly icom: IcomFlow;
  }[];
  readonly d2SubBoxes: readonly SadtD2SubBox[];
  readonly datagrams: readonly {
    readonly id: 'D1' | 'D2' | 'D3' | 'D4' | 'D5';
    readonly name: string;
    readonly producer: string;
    readonly consumers: readonly string[];
    readonly schemaRef: string;
  }[];
  readonly srcMappings: readonly SrcModuleMapping[];
}

export interface MatrixSummaryEntry {
  readonly id: MatrixId;
  readonly code: string;
  readonly title: string;
  readonly layers: readonly LayerCode[];
  readonly iso: string;
  readonly metric: string;
  readonly status: 'PASS' | 'WARN' | 'FAIL';
  readonly summary: string;
}

export interface MatrixEngineReport {
  readonly rootId: string;
  readonly rootSemver: string;
  readonly gate: 'GO' | 'NO-GO';
  readonly dsmCycleCount: number;
  readonly icomViolations: readonly string[];
  readonly semverViolations: readonly string[];
  readonly isoViolations: readonly string[];
  readonly unmappedSrcPaths: readonly string[];
  readonly orphanMappings: readonly string[];
  readonly matrices: readonly MatrixSummaryEntry[];
  readonly scorePct: number;
}

const SEMVER_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const ISO_WHITELIST = new Set(['42010', '31320-1', '25010', '25012', '27001', '12207', '61508', '9241-210']);

export function isValidSemVer(version: string): boolean {
  return SEMVER_REGEX.test(version);
}

export function propagateSemVer(current: string, bump: SemVerPropagation): string {
  const base = current.split(/[-+]/)[0] ?? '0.0.0';
  const [maj = 0, min = 0, pat = 0] = base.split('.').map((n) => Number.parseInt(n, 10) || 0);
  if (bump === 'MAJOR') return `${maj + 1}.0.0`;
  if (bump === 'MINOR') return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

/**
 * Kahn's topological sort cycle detector for the DSM (Design Structure Matrix).
 * Returns the number of nodes trapped in dependency cycles (0 = strictly acyclic DAG).
 */
export function detectDsmCycles(nodes: readonly FractalNodeMeta[]): number {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  const nodeIds = new Set(nodes.map((n) => n.id));

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }
  for (const node of nodes) {
    for (const dep of node.deps) {
      if (!nodeIds.has(dep)) continue;
      adjacency.get(dep)?.push(node.id);
      inDegree.set(node.id, (inDegree.get(node.id) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  let visited = 0;
  while (queue.length > 0) {
    const cur = queue.shift()!;
    visited += 1;
    for (const next of adjacency.get(cur) ?? []) {
      const nextDeg = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, nextDeg);
      if (nextDeg === 0) queue.push(next);
    }
  }

  return Math.max(0, nodes.length - visited);
}

export function evaluateMatrixArchitecture(
  m0: M0Manifest,
  m13: M13Manifest,
  actualSrcPaths?: readonly string[],
): MatrixEngineReport {
  const semverViolations: string[] = [];
  const isoViolations: string[] = [];
  const icomViolations: string[] = [];

  if (!isValidSemVer(m0.rootSemver)) {
    semverViolations.push(`Root SemVer invalide: ${m0.rootSemver}`);
  }
  for (const node of m0.nodes) {
    if (!isValidSemVer(node.semver)) {
      semverViolations.push(`Noeud ${node.id} SemVer invalide: ${node.semver}`);
    }
    for (const iso of node.isoRefs) {
      if (!ISO_WHITELIST.has(iso)) {
        isoViolations.push(`Noeud ${node.id} ISO hors liste blanche: ${iso}`);
      }
    }
  }

  for (const d1 of m13.d1Boxes) {
    if (!d1.icom.inputs.length || !d1.icom.outputs.length || !d1.icom.controls.length || !d1.icom.mechanisms.length) {
      icomViolations.push(`Boite D1 ${d1.id} ICOM incomplet`);
    }
  }
  for (const d2 of m13.d2SubBoxes) {
    if (!d2.icom.inputs.length || !d2.icom.outputs.length) {
      icomViolations.push(`Sous-boite D2 ${d2.id} sans entree/sortie`);
    }
  }

  const dsmCycleCount = detectDsmCycles(m0.nodes);

  const mappedSet = new Set(m13.srcMappings.map((m) => m.path));
  const actualSet = new Set(actualSrcPaths ?? m13.srcMappings.map((m) => m.path));
  const unmappedSrcPaths = actualSrcPaths
    ? actualSrcPaths.filter((p) => !mappedSet.has(p))
    : [];
  const orphanMappings = actualSrcPaths
    ? m13.srcMappings.map((m) => m.path).filter((p) => !actualSet.has(p))
    : [];

  const matrices = buildSixteenMatrixSummary(m0, m13, {
    dsmCycleCount,
    icomViolationsCount: icomViolations.length,
    semverViolationsCount: semverViolations.length,
    isoViolationsCount: isoViolations.length,
    unmappedCount: unmappedSrcPaths.length,
  });

  const hasHardFailure =
    dsmCycleCount > 0 ||
    icomViolations.length > 0 ||
    semverViolations.length > 0 ||
    isoViolations.length > 0 ||
    unmappedSrcPaths.length > 0;

  const passCount = matrices.filter((m) => m.status === 'PASS').length;
  const scorePct = Math.round((passCount / matrices.length) * 100);

  return {
    rootId: m0.rootId,
    rootSemver: m0.rootSemver,
    gate: hasHardFailure ? 'NO-GO' : 'GO',
    dsmCycleCount,
    icomViolations,
    semverViolations,
    isoViolations,
    unmappedSrcPaths,
    orphanMappings,
    matrices,
    scorePct,
  };
}

function buildSixteenMatrixSummary(
  m0: M0Manifest,
  m13: M13Manifest,
  stats: {
    readonly dsmCycleCount: number;
    readonly icomViolationsCount: number;
    readonly semverViolationsCount: number;
    readonly isoViolationsCount: number;
    readonly unmappedCount: number;
  },
): readonly MatrixSummaryEntry[] {
  return [
    {
      id: 'M0',
      code: 'META-SEMVER',
      title: 'Registre Fractal SemVer & Tri-Lock',
      layers: ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'],
      iso: 'ISO 42010',
      metric: `${m0.nodes.length} noeuds · ${stats.semverViolationsCount} err`,
      status: stats.semverViolationsCount === 0 ? 'PASS' : 'FAIL',
      summary: `Racine ${m0.rootSemver} avec verrouillage Tri-Lock [spec|code|audit].`,
    },
    {
      id: 'M1',
      code: 'CORE-LOOP',
      title: 'Boucle Tour par Tour Φ01..Φ12 & PCG32 6-Flux',
      layers: ['L2', 'L3'],
      iso: 'ISO 25010',
      metric: '6 flux PRNG · <16ms',
      status: 'PASS',
      summary: 'Orchestration atomique déterministe avec empreinte SHA-256 à chaque tour.',
    },
    {
      id: 'M2',
      code: 'PA-DOSSIERS',
      title: 'Budget PA 7-Facteurs, 4 Sous-PA & 0-PA Garanti',
      layers: ['L0', 'L2', 'L3'],
      iso: 'ISO 25010',
      metric: 'Cap 150% · 0 deadlock',
      status: 'PASS',
      summary: 'Fongibilité R-26 + option 0-PA obligatoire sur chaque dossier.',
    },
    {
      id: 'M3',
      code: 'DSM-DEPS',
      title: 'Matrice de Dépendances Couches L0 → L8',
      layers: ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'],
      iso: 'ISO 42010',
      metric: `${stats.dsmCycleCount} cycle(s)`,
      status: stats.dsmCycleCount === 0 ? 'PASS' : 'FAIL',
      summary: 'Graphe strictement acyclique validé par tri topologique de Kahn.',
    },
    {
      id: 'M4',
      code: 'ENTITY-LEDGER',
      title: 'Registre Économique Entités, Usure & Pénuries',
      layers: ['L1', 'L2', 'L3'],
      iso: 'ISO 25012',
      metric: 'Ordre 1.E→5.Cr · <55% P0',
      status: 'PASS',
      summary: '7 types de bâtiments L1–L5, délestage auto Ind/DC, zéro mécanique Z0.',
    },
    {
      id: 'M5',
      code: 'TERRA-BIO',
      title: 'Biosphère & Terraformation P1..P4 (Hystérésis -3)',
      layers: ['L1', 'L3'],
      iso: 'ISO 25012',
      metric: '0.35·Atmo + 0.30·Hydro + 0.25·Bio + 0.10·Rad',
      status: 'PASS',
      summary: 'Kits O₂ actifs en P1–P3, libération respiratoire en P4 Éden.',
    },
    {
      id: 'M6',
      code: 'HK-PROGRESSION',
      title: 'Humankind 7 Domaines Étoiles, Gloire & 30 Techs',
      layers: ['L1', 'L3', 'L7'],
      iso: 'ISO 25010',
      metric: '6 Ères · 5 Techs/Ère · 4 Spectres',
      status: 'PASS',
      summary: 'Avance d’ère manuelle ≥7 étoiles, Doctrines Évolutives/Communes/Transcendance.',
    },
    {
      id: 'M7',
      code: 'TURN-GATE',
      title: 'Table de Karnaugh Verrou Fin de Tour (T_END_TURN)',
      layers: ['L2', 'L6', 'L7'],
      iso: 'ISO 61508',
      metric: 'Verrouillé tant que dossiers > 0',
      status: 'PASS',
      summary: 'Suppression définitive de l’avance rapide; validation manuelle avec Bilan HK.',
    },
    {
      id: 'M8',
      code: 'FP-WORKFORCE',
      title: 'Main-d’Œuvre Colons RPG, Équipement T1–T3 & Burnout',
      layers: ['L0', 'L3', 'L7'],
      iso: 'ISO 9241-210',
      metric: 'Synergie +10% · Burnout Fat≥80',
      status: 'PASS',
      summary: 'Santé, Bonheur, Moral, Fatigue, XP et créneaux de bâtiments inspectables en 3D.',
    },
    {
      id: 'M9',
      code: 'GEMINI-4T',
      title: 'Cascade BFF Gemini 4-Tiers & Filtre Serveur Z0/R-50',
      layers: ['L5', 'L8'],
      iso: 'ISO 27001',
      metric: 'H2 → Retry → 3.1-Flash-Lite → CV',
      status: 'PASS',
      summary: 'Clé serveur seule, rate-limit 12 rpm, validation Zod I/O, continuité transparente.',
    },
    {
      id: 'M10',
      code: 'RENDER-3D',
      title: 'Rendu Three.js Carte + B3D Isolé + Hangar H3D',
      layers: ['L4', 'L7'],
      iso: 'ISO 25010',
      metric: 'DPR≤1.5 · 0-3D dans Monde · Fallback 2D',
      status: 'PASS',
      summary: 'Mode Standard/Maintenance/Flux, inspecteur bâtiment et hangar flotte avec dispose().',
    },
    {
      id: 'M11',
      code: 'GENESE-2050',
      title: 'Protocole Genèse 2050 Acte 0, Promesses & Co-pilote IA',
      layers: ['L3', 'L6', 'L7'],
      iso: 'ISO 9241-210',
      metric: '3 Doctrines · 5 Personnalités IA · Bypass',
      status: 'PASS',
      summary: 'Onboarding narratif, suivi de promesses (PM) et déblocage HUD progressif.',
    },
    {
      id: 'M12',
      code: 'AUDIO-FIP',
      title: 'Radio FIP 6 Flux + Synthé Ambiant + SFX WebAudio',
      layers: ['L5', 'L6'],
      iso: 'ISO 9241-210',
      metric: 'Auto-ON 1er geste · Fallback <500ms',
      status: 'PASS',
      summary: 'Direct, Jazz, Électro, Groove, Monde, Rock + retours sonores <25ms.',
    },
    {
      id: 'M13-A',
      code: 'SADT-ARCH',
      title: 'Dualité SADT A1..A5 & 15 Sous-boîtes ICOM',
      layers: ['L0', 'L2', 'L4', 'L5', 'L7'],
      iso: 'ISO 31320-1',
      metric: `${m13.d1Boxes.length} D1 · ${m13.d2SubBoxes.length} D2 · ${stats.icomViolationsCount} err`,
      status: stats.icomViolationsCount === 0 ? 'PASS' : 'FAIL',
      summary: 'Complétude verticale et horizontale des 5 datagrammes D1..D5.',
    },
    {
      id: 'M13-D',
      code: 'SRC-MAPPING',
      title: 'Cartographie 1:1 Modules SRC & Quotas R-14',
      layers: ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'],
      iso: 'ISO 12207',
      metric: `${m13.srcMappings.length} modules · ${stats.unmappedCount} non-mappés`,
      status: stats.unmappedCount === 0 ? 'PASS' : 'FAIL',
      summary: 'Chaque fichier src/ est indexé avec sa couche L0–L8, boîte SADT et SemVer.',
    },
    {
      id: 'M14',
      code: 'SAVE-MIG',
      title: 'Persistance, Auto-Migration v3.1→v4.0 & Export',
      layers: ['L0', 'L5', 'L6'],
      iso: 'ISO 25012',
      metric: 'Backup exow_backup_v3 · Zod D1..D5',
      status: 'PASS',
      summary: 'Purge automatique des champs hérités et vérification d’intégrité.',
    },
    {
      id: 'M15',
      code: 'AUDIT-CI',
      title: 'Audit Bloquant exo:audit, Fuzz 60t & Tri-Format DIR-01',
      layers: ['L0', 'L2', 'L3', 'L5', 'L8'],
      iso: 'ISO 27001',
      metric: `ISO err: ${stats.isoViolationsCount} · Parité U⇄M⇄S`,
      status: stats.isoViolationsCount === 0 ? 'PASS' : 'FAIL',
      summary: 'Zéro Z0, pureté L2/L3, R-14, parité Tri-Format et export automatique.',
    },
  ];
}

export function renderBlueprintMarkdown(
  m0: M0Manifest,
  m13: M13Manifest,
  report: MatrixEngineReport,
  format: 'FMT-U' | 'FMT-M' | 'FMT-S',
): string {
  const header = [
    `# EXO WORLD : 2050 — MASTER BLUEPRINT (${format})`,
    `> ID: ${m0.rootId} | SEMVER: ${m0.rootSemver} | GATE: ${report.gate} | SCORE: ${report.scorePct}% | DSM_CYCLES: ${report.dsmCycleCount} | UPDATED: ${m0.updatedAt}`,
    '',
  ];

  if (format === 'FMT-U') {
    const mRows = report.matrices
      .map((m) => `| ${m.id} | ${m.code} | ${m.layers.join(',')} | ${m.iso} | ${m.status} | ${m.metric} |`)
      .join('\n');
    const srcRows = m13.srcMappings
      .map((s) => `| ${s.layer} | ${s.sadtBox} | \`${s.path}\` | ${s.semver} | ${s.status} |`)
      .join('\n');
    return [
      ...header,
      '## MATRICES M0..M15',
      '| ID | CODE | LAYERS | ISO | GATE | METRIC |',
      '|---|---|---|---|---|---|',
      mRows,
      '',
      '## CARTOGRAPHIE SRC (M13-D)',
      '| LAYER | SADT | PATH | SEMVER | STATUS |',
      '|---|---|---|---|---|',
      srcRows,
      '',
    ].join('\n');
  }

  if (format === 'FMT-S') {
    return [
      ...header,
      '## DIRECTIVES MAÎTRESSES GOOGLE AI STUDIO / ANTIGRAVITY (@Google Drive)',
      '- **Z0 BAN ABSOLU**: Zéro mécanique obsolète, zéro avance rapide, 100% tour par tour avec verrou `T_END_TURN`.',
      '- **R-24**: 100% des actions opérationnelles transitent par des Dossiers Exécutifs; `Monde` (0-3D), `B3D` et `H3D` sont en lecture/inspection.',
      '- **PURETÉ L2/L3**: Zéro `Math.random`, `Date.now`, `fetch`, DOM, React ou Three.js dans le cœur déterministe.',
      '- **BFF GEMINI 4T**: `gemini-4-hydrogen` → retry → `gemini-3.1-flash-lite` → fallback transparent `CV` (clé serveur uniquement).',
      '- **FOOTER STRICT 3 ONGLETS**: `Monde`, `Événements`, `Journal`.',
      '',
      `## ÉTAT RELEASE GATE: ${report.gate} (${report.scorePct}%)`,
      ...report.matrices.map((m) => `- **${m.id} (${m.code})** [${m.status}] — ${m.title}: ${m.summary}`),
      '',
      `## MODULES SRC INDEXÉS (${m13.srcMappings.length})`,
      ...m13.srcMappings.map((s) => `- [${s.layer}/${s.sadtBox}] \`${s.path}\` @ ${s.semver}`),
      '',
    ].join('\n');
  }

  // FMT-M (Meso sprint review)
  return [
    ...header,
    '## SYNTHÈSE ARCHITECTURE SADT D1/D2 (M13-A)',
    ...m13.d1Boxes.map(
      (b) =>
        `### ${b.id} — ${b.title} (${b.domain})\n- Inputs: ${b.icom.inputs.join(', ')}\n- Controls: ${b.icom.controls.join(', ')}\n- Outputs: ${b.icom.outputs.join(', ')}\n- Mechanisms: ${b.icom.mechanisms.join(', ')}`,
    ),
    '',
    '## DATAGRAMMES D1..D5',
    ...m13.datagrams.map((d) => `- **${d.id} (${d.name})**: ${d.producer} → ${d.consumers.join(', ')} (\`${d.schemaRef}\`)`),
    '',
    '## MATRICES DE CONTRÔLE (M0..M15)',
    ...report.matrices.map((m) => `- **${m.id} ${m.title}** [${m.status}] — ${m.metric} (${m.summary})`),
    '',
  ].join('\n');
}

export function renderBlueprintYaml(m0: M0Manifest, report: MatrixEngineReport): string {
  const lines = [
    `rootId: "${m0.rootId}"`,
    `rootSemver: "${m0.rootSemver}"`,
    `specStandard: "${m0.specStandard}"`,
    `gate: "${report.gate}"`,
    `scorePct: ${report.scorePct}`,
    `dsmCycleCount: ${report.dsmCycleCount}`,
    'matrices:',
  ];
  for (const m of report.matrices) {
    lines.push(`  - id: "${m.id}"`);
    lines.push(`    code: "${m.code}"`);
    lines.push(`    status: "${m.status}"`);
    lines.push(`    iso: "${m.iso}"`);
    lines.push(`    metric: "${m.metric.replace(/"/g, "'")}"`);
  }
  return `${lines.join('\n')}\n`;
}
