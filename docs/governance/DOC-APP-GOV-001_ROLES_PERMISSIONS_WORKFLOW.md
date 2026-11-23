# DOC-APP-GOV-001 · Gouvernance Documentaire, Rôles RBAC, Flux de Validation & Classement Séparé

> **Code de classement** : `APP-GUI-001` · **Pôle** : Application (`APP`) · **Filière** : Documentation Application (`APP_DOC`)
> **Version** : `5.1.0` · **Approbateur Maître** : Baptiste Lecoustre (`R-25`)

---

## 1. Objectif & Séparation Stricte des Périmètres

Afin d'assurer une traçabilité irréprochable, une recherche rapide et le respect des standards qualité d'EXO WORLD : 2050, la gestion documentaire repose sur trois piliers vérifiés côté serveur (`/api/governance`) et côté interface (*Studio Documentaire → Gouvernance & Validation*) :

1. **Contrôle d'accès par rôles (RBAC)** distinguant lecture, modification, révision spécialisée et validation finale sur trois filières (`APP_DOC`, `SKILLS`, `GAME_DOC`).
2. **Flux de travail de validation multi-étapes** imposant une révision spécialisée indépendante et une checklist de standards avant toute publication.
3. **Séparation stricte** entre la **Documentation de l'Application (`APP`)** et la **Documentation du Jeu (`GAME`)**, chacune dotée d'un système de classement codifié.

---

## 2. Rôles Utilisateurs & Matrice des Permissions (RBAC)

### 2.1 Définition des 5 Rôles

| Rôle (`roleId`) | Responsabilité principale | Règle de séparation des tâches |
| :--- | :--- | :--- |
| **Lecteur / Observateur** (`LECTEUR`) | Consultation des guides, spécifications, compétences (`skills`) et règles du jeu. | Lecture seule. Aucune écriture ni transition de statut. |
| **Concepteur & Rédacteur Jeu** (`AUTEUR_JEU`) | Rédaction, modification et soumission des règles, scénarios, équilibrages et éléments de jeu (`GAME_DOC`). | Lecture seule sur `APP_DOC` et `SKILLS`. Ne peut pas réviser ni publier ses propres propositions. |
| **Ingénieur App & Mainteneur Skills** (`INGENIEUR_APP_SKILLS`) | Création, mise à jour et soumission de la documentation technique, guides, notes de version (`APP_DOC`) et compétences (`SKILLS`). | Lecture seule sur `GAME_DOC`. Ne peut pas auto-approuver la publication finale. |
| **Réviseur Qualité & Conformité** (`REVISEUR_QUALITE`) | Exécution des révisions spécialisées (Technique, Skills, Jeu), contrôle des grilles de standards et demandes de corrections (`REQUEST_CHANGES`). | Interdiction d'auto-révision sur un document dont il est le dernier auteur. Ne publie pas en production. |
| **Approbateur Maître** (`APPROBATEUR_MAITRE`) | Autorité finale de validation et publication (`APPROVE_PUBLISH`), archivage (`ARCHIVE`) et gestion des attributions de rôles (`MANAGE_ROLES`). | Toute publication reste soumise à 100 % des contrôles automatiques et manuels. |

### 2.2 Matrice Granulaire des Permissions

| Permission | `LECTEUR` | `AUTEUR_JEU` | `INGENIEUR_APP_SKILLS` | `REVISEUR_QUALITE` | `APPROBATEUR_MAITRE` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `READ` (Lecture globale App, Skills, Jeu) | Oui | Oui | Oui | Oui | Oui |
| `CREATE` / `EDIT` / `SUBMIT_REVIEW` — `APP_DOC` | Non | Non | **Oui** | Non | **Oui** |
| `CREATE` / `EDIT` / `SUBMIT_REVIEW` — `SKILLS` | Non | Non | **Oui** | Non | **Oui** |
| `CREATE` / `EDIT` / `SUBMIT_REVIEW` — `GAME_DOC` | Non | **Oui** | Non | Non | **Oui** |
| `REVIEW_TECHNICAL` (Révision Doc Technique) | Non | Non | Non | **Oui** | **Oui** |
| `REVIEW_SKILLS` (Audit Compétences / Skills) | Non | Non | Non | **Oui** | **Oui** |
| `REVIEW_GAME` (Revue Règles & Éléments de Jeu) | Non | Non | Non | **Oui** | **Oui** |
| `REQUEST_CHANGES` (Renvoi en correction) | Non | Non | Non | **Oui** | **Oui** |
| `APPROVE_PUBLISH` (Validation Finale & Publication) | Non | Non | Non | Non | **Oui** |
| `ARCHIVE` (Archivage de révision obsolète) | Non | Non | Non | Non | **Oui** |
| `MANAGE_ROLES` (Attribution / Révocation d'accès) | Non | Non | Non | Non | **Oui** |

### 2.3 Processus de Gestion des Accès

1. **Demande & Attribution** : toute attribution de rôle applique le principe du moindre privilège et est enregistrée dans le registre des accès par l'`APPROBATEUR_MAITRE` (`PATCH /api/governance/roles`).
2. **Application côté serveur** : chaque requête de création, modification ou transition vérifie le rôle et la filière côté serveur Express (`403 Forbidden` en cas de droit insuffisant).
3. **Revue & Révocation** : les attributions sont révisées à chaque jalon SemVer mineur. Un changement de rôle ou une rétrogradation vers `LECTEUR` prend effet immédiatement et est horodaté dans le journal d'attribution.

---

## 3. Flux de Travail de Validation des Mises à Jour

Chaque mise à jour suit un cycle déterministe vérifié par le moteur pur `src/systems/governance/doc-governance.engine.ts` :

```
[DRAFT] --(Soumission + Contrôles auto)--> [TECH_REVIEW | SKILLS_REVIEW | GAME_REVIEW]
                                                |                     |
                           (Motif obligatoire)  |                     | (100 % standards + séparation des tâches)
                                                v                     v
                                       [CHANGES_REQUESTED]   [READY_FOR_APPROVAL]
                                                |                     |
                                     (Correction & resoumission)      | (APPROVE_PUBLISH · Approbateur Maître)
                                                                      v
                                                                 [PUBLISHED] --> [ARCHIVED]
```

### 3.1 Contrôles Automatiques Bloquants (avant toute soumission)

- **Cohérence du classement** : le code normalisé (`APP-*` ou `JEU-*`) correspond exactement au pôle et à la catégorie.
- **Conformité SemVer** : numéro de version au format `X.Y.Z` (ou pré-version valide).
- **Hygiène éditoriale `R-50` & `Z0`** : absence totale de termes bannis ou de rupture de nomenclature scientifique.
- **Sécurité Zéro Secret** : détection automatique et blocage de toute chaîne ressemblant à une clé API ou un jeton.
- **Complétude structurelle** : résumé exécutif et corps documentaire complets.

### 3.2 Étapes de Révision Spécialisées par Filière

1. **Documentation Technique Application (`APP_DOC` → `TECH_REVIEW`)** :
   - Alignement avec la stratification `L0→L8` et les contrats Zod (zéro cycle).
   - Clarté des guides, procédures reproductibles et ergonomie bureau + mobile (`>= 44 px`).
2. **Compétences / Skills (`SKILLS` → `SKILLS_REVIEW`)** :
   - Périmètre de déclenchement clair, instructions non ambiguës et non-conflit entre compétences.
   - Garde-fous sécurité, zéro secret en dur et respect strict du Free Tier (`R-68`).
3. **Nouveaux Éléments de Jeu (`GAME_DOC` → `GAME_REVIEW`)** :
   - Respect des invariants gameplay (PA, 4 Sous-PA, option `0-PA`, bornage `[-15 %, +15 %]`).
   - Réalisme scientifique 2050, ciel ouvert sans dôme et nomenclature vérifiée (`R-50`).

---

## 4. Plan de Classement Séparé : Application vs Jeu

Convention universelle des codes : **`<POLE>-<CATEGORIE>-<NNN>`**

### 4.1 Pôle A — Documentation de l'Application (`APP`)

| Code Catégorie | Intitulé | Filière | Contenu couvert | Exemple de code |
| :--- | :--- | :--- | :--- | :--- |
| **`APP-UPD`** | Mises à jour & Notes de Version | `APP_DOC` | Changelogs SemVer, correctifs, migrations | `APP-UPD-001` |
| **`APP-GUI`** | Guides Utilisateur & Gouvernance | `APP_DOC` | Guides d'utilisation, RBAC, administration, dépannage | `APP-GUI-001` |
| **`APP-TEC`** | Architecture & Spécifications Techniques | `APP_DOC` | Couches `L0→L8`, API Express, schémas Zod, Blueprint | `APP-TEC-001` |
| **`APP-SKL`** | Compétences (`Skills`) & Procédures IA | `SKILLS` | Skills d'exécution, garde-fous IA, quotas Free Tier | `APP-SKL-001` |

### 4.2 Pôle B — Documentation du Jeu (`GAME`)

| Code Catégorie | Intitulé | Filière | Contenu couvert | Exemple de code |
| :--- | :--- | :--- | :--- | :--- |
| **`JEU-REG`** | Règles & Mécaniques de Jeu | `GAME_DOC` | PA/Sous-PA, 0-PA, combat 4 phases, biosphère, économie | `JEU-REG-001` |
| **`JEU-SCE`** | Scénarios, Campagne & Lore | `GAME_DOC` | 6 Ères, 5 superpuissances IA, dossiers exécutifs, chroniques | `JEU-SCE-001` |
| **`JEU-BAL`** | Équilibrage, Matrices & Playtest | `GAME_DOC` | Matrices d'équilibrage, playtest 6 tours (`SHA-256`), Bêta P13 | `JEU-BAL-001` |
| **`JEU-VIS`** | Direction Artistique & Univers 3D | `GAME_DOC` | Thème Astralis V7, biomes, cités à ciel ouvert sans dôme | `JEU-VIS-001` |

---

## 5. Contrôle de Version Documentaire (VCS Séparé du Code Applicatif & Jeu)

Les mises à jour des documents gérés via Google Drive / Google Docs sont versionnées sur un registre VCS dédié (`src/systems/governance/doc-vcs.engine.ts`, routes `/api/governance/vcs/commit` et `/api/governance/documents/:id/rollback`), **strictement séparé** des commits de code source sur GitHub (`main`) :

- **Branche `docs/drive-sovereign`** : héberge l'historique immuable des fiches Application & Skills (`APP-*`) synchronisées avec Google Drive et Google Docs.
- **Branche `docs/game-assets-mirror`** : héberge les snapshots des fiches Jeu (`JEU-*`) sans jamais interférer avec la branche `main` du code exécutable.
- **Empreinte & Généalogie** : chaque révision génère un identifiant court (`8` hex) et une empreinte canonique (`64` hex) chaînée sur `parentHash`.
- **Diff ligne par ligne & Rollback contrôlé** : tout éditeur autorisé par le RBAC peut inspecter les différences (`+` / `-`) entre deux révisions et restaurer un état antérieur ; la restauration replace le document en `DRAFT` et crée un nouveau commit `ROLLBACK` (historique non destructif) obligeant une nouvelle passe de révision avant publication.

---

## 6. Deux Workflows Distincts : Documentation Drive/Docs vs Code Applicatif & Jeu

| Étape | Flux A — Documentation Application (`docs/drive-sovereign`) | Flux B — Code Applicatif, Jeu & Assets 3D (`main`) |
| :--- | :--- | :--- |
| **1. Origine** | Lecture via Google Picker / Docs OAuth (`DriveSyncPanel`) ou création dans le Pôle Application. | Développement sur branche dédiée (`feat/FUP-XXX`) dans AI Studio Build ou Antigravity IDE. |
| **2. Versionnement** | Commit instantané dans le **VCS Documentation** (`APP-UPD`, `APP-GUI`, `APP-TEC`, `APP-SKL`). | Commits Git code source + contrats Zod `L0` + préfabriqués Unity `Prefabs/*`. |
| **3. Contrôles auto** | Classement `APP-*`, SemVer, Zéro Secret API, conformité `R-50/Z0`. | `tsc --noEmit`, `eslint src`, pureté déterministe `L2/L3`, graphe Kahn 0 cycle. |
| **4. Révision** | Révision Technique (`TECH_REVIEW`) ou Audit Skills (`SKILLS_REVIEW`) par un pair indépendant. | Tests unitaires (`node:test` + Vitest) et inspection visuelle headless Chromium (`1440px` / `390px`). |
| **5. Approbation & Sortie** | Approbation Maître (`R-25`) → Tag `doc-vX.Y.Z` → écriture Google Docs confirmée (`batchUpdate`). | `compile_applet` / `vite build` vert → `Export -> Push to GitHub` & parité Preview/Antigravity. |

---

## 7. Pont de Communication Preview ↔ AI Studio ↔ Antigravity ↔ Essaim (`/api/swarm-bus`)

En environnement Preview (iframe isolée par Same-Origin Policy), l'application web ne peut pas modifier directement le système de fichiers local d'Antigravity IDE ni injecter du texte dans l'assistant hôte Google AI Studio. Le pont **`SwarmRelayPanel`** (`src/app/api/swarm-bus.route.ts`) établit trois canaux réels et complémentaires :

1. **Bus serveur `/api/swarm-bus`** : produit et trace des enveloppes structurées `[EXO-SWARM-HANDOFF]` validées par Zod (`SwarmHandoffInputSchema`) avec acquittement `ACK`.
2. **Canal asynchrone Google Drive `BUS-EXW-001`** : via OAuth 2.0 en mémoire (`DriveSyncPanel`), consigne les décisions dans les documents Drive partagés lus par Antigravity et Gemini Lead.
3. **Relais `window.parent.postMessage` & Paquets copiables** : émet un événement structuré vers l'hôte parent et génère un bloc Markdown/JSON prêt à coller dans AI Studio Build, Antigravity IDE ou l'Essaim `N0..N3`.

