import { useMemo, useState } from 'react';
import { BookOpen, Cpu, Power, Save, SlidersHorizontal } from 'lucide-react';
import type {
  DocVcsStoreState,
  ModularSkillSpec,
  SkillDomain,
} from '../../contracts/skills-vcs.schema.ts';
import { updateModularSkillRegistry } from '../../services/governance/docs-vcs.service.ts';
import type { SemverBumpKind } from '../../systems/governance/skills-vcs.engine.ts';

interface ModularSkillsRegistryPanelProps {
  readonly vcsState: DocVcsStoreState;
  readonly onStateChange: (next: DocVcsStoreState) => void;
  readonly onOpenLinkedDoc: (docId: string) => void;
}

const DOMAIN_TABS: readonly { readonly id: 'ALL' | SkillDomain; readonly label: string }[] = [
  { id: 'ALL', label: 'Tous (9)' },
  { id: 'APP', label: 'Skills App' },
  { id: 'GAME_WORLD', label: 'Jeu · Monde & Diplomatie' },
  { id: 'GAME_ETHICS', label: 'Jeu · Éthique & Discernement' },
  { id: 'NARRATIVE', label: 'Narratif & Cascade 0 USD' },
];

/**
 * [L7] EXW.L7.MODULAR_SKILLS_REGISTRY_PANEL | v5.1.0 | <= 220 lines (R-14)
 * Strictly decoupled Autonomous Modular Skills registry.
 * Updating/toggling/bumping a Skill NEVER touches documentation revisions.
 */
export function ModularSkillsRegistryPanel({
  vcsState,
  onStateChange,
  onOpenLinkedDoc,
}: ModularSkillsRegistryPanelProps) {
  const [domainFilter, setDomainFilter] = useState<'ALL' | SkillDomain>('ALL');
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [configDraft, setConfigDraft] = useState<string>('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filteredSkills = useMemo(
    () =>
      domainFilter === 'ALL'
        ? vcsState.skills
        : vcsState.skills.filter((s) => s.domain === domainFilter),
    [vcsState.skills, domainFilter],
  );

  const handleToggle = async (skill: ModularSkillSpec) => {
    setBusyId(skill.id);
    const res = await updateModularSkillRegistry(skill.id, { toggleEnabled: true });
    setBusyId(null);
    if (res.ok && res.state) {
      onStateChange(res.state);
      setNotice(`Skill ${skill.code} ${!skill.enabled ? 'activé' : 'désactivé'} indépendamment des docs.`);
    } else {
      setNotice(res.error ?? 'Échec mise à jour skill.');
    }
  };

  const handleBump = async (skill: ModularSkillSpec, bumpSemver: SemverBumpKind) => {
    setBusyId(skill.id);
    const res = await updateModularSkillRegistry(skill.id, { bumpSemver });
    setBusyId(null);
    if (res.ok && res.state) {
      onStateChange(res.state);
      setNotice(`Skill ${skill.code} incrémenté (${bumpSemver}) sans altérer sa documentation.`);
    }
  };

  const openConfigEditor = (skill: ModularSkillSpec) => {
    if (editingSkillId === skill.id) {
      setEditingSkillId(null);
      return;
    }
    setEditingSkillId(skill.id);
    setConfigDraft(JSON.stringify(skill.config, null, 2));
  };

  const saveConfig = async (skill: ModularSkillSpec) => {
    try {
      const raw = JSON.parse(configDraft) as Record<string, unknown>;
      const sanitized: ModularSkillSpec['config'] = {};
      for (const [k, v] of Object.entries(raw)) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          sanitized[k] = v;
        }
      }
      setBusyId(skill.id);
      const res = await updateModularSkillRegistry(skill.id, { config: sanitized });
      setBusyId(null);
      if (res.ok && res.state) {
        onStateChange(res.state);
        setEditingSkillId(null);
        setNotice(`Configuration de ${skill.code} enregistrée.`);
      } else {
        setNotice(res.error ?? 'Erreur sauvegarde configuration.');
      }
    } catch {
      setNotice('JSON de configuration invalide (seules valeurs string/number/boolean acceptées).');
    }
  };

  return (
    <div className="space-y-3" data-testid="modular-skills-wing">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {DOMAIN_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setDomainFilter(t.id)}
              className={`min-h-[36px] rounded-lg px-3 font-mono text-[10.5px] font-bold transition ${
                domainFilter === t.id ? 'exo-accent-chip-active' : 'exo-accent-chip'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="font-mono text-[10.5px] exo-muted-text">
          Séparation stricte : code fonctionnel ≠ documentation VCS (`docId`)
        </span>
      </div>

      {notice && (
        <div className="rounded-lg border exo-accent-border bg-[var(--exo-surface-alt)] px-3 py-2 font-mono text-[11px] text-[var(--exo-text)]">
          {notice}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {filteredSkills.map((skill) => {
          const isEditing = editingSkillId === skill.id;
          return (
            <div
              key={skill.id}
              data-testid={`skill-card-${skill.id}`}
              className="exo-bento-card flex flex-col justify-between space-y-2.5 p-3.5 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                    <span className="font-bold exo-accent-text">{skill.code}</span>
                    <span className="rounded bg-black/15 px-1.5 py-0.5 font-bold dark:bg-white/10">
                      v{skill.semver}
                    </span>
                    <span className="exo-muted-text">{skill.domain}</span>
                  </div>
                  <h3 className="mt-0.5 font-display text-sm font-bold text-[var(--exo-text)]">
                    {skill.name}
                  </h3>
                  <div className="mt-0.5 truncate font-mono text-[10px] exo-muted-text">
                    <Cpu className="mr-1 inline h-3 w-3" />
                    {skill.entryModule}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={busyId === skill.id}
                  data-testid={`skill-toggle-${skill.id}`}
                  onClick={() => void handleToggle(skill)}
                  className={`inline-flex min-h-[34px] shrink-0 items-center gap-1 rounded-lg px-2.5 font-mono text-[10.5px] font-bold transition ${
                    skill.enabled
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'border exo-accent-border opacity-70'
                  }`}
                >
                  <Power className="h-3.5 w-3.5" />
                  <span>{skill.enabled ? 'Actif' : 'Inactif'}</span>
                </button>
              </div>

              {isEditing && (
                <div className="space-y-2 rounded-lg border exo-accent-border bg-[var(--exo-surface)] p-2.5">
                  <textarea
                    rows={4}
                    value={configDraft}
                    onChange={(e) => setConfigDraft(e.target.value)}
                    className="w-full rounded border exo-accent-border bg-[var(--exo-surface-alt)] p-2 font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() => void saveConfig(skill)}
                    className="exo-accent-btn inline-flex min-h-[32px] items-center gap-1 px-3 font-mono text-[10.5px] font-bold"
                  >
                    <Save className="h-3 w-3" />
                    <span>Enregistrer Config</span>
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-1.5 border-t exo-accent-border pt-2">
                <div className="flex items-center gap-1">
                  {(['patch', 'minor', 'major'] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      disabled={busyId === skill.id}
                      onClick={() => void handleBump(skill, b)}
                      className="exo-accent-chip min-h-[28px] rounded px-2 font-mono text-[10px] font-bold"
                    >
                      +{b}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => openConfigEditor(skill)}
                    className="exo-accent-chip inline-flex min-h-[28px] items-center gap-1 rounded px-2 font-mono text-[10px] font-bold"
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    <span>Config</span>
                  </button>
                </div>

                <button
                  type="button"
                  data-testid={`skill-open-doc-${skill.id}`}
                  onClick={() => onOpenLinkedDoc(skill.docId)}
                  className="inline-flex min-h-[28px] items-center gap-1 rounded-lg border exo-accent-border px-2.5 font-mono text-[10px] font-bold exo-accent-2-text hover:border-[var(--exo-accent)]"
                >
                  <BookOpen className="h-3 w-3" />
                  <span>Doc associée</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
