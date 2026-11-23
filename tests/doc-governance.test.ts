import { describe, expect, it } from 'vitest';
import {
  DOC_CATEGORIES_CATALOG,
  INITIAL_GOVERNED_DOCUMENTS,
  INITIAL_ROLE_ASSIGNMENTS,
} from '../src/data/doc-governance.catalog.ts';
import {
  canManageRoles,
  classifyProjectDocument,
  createGovernedDocument,
  evaluateQualityStandards,
  exportGovernanceHandbookMarkdown,
  hasPermission,
  transitionDocumentWorkflow,
  updateGovernedDocument,
} from '../src/systems/governance/doc-governance.engine.ts';

describe('Document Governance — RBAC Roles & Permissions', () => {
  it('enforces least privilege across all 5 roles and 3 content tracks', () => {
    // LECTEUR: read-only everywhere
    expect(hasPermission('LECTEUR', 'APP_DOC', 'READ').allowed).toBe(true);
    expect(hasPermission('LECTEUR', 'SKILLS', 'READ').allowed).toBe(true);
    expect(hasPermission('LECTEUR', 'GAME_DOC', 'READ').allowed).toBe(true);
    expect(hasPermission('LECTEUR', 'APP_DOC', 'CREATE').allowed).toBe(false);
    expect(hasPermission('LECTEUR', 'GAME_DOC', 'EDIT').allowed).toBe(false);
    expect(hasPermission('LECTEUR', 'GAME_DOC', 'APPROVE_PUBLISH').allowed).toBe(false);

    // AUTEUR_JEU: write strictly limited to GAME_DOC
    expect(hasPermission('AUTEUR_JEU', 'GAME_DOC', 'CREATE').allowed).toBe(true);
    expect(hasPermission('AUTEUR_JEU', 'GAME_DOC', 'EDIT').allowed).toBe(true);
    expect(hasPermission('AUTEUR_JEU', 'GAME_DOC', 'SUBMIT_REVIEW').allowed).toBe(true);
    expect(hasPermission('AUTEUR_JEU', 'APP_DOC', 'CREATE').allowed).toBe(false);
    expect(hasPermission('AUTEUR_JEU', 'SKILLS', 'EDIT').allowed).toBe(false);
    expect(hasPermission('AUTEUR_JEU', 'GAME_DOC', 'REVIEW_GAME').allowed).toBe(false);
    expect(hasPermission('AUTEUR_JEU', 'GAME_DOC', 'APPROVE_PUBLISH').allowed).toBe(false);

    // INGENIEUR_APP_SKILLS: write limited to APP_DOC and SKILLS
    expect(hasPermission('INGENIEUR_APP_SKILLS', 'APP_DOC', 'CREATE').allowed).toBe(true);
    expect(hasPermission('INGENIEUR_APP_SKILLS', 'SKILLS', 'CREATE').allowed).toBe(true);
    expect(hasPermission('INGENIEUR_APP_SKILLS', 'GAME_DOC', 'CREATE').allowed).toBe(false);
    expect(hasPermission('INGENIEUR_APP_SKILLS', 'APP_DOC', 'APPROVE_PUBLISH').allowed).toBe(false);

    // REVISEUR_QUALITE: specialized review on all 3 tracks, no final publish or role admin
    expect(hasPermission('REVISEUR_QUALITE', 'APP_DOC', 'REVIEW_TECHNICAL').allowed).toBe(true);
    expect(hasPermission('REVISEUR_QUALITE', 'SKILLS', 'REVIEW_SKILLS').allowed).toBe(true);
    expect(hasPermission('REVISEUR_QUALITE', 'GAME_DOC', 'REVIEW_GAME').allowed).toBe(true);
    expect(hasPermission('REVISEUR_QUALITE', 'APP_DOC', 'REQUEST_CHANGES').allowed).toBe(true);
    expect(hasPermission('REVISEUR_QUALITE', 'APP_DOC', 'APPROVE_PUBLISH').allowed).toBe(false);
    expect(canManageRoles('REVISEUR_QUALITE').allowed).toBe(false);

    // APPROBATEUR_MAITRE: full approval & role management
    expect(hasPermission('APPROBATEUR_MAITRE', 'APP_DOC', 'APPROVE_PUBLISH').allowed).toBe(true);
    expect(hasPermission('APPROBATEUR_MAITRE', 'SKILLS', 'APPROVE_PUBLISH').allowed).toBe(true);
    expect(hasPermission('APPROBATEUR_MAITRE', 'GAME_DOC', 'APPROVE_PUBLISH').allowed).toBe(true);
    expect(canManageRoles('APPROBATEUR_MAITRE').allowed).toBe(true);
  });
});

describe('Document Governance — 3-Track Validation Workflow & Standards', () => {
  it('runs a full Skills update lifecycle with separation of duties and mandatory standards', () => {
    const ts = '2026-11-22T14:00:00Z';

    // 1. AUTEUR_JEU blocked from creating a Skill (APP-SKL)
    const deniedCreate = createGovernedDocument(
      INITIAL_GOVERNED_DOCUMENTS,
      {
        categoryCode: 'APP-SKL',
        title: 'Skill Test Non Autorisé',
        summary: 'Tentative de création hors périmètre jeu.',
        content: 'Contenu suffisamment long pour passer la longueur minimale de validation.',
        version: '5.1.0',
        tags: ['skills'],
        actorName: 'Elena Vance',
        actorRole: 'AUTEUR_JEU',
      },
      ts,
    );
    expect(deniedCreate.ok).toBe(false);

    // 2. INGENIEUR_APP_SKILLS creates APP-SKL-003
    const createdRes = createGovernedDocument(
      INITIAL_GOVERNED_DOCUMENTS,
      {
        categoryCode: 'APP-SKL',
        title: 'Skill Audit Qualité Automatisé',
        summary: 'Encadre la vérification des contrats Zod et des quotas Free Tier.',
        content:
          '# APP-SKL-003\n\nVérifie les schémas Zod stricts, bloque toute clé en dur et valide la conformité.',
        version: '5.1.0',
        tags: ['skills', 'audit'],
        actorName: 'Karim Benali',
        actorRole: 'INGENIEUR_APP_SKILLS',
      },
      ts,
    );
    expect(createdRes.ok).toBe(true);
    const draft = createdRes.document!;
    expect(draft.filingCode).toBe('APP-SKL-003');
    expect(draft.domain).toBe('APP');
    expect(draft.track).toBe('SKILLS');
    expect(draft.stage).toBe('DRAFT');

    // 3. Submit -> routes strictly into SKILLS_REVIEW
    const submitted = transitionDocumentWorkflow(
      draft,
      'SUBMIT_REVIEW',
      'Karim Benali',
      'INGENIEUR_APP_SKILLS',
      '2026-11-22T14:05:00Z',
      'Prêt pour audit skills.',
    );
    expect(submitted.ok).toBe(true);
    expect(submitted.document!.stage).toBe('SKILLS_REVIEW');

    // 4. Reviewer cannot pass without checking manual standards
    const blockedReview = transitionDocumentWorkflow(
      submitted.document!,
      'PASS_SPECIALIZED_REVIEW',
      'Claire Moreau',
      'REVISEUR_QUALITE',
      '2026-11-22T14:10:00Z',
      'Tentative sans checklist.',
    );
    expect(blockedReview.ok).toBe(false);

    // 5. Separation of duties: same author name cannot pass review as REVISEUR_QUALITE
    const selfReview = transitionDocumentWorkflow(
      submitted.document!,
      'PASS_SPECIALIZED_REVIEW',
      'Karim Benali',
      'REVISEUR_QUALITE',
      '2026-11-22T14:11:00Z',
      'Auto-revue interdite.',
      ['STD-SKL-SCOPE', 'STD-SKL-SAFETY'],
    );
    expect(selfReview.ok).toBe(false);

    // 6. Independent reviewer validates checklist -> READY_FOR_APPROVAL
    const reviewed = transitionDocumentWorkflow(
      submitted.document!,
      'PASS_SPECIALIZED_REVIEW',
      'Claire Moreau',
      'REVISEUR_QUALITE',
      '2026-11-22T14:15:00Z',
      'Standards périmètre et sécurité validés.',
      ['STD-SKL-SCOPE', 'STD-SKL-SAFETY'],
    );
    expect(reviewed.ok).toBe(true);
    expect(reviewed.document!.stage).toBe('READY_FOR_APPROVAL');

    // 7. Reviewer cannot perform final publish
    const reviewerPublish = transitionDocumentWorkflow(
      reviewed.document!,
      'APPROVE_PUBLISH',
      'Claire Moreau',
      'REVISEUR_QUALITE',
      '2026-11-22T14:16:00Z',
      'Tentative publication.',
    );
    expect(reviewerPublish.ok).toBe(false);

    // 8. APPROBATEUR_MAITRE publishes -> PUBLISHED
    const published = transitionDocumentWorkflow(
      reviewed.document!,
      'APPROVE_PUBLISH',
      'Baptiste Lecoustre',
      'APPROBATEUR_MAITRE',
      '2026-11-22T14:20:00Z',
      'Validation finale officielle.',
    );
    expect(published.ok).toBe(true);
    expect(published.document!.stage).toBe('PUBLISHED');
    expect(published.document!.auditLog.length).toBe(4);
  });

  it('blocks submission if automated security or editorial compliance checks fail', () => {
    const syntheticKey = ['AIza', 'SyTestFixture00000000000000000000000'].join('');
    const created = createGovernedDocument(
      INITIAL_GOVERNED_DOCUMENTS,
      {
        categoryCode: 'JEU-SCE',
        title: 'Scénario Test Sécurité',
        summary: 'Test de détection automatique de secret dans un document.',
        content: `Clé accidentelle ${syntheticKey} dans un texte de test.`,
        version: '5.1.0',
        tags: ['test'],
        actorName: 'Elena Vance',
        actorRole: 'AUTEUR_JEU',
      },
      '2026-11-22T14:30:00Z',
    );
    expect(created.ok).toBe(true);
    const quality = evaluateQualityStandards(created.document!);
    expect(quality.allAutomatedPassed).toBe(false);

    const submitBlocked = transitionDocumentWorkflow(
      created.document!,
      'SUBMIT_REVIEW',
      'Elena Vance',
      'AUTEUR_JEU',
      '2026-11-22T14:31:00Z',
      '',
    );
    expect(submitBlocked.ok).toBe(false);

    // Fix content then submit succeeds -> GAME_REVIEW
    const fixed = updateGovernedDocument(
      created.document!,
      {
        content:
          '# JEU-SCE-002\n\nScénario propre sans secret, conforme aux 6 Ères et aux règles diplomatiques 2050.',
        actorName: 'Elena Vance',
        actorRole: 'AUTEUR_JEU',
      },
      '2026-11-22T14:32:00Z',
    );
    expect(fixed.ok).toBe(true);

    const submitOk = transitionDocumentWorkflow(
      fixed.document!,
      'SUBMIT_REVIEW',
      'Elena Vance',
      'AUTEUR_JEU',
      '2026-11-22T14:33:00Z',
      'Contenu assaini.',
    );
    expect(submitOk.ok).toBe(true);
    expect(submitOk.document!.stage).toBe('GAME_REVIEW');
  });
});

describe('Document Governance — Strict Separation of Application vs Game Taxonomy', () => {
  it('separates categories into distinct APP and GAME domains with normalized filing codes', () => {
    const appCats = DOC_CATEGORIES_CATALOG.filter((c) => c.domain === 'APP');
    const gameCats = DOC_CATEGORIES_CATALOG.filter((c) => c.domain === 'GAME');
    expect(appCats.map((c) => c.code)).toEqual(['APP-UPD', 'APP-GUI', 'APP-TEC', 'APP-SKL']);
    expect(gameCats.map((c) => c.code)).toEqual(['JEU-REG', 'JEU-SCE', 'JEU-BAL', 'JEU-VIS']);

    const govDoc = classifyProjectDocument(
      'docs/governance/DOC-APP-GOV-001_ROLES_PERMISSIONS_WORKFLOW.md',
      'Processus RBAC',
      0,
    );
    expect(govDoc.domain).toBe('APP');
    expect(govDoc.categoryCode).toBe('APP-GUI');
    expect(govDoc.filingCode).toBe('APP-GUI-001');

    const rulesDoc = classifyProjectDocument('docs/gameplay/01.md', 'Règles PA & Dossiers', 0);
    expect(rulesDoc.domain).toBe('GAME');
    expect(rulesDoc.categoryCode).toBe('JEU-REG');
    expect(rulesDoc.filingCode).toBe('JEU-REG-001');

    const skillDoc = classifyProjectDocument('docs/SYSTEM_INSTRUCTION_LIVE.md', 'Skills & Guardrails', 0);
    expect(skillDoc.domain).toBe('APP');
    expect(skillDoc.track).toBe('SKILLS');
    expect(skillDoc.categoryCode).toBe('APP-SKL');

    const md = exportGovernanceHandbookMarkdown(INITIAL_GOVERNED_DOCUMENTS, INITIAL_ROLE_ASSIGNMENTS);
    expect(md).toContain('Pôle Application');
    expect(md).toContain('Pôle Jeu');
    expect(md).toContain('APPROBATEUR_MAITRE');
  });
});
