import fs from 'node:fs';
import path from 'node:path';

/**
 * [L8 Tooling] EXO WORLD : 2050 — Unified Documentary Mesh Generator (`npm run exo:doc-mesh`)
 * Keeps ZERO duplicate docs at project root (level 0). Writes exclusively inside `docs/`:
 * - `docs/00_INDEX_DOCS.md` (Unified index with Horizontal x Vertical Metadata Partition per section/file)
 * - `docs/CHANGELOG.txt` (Structured Actuel / Demandes / Projeté changelog)
 */
const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, 'docs');

type HorizontalAxis = 'H-GOV' | 'H-ARCH' | 'H-GAME' | 'H-3D' | 'H-DATA' | 'H-OPS';
type VerticalLevel = 'V0' | 'V1' | 'V2' | 'V3';

interface DocEntry {
  readonly relPath: string;
  readonly verticalLevel: VerticalLevel;
  readonly horizontalAxis: HorizontalAxis;
  readonly status: 'ACTIF-MAITRE' | 'SSOT-MACHINE' | 'ACTIF-OPS' | 'ARCHIVE-CONSOLIDÉE';
  readonly owner: string;
  readonly sizeKb: number;
}

function walkDocs(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDocs(full, acc);
    } else if (/\.(md|txt|yaml|json)$/i.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function classifyHorizontalAxis(relPath: string): HorizontalAxis {
  const low = relPath.toLowerCase();
  if (low.includes('contract') || low.includes('m0_') || low.includes('m13_') || low.includes('api_db') || low.includes('firebase')) {
    return 'H-DATA';
  }
  if (low.includes('3d') || low.includes('render') || low.includes('design') || low.includes('pax_historia')) {
    return 'H-3D';
  }
  if (low.includes('gameplay') || low.includes('playtest') || low.includes('beta')) {
    return 'H-GAME';
  }
  if (low.includes('inter-ia') || low.includes('system_instruction') || low.includes('changelog') || low.includes('fup')) {
    return 'H-OPS';
  }
  if (low.includes('architecture') || low.includes('icom') || low.includes('migration')) {
    return 'H-ARCH';
  }
  return 'H-GOV';
}

function classifyVerticalLevel(relPath: string): VerticalLevel {
  const depth = relPath.split('/').length - 1; // docs/file = 1, docs/sub/file = 2, docs/sub/sub/file = 3
  if (relPath === 'docs/DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md' || relPath === 'docs/00_INDEX_DOCS.md') return 'V0';
  if (depth <= 1) return 'V1';
  if (depth === 2) return 'V2';
  return 'V3';
}

function classifyStatus(relPath: string): DocEntry['status'] {
  if (relPath.startsWith('docs/archive/')) return 'ARCHIVE-CONSOLIDÉE';
  if (relPath.startsWith('docs/master-blueprint/')) return 'SSOT-MACHINE';
  if (relPath === 'docs/DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md' || relPath === 'docs/00_INDEX_DOCS.md') return 'ACTIF-MAITRE';
  return 'ACTIF-OPS';
}

function classifyOwner(axis: HorizontalAxis): string {
  switch (axis) {
    case 'H-DATA':
      return 'Data & SSoT';
    case 'H-3D':
      return 'AG-L3-3D-PBR';
    case 'H-GAME':
      return 'Game Systems';
    case 'H-OPS':
      return 'AI Ops / DevOps';
    case 'H-ARCH':
      return 'Lead Architect';
    default:
      return 'Governance QA';
  }
}

function generateUnifiedIndexAndChangelog(): void {
  const files = walkDocs(DOCS_DIR);
  const entries: DocEntry[] = files
    .map((abs) => {
      const relPath = path.relative(ROOT, abs).replace(/\\/g, '/');
      const stat = fs.statSync(abs);
      const horizontalAxis = classifyHorizontalAxis(relPath);
      return {
        relPath,
        verticalLevel: classifyVerticalLevel(relPath),
        horizontalAxis,
        status: classifyStatus(relPath),
        owner: classifyOwner(horizontalAxis),
        sizeKb: Math.max(1, Math.round(stat.size / 1024)),
      };
    })
    .sort((a, b) => a.relPath.localeCompare(b.relPath));

  const active = entries.filter((e) => e.status !== 'ARCHIVE-CONSOLIDÉE');
  const archived = entries.filter((e) => e.status === 'ARCHIVE-CONSOLIDÉE');

  const renderMetaTable = (list: readonly DocEntry[]) => {
    if (list.length === 0) return '_Aucun document classé._\n';
    const header = [
      '| Document (Chemin Relatif) | Niveau V | Axe H | Statut | Owner | Taille |',
      '| :---- | :---- | :---- | :---- | :---- | ----: |',
    ];
    const rows = list.map(
      (e) =>
        `| [\`${e.relPath}\`](${e.relPath.replace(/^docs\//, './')}) | \`${e.verticalLevel}\` | \`${e.horizontalAxis}\` | \`${e.status}\` | ${e.owner} | ${e.sizeKb} Ko |`,
    );
    return [...header, ...rows].join('\n') + '\n';
  };

  const indexMd = `# INDEX DOCUMENTAIRE UNIFIÉ & PARTITION MÉTADONNÉES (H × V) — EXO WORLD : 2050

> Généré automatiquement par \`npm run exo:doc-mesh\` · \`v5.1.0-alpha.1\` · \`DOC-EXW-ARCH-001 v2.14.0-MAITRE\` · **Zéro doublon documentaire au niveau 0**.
> Source de Vérité Humaine Compilée : [\`docs/DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md\`](./DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md) (Sommaire H × V + Annexes A–N).
> Source de Vérité Machine SSoT : \`docs/master-blueprint/\` (\`M0\`, \`M13\`, \`contracts-ssot/\`, projections Tri-Format).

## 0. Sommaire des Partitions Métadonnées (Vertical \`V0..V3\` × Horizontal \`H-*\`)

| Partition Section | Niveau V | Axe H | Périmètre & Source | Statut |
| :---- | :---- | :---- | :---- | :---- |
| \`SEC-0\` | \`V0\` | \`H-GOV\` | Sommaire & Partition Métadonnées Multi-Niveaux | \`ACTIF\` |
| \`SEC-1\` | \`V1\` | \`H-ARCH\` | Documents Actifs & SSoT Machine (\`${active.length}\` artefacts) | \`ACTIF\` |
| \`SEC-2\` | \`V2\` | \`H-OPS\` | Archive Consolidée Compilée dans le Master Blueprint (\`${archived.length}\` artefacts) | \`FIGÉE\` |

## 1. Documents Actifs & SSoT (\`docs/\` + \`docs/master-blueprint/\` + \`docs/inter-ia/\`) (${active.length})

${renderMetaTable(active)}
## 2. Archive Consolidée (Contenu 100 % Compilé dans le Master Blueprint \`v2.14.0-MAITRE\`) (${archived.length})

${renderMetaTable(archived)}`;

  fs.writeFileSync(path.join(DOCS_DIR, '00_INDEX_DOCS.md'), indexMd, 'utf8');

  const changelogTxt = `================================================================================
EXO WORLD : 2050 — CHANGELOG STRUCTURÉ UNIFIÉ (ACTUEL / DEMANDES / PROJETÉ)
Version : v5.1.0-alpha.1 | Master Blueprint : v2.14.0-MAITRE | Date : ${new Date().toISOString().slice(0, 10)}
Emplacement unique : docs/CHANGELOG.txt (zéro doublon à la racine du projet)
================================================================================

[ACTUEL — IMPLÉMENTÉ & VÉRIFIÉ (VAGUES P1 -> P13 + FUP-017 + FUP-018)]
- P1..P3 : Thème Astralis, bouclier Safari/iOS WebKit (< 250 Mo, 100dvh), masquage HUD 100%, Super-Widget Météo/Air 3 Tours, Notifications Header, Firestore Rules déployées.
- P4..P6 : Routeur Gemini 6 Canaux 100% Free Tier (R-68, HTTP 403 hors liste), Honneurs 2 Niveaux, Onglet Monde purifié (5 domaines), Fiche État Souverain.
- P7..P10 : Fiche Colon + Exosuit 3D, Citoyens Frostpunk, Badges Empilés 3 Niveaux + légende (i), 4 Théâtres Militaires, Pression Civile 0..5★, Cité 24-Hex Dual Maglev, Studio Vidéo Climat WebM 0 USD.
- FUP-017 : Fusion totale Niveau 0 (/docs unique sans doublon racine, /docs/master-blueprint/ SSoT, /docs/archive/ figée), Master Blueprint compilé v2.14.0-MAITRE (Sommaire Partition Métadonnées H x V + Annexes A–N), Skills Modulaires & VCS Docs isolé, et Espace Dev 3 Surfaces (AI Studio + Google Drive + GitHub + Bus + Data Agent + Firebase + Vercel).
- FUP-018 : Événements 4+ à 10 choix principaux, mode Multi-Choix Budgété (plafonds PA/Crédits), affectation coéquipiers (spécialité, niveau, fatigue), déblocage conditionnel multi-factoriel, et Bilan partitionné en 4 Pôles (Actions & Chantiers Bâtiments, Économie, Biosphère, Humain/Politique).
- OPT-02 A+ : Priorité Moteur 3D Unity 6 URP Principal (C#, Shader Graph, Burst/IL2CPP, .jslib, 10 Prefabs LOD0–2, Addressables) + Aperçu Web léger Three.js WebGL2 (ville 3D organique non-circulaire/non-rectiligne, éclairage AAA ACES Filmic & RoomEnvironment IBL).

[DEMANDES — INTÉGRÉES SUR CETTE ITÉRATION]
- Fusion et compilation intégrale de /docs et /master-blueprint au niveau 0 sans doublon racine, avec sommaire à partition métadonnées horizontale et verticale.
- Priorité Unity 6 URP Principal (OPT-02 A+ — plus de Unity que de Three.js : pont C#/.jslib, Prefabs, Shader Graph, Burst/IL2CPP) & refonte de la ville 3D organique réaliste.
- Déblocage conditionnel multi-factoriel, événements à choix multiples budgétés avec coéquipiers, et bilan d'événement partitionné par pôles avec actions explicites de construction.
- Snapshots visuels à jour, analyse des captures historiques et artefacts Skills automatisés.

[PROJETÉ — PROCHAINES ÉTAPES POST-V5.1]
- Export multi-campagnes comparatif (courbes de score & d'éthique sur 6 ères).
- Build WebGPU / Metal / Vulkan natif Unity 6 URP (Shader Graph Océans & Nuages Volumétriques).
- Bascule incrémentale Monorepo AAA 8 Couches × 8 Tiers (Annexe K).
`;

  fs.writeFileSync(path.join(DOCS_DIR, 'CHANGELOG.txt'), changelogTxt, 'utf8');
  console.log(
    `[exo:doc-mesh] OK — ${active.length} docs actifs + ${archived.length} archives indexés avec partition métadonnées HxV dans docs/00_INDEX_DOCS.md et docs/CHANGELOG.txt (0 fichier racine).`,
  );
}

generateUnifiedIndexAndChangelog();
