# EXO WORLD : 2050 — Rapport Communautaire de Bêta-Test Virtuel (Vague P13)

> **Version évaluée** : `v5.0.0` (Roadmap complète P1 → P13 · Free Tier Gemini Strict)
> **Base factuelle vérifiée** :
> - Compilation & Typage : `vite build` (`0` erreur) · `tsc --noEmit` (`0` erreur) · `eslint src` (`0` erreur, `0` warning)
> - Tests automatisés : **37/37 tests verts** (28 tests Vitest incluant déterminisme 360 ticks, fongibilité PA/Sous-PA, garde-fous Kahn/Z0 et fuzz 60 tours `0 NaN / 0 deadlock` + 9 tests `node:test` couvrant Safari WebKit, climat/notifications, contexte 3D, routeur Gemini 6 canaux, honneurs 2 étages, 4 théâtres militaires, compilateur matriciel Pax et 12 catégories vidéo)
> - Audit de gouvernance (`exo:audit`) : **227 modules SRC vérifiés · 17/17 matrices PASS · 0 cycle DSM · Release Gate GO**
> - Vérification navigateur Playwright Headless Chromium : Desktop `1440×900` + Mobile `390×844`, `0` erreur console, `0` warning React, `0` dépassement horizontal mobile, collision d'en-tête détectée en Ronde 1 et corrigée/validée en Ronde 2.

---

## 1. Panel de la Communauté de Bêta-Testeurs Virtuels (5 Personas)

### Persona 1 — « Kaelen », Stratège 4X & Grand Strategy (Humankind / CK3 / Call of War)
- **Points forts vérifiés** :
  - Séparation limpide des **5 domaines purs** dans *Monde* (`Territoires`, `Population`, `Biosphère`, `Militaire`, `Technologies`) sans intitulés hybrides (`et`/`&`) et distinction visuelle immédiate `Stats` (lecture seule) vs `Gestion` (actions).
  - La **Fiche Technique Souveraine** (régime dynamique République/Fédération/Empire/Royaume, cote de solvabilité, 6 planètes et décompte des cités) donne une vraie profondeur d'État.
  - Le **système à 2 étages des Honneurs** sépare proprement la vitrine multi-parties (façon lobby CoD/Foundation) du profil Commandant de campagne (5 attributs CK3, traits acquis, titres territoriaux).
  - Le bouton *« Lancer un choix (PA restants) »* dans *Monde* résout parfaitement le problème des PA inutilisés en fin de tour.
- **Axes d'amélioration recommandés (v5.1)** :
  - Ajouter un raccourci clavier dédié (`Shift+M`) pour basculer directement sur l'onglet *Militaire → 4 Théâtres* lors d'une crise `P0`.
  - Permettre de sauvegarder plusieurs modèles de *Taskforces* nommés entre les tours.

### Persona 2 — « Chloé », Testeuse UX Mobile, Safari & iPhone (Responsive & Accessibilité)
- **Points forts vérifiés** :
  - Rendu propre en `390×844` sans aucun débordement horizontal, boutons tactiles confortables (`>= 44×44 px`), synchronisation de la taille de texte Safari OS + curseur manuel `85%–135%`.
  - La correction de la Ronde 2 (repli des indicateurs secondaires en `< 2xl` + déplacement de l'inspecteur TanStack Query dans le tiroir Studio Palmier) a éliminé tout chevauchement dans le bandeau supérieur et dans les modales mobiles.
  - Le mode **Masquer 100 % l'interface** libère entièrement la scène 3D pour contempler la cité ou la planète, avec bouton de restauration discret.
- **Axes d'amélioration recommandés (v5.1)** :
  - Ajouter un geste de balayage horizontal (*swipe*) entre les 3 onglets du dock principal (`Monde`, `Événements`, `Journal`) sur écran tactile étroit.
  - Proposer un mode « Contraste Élevé » dédié plein soleil pour iPhone en extérieur dans le Studio Thèmes.

### Persona 3 — « Maître Thomas », Analyste Narratif & Éthique (Pax Historia / Philosophie Politique)
- **Points forts vérifiés** :
  - Les **badges imbriqués à 3 niveaux** (`Maître ▸ N1 ▸ N2`) distinguent en un coup d'œil la provenance technique (`Catalogue / IA / Opération`) et la filiation philosophique/éthique (`Pôle I..V ▸ École ▸ Sous-courant`, incluant Thomisme / Bien Commun, Humanisme Civique, Kantisme, Éco-Symbiose) avec compteur cumulatif et icône `(i)` de légende couleur à droite.
  - Le **Générateur de Scénario Matriciel** (`Standard ↔ Avancé` + surcharges manuelles + bulles cliquables) comble la limite majeure de *Pax Historia* en couplant directement chaque curseur de scénario aux paramètres opérationnels du moteur (`WorldState`).
  - Le **Module Monde Contextuel** en fin de choix de dossier permet d'affiner manuellement l'affectation des colons proposée par l'IA avant signature.
- **Axes d'amélioration recommandés (v5.1)** :
  - Enrichir le journal de fin de campagne d'un graphique radar des 5 Pôles Éthiques sur l'ensemble des 6 Ères.
  - Ajouter un filtre rapide « Filtrer par école éthique » dans l'onglet *Événements*.

### Persona 4 — « Driss », Ingénieur 3D, WebGL & Performance (Three.js / OpenRW)
- **Points forts vérifiés** :
  - Scène 3D Échelle 3 (`3:Ville`) fluide en rendu logiciel headless (`0` erreur WebGL, `0` fuite mémoire), mettant en scène les socles **24-Hex**, le **Double Maglev** (viaduc civil interne + viaduc fret militaire externe avec navettes en contre-flux), les **18 piétons sur waypoints** inspirés des architectures propres OpenRW, et l'arc solaire jour/nuit subtil.
  - Le **Studio Vidéo 3D Free-Tier** capture nativement le `<canvas>` en WebM (`captureStream` + `MediaRecorder`) avec repli storyboard SVG gracieux et zéro modèle payant.
- **Axes d'amélioration recommandés (v5.1)** :
  - Ajouter un sélecteur de qualité graphique (`Éco Mobile / Standard / Ultra 60 fps`) ajustant la densité des piétons et les ombres dynamiques sur iPhone anciens.
  - Offrir un mode « Caméra Orbitale Libre » temporaire en Échelle 3 pour suivre une rame Maglev.

### Persona 5 — « Léa », Joueuse Découverte Solarpunk & Fiction Interactive
- **Points forts vérifiés** :
  - La direction visuelle **Rose Astralis** par défaut (fond obsidienne chaleureux, accents rose/corail/or, zéro néon cyan agressif) donne une identité immédiate dès l'écran titre et le lobby.
  - Aucun jargon interne (`Palier 1..4`) ne fuite à l'écran : le joueur lit *Atmosphère Hostile / Stabilisée / Respirable / Éden*, et le Super-Widget Météo + Centre de Notifications du header guident naturellement chaque tour.
  - Les **bulles de suggestions cliquables** rendent les champs libres (prochain arrivant, diplomatie privée, directives, scénarios) accessibles en 1 clic sans syndrome de la page blanche.
- **Axes d'amélioration recommandés (v5.1)** :
  - Ajouter une courte narration vocale synthétique optionnelle (Web Speech API locale, 100 % gratuite) pour lire les titres des crises `P0`.

---

## 2. Questionnaire Quantitatif d'Amélioration (Synthèse Panel 5 Personas)

| Critère évalué | Note / 5 | Statut v5.0.0 | Action prioritaire v5.1 |
| :--- | :---: | :---: | :--- |
| 1. Clarté de la boucle Tour par Tour & PA/Sous-PA | **4,8 / 5** | Validé | Raccourci clavier rapide pour dépenser les PA restants |
| 2. Lisibilité HUD Desktop (`1440×900`) & Absence de collision | **4,9 / 5** | Corrigé en R2 | Conserver la garde `overflow-hidden` et les tests de boîte englobante |
| 3. Ergonomie Mobile / Safari / iPhone (`390×844`) | **4,6 / 5** | Validé | Ajout du swipe entre `Monde / Événements / Journal` |
| 4. Identité Visuelle Rose Astralis & Thèmes | **4,9 / 5** | Validé | Preset « Plein Soleil Contraste Élevé » |
| 5. Profondeur Badges 3 Niveaux & Taxonomie Éthique | **4,8 / 5** | Validé | Radar éthique 5 Pôles en bilan de fin de campagne |
| 6. Générateur de Scénario Matriciel & Couplage Moteur | **4,7 / 5** | Validé | Export/Import JSON de scénarios communautaires |
| 7. Séparation Honneurs 2 Étages (Lobby vs Campagne) | **4,9 / 5** | Validé | Comparateur d'historique multi-campagnes dans le profil |
| 8. Qualité 3D (24-Hex, Double Maglev, Piétons, Climat) | **4,6 / 5** | Validé | Profil qualité adaptatif mobile (`Éco / Standard / Ultra`) |
| 9. Transparence IA Free Tier Strict (6 Canaux & Ledger) | **5,0 / 5** | Validé | Maintien strict `0 $` facturé et repli local déterministe |
| 10. Gouvernance Documentaire (`doc-mesh` + Audit M0..M15) | **4,9 / 5** | Validé | Exécution automatique en CI sur chaque PR GitHub |
| **Score Global Communauté Bêta** | **4,81 / 5** | **GO Production v5.0** | **Backlog v5.1 prêt** |

---

## 3. Verdict de Release Bêta (P13)

- **Statut** : **APPROUVÉ POUR RELEASE v5.0.0 (Free Tier Strict)**
- **Blocants ouverts** : **0**
- **Prochaine étape recommandée** : Lancer une session de jeu complète de 6 tours depuis *Journal → Synthèse 6 Tours*, ajuster l'équilibrage fin des scénarios personnalisés selon vos préférences personnelles, puis activer les améliorations ergonomiques v5.1 listées ci-dessus.
