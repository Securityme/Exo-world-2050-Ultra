# EXO WORLD : 2050 — MASTER BLUEPRINT (FMT-M)
> ID: EXOW-ROOT | SEMVER: 5.2.0-alpha.1 | GATE: GO | SCORE: 100% | DSM_CYCLES: 0 | UPDATED: 2026-11-25

## SYNTHÈSE ARCHITECTURE SADT D1/D2 (M13-A)
### A1 — Orchestrer le Noyau Déterministe & Temps Tour par Tour (Core Engine & Temporalité (L0-L2))
- Inputs: WorldState(t), CampaignConfig, Seed PCG32
- Controls: Z0 Ban, R-13 Pureté L2/L3, Karnaugh M7 T_END_TURN
- Outputs: WorldState(t+1), StateHash SHA-256, TurnSummary
- Mechanisms: Pcg32 6-Flux, Phi01..Phi12 Commit, WebWorker
### A2 — Gouverner les Dossiers Exécutifs, PA & Protocole Genèse (Gameplay Décisionnel & RPG (L2-L3))
- Inputs: DossierIntent, PaBudget 7-Facteurs, GeneseAct0Choice
- Controls: R-24 Event-Only, R-26 Fongibilité PA, 0-PA Garanti
- Outputs: ResolvedDossier, PromiseTracker(PM), Spectra[-100..100]
- Mechanisms: pa-engine.ts, action-event-generator.ts, LivingCatalog CV
### A3 — Simuler Économie Entités, Biosphère P1-P4 & Progression HK (Systèmes Métier Civ & Colons (L3))
- Inputs: Districts L1-L5, Colonists RPG, Fleet & Drones
- Controls: Ordre Pénurie 1.E->5.Cr, Hystérésis -3 P1-P4, Usure <55% P0
- Outputs: EntityLedger, TerraScore, 7-Stars/Fame/30-Techs
- Mechanisms: entity-ledger.ts, terraformation-v4.ts, humankind-progression.ts
### A4 — Générer & Persister via BFF Gemini 4T, Audio FIP & Save MIG (Services, BFF & Persistance (L5-L8))
- Inputs: TurnContext, SaveSnapshot v3/v4, UserAudioGesture
- Controls: Clé Serveur Seule, Filtre Serveur Z0/R-50, Rate-Limit 12 rpm
- Outputs: LiveDossiers 4T, Backup exow_backup_v3, FIP 6-Flux + SFX
- Mechanisms: server.ts, turn-events-4t.pipeline.ts, fip-radio.service.ts
### A5 — Restituer l'Expérience 3D Isolée, HUD 3-Onglets & Atlas M0-M15 (Rendu 3D & Interfaces (L4, L6, L7))
- Inputs: SceneDiffPacket, WorldState, MatrixEngineReport
- Controls: Monde 0-3D Strict, Footer 3 Onglets, WebKit DPR<=1.5
- Outputs: Carte 3D Standard/Maint/Flux, Inspecteur B3D/H3D, Export Tri-Format
- Mechanisms: ThreeJsRenderAdapter, IsolatedInspectorScene, BlueprintAtlasView

## DATAGRAMMES D1..D5
- **D1 (WorldState & EntityLedger)**: A1/A3 → A2, A4, A5 (`src/contracts/world-state.schema.ts`)
- **D2 (ExecutiveDossiers & PA Budget)**: A2/A4 → A1, A5 (`src/contracts/pa-dossiers.schema.ts`)
- **D3 (Genèse Acte 0, Promesses & HK)**: A2/A3 → A1, A5 (`src/contracts/v4-systems.schema.ts`)
- **D4 (RenderBridge SceneDiff & Isolated 3D)**: A5 → A5.2, A5.3 (`src/contracts/render-bridge.schema.ts`)
- **D5 (TurnEvents 4T & Governance Audit)**: A4 → A2, A5 (`src/contracts/event-generator.schema.ts`)

## MATRICES DE CONTRÔLE (M0..M15)
- **M0 Registre Fractal SemVer & Tri-Lock** [PASS] — 9 noeuds · 0 err (Racine 5.2.0-alpha.1 avec verrouillage Tri-Lock [spec|code|audit].)
- **M1 Boucle Tour par Tour Φ01..Φ12 & PCG32 6-Flux** [PASS] — 6 flux PRNG · <16ms (Orchestration atomique déterministe avec empreinte SHA-256 à chaque tour.)
- **M2 Budget PA 7-Facteurs, 4 Sous-PA & 0-PA Garanti** [PASS] — Cap 150% · 0 deadlock (Fongibilité R-26 + option 0-PA obligatoire sur chaque dossier.)
- **M3 Matrice de Dépendances Couches L0 → L8** [PASS] — 0 cycle(s) (Graphe strictement acyclique validé par tri topologique de Kahn.)
- **M4 Registre Économique Entités, Usure & Pénuries** [PASS] — Ordre 1.E→5.Cr · <55% P0 (7 types de bâtiments L1–L5, délestage auto Ind/DC, zéro mécanique Z0.)
- **M5 Biosphère & Terraformation 5 Divisions (EXOSPHERE→TROPOSPHERE) / P1..P4** [PASS] — 5 Div Atmo · P1..P4 Hystérésis -3 (Kits O₂ actifs en P1–P3, Rayleigh/Mie 5 couches, libération en P4 Troposphère Éden.)
- **M6 Humankind 7 Domaines Étoiles, Gloire & 30 Techs** [PASS] — 6 Ères · 5 Techs/Ère · 4 Spectres (Avance d’ère manuelle ≥7 étoiles, Doctrines Évolutives/Communes/Transcendance.)
- **M7 Table de Karnaugh Verrou Fin de Tour (T_END_TURN)** [PASS] — Verrouillé tant que dossiers > 0 (Suppression définitive de l’avance rapide; validation manuelle avec Bilan HK.)
- **M8 Main-d’Œuvre Colons RPG, Équipement T1–T3 & Burnout** [PASS] — Synergie +10% · Burnout Fat≥80 (Santé, Bonheur, Moral, Fatigue, XP et créneaux de bâtiments inspectables en 3D.)
- **M9 Cascade BFF Gemini 4-Tiers & Filtre Serveur Z0/R-50** [PASS] — H2 → Retry → 3.1-Flash-Lite → CV (Clé serveur seule, rate-limit 12 rpm, validation Zod I/O, continuité transparente.)
- **M10 Rendu Three.js 0.187.0 PBR + Rayleigh/Mie + Inspecteur 135°** [PASS] — ACESFilmic · PMREM · Shadow 2048 · DPR≤1.5 (Globe PBR normalMap/terminateur, Cité Open-Sky Rayleigh/Mie sans dôme, Maglev, Inspecteur 135° et .dispose().)
- **M11 Protocole Genèse 2050 Acte 0, Promesses & Co-pilote IA** [PASS] — 3 Doctrines · 5 Personnalités IA · Bypass (Onboarding narratif, suivi de promesses (PM) et déblocage HUD progressif.)
- **M12 Radio FIP 6 Flux + Synthé Ambiant + SFX WebAudio** [PASS] — Auto-ON 1er geste · Fallback <500ms (Direct, Jazz, Électro, Groove, Monde, Rock + retours sonores <25ms.)
- **M13-A Dualité SADT A1..A5 & 15 Sous-boîtes ICOM** [PASS] — 5 D1 · 15 D2 · 0 err (Complétude verticale et horizontale des 5 datagrammes D1..D5.)
- **M13-D Cartographie 1:1 Modules SRC & Quotas R-14** [PASS] — 311 modules · 0 non-mappés (Chaque fichier src/ est indexé avec sa couche L0–L8, boîte SADT et SemVer.)
- **M14 Persistance, Auto-Migration v3.1→v5.1 & Export** [PASS] — Backup exow_backup · Zod D1..D5 (Purge automatique des champs hérités, P13 Bêta et vérification d’intégrité.)
- **M15 Audit Bloquant exo:audit, Fuzz 60t & Tri-Format DIR-01** [PASS] — ISO err: 0 · Parité U⇄M⇄S (Zéro Z0, pureté L2/L3, R-14, parité Tri-Format et export automatique.)
