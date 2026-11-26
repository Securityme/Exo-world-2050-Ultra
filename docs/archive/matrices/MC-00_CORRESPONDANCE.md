# Matrice de Correspondance `MC-00` (`L0` → `L8`)

| Couche | Dossiers | Rôle Principal | Modules Clés Vague 0 |
| :--- | :--- | :--- | :--- |
| `L0` | `contracts/`, `parsers/` | Contrats Zod & Parseurs Result | `trigger-bus.schema.ts`, `pa-dossiers.schema.ts`, `combat-units.schema.ts`, `render-bridge.schema.ts`, `zod-boundary.parser.ts` |
| `L1` | `config/`, `data/` | Constantes figées & Catalogues R-50 | `cycle.constants.ts`, `pa.constants.ts`, `scientific-discoveries.catalog.ts`, `fallback-dossiers.catalog.ts` |
| `L2` | `core/`, `guardrails/` | Noyau 100 % pur sans I/O | `pcg32.ts`, `state-hasher.ts`, `cycle-orchestrator.ts`, `dossier.dispatcher.ts`, `nomenclature.guardrail.ts`, `dag-kahn-bfs.guardrail.ts` |
| `L3` | `systems/` | Moteurs métier purs | `pa-engine.ts`, `world-systems.ts`, `combat-engine.ts`, `finance-actions.ts` |
| `L4` | `engine3d/`, `adapters/`, `bridges/` | Dual-Adapter 3D Three.js / Unity 6 | `threejs-render.adapter.ts`, `scene-diff-projector.ts`, `render-unity.bridge.ts` |
| `L5` | `retrievers/`, `stores/`, `services/`, `pipelines/`, `worker/`, `doc-sync/` | Orchestration, Worker & I/O | `game.store.ts`, `simulation.worker.ts`, `oracle-request.queue.ts`, `firebase-client.ts` |
| `L6` | `hooks/`, `handlers/` | Liaison React & Result Handlers | `game-actions.handler.ts`, `use-cycle-clock.ts`, `use-oracle-query.ts` |
| `L7` | `components/`, `interfaces/`, `features/` | Interface Astralis EXO-SHELL | `MainMenuScreen.tsx`, `GameHud.tsx`, `ChronicleSavesTab.tsx`, `BlueprintAtlasView.tsx` |
| `L8` | `app/`, `server.ts` | Serveur Express + SPA Vite :3000 | `server.ts`, `src/app/api/health.route.ts`, `src/app/api/oracle.route.ts` |
