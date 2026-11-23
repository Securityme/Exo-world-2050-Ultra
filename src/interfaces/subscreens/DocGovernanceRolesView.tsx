import { useState } from 'react';
import { Lock, ShieldCheck, UserCog } from 'lucide-react';
import { ExoTooltip } from '../../components/bento/ExoTooltip.tsx';
import type {
  ContentTrack,
  GovernancePermission,
  GovernanceRoleId,
  RoleAssignment,
} from '../../contracts/doc-governance.schema.ts';
import { GOVERNANCE_ROLES_CATALOG } from '../../data/doc-governance.catalog.ts';
import { canManageRoles } from '../../systems/governance/doc-governance.engine.ts';

interface DocGovernanceRolesViewProps {
  readonly activeRole: GovernanceRoleId;
  readonly activeActorName: string;
  readonly assignments: readonly RoleAssignment[];
  readonly onChangeMemberRole: (memberId: string, newRoleId: GovernanceRoleId) => Promise<void>;
}

const PERMISSION_ROWS: readonly {
  readonly label: string;
  readonly track: ContentTrack | 'GLOBAL';
  readonly permission: GovernancePermission;
  readonly description: string;
}[] = [
  {
    label: 'Lecture (App, Skills, Jeu)',
    track: 'GLOBAL',
    permission: 'READ',
    description: 'Consulter tous les documents publiés, brouillons et journaux d’audit.',
  },
  {
    label: 'Création & Modification · Doc Application',
    track: 'APP_DOC',
    permission: 'EDIT',
    description: 'Rédiger et mettre à jour les notes de version, guides et spécifications techniques.',
  },
  {
    label: "Création & Modification · Compétences ('Skills')",
    track: 'SKILLS',
    permission: 'EDIT',
    description: "Concevoir et faire évoluer les compétences ('skills') et garde-fous d’exécution.",
  },
  {
    label: 'Création & Modification · Doc Jeu',
    track: 'GAME_DOC',
    permission: 'EDIT',
    description: 'Rédiger et modifier les règles, scénarios, matrices d’équilibrage et éléments de jeu.',
  },
  {
    label: 'Révision Technique (Application)',
    track: 'APP_DOC',
    permission: 'REVIEW_TECHNICAL',
    description: 'Contrôler la conformité L0-L8, SemVer et contrats avant approbation finale.',
  },
  {
    label: "Audit Compétences ('Skills')",
    track: 'SKILLS',
    permission: 'REVIEW_SKILLS',
    description: 'Auditer le périmètre, les garde-fous sécurité et les quotas Free Tier des skills.',
  },
  {
    label: 'Revue Règles & Contenu Jeu',
    track: 'GAME_DOC',
    permission: 'REVIEW_GAME',
    description: 'Vérifier les invariants gameplay (PA, 0-PA, R-50) et l’équilibrage des nouveaux éléments.',
  },
  {
    label: 'Demande de corrections',
    track: 'GLOBAL',
    permission: 'REQUEST_CHANGES',
    description: 'Renvoyer une soumission en correction avec un motif obligatoire tracé.',
  },
  {
    label: 'Validation finale & Publication',
    track: 'APP_DOC',
    permission: 'APPROVE_PUBLISH',
    description: 'Approuver la publication officielle après validation de 100 % des standards qualité.',
  },
  {
    label: 'Gestion des rôles & accès',
    track: 'GLOBAL',
    permission: 'MANAGE_ROLES',
    description: 'Attribuer, modifier ou révoquer les rôles des membres dans le registre d’accès.',
  },
];

const ACCESS_PROCESS_STEPS = [
  {
    step: '01. Attribution au moindre privilège',
    detail:
      'Chaque contributeur reçoit uniquement les droits de sa filière : les auteurs jeu agissent sur le pôle Jeu (JEU-*), les ingénieurs sur le pôle Application et les Skills (APP-*).',
  },
  {
    step: '02. Séparation des tâches obligatoire',
    detail:
      'Aucun rédacteur ne peut auto-réviser sa propre modification. Une révision indépendante par un Réviseur Qualité (ou validation finale par l’Approbateur Maître) est imposée côté serveur.',
  },
  {
    step: '03. Contrôle serveur systématique',
    detail:
      'Chaque création, modification, transition de statut ou changement de rôle est re-vérifié sur /api/governance. Toute action non autorisée renvoie un refus explicite HTTP 403.',
  },
  {
    step: '04. Revue périodique & révocation immédiate',
    detail:
      'Les attributions sont auditées à chaque version mineure. L’Approbateur Maître peut rétrograder un compte vers Lecteur à tout moment avec horodatage immédiat.',
  },
] as const;

export function DocGovernanceRolesView({
  activeRole,
  activeActorName,
  assignments,
  onChangeMemberRole,
}: DocGovernanceRolesViewProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const roleManageCheck = canManageRoles(activeRole);

  const handleSelectRole = async (memberId: string, newRoleId: GovernanceRoleId) => {
    setUpdatingId(memberId);
    try {
      await onChangeMemberRole(memberId, newRoleId);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6" data-testid="governance-roles-view">
      {/* 1. RBAC Permissions Matrix */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b exo-accent-border pb-2">
          <div>
            <h3 className="font-display text-base font-bold text-[var(--exo-text)]">
              Matrice des Rôles &amp; Permissions (RBAC)
            </h3>
            <p className="text-xs exo-muted-text">
              Lecture, modification, révision spécialisée et validation finale par filière (Application, Skills, Jeu).
            </p>
          </div>
          <span className="font-mono-num text-xs exo-muted-text">
            {GOVERNANCE_ROLES_CATALOG.length} rôles · {PERMISSION_ROWS.length} permissions clés
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border exo-accent-border bg-[var(--exo-surface)]">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b exo-accent-border bg-[var(--exo-surface-alt)] text-[var(--exo-text)]">
                <th className="px-3.5 py-2.5 font-semibold">Permission &amp; Périmètre</th>
                {GOVERNANCE_ROLES_CATALOG.map((role) => (
                  <th
                    key={role.id}
                    className={`px-2.5 py-2.5 text-center font-semibold whitespace-nowrap ${
                      role.id === activeRole ? 'exo-accent-text' : ''
                    }`}
                  >
                    <ExoTooltip title={role.label} body={`${role.summary} ${role.separationRule}`} position="bottom">
                      <span className="cursor-help underline decoration-dotted underline-offset-4">
                        {role.shortLabel}
                      </span>
                    </ExoTooltip>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(var(--exo-accent-rgb),0.16)]">
              {PERMISSION_ROWS.map((row) => (
                <tr key={`${row.track}-${row.permission}`} className="hover:bg-[var(--exo-surface-alt)]/50">
                  <td className="px-3.5 py-2.5">
                    <div className="font-medium text-[var(--exo-text)]">{row.label}</div>
                    <div className="text-[11px] exo-muted-text">{row.description}</div>
                  </td>
                  {GOVERNANCE_ROLES_CATALOG.map((role) => {
                    const granted =
                      row.track === 'GLOBAL'
                        ? role.globalPermissions.includes(row.permission)
                        : role.permissionsByTrack[row.track].includes(row.permission) ||
                          role.globalPermissions.includes(row.permission);
                    return (
                      <td key={role.id} className="px-2.5 py-2.5 text-center font-mono-num">
                        {granted ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Autorisé</span>
                        ) : (
                          <span className="exo-muted-text opacity-55">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Role Assignments Directory */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b exo-accent-border pb-2">
          <div>
            <h3 className="font-display text-base font-bold text-[var(--exo-text)]">
              Registre des Accès &amp; Attributions Actives
            </h3>
            <p className="text-xs exo-muted-text">
              {roleManageCheck.allowed
                ? `Connecté en tant que ${activeActorName} : vous pouvez ajuster les rôles des membres.`
                : 'Consultation seule : passez au rôle Approbateur Maître pour modifier les attributions.'}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 font-mono-num text-xs exo-muted-text">
            {roleManageCheck.allowed ? (
              <UserCog className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Lock className="h-3.5 w-3.5 exo-accent-text" />
            )}
            <span>{roleManageCheck.allowed ? 'Administration active' : 'Modification verrouillée'}</span>
          </span>
        </div>

        <div className="divide-y divide-[rgba(var(--exo-accent-rgb),0.18)] rounded-xl border exo-accent-border bg-[var(--exo-surface)]">
          {assignments.map((member) => {
            const roleSpec = GOVERNANCE_ROLES_CATALOG.find((r) => r.id === member.roleId);
            return (
              <div
                key={member.memberId}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-[var(--exo-text)]">{member.displayName}</span>
                    <span aria-hidden="true" className="exo-muted-text">·</span>
                    <span className="font-mono-num text-xs exo-accent-text">{roleSpec?.shortLabel ?? member.roleId}</span>
                  </div>
                  <div className="mt-0.5 text-xs exo-muted-text">
                    {member.scopeLabel} · Attribué par {member.assignedBy} ({member.assignedAtIso.slice(0, 10)})
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="sr-only" htmlFor={`role-select-${member.memberId}`}>
                    Rôle de {member.displayName}
                  </label>
                  <select
                    id={`role-select-${member.memberId}`}
                    value={member.roleId}
                    disabled={!roleManageCheck.allowed || updatingId === member.memberId}
                    onChange={(e) => void handleSelectRole(member.memberId, e.target.value as GovernanceRoleId)}
                    className="min-h-[44px] rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-3 text-xs font-medium text-[var(--exo-text)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {GOVERNANCE_ROLES_CATALOG.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Documented Access Management Process */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 border-b exo-accent-border pb-2">
          <ShieldCheck className="h-4 w-4 exo-accent-text" />
          <h3 className="font-display text-base font-bold text-[var(--exo-text)]">
            Processus Officiel de Gestion des Accès (DOC-APP-GOV-001)
          </h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {ACCESS_PROCESS_STEPS.map((item) => (
            <div
              key={item.step}
              className="rounded-xl border exo-accent-border bg-[var(--exo-surface)] p-4"
            >
              <div className="font-display text-sm font-bold text-[var(--exo-text)]">{item.step}</div>
              <p className="mt-1.5 text-xs leading-relaxed exo-muted-text">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
