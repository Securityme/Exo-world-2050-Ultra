import fs from 'node:fs';
import path from 'node:path';

/**
 * [L8 Tooling] EXO WORLD : 2050 — 4-Category Documentary Mesh Generator (`npm run exo:doc-mesh`)
 * Synchronizes:
 * - INDEX.md (4 Governance Categories: Technical Specifications | User Guides | Design Mockups | Lore, Rules & Balancing)
 * - CHANGELOG.txt (Actuel / Demandes / Projeté)
 * - docs/design/PAX_HISTORIA_UX_BRIEF.md (Exportable UX proposal for Pax Historia designers)
 */
const ROOT = process.cwd();

interface DocEntry {
  readonly relPath: string;
  readonly category: 'TECHNICAL_SPECS' | 'USER_GUIDES' | 'DESIGN_MOCKUPS' | 'LORE_RULES_BALANCING';
  readonly sizeKb: number;
}

function walkDocs(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDocs(full, acc);
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.txt')) {
      acc.push(full);
    }
  }
  return acc;
}

function classifyDoc(relPath: string): DocEntry['category'] {
  const low = relPath.toLowerCase();
  if (low.includes('guide') || low.includes('readme') || low.includes('onboarding')) {
    return 'USER_GUIDES';
  }
  if (low.includes('design') || low.includes('mockup') || low.includes('pax_historia') || low.includes('ui')) {
    return 'DESIGN_MOCKUPS';
  }
  if (low.includes('lore') || low.includes('playtest') || low.includes('beta') || low.includes('changelog')) {
    return 'LORE_RULES_BALANCING';
  }
  return 'TECHNICAL_SPECS';
}

function ensurePaxHistoriaUxBrief(): void {
  const dir = path.join(ROOT, 'docs', 'design');
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, 'PAX_HISTORIA_UX_BRIEF.md');
  const content = `# Proposition UX Événements — EXO WORLD : 2050 × Pax Historia

## 1. Constat sur l'onglet Événements dans les jeux de grande stratégie IA
Les générateurs narratifs libres apportent une richesse diplomatique remarquable, mais souffrent fréquemment de deux limites ergonomiques :
1. Absence de filtres structurés couplés de manière matricielle au moteur de simulation (risque de dérive ou d'incohérence mécanique).
2. Lisibilité insuffisante de l'origine IA/locale des choix, de leur portée éthique cumulée, et des ajustements opérationnels post-décision.

## 2. Logiques UX proposées (Implémentées & Validées dans EXO WORLD : 2050)
- **Badges Empilés à 3 Niveaux (\`Maître ▸ N1 ▸ N2\`)** : chaque événement et chaque choix affiche sa provenance (Gemini Live / Catalogue Vivant / Action Monde) et son courant philosophique/éthique (5 Pôles → 12 Écoles → 24 Sous-badges) en cumulatif et ponctuel, accompagné d'une icône \`(i)\` de légende couleur à droite.
- **Tri IA Non-Restrictif** : mise en avant contextuelle (*Recommandé* / *Préférence IA* / *Autres*) sans jamais griser ni verrouiller un seul choix joueur.
- **Générateur de Scénario Matriciel (\`Standard ↔ Avancé\`)** : curseurs climat, budget, agressivité rivaux, ouverture diplomatique + règles manuelles compilés directement en patch opérationnel du moteur (\`compileScenarioMatrix\`).
- **Module Monde Contextuel en fin de choix** : l'IA propose une répartition opérationnelle (affectation colons/quartiers) adaptée au choix retenu, que le joueur peut affiner manuellement avant signature.
- **Bulles de Suggestions Cliquables** : injection instantanée d'intentions dans les champs libres (diplomatie, directives, arrivants, scénarios).
- **Utilisation des PA restants via l'onglet Monde** : une fois les événements obligatoires résolus, le joueur déclenche ses propres initiatives depuis ses gestionnaires territoriaux.
`;
  fs.writeFileSync(target, content, 'utf8');
}

function generateIndexAndChangelog(): void {
  ensurePaxHistoriaUxBrief();
  const docsDir = path.join(ROOT, 'docs');
  const files = walkDocs(docsDir);
  const entries: DocEntry[] = files
    .map((abs) => {
      const relPath = path.relative(ROOT, abs).replace(/\\/g, '/');
      const stat = fs.statSync(abs);
      return {
        relPath,
        category: classifyDoc(relPath),
        sizeKb: Math.max(1, Math.round(stat.size / 1024)),
      };
    })
    .sort((a, b) => a.relPath.localeCompare(b.relPath));

  const byCat = {
    TECHNICAL_SPECS: entries.filter((e) => e.category === 'TECHNICAL_SPECS'),
    USER_GUIDES: entries.filter((e) => e.category === 'USER_GUIDES'),
    DESIGN_MOCKUPS: entries.filter((e) => e.category === 'DESIGN_MOCKUPS'),
    LORE_RULES_BALANCING: entries.filter((e) => e.category === 'LORE_RULES_BALANCING'),
  };

  const renderSection = (title: string, list: readonly DocEntry[]) =>
    `## ${title} (${list.length})\n\n${
      list.length === 0
        ? '_Aucun document classé._\n'
        : list.map((e) => `- [\`${e.relPath}\`](${e.relPath}) (${e.sizeKb} Ko)`).join('\n') + '\n'
    }`;

  const indexMd = `# INDEX DOCUMENTAIRE — EXO WORLD : 2050 (v5.0.0)

> Généré automatiquement par \`npm run exo:doc-mesh\` · 4 Catégories de Gouvernance Documentaire.
> Google Drive reste strictement isolé aux **Guides Utilisateur** et à l'export du Contexte Utilisateur.

${renderSection('1. Spécifications Techniques (Technical Specifications)', byCat.TECHNICAL_SPECS)}
${renderSection('2. Guides Utilisateur (User Guides — Seule catégorie synchronisable Drive)', byCat.USER_GUIDES)}
${renderSection('3. Maquettes Design & UX (Design Mockups)', byCat.DESIGN_MOCKUPS)}
${renderSection('4. Lore, Règles, Équilibrage & Playtest (Lore, Rules & Balancing)', byCat.LORE_RULES_BALANCING)}
`;

  fs.writeFileSync(path.join(ROOT, 'INDEX.md'), indexMd, 'utf8');

  const changelogTxt = `================================================================================
EXO WORLD : 2050 — CHANGELOG STRUCTURÉ (ACTUEL / DEMANDES / PROJETÉ)
Version : v5.0.0-roadmap-complete | Date : ${new Date().toISOString().slice(0, 10)}
================================================================================

[ACTUEL — IMPLÉMENTÉ & VÉRIFIÉ (VAGUES P1 -> P13)]
- P1 : Thème Rose Astralis verrouillé, bouclier Safari/iOS WebKit (100dvh, pinch zoom 2 doigts, resize split-pane).
- P2 : Masquage HUD 100%, Super-Widget Météo/Air/3 Tours, Centre de Notifications Header priorisé.
- P3 : Contexte Utilisateur 3D (Temps/Catégorie/Détail), Tiroir Dev Palmier, Firestore Rules déployées, React Query Devtools.
- P4 : Routeur Gemini 6 Canaux 100% Free Tier (gemini-4-hydrogen, gemini-3.1-flash-lite, gemini-decision-1), Bilan groupé Fin de tour, Tri IA non-restrictif.
- P5 : Système Honneurs 2 Niveaux — Niveau 1 Vitrine Multi-Parties (Lobby CoD, Avatar, Bannière, Blason, Titre, Médailles Bronze->Platine + Trophée symbolique Conception Globale) & Niveau 2 Commandant Campagne (5 attributs CK3, Traits, Titres territoriaux).
- P6 : Onglet Monde purifié (5 domaines sans "et"/"&"), Fiche État Souverain, Stats vs Gestionnaires, Atlas interactif des chemins, lancement d'initiatives PA depuis Monde.
- P7 : Fiche Colon Zoom + Vue 3D Exosuit, Citoyens Ordinaires Frostpunk (Santé/Éducation/Loisirs/Pollution/Origines), Badges empilés 3 niveaux (Provenance + 5 Pôles / 12 Écoles philosophiques + icône (i) légende), Bulles de suggestions cliquables, Module Monde Contextuel en fin de choix.
- P8 : 4 Théâtres Militaires (Spatial/Ciel/Terrestre/Maritime), Planificateur Taskforce 72 secteurs, Pression Civile 0..5 étoiles (inspiration OpenGTA), Cités Extérieures + Respect Faction, Polities locales, Chat Diplomatie Libre & Générateur de Scénario Matriciel (Pax Historia).
- P9 : Cité 3D vivante 24-Hex, Dual Maglev (Ligne Civile Rose/Émeraude + Fret Militaire Ambre), Piétons sur boucles waypoints (inspiration OpenRW), cycle solaire directionnel.
- P10 : Studio Vidéo Climat & Catastrophes (12 catégories) avec capture native WebM 3D Free Tier (canvas.captureStream + MediaRecorder + repli Storyboard SVG).
- P11 : Gouvernance documentaire 4 catégories (exo:doc-mesh), INDEX.md, CHANGELOG.txt, Brief UX Pax Historia.

[DEMANDES — INTÉGRÉES SUR CETTE ITÉRATION]
- Analyse légale & technique open-source GTA (OpenRW / OpenGTA GPLv3 sans assets Rockstar) + adaptations 100% originales EXO.
- Respect strict du Free Tier Gemini (aucun modèle payant suite au refus de clé payante).
- Playtest communautaire virtuel multi-personas (P13) basé sur vérifications Playwright réelles.

[PROJETÉ — PROCHAINES ÉTAPES POST-V5]
- Export multi-campagnes comparatif (courbes de score & d'éthique sur 6 ères).
- Extension Unity 6 URP consommant le même contrat SceneDiffPacket L4.
- Mode créateur de cartes communautaires partageables via JSON signé SHA-256.
`;

  fs.writeFileSync(path.join(ROOT, 'CHANGELOG.txt'), changelogTxt, 'utf8');
  console.log(`[exo:doc-mesh] OK — ${entries.length} documents indexés en 4 catégories (INDEX.md + CHANGELOG.txt + PAX_HISTORIA_UX_BRIEF.md).`);
}

generateIndexAndChangelog();
