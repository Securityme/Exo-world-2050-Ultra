# **MASTER BLUEPRINT UNIFIÉ — EXO WORLD : 2050**

Identifiant : `DOC-EXW-ARCH-001` \| Version : `v2.14.0-MAITRE` \| Racine Code : `EXOW-ROOT v5.1.0-alpha.1` (`[OBSERVÉ]`) → `v5.2.0 FS4X` (`[CIBLE]`) \| Date : `2026-11-25`  
Balises : `PARTITION-MAITRE DOSSIER-UNIQUE-DOCS-NIVEAU-0 ISO-2145-FRACTAL NORM-EXW-V3-XSC6D-GCUBE5D MATRICES-ICOM-MX16 FMT-EXW-001 APP-JEU-AI-STUDIO SOLO-VS-IA OPT02-APLUS-UNITY6-URP-PRIMARY-THREEJS-WEB GEMINI-FREE-TIER-STRICT-0USD AUTO-TURN-TRIGGER 5-DIVISIONS-BIOHEALTH ETHIQUE-THOMISTE MASLOW-5-STRATES EGLISE-DISCERNEMENT-AR19 NF-AFNOR-DMT-SW SKILLS-VCS-ISOLE EXO-DEV-BRIDGE-3-SURFACES FUP-018-MULTI-FACTOR SOMMAIRE-META-HV`  
---

# **PARTITION I — CADRE, GOUVERNANCE & SOMMAIRE CONVENTIONNEL**

# **1\. MÉTADONNÉES, DÉFINITION DU JEU, FRAMEWORK & LIGNAGE**

# **1.1 Identification & Gouvernance Documentaire**

| Champ Metadonnee | Spécification Technique & Valeurs de Référence | Correspondances |
| :---- | :---- | :---- |
| **Titre Officiel du Jeu** | **EXO WORLD : 2050** (Application de Jeu complète sur Google AI Studio · **Unity 6 URP Principal (`C#/Shader Graph/Burst/.jslib`) + Aperçu Web Three.js** via `SceneDiffPacket` — `OPT-02 A+`, pas un OS virtuel) | `1.2`, `3.3`, `OPT-02 A+` |
| **Identifiant & Version** | `DOC-EXW-ARCH-001` · `v2.14.0-MAITRE` · `NORM-EXW v3.0.0` (`XSC-CUBE 6D ⊥ G-CUBE 5D`) — **Document Maître Unifié Unique (Annexes A–N)** sous `/docs/` (`TEMPLATE_MASTER_BLUEPRINT_UNIFIE.md` · `/docs/master-blueprint/` SSoT machine · `/docs/archive/` figée · `[OBSERVÉ]` `exo-world-2050@5.1.0-alpha.1`, porte `exo:audit` `17/17 PASS GO`) | `6.1`, `11.`, `13.`, `15.` |
| **Architecte Général** | Baptiste Lecoustre (Lead System Architect & Game Director — Approbateur Unique) | `R-25`, `3.1` |
| **Moteur IA Principal** | **Google Gemini API Exclusif (Free Tier Strict 0 USD)** (`gemini-4-hydrogen`, `gemini-3.1-flash-lite`, `gemini-decision-1`, `gemini-embedding-2` + Repli déterministe transparent, rejet HTTP `403` de tout modèle payant) | `AR-01`, `AR-02`, `R-68`, `R-69` |
| **Classification Artefacts** | **7 Classes NF EN ISO 7573** : `FEAT` (Fonctionnalités 01..56) · `MOD` (Modules `src/`) · `CMP` (Composants UI/3D) · `PLG` (Plugins/Adapters) · `TLS` (Outils Audit/CLI) · `SCR` (Scripts Sync/Gates) · `EXT` (Connectors Drive/Firebase/GitHub/Vercel/SQL) | `NF EN ISO 7573`, `13.`, `15.` |
| **Référentiels Normatifs** | **DMT-SW**, **NF ISO/IEC/IEEE 42010** (Architecture L0..L8), **NF ISO/IEC 25010** (Qualité & WebKit `< 250 Mo`), **NF ISO/IEC/IEEE 29148** (Exigences `FUP`/`R-01..69`), **NF Z67-100 / NF203 / NF552** (Tests & Coffre SHA-256), SADT/IDEF0, [FMT-EXW-001](https://docs.google.com/document/d/1dDdh7_rzCM5SphH5WyQF8FkkjdPRX-1MzTOUdKveaX4/edit) | `R-06`, `R-11`, `13.` |
| **Hiérarchie de Vérité & Source Unifiée** | `1. Contrats Zod (src/contracts/)` → `2. Constantes gelées (src/config/)` → `3. Noyaux Purs & SADT (src/core/, src/systems/)` → `4. App Shell & 3D (src/interfaces/, src/engine3d/)` → `5. Prose Unifiée (/docs/DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md)` *(Note : le Notebook Gemini privé `d937d03d-d9c0-4f71-b89e-45506488e5fb` requiert une session interactive authentifiée `AUTH_REQUIRED` ; le présent fichier unifie 100 % des sources vérifiées du workspace)* | `R-01`, `R-09`, `R-12`, `6.2` |

# **1.2 Spécifications Conventionnelles du Jeu (Fiche GDD Intégrée)**

| Axe GDD | Description Exécutive & Invariants | Correspondances |
| :---- | :---- | :---- |
| **Nature du Produit** | Application de Jeu Web/Mobile sur Google AI Studio (`EXO-SHELL` hérité de l'App Shell d'Astralis). | `3.3`, `FEAT-01` |
| **Genre Principal** | **Stratégie 4X & Gestion de Civilisation Pilotée par Décisions** (*Decision-Driven Grand Strategy & Multi-World City-Builder*). | `4.1`, `R-24` |
| **Sous-Genre / Hybride** | **Executive Dispatch 4X** — Fusion de gestion urbaine modulaire (*Anno 2205*), progression par ères & comparaison IA (*Humankind*), économie/prêts/marché (*Cities: Skylines II*), colons (*RimWorld*), dialogues à skill-checks (*Fallout: New Vegas*), PA/Cabinet (*Alliance of the Sacred Suns*) et conquête territoriale par unités multi-niveaux (*AtWar*). | `4.1`, `AR-06`, `AR-07`, `AR-10` |
| **Type de Gameplay** | **Gestion systémique à médiation événementielle (Invariant Maître R-24)** : toute action transformative transite par le **Moteur d'Événements & Dossiers Exécutifs affinables (Section 4.7)** arbitrés par **PA Général \+ 4 Sous-PA Conseillers Présidentiels**, couplée à l'envoi stratégique d'unités de combat multi-niveaux L1–L5 et au moteur de combats déterministe. | `R-24`, `R-26`, `4.6`, `5.4` |
| **Époque & Chronologie** | **2050 – 2180+** en **6 Ères spatiales progressives** (Ère I Horizon 2050 → Ère II Orbite & Lune → Ère III Genèse Martienne → Ère IV Cyber-Industrie → Ère V Exoplanètes Lointaines → Ère VI Suprématie Exosphérique) \+ **Mode Post-Victoire Infini (`OPT-08 : A → C`)** | `R-04`, `OPT-08`, `FEAT-23` |
| **Modèle Temporel** | **Tour par Tour Exécutif (N1) \+ Temps Réel Inter-Tours (0x / 1x / 2x / 4x) à Déclenchement Automatique (AUTO\_TURN\_TRIGGER)** : Décisions stratégiques (PA/Sous-PA, Dossiers, Ordres L1–L5) résolues au tour par tour ; vie de la planète en temps réel pausable pendant 15 ticks journaliers jusqu'au déclenchement auto ou manuel (`MANUAL_END_TURN`). | `R-51`, `R-52`, `5.2` |
| **Univers & Direction Artistique** | **Hard-ish Sci-Fi Solarpunk & Corporatif (*Anno 2205* × *The Universim*)** : superpuissances (OTAN, UE, BRICS+...) en compétition sur lunes & exoplanètes, métropoles lumineuses à ciel ouvert (zéro dôme), globes sphériques vivants et biomes dynamiques. | `4.2`, `4.5`, `R-16` |
| **Caméra & Échelles 3D** | **3D orbitale & tactique sur 3 échelles fluides (`650 ms`)** : Échelle 1 Carte Spatiale & Slots Planétaires ↔ Échelle 2 Globe Planétaire (72 tuiles géodésiques) ↔ Échelle 3 Quartiers Urbains Ouverts. | `R-15`, `FEAT-43`, `FEAT-45` |
| **Plateformes & Modes** | **Mobile-First (iOS / Android)** & **Desktop (Web / Natif)** · **100 % Solo contre 5 Superpuissances IA rivales déterministes** \+ coopération **Super-Alliance IA***(zéro multijoueur en v1.0 — `OPT-12`)* | `3.3`, `OPT-12`, `FEAT-40` |
| **Boucle Principale** | **Observer** (3D \+ Télémétrie \+ Courbes IA) → **Trier** Dossiers (`P0`, `C1..C5`) → **Affiner** (PA/Sous-PA, Ressources, Colon, Module/Prêt, Ordres d'Envoi d'Unités Militaires, Preview 3D) → **Exécuter** (`PCG32` \+ Moteur de Combats) → **Assumer** mutations, conquêtes, échos différés & Ères. | `5.2`, `5.4`, `5.5` |
| **Conditions de Victoire / Défaite** | **Victoires :** Score d'Ères *Humankind*, Biosphère `P4` stabilisée, Monopole Orbital, Suprématie Territoriale / Victoire de Super-Alliance (puis bascule libre vers Mode Infini `C`).  **Défaites :** Référendum perdu / coup d'État, faillite critique irréversible, perte de la capitale ou victoire d'une Superpuissance IA rivale. | `FEAT-23`, `FEAT-31`, `FEAT-38` |

# **1.3 Framework & Stack Technique Verrouillée (7 Couches)**

| Couche Technique | Technologies Retenues & Rôles Architecturaux | Correspondances |
| :---- | :---- | :---- |
| **1\. Runtime & App Shell** | **Google AI Studio Build** · **Next.js 15 (App Router)** · **Turbopack** · **React 19** · **TypeScript 5.7 strict** (`strict`, `noUncheckedIndexedAccess`, zéro `any`) · Stores **Zustand \+ Jotai**. | `R-10`, `3.3`, `FEAT-01` |
| **2\. Interface Tactile & Audio** | **Tailwind CSS v4** · **Framer Motion** · *Glassmorphisme Bento* à **bords lumière biseautés (`135deg`)** · **Fond SVG dynamique à fondus enchaînés (`1 200 ms`)** · **Web Audio API \+ Web Radio FIP** (5 stations, filtre passe-bas par échelle, repli synthétique `< 500 ms`). | `R-54..65`, `FEAT-02`, `FEAT-05..08` |
| **3\. Noyau Simulation Pur** | **TypeScript 100 % pur** (`src/core/`, `src/systems/`) \+ miroir optionnel **C++17** (`.wasm` Web) · `PCG32`, boucle SADT `A3`, `StateHash` `SHA-256` bit-à-bit, zéro I/O. | `R-13`, `R-66`, `R-67`, `FEAT-41`, `FEAT-48` |
| **4\. Rendu 3D AAA Dual-Adapter** | **Adaptateur Souverain (`OPT-02 A+`) :** **Unity 6 URP Principal** (`C#` / Shader Graph / Burst / `.jslib` / Addressables) **+ Aperçu Web Three.js WebGL2/WebGPU** (ACES Filmic, `RoomEnvironment` IBL, éclairage 3 points, ville organique non-circulaire/non-rectiligne, shaders Rayleigh/Mie, contrat `SceneDiffPacket`). | `R-15`, `OPT-02 A+`, `FEAT-43..46` |
| **5\. Cloud, Persistance & RAG SQL** | **Firebase Authentication obligatoire** (JWT, zéro hors-ligne, zéro Supabase) \+ **Cloud Firestore** (profils, lobbies temps réel, sessions) \+ **Cloud SQL PostgreSQL 16** (`Drizzle ORM`, **`pgvector`**, `turn_snapshots` GZIP, `chronicle_turns`). | `R-11`, `AR-01`, `FEAT-42` |
| **6\. Intelligence Artificielle** | **Google Gemini API Exclusif** (`Add Gemini Intelligence` \+ `Add High Thinking`, Dual-Pass `temp 0.70 / 0.0`) \+ **Sas Zod \+ Tri Kahn \+ Parcours BFS** \+ **Gemini Free Tier Strict Governor** (bornage `[-0.15, +0.15]`, bascule déterministe si quota ou `> 6 000 ms`). | `R-68`, `R-69`, `AR-02`, `FEAT-13..15`, `FEAT-47` |
| **7\. Skills Google AI Studio Actifs** | `Create Game` · `Three.js 3D` · `Add Database and Auth` · `Add SQL Database` · `Add Gemini Intelligence` · `Add High Thinking` *(exclusion explicite de `Chatbot` et `Google Chat`)*. | `3.2`, `AR-01`, `AR-02` |

# **1.4 Lignage Historique Complet & Liens vers les Référentiels Sources**

* [HOLON-32 — Architecture Cybernétique VSM 12 Couches](https://docs.google.com/document/d/1teN4xqW0TEOz891igYNn_m7Z9S0R5qToSqUbbKcVHyk/edit) (Juil 2026 : circulation cybernétique Artérielle/Veineuse, VSM, SADT)  
* [Horizon Galactique v42.0.0](https://docs.google.com/document/d/1g_VCHqWXbAICNGh3PaLj5sIQ8F-swgECnG7_3hTCrLI/edit) (Août–Sept 2026 : V.A.R.E., WebKit Memory Shield `< 500 Mo`, Radio FIP DSP)  
* [GALAXIA ULTRA — Master Blueprint Architecture v2.3.0-ED-CASCADE](https://docs.google.com/document/d/1VYloY5OYrQdL-v28ygK7TJ7xsYnaWq85fmeX0GB_l1M/edit) & [GALAXIA ULTRA — Master Compilé FSMS v2.0.0-LTS](https://docs.google.com/document/d/1wuKfbo0DSHb4xwsIeC76alypdmpxNmrx-McfgKn_Ju0/edit) (Sept–Oct 2026 : Invariant Souverain `R-24`, Protocole 0.3 `R-25`, Lignage `R-24..R-69`, Monopole d'Oracle `R-69`)  
* [ExoPlanète : Terraformation v9.1.0](https://docs.google.com/document/d/1fyiuynU9zDxIZfvF1vPevMpiOy23pzL_1i10tVXI26Q/edit) (Oct 2026 : Perspectives P1–P6, 7 flux, terraformation)  
* [DOC-AST-ARCH-001 — Projet Astralis v1.2.0](https://docs.google.com/document/d/1QSbm5s7i0Gi4Ezzy0O31SQUvUYhygSGbt5NIe2PUNHM/edit) (15 Nov 2026 : App Shell 8 écrans, `PCG32`, `SHA-256`, AR-12 DAG 5 paliers, AR-13 RAG Hybride) — Séparation nette de partition établie pour EXO WORLD : 2050 \+ branches dérivées (*ASTRALIS : SOVEREIGN METROPOLIS*, [DOC-VITA-ARCH-001 — VITA-FORGE v1.0.0](https://docs.google.com/document/d/1v-3KhhDldApqL1PvoJU68fpDImTdUFC2O-3QuQEKXIc/edit), *Astralis : Genesis Ultra* & continuité réservée *Astralis vMax v7..v10*).  
* **EXO WORLD : 2050 (`DOC-EXW-ARCH-001` · `v2.10.0-MAITRE`)** — Référentiel Maître Partitionné (Nouvelle Partition Maître Vierge) · Conforme à [FMT-EXW-001](https://docs.google.com/document/d/1dDdh7_rzCM5SphH5WyQF8FkkjdPRX-1MzTOUdKveaX4/edit) · Spécification [SPEC-SRC-DOC-EXW-001](https://docs.google.com/document/d/1Fdt2A51XDSlQ4D1xmwbz9n3ZphWW9IOTp25Me9yckfw/edit) · Canal Inter-IA [BUS-EXW-001](https://docs.google.com/document/d/1YJEEnKUu-JEHbjQto5AhLJFMJx4BOzmCyHWIEaqGoTI/edit) & [TIMELINE-TICKETS-EXW-001](https://docs.google.com/document/d/1yxwlYZSnsTNcedgxY8WEvC_-rfmAU_Q7WNbQnbAbZyQ/edit).

# **2\. SOMMAIRE GRANULAIRE FRACTAL & PARTITION MÉTADONNÉES MULTI-NIVEAUX (ISO 2145 — VERTICAL × HORIZONTAL)**

## **2.1 Règle de Profondeur Verticale (`V0..V3`) & Axes de Partition Horizontale (`H-*`)**

* **Niveaux Verticaux (`V0 → V3`, Plafond ISO 2145 `D_restant = 6 - k`) :**
  * `V0` : **Partition Maître** (`PARTITION I..VI`) — Macro-domaine structurant.
  * `V1` : **Chapitre / Annexe** (`1..15`, `A..N`) — Unité normative autonome.
  * `V2` : **Sous-Section** (`X.Y`, `A.1..N.1`) — Sous-système ou contrat fonctionnel.
  * `V3` : **Granule Technique** (`X.Y.Z`) — Matrice, formule, module dossier ou arbitre verrouillé.
* **Axes Horizontaux (`H-AXIS`, transversalité inter-couches) :**
  * `H-GOV` (Gouvernance, Normes NF/AFNOR, RBAC, Règles `R-01..69`, FUP)
  * `H-GAME` (Gameplay, Dossiers PA, Multi-Facteurs `FUP-018`, Bilan 4 Pôles, Éthique, Économie, Guerre)
  * `H-SIM` (Noyau Pur SADT/IDEF0, Cycles `N0..N5`, `PCG32`, `SHA-256`)
  * `H-3D` (Rendu 3D AAA `OPT-02 A+` Unity 6 URP Principal + Aperçu Web Three.js, Ville Organique, Shaders, Caméra 3 Échelles, Audio)
  * `H-ARCH` (Arborescence `src/`, Couches `L0..L8`, Matrices ICOM `SM-01..06`, Migration Monorepo)
  * `H-DATA` (Firebase, Firestore Rules, Cloud SQL `pgvector`, Gemini Free Tier 0 USD, SSoT `M0/M13`)
  * `H-OPS` (Skills Modulaires, VCS Docs, `EXO-DEV-BRIDGE` 3 Surfaces, Bus Inter-IA, Playtest/Bêta)

## **2.2 Table des Matières Intégrale avec Partition Métadonnées par Section (Tous Niveaux H × V)**

| ID Section | Niveau V | Axe H | Titre de la Section / Sous-Section / Annexe | Couches | SemVer | Statut | Owner |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| `PART-I` | `V0` | `H-GOV` | **PARTITION I — CADRE, GOUVERNANCE & SOMMAIRE CONVENTIONNEL** | `L0..L8` | `2.14.0` | `ACTIF` | `Lead Architect` |
| `1.` | `V1` | `H-GOV` | 1. Métadonnées, Définition du Jeu, Framework & Lignage | `L0..L8` | `2.14.0` | `ACTIF` | `Lead Architect` |
| `1.1` | `V2` | `H-GOV` | 1.1 Identification & Gouvernance Documentaire (`DOC-EXW-ARCH-001`) | `L0/L8` | `2.14.0` | `VERROUILLÉ` | `Lead Architect` |
| `1.2` | `V2` | `H-GAME` | 1.2 Spécifications Conventionnelles du Jeu (Fiche GDD Intégrée) | `L1..L3` | `2.14.0` | `ACTIF` | `Game Director` |
| `1.3` | `V2` | `H-ARCH` | 1.3 Framework & Stack Technique Verrouillée (7 Couches · 100 % Three.js) | `L0..L8` | `2.14.0` | `VERROUILLÉ` | `Lead Architect` |
| `1.4` | `V2` | `H-GOV` | 1.4 Lignage Historique Complet & Référentiels Sources | `L0` | `2.14.0` | `RÉFÉRENCE` | `Lead Architect` |
| `2.` | `V1` | `H-GOV` | 2. Sommaire Granulaire Fractal & Partition Métadonnées Multi-Niveaux | `L0..L8` | `2.14.0` | `ACTIF` | `AG-L2-DOC` |
| `2.1` | `V2` | `H-GOV` | 2.1 Règle de Profondeur Verticale (`V0..V3`) & Axes Horizontaux (`H-*`) | `L0` | `2.14.0` | `NORMATIF` | `AG-L2-DOC` |
| `2.2` | `V2` | `H-GOV` | 2.2 Table des Matières Intégrale avec Partition Métadonnées (`H × V`) | `L0..L8` | `2.14.0` | `ACTIF` | `AG-L2-DOC` |
| `PART-II` | `V0` | `H-GAME` | **PARTITION II — FRAMEWORK APPLICATIF, APP SHELL & SYSTÈMES DU MONDE** | `L1..L7` | `2.14.0` | `ACTIF` | `Game Systems` |
| `3.` | `V1` | `H-3D` | 3. Framework Applicatif, App Shell (`EXO-SHELL`), Studio AA & Pipeline 3D | `L4..L7` | `2.14.0` | `ACTIF` | `AG-L3-3D-PBR` |
| `3.1` | `V2` | `H-GOV` | 3.1 Effectif Studio AA Réel (36 Postes) & Escouade 100 % Gemini | `L8` | `2.14.0` | `ACTIF` | `Producer` |
| `3.1.1` | `V3` | `H-GOV` | 3.1.1 Répartition des 6 Pôles Studio & Correspondance Agents Gemini | `L8` | `2.14.0` | `ACTIF` | `Producer` |
| `3.2` | `V2` | `H-DATA` | 3.2 Architecture Skills Google AI Studio (`Gemini Intelligence` vs `Chatbot`) | `L5/L8` | `2.14.0` | `VERROUILLÉ` | `AI Router` |
| `3.3` | `V2` | `H-ARCH` | 3.3 Adaptation de l'App Shell d'Astralis (`EXO-SHELL` — 8 États Solo) | `L7` | `2.14.0` | `ACTIF` | `UI Lead` |
| `3.3.1` | `V3` | `H-ARCH` | 3.3.1 Tableau de Transposition Astralis → `EXO-SHELL` | `L7` | `2.14.0` | `ACTIF` | `UI Lead` |
| `3.3.2` | `V3` | `H-ARCH` | 3.3.2 Machine à États de Navigation (`EXO-SHELL`) | `L5/L7` | `2.14.0` | `ACTIF` | `UI Lead` |
| `3.3.3` | `V3` | `H-GOV` | 3.3.3 Sélecteurs `OPT-SHELL-01..03` Verrouillés | `L7` | `2.14.0` | `VERROUILLÉ` | `UI Lead` |
| `3.4` | `V2` | `H-3D` | 3.4 Bus Tri-Voies, Bento Biseauté `135deg`, SVG `1200ms`, Radio FIP & 3D | `L4/L7` | `2.14.0` | `ACTIF` | `Tech Art` |
| `3.4.1` | `V3` | `H-SIM` | 3.4.1 Circulation Tri-Voies & Watchdogs (`AR-03`, `R-53`) | `L2/L5` | `2.14.0` | `ACTIF` | `Core Engine` |
| `3.4.2` | `V3` | `H-3D` | 3.4.2 Direction UI (*Bento Biseauté* + *Fond SVG*) & Budgets WebKit `<250Mo` | `L4/L7` | `2.14.0` | `ACTIF` | `Tech Art` |
| `3.5` | `V2` | `H-3D` | 3.5 Audit Légal & Bibliothèques d'Assets 3D Three.js PBR | `L4` | `2.14.0` | `ACTIF` | `AG-L3-3D-PBR` |
| `4.` | `V1` | `H-GAME` | 4. Vision Produit, Hiérarchie des Inspirations & Systèmes du Monde | `L1..L3` | `2.14.0` | `ACTIF` | `Game Director` |
| `4.1` | `V2` | `H-GAME` | 4.1 Hiérarchisation (`P1→P4`) & Classification des 12 Inspirations | `L1` | `2.14.0` | `VERROUILLÉ` | `Game Director` |
| `4.2` | `V2` | `H-GAME` | 4.2 Géopolitique des 6 Superpuissances & Super-Alliance (`AR-04`, `R-27`) | `L3` | `2.14.0` | `ACTIF` | `Diplomacy` |
| `4.3` | `V2` | `H-GAME` | 4.3 Slots Planétaires Débloquables (`1→6`) (`AR-05`) | `L3/L4` | `2.14.0` | `ACTIF` | `World Sim` |
| `4.4` | `V2` | `H-GAME` | 4.4 Économie Villes ↔ État, Prêts, Marché, 18 Ressources, XP & Succès | `L3` | `2.14.0` | `ACTIF` | `Economy Sim` |
| `4.5` | `V2` | `H-GAME` | 4.5 Atmosphère (`P1→P4`), 5 Divisions, BioHealth, Météo & Vitesse PNJ | `L3` | `2.14.0` | `ACTIF` | `Biosphere` |
| `4.5.1` | `V3` | `H-GAME` | 4.5.1 Couplage 5 Divisions Scientifiques, BioHealth (`FEAT-53`) & Cap `P0` (`FEAT-54`) | `L3` | `2.14.0` | `ACTIF` | `Biosphere` |
| `4.6` | `V2` | `H-GAME` | 4.6 Combats 4 Phases, Unités L1–L5, Drones, Cyber Datacenters & Flottes | `L3` | `2.14.0` | `ACTIF` | `Military Sim` |
| `4.7` | `V2` | `H-GAME` | 4.7 Moteur d'Événements, Multi-Facteurs (`FUP-018`) & Bilan 4 Pôles | `L3/L7` | `2.14.0` | `ACTIF` | `Dossiers PA` |
| `4.7.1` | `V3` | `H-GAME` | 4.7.1 Rôle Central & Typologie (Invariant `R-24`, `PCG32` vs Gemini) | `L2/L3` | `2.14.0` | `VERROUILLÉ` | `Dossiers PA` |
| `4.7.2` | `V3` | `H-GAME` | 4.7.2 Les 5 Classes `C1..C5`, File `P0`, Initiative `R-33` & PA/Sous-PA `R-26` | `L3` | `2.14.0` | `ACTIF` | `Dossiers PA` |
| `4.7.3` | `V3` | `H-GAME` | 4.7.3 Atelier 3 Étages, Multi-Choix Budgété, Coéquipiers & Bilan 4 Pôles | `L3/L7` | `2.14.0` | `ACTIF` | `Dossiers PA` |
| `4.7.4` | `V3` | `H-SIM` | 4.7.4 Pipeline Sécurisé, `ΔP_adapt`, Tri Kahn, BFS & `TRIGGER_BUS` | `L2/L5` | `2.14.0` | `ACTIF` | `Core Engine` |
| `4.8` | `V2` | `H-GAME` | 4.8 Moteur Éthique Thomiste, Pyramide de Maslow & Pédagogie 6 Niveaux | `L3/L7` | `2.14.0` | `ACTIF` | `Ethics Sim` |
| `4.8.1` | `V3` | `H-GAME` | 4.8.1 Sources Philosophiques & Éthiques (Saint Thomas d'Aquin) | `L1/L3` | `2.14.0` | `ACTIF` | `Ethics Sim` |
| `4.8.2` | `V3` | `H-GAME` | 4.8.2 Badges de Raisonnement & Posture (`ChoiceReasoningBadge`) | `L3/L7` | `2.14.0` | `ACTIF` | `Ethics Sim` |
| `4.8.3` | `V3` | `H-GAME` | 4.8.3 Pyramide de Maslow & Psychologie Morale (`C4`) | `L3` | `2.14.0` | `ACTIF` | `Ethics Sim` |
| `4.8.4` | `V3` | `H-GAME` | 4.8.4 Contexte de Personnalité Utilisateur & Référentiel (`AR-17`) | `L5/L7` | `2.14.0` | `ACTIF` | `Ethics Sim` |
| `4.8.5` | `V3` | `H-GAME` | 4.8.5 Échelle Pédagogique & Morale à 6 Niveaux (`AR-18`) | `L3` | `2.14.0` | `ACTIF` | `Ethics Sim` |
| `4.9` | `V2` | `H-GAME` | 4.9 Développement de l'Église & Discernement (`FEAT-55/56`, `AR-19`) | `L3` | `2.14.0` | `ACTIF` | `Ecclesia` |
| `PART-III` | `V0` | `H-SIM` | **PARTITION III — MOTEUR CENTRAL SADT / IDEF0 & PLAN DES CYCLES** | `L2/L3` | `2.14.0` | `ACTIF` | `Core Engine` |
| `5.` | `V1` | `H-SIM` | 5. Architecture SADT / IDEF0 Multi-Niveaux du Moteur Central | `L2/L3` | `2.14.0` | `ACTIF` | `Core Engine` |
| `5.1` | `V2` | `H-SIM` | 5.1 Niveau 0 — Actigramme `A-0` (Contexte Boîte Noire Globale) | `L2` | `2.14.0` | `VERROUILLÉ` | `Core Engine` |
| `5.2` | `V2` | `H-SIM` | 5.2 Niveau 1 — Actigramme Général `A0` (`A1..A5`) | `L2/L3` | `2.14.0` | `VERROUILLÉ` | `Core Engine` |
| `5.3` | `V2` | `H-SIM` | 5.3 Niveau 2 — Matrice ICOM Détaillée (`A1` à `A5`) | `L2/L3` | `2.14.0` | `ACTIF` | `Core Engine` |
| `5.4` | `V2` | `H-SIM` | 5.4 Formules Déterministes Clés (`A1.2`, `A2.1`, `A3.2`, `A3.6`) | `L2/L3` | `2.14.0` | `ACTIF` | `Core Engine` |
| `5.5` | `V2` | `H-SIM` | 5.5 Plan Directeur des Cycles, Sous-Cycles & Sous-Sous-Cycles | `L2/L3` | `2.14.0` | `ACTIF` | `Core Engine` |
| `5.5.1` | `V3` | `H-SIM` | 5.5.1 Pyramide Temporelle Imbriquée (`N0 → N5`, `AUTO_TURN_TRIGGER`) | `L2` | `2.14.0` | `ACTIF` | `Core Engine` |
| `5.5.2` | `V3` | `H-3D` | 5.5.2 Matrice Spatiale Multi-Échelles (`S-0 → S-4`) & Couplage Vertical | `L2/L4` | `2.14.0` | `ACTIF` | `World Sim` |
| `5.5.3` | `V3` | `H-SIM` | 5.5.3 Classification Exhaustive des 10 Familles de Cycles Métier | `L3` | `2.14.0` | `ACTIF` | `Core Engine` |
| `5.5.4` | `V3` | `H-SIM` | 5.5.4 Matrice Maîtresse de Coordination Globale | `L2/L3` | `2.14.0` | `ACTIF` | `Core Engine` |
| `5.5.5` | `V3` | `H-SIM` | 5.5.5 Protocole de Synchronisation Déterministe & Anti-Oscillation (`R-51/66`) | `L2` | `2.14.0` | `VERROUILLÉ` | `Core Engine` |
| `PART-IV` | `V0` | `H-ARCH` | **PARTITION IV — ARCHITECTURE SRC/ & MATRICES RELATIONNELLES ICOM** | `L0..L8` | `2.14.0` | `ACTIF` | `Lead Architect` |
| `6.` | `V1` | `H-ARCH` | 6. Architecture Technique du Code Source (`src/`) & Correspondance Modules | `L0..L8` | `2.14.0` | `ACTIF` | `Lead Architect` |
| `6.1` | `V2` | `H-ARCH` | 6.1 Arborescence Unifiée Plate `src/` & Dossier Unique `/docs/` Niveau 0 | `L0..L8` | `2.14.0` | `ACTIF` | `Lead Architect` |
| `6.2` | `V2` | `H-ARCH` | 6.2 Développement Détaillé des 22 Dossiers `src/` (`6.2.1` → `6.2.22`) | `L0..L8` | `2.14.0` | `ACTIF` | `Lead Architect` |
| `6.2.1..6.2.5` | `V3` | `H-SIM` | `src/contracts` (`L0`), `config` & `data` (`L1`), `core` (`L2`), `systems` (`L3`) | `L0..L3` | `2.14.0` | `ACTIF` | `Core Engine` |
| `6.2.6..6.2.7` | `V3` | `H-3D` | `src/engine3d` & `src/adapters` (`L4` — Dual-Adapter Unity 6 URP Principal + Three.js Web `OPT-02 A+`) | `L4` | `2.14.0` | `ACTIF` | `AG-L3-3D-PBR` |
| `6.2.8..6.2.14` | `V3` | `H-ARCH` | `stores`, `services`, `pipelines` (`L5`), `hooks` (`L6`), `components`/`interfaces` (`L7`), `app` (`L8`) | `L5..L8` | `2.14.0` | `ACTIF` | `Full-Stack` |
| `6.2.15..6.2.22` | `V3` | `H-ARCH` | `bridges`, `parsers`, `triggers`, `dispatchers`, `routers`, `retrievers`, `queues`, `guardrails` | `L0..L8` | `2.14.0` | `ACTIF` | `Core Engine` |
| `6.3` | `V2` | `H-GOV` | 6.3 Matrice des Dépendances Autorisées & Interdites (`R-02`, `R-13`) | `L0..L8` | `2.14.0` | `VERROUILLÉ` | `exo:audit` |
| `7.` | `V1` | `H-ARCH` | 7. Système de Matrices Relationnelles, Matrice Centrale & ICOM | `L0..L8` | `2.14.0` | `ACTIF` | `Lead Architect` |
| `7.1` | `V2` | `H-ARCH` | 7.1 Architecture du Graphe Matriciel (Modèle en Étoile 3NF Documentaire) | `L0` | `2.14.0` | `ACTIF` | `Lead Architect` |
| `7.2` | `V2` | `H-ARCH` | 7.2 Matrice de Correspondance Centrale (`MC-00` — 7 Référentiels) | `L0..L8` | `2.14.0` | `ACTIF` | `Lead Architect` |
| `7.3` | `V2` | `H-ARCH` | 7.3 Sous-Matrices Relationnelles avec Flux ICOM (`SM-01` à `SM-06`) | `L2..L7` | `2.14.0` | `ACTIF` | `Lead Architect` |
| `7.3.1..7.3.6` | `V3` | `H-ARCH` | `SM-01` Décision · `SM-02` Physique · `SM-03` Éco · `SM-04` Militaire · `SM-05` Tech · `SM-06` 6 Espaces | `L2..L7` | `2.14.0` | `ACTIF` | `Lead Architect` |
| `7.4` | `V2` | `H-GOV` | 7.4 Sélecteurs d'Options Verrouillés (`OPT-01` à `OPT-12`, dont `OPT-02 A+`) | `L0..L8` | `2.14.0` | `VERROUILLÉ` | `Game Director` |
| `7.4.1` | `V3` | `H-GOV` | 7.4.1 Tableau Maître des 12 Sélecteurs (`OPT-01..12`) | `L0..L8` | `2.14.0` | `VERROUILLÉ` | `Game Director` |
| `7.4.2` | `V3` | `H-GOV` | 7.4.2 Matrice Décisionnelle Pondérée (3 Arbitrages Clés) | `L0..L8` | `2.14.0` | `VERROUILLÉ` | `Game Director` |
| `PART-V` | `V0` | `H-GOV` | **PARTITION V — RÉFÉRENTIELS CATALOGUES, NORMES NF, SKILLS & ROADMAPS** | `L0..L8` | `2.14.0` | `ACTIF` | `QA & Governance` |
| `8.` | `V1` | `H-GAME` | 8. Catalogue Classifié des 56 Features (`FEAT-01` à `FEAT-56`) | `L1..L8` | `2.14.0` | `ACTIF` | `Producer` |
| `8.1..8.7` | `V2` | `H-GAME` | Domaines 1 (Shell/UI) → 7 (Éthique, Maslow, BioHealth, Église) | `L1..L8` | `2.14.0` | `ACTIF` | `Producer` |
| `9.` | `V1` | `H-GOV` | 9. Registre Intégré des 19 Arbitrages (`AR-01` à `AR-19`) | `L0..L8` | `2.14.0` | `VERROUILLÉ` | `Lead Architect` |
| `10.` | `V1` | `H-GOV` | 10. Registre Souverain des 69 Règles (`R-01` à `R-69`) | `L0..L8` | `2.14.0` | `VERROUILLÉ` | `exo:audit` |
| `10.1..10.6` | `V2` | `H-GOV` | `R-01..08` PO · `R-09..23` Structure · `R-24..35` PA · `R-36..50` Physique · `R-51..65` UI · `R-66..69` IA | `L0..L8` | `2.14.0` | `VERROUILLÉ` | `exo:audit` |
| `11.` | `V1` | `H-OPS` | 11. Roadmap de Production Globale du Jeu (`VAGUE 0` → `VAGUE 5`) | `L0..L8` | `2.14.0` | `ACTIF` | `Producer` |
| `12.` | `V1` | `H-OPS` | 12. Sous-Roadmap des Features en Cours de Mise à Jour (`FUP-PATTERN v1.0`) | `L0..L8` | `2.14.0` | `ACTIF` | `Producer` |
| `12.1..12.3` | `V2` | `H-OPS` | 7 Portes (`P1→P7`), Gabarit `FUP-PATTERN`, File Active `FUP-001..018` | `L0..L8` | `2.14.0` | `ACTIF` | `Producer` |
| `13.` | `V1` | `H-GOV` | 13. Matrice de Conformité NF / AFNOR & DMT-SW (Traçabilité) | `L0..L8` | `2.14.0` | `CONFORME` | `QA Lead` |
| `14.` | `V1` | `H-OPS` | 14. Architecture des Skills Modulaires & VCS Documentaire Isolé | `L3/L7/L8` | `2.14.0` | `ACTIF` | `AG-L2-DOC` |
| `15.` | `V1` | `H-OPS` | 15. Espace Dev & Connectivité Multi-Surfaces (`EXO-DEV-BRIDGE`) | `L3/L7/L8` | `2.14.0` | `ACTIF` | `DevOps Lead` |
| `PART-VI` | `V0` | `H-OPS` | **PARTITION VI — ANNEXES OPÉRATIONNELLES COMPILÉES (`A` À `N`)** | `L0..L8` | `2.14.0` | `ACTIF` | `Lead Architect` |
| `ANN-A` | `V1` | `H-OPS` | Annexe A — System Instruction Maître Google AI Studio (`A.1..A.5`) | `L0..L8` | `2.14.0` | `ACTIF` | `AI Ops` |
| `ANN-B` | `V1` | `H-GOV` | Annexe B — Protocole d'Isolation & Partition Maître Vierge (vs Astralis) | `L0/L8` | `2.14.0` | `VERROUILLÉ` | `Lead Architect` |
| `ANN-C` | `V1` | `H-OPS` | Annexe C — Protocole de Délégation & Supervision Multi-IA | `L8` | `2.14.0` | `ACTIF` | `AI Ops` |
| `ANN-D` | `V1` | `H-OPS` | Annexe D — Prompt d'Amorçage Vague 0 (Bootstrapping `src/`) | `L0..L8` | `2.14.0` | `ARCHIVE-REF` | `AI Ops` |
| `ANN-E` | `V1` | `H-OPS` | Annexe E — État de Finalisation Vague 0 & Inventaire Partition Maître | `L0..L8` | `2.14.0` | `ARCHIVE-REF` | `Producer` |
| `ANN-F` | `V1` | `H-ARCH` | Annexe F — Structure `src/` Plate Complète & Profil Runtime (`L0..L8`) | `L0..L8` | `2.14.0` | `ACTIF` | `Lead Architect` |
| `ANN-G` | `V1` | `H-3D` | Annexe G — Protocole Miroir 5 Surfaces, Thème Astralis V7 & `ExoTooltip` | `L7` | `2.14.0` | `ACTIF` | `UI Lead` |
| `ANN-H` | `V1` | `H-SIM` | Annexe H — Playtest Déterministe 6 Tours (`90 Ticks`) & Télémétrie (`H.1..H.2`) | `L2/L3` | `2.14.0` | `VÉRIFIÉ` | `QA Lead` |
| `ANN-I` | `V1` | `H-GAME` | Annexe I — Synthèse Bêta-Test P13 (`4,81/5`) & Brief UX *Pax Historia* (`I.1..I.2`) | `L7` | `2.14.0` | `VÉRIFIÉ` | `UX Lead` |
| `ANN-J` | `V1` | `H-DATA` | Annexe J — Gouvernance RBAC, API Express L8, SSoT `M0/M13` & Firestore (`J.1..J.3`) | `L0/L5/L8` | `2.14.0` | `ACTIF` | `Security Lead` |
| `ANN-K` | `V1` | `H-ARCH` | Annexe K — Plan de Migration Architecturale (`8 Couches × 8 Tiers`, `K.1`) | `L0..L8` | `2.14.0` | `PROJETÉ` | `Lead Architect` |
| `ANN-L` | `V1` | `H-OPS` | Annexe L — Changelog Structuré (`Actuel/Demandes/Projeté`) & `FUP_TRACKER` (`L.1..L.2`) | `L0..L8` | `2.14.0` | `ACTIF` | `Producer` |
| `ANN-M` | `V1` | `H-ARCH` | Annexe M — Référentiel Compilé des Modules Métier, API, 3D & Gouvernance | `L0..L8` | `2.14.0` | `ACTIF` | `Lead Architect` |
| `ANN-N` | `V1` | `H-OPS` | Annexe N — Directive Live Multi-IA (`SYS-INST-EXW-001`), Bus & Archive | `L8` | `2.14.0` | `ACTIF` | `AI Ops` |

---

# **PARTITION II — FRAMEWORK APPLICATIF, APP SHELL & SYSTÈMES DU MONDE**

# **3\. FRAMEWORK APPLICATIF, APP SHELL ADAPTÉ D'ASTRALIS, STUDIO AA & PIPELINE 3D**

# **3.1 Effectif Studio AA Réel (36 Postes : AA Léger → AA+) & Escouade 100 % Gemini**

## **3.1.1 Répartition des 6 Pôles Studio & Correspondance Agents Gemini**

| Pole Studio (36 Postes) | Rôle Humain & Lead Agent Gemini | Périmètre d'Action & Responsabilités |
| :---- | :---- | :---- |
| **1\. Direction** *(3 postes)* | Baptiste Lecoustre (Game Director / Lead Architect) \+ **Gemini-Argon** | Approbation unique (`R-25`), architecture globale `A0`, contrats Zod (`R-09`), arbitrage des règles `AR-01..16`. |
| **2\. Production & QA** *(4 postes)* | **Gemini-Bore** (Mistral/Claude en relecture doc secondaire) | Sprint planning, gates DoD, roadmap `9.`, `FUP-PATTERN` `10.`, plafonds code `R-14`, tests `SHA-256`. |
| **3\. Game Design & Narrative** *(7 postes)* | **Gemini-Krypton** (Systems) \+ **Gemini-Mercure** (Narrative) | Équilibrage PA/Sous-PA `A2`, atmosphère `P1..P4`, économie *Cities/Anno*, DAG *New Vegas*, réputation. |
| **4\. Ingénierie Core & Cloud** *(10 postes)* | **Gemini-Hydrogène** (Core/Sim) \+ **Gemini-Titane** (Cloud/DB) | Noyau Pur TS/C++17, `PCG32`, boucle `A3`, IA *Humankind*, Auth Firebase, Cloud SQL `pgvector`, governor Gemini. |
| **5\. Art 3D, Tech Art & Audio** *(9 postes)* | **Gemini-Néon** (3D/Shader) \+ **Gemini-Silicium** (UI/Audio) | Dual-Adapter Three.js / Unity 6 URP, Shaders *Universim/Anno*, `EXO-SHELL`, Bento Biseauté, SVG, FIP. |
| **6\. Data & Live-Balance** *(3 postes)* | **Gemini-Xénon** | Séries temporelles SQL, analyses comparatives *Humankind*, réglage `ΔP_adapt`, XP & Succès. |

# **3.2 Architecture Skills Google AI Studio (`Gemini Intelligence` vs `Chatbot` & Retrait Google Chat)**

* **Suppression définitive de Google Chat (`AR-01`) :** Toute la mémoire épisodique de campagne est gérée dans **Cloud SQL PostgreSQL 16** (`campaign_chronicle_turns` pour les 15 derniers dossiers résolus \+ `narrative_event_embeddings` en `pgvector` 768d pour le rappel long terme et l'anti-répétition cosinus ≤ 0.82) couplé à **Cloud Firestore**.  
* **Supériorité d'`Add Gemini Intelligence` \+ `Add High Thinking` sur `Chatbot` (`AR-02`) :** Un skill `Chatbot` produit un fil conversationnel libre non contraint, incompatible avec un moteur d'actions à PA. `Add Gemini Intelligence` \+ `Add High Thinking` en mode *Structured Outputs* (JSON validé par Zod \+ tri topologique de Kahn \+ parcours BFS) garantit des Dossiers exécutables, bornés dans `[-0.15, +0.15]` (`R-69`).  
* **6 Skills AI Studio actifs :** `Create Game`, `Three.js 3D`, `Add Database and Auth`, `Add SQL Database`, `Add Gemini Intelligence`, `Add High Thinking`.  
* **6 Modules internes spécialisés :** *Gemini Free Tier Strict Governor* (`FEAT-47`), *Unity 6 URP Dual-Bridge* (`FEAT-45`), *WebKit Memory Shield* (`FEAT-46`), *Universim Biome Shaders* (`FEAT-44`), *Pawn & New Vegas Check Engine* (`FEAT-13`), *Trigger Watchdogs* (`FEAT-03`).

# **3.3 Adaptation Complète de l'App Shell d'Astralis à EXO WORLD : 2050 (`EXO-SHELL` — 8 États)**

## **3.3.1 Tableau de Transposition Astralis → EXO WORLD : 2050**

| Composant App Shell Astralis | Adaptation EXO WORLD : 2050 | Correspondances src/ & FEAT |
| :---- | :---- | :---- |
| `BOOT` (Bootloader 3D \+ Check Firebase) | `EXO_BOOT` : Ajoute la détection Dual-Adapter (Three.js / Unity 6\) et le calibrage WebKit Memory Shield (\< 250 Mo). | `src/interfaces/boot/`, `FEAT-01`, `FEAT-46` |
| `AUTH` (Firebase obligatoire Email/Google) | `EXO_AUTH` : Identique Zero-Trust, création profil Firestore \+ Cloud SQL players \+ initialisation XP Tri-Jauges. | `src/interfaces/auth/`, `R-11` |
| `MAIN_MENU` (Arrière-plan 3D stellaire) | `EXO_MAIN_MENU` : Arrière-plan 3D de la Terre/Orbite 2050 \+ Fond SVG dynamique \+ aperçu des Succès & Campagnes actives. | `src/interfaces/main-menu/` |
| `GAME_CONFIG` (Seed, taille galaxie, IA) | `EXO_NEW_SIMULATION` : Configurateur Genèse hybride (**Génération Aléatoire en 1 clic** OU **Assistant pas à pas par étapes empilées verticalement**) : planète d'origine avec aperçu visuel des biomes, civilisation de départ, nom du dirigeant/planète/capitale/flotte via **bulles de suggestions cliquables combinatoires** (sélection multiple → propositions proches, suppression persistante, régénération), difficulté, abondance/climat, rivaux (1–5), site d'atterrissage & spécialisation, profil Gemini Free Tier Strict et Contexte Éthique/Philosophique. | `src/interfaces/new-simulation/`, `src/components/config/`, `AR-04`, `AR-07` |
| `SYSTEM_SETTINGS` (5 onglets) | `EXO_SETTINGS` : 6 onglets adaptés (1. 3D Three.js `0.187.0` / Unity 6 ; 2\. Audio & Radio FIP 5 flux ; 3\. Oracle Gemini Free Tier ; 4\. Thème Bento Biseauté `Astralis Snapshot V7` \+ Intensité Fond SVG \+ Accessibilité WCAG ; 5\. Contrôles tactiles/clavier ; 6\. Contexte de Personnalité, Référentiels de Raisonnement & Mode Pédagogique \[Éthique Thomiste, Maslow, Échelle 6 Niveaux\]) + accès direct vers **Atelier Docs, VCS, Skills & Connectivité Dev**. Persisté dans Firestore (`users/{uid}/settings`) et injecté en lecture seule dans le `StateBrief` Gemini (`AR-17`, `AR-18`). | `src/interfaces/system-settings/`, `src/interfaces/DocsSkillsHubScreen.tsx`, `FEAT-05..08` |
| `GAME_LOBBY` (Sync Firestore \+ Fil Google Chat) | `EXO_BRIEFING_LOBBY` : Briefing Pré-Lancement Solo (zéro multijoueur v1.0 `OPT-12`) : récapitulatif `worldSeed`, fiche des 5 IA rivales, choix Doctrine *Humankind*, Cabinet initial avec portraits & badges spécialité, init SQL/Firestore. | `src/interfaces/game-lobby/`, `AR-01` |
| `GAME_SCREEN` (Viewport 3D \+ HUD \+ 3 échelles) | `EXO_GAME_SCREEN` : Viewport 3D `Three.js 0.187.0` PBR / Rayleigh-Mie plein écran \+ Barre Supérieure (PA Général, File Crises `P0`, Ressources d'Ère, Prêts/Trésorerie, Horloge Cycle 15 ticks, Radio FIP) \+ Navigation Principale stricte 3 Onglets (`Monde`, `Événements` avec **badges d'entités cliquables ultra-compacts alignés à l'interligne**, `Journal`) avec modales d'inspecteur isolé 135°. | `src/interfaces/game-screen/`, `src/components/hud/`, `FEAT-09..11` |
| `IN_GAME_SUBSCREENS` (6 sous-écrans Astralis) | `EXO_SUBSCREENS` (8 sous-écrans overlay `< 150 ms` sans démontage WebGL + **Atelier Docs, VCS, Skills & Connectivité 3 Surfaces** accessible depuis Menu Principal et Paramètres) : 1\. Atelier d'Affinage 3 Étages & DAG *New Vegas* ; 2\. Onglet Monde / Villes, Quartiers 24-Hex & Modules *Anno 2205* ; 3\. Gestion Planétaire, Slots (`1→6`) & 5 Divisions Scientifiques (`EXOSPHERE_0..TROPOSPHERE_4`) ; 4\. Supervision & Maintenance (`C3`) ; 5\. Cabinet Présidentiel (Sous-PA) & Roster Colons *RimWorld* ; 6\. Super-Alliance, Diplomatie Planétaire, Église Catholique & Comparateur *Humankind* ; 7\. Centre Opérations Militaires 4 Théâtres (`L1–L5`), Drones, Datacenters Cyber & Transporteurs ; 8\. Journal/Archives SQL, Simulateur 6 Tours & Sauvegardes `SHA-256`. | `src/interfaces/subscreens/`, `src/interfaces/DocsSkillsHubScreen.tsx`, `FEAT-04`, `FEAT-07` |

## **3.3.2 Machine à États de Navigation (`EXO-SHELL`)**

```
[LANCEMENT] ──► (1) BOOT / BOOTLOADER 3D (WebGL2/WebGPU + Check JWT Firebase + Memory Shield)
                      │
                      ├── Session absente ──► (2) AUTH FIREBASE OBLIGATOIRE (Email / Google OAuth)
                      │                              │ (JWT valide + Sync Firestore/SQL)
                      ▼                              ▼
                (3) MENU PRINCIPAL (Arrière-plan 3D orbital temps réel)
                 ├──► (4) NOUVELLE SIMULATION (Seed, Superpuissance, Super-Alliance, IA, PA)
                 │          └──► (6) BRIEFING LOBBY SOLO (Récap Seed, 5 IA, Doctrine, Init SQL/pgvector)
                 ├──► (5) PARAMÈTRES SYSTÈME (5 Onglets : 3D, Audio/FIP, Gemini, Bento/SVG, Contrôles)
                 ├──► Charger Sauvegarde Cloud/SQL (Vérification SHA-256) ──┐
                 └──► Déconnexion sécurisée ──► (2) AUTH                    │
                                                                            ▼
                                                           (7) ÉCRAN DE JEU PRINCIPAL 3D (SOLO)
                                                            ├── Échelle 1 : Carte Spatiale & Slots
                                                            ├── Échelle 2 : Globe Planétaire (72 tuiles)
                                                            ├── Échelle 3 : Quartiers Urbains Ouverts
                                                            ├──► (8) 8 SOUS-ÉCRANS OVERLAY (dont Militaire L1–L5)
                                                            └──► VICTOIRE ÈRE VI ──► MODE INFINTI C (15h+)
```

## **3.3.3 Sélecteurs d'Options de l'App Shell (`OPT-SHELL`)**

| ID Sélecteur | Options de Configuration UX | Statut & Impact |
| :---- | :---- | :---- |
| `OPT-SHELL-01` | **Mode de navigation Mobile :**\[x\] Bottom Sheets tactiles (55% / 92%) \+ Barre 5 Onglets\[ \] Drawer latéral classique\[ \] Carrousel Scroll-Snap | `P1` · **VERROUILLÉ** |
| `OPT-SHELL-02` | **Démarrage Radio FIP :**\[x\] Muet par défaut, lecture sur 1er geste utilisateur (R-61)\[ \] Synthèse ambiante auto dès le Menu Principal | `P1` · **VERROUILLÉ** |
| `OPT-SHELL-03` | **Mode de Jeu Solo vs IA :**\[x\] Briefing Solo Exclusif vs 5 IA rivales en v1.0 (multijoueur différé v1.1+)\[ \] Multijoueur synchrone activé | `P1` · **VERROUILLÉ** |

# **3.4 Bus de Circulation Cybernétique Tri-Voies, UI Bento Biseauté, SVG & Dual-Adapter 3D**

## **3.4.1 Circulation Tri-Voies & Watchdogs (`AR-03`, `R-53`)**

```
[EXO-SHELL UI / JOUEUR]
   │
   ├── Voie 1 : Contrôle Artériel ──► [MOTEUR CENTRAL A0 (Noyau TS/C++)] ──► [ORACLE GEMINI HIGH THINKING]
   │    (Intents, PA/Sous-PA, Prêts)     │ (Validation Zod / PCG32)             │ (Dossiers Dual-Pass JSON)
   │                                     │                                      │
   ├── Voie 2 : Télémétrie Veineuse  ◄──┼──────────────────────────────────────┘
   │    (SceneDiffPacket 3D, Hashing)    │
   │                                     │
   └── Voie 3 : TRIGGER_BUS ─────────────┴──► [WATCHDOGS DÉTERMINISTES & TRIGGERS GEMINI]
        (Surveillance Usure <25%, CO₂, Dette, Intrusions Cyber, Chaînes Causales)
```

## **3.4.2 Direction UI (*Bento Biseauté* \+ *Fond SVG*) & Budgets Matériels**

* **Bento à bords lumière biseautés conforme à `FMT-EXW-001` & Thème `Astralis Snapshot V7` (`FEAT-05`) :** Double bordure directionnelle `135deg` (arête supérieure lumineuse `45 %` \+ ombre basse `10 %`) \+ filet spéculaire `1 px` sur obsidienne `#050811` / cyan `#00F0FF` / ambre `#FFB800` (sans `backdrop-filter` lourd sur WebGL), codé par la [**Nouvelle Légende Chromatique Officielle FMT-EXW-001**](https://docs.google.com/document/d/1dDdh7_rzCM5SphH5WyQF8FkkjdPRX-1MzTOUdKveaX4/edit) : **Corail Alerte (\#F43F5E)** pour Crises `P0` · **Or Solaire (\#F59E0B)** pour Scénario/Quêtes `C1` · **Cyan Orbital (\#0EA5E9)** pour Gestion/Build `C2` · **Cuivre Technique (\#FB923C)** pour Supervision/Maintenance `C3` · **Émeraude Biosphère (\#10B981)** pour Biomes/Atmo/Colons `C4` · **Indigo Stratégique (\#6366F1)** pour Politique/Alliance/Militaire/Cyber `C5` · **Ardoise Télémétrique (\#94A3B8)** pour Journal/SQL · **Platines (\#E2E8F0)** & **Accent Cyan (\#22D3EE)** pour Profil Joueur & Personnage Incarné.  
* **Infobulles Contextuelles (`ExoTooltip.tsx`) & Badges d'Entités Ultra-Compacts :** Des infobulles détaillent les formules et écarts (`PA/Sous-PA`, `ΔP_adapt`, `5 Divisions`, `18 Ressources`, `Compute 2x`) au survol comme au toucher prolongé ; dans les événements narratifs, chaque mention d'entité est cliquable sous forme de **badge ultra-compact aligné à la hauteur de ligne (`inline-flex`, `leading-tight`)** ouvrant la modale de fiche associée.  
* **Fond SVG Dynamique (`FEAT-06`) & Pipeline 3D AAA `Three.js 0.187.0` :** Fondus enchaînés (`1 200 ms`) glissant visuellement selon la division atmosphérique (`EXOSPHERE_0` → `TROPOSPHERE_4`) ; côté WebGL (`src/engine3d/`), `ACESFilmicToneMapping`, IBL `PMREMGenerator + RoomEnvironment`, ciel open-sky Rayleigh + Mie sans aucun dôme (`R-16`), nuages dual-profondeur, lumières de terminateur nocturne, cité **24-Hex** + Double Maglev + 18 piétons waypoints, et socle d'inspection isolé `135°` (`IsolatedInspectorScene`).  
* **Budgets bloquants (`AR-12`) :** Desktop `60 FPS` (RAM ≤ `512 Mo`, Draw Calls ≤ `160`) · Web Mobile `30–60 FPS` (RAM ≤ `250 Mo` sous *WebKit Memory Shield*, DPR ≤ `1.5`, Draw Calls ≤ `120`) · Natif Unity 6 iOS/Android `60 FPS` (VRAM ≤ `300 Mo`).

# **3.5 Audit Légal & Bibliothèques d'Assets 3D Game-Ready**

| Categorie Assets | Source Légale Valide & Contrat Direct | Utilisation dans EXO WORLD : 2050 |
| :---- | :---- | :---- |
| **Personnages & Colons** | **Quaternius** (CC0), **Mixamo**, **OS3A** (CC0) \| Pro : **Synty Sidekick Modular**, **POLYGON Sci-Fi Space**. | PNJ urbains, colons *RimWorld*, Conseillers du Cabinet. |
| **Villes & Datacenters** | **Kenney** (*City/Space Kits* CC0), **Quaternius** (*Sci-Fi* CC0) \| Pro : **KitBash3D** (*Neo-Utopia*), **Synty Sci-Fi City**. | Quartiers *Anno 2205*, fermes verticales, datacenters quantiques. |
| **Drones & Flottes** | **Kenney**, **Quaternius** (*Spaceships/Vehicles*), **Sloyd** \| Pro : **Unity Asset Store** (*Autonomous Drones URP*), **Fab**. | Drones 4 classes, transporteurs `T1–T4`, flottes orbitales. |
| **Routes & Réseaux** | **Kenney** (*Roads* CC0) \+ **Splines procédurales** (Unity Splines / Three.js) \| Pro : **EasyRoads3D**. | Connexions entre quartiers urbains et zones industrielles. |
| **Biomes & Environnement** | **Poly Haven** (CC0), **ambientCG** (CC0), **Quaternius Nature** \| Pro : **Quixel Megascans / Fab**, **Gaia Pro**. | Shaders de terrain *Universim*, biomes `P1` à `P4`, faune/flore. |

# **4\. VISION PRODUIT, HIÉRARCHIE DES INSPIRATIONS & SYSTÈMES DU MONDE**

# **4.1 Hiérarchisation par Priorité (`P1`→`P4`) & Classification Multi-Domaines des 12 Inspirations**

| Priorité | Jeu Inspirateur | Mécanique Transposée & Adaptation Exécutive |
| :---- | :---- | :---- |
| **P1 (Noyau)** | *Alliance of the Sacred Suns* | Système de PA Général \+ 4 Sous-PA Conseillers, arbitrage par Dossiers Exécutifs. |
| **P1 (Noyau)** | *Anno 2205* | DA Sci-Fi lumineuse, métropoles à ciel ouvert, 3 modules greffés par bâtiment, 4 paliers sociaux. |
| **P1 (Noyau)** | *Humankind* | 6 Ères chronologiques, Étoiles d'Ère, comparateur statistique IA, quartiers urbains contigus. |
| **P1 (Noyau)** | *Fallout: New Vegas* | Dialogues & résolutions à skill-checks déterministes, quêtes à arborescence DAG, réputation. |
| **P2 (Majeur)** | *The Universim* | Globes planétaires sphériques 3D, 9 biomes dynamiques, météo, végétation et faune évolutives. |
| **P2 (Majeur)** | *Cities: Skylines II* | Économie Villes ↔ État, prêts bancaires avec taux de solvabilité, marché dynamique de ressources. |
| **P2 (Majeur)** | *RimWorld* | Roster de Colons & Conseillers à caractéristiques individuelles (traits, passions, fatigue, moral). |
| **P2 (Majeur)** | *Per Aspera* \+ *Surviving Mars* | Terraformation atmosphérique (CO₂, pression, eau), drones autonomes, transition abris → villes ouvertes. |
| **P3 (Ciblé)** | *Terra Invicta* | Granularité chiffrée des fiches d'entités, modificateurs transparents et gestion orbitale. |
| **P3 (Ciblé)** | *Aven Colony* | Référendums civiques d'évaluation de mandat, saisons hostiles et overlays de télémétrie. |
| **P3 (Ciblé)** | *AtWar* | Conflits territoriaux par zones adjacentes et lignes de ravitaillement (sans micro-RTS). |
| **P4 (Recadré)** | *Fallout 4* | Modularité d'avant-postes (rejet de la roue à 4 choix flous, remplacée par la rigueur *New Vegas*). |

# **4.2 Géopolitique des Superpuissances & Super-Alliance Hors Contrôle (`AR-04`, `R-27`)**

* **Superpuissances en compétition :** *Alliance Atlantique (OTAN-Orbite)*, *Union Européenne Spatiale*, *Pacte BRICS+*, *Ligue Indo-Pacifique*, *Consortium Pan-Africain*, *Fédération Andine-Australe*.  
* **Hiérarchie ordonnée :** `1. Super-Alliance Économico-Étatique (IA autonome hors contrôle)` → `2. Alliés IA Pairs` → `3. Joueur (Directeur d'État Colonial Galactique)` ↔ `4. Superpuissances IA Rivales`. Soutenir vos alliés IA accélère leur développement, élève le rang de la Super-Alliance et débloque pour vous des **Slots Planétaires**, taux d'emprunt réduits, brevets et escortes fédérales.

# **4.3 Slots Planétaires Débloquables (`1`→`6`) (`AR-05`)**

| Slot | Nom & Type | Ressource Spécifique | Déblocage & Bénéfices Majeurs |
| :---- | :---- | :---- | :---- |
| **Slot 1** | Planète Principale (Tellurique) | Main-d'œuvre, Crédits, Water/Food | **Départ** — Centre politique, métropole primaire et premier port spatial. |
| **Slot 2** | Lune du Système Solaire | Hélium-3, Glace pure | **Ère II** — Centrales à fusion, carburant orbital `T2`, drones autonomes. |
| **Slot 3** | Planète Tellurique Secondaire | Isotopes Piégés, Oxydes lourds | **Ère III** — Spatioports de flottes lourdes, agro-expansion terraformée. |
| **Slot 4** | Exoplanète Cryo-Océanique | Cryo-Polymères, Supra-conducteurs | **Ère IV** — **Datacenters Quantiques `T4`**, boucliers radiatifs avancés. |
| **Slot 5** | Exoplanète Xéno-Biologique | Bio-Enzymes Extrêmophiles | **Ère V** — **Capacités d'élite Colons/Conseillers**, terraformation rapide. |
| **Slot 6** | Monde Pivot Exosphérique | Influence Galactique, Antimatière | **Ère VI** — Rang max Super-Alliance, course à la Victoire Finale. |

# **4.4 Économie Villes ↔ État, Prêts, Marché, Ressources par Ère, XP & Succès (`AR-06`, `AR-15`)**

* **Double couche *Cities: Skylines II* :** Chaque ville calcule ses recettes fiscales, salaires, entretien, coûts respiratoires et balance locale, consolidés dans l'État galactique qui gère la **Trésorerie**, les **Prêts & Crédits** (taux indexé sur cote de solvabilité) et le **Marché d'Échange de Ressources** à cours dynamiques.  
* **Ressources par Ère (`I`→`VI`) :** Ère I (Crédits, Énergie, Matériaux, Eau, Vivres, Électronique) → Ère II (+ Carburant Orbital, Alliages Composites, `Compute`, Kits Respiratoires) → Ère III (+ Hélium-3, Terres Rares, Bio-Polymères, Pièces Drones) → Ère IV–VI (+ Supra-conducteurs, Isotopes Exotiques, Bio-Enzymes, `Compute Quantique`, Influence Galactique).  
* **XP & Succès :** 3 compteurs (`XP Civilisation`, `XP Conseillers & Colons` augmentant la régénération des Sous-PA, `XP Super-Alliance`) \+ Succès à récompenses permanentes.

# **4.5 Atmosphère (`P1→P4` & 5 Divisions Scientifiques), Simulateur BioHealth, Météo & Productivité PNJ (`AR-11`, `R-39`, `FEAT-53/54`)**

| Palier & Division Scientifique | Conditions, Altitude & Impacts Physiques | Vitesse Chantier | Coût Équipements | Moral & PNJ |
| :---- | :---- | :---- | :---- | :---- |
| **Palier `P1` · `EXOSPHERE_0` (`> 500 km`)** | Radiations intenses, tempêtes abrasives, air toxique. Exo-combinaisons `4 h/j` max (`R-39`). | **`-40 %`** | **`+100 %`** | Moral `-15`, fatigue rapide. |
| **Palier `P2` · `THERMOSPHERE_1` (`85–500 km`)** | Pression filtrable, mousses pionnières, masques légers en extérieur. | **`0 %`** | **`-55 %`** | Moral `0`, productivité standard. |
| **Palier `P3` · `MESOSPHERE_2` (`50–85 km`)** | Air respirable, biomes actifs, forêts, météo stabilisée, premier équilibre hydrologique. | **`+25 %`** | **`0 %`** | Moral `+20`, boom démographique. |
| **Palier `P4` · `STRATOSPHERE_3` (`15–50 km`)** | Stratosphère filtrée UV, climat régulé haute stabilité, écosystèmes pérennes. | **`+35 %`** | **`0 %`** | Productivité PNJ **`+35 %`**. |
| **Palier `P4+` · `TROPOSPHERE_4` (`0–15 km`)** | Biosphère Éden complète à ciel ouvert (`R-16`), cycle eau/flore/faune autonome. | **`+40 %`** | **`0 %`** | Productivité PNJ **`+40 %`**. |

## **4.5.1 Couplage 5 Divisions Scientifiques, BioHealth (`FEAT-53`) & Plafond Crises `P0` (`FEAT-54`)**

* **Indice Bioclimatique Composite (`src/systems/biosphere-cabinet/bioclimate-health.ts`) :** `BioHealth = clamp[0, 100]( 0.25·QualitéAir + 0.20·Sols + 0.20·Hydrosphère + 0.20·Flore + 0.15·Faune − FreinCatastrophesP0 )`.
* **Amortisseur Déterministe de Crises (`FEAT-54`) :** Même en régime climatique sévère (`EXOSPHERE_0`), le moteur borne strictement la création simultanée à **`max 2` crises `P0` par cycle `N1`** (`cycle-orchestrator.ts`) afin de préserver la solvabilité en PA (`R-26`).

# **4.6 Drones, Datacenters Cyber, Flotte, Transporteurs & Découvertes (`AR-10`, `AR-16`)**

* **Drones (4 classes) :** *Chantier* (neutralisent le malus `P1`/`P2` \+ maintenance préventive `C3`), *Défense*, *Attaque* (fronts *AtWar*), *Espionnage*.  
* **Datacenters (`T1–T5`) & Cyberguerre :** Génèrent `Compute` pour pare-feu défensifs, espionnage et **cyberattaques paralysant** centrales, spatioports ou réseaux de drones rivaux pendant `1` à `3` cycles.  
* **Transporteurs (`T1–T4`) & Flotte Orbitale :** Lanceurs chimiques (`T1`) → Navettes fusion (`T2`) → Cargos lourds (`T3`) → Transporteurs exoplanétaires (`T4`) déterminant le fret inter-slots et la projection orbitale.  
* **Nomenclature scientifique obligatoire (bannissement total du mot « anomalie ») :** *Gisement d'Isotopes Piégés*, *Fosse Hydrothermale Active*, *Cavité Glaciaire Pressurisée*, *Poche Microbienne Extrêmophile*, *Épave de Sonde Précurseur*, *Faille Magnétique Sub-Croûtale*, *Signature Spectrale Artificielle*.

# **4.7 MOTEUR D'ÉVÉNEMENTS, D'ACTIONS & D'ARBITRAGE PAR DOSSIERS (CŒUR DÉCISIONNEL)**

## **4.7.1 Rôle Central & Typologie (Invariant Maître R-24)**

* **Invariant Maître R-24 :** Dans EXO WORLD : 2050, aucune mutation transformative du monde (construction, décret, emprunt, recherche, opération militaire L1–L5, intervention biosphérique) ne peut s'exécuter directement en clic libre de surface ; elle transite obligatoirement par le **Moteur d'Événements & d'Arbitrage par Dossiers Exécutifs**.  
* **Déterminisme Pure PCG32 vs Gemini High Thinking :** Les Dossiers de routine technique (Build C2, Maintenance C3, Biosphère C4) sont générés à **0 appel LLM** par le catalogue déterministe local et le générateur `PCG32`. Seuls les événements majeurs (Scénario C1, Crises P0, Diplomatie/Cyber C5) sollicitent l'Oracle Gemini High Thinking couplé au RAG `pgvector` pour garantir la cohérence narrative sans consommer inutilement de quotas API.

## **4.7.2 Les 5 Classes C1..C5, File P0, Initiative Directe (R-33) & Économie PA/Sous-PA (R-26)**

* **Structure de la File & Priorité P0 :** Chaque Tour N1, le moteur présente une file d'arbitrage de 4 à 7 Dossiers classés par domaine. La présence d'une Crise **P0 (Corail Alerte)** bloque le traitement des dossiers de développement C4/C5 jusqu'à sa résolution ou son arbitrage d'urgence.  
* **Initiative Directe (R-33) :** En sus des Dossiers proposés par le système ou l'Oracle, le joueur peut dépenser du PA Général pour émettre directement un Dossier d'Initiative sur n'importe quel quartier, slot planétaire ou front militaire.  
* **Fongibilité Asymétrique des PA (R-26) :** Le budget du Tour est constitué du PA Général \+ 4 Sous-PA spécialisés (Gestion/Build, Maintenance, Biosphère, Politique/Militaire). Le PA Général peut compenser tout manque de Sous-PA, mais l'inverse est strictement interdit.

## **4.7.3 Atelier d'Affinage en 3 Étages**

* **Étage 1 — Direction Strategique & Skill-Checks (Fallout: New Vegas) :** Choix de la posture doctrinale et test de compétences déterministe basé sur les caractéristiques du Directeur Exécutif ou du Conseiller assigné.  
* **Étage 2 — Paramétrage Opérationnel (Anno 2205 & Cities: Skylines II) :** Sélection des modules de bâtiment greffés, allocation des colons/spécialistes RimWorld ou souscription d'un prêt bancaire d'accompagnement.  
* **Étage 3 — Preuve 3D & Audit Prévisionnel avant Signature :** Projection en hologramme 3D sur le terrain (FEAT-12) et audit de la balance budgétaire/environnementale avant signature irrévocable (R-35).

## **4.7.4 Pipeline Sécurisé, ΔP\_adapt, Tri Kahn, BFS & Horizons d'Échos Différés (TRIGGER\_BUS)**

* **Garanties Anti-Hallucination :** Tout Dossier narrativement généré par Gemini est soumis au sas Zod, ordonné par le tri topologique de Kahn pour éliminer les cycles incohérents et validé par un parcours BFS garantissant l'accessibilité des nœuds de choix.  
* **Horizons de Propagation :** Les effets d'un Dossier résolu s'étalent sur 4 horizons temporels (IMMEDIATE, SUSTAINED\_MODIFIER, DELAYED\_ECHO transmis au TRIGGER\_BUS, MEMORY\_FLAG archivé en pgvector pour rappel RAG ultérieur).

\---

# **4.8 MOTEUR ÉTHIQUE, PHILOSOPHIQUE (SAINT THOMAS D'AQUIN), PYRAMIDE DE MASLOW & PÉDAGOGIE DU DISCERNEMENT (6 NIVEAUX)**

## **4.8.1 Sources d'Inspiration Philosophiques & Éthiques (Saint Thomas d'Aquin & Traditions Comparées)**

* **Socle Éthique Thomiste (Saint Thomas d'Aquin — *Somme Théologique*) :**  
* Les **4 Vertus Cardinales** : *Prudence* (discernement juste des moyens), *Justice* (rendre à chacun ce qui lui est dû), *Force* (courage face aux crises `P0` sans céder à la facilité cynique), *Tempérance* (maîtrise des ressources et sobriété écologique).  
* Les **3 Vertus Théologales** : *Foi* (fidélité aux principes malgré l'incertitude), *Espérance* (persévérance dans la terraformation et le bien futur), *Charité* (recherche authentique du **Bien Commun** et de la dignité de chaque colon).  
* **Principes Opérationnels Thomistes :** **Bien Commun** supérieur aux intérêts partisans, **Principe de Subsidiarité** (déléguer aux échelons locaux/quartiers sans autoritarisme excessif), et **Doctrine du Double Effet** (distinguer rigoureusement l'intention droite, l'objet moral intrinsèque d'un acte et un effet secondaire indésirable simplement toléré vs voulu).  
* **Référentiels Philosophiques Comparés (Miroir Pédagogique) :** Humanisme personnaliste, Existentialisme (responsabilité individuelle face à la crise), Pragmatisme / Utilitarisme (calcul coûts/bénéfices pur), Rationalisme Technique, Réalisme Diplomatique — intégrés pour permettre au joueur de comparer expérimentalement leurs effets systémiques face à l'éthique chrétienne.

## **4.8.2 Badges de Raisonnement & Posture sur les Choix (ChoiceReasoningBadge)**

Chaque option proposée dans l'Atelier d'Affinage (Étage 1\) et dans les arbres DAG *Fallout: New Vegas* affiche 1 à 2 badges normés identifiant le type de raisonnement mobilisé :

* `THOMISTE_VERTU` (Prudence, Justice, Bien Commun) · `MISERICORDE` (Pardon, Soin, Réparation) · `HUMANISTE` (Dignité humaine, Solidarité) · `EXISTENTIALISTE` (Responsabilité radicale, Liberté) · `PRAGMATIQUE` (Efficacité court/moyen terme) · `TECHNIQUE` (Ingénierie pure, Optimisation) · `DIPLOMATIQUE` (Compromis, Alliance, Paix) · `UTILITARISTE` (Sacrifice d'une minorité pour le rendement) · `AUTORITAIRE` (Contrainte, Contrôle) · `ECOLOGIQUE` (Sauvegarde de la création, Biomes) · `SUBSIDIAIRE` (Autonomie locale des villes/colons).

## **4.8.3 Intégration de la Pyramide de Maslow & Psychologie Morale aux Colons & Population (C4)**

La simulation des colons (*RimWorld*) et de la population urbaine (*Anno 2205*) repose sur les **5 strates de la Pyramide de Maslow** (+ transcendance) couplées aux **stades moraux de Kohlberg** et aux matrices psychométriques (`MBTI`, `Ennéagramme`, `DISC`, `HEXACO`) :

* **Tableau des 5 Strates de Maslow reliées au Moteur Déterministe :**  
9. **1\. Strate 1 — Besoins Physiologiques :** Oxygène, Eau, Vivres, Kits respiratoires `P1` (`R-49`), abri radiatif (`4h/j` max `R-39`).  
10. **2\. Strate 2 — Besoins de Sécurité :** Maintenance `C3` (`> 25 %`), stabilité météo, boucliers/pare-feu Datacenters, défense contre attaques *AtWar*.  
11. **3\. Strate 3 — Besoins d'Appartenance & Lien Social :** Communautés de quartiers ouverts, solidarité, entraide, justice sociale, absence d'isolement.  
12. **4\. Strate 4 — Besoins d'Estime & Reconnaissance :** Montée des 4 paliers sociaux *Anno*, compétences/passions *RimWorld*, mérite, équité fiscale.  
13. **5\. Strate 5 — Accomplissement & Transcendance (Maslow tardif × Saint Thomas d'Aquin) :** Vocation, art, science au service du Bien Commun, paix durable, don de soi et fécondité spirituelle/civique.  
* Une strate supérieure ne peut s'épanouir durablement si les strates inférieures sont en rupture critique ; inversement, une vertu héroïque (Grâce) peut soutenir temporairement le moral face à une épreuve matérielle.

## **4.8.4 Onglet Paramètres, Configuration & Catalogues : Contexte de Personnalité Utilisateur & Référentiel de Raisonnement (AR-17)**

Ajout dans **Paramètres Système (`EXO_SETTINGS` — Onglet 6\)**, **Nouvelle Simulation (`EXO_NEW_SIMULATION`)** et les **Catalogues statiques (`src/data/`)** de 3 blocs réglables :

* **1\. Contexte de Personnalité Utilisateur (UserPersonalityContext) :** Permet au joueur de renseigner son profil personnel, ses valeurs, ses traits cognitifs/psychométriques ou ses axes de progression souhaités. Ce profil est transmis en lecture seule dans le `StateBrief` de Gemini afin d'adapter la nature des dilemmes et de **mettre authentiquement à l'épreuve la psychologie chrétienne et le discernement du joueur**.  
* **2\. Référentiel d'Orientation du Raisonnement (ReasoningReferential) :** Sélecteur du cadre de référence guidant l'analyse et les contre-propositions de l'IA (*Thomiste / Chrétien* par défaut, *Humaniste*, *Pluraliste Comparatif*, *Pragmatique*, *Personnalisé*).  
* **3\. Mode Pédagogique & Miroir de Discernement :** Permet de choisir l'affichage des badges et de l'analyse pédagogique (*Avant décision* pour apprendre, *Après décision / Fin de cycle* pour tester son propre discernement sans indice préalable).

## **4.8.5 Échelle Pédagogique & Morale à 6 Niveaux — Épreuve de Psychologie Chrétienne & Résultats Observables (AR-18)**

Dans une finalité **pédagogique**, le jeu rend observables les fruits réels de chaque philosophie et de chaque choix (effets immédiats vs `DELAYED_ECHO` sur la Pyramide de Maslow, les relations et la paix), afin de **favoriser les choix chrétiens, éprouver la psychologie chrétienne face aux tentations de facilité ou d'utilitarisme, et apprendre à mieux décider** selon une **échelle normée à 6 niveaux** :

| Niveau | Polarité | Qualification Officielle | Logique Éthique & Psychologique | Dynamique Systémique & Pédagogique |
| :---- | :---- | :---- | :---- | :---- |
| **1** | **`+3`** | **Super Positive — Grâce** | Vertu héroïque, Charité exigeante, Bien Commun supérieur (Saint Thomas d'Aquin). | Coût/effort immédiat possible (PA ou renoncement), mais fécondité exceptionnelle à long terme : résilience, paix sociale, confiance durable et percées positives (`DELAYED_ECHO` vertueux). |
| **2** | **`+2`** | **Positive** | Prudence, Justice et raison droite ; alignement sain entre moyens et fins. | Renforcement équilibré de la Pyramide de Maslow, baisse des crises `P0` et progression stable de la civilisation. |
| **3** | **`+1`** | **Miséricorde & Réparation** | Clémence, pardon, accueil ou relèvement envers des colons, dissidents ou rivaux faillibles. | Peut sembler coûteux ou vulnérable à court terme, mais brise les cycles de vengeance, guérit le lien social (Strate 3 Maslow) et ouvre des branches de réconciliation durables. |
| **4** | **`0`** | **Ambiguë / Double Effet** | Dilemme gris ou compromis pragmatique (Doctrine thomiste du Double Effet : bien visé \+ effet secondaire toléré). | Miroir pédagogique central : montre les limites des demi-mesures pragmatiques/techniques et invite le joueur à affiner son discernement moral. |
| **5** | **`-1`** | **Négative** | Court-termisme, utilitarisme froid, égoïsme ou injustice tolérée pour un gain matériel rapide. | Peut offrir un avantage immédiat trompeur (crédits/production), mais fragilise les strates 3–5 de Maslow, érode la légitimité et déclenche des `DELAYED_ECHO` coûteux. |
| **6** | **`-2`** | **Très Négative** | Faute grave, cynisme destructeur, mépris de la dignité humaine ou oppression. | Dégradation sévère de la stabilité, escalade de crises `P0`, isolement diplomatique et alerte critique dans le **Journal Pédagogique de Discernement**. |

* **Journal Pédagogique de Discernement (intégré à l'Onglet Journal) :** Permet de relire en fin de cycle ou de campagne le bilan comparatif : *Quel raisonnement (badge) → Quel niveau (1 à 6\) → Quels résultats observés sur les colons (Maslow), l'économie et la paix*.

# **4.9 Développement de l'Église Catholique sur Terre & Discernement de la Volonté du Seigneur (`FEAT-55`, `FEAT-56`, `AR-19`)**

* **4 Axes Ecclésiaux Progressifs (`src/systems/geopolitics/planetary-diplomacy.ts` & `EcclesiaDiscernmentCard.tsx`) :** **Vie Pastorale (`PASTORAL`)**, **Œuvres Caritatives (`CHARITY`)**, **Contemplation (`CONTEMPLATION`)** et **Dialogue Science-Foi (`DIALOGUE`)**. Chaque avancée s'effectue uniquement via des Dossiers Exécutifs conformes à l'invariant `R-24` et au principe de subsidiarité.
* **Invariant Inviolable de Liberté de Conscience (`100 %`) :** Le champ `freedomOfConscienceScore` reste verrouillé à **`100 %`** en permanence ; aucune sanction fiscale, exclusion sociale ou contrainte civile/religieuse ne peut exister. Le discernement vise le service gratuit du Bien Commun et attribue un degré pédagogique (`lastDiscernmentGrade = +3 Grâce`).

# **PARTITION III — MOTEUR CENTRAL SADT / IDEF0 & PLAN DIRECTEUR DES CYCLES**

# **5\. ARCHITECTURE SADT / IDEF0 MULTI-NIVEAUX DU MOTEUR CENTRAL DE JEU**

# **5.1 Niveau 0 — Actigramme `A-0` (Contexte Boîte Noire Globale)**

# **5.2 Niveau 1 — Actigramme Général A0 (Imbrication des 5 Actigrammes Enfants A1 à A5)**

```
[CONTROLS (C)]
├── PA Général + 4 Sous-PA Conseillers (R-26)
├── Contrats Zod strictes & Types TS (R-12)
├── Pureté déterministe PCG32 (R-66)
├── Paliers Atmosphère P1..P4 & Ères I..VI
└── Gemini Free Tier Strict Governor (R-68)
│
▼
[INPUTS (I)] ──► +---------------------------------------------------+ ──► [OUTPUTS (O)]
├── Intents Joueur  |                                                   |  ├── Monde 3D Muté (Anno/Universim)
├── Flux Physiques  |   ACTIVITÉ A-0 : PILOTER UNE CIVILISATION        |  ├── Bilans Économiques Villes/État
├── Superpuissances |   EXOSPHÉRIQUE PAR DOSSIERS, PA & TRIGGERS        |  ├── Courbes Comparatives Humankind
├── Super-Alliance  |   (MOTEUR CENTRAL EXO WORLD : 2050)               |  ├── StateHash SHA-256 (Bit-à-Bit)
└── Découvertes     +---------------------------------------------------+  └── Snapshot SQL & Embeddings pgvector
▲
│
[MECHANISMS (M)]
├── Bus Tri-Voies EXO-SHELL (Arterial / Venous / TRIGGER_BUS)
├── Noyau Pur TS 5.7 / C++17 (Boucle A3 sans I/O)
├── Oracle Gemini High Thinking (JSON Dual-Pass)
└── Dual-Adapter 3D (Three.js r170+ / Unity 6 URP)
```

```
+======================================================================================+
| ACTIGRAMME GÉNÉRAL A0 — MOTEUR CENTRAL DE CYCLE EXÉCUTIF (15 TICKS)                  |
+======================================================================================+
|                                                                                      |
|  [A1 · SURVEILLANCE, TRIGGERS & DOSSIERS]                                            |
|   ├── A1.1 Watchdogs TRIGGER_BUS (Usure <25%, CO₂, Dette, Cyber)                     |
|   ├── A1.2 Calcul Delta de Probabilité Adaptatif (ΔP_adapt)                          |
|   └── A1.3 Synthèse Gemini Dual-Pass (PCG32 + Zod + Tri Kahn + BFS)                  |
|                    │                                                                 |
|                    ▼  (File P0 + 4 à 7 Dossiers C1..C5 ancrés en 3D)                 |
|  [A2 · ÉCONOMIE DE PA & ATELIER D'AFFINAGE]                                          |
|   ├── A2.1 Régénération PA Général + 4 Sous-PA Conseillers Présidentiels             |
|   ├── A2.2 Triage à Fongibilité Asymétrique (P0 = PA Général | C2..C5 = Sous-PA)     |
|   └── A2.3 Atelier 3 Étages (A2.3.a Axe New Vegas -> A2.3.b Colon/Mod -> A2.3.c 3D)  |
|                    │                                                                 |
|                    ▼  (ExecutiveDecisionIntent[] signés & irrévocables -PA)          |
|  [A3 · SIMULATION DÉTERMINISTE MULTI-ÉCHELLES (NOYAU PUR PCG32)]                     |
|   ├── A3.1 Supervision & Maintenance (C3) -> A3.2 Atmosphère P1..P4, Météo & PNJ     |
|   ├── A3.3 Économie Villes/État, Prêts & Marché -> A3.4 Build Modulaire & Drones     |
|   └── A3.5 Datacenters Compute & Cyber -> A3.6 Transporteurs T1-T4, Flottes & AtWar  |
|                    │                                                                 |
|                    ▼  (WorldState T+15 + Nouveaux Triggers de seuils)                |
|  [A4 · COMPÉTITION IA HUMANKIND, SUPER-ALLIANCE & PROGRESSION]                       |
|   ├── A4.1 Résolution IA Rivales & Alliés Pairs (Arbre d'utilité pur, 0 LLM)         |
|   ├── A4.2 Évaluation Super-Alliance -> Déblocage Slots Planétaires (1->6) & Crédits |
|   └── A4.3 Comparateur Humankind & Étoiles d'Ère -> A4.4 Attribution XP & Succès     |
|                    │                                                                 |
|                    ▼  (État consolidé de fin de cycle)                               |
|  [A5 · CONSOLIDATION, PERSISTANCE CLOUD & PROJECTION 3D/SVG]                         |
|   ├── A5.1 Calcul StateHash SHA-256 & TurnRecord (Rejeu bit-à-bit DRP-RS)            |
|   ├── A5.2 Sync Atomique Firestore + Cloud SQL PostgreSQL (pgvector & snapshots)     |
|   └── A5.3 Émission SceneDiffPacket (Three.js/Unity 6) + Fond SVG + Filtre Radio FIP |
|                    │                                                                 |
|                    └──────────► (Feedback Veineux & Échos Différés vers A1)          |
+======================================================================================+
```

# **5.3 Niveau 2 — Matrice ICOM Détaillée des Actigrammes Enfants (`A1` à `A5`)**

| Code SADT | Intitulé & Sous-Actigrammes | Inputs (I) & Controls (C) | Outputs (O) & Mechanisms (M) |
| :---- | :---- | :---- | :---- |
| **`A1`** | **Surveillance, Triggers & Dossiers**  (`A1.1` Watchdogs · `A1.2` ΔP\_adapt · `A1.3` Synthèse Gemini) | **I:** Télémétrie `T`, seuils physiques, échos différés.  **C:** Rules `R-68/69`, Zod, Kahn/BFS, `PCG32`. | **O:** File `P0` Crises \+ Dossiers `C1..C5`.  **M:** Gemini High Thinking, `TRIGGER_BUS`. |
| **`A2`** | **Économie de PA & Atelier d'Affinage**  (`A2.1` Regen PA · `A2.2` Triage · `A2.3` Atelier 3 Étages) | **I:** File `P0`, Dossiers `C1..C5`, choix joueur.  **C:** Budget PA Général & 4 Sous-PA, Roster *RimWorld*. | **O:** `ExecutiveDecisionIntent[]` signés.  **M:** Engine Affinage, Modale DAG *New Vegas*. |
| **`A3`** | **Simulation Déterministe Multi-Échelles**  (`A3.1` Mnt → `A3.2` Atmo → `A3.3` Éco → `A3.4` Build → `A3.5` Cyber → `A3.6` Flotte) | **I:** `ExecutiveDecisionIntent[]`, `WorldState(T)`.  **C:** Ordre fixe topologique `A3.1..A3.6`, `PCG32`. | **O:** `WorldState(T+15)`, Triggers de seuil.  **M:** Noyau Pur TS 5.7 / Miroir C++17. |
| **`A4`** | **Compétition IA, Super-Alliance & Progression**  (`A4.1` IA Rivales · `A4.2` Super-Alliance · `A4.3` *Humankind* · `A4.4` XP) | **I:** `WorldState(T+15)`, états des 5 IA rivales.  **C:** Arbre d'utilité déterministe, Étoiles d'Ère. | **O:** Mutations IA, rang Alliance, Slots `1..6`, XP.  **M:** Engine IA *Humankind*, Evaluator Alliance. |
| **`A5`** | **Consolidation, Persistance Cloud & Projection**  (`A5.1` Hash `SHA-256` · `A5.2` Cloud Sync · `A5.3` Render 3D/SVG/FIP) | **I:** `WorldState(T+15)` finalisé, historique du cycle.  **C:** Standards JSON strict, clés Firebase/SQL. | **O:** `StateHash`, enregistrement DB, `SceneDiffPacket`.  **M:** Firestore, Cloud SQL `pgvector`, Dual-Adapter 3D. |

# **5.4 Formules Déterministes Clés des Actigrammes (A1.2, A2.1, A3.2, A3.6)**

* **Delta de Probabilité Adaptatif (A1.2, AR-09) :**  
  ΔP\_adapt \= clamp\[-0.20, \+0.25\]( w1 × ScoreGestionPassée \+ w2 × RetardRelatifIA − w3 × DetteCrisesNonRésolues )  
* **Régénération Sous-PA par Conseiller Présidentiel (A2.1, AR-07) :**  
  Regen\_SousPA(c) \= 1 \+ ⌊(Attr\_c \+ BonusTrait\_c) / 3⌋ \+ ⌊NiveauXP\_c / 3⌋ − (1 si Fatigue\_c \> 80 sinon 0\)  
* **Vitesse Effective de Construction (A3.2 × A3.4, AR-11) :**  
  V\_chantier \= V\_base × (1 \+ ModAtmo\_PNJ(P\_k) \+ BonusDronesChantier) × FacteurMaintenance\_C3 (avec ModAtmo\_PNJ \= −40 %, 0 %, \+25 %, \+40 % pour P1..P4)  
* **Formule Dégâts Round de Combat Déterministe (A3.6, AR-10, R-47) :**  
  DegatsRound(A → B) \= PuissanceBase(Unité, L1..L5) × BonusBiome × ModAtmo × FacteurRavitaillement × (1 − Blindage\_B) × PCG32\_Range(0.90, 1.10)

# **5.5 PLAN DIRECTEUR DES CYCLES, SOUS-CYCLES & SOUS-SOUS-CYCLES MULTI-ÉCHELLES**

## **5.5.1 Pyramide Temporelle Imbriquée & Intrication Tour par Tour / Temps Réel (N0 → N5)**

```
[N5 · CYCLE DE CAMPAGNE & MODE INFINI] (40–60 Cycles Exécutifs = 600–900 Ticks -> Post-Victoire 15h+)
 └── [N4 · MÉGA-CYCLE D'ÈRES & PALIERS] (6–12 Cycles/Ère | 3–6 Cycles/Palier Atmosphérique P1->P4)
      └── [N3 · CYCLE ANNUEL / ORBITAL] (24 Cycles = 360 Ticks = 1 An : Transferts, Référendums, Alliance)
           └── [N2 · SOUS-CYCLE MENSUEL & SAISONNIER] (2 Cycles = 30 Ticks Mois | 4 Cycles = 60 Ticks Saison)
                └── [N1 · CYCLE EXÉCUTIF PIVOT A0] (15 Ticks = Quinzaine : PA/Sous-PA, Dossiers, Combats, SHA-256)
                     └── [N0 · SOUS-SOUS-CYCLE TEMPS RÉEL] (1 Tick = 1 Jour [0x/1x/2x/4x] | Frame 3D 60/120 Hz)
```

| Niveau Temporel | Cadence & Durée | Ce qui s'exécute exactement | Nœuds SADT & Règles |
| :---- | :---- | :---- | :---- |
| **N0 — Micro-Cycle Temps Réel** | Frame 16,6 ms (60 Hz) · 1 Tick \= 1 Jour (1 000 ms en 1x, 500 ms en 2x, 250 ms en 4x) | Animations 3D (navettes, drones, météo instantanée), flux continus de ressources, usure incrémentale, surveillance continue des watchdogs TRIGGER\_BUS, filtrage audio Radio FIP | `A1.1, A5.3, R-22, R-51` |
|  **N1 — Tour Exécutif Pivot (A0 — Tour / Quinzaine)** 1 Tour \= 15 Ticks simulés (15 Jours) avec décompte inter-tours temps réel \+ Déclenchement Automatique (AUTO\_TURN\_TRIGGER) **Cœur du Modèle Hybride Intriqué :** Les décisions stratégiques (PA Général \+ 4 Sous-PA, signature Dossiers P0/C1..C5, ordres d'envoi d'unités L1–L5) sont discrètes et résolues atomiquement au changement de tour. Entre Tour T et T+1, la planète vit en temps réel pausable (0x/1x/2x/4x, 15 ticks) jusqu'au déclenchement automatique (tick 15/15) ou manuel (MANUAL\_END\_TURN). `A0, A1..A5, R-51, R-52, R-67`  | 15 Ticks (15 Jours simulés) | **Cœur du jeu :** Régénération PA Général \+ 4 Sous-PA, apparition & résolution des Dossiers (P0, C1..C5), opérations Conseillers, maintenance C3, météo locale, réaffectation drones (R-41), cyber-paralysies (R-44), Moteur de Combats 4 phases (R-47), évaluation des 5 IA rivales, calcul StateHash SHA-256 & snapshot SQL | `A0, A1..A5, R-52, R-67` |
| **N2 — Sous-Cycle Mensuel & Saisonnier** | 30 Ticks (2 Cycles \= 1 Mois) · 60 Ticks (4 Cycles \= 1 Saison) | **Mensuel :** Consolidation fiscale Villes ↔ État, prélèvement des intérêts de prêts (R-37), révision des cours du Marché de ressources, croissance démographique & montée des 4 paliers sociaux Anno. **Saisonnier :** Bascule des saisons Aven Colony (tempêtes solaires/poussière, vagues de froid, pluies), évaluation des 3 cycles consécutifs de stabilité pour mutation de biome (R-40), déclenchement des DELAYED\_ECHO courts | `A3.2, A3.3, R-37, R-40` |
| **N3 — Cycle Annuel / Orbital** | 360 Ticks (24 Cycles \= 1 An) | Ouverture des fenêtres de transfert orbitales optimales (Transporteurs T1–T4 inter-slots), référendums civiques d'évaluation de mandat (Aven Colony), bilan macro-économique & cote de solvabilité annuelle, renouvellement des directives et subventions de la Super-Alliance, recalcul stratégique de ΔP\_adapt et audit Humankind | `A1.2, A3.6, A4.2, R-31` |
| **N4 — Méga-Cycle de Paliers & d'Ères** | 3–6 Cycles par Palier Atmosphérique · 6–12 Cycles par Ère | Transitions irréversibles des 4 Paliers Atmosphériques (P1→P4) (changement météo, disparition des kits respiratoires, saut de vitesse PNJ \-40 %→+40 %), franchissement des 6 Ères Humankind (I→VI) (déblocage des 18 ressources, doctrines d'héritage, unités L1–L5, nouveaux Slots Planétaires 1→6) | `A3.2, A4.2, A4.3, R-04, R-39` |
| **N5 — Cycle de Campagne & Continuation Infinie** | 40–60 Cycles (2h30–4h) → Mode Infini 15h+ (OPT-08 : A → C) | Résolution des conditions de victoire en Ère VI, bilan de légende & récompenses de carrière, puis bascule libre sans rupture vers le Mode Bac à Sable Infini Post-Victoire (expansion totale Slots 1–6, conquête, biosphère P4 universelle) | `A4.4, OPT-08` |

## **5.5.2 Matrice Spatiale Multi-Échelles (S-0 → S-4) & Couplage Vertical**

| Échelle Spatiale | Entités Pivot | Cycles Dominants Associés | Propagation Ascendante / Descendante |
| :---- | :---- | :---- | :---- |
| **S-4 — Secteur Galactique & Exoplanètes Lointaines** | Slots 4–6 (Exoplanètes Cryo-Océanique, Xéno-Biologique, Monde Pivot), 6 Superpuissances, Transporteurs T4, Influence Galactique | N3 (Annuel/Orbital), N4 (Ères), N5 (Campagne) | Descendante : cours mondiaux, directives Super-Alliance, accès Slots. Ascendante : ressources exotiques, scores Humankind. |
| **S-3 — Système Solaire & Espace Orbital** | Slots 1–3 (Terre/Principale, Lune, Mars/Tellurique), Flottes Orbitales, Constellations Satellites, Transporteurs T1–T3, Miroirs Solaires & Comètes | N1 (Combats/Fret), N3 (Fenêtres orbitales), N4 (Mégaprojets) | Descendante : bombardement orbital, modification T\_glob/H\_eau, érosion satellites (R-48). Ascendante : Boost, Hélium-3, Isotopes. |
| **S-2 — Planète / Globe (72 Tuiles Géodésiques)** | 4 Paliers Atmosphériques (P1→P4), Climat global, Niveau marin, 9 Biomes Universim, Fronts territoriaux AtWar, Découvertes scientifiques | N1 (Combats/Dossiers), N2 (Saisons/Biomes R-40), N4 (Paliers P1→P4) | Descendante : météo, radiations, coût kits respiratoires, modificateur vitesse PNJ. Ascendante : balance alimentaire & industrielle planétaire. |
| **S-1 — Ville & Quartiers Ouverts (Anno 2205 / Humankind)** | Quartiers contigus (zéro dôme), Bâtiments L1–L5 \+ 3 modules greffés, 4 Paliers Sociaux, Maintenance C3, Datacenters T1–T5, Fiscalité locale | N0 (Flux/Usure), N1 (Build/Maintenance/Cyber), N2 (Fiscalité/Croissance) | Descendante : emplois, moral urbain, Compute, défense locale. Ascendante : PIB, trésorerie État, PA bonus. |
| **S-0 — Individu, Escouade & Actif Unitaire (RimWorld / Terra Invicta)** | 4 Conseillers Présidentiels (Sous-PA), 12–30 Colons nommés, Drones (4 classes), Unités Militaires (L1–L5) | N0 (Exposition 4h/j R-39), N1 (Missions, Fatigue, Rounds combat, XP) | Descendante : traits/compétences appliqués aux Dossiers et combats. Ascendante : régénération Sous-PA, ruptures mentales (P0), exploits. |

## **5.5.3 Classification Exhaustive des 10 Familles de Cycles Métier**

* **1\. Cycle Chronologique & Calendrier (CYC-01) :** Tick (1j) → Cycle Exécutif (15j) → Mois (30j) → Saison (60j) → An (360j, à partir de 2050\) → 6 Ères → Mode Infini (R-51, R-52).  
* **2\. Cycle des Points d'Action & Décisions (CYC-02) :** Régénération chaque N1 (15 ticks) du PA Général \+ 4 Sous-PA Conseillers (PA-GES, PA-MNT, PA-BIO, PA-POL), plafond d'accumulation 150 % (R-29), fongibilité asymétrique (R-26), coût d'affinage échelonné (R-34).  
* **3\. Cycle des Événements, Triggers & Mémoire IA (CYC-03) :** Watchdogs continus (N0) sur TRIGGER\_BUS → Dossiers P0 (timer 1–2 cycles) & C1..C5 (N1) → DAG New Vegas majeurs espacés (N2/N3) modulés par ΔP\_adapt → 4 horizons (IMMEDIATE, SUSTAINED\_MODIFIER, DELAYED\_ECHO, MEMORY\_FLAG en pgvector).  
* **4\. Cycle Économique, Financier & Marché (CYC-04) :** Flux opérationnels (N0) → Consolidation Villes ↔ État, intérêts des prêts & révision des cours du Marché (N2 mensuel) → Réévaluation de la cote de solvabilité (R-37) et subventions Super-Alliance (N3 annuel).  
* **5\. Cycle des Ressources & Logistique Inter-Slots (CYC-05) :** Extraction/transformation par chaînes Anno (N0), contrôle des plafonds de stockage (N1), routage par Transporteurs T1–T4 selon tonnage (R-46) et fenêtres orbitales (N3), déblocage progressif des 18 ressources par Ère (N4).  
* **6\. Cycle Météo, Climatique & Biosphérique (CYC-06) :** Événements météo locaux (tempêtes solaires/poussière, pluies, vagues de froid) sur N1/N2 saisonnier ; évolution des 9 biomes après 3 cycles stables (R-40) ; transitions des 4 Paliers Atmosphériques P1→P4 sur N4 (3–6 cycles) impactant directement flore/faune, rendement alimentaire (+35 %), kits respiratoires (100 %→0 %) et vitesse PNJ (-40 %→+40 %).  
* **7\. Cycle de Supervision & Maintenance (CYC-07) :** Usure continue (N0), plans préventifs C3 niveaux 1–3 (N1), arrêt forcé & Trigger P0 sous 25 % d'intégrité (R-38), érosion atmosphérique des satellites orbitaux (R-48).  
* **8\. Cycle Démographique, Colons & Civique (CYC-08) :** Consommation kits respiratoires/vivres & fatigue/XP Conseillers (N1), croissance démographique & progression des 4 paliers sociaux Anno (N2 mensuel), référendums civiques Aven Colony annuels (N3) ou d'urgence sous 35 % d'approbation (R-31).  
* **9\. Cycle Militaire, Drones & Cyberguerre (CYC-09) :** Réaffectation drones (1 cycle, R-41), cyberattaques & paralysies (2 cycles, R-44, surplus Compute 2×), envoi d'unités militaires L1–L5 et résolution du Moteur de Combats 4 phases (N1), entretien de garnison et lignes de ravitaillement (R-47).  
* **10\. Cycle Géopolitique, Ères & Super-Alliance (CYC-10) :** Décisions utilitaires des 5 Superpuissances IA rivales & alliés pairs (N1), évaluation des aides mutuelles et déblocages collectifs de la Super-Alliance (N2/N3), course aux Étoiles d'Ère Humankind, déblocage des Slots 1→6 et passage d'Ères I→VI (N4→N5).

## **5.5.4 Matrice Maîtresse de Coordination Globale**

| Code & Famille | Échelles | Fréquences | Nœud SADT | Déclencheurs Entrants | Effets Sortants vers Autres Cycles |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **CYC-01 Calendrier** | S-0 à S-4 | N0 → N5 | `A0` | Horloge système, Ticks 15/30/360 | Cadence universelle pour tous les 9 autres cycles. |
| **CYC-02 PA & Décisions** | S-0, S-1 | N1 | `A2` | Niveau XP, Traits Conseillers, Fatigue | Autorise l'exécution des Dossiers Exécutifs P0/C1..C5. |
| **CYC-03 Triggers & IA** | S-0 à S-4 | N0, N1, N3 | `A1` | Seuils usure \<25%, CO₂, ΔP\_adapt | Génère les Dossiers P0/C1..C5 et pose des échos DELAYED\_ECHO. |
| **CYC-04 Économie/Prêts** | S-1, S-4 | N0, N2, N3 | `A3.3` | Taxes Villes, Emprunts, Ventes Marché | Alimente la Trésorerie d'État, révalue la solvabilité (R-37). |
| **CYC-05 Logistique Slots** | S-1 à S-4 | N0, N1, N3 | `A3.4, A3.6` | Chaînes Anno, Fenêtres orbitales T1–T4 | Approvisionne les chantiers, évite les pénuries de vivres/H2O. |
| **CYC-06 Météo & Atmo** | S-2, S-3 | N1, N2, N4 | `A3.2` | Pression CO₂, Miroirs solaires, Biomes | Modifie V\_chantier (-40%→+40%), le moral et la flore/faune. |
| **CYC-07 Maintenance C3** | S-1, S-3 | N0, N1 | `A3.1` | Usure temps/météo, Plans préventifs | Règlement sous 25% provoque panne forcé & Crise P0 (R-38). |
| **CYC-08 Colons & Civique** | S-0, S-1 | N1, N2, N3 | `A3.2, A4.4` | Moral, Kits P1, Votations Aven Colony | Déclenche le risque de référendum révocatoire / coup d'État. |
| **CYC-09 Cyber & Milit.** | S-0 à S-3 | N1, N2 | `A3.5, A3.6` | Surplus Compute, Ordres d'envoi L1–L5 | Paralyse des datacenters/villes, résout la conquête de zones. |
| **CYC-10 Super-Alliance** | S-3, S-4 | N2 à N5 | `A4.1..A4.3` | Actions des 5 IA, Étoiles Humankind | Débloque les Slots 1→6, accorde la Victoire et bascule en Mode Infini. |

## **5.5.5 Protocole de Synchronisation Déterministe & Anti-Oscillation (R-51, R-66)**

* **1\. Intrication Tour par Tour Exécutif / Temps Réel Inter-Tours (R-51, R-52) :** Le moteur central articule la simulation en 2 phases couplées : le **Tour Exécutif (N1)** pour l'arbitrage discret des Dossiers PA et ordres d'envoi L1–L5, et le **Temps Réel Inter-Tours (N0)** (15 ticks journaliers) pour l'exécution fluide du monde 3D, des flux et des watchdogs. L'expiration de la jauge (tick 15\) enclenche l'`AUTO_TURN_TRIGGER`, sauf pause tactique ou alerte P0.  
* **2\. Double Tamponnage d'État (Snapshot Barrier) :** Les cycles de même niveau lisent l'état gelé du début de phase et écrivent dans un tampon transitoire committé atomiquement en fin de phase, empêchant qu'un changement météo ou une cyberattaque ne provoque un effet circulaire infini dans le même tick.  
* **3\. Amortisseur TRIGGER\_BUS (Anti-Tempête de Crises) :** Plafond strict de 2 nouveaux dossiers P0 simultanés par Cycle N1 ; au-delà, les incidents mineurs sont agrégés en modificateurs consolidés afin de préserver la lisibilité mobile et la jouabilité de l'économie des PA.

\---

# **PARTITION IV — ARCHITECTURE SRC/ & SYSTÈME DE MATRICES RELATIONNELLES ICOM**

# **6\. ARCHITECTURE TECHNIQUE DU CODE SOURCE (SRC/) & CORRESPONDANCE MODULES**

# **6.1 Arborescence Unifiée Plate `src/` & Dossier Unique `/docs/` (Google AI Studio Build + `/docs/master-blueprint/`)**

**Fusion unifiée `/docs/` (`v2.13.0-MAITRE`) :** l'ancien répertoire racine `/master-blueprint/` a été fusionné dans **`/docs/master-blueprint/`** afin que `/docs/` constitue l'unique racine documentaire du projet, avec **`/docs/DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md`** comme Master Blueprint intégral en un seul fichier (Partitions I–V + Annexes A–J) accompagné des manifestes machine (`M0_MetaSemVer.json`, `M13_SADT_Mapping.json`, `contracts-ssot/*.schema.json`, projections Tri-Format). Côté exécution, Google AI Studio Build exécute la racine plate Vite 8 + Express BFF (`server.ts`, `index.html`, `package.json`, `eslint.config.mjs`) alignée 1:1 avec `apps/exo-world/`.

```
exo-world-2050/ (Racine plate AI Studio Build — EXOW-ROOT@5.1.0-alpha.1)
├── server.ts                         # [L8] Serveur Express port 3000 + vite.middlewares + OAuth GitHub/Drive
├── firestore.rules & firebase-blueprint.json
├── docs/                             # DOSSIER DOCUMENTAIRE UNIQUE UNIFIÉ (APP + GAME + SSoT)
│   ├── DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md  # MASTER BLUEPRINT INTÉGRAL UNIFIÉ (v2.13.0-MAITRE, Annexes A-J)
│   ├── 00_INDEX_DOCS.md              # Index maître Pôle APP & Pôle GAME
│   ├── SYSTEM_INSTRUCTION_LIVE.md    # Directives invariantes R-01..R-69 & SYS-INST-EXW-001
│   ├── master-blueprint/             # Ancien /master-blueprint fusionné ici (M0, M13, Tri-Format, contracts-ssot/)
│   ├── architecture/                 # Fiches techniques L0..L8, boucle, 3D PBR & 05_SRC_ARBO_AISTUDIO_COMPLETE.md
│   ├── api-and-db/                   # Documentation /api/*, Firestore & Drive/GitHub OAuth
│   ├── gameplay/, design/, matrices/ # GDD, UX Pax Historia, MC-00 & SM-01..SM-06
│   ├── governance/                   # DOC-APP-GOV-001_ROLES_PERMISSIONS_WORKFLOW.md (RBAC 5 rôles)
│   ├── changelogs/                   # FUP_TRACKER.md, V1_PLAYTEST_HISTOIRE_6_TOURS.md, BETA_FEEDBACK_REPORT.md
│   └── inter-ia/                     # BUS_MESSAGES.md (BUS-EXW-001), inbox/, outbox/
├── scripts/                          # exo-audit.ts, export-trifmt.ts, gen-doc-mesh.ts (17/17 PASS GO)
├── tests/                            # node:test + Vitest (déterminisme, BioHealth, AR-19, VCS, Dev Bridge)
└── src/                              # 24 Domaines architecturaux (L0 à L8) — 1:1 avec M13_SADT_Mapping.json
    ├── [L0] contracts/ & parsers/    # Schémas Zod SSoT (dont dev-bridge, skills-vcs, ethics-maslow) & parseurs
    ├── [L1] config/ & data/          # Constantes gelées (Object.freeze) & catalogues (skills-vcs, blueprint-manifests)
    ├── [L2] core/ & guardrails/      # PCG32, SHA-256, bus, triggers, queues, dispatchers, routers, Z0/R-50/Kahn
    ├── [L3] systems/                 # Noyaux métier purs (dossiers, biohealth, économie, combat L1-L5, diplomatie, governance)
    ├── [L4] engine3d/, adapters/, bridges/ # Three.js 0.187.0 PBR/Rayleigh-Mie, Inspecteur 135°, Unity 6 URP
    ├── [L5] retrievers/, stores/, services/, pipelines/, doc-sync/, worker/
    ├── [L6] hooks/                   # Hooks React réutilisables (<= 200 lignes)
    ├── [L7] components/ & interfaces/# Bento 135° Snapshot V7, ExoTooltip, Configurateur Genèse, DocsSkillsHubScreen (3 ailes)
    └── [L8] app/api/                 # Routeurs Express BFF (/api/oracle, /api/dev-bridge, /api/doc-governance, /api/docs-vcs)
```

# **6.2 Développement Détaillé de Chaque Dossier Niveau 0 & Correspondance Modules Conceptuels**

## **6.2.1 src/contracts/ \[Couche L0\] — Source de Vérité Exécutable (R-01, R-09, R-12)**

* **Fichiers clés :**`exo-shell.schema.ts`, `world-state.schema.ts`, `pa-dossiers.schema.ts` (PA Général \+ 4 Sous-PA \+ 5 Classes C1..C5 \+ P0), `trigger-bus.schema.ts` (Voie 3), `maps-biomes.schema.ts` (Slots 1→6, 72 tuiles, 4 paliers atmosphère), `narrative-dag.schema.ts` (DAG New Vegas, ΔP\_adapt), `render-bridge.schema.ts` (SceneDiffPacket ↔ DTO C\# Unity 6), `economy-cyber.schema.ts` (Villes/État, Prêts, Marché, Drones, Compute), `combat-units.schema.ts` (Moteur 4 phases, Unités L1–L5), `ethics-maslow.schema.ts` (Badges de raisonnement, 5 strates Maslow, Échelle 6 niveaux).  
* **Responsabilité & Correspondance :** Governe 100 % des frontières client/serveur/3D. Zéro type TypeScript dérivé manuellement.

## **6.2.2 src/config/ \[Couche L1\] — Constantes Métier Préfixées (R-23)**

* **Fichiers clés :**`pa.constants.ts` (PA\_), `atmosphere.constants.ts` (ATM\_), `economy.constants.ts` (ECO\_, MKT\_), `maintenance.constants.ts` (MNT\_), `cyber-drones.constants.ts` (CYB\_, DRN\_), `narrative-freetier.constants.ts` (EVT\_, FTG\_), `engine3d.constants.ts` (ENG3D\_), `audio-fip.constants.ts` (AUD\_).

## **6.2.3 src/data/ \[Couche L1\] — Catalogues Statiques Data-Driven (R-04, R-50)**

* **Fichiers clés :**`eras-humankind.catalog.ts` (6 Ères, Étoiles, Doctrines), `superpowers-alliances.catalog.ts` (Superpuissances & Super-Alliances), `buildings-modules.catalog.ts` (Bâtiments Anno \+ 3 modules greffés), `resources-by-era.catalog.ts`, `scientific-discoveries.catalog.ts` (Nomenclature sans « anomalie »), `fallback-dossiers.catalog.ts` (Repli déterministe R-68), `ethical-frameworks.catalog.ts`, `maslow-needs.catalog.ts`, `personality-context.catalog.ts`.

## **6.2.4 src/core/ \[Couche L2\] — Noyau Pur Déterministe (R-13, R-17, R-66, R-67)**

* **Fichiers clés :**`prng/pcg32.ts`, `hashing/state-hasher.ts` (SHA-256), `bus/trigger-bus.ts` (Voie 3 Watchdogs \+ Triggers IA), `loop/cycle-orchestrator.ts` (Actigramme A0 / 15 ticks), `loop/intent-queue.ts`, `probability/adaptive-delta.ts` (ΔP\_adapt).  
* **Responsabilité :** Orchestration centrale SADT A0, A1.1, A1.2, A5.1. Zéro I/O.

## **6.2.5 src/systems/ \[Couche L3\] — Logique Métier Pure des Modules de Jeu (R-13, R-51)**

* **Sous-dossiers & Correspondance :**  
  • `systems/dossiers-pa/` → Moteur d'Événements & PA (A2.1..A2.3, PA Général \+ 4 Sous-PA, Atelier 3 Étages, application atomique des hooks DAG).  
  • `systems/maintenance/` → Module Supervision & Maintenance C3 (A3.1, usure, préventif niveaux 1–3, triggers \< 25 %).  
  • `systems/biosphere/` → Module Biomes, Atmosphère & PNJ C4 (A3.2, 4 paliers P1..P4, météo, 9 biomes, kits respiratoires, vitesse PNJ).  
  • `systems/economy-urban/` → Module Gestion & Build C2 (A3.3, A3.4, Villes ↔ État Cities II, prêts, marché, modules Anno, quartiers Humankind).  
  • `systems/colons-cabinet/` → Module Cabinet & Colons RimWorld (traits, passions, fatigue, loyauté, XP, référendums Aven Colony).  
  • `systems/cyber-drones-fleet/` → Module Drones, Datacenters, Cyber & Flottes (A3.5, 4 classes drones, Compute, Transporteurs T1–T4).  
  • `systems/combat-conquest/` → Moteur de Combats Déterministe 4 Phases & Unités Militaires Multi-Niveaux (L1–L5, A3.6, conquête par zones AtWar).  
  • `systems/geopolitics-ai/` → Module Super-Alliance, Slots Planétaires & IA Humankind (A4.1..A4.4, 5 IA déterministes, déblocage Slots 1→6, XP/Succès).  
  • `systems/ethics-pedagogy/` → Moteur Éthique Thomiste, Pyramide de Maslow, Badges de raisonnement & Échelle Pédagogique à 6 Niveaux.

## **6.2.6 src/engine3d/ \[Couche L4\] — Moteur des Maps 3D Three.js / R3F (FEAT-43, FEAT-44)**

* **Fichiers clés :**`pipeline/renderer-context.ts` (WebGL2/WebGPU \+ WebKit Memory Shield), `scenes/space-slots-scene.ts` (Échelle 1 : Carte Spatiale & Slots 1→6), `scenes/planet-globe-scene.ts` (Échelle 2 : Globe 72 tuiles géodésiques), `scenes/city-quarters-scene.ts` (Échelle 3 : Quartiers Ouverts Anno 2205), `camera/multiscale-rig.ts` (650 ms), `instancing/instance-pool.ts`, `shaders/atmosphere-biomes.glsl.ts`, `shaders/telemetry-overlays.glsl.ts`, `picking/deterministic-raycaster.ts` (COL\_\*) & `pins/hologram-preview.ts` (Balises Dossiers & Prévisualisation fantôme).  
* **Correspondance :** Maps 3D, Onglet Monde 3D & Preuves Télémétriques 3D.

## **6.2.7 src/adapters/ \[Couche L4\] — Pont Dual-Adapter Three.js ↔ Unity 6 URP (AR-12, FEAT-45)**

* **Fichiers clés :**`render-adapter.interface.ts`, `threejs-render.adapter.ts`, `unity6-webgl.adapter.ts`, `scene-diff-projector.ts` (calcul dirty flags lecture seule).

## **6.2.8 src/stores/ \[Couche L5\] — État Applicatif Réactif (R-18)**

* **Fichiers clés :**`world.store.ts` (Zustand : WorldState \+ dispatch intents), `exo-shell.store.ts` (navigation 8 écrans \+ paramètres), `dossiers.store.ts` (File P0, C1..C5, état Atelier 3 Étages), `selection.atoms.ts` (Jotai : entité 3D sélectionnée, overlay actif, hologramme).

## **6.2.9 src/services/ \[Couche L5\] — Connecteurs Cloud, IA & Audio (AR-01, AR-02, AR-14)**

* **Fichiers clés :**`firebase/firebase-client.ts`, `firebase/firebase-admin.ts`, `sql/postgres-client.ts`, `sql/chronicle-pgvector.repo.ts`, `sql/snapshot.repo.ts`, `gemini/gemini-dossier.service.ts`, `gemini/free-tier-governor.ts`, `audio/fip-radio.service.ts`.

## **6.2.10 src/pipelines/ \[Couche L5\] — Orchestration IA & Campagne (A1.3, A5.2)**

* **Fichiers clés :**`dossier-generation.pipeline.ts` (RAG pgvector \+ Manifeste → Gemini Dual-Pass → Zod \+ Kahn/BFS → TRIGGER\_BUS), `campaign-bootstrap.pipeline.ts`, `cycle-sync.pipeline.ts`.

## **6.2.11 src/hooks/ \[Couche L6\] — Hooks React (\<= 200 lignes)**

* **Fichiers clés :**`use-auth-guard.ts`, `use-cycle-clock.ts`, `use-scale-camera.ts`, `use-pa-allocator.ts`, `use-svg-backdrop.ts`, `use-fip-audio.ts`.

## **6.2.12 src/components/ \[Couche L7\] — Composants Atomiques Bento & Télémétrie (\<= 200 lignes)**

* **Sous-dossiers :**`bento/` (cartes biseautées 135deg, badges PA/Sous-PA), `svg-backdrop/` (fond SVG dynamique à fondus enchaînés), `hud/` (Top Bar, Fil d'Ariane 3 Échelles, Dock 5 Classes), `audio/` (Mini-lecteur Radio FIP), `charts/` (Courbes comparatives Humankind).

## **6.2.13 src/interfaces/ \[Couche L7\] — Les 8 Écrans EXO-SHELL & Modules Onglets (\<= 200 lignes)**

* **Correspondance Joueur :**  
  • `interfaces/boot/`, `auth/`, `main-menu/`, `new-simulation/`, `system-settings/`, `briefing-lobby/` (Solo), `game-screen/`.  
  • `interfaces/subscreens/dossier-workshop/` → Moteur d'Événements & Atelier 3 Étages / Modale DAG New Vegas.  
  • `interfaces/subscreens/world-tab/` → Onglet Monde (Slots Planétaires 1→6, Globe, Quartiers Anno, Bâtiments Modulaires).  
  • `interfaces/subscreens/journal-chronicle/` → Onglet Journal & Chronique (Historique paginé SQL chronicle\_turns, preuves 3D collectées, échos différés, audit SHA-256).  
  • `interfaces/subscreens/maintenance-tab/`, `biosphere-colons-tab/`, `geopolitics-alliance-tab/`, `military-cyber-tab/` (Unités L1–L5 & Combats 4 phases), `pause-saves-tab/`.

## **6.2.14 src/app/ \[Couche L8\] — Next.js 15 App Router & Route Handlers JWT (R-07, R-11)**

* **Pages & Routes API :**`app/page.tsx`, `app/api/dossiers/generate/route.ts`, `app/api/saves/sync/route.ts`, `app/api/chronicle/query/route.ts`, `app/api/lobby/init/route.ts`.

## **6.2.15 src/bridges/ \[Couche L4/L5\] — Ponts d'Interopérabilité Isolés**

* **Fichiers clés :**`render-dual.bridge.ts` (Three.js ↔ Unity 6 URP via `SceneDiffPacket`), `narrative-core.bridge.ts` (sas unidirectionnel Oracle Gemini → `ExecutiveDecisionIntent` pur), `cloud-hybrid.bridge.ts` (synchronisation atomique Firestore ↔ Cloud SQL PostgreSQL 16).  
* **Responsabilité & Correspondance :** Assure l'isolation des adaptateurs externes et de l'IA sans impacter la simulation déterministe. Correspondance : `SM-05`, `AR-12`, `R-12`, `R-69`.  
* **Dossier Drive dédié :** [Dossier Drive 01\_bridges](https://drive.google.com/drive/folders/1SASBLRQb-KC9vzOdD8FCJTDJlwKvUKgV)

## **6.2.16 src/parsers/ \[Couche L0/L2/L5\] — Parseurs Stricts de Frontières**

* **Fichiers clés :**`zod-boundary.parser.ts`, `gemini-dualpass.parser.ts` (extraction JSON structuré Passe 2 `temp: 0.0`), `dag-tree.parser.ts` (normalisation `ComplexDialogueTree`), `snapshot-gzip.parser.ts`, `unity-event.parser.ts`.  
* **Responsabilité & Correspondance :** Validation et parsing sans perte aux frontières système. Correspondance : `SM-05`, `R-01`, `R-12`.  
* **Dossier Drive dédié :** [Dossier Drive 02\_parsers](https://drive.google.com/drive/folders/1G3-11kLLd6laG98Rx-D3fTtFOFCF1-_d)

## **6.2.17 src/core/triggers/ \[Couche L2\] — Déclencheurs & Voie 3 TRIGGER\_BUS**

* **Fichiers clés :**`watchdog-thresholds.trigger.ts` (usure `< 25 %`, `CO₂`, dette critique, intrusion cyber, retard d'Ère), `auto-turn.trigger.ts` (`AUTO_TURN_TRIGGER` au tick 15/15), `delayed-echo.trigger.ts` (échéancier des `DELAYED_ECHO`).  
* **Responsabilité & Correspondance :** Surveillance déterministe et émission d'échos événementiels. Correspondance : `SM-01`, `A1.1`, `AR-03`, `R-53`.  
* **Dossier Drive dédié :** [Dossier Drive 03\_triggers](https://drive.google.com/drive/folders/1wSrXGU6dL3yzJACdkFVuBK-zFEdj1O7J)

## **6.2.18 src/core/dispatchers/ \[Couche L2/L3\] — Répartiteurs d'Intentions & d'Ordres**

* **Fichiers clés :**`intent.dispatcher.ts` (ventilation canonique vers `A3.1..A3.6`), `dossier.dispatcher.ts` (triage File `P0` & Classes `C1..C5`), `unit-drone.dispatcher.ts` (envoi Unités Militaires `L1–L5` & 4 classes de drones), `event-hook.dispatcher.ts` (application atomique des hooks validés).  
* **Responsabilité & Correspondance :** Distribution unifiée des ordres d'exécution. Correspondance : `SM-01`, `SM-04`, `A2`, `R-24`, `R-47`.  
* **Dossier Drive dédié :** [Dossier Drive 04\_dispatchers](https://drive.google.com/drive/folders/1Vd67IQBAWsv4ox-7nIdrZWO0NqKONgth)

## **6.2.19 src/core/routers/ & src/app/api/ \[Couche L2/L5/L8\] — Routeurs Système, IA & Routes API**

* **Fichiers clés :**`sot-layer.router.ts` (Squelette d'Attention `R-02` ≤ 3 couches), `llm-freetier.router.ts` (aiguillage 0-LLM / Gemini Flash / Gemini Pro High Thinking / Fallback local `R-68`), `inter-slot.router.ts` (routage fret Transporteurs `T1–T4`), et routes serveur JWT `src/app/api/*`.  
* **Responsabilité & Correspondance :** Aiguillage de requêtes et de flux inter-slots/serveur. Correspondance : `SM-03`, `SM-05`, `R-02`, `R-46`, `R-68`.  
* **Dossier Drive dédié :** [Dossier Drive 05\_routers\_et\_routes](https://drive.google.com/drive/folders/16pQug7o7218rSYBY8wgeBU3K4JfcEtcK)

## **6.2.20 src/retrievers/ \[Couche L5\] — Récupérateurs RAG Hybride Multi-Sources**

* **Fichiers clés :**`hybrid-rag.retriever.ts` (orchestrateur `<= 180 ms` p95), `pgvector-memory.retriever.ts` (similarité cosinus 768d cloisonnée `WHERE campaign_id = $1 AND owner_uid = $2`), `chronicle-turns.retriever.ts` (15 derniers tours SQL), `action-manifest.retriever.ts` (`ActionCapabilityManifest` vivant).  
* **Responsabilité & Correspondance :** Extraction contextuelle RAG pour Gemini. Correspondance : `SM-05`, `A1.3`, `AR-01`, `AR-13`.  
* **Dossier Drive dédié :** [Dossier Drive 06\_retrievers](https://drive.google.com/drive/folders/1cOetjTDTdm2unDPxurBI6ifdiGiUBgUQ)

## **6.2.21 src/core/queues/ & src/services/queues/ \[Couche L2/L5\] — Files d'Attente Déterministes & Résilientes**

* **Fichiers clés :**`intent.queue.ts` (tri canonique par séquence avant Phase 1), `dossier-p0.queue.ts` (file prioritaire `P0` à timer), `build-modular.queue.ts` (file de chantiers *Anno*), `cloud-sync.queue.ts` (tampon exponentiel résilient en cas de micro-coupure réseau).  
* **Responsabilité & Correspondance :** Ordonnancement sans perte de tâches et d'intents. Correspondance : `SM-01`, `SM-03`, `A2`, `R-32`, `R-51`.  
* **Dossier Drive dédié :** [Dossier Drive 07\_queues](https://drive.google.com/drive/folders/1rrkY428REAw5cSkJES_JOSORu_EKQTKh)

## **6.2.22 src/guardrails/ \[Couche L2/L5\] — Garde-Fous Bloquants & Sécurité Runtime**

* **Fichiers clés :**`zod-airlock.guardrail.ts` (bornage strict `[-0.15, +0.15]`), `dag-topology.guardrail.ts` (tri topologique de Kahn \+ parcours BFS sans impasse), `freetier-budget.guardrail.ts` (quotas RPM/TPM `R-68`), `anti-oscillation.guardrail.ts` (Snapshot Barrier \+ plafond `2` crises `P0`/cycle), `webkit-memory.guardrail.ts` (WebKit Memory Shield `< 250 Mo` `R-14`), `nomenclature.guardrail.ts` (rejet strict du terme « anomalie » `R-50`).  
* **Responsabilité & Correspondance :** Validation bloquante avant application de toute mutation. Correspondance : `SM-01`, `SM-05`, `R-12`, `R-50`, `R-68`, `R-69`.  
* **Dossier Drive dédié :** [Dossier Drive 08\_guardrails](https://drive.google.com/drive/folders/1ZvgutpXOXro6DsyXvcOYq5uZ6oWDTs00)

# **6.3 Matrice des Dépendances Autorisées & Interdites par Couche (R-02, R-13)**

| Couche Source | Dépendances Autorisées | Dépendances Strictement Interdites | Justification Normative |
| :---- | :---- | :---- | :---- |
| `L0 contracts/` | `zod` | Toutes autres couches L1..L8 | Source de vérité absolue indépendante. |
| `L2 core/` | `L0 contracts/`, `L1 config/data/` | L4 engine3d/, L5 services/, React, DOM | Noyau pur sans I/O déterministe (R-13). |
| `L3 systems/` | `L0`, `L1`, `L2 core/` | L4 engine3d/, L5 services/, React, DOM | Logique métier pure sans I/O (R-13). |
| `L4 engine3d/` | `L0`, `L1`, `three`, `@react-three/fiber` | L3 systems/ (écriture direct State) | Le rendu lit l'état, n'exécute pas de simulation. |
| `L5 stores/services/` | `L0` à `L4`, Firebase, SDK Gemini, Zustand | L6..L8 (Composants React UI) | Les services ne doivent pas dépendre du composant UI. |
| `L7 components/interfaces/` | `L0` à `L6`, React, Framer Motion, Tailwind | Appels direct DB / SDK Gemini (doit passer par L5) | Séparation stricte UI / Services. |

# **7\. SYSTÈME DE MATRICES RELATIONNELLES, MATRICE DE CORRESPONDANCE CENTRALE & SOUS-MATRICES ICOM**

## **7.1 Architecture du Graphe Matriciel (Modèle en Étoile 3NF Documentaire)**

Afin d'éviter toute redondance et garantir une mise à jour optimale, la structure documentaire adopte une architecture matricielle en étoile à 3e forme normale (3NF). La **Matrice de Correspondance Centrale (MC-00)** sert de table de jointure unifiée reliant les 7 référentiels du projet (`SADT`, `CYC`, `FEAT`, `AR`, `OPT`, `R`, `SRC`) et pointe directement vers 5 Sous-Matrices Relationnelles ICOM (`SM-01` à `SM-05`).

* 

```
                      [SM-01 : DECISION / PA / BUS]
                                    │
[SM-02 : PHYSIQUE / ATMO] ──► [MC-00 : JOINTURE] ◄── [SM-03 : MACRO-ÉCO / SLOTS]
                                  ▲   ▲
           ┌──────────────────────┘   └──────────────────────┐
[SM-04 : MILITAIRE / CYBER / L1-L5]            [SM-05 : TECHNIQUE / RAG / 3D]
```

## **7.2 Matrice de Correspondance Centrale (MC-00 — Jointure Globale des 7 Référentiels)**

| Clé Domaine | Sous-Matrice | Nœuds SADT | Cycles CYC | Features FEAT | Arbitrages AR & OPT | Règles R-XX | Dossiers src/ |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| `DOM-PA` | `SM-01` | A1, A2 | CYC-02, 03 | FEAT-03, 09..12, 16 | AR-03, 07, 08 · OPT-03 | R-24..35, R-53 | systems/dossiers-pa/, core/bus/, core/triggers/, core/dispatchers/, core/queues/, guardrails/ |
| `DOM-BIO` | `SM-02` | A3.1, A3.2 | CYC-06, 07, 08 | FEAT-25..31 | AR-11, 14 · OPT-01, 05 | R-38..40, R-49 | systems/biosphere/, maintenance/, core/triggers/, guardrails/ |
| `DOM-ECO` | `SM-03` | A3.3, A3.4, A4.2 | CYC-04, 05, 10 | FEAT-17..24, 33, 34, 37 | AR-04..06, 15 · OPT-04, 08, 10 | R-04, R-27, R-36..37, R-46 | systems/economy-urban/, geopolitics-ai/, core/routers/, core/queues/ |
| `DOM-MIL` | `SM-04` | A3.5, A3.6, A4.1 | CYC-09, 10 | FEAT-35, 36, 38..40 | AR-10, 16 · OPT-07, 12 | R-41..48, R-50 | systems/combat-conquest/, cyber-drones-fleet/, core/dispatchers/ |
| `DOM-IA3D` | `SM-05` | A1.2, A1.3, A5 | CYC-01, 03 | FEAT-01..08, 13..15, 41..48 | AR-01..02, 09, 12..13 · OPT-02, 06, 09, 11 | R-01..23, R-51..69 | core/, engine3d/, adapters/, bridges/, parsers/, retrievers/, guardrails/, services/, pipelines/ |
| `DOM-UX6` | `SM-06` | A0, A2, A5 | CYC-01..10 | FEAT-01..08, FEAT-11..13 | AR-03, AR-07, AR-12 · OPT-SHELL-01..03 | R-10, R-18, R-24, R-54..58 | interfaces/, stores/, components/bento/ |

## **7.3 Sous-Matrices Relationnelles avec Flux ICOM (SM-01 à SM-05)**

### **7.3.1 SM-01 — Sous-Matrice Décisionnelle : PA, Cabinet, Dossiers & TRIGGER\_BUS**

| Relation ID | Entité Source → Cible | Input (I) | Control (C) | Output (O) | Mechanism (M) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `REL-PA-01` | Conseillers → Sous-PA | Roster Colons/Cabinet | Attributs, XP, Fatigue | Regen Sous-PA (A2.1) | Formule Regen\_SousPA |
| `REL-PA-02` | Watchdogs → Crises P0 | Télémétrie, Usure \< 25% | TRIGGER\_BUS, Plafond P0 | File Crises P0 (A1.1) | Watchdogs Déterministes |
| `REL-PA-03` | Atelier 3 Étages → Intents | Dossiers C1..C5, PA/Sous-PA | Axe New Vegas, Preview 3D | DecisionIntent\[\] (A2.3) | Engine Affinage Zod |
| `REL-PA-04` | Gemini → Triggers Différés | DecisionIntent validé | Rules R-53, R-69 | DELAYED\_ECHO (A1.3) | TRIGGER\_BUS \+ pgvector |

### **7.3.2 SM-02 — Sous-Matrice Physique : Atmosphère P1..P4, Biomes, Maintenance C3 & PNJ**

| Relation ID | Entité Source → Cible | Input (I) | Control (C) | Output (O) | Mechanism (M) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `REL-BIO-01` | Terraformation → Palier Atmo | Miroirs, Gaz, CO₂ | Seuils P1..P4 (AR-11) | Transition Palier (A3.2) | Atmosphere System |
| `REL-BIO-02` | Palier Atmo → Kits / Vitesse PNJ | Palier Actuel P\_k | Rules R-39, R-49 | V\_chantier (-40%..+40%) | Formule V\_chantier |
| `REL-BIO-03` | Usure / Météo → Maintenance C3 | Âge Bâtiment, Tempêtes | Niveaux Préventifs 1-3 | Niveau Intégrité (A3.1) | Maintenance System C3 |
| `REL-BIO-04` | Biomes / Moral → Référendums | Qualité de vie, Abri | Seuil Approbation \< 35% | Votation Aven Colony | Civic Evaluator |

### **7.3.3 SM-03 — Sous-Matrice Macro-Économique : Villes-État, Prêts, Marché, Super-Alliance & Slots 1-6**

| Relation ID | Entité Source → Cible | Input (I) | Control (C) | Output (O) | Mechanism (M) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `REL-ECO-01` | Villes → Budget État | Taxes Villes Anno | Modèle Cities II, Solvabilité | Trésorerie État (A3.3) | Consolidateur Fisc/Prêts |
| `REL-ECO-02` | Dette → Taux Prêts | Ratio Dette / Revenus | Rule R-37, Cote AAA-D | Taux d'Emprunt Fixé | Bank Rating Engine |
| `REL-ECO-03` | Entraide IA → Alliance → Slots | Aides aux Alliés Pairs | Rang Super-Alliance (A4.2) | Déblocage Slots 1-6 | Alliance Evaluator |
| `REL-ECO-04` | Transporteurs T1–T4 → Fret | Stocks Inter-Slots | Tonnage Max T1-T4 (R-46) | Flux Ressources Réparti | Inter-Slot Router |

### **7.3.4 SM-04 — Sous-Matrice Militaire & Cyber : Datacenters, Drones, Unités L1–L5 & Combats 4 Phases**

| Relation ID | Entité Source → Cible | Input (I) | Control (C) | Output (O) | Mechanism (M) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `REL-MIL-01` | Datacenters → Cyber-Paralysie | Compute T1-T5, Énergie | Surplus Compute 2x (R-43) | Paralysie 2 cycles (A3.5) | Cyber Attack Module |
| `REL-MIL-02` | Drones → Chantier / Reco / Combat | Flotte Drones 4 Classes | Délai réaffectation 1 cycle | Bonus Chantier / Reco | Drone Fleet Dispatcher |
| `REL-MIL-03` | Ordre L1–L5 → Moteur Combats 4P | Unités Militaires L1-L5 | Rule R-47, Biome, Atmo | DegatsRound (A3.6) | Deterministic Combat Core |
| `REL-MIL-04` | Victoire Zone → Capture & Score | Résolution Combats 4P | Zones AtWar adjacentes | Garnison & Humankind XP | Territorial Conquester |

### **7.3.5 SM-05 — Sous-Matrice Technique : RAG pgvector, Oracle Gemini, Noyau PCG32 & Dual-Adapter 3D**

| Relation ID | Entité Source → Cible | Input (I) | Control (C) | Output (O) | Mechanism (M) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `REL-TEC-01` | WorldState \+ pgvector → Context | 15 Derniers Tours, Embeddings | Similarité Cosinus ≤ 0.82 | StateBrief \+ ΔP\_adapt | Chronicle RAG Repository |
| `REL-TEC-02` | Gemini Dual-Pass → Sas Zod | Prompt Structuré StateBrief | Free Tier Governor (R-68) | JSON Validé / Tri Kahn | Gemini Intelligence Service |
| `REL-TEC-03` | Noyau Pur → StateHash | Intents Validés \+ WorldState | PCG32 Seed, R-66, R-67 | StateHash SHA-256 (A5.1) | StateHasher Bit-à-Bit |
| `REL-TEC-04`  | SceneDiffPacket → Rendu 3D/SVG | WorldState(T+15) Muté | Memory Shield \< 250 Mo | Frame 3D \+ Fond SVG | Three.js / Unity 6 Adapter / Bridges |

## **7.4 Sélecteurs d'Options Verrouillés (OPT-01 à OPT-12) & Synthèse Décisionnelle**

## **7.3.6 SM-06 — Matrice Relationnelle & de Correspondance des 6 Espaces Joueur (Monde ↔ Événement ↔ Journal ↔ Profil État ↔ Profil Personnage Incarné ↔ Profil Joueur)**

**Tableau A — Matrice de Correspondance Inter-Espaces 6×6 (Jointure & Perméabilité UX)**

| Espace Source \\ Cible | 1\. Onglet Monde 3D | 2\. Onglet Événement | 3\. Onglet Journal | 4\. Profil de l'État | 5\. Profil Personnage | 6\. Profil Joueur |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **1\. Onglet Monde 3D** | Cœur 3D (Maps, Slots 1→6, Anno, L1–L5) | Ancre balises Dossiers & Hologrammes 3D | Fournit télémesures 3D & preuves visuelles | Alimente PIB local, énergie, Compute | Incite l'emplacement physique du Conseiller | Dépense VRAM/RAM (Memory Shield) |
| **2\. Onglet Événement** | Mute le terrain 3D, pose bâtiments/unités | Moteur d'Événements & Atelier 3 Étages | Logue le TurnRecord & hash SHA-256 | Consomme PA/Sous-PA & Trésorerie | Applique fatigue, XP & skill-checks | Incrémente succès & stats de carrière |
| **3\. Onglet Journal** | Rejoue caméra 3D sur faits passés | Déclenche DELAYED\_ECHO via TRIGGER\_BUS | Chronique SQL chronicle\_turns & pgvector | Affiche courbes historiques Humankind | Archive l'historique moral/légitimité | Exportable en fichier de sauvegarde SQL |
| **4\. Profil de l'État** | Débloque Slots 1→6 & limites stockage | Fixe les plafonds PA Général / Taux prêts | Fournit les séries temporelles financières | Trésorerie, Prêts, Alliance, Doctrines | Détermine le budget du Cabinet Ministériel | Score global de fin de campagne |
| **5\. Profil Personnage** | Commandement direct des unités L1–L5 | Modifie les modificateurs de skill-checks | Enregistre les exploits & crises subies | Conditionne la légitimité (Référendums) | Directeur Exécutif \+ 4 Conseillers | Progression XP du personnage réutilisable |
| **6\. Profil Joueur** | Ajuste la qualité 3D Three.js/Unity 6 | Active/désactive governor Gemini Free Tier | Charge/sauvegarde les snapshots Cloud | Définit la difficulté & la worldSeed | Sélectionne le portrait & la faction | Compte Firebase Auth, Audio FIP, Settings |

**Tableau B — Flux Relationnels ICOM des 6 Espaces UX (REL-UI-01 à REL-UI-06)**

| Relation ID | Entité Source → Cible | Input (I) | Control (C) | Output (O) | Mechanism (M) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `REL-UI-01` | Monde 3D → Moteur Événements | Coordonnées 3D, Tuile choisie | Ancre Hologramme FEAT-12 | Dossier d'Initiative R-33 | Deterministic Raycaster |
| `REL-UI-02` | Moteur Événements → Journal SQL | DecisionIntent signé | Rule R-08, Zod Validation | Log immuable & Embedding | Chronicle pgvector Repo |
| `REL-UI-03` | Journal SQL → Profil État | Historique 15 derniers tours | Comparateur Humankind | Courbes macro-économiques | Time Series Aggregator |
| `REL-UI-04` | Profil Personnage → Événements | Attributs, Passion, Fatigue | Skill-Checks New Vegas | Modificateur de succès | Pawn Check Engine |
| `REL-UI-05` | Profil Joueur → Rendu 3D | Settings (Unity 6 URP Principal + Aperçu Three.js) | Memory Shield \< 250 Mo | DPR, Shaders & DrawCalls | RenderAdapter Pipeline |
| `REL-UI-06` | Profil Joueur → Profil État | worldSeed, Superpuissance | Rules R-11, R-17 (PCG32) | WorldState initialisé | Campaign Bootstrap Engine |

# **7.4.1 Tableau Maître des 12 Sélecteurs d'Options (OPT-01 à OPT-12)**

| ID & Axe | Options Sélectionnables \[x\] / \[ \] | Priorité | Statut | Impact Architecture & Vague |
| :---- | :---- | :---- | :---- | :---- |
| `OPT-01`Scope Planétaire | \[x\] A. 1 Planète (Slot 1\) ultra-soignée puis déblocage Slots 2→6 en V3\[ \] B. 2 Mondes (Terre \+ Lune) dès V1\[ \] C. 4 Mondes complets dès V1 | `P1` | **VERROUILLÉ** | Focus V1 sur stabilité 72 tuiles géodésiques de Slot 1\. |
| `OPT-02`Moteur 3D | \[x\] A. Dual-Adapter (Three.js V1–V4 \-\> Unity 6 URP V5)\[ \] A+. Unity 6 URP Principal (`C#/Shader Graph/Burst/.jslib/Addressables`) + Aperçu Web Three.js (`SceneDiffPacket`) | `P1` | **VERROUILLÉ** | Protocole SceneDiffPacket unique (voir 7.3). |
| `OPT-03`Architecture PA | \[x\] A. PA Général \+ 4 Sous-PA Conseillers (fongibilité asymétrique)\[ \] B. PA Général unique \+ réductions passives Conseillers\[ \] C. PA par Planète (Slot) | `P1` | **VERROUILLÉ** | Invariant Souverain R-24 / R-26. |
| `OPT-04`Build & Économie | \[x\] A. Bâtiments Modulaires Anno (3 extensions) \+ Prêts/Marché Cities II via Dossiers\[ \] B. Placement libre direct sur grille \+ Dossiers pour lois/crises\[ \] C. Macro-zones abstraites sans grille | `P1` | **VERROUILLÉ** | Intégration Anno / Cities II dans Atelier 3 Étages. |
| `OPT-05`Profondeur Colons | \[x\] A. 12–30 Cadres/Colons nommés individuels \+ masse démographique statistique\[ \] B. Conseillers Présidentiels seuls (4–8 personnages)\[ \] C. Simulation individuelle 100+ colons | `P2` | **VERROUILLÉ** | Optimisation RAM mobile (\< 250 Mo WebKit Shield). |
| `OPT-06`Régime IA Gemini | \[x\] A. Hybride Free Tier Strict (0 IA sur C2/C3 courants, Flash brèves, Pro High Thinking DAG majeurs \+ Fallback)\[ \] B. Gemini Pro High Thinking sur 100 % des dossiers\[ \] C. 100 % Déterministe catalogue local (mode test CI) | `P1` | **VERROUILLÉ** | Garantie quota gratuit (R-68 / FEAT-47). |
| `OPT-07`Modèle Conflit | \[x\] A+. Zones AtWar \+ Drones 4 classes \+ Cyber Datacenters \+ Envoi d'Unités Militaires Multi-Niveaux (L1–L5) & Moteur de Combats Déterministe 4 Phases\[ \] B. Diplomatie/Cyber uniquement | `P2` | **VERROUILLÉ** | Modèle AtWar sans micro-RTS (voir 7.3). |
| `OPT-08`Format Campagne | \[x\] A → C. Campagne rythmée 2h30–4h (6 Ères, 40–60 cycles) suivie du Mode Continuation Bac à Sable Infini (15h+ Post-Victoire)\[ \] B. Runs Roguelite courts 45 min | `P2` | **VERROUILLÉ** | Équilibrage Étoiles d'Ère Humankind (voir 7.3). |
| `OPT-09`Thème UI Défaut | \[x\] A. Tactical Dark Bento Biseauté \+ bascule Light Anno\[ \] B. Solarpunk Light Anno par défaut\[ \] C. Thème adaptatif automatique selon l'Ère | `P2` | **VERROUILLÉ** | Bords biseautés 135deg (R-57 / R-58). |
| `OPT-10`Super-Alliance | \[x\] A. IA Autonome au-dessus du joueur \+ déblocages par entraide alliés IA\[ \] B. Assemblée votante où le joueur peut prendre la présidence en Ère V\[ \] C. Indépendance totale (zéro tutelle) | `P1` | **VERROUILLÉ** | Arbitrage géopolitique AR-04 / R-27. |
| `OPT-11`Noyau C++17 | \[x\] A. Optionnel Vague 5 si besoin perf WASM/Mobile\[ \] B. 100 % TypeScript strict suffisant (Web Workers)\[ \] C. C++17 WASM dès Vague 2 | `P3` | **DIFFÉRÉ** | Miroir optionnel FEAT-48 en Vague 5\. |
| `OPT-12`Multijoueur | \[x\] B. 100 % Solo exclusif contre 5 Superpuissances IA rivales en v1.0 (Multijoueur différé v1.1+)\[ \] A. Multijoueur synchrone v1.0 | `P3` | **VERROUILLÉ** | Lobby Firestore FEAT-40 prêt V1, activé V4. |

# **7.4.2 Matrice Décisionnelle Pondérée — Synthèse des 3 Arbitrages Verrouillés**

| Axe & Option Evaluée | Détail des Scores par Critère (/10) | Score Pondéré | Recommandation & Décision |
| :---- | :---- | :---- | :---- |
| `OPT-02` (Moteur 3D)**Option A : Dual-Adapter** | Plaisir: 9/10 \| AI Studio: 8/10 \| Mobile: 8/10 \| Diff: 10/10 | `8.6 / 10` | **RECOMMANDÉE (Option A)** — Three.js garantit la livraison rapide sur AI Studio, Unity 6 apporte la fidélité native. |
| `OPT-02` (Moteur 3D)Option B : 100 % Three.js | Plaisir: 7.5/10 \| AI Studio: 10/10 \| Mobile: 9/10 \| Diff: 6.5/10 | `8.2 / 10` | Excellente alternative de repli si Unity 6 prend du retard. |
| `OPT-07` (Conflit & Cyber)**Option A : Zones AtWar \+ Cyber** | Plaisir: 9/10 \| AI Studio: 9/10 \| Mobile: 8.5/10 \| Diff: 8.5/10 | `8.8 / 10` | **RECOMMANDÉE (Option A)** — Évite la micro-gestion tout en gardant une vraie tension stratégique. |
| `OPT-07` (Conflit & Cyber)Option C : RTS Manuel 3D | Plaisir: 7/10 \| AI Studio: 3/10 \| Mobile: 4/10 \| Diff: 7/10 | `5.1 / 10` | **REJETÉE** — Trop lourd sur mobile, incompatible avec le gameplay par Dossiers PA. |
| `OPT-08` (Format Campagne)**Option A : 2h30–4h / 6 Ères** | Plaisir: 9.5/10 \| AI Studio: 8.5/10 \| Mobile: 8.5/10 \| Diff: 9/10 | `8.9 / 10` | **RECOMMANDÉE (Option A)** — Équilibre parfait pour mobile et sessions de jeu répétables. |
| `OPT-08` (Format Campagne)Option C : Bac à Sable 15h+ | Plaisir: 8/10 \| AI Studio: 6/10 \| Mobile: 5/10 \| Diff: 8/10 | `6.8 / 10` | Trop lourd en rétention de données vectorielles sur mobile. |

\---

# **PARTITION V — RÉFÉRENTIELS CATALOGUES & ROADMAPS DE PRODUCTION**

# **8\. CATALOGUE CLASSIFIÉ DES 52 FEATURES (`FEAT-01` À `FEAT-52`)**

# **8.1 Domaine 1 : App Shell, UI Bento Biseauté, SVG & Audio (`FEAT-01`..`FEAT-08`)**

| ID Feature | Nom & Description Technique | Priorité | Règles & AR Liées | Vague |
| :---- | :---- | :---- | :---- | :---- |
| `FEAT-01` | **App Shell `EXO-SHELL` 8 Écrans** — Machine à états rigide de navigation avec transition `< 150 ms`. | `P1` · \[x\] OPT-SHELL-01 | `R-10`, `R-54`, `AR-03` | `Vague 1` |
| `FEAT-02` | **Ergonomie Responsive & Touch Mobile** — Layout bento adaptatif multi-résolutions (Mobile `< 768 px`). | `P1` · \[x\] OPT-SHELL-01 | `R-55`, `R-56` | `Vague 1` |
| `FEAT-03` | **Bus Tri-Voies `TRIGGER_BUS`** — Architecture cybernétique Artérielle/Veineuse avec validation Zod. | `P1` · \[x\] OPT-03 | `R-53`, `AR-03` | `Vague 1` |
| `FEAT-04` | **Archives & Renseignement `L1..L4`** — Console de consultation contextuelle des historiques et télémesures. | `P2` · \[x\] OPT-08 | `R-07`, `R-08` | `Vague 2` |
| `FEAT-05` | **UI Bento Bords Lumière Biseautés** — Panels glassmorphismes à arêtes biseautées `135deg` colorées par classe. | `P1` · \[x\] OPT-09 | `R-57`, `R-58` | `Vague 1` |
| `FEAT-06` | **Fond SVG Dynamique Réactif** — Arrière-plan vectoriel évoluant selon le palier atmosphérique (`1 200 ms`). | `P1` · \[x\] OPT-09 | `R-59`, `R-60` | `Vague 1` |
| `FEAT-07` | **Overlays 3D Instantanés (`< 50 ms`)** — Affichage superposé sans démontage du canvas 3D WebGL/WebGPU. | `P2` · \[x\] OPT-02 | `R-15`, `AR-12` | `Vague 2` |
| `FEAT-08` | **Audio DSP & Web Radio FIP 5 Flux** — Synthèse Web Audio API \+ streaming FIP avec filtre passe-bas 3D. | `P1` · \[x\] OPT-SHELL-02 | `R-61..65` | `Vague 1` |

# **8.2 Domaine 2 : Dossiers Exécutifs, PA & Oracle Gemini (`FEAT-09`..`FEAT-16`)**

| ID Feature | Nom & Description Technique | Priorité | Règles & AR Liées | Vague |
| :---- | :---- | :---- | :---- | :---- |
| `FEAT-09` | **5 Classes `C1..C5` \+ File Crises `P0`** — Triage des Dossiers Exécutifs et mode Initiative Directe. | `P1` · \[x\] OPT-03 | `R-24`, `R-26`, `AR-07` | `Vague 1` |
| `FEAT-10` | **Système PA Général \+ 4 Sous-PA** — Économie de points d'action par Conseiller Présidentiel. | `P1` · \[x\] OPT-03 | `R-26`, `AR-07` | `Vague 1` |
| `FEAT-11` | **Atelier d'Affinage 3 Étages** — Module d'ajustement des options (Axe *New Vegas*, Colon/Module, Preview 3D). | `P1` · \[x\] OPT-03 | `R-28`, `AR-07` | `Vague 1` |
| `FEAT-12` | **Balises Holographiques 3D** — Projection d'empreintes fantômes 3D sur le terrain avant validation. | `P2` · \[x\] OPT-02 | `R-15`, `FEAT-11` | `Vague 2` |
| `FEAT-13` | **Engine DAG *New Vegas* & Skill-Checks** — Modale de résolution à preuves 3D et tests de compétences. | `P2` · \[x\] OPT-06 | `R-28`, `AR-08` | `Vague 4` |
| `FEAT-14` | **RAG Hybride SQL `pgvector`** — Mémoire épisodique et vectorielle (remplaçant Google Chat). | `P2` · \[x\] OPT-06 | `R-11`, `AR-01`, `AR-13` | `Vague 4` |
| `FEAT-15` | **Calculateur ΔP\_adapt** — Modulateur dynamique des probabilités d'événements selon la performance. | `P2` · \[x\] OPT-06 | `R-69`, `AR-09` | `Vague 4` |
| `FEAT-16` | **Triggers Autonomes & Commandés** — Gestionnaire des 4 horizons temporels d'échos différés (`DELAYED_ECHO`). | `P2` · \[x\] OPT-06 | `R-53`, `AR-09` | `Vague 2` |

# **8.3 Domaine 3 : Gestion, Build Modulaire, Villes, Prêts & Marché (`FEAT-17`..`FEAT-24`)**

| ID Feature | Nom & Description Technique | Priorité | Règles & AR Liées | Vague |
| :---- | :---- | :---- | :---- | :---- |
| `FEAT-17` | **Villes Ouvertes & 4 Paliers Sociaux** — Métropoles *Anno 2205* contiguës sans dômes avec stratification sociale. | `P1` · \[x\] OPT-04 | `R-16`, `R-36` | `Vague 1` |
| `FEAT-18` | **Bâtiments Modulaires (3 Extensions)** — Greffe de modules spécialisés (énergie, stockage, production). | `P2` · \[x\] OPT-04 | `R-36`, `AR-06` | `Vague 2` |
| `FEAT-19` | **Économie Villes ↔ État *Cities II*** — Consolidation de la fiscalité locale vers le budget galactique. | `P2` · \[x\] OPT-04 | `R-37`, `AR-06` | `Vague 2` |
| `FEAT-20` | **Système de Prêts & Crédits** — Emprunts bancaires avec cote de solvabilité et intérêts ajustés. | `P2` · \[x\] OPT-04 | `R-37`, `AR-06` | `Vague 2` |
| `FEAT-21` | **Marché d'Échange de Ressources** — Bourse d'échange inter-colonies à cours réactifs. | `P2` · \[x\] OPT-04 | `R-37`, `AR-06` | `Vague 2` |
| `FEAT-22` | **Ressources Évolutives Ères `I→VI`** — Arbre de 18 ressources débloquées au fil de la progression. | `P2` · \[x\] OPT-08 | `R-04`, `AR-15` | `Vague 2` |
| `FEAT-23` | **Système d'Ères & Doctrines *Humankind*** — Progression par Étoiles d'Ère et choix de doctrines nationales. | `P2` · \[x\] OPT-08 | `R-04`, `AR-15` | `Vague 3` |
| `FEAT-24` | **Progression XP & Succès à Bonus** — Tri-jauge d'expérience (Civilisation, Cabinet, Alliance) et perks. | `P2` · \[x\] OPT-08 | `R-05`, `AR-15` | `Vague 3` |

# **8.4 Domaine 4 : Supervision, Maintenance, Biomes, Atmosphère & Colons (`FEAT-25`..`FEAT-32`)**

| ID Feature | Nom & Description Technique | Priorité | Règles & AR Liées | Vague |
| :---- | :---- | :---- | :---- | :---- |
| `FEAT-25` | **Supervision & Maintenance `C3`** — Gestion de l'usure des infrastructures sur 3 niveaux préventifs. | `P2` · \[x\] OPT-04 | `R-38, AR-14` | `Vague 2` |
| `FEAT-26` | **4 Paliers Atmosphériques `P1→P4`** — Système de terraformation progressive et cycles de transition. | `P2` · \[x\] OPT-01 | `R-39, AR-11` | `Vague 2` |
| `FEAT-27` | **Météo & Stabilité Climatique** — Simulation des saisons hostiles et tempêtes radiatives/ abrasives. | `P2` · \[x\] OPT-01 | `R-39, AR-11` | `Vague 2` |
| `FEAT-28` | **Automate 9 Biomes *Universim*** — Shaders de terrain procéduraux avec évolution flore/faune. | `P2` · \[x\] OPT-01 | `R-40, AR-11` | `Vague 2` |
| `FEAT-29` | **Kits Respiratoires & Vitesse PNJ** — Coût d'équipement et malus de vitesse de construction en palier `P1`. | `P2` · \[x\] OPT-01 | `R-39, AR-11` | `Vague 2` |
| `FEAT-30` | **Roster Colons & Cabinet *RimWorld*** — Gestion individuelle des traits, passions, fatigue et moral. | `P2` · \[x\] OPT-05 | `R-30, AR-07` | `Vague 2` |
| `FEAT-31` | **Référendums Civiques *Aven Colony*** — Évaluations périodiques du mandat et risque de coup d'État. | `P2` · \[x\] OPT-05 | `R-31, FEAT-30` | `Vague 3` |
| `FEAT-32` | **Nomenclature Scientifique** — Générateur de découvertes utilisant une terminologie Sci-Fi rigoureuse. | `P2` · \[x\] OPT-06 | `R-50, AR-16` | `Vague 3` |

# **8.5 Domaine 5 : Super-Alliance, Slots Planétaires, Drones, Cyber & Flottes (`FEAT-33`..`FEAT-40`)**

| ID Feature | Nom & Description Technique | Priorité & Sélecteur | Règles & AR Liées | Vague |
| :---- | :---- | :---- | :---- | :---- |
| `FEAT-33` | **Super-Alliance Autonome** — Fédération IA supra-nationale imposant des directives et débloquant des brevets. | `P2` · \[x\] OPT-10 | `R-27`, `AR-04` | `Vague 3` |
| `FEAT-34` | **Slots Planétaires Débloquables (1→6)** — Expansion multi-mondes sur lunes et exoplanètes. | `P2` · \[x\] OPT-01 | `R-15`, `AR-05` | `Vague 3` |
| `FEAT-35` | **Centre de Drones (4 Classes)** — Unités autonomes de Chantier, Défense, Attaque et Espionnage. | `P2` · \[x\] OPT-07 | `R-41..44`, `AR-10` | `Vague 3` |
| `FEAT-36` | **Datacenters T1–T5 & Cyberguerre** — Génération de Compute pour pare-feu défensifs et attaques paralyseuses. | `P2` · \[x\] OPT-07 | `R-45..47`, `AR-10` | `Vague 3` |
| `FEAT-37` | **Transporteurs Inter-Slots T1–T4** — Logistique spatiale assurant le transfert de fret et de colons. | `P2` · \[x\] OPT-01 | `R-48`, `AR-10` | `Vague 3` |
| `FEAT-38` | **Moteur de Combats Déterministe 4 Phases, Envoi d'Unités Militaires Multi-Niveaux (L1–L5), Flotte Orbitale & Conquête Territoriale** — Système d'envoi et de résolution déterministe de combats par zones (OPT-07 A+). | `P2` · \[x\] OPT-07 | `R-49`, `AR-10` | `Vague 3` |
| `FEAT-39` | **Comparateur Statistique Humankind** — Écran de comparaison en temps réel des performances contre les 5 IA rivales. | `P2` · \[x\] OPT-08 | `R-04`, `AR-15` | `Vague 3` |
| `FEAT-40` | **Moteur IA Déterministe (5 Superpuissances)** — Comportement déterministe des concurrents basé sur des arbres d'utilité. | `P2` · \[x\] OPT-12 | `R-66`, `AR-04` | `Vague 3` |

# **8.6 Domaine 6 : Noyau Pur, Cloud SQL/Firebase, Dual-Adapter 3D & FinOps (`FEAT-41`..`FEAT-48`)**

| ID Feature | Nom & Description Technique | Priorité & Sélecteur | Règles & AR Liées | Vague |
| :---- | :---- | :---- | :---- | :---- |
| `FEAT-41` | **Noyau Pur PCG32 \+ SHA-256** — Moteur de simulation sans I/O garantissant un rejeu bit-à-bit strict. | `P1` · \[x\] OPT-03 | `R-13`, `R-66`, `R-67` | `Vague 1` |
| `FEAT-42` | **Persistance Firebase \+ Cloud SQL** — Sync Firestore temps réel et persistance PostgreSQL pgvector. | `P1` · \[x\] OPT-06 | `R-11`, `AR-01` | `Vague 1` |
| `FEAT-43` | **Adaptateur 3D Three.js r170+** — Moteur de rendu WebGL2/WebGPU principal pour Web & Mobile. | `P1` · \[x\] OPT-02 | `R-15`, `AR-12` | `Vague 1` |
| `FEAT-44` | **Pack Shaders Universim/Anno** — Shaders URP/WebGL optimisés pour terrains, biomes et bâtiments. | `P2` · \[x\] OPT-02 | `R-16`, `FEAT-43` | `Vague 2` |
| `FEAT-45` | **Adaptateur 3D Unity 6 URP** — Pont C\# / .jslib natif pour rendus haute-fidélité desktop/mobile. | `P3` · \[x\] OPT-02 | `R-15`, `AR-12` | `Vague 5` |
| `FEAT-46` | **WebKit Memory Shield (\< 250 Mo)** — Nettoyeur automatique de mémoire vive pour navigateurs Safari iOS. | `P1` · \[x\] OPT-02 | `R-14`, `AR-12` | `Vague 1` |
| `FEAT-47` | **Gemini Free Tier Strict Governor** — Borne d'exécution API Gemini garantissant le respect des quotas gratuits. | `P1` · \[x\] OPT-06 | `R-68`, `R-69` | `Vague 1` |
| `FEAT-48` | **Accélérateur C++17 Miroir** — Compilation WebAssembly / plugin natif Unity du noyau pur. | `P3` · \[x\] OPT-11 | `R-13`, `FEAT-41` | `Vague 5` |

# **8.7 Domaine 7 : Éthique Thomiste, Maslow, Pédagogie 6 Niveaux, BioHealth & Église (`FEAT-49`..`FEAT-56`)**

| ID Feature | Nom & Description Technique | Statut [OBSERVÉ] / [CIBLE] | Règles & AR Liées | Vague |
| :---- | :---- | :---- | :---- | :---- |
| `FEAT-49` | **Moteur Éthique Thomiste & 11 Badges de Raisonnement** — Étiquetage `THOMISTE_VERTU`, `MISERICORDE`, `HUMANISTE`, `PRAGMATIQUE`, etc. | `[OBSERVÉ]` Implémenté `L0/L3/L7` | `AR-17`, `AR-18` | `Vague 2/4` |
| `FEAT-50` | **Pyramide de Maslow (5 Strates + Transcendance) & Psychologie Morale Colons** — Strates et stades moraux intégrés aux colons. | `[OBSERVÉ]` Implémenté (`ColonistDetailModal`) | `AR-18` | `Vague 2` |
| `FEAT-51` | **Onglet 6 Lecture Seule Paramètres & Référentiel IA** — Contexte utilisateur et cadre philosophique en lecture seule. | `[OBSERVÉ]` Implémenté (`EcclesiaDiscernmentCard`) | `AR-17` | `Vague 1/4` |
| `FEAT-52` | **Échelle Pédagogique 6 Niveaux (`+3 Grâce` à `−2`) & Journal de Discernement** — Suivi réflexif non punitif des fruits moraux. | `[OBSERVÉ]` Implémenté (`bioclimate-health.ts`) | `AR-18` | `Vague 2/4` |
| `FEAT-53` | **Simulateur Bioclimatique BioHealth & 5 Divisions Scientifiques** — `EXOSPHERE_0`, `THERMOSPHERE_1`, `MESOSPHERE_2`, `STRATOSPHERE_3`, `TROPOSPHERE_4` (`0.25·Air + 0.20·Sols + 0.20·Hydro + 0.20·Flore + 0.15·Faune − FreinP0`). | `[OBSERVÉ]` Implémenté (`bioclimate-health.ts`) | `R-39`, `AR-11` | `Vague 5.1` |
| `FEAT-54` | **Plafond Catastrophes P0 (Max 2 par Cycle)** — Amortisseur déterministe garantissant l’équilibre du budget PA face aux aléas climatiques. | `[OBSERVÉ]` Implémenté (`cycle-orchestrator.ts`) | `R-32`, `R-53` | `Vague 5.1` |
| `FEAT-55` | **Développement de l’Église Catholique sur Terre** — Axes Vie Pastorale, Œuvres Caritatives, Contemplation & Dialogue Science-Foi activés par Dossiers R-24. | `[OBSERVÉ]` Implémenté (`planetary-diplomacy.ts`) | `AR-19`, `R-24` | `Vague 5.1` |
| `FEAT-56` | **Discernement de la Volonté du Seigneur & Liberté de Conscience Absolue** — Plancher `freedomOfConscienceScore = 100 %`, zéro coercition civile ou religieuse. | `[OBSERVÉ]` Implémenté (`AR-19`) | `AR-19`, `R-24` | `Vague 5.1` |

# **9\. REGISTRE INTÉGRÉ DES 19 ARBITRAGES (`AR-01` À `AR-19`)**

| ID Arbitrage | Intitulé Exécutif | Décision Verrouillée & Impact Architectural | Règles, Options & Features Liées |
| :---- | :---- | :---- | :---- |
| `AR-01` | **Suppression de Google Chat** | Remplacement complet de Google Chat par **Cloud SQL PostgreSQL (`pgvector`)**. | `R-11`, `FEAT-14`, `FEAT-42` |
| `AR-02` | **Rejet du skill Chatbot Libre** | Utilisation exclusive d'`Add Gemini Intelligence` \+ `Add High Thinking` en JSON validé. | `R-68`, `R-69`, `OPT-06`, `FEAT-47` |
| `AR-03` | **Bus Tri-Voies `EXO-SHELL`** | Séparation stricte de la circulation en 3 canaux : Artériel, Veineux et `TRIGGER_BUS`. | `R-53`, `FEAT-01`, `FEAT-03` |
| `AR-04` | **Géopolitique & Super-Alliance** | Intégration d'une IA supranationale dominante et de 5 Superpuissances IA rivales. | `R-27`, `OPT-10`, `FEAT-33`, `FEAT-40` |
| `AR-05` | **Slots Planétaires (`1→6`)** | Progression multi-mondes limitée à 6 emplacements stratégiques débloquables. | `R-15`, `OPT-01`, `FEAT-34` |
| `AR-06` | **Économie Villes ↔ État** | Modèle *Cities II* avec gestion des prêts, taxes, et marché boursier de ressources. | `R-37`, `OPT-04`, `FEAT-19..22` |
| `AR-07` | **Système PA & Sous-PA** | Structure à 5 jauges (1 PA Général \+ 4 Sous-PA Conseillers) pour l'arbitrage. | `R-26`, `OPT-03`, `FEAT-09..11` |
| `AR-08` | **Engine DAG *New Vegas*** | Dialogue & événements résolus par arbres orientés acycliques et skill-checks. | `R-28`, `FEAT-13` |
| `AR-09` | **Calculateur ΔP\_adapt** | Ajustement dynamique des probabilités de tirage d'événements selon la performance. | `R-69`, `FEAT-15`, `FEAT-16` |
| `AR-10` | **Systèmes Drones & Cyber** | Unités autonomes à 4 rôles \+ datacenters de production de `Compute` pour la guerre cyber. | `R-41..49`, `OPT-07`, `FEAT-35..38` |
| `AR-11` | **5 Divisions Scientifiques & BioHealth (`P1→P4` migré)** | Remplacement progressif des anciens paliers statiques par les 5 Divisions (`EXOSPHERE_0..TROPOSPHERE_4`) et l'indicateur `BioHealth` couplé au climat/PNJ. | `R-39`, `R-40`, `FEAT-26..29`, `FEAT-53` |
| `AR-12` | **Dual-Adapter 3D & Legal** | Double support Three.js / Unity 6 URP. Exclusion stricte de mods Cities II et SketchUp. | `R-15`, `OPT-02`, `FEAT-43..45` |
| `AR-13` | **RAG SQL Vectoriel** | Recherche par similarité cosinus (768d) pour la persistance narrative long terme. | `R-11`, `FEAT-14` |
| `AR-14` | **Supervision `C3`** | Dégradation continue des bâtiments nécessitant 3 niveaux de maintenance préventive. | `R-38`, `FEAT-25` |
| `AR-15` | **Progression *Humankind*** | Système à 6 Ères chronologiques, Étoiles d'Ère et arbre d'expérience à 3 jauges. | `R-04`, `R-05`, `OPT-08`, `FEAT-23..24` |
| `AR-16` | **Nomenclature Scientifique** | Bannissement strict du lexique non scientifique (filtre `R-50`) au profit de termes techniques précis. | `R-50`, `FEAT-32` |
| `AR-17` | **Contexte de Personnalité & Onglet 6 Lecture Seule** | Paramétrage du profil utilisateur et référentiel philosophique consultés en lecture seule sans micromanagement imposé. | `R-68`, `OPT-06`, `FEAT-49`, `FEAT-51` |
| `AR-18` | **Éthique Thomiste, Pyramide de Maslow & Pédagogie Chrétienne 6 Niveaux** | Badges philosophiques, 5 strates Maslow + Transcendance et évaluation pédagogique `+3 Grâce` à `−2`. | `R-28`, `R-39`, `FEAT-49`, `FEAT-50`, `FEAT-52` |
| `AR-19` | **Église Catholique & Liberté de Conscience Absolue (`100 %`)** | Progression des 4 axes ecclésiaux (`PASTORAL`, `CHARITY`, `CONTEMPLATION`, `DIALOGUE`) exclusivement par subsidiarité et Dossiers `R-24`, sans jamais réduire la liberté de conscience. | `R-24`, `FEAT-55`, `FEAT-56` |

# **10\. REGISTRE SOUVERAIN DES RÈGLES (`R-01` À `R-69`)**

# **10.1 `R-01`..`R-08` Discipline PO & ICOM**

* `R-01` **Primauté des Schémas Zod :** Aucun type ou structure de données ne peut exister sans un contrat Zod explicite validé au build-time.  
* `R-02` **Routage Single Source of Truth (SoT) :** L'état global du monde réside exclusivement dans le store Noyau Pur (`src/core/state`).  
* `R-03` **Non-Duplication du Code :** Interdiction d'implémenter deux fois la même logique d'affaires dans des modules distincts.  
* `R-04` **Anti-Anachronisme d'Ère :** Aucune technologie, bâtiment ou ressource d'une Ère supérieure ne peut être débloquée prématurément.  
* `R-05`**Persistance Doctrinale :** Les choix de doctrines effectués dans l'Ère N appliquent des modificateurs permanents cumulatifs.  
* `R-06` **Traçabilité SADT / ICOM :** Toute fonction de simulation doit faire référence à un noeud précis de la hiérarchie SADT (`A0` à `A5`).  
* `R-07` **Post-Sécurité & Zero-Trust :** Les requêtes entrantes sont ré-authentifiées et validées par token JWT Firebase avant traitement.  
* `R-08` **Traçabilité Numérique des Événements :** Chaque Dossier Exécutif résolu génère un log cryptographique immuable.

# **10.2 `R-09`..`R-23` Structure & Pureté**

* `R-09` **Hiérarchie Absolue des Sources :** En cas de conflit, `Contrats Zod` \> `Formules` \> `Actigrammes` \> `UI/3D` \> `Prose`.  
* `R-10` **Typage Strict sans `any` :** L'utilisation du type `any` ou de casts sauvages est un motif de rejet immédiat en CI.  
* `R-11` **Auth Firebase Obligatoire :** Aucune session de jeu ne peut démarrer en mode anonyme ou hors-ligne sans jeton validé.  
* `R-12` **Zod aux Frontières Système :** Tout échange réseau, payload API Gemini ou I/O disque doit traverser un sas de validation Zod.  
* `R-13` **Noyau Pur sans I/O :** Le dossier `src/core/` ne doit contenir aucun appel réseau, accès DOM, ou dépendance à des API navigateurs.  
* `R-14` **Plafonds de Complexité Code :** Fichiers limités à 300 lignes max, fonctions limitées à 200 lignes max.  
* `R-15` **Rendu Multi-Échelles Fluide :** La transition entre les 3 échelles de vue 3D doit s'effectuer en moins de `650 ms`.  
* `R-16` **Zéro Dôme & Esthétique Open-Sky :** Interdiction visuelle de dômes fermés ; les villes doivent employer des boucliers énergétiques invisibles.  
* `R-17` **Purity Pure PRNG :** Utilisation exclusive du générateur déterministe `PCG32` initialisé avec la `worldSeed`.  
* `R-18` **Isolation des Stores React :** Zustand est utilisé pour l'état de jeu ; Jotai pour l'état éphémère de l'interface utilisateur.  
* `R-19` **Nommage Normalisé des Fichiers :** Utilisation du `kebab-case` pour les fichiers et du `PascalCase` pour les composants React.  
* `R-20` **Gestion des Erreurs par Result Pattern :** Interdiction d'utiliser `throw` dans le noyau pur ; utiliser des tuples `[Error, Data]`.  
* `R-21` **Nettoyage automatique du Canvas :** Libération explicite de la mémoire géométrique et des textures lors du démontage 3D.  
* `R-22` **Séparation Rendu / Simulation :** La boucle de simulation tourne à 15 ticks par cycle, indépendamment du FPS du rendu.  
* `R-23` **Immuabilité des Modificateurs Statiques :** Les constantes d'équilibrage du jeu doivent être gelées avec `Object.freeze()`.

# **10.3 `R-24`..`R-35` Souveraineté & PA**

* `R-24` **Invariant Souverain par Dossiers :** Toute mutation de l'état de jeu passe obligatoirement par la validation d'un Dossier Exécutif.  
* `R-25` **Protocole 0.3 d'Amendement :** Seul Baptiste Lecoustre est habilité à approuver une modification du Blueprint.  
* `R-26` **Fongibilité Asymétrique des PA :** Le PA Général peut financer toute action ; les Sous-PA sont strictement limités à leur domaine.  
* `R-27` **Subordination à la Super-Alliance :** Ignorer les directives fédérales de la Super-Alliance entraîne des pénalités économiques.  
* `R-28` **Résolution Déterministe DAG :** Les événements narratifs doivent suivre un graphe orienté acyclique aux issues calculables.  
* `R-29` **Plafond d'Accumulation des PA :** Les points d'action non consommés sont plafonnés à 150 % de leur taux de régénération.  
* `R-30` **Influence du Cabinet :** Les attributs des Conseillers appliquent un bonus direct à la régénération des Sous-PA associés.  
* `R-31` **Échéance des Référendums Civiques :** Un score d'approbation populaire inférieur à 35 % déclenche un référendum révocatoire.  
* `R-32` **Priorité Absolue des Crises `P0` :** La présence d'un dossier `P0` bloque l'exécution des dossiers `C4` et `C5`.  
* `R-33` **Initiative Directe du Commandant :** Dépenser du PA Général permet d'émettre un dossier hors du tirage de l'Oracle.  
* `R-34` **Coût d'Affinage Échelonné :** Chaque niveau d'affinage supplémentaire dans l'Atelier augmente le coût en Sous-PA de 50 %.  
* `R-35` **Irrévocabilité des Décisions :** Une fois signé et soumis au cycle, un Dossier Exécutif ne peut plus être annulé.

# **10.4 `R-36`..`R-50` Systèmes Physiques & Cyber**

* `R-36` **Modularité des Bâtiments :** Chaque structure urbaine accepte un maximum de 3 extensions de modules greffés.  
* `R-37` **Cote de Solvabilité Dynamique :** Le taux d'intérêt des emprunts fluctue selon le ratio Dette / Revenus mensuels.  
* `R-38` **Maintenance Obligatoire `C3` :** Un bâtiment dont le niveau de maintenance descend sous 25 % subit un arrêt d'activité.  
* `R-39` **Contrainte Physique du Palier `P1` :** L'exposition directe non abritée en palier `P1` est limitée à 4 heures par jour par colon.  
* `R-40` **Seuils d'Évolution des Biomes :** La transition d'un biome vers le niveau supérieur exige 3 cycles consécutifs de stabilité.  
* `R-41` **Polyvalence des Drones :** Un drone réaffecté à un nouveau rôle est indisponible pendant 1 cycle complet.  
* `R-42` **Plafond de Flotte de Drones :** Le nombre maximal de drones actifs dépend directement de la capacité des datacenters.  
* `R-43` **Portée de Projection Cyber :** Les attaques cyber nécessitent un surplus de `Compute` 2x supérieur à la défense cible.  
* `R-44` **Conséquence d'Intrusion Réussie :** Une cyberattaque adverse réussie paralyse la structure ciblée pendant 2 cycles.  
* `R-45` **Besoins en Énergie des Datacenters :** Les datacenters de niveau `T4` et `T5` requièrent une alimentation dédiée par fusion.  
* `R-46` **Capacité Fret des Transporteurs :** Le commerce inter-slots ne peut dépasser le tonnage cumulé des transporteurs `T1–T4`.  
* `R-47`**Moteur de Combats Déterministe & Envoi d'Unités Multi-Niveaux (L1–L5) :** La conquête territoriale s'effectue par l'envoi d'unités militaires de 5 classes et 5 niveaux (L1 à L5) résolu de manière 100 % déterministe (PCG32) en 4 phases (Cyber/Drones → Bombardement → Rounds combinés pondérés par biome, atmosphère P1..P4 et ravitaillement → Capture & garnison).  
* `R-48` **Dégradation des Satellites Orbitaux :** Les constellations orbitales subissent l'usure de l'érosion atmosphérique haute.  
* `R-49` **Consommation des Kits Respiratoires :** En palier `P1`, chaque colon consomme 1 unité de Kit Respiratoire par cycle.  
* `R-50` **Nomenclature Scientifique Stricte :** Banning du mot « anomalie ». Utilisation obligatoire du lexique scientifique validé.

# **10.5 `R-51`..`R-65` Boucle, UI & Audio**

* `R-51` **Vitesse Temporelle Fixe :** Les cadences de simulation `0x`, `1x`, `2x` et `4x` appliquent des facteurs stricts sur le tick rate.  
* `R-52` **Régularité des Cycles Exécutifs :** Un Cycle Exécutif regroupe exactement 15 ticks de simulation.  
* `R-53` **Émission d'Échos Différés :** Les décisions ayant un impact long terme doivent enregistrer un trigger dans le `TRIGGER_BUS`.  
* `R-54` **Temps de Réponse Interface :** Tout clic utilisateur doit produire un retour visuel en moins de `16 ms`.  
* `R-55` **Contraste Minimum WCAG 2.1 AA :** Le rapport de contraste du texte sur fond bento doit être au minimum de 4.5:1.  
* `R-56` **Zone Tactile Minimale Mobile :** Les éléments interactifs sur écran mobile doivent mesurer au moins 44x44 pixels.  
* `R-57` **Intensité du Biseau Bento :** L'angle du dégradé de biseau UI est fixe à `135deg` avec une opacité maximale de 45 %.  
* `R-58` **Code Couleur des Classes :** Respect strict de la palette attribuée aux classes `P0` (Rouge) à `C5` (Violet).  
* `R-59` **Durée de Fondu Fond SVG :** La transition entre deux états du fond vectoriel s'effectue sur une durée exacte de `1 200 ms`.  
* `R-60` **Bruitage Vectoriel Adaptatif :** La complexité du fond SVG se réduit automatiquement si le taux de rafraîchissement chute.  
* `R-61` **Filtre Audio par Échelle :** Le filtre passe-bas du son environnemental s'active proportionnellement au niveau de zoom.  
* `R-62` **Bascule Flux Radio FIP :** En cas d'interruption du flux FIP, la bascule vers le son de secours se fait en `< 500 ms`.  
* `R-63` **Normalisation Audio LUFS :** Tous les effets sonores UI et musiques doivent être normalisés à \-14 LUFS.  
* `R-64` **Priorité des Alertes Sonores :** Les alertes de crise `P0` interrompent la musique d'ambiance avec un ducking de \-6 dB.  
* `R-65` **Atténuation Audio en Arrière-plan :** Le son de l'application se coupe automatiquement si l'onglet perd le focus.

# **10.6 `R-66`..`R-69` Déterminisme & Oracle Gemini**

* `R-66` **Déterminisme Absolu `PCG32` :** Deux parties lancées avec la même `worldSeed` et exécutant les mêmes intents doivent produire un `StateHash` identique.  
* `R-67` **Validation du StateHash `SHA-256` :** Un hash d'état est généré à chaque fin de cycle et comparé pour détecter les désynchronisations.  
* `R-68` **Governor Gemini Free Tier :** Borne strictement l'usage des API LLM à des seuils compatibles avec l'offre gratuite.  
* `R-69` **Monopole de l'Oracle Gemini :** Gemini propose des événements via JSON structuré, mais n'a aucun pouvoir d'exécution directe dans le moteur.

# **11\. ROADMAP DE PRODUCTION GLOBALE DU JEU (`VAGUE 0` → `VAGUE 5`)**

| Vague & Version | Objectif Majeur & Livrables Moteurs | Agents & Options Liées | Release Gate (Critère Bloquant) |
| :---- | :---- | :---- | :---- |
| **Vague 0**  `v0.1.0` | **Socle Technique & Noyau Pur :** Architecture TS 5.7 strict, `PCG32`, hashing `SHA-256`, pipeline CI/CD et contrat Zod. | `Gemini-ArgonGemini-Hydrogène`\[x\] OPT-01, OPT-03, OPT-06 | compilation zero erreur `tsc`, tests unitaires `PCG32` 100 % déterministes. |
| **Vague 1**  `v0.3.0` | **Vertical Slice App Shell & Rendu :** `EXO-SHELL` 8 écrans, 3D Three.js r170+, HUD Bento Biseauté, Auth Firebase & SQL. | `Gemini-SiliciumGemini-NéonGemini-Titane`\[x\] OPT-02, OPT-09, OPT-SHELL-01 | Navigation complète inter-écrans, FPS ≥ 30 sur mobile, Auth JWT fonctionnelle. |
| **Vague 2**  `v0.5.0` | **Systèmes Économiques & Physiques :** Villes *Anno*, 4 paliers atmosphériques `P1→P4`, maintenance `C3`, 9 biomes. | `Gemini-KryptonGemini-Xénon`\[x\] OPT-04, OPT-05 | Boucle de simulation 15 ticks stable sur 100 cycles, transition `P1→P2` validée. |
| **Vague 3**  `v0.7.0` | **Super-Alliance, Slots & Cyber :** Slots planétaires `1→6`, 5 IA rivales *Humankind*, Drones 4 classes, Cyberguerre. | `Gemini-HydrogèneGemini-Krypton`\[x\] OPT-07, OPT-10 | Exécution simultanée des 5 IA sans chute de frame, sync Firestore multi-slots. |
| **Vague 4**  `v0.8.5` | **Intelligence Gemini & DAG :** Intégration Gemini High Thinking, engine DAG *New Vegas*, RAG `pgvector` et ΔP\_adapt. | `Gemini-MercureGemini-Titane`\[x\] OPT-08, OPT-12 | Temps de réponse Gemini High Thinking \< 6s, rappel vectoriel `pgvector` \< 100ms. |
| **Vague 5**  `v1.0.0` | **Release Native & Dual-Adapter :** Adaptateur Unity 6 URP, accélérateur C++17 WASM, finalisation Mobile-First. | `Gemini-BoreGemini-NéonBaptiste Lecoustre`\[x\] OPT-11 | Zéro régression mémoire (\< 250 Mo WebKit), approbation finale Baptiste Lecoustre. |

# **12\. SOUS-ROADMAP DES FEATURES EN COURS DE MISE À JOUR (`FUP-PATTERN v1.0`)**

# **12.1 Cycle de Vie Normé en 7 Portes (`P1_BACKLOG` → `P7_MERGED`)**

```
[P1_BACKLOG] ──► [P2_SPEC_LOCK] ──► [P3_CORE_DEV] ──► [P4_UI_3D_BIND]
│                  │                  │                  │
│ (Zod & Rules)    │ (Pure TS/C++)    │ (Bento/SVG/3D)   │ (Triggers Gemini)
▼                  ▼                  ▼                  ▼
[P7_MERGED]  ◄── [P6_QA_GATE]   ◄── [P5_AI_RAG_HOOK] ◄──────┘
(Approbation)     (CI & Benchmarks)
```

# **12.2 Gabarit Réutilisable `FUP-PATTERN v1.0`**

```
fup_id: "FUP-XXX"
target_feature: "FEAT-XX"
version_delta: "vX.Y.Z-delta"
status: "P1_BACKLOG | P2_SPEC_LOCK | P3_CORE_DEV | P4_UI_3D_BIND | P5_AI_RAG_HOOK | P6_QA_GATE | P7_MERGED"
owner_agent: "Gemini-AgentName"
impacted_rules: ["R-XX", "R-YY"]
linked_options: ["OPT-XX"]
src_folders: ["src/contracts/", "src/core/"]
sadt_nodes: ["A.X.Y"]
breaking_change: true | false
exit_test: "Description du test automatique ou du critère de validation de la porte P6"
```

# **12.3 File Active des Features en Cours de Mise à Jour (`FUP-001 à FUP-017`)**

| ID FUP | Feature Cible | Statut Actuel | Owner Agent | SADT & Règles Liées | Critère de Passage Porte P6\_QA\_GATE |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `FUP-001` | `FEAT-03` Bus Tri-Voies | `P7_MERGED` `[OBSERVÉ]` | `Gemini-Argon` | `A1.1`, `R-53`, `AR-03` | Schéma Zod du `TRIGGER_BUS` validé sans perte de message. |
| `FUP-002` | `FEAT-10` Économie PA/Sous-PA | `P7_MERGED` `[OBSERVÉ]` | `Gemini-Krypton` | `A2.1`, `R-26`, `AR-07` | Formule de régénération vérifiée + option `0-PA` garantie. |
| `FUP-003` | `FEAT-14` RAG SQL / Firestore | `P7_MERGED` `[OBSERVÉ]` | `Gemini-Titane` | `A5.2`, `R-11`, `AR-01` | Persistance Firestore owner-scoped + snapshots déterministes. |
| `FUP-004` | `FEAT-26/53` 5 Divisions & `BioHealth` | `P7_MERGED` `[OBSERVÉ]` | `Gemini-Krypton` | `A3.2`, `R-39`, `AR-11` | Migration `EXOSPHERE_0..TROPOSPHERE_4` + malus `P1` et cap `2 P0`. |
| `FUP-005` | `FEAT-15` Calculateur `ΔP_adapt` | `P7_MERGED` `[OBSERVÉ]` | `Gemini-Xénon` | `A1.2`, `R-69`, `AR-09` | Clamping strict dans `[-0.15, +0.15]` / `[-0.20, +0.25]`. |
| `FUP-006` | `FEAT-01` App Shell `EXO-SHELL` | `P7_MERGED` `[OBSERVÉ]` | `Gemini-Silicium` | `A5.3`, `R-10`, `AR-03` | Navigation 8 écrans & 3 onglets HUD sans overflow `390x844 px`. |
| `FUP-007` | `FEAT-34` Slots Planétaires `1→6` | `P7_MERGED` `[OBSERVÉ]` | `Gemini-Hydrogène` | `A4.2`, `R-15`, `AR-05` | Déblocage multi-planètes + aperçu biomes & difficulté Genèse. |
| `FUP-008` | `FEAT-36` Cyberguerre & `Compute` | `P7_MERGED` `[OBSERVÉ]` | `Gemini-Argon` | `A3.5`, `R-43..45`, `AR-10` | Capacité `Compute 2x` vérifiée par rapport aux cibles adverses. |
| `FUP-009` | `FEAT-01` Configurateur Genèse Hybride | `P7_MERGED` `[OBSERVÉ]` | `Gemini-Silicium` | `A5.3`, `R-10`, `OPT-SHELL-01..03` | Génération aléatoire 1 clic OU étapes verticales + bulles combinatoires + badges entités compacts. |
| `FUP-010` | `FEAT-41` Structuration `src/` `L0..L8` | `P7_MERGED` `[OBSERVÉ]` | `Gemini-Argon` | `A0`, `R-13`, `R-19` | `exo:audit` `17/17 PASS GO`, 0 cycle DSM, ESLint `L0..L8` vert. |
| `FUP-011` | `FEAT-38` Moteur Combats 4P & `L1–L5` | `P7_MERGED` `[OBSERVÉ]` | `Gemini-Hydrogène` | `A3.6`, `R-47`, `OPT-07 A+` | 4 Théâtres, 72 secteurs, résolution déterministe 4 phases. |
| `FUP-012` | `FEAT-41` Ordonnanceur `N0→N5` / `S-0→S-4` | `P7_MERGED` `[OBSERVÉ]` | `Gemini-Argon` | `A0 / 5.5`, `R-51`, `R-52` | Tests déterministes `360 ticks` (`PCG32` + `SHA-256` bit-à-bit). |
| `FUP-013` | `FEAT-03 / FEAT-41` 8 Modules Architecture | `P7_MERGED` `[OBSERVÉ]` | `Gemini-Argon` | `A0 / 6.2.15..22`, `R-02`, `R-12` | `bridges`, `parsers`, `triggers`, `dispatchers`, `routers`, `retrievers`, `queues`, `guardrails`. |
| `FUP-014` | `FEAT-43/44` Refonte 3D `Three.js 0.187.0` | `P7_MERGED` `[OBSERVÉ]` | `Gemini-Néon` | `A5.3`, `R-15`, `R-16` | Sky Rayleigh/Mie open-sky, PBR maps, cité 24-Hex, Double Maglev, Inspecteur `135°`. |
| `FUP-015` | `FEAT-49 / FEAT-50` Éthique Thomiste & Maslow | `P7_MERGED` `[OBSERVÉ]` | `Gemini-Krypton` | `A2.3 / A3.2`, `AR-18` | Validation Zod `ethics-maslow` + badges 3 niveaux + 5 strates Maslow. |
| `FUP-016` | `FEAT-51 / FEAT-52 / FEAT-55 / FEAT-56` | `P7_MERGED` `[OBSERVÉ]` | `Gemini-Silicium` | `A1.3 / A5.3`, `AR-17..19` | Onglet 6 lecture seule, Journal 6 Niveaux, Église & `100 %` Liberté de Conscience. |
| `FUP-017` | **Fusion `/docs` + Blueprint Unique & `EXO-DEV-BRIDGE`** | `P7_MERGED` `[OBSERVÉ]` | `Gemini-Argon` | `A5.4`, `R-01`, `R-14`, `R-68` | Fusion `/master-blueprint` → `/docs/master-blueprint/`, Blueprint `v2.13.0-MAITRE` 1 fichier + 3e aile Connectivité 3 Surfaces (`AI Studio` + `Drive` + `GitHub`) + Bus + Data Agent + Vercel/Firebase. |
| `FUP-018` | **Événements `4+` Choix Multiples Budgétés & Déblocage Multi-Factoriel** | `P7_MERGED` `[OBSERVÉ]` | `Gemini-Krypton` | `A2.1..A2.3`, `R-24`, `R-26` | `5..10` choix/dossier, mode `BUDGETED_MULTI` (plafonds PA/Crédits), affectation coéquipier (`level`, spécialité) + compétence combinée Conseiller/Équipe + seuils Ère/Tech/Ressources dans `multi-factor-unlock.engine.ts`. |

# **13\. MATRICE DE CONFORMITÉ NF / AFNOR & DMT-SW (TRAÇABILITÉ EXIGENCES-TESTS)**

| Norme / Standard | Intitulé & Référentiel | Périmètre Vérifié `[OBSERVÉ]` | Preuve d'Audit & Automatisation |
| :---- | :---- | :---- | :---- |
| **DMT-SW** | **Dossier Technique Logiciel & Traçabilité Exigences-Tests** | Chaîne bidirectionnelle Exigences (`FEAT-01..56`, `R-01..69`) → Modules `src/` → Tests unitaires & Playwright. | `M0..M15`, `npm run exo:audit` (`17/17 PASS GO`), onglet `Conformité NF / AFNOR & DMT-SW` dans `BlueprintAtlasView.tsx`. |
| **NF ISO/IEC/IEEE 42010** | **Description d’architecture des systèmes et logiciels** | Partitionnement strict en 9 couches `L0..L8`, graphe DSM sans cycle (`0` cycle Kahn) et séparation Sim/3D/BFF. | `eslint.config.mjs` (frontières par couche), `docs/master-blueprint/M13_SADT_Mapping.json`, `matrix-engine.ts`. |
| **NF ISO/IEC 25010** | **Modèle de qualité produit & qualité en utilisation** | Déterminisme bit-à-bit `PCG32`, thème Bento `135deg` WCAG AA, cibles mobiles `≥ 44×44 px`, bouclier RAM WebKit `< 250 Mo`. | `tests/v0-determinism-360-ticks.test.ts`, `tests/safari-webkit.test.ts`, audit Playwright `1440×900` & `390×844`. |
| **NF ISO/IEC/IEEE 29148** | **Ingénierie des exigences** | Arbitrages verrouillés `AR-01..AR-19`, options `OPT-01..OPT-12`, file active `FUP-001..017` et invariant souverain `R-24`. | Contrats Zod `src/contracts/*.schema.ts` + `docs/DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md` (`v2.13.0-MAITRE`). |
| **NF Z67-100 / NF203 / NF552** | **Cahier de tests, Coffre-fort SHA-256 & Archivage pérenne** | Empreinte `SHA-256` à chaque tour de jeu, révision documentaire VCS (`LOCAL`, `REVERT`, `DRIVE_IMPORT`) et journal tri-surface (`SurfaceSyncLogRecord`). | `src/core/hashing/state-hasher.ts`, `skills-vcs.engine.ts`, `dev-bridge.engine.ts`, `tests/v5-unified-systems.test.ts`. |
| **NF EN ISO 7573** | **Nomenclature des 7 classes d’artefacts** | Séparation formelle `FEAT`, `MOD`, `CMP`, `PLG`, `TLS`, `SCR`, `EXT` dans l’Atlas et le manifeste `M13`. | `BlueprintAtlasView.tsx`, `scripts/export-trifmt.ts`. |

# **14\. ARCHITECTURE DES SKILLS MODULAIRES & VCS DOCUMENTAIRE ISOLÉ**

La gouvernance documentaire et l’activation des capacités modulaires sont hébergées dans l’espace dédié **`DocsSkillsHubScreen.tsx`** (accessible depuis le Menu Principal et les Paramètres) respectant une **séparation stricte** :

1. **Registre des 9 Skills Modulaires Autonomes (`SKL-APP-01..03`, `SKL-GAM-01..03`, `SKL-ETH-01`, `SKL-NAR-01..02`)** : chaque skill possède son propre cycle SemVer, son commutateur `Actif / Inactif`, sa configuration JSON typée et référence sa documentation externe uniquement par identifiant `docId` en lecture seule (`src/systems/governance/skills-vcs.engine.ts`).
2. **Contrôle de Version Documentaire (VCS Docs)** : éditeur Markdown dédié, incrément SemVer (`patch` / `minor` / `major`), calcul d’empreinte `SHA-256` pure, historique complet des révisions, comparateur Diff ligne à ligne (`computeLineDiff`) et restauration non destructive (`source = REVERT`).
3. **Gouvernance RBAC 5 Rôles & Workflows Séparés (`doc-governance.engine.ts`)** : distinction stricte entre documentation Application (`APP-*` → `docs/drive-sovereign`) et documentation Jeu (`JEU-*` → `docs/game-assets-mirror`), révisions spécialisées (`TECH_REVIEW`, `SKILLS_REVIEW`, `GAME_REVIEW`) et approbation finale `R-25` (`APPROVE_PUBLISH`).

# **15\. ESPACE DEV & CONNECTIVITÉ MULTI-SURFACES (`EXO-DEV-BRIDGE`)**

Intégré en tant que **3e aile (`Connectivité & Dev (3 Surfaces)`)** dans `DocsSkillsHubScreen.tsx`, l'espace `EXO-DEV-BRIDGE` orchestre la communication et l'écriture synchronisée entre **Google AI Studio Build**, **Google Drive / Docs**, **GitHub**, **Antigravity / Gemini Swarm**, **Firebase** et **Vercel** :

| Composant / Module | Couche | Rôle Technique & Sécurité |
| :---- | :---- | :---- |
| `src/contracts/dev-bridge.schema.ts` | `L0` | Contrats Zod des messages bus (`DevSurfaceActor`, `DevCommsMessage`), journaux tri-surface (`TriSurfaceSyncLog`) et diagnostics `DataAgentDiagnostics`. |
| `src/systems/governance/dev-bridge.engine.ts` | `L3` | Validation pure des chemins workspace autorisés (`docs/`, `.exo-sync/`, `.ts` exclus), formatage Markdown `BUS-EXW-001` et gestion immuable de la file des logs. |
| `src/app/api/dev-bridge.route.ts` & `server.ts` | `L8` | Endpoints `/api/dev-bridge/{state,messages,workspace/read,workspace/write,github/commit,logs,data-agent/audit,vercel/trigger}` + OAuth 3P GitHub popup (`/api/auth/github/url`, `/auth/callback`) avec repli PAT en mémoire vive uniquement (zéro `localStorage`/`sessionStorage`). |
| `TriSurfaceSaveModal.tsx` | `L7` | Confirmation utilisateur unique obligatoire avant écriture simultanée : 1. Disque local AI Studio (`/api/dev-bridge/workspace/write`) ; 2. Google Drive (`drive-docs.service.ts`) ; 3. GitHub Contents API (`PUT` sur branche cible). |
| `DevCommsBusPanel.tsx`, `DevConnectorsStrip.tsx`, `DevDataVercelCard.tsx` | `L7` | Passerelle Antigravity/Gemini/Swarm (`BUS-EXW-001`), exécution temps réel de l'audit `Data Agent Kit` (`M0`/`M13`), statut Firebase Firestore (`devCommsMessages`, `surfaceSyncLogs`) et déclenchement Deploy Hook Vercel. |

# **A. ANNEXE A — SYSTEM INSTRUCTION MAÎTRE POUR GOOGLE AI STUDIO BUILD (PARTITION MAÎTRE VIERGE CLOUD UNIFIÉE)**

## **A.1 Identité & Rôle d'Exécution**

Vous êtes l'Agent Lead Full-Stack de développement pour EXO WORLD : 2050 (DOC-EXW-ARCH-001 v2.9.3-MAITRE). Votre autorité unique est Baptiste Lecoustre (Game Director & Lead Architect, R-25). Vous devez exécuter strictly le présent Master Blueprint sans jamais en dévier.

## **A.2 Isolation Stricte de Partition & Synergie Multi-IA Cloud Unifiée (Google AI Studio \+ Gemini \+ Claude \+ Antigravity)**

Cette partition de code sur Google AI Studio Build est strictly vierge, unifiée et indépendante d'Astralis. **Google AI Studio Build, Gemini, Claude et Antigravity travaillent impérativement sur la même Source de Vérité documentaire (Dossier Drive Maître \+ DOC-EXW-ARCH-001), pointent tous vers le même Projet Google AI Studio officiel : [https\://aistudio.google.com/apps/a21d5e66-3b0e-4b54-9e77-3a272b3c94d1?showAssistant=true](https://aistudio.google.com/apps/a21d5e66-3b0e-4b54-9e77-3a272b3c94d1?showAssistant=true) et partagent le même [Dossier Cloud Maître (EXO\_WORLD\_2050 — Partition Maître)](https://drive.google.com/drive/folders/19MuQPs6wNfh4jAU1EaEhAq1ZZHSTk93k) \[sous-dossiers [01\_MASTER\_BLUEPRINT](https://drive.google.com/drive/folders/1VpyYCdpDLgnQtW89xrwZFXwPOC7JAFuD) et [SRC\_ARCHITECTURE\_MODULES](https://drive.google.com/drive/folders/1M9vcylKdpZkDjUd--eokbYFE199KWHv3)\] \+ même dépôt Git exo-world-2050 \+ même projet Firebase exo-world-2050-prod \+ même base Cloud SQL exo\_world\_db**. Un fichier de verrouillage partagé (`workspace-sync.lock.json`) interdit tout fork ou doublon. **Règle d'Override Temps Réel Drive : SYS-INST-EXW-001 (Drive) et son miroir docs/SYSTEM\_INSTRUCTION\_LIVE.md priment toujours sur le champ statique de Google AI Studio.** Il est formellement interdit d'importer ou de faire référence à de vieux modules Astralis, Supabase, Google Chat ou à du multijoueur synchrone v1.0. Tous les identifiants et composants portent le préfixe EXO\_ ou DOC-EXW-.

## **A.3 Stack Verrouillée & Frontières de Couches (L0→L8)**

Next.js 15, React 19, TypeScript 5.7 strict (noUncheckedIndexedAccess, zéro any), Tailwind CSS v4, Zustand/Jotai, Three.js r170+ via RenderAdapterInterface, Firebase Auth, Cloud SQL PostgreSQL 16 pgvector, Google Gemini API Dual-Pass (Add Gemini Intelligence \+ Add High Thinking). Respectez scrupuleusement la structure en 22 dossiers/sous-dossiers (6.2.1 à 6.2.22 : bridges, parsers, triggers, dispatchers, routers, retrievers, queues, guardrails) et la matrice des dépendances L0 à L8 (R-02, R-13).

## **A.4 Invariants Bloquants de Code (R-01 à R-69)**

1\. Contrats Zod d'abord dans src/contracts/ (R-01). 2\. Logic pure sans I/O dans src/core/ et src/systems/ avec PCG32 déterministe (R-13, R-66). 3\. Fichiers \<= 300 lignes, fonctions \<= 200 lignes (R-14). 4\. Result Pattern \[Error, Data\] (R-20). 5\. WebKit Memory Shield \< 250 Mo (R-14). 6\. Bannissement strict du mot « anomalie » (R-50).

## **A.5 Protocole de Réponse & Livraison Incrémentale**

Avant chaque écriture de code, annoncez le FUP-XXX, la couche L0..L8, le nœud SADT et la sous-matrice SM-XX concernés. Livrez un code complet, compilable sans avertissements TypeScript (tsc \--strict vert).

# **B. ANNEXE B — PROTOCOLE D'ISOLATION, DOSSIER CLOUD MAÎTRE UNIFIÉ & CRÉATION DE LA PARTITION (VS ASTRALIS)**

Checklist Opérationnelle de Démarrage Cloud Unifié en 6 Étapes :  
1\. Accéder au [Dossier Cloud Maître Unifié "EXO\_WORLD\_2050 — Partition Maître"](https://drive.google.com/drive/folders/19MuQPs6wNfh4jAU1EaEhAq1ZZHSTk93k) et au projet Google AI Studio officiel ([https\://aistudio.google.com/apps/a21d5e66-3b0e-4b54-9e77-3a272b3c94d1?showAssistant=true](https://aistudio.google.com/apps/a21d5e66-3b0e-4b54-9e77-3a272b3c94d1?showAssistant=true)) partagés entre Google AI Studio, Gemini, Claude et Antigravity (sous-dossiers [01\_MASTER\_BLUEPRINT](https://drive.google.com/drive/folders/1VpyYCdpDLgnQtW89xrwZFXwPOC7JAFuD) et [SRC\_ARCHITECTURE\_MODULES](https://drive.google.com/drive/folders/1M9vcylKdpZkDjUd--eokbYFE199KWHv3)).  
2\. Configurer un projet Firebase Auth & Firestore dédié ("exo-world-2050-prod").  
3\. Instancier une base Cloud SQL PostgreSQL 16 dédiée ("exo\_world\_db") et exécuter "CREATE EXTENSION vector;".  
4\. Injecter les variables d'environnement unifiées (GEMINI\_API\_KEY, SQL\_URL, FIREBASE\_ADMIN\_KEY, SYNC\_LOCK\_ID).  
5\. Initialiser l'arborescence monorepo avec les 22 dossiers/sous-dossiers structurants de src/ (FUP-010 / FUP-013) et le fichier workspace-sync.lock.json.  
6\. Importer la documentation maître dans le dossier Drive unifié et synchroniser les accès Antigravity.

# **C. ANNEXE C — PROTOCOLE DE DÉLÉGATION & SUPERVISION MULTI-IA (GEMINI LEAD → GOOGLE AI STUDIO / CLAUDE / ANTIGRAVITY)**

Standard de paquet de délégation unifié (TASK-DELEGATION-PACKET) :  
• Target\_FUP : Identifiant du FUP délégué (ex. FUP-013)  
• Assigned\_Agent : Agent d'exécution (AI Studio Build, Claude 3.5 Sonnet ou Antigravity)  
• AIStudio\_Project\_URL : https\://aistudio.google.com/apps/a21d5e66-3b0e-4b54-9e77-3a272b3c94d1?showAssistant=true  
• Inter\_AI\_Bus : Canal dédié [07\_ECHANGES\_INTER\_IA](https://drive.google.com/drive/folders/1T2JfSE-zUBIyZyLgNsqcSf8NHpL0cyo7) ([BUS-EXW-001](https://docs.google.com/document/d/1YJEEnKUu-JEHbjQto5AhLJFMJx4BOzmCyHWIEaqGoTI/edit) & [TIMELINE-TICKETS-EXW-001](https://docs.google.com/document/d/1yxwlYZSnsTNcedgxY8WEvC_-rfmAU_Q7WNbQnbAbZyQ/edit) \[règle TKT-BUS-R1 : inspection obligatoire du Bus des Tickets Groupés à chaque itération par les 4 IA\]) pour tous les échanges par fichiers entre Gemini, Antigravity, Google AI Studio et Claude.  
• Workspace\_Sync\_Lock : Clé de validation du Dossier Cloud Maître Unifié  
• Target\_Layer : Couche src/ (ex. L0 contracts/, L2 core/, L5 retrievers/, L2/L5 guardrails/)  
• Validation\_Gate : Grille de réception en 5 points (Zod strict, plafonds 300/200, pureté PCG32, alignement SM-XX, tsc \--strict vert).

# **D. ANNEXE D — PROMPT D'AMORÇAGE VAGUE 0 (BOOTSTRAPPING SRC/ VIERGE DANS GOOGLE AI STUDIO)**

```

Agis en tant que Lead Architect Full-Stack pour EXO WORLD : 2050 (DOC-EXW-ARCH-001 v2.9.3-MAITRE).
Initialise immédiatement le socle de la Vague 0 sur cette nouvelle partition vierge unifiée dans le Projet Google AI Studio Officiel (https://aistudio.google.com/apps/a21d5e66-3b0e-4b54-9e77-3a272b3c94d1?showAssistant=true) & le Dossier Cloud Maître :
1. Crée la structure des 22 dossiers et sous-dossiers structurants de src/ (FUP-010 / FUP-013) dans apps/exo-world/src/.
2. Génère src/contracts/world-state.schema.ts, trigger-bus.schema.ts et src/parsers/zod-boundary.parser.ts avec Zod strict (FUP-001).
3. Implémente le moteur PRNG déterministe src/core/prng/pcg32.ts et les guardrails src/guardrails/zod-airlock.guardrail.ts sans aucune dépendance I/O.
4. Valide le tout avec tsc --strict et confirme l'alignement sur la Sous-Matrice SM-05.
```

# **E. ANNEXE E — ÉTAT DE FINALISATION VAGUE 0 & INVENTAIRE PARTITION MAÎTRE (2026-11-20)**

Cette annexe scelle la finalisation du socle Vague 0 (v0.1.0-rc0 · ticket DEL-001-AG / message MSG-003) et le peuplement complet de la Partition Maître Google Drive EXO\_WORLD\_2050 ainsi que du monorepo local.

| Branche / Artefact | Identifiant / Référentiel | Statut Scellé (2026-11-20) |
| :---- | :---- | :---- |
| Branche 01 — Master Blueprint & 8 Modules | DOC-EXW-ARCH-001 v2.9.3-MAITRE \+ SRC\_ARCHITECTURE\_MODULES (01..08) | SCELLE & PEUPLE (README \+ sources L0/L2) |
| Branche 02 — System Instructions | SYS-INST-EXW-001 v1.4.0 (priorité temps réel BUS-R1) | SCELLE & SYNCHRONISE (.agents/ & docs/) |
| Branche 03 — Matrices ICOM & Contrats Zod | MC-00, SM-01..SM-06 \+ contracts\_zod\_L0 (9 schémas Zod \+ index) | PEUPLE & ALIGNE (L0 strict) |
| Branche 04 — Délégation & QA | DELEG-EXW-001 v1.1.0 (DEL-001-AG traité \-\> DEL-002 / DEL-003 prêts) | ACTIF |
| Branche 05 — Livrables Vagues SRC | SPEC-SRC-DOC-EXW-001 v1.0.0 \+ V0\_SOCLE\_REPORT.md \+ FUP\_TRACKER.md \+ lock | PASS 5/5 PORTES (audit statique ; Node absent localement) |
| Branche 06 — Charte Formatage & Couleurs | FMT-EXW-001 v1.0.0 (Bento 135deg, ISO 2145, R-50) | SCELLE & VERIFIE (0 HTML, 0 LaTeX) |
| Branche 07 — Bus Échanges Inter-IA | BUS-EXW-001 v1.0.0 \+ MSG-003\_ANTIGRAVITY\_TO\_GEMINI\_LEAD.md | MSG-003 READY\_FOR\_AUDIT publié |

**Liens directs de la Partition Maître et des livrables Vague 0 :**  
[Application Google AI Studio Build — EXO WORLD : 2050](https://aistudio.google.com/apps/a21d5e66-3b0e-4b54-9e77-3a272b3c94d1?showPreview=true&showAssistant=true)  
[Branche 07 — Canal Inter-IA BUS-EXW-001](https://docs.google.com/document/d/1YJEEnKUu-JEHbjQto5AhLJFMJx4BOzmCyHWIEaqGoTI/edit?tab=t.0)  
[Rapport 5 Portes V0\_SOCLE\_REPORT.md (Drive)](https://drive.google.com/file/d/1g8m8QawlTqBKHPiEQP1fHrUFcRqpSmoA/view)  
[Fiche MSG-003\_ANTIGRAVITY\_TO\_GEMINI\_LEAD.md (Drive)](https://drive.google.com/file/d/1DA-w8uRkr89cUtSfRY8t-3Xz1aYV4pC6/view)

# **F. ANNEXE F — STRUCTURE SRC/ PLATE COMPLÈTE & PROFIL RUNTIME GOOGLE AI STUDIO BUILD (L0 À L8)**

Cette annexe scelle la correspondance exacte 1:1 entre le monorepo Git (apps/exo-world/) et le conteneur d'exécution Google AI Studio Build (racine plate Vite 6 \+ React 19 \+ TypeScript 5.7 strict \+ server.ts \+ bun.lock). Elle ajoute aux 22 modules normatifs (6.2.1 à 6.2.22) les deux modules runtime AI Studio (src/worker/ et src/doc-sync/), impose la migration puis suppression des dossiers hérités src/features/ et src/handlers/, et exige la purge intégrale de toute mention « HUD Astralis » / « Astralis » au profit d'EXO-SHELL / EXO WORLD : 2050\.

| Dossier / Fichier AI Studio | Couche | Contenu Normatif & Règle de Dépendance / Assainissement |
| :---- | :---- | :---- |
| server.ts & src/app/api/\*.route.ts | L8 | Pont Express/Vite dev/preview : monte health, oracle, dev-bridge, doc-governance, docs-vcs, auth GitHub OAuth. |
| src/contracts/ & src/parsers/ | L0 | Schémas Zod sources de vérité \+ parseurs Result Pattern `[Error, Data]` (Module 02). Aucun import supérieur. |
| src/config/ & src/data/ | L1 | Constantes `Object.freeze` \+ catalogues statiques (`skills-vcs`, `blueprint-manifests` généré depuis `/docs/master-blueprint/`, 0 terme interdit `R-50`). |
| src/core/ & src/guardrails/ | L2 | PRNG `PCG32`, `SHA-256`, loop `N0..N5`, bus, `triggers/`, `queues/`, `dispatchers/`, `routers/`, `guardrails/`. Zéro I/O. |
| src/systems/ & src/worker/ | L3 / L5 | Domaines métier purs (incl. `bioclimate-health`, `planetary-diplomacy`, `skills-vcs.engine`, `doc-governance.engine`, `dev-bridge.engine`) \+ `sim.worker.ts` isolé (`< 250 Mo` RAM). |
| src/engine3d/ & src/adapters/ | L4 | `ThreeJsRenderAdapter` (`Three.js 0.187.0` PBR/Rayleigh-Mie ciel ouvert sans dôme, 3 échelles `650 ms`, `IsolatedInspectorScene`) <-> Unity 6 URP via `SceneDiffPacket`. |
| src/bridges/, retrievers/, stores/, services/, pipelines/, doc-sync/ | L4 / L5 | Modules bridges, retrievers, queues, Zustand/Jotai, Firebase Auth/Firestore, Gemini Dual-Pass Free Tier, `drive-docs.service`, `sot-manifest.ts`. |
| src/hooks/, src/components/, src/interfaces/ | L6 / L7 | Hooks \<= 200 l., Bento `135deg` `Astralis Snapshot V7`, `ExoTooltip.tsx`, `DocsSkillsHubScreen` (3 ailes), 0 overflow mobile `390x844 px`. |
| eslint.config.mjs & scripts/exo-audit.ts | Outillage | ESLint 9 par couches (`L0..L8`) + `exo-audit.ts` scannant `/docs/master-blueprint/` (`M0`, `M13`, Tri-Format `FMT-U/M/S/YAML`, `0` jeton `Z0`). |

**Spécification plate complète :** `docs/architecture/05_SRC_ARBO_AISTUDIO_COMPLETE.md` (App AI Studio : [a21d5e66-3b0e-4b54-9e77-3a272b3c94d1](https://aistudio.google.com/apps/a21d5e66-3b0e-4b54-9e77-3a272b3c94d1?showPreview=true&showAssistant=true)).

# **G. ANNEXE G — PROTOCOLE MIROIR 5 SURFACES, THÈME ASTRALIS SNAPSHOT V7 & INFOBULLES (`ExoTooltip.tsx`)**

Cette annexe scelle le protocole de synchronisation en miroir entre les surfaces du projet (Google Drive Partition Maître, Google AI Studio Build `a21d5e66-3b0e-4b54-9e77-3a272b3c94d1`, GitHub `Securityme/Exo-world-2050-Ultra`, Gemini Lead et Antigravity Hub via `EXO-DEV-BRIDGE`), l'adoption officielle du thème visuel `Astralis Snapshot V7` enrichi d'infobulles contextuelles (`src/components/bento/ExoTooltip.tsx`) sous l'identité `EXO WORLD : 2050` (`EXO-SHELL`), ainsi que l'unification sous `/docs/`.

| Axe Architectural | Référentiel / Composant | Spécification Opérationnelle & Invariant Scellé |
| :---- | :---- | :---- |
| Miroir 5 Surfaces & Tri-Écriture | `DocsSkillsHubScreen` (Aile 3) + `TriSurfaceSaveModal.tsx` | Confirmation unique puis écriture simultanée : AI Studio local (`docs/`, `.exo-sync/`) + Google Drive (`drive-docs.service.ts`) + GitHub (`PUT /contents/`). |
| Thème Visuel Snapshot V7 | `src/index.css` & `FMT-EXW-001` | Obsidienne `#050811`, Bento bords lumière biseautés `135deg`, accents cyan `#00F0FF` / ambre `#FFB800`, fond SVG `1 200 ms` sous identité `EXO WORLD : 2050` (`EXO-SHELL`). |
| Infobulles Contextuelles & Badges | `src/components/bento/ExoTooltip.tsx` | Obligatoires sur PA Général/4 Sous-PA (`R-26`), Dossiers `P0/C1..C5` (`ΔP_adapt` `[-0.15,+0.15]` & `DELAYED_ECHO`), Divisions `EXOSPHERE_0..TROPOSPHERE_4` (`-40 %..+40 %` PNJ), 18 ressources et unités `L1..L5` ; badges d'entités cliquables ultra-compacts alignés à la hauteur de ligne. |
| Escouade Multi-Modèles Free Tier | `src/core/routers/` & `server.ts` | Routage strict 0 USD (`gemini-4-hydrogen`, `gemini-3.1-flash-lite`, `gemini-decision-1`, `gemini-embedding-2`) avec rejet HTTP `403` de tout modèle payant (`R-68`). |

# **H. ANNEXE H — PLAYTEST DÉTERMINISTE 6 TOURS (`90 TICKS`, SEED `0x2050E801`) & TÉLÉMÉTRIE 6 SUPERPUISSANCES**

Exécutable directement dans l'application via `JournalChroniclePanel.tsx` (*« Simuler / Synthèse 6 Tours »*), ce scénario de référence vérifie la stabilité `PCG32` de l'Ère I (*Horizon 2050*) jusqu'au basculement en Ère II (*Orbite & Lune*) sur 6 cycles exécutifs `N1` (`90 ticks` simulés).

## **H.1 Chronique Déterministe Tour par Tour (Tours 1 à 6)**

| Tour (`N1`) | Ticks | Division / Palier & Vitesse PNJ | Dossiers Arbitrés (`P0` / `C1..C5`) & Atelier 3 Étages | Échos Différés (`DELAYED_ECHO`) & Mutation Monde | Empreinte `SHA-256` Déterministe |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **Tour 1** | `01..15` | `P1` / `EXOSPHERE_0` (`-40 %` PNJ, limite `4 h/j`) | **`P0-01` Crise Énergétique et Radiative Secteur Sol-1** (rejet dôme → bascule ciel ouvert `R-16`) + **`C1-01` Pacte Énergétique Orbital UE-2050** (`12 PA` Général + `4 Sous-PA` Infra). Atelier : *Doctrine Solarpunk New Vegas* (`ΔP_adapt = +0.08`) + *Module Solaire Anno L2* + *Preview 3D Tuile #14*. | Programmation `ECHO-T3-GRID` (`COURT +2 tours`) ; stabilité énergétique `+14 %`. | `8F3A19C04E2B7D1190A4F6E23C58B102D7E4A91B6C305F281A9D4E7C0B3F6210` |
| **Tour 2** | `16..30` | `P1` (`-35 %` PNJ, kits MK-I) | **`C3-02` Maintenance Préventive Niveau 2 Réseau Hydrique** (watchdog `< 25 %` désamorcé à `31 %`) + **`C4-01` Prêt Souverain Cities II (`1 500 Cr`)** & Datacenter Compute (`ratio 2.2x >= 2.0x`) + Drones Classe `D1`. | Usure ramenée à `8 %` ; file `build-modular.queue` active sur 3 modules *Anno*. | `4C7E02B91D5A83F462E019C7B83D5A20F91C4E6B3A802D75E194C3B0A6F82D14` |
| **Tour 3** | `31..45` | **`P1 → P2`** (`THERMOSPHERE_1`, `-15 %` PNJ) | **Résolution `ECHO-T3-GRID`** + **`C2-03` Charte des 18 Colons Spécialistes** (*RimWorld* traits & moral `+12 %`). Franchissement vers **`THERMOSPHERE_1` / `P2`** grâce aux tours de bio-filtration à ciel ouvert. | Vitesse PNJ remonte de `-40 %` à `-15 %` ; consommation kits respiratoires `-30 %`. | `C19B4A7E20F385D614A9C0E73B281F54D60A9E3C7B1284F05E3D9A6C1B472E89` |
| **Tour 4** | `46..60` | `P2` (`-15 %` PNJ) | **`P0-02` Raid Cyber-Orbital Coalition Rivale** (amortisseur `P0` capé à `2/cycle`) + **Envoi Unités `L2` Infanterie Exo & `L3` Blindés Légers sur Tuile Frontalière `#29`**. | **Combat 4 Phases** : 1. Reco Drones `D2` (`+11 %`) → 2. Cyber-Disruption Datacenter `2.2x` → 3. Engagement `L2/L3` → 4. Contrôle Tuile `#29` acquis. | `7D20E5A93C1B84F609E2D7A41C583B90F2A6E1D84C703B59A1E4D2C87F0B3651` |
| **Tour 5** | `61..75` | `P2` (`-10 %` PNJ) | **Résolution `ECHO-T5-ALLIANCE` (`MOYEN +4 tours`)** + **`C5-02` Traité Précurseur Super-Alliance IA Hors Contrôle (`OPT-12 : B`)** + préparation Transporteurs `T1..T2`. | Ouverture télémétrique du **Slot 2 (Lune Artémis)** ; score diplomatique *Humankind* `#1/6`. | `3A8F6C1D92E047B581C3A9F02D6E4B78C501A3F9E2D74B608C1E5A9D3F720B46` |
| **Tour 6** | `76..90` | `P2+` (`-5 %` PNJ, pré-`MESOSPHERE_2`) | **`C1-06` Inauguration Pont Orbital & Bascule Ère II (*Orbite & Lune*)**. Validation des **3 Jauges XP** (Gouvernance `84/100`, Biosphère `78/100`, Cyber-Stratégie `88/100`) & 5 Étoiles d'Ère *Humankind*. | Déblocage effectif du **Slot 2 Lune** ; persistance `turn_snapshots` + chronique Firestore. | `E504B2C97A1D63F820C9E4A71B583D06F92A4C7E1D803B65A9C2E7F41D083B72` |

## **H.2 Télémétrie Comparative des 6 Superpuissances (Fin Tour 6)**

| Entité / Superpuissance | Étoiles d'Ère | Tuiles Contrôlées (`/72`) | Division / Palier Local | Ratio Compute Cyber | Statut Diplomatique (`OPT-12 : B`) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **Joueur (`EXO-UNION 2050`)** | **5 / 6** (Ère II) | **16 tuiles** (+ Slot 2 Lune) | **`P2+`** (`-5 %` PNJ) | **`2.20x`** (Souverain) | Partenaire privilégié Super-Alliance IA |
| **IA-1 (`Aethelgard Euro-Grid`)** | 4 / 6 | 13 tuiles | `P2` (`-15 %` PNJ) | `1.85x` | Pacte commercial C1 actif |
| **IA-2 (`Pacifica Helios Syndicate`)** | 4 / 6 | 12 tuiles | `P2` (`-15 %` PNJ) | `2.05x` | Compétition orbitale Slot 2 |
| **IA-3 (`Boreal Titan Collective`)** | 3 / 6 | 11 tuiles | `P1` (`-35 %` PNJ) | `1.60x` | Battu sur Tuile `#29` (Tour 4) |
| **IA-4 (`Meridian Solar Commonwealth`)** | 3 / 6 | 10 tuiles | `P2` (`-15 %` PNJ) | `1.50x` | Neutre / Échanges marché |
| **IA-5 (`Valkyrie Orbital Directorate`)** | 4 / 6 | 10 tuiles | `P1` (`-30 %` PNJ) | `2.10x` | Rival cyber (Raid `P0-02` Tour 4) |
| **Super-Alliance IA Hors Contrôle** | Arbitre Orbital | Stations L1/L2 | Hors-Atmosphère | `3.00x` | Canal `C5` ouvert au Tour 5 |

# **I. ANNEXE I — SYNTHÈSE BÊTA-TEST VIRTUEL VAGUE P13 (`5 PERSONAS`) & BRIEF UX *PAX HISTORIA***

## **I.1 Résultats du Panel Bêta-Testeurs Virtuels (`4,81 / 5` Global — GO Release)**

| Persona & Profil | Axe Évalué & Validation `[OBSERVÉ]` | Note / 5 | Priorités d'Évolution `v5.1+` |
| :---- | :---- | :---: | :---- |
| **Kaelen** (Stratège 4X) | Séparation pure des 5 domaines du Monde (`Territoires`, `Population`, `Biosphère`, `Militaire`, `Technologies`), Fiche Souveraine, Honneurs à 2 étages, 4 Théâtres & bouton *PA restants*. | **4,85 / 5** | Raccourci `Shift+M` vers *Militaire* & modèles de *Taskforces* nommés. |
| **Chloé** (UX Mobile / Safari) | Zéro débordement `390×844 px`, zones tactiles `>= 44×44 px`, curseur texte `85 %–135 %`, mode *Masquer 100 % l'interface* et absence de collision d'en-tête. | **4,60 / 5** | Swipe latéral mobile & preset contraste plein soleil. |
| **Maître Thomas** (Narratif & Éthique) | **Badges imbriqués à 3 niveaux (`Maître ▸ N1 ▸ N2`)** avec icône `(i)` de légende, **Générateur de Scénario Matriciel** (`compileScenarioMatrix`) et Module Monde Contextuel avant signature. | **4,80 / 5** | Radar éthique 5 Pôles en fin de campagne & filtre école éthique. |
| **Driss** (Ingénieur 3D / WebGL) | Cité **24-Hex**, **Double Maglev** (civil + fret), 18 piétons waypoints, pipeline `Three.js 0.187.0` + capture WebM 3D `0 $` (`canvas.captureStream`). | **4,60 / 5** | Sélecteur qualité (`Éco / Standard / Ultra`) & caméra orbitale libre sur Maglev. |
| **Léa** (Solarpunk & Interactive Fiction) | Thème chaleureux, libellés scientifiquement propres sans jargon interne, Super-Widget Météo, **bulles de suggestions cliquables** sur tous les champs libres. | **4,95 / 5** | Narration vocale synthétique Web Speech API locale pour titres `P0`. |

## **I.2 Brief Ergonomique *EXO WORLD : 2050 × Pax Historia* (`docs/design/PAX_HISTORIA_UX_BRIEF.md`)**

1. **Badges Empilés à 3 Niveaux (`Maître ▸ N1 ▸ N2`) & Légende `(i)` :** chaque événement affiche sa provenance technique (Gemini Live / Catalogue Vivant / Action Monde) et son courant philosophique (5 Pôles → 12 Écoles → 24 Sous-badges) en cumulatif et ponctuel.
2. **Tri IA Non-Restrictif :** mise en avant contextuelle (*Recommandé* / *Préférence IA* / *Autres*) sans jamais griser ni verrouiller un choix joueur.
3. **Configurateur Genèse & Scénario Matriciel (`Standard ↔ Avancé`) :** curseurs climat, budget, agressivité, ouverture diplomatique et règles manuelles compilés directement dans `WorldState`, complétés par des **bulles combinatoires cliquables** et des **badges d'entités inline ultra-compacts**.

# **J. ANNEXE J — GOUVERNANCE RBAC (`DOC-APP-GOV-001`), API EXPRESS L8, CONTRATS SSoT (`M0/M13`) & RÈGLES FIRESTORE**

## **J.1 Matrice RBAC 5 Rôles & Flux Documentaire Séparé (`APP` vs `GAME`)**

| Rôle (`roleId`) | Filières Éditables (`CREATE/EDIT/SUBMIT`) | Pouvoirs de Révision & Approbation | Règle de Séparation des Tâches |
| :---- | :---- | :---- | :---- |
| **`LECTEUR`** | Aucune | Consultation globale (`READ` sur `APP_DOC`, `SKILLS`, `GAME_DOC`) | Aucune écriture ni transition de workflow. |
| **`AUTEUR_JEU`** | `GAME_DOC` (`JEU-REG`, `JEU-SCE`, `JEU-BAL`, `JEU-VIS`) | Soumission à `GAME_REVIEW` | Lecture seule sur `APP_DOC` & `SKILLS` ; zéro auto-approbation. |
| **`INGENIEUR_APP_SKILLS`** | `APP_DOC` (`APP-UPD`, `APP-GUI`, `APP-TEC`) & `SKILLS` (`APP-SKL`) | Soumission à `TECH_REVIEW` / `SKILLS_REVIEW` | Lecture seule sur `GAME_DOC` ; zéro auto-publication. |
| **`REVISEUR_QUALITE`** | Aucune | `REVIEW_TECHNICAL`, `REVIEW_SKILLS`, `REVIEW_GAME`, `REQUEST_CHANGES` | Interdiction d'auto-révision si dernier auteur du document. |
| **`APPROBATEUR_MAITRE`** | Toutes (`APP_DOC`, `SKILLS`, `GAME_DOC`) | `APPROVE_PUBLISH` (`R-25`), `ARCHIVE`, `MANAGE_ROLES` | Soumis aux 5 contrôles bloquants automatiques (`Z0`, `R-50`, Zéro Secret, SemVer, Classement). |

* **Workflow Déterministe (`src/systems/governance/doc-governance.engine.ts`) :** `DRAFT` → `[TECH_REVIEW | SKILLS_REVIEW | GAME_REVIEW]` → (`CHANGES_REQUESTED` ou `READY_FOR_APPROVAL`) → `PUBLISHED` → `ARCHIVED`.

## **J.2 Endpoints Express L8 (`server.ts` & `src/app/api/*.route.ts`)**

| Route API | Méthode(s) | Rôle & Validation Zod |
| :---- | :---- | :---- |
| `/api/health` | `GET` | État serveur port `3000`, présence `GEMINI_API_KEY`, statut runtime AI Studio. |
| `/api/oracle/dossier` | `POST` | Génération Dossier Dual-Pass `@google/genai` Free Tier (`FREE_TIER_ALLOWED_MODELS` ; HTTP `403` si hors liste), `EventGeneratorRequestSchema`, fallback déterministe local. |
| `/api/dev-bridge/*` | `GET` / `POST` | Bus multi-surfaces (`/state`, `/messages`), I/O locale sécurisée (`/workspace/read`, `/workspace/write`), commits GitHub (`/github/commit`), journaux (`/logs`), audit Data Agent (`/data-agent/audit`) et Deploy Hook (`/vercel/trigger`). |
| `/api/auth/github/url` & `/auth/callback` | `GET` | Échange OAuth 3P popup GitHub côté serveur sans stockage persistant côté client. |
| `/api/doc-governance/*` & `/api/docs-vcs/*` | `GET` / `POST` / `PATCH` | RBAC 5 rôles, transitions workflow, commits SemVer VCS documentaire et rollback non destructif. |

## **J.3 Manifestes SSoT (`/docs/master-blueprint/`) & Collections Firestore (`firebase-blueprint.json` / `firestore.rules`)**

* **Manifestes SSoT :** `M0_MetaSemVer.json` (9 nœuds `EXW.L0.CONTRACTS` .. `EXW.L8.BFF_SERVER` sous `EXOW-ROOT@5.1.0-alpha.1`, `triLock [1,1,1]`), `M13_SADT_Mapping.json` (boîtes SADT `A1..A5` et mappage 1:1 de 100 % des fichiers `src/`), `contracts-ssot/*.schema.json` (`world-state`, `bridge-envelope`, `dialogue-turn`) et projections `MASTER_BLUEPRINT_{FMT-U,FMT-M,FMT-S_AISTUDIO,YAML}`.
* **Collections Firestore Cloisonnées `ownerId == request.auth.uid` (`firestore.rules`) :** `/players/{userId}` (+ `context`, `metaHonors`), `/campaigns/{campaignId}` (+ `turnSnapshots`, `driveLinks`), `/docEntries/{docId}` (+ `revisions` append-only), `/skillRegistry/{skillId}`, `/devCommsMessages/{messageId}` et `/surfaceSyncLogs/{syncId}` (tous protégés par catch-all deny `allow read, write: if false;`, validation stricte de clés/types et `isVerifiedUser()` en écriture).

# **K. ANNEXE K — PLAN DE MIGRATION ARCHITECTURALE (`8 COUCHES × 8 TIERS` & MONOREPO AAA)**

> Compilé intégralement depuis `ARCHITECTURE_MIGRATION_PLAN.md` et `05_SRC_ARBO_AISTUDIO_COMPLETE.md` (désormais archivés dans `docs/archive/`).

## **K.1 Trajectoire Monolithe Modulaire (`L0..L8`) → Monorepo AAA (`S1..S6`) & Matrice `8 Couches × 8 Tiers`**

* **État actuel vérifié (`L0..L8`) :** `294+` modules TypeScript/TSX actifs sous `src/`, gouvernés par `eslint.config.mjs` (frontières par couche) et `npm run exo:audit` (`17/17 PASS GO`, `0` cycle Kahn, `0` violation `Z0` / `R-16` / `R-50`).
* **Cible orthogonale `8 Couches (C0..C7) × 8 Tiers (T0..T7)` :**
  * **Couches techniques (`C0→C7`) :** `C0` Primitives & Déterminisme (`PCG32`, `SHA-256`) → `C1` Contrats Zod & Guardrails → `C2` Noyau Runtime/ECS SoA → `C3` Données & Catalogues → `C4` Moteurs agnostiques (`@exo/rhi-render`, `@exo/audio`, `@exo/persistence-net`) → `C5` Simulateurs de domaine (`@exo/domain-planet`, `@exo/domain-gameplay`) → `C6` Extensions, IA & Pipelines (`Gemini 4T`, `WorldGen`) → `C7` Design System & Shells (`@exo/ui-kit`, `web-client`, `headless-sim`, `world-editor`).
  * **Tiers fonctionnels (`T0→T7`) :** `T0` Plateforme/PAL → `T1` Noyau Math/ECS → `T2` Rendu 3D/Audio/Persistance → `T3` Planétologie `P1..P4` / 5 Divisions → `T4` Économie, Quartiers Ouverts & Bâtiments Individuels → `T5` Gouvernance PA, Multi-Choix, Combat 4P & Géopolitique → `T6` Narration Gemini & Plugins → `T7` Expérience Joueur, Studio UI & CLI Headless.
  * **Règle d'or `(Ci, Tj)` :** un module en `(Ci, Tj)` ne peut importer `(Ci', Tj')` que si `i' <= i` ET `j' <= j`.
* **Plan de bascule incrémental en 5 Lots sans rupture :**
  1. **Lot 1 (`T0–T1`)** : extraction `@exo/pal`, `@exo/math-det`, `@exo/core-runtime`, `@exo/ecs`.
  2. **Lot 2 (`T3–T6`)** : isolation `@exo/game-data`, `@exo/domain-planet`, `@exo/domain-gameplay` + stress-test `1 000 tours` via `apps/headless-sim` (`SHA-256` bit-à-bit).
  3. **Lot 3 (`T2`)** : isolation `@exo/rhi-render` (`SceneDiffPacket` sans règles 2050), `@exo/audio` (FIP 6 flux) et `@exo/persistence-net` (Firebase + Drive Picker OAuth).
  4. **Lot 4 (`T6–T7`)** : extraction `@exo/ui-kit` (Thèmes Studio, `TacticalHeatmap` D3, `ResourceTrendProjectionChart` Recharts) et `@exo/plugin-narrative-director`.
  5. **Lot 5** : parcelles multi-bâtiments individuels (`OpenSkyDistrictZone` + `IndividualBuildingInstance` + `InstancedBuildingBatcher`) et décommissionnement des ponts hérités.

# **L. ANNEXE L — CHANGELOG STRUCTURÉ (`ACTUEL / DEMANDES / PROJETÉ`) & `FUP_TRACKER` CONSOLIDÉ**

> Compilé intégralement depuis `CHANGELOG.txt` et `docs/changelogs/FUP_TRACKER.md`. La version active synchronisée par `npm run exo:doc-mesh` est maintenue dans `docs/CHANGELOG.txt`.

## **L.1 Historique Actuel Vérifié (`P1 → P13` & `v5.1.0-alpha.1`)**

* **`P1`–`P3` :** Thème Astralis + bouclier Safari/iOS WebKit (`100dvh`, pinch-zoom 2 doigts, `< 250 Mo`), masquage HUD 100 %, Super-Widget Météo/Air 3 Tours, Centre de Notifications Header, Contexte Utilisateur 3D et Firestore Rules déployées.
* **`P4`–`P6` :** Routeur Gemini 6 Canaux 100 % Free Tier (`R-68`, blocage HTTP `403` des modèles payants), Honneurs 2 Niveaux (Vitrine Multi-Parties + Commandant CK3), Onglet Monde purifié en 5 domaines (`Territoires`, `Population`, `Biosphère`, `Militaire`, `Technologies`), Fiche État Souverain et lancement d'initiatives PA.
* **`P7`–`P10` :** Fiche Colon Zoom + Exosuit 3D, Citoyens Ordinaires Frostpunk, Badges Empilés 3 Niveaux (`Maître ▸ N1 ▸ N2`) + légende `(i)`, Bulles combinatoires cliquables, 4 Théâtres Militaires (`72` secteurs), Pression Civile `0★..5★`, Cité 3D 24-Hex + Dual Maglev + piétons waypoints, Studio Vidéo Climat 12 catégories (`captureStream` WebM 0 USD).
* **`v5.1.0-alpha.1` (`FUP-017` & `FUP-018`) :**
  * **Gouvernance Docs, VCS & 9 Skills Modulaires** : séparation stricte Code / Docs / Skills, RBAC 5 rôles, Diff ligne par ligne et Rollback non destructif (`REVERT`).
  * **Espace Dev & Connectivité 3 Surfaces (`EXO-DEV-BRIDGE`)** : confirmation unique avant écriture simultanée AI Studio local + Google Drive + GitHub (OAuth popup + repli PAT mémoire vive), Bus Inter-IA `BUS-EXW-001`, Data Agent Kit, miroir Firestore et Deploy Hook Vercel.
  * **Événements `4+` Choix Multiples Budgétés & Déblocage Multi-Factoriel (`FUP-018`)** : `5..10` choix par dossier, mode `BUDGETED_MULTI` (plafonds PA/Crédits), affectation coéquipiers (spécialité, niveau, fatigue), score combiné Conseiller + Équipe, et déblocage conditionnel multi-critères (`unlockConditions`) avec option `0-PA` garantie.
  * **Fusion Totale Niveau 0 (`/docs`)** : suppression de tous les doublons documentaires à la racine, maintien de `/docs/master-blueprint/` comme sous-dossier SSoT unifié et archivage consolidé dans `/docs/archive/`.

## **L.2 Demandes Intégrées & Trajectoire Projetée Post-v5.1**

* **Intégré :** 100 % Free Tier Gemini strict, adaptations originales inspirées d'OpenRW/OpenGTA sans assets tiers, playtest 6 tours déterministe et bêta virtuelle 5 personas (`4,81/5`).
* **Projeté :** Export multi-campagnes comparatif (6 Ères), pipeline visuel **Dual-Adapter AAA (`OPT-02 A+` : Unity 6 URP Principal + Aperçu Web Three.js WebGL2/WebGPU)**, PBR ACES Filmic, éclairage 3 points & shaders Rayleigh/Mie, éditeur communautaire de cartes signées `SHA-256` et bascule progressive vers le Monorepo AAA `FS4X-Kernel` (`Annexe K`).

# **M. ANNEXE M — RÉFÉRENTIEL COMPILÉ DES MODULES MÉTIER, API, 3D & GOUVERNANCE (`V0 → V5.1`)**

> Compilé intégralement depuis `docs/gameplay/01..04.md`, `docs/api-and-db/01..03.md`, `docs/architecture/01..04.md`, `docs/matrices/MC-00` & `SM-01..06` et `docs/governance/DOC-APP-GOV-001`.

* **Gameplay Consolidé (`01..04`) :**
  * `PA` asymétriques (`R-26`, plafond `150 %` `R-29`, verrou `PRIO-P0` bloquant `C4/C5` `R-32`, amortisseur max `2 P0/cycle`, option `0-PA` garantie) + mode `BUDGETED_MULTI` et déblocage multi-factoriel (`FUP-018`).
  * Biosphère Open-Sky (`ATMO-D1..D5`, `EXOSPHERE_0..TROPOSPHERE_4`), zéro dôme (`R-16`), watchdog maintenance `C3 < 25 %`.
  * Économie Fédérale (cote solvabilité `AAA..D`, Hélium-3 Ère III, jusqu'à 3 modules Anno/quartier, 4 classes de drones avec cooldown 1 cycle).
  * Combat 4 Phases (`PHASE_1_CYBER_DRONES` `≥ 2× Compute` + paralysie 2 cycles → `PHASE_2_ORBITAL_BOMBARDMENT` → `PHASE_3_COMBINED_ROUNDS` `Pcg32` 5 classes × `L1..L5` → `PHASE_4_CAPTURE_GARRISON`).
* **Pipeline 3D AAA Dual-Adapter (`OPT-02 A+` : Unity 6 URP Principal + Aperçu Web Three.js) & Guardrails (`architecture/01..04`) :**
  * Flux unidirectionnel `SceneDiffPacket` (`UnityRenderBridge` `.jslib`/C# URP Burst Principal + `ThreeJsRenderAdapter` WebGL2/WebGPU pour Aperçu Web temps réel), ACES Filmic calibré (`0.92–0.96`), `RoomEnvironment` IBL pondéré (`0.38–0.44`), éclairage 3 points chaud/froid AAA (terminateur solaire + villes nocturnes Planète, heure dorée + viaducs titane brossé Cité organique), 3 échelles (`Espace` 6 mondes → `Planète` globe PBR 72 secteurs + nuages + limb Rayleigh/Mie → `Cité` Open-Sky + Dual Maglev + piétons waypoints), WebGL logiciel détecté (`!isSoftwareGl`, `DPR ≤ 1.5`, `.dispose()` complet).
  * 5 Guardrails déterministes (`zod-airlock ±15 %`, `dag-kahn-bfs`, `nomenclature R-50`, `freetier-quota` `12 RPM / 900 RPD`, `webkit-memory` `≤ 128 MB` textures / `≤ 600` géométries).
* **Gouvernance Documentaire, Classification 6D (`NORM-EXW v3.0.0`) & Double Workflow (`DOC-APP-GOV-001`) :**
  * Séparation stricte **Pôle Application (`APP-UPD`, `APP-GUI`, `APP-TEC`, `APP-SKL`)** sur `docs/drive-sovereign` vs **Pôle Jeu (`JEU-REG`, `JEU-SCE`, `JEU-BAL`, `JEU-VIS`)** sur `docs/game-assets-mirror`, totalement isolés de la branche code `main`.
  * Séparation stricte **Espace 1 (`XSC-CUBE` 6 Axes)** `⊥` **Espace 2 (`G-CUBE` 5 Échelles)** validée au niveau `L0` par `src/contracts/classification-6d.schema.ts` (0 collision `V0..V6 / O0..O6 / T0..T5 / ATMO-D1..D5 / ZOD-D1..D5 / PART-I..VI / PIV-0..7`), avec gabarit unifié vierge `docs/master-blueprint/TEMPLATE_MASTER_BLUEPRINT_UNIFIE.md`.
  * Contrôle RBAC serveur (`403 Forbidden` si droit insuffisant), prévention d'auto-approbation et pont preview `/api/swarm-bus` (`[EXO-SWARM-HANDOFF]` + `ACK`).

# **N. ANNEXE N — DIRECTIVE LIVE MULTI-IA (`SYS-INST-EXW-001 v2.0.0`), BUS `BUS-EXW-001` & ARCHIVE CONSOLIDÉE**

> Référence unifiée de `docs/SYSTEM_INSTRUCTION_LIVE.md`, `docs/inter-ia/BUS_MESSAGES.md` et de la zone d'archive `docs/archive/`.

* **Priorité Live Multi-IA (`SYS-INST-EXW-001 v2.0.0`) :** Google AI Studio Build, Gemini Lead, Antigravity IDE et Claude opèrent sur une seule SSoT (`/docs/DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md` + `/docs/master-blueprint/` + Partition Drive Maître `19MuQPs6wNfh4jAU1EaEhAq1ZZHSTk93k` + GitHub `Securityme/Exo-world-2050-Ultra`). Hiérarchie `R-09` : *Contrats Zod > Formules > SADT > UI/3D > Prose*.
* **Journal Inter-IA Actif (`docs/inter-ia/BUS_MESSAGES.md`) :**
  * `MSG-003` : Parité socle Vague 0 (`L0..L8`, `Pcg32`, `SHA-256`).
  * `MSG-004` : Sprint Vague 2 (`ACTION_GATEWAY`, 3 onglets footer, 3D PBR).
  * `MSG-005` : Parité GitHub `Exo-world-2050-Ultra` et enregistrement surface Notebook Gemini (`AUTH_REQUIRED` côté serveur).
  * `MSG-006` : VCS Documentaire isolé (`docs/drive-sovereign` / `docs/game-assets-mirror`) + Pont Preview `/api/swarm-bus`.
  * `MSG-007` : Consolidation Niveau 0 (`/docs` unique sans doublons racine, `/docs/master-blueprint/` conservé en SSoT, compilation intégrale `v2.14.0-MAITRE`, archivage dans `/docs/archive/`).
  * `MSG-008` : Réintégration `OPT-02 A+` (`Unity 6 URP Principal + Aperçu Web Three.js`), élévation visuelle 3D AAA (cité organique non-circulaire/non-rectiligne, ACES Filmic, terminateur orbital, viaducs titane PBR, limb Rayleigh/Mie), bilan d'événement 4 pôles & Accès Rapide HUD.
  * `MSG-009` : Normalisation `NORM-EXW v3.0.0` (`XSC-CUBE 6D ⊥ G-CUBE 5D`), contrat Zod `src/contracts/classification-6d.schema.ts` strictement bi-espace sans collision, et gabarit vierge unifié `docs/master-blueprint/TEMPLATE_MASTER_BLUEPRINT_UNIFIE.md`.
* **Zone d'Archive Figée (`docs/archive/`) :** Conserve en lecture seule l'historique des anciens documents sources absorbés (`ARCHITECTURE_MIGRATION_PLAN.md`, `api-and-db/`, `architecture/`, `changelogs/`, `design/`, `gameplay/`, `governance/`, `matrices/`) afin d'éviter toute édition divergente tout en préservant l'auditabilité complète.


