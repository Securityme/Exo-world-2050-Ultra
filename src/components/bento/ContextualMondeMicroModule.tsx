import { useState } from 'react';
import { Sliders, Sparkles, Users } from 'lucide-react';
import type { DossierOption } from '../../contracts/pa-dossiers.schema.ts';
import { handleAssignColonistToDistrict, handleAutoAssignColonists } from '../../pipelines/game-actions.pipeline.ts';
import { useExoStore } from '../../stores/game.store.ts';

/**
 * [L7] EXW.L7.CONTEXTUAL_MONDE_MODULE | v5.0.0 | SADT A2.1/A3.1
 * Embedded at the end of a Dossier choice: AI proposes an operational allocation
 * (e.g., Colonists / Workforce / Sector emphasis) according to the chosen option,
 * and the player can fine-tune it manually before signing.
 */
interface ContextualMondeMicroModuleProps {
  readonly selectedOption: DossierOption | null;
}

export function ContextualMondeMicroModule({ selectedOption }: ContextualMondeMicroModuleProps) {
  const world = useExoStore((s) => s.world);
  const [appliedNote, setAppliedNote] = useState<string | null>(null);

  if (!selectedOption) return null;

  const targetDistrict =
    selectedOption.effects.atmosphereDelta > 0
      ? world.districts.find((d) => d.kind === 'BIOPARK' || d.kind === 'HABITAT') ?? world.districts[0]
      : selectedOption.effects.compute > 0
        ? world.districts.find((d) => d.kind === 'DATACENTER') ?? world.districts[0]
        : world.districts[0];

  const candidateColonists = world.colonists.slice(0, 4);

  return (
    <div
      data-testid="contextual-monde-micro-module"
      className="exo-surface-sub space-y-2 rounded-xl border p-3 text-xs exo-accent-border"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-display font-bold exo-accent-text">
          <Sliders className="h-3.5 w-3.5" />
          <span>Module Monde Contextuel — Affinage Opérationnel</span>
        </div>
        <button
          type="button"
          onClick={() => {
            const count = handleAutoAssignColonists();
            setAppliedNote(`Répartition IA appliquée (${count} colons optimisés pour « ${selectedOption.label} »).`);
          }}
          className="exo-accent-chip inline-flex min-h-[30px] items-center gap-1 px-2 font-mono text-[10px] font-bold"
        >
          <Sparkles className="h-3 w-3 exo-accent-text" />
          Appliquer proposition IA
        </button>
      </div>

      <p className="text-[11px] exo-muted-text">
        Proposition IA pour <strong>{selectedOption.label}</strong> : prioriser{' '}
        <strong>{targetDistrict?.name ?? 'Cité Ouverte'}</strong>. Ajustez manuellement vos colons ci-dessous :
      </p>

      <div className="grid gap-1.5 sm:grid-cols-2">
        {candidateColonists.map((col) => (
          <div
            key={col.id}
            className="flex items-center justify-between gap-2 rounded-lg border exo-accent-border bg-[var(--exo-surface)] px-2 py-1.5 text-[11px]"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1 font-semibold truncate">
                <Users className="h-3 w-3 shrink-0 exo-accent-text" />
                <span className="truncate">{col.name}</span>
              </div>
              <div className="font-mono text-[9.5px] exo-muted-text">{col.specialty}</div>
            </div>
            <select
              aria-label={`Affectation manuelle pour ${col.name}`}
              value={col.assignedDistrictId ?? ''}
              onChange={(e) => {
                handleAssignColonistToDistrict(col.id, e.target.value || null);
                setAppliedNote(`${col.name} affecté manuellement.`);
              }}
              className="max-w-[130px] rounded border exo-accent-border bg-transparent px-1.5 py-1 font-mono text-[10px]"
            >
              <option value="">En réserve</option>
              {world.districts.map((d) => (
                <option key={d.id} value={d.id} className="bg-[var(--exo-surface)] text-[var(--exo-text)]">
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {appliedNote && (
        <div className="font-mono text-[10.5px] font-semibold text-emerald-500 dark:text-emerald-300">
          ✓ {appliedNote}
        </div>
      )}
    </div>
  );
}
