# INDEX DOCUMENTAIRE SSoT — EXO WORLD : 2050 (`v5.1.0`)

> **Architecture Documentaire Séparée** : la gestion des documents distingue strictement le **Pôle Application (`APP-*`)** (mises à jour, guides, architecture technique, compétences `skills`) du **Pôle Jeu (`JEU-*`)** (règles, scénarios, équilibrage, univers).
> **Gouvernance & Accès (RBAC)** : toute création, modification, révision ou publication suit le processus défini dans `governance/DOC-APP-GOV-001_ROLES_PERMISSIONS_WORKFLOW.md`.

---

## Pôle A — Documentation de l'Application (`APP`)

### `APP-GUI` · Guides Utilisateur & Gouvernance
- `governance/DOC-APP-GOV-001_ROLES_PERMISSIONS_WORKFLOW.md` — Rôles utilisateurs (RBAC), permissions Lecture/Modification/Validation, VCS documentaire séparé (Drive/Docs), workflows distincts (Drive/Docs vs Code) & pont Swarm `/api/swarm-bus`
- `00_INDEX_DOCS.md` — Index maître de navigation documentaire du Hub scindé (Pôle Application Drive/Docs vs Pôle Jeu/Assets vs Workflows & Essaim)

### `APP-UPD` · Mises à jour & Notes de Version
- `changelogs/FUP_TRACKER.md` — Suivi des livraisons et jalons produit
- `../CHANGELOG.txt` — Journal historique des versions SemVer

### `APP-TEC` · Architecture & Spécifications Techniques
- `DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md` — Master Blueprint d'architecture système
- `architecture/01.md` — Stratification `L0..L8`, Shell & contrats système
- `architecture/02.md` — Boucle temporelle déterministe, `TRIGGER_BUS` & journal exportable
- `architecture/03.md` — Dual-Adapter 3D (`Three.js` ↔ `Unity 6 URP`) & rendu ciel ouvert
- `architecture/04.md` — Garde-fous techniques, ergonomie bureau/mobile & feuille de route
- `api-and-db/01.md`..`03.md` — Routes Express `/api/*`, sauvegardes Firestore & synchronisation isolée

### `APP-SKL` · Compétences (`Skills`) & Procédures d'Exécution
- `SYSTEM_INSTRUCTION_LIVE.md` — Contraintes invariantes `R-01..R-69`, garde-fous IA & standards d'exécution
- `inter-ia/BUS_MESSAGES.md` & `inter-ia/outbox/` — Protocole de coordination multi-agents

---

## Pôle B — Documentation du Jeu (`GAME`)

### `JEU-REG` · Règles & Mécaniques de Jeu
- `gameplay/01.md` — Points d'Action (PA), 4 Sous-PA, fongibilité asymétrique & dossiers exécutifs
- `gameplay/02.md` — Biosphère, terraformation `P1→P4` & adaptation planétaire
- `gameplay/03.md` — Économie modulaire, logistique & banque fédérale
- `gameplay/04.md` — Combat déterministe 4 phases, unités `L1..L5` & cyber-opérations

### `JEU-SCE` · Scénarios, Campagne & Lore
- Campagne 6 Ères, 5 superpuissances IA rivales & dossiers narratifs (gérés dans le registre `JEU-SCE-*` du Studio Documentaire)

### `JEU-BAL` · Équilibrage, Matrices & Playtest
- `matrices/MC-00_CORRESPONDANCE.md` — Matrice de correspondance couches / modules
- `matrices/SM-01_A_SM-06_ICOM.md` — Sous-matrices ICOM SADT `A0..A5` & playtests déterministes

### `JEU-VIS` · Direction Artistique & Univers 3D
- `design/` — Direction esthétique `Astralis Snapshot V7`, cités à ciel ouvert sans dôme & maquettes UX
