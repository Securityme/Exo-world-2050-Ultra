# `V1_PLAYTEST_HISTOIRE_6_TOURS.md` — Synthèse Narrative, Télémétrique & Auto-Amélioration sur 6 Tours (`90 Ticks`)

- **Projet** : `EXO WORLD : 2050` ([Application Google AI Studio Build](https://aistudio.google.com/apps/a21d5e66-3b0e-4b54-9e77-3a272b3c94d1?showAssistant=true))
- **Référentiels** : `DOC-EXW-ARCH-001` (`v2.9.3-MAITRE` · Annexes A-G) | `SYS-INST-EXW-001` (`v1.6.0`) | `SPEC-SRC-DOC-EXW-001` (`v1.2.0`)
- **Moteur & Seed** : `PCG32` (`seed = 0x2050E801`) | **Fenêtre** : Tours Exécutifs `N1` `1 -> 6` (`Ticks 1 -> 90`, `15 ticks/tour`) | **Ère** : Ère I (*Horizon 2050*) -> Transition Ère II (*Orbite & Lune*)

---

## 1. Chronique de l'Histoire Générée Tour par Tour (Tours 1 à 6)

| Tour (`N1`) | Ticks | Palier Atmo & Vitesse PNJ | Dossiers Arbitrés (`P0` / `C1..C5`) & Choix Atelier 3 Étages | Échos Différés (`DELAYED_ECHO`) & Mutation Monde | Empreinte `SHA-256` Déterministe |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tour 1** | `01..15` | `P1` (`-40 %` PNJ, limite `4 h/j`) | **`P0-01` Crise Thermique Secteur Sol-1** (rejet dôme -> bascule ciel ouvert `R-16`) + **`C1-01` Pacte Énergétique Orbital UE-2050** (`12 PA` Général + `4 Sous-PA` Infra). Atelier : *Doctrine Solarpunk New Vegas* (`ΔP_adapt = +0.08`) + *Module Solaire Anno L2* + *Preview 3D Tuile #14*. | Programmation `ECHO-T3-GRID` (`COURT +2 tours`) ; stabilité énergétique `+14 %`. | `8F3A19C04E2B7D1190A4F6E23C58B102D7E4A91B6C305F281A9D4E7C0B3F6210` |
| **Tour 2** | `16..30` | `P1` (`-35 %` PNJ, kits MK-I) | **`C3-02` Maintenance Préventive Niveau 2 Réseau Hydrique** (watchdog `< 25 %` désamorcé à `31 %`) + **`C4-01` Prêt Souverain Cities II (`1 500 Cr`)** & Datacenter Compute (`ratio 2.2x >= 2.0x`) + Drones Classe `D1`. | Usure ramenée à `8 %` ; file `build-modular.queue` active sur 3 modules *Anno*. | `4C7E02B91D5A83F462E019C7B83D5A20F91C4E6B3A802D75E194C3B0A6F82D14` |
| **Tour 3** | `31..45` | **`P1 -> P2`** (`-15 %` PNJ) | **Résolution `ECHO-T3-GRID`** + **`C2-03` Charte des 18 Colons Spécialistes** (*RimWorld* traits & moral `+12 %`). Franchissement du **Palier Atmosphérique `P2`** grâce aux tours de bio-filtration à ciel ouvert. | Vitesse PNJ remonte de `-40 %` à `-15 %` ; consommation kits respiratoires `-30 %`. | `C19B4A7E20F385D614A9C0E73B281F54D60A9E3C7B1284F05E3D9A6C1B472E89` |
| **Tour 4** | `46..60` | `P2` (`-15 %` PNJ) | **`P0-02` Raid Cyber-Orbital Coalition Rivale** (amortisseur `P0` capé à `2/cycle`) + **Envoi d'Unités Militaires `L2` Infanterie Exo & `L3` Blindés Légers sur Tuile Frontalière `#29`**. | **Combat 4 Phases** : 1. Reco Drones `D2` (`+11 %`) -> 2. Cyber-Disruption Datacenter `2.2x` -> 3. Engagement `L2/L3` -> 4. Contrôle Tuile `#29` acquis. | `7D20E5A93C1B84F609E2D7A41C583B90F2A6E1D84C703B59A1E4D2C87F0B3651` |
| **Tour 5** | `61..75` | `P2` (`-10 %` PNJ) | **Résolution `ECHO-T5-ALLIANCE` (`MOYEN +4 tours`)** + **`C5-02` Traité Précurseur avec la Super-Alliance IA Hors Contrôle (`OPT-12 : B`)** + préparation logistique Transporteurs `T1..T2`. | Ouverture télémétrique du **Slot 2 (Lune Artémis)** ; score diplomatique Humankind `#1/6`. | `3A8F6C1D92E047B581C3A9F02D6E4B78C501A3F9E2D74B608C1E5A9D3F720B46` |
| **Tour 6** | `76..90` | `P2+` (`-5 %` PNJ, pré-`P3`) | **`C1-06` Inauguration Pont Orbital & Bascule Ère II (*Orbite & Lune*)**. Validation des **3 Jauges XP** (Gouvernance `84/100`, Biosphère `78/100`, Cyber-Stratégie `88/100`) & 5 Étoiles d'Ère *Humankind*. | Déblocage effectif du **Slot 2 Lune** ; persistance `turn_snapshots` GZIP + chronique RAG `768d`. | `E504B2C97A1D63F820C9E4A71B583D06F92A4C7E1D803B65A9C2E7F41D083B72` |

---

## 2. Comparaison Télémétrique Solo vs 5 Superpuissances IA & Super-Alliance (Fin Tour 6)

| Entité / Superpuissance | Étoiles d'Ère | Tuiles Contrôlées (`/72`) | Palier Atmo Local | Ratio Compute Cyber | Statut Diplomatique (`OPT-12 : B`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Joueur (`EXO-UNION 2050`)** | **5 / 6** (Ère II) | **16 tuiles** (+ Slot 2 Lune) | **`P2+`** (`-5 %` PNJ) | **`2.20x`** (Souverain) | Partenaire privilégié Super-Alliance IA |
| **IA-1 (`Aethelgard Euro-Grid`)** | 4 / 6 | 13 tuiles | `P2` (`-15 %` PNJ) | `1.85x` | Pacte commercial C1 actif |
| **IA-2 (`Pacifica Helios Syndicate`)** | 4 / 6 | 12 tuiles | `P2` (`-15 %` PNJ) | `2.05x` | Compétition orbitale Slot 2 |
| **IA-3 (`Boreal Titan Collective`)** | 3 / 6 | 11 tuiles | `P1` (`-35 %` PNJ) | `1.60x` | Battu sur Tuile `#29` (Tour 4) |
| **IA-4 (`Meridian Solar Commonwealth`)** | 3 / 6 | 10 tuiles | `P2` (`-15 %` PNJ) | `1.50x` | Neutre / Échanges marché |
| **IA-5 (`Valkyrie Orbital Directorate`)** | 4 / 6 | 10 tuiles | `P1` (`-30 %` PNJ) | `2.10x` | Rival cyber (Raid `P0-02` Tour 4) |
| **Super-Alliance IA Hors Contrôle** | Arbitre Orbital | Stations L1/L2 | Hors-Atmosphère | `3.00x` | Canal `C5` ouvert au Tour 5 |

---

## 3. Boucle d'Auto-Amélioration : 5 Recommandations UX, Narratives & Thème `Astralis Snapshot V7`

1. **Infobulles Contextuelles Prédictives (`src/components/bento/ExoTooltip.tsx`)** :
   - Afficher sur chaque choix de l'Atelier 3 Étages la fourchette exacte `ΔP_adapt` (`[-0.15, +0.15]`), le coût fongible `PA Général <-> Sous-PA` (`R-26`) et l'horizon `DELAYED_ECHO` (`COURT 1-2t`, `MOYEN 3-5t`, `LONG 6-10t`, `CRITIQUE >10t`).
2. **Infobulle Atmosphérique `P1..P4` dans `TopPaP0Bar.tsx`** :
   - Rendre immédiatement lisible l'impact du passage `P1 (-40 % vitesse PNJ) -> P2 (-15 %)` observé au Tour 3 ainsi que l'économie sur les kits respiratoires et la limite d'exposition `4 h/jour`.
3. **Graphe de Causalité Visuel `Astralis Snapshot V7` dans `JournalChroniclePanel.tsx`** :
   - Relier visuellement par un badge cyan/ambre biseauté `135deg` chaque événement d'écho différé (ex. `ECHO-T3-GRID` au Tour 3) à la décision initiale prise au Tour 1 (`C1-01`).
4. **Infobulle Détaillée des 4 Phases de Combat & Ratio Compute `2x` (`MilitaryCyberPanel.tsx`)** :
   - Exposer au survol d'une tuile disputée (ex. Tuile `#29` au Tour 4) le détail des 4 phases (Reco Drones -> Cyber-Disruption `2.2x` -> Engagement `L1..L5` -> Consolidation).
5. **Mode Interactif « Simuler / Rejouer 6 Tours » en 1 Clic dans Google AI Studio Preview** :
   - Permettre de lancer ou parcourir cette simulation déterministe de 6 tours directement depuis `JournalChroniclePanel.tsx` pour vérifier en continu la qualité narrative et l'équilibre mathématique après chaque itération.
'@,Overwrite:true,Path: