import { AppWindow, CheckCircle2, Gamepad2, Layers } from 'lucide-react';
import type { GovernedDocument } from '../../contracts/doc-governance.schema.ts';
import {
  DOC_CATEGORIES_CATALOG,
  QUALITY_STANDARDS_CATALOG,
} from '../../data/doc-governance.catalog.ts';

interface DocGovernanceTaxonomyViewProps {
  readonly documents: readonly GovernedDocument[];
  readonly onFilterByCategory: (categoryCode: string, domain: 'APP' | 'GAME') => void;
}

const WORKFLOW_TRACKS = [
  {
    id: 'APP_DOC' as const,
    title: '01. Documentation Technique & Guides Application',
    categories: 'APP-UPD · APP-GUI · APP-TEC',
    reviewerStep: 'Révision Technique (TECH_REVIEW)',
    authorRole: 'Ingénieur App & Mainteneur Skills',
    reviewerRole: 'Réviseur Qualité (indépendant)',
    approverRole: 'Approbateur Maître',
  },
  {
    id: 'SKILLS' as const,
    title: "02. Améliorations des Compétences ('Skills')",
    categories: 'APP-SKL',
    reviewerStep: 'Audit Compétences (SKILLS_REVIEW)',
    authorRole: 'Ingénieur App & Mainteneur Skills',
    reviewerRole: 'Réviseur Qualité (Audit sécurité & périmètre)',
    approverRole: 'Approbateur Maître',
  },
  {
    id: 'GAME_DOC' as const,
    title: '03. Nouveaux Éléments de Jeu, Règles & Scénarios',
    categories: 'JEU-REG · JEU-SCE · JEU-BAL · JEU-VIS',
    reviewerStep: 'Revue Règles & Équilibrage (GAME_REVIEW)',
    authorRole: 'Concepteur & Rédacteur Jeu',
    reviewerRole: 'Réviseur Qualité (Invariants PA, 0-PA & R-50)',
    approverRole: 'Approbateur Maître',
  },
] as const;

export function DocGovernanceTaxonomyView({
  documents,
  onFilterByCategory,
}: DocGovernanceTaxonomyViewProps) {
  const appCategories = DOC_CATEGORIES_CATALOG.filter((c) => c.domain === 'APP');
  const gameCategories = DOC_CATEGORIES_CATALOG.filter((c) => c.domain === 'GAME');

  return (
    <div className="space-y-6" data-testid="governance-taxonomy-view">
      {/* Side-by-Side Separated Classification Plan: Application vs Game */}
      <section className="space-y-3">
        <div className="border-b exo-accent-border pb-2">
          <h3 className="font-display text-base font-bold text-[var(--exo-text)]">
            Plan de Classement Séparé : Application vs Jeu
          </h3>
          <p className="text-xs exo-muted-text">
            Chaque document reçoit un code normalisé &lt;POLE&gt;-&lt;CATEGORIE&gt;-&lt;NNN&gt; pour séparer strictement
            l’ingénierie applicative des règles et scénarios du jeu.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Pôle Application */}
          <div className="space-y-3 rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-4">
            <div className="flex items-center justify-between border-b exo-accent-border pb-2.5">
              <div className="flex items-center gap-2">
                <AppWindow className="h-4 w-4 exo-accent-text" />
                <h4 className="font-display text-sm font-bold text-[var(--exo-text)]">
                  Pôle A · Documentation Application (APP)
                </h4>
              </div>
              <span className="font-mono-num text-xs exo-muted-text">
                {documents.filter((d) => d.domain === 'APP').length} entrées
              </span>
            </div>

            <div className="divide-y divide-[rgba(var(--exo-accent-rgb),0.16)]">
              {appCategories.map((cat) => {
                const count = documents.filter((d) => d.categoryCode === cat.code).length;
                return (
                  <div key={cat.code} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono-num font-bold exo-accent-text">{cat.code}</span>
                        <span aria-hidden="true" className="exo-muted-text">·</span>
                        <span className="font-semibold text-[var(--exo-text)]">{cat.label}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed exo-muted-text">{cat.description}</p>
                      <div className="mt-1 font-mono-num text-[10.5px] exo-muted-text">
                        {cat.filingConvention} · Étape : {cat.reviewStageLabel}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onFilterByCategory(cat.code, 'APP')}
                      className="exo-accent-chip inline-flex min-h-[44px] shrink-0 items-center px-3 font-mono-num text-xs font-semibold whitespace-nowrap"
                    >
                      Voir ({count})
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pôle Jeu */}
          <div className="space-y-3 rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-4">
            <div className="flex items-center justify-between border-b exo-accent-border pb-2.5">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 exo-accent-2-text" />
                <h4 className="font-display text-sm font-bold text-[var(--exo-text)]">
                  Pôle B · Documentation du Jeu (GAME)
                </h4>
              </div>
              <span className="font-mono-num text-xs exo-muted-text">
                {documents.filter((d) => d.domain === 'GAME').length} entrées
              </span>
            </div>

            <div className="divide-y divide-[rgba(var(--exo-accent-rgb),0.16)]">
              {gameCategories.map((cat) => {
                const count = documents.filter((d) => d.categoryCode === cat.code).length;
                return (
                  <div key={cat.code} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono-num font-bold exo-accent-2-text">{cat.code}</span>
                        <span aria-hidden="true" className="exo-muted-text">·</span>
                        <span className="font-semibold text-[var(--exo-text)]">{cat.label}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed exo-muted-text">{cat.description}</p>
                      <div className="mt-1 font-mono-num text-[10.5px] exo-muted-text">
                        {cat.filingConvention} · Étape : {cat.reviewStageLabel}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onFilterByCategory(cat.code, 'GAME')}
                      className="exo-accent-chip inline-flex min-h-[44px] shrink-0 items-center px-3 font-mono-num text-xs font-semibold whitespace-nowrap"
                    >
                      Voir ({count})
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3-Track Validation Workflow & Quality Standards */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 border-b exo-accent-border pb-2">
          <Layers className="h-4 w-4 exo-accent-text" />
          <h3 className="font-display text-base font-bold text-[var(--exo-text)]">
            Filières de Validation &amp; Standards de Conformité Requis
          </h3>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {WORKFLOW_TRACKS.map((track) => {
            const standards = QUALITY_STANDARDS_CATALOG.filter((s) => s.track === track.id);
            return (
              <div
                key={track.id}
                className="flex flex-col justify-between space-y-3 rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-4"
              >
                <div className="space-y-2">
                  <h4 className="font-display text-sm font-bold text-[var(--exo-text)]">{track.title}</h4>
                  <div className="font-mono-num text-[11px] exo-accent-text">{track.categories}</div>
                  <dl className="space-y-1 text-xs exo-muted-text">
                    <div>
                      <dt className="inline font-semibold text-[var(--exo-text)]">Rédaction : </dt>
                      <dd className="inline">{track.authorRole}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold text-[var(--exo-text)]">Révision : </dt>
                      <dd className="inline">{track.reviewerStep} ({track.reviewerRole})</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold text-[var(--exo-text)]">Publication : </dt>
                      <dd className="inline">{track.approverRole}</dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-1.5 border-t exo-accent-border pt-2.5">
                  <div className="text-[11px] font-semibold text-[var(--exo-text)]">
                    Standards obligatoires avant publication
                  </div>
                  <ul className="space-y-1.5 text-[11px] exo-muted-text">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>5 contrôles auto : Classement, SemVer, R-50/Z0, Zéro Secret, Structure.</span>
                    </li>
                    {standards.map((std) => (
                      <li key={std.id} className="flex items-start gap-1.5">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 exo-accent-text" />
                        <span>{std.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
