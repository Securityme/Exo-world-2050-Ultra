import { z } from 'zod';

/**
 * [L0] NORM-EXW v3.0.0 | XSC-CUBE (Space 1: 6 Orthogonal Engineering Axes) ⊥ G-CUBE (Space 2: 5 Gameplay Scales)
 * Strict L0 Zod SSOT contract validating:
 *  1. Two strictly separated spaces (XSC-CUBE 6D ⊥ G-CUBE 5D)
 *  2. Zero legacy prefix collisions (N0..N6, D1..D5, P0..P7, P-I..VI)
 *  3. Strict NF EN ISO 7573 7-class separation (R-03 zero inter-class fusion)
 *  4. RTM-XSC Requirements Traceability Matrix integrity
 */

// --- SemVer Contracts (V0..V6 Hierarchisation) ---
export const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
export const SemVerStringSchema = z.string().regex(SEMVER_REGEX, 'Invalid SemVer 2.0.0 string');
export const DocSemVerSchema = z.string().regex(/^(0|[1-9]\d*)\.\d+\.\d+(?:-[A-Z0-9.-]+)?$/);
export const NormSemVerSchema = z.literal('NORM-EXW-3.0.0');

// --- SPACE 1 SUB-SCHEMAS: XSC-CUBE (AXE-1 .. AXE-6) ---
export const DocVerticalDepthSchema = z.enum(['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6']);
export const DocHorizontalAxisSchema = z.enum(['H0', 'H1', 'H2', 'H3', 'H4']);
export const DocPartitionIdSchema = z.enum([
  'PART-I',
  'PART-II',
  'PART-III',
  'PART-IV',
  'PART-V',
  'PART-VI',
]);
export const DocPivotIdSchema = z.enum([
  'PIV-0',
  'PIV-1',
  'PIV-2',
  'PIV-3',
  'PIV-4',
  'PIV-5',
  'PIV-6',
  'PIV-7',
]);

export const MasterRefSchema = z.enum(['CdCF', 'GDD', 'MAD', 'DAT', 'MBE', 'DMT-SW']);
export const Iso7573ArtifactClassSchema = z.enum([
  'FEAT',
  'MOD',
  'CMP',
  'PLG',
  'TLS',
  'SCR',
  'EXT',
]);
export const SrcLayerSchema = z.enum(['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8']);

export const ApGateSchema = z.enum(['AP-0', 'AP-1', 'AP-2', 'AP-3', 'AP-4']);
export const GemmaStateSchema = z.enum(['F1', 'F2', 'A1', 'A2', 'A5', 'GEMMA-D1']);
export const SemverPropagationModeSchema = z.enum(['ISOLE', 'BULLE', 'CASCADE']);
export const TriLockBitSchema = z.union([z.literal(0), z.literal(1)]);
export const ZoomLevelSchema = z.enum(['Z1', 'Z2', 'Z3', 'Z4']);

export type Iso7573ArtifactClass = z.infer<typeof Iso7573ArtifactClassSchema>;
export type SrcLayer = z.infer<typeof SrcLayerSchema>;

export const ZOOM_REQUIRED_MATRIX_COUNT: Readonly<Record<z.infer<typeof ZoomLevelSchema>, number>> = {
  Z1: 5,
  Z2: 3,
  Z3: 2,
  Z4: 1,
} as const;

export const ISO7573_CLASS_SPECS: Readonly<
  Record<Iso7573ArtifactClass, { readonly prefix: string; readonly label: string }>
> = {
  FEAT: { prefix: 'FEAT-', label: 'Fonctionnalité métier / Système gameplay' },
  MOD: { prefix: 'MOD-', label: 'Module logiciel pur / Contrat / Store / Pipeline' },
  CMP: { prefix: 'CMP-', label: 'Composant d’interface UI ou Vue 3D' },
  PLG: { prefix: 'PLG-', label: 'Plugin / Adapter / Pont moteur 3D & Worker' },
  TLS: { prefix: 'TLS-', label: 'Outil d’audit, d’analyse ou de validation CI' },
  SCR: { prefix: 'SCR-', label: 'Script d’orchestration, de synchronisation ou de build' },
  EXT: { prefix: 'EXT-', label: 'Connecteur externe (Firebase, Drive, GitHub, API BFF)' },
} as const;

export const XscAxe1DocSchema = z.object({
  depth: DocVerticalDepthSchema,
  d_restant: z.number().int().min(0).max(6),
  part: DocPartitionIdSchema,
  pivot: DocPivotIdSchema,
  h_active: z.array(DocHorizontalAxisSchema).min(1),
});

export const XscAxe2TaxoSchema = z.object({
  ref: z.array(MasterRefSchema).min(1),
  class_iso7573: z.array(Iso7573ArtifactClassSchema).min(1),
  archetypes: z.array(z.string().regex(/^ARCH-[A-Z0-9-]+$/)).default([]),
  instances: z.array(z.string().min(2)).default([]),
});

export const XscAxe3ArchSchema = z.object({
  layers: z.array(SrcLayerSchema).min(1),
  fs4x_slice: z.string().min(2),
  truth_rank: z.string().regex(/^R-09:(L[0-8]|PROSE)$/),
  src_paths: z.array(z.string().regex(/^src\/[A-Za-z0-9_./-]+$/)).optional(),
});

export const XscAxe4GovSchema = z.object({
  holon: z.string().regex(/^C[1-3]\.Q[1-4]\.W[+-]$/),
  ring: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  ap_gate: ApGateSchema,
  trl: z.number().int().min(1).max(9),
  gemma: GemmaStateSchema,
  tri_lock: z.tuple([TriLockBitSchema, TriLockBitSchema, TriLockBitSchema]),
  semver_mode: SemverPropagationModeSchema,
});

export const XscAxe5OrgSchema = z.object({
  laniakea: z.string().regex(/^LAN:\/\/O[0-6](?:\.5)?:[A-Z0-9_/:.-]+$/),
  filament: z.string().regex(/^FIL:\/\/[A-Z0-9-]+$/),
  skill_bridge: z.string().min(3),
});

export const XscAxe6LlmSchema = z.object({
  zoom: ZoomLevelSchema,
  mode_dprof: z.string().min(3),
  fmt_m_cap: z.number().int().min(100).max(20000),
  posture: z.string().min(3),
  hbdi: z.string().min(1),
  disc: z.string().min(1),
  enn: z.string().min(1),
  temp: z.number().min(0).max(1),
  thinking: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});

export const XscCube6DSchema = z
  .object({
    axe_1_doc: XscAxe1DocSchema,
    axe_2_taxo: XscAxe2TaxoSchema,
    axe_3_arch: XscAxe3ArchSchema,
    axe_4_gov: XscAxe4GovSchema,
    axe_5_org: XscAxe5OrgSchema,
    axe_6_llm: XscAxe6LlmSchema,
  })
  .superRefine((cube, ctx) => {
    const vNum = Number(cube.axe_1_doc.depth.slice(1));
    const expectedRestant = 6 - vNum;
    if (cube.axe_1_doc.d_restant !== expectedRestant) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['axe_1_doc', 'd_restant'],
        message: `ISO 2145 invariant violated: d_restant (${cube.axe_1_doc.d_restant}) must equal 6 - ${vNum} (${expectedRestant})`,
      });
    }

    // R-03: No duplicate ISO 7573 class entries inside a node's axe_2_taxo
    const seenClasses = new Set<string>();
    for (const cls of cube.axe_2_taxo.class_iso7573) {
      if (seenClasses.has(cls)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['axe_2_taxo', 'class_iso7573'],
          message: `Duplicate ISO 7573 class "${cls}" in axe_2_taxo`,
        });
      }
      seenClasses.add(cls);
    }

    // Archetype vs Instance strict separation: no ARCH-* token allowed in instances
    for (const inst of cube.axe_2_taxo.instances) {
      if (inst.startsWith('ARCH-')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['axe_2_taxo', 'instances'],
          message: `Archetype/Instance collision: "${inst}" must live in archetypes[], not instances[]`,
        });
      }
    }

    const xscTokens = [
      cube.axe_1_doc.depth,
      cube.axe_1_doc.part,
      cube.axe_1_doc.pivot,
      ...cube.axe_1_doc.h_active,
      ...cube.axe_2_taxo.class_iso7573,
      ...cube.axe_2_taxo.instances,
      ...cube.axe_3_arch.layers,
      cube.axe_4_gov.gemma,
    ];
    for (const hit of detectPrefixCollisions(xscTokens)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['axe_1_doc'],
        message: `XSC-CUBE legacy collision "${hit.token}" (${hit.legacyGroup}) -> use ${hit.canonicalReplacement}`,
      });
    }
  });

// --- SPACE 2: G-CUBE (5 Isolated Gameplay Domain Scales — V4..V5 x L1..L4/L7 only) ---
export const GCubeSpatialScaleSchema = z.enum(['S-0', 'S-1', 'S-2', 'S-3', 'S-4']);
export const GCubeTemporalScaleSchema = z.string().regex(/^(T[0-5](\/GL-[0-5])?|CYC-(0[1-9]|10))$/);
export const GCubeAtmoDivisionSchema = z.enum([
  'ATMO-D1',
  'ATMO-D2',
  'ATMO-D3',
  'ATMO-D4',
  'ATMO-D5',
]);
export const GCubeDecisionScaleSchema = z
  .string()
  .regex(/^(PRIO-P0(:[A-Z0-9_]+)?|C[1-5](:[A-Z0-9_]+)?|PA)$/);
export const GCubeEthicsScaleSchema = z.string().min(2);

export const GCubeOverlaySchema = z
  .object({
    g1_spatial: z.array(GCubeSpatialScaleSchema).min(1),
    g2_temporal: z.array(GCubeTemporalScaleSchema).min(1),
    g3_atmo: z.array(GCubeAtmoDivisionSchema).default([]),
    g4_decision: z.array(GCubeDecisionScaleSchema).default([]),
    g5_ethics: z.array(GCubeEthicsScaleSchema).default([]),
  })
  .superRefine((overlay, ctx) => {
    const gTokens = [
      ...overlay.g1_spatial,
      ...overlay.g2_temporal,
      ...overlay.g3_atmo,
      ...overlay.g4_decision,
    ];
    for (const hit of detectPrefixCollisions(gTokens)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['g1_spatial'],
        message: `G-CUBE legacy collision "${hit.token}" (${hit.legacyGroup}) -> use ${hit.canonicalReplacement}`,
      });
    }
  });

const DOMAIN_CAPABLE_LAYERS = new Set<SrcLayer>(['L1', 'L2', 'L3', 'L4', 'L7']);

export const XscClassificationNodeSchema = z
  .object({
    inode: z.string().regex(/^K0:\/\/PIV-[0-7]-[A-Z0-9-]+$/),
    iec_81346: z.string().regex(/^=[A-Z0-9.]+-[A-Z0-9_]+\+[A-Z0-9_]+$/),
    sec_semver: SemVerStringSchema.optional(),
    meta_semver: SemVerStringSchema.optional(),
    xsc_cube_6d: XscCube6DSchema,
    g_cube_overlay: GCubeOverlaySchema.optional(),
  })
  .superRefine((node, ctx) => {
    if (!node.g_cube_overlay) return;
    if (node.xsc_cube_6d.axe_1_doc.depth === 'V0') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['g_cube_overlay'],
        message:
          'Space separation invariant (XSC-CUBE ⊥ G-CUBE): V0 root nodes cannot carry g_cube_overlay',
      });
    }
    const hasDomainLayer = node.xsc_cube_6d.axe_3_arch.layers.some((layer) =>
      DOMAIN_CAPABLE_LAYERS.has(layer),
    );
    if (!hasDomainLayer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['g_cube_overlay'],
        message:
          'Space separation invariant (XSC-CUBE ⊥ G-CUBE): g_cube_overlay requires at least one domain layer (L1..L4/L7)',
      });
    }
  });

export const Classification6DManifestSchema = z
  .object({
    normSemver: NormSemVerSchema,
    blueprintId: z.literal('DOC-EXW-ARCH-001'),
    docSemver: DocSemVerSchema,
    totalFmtMCap: z.number().int().min(100).max(20000),
    nodes: z.array(XscClassificationNodeSchema).min(1),
  })
  .superRefine((manifest, ctx) => {
    const seenInodes = new Set<string>();
    const seenIec = new Set<string>();
    let allocatedFmtM = 0;

    manifest.nodes.forEach((node, idx) => {
      if (seenInodes.has(node.inode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nodes', idx, 'inode'],
          message: `Duplicate inode "${node.inode}"`,
        });
      }
      seenInodes.add(node.inode);

      if (seenIec.has(node.iec_81346)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nodes', idx, 'iec_81346'],
          message: `Duplicate IEC 81346 designation "${node.iec_81346}"`,
        });
      }
      seenIec.add(node.iec_81346);
      allocatedFmtM += node.xsc_cube_6d.axe_6_llm.fmt_m_cap;
    });

    if (allocatedFmtM > manifest.totalFmtMCap) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['totalFmtMCap'],
        message: `Allocated FMT-M tokens (${allocatedFmtM}) exceed manifest totalFmtMCap (${manifest.totalFmtMCap})`,
      });
    }
  });

// --- NF EN ISO 7573 (7-Class Separation — R-03 Zero Inter-Class Fusion) ---
export const Iso7573ArtifactEntrySchema = z
  .object({
    artifactId: z.string().regex(/^(FEAT|MOD|CMP|PLG|TLS|SCR|EXT)-[A-Z0-9_-]+$/),
    iso7573Class: Iso7573ArtifactClassSchema,
    path: z.string().min(3),
    layer: SrcLayerSchema,
    sadtBox: z.string().regex(/^A[1-5](?:\.[1-9])?$/),
  })
  .superRefine((entry, ctx) => {
    const expectedPrefix = ISO7573_CLASS_SPECS[entry.iso7573Class].prefix;
    if (!entry.artifactId.startsWith(expectedPrefix)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['artifactId'],
        message: `R-03 ISO 7573 class mismatch: "${entry.artifactId}" must start with "${expectedPrefix}" for class ${entry.iso7573Class}`,
      });
    }
  });

export const Iso7573RegistrySchema = z
  .object({
    normSemver: NormSemVerSchema,
    entries: z.array(Iso7573ArtifactEntrySchema).min(1),
  })
  .superRefine((reg, ctx) => {
    const seenIds = new Set<string>();
    const pathToClass = new Map<string, Iso7573ArtifactClass>();

    reg.entries.forEach((entry, idx) => {
      if (seenIds.has(entry.artifactId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['entries', idx, 'artifactId'],
          message: `Duplicate ISO 7573 artifactId "${entry.artifactId}"`,
        });
      }
      seenIds.add(entry.artifactId);

      const prevClass = pathToClass.get(entry.path);
      if (prevClass && prevClass !== entry.iso7573Class) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['entries', idx, 'iso7573Class'],
          message: `R-03 inter-class fusion forbidden: "${entry.path}" assigned to both ${prevClass} and ${entry.iso7573Class}`,
        });
      }
      pathToClass.set(entry.path, entry.iso7573Class);
    });
  });

// --- RTM-XSC Traceability Matrix Schema ---
export const RtmXscRowSchema = z
  .object({
    rowId: z.string().regex(/^RTM-XSC-\d{4}$/),
    inode: z.string().regex(/^K0:\/\/PIV-[0-7]-[A-Z0-9-]+$/),
    iec_81346: z.string().regex(/^=[A-Z0-9.]+-[A-Z0-9_]+\+[A-Z0-9_]+$/),
    artifactId: z.string().regex(/^(FEAT|MOD|CMP|PLG|TLS|SCR|EXT)-[A-Z0-9_-]+$/),
    iso7573Class: Iso7573ArtifactClassSchema,
    layer: SrcLayerSchema,
    sadtBox: z.string().regex(/^A[1-5](?:\.[1-9])?$/),
    srcPath: z.string().regex(/^(src|scripts)\/[A-Za-z0-9_./-]+$/),
    xscPart: DocPartitionIdSchema,
    xscPivot: DocPivotIdSchema,
    hasGCubeOverlay: z.boolean(),
    semver: SemVerStringSchema,
    status: z.enum(['VERIFIED', 'PENDING', 'STUB']),
  })
  .superRefine((row, ctx) => {
    const expectedPrefix = ISO7573_CLASS_SPECS[row.iso7573Class].prefix;
    if (!row.artifactId.startsWith(expectedPrefix)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['artifactId'],
        message: `RTM-XSC R-03 violation: artifactId "${row.artifactId}" does not match class ${row.iso7573Class}`,
      });
    }
    if (row.hasGCubeOverlay && !DOMAIN_CAPABLE_LAYERS.has(row.layer)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hasGCubeOverlay'],
        message: `RTM-XSC space separation violation: layer ${row.layer} cannot carry a G-CUBE overlay`,
      });
    }
  });

export const RtmXscMatrixSchema = z
  .object({
    matrixId: z.literal('RTM-XSC'),
    normSemver: NormSemVerSchema,
    rootSemver: SemVerStringSchema,
    rows: z.array(RtmXscRowSchema).min(1),
  })
  .superRefine((matrix, ctx) => {
    const seenRowIds = new Set<string>();
    const seenPaths = new Set<string>();
    const seenArtifacts = new Set<string>();

    matrix.rows.forEach((row, idx) => {
      if (seenRowIds.has(row.rowId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rows', idx, 'rowId'],
          message: `Duplicate RTM-XSC rowId "${row.rowId}"`,
        });
      }
      seenRowIds.add(row.rowId);

      if (seenPaths.has(row.srcPath)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rows', idx, 'srcPath'],
          message: `Duplicate RTM-XSC srcPath "${row.srcPath}"`,
        });
      }
      seenPaths.add(row.srcPath);

      if (seenArtifacts.has(row.artifactId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rows', idx, 'artifactId'],
          message: `Duplicate RTM-XSC artifactId "${row.artifactId}"`,
        });
      }
      seenArtifacts.add(row.artifactId);
    });
  });

// --- Prefix Collision Detector (NORM-EXW v3.0.0) ---
export interface PrefixCollisionFinding {
  readonly token: string;
  readonly legacyGroup: 'N_SERIES' | 'D_SERIES' | 'P_SERIES';
  readonly canonicalReplacement: string;
}

const AMBIGUOUS_PREFIX_RULES: readonly {
  readonly regex: RegExp;
  readonly legacyGroup: PrefixCollisionFinding['legacyGroup'];
  readonly canonicalReplacement: string;
}[] = [
  {
    regex: /^N[0-6]$/,
    legacyGroup: 'N_SERIES',
    canonicalReplacement: 'V0..V6 (doc) | O0..O6 (Laniakea/org) | T0..T5 (gameplay time)',
  },
  {
    regex: /^D[1-5]$/,
    legacyGroup: 'D_SERIES',
    canonicalReplacement: 'ATMO-D1..D5 (divisions) | ZOD-D1..D5 (L0) | AXE-1..6 | GEMMA-D1',
  },
  {
    regex: /^(?:P[0-7]|P-(?:I|II|III|IV|V|VI))$/,
    legacyGroup: 'P_SERIES',
    canonicalReplacement: 'PART-I..VI | PIV-0..7 | PRIO-P0 / C1..C5 | PLAN-1..3 (purged P1..P4)',
  },
];

export function detectPrefixCollisions(
  tokens: readonly string[],
): readonly PrefixCollisionFinding[] {
  const findings: PrefixCollisionFinding[] = [];
  for (const raw of tokens) {
    const token = raw.trim();
    for (const rule of AMBIGUOUS_PREFIX_RULES) {
      if (rule.regex.test(token)) {
        findings.push({
          token,
          legacyGroup: rule.legacyGroup,
          canonicalReplacement: rule.canonicalReplacement,
        });
        break;
      }
    }
  }
  return findings;
}

export function classifyArtifactPathIso7573(relPath: string): Iso7573ArtifactClass {
  const norm = relPath.replace(/\\/g, '/');
  if (norm.startsWith('scripts/')) {
    return norm.includes('audit') ? 'TLS' : 'SCR';
  }
  if (
    norm.startsWith('src/doc-sync/') ||
    norm.startsWith('src/services/firebase/') ||
    norm.startsWith('src/services/gemini/') ||
    norm.startsWith('src/services/audio/') ||
    norm.startsWith('src/services/api/') ||
    norm.startsWith('src/api/')
  ) {
    return 'EXT';
  }
  if (
    norm.startsWith('src/bridges/') ||
    norm.startsWith('src/adapters/') ||
    norm.startsWith('src/workers/') ||
    norm.startsWith('src/render/')
  ) {
    return 'PLG';
  }
  if (norm.startsWith('src/components/') || norm.startsWith('src/interfaces/') || norm.endsWith('.tsx')) {
    return 'CMP';
  }
  if (norm.startsWith('src/systems/')) {
    return 'FEAT';
  }
  if (norm.includes('audit') || norm.includes('matrix-engine') || norm.includes('doc-mesh')) {
    return 'TLS';
  }
  return 'MOD';
}

export function buildCanonicalArtifactId(
  isoClass: Iso7573ArtifactClass,
  relPath: string,
): string {
  const slug = relPath
    .replace(/\\/g, '/')
    .replace(/^(src|scripts)\//, '')
    .replace(/\.(ts|tsx|mjs|js)$/, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  return `${ISO7573_CLASS_SPECS[isoClass].prefix}${slug}`;
}

export function collectNodeClassificationTokens(
  node: z.infer<typeof XscClassificationNodeSchema>,
): string[] {
  const tokens: string[] = [
    node.xsc_cube_6d.axe_1_doc.depth,
    node.xsc_cube_6d.axe_1_doc.part,
    node.xsc_cube_6d.axe_1_doc.pivot,
    ...node.xsc_cube_6d.axe_1_doc.h_active,
    ...node.xsc_cube_6d.axe_2_taxo.class_iso7573,
    ...node.xsc_cube_6d.axe_3_arch.layers,
    node.xsc_cube_6d.axe_4_gov.gemma,
  ];
  if (node.g_cube_overlay) {
    tokens.push(
      ...node.g_cube_overlay.g1_spatial,
      ...node.g_cube_overlay.g2_temporal,
      ...node.g_cube_overlay.g3_atmo,
      ...node.g_cube_overlay.g4_decision,
    );
  }
  return tokens;
}

export type XscCube6D = z.infer<typeof XscCube6DSchema>;
export type GCubeOverlay = z.infer<typeof GCubeOverlaySchema>;
export type XscClassificationNode = z.infer<typeof XscClassificationNodeSchema>;
export type Classification6DManifest = z.infer<typeof Classification6DManifestSchema>;
export type Iso7573ArtifactEntry = z.infer<typeof Iso7573ArtifactEntrySchema>;
export type Iso7573Registry = z.infer<typeof Iso7573RegistrySchema>;
export type RtmXscRow = z.infer<typeof RtmXscRowSchema>;
export type RtmXscMatrix = z.infer<typeof RtmXscMatrixSchema>;
