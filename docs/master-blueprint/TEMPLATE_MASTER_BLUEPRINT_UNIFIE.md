# GABARIT TEMPLATE MAÎTRE UNIFIÉ — MASTER BLUEPRINT (`TPL-EXW-BP-UNIFIE v3.0.0`)

> **Statut** : Gabarit structurel vierge et normalisé (`NORM-EXW v3.0.0` · `FMT-EXW-001`), **sans contenu métier spécifique**.
> **Sources unifiées (`/docs/`)** : `DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md` (`PART-I..VI`, `1..15`, `ANN-A..N`), `MASTER_BLUEPRINT_FMT-U_*.md`, `MASTER_BLUEPRINT_FMT-S_AISTUDIO_*.md`, `MASTER_BLUEPRINT_FMT-M_*.md`, `MASTER_BLUEPRINT_*.yaml`, `M0_MetaSemVer.json`, `M13_SADT_Mapping.json`, `toc-tensor-6d.yaml`, `classif-6d.yaml` / `classif-6d.json`.

---

## 0. CARTOUCHE ISO 7200, COMMUTATEUR MULTI-VUES & EN-TÊTE MACHINE

### 0.1 Cartouche Souverain (`V0 · EXOW-ROOT`)

| Champ ISO 7200 | Clé Machine | Gabarit / Valeur Attendue |
|---|---|---|
| Identifiant Document | `blueprint_id` | `<DOC-ID>` |
| Norme & Gabarit | `norm_semver` | `NORM-EXW-3.0.0` (`TPL-EXW-BP-UNIFIE v3.0.0`) |
| Version Documentaire | `doc_semver` | `<MAJOR.MINOR.PATCH-MAITRE>` |
| Version Projet (Observée → Cible) | `root_semver` | `<MAJOR.MINOR.PATCH-alpha.N> → <MAJOR.MINOR.PATCH-fs4x>` |
| Porte Release | `release_gate` | `<DRAFT \| REVIEW \| GO \| NO-GO>` (`scorePct: <0..100>%`) |
| Horodatage ISO 8601 | `updated_at` | `<YYYY-MM-DD>` |
| Approbateur Unique (`Ring 3 · O0`) | `approver` | `<IDENTITE_APPROBATEUR>` |
| Politique Moteur 3D | `render_engine_policy` | `<OPT-XX : Moteur Principal + Adaptateur Web>` |
| Politique Budget & Sécurité | `finops_sec_policy` | `<Plafond coût · Zéro secret client · Isolation Partition>` |
| Tri-Lock Global `[D \| C \| S]` | `tri_lock` | `[<0\|1>, <0\|1>, <0\|1>]` (`Doc \| Code \| Sûreté`) |
| Empreinte SHA-256 | `integrity_sha256` | `<sha256:...>` |

### 0.2 Commutateur Tri-Format & Machine (`FMT-MIRROR U ⇄ S ⇄ M ⇄ YAML/JSON`)

| Mode / Vue | Audience / Usage | Cap Tokens | Densité (`D-PROF`) | Artefact Cible |
|---|---|---|---|---|
| `MODE 1 · FMT-U` | Humain / Gouvernance / Architecture complète | `<Illimité>` | `NARRATIF / STANDARD / MATRICIEL` | `docs/DOC-*-MASTER_BLUEPRINT.md` & `docs/master-blueprint/MASTER_BLUEPRINT_FMT-U_<ver>.md` |
| `MODE 1B · FMT-S` | Exécution IA / Studio / CI | `<Moyen>` | `STANDARD / OPERATOIRE` | `docs/master-blueprint/MASTER_BLUEPRINT_FMT-S_*_<ver>.md` |
| `MODE 2 · FMT-M` | LLM Ultra-Dense Matriciel | `≤ 20 000 tok` | `ULTRA_DENSE_MATRICIEL` | `docs/master-blueprint/MASTER_BLUEPRINT_FMT-M_<ver>.md` |
| `MODE 3 · YAML/JSON` | Contrats L0 Zod / Audit Automatique | `<Machine>` | `SSOT_DATA` | `docs/master-blueprint/{MASTER_BLUEPRINT_<ver>.yaml, M0_MetaSemVer.json, M13_SADT_Mapping.json, toc-tensor-6d.yaml, classif-6d.yaml}` |

### 0.3 En-Tête Machine YAML Unifié

```yaml
rootId: "<ROOT-ID>"
blueprintId: "<DOC-ID>"
normSemver: "NORM-EXW-3.0.0"
docSemver: "<MAJOR.MINOR.PATCH-MAITRE>"
projectSemverObserved: "<MAJOR.MINOR.PATCH-alpha.N>"
projectSemverTarget: "<MAJOR.MINOR.PATCH-fs4x>"
activeMode: "<MODE_1_NORMAL_ETENDU | MODE_2_ULTRA_DENSE_MATRICIEL>"
renderEnginePolicy: "<OPT-ENGINE>"
releaseGatePolicy: "STRICT_ZERO_ERROR"
gate: "<GO | NO-GO>"
scorePct: <0..100>
dsmCycleCount: <0>
totalGus3Units: <N>
fmtMTokenAllocated: <int>
fmtMTokenHardCap: 20000
triLockGlobal: [<0|1>, <0|1>, <0|1>]
```

---

## 1. HIÉRARCHISATION SEMVER & ASSAINISSEMENT ONTOLOGIQUE (`M0_MetaSemVer` · `M0-EVOL`)

### 1.1 Purge des Collisions d'Échelles (`NORM-EXW v3.0.0` — 0 Collision)

| Ancien Préfixe Ambigu | Préfixes Canoniques Sans Collision (`NORM-EXW v3.0.0`) | Espace / Axe |
|---|---|---|
| `N0..N6` | `V0..V6` (Profondeur doc ISO 2145) · `O0..O6` (Hiérarchie org) · `T0..T5` / `GL-0..5` (Temps domaine) | `AXE-1` · `AXE-5` · `G-CUBE:G2` |
| `D1..D5` | `ATMO-D1..D5` (Divisions sci) · `ZOD-D1..D5` (Contrats L0) · `AXE-1..6` (Axes 6D) · `GEMMA-D1` (Défaillance) | `G-CUBE:G3` · `L0` · `XSC-CUBE` · `AXE-4` |
| `P0..P7` / `P-I..VI` | `PART-I..VI` (Partitions) · `PIV-0..7` (Pivots TOC) · `PRIO-P0 / C1..C5` (Priorités/Classes) · `PLAN-1..3` (Plans) | `AXE-1` · `G-CUBE:G4` |
| Mélange Infra / Domaine | Séparation stricte `XSC-CUBE` (Espace 1 — Ingénierie 6D) `⊥` `G-CUBE` (Espace 2 — Calque Domaine 5D sur `V4..V5 × L1..L4/L7`) | Transverse |

### 1.2 Les 9 Axes SemVer & Découplage `sec_semver ≠ meta_semver`

| Axe SemVer | Identifiant | Format Canonique | Niveau `V` | Ring / Gate | Règle d'Évolution (`MAJOR.MINOR.PATCH`) |
|---|---|---|---|---|---|
| 1. Racine Projet | `root_semver` | `X.Y.Z[-pre.N]` | `V0` | `Ring 3 (AP-4)` | `M`: rupture archi/contrat · `m`: vague/slice · `p`: correctif |
| 2. Blueprint Maître | `doc_semver` | `X.Y.Z-MAITRE` | `V0` | `Ring 3 (AP-4)` | `M`: refonte partitions · `m`: sections/normes · `p`: errata |
| 3. Norme & Gabarit | `norm_semver` | `NORM-EXW-X.Y.Z` | `V0` | `Ring 3 (AP-4)` | `M`: axe/collision · `m`: champ meta · `p`: libellé |
| 4. Partition | `part_semver` | `PART-N:X.Y.Z` | `V1` | `Ring 3 (AP-3)` | Batch Roll-Up depuis `V2` |
| 5. Section Métier | `sec_semver` | `SEC-XX:X.Y.Z` | `V2` | `Ring 2/3` | Découplé de `meta_semver` |
| 6. Métadonnées | `meta_semver` | `META-XX:X.Y.Z` | `V2` | `Ring 2` | Évolue indépendamment de `sec_semver` |
| 7. Unité `GUS-3` | `sub_semver` | `SUB-X.Y:X.Y.Z` | `V3` | `Ring 2 (O3)` | Soumis à `Damping Rule` avant remontée `V2` |
| 8. Module / Couche / Feature | `node_semver` | `X.Y.Z` (`F-XX`, `L0..L8`) | `V4` | `Ring 2 (AP-2)` | Synchronisé 1:1 avec `M0_MetaSemVer.json` + `FUP-*` |
| 9. Contrat / Règle / Atome | `rule_semver` | `R-XX:X.Y.Z` / `K0-leaf` | `V5..V6` | `Ring 3 (V5)` / `AP-0 (V6)` | `V6` hérite de `V5` |

### 1.3 Propagation Fractale (`M0-EVOL`), `Damping Rule` & `Tri-Lock [D|C|S]`

| Mode `M0-EVOL` | Effet sur `V6 → V0` | Gate Requis |
|---|---|---|
| `ISOLE` | Aucune remontée (`Damping Rule` active sur `PATCH` ou `meta_semver` seul) | `W⁺` (Audit auto) |
| `BULLE ↑` | Remontée contrôlée `V3 → V2 → V1` en Batch Roll-Up (`MINOR`) | `AP-2` + Tests PASS |
| `CASCADE ⚠` | Ré-évaluation globale `Tri-Lock [D\|C\|S]` + parité `U⇄S⇄M` (`MAJOR` / rupture `L0`) | `W⁻` (`Ring 3`) |

### 1.4 Gabarit JSON `M0_MetaSemVer.json`

```json
{
  "rootId": "<ROOT-ID>",
  "rootSemver": "<X.Y.Z-alpha.N>",
  "specStandard": "<DOC-ID vX.Y.Z-MAITRE>",
  "updatedAt": "<YYYY-MM-DD>",
  "releaseGatePolicy": "STRICT_ZERO_ERROR",
  "nodes": [
    {
      "id": "<NODE_ID_L0..L8>",
      "name": "<Nom canonique>",
      "layer": "<L0..L8>",
      "sadtBox": "<A1.0..A5.3>",
      "semver": "<X.Y.Z>",
      "triLock": [1, 1, 1],
      "status": "<ACTIVE | PLANNED | DEPRECATED>",
      "isoRefs": ["<42010>", "<25012>"],
      "matrices": ["<M0>", "<M3>"],
      "deps": ["<NODE_ID_AMONT>"]
    }
  ]
}
```

---

## 2. ARCHITECTURE `META` & `METADATA` (`XSC-CUBE 6D ⊥ G-CUBE 5D`)

### 2.1 Espace 1 — Classification Ingénierie Orthogonale (`XSC-CUBE · AXE-1 à AXE-6`)

| Axe | Dimension | Valeurs Canoniques Autorisées | Invariant |
|---|---|---|---|
| `AXE-1` | Structure & Granularité | Vertical `V0..V6` (`d_restant = 6 - v_depth`) · Horizontal `H0..H4` (`H0` Synthèse, `H1` Normatif, `H2` Fonctionnel, `H3` Technique/SRC, `H4` Tampon) · Topologique `PIV-0..7` | Plafond ISO 2145 strict · `GUS-3` |
| `AXE-2` | Taxonomie Ontologique | 6 Référentiels `{CdCF, GDD, MAD, DAT, MBE, DMT-SW}` · 7 Classes ISO 7573 `{FEAT, MOD, CMP, PLG, TLS, SCR, EXT}` · Formes `{ARCH-*, MAT-*, BLC-*}` | Séparation inter-classes · Archétype `≠` Instance |
| `AXE-3` | Architecture Technique `src/` | Couches `L0..L8` · Cible `FS4X-Kernel` (`shared-kernel/`, `slices/S1..S6`, `platform/`) · Repérage IEC 81346 `=Fonction-Produit+Localisation` | Hiérarchie `R-09` (`L0 > L1 > L2/L3 > L4/L7 > Prose`) · `0` cycle `M3-DSM` |
| `AXE-4` | Gouvernance & Sûreté | Holon `C1..3.Q1..4.W+/-` · `Ring 1..3` · `AP-0..AP-4` · `TRL 1..9` · `GEMMA (F1/F2, A1/A2/A5, GEMMA-D1)` · `Tri-Lock [D\|C\|S]` · `M0-EVOL` | Approbateur `Ring 3` · Audit bloquant |
| `AXE-5` | Organisation & Routage | Laniakea `O0..O6` · Filaments `FIL://...` · Pont `COMP-XX <-> SKL-XX` | Escalade `O±1` · Tags transversaux `K0://`, `LAN://`, `FIL://`, `DOC://`, `SRC://` |
| `AXE-6` | Résolution & Cognition IA | Zoom `Z1` (5 mat.) · `Z2` (3 mat.) · `Z3` (2 mat.) · `Z4` (1 mat.) · `D-PROF` · `FMT-MIRROR` · Posture (`HBDI`, `DISC`, `Enn`, `Temp`, `Thinking`, `fmt_m_cap`) | Parité 1:1 tri-zoom · Unicode pur |

### 2.2 Espace 2 — Calque Domaine Isolé (`G-CUBE · 5 Échelles` — Actif uniquement si couche domaine `L1..L4/L7` et `depth ≠ V0`)

| Échelle | Codes Canoniques | Contrainte Zod L0 (`src/contracts/classification-6d.schema.ts`) |
|---|---|---|
| `G1 · Spatiale` | `S-0..S-4` | `z.enum(['S-0','S-1','S-2','S-3','S-4'])` |
| `G2 · Temporelle` | `T0..T5` (`GL-0..5`) · `CYC-01..10` | Regex `^(T[0-5](\/GL-[0-5])?\|CYC-(0[1-9]\|10))$` |
| `G3 · Divisions` | `ATMO-D1..ATMO-D5` | `z.enum(['ATMO-D1','ATMO-D2','ATMO-D3','ATMO-D4','ATMO-D5'])` |
| `G4 · Décision` | `PRIO-P0[:...]` · `C1..C5[:...]` · `PA` | Regex `^(PRIO-P0(:[A-Z0-9_]+)?\|C[1-5](:[A-Z0-9_]+)?\|PA)$` |
| `G5 · Éthique` | `<Postures / Référentiels>` | `z.string().min(2)` (vide autorisé si hors domaine) |

### 2.3 Matrice d'Allocation par Niveau (`V0 → V6` × `H0..H4`)

| Niveau | `d_restant` | Rôle | `H` Actifs | SemVer Actif | Matrices `1.B` | Stockage |
|---|---|---|---|---|---|---|
| `V0` | `6` | Racine | `H0, H1` | `root_semver`, `doc_semver`, `norm_semver` | `Z1` (5) | Racine + Manifestes SSoT |
| `V1` | `5` | Partition (`PART-I..VI`) | `H0, H1, H2` | `part_semver` | `Z1/Z2` (3..5) | En-tête de Partition |
| `V2` | `4` | Section / Annexe | `H1, H2, H3` | `sec_semver ≠ meta_semver` | `Z1..Z4` (5/3/2/1) | Pattern 4 Temps |
| `V3` | `3` | Sous-Section (`GUS-3`) | `H1..H4` | `sub_semver` (`Damping Rule`) | `M-IV-Mini` + `M-ICOM-Mini` | Dossier `GUS-3` (`_meta/`, `_updates/`, `_sync/`) |
| `V4` | `2` | Feature / Module | `H2, H3` | `node_semver`, `FUP-*` | `M-CONTRACT` | Fiche artefact / En-tête `*.ts` |
| `V5` | `1` | Contrat / Règle | `H1, H3` | `rule_semver` | Ligne clé/valeur (`0` matrice) | Registre / Schéma Zod |
| `V6` | `0` | Atome / Constante | `H3` | `K0-leaf` (hérite `V5`) | Inline pur (`0` matrice) | `Object.freeze` / Token |

### 2.4 Gabarit Répétable d'une Section — Pattern 4 Temps + Miroir IA (`V1..V3`)

```markdown
## <V_NUM>. <TITRE_SECTION> [`<K0://PIV-X-SXX-ID>`]

### <V_NUM>.1.A — Bloc `META` (XSC-CUBE 6D + SemVer + G-CUBE optionnel)
| Axe / Champ | Valeur |
|---|---|
| `inode` / `iec_81346` | `<K0://PIV-X-SXX-ID>` / `<=Fonction-Produit+Localisation>` |
| `AXE-1 (Doc)` | `depth: <V1..V3>` (`d_restant: <5..3>`) · `part: <PART-I..VI>` · `pivot: <PIV-0..7>` · `H: <[H0..H4]>` |
| `AXE-2 (Taxo)` | `ref: <[CdCF\|GDD\|MAD\|DAT\|MBE\|DMT-SW]>` · `iso7573: <[FEAT\|MOD\|CMP\|PLG\|TLS\|SCR\|EXT]>` |
| `AXE-3 (SRC)` | `layers: <[L0..L8]>` · `fs4x_slice: <...>` · `truth_rank: R-09:<L0..L8>` |
| `AXE-4 (Gov)` | `holon: <C..Q..W>` · `ring: <1..3>` · `ap_gate: <AP-0..4>` · `trl: <1..9>` · `gemma: <...>` · `tri_lock: [D,C,S]` |
| `AXE-5 (Org)` | `laniakea: <LAN://...>` · `filament: <FIL://...>` · `skill_bridge: <...>` |
| `AXE-6 (LLM)` | `zoom: <Z1..Z4>` · `mode_dprof: <...>` · `fmt_m_cap: <int>` · `posture: <...>` |
| `SemVer` | `sec_semver: <X.Y.Z>` · `meta_semver: <X.Y.Z>` · `m0_evol: <ISOLE \| BULLE \| CASCADE>` |
| `G-CUBE (si domaine)` | `G1:<...>` · `G2:<...>` · `G3:<...>` · `G4:<...>` · `G5:<...>` |

### <V_NUM>.1.B — Partition `METADATA` (Matrices selon Zoom `Z1..Z4`)
- `[Z1..Z4]` `M-IV` (Identité, Invariants, Dépendances `DOC://`, `SRC://`, `SKL://`)
- `[Z1..Z3]` `M-ICOM` (Inputs · Controls · Outputs · Mechanisms)
- `[Z1..Z2]` `M-VERIF` (Tests unitaires, Portes d'audit, Critères binaires)
- `[Z1]` `M-RISK` (Risques, Modes dégradés `GEMMA`, Garde-fous)
- `[Z1]` `M-DELTA` (Deltas `sec_semver` / `meta_semver` & `FUP-*`)

### <V_NUM>.2.A — Corps Hors-Matrices (`BLC-*`)
- `<BLC-01..08 : Spécifications, schémas, formules pures>`

### <V_NUM>.2.B — Corps Matriciel (`MAT-*`)
| ID | Élément | Contrat `L0` (`ZOD-*`) | Ancrage `SRC://` | Règles (`R-*`/`AR-*`) | SemVer / Statut |
|---|---|---|---|---|---|
| `<ID>` | `<Nom>` | `<schema.ts>` | `<src/...>` | `<R-XX>` | `<X.Y.Z · ACTIVE>` |

### <V_NUM>.3 — Miroir Machine Inline (`[L3 @AI-MIRROR · FMT-M]`)
`@[K0://<ID>|V=<V>|L=<L0..L8>|SLICE=<S>|SEM=<X.Y.Z>|TL=<111>|IN=<...>|CTRL=<...>|OUT=<...>|SRC=<...>]`
```

---

## 3. SOMMAIRE MAÎTRE UNIFIÉ (`ARCH-TOC-7PIVOTS` × `TENSOR-6D` × `PART-I..VI`)

### 3.1 Allocation des Pivots (`PIV-0..7` · `toc-tensor-6d.yaml`)

| Pivot | Partition | Portée Chapitres / Annexes | Unités `GUS-3` | Référentiels | Couches `SRC` | Ring · Zoom | Budget `FMT-M` |
|---|---|---|---|---|---|---|---|
| `PIV-0` | `EXOW-ROOT` | `0.` Cartouche, SemVer, `XSC-CUBE ⊥ G-CUBE`, Sommaire | `<N0>` | `MAD, MBE` | `L0..L8 · root` | `R3 · Z1` | `<Cap>` |
| `PIV-1` | `PART-I` | `1.` Métadonnées, Définition, Stack, Lignage · `2.` Sommaire Fractal | `<N1>` | `CdCF, MAD` | `L0, docs/master-blueprint` | `R3 · Z1` | `<Cap>` |
| `PIV-2` | `PART-II` (A) | `3.` Studio, Skills, App Shell, 3D · `4.1..4.4` Produit & Macro | `<N2>` | `GDD, DAT` | `L1, L2, L7` | `R2 · Z2` | `<Cap>` |
| `PIV-3` | `PART-II` (B) | `4.5..4.6` Divisions, Systèmes Monde · `4.8..4.9` Éthique & Facteur Humain | `<N3>` | `GDD, CdCF, DAT` | `L0..L4, L7` | `R3 · Z1` | `<Cap>` |
| `PIV-4` | `PART-II` (C) + `PART-III` | `4.7` Cœur Décisionnel · `5.` SADT `A-0 / A0 / A1..A5` & Cycles | `<N4>` | `MBE, GDD, DAT` | `L0..L3, L5` | `R3 · Z1` | `<Cap>` |
| `PIV-5` | `PART-IV` (A) | `6.` Arborescence `SRC/` (`L0..L8` → `FS4X`) & `M3-DSM` | `<N5>` | `DAT` | `L0..L8` | `R3 · Z1` | `<Cap>` |
| `PIV-6` | `PART-IV` (B) | `3.3 / 6.2.x` Couches `L4/L6/L7` (UI Shell & Moteur 3D) | `<N6>` | `DAT, DMT-SW` | `L4, L6, L7` | `R2 · Z2` | `<Cap>` |
| `PIV-7` | `PART-IV` (C) + `PART-V` + `PART-VI` | `7.` Matrices (`MC-00`, `SM-*`, `OPT-*`, `M0..M15`) · `8..15` Catalogues/Roadmaps · `ANN-A..N` | `<N7>` | `MBE, DMT-SW, CdCF` | `L5, L8, scripts, docs` | `R3 · Z2` | `<Cap>` |

### 3.2 Squelette Hiérarchique Intégral (`V0..V3` — Sans Contenu Métier)

```text
[V0 | PIV-0 | H0..H1 | Z1] 0. EXOW-ROOT — CARTOUCHE ISO 7200, SEMVER 9-AXES & CLASSIFICATION 6D
├── [V1 | PIV-0 | H0..H1 | Z1] 0.1 Cartouche Souverain & Commutateur Multi-Vues (FMT-U/S/M/YAML)
├── [V1 | PIV-0 | H1     | Z1] 0.2 Hiérarchisation SemVer Unifiée (M0_MetaSemVer · M0-EVOL · Tri-Lock)
└── [V1 | PIV-0 | H1     | Z1] 0.3 Ontologie NORM-EXW v3.0.0 (XSC-CUBE 6D ⊥ G-CUBE 5D · GUS-3)

[V1 | PIV-1 | H0..H2 | Z1] PART-I — CADRE, GOUVERNANCE & SOMMAIRE CONVENTIONNEL
├── [V2 | PIV-1 | H1..H2 | Z1] 1. MÉTADONNÉES, DÉFINITION DU PRODUIT, FRAMEWORK & LIGNAGE
│   ├── [V3 | PIV-1 | H1 | Z2] 1.1 Identification & Gouvernance Documentaire (O0..O6)
│   ├── [V3 | PIV-1 | H2 | Z2] 1.2 Spécifications Conventionnelles (Fiche GDD)
│   ├── [V3 | PIV-1 | H3 | Z1] 1.3 Framework & Stack Technique (L0..L8)
│   └── [V3 | PIV-1 | H0 | Z3] 1.4 Lignage Historique & Liens Sources
└── [V2 | PIV-1 | H0..H1 | Z1] 2. SOMMAIRE GRANULAIRE FRACTAL & PARTITION MÉTADONNÉES (ISO 2145)
    ├── [V3 | PIV-1 | H1 | Z1] 2.1 Profondeur Verticale (V0..V6) & Axes Horizontaux (H0..H4)
    └── [V3 | PIV-1 | H0 | Z1] 2.2 Table des Matières Intégrale avec Partition Métadonnées

[V1 | PIV-2..4 | H1..H3 | Z1..Z2] PART-II — FRAMEWORK APPLICATIF, APP SHELL & SYSTÈMES DU MONDE
├── [V2 | PIV-2/6 | H2..H3 | Z2] 3. FRAMEWORK APPLICATIF, APP SHELL, STUDIO & PIPELINE 3D
│   ├── [V3 | PIV-2 | H1 | Z3] 3.1 Organisation Studio & Hiérarchie Agents (O0..O6)
│   ├── [V3 | PIV-2 | H2 | Z2] 3.2 Architecture Skills & Orchestration IA
│   ├── [V3 | PIV-6 | H2 | Z2] 3.3 App Shell (États, Navigation & Sélecteurs OPT-SHELL)
│   ├── [V3 | PIV-6 | H3 | Z1] 3.4 Bus Tri-Voies, Watchdogs, UI & Dual-Adapter 3D
│   └── [V3 | PIV-6 | H1 | Z3] 3.5 Audit Légal & Bibliothèques d'Assets 3D
└── [V2 | PIV-2..4 | H2..H3 | Z1] 4. VISION PRODUIT, SYSTÈMES DU MONDE & CŒUR DÉCISIONNEL (G-CUBE)
    ├── [V3 | PIV-2 | H2 | Z3] 4.1 Hiérarchie des Inspirations & Domaines
    ├── [V3 | PIV-2 | H2 | Z2] 4.2 Géopolitique & Entités Externes (G1:S-4)
    ├── [V3 | PIV-2 | H2 | Z2] 4.3 Échelle Planétaire & Slots (G1:S-3)
    ├── [V3 | PIV-2 | H2 | Z2] 4.4 Économie Locale ↔ Globale, Ressources & Progression (G1:S-0..S-1)
    ├── [V3 | PIV-3 | H2 | Z1] 4.5 Divisions Scientifiques, Bioclimat & Facteur Humain (G3:ATMO-D1..D5)
    ├── [V3 | PIV-3 | H2 | Z2] 4.6 Cyber, Logistique, Flotte & Découvertes
    ├── [V3 | PIV-4 | H2 | Z1] 4.7 Moteur Décisionnel, PA/Sous-PA, Bilan 4 Pôles & TRIGGER_BUS (G4)
    ├── [V3 | PIV-3 | H2 | Z2] 4.8 Moteur Éthique, Strates Humaines & Pédagogie (G5)
    └── [V3 | PIV-3 | H2 | Z2] 4.9 Systèmes Éthiques / Spirituels Dédiés (G5)

[V1 | PIV-4 | H1..H3 | Z1] PART-III — MOTEUR CENTRAL SADT / IDEF0 & PLAN DIRECTEUR DES CYCLES
└── [V2 | PIV-4 | H1..H3 | Z1] 5. ARCHITECTURE SADT / IDEF0 & CYCLES MULTI-ÉCHELLES
    ├── [V3 | PIV-4 | H1 | Z1] 5.1 Niveau 0 — Actigramme A-0 (Contexte)
    ├── [V3 | PIV-4 | H2 | Z1] 5.2 Niveau 1 — Actigramme Général A0 (A1..A5)
    ├── [V3 | PIV-4 | H2 | Z1] 5.3 Niveau 2 — Matrice ICOM Détaillée (A1.x..A5.x)
    ├── [V3 | PIV-4 | H3 | Z1] 5.4 Formules Déterministes Clés
    └── [V3 | PIV-4 | H2 | Z1] 5.5 Plan Directeur des Cycles (T0..T5, S-0..S-4, CYC-01..10)

[V1 | PIV-5..7 | H1..H3 | Z1] PART-IV — ARCHITECTURE SRC/ & SYSTÈME MATRICIEL ICOM
├── [V2 | PIV-5 | H3 | Z1] 6. ARCHITECTURE CODE SOURCE (SRC/) & CORRESPONDANCE MODULES
│   ├── [V3 | PIV-5 | H3 | Z1] 6.1 Arborescence Plate src/ (L0..L8) → FS4X-Kernel & Dossier /docs/
│   ├── [V3 | PIV-5 | H3 | Z1] 6.2 Spécification Détaillée des 22 Dossiers Niveau 0 (6.2.1..6.2.22)
│   └── [V3 | PIV-5 | H1 | Z1] 6.3 Matrice des Dépendances Autorisées / Interdites (M3-DSM)
└── [V2 | PIV-7 | H1..H3 | Z1] 7. SYSTÈME DE MATRICES RELATIONNELLES, MC-00, SM-01..06, OPT & MX16-ICOM
    ├── [V3 | PIV-7 | H1 | Z2] 7.1 Graphe Matriciel 3NF & MX16-ICOM (M0..M15)
    ├── [V3 | PIV-7 | H2 | Z1] 7.2 Matrice Centrale (MC-00) & Datagrammes ZOD-D1..D5
    ├── [V3 | PIV-7 | H2 | Z1] 7.3 Sous-Matrices Relationnelles ICOM (SM-01..06)
    └── [V3 | PIV-7 | H1 | Z1] 7.4 Sélecteurs Verrouillés (OPT-01..12) & Matrice Pondérée

[V1 | PIV-7 | H1..H4 | Z2] PART-V — CATALOGUES, REGISTRES & ROADMAPS DE PRODUCTION
├── [V2 | PIV-7 | H2 | Z2] 8. CATALOGUE CLASSIFIÉ DES FEATURES (7 Domaines / 7 Classes ISO 7573)
├── [V2 | PIV-7 | H1 | Z1] 9. REGISTRE DES ARBITRAGES VERROUILLÉS (AR-01..XX)
├── [V2 | PIV-7 | H1 | Z1] 10. REGISTRE SOUVERAIN DES RÈGLES (R-01..XX)
├── [V2 | PIV-7 | H4 | Z2] 11. ROADMAP DE PRODUCTION GLOBALE (VAGUE 0..N)
├── [V2 | PIV-7 | H4 | Z2] 12. SOUS-ROADMAP DES ÉVOLUTIONS ACTIVES (FUP-PATTERN)
├── [V2 | PIV-7 | H1 | Z2] 13. MATRICE DE CONFORMITÉ NF / ISO / AFNOR / DMT-SW
├── [V2 | PIV-7 | H3 | Z2] 14. ARCHITECTURE DES SKILLS MODULAIRES & VCS DOCUMENTAIRE
└── [V2 | PIV-7 | H3 | Z2] 15. ESPACE DEV, AUDIT CI/CD & CONNECTIVITÉ MULTI-SURFACES

[V1 | PIV-7 | H3..H4 | Z2..Z3] PART-VI — ANNEXES OPÉRATIONNELLES & MIROIRS (ANN-A..N)
├── [V2 | PIV-7 | H1 | Z2] ANN-A..C — Directives IA, Isolation Partition, Délégation Multi-IA
├── [V2 | PIV-7 | H3 | Z3] ANN-D..G — Amorçage V0, État Initial, Arbo Runtime SRC/, Miroir & Design System
├── [V2 | PIV-7 | H2 | Z3] ANN-H..I — Playtest Déterministe de Référence & Synthèse UX / Bêta
└── [V2 | PIV-7 | H1 | Z1] ANN-J..N — RBAC/API/DB, Migration FS4X, Changelog, Référentiel Compilé & Bus Live
```

---

## 4. ARBORESCENCE `SRC/` & `/docs/` UNIFIÉE (`L0..L8` → `FS4X-KERNEL` · `M3-DSM` · `M13`)

### 4.1 Arborescence Unifiée Racine, `/docs/` SSoT & `src/` Réel

```text
<ROOT>/
├── index.html | metadata.json | package.json | vite.config.ts | server.ts [L8]
├── scripts/                                  # [TLS/SCR] exo-audit.ts, export-trifmt.ts, exo-doc-mesh.ts
├── tests/                                    # [VERIF] Suites unitaires & déterminisme
├── docs/                                     # [SSOT UNIQUE — 0 doublon racine]
│   ├── 00_INDEX_DOCS.md | CHANGELOG.txt | SYSTEM_INSTRUCTION_LIVE.md
│   ├── DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md  # [FMT-U Complet]
│   ├── inter-ia/                             # Bus d'échange & délégations
│   ├── archive/                              # Archives consolidées figées
│   └── master-blueprint/                     # [SSoT Machine] FMT-U/S/M, YAML, M0, M13, toc-tensor-6d, classif-6d, TEMPLATE
└── src/                                      # [CODE SOURCE STRATIFIÉ L0..L8]
    ├── main.tsx / App.tsx / index.css        # Entrée applicative [L7]
    ├── contracts/      [L0]                  # Contrats Zod SSoT (ZOD-D1..D5, classification-6d, toc-7pivots, render-bridge)
    ├── parsers/        [L0/L2/L5]            # Parseurs stricts de frontières
    ├── config/         [L1]                  # Constantes gelées (Object.freeze)
    ├── data/           [L1]                  # Catalogues statiques & manifestes typés
    ├── assets/         [L1]                  # Ressources statiques / SVG
    ├── core/           [L2]                  # Noyau pur déterministe (PRNG, Loop, Triggers, Dispatchers, Routers, Queues)
    ├── guardrails/     [L2/L5]               # Garde-fous bloquants & validation runtime
    ├── utils/          [L2]                  # Utilitaires purs
    ├── systems/        [L3]                  # Logique métier pure (Domaine isolé)
    ├── engine3d/       [L4]                  # Moteur 3D (Unity 6 URP Prefabs/Shaders + Aperçu Web Three.js)
    ├── adapters/       [L4]                  # Interface Dual-Adapter agnostique 3D
    ├── bridges/        [L4/L5]               # Ponts isolés (3D, IA, Cloud, Worker)
    ├── services/       [L5]                  # Services I/O (Matrix Engine M0..M15, BFF, Audio, Persistance, Sync)
    ├── pipelines/      [L5]                  # Orchestrateurs de flux
    ├── retrievers/     [L5]                  # Récupérateurs RAG / Recherche
    ├── doc-sync/       [L5]                  # Synchronisation Code ↔ /docs/master-blueprint/
    ├── worker/         [L5/L6]               # Web Worker asynchrone
    ├── stores/         [L6]                  # Stores d'état réactifs
    ├── hooks/          [L6]                  # Hooks UI métier (≤ 200 L)
    ├── components/     [L7]                  # Composants UI atomiques (≤ 200 L)
    ├── interfaces/     [L7]                  # Écrans principaux, HUD & Sous-écrans (≤ 200 L)
    └── app/            [L8]                  # Routes API serveur & Middlewares
```

### 4.2 Matrice `L0..L8` → `FS4X-Kernel` & `M3-DSM` (0 Cycle)

| Couche | Nœud `M0_MetaSemVer` | Dossiers `src/` | Projection `FS4X-Kernel` | Dépendances Autorisées | Plafond `R-14` |
|---|---|---|---|---|---|
| `L0` | `EXW.L0.CONTRACTS` | `contracts/`, `parsers/` | `shared-kernel/contracts/` | `Aucune` | `≤ 300 L · CC ≤ 12` |
| `L1` | `EXW.L1.CONFIG_DATA` | `config/`, `data/`, `assets/` | `shared-kernel/config-data/` | `L0` | `≤ 300 L` |
| `L2` | `EXW.L2.CORE` | `core/`, `guardrails/`, `utils/` | `shared-kernel/core/` | `L0, L1` | `≤ 300 L · CC ≤ 12` |
| `L3` | `EXW.L3.SYSTEMS` | `systems/` | `slices/S1..S5/` | `L0, L1, L2` | `≤ 300 L · CC ≤ 12` |
| `L4` | `EXW.L4.ENGINE3D` | `engine3d/`, `adapters/`, `bridges/` | `slices/S6-shell-3d/render/` | `L0, L1` | `≤ 300 L · CC ≤ 12` |
| `L5` | `EXW.L5.SERVICES` | `services/`, `pipelines/`, `retrievers/`, `doc-sync/` | `platform/services/` | `L0, L1, L2, L3` | `≤ 250 L · CC ≤ 12` |
| `L6` | `EXW.L6.STORES_HANDLERS` | `stores/`, `hooks/`, `worker/` | `platform/state/` | `L0, L2, L3, L5` | `≤ 200 L · CC ≤ 12` |
| `L7` | `EXW.L7.INTERFACES` | `components/`, `interfaces/`, `App.tsx`, `main.tsx` | `slices/S6-shell-3d/ui/` | `L0, L1, L3 (read), L4, L5, L6` | `≤ 200 L · CC ≤ 10` |
| `L8` | `EXW.L8.BFF_SERVER` | `server.ts`, `app/` | `platform/bff-server/` | `L0` (+ SDK serveur) | `≤ 200 L · CC ≤ 10` |

### 4.3 Cartographie `M13-A` (SADT `A1..A5`) ↔ `M13-D` (SRC) ↔ `ZOD-D1..D5` & `MX16-ICOM` (`M0..M15`)

| Boîte SADT `D1` | Sous-Boîtes `D2` | Datagramme `L0` | Couches `SRC` | Matrices `MX16-ICOM` Associées |
|---|---|---|---|---|
| `A1` | `A1.0..A1.3` | `ZOD-D1` | `L0, L1, L2` | `M0, M1, M3, M7` |
| `A2` | `A2.1..A2.3` | `ZOD-D2` | `L0, L2, L3` | `M2, M7, M11` |
| `A3` | `A3.1..A3.6` | `ZOD-D3` | `L0, L1, L3` | `M4, M5, M6, M8` |
| `A4` | `A4.1..A4.3` | `ZOD-D4` | `L0, L5, L8` | `M9, M12, M14, M15` |
| `A5` | `A5.1..A5.3` | `ZOD-D5` | `L4, L6, L7` | `M10, M12, M13-A, M13-D` |

---

## 5. GABARITS RÉUTILISABLES (ARTEFACTS ISO 7573, `FUP`, REGISTRES, ANNEXES & PORTES CI)

### 5.1 Fiche Artefact 7 Classes `NF EN ISO 7573` (`FEAT | MOD | CMP | PLG | TLS | SCR | EXT`)

```markdown
#### `<CLASSE-XX>` — `<NOM_ARTEFACT>` [`<K0://...>`]
- **Classification** : `V4` · `SemVer: <X.Y.Z>` · `Slice: <S1..S6>` · `Couches: <L0..L8>` · `Statut: <BACKLOG|WIP|ACTIVE|FROZEN>`
- **Contrat `L0`** : `SRC://src/contracts/<fichier>.schema.ts` (`<TypeZod>`)
- **Implémentation** : `SRC://src/<couche>/<fichier>.ts` (`≤ <300|200> L`)
- **Flux ICOM** : `I: <...>` · `C: <R-XX, AR-XX>` · `O: <...>` · `M: <...>`
- **Preuve & Audit** : `tests/<fichier>.test.ts` · Porte `<M0..M15>` · `Tri-Lock: [D,C,S]`
```

### 5.2 Fiche Évolution `FUP-PATTERN v1.0` (`P1_BACKLOG → P7_MERGED`)

| Champ `FUP` | Gabarit |
|---|---|
| `fup_id` / `cible` | `<FUP-XXX>` → `<FEAT-XX / SEC-XX / SRC://...>` |
| `porte_active` | `<P1_BACKLOG \| P2_SPEC_L0 \| P3_IMPL_PURE \| P4_UI_BRIDGE \| P5_TEST_UNIT \| P6_VISUAL_QA \| P7_MERGED>` |
| `impact_semver` | `<ISOLE (PATCH) \| BULLE (MINOR) \| CASCADE (MAJOR)>` |
| `tri_lock_cible` | `[D: <0\|1>, C: <0\|1>, S: <0\|1>]` |
| `critères_acceptation` | `<Critère 1 · Critère 2 · Critère 3>` |

### 5.3 Portes de Validation CI/CD (`DELEG-EXW-001`)

| Porte | Commande | Critère Bloquant (`STRICT_ZERO_ERROR`) |
|---|---|---|
| `G1 · Build` | `npm run build` | `Exit 0` · `0` erreur |
| `G2 · TypeScript Strict` | `npm run lint` | `Exit 0` · `0` erreur |
| `G3 · Tests` | `npm test` | `100 % PASS` |
| `G4 · Audit SSoT & 6D` | `npm run exo:audit` + `npm run exo:taxo:audit` | `17/17 PASS GO` · `0` cycle `M3-DSM` · `0` collision `NORM-EXW v3.0` |
| `G5 · Parité Miroirs` | `npm run exo:sync-bp` + `npm run exo:doc-mesh` | `Tri-Lock [1,1,1]` · `FMT-M ≤ 20 000 tok` |
