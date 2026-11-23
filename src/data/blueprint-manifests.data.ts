import type { M0Manifest, M13Manifest } from '../services/architecture/matrix-engine.ts';

/**
 * [L1] Auto-synchronized by `npm run exo:sync-bp` from master-blueprint/*.json.
 */
export const M0_MANIFEST: M0Manifest = {
  "rootId": "EXOW-ROOT",
  "rootSemver": "5.1.0-alpha.1",
  "specStandard": "DOC-EXW-ARCH-001 v3.4.0-AAA",
  "updatedAt": "2026-11-23",
  "releaseGatePolicy": "STRICT_ZERO_ERROR",
  "nodes": [
    {
      "id": "EXW.L0.CONTRACTS",
      "name": "Contrats SSOT, Zod & Gardes Z0",
      "layer": "L0",
      "sadtBox": "A1.0",
      "semver": "5.1.0-alpha.1",
      "triLock": [
        1,
        1,
        1
      ],
      "status": "ACTIVE",
      "isoRefs": [
        "42010",
        "25012"
      ],
      "matrices": [
        "M0",
        "M2",
        "M3",
        "M13-D"
      ],
      "deps": []
    },
    {
      "id": "EXW.L1.CONFIG_DATA",
      "name": "Constantes 5 Divisions Atmo, Catalogues 2050 & Art Manifest",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "triLock": [
        1,
        1,
        1
      ],
      "status": "ACTIVE",
      "isoRefs": [
        "25012",
        "12207"
      ],
      "matrices": [
        "M4",
        "M5",
        "M6",
        "M11"
      ],
      "deps": [
        "EXW.L0.CONTRACTS"
      ]
    },
    {
      "id": "EXW.L2.CORE",
      "name": "Noyau Pur PCG32 6-Flux, Hash SHA-256 & Boucle Tour",
      "layer": "L2",
      "sadtBox": "A1.2",
      "semver": "5.1.0-alpha.1",
      "triLock": [
        1,
        1,
        1
      ],
      "status": "ACTIVE",
      "isoRefs": [
        "25010",
        "61508"
      ],
      "matrices": [
        "M1",
        "M2",
        "M3",
        "M7"
      ],
      "deps": [
        "EXW.L0.CONTRACTS",
        "EXW.L1.CONFIG_DATA"
      ]
    },
    {
      "id": "EXW.L3.SYSTEMS",
      "name": "Systèmes Métier HK, FP RPG, Terra P1-P4/5-Div, Ledger, Gouvernance & P13",
      "layer": "L3",
      "sadtBox": "A2.1",
      "semver": "5.1.0-alpha.1",
      "triLock": [
        1,
        1,
        1
      ],
      "status": "ACTIVE",
      "isoRefs": [
        "25010",
        "25012"
      ],
      "matrices": [
        "M2",
        "M4",
        "M5",
        "M6",
        "M8",
        "M11"
      ],
      "deps": [
        "EXW.L0.CONTRACTS",
        "EXW.L1.CONFIG_DATA",
        "EXW.L2.CORE"
      ]
    },
    {
      "id": "EXW.L4.ENGINE3D",
      "name": "Adapteur Three.js 0.187.0 PBR/Rayleigh-Mie + Inspecteur 135° + Unity 6",
      "layer": "L4",
      "sadtBox": "A5.3",
      "semver": "5.1.0-alpha.1",
      "triLock": [
        1,
        1,
        1
      ],
      "status": "ACTIVE",
      "isoRefs": [
        "25010",
        "9241-210"
      ],
      "matrices": [
        "M10"
      ],
      "deps": [
        "EXW.L0.CONTRACTS",
        "EXW.L1.CONFIG_DATA"
      ]
    },
    {
      "id": "EXW.L5.SERVICES",
      "name": "Matrix Engine M0-M15, BFF 4T, FIP 6-Flux, Cloud Sync & Migration Save",
      "layer": "L5",
      "sadtBox": "A4.2",
      "semver": "5.1.0-alpha.1",
      "triLock": [
        1,
        1,
        1
      ],
      "status": "ACTIVE",
      "isoRefs": [
        "27001",
        "31320-1",
        "12207"
      ],
      "matrices": [
        "M0",
        "M9",
        "M12",
        "M13-A",
        "M14",
        "M15"
      ],
      "deps": [
        "EXW.L0.CONTRACTS",
        "EXW.L1.CONFIG_DATA",
        "EXW.L2.CORE",
        "EXW.L3.SYSTEMS"
      ]
    },
    {
      "id": "EXW.L6.STORES_HANDLERS",
      "name": "Stores Zustand/Jotai, Sim Worker & Hooks Audio/Theme",
      "layer": "L6",
      "sadtBox": "A3.2",
      "semver": "5.1.0-alpha.1",
      "triLock": [
        1,
        1,
        1
      ],
      "status": "ACTIVE",
      "isoRefs": [
        "25010",
        "9241-210"
      ],
      "matrices": [
        "M7",
        "M11",
        "M12",
        "M14"
      ],
      "deps": [
        "EXW.L0.CONTRACTS",
        "EXW.L2.CORE",
        "EXW.L3.SYSTEMS",
        "EXW.L5.SERVICES"
      ]
    },
    {
      "id": "EXW.L7.INTERFACES",
      "name": "EXO-SHELL HUD, Monde 0-3D, Profil/Galerie 3D, Pyramide Agents & Atlas",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "triLock": [
        1,
        1,
        1
      ],
      "status": "ACTIVE",
      "isoRefs": [
        "9241-210",
        "25010"
      ],
      "matrices": [
        "M6",
        "M7",
        "M8",
        "M10",
        "M11",
        "M13-A"
      ],
      "deps": [
        "EXW.L0.CONTRACTS",
        "EXW.L1.CONFIG_DATA",
        "EXW.L3.SYSTEMS",
        "EXW.L4.ENGINE3D",
        "EXW.L5.SERVICES",
        "EXW.L6.STORES_HANDLERS"
      ]
    },
    {
      "id": "EXW.L8.BFF_SERVER",
      "name": "Serveur Express BFF Gemini 4T (Free Tier Strict $0)",
      "layer": "L8",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "triLock": [
        1,
        1,
        1
      ],
      "status": "ACTIVE",
      "isoRefs": [
        "27001",
        "25010"
      ],
      "matrices": [
        "M9",
        "M15"
      ],
      "deps": [
        "EXW.L0.CONTRACTS"
      ]
    }
  ]
} as const;

export const M13_MANIFEST: M13Manifest = {
  "version": "5.1.0-alpha.1",
  "d1Boxes": [
    {
      "id": "A1",
      "title": "Orchestrer le Noyau Déterministe & Temps Tour par Tour",
      "domain": "Core Engine & Temporalité (L0-L2)",
      "icom": {
        "inputs": [
          "WorldState(t)",
          "CampaignConfig",
          "Seed PCG32"
        ],
        "controls": [
          "Z0 Ban",
          "R-13 Pureté L2/L3",
          "Karnaugh M7 T_END_TURN"
        ],
        "outputs": [
          "WorldState(t+1)",
          "StateHash SHA-256",
          "TurnSummary"
        ],
        "mechanisms": [
          "Pcg32 6-Flux",
          "Phi01..Phi12 Commit",
          "WebWorker"
        ]
      }
    },
    {
      "id": "A2",
      "title": "Gouverner les Dossiers Exécutifs, PA & Protocole Genèse",
      "domain": "Gameplay Décisionnel & RPG (L2-L3)",
      "icom": {
        "inputs": [
          "DossierIntent",
          "PaBudget 7-Facteurs",
          "GeneseAct0Choice"
        ],
        "controls": [
          "R-24 Event-Only",
          "R-26 Fongibilité PA",
          "0-PA Garanti"
        ],
        "outputs": [
          "ResolvedDossier",
          "PromiseTracker(PM)",
          "Spectra[-100..100]"
        ],
        "mechanisms": [
          "pa-engine.ts",
          "action-event-generator.ts",
          "LivingCatalog CV"
        ]
      }
    },
    {
      "id": "A3",
      "title": "Simuler Économie Entités, Biosphère P1-P4 & Progression HK",
      "domain": "Systèmes Métier Civ & Colons (L3)",
      "icom": {
        "inputs": [
          "Districts L1-L5",
          "Colonists RPG",
          "Fleet & Drones"
        ],
        "controls": [
          "Ordre Pénurie 1.E->5.Cr",
          "Hystérésis -3 P1-P4",
          "Usure <55% P0"
        ],
        "outputs": [
          "EntityLedger",
          "TerraScore",
          "7-Stars/Fame/30-Techs"
        ],
        "mechanisms": [
          "entity-ledger.ts",
          "terraformation-v4.ts",
          "humankind-progression.ts"
        ]
      }
    },
    {
      "id": "A4",
      "title": "Générer & Persister via BFF Gemini 4T, Audio FIP & Save MIG",
      "domain": "Services, BFF & Persistance (L5-L8)",
      "icom": {
        "inputs": [
          "TurnContext",
          "SaveSnapshot v3/v4",
          "UserAudioGesture"
        ],
        "controls": [
          "Clé Serveur Seule",
          "Filtre Serveur Z0/R-50",
          "Rate-Limit 12 rpm"
        ],
        "outputs": [
          "LiveDossiers 4T",
          "Backup exow_backup_v3",
          "FIP 6-Flux + SFX"
        ],
        "mechanisms": [
          "server.ts",
          "turn-events-4t.pipeline.ts",
          "fip-radio.service.ts"
        ]
      }
    },
    {
      "id": "A5",
      "title": "Restituer l'Expérience 3D Isolée, HUD 3-Onglets & Atlas M0-M15",
      "domain": "Rendu 3D & Interfaces (L4, L6, L7)",
      "icom": {
        "inputs": [
          "SceneDiffPacket",
          "WorldState",
          "MatrixEngineReport"
        ],
        "controls": [
          "Monde 0-3D Strict",
          "Footer 3 Onglets",
          "WebKit DPR<=1.5"
        ],
        "outputs": [
          "Carte 3D Standard/Maint/Flux",
          "Inspecteur B3D/H3D",
          "Export Tri-Format"
        ],
        "mechanisms": [
          "ThreeJsRenderAdapter",
          "IsolatedInspectorScene",
          "BlueprintAtlasView"
        ]
      }
    }
  ],
  "d2SubBoxes": [
    {
      "id": "A1.1",
      "parentD1": "A1",
      "title": "Valider Contrats Zod D1..D5 & Garde Z0",
      "layer": "L0",
      "datagrams": [
        "D1",
        "D2",
        "D3"
      ],
      "icom": {
        "inputs": [
          "RawPayload"
        ],
        "controls": [
          "Zod Strict"
        ],
        "outputs": [
          "TypedContract"
        ],
        "mechanisms": [
          "z0-legacy.guard.ts"
        ]
      }
    },
    {
      "id": "A1.2",
      "parentD1": "A1",
      "title": "Générer Flux Aléatoires PCG32 Isolés (6 Streams)",
      "layer": "L2",
      "datagrams": [
        "D1"
      ],
      "icom": {
        "inputs": [
          "WorldSeed",
          "StreamId"
        ],
        "controls": [
          "0 Math.random"
        ],
        "outputs": [
          "DeterministicInt"
        ],
        "mechanisms": [
          "pcg32-streams.ts"
        ]
      }
    },
    {
      "id": "A1.3",
      "parentD1": "A1",
      "title": "Exécuter Pipeline Atomique Phi01..Phi12",
      "layer": "L2",
      "datagrams": [
        "D1",
        "D2"
      ],
      "icom": {
        "inputs": [
          "WorldState(t)"
        ],
        "controls": [
          "<16ms",
          "T_END_TURN"
        ],
        "outputs": [
          "WorldState(t+1)",
          "StateHash"
        ],
        "mechanisms": [
          "turn-commit-v4.ts"
        ]
      }
    },
    {
      "id": "A2.1",
      "parentD1": "A2",
      "title": "Calculer Budget PA 7-Facteurs & Carryover 150%",
      "layer": "L3",
      "datagrams": [
        "D2"
      ],
      "icom": {
        "inputs": [
          "Advisors",
          "Spectra",
          "Buildings"
        ],
        "controls": [
          "R-26"
        ],
        "outputs": [
          "PaBudget"
        ],
        "mechanisms": [
          "pa-engine.ts"
        ]
      }
    },
    {
      "id": "A2.2",
      "parentD1": "A2",
      "title": "Résoudre Dossiers, Option 0-PA & Sous-Choix",
      "layer": "L3",
      "datagrams": [
        "D2",
        "D3"
      ],
      "icom": {
        "inputs": [
          "ExecutiveDecisionIntent"
        ],
        "controls": [
          "0 Deadlock"
        ],
        "outputs": [
          "DossierReport"
        ],
        "mechanisms": [
          "pa-engine.ts"
        ]
      }
    },
    {
      "id": "A2.3",
      "parentD1": "A2",
      "title": "Piloter Protocole Genèse 2050 & Promesses (PM)",
      "layer": "L3",
      "datagrams": [
        "D3"
      ],
      "icom": {
        "inputs": [
          "DoctrineAct0",
          "TurnNumber"
        ],
        "controls": [
          "Deadlines PM"
        ],
        "outputs": [
          "ApprovalDelta",
          "HudStage"
        ],
        "mechanisms": [
          "genese-promises.ts"
        ]
      }
    },
    {
      "id": "A3.1",
      "parentD1": "A3",
      "title": "Comptabiliser Registre Entités, Usure & Délestage",
      "layer": "L3",
      "datagrams": [
        "D1"
      ],
      "icom": {
        "inputs": [
          "Districts",
          "Drones",
          "Units"
        ],
        "controls": [
          "Ordre 1.E->5.Cr"
        ],
        "outputs": [
          "EntityLedgerReport"
        ],
        "mechanisms": [
          "entity-ledger.ts"
        ]
      }
    },
    {
      "id": "A3.2",
      "parentD1": "A3",
      "title": "Calculer Terraformation P1..P4 & Colons RPG FP",
      "layer": "L3",
      "datagrams": [
        "D1"
      ],
      "icom": {
        "inputs": [
          "Atmo/Hydro/Bio/Rad",
          "Colonists"
        ],
        "controls": [
          "Hystérésis -3",
          "Burnout>=80"
        ],
        "outputs": [
          "AtmosphereTier",
          "YieldFactor"
        ],
        "mechanisms": [
          "terraformation-v4.ts",
          "workforce-rpg.ts"
        ]
      }
    },
    {
      "id": "A3.3",
      "parentD1": "A3",
      "title": "Arbitrer Étoiles HK (7 Domaines), Gloire & 30 Techs",
      "layer": "L3",
      "datagrams": [
        "D1",
        "D3"
      ],
      "icom": {
        "inputs": [
          "Metrics(t)",
          "EraAdvanceIntent"
        ],
        "controls": [
          "Seuil >=7 Étoiles"
        ],
        "outputs": [
          "HkProgress",
          "UnlockedTechs"
        ],
        "mechanisms": [
          "humankind-progression.ts"
        ]
      }
    },
    {
      "id": "A4.1",
      "parentD1": "A4",
      "title": "Orchestrer Cascade Gemini 4T & Catalogue Vivant CV",
      "layer": "L8",
      "datagrams": [
        "D2",
        "D5"
      ],
      "icom": {
        "inputs": [
          "TurnEventsPayload"
        ],
        "controls": [
          "H2->Retry->3.1-Lite->CV"
        ],
        "outputs": [
          "TurnEventsResult"
        ],
        "mechanisms": [
          "server.ts",
          "turn-events-4t.pipeline.ts"
        ]
      }
    },
    {
      "id": "A4.2",
      "parentD1": "A4",
      "title": "Diffuser Radio FIP 6-Flux + Synthé + SFX WebAudio",
      "layer": "L5",
      "datagrams": [
        "D4"
      ],
      "icom": {
        "inputs": [
          "StationId",
          "UiCue"
        ],
        "controls": [
          "Auto-ON 1er geste"
        ],
        "outputs": [
          "AudioOutput"
        ],
        "mechanisms": [
          "fip-radio.service.ts"
        ]
      }
    },
    {
      "id": "A4.3",
      "parentD1": "A4",
      "title": "Migrer Sauvegardes v3.1->v4.0 & Auditer M0-M15",
      "layer": "L5",
      "datagrams": [
        "D1",
        "D5"
      ],
      "icom": {
        "inputs": [
          "PersistedJson",
          "Manifests"
        ],
        "controls": [
          "Backup v3",
          "Gate GO/NO-GO"
        ],
        "outputs": [
          "WorldState v4",
          "AuditReport"
        ],
        "mechanisms": [
          "save-migration.service.ts",
          "matrix-engine.ts"
        ]
      }
    },
    {
      "id": "A5.1",
      "parentD1": "A5",
      "title": "Afficher HUD 3-Onglets, Monde 0-3D & Bilan Tour HK",
      "layer": "L7",
      "datagrams": [
        "D1",
        "D2",
        "D3"
      ],
      "icom": {
        "inputs": [
          "WorldState",
          "TurnSummary"
        ],
        "controls": [
          "Monde 0-3D",
          "Footer 3 Onglets"
        ],
        "outputs": [
          "PlayerIntents"
        ],
        "mechanisms": [
          "GameHud.tsx",
          "WorldsHubTab.tsx",
          "TurnSummaryHkModal.tsx"
        ]
      }
    },
    {
      "id": "A5.2",
      "parentD1": "A5",
      "title": "Inspecter Bâtiments B3D & Hangar Flotte H3D Isolés",
      "layer": "L4",
      "datagrams": [
        "D4"
      ],
      "icom": {
        "inputs": [
          "District",
          "FleetInventory"
        ],
        "controls": [
          "isSoftwareGl",
          "dispose() <5s"
        ],
        "outputs": [
          "WebGL Canvas / 2D Fallback"
        ],
        "mechanisms": [
          "isolated-inspector.scene.ts",
          "Isolated3DViewerModal.tsx"
        ]
      }
    },
    {
      "id": "A5.3",
      "parentD1": "A5",
      "title": "Projeter Carte 3D (Standard/Maintenance/Flux) & Atlas",
      "layer": "L4",
      "datagrams": [
        "D4",
        "D5"
      ],
      "icom": {
        "inputs": [
          "SceneDiffPacket",
          "M0/M13"
        ],
        "controls": [
          "R-15",
          "Zero Backdrop Over Canvas"
        ],
        "outputs": [
          "3D Scene",
          "MD/YAML/JSON Exports"
        ],
        "mechanisms": [
          "threejs-render.adapter.ts",
          "BlueprintAtlasView.tsx"
        ]
      }
    }
  ],
  "datagrams": [
    {
      "id": "D1",
      "name": "WorldState & EntityLedger",
      "producer": "A1/A3",
      "consumers": [
        "A2",
        "A4",
        "A5"
      ],
      "schemaRef": "src/contracts/world-state.schema.ts"
    },
    {
      "id": "D2",
      "name": "ExecutiveDossiers & PA Budget",
      "producer": "A2/A4",
      "consumers": [
        "A1",
        "A5"
      ],
      "schemaRef": "src/contracts/pa-dossiers.schema.ts"
    },
    {
      "id": "D3",
      "name": "Genèse Acte 0, Promesses & HK",
      "producer": "A2/A3",
      "consumers": [
        "A1",
        "A5"
      ],
      "schemaRef": "src/contracts/v4-systems.schema.ts"
    },
    {
      "id": "D4",
      "name": "RenderBridge SceneDiff & Isolated 3D",
      "producer": "A5",
      "consumers": [
        "A5.2",
        "A5.3"
      ],
      "schemaRef": "src/contracts/render-bridge.schema.ts"
    },
    {
      "id": "D5",
      "name": "TurnEvents 4T & Governance Audit",
      "producer": "A4",
      "consumers": [
        "A2",
        "A5"
      ],
      "schemaRef": "src/contracts/event-generator.schema.ts"
    }
  ],
  "srcMappings": [
    {
      "path": "src/App.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/adapters/render-adapter.interface.ts",
      "layer": "L4",
      "sadtBox": "A5.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/adapters/scene-diff-projector.ts",
      "layer": "L4",
      "sadtBox": "A5.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/app/api/doc-governance.route.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/app/api/health.route.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/app/api/oracle.route.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/app/api/routes.manifest.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/bridges/cloud-hybrid.bridge.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/bridges/index.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/bridges/narrative-core.bridge.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/bridges/render-dual.bridge.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/bridges/render-unity.bridge.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/bridges/worker-sim.bridge.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/components/AnnoQuestTracker.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/CampaignTutorialOverlay.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/DynamicSvgBackdrop.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/ErrorBoundary.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/ExoTitleEmblem.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/GoogleSignInButton.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/RichEntityText.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/RoadmapPlaceholderCard.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/ThemeStudioEffectsSection.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/ThemeStudioPanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/bento/ContextualMondeMicroModule.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/bento/ExoTooltip.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/bento/FoundationSvgIcon.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/bento/NestedBadgeGroup.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/bento/ProfileAvatarFrame.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/bento/PromptSuggestionChips.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/hud/HeaderDevDrawer.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/hud/HeaderNotificationCenter.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/hud/HeaderWeatherSuperWidget.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/world/AppPathAtlasPanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/world/AssignmentsTablePanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/world/CitizensSocietyPanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/world/ColonistDetailModal.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/world/ColonistRosterCards.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/world/CombatHistoryViewer.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/world/CombatPhaseTimeline.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/world/ExternalPolitiesPanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/world/MilitaryTheatersPanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/world/PaxScenarioMatrixModal.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/world/ResourceTrendProjectionChart.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/world/SovereignStatePanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/world/TacticalHeatmap.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/world/VideoStudioPanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/world/WorldBiospherePanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/world/WorldCitiesPanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/components/world/WorldFleetTechPanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/config/atmosphere.constants.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/config/combat.constants.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/config/cycle.constants.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/config/economy.constants.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/config/game.constants.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/config/index.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/config/llm-freetier.constants.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/config/maintenance.constants.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/config/nomenclature.constants.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/config/pa.constants.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/config/shell.constants.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/config/telemetry.constants.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/agent-hierarchy.schema.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/beta-p13.schema.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/combat-units.schema.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/doc-governance.schema.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/doc-sync.schema.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/economy-cyber.schema.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/event-generator.schema.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/exo-shell.schema.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/gemini-router.schema.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/guards/z0-legacy.guard.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/honors.schema.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/index.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/maps-biomes.schema.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/narrative-dag.schema.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/nested-badges.schema.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/pa-dossiers.schema.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/render-bridge.schema.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/trigger-bus.schema.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/ui-theme.schema.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/user-context.schema.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/v4-systems.schema.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/contracts/world-state.schema.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/core/bus/trigger-bus.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/core/dispatchers/dossier.dispatcher.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/core/dispatchers/event-hook.dispatcher.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/core/dispatchers/intent.dispatcher.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/core/hashing/state-hasher.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/core/loop/cycle-orchestrator.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/core/prng/pcg32-streams.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/core/prng/pcg32.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/core/probability/adaptive-delta.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/core/queues/build-modular.queue.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/core/queues/dossier-p0.queue.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/core/queues/intent.queue.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/core/routers/llm-freetier.router.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/core/routers/sot-layer.router.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/core/triggers/auto-turn.trigger.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/core/triggers/delayed-echo.trigger.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/core/triggers/watchdog-thresholds.trigger.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/data/agent-hierarchy.catalog.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/data/art-manifest.data.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/data/avatar-portraits.assets.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/data/beta-p13.catalog.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/data/blueprint-manifests.data.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/data/doc-governance.catalog.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/data/fallback-dossiers.catalog.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/data/honors.catalog.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/data/index.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/data/llm-lexicon.data.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/data/philosophy-ethics.catalog.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/data/prompt-suggestions.catalog.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/data/scientific-discoveries.catalog.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/data/ui-themes.catalog.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/data/ui-wallpapers.assets.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/data/v4-catalog.data.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/data/world.catalog.ts",
      "layer": "L1",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/doc-sync/bus-mirror.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/doc-sync/drive-docs.service.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/doc-sync/external-sync.service.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/doc-sync/google-picker.service.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/doc-sync/project-docs.catalog.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/doc-sync/sot-manifest.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/engine3d/isolated-inspector.scene.ts",
      "layer": "L4",
      "sadtBox": "A5.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/engine3d/planet-markers.ts",
      "layer": "L4",
      "sadtBox": "A5.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/engine3d/planet-weather-fx.ts",
      "layer": "L4",
      "sadtBox": "A5.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/engine3d/procedural-models.ts",
      "layer": "L4",
      "sadtBox": "A5.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/engine3d/procedural-textures.ts",
      "layer": "L4",
      "sadtBox": "A5.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/engine3d/scene-builders.ts",
      "layer": "L4",
      "sadtBox": "A5.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/engine3d/showcase-assets.ts",
      "layer": "L4",
      "sadtBox": "A5.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/engine3d/threejs-render.adapter.ts",
      "layer": "L4",
      "sadtBox": "A5.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/guardrails/dag-kahn-bfs.guardrail.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/guardrails/freetier-quota.guardrail.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/guardrails/index.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/guardrails/nomenclature.guardrail.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/guardrails/webkit-memory.guardrail.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/guardrails/zod-airlock.guardrail.ts",
      "layer": "L2",
      "sadtBox": "A1.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/hooks/use-cycle-clock.ts",
      "layer": "L6",
      "sadtBox": "A4.2",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/hooks/use-fip-audio.ts",
      "layer": "L6",
      "sadtBox": "A4.2",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/hooks/use-oracle-query.ts",
      "layer": "L6",
      "sadtBox": "A4.2",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/hooks/use-runtime-stack-status.ts",
      "layer": "L6",
      "sadtBox": "A4.2",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/hooks/use-theme-engine.ts",
      "layer": "L6",
      "sadtBox": "A4.2",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/hooks/use-user-context.ts",
      "layer": "L6",
      "sadtBox": "A4.2",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/hooks/use-viewport-layout.ts",
      "layer": "L6",
      "sadtBox": "A4.2",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/interfaces/AuthScreen.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/BriefingLobbyScreen.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/EntityWindowModal.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/GameHud.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/GameViewport.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/GeneseAct0Modal.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/Isolated3DViewerModal.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/MainMenuScreen.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/NewSimulationScreen.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/OutcomeModal.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/SettingsScreen.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/SubscreensOverlay.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/TurnSummaryHkModal.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/AgentPyramidPanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/Asset3DGalleryPanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/BetaP13HubPanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/BetaP13QuestionnaireForm.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/BiosphereCabinetTab.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/BlueprintAtlasView.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/BlueprintSvgDiagrams.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/ChronicleSavesTab.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/DocGovernancePanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/DocGovernanceRolesView.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/DocGovernanceTaxonomyView.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/DocStudioPanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/DocSyncStudioModal.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/DossierWorkshopModal.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/DriveSyncPanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/EventsHubTab.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/ExternalSyncPanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/GeopoliticsTab.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/JournalChroniclePanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/JournalHubTab.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/LlmLexiconPanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/MilitaryCombatTab.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/ProfileHubTab.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/TrophyShowcasePanel.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/WorldCitiesTab.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/interfaces/subscreens/WorldsHubTab.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/main.tsx",
      "layer": "L7",
      "sadtBox": "A5.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 200
    },
    {
      "path": "src/parsers/gemini-dualpass.parser.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/parsers/index.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/parsers/snapshot-gzip.parser.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/parsers/unity-bridge.parser.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/parsers/zod-boundary.parser.ts",
      "layer": "L0",
      "sadtBox": "A1.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/pipelines/game-actions.pipeline.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/pipelines/oracle-dossier.pipeline.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/pipelines/turn-events-4t.pipeline.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/retrievers/action-manifest.retriever.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/retrievers/catalog-docs.retriever.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/retrievers/chronicle-turns.retriever.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/retrievers/dossier-context.retriever.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/retrievers/hybrid-rag.retriever.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/retrievers/index.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/retrievers/pgvector-memory.retriever.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/services/architecture/matrix-engine.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/services/audio/fip-radio.service.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/services/firebase/firebase-client.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/services/firebase/firestore-archives.service.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/services/governance/doc-governance.service.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/services/persistence/save-migration.service.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/services/queues/cloud-sync.queue.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/services/queues/oracle-request.queue.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/services/saves/local-saves.service.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/stores/game.store.ts",
      "layer": "L6",
      "sadtBox": "A4.2",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/stores/meta-honors.store.ts",
      "layer": "L6",
      "sadtBox": "A4.2",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/stores/selection.atoms.ts",
      "layer": "L6",
      "sadtBox": "A4.2",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/stores/user-context.store.ts",
      "layer": "L6",
      "sadtBox": "A4.2",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/biosphere-cabinet/terraformation-v4.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/biosphere/climate-ledger.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/biosphere/video-studio-catalog.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/biosphere/world-systems.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/combat-conquest/combat-engine.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/combat-conquest/tactical-intensity-grid.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/combat-conquest/theaters-and-polities.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/dossiers-pa/action-event-generator.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/dossiers-pa/badge-taxonomy.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/dossiers-pa/dossier-subchoices.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/dossiers-pa/entity-markup.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/dossiers-pa/genese-promises.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/dossiers-pa/pa-engine.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/dossiers-pa/pax-scenario-matrix.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/economy-urban/citizens-society.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/economy-urban/entity-ledger.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/economy-urban/finance-actions.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/economy-urban/resource-forecast.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/economy-urban/workforce-assignments.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/geopolitics/humankind-progression.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/governance/agent-hierarchy.engine.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/governance/doc-governance.engine.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/honors/honors-evaluator.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/playtest/beta-p13-engine.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/playtest/playtest-6-turns.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/playtest/resource-trend-projection.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/quests/campaign-quests.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/turn-orchestration/gemini-cost-ledger.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/turn-orchestration/header-notifications.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/turn-orchestration/turn-gate-v4.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/systems/turn-orchestration/user-context-3d.ts",
      "layer": "L3",
      "sadtBox": "A3.1",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/utils/atmosphere-labels.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/utils/combat-snapshot-parser.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/utils/llm-lexicon.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/utils/safari-webkit.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/utils/ui-labels.ts",
      "layer": "L5",
      "sadtBox": "A4.3",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/worker/simulation.worker.ts",
      "layer": "L6",
      "sadtBox": "A4.2",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    },
    {
      "path": "src/worker/worker-client.ts",
      "layer": "L6",
      "sadtBox": "A4.2",
      "semver": "5.1.0-alpha.1",
      "status": "VERIFIED",
      "maxLinesBudget": 300
    }
  ]
} as const;
