/**
 * [L1] EXW.L1.WORKFLOW_DUAL_TRACKS_CATALOG | v5.1.0 | SADT A5.4
 * Frozen specifications contrasting the two isolated engineering & documentation workflows:
 * - Track A: Application Core Documentation (Google Drive / Docs + Dedicated Doc VCS)
 * - Track B: Application & Game Code / 3D Assets (Git / CI / Quality Gates / Unity Sync)
 * Plus honest capability matrix for Live Preview ↔ AI Studio ↔ Antigravity ↔ Swarm communication.
 */

export interface DualWorkflowStepSpec {
  readonly stepNumber: number;
  readonly id: string;
  readonly title: string;
  readonly actorRole: string;
  readonly gateRule: string;
  readonly artifactProduced: string;
}

export interface DualWorkflowTrackSpec {
  readonly id: 'TRACK_A_DRIVE_DOCS' | 'TRACK_B_APP_GAME_CODE';
  readonly badge: string;
  readonly title: string;
  readonly subtitle: string;
  readonly vcsBranchName: string;
  readonly sourceOfTruthSurface: string;
  readonly releaseCadence: string;
  readonly steps: readonly DualWorkflowStepSpec[];
}

export interface PreviewBridgeChannelSpec {
  readonly id: string;
  readonly name: string;
  readonly direction: string;
  readonly transport: string;
  readonly status: 'LIVE_ACTIVE' | 'AUTH_OAUTH' | 'USER_HANDOFF_REQUIRED';
  readonly capabilitySummary: string;
  readonly securityBoundary: string;
}

export const DUAL_WORKFLOW_TRACKS_CATALOG: readonly DualWorkflowTrackSpec[] = Object.freeze([
  {
    id: 'TRACK_A_DRIVE_DOCS',
    badge: 'FLUX A · DOCS APPLICATION (DRIVE / DOCS VCS)',
    title: 'Mise à jour Documentation Application & Skills',
    subtitle:
      'Gérée via Google Drive, Google Docs et le registre VCS documentaire dédié (séparé des commits de code).',
    vcsBranchName: 'docs/drive-sovereign',
    sourceOfTruthSurface: 'Google Drive Maître + Google Docs + Registre VCS Docs',
    releaseCadence: 'Asynchrone & indépendante du cycle de build applicatif',
    steps: [
      {
        stepNumber: 1,
        id: 'DA-01',
        title: 'Lecture & Extraction Drive / Picker',
        actorRole: 'Ingénieur App & Mainteneur Skills',
        gateRule: 'Jeton OAuth en mémoire uniquement · Sélection ciblée Google Picker',
        artifactProduced: 'Brouillon APP-UPD / APP-GUI / APP-TEC / APP-SKL',
      },
      {
        stepNumber: 2,
        id: 'DA-02',
        title: 'Commit Documentaire & Contrôles Auto',
        actorRole: 'Moteur Pur Doc VCS + Garde-fous L0/L3',
        gateRule: 'Classement APP-*, SemVer valide, Zéro Secret API, Conformité R-50/Z0',
        artifactProduced: 'Snapshot SHA-256 sur branche docs/drive-sovereign',
      },
      {
        stepNumber: 3,
        id: 'DA-03',
        title: 'Révision Technique ou Audit Skills',
        actorRole: 'Réviseur Qualité (indépendant de l’auteur)',
        gateRule: 'Séparation stricte des tâches + 100 % des critères manuels cochés',
        artifactProduced: 'Transition TECH_REVIEW / SKILLS_REVIEW → READY_FOR_APPROVAL',
      },
      {
        stepNumber: 4,
        id: 'DA-04',
        title: 'Approbation Maître & Tag Documentaire',
        actorRole: 'Approbateur Maître (Gouvernance R-25)',
        gateRule: 'Validation finale HTTP 200 côté serveur (/api/governance)',
        artifactProduced: 'Statut PUBLISHED + Tag SemVer documentaire signé',
      },
      {
        stepNumber: 5,
        id: 'DA-05',
        title: 'Écriture Confirmée Google Docs (batchUpdate)',
        actorRole: 'Opérateur authentifié (confirmation UI explicite)',
        gateRule: 'Modale de confirmation explicite avant toute écriture Drive/Docs',
        artifactProduced: 'Commit DRIVE_PATCH_SYNC + mise à jour miroir BUS-EXW-001',
      },
    ],
  },
  {
    id: 'TRACK_B_APP_GAME_CODE',
    badge: 'FLUX B · CODE APPLICATIF, JEU & ASSETS 3D (GIT / CI)',
    title: 'Mise à jour Code Source, Règles Jeu & Modèles 3D',
    subtitle:
      'Pipeline d’ingénierie strictement séparé des documents Drive : code L0→L8, tests déterministes, 3D PBR et parité GitHub/Unity.',
    vcsBranchName: 'main / feat/FUP-XXX',
    sourceOfTruthSurface: 'Google AI Studio Build ↔ GitHub Ultra ↔ Antigravity IDE',
    releaseCadence: 'Portes bloquantes 5/5 avant Push GitHub & déploiement Preview',
    steps: [
      {
        stepNumber: 1,
        id: 'CB-01',
        title: 'Spécification Couche L0→L8 & Règles Jeu',
        actorRole: 'Concepteur Jeu + Essaim N1/N2 (Hydrogène / Néon)',
        gateRule: 'Contrats Zod L0 stricts, invariants PA / 0-PA / ±15 % & préfixes JEU-*',
        artifactProduced: 'Schémas TypeScript + catalogues gelés L1 + doc JEU-*',
      },
      {
        stepNumber: 2,
        id: 'CB-02',
        title: 'Implémentation Noyau Pur, UI V7 & 3D PBR',
        actorRole: 'Agents Exécution N3 (SIM, UNITY, TANSTACK, MOBILE)',
        gateRule: '0 Math.random/Date.now/DOM en L2/L3 · Cibles >= 44px · 0 cycle Kahn',
        artifactProduced: 'Modules src/ + Prefabs Unity mappés via SceneDiffPacket',
      },
      {
        stepNumber: 3,
        id: 'CB-03',
        title: 'Portes Statiques & Tests Automatisés',
        actorRole: 'Chef de Pôle QA Bore & N3 · QA-AUDIT',
        gateRule: 'tsc --noEmit (0 err), eslint src (0 err), node:test & Vitest 100 % verts',
        artifactProduced: 'Preuve de déterminisme SHA-256 et non-régression',
      },
      {
        stepNumber: 4,
        id: 'CB-04',
        title: 'Inspection Visuelle Navigateur Headless',
        actorRole: 'Playwright Chromium (1440×900 & 390×844)',
        gateRule: '0 erreur console/réseau, contraste WCAG AA, rendu WebGL & mobile valides',
        artifactProduced: 'Captures & snapshots DOM vérifiés avant livraison',
      },
      {
        stepNumber: 5,
        id: 'CB-05',
        title: 'Build Production & Parité Multi-Surfaces',
        actorRole: 'Approbateur Maître + Export GitHub / Antigravity',
        gateRule: 'compile_applet (vite build) vert + sync commit GitHub main',
        artifactProduced: 'Build déployé sur Preview Dev/Shared + baseline GitHub à jour',
      },
    ],
  },
]);

export const PREVIEW_BRIDGE_CHANNELS: readonly PreviewBridgeChannelSpec[] = Object.freeze([
  {
    id: 'EXPRESS_SWARM_BUS',
    name: 'Bus Express Live (/api/swarm-bus)',
    direction: 'Preview App ↔ Backend BFF Node/Express',
    transport: 'HTTP JSON + Validation Zod + Stockage session serveur',
    status: 'LIVE_ACTIVE',
    capabilitySummary:
      'Génère et trace en temps réel les tickets de handoff [EXO-SWARM-HANDOFF], l’état du VCS documentaire et les cibles agents N0–N3.',
    securityBoundary:
      'Accessible localement et depuis les outils autorisés sur l’URL Preview ; aucune écriture arbitraire sur disque utilisateur.',
  },
  {
    id: 'GOOGLE_DRIVE_BUS_EXW',
    name: 'Canal Asynchrone Drive (BUS-EXW-001)',
    direction: 'Preview App ↔ Google Drive Maître ↔ Antigravity / Gemini Lead',
    transport: 'OAuth 2.0 Client-Side + Google Picker / Docs batchUpdate',
    status: 'AUTH_OAUTH',
    capabilitySummary:
      'Permet à l’utilisateur authentifié de pousser une décision ou un ticket directement dans les Google Docs partagés que lit Antigravity.',
    securityBoundary:
      'Le jeton OAuth reste exclusivement en mémoire navigateur ; chaque écriture exige une confirmation explicite.',
  },
  {
    id: 'IFRAME_POSTMESSAGE',
    name: 'Pont Window / Clipboard Handoff',
    direction: 'Iframe Preview ↔ AI Studio Assistant / Antigravity IDE',
    transport: 'window.parent.postMessage + Bundle Markdown/JSON prêt à coller',
    status: 'USER_HANDOFF_REQUIRED',
    capabilitySummary:
      'Prépare un paquet contextuel complet (branche VCS Docs, hash, fichiers cibles, prompt structuré) copiable en 1 clic vers AI Studio ou Antigravity.',
    securityBoundary:
      'Par sécurité navigateur (Same-Origin / sandbox iframe), une app en Preview ne peut jamais piloter ni injecter directement le prompt AI Studio ou les fichiers locaux Antigravity sans action utilisateur.',
  },
]);
