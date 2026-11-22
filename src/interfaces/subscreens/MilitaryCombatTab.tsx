import { useState } from 'react';
import { useSetAtom } from 'jotai';
import { Cpu, Crosshair, Shield, Sparkles, Swords } from 'lucide-react';
import { ExoTooltip } from '../../components/bento/ExoTooltip.tsx';
import { CombatHistoryViewer } from '../../components/world/CombatHistoryViewer.tsx';
import type { UnitClass, UnitLevel } from '../../contracts/combat-units.schema.ts';
import { handleGenerateActionEvent } from '../../pipelines/game-actions.pipeline.ts';
import { useExoStore } from '../../stores/game.store.ts';
import {
  activeDossierIdAtom,
  selectedTileAtom,
  toastNoticeAtom,
} from '../../stores/selection.atoms.ts';
import type { ActionEventRequest } from '../../systems/dossiers-pa/action-event-generator.ts';

/**
 * [L7] FUP-006 / FUP-008 | SM-04 | SADT A4.4
 * Military Recruitment, Drones 4-Class Allocator, Cyber-Paralysis Ops,
 * and 4-Phase Deterministic Combat — ALL routed exclusively through the Event Generator.
 */
const UNIT_CLASSES: readonly { id: UnitClass; label: string }[] = [
  { id: 'INFANTRY_EXO', label: 'Infanterie Exo' },
  { id: 'ARMOR_MECH', label: 'Blindés Mech' },
  { id: 'DRONE_SWARM', label: 'Essaim Drones' },
  { id: 'ORBITAL_CORVETTE', label: 'Corvette Orbitale' },
  { id: 'CYBER_EW', label: 'Cyber-EW' },
];

export function MilitaryCombatTab() {
  const world = useExoStore((s) => s.world);
  const setToast = useSetAtom(toastNoticeAtom);
  const setSelectedTile = useSetAtom(selectedTileAtom);
  const setActiveDossierId = useSetAtom(activeDossierIdAtom);

  const [targetTile, setTargetTile] = useState<number>(world.rivalTiles[0] ?? 24);
  const [unitLevel, setUnitLevel] = useState<UnitLevel>(1);

  const latestReport = world.combatReports[0] ?? null;

  const dispatchViaEventGenerator = (request: ActionEventRequest) => {
    const [error, dossier] = handleGenerateActionEvent(request);
    if (error || !dossier) {
      setToast({
        id: Date.now(),
        tone: 'error',
        text: error?.message ?? 'Impossible de générer cet événement militaire.',
      });
      return;
    }
    if (request.kind === 'LAUNCH_COMBAT') {
      setSelectedTile(request.targetTileIndex);
    }
    setActiveDossierId(dossier.id);
    setToast({
      id: Date.now(),
      tone: 'info',
      text: `Événement généré : « ${dossier.title} » — arbitrez l’ordre.`,
    });
  };

  const droneLabels: Record<'construction' | 'defense' | 'attack' | 'recon', string> = {
    construction: 'Construction',
    defense: 'Défense',
    attack: 'Attaque',
    recon: 'Recon',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 rounded-xl border border-rose-300/80 bg-rose-50/80 px-3.5 py-2.5 text-xs text-[#1f1224] dark:border-rose-800/70 dark:bg-rose-950/40 dark:text-rose-100">
        <Sparkles className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
        <span>
          <strong>Commandement Événementiel :</strong> recrutement, assauts, drones et opérations cyber passent tous par un Dossier Exécutif généré.
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-rose-200/90 bg-white/85 p-4 dark:border-rose-900/60 dark:bg-[#190d1f]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ExoTooltip
              title="Unités Militaires L1–L5 & Combat 4 Phases (R-47)"
              formula="Ph.1 Reco Drones → Ph.2 Cyber Compute → Ph.3 Assaut L1..L5 → Ph.4 Contrôle"
              body="Les 5 classes d’unités montent du Niveau 1 au Niveau 5. La résolution déterministe s’appuie sur PCG32 et le terrain géodésique (0 micro-RTS)."
              accent="amber"
              align="left"
            >
              <h3 className="flex cursor-help items-center gap-2 font-display text-sm font-bold exo-accent-text">
                <Shield className="h-4 w-4 exo-accent-text" />
                Forces Armées (Niveaux 1 à 5)
              </h3>
            </ExoTooltip>
            <select
              value={unitLevel}
              onChange={(e) => setUnitLevel(Number(e.target.value) as UnitLevel)}
              aria-label="Niveau des unités à recruter"
              className="min-h-[44px] rounded-lg border border-rose-200 bg-rose-50/60 px-2.5 font-mono text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-100"
            >
              {[1, 2, 3, 4, 5].map((lv) => (
                <option key={lv} value={lv}>Niveau {lv} ({70 * lv} Cr · {15 * lv} Mat.)</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {UNIT_CLASSES.map((cls) => (
              <button
                key={cls.id}
                type="button"
                onClick={() =>
                  dispatchViaEventGenerator({
                    kind: 'RECRUIT_UNIT',
                    unitClass: cls.id,
                    level: unitLevel,
                  })
                }
                className="min-h-[44px] rounded-lg border border-rose-200 bg-rose-50/70 px-3 font-mono text-[11px] font-semibold text-rose-900 hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100"
              >
                +3 {cls.label} N{unitLevel}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            {world.militaryRoster.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-rose-200/80 bg-rose-50/50 px-3 py-2 font-mono text-xs dark:border-rose-900/50 dark:bg-rose-950/25"
              >
                <span className="font-semibold text-[#1f1224] dark:text-rose-50">
                  {UNIT_CLASSES.find((c) => c.id === u.unitClass)?.label ?? u.unitClass} · Niv.{u.level}
                </span>
                <span className="font-semibold text-rose-700 dark:text-rose-300">
                  ×{u.count} unités (Puiss. {u.basePower})
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-rose-200/90 bg-white/85 p-4 dark:border-rose-900/60 dark:bg-[#190d1f]">
          <h3 className="flex items-center gap-2 font-display text-sm font-bold text-[#1f1224] dark:text-rose-100">
            <Swords className="h-4 w-4 text-rose-600 dark:text-rose-300" />
            Assaut Tactique 4 Phases
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-[#1f1224] dark:text-rose-100">
              <span>Secteur Cible (0–71) :</span>
              <input
                type="number"
                min={0}
                max={71}
                value={targetTile}
                onChange={(e) => setTargetTile(Math.max(0, Math.min(71, Number(e.target.value))))}
                className="min-h-[44px] w-20 rounded-lg border border-rose-200 bg-rose-50/60 px-2.5 font-mono text-xs text-[#1f1224] dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-50"
              />
            </label>
            <button
              type="button"
              onClick={() =>
                dispatchViaEventGenerator({
                  kind: 'LAUNCH_COMBAT',
                  targetTileIndex: targetTile,
                })
              }
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-rose-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-rose-500"
            >
              <Crosshair className="h-3.5 w-3.5" />
              Générer l&apos;Ordre de Conquête
            </button>
          </div>

          {latestReport ? (
            <div className="space-y-1.5 rounded-lg border border-rose-200/80 bg-rose-50/60 p-3 font-mono text-[11px] dark:border-rose-900/60 dark:bg-rose-950/35">
              <div className="flex justify-between font-semibold text-rose-700 dark:text-rose-300">
                <span>Dernier Rapport : {latestReport.targetZoneName}</span>
                <span>{latestReport.outcome}</span>
              </div>
              {latestReport.phases.map((p) => (
                <div
                  key={p.phase}
                  className="border-t border-rose-200/70 pt-1 text-[#1f1224] dark:border-rose-900/50 dark:text-rose-100"
                >
                  <span className="font-semibold text-rose-600 dark:text-rose-300">{p.phase} :</span> {p.summary}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-rose-900/65 dark:text-rose-200/70">
              Aucun combat exécuté sur cette campagne.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-rose-200/90 bg-white/85 p-4 dark:border-rose-900/60 dark:bg-[#190d1f]">
          <h3 className="mb-2.5 font-display text-sm font-bold text-[#1f1224] dark:text-rose-100">
            Drones Autonomes (4 Classes · Réaffectation)
          </h3>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs sm:grid-cols-4">
            {(['construction', 'defense', 'attack', 'recon'] as const).map((role) => (
              <div
                key={role}
                className="rounded-lg border border-rose-200/70 bg-rose-50/60 p-2.5 text-center dark:border-rose-900/50 dark:bg-rose-950/30"
              >
                <div className="text-[10px] uppercase text-rose-900/65 dark:text-rose-200/70">
                  {droneLabels[role]}
                </div>
                <div className="mt-1 text-base font-bold text-rose-700 dark:text-rose-300">{world.drones[role]}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                dispatchViaEventGenerator({
                  kind: 'REASSIGN_DRONE',
                  fromRole: 'construction',
                  toRole: 'attack',
                })
              }
              className="min-h-[44px] flex-1 rounded-lg border border-rose-200 bg-white px-3 text-xs font-medium text-rose-900 hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100"
            >
              1 Construction → Attaque
            </button>
            <button
              type="button"
              onClick={() =>
                dispatchViaEventGenerator({
                  kind: 'REASSIGN_DRONE',
                  fromRole: 'attack',
                  toRole: 'defense',
                })
              }
              className="min-h-[44px] flex-1 rounded-lg border border-rose-200 bg-white px-3 text-xs font-medium text-rose-900 hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100"
            >
              1 Attaque → Défense
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-rose-200/90 bg-white/85 p-4 dark:border-rose-900/60 dark:bg-[#190d1f]">
          <ExoTooltip
            title="Datacenters & Seuil Cyber-Paralysie (Ratio 2x)"
            formula="Compute Attaque >= 2.0 × Défense Rivale → Paralysie 2 cycles"
            body="Un ratio Compute d’au moins 2.0x sature les pare-feu rivaux en Phase 2 du combat ou paralyse leurs infrastructures énergétiques et drones."
            accent="cyan"
            align="left"
          >
            <h3 className="mb-2.5 flex cursor-help items-center gap-2 font-display text-sm font-bold exo-accent-text">
              <Cpu className="h-4 w-4 exo-accent-text" />
              Guerre Cyber &amp; Calcul ({world.resources.compute} unités)
            </h3>
          </ExoTooltip>
          <div className="space-y-2">
            {world.rivals.slice(0, 3).map((rival) => (
              <div
                key={rival.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-200/80 bg-rose-50/50 px-3 py-2 text-xs dark:border-rose-900/50 dark:bg-rose-950/30"
              >
                <div>
                  <span className="font-semibold text-[#1f1224] dark:text-rose-50">{rival.name}</span>
                  <span className="ml-2 font-mono text-[11px] text-rose-900/70 dark:text-rose-200/75">
                    Défense {rival.computeDefense} (2× = {rival.computeDefense * 2})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    dispatchViaEventGenerator({
                      kind: 'CYBER_PARALYSIS',
                      rivalId: rival.id,
                    })
                  }
                  className="min-h-[44px] rounded-lg border border-rose-300 bg-rose-500/15 px-3 font-mono text-[11px] font-semibold text-rose-800 hover:bg-rose-500/25 dark:border-rose-700 dark:bg-rose-500/25 dark:text-rose-100"
                >
                  Ordre Cyber (2 cycles)
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CombatHistoryViewer
        turnSnapshots={world.turn_snapshots}
        combatReports={world.combatReports}
        onLaunchAssault={() =>
          dispatchViaEventGenerator({
            kind: 'LAUNCH_COMBAT',
            targetTileIndex: targetTile,
          })
        }
      />
    </div>
  );
}
