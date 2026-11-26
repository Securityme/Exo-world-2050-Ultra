import type {
  AgentCascadeMission,
  AgentDivision,
  AgentTierLevel,
  HierarchicalAgentNode,
} from '../contracts/agent-hierarchy.schema.ts';

/**
 * [L1] EXW.L1.AGENT_HIERARCHY_CATALOG | v5.1.0 | SADT A5.4
 * Static frozen 4-Level Triangular Pyramid (1 -> 2 -> 4 -> 8 = 15 Agents):
 * - Niveau 0 (Sommet)     : 1 Architecte Souverain
 * - Niveau 1 (Direction)  : 2 Directeurs de Branche
 * - Niveau 2 (Pôles)      : 4 Chefs de Pôle Spécialisés
 * - Niveau 3 (Exécution)  : 8 Sous-Agents Techniques
 */
export interface TierMetaSpec {
  readonly level: AgentTierLevel;
  readonly code: string;
  readonly label: string;
  readonly subtitle: string;
}

export const AGENT_PYRAMID_TIERS: readonly TierMetaSpec[] = Object.freeze([
  {
    level: 0,
    code: 'N0',
    label: 'Sommet Souverain',
    subtitle: 'Arbitrage global, vision R-25 & validation des 5 Portes',
  },
  {
    level: 1,
    code: 'N1',
    label: 'Direction Stratégique',
    subtitle: 'Pilotage des 2 grandes branches : Runtime 3D/Data & Produit/Gouvernance',
  },
  {
    level: 2,
    code: 'N2',
    label: 'Chefs de Pôle',
    subtitle: '4 leads spécialisés orchestrant l’architecture L0 → L8',
  },
  {
    level: 3,
    code: 'N3',
    label: 'Sous-Agents d’Exécution',
    subtitle: '8 spécialistes dédiés aux modules, tests, Unity 6 URP / 3D & TanStack',
  },
]);

export const AGENT_DIVISION_META: Readonly<
  Record<AgentDivision, { readonly label: string; readonly colorHex: string }>
> = Object.freeze({
  ORCHESTRATION: { label: 'Orchestration', colorHex: '#f43f5e' },
  CORE_3D: { label: 'Noyau & Unity 6 URP', colorHex: '#00f0ff' },
  CLOUD_TANSTACK: { label: 'Cloud & TanStack', colorHex: '#f59e0b' },
  UI_IDENTITY: { label: 'UI V7 & Profil', colorHex: '#a855f7' },
  QA_GOVERNANCE: { label: 'QA & Gouvernance', colorHex: '#10b981' },
});

export const INITIAL_AGENT_PYRAMID_NODES: readonly HierarchicalAgentNode[] = Object.freeze([
  // NIVEAU 0 — SOMMET (1)
  {
    id: 'AG-L0-ARGON',
    code: 'N0 · ARGON',
    name: 'Argon · Architecte Souverain',
    roleTitle: 'Orchestrateur Principal & Arbitre des 5 Portes',
    level: 0,
    parentId: null,
    division: 'ORCHESTRATION',
    status: 'ACTIVE',
    accentHex: '#f43f5e',
    summary:
      'Maintient la cohérence globale d’EXO WORLD : 2050, valide les contrats L0 et arbitre les priorités entre les branches Ingénierie et Produit.',
    responsibilities: [
      'Arbitrage d’architecture L0 → L8 et zéro dette de couplage',
      'Validation finale des jalons de sortie et du Master Blueprint',
      'Délégation des directives multi-pôles vers les directions N1',
    ],
    ownedModules: ['src/contracts/', 'docs/master-blueprint/', 'docs/00_INDEX_DOCS.md'],
    kpiLabel: '0 cycle DSM · 100 % strict',
    activeTask: 'Coordination des pôles Unity 6 URP Principal (C#/Shader Graph) & Portraits 2050',
  },

  // NIVEAU 1 — DIRECTIONS (2)
  {
    id: 'AG-L1-TECH',
    code: 'N1 · DIR-TECH',
    name: 'Direction Ingénierie & Runtime',
    roleTitle: 'Directeur Noyau Déterministe, Unity 6 URP & Données',
    level: 1,
    parentId: 'AG-L0-ARGON',
    division: 'CORE_3D',
    status: 'DELEGATING',
    accentHex: '#00f0ff',
    summary:
      'Supervise la pureté du noyau PCG32 (L2/L3), le moteur 3D Principal Unity 6 URP (+ aperçu Web Three.js, OPT-02 A+) et le pipeline Cloud $0.',
    responsibilities: [
      'Isolation stricte Simulation (L2/L3) vs Rendu (L4)',
      'Budget mémoire WebKit < 250 Mo & fluidité WebGL',
      'Supervision des chefs de pôle Hydrogène et Silicium',
    ],
    ownedModules: ['src/core/', 'src/engine3d/', 'src/bridges/', 'src/services/'],
    kpiLabel: '60 FPS cible · < 250 Mo',
    activeTask: 'Alignement SceneDiffPacket & optimisation PBR RoomEnvironment',
  },
  {
    id: 'AG-L1-PROD',
    code: 'N1 · DIR-PROD',
    name: 'Direction Produit, UI & Gouvernance',
    roleTitle: 'Directrice Expérience EXO-SHELL, RBAC & Qualité',
    level: 1,
    parentId: 'AG-L0-ARGON',
    division: 'UI_IDENTITY',
    status: 'DELEGATING',
    accentHex: '#a855f7',
    summary:
      'Pilote l’identité visuelle Astralis V7, les catalogues de portraits & succès, la séparation documentaire App/Jeu et la validation qualité.',
    responsibilities: [
      'Design system Bento 135°, double thème & mobile 360px',
      'Gouvernance RBAC 4 rôles et flux de validation 3 pistes',
      'Supervision des chefs de pôle Néon et Bore',
    ],
    ownedModules: ['src/interfaces/', 'src/components/', 'docs/DOC-EXW-ARCH-001_MASTER_BLUEPRINT.md'],
    kpiLabel: 'WCAG AA · Cibles >= 44px',
    activeTask: 'Déploiement vitrine 12 portraits, 16 succès & galerie 3D',
  },

  // NIVEAU 2 — CHEFS DE PÔLE (4)
  {
    id: 'AG-L2-HYDRO',
    code: 'N2 · HYDROGÈNE',
    name: 'Hydrogène · Lead Noyau & 3D',
    roleTitle: 'Chef de Pôle Simulation & Rendu Unity 6 URP AAA',
    level: 2,
    parentId: 'AG-L1-TECH',
    division: 'CORE_3D',
    status: 'ACTIVE',
    accentHex: '#00f0ff',
    summary:
      'Dirige les moteurs déterministes (PCG32, SHA-256, combats 4 phases) et le pipeline 3D Unity 6 URP Principal + Aperçu Web Three.js (OPT-02 A+).',
    responsibilities: [
      'Orchestration des cycles exécutifs N1 & 5 divisions atmosphériques',
      'Projection unidirectionnelle WorldState → SceneDiffPacket (Unity C# / .jslib)',
      'Encadrement des sous-agents Simulation et Rendu 3D Unity 6 URP',
    ],
    ownedModules: ['src/core/loop/', 'src/adapters/', 'src/bridges/render-unity.bridge.ts'],
    kpiLabel: '10 Prefabs Unity 6 URP · 100 % déterministe',
    activeTask: 'Validation Unity 6 URP (Shader Graph, Burst, LOD0-2) & aperçu Web des 10 modèles',
  },
  {
    id: 'AG-L2-SILICIUM',
    code: 'N2 · SILICIUM',
    name: 'Silicium · Lead Cloud & TanStack',
    roleTitle: 'Chef de Pôle Persistance $0, TanStack & IA',
    level: 2,
    parentId: 'AG-L1-TECH',
    division: 'CLOUD_TANSTACK',
    status: 'READY',
    accentHex: '#f59e0b',
    summary:
      'Architecture les requêtes TanStack Query/Table, le gouverneur Gemini Free Tier strict, Firestore et les contrats API /api/*.',
    responsibilities: [
      'Caching & mutations typées Zod via TanStack Query',
      'Tableaux filtrables haute densité via TanStack Table',
      'Gouverneur Free Tier $0 (Oracle Dual-Pass + Firestore)',
    ],
    ownedModules: ['src/hooks/use-oracle-query.ts', 'src/services/firebase/', 'src/app/api/'],
    kpiLabel: '0 $ Free Tier · Zod 100 %',
    activeTask: 'Consolidation du cache TanStack et synchronisation des vitrines Cloud',
  },
  {
    id: 'AG-L2-NEON',
    code: 'N2 · NÉON',
    name: 'Néon · Lead UI V7 & Identité',
    roleTitle: 'Chef de Pôle EXO-SHELL, Portraits & Succès',
    level: 2,
    parentId: 'AG-L1-PROD',
    division: 'UI_IDENTITY',
    status: 'ACTIVE',
    accentHex: '#a855f7',
    summary:
      'Façonne les écrans EXO-SHELL, les portraits haute définition Solarpunk 2050, les succès multi-parties et l’ergonomie tactile.',
    responsibilities: [
      'Direction artistique Astralis Snapshot V7 & infobulles ExoTooltip',
      'Catalogue de 12 portraits, 16 succès, 10 badges et 8 titres',
      'Encadrement des sous-agents Portraits/Succès et Mobile 360px',
    ],
    ownedModules: ['src/interfaces/subscreens/TrophyShowcasePanel.tsx', 'src/data/honors.catalog.ts'],
    kpiLabel: '12 portraits · 16 succès',
    activeTask: 'Polissage des filtres de succès et cadrage adaptatif des portraits',
  },
  {
    id: 'AG-L2-BORE',
    code: 'N2 · BORE',
    name: 'Bore · Lead QA & Gouvernance',
    roleTitle: 'Chef de Pôle Tests, Audits & Workflow Docs',
    level: 2,
    parentId: 'AG-L1-PROD',
    division: 'QA_GOVERNANCE',
    status: 'VALIDATING',
    accentHex: '#10b981',
    summary:
      'Garantit zéro régression via les tests unitaires, l’audit architectural DSM/Z0 et le contrôle d’accès RBAC de la documentation.',
    responsibilities: [
      'Validation TypeScript strict, ESLint et tests node:test / Vitest',
      'Contrôle RBAC 4 rôles et séparation App (APP-*) vs Jeu (JEU-*)',
      'Encadrement des sous-agents Audit et Workflow Docs',
    ],
    ownedModules: ['tests/', 'src/systems/governance/', 'scripts/exo-audit.ts'],
    kpiLabel: '100 % tests verts · 0 erreur TS',
    activeTask: 'Vérification des portes de build et des invariants de gouvernance',
  },

  // NIVEAU 3 — SOUS-AGENTS D'EXÉCUTION (8 — 2 par Chef de Pôle N2)
  {
    id: 'AG-L3-SIM',
    code: 'N3 · SIM-PCG',
    name: 'Sous-Agent Simulation PCG32',
    roleTitle: 'Spécialiste Boucle Déterministe & PA',
    level: 3,
    parentId: 'AG-L2-HYDRO',
    division: 'CORE_3D',
    status: 'READY',
    accentHex: '#38bdf8',
    summary: 'Maintient la pureté mathématique des tours, PA/Sous-PA, combats 4 phases et paliers atmosphériques P1..P4.',
    responsibilities: [
      'PRNG PCG32 reproductible & hachage SHA-256 par tour',
      'Évaluation pure des succès & traits souverains (L3)',
    ],
    ownedModules: ['src/core/prng/', 'src/systems/honors/honors-evaluator.ts'],
    kpiLabel: 'Zéro Math.random()',
    activeTask: 'Calcul déterministe des 16 succès à partir de WorldState',
  },
  {
    id: 'AG-L3-3D-PBR',
    code: 'N3 · UNITY-URP',
    name: 'Sous-Agent Rendu 3D Unity 6 URP',
    roleTitle: 'Spécialiste Unity 6 URP (C#/Shader Graph/Burst) & Aperçu Three.js',
    level: 3,
    parentId: 'AG-L2-HYDRO',
    division: 'CORE_3D',
    status: 'ACTIVE',
    accentHex: '#06b6d4',
    summary: 'Pilote le pont Unity 6 URP Principal (C#, .jslib, Addressables, Prefabs LOD0-2, Shader Graph) et synchronise l’aperçu Web léger Three.js via SceneDiffPacket.',
    responsibilities: [
      'Pont Unity 6 URP (render-unity.bridge.ts, unity-bridge.parser.ts, Burst/IL2CPP)',
      '10 Prefabs Unity URP (Assets/Prefabs/*) + parité aperçu Web Three.js',
    ],
    ownedModules: ['src/bridges/render-unity.bridge.ts', 'src/parsers/unity-bridge.parser.ts'],
    kpiLabel: 'Unity 6 URP Principal',
    activeTask: 'Exposition des 10 Prefabs Unity 6 URP et générateur C#/.jslib',
  },
  {
    id: 'AG-L3-TANSTACK',
    code: 'N3 · TANSTACK',
    name: 'Sous-Agent TanStack & Données',
    roleTitle: 'Spécialiste React Query & React Table',
    level: 3,
    parentId: 'AG-L2-SILICIUM',
    division: 'CLOUD_TANSTACK',
    status: 'ACTIVE',
    accentHex: '#fbbf24',
    summary: 'Gère le cycle de vie des requêtes serveur (Oracle, Archives Docs) et le filtrage tabulaire haute performance de la Chronique.',
    responsibilities: [
      'QueryClientProvider, staleTime 5 min et mutations Zod (/api/oracle)',
      'Tableaux filtrables multi-colonnes dans ChronicleSavesTab',
    ],
    ownedModules: ['src/hooks/use-oracle-query.ts', 'src/interfaces/subscreens/ChronicleSavesTab.tsx'],
    kpiLabel: 'Cache 5 min · Retry 1x',
    activeTask: 'Optimisation des hooks Query et Devtools activables à la demande',
  },
  {
    id: 'AG-L3-CLOUD',
    code: 'N3 · CLOUD-RAG',
    name: 'Sous-Agent Persistance & RAG $0',
    roleTitle: 'Spécialiste Firestore, Saves & Free Tier',
    level: 3,
    parentId: 'AG-L2-SILICIUM',
    division: 'CLOUD_TANSTACK',
    status: 'READY',
    accentHex: '#d97706',
    summary: 'Assure la persistance locale + Firestore des profils/campagnes et le respect strict du budget $0.',
    responsibilities: [
      'Fusion non-destructive localStorage ↔ catalogue (mergeCatalogHonors)',
      'Synchronisation Firestore des vitrines et archives',
    ],
    ownedModules: ['src/stores/meta-honors.store.ts', 'src/services/firebase/'],
    kpiLabel: '0 perte de sauvegarde',
    activeTask: 'Migration transparente des anciens profils vers les 16 succès',
  },
  {
    id: 'AG-L3-PORTRAITS',
    code: 'N3 · PORTRAITS',
    name: 'Sous-Agent Profil, Portraits & Succès',
    roleTitle: 'Spécialiste Identité Visuelle & Trophées',
    level: 3,
    parentId: 'AG-L2-NEON',
    division: 'UI_IDENTITY',
    status: 'ACTIVE',
    accentHex: '#c084fc',
    summary: 'Intègre les 12 portraits éditoriaux Solarpunk 2050, le fallback monogramme zéro image cassée et les 6 styles de bannières.',
    responsibilities: [
      'Résolveur Vite browser-only (avatar-portraits.assets.ts)',
      'Composant résilient ProfileAvatarFrame + import photo local',
    ],
    ownedModules: ['src/data/avatar-portraits.assets.ts', 'src/components/bento/ProfileAvatarFrame.tsx'],
    kpiLabel: '12/12 images vérifiées',
    activeTask: 'Synchronisation des portraits entre Menu Principal et Vitrine Profil',
  },
  {
    id: 'AG-L3-MOBILE',
    code: 'N3 · MOBILE-UX',
    name: 'Sous-Agent Ergonomie Mobile 360px',
    roleTitle: 'Spécialiste Responsive, A11y & Infobulles',
    level: 3,
    parentId: 'AG-L2-NEON',
    division: 'UI_IDENTITY',
    status: 'READY',
    accentHex: '#e879f9',
    summary: 'Garantit une navigation fluide de 360px à 1440px, des zones tactiles >= 44px et des infobulles accessibles.',
    responsibilities: [
      'Contrôles natifs accessibles (aria-label, aria-expanded, groupes)',
      'Adaptation mobile des grilles de portraits, succès et organigramme',
    ],
    ownedModules: ['src/components/bento/ExoTooltip.tsx', 'src/hooks/use-viewport-layout.ts'],
    kpiLabel: '0 débordement horizontal',
    activeTask: 'Contrôle des hauteurs de viewport et du rendu tactile des modales',
  },
  {
    id: 'AG-L3-AUDIT',
    code: 'N3 · QA-AUDIT',
    name: 'Sous-Agent Audit & Anti-Régression',
    roleTitle: 'Spécialiste Tests Unitaires & Inspection Visuelle',
    level: 3,
    parentId: 'AG-L2-BORE',
    division: 'QA_GOVERNANCE',
    status: 'VALIDATING',
    accentHex: '#34d399',
    summary: 'Exécute les suites node:test, ESLint, tsc --noEmit et les captures navigateur headless après chaque itération.',
    responsibilities: [
      'Tests déterministes des catalogues, moteurs purs et builders 3D',
      'Contrôle zéro terme banni (Z0/R-50) et zéro erreur console',
    ],
    ownedModules: ['tests/profile-assets-and-honors.test.ts', 'tests/agent-hierarchy.test.ts'],
    kpiLabel: '100 % assertions vertes',
    activeTask: 'Exécution des tests sur la pyramide multi-agents et les assets 3D',
  },
  {
    id: 'AG-L3-DOCS',
    code: 'N3 · GOV-DOCS',
    name: 'Sous-Agent Gouvernance Docs & Skills',
    roleTitle: 'Spécialiste RBAC 4 Rôles & Classement App/Jeu',
    level: 3,
    parentId: 'AG-L2-BORE',
    division: 'QA_GOVERNANCE',
    status: 'READY',
    accentHex: '#14b8a6',
    summary: 'Maintient la séparation stricte entre documentation Application (APP-*) et Jeu (JEU-*) ainsi que le flux de validation 3 pistes.',
    responsibilities: [
      'Contrôle des permissions (Lecteur, Contributeur, Réviseur, Admin)',
      'Suivi des propositions Application, Skills et Éléments de Jeu',
    ],
    ownedModules: ['src/systems/governance/doc-governance.engine.ts', 'src/app/api/doc-governance.route.ts'],
    kpiLabel: '4 rôles · 3 pistes validées',
    activeTask: 'Synchronisation du registre RBAC avec l’organigramme multi-agents',
  },
]);

export const INITIAL_PYRAMID_MISSIONS: readonly AgentCascadeMission[] = Object.freeze([
  {
    id: 'MIS-001',
    directive: 'Déployer les 12 portraits 2050, 16 succès et la Galerie 3D PBR 10 modèles',
    originId: 'AG-L0-ARGON',
    targetId: 'AG-L3-3D-PBR',
    chainIds: ['AG-L0-ARGON', 'AG-L1-TECH', 'AG-L2-HYDRO', 'AG-L3-3D-PBR'],
    activatedSubtreeIds: ['AG-L3-3D-PBR'],
    priority: 'ELEVATED',
    stepTick: 1,
    outcomeSummary: '10 modèles PBR multi-pièces déployés en 100 % Three.js WebGL2 (Assets3D/*).',
  },
  {
    id: 'MIS-002',
    directive: 'Auditer la séparation documentaire App/Jeu et la matrice RBAC 4 rôles',
    originId: 'AG-L0-ARGON',
    targetId: 'AG-L3-DOCS',
    chainIds: ['AG-L0-ARGON', 'AG-L1-PROD', 'AG-L2-BORE', 'AG-L3-DOCS'],
    activatedSubtreeIds: ['AG-L3-DOCS'],
    priority: 'STANDARD',
    stepTick: 2,
    outcomeSummary: '28 documents classés (APP-* vs JEU-*) avec garde-fous serveur HTTP 403.',
  },
]);

export const PRESET_CASCADE_DIRECTIVES: readonly {
  readonly label: string;
  readonly targetId: string;
  readonly directive: string;
  readonly priority: 'STANDARD' | 'ELEVATED' | 'CRITICAL';
}[] = Object.freeze([
  {
    label: 'Calibrer Rendu 3D Three.js AAA',
    targetId: 'AG-L3-3D-PBR',
    directive: 'Vérifier la parité SceneDiffPacket, ACES Filmic et les 10 Assets 3D Three.js PBR',
    priority: 'ELEVATED',
  },
  {
    label: 'Auditer Cache TanStack Query',
    targetId: 'AG-L3-TANSTACK',
    directive: 'Profiler les requêtes Oracle Dual-Pass et les filtres TanStack Table',
    priority: 'STANDARD',
  },
  {
    label: 'Contrôle Qualité Complet (Pôle QA)',
    targetId: 'AG-L2-BORE',
    directive: 'Exécuter le contrôle anti-régression complet (Tests, ESLint, RBAC)',
    priority: 'CRITICAL',
  },
  {
    label: 'Revue Ergonomie Mobile 360px',
    targetId: 'AG-L3-MOBILE',
    directive: 'Valider les cibles tactiles >= 44px sur Profil, Succès et Pyramide',
    priority: 'STANDARD',
  },
]);
