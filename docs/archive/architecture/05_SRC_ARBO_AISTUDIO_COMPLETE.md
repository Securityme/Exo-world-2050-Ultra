# `05_SRC_ARBO_AISTUDIO_COMPLETE.md` — Arborescence Complète & Profil Runtime Google AI Studio Build

- **Projet** : `EXO WORLD : 2050` ([Application AI Studio Officielle](https://aistudio.google.com/apps/a21d5e66-3b0e-4b54-9e77-3a272b3c94d1?showAssistant=true))
- **Référentiels Maîtres** : `DOC-EXW-ARCH-001` (`v2.9.3-MAITRE` · Annexe F) | `SPEC-SRC-DOC-EXW-001` (`v1.2.0` · Section 6) | `SYS-INST-EXW-001` (`v1.5.0`)
- **Date** : `2026-11-20` | **Statut** : Normatif Vague 0 -> Vague 5

---

## 1. Réconciliation Runtime Plat Google AI Studio Build vs Monorepo Git

Dans l'environnement web **Google AI Studio Build** (`Vite 6 + React 19 + TypeScript 5.7 strict + Express/Vite server.ts + bun.lock`), le contenu d'exécution correspond **à la racine de `apps/exo-world/`** déployée à plat à la racine du conteneur (`/`), sans sous-dossier `apps/exo-world/` ni App Router Next.js :

- **Parité stricte 1:1** : chaque fichier sous `src/`, `docs/`, `tests/`, `public/`, `scripts/`, `.agents/` dans AI Studio correspond trait pour trait à `apps/exo-world/` dans le dépôt Git.
- **Serveur Bridge (`server.ts`)** : point d'entrée backend dev/preview (Express + middleware Vite) qui monte exclusivement les routes L8 définies dans `src/app/api/*.route.ts` — **zéro logique métier ni accès direct BDD hors `src/services/` et `src/pipelines/`**.
- **Web Worker isolé (`src/worker/`)** : exécute `src/core/` (`L2`) + `src/systems/` (`L3`) hors thread UI afin de maintenir `< 250 Mo` RAM WebKit (`R-14`) et un rendu fluide.
- **Pont SSoT (`src/doc-sync/`)** : indexe les métadonnées de version locales (`workspace-sync.lock.json`) et le miroir `BUS_MESSAGES.md` pour affichage diag/vérification dans le Build.
- **Purge obligatoire de l'héritage pré-existant** :
  - **Migrer puis supprimer `src/features/`** -> répartir la logique pure dans `src/systems/` (`L3`) et les écrans dans `src/interfaces/` (`L7`).
  - **Migrer puis supprimer `src/handlers/`** -> répartir l'orchestration pure dans `src/core/dispatchers/` (`L2`) et les flux asynchrones dans `src/pipelines/` (`L5`).
  - **Purger 100 % des mentions `HUD Astralis` / `Astralis`** dans les composants UI, `index.html`, `metadata.json` et le CSS, en les remplaçant par **`EXO-SHELL`** / **`EXO WORLD : 2050`** tout en conservant le design *Glassmorphisme Bento biseauté `135deg`* (`FMT-EXW-001`).

---

## 2. Arborescence Complète du Workspace Google AI Studio Build

```text
/ (Racine AI Studio Build <-> apps/exo-world/)
├── .aistudio/                              # Métadonnées internes Google AI Studio
├── .agents/
│   ├── system-instruction.md               # Miroir exact de SYS-INST-EXW-001 (v1.5.0)
│   └── antigravity-rules.md                # Garde-fous d'exécution & isolation Astralis
├── .env.example                            # Variables gabarit (GEMINI_API_KEY, FIREBASE_*, SQL_URL)
├── .gitignore
├── bun.lock                                # Verrou dépendances runtime AI Studio (Vite/Bun)
├── package.json                            # Scripts dev, build, lint, test, sync:sot
├── metadata.json                           # Manifeste AI Studio (name: "EXO WORLD : 2050")
├── firebase-applet-config.json             # Config Firebase Client exo-world-2050-prod (sans secret)
├── workspace-sync.lock.json                # Verrou SemVer & SHA-256 Drive <-> AI Studio <-> Git
├── index.html                              # Shell HTML <title>EXO WORLD : 2050 — EXO-SHELL</title>
├── vite.config.ts                          # Configuration Vite 6 + alias @/ -> src/ + Worker ESM
├── vitest.config.ts                        # Configuration Vitest + alias @/
├── tsconfig.json                           # TypeScript 5.7 strict + noUncheckedIndexedAccess
├── eslint.config.mjs                       # ESLint 9 Flat Config : frontières strictes L0..L8 + 300/200 l.
├── server.ts                               # [L8 Runtime Bridge] Express + Vite montant src/app/api/*
├── public/
│   └── assets/
│       ├── svg/                            # Textures & fonds SVG 1 200 ms par Ère / Palier P1..P4
│       ├── icons/                          # Icônes PWA (>= 44x44 px) & insignes PA / C1..C5
│       └── audio/                          # Repli audio local Web Audio synthétique
├── scripts/
│   ├── sync-drive-sot.mjs                  # Pull SSoT Drive -> docs/SYSTEM_INSTRUCTION_LIVE.md
│   └── sync-drive-sot.ps1                  # Wrapper PowerShell Antigravity
├── docs/
│   ├── 00_INDEX_DOCS.md                    # Index local synchronisé
│   ├── SYSTEM_INSTRUCTION_LIVE.md          # PRIORITÉ #1 : miroir temps réel de SYS-INST-EXW-001 (v1.5.0)
│   ├── DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md# Copie locale du Master Blueprint (v2.9.3-MAITRE + Annexe F)
│   ├── architecture/
│   │   ├── 01_EXO_SHELL_8_ECRANS.md
│   │   ├── 02_COUCHES_L0_L8_DEPENDANCES.md
│   │   ├── 03_DUAL_ADAPTER_3D_UNITY6.md
│   │   ├── 04_CHARTE_BENTO_SVG_FIP.md
│   │   └── 05_SRC_ARBO_AISTUDIO_COMPLETE.md# [CE DOCUMENT] Contrat d'arborescence plate AI Studio
│   ├── gameplay/
│   │   ├── 01_SADT_A0_CYCLES_N0_N5.md
│   │   ├── 02_PA_CONSEILLERS_DOSSIERS.md
│   │   ├── 03_BIOMES_ATMO_P1_P4_PNJ.md
│   │   └── 04_COMBAT_4_PHASES_L1_L5.md
│   ├── matrices/
│   │   ├── MC-00_CORRESPONDANCE.md
│   │   └── SM-01_A_SM-06_ICOM.md
│   ├── api-and-db/
│   │   ├── 01_POSTGRES_PGVECTOR_SCHEMA.md
│   │   ├── 02_FIRESTORE_SECURITY_RULES.md
│   │   └── 03_GEMINI_FREE_TIER_ROUTING.md
│   ├── inter-ia/
│   │   ├── BUS_MESSAGES.md                 # Miroir de BUS-EXW-001
│   │   ├── inbox/                          # MSG-001.yaml, MSG-002.yaml
│   │   ├── outbox/                         # MSG-003.yaml+
│   │   └── archive/
│   └── changelogs/
│       ├── V0_SOCLE_REPORT.md
│       └── FUP_TRACKER.md
├── tests/
│   ├── v0-determinism.test.ts              # SHA-256 identique sur 360 ticks (PCG32)
│   ├── v0-guardrails.test.ts               # Airlock ±15 %, Kahn/BFS, filtrage terme interdit R-50
│   ├── v0-pa-fungibility.test.ts           # PA Général + 4 Sous-PA + File P0 max 2/cycle
│   ├── v1-exo-shell.test.ts                # Navigation 8 écrans EXO-SHELL + 0 Astralis
│   ├── v1-dossiers-pa.test.ts              # Atelier 3 étages + Résolution P0/C1..C5
│   └── v1-render-adapter.test.ts           # SceneDiffPacket Three.js <-> RenderAdapterInterface
└── src/                                    # CODE SOURCE COMPLET (24 DOMAINES L0 -> L8)
```

---

## 3. Arborescence Complète et Normative de `src/` (24 Domaines `L0 -> L8`)

```text
src/
├── contracts/                              # [L0] Contrats Zod exécutables (0 import interne)
│   ├── exo-shell.schema.ts                 # 8 écrans Solo + 8 sous-écrans + 5 onglets paramètres
│   ├── world-state.schema.ts               # WorldState canonique, Slots 1..6, Ères I..VI
│   ├── pa-dossiers.schema.ts               # PA Général + 4 Sous-PA, P0 + C1..C5, Atelier 3 étages
│   ├── trigger-bus.schema.ts               # Voie 3 TRIGGER_BUS, DELAYED_ECHO, watchdogs
│   ├── maps-biomes.schema.ts               # 72 tuiles géodésiques, 9 biomes, paliers P1..P4
│   ├── combat-units.schema.ts              # 5 classes x L1..L5, combat 4 phases, Drones/Compute
│   ├── economy-cyber.schema.ts             # Villes/État, Prêts Cities II, Marché, Modules Anno
│   ├── narrative-dag.schema.ts             # DAG New Vegas (<=14 nœuds), ΔP_adapt, 4 horizons
│   ├── render-bridge.schema.ts             # SceneDiffPacket & RenderToGameEvent (Three/Unity 6)
│   ├── index.ts
│   └── README.md
│
├── parsers/                                # [L0 · Module 02] Parseurs stricts Result Pattern [Error, Data]
│   ├── zod-boundary.parser.ts              # safeParse -> [ExwError | null, T | null]
│   ├── gemini-dualpass.parser.ts           # Extraction Passe 2 (temp 0.0) & anti-malformation
│   ├── dag-tree.parser.ts                  # Normalisation graphe de choix New Vegas
│   ├── snapshot-gzip.parser.ts             # Décompression/checksum SHA-256 turn_snapshots
│   ├── unity-bridge.parser.ts              # Désérialisation DTO Unity 6 <-> TypeScript
│   ├── index.ts
│   └── README.md
│
├── config/                                 # [L1] Constantes métier Object.freeze préfixées (import L0 seul)
│   ├── pa.constants.ts                     # PA_, plafond 150 %, fongibilité asymétrique
│   ├── atmosphere.constants.ts             # ATM_, P1..P4 (-40 % -> +40 %), limite 4 h/jour
│   ├── economy.constants.ts                # ECO_, MKT_, taux prêts, 18 ressources par Ère
│   ├── maintenance.constants.ts            # MNT_, seuil watchdog < 25 %, niveaux 1..3
│   ├── combat-cyber.constants.ts           # CMB_, CYB_, DRN_, ratio Compute 2x, 2 cycles
│   ├── narrative-freetier.constants.ts     # EVT_, FTG_, clamp ±15 %, cosinus <= 0.82, 6 000 ms
│   ├── engine3d.constants.ts               # ENG3D_, 650 ms, DPR <= 1.5, WebKit < 250 Mo
│   ├── audio-fip.constants.ts              # AUD_, 5 stations FIP, filtres 900..4200 Hz
│   ├── index.ts
│   └── README.md
│
├── data/                                   # [L1] Catalogues statiques data-driven (import L0 + L1 config)
│   ├── eras-humankind.catalog.ts           # 6 Ères, Étoiles d'Ère, Doctrines d'héritage
│   ├── superpowers-alliances.catalog.ts    # 5 Superpuissances IA + 1 Super-Alliance hors contrôle
│   ├── buildings-modules.catalog.ts        # Bâtiments Anno L1..L5 + 3 modules greffés
│   ├── planets-slots.catalog.ts            # Slots 1..6 (Terre 2050, Lune, Mars, Lunes géantes, Exoplanètes)
│   ├── scientific-discoveries.catalog.ts   # Nomenclature scientifique stricte (0 terme interdit R-50)
│   ├── fallback-dossiers.catalog.ts        # Repli déterministe complet si timeout/quota Gemini
│   ├── index.ts
│   └── README.md
│
├── core/                                   # [L2] Noyau pur 100 % déterministe (0 I/O, 0 Math.random, 0 Date.now)
│   ├── prng/
│   │   └── pcg32.ts                        # XSH-RR 64->32 bits seedé
│   ├── hashing/
│   │   └── state-hasher.ts                 # Canonical JSON + SHA-256 synchrone/WebCrypto
│   ├── probability/
│   │   └── adaptive-delta.ts               # Calcul déterministe ΔP_adapt
│   ├── loop/
│   │   └── cycle-orchestrator.ts           # Actigramme A0 + Pyramide N0..N5 (15 ticks/cycle) + Snapshot Barrier
│   ├── bus/
│   │   └── cybernetic-bus.ts               # Voie 1 Intents, Voie 2 Projections 3D, Voie 3 TRIGGER_BUS
│   ├── triggers/                           # [Module 03] Déclencheurs & Watchdogs Voie 3
│   │   ├── watchdog-thresholds.trigger.ts
│   │   ├── auto-turn.trigger.ts
│   │   ├── delayed-echo.trigger.ts
│   │   └── README.md
│   ├── queues/                             # [Module 07] Files canoniques déterministes
│   │   ├── intent.queue.ts
│   │   ├── dossier-p0.queue.ts             # Amortisseur max 2 crises P0/cycle
│   │   ├── build-modular.queue.ts
│   │   └── README.md
│   ├── dispatchers/                        # [Module 04] Répartiteurs (absorbe l'ancien src/handlers/)
│   │   ├── intent.dispatcher.ts
│   │   ├── dossier-class.dispatcher.ts
│   │   ├── military-units.dispatcher.ts
│   │   ├── event-hook.dispatcher.ts
│   │   └── README.md
│   ├── routers/                            # [Module 05] Routeurs purs internes
│   │   ├── sot-layer.router.ts             # Routage max 3 couches (R-02)
│   │   ├── llm-freetier.router.ts          # Sélection Gemini Flash / Pro High Thinking / Fallback (R-68)
│   │   ├── logistics-slot.router.ts        # Routage Transporteurs T1..T4 inter-slots
│   │   └── README.md
│   ├── index.ts
│   └── README.md
│
├── guardrails/                             # [L2 · Module 08] Sas & Garde-fous bloquants
│   ├── zod-airlock.guardrail.ts            # Clamp strict [-0.15, +0.15] sur delta IA
│   ├── dag-kahn-bfs.guardrail.ts           # Acyclicité Kahn + résolvabilité BFS (condition NONE)
│   ├── nomenclature.guardrail.ts           # Détection et rejet bloquant du terme interdit R-50
│   ├── anti-oscillation.guardrail.ts       # Cap max 2 P0/cycle + hystérésis seuils
│   ├── freetier-quota.guardrail.ts         # Compteur RPM/TPM & circuit-breaker Gemini
│   ├── webkit-memory.guardrail.ts          # Sentinel RAM < 250 Mo & cycle dispose() 5 000 ms
│   ├── index.ts
│   └── README.md
│
├── systems/                                # [L3] 8 Noyaux métier purs sans I/O (absorbe src/features/ pur)
│   ├── dossiers-pa/                        # PA Général + 4 Sous-PA, Atelier 3 étages (index.ts + README.md)
│   ├── maintenance/                        # Supervision C3, usure, préventif niveaux 1..3
│   ├── biosphere/                          # 4 paliers P1..P4, 9 biomes, météo, vitesse PNJ (-40 % -> +40 %)
│   ├── economy-urban/                      # Villes <-> État, Prêts Cities II, Marché, Modules Anno
│   ├── colons-cabinet/                     # Conseillers, 12..30 Colons RimWorld, Référendums
│   ├── cyber-drones-fleet/                 # Drones 4 classes, Datacenters Compute (ratio 2x), Transporteurs
│   ├── combat-conquest/                    # Unités L1..L5 & Moteur Combats Déterministe 4 phases
│   ├── geopolitics-ai/                     # 5 Superpuissances IA, Super-Alliance, Slots 1..6, XP 3 jauges
│   └── README.md
│
├── worker/                                 # [L3/L5 Runtime AI Studio] Exécution simulation isolée
│   ├── sim-worker.protocol.ts              # Messages typés Main Thread <-> Web Worker
│   ├── sim.worker.ts                       # Boucle L2+L3 isolée (0 blocage UI 60 FPS)
│   ├── sim-worker.client.ts                # Adaptateur promesses + fallback synchrone test
│   └── README.md
│
├── engine3d/                               # [L4] Moteur Maps 3D Three.js r170+ (Lecture seule, ciel ouvert)
│   ├── pipeline/
│   │   └── renderer-context.ts             # WebGLRenderer DPR<=1.5 + dispose() WebKit < 250 Mo
│   ├── scenes/
│   │   ├── space-slots-scene.ts            # Échelle 1 : Carte Spatiale & Slots 1..6
│   │   ├── planet-globe-scene.ts           # Échelle 2 : Globe 72 tuiles géodésiques (zéro dôme)
│   │   └── city-quarters-scene.ts          # Échelle 3 : Quartiers Ouverts Anno 2205
│   ├── camera/
│   │   └── multiscale-rig.ts               # Transitions 650 ms easeInOutCubic
│   ├── instancing/
│   │   └── instance-pool.ts                # InstancedMesh bâtiments/drones/unités
│   ├── shaders/
│   │   ├── atmosphere-biomes.glsl.ts       # Shaders P1..P4 sans dôme
│   │   └── telemetry-overlays.glsl.ts
│   ├── picking/
│   │   └── deterministic-raycaster.ts      # Picking identifiants COL_* / TILE_*
│   ├── pins/
│   │   └── hologram-preview.ts             # Diegetic World Pins & Preview fantôme
│   └── README.md
│
├── adapters/                               # [L4] Dual-Adapter 3D (Three.js <-> Unity 6 URP)
│   ├── render-adapter.interface.ts
│   ├── threejs-render.adapter.ts
│   ├── unity6-webgl.adapter.ts
│   ├── scene-diff-projector.ts             # Calcul SceneDiffPacket depuis WorldState
│   └── README.md
│
├── bridges/                                # [L4/L5 · Module 01] Ponts externes isolés
│   ├── unity-jslib.bridge.ts               # Pont WebGL .jslib / WebView Unity 6
│   ├── gemini-oracle.bridge.ts             # Pont API Gemini Dual-Pass (côté client/route)
│   ├── cloud-persistence.bridge.ts         # Double écriture atomique Firestore + Cloud SQL
│   └── README.md
│
├── retrievers/                             # [L5 · Module 06] RAG Hybride SQL (<= 180 ms p95)
│   ├── hybrid-rag.retriever.ts             # Assemblage RagContextPacket
│   ├── pgvector-memory.retriever.ts        # Cosinus 768d cloisonné UID/campaignId
│   ├── chronicle-sql.retriever.ts          # 15 derniers tours chronicle_turns
│   ├── action-manifest.retriever.ts        # Index vivant des entités exécutables
│   └── README.md
│
├── stores/                                 # [L5] Zustand + Jotai (sélecteurs synchrones)
│   ├── world.store.ts                      # État simulation + dernière projection SceneDiff
│   ├── exo-shell.store.ts                  # État actif parmi les 8 écrans EXO-SHELL + sous-écrans
│   ├── dossiers.store.ts                   # File P0 + Dossiers C1..C5 + PA/Sous-PA
│   ├── selection.atoms.ts                  # Tuile / Colon / Unité sélectionnée (Jotai)
│   ├── audio-settings.store.ts             # Station FIP active + volumes + préférences R-15
│   └── README.md
│
├── services/                               # [L5] Connecteurs I/O & SDK externes
│   ├── firebase/
│   │   ├── firebase-client.ts
│   │   ├── firebase-admin.ts
│   │   └── auth.service.ts
│   ├── sql/
│   │   ├── postgres-client.ts
│   │   └── schema.drizzle.ts
│   ├── gemini/
│   │   └── gemini-client.ts                # @google/genai >= 3.x (serveur uniquement)
│   ├── audio/
│   │   └── fip-radio.service.ts            # 5 flux FIP + filtre passe-bas 900..4200 Hz + synth fallback
│   ├── saves/
│   │   └── save-snapshot.service.ts        # Snapshots compressés + SHA-256 + Firestore
│   ├── queues/
│   │   └── cloud-sync.queue.ts             # [Module 07] Retry backoff exponentiel offline/online
│   └── README.md
│
├── pipelines/                              # [L5] Orchestrateurs bout-en-bout (absorbe src/handlers/ async)
│   ├── dossier-generation.pipeline.ts      # Retriever -> Gemini -> Parser -> Guardrail -> Bus
│   ├── campaign-bootstrap.pipeline.ts      # Création campagne Solo vs 5 IA + Slot 1
│   ├── cycle-sync.pipeline.ts              # Persistance fin de tour N1 + chronique
│   └── README.md
│
├── doc-sync/                               # [L5 Runtime AI Studio] Inspection SSoT locale
│   ├── sot-manifest.ts                     # Référence versions Drive (DOC-EXW-ARCH, SYS-INST, SPEC-SRC)
│   ├── bus-mirror.ts                       # Enveloppes MSG-XXX de suivi inter-IA
│   └── README.md
│
├── hooks/                                  # [L6] Hooks React (<= 200 lignes chacun)
│   ├── use-auth-guard.ts
│   ├── use-cycle-clock.ts                  # Tick inter-tours 0x/1x/2x/4x + AUTO_TURN_TRIGGER
│   ├── use-scale-camera.ts                 # Pilotage 3 échelles 3D (650 ms)
│   ├── use-pa-allocator.ts                 # Allocation PA Général + 4 Sous-PA + fongibilité
│   ├── use-svg-backdrop.ts                 # Fondus SVG 1 200 ms selon Ère / Palier P1..P4
│   ├── use-fip-audio.ts                    # Contrôle FIP Radio + Web Audio fallback
│   ├── use-sim-worker.ts                   # Liaison réactive React <-> src/worker/sim.worker.ts
│   └── README.md
│
├── components/                             # [L7] Composants atomiques (<= 200 lignes, 0 label Astralis)
│   ├── bento/
│   │   ├── BentoCard.tsx                   # Conteneur bords lumière biseautés 135deg (FMT-EXW-001)
│   │   ├── PaBadge.tsx
│   │   └── StatusPill.tsx
│   ├── svg-backdrop/
│   │   └── DynamicSvgBackdrop.tsx          # Crossfade SVG 1 200 ms sans re-layout
│   ├── hud/
│   │   ├── TopPaP0Bar.tsx                  # Barre PA Général, 4 Sous-PA, Compteur P0 (EXO-SHELL)
│   │   ├── ScaleBreadcrumb.tsx             # Fil d'Ariane 3 échelles 3D + Retour instantané
│   │   ├── AdvisorDockC1C5.tsx             # Dock tactile >= 44x44 px + Bottom Sheet < 768 px
│   │   └── CycleClockControls.tsx          # Vitesse 0x/1x/2x/4x + MANUAL_END_TURN
│   ├── audio/
│   │   └── FipMiniPlayer.tsx               # Sélecteur 5 stations FIP + Mute + Synthètre
│   ├── charts/
│   │   └── HumankindRadarChart.tsx         # Comparateur 5 axes vs 5 Superpuissances IA
│   └── README.md
│
├── interfaces/                             # [L7] EXO-SHELL (8 Écrans Solo + 8 Sous-Écrans <= 200 l.)
│   ├── boot/BootScreen.tsx                 # État 1 : Amorçage, hash & check SSoT
│   ├── auth/AuthScreen.tsx                 # État 2 : Firebase Auth JWT (zéro offline anonyme)
│   ├── main-menu/MainMenuScreen.tsx        # État 3 : Menu Principal EXO WORLD : 2050
│   ├── new-simulation/NewSimulationScreen.tsx # État 4 : Choix Superpuissance, Seed PCG32 & Difficulté
│   ├── system-settings/SystemSettingsScreen.tsx # État 5 : 5 Onglets Paramètres (Graphismes/Audio/FIP/IA/Compte)
│   ├── briefing-lobby/BriefingLobbyScreen.tsx   # État 6 : Briefing Pré-Lancement Solo vs 5 IA
│   ├── game-screen/GameScreen.tsx          # État 7 : Canvas 3D plein écran + HUD EXO-SHELL
│   ├── victory-endless/VictoryEndlessScreen.tsx # État 8 : Bilan d'Ère / Victoire & Mode Infini
│   ├── subscreens/
│   │   ├── DossierWorkshopModal.tsx        # Atelier 3 Étages (New Vegas / Anno / Hologramme)
│   │   ├── WorldTabPanel.tsx               # Carte Slots 1..6 & 72 tuiles
│   │   ├── JournalChroniclePanel.tsx       # Chronique tours & RAG
│   │   ├── MaintenanceTabPanel.tsx         # Supervision C3 & Préventif L1..L3
│   │   ├── BiosphereColonsPanel.tsx        # Paliers P1..P4 & 12..30 Colons RimWorld
│   │   ├── GeopoliticsAlliancePanel.tsx    # 5 IA + Super-Alliance + XP 3 jauges
│   │   ├── MilitaryCyberPanel.tsx          # Unités L1..L5 + Drones + Datacenters Compute
│   │   └── PauseSavesModal.tsx             # Pause, Sauvegardes Firebase/SQL & Export SHA-256
│   └── README.md
│
├── app/                                    # [L8] Routes API Backend montées par server.ts
│   └── api/
│       ├── health.route.ts                 # GET /api/health (statut SSoT, Firebase, Gemini circuit)
│       ├── oracle.route.ts                 # POST /api/oracle (Dual-Pass Gemini + Zod + Guardrails)
│       ├── saves-sync.route.ts             # POST /api/saves/sync (Firebase + Cloud SQL GZIP)
│       ├── chronicle-query.route.ts        # POST /api/chronicle/query (RAG pgvector <= 180 ms)
│       ├── campaign-bootstrap.route.ts     # POST /api/campaign/bootstrap
│       ├── routes.manifest.ts              # Registre typé des routes API montées par server.ts
│       └── README.md
│
├── App.tsx                                 # Routeur client 8 états EXO-SHELL (<= 200 lignes)
├── main.tsx                                # Point d'entrée React 19 createRoot
└── index.css                               # Tailwind v4 + tokens Bento 135deg + polices EXO-SHELL
```

---

## 4. Règles ESLint 9 Flat Config Corrigées (`eslint.config.mjs`)

L'ancien snippet de `SPEC-SRC-DOC-EXW-001 v1.0.0 §5.1` utilisant `zones` dans `no-restricted-imports` est remplacé par des **blocs dédiés par couche (`files: ["src/<couche>/**/*.ts"]`)** déjà validés dans `eslint.config.mjs` :
- `src/contracts/**` (`L0`) : aucun import vers les autres couches.
- `src/parsers/**` (`L0`) : import `src/contracts/` uniquement.
- `src/config/**` (`L1`) : import `L0` uniquement.
- `src/data/**` (`L1`) : import `L0` et `L1 config` uniquement.
- `src/core/**` & `src/guardrails/**` (`L2`) : import `L0` et `L1` uniquement (zéro `systems`, `engine3d`, `services`, UI, React).
- `src/systems/**` (`L3`) : import `L0..L2` uniquement.
- `src/worker/**` (`L3/L5`) : import `L0..L3` uniquement (zéro React/UI/DOM).
- `src/engine3d/**` & `src/adapters/**` (`L4`) : import `L0..L3` uniquement.
- `src/bridges/**`, `src/retrievers/**`, `src/stores/**`, `src/services/**`, `src/pipelines/**`, `src/doc-sync/**` (`L5`) : import `L0..L4` + `src/worker/sim-worker.client.ts`.
- `src/hooks/**` (`L6`) : import `L0..L5`, `<= 200` lignes.
- `src/components/**` & `src/interfaces/**` (`L7`) : import `L0..L6`, `<= 200` lignes, zéro label Astralis.
- `src/app/api/**` & `server.ts` (`L8`) : point d'entrée serveur autorisant `L0..L5` sans importer React/UI (`L7`).
---

## 5. Protocole Miroir 5 Surfaces (`Drive <-> Google AI Studio <-> GitHub <-> Gemini <-> Antigravity`) & Thème `Astralis Snapshot V7` (`v1.2.0`)

### 5.1 Règle d'Autorité & Synchronisation Bidirectionnelle des 5 Surfaces

| Surface | Identifiant / Cible | Rôle dans le Miroir Unifié | Déclencheur de Synchronisation |
| :--- | :--- | :--- | :--- |
| **1. Google Drive (SSoT)** | `19MuQPs6wNfh4jAU1EaEhAq1ZZHSTk93k` (`Branches 01..07`) | Source de vérité primaire des spécifications (`DOC-EXW-ARCH-001`, `SYS-INST-EXW-001 v1.6.0`, `SPEC-SRC v1.2.0`, `BUS-EXW-001`). | `scripts/sync-drive-sot.ps1` / `gdocs mutate batch` / `gdrive mutate update`. |
| **2. Google AI Studio Build** | `a21d5e66-3b0e-4b54-9e77-3a272b3c94d1` | Autorité de génération et d'exécution live du code `src/` (24 domaines `L0 -> L8` + `server.ts`) et Preview WebGL. | Injection `Custom instructions` (`v1.6.0`) + upload `File explorer` + prompt Code Assistant. |
| **3. GitHub (VCS Code)** | Dépôt `exo-world-2050` | Miroir Git du code produit par Google AI Studio Build et audité par `vercel-agent` / CI. | Action native **`Export -> Push to GitHub`** dans Google AI Studio après chaque itération validée. |
| **4. Gemini Lead** | Fil `521c6de57cd723f3` & `BUS-EXW-001` | Supervision architecturale, arbitrage des `FUP-001..013` et revue des synthèses de playtest (`MSG-004`). | Enveloppes YAML `MSG-XXX` dans `07_ECHANGES_INTER_IA/BUS-EXW-001`. |
| **5. Antigravity Hub** | `c:\Users\Sophie\Downloads\EXO_WORLD_2050\` | Hub miroir local (`workspace-sync.lock.json`, `AGENTS.md`, `GEMINI.md`, `.agents/skills/`), playtests 6 tours (`/schedule`) et escouade Swarm Argon. | Tâche planifiée `/schedule` (`0 */4 * * *`) + scripts `sync-drive-sot.ps1` et `run-playtest-6turns.ps1`. |

### 5.2 Thème Visuel `Astralis Snapshot V7` & Infobulles Contextuelles (`src/components/bento/ExoTooltip.tsx`)

- **Direction Artistique `Astralis Snapshot V7` sous identité `EXO WORLD : 2050` (`EXO-SHELL`)** :
  - Fond obsidienne spatiale (`--exo-v7-bg-obsidian: #050811`), panneaux verre dépoli Bento biseautés à `135deg`, micro-bordures holographiques cyan (`--exo-v7-border-cyan: #00F0FF`) et alertes ambre (`--exo-v7-accent-amber: #FFB800`), fond SVG dynamique à fondus enchaînés `1 200 ms` (`FMT-EXW-001`).
  - L'application porte exclusivement l'identité **`EXO WORLD : 2050`** et **`EXO-SHELL`** (8 écrans Solo + 8 sous-écrans), en réutilisant l'excellence ergonomique et visuelle du snapshot V7 ([Astralis : Genesis Ultra](https://aistudio.google.com/apps/e0e22b25-ba4d-434b-9334-8b4e0037b6c6?showPreview=true&showAssistant=true)).
- **Composant Normatif `[L7] src/components/bento/ExoTooltip.tsx` (`<= 200` lignes)** :
  - Déployé sur tous les éléments interactifs où un éclairage mécanique ou narratif est utile :
    1. **Jauges `PA Général` & `4 Sous-PA Conseillers`** : affiche le ratio de fongibilité asymétrique (`R-26`) et le plafond `150 %`.
    2. **Dossiers `P0` / `C1..C5` & Atelier 3 Étages** : affiche la fourchette `ΔP_adapt` (`[-0.15, +0.15]`), les prérequis DAG *New Vegas* et l'horizon `DELAYED_ECHO` (`COURT`, `MOYEN`, `LONG`, `CRITIQUE`).
    3. **Paliers Atmosphériques `P1..P4` (`TopPaP0Bar.tsx`)** : détaille l'impact sur la vitesse PNJ (`-40 %` à `+40 %`), la durée maximale d'exposition (`4 h/jour`) et l'usure des kits respiratoires.
    4. **18 Ressources & Prêts *Cities II*** : affiche le flux net par cycle (`15 ticks`), les stocks et l'intérêt de dette.
    5. **Unités Militaires `L1..L5` & Datacenters Cyber** : affiche la décomposition des 4 phases de combat déterministe et le ratio Compute (`>= 2.0x`).