# EXO WORLD : 2050 — Plan de Migration Architecturale & Proposition 8 Couches × 8 Tiers

> **Périmètre vérifié sur l'état réel du dépôt** : `179` modules TypeScript/TSX actifs dans `src/` (+ `src/index.css` + `16` concept arts dans `src/assets/images/`), gouvernés par `exo:audit` (`17/17` matrices M0..M15, `0` cycle Kahn, `0` violation `Z0` / `R-16` / `R-50`) et accompagnés du générateur `scripts/scaffold-exoworld-aaa.mjs`.

---

## 1. État Actuel de `src/` (Monolithe Modulaire `L0 → L8` — 179 Modules TS/TSX)

Aujourd'hui, l'application fonctionne dans un seul package Vite (`src/`) découpé logiquement en couches ESLint `L0 → L8`. Cette structure compile rapidement et reste simple à déployer, mais mélange dans un même graphe `tsconfig.json` la simulation pure déterministe, le moteur 3D Three.js, les adaptateurs Firebase/Drive, le design system Multi-Thème et les écrans React.

### Inventaire Réel Mesuré dans `src/`

| Dossier actuel (`src/`) | Couche | Modules TS/TSX | Contenu réel vérifié | Limite structurelle actuelle |
|---|---|---:|---|---|
| `src/contracts/` | `L0` | 16 | Schémas Zod (`world-state`, `combat-units`, `pa-dossiers`, `ui-theme`, `render-bridge`, `v4-systems`, `guards/z0-legacy`) | Partage le même `package.json` que React/Three |
| `src/config/` | `L0` | 13 | Constantes `atmosphere`, `combat`, `cycle`, `economy`, `pa`, `nomenclature`, `shell`, `llm-freetier` | Pas d'isolation physique CLI headless |
| `src/parsers/` & `src/guardrails/` | `L1` | 13 | `zod-boundary`, `gemini-dualpass`, `dag-kahn-bfs`, `nomenclature.guardrail`, `zod-airlock` | Couplage implicite par chemins relatifs |
| `src/data/` | `L1` | 11 | `v4-catalog`, `world.catalog`, `ui-themes.catalog` (6 thèmes), `ui-wallpapers.assets`, `llm-lexicon.data`, `art-manifest` | Assets images vite historiquement proches des données |
| `src/core/` | `L2` | 22 | `pcg32`, `pcg32-streams` (6 flux), `state-hasher` SHA-256, `cycle-orchestrator`, `trigger-bus`, `delayed-echo.trigger`, `dossier.dispatcher`, `llm-freetier.router` | Runtime générique et orchestration 2050 cohabitent |
| `src/systems/` | `L3` | 17 | `pa-engine`, `combat-engine`, `tactical-intensity-grid`, `terraformation-v4`, `world-systems`, `playtest-6-turns`, `resource-trend-projection`, `humankind-progression`, `turn-gate-v4` | Tous les noyaux métier sont dans un seul dossier plat |
| `src/worker/` | `L3` | 3 | `simulation.worker.ts`, `worker-client.ts` | Worker lié aux types globaux du frontend |
| `src/engine3d/` & `src/adapters/` | `L4` | 8 | `threejs-render.adapter`, `scene-builders`, `procedural-models`, `procedural-textures`, `isolated-inspector.scene`, `scene-diff-projector` | Dépendance Three.js globale sans RHI isolé |
| `src/bridges/` & `src/retrievers/` | `L4` | 15 | `render-dual.bridge`, `worker-sim.bridge`, `narrative-core.bridge`, `hybrid-rag.retriever`, `dossier-context.retriever` | Pas de frontière plugin sandboxée |
| `src/services/` & `src/doc-sync/` | `L5` | 16 | `firebase-client`, `firestore-archives`, `fip-radio.service`, `save-migration`, `local-saves`, `google-picker.service`, `drive-docs.service` | Services cloud/audio/picker couplés au build client unique |
| `src/stores/`, `src/pipelines/`, `src/hooks/` | `L6` | 14 | `game.store.ts`, `selection.atoms.ts`, `game-actions.pipeline`, `turn-events-4t.pipeline`, `use-theme-engine.ts`, `use-cycle-clock.ts`, `use-fip-audio.ts` | Store unique mélangeant état campagne et config Studio UI |
| `src/components/` & `src/interfaces/` | `L7` | 46 | `MainMenuScreen`, `SettingsScreen`, `GameHud`, `ThemeStudioPanel`, `TacticalHeatmap` (`d3`), `ResourceTrendProjectionChart` (`recharts`), `JournalChroniclePanel`, `DossierWorkshopModal`, `ExoTooltip` | 46 fichiers UI sous un seul bundler sans `@exo/ui-kit` réutilisable |
| `src/app/api/`, `src/utils/`, racine | `L8` | 5 | `health.route.ts`, `oracle.route.ts`, `llm-lexicon.ts`, `App.tsx`, `main.tsx` | Point d'entrée unique sans `headless-sim` ni `world-editor` dédiés |
| **Total actuel** | **`L0..L8`** | **179** | *(+ `src/index.css` & `16` images JPG)* | Imports verrouillés par lint seulement, pas par `package.json` |

---

## 2. État Projeté : Monorepo AAA (`S1 → S6` — 20 Workspaces, 216 Fichiers Sources)

Le passage vers le Monorepo AAA (`scripts/scaffold-exoworld-aaa.mjs`, validé par `verifyDependencyDag.ts`) découpe ce monolithe en **6 strates unidirectionnelles** et **20 workspaces** `pnpm + Turborepo`, garantissant physiquement qu'aucune couche basse ne puisse importer du DOM, React ou Three.js.

### Cartographie de Migration des Modules Clés (`src/` → AAA `S1..S6`)

| Source actuelle dans `src/` | Workspace cible AAA | Strate | Rôle & gains de l'isolation |
|---|---|---|---|
| `src/core/{prng,hashing,probability}` + `src/config/cycle,pa` | `@exo/math-det` | `S1` | Mathématiques pures, **PCG32 6 flux**, **SHA-256**, grille géodésique 72 tuiles, clamp `ΔP_adapt` (`R-69`). Zéro DOM. |
| `src/core/{bus,queues,routers,loop}` + `src/worker/` | `@exo/core-runtime` | `S1` | Bus CQRS, file `DELAYED_ECHO`, FSM `EXO-SHELL`, job graph & RingBuffer. |
| `src/adapters/scene-diff-projector.ts` + état différentiel | `@exo/ecs` | `S2` | Stockage SoA, DirtyFlags binaires, `SceneDiffPacket` & snapshots par tour. |
| **`src/engine3d/*` + `src/adapters/render-adapter.interface.ts`** | **`@exo/rhi-render`** | **`S2`** | **Isolation complète WebGPU/WebGL2 + Three.js** : 3 échelles `650 ms`, Globe 72 secteurs, **Cités & bâtiments à ciel ouvert (`R-16` zéro dôme)**, passes Maintenance/Flux, Raycaster d'inspection terrain. |
| `src/services/audio/fip-radio.service.ts` | `@exo/audio` | `S2` | Web Audio 3D + **6 flux Radio France FIP** + cues tactiques découplés de l'UI. |
| `src/services/{firebase,saves,persistence}` + `src/doc-sync/{google-picker,drive-docs}` | `@exo/persistence-net` | `S2` | Firebase Auth/Firestore, migration `v3 → v4`, **Google Picker OAuth client-side** & détection de désync replay. |
| `src/contracts/*` + `src/data/*` (hors images) | `@exo/game-data` | `S4` | Schémas Zod (`WorldState`, `CombatUnits`, `UiThemeStudio`), **18 ressources**, **6 thèmes système**, **lexique LLM**, catalogues **quartiers & bâtiments individuels ouverts**. |
| `src/systems/biosphere*/*` + `src/systems/biosphere/*` | `@exo/domain-planet` | `S4` | **Paliers atmosphériques `P1..P4`** (`-40%` à `+40%` PNJ, limite `4 h/j`), hydrologie, score Terra, habitabilité sans dôme (`R-39`). |
| **`src/systems/{dossiers-pa,economy-urban,combat-conquest,geopolitics,playtest,turn-orchestration}` + `src/pipelines/game-actions`** | **`@exo/domain-gameplay`** | **`S4`** | **Cœur pur de simulation 2050** : PA/Sous-PA (`R-26`), Atelier 3 Étages, Combat 4 phases + **Grille tactique `P1–P4 × L1–L5`**, **Playtest 6 Tours (90 ticks)**, **Projection 18 ressources**, 5 Superpuissances IA. **100% exécutable sans navigateur.** |
| `src/hooks/use-theme-engine.ts` + `src/components/{ThemeStudio*,ExoTooltip,ExoTitleEmblem,DynamicSvgBackdrop}` + `src/components/world/{TacticalHeatmap,ResourceTrendProjectionChart}` + `src/index.css` | `@exo/ui-kit` | `S4` | Design system Multi-Thème (`ROSE_ASTRAL` par défaut, 6 thèmes, Studio UI), **D3 3D Heatmap**, **Recharts 18 ressources**, infobulles `ExoTooltip`. |
| `src/pipelines/oracle-dossier` + `src/utils/llm-lexicon` + `src/parsers/gemini-dualpass` | `@exo/plugin-narrative-director` | `S5` | Directeur narratif Gemini 4T + **dictionnaire LLM RPG/Citybuilder** (`aFFermer` → *prendre en fermage / louer à bail*, etc.) + fallback local déterministe. |
| `src/interfaces/*` + `src/stores/*` + `src/App.tsx` | `apps/web-client` (`@exo/web-client`) | `S6` | Client navigateur EXO-SHELL complet assemblant les strates `S1..S5`. |
| Nouveau binaire CLI sans DOM | `apps/headless-sim` | `S6` | Stress-tests 1 000 tours & CI déterminisme SHA-256 (interdit d'importer `rhi-render`, `ui-kit`, `audio`, `react`, `three`). |

### Focus sur les Deux Mouvements Majeurs

1. **Extraction de `domain-gameplay` (`S4`) hors du frontend** :
   - *Avant* : `pa-engine.ts`, `combat-engine.ts`, `tactical-intensity-grid.ts`, `playtest-6-turns.ts` et `resource-trend-projection.ts` vivent dans `src/systems/` juste à côté des hooks React et des composants UI.
   - *Après* : `@exo/domain-gameplay` ne dépend que de `@exo/math-det`, `@exo/core-runtime`, `@exo/ecs`, `@exo/sim-framework`, `@exo/game-data` et `@exo/domain-planet`. Il peut tourner tel quel sous Node (`apps/headless-sim`), dans un Web Worker, ou côté serveur pour valider l'équilibrage sur 1 000 tours avant déploiement.
2. **Extraction de `rhi-render` (`S2`) derrière le pont `SceneDiffPacket`** :
   - *Avant* : `src/engine3d/*` lit/écrit via `bridges/` et partage le bundle UI principal.
   - *Après* : `@exo/rhi-render` devient un moteur agnostique `S2` qui ne connaît **aucune règle de jeu 2050** (`PA`, `Dossiers`, `Superpuissances`) : il reçoit uniquement des `SceneDiffPacket` typés (`@exo/ecs`), gère les 3 échelles (`650 ms`), instancie les **bâtiments individuels par zone de quartier ouvert (`R-16`)** et remonte les clics terrain par événements neutres.

---

## 3. Proposition d'Architecture Optimale : Matrice **8 Couches × 8 Tiers** (`C0..C7` × `T0..T7`)

L'architecture actuelle à `9` niveaux plats (`L0..L8`) manque d'axe métier transversal, tandis que le découpage `S1..S6` seul reste grossier à l'intérieur des gros modules (`@exo/domain-gameplay` ou `@exo/rhi-render`). Pour industrialiser **EXO WORLD : 2050** entre **6 et 12 couches sur 6 à 12 tiers**, voici la matrice orthogonale **`8 Couches (Verticalité Technique)` × `8 Tiers (Domaines & Exécutables)`**.

### 3.1 Les 8 Couches Techniques (`C0 → C7`, flux de dépendance strict `C_i` ne dépend que de `C_j` avec `j <= i`)

| Couche | Nom de couche | Responsabilité technique exclusive | Interdictions strictes |
|---|---|---|---|
| **`C0`** | **Primitives & Déterminisme** | Types purs, `FixedPointMath`, `PCG32` 6 flux, `SHA-256`, géométrie géodésique 72 tuiles | Zéro I/O, zéro Zod runtime lourd, zéro DOM |
| **`C1`** | **Contrats & Garde-fous** | Schémas Zod (`WorldState`, `UiThemeStudio`, `Dossier`), règles lexicales `Z0` / `R-16` / `R-50` | Zéro logique métier mutable, zéro side-effect |
| **`C2`** | **Noyau Runtime & Mémoire** | ECS SoA, `DirtyFlags`, Bus CQRS, `DelayedEchoQueue`, Horloge 15 ticks/tour, Workers | Zéro connaissance de 2050 ou Three.js |
| **`C3`** | **Données & Manifestes** | Catalogues `18 Ressources`, `6 Thèmes UI`, `Quartiers & Bâtiments Ouverts`, `Lexique LLM`, `Concept Arts` | Zéro mutation d'état, zéro appel réseau |
| **`C4`** | **Moteurs Spécialisés (Moteur-agnostiques)** | `@exo/rhi-render` (3D Three.js/WebGPU), `@exo/audio` (FIP 6 flux + Web Audio), `@exo/persistence-net` (Local + Firebase + Drive Picker) | Zéro règle de gameplay 2050 |
| **`C5`** | **Simulateurs de Domaine** | `@exo/domain-planet` (`P1..P4`) et `@exo/domain-gameplay` (`PA`, `Combat 4 phases`, `Playtest 6T`, `Bâtiments individuels`) | Zéro `react`, zéro `window`, zéro `three` |
| **`C6`** | **Extensions, IA & Pipelines** | Plugins sandboxés (`orbital-megastructures`, `narrative-director`), passerelles `Gemini 4T` + fallback local, `WorldGen` | Jamais importés par `C0..C5` |
| **`C7`** | **Design System & Shells Applicatifs** | `@exo/ui-kit` (Theme Studio, `TacticalHeatmap` D3, `Recharts`), `apps/web-client`, `apps/headless-sim`, `apps/world-editor` | `headless-sim` interdit d'importer le DOM ou `rhi-render` |

### 3.2 Les 8 Tiers Fonctionnels (`T0 → T7`, progression du socle vers le produit final)

| Tier | Nom du Tier | Périmètre fonctionnel | Workspaces / Modules rattachés |
|---|---|---|---|
| **`T0`** | **Socle Matériel & Plateforme** | Horloge haute résolution, OPFS/IndexedDB, détection GPU, clavier/tactile | `@exo/pal`, adaptateurs stockage |
| **`T1`** | **Noyau Mathématique & ECS** | Déterminisme `PCG32`, hash `SHA-256`, ECS SoA, diff binaire | `@exo/math-det`, `@exo/core-runtime`, `@exo/ecs` |
| **`T2`** | **Rendu, Audio & Persistance** | Scènes 3 échelles `650 ms`, bâtiments ouverts instanciés, FIP radio, Firebase/Drive | `@exo/rhi-render`, `@exo/assets-vfs`, `@exo/audio`, `@exo/persistence-net` |
| **`T3`** | **Monde Physique & Planétologie** | Atmosphère `P1..P4` (`-40%` à `+40%` PNJ), hydrologie, biosphère, 72 secteurs | `@exo/domain-planet`, cartes/biomes `T3` |
| **`T4`** | **Économie, Quartiers & Bâtiments** | Zones de quartiers ouverts accueillant des **bâtiments individuels**, maintenance, 18 ressources, Banque fédérale | `@exo/domain-gameplay` (sous-domaine Urbain & Éco) |
| **`T5`** | **Gouvernance, Combat & Géopolitique** | PA/Sous-PA (`R-26`), Atelier 3 Étages, Combat 4 phases, Grille `L1–L5`, Compute `2x`, 5 Superpuissances IA | `@exo/domain-gameplay` (sous-domaine Stratégie & Défense) |
| **`T6`** | **Narration, Plugins & Équilibrage** | Directeur narratif Gemini 4T, Dictionnaire Lexique LLM, Playtest 6T, Mégastructures orbitales | `@exo/plugin-sdk`, `@exo/plugin-narrative-director`, `@exo/plugin-orbital-megastructures` |
| **`T7`** | **Expérience Joueur, Studio UI & Outils** | Thèmes (`Rose Astralis` + 5 palettes), Studio Lumière/Ombres/Fonds, HUD 3 onglets, `TacticalHeatmap`, `ResourceTrendProjection`, `headless-sim`, `world-editor` | `@exo/ui-kit`, `apps/web-client`, `apps/headless-sim`, `apps/world-editor`, `@exo/tools` |

### 3.3 Matrice Orthogonale `8 Couches × 8 Tiers` (Vue de Synthèse)

```text
Couches \ Tiers | T0 Plateforme | T1 Noyau ECS  | T2 Moteurs 3D/Net | T3 Planète P1-P4 | T4 Cités & Éco    | T5 Combat & PA    | T6 Narration/DLC  | T7 UI & Apps
----------------+---------------+---------------+-------------------+------------------+-------------------+-------------------+-------------------+--------------------
C7 UI & Shells  |               |               |                   |                  |                   |                   |                   | web-client / editor
C6 Plugins/IA   |               |               |                   | WorldGen 72      |                   | IA 5 Rivaux       | NarrativeDirector | Playtest Studio
C5 Domaines Sim |               |               |                   | domain-planet    | Quartiers/Bâtim.  | Combat 4Ph / PA   | Playtest 6T       | headless-sim (CLI)
C4 Moteurs      | @exo/pal      |               | rhi-render/audio  |                  |                   |                   | persistence-net   | ui-kit (D3/Recharts)
C3 Data/Thèmes  |               |               | art-manifest      | Biomes P1..P4    | 18 Ressources     | Unités L1..L5     | Lexique LLM       | 6 Thèmes Studio UI
C2 Runtime/ECS  | WorkerPool    | core-runtime  | SceneDiffBuilder  | ClimateWorker    | BuildQueue        | DelayedEchoQueue  | PluginHost        |
C1 Contrats Zod | StoragePort   | EntityGuard   | RenderBridgeZod   | TerraSchema      | DistrictZod       | Dossier/CombatZod | Guardrail R-50/Z0 | UiThemeStudioZod
C0 Primitives   | HighResClock  | PCG32/SHA256  | SphericalCoords   | FixedPointMath   |                   | DeltaPAdaptClamp  |                   |
```

### 3.4 Règle d'Or de Compilation & Préparation aux Bâtiments Individuels par Quartier

1. **Règle d'Import Orthogonale `(Ci, Tj)`** : Un module situé en `(Ci, Tj)` ne peut importer un module en `(Ci', Tj')` que si **`i' <= i` ET `j' <= j`** (avec exception contrôlée uniquement en `C7/T7` pour l'assemblage applicatif final).
2. **Évolution Quartiers Ouverts → Bâtiments Individuels (`T4 / C3–C5` + `T2 / C4`)** :
   - La matrice prépare nativement la transition demandée entre macro-quartiers et **bâtiments individuels dans une zone de quartier ouvert** (`R-16` zéro dôme) :
     - **`T4/C1–C3`** sépare `OpenSkyDistrictZone` (parcelle/zone de quartier) et `IndividualBuildingInstance` (modules individuels constructibles sur grille interne de zone).
     - **`T4/C5`** calcule maintenance, consommation et emplois par bâtiment individuel avec agrégation par zone.
     - **`T2/C4` (`@exo/rhi-render`)** remplace le bloc monolithique de quartier à l'Échelle 3 par des maillages instanciés par bâtiment (`InstancedBuildingBatcher`) sans toucher à `T5` ni à `C7`.

---

## 4. Plan de Bascule Incrémental sans Rupture (5 Lots)

1. **Lot 1 — Socle `T0–T1` (`C0–C2`)** : Extraire `@exo/pal`, `@exo/math-det` (`PCG32` 6 flux, `SHA-256`), `@exo/core-runtime` et `@exo/ecs` ; brancher `verifyDependencyDag.ts` en CI.
2. **Lot 2 — Simulation Pure `T3–T6` (`C1, C3, C5`)** : Isoler `@exo/game-data`, `@exo/domain-planet` et `@exo/domain-gameplay`, puis valider **1 000 tours headless** via `apps/headless-sim` avec empreintes `SHA-256` identiques sur 2 runs.
3. **Lot 3 — Moteurs Spécialisés `T2` (`C4`)** : Isoler `@exo/rhi-render`, `@exo/assets-vfs`, `@exo/audio` (FIP 6 flux) et `@exo/persistence-net` (Firebase + Google Picker client-side).
4. **Lot 4 — Design System & Plugins `T6–T7` (`C6–C7`)** : Extraire `@exo/ui-kit` (Thèmes `Rose Astralis` + 5 palettes, `ThemeStudioPanel`, `TacticalHeatmap` D3, `ResourceTrendProjectionChart` Recharts) et `@exo/plugin-narrative-director` (Lexique LLM).
5. **Lot 5 — Bâtiments Individuels par Quartier & Nettoyage `src/`** : Activer les parcelles multi-bâtiments individuels dans `@exo/domain-gameplay` + `InstancedBuildingBatcher` dans `@exo/rhi-render`, puis retirer les anciens ponts `src/` une fois `apps/web-client` déployé.
