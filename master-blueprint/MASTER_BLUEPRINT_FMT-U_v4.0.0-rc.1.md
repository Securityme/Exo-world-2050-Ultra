# EXO WORLD : 2050 — MASTER BLUEPRINT (FMT-U)
> ID: EXOW-ROOT | SEMVER: 4.0.0-rc.1+full-m0-m15 | GATE: GO | SCORE: 100% | DSM_CYCLES: 0 | UPDATED: 2026-11-21

## MATRICES M0..M15
| ID | CODE | LAYERS | ISO | GATE | METRIC |
|---|---|---|---|---|---|
| M0 | META-SEMVER | L0,L1,L2,L3,L4,L5,L6,L7,L8 | ISO 42010 | PASS | 9 noeuds · 0 err |
| M1 | CORE-LOOP | L2,L3 | ISO 25010 | PASS | 6 flux PRNG · <16ms |
| M2 | PA-DOSSIERS | L0,L2,L3 | ISO 25010 | PASS | Cap 150% · 0 deadlock |
| M3 | DSM-DEPS | L0,L1,L2,L3,L4,L5,L6,L7,L8 | ISO 42010 | PASS | 0 cycle(s) |
| M4 | ENTITY-LEDGER | L1,L2,L3 | ISO 25012 | PASS | Ordre 1.E→5.Cr · <55% P0 |
| M5 | TERRA-BIO | L1,L3 | ISO 25012 | PASS | 0.35·Atmo + 0.30·Hydro + 0.25·Bio + 0.10·Rad |
| M6 | HK-PROGRESSION | L1,L3,L7 | ISO 25010 | PASS | 6 Ères · 5 Techs/Ère · 4 Spectres |
| M7 | TURN-GATE | L2,L6,L7 | ISO 61508 | PASS | Verrouillé tant que dossiers > 0 |
| M8 | FP-WORKFORCE | L0,L3,L7 | ISO 9241-210 | PASS | Synergie +10% · Burnout Fat≥80 |
| M9 | GEMINI-4T | L5,L8 | ISO 27001 | PASS | H2 → Retry → 3.1-Flash-Lite → CV |
| M10 | RENDER-3D | L4,L7 | ISO 25010 | PASS | DPR≤1.5 · 0-3D dans Monde · Fallback 2D |
| M11 | GENESE-2050 | L3,L6,L7 | ISO 9241-210 | PASS | 3 Doctrines · 5 Personnalités IA · Bypass |
| M12 | AUDIO-FIP | L5,L6 | ISO 9241-210 | PASS | Auto-ON 1er geste · Fallback <500ms |
| M13-A | SADT-ARCH | L0,L2,L4,L5,L7 | ISO 31320-1 | PASS | 5 D1 · 15 D2 · 0 err |
| M13-D | SRC-MAPPING | L0,L1,L2,L3,L4,L5,L6,L7,L8 | ISO 12207 | PASS | 227 modules · 0 non-mappés |
| M14 | SAVE-MIG | L0,L5,L6 | ISO 25012 | PASS | Backup exow_backup_v3 · Zod D1..D5 |
| M15 | AUDIT-CI | L0,L2,L3,L5,L8 | ISO 27001 | PASS | ISO err: 0 · Parité U⇄M⇄S |

## CARTOGRAPHIE SRC (M13-D)
| LAYER | SADT | PATH | SEMVER | STATUS |
|---|---|---|---|---|
| L7 | A5.1 | `src/App.tsx` | 4.0.0-rc.1 | VERIFIED |
| L4 | A5.3 | `src/adapters/render-adapter.interface.ts` | 4.0.0-rc.1 | VERIFIED |
| L4 | A5.3 | `src/adapters/scene-diff-projector.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/app/api/health.route.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/app/api/oracle.route.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/app/api/routes.manifest.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/bridges/cloud-hybrid.bridge.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/bridges/index.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/bridges/narrative-core.bridge.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/bridges/render-dual.bridge.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/bridges/render-unity.bridge.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/bridges/worker-sim.bridge.ts` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/AnnoQuestTracker.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/CampaignTutorialOverlay.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/DynamicSvgBackdrop.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/ErrorBoundary.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/ExoTitleEmblem.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/GoogleSignInButton.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/RichEntityText.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/RoadmapPlaceholderCard.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/ThemeStudioEffectsSection.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/ThemeStudioPanel.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/bento/ContextualMondeMicroModule.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/bento/ExoTooltip.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/bento/FoundationSvgIcon.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/bento/NestedBadgeGroup.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/bento/PromptSuggestionChips.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/hud/HeaderDevDrawer.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/hud/HeaderNotificationCenter.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/hud/HeaderWeatherSuperWidget.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/world/AppPathAtlasPanel.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/world/AssignmentsTablePanel.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/world/CitizensSocietyPanel.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/world/ColonistDetailModal.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/world/ColonistRosterCards.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/world/CombatHistoryViewer.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/world/CombatPhaseTimeline.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/world/ExternalPolitiesPanel.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/world/MilitaryTheatersPanel.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/world/PaxScenarioMatrixModal.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/world/ResourceTrendProjectionChart.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/world/SovereignStatePanel.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/world/TacticalHeatmap.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/world/VideoStudioPanel.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/world/WorldBiospherePanel.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/world/WorldCitiesPanel.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/components/world/WorldFleetTechPanel.tsx` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/config/atmosphere.constants.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/config/combat.constants.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/config/cycle.constants.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/config/economy.constants.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/config/game.constants.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/config/index.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/config/llm-freetier.constants.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/config/maintenance.constants.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/config/nomenclature.constants.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/config/pa.constants.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/config/shell.constants.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/config/telemetry.constants.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/contracts/combat-units.schema.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/contracts/doc-sync.schema.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/contracts/economy-cyber.schema.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/contracts/event-generator.schema.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/contracts/exo-shell.schema.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/contracts/gemini-router.schema.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/contracts/guards/z0-legacy.guard.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/contracts/honors.schema.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/contracts/index.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/contracts/maps-biomes.schema.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/contracts/narrative-dag.schema.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/contracts/nested-badges.schema.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/contracts/pa-dossiers.schema.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/contracts/render-bridge.schema.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/contracts/trigger-bus.schema.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/contracts/ui-theme.schema.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/contracts/user-context.schema.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/contracts/v4-systems.schema.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/contracts/world-state.schema.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/core/bus/trigger-bus.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/core/dispatchers/dossier.dispatcher.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/core/dispatchers/event-hook.dispatcher.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/core/dispatchers/intent.dispatcher.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/core/hashing/state-hasher.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/core/loop/cycle-orchestrator.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/core/prng/pcg32-streams.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/core/prng/pcg32.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/core/probability/adaptive-delta.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/core/queues/build-modular.queue.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/core/queues/dossier-p0.queue.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/core/queues/intent.queue.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/core/routers/llm-freetier.router.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/core/routers/sot-layer.router.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/core/triggers/auto-turn.trigger.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/core/triggers/delayed-echo.trigger.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/core/triggers/watchdog-thresholds.trigger.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/data/art-manifest.data.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/data/blueprint-manifests.data.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/data/fallback-dossiers.catalog.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/data/honors.catalog.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/data/index.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/data/llm-lexicon.data.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/data/philosophy-ethics.catalog.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/data/prompt-suggestions.catalog.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/data/scientific-discoveries.catalog.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/data/ui-themes.catalog.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/data/ui-wallpapers.assets.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/data/v4-catalog.data.ts` | 4.0.0-rc.1 | VERIFIED |
| L1 | A1.1 | `src/data/world.catalog.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/doc-sync/bus-mirror.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/doc-sync/drive-docs.service.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/doc-sync/google-picker.service.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/doc-sync/project-docs.catalog.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/doc-sync/sot-manifest.ts` | 4.0.0-rc.1 | VERIFIED |
| L4 | A5.3 | `src/engine3d/isolated-inspector.scene.ts` | 4.0.0-rc.1 | VERIFIED |
| L4 | A5.3 | `src/engine3d/planet-markers.ts` | 4.0.0-rc.1 | VERIFIED |
| L4 | A5.3 | `src/engine3d/planet-weather-fx.ts` | 4.0.0-rc.1 | VERIFIED |
| L4 | A5.3 | `src/engine3d/procedural-models.ts` | 4.0.0-rc.1 | VERIFIED |
| L4 | A5.3 | `src/engine3d/procedural-textures.ts` | 4.0.0-rc.1 | VERIFIED |
| L4 | A5.3 | `src/engine3d/scene-builders.ts` | 4.0.0-rc.1 | VERIFIED |
| L4 | A5.3 | `src/engine3d/threejs-render.adapter.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/guardrails/dag-kahn-bfs.guardrail.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/guardrails/freetier-quota.guardrail.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/guardrails/index.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/guardrails/nomenclature.guardrail.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/guardrails/webkit-memory.guardrail.ts` | 4.0.0-rc.1 | VERIFIED |
| L2 | A1.3 | `src/guardrails/zod-airlock.guardrail.ts` | 4.0.0-rc.1 | VERIFIED |
| L6 | A4.2 | `src/hooks/use-cycle-clock.ts` | 4.0.0-rc.1 | VERIFIED |
| L6 | A4.2 | `src/hooks/use-fip-audio.ts` | 4.0.0-rc.1 | VERIFIED |
| L6 | A4.2 | `src/hooks/use-oracle-query.ts` | 4.0.0-rc.1 | VERIFIED |
| L6 | A4.2 | `src/hooks/use-runtime-stack-status.ts` | 4.0.0-rc.1 | VERIFIED |
| L6 | A4.2 | `src/hooks/use-theme-engine.ts` | 4.0.0-rc.1 | VERIFIED |
| L6 | A4.2 | `src/hooks/use-user-context.ts` | 4.0.0-rc.1 | VERIFIED |
| L6 | A4.2 | `src/hooks/use-viewport-layout.ts` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/AuthScreen.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/BriefingLobbyScreen.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/EntityWindowModal.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/GameHud.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/GameViewport.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/GeneseAct0Modal.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/Isolated3DViewerModal.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/MainMenuScreen.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/NewSimulationScreen.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/OutcomeModal.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/SettingsScreen.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/SubscreensOverlay.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/TurnSummaryHkModal.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/subscreens/BiosphereCabinetTab.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/subscreens/BlueprintAtlasView.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/subscreens/BlueprintSvgDiagrams.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/subscreens/ChronicleSavesTab.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/subscreens/DocStudioPanel.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/subscreens/DocSyncStudioModal.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/subscreens/DossierWorkshopModal.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/subscreens/DriveSyncPanel.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/subscreens/EventsHubTab.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/subscreens/GeopoliticsTab.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/subscreens/JournalChroniclePanel.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/subscreens/JournalHubTab.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/subscreens/LlmLexiconPanel.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/subscreens/MilitaryCombatTab.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/subscreens/ProfileHubTab.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/subscreens/TrophyShowcasePanel.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/subscreens/WorldCitiesTab.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/interfaces/subscreens/WorldsHubTab.tsx` | 4.0.0-rc.1 | VERIFIED |
| L7 | A5.1 | `src/main.tsx` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/parsers/gemini-dualpass.parser.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/parsers/index.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/parsers/snapshot-gzip.parser.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/parsers/unity-bridge.parser.ts` | 4.0.0-rc.1 | VERIFIED |
| L0 | A1.1 | `src/parsers/zod-boundary.parser.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/pipelines/game-actions.pipeline.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/pipelines/oracle-dossier.pipeline.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/pipelines/turn-events-4t.pipeline.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/retrievers/action-manifest.retriever.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/retrievers/catalog-docs.retriever.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/retrievers/chronicle-turns.retriever.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/retrievers/dossier-context.retriever.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/retrievers/hybrid-rag.retriever.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/retrievers/index.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/retrievers/pgvector-memory.retriever.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/services/architecture/matrix-engine.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/services/audio/fip-radio.service.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/services/firebase/firebase-client.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/services/firebase/firestore-archives.service.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/services/persistence/save-migration.service.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/services/queues/cloud-sync.queue.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/services/queues/oracle-request.queue.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/services/saves/local-saves.service.ts` | 4.0.0-rc.1 | VERIFIED |
| L6 | A4.2 | `src/stores/game.store.ts` | 4.0.0-rc.1 | VERIFIED |
| L6 | A4.2 | `src/stores/meta-honors.store.ts` | 4.0.0-rc.1 | VERIFIED |
| L6 | A4.2 | `src/stores/selection.atoms.ts` | 4.0.0-rc.1 | VERIFIED |
| L6 | A4.2 | `src/stores/user-context.store.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/biosphere-cabinet/terraformation-v4.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/biosphere/climate-ledger.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/biosphere/video-studio-catalog.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/biosphere/world-systems.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/combat-conquest/combat-engine.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/combat-conquest/tactical-intensity-grid.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/combat-conquest/theaters-and-polities.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/dossiers-pa/action-event-generator.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/dossiers-pa/badge-taxonomy.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/dossiers-pa/dossier-subchoices.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/dossiers-pa/entity-markup.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/dossiers-pa/genese-promises.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/dossiers-pa/pa-engine.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/dossiers-pa/pax-scenario-matrix.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/economy-urban/citizens-society.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/economy-urban/entity-ledger.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/economy-urban/finance-actions.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/economy-urban/resource-forecast.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/economy-urban/workforce-assignments.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/geopolitics/humankind-progression.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/honors/honors-evaluator.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/playtest/playtest-6-turns.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/playtest/resource-trend-projection.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/quests/campaign-quests.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/turn-orchestration/gemini-cost-ledger.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/turn-orchestration/header-notifications.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/turn-orchestration/turn-gate-v4.ts` | 4.0.0-rc.1 | VERIFIED |
| L3 | A3.1 | `src/systems/turn-orchestration/user-context-3d.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/utils/atmosphere-labels.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/utils/combat-snapshot-parser.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/utils/llm-lexicon.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/utils/safari-webkit.ts` | 4.0.0-rc.1 | VERIFIED |
| L5 | A4.3 | `src/utils/ui-labels.ts` | 4.0.0-rc.1 | VERIFIED |
| L6 | A4.2 | `src/worker/simulation.worker.ts` | 4.0.0-rc.1 | VERIFIED |
| L6 | A4.2 | `src/worker/worker-client.ts` | 4.0.0-rc.1 | VERIFIED |
