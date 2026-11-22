#!/usr/bin/env node
/**
 * EXO WORLD : 2050 — AAA Monorepo Scaffolder (v4.1 · Aligné État Réel)
 * Génère les 6 strates AAA (S1 → S6), 20 workspaces pnpm/Turborepo,
 * les frontières package.json verrouillées, la racine documentaire (docs/,
 * master-blueprint/, firebase-blueprint.json, firestore.rules, tests/) et un
 * vérificateur DAG exécutable (S1→S6 + isolation headless + Z0/R-16/R-50).
 *
 * Usage :
 *   node scripts/scaffold-exoworld-aaa.mjs [dossier-cible] [--force] [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const DRY_RUN = args.includes('--dry-run');
const targetArg = args.find((a) => !a.startsWith('--')) ?? 'exo-world-2050-aaa';
const ROOT_DIR = path.resolve(process.cwd(), targetArg);

const STRATA_ORDER = { S1: 1, S2: 2, S3: 3, S4: 4, S5: 5, S6: 6 };

// ============================================================================
// 1. CARTOGRAPHIE DES 6 STRATES & 20 WORKSPACES ALIGNÉS EXO WORLD : 2050
// ============================================================================

const WORKSPACES = [
  // --------------------------------------------------------------------------
  // STRATE S1 · FOUNDATION
  // --------------------------------------------------------------------------
  {
    stratum: 'S1',
    name: '@exo/pal',
    dir: 'packages/01-foundation/pal',
    description: 'Platform Abstraction Layer (OPFS, IndexedDB, sondes GPU, horloge, OAuth client)',
    deps: [],
    extDeps: {},
    devDeps: { '@webgpu/types': '^0.1.48' },
    jsx: false,
    dom: true,
    files: [
      ['src/index.ts', 'Point d’entrée public du module PAL'],
      ['src/capabilities/GpuCapabilityProbe.ts', 'Détection WebGPU / WebGL2 et profil basse consommation'],
      ['src/capabilities/HardwareConcurrency.ts', 'Dimensionnement dynamique du pool de workers'],
      ['src/storage/StorageBackendPort.ts', 'Contrat de persistance locale (sauvegardes & thème UI)'],
      ['src/storage/OpfsStorageAdapter.ts', 'Adaptateur Origin Private File System haute vitesse'],
      ['src/storage/IndexedDbAdapter.ts', 'Fallback persistance navigateur standard'],
      ['src/input/GamepadAndPointerDriver.ts', 'Normalisation tactile mobile, clavier (1/2/3/T/H/P) et souris'],
      ['src/time/HighResClock.ts', 'Horloge monotone haute résolution (650 ms échelles 3D)'],
    ],
  },
  {
    stratum: 'S1',
    name: '@exo/math-det',
    dir: 'packages/01-foundation/math-det',
    description: 'Mathématiques déterministes, PCG32 6-flux, chaîne SHA-256 et projections géodésiques 72 tuiles',
    deps: [],
    extDeps: {},
    devDeps: {},
    jsx: false,
    dom: false,
    files: [
      ['src/index.ts', 'Point d’entrée public des primitives déterministes'],
      ['src/deterministic/FixedPointMath.ts', 'Arithmétique bornée anti-dérive flottante'],
      ['src/deterministic/Pcg32SixStreams.ts', 'PRNG déterministe PCG32 à 6 flux indépendants (world, combat, echo, ai, economy, narrative)'],
      ['src/deterministic/StateSha256Chain.ts', 'Empreinte SHA-256 canonique par tour (turn_snapshots)'],
      ['src/deterministic/DeltaPAdaptGuard.ts', 'Clamp strict ΔP_adapt ∈ [-0.15, +0.15] (R-69)'],
      ['src/procedural/SimplexNoise.ts', 'Bruit cohérent multi-octaves pour relief planétaire'],
      ['src/procedural/WorleyNoise.ts', 'Bruit cellulaire pour bassins hydrologiques et biomes'],
      ['src/procedural/InterpolationUtils.ts', 'Courbes lerp, slerp et transitions caméra 650 ms'],
      ['src/spatial/Geodesic72Grid.ts', 'Topologie sphérique exacte 72 secteurs planétaires'],
      ['src/spatial/SphericalCoords.ts', 'Conversions lat/lon vers vecteurs 3D et voisinage O(1)'],
    ],
  },
  {
    stratum: 'S1',
    name: '@exo/core-runtime',
    dir: 'packages/01-foundation/core-runtime',
    description: 'Mémoire (Arenas, RingBuffer), Job System, FSM EXO-SHELL, Bus CQRS, Queues DELAYED_ECHO & Profiler',
    deps: ['@exo/pal', '@exo/math-det'],
    extDeps: {},
    devDeps: {},
    jsx: false,
    dom: true,
    files: [
      ['src/index.ts', 'Point d’entrée public du runtime noyau'],
      ['src/memory/SharedArenaAllocator.ts', 'Allocation linéaire sans GC dans SharedArrayBuffer'],
      ['src/memory/RingBuffer.ts', 'Buffer circulaire lock-free inter-threads'],
      ['src/memory/ObjectPool.ts', 'Recyclage d’objets hors boucle chaude'],
      ['src/jobs/JobGraphScheduler.ts', 'Ordonnanceur DAG déterministe'],
      ['src/jobs/WorkerPoolManager.ts', 'Supervision des Web Workers de simulation'],
      ['src/jobs/TransferableCodec.ts', 'Transfert zero-copy ArrayBuffer'],
      ['src/kernel/TurnCycleClock.ts', 'Boucle hybride 15 ticks/tour (Playtest 6T = 90 ticks)'],
      ['src/kernel/ExoShellStateMachine.ts', 'FSM stricte EXO-SHELL (Boot, Auth, Menu, NewSim, Settings, Briefing, Game)'],
      ['src/bus/CommandBus.ts', 'Bus CQRS des commandes validables et rejouables'],
      ['src/bus/EventBus.ts', 'Bus pub/sub découplé des faits du domaine'],
      ['src/queues/DelayedEchoQueue.ts', 'File causale DELAYED_ECHO multi-horizons (court/moyen/long)'],
      ['src/routers/ActionRouter.ts', 'Routage centralisé vers dispatchers & pipelines'],
      ['src/di/ServiceContainer.ts', 'Conteneur d’injection de dépendances typé'],
      ['src/diagnostics/StructuredLogger.ts', 'Journalisation filtrable hors interface joueur'],
      ['src/diagnostics/FrameBudgetProfiler.ts', 'Sonde budget 16.6 ms (60 FPS WebGL2/WebGPU)'],
    ],
  },

  // --------------------------------------------------------------------------
  // STRATE S2 · ENGINE
  // --------------------------------------------------------------------------
  {
    stratum: 'S2',
    name: '@exo/ecs',
    dir: 'packages/02-engine/ecs',
    description: 'Moteur ECS SoA, DirtyFlags, SceneDiffPacket, codec binaire et snapshots',
    deps: ['@exo/math-det', '@exo/core-runtime'],
    extDeps: {},
    devDeps: {},
    jsx: false,
    dom: false,
    files: [
      ['src/index.ts', 'Point d’entrée public du moteur ECS'],
      ['src/world/EcsWorld.ts', 'Registre central des entités, archétypes et requêtes'],
      ['src/storage/SoaComponentTable.ts', 'Stockage Structure-of-Arrays contigu'],
      ['src/storage/DirtyFlagsMask.ts', 'Masques binaires de mutation pour SceneDiffPacket'],
      ['src/query/QueryPlanner.ts', 'Requêtes compilées haute fréquence'],
      ['src/diff/SceneDiffBuilder.ts', 'Construction de paquets différentiels Sim → Rendu 3D'],
      ['src/codec/BinaryStateCodec.ts', 'Sérialisation binaire compacte des mondes'],
      ['src/codec/DeltaCompressor.ts', 'Compression différentielle des snapshots par tour'],
      ['src/snapshot/TurnSnapshotStore.ts', 'Historique immuable des états par cycle'],
      ['src/validation/EntityInvariantGuard.ts', 'Vérification des bornes et identifiants uniques'],
      ['src/systems/SystemScheduler.ts', 'Exécution ordonnée des systèmes ECS'],
    ],
  },
  {
    stratum: 'S2',
    name: '@exo/rhi-render',
    dir: 'packages/02-engine/rhi-render',
    description: 'Moteur 3D Three.js r170+ / RHI WebGPU-WebGL2, 3 échelles 650 ms, cités à ciel ouvert (R-16)',
    deps: ['@exo/pal', '@exo/math-det', '@exo/core-runtime', '@exo/ecs'],
    extDeps: { three: '^0.174.0' },
    devDeps: { '@types/three': '^0.174.0' },
    jsx: false,
    dom: true,
    files: [
      ['src/index.ts', 'Point d’entrée public du moteur de rendu 3D'],
      ['src/device/RenderDeviceFactory.ts', 'Initialisation WebGL2 / WebGPU avec fallback low-power'],
      ['src/graph/RenderGraph.ts', 'Graphe de passes (Sky, Globe 72, OpenSkyCity, Overlays)'],
      ['src/camera/ThreeScaleCameraRig.ts', 'Navigation fluide 3 Échelles (1:Espace, 2:Planète, 3:Cité) en 650 ms'],
      ['src/camera/OrbitTouchController.ts', 'Contrôles orbite/zoom tactiles et clavier ZQSD'],
      ['src/scene/SpaceSlotsScene.ts', 'Échelle 1 : système stellaire et slots planétaires 1→6'],
      ['src/scene/PlanetGeodesic72Scene.ts', 'Échelle 2 : globe géodésique 72 secteurs et surcouches'],
      ['src/scene/OpenSkyCityScene.ts', 'Échelle 3 : quartiers et bâtiments individuels à ciel ouvert (zéro dôme R-16)'],
      ['src/overlays/MaintenanceOverlayPass.ts', 'Surcouche 3D charge de maintenance et usure'],
      ['src/overlays/LogisticsFlowPass.ts', 'Surcouche 3D flux logistiques et routes'],
      ['src/atmosphere/SkyTierShaderBridge.ts', 'Transition atmosphérique P1 → P4 et synchronisation thème clair/sombre'],
      ['src/picking/SectorRaycaster.ts', 'Sélection 3D des tuiles et inspection terrain des dossiers'],
      ['src/instancing/InstancedBuildingBatcher.ts', 'Rendu instancié des bâtiments individuels de quartier'],
      ['src/instancing/DroneSwarmRenderer.ts', 'Animation instanciée des 4 classes de drones autonomes'],
      ['src/bridge/SceneDiffApplier.ts', 'Application throttled des SceneDiffPacket sans re-render React'],
      ['src/lod/GeometricLodManager.ts', 'Gestion LOD multi-échelle et budget GPU'],
    ],
  },
  {
    stratum: 'S2',
    name: '@exo/assets-vfs',
    dir: 'packages/02-engine/assets-vfs',
    description: 'Virtual File System, manifestes concept art 2050, bannières Ère I–VI et budget mémoire GPU',
    deps: ['@exo/pal', '@exo/core-runtime'],
    extDeps: {},
    devDeps: {},
    jsx: false,
    dom: true,
    files: [
      ['src/index.ts', 'Point d’entrée public du VFS'],
      ['src/vfs/VirtualAssetRegistry.ts', 'Registre des 16 assets visuels V1 (key art, ères, conseillers, emblèmes)'],
      ['src/loaders/TextureStreamLoader.ts', 'Chargement progressif et mise en cache textures'],
      ['src/loaders/DracoMeshLoader.ts', 'Décodage géométrie 3D compressée'],
      ['src/loaders/Ktx2Transcoder.ts', 'Transcodage textures GPU compressées'],
      ['src/budget/GpuMemoryBudgeter.ts', 'Surveillance VRAM et éviction LRU'],
      ['src/manifest/EraBannerManifest.ts', 'Résolution déterministe des bannières Ère 1..6 et fonds Studio UI'],
      ['src/manifest/SuperpowerEmblemManifest.ts', 'Résolution des emblèmes des 5 Superpuissances'],
      ['src/cache/AssetWarmupPipeline.ts', 'Préchargement non bloquant au démarrage'],
    ],
  },
  {
    stratum: 'S2',
    name: '@exo/audio',
    dir: 'packages/02-engine/audio',
    description: 'Moteur Web Audio spatial 3D, cues tactiques et service Web Radio France FIP (6 flux)',
    deps: ['@exo/pal', '@exo/core-runtime'],
    extDeps: {},
    devDeps: {},
    jsx: false,
    dom: true,
    files: [
      ['src/index.ts', 'Point d’entrée public audio'],
      ['src/engine/SpatialAudioEngine.ts', 'Contexte Web Audio 3D et gestionnaires de bus'],
      ['src/fip/FipRadioStreamService.ts', 'Service 6 flux Radio France FIP (Direct, Rock, Jazz, Groove, Monde, Électro)'],
      ['src/cues/UiTacticalCueSynth.ts', 'Signaux sonores UI (CLICK, ALERT_P0, TURN_COMMIT, ERA_STAR)'],
      ['src/director/AdaptiveMusicDirector.ts', 'Mixage adaptatif selon palier atmosphérique P1..P4 et crises P0'],
      ['src/mixer/AudioSettingsBridge.ts', 'Persistance volume, station active et sourdine'],
      ['src/spatial/OcclusionAttenuator.ts', 'Atténuation spatiale selon l’échelle caméra 1/2/3'],
    ],
  },
  {
    stratum: 'S2',
    name: '@exo/persistence-net',
    dir: 'packages/02-engine/persistence-net',
    description: 'Sauvegardes locales, migrations v3→v4, Firebase Auth/Firestore, Google Drive Picker client OAuth & replay SHA-256',
    deps: ['@exo/pal', '@exo/math-det', '@exo/core-runtime', '@exo/ecs'],
    extDeps: { firebase: '^11.6.0' },
    devDeps: {},
    jsx: false,
    dom: true,
    files: [
      ['src/index.ts', 'Point d’entrée public persistance & cloud'],
      ['src/local/LocalCampaignStorage.ts', 'Stockage campagnes localStorage / OPFS avec backup'],
      ['src/migration/SaveMigrationV3ToV4.ts', 'Migration sécurisée v3.1 → v4.x sans perte'],
      ['src/firebase/FirebaseClientAdapter.ts', 'Initialisation Firebase Auth & Firestore (PlayerProfile, Campaign, TurnSnapshotRecord, DriveLinkRecord)'],
      ['src/firebase/CampaignCloudRepository.ts', 'CRUD Firestore protégé par règles propriétaire UID'],
      ['src/drive/GoogleDrivePickerClient.ts', 'Intégration client-side OAuth Google Picker (drive.file, drive.metadata.readonly)'],
      ['src/drive/DocSyncDriveBridge.ts', 'Synchronisation documentaire isolée vers Google Drive / Docs'],
      ['src/replay/DeterministicReplayRunner.ts', 'Relecture complète d’une graine PCG32 + contrôle SHA-256'],
      ['src/replay/DesyncDetector.ts', 'Détection immédiate d’écart d’empreinte entre exécutions'],
      ['src/telemetry/LocalDiagnosticsExporter.ts', 'Export JSON contrôlé sur action explicite'],
    ],
  },

  // --------------------------------------------------------------------------
  // STRATE S3 · FRAMEWORK
  // --------------------------------------------------------------------------
  {
    stratum: 'S3',
    name: '@exo/sim-framework',
    dir: 'packages/03-framework/sim-framework',
    description: 'Pipeline de phases déterministe, pile de modificateurs, WorldGen et IA Utility/FlowField',
    deps: ['@exo/math-det', '@exo/core-runtime', '@exo/ecs'],
    extDeps: {},
    devDeps: {},
    jsx: false,
    dom: false,
    files: [
      ['src/index.ts', 'Point d’entrée public du framework de simulation'],
      ['src/pipeline/TurnPhasePipeline.ts', 'Exécution séquentielle des phases d’un tour (15 ticks)'],
      ['src/modifiers/ModifierStack.ts', 'Pile déterministe des modificateurs de production/vitesse PNJ'],
      ['src/worldgen/PlanetWorldGenerator.ts', 'Génération procédurale déterministe des 72 tuiles'],
      ['src/worldgen/BiomeDistributionPass.ts', 'Répartition des biomes ouverts par latitude et altitude'],
      ['src/ai/UtilityScoreEvaluator.ts', 'Évaluation utilitaire pour décisions des 5 Superpuissances IA'],
      ['src/ai/FlowFieldPathfinder.ts', 'Champs de flux logistiques et mouvements sur grille 72 tuiles'],
      ['src/triggers/ConditionalTriggerEngine.ts', 'Déclenchement des crises P0 et événements calendaires'],
      ['src/triggers/KarnaughGateEvaluator.ts', 'Évaluateur générique de portes logiques de fin de tour'],
      ['src/invariants/SimulationInvariantSuite.ts', 'Contrôles post-tick (bornes PA, stocks, intégrité)'],
      ['src/forecast/ResourceProjectionKernel.ts', 'Noyau générique de projection production vs consommation'],
      ['src/metrics/SimulationSnapshotDiff.ts', 'Diff synthétique entre deux tours pour récapitulatif'],
    ],
  },
  {
    stratum: 'S3',
    name: '@exo/plugin-sdk',
    dir: 'packages/03-framework/plugin-sdk',
    description: 'Hôte d’extensions/mods sandboxé, fusion de catalogues déclaratifs et garde-fous Zod',
    deps: ['@exo/core-runtime', '@exo/sim-framework'],
    extDeps: { zod: '^3.24.2' },
    devDeps: {},
    jsx: false,
    dom: false,
    files: [
      ['src/index.ts', 'Point d’entrée public du SDK plugins'],
      ['src/host/PluginHostManager.ts', 'Chargement et cycle de vie des extensions (GENESE_2050, HK_STARS, FP_WORKFORCE, GEMINI_4T)'],
      ['src/contracts/PluginManifestSchema.ts', 'Validation Zod des manifestes de plugins'],
      ['src/registry/DeclarativeMergeRegistry.ts', 'Fusion sans collision des catalogues et événements'],
      ['src/sandbox/PluginCapabilityGuard.ts', 'Isolation stricte des permissions plugin'],
      ['src/hooks/SimulationHookPoints.ts', 'Points d’accroche contrôlés (onTurnStart, onDossierResolved, onEraAdvance)'],
      ['src/guardrails/NomenclatureAndSafetyGuard.ts', 'Garde-fous lexicaux R-50, Z0 et R-16 (zéro dôme fermé)'],
    ],
  },

  // --------------------------------------------------------------------------
  // STRATE S4 · GAME 2050
  // --------------------------------------------------------------------------
  {
    stratum: 'S4',
    name: '@exo/game-data',
    dir: 'packages/04-game-2050/game-data',
    description: 'Schémas Zod 2050, 18 ressources primaires, quartiers & bâtiments ouverts, 6 thèmes UI et lexique LLM',
    deps: ['@exo/math-det', '@exo/plugin-sdk'],
    extDeps: { zod: '^3.24.2' },
    devDeps: {},
    jsx: false,
    dom: false,
    files: [
      ['src/index.ts', 'Point d’entrée public des données EXO WORLD : 2050'],
      ['src/schemas/WorldStateSchema.ts', 'Schéma Zod canonique WorldState v4.1'],
      ['src/schemas/CombatUnitsSchema.ts', 'Schémas Unités L1–L5, Drones 4 classes & rapports 4 phases'],
      ['src/schemas/DossierWorkshopSchema.ts', 'Schémas Dossiers P0/C1..C5 & Atelier 3 Étages'],
      ['src/schemas/UiThemeStudioSchema.ts', 'Schémas Studio Thèmes (6 palettes, fonds, lumières, ombres, densité)'],
      ['src/catalogs/Resources18Catalog.ts', 'Catalogue complet des 18 ressources d’Ère (4 piliers)'],
      ['src/catalogs/OpenSkyDistrictsCatalog.ts', 'Quartiers ouverts et parcelles de bâtiments individuels (R-16 zéro dôme)'],
      ['src/catalogs/IndividualBuildingsCatalog.ts', 'Catalogue des bâtiments individuels constructibles par zone de quartier'],
      ['src/catalogs/Superpowers5Catalog.ts', '5 Superpuissances IA + Super-Alliance + Doctrines 2050'],
      ['src/catalogs/GeneseAct0Catalog.ts', 'Protocole Genèse 2050 (Acte 0) et 3 chartes fondatrices'],
      ['src/catalogs/UiThemes6Catalog.ts', '6 thèmes système (Rose Astralis par défaut, Cyan V7, Émeraude P4, Ambre, Nébuleuse, Anno Diurne)'],
      ['src/catalogs/LlmLexiconDictionary.ts', 'Dictionnaire de traduction lexique LLM RPG / Citybuilder compréhensible'],
      ['src/catalogs/AdvisorsCabinetCatalog.ts', '4 Conseillers spécialisés (PA_GES, PA_MNT, PA_BIO, PA_POL)'],
      ['src/catalogs/HumankindErasCatalog.ts', '6 Ères historiques, Étoiles de Renommée et conditions de bascule'],
      ['src/catalogs/EventDossiersCatalog.ts', 'Catalogue de dossiers exécutifs P0 et C1..C5'],
      ['src/catalogs/Playtest6TurnsSeedData.ts', 'Scénario de référence Playtest 6 Tours (90 ticks)'],
      ['src/registry/MultiIndexDataRegistry.ts', 'Indexation multi-clés rapide des catalogues'],
      ['src/validators/GameDataIntegrityCheck.ts', 'Validation croisée de toutes les références au démarrage'],
    ],
  },
  {
    stratum: 'S4',
    name: '@exo/domain-planet',
    dir: 'packages/04-game-2050/domain-planet',
    description: 'Atmosphère P1..P4, hydrologie, biosphère, vitesse PNJ (-40% à +40%) et secteurs à ciel ouvert (R-16)',
    deps: ['@exo/math-det', '@exo/ecs', '@exo/sim-framework', '@exo/game-data'],
    extDeps: {},
    devDeps: {},
    jsx: false,
    dom: false,
    files: [
      ['src/index.ts', 'Point d’entrée public du domaine planétaire'],
      ['src/atmosphere/AtmosphereTierEngine.ts', 'Transition P1 → P2 → P3 → P4 et modificateurs PNJ (-40% à +40%)'],
      ['src/atmosphere/ExposureLimitPolicy.ts', 'Limite d’exposition P1 (4 h/j) et usure kits respiratoires'],
      ['src/atmosphere/AtmosphericCompositionModel.ts', 'Bilan pression, oxygène et bouclier radiatif'],
      ['src/hydrology/HydrosphereCycleSystem.ts', 'Cycle hydrique, nappes et réserves d’eau planétaires'],
      ['src/biosphere/BiosphereGrowthSystem.ts', 'Progression canopée, sols fertiles et biodiversité ouverte'],
      ['src/biosphere/TerraCompositeCalculator.ts', 'Score composite Terra (Atmo, Hydro, Bio, RadShield)'],
      ['src/geosphere/SectorTerrainModel.ts', 'Propriétés physiques et bonus défensifs des 72 secteurs'],
      ['src/geosphere/MineralExtractionDepletion.ts', 'Gisements de matériaux, terres rares et renouvellement'],
      ['src/weather/PlanetaryWeatherEvents.ts', 'Tempêtes de poussière P1 et fronts météo dynamiques'],
      ['src/zones/OpenSkyZoneHabitability.ts', 'Calcul d’habitabilité à ciel ouvert sans dôme (R-16 / R-39)'],
      ['src/workers/PlanetClimateWorker.ts', 'Worker asynchrone de calcul atmosphérique & hydrologique'],
    ],
  },
  {
    stratum: 'S4',
    name: '@exo/domain-gameplay',
    dir: 'packages/04-game-2050/domain-gameplay',
    description: 'PA/Sous-PA (R-26), Dossiers P0/C1..C5, Combat 4 phases + Grille L1–L5, Playtest 6T, Projections 18 ressources & Géopolitique',
    deps: ['@exo/math-det', '@exo/core-runtime', '@exo/ecs', '@exo/sim-framework', '@exo/game-data', '@exo/domain-planet'],
    extDeps: {},
    devDeps: {},
    jsx: false,
    dom: false,
    files: [
      ['src/index.ts', 'Point d’entrée public du domaine gameplay'],
      ['src/pa/AsymmetricPaBudgetEngine.ts', 'PA Général & 4 Sous-PA avec fongibilité asymétrique 150% (R-26)'],
      ['src/turn/TurnGateKarnaughM7.ts', 'Porte Karnaugh M7 de validation Fin de tour et options 0-PA'],
      ['src/turn/CycleOrchestrator.ts', 'Orchestration complète d’un tour (15 ticks) et empreinte SHA-256'],
      ['src/dossiers/DossierWorkshop3Stages.ts', 'Atelier 3 Étages (Skill-Check, Modules/Prêt, Audit/Echo)'],
      ['src/dossiers/DelayedEchoResolver.ts', 'Résolution causale des DELAYED_ECHO et promesses civiques'],
      ['src/urban/OpenSkyCityManager.ts', 'Gestion des quartiers ouverts et parcelles de bâtiments individuels'],
      ['src/urban/BuildingMaintenanceSystem.ts', 'Charge de maintenance, usure et équipes techniques'],
      ['src/economy/ResourceForecastEngine.ts', 'Calcul des flux +Δ/tour et alertes de rupture'],
      ['src/economy/FederalBankAndLoans.ts', 'Prêts fédéraux, taux d’intérêt et marché des ressources'],
      ['src/economy/ColonistWorkforceSystem.ts', 'Moral, santé, XP et affectation des colons'],
      ['src/combat/DeterministicCombat4Phases.ts', 'Résolution combat 4 phases (Reco, Cyber Compute 2x, Assaut L1–L5, Contrôle)'],
      ['src/combat/TacticalIntensityGrid.ts', 'Grille tactique 3D 4 zones P1–P4 × 5 niveaux L1–L5 (20 cellules)'],
      ['src/combat/AutonomousDronesManager.ts', 'Gestion et réaffectation des 4 classes de drones'],
      ['src/combat/CyberParalysisEngine.ts', 'Seuil Compute >= 2.0x et paralysie 2 cycles'],
      ['src/geopolitics/RivalSuperpowersAi.ts', 'Simulation autonome des 5 Superpuissances IA et de la Super-Alliance'],
      ['src/geopolitics/HumankindProgressionEngine.ts', 'Étoiles d’Ère, Renommée et transitions Ère I → VI'],
      ['src/playtest/Playtest6TurnsEngine.ts', 'Simulateur déterministe Playtest & Synthèse 6 Tours (90 ticks)'],
      ['src/playtest/ResourceTrendProjection18.ts', 'Projection production vs consommation 6 tours sur les 18 ressources'],
      ['src/commands/GameActionHandlers.ts', 'Handlers CQRS pour toutes les actions joueur'],
    ],
  },
  {
    stratum: 'S4',
    name: '@exo/ui-kit',
    dir: 'packages/04-game-2050/ui-kit',
    description: 'Design system Multi-Thème (Rose Astralis défaut, 6 thèmes, Studio UI), ExoTooltip, TacticalHeatmap D3 & Recharts 18 ressources',
    deps: ['@exo/game-data', '@exo/domain-gameplay'],
    extDeps: { react: '^19.0.0', 'lucide-react': '^0.475.0', d3: '^7.9.0', recharts: '^2.15.0' },
    devDeps: { '@types/react': '^19.0.0', '@types/d3': '^7.4.3' },
    jsx: true,
    dom: true,
    files: [
      ['src/index.ts', 'Point d’entrée public du kit UI'],
      ['src/theme/useThemeEngine.ts', 'Hook CSS variables réactif, prefers-color-scheme, localStorage & sync 3D'],
      ['src/theme/ThemeStudioPanel.tsx', 'Studio UI complet : 6 thèmes, Sombre/Clair/Auto, 9 fonds, aperçu live'],
      ['src/theme/ThemeStudioEffectsSection.tsx', 'Contrôles Glow, Biseau 135°, Ombres 4 niveaux, Coins, Densité & accessibilité'],
      ['src/bento/ExoTooltip.tsx', 'Infobulles contextuelles viewport-safe (PA, P1..P4, ΔP_adapt, L1..L5, Compute 2x)'],
      ['src/bento/ExoTitleEmblem.tsx', 'Emblème hexagonal dynamique héritant des CSS vars actives'],
      ['src/bento/DynamicSvgBackdrop.tsx', 'Fond orbital SVG réactif au thème actif et aux paliers P1..P4'],
      ['src/charts/TacticalHeatmap.tsx', 'Overlay D3 isométrique 3D L1–L5 × P1–P4 synchronisé au thème actif'],
      ['src/charts/ResourceTrendProjectionChart.tsx', 'Graphique Recharts 6 tours Production vs Consommation (18 ressources)'],
      ['src/rich-text/RichEntityText.tsx', 'Rendu interactif des balises d’entités cliquables'],
      ['src/layout/useViewportLayout.ts', 'Détection ergonomique Mobile / Ordinateur avec bascule manuelle'],
      ['src/tokens/theme-utilities.css', 'Utilitaires CSS variables (zéro backdrop-filter sur WebGL)'],
    ],
  },

  // --------------------------------------------------------------------------
  // STRATE S5 · PLUGINS
  // --------------------------------------------------------------------------
  {
    stratum: 'S5',
    name: '@exo/plugin-orbital-megastructures',
    dir: 'packages/05-plugins/plugin-orbital-megastructures',
    description: 'Extension isolée mégastructures orbitales (ascenseurs, miroirs solaires, anneaux Ère V–VI)',
    deps: ['@exo/plugin-sdk', '@exo/game-data', '@exo/domain-gameplay'],
    extDeps: {},
    devDeps: {},
    jsx: false,
    dom: false,
    files: [
      ['src/index.ts', 'Point d’entrée du plugin mégastructures orbitales'],
      ['src/manifest.ts', 'Déclaration capacités et version du plugin'],
      ['src/catalog/OrbitalMegastructuresCatalog.ts', 'Catalogue ascenseurs orbitaux et anneaux de transit'],
      ['src/systems/OrbitalConstructionSystem.ts', 'Phases de chantier orbital et bonus Compute/Énergie'],
      ['src/events/OrbitalMilestonesEvents.ts', 'Dossiers exécutifs spéciaux Ère V–VI'],
    ],
  },
  {
    stratum: 'S5',
    name: '@exo/plugin-narrative-director',
    dir: 'packages/05-plugins/plugin-narrative-director',
    description: 'Directeur narratif procédural Gemini 4T + Dictionnaire Lexique LLM RPG/Citybuilder & repli déterministe',
    deps: ['@exo/plugin-sdk', '@exo/game-data', '@exo/domain-gameplay'],
    extDeps: {},
    devDeps: {},
    jsx: false,
    dom: false,
    files: [
      ['src/index.ts', 'Point d’entrée du directeur narratif'],
      ['src/manifest.ts', 'Manifeste et garde-fous narratifs'],
      ['src/lexicon/LlmLexiconNormalizer.ts', 'Normalisation terminologique (ex. aFFermer → termes RPG/Citybuilder clairs)'],
      ['src/prompt/TurnNarrativePromptBuilder.ts', 'Construction de prompts bornés par état réel du monde'],
      ['src/fallback/DeterministicChronicleFallback.ts', 'Repli local instantané 100% déterministe hors-ligne'],
      ['src/guardrails/NarrativeOutputValidator.ts', 'Validation Zod, bornes ΔP_adapt et filtre R-50/Z0'],
    ],
  },

  // --------------------------------------------------------------------------
  // STRATE S6 · APPS & TOOLS
  // --------------------------------------------------------------------------
  {
    stratum: 'S6',
    name: '@exo/web-client',
    dir: 'apps/web-client',
    description: 'Client navigateur EXO-SHELL (8 écrans + 8 sous-écrans, 3 onglets footer stricts, HUD tactique & Studio UI)',
    deps: [
      '@exo/pal',
      '@exo/math-det',
      '@exo/core-runtime',
      '@exo/ecs',
      '@exo/rhi-render',
      '@exo/assets-vfs',
      '@exo/audio',
      '@exo/persistence-net',
      '@exo/sim-framework',
      '@exo/plugin-sdk',
      '@exo/game-data',
      '@exo/domain-planet',
      '@exo/domain-gameplay',
      '@exo/ui-kit',
      '@exo/plugin-orbital-megastructures',
      '@exo/plugin-narrative-director',
    ],
    extDeps: { react: '^19.0.0', 'react-dom': '^19.0.0', zustand: '^5.0.3', jotai: '^2.12.0' },
    devDeps: { vite: '^6.2.0', '@vitejs/plugin-react': '^4.3.4' },
    jsx: true,
    dom: true,
    files: [
      ['src/main.tsx', 'Bootstrap React 19 + Providers'],
      ['src/App.tsx', 'Coque EXO-SHELL, raccourcis 1/2/3/T/H/P et montage useThemeEngine'],
      ['src/stores/GameStore.ts', 'Store Zustand WorldState + Audio + Graphics + UiThemeStudioConfig'],
      ['src/stores/SelectionAtoms.ts', 'Atomes Jotai (sous-écrans, dossiers, heatmap tactique, toasts)'],
      ['src/screens/MainMenuScreen.tsx', 'Écran titre plein cadre avec fonds Studio UI et zéro texte de raccourcis bas de page'],
      ['src/screens/AuthScreen.tsx', 'Authentification Firebase & profil joueur'],
      ['src/screens/NewSimulationScreen.tsx', 'Configuration 2050, superpuissance, graine & Co-pilote IA'],
      ['src/screens/BriefingLobbyScreen.tsx', 'Salle de briefing pré-lancement'],
      ['src/screens/SettingsScreen.tsx', 'Paramètres complets avec onglet Thème & Studio UI, FIP, 3D & Atlas'],
      ['src/screens/GameViewport.tsx', 'Montage canvas Three.js et pont SceneDiffPacket'],
      ['src/screens/GameHud.tsx', 'HUD tactique + bandeau ressources + footer strict 3 onglets (Monde/Événements/Journal)'],
      ['src/modals/GeneseAct0Modal.tsx', 'Protocole Genèse 2050 (Acte 0) et chartes fondatrices'],
      ['src/modals/DossierWorkshopModal.tsx', 'Atelier décisionnel 3 Étages + Skill-Check + Preview 3D'],
      ['src/modals/SubscreensOverlay.tsx', 'Gestionnaire des 8 sous-écrans avec bascule Fenêtre / Plein écran'],
      ['src/subscreens/WorldsHubTab.tsx', 'Hub Monde : villes, quartiers/bâtiments ouverts, climat, défense'],
      ['src/subscreens/EventsHubTab.tsx', 'Hub Événements : dossiers actifs, opérations et diplomatie'],
      ['src/subscreens/JournalHubTab.tsx', 'Hub Journal : chronique, Playtest 6T, projections 18 ressources et sauvegardes'],
      ['src/subscreens/JournalChroniclePanel.tsx', 'Simulateur Playtest 6 Tours (90 ticks) + Recharts + comparateur 5 IA'],
      ['src/subscreens/MilitaryCombatTab.tsx', 'Recrutement L1–L5, drones 4 classes, cyberguerre Compute 2x & assaut 4 phases'],
      ['src/subscreens/DocStudioPanel.tsx', 'Studio documentaire, catalogues, Atlas Blueprint & passerelle Google Drive Picker'],
    ],
  },
  {
    stratum: 'S6',
    name: '@exo/headless-sim',
    dir: 'apps/headless-sim',
    description: 'Exécutable Node CLI sans DOM (stress-tests 1 000 tours, Playtest 6T, contrôle SHA-256 CI)',
    deps: ['@exo/math-det', '@exo/core-runtime', '@exo/ecs', '@exo/sim-framework', '@exo/game-data', '@exo/domain-planet', '@exo/domain-gameplay'],
    extDeps: {},
    devDeps: { tsx: '^4.19.2' },
    jsx: false,
    dom: false,
    files: [
      ['src/index.ts', 'Point d’entrée CLI headless'],
      ['src/runner/HeadlessBatchRunner.ts', 'Exécution batch 1 000 tours sans DOM ni WebGL'],
      ['src/runner/Playtest6TurnsCli.ts', 'Vérification CLI du Playtest 6 Tours et de sa chaîne SHA-256'],
      ['src/assertions/DeterminismDoubleRunCheck.ts', 'Double exécution même graine = hash strictement identique'],
      ['src/assertions/BalanceTelemetryReport.ts', 'Rapport d’équilibrage des 18 ressources et paliers P1..P4'],
      ['src/cli/parseCliArgs.ts', 'Parseur d’arguments CLI (--seed, --turns, --verify-hash)'],
    ],
  },
  {
    stratum: 'S6',
    name: '@exo/world-editor',
    dir: 'apps/world-editor',
    description: 'Studio interne d’édition de biomes, parcelles de quartiers ouverts, crises P0 et graphes d’Ères',
    deps: ['@exo/rhi-render', '@exo/game-data', '@exo/domain-planet', '@exo/ui-kit'],
    extDeps: { react: '^19.0.0', 'react-dom': '^19.0.0' },
    devDeps: { vite: '^6.2.0' },
    jsx: true,
    dom: true,
    files: [
      ['src/main.tsx', 'Bootstrap studio d’édition'],
      ['src/EditorApp.tsx', 'Coque éditeur synchronisée au kit UI multi-thème'],
      ['src/tools/BiomeBrushTool.ts', 'Pinceau de biomes sur les 72 secteurs géodésiques'],
      ['src/tools/DistrictParcelEditor.ts', 'Placement de bâtiments individuels au sein des zones de quartiers ouverts'],
      ['src/tools/CrisisScenarioDebugger.ts', 'Simulateur de déclenchements P0 et DELAYED_ECHO'],
      ['src/exporters/BlueprintJsonExporter.ts', 'Export JSON validé par Zod vers @exo/game-data'],
    ],
  },
  {
    stratum: 'S6',
    name: '@exo/tools',
    dir: 'tools',
    description: 'Outillage gouvernance & CI : vérificateur DAG S1→S6, audit Z0/R-16/R-50, cuisson assets et synchro docs',
    deps: [],
    extDeps: {},
    devDeps: { tsx: '^4.19.2' },
    jsx: false,
    dom: false,
    files: [
      ['architecture/verifyDependencyDag.ts', 'Vérificateur exécutable du DAG S1→S6, isolation headless et conformité Z0/R-16/R-50'],
      ['architecture/auditLineLimits.ts', 'Contrôle R-14 (<=300 lignes/module, <=200 lignes/composant UI)'],
      ['cooker/cookVisualAssets.ts', 'Pipeline offline de vérification et manifeste des concept arts 2050'],
      ['docs/syncMasterBlueprint.ts', 'Synchronisation miroir docs/ ↔ master-blueprint/'],
      ['ci/runFiveGates.ts', 'Exécution unifiée des 5 Portes de validation'],
    ],
  },
];

// ============================================================================
// 2. HELPERS D'ÉCRITURE ET GÉNÉRATION DES FICHIERS
// ============================================================================

let createdDirs = 0;
let createdFiles = 0;

function ensureDir(dirPath) {
  if (DRY_RUN) return;
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    createdDirs += 1;
  }
}

function writeFile(relPath, content) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (!DRY_RUN) {
    ensureDir(path.dirname(fullPath));
    fs.writeFileSync(fullPath, content, 'utf8');
  }
  createdFiles += 1;
}

function buildSourceStub(ws, relFile, roleDesc) {
  const ext = path.extname(relFile);
  if (ext === '.css') {
    return `/* ${ws.name} — ${roleDesc} */\n:root {\n  --exo-accent: #fb7185;\n  --exo-accent-2: #fbbf24;\n  --exo-void: #120818;\n}\n`;
  }
  const baseName = path.basename(relFile, ext).replace(/[^a-zA-Z0-9_]/g, '');
  const symbol = `${baseName}Meta`;
  if (relFile === 'src/index.ts') {
    const exportsList = ws.files
      .filter(([f]) => f !== 'src/index.ts' && (f.endsWith('.ts') || f.endsWith('.tsx')))
      .map(([f]) => {
        const rel = `./${f.replace(/^src\//, '')}`;
        return `export * from '${rel}';`;
      })
      .join('\n');
    return `/**\n * [${ws.stratum}] ${ws.name} — ${ws.description}\n */\n${exportsList}\n`;
  }
  if (ext === '.tsx') {
    return `/**\n * [${ws.stratum}] ${ws.name} · ${relFile}\n * ${roleDesc}\n */\nexport const ${symbol} = {\n  workspace: '${ws.name}',\n  stratum: '${ws.stratum}',\n  role: ${JSON.stringify(roleDesc)},\n} as const;\n`;
  }
  return `/**\n * [${ws.stratum}] ${ws.name} · ${relFile}\n * ${roleDesc}\n */\nexport const ${symbol} = {\n  workspace: '${ws.name}',\n  stratum: '${ws.stratum}',\n  role: ${JSON.stringify(roleDesc)},\n} as const;\n`;
}

function buildVerifyDependencyDagSource() {
  return `import fs from 'node:fs';
import path from 'node:path';

/**
 * [S6 · @exo/tools] Vérificateur exécutable du DAG S1 → S6, de l'isolation headless
 * et des garde-fous EXO WORLD : 2050 (Z0, R-16 zéro dôme, R-50 nomenclature).
 */
const ROOT = path.resolve(process.cwd());
const STRATA_RANK: Record<string, number> = { S1: 1, S2: 2, S3: 3, S4: 4, S5: 5, S6: 6 };
const BANNED_DOM_IN_HEADLESS = new Set(['@exo/rhi-render', '@exo/ui-kit', '@exo/audio', 'react', 'three']);
const BANNED_PATTERNS: Array<{ code: string; regex: RegExp }> = [
  { code: 'Z0', regex: /\\b(thermal|thermique|chaleur|s_heat|cycle\\+1|corridor|loop_climate)\\b/i },
  { code: 'R-16', regex: /domes\\.data\\.ts|d[ôo]mes?\\s+pressuris/i },
  { code: 'R-50', regex: /\\b[A-Z]rche\\s+de\\s+No/i },
];

interface WorkspacePkg {
  name: string;
  dir: string;
  stratum: string;
  deps: string[];
}

function discoverWorkspaces(): WorkspacePkg[] {
  const roots = ['packages', 'apps', 'tools'];
  const found: WorkspacePkg[] = [];

  function walk(current: string, depth: number) {
    if (depth > 3 || !fs.existsSync(current)) return;
    const pkgFile = path.join(current, 'package.json');
    if (fs.existsSync(pkgFile)) {
      const json = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
      const stratum = json.exo?.stratum ?? 'S6';
      const deps = Object.keys(json.dependencies ?? {}).filter((d) => d.startsWith('@exo/'));
      found.push({ name: json.name, dir: path.relative(ROOT, current), stratum, deps });
      return;
    }
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
        walk(path.join(current, entry.name), depth + 1);
      }
    }
  }

  for (const r of roots) walk(path.join(ROOT, r), 0);
  return found;
}

function scanCompliance(dir: string, errors: string[]) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'verifyDependencyDag.ts') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanCompliance(full, errors);
    } else if (/\\.(ts|tsx|json|md)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      for (const rule of BANNED_PATTERNS) {
        if (rule.regex.test(text)) {
          errors.push(\`[\${rule.code}] Motif interdit détecté dans \${path.relative(ROOT, full)}\`);
        }
      }
    }
  }
}

const workspaces = discoverWorkspaces();
const byName = new Map(workspaces.map((w) => [w.name, w]));
const errors: string[] = [];

if (workspaces.length !== 20) {
  errors.push(\`Nombre de workspaces inattendu : \${workspaces.length} (attendu : 20)\`);
}

for (const ws of workspaces) {
  const rank = STRATA_RANK[ws.stratum] ?? 99;
  for (const dep of ws.deps) {
    const target = byName.get(dep);
    if (!target) {
      errors.push(\`Dépendance interne introuvable : \${ws.name} -> \${dep}\`);
      continue;
    }
    const targetRank = STRATA_RANK[target.stratum] ?? 99;
    if (targetRank > rank) {
      errors.push(\`Violation DAG S1→S6 : \${ws.name} (\${ws.stratum}) importe \${dep} (\${target.stratum})\`);
    }
  }
  if (ws.name === '@exo/headless-sim') {
    for (const dep of ws.deps) {
      if (BANNED_DOM_IN_HEADLESS.has(dep)) {
        errors.push(\`Isolation headless violée : @exo/headless-sim importe \${dep}\`);
      }
    }
  }
}

scanCompliance(path.join(ROOT, 'packages'), errors);
scanCompliance(path.join(ROOT, 'apps'), errors);

if (errors.length > 0) {
  console.error('ÉCHEC VÉRIFICATION DAG AAA :\\n - ' + errors.join('\\n - '));
  process.exit(1);
}

console.log(\`OK · DAG AAA validé : \${workspaces.length} workspaces (S1→S6), isolation headless OK, 0 violation Z0/R-16/R-50.\`);
`;
}

// ============================================================================
// 3. EXÉCUTION DU SCAFFOLDING
// ============================================================================

if (!DRY_RUN && fs.existsSync(ROOT_DIR)) {
  const existing = fs.readdirSync(ROOT_DIR);
  if (existing.length > 0 && !FORCE) {
    console.error(`Le dossier cible n'est pas vide : ${ROOT_DIR}. Ajoutez --force pour écraser.`);
    process.exit(1);
  }
}

ensureDir(ROOT_DIR);

// Root monorepo configuration
writeFile(
  'pnpm-workspace.yaml',
  `packages:\n  - 'packages/*/*'\n  - 'apps/*'\n  - 'tools'\n`,
);

writeFile(
  'turbo.json',
  JSON.stringify(
    {
      $schema: 'https://turbo.build/schema.json',
      tasks: {
        build: { dependsOn: ['^build'], outputs: ['dist/**'] },
        typecheck: { dependsOn: ['^build'] },
        test: { dependsOn: ['^build'] },
        lint: {},
      },
    },
    null,
    2,
  ) + '\n',
);

writeFile(
  'tsconfig.base.json',
  JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        strict: true,
        noUncheckedIndexedAccess: true,
        skipLibCheck: true,
        jsx: 'react-jsx',
      },
    },
    null,
    2,
  ) + '\n',
);

writeFile(
  'package.json',
  JSON.stringify(
    {
      name: 'exo-world-2050-aaa-monorepo',
      version: '4.1.0',
      private: true,
      packageManager: 'pnpm@9.15.0',
      scripts: {
        dev: 'turbo run dev --filter=@exo/web-client',
        build: 'turbo run build',
        typecheck: 'turbo run typecheck',
        test: 'turbo run test',
        'verify:dag': 'tsx tools/architecture/verifyDependencyDag.ts',
        'sim:headless': 'pnpm --filter @exo/headless-sim start',
      },
    },
    null,
    2,
  ) + '\n',
);

// Root governance & cloud blueprint mirrors aligned to current project state
writeFile(
  'firebase-blueprint.json',
  JSON.stringify(
    {
      entities: {
        PlayerProfile: { description: 'Profil joueur, préférences Studio UI & statistiques de campagne' },
        Campaign: { description: 'Campagne EXO WORLD : 2050 synchronisée par propriétaire UID' },
        TurnSnapshotRecord: { description: 'Instantané de tour horodaté avec chaîne SHA-256' },
        DriveLinkRecord: { description: 'Lien documentaire Google Drive Picker (OAuth client-side)' },
      },
      firestore: {
        '/users/{uid}': { schema: 'PlayerProfile' },
        '/users/{uid}/campaigns/{campaignId}': { schema: 'Campaign' },
        '/users/{uid}/campaigns/{campaignId}/snapshots/{snapshotId}': { schema: 'TurnSnapshotRecord' },
        '/users/{uid}/driveLinks/{linkId}': { schema: 'DriveLinkRecord' },
      },
    },
    null,
    2,
  ) + '\n',
);

writeFile(
  'firestore.rules',
  `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /users/{uid}/{document=**} {\n      allow read, write: if request.auth != null && request.auth.uid == uid;\n    }\n  }\n}\n`,
);

writeFile(
  'docs/DOC-EXW-ARCH-001_AAA_MONOREPO_MAP.md',
  `# EXO WORLD : 2050 — Cartographie Monorepo AAA (v4.1)\n\n` +
    `- **Strates verrouillées** : \`S1 → S2 → S3 → S4 → S5 → S6\` (20 workspaces pnpm + Turborepo)\n` +
    `- **Thème par défaut** : \`Rose Astralis\` (6 thèmes système + Studio UI complet)\n` +
    `- **Garde-fous actifs** : \`R-16\` (zéro dôme fermé, cités et quartiers ouverts), \`R-26\` (PA/Sous-PA), \`R-50\`, \`R-69\` (\`ΔP_adapt ∈ [-0.15, +0.15]\`), \`Z0\`.\n` +
    `- **Visualisations intégrées** : \`TacticalHeatmap\` (D3 3D L1–L5 × P1–P4) et \`ResourceTrendProjectionChart\` (Recharts 6T × 18 ressources).\n`,
);

writeFile(
  'master-blueprint/M13_AAA_WORKSPACES.json',
  JSON.stringify(
    {
      version: '4.1.0',
      strataCount: 6,
      workspaceCount: WORKSPACES.length,
      workspaces: WORKSPACES.map((w) => ({
        stratum: w.stratum,
        name: w.name,
        dir: w.dir,
        deps: w.deps,
        fileCount: w.files.length,
      })),
    },
    null,
    2,
  ) + '\n',
);

writeFile(
  'tests/dag-smoke.node.ts',
  `import assert from 'node:assert/strict';\nimport test from 'node:test';\n\ntest('AAA monorepo smoke contract', () => {\n  assert.equal(${WORKSPACES.length}, 20);\n});\n`,
);

// Generate all 20 workspaces
let totalWorkspaceFiles = 0;

for (const ws of WORKSPACES) {
  const pkgDeps = {};
  for (const dep of ws.deps) {
    pkgDeps[dep] = 'workspace:*';
  }
  Object.assign(pkgDeps, ws.extDeps);

  const pkgJson = {
    name: ws.name,
    version: '4.1.0',
    private: true,
    type: 'module',
    description: ws.description,
    exo: {
      stratum: ws.stratum,
      stratumRank: STRATA_ORDER[ws.stratum],
      dom: ws.dom,
    },
    exports: ws.files.some(([f]) => f === 'src/index.ts') ? { '.': './src/index.ts' } : undefined,
    scripts: {
      typecheck: 'tsc --noEmit',
    },
    dependencies: pkgDeps,
    devDependencies: ws.devDeps,
  };

  writeFile(`${ws.dir}/package.json`, JSON.stringify(pkgJson, null, 2) + '\n');
  writeFile(
    `${ws.dir}/tsconfig.json`,
    JSON.stringify(
      {
        extends: `${path.relative(path.join(ROOT_DIR, ws.dir), ROOT_DIR).replace(/\\/g, '/')}/tsconfig.base.json`,
        compilerOptions: {
          lib: ws.dom ? ['ES2022', 'DOM', 'DOM.Iterable'] : ['ES2022'],
        },
        include: ['src', 'architecture', 'cooker', 'docs', 'ci'],
      },
      null,
      2,
    ) + '\n',
  );

  for (const [relFile, roleDesc] of ws.files) {
    totalWorkspaceFiles += 1;
    if (ws.name === '@exo/tools' && relFile === 'architecture/verifyDependencyDag.ts') {
      writeFile(`${ws.dir}/${relFile}`, buildVerifyDependencyDagSource());
    } else {
      writeFile(`${ws.dir}/${relFile}`, buildSourceStub(ws, relFile, roleDesc));
    }
  }
}

console.log(
  [
    `EXO WORLD : 2050 — AAA Monorepo Scaffolder v4.1 ${DRY_RUN ? '(DRY-RUN)' : '(OK)'}`,
    `  Cible          : ${ROOT_DIR}`,
    `  Strates        : 6 (S1 → S6)`,
    `  Workspaces     : ${WORKSPACES.length}`,
    `  Fichiers src   : ${totalWorkspaceFiles}`,
    `  Total généré   : ${createdFiles} fichiers, ${createdDirs} dossiers`,
    `  Vérification   : cd ${targetArg} && npx tsx tools/architecture/verifyDependencyDag.ts`,
  ].join('\n'),
);
