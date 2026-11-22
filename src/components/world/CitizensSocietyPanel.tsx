import { useMemo, useState } from 'react';
import { useSetAtom } from 'jotai';
import {
  AlertTriangle,
  GraduationCap,
  HeartPulse,
  Send,
  Smile,
  Sparkles,
  Users,
  Wind,
} from 'lucide-react';
import { PromptSuggestionChips } from '../bento/PromptSuggestionChips.tsx';
import { useExoStore } from '../../stores/game.store.ts';
import { toastNoticeAtom } from '../../stores/selection.atoms.ts';
import { computeCitizensSocietyReport } from '../../systems/economy-urban/citizens-society.ts';

/**
 * [L7] EXW.L7.CITIZENS_SOCIETY_PANEL | v5.0.0 | SADT A3.1/A3.4
 * Frostpunk-style Ordinary Citizens Workforce Pool, Health/Education/Leisure/Pollution gauges,
 * Cultural-Origin Political Equilibrium, and Next Colonist Arrival prompt generator with chips.
 */
export function CitizensSocietyPanel() {
  const world = useExoStore((s) => s.world);
  const setWorld = useExoStore((s) => s.setWorld);
  const setToast = useSetAtom(toastNoticeAtom);

  const report = useMemo(() => computeCitizensSocietyReport(world), [world]);
  const [arrivalPrompt, setArrivalPrompt] = useState('');
  const [scheduledDirective, setScheduledDirective] = useState<string | null>(null);

  const handleScheduleArrivalDirective = () => {
    const clean = arrivalPrompt.trim();
    if (clean.length < 6) {
      setToast({
        id: Date.now(),
        tone: 'warn',
        text: 'Décrivez le profil souhaité ou cliquez sur une bulle de suggestion.',
      });
      return;
    }
    const nextArrivalCycle = world.genese?.nextArrivalCycle ?? world.cycle + 3;
    const newChronicleEntry = {
      id: `arrival-dir-${world.cycle}-${Date.now()}`,
      cycle: world.cycle,
      tick: world.tick,
      category: 'DOSSIER' as const,
      title: `Directive de recrutement convoi (Tour ${nextArrivalCycle})`,
      detail: clean,
      stateHash: world.stateHash,
    };
    setWorld({
      ...world,
      chronicle: [newChronicleEntry, ...world.chronicle].slice(0, 60),
    });
    setScheduledDirective(clean);
    setArrivalPrompt('');
    setToast({
      id: Date.now(),
      tone: 'success',
      text: `Profil du prochain arrivant enregistré pour le convoi du Tour ${nextArrivalCycle}.`,
    });
  };

  const gauges = [
    {
      label: 'Santé Civile',
      value: report.healthIndex,
      icon: HeartPulse,
      bar: 'bg-emerald-500',
    },
    {
      label: 'Éducation',
      value: report.educationIndex,
      icon: GraduationCap,
      bar: 'bg-[var(--exo-accent)]',
    },
    {
      label: 'Loisirs',
      value: report.leisureIndex,
      icon: Smile,
      bar: 'bg-amber-400',
    },
    {
      label: 'Pollution',
      value: report.pollutionIndex,
      icon: Wind,
      bar: report.pollutionIndex >= 55 ? 'bg-rose-500' : 'bg-teal-500',
    },
  ] as const;

  return (
    <div className="space-y-4" data-testid="citizens-society-panel">
      {/* Summary Header: Ordinary Citizens Pool */}
      <div className="exo-bento-card grid gap-3 p-4 sm:grid-cols-4">
        <div className="exo-surface-sub rounded-xl p-3">
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase exo-accent-text">
            <Users className="h-3.5 w-3.5" />
            <span>Citoyens Ordinaires</span>
          </div>
          <div className="mt-1 font-display text-xl font-bold text-[var(--exo-text)]">
            {report.totalOrdinaryCitizens}
          </div>
          <div className="font-mono text-[10.5px] exo-muted-text">
            + {world.colonists.length} colons spécialistes nommés
          </div>
        </div>

        <div className="exo-surface-sub rounded-xl p-3">
          <div className="font-mono text-[10px] font-bold uppercase exo-muted-text">
            Main-d’œuvre Active
          </div>
          <div className="mt-1 font-display text-xl font-bold text-emerald-600 dark:text-emerald-300">
            {report.activeWorkforce}
          </div>
          <div className="font-mono text-[10.5px] exo-muted-text">
            Réserve disponible : {report.reserveCitizens}
          </div>
        </div>

        <div className="exo-surface-sub rounded-xl p-3">
          <div className="font-mono text-[10px] font-bold uppercase exo-muted-text">
            Équilibre Politique
          </div>
          <div className="mt-1 font-display text-xl font-bold exo-accent-2-text">
            {report.politicalEquilibriumIndex}%
          </div>
          <div className="font-mono text-[10.5px] exo-muted-text">
            Cohésion multi-origines
          </div>
        </div>

        <div className="exo-surface-sub rounded-xl p-3">
          <div className="font-mono text-[10px] font-bold uppercase exo-muted-text">
            Prochain Convoi
          </div>
          <div className="mt-1 font-display text-xl font-bold text-[var(--exo-text)]">
            Tour {world.genese?.nextArrivalCycle ?? world.cycle + 3}
          </div>
          <div className="font-mono text-[10.5px] exo-muted-text">
            Approbation : {Math.round(world.approval)}%
          </div>
        </div>
      </div>

      {report.civicAlert && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-400/75 bg-amber-500/12 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{report.civicAlert}</span>
        </div>
      )}

      {/* 4 Wellbeing Gauges */}
      <div className="exo-bento-card p-4">
        <h3 className="font-display text-sm font-bold text-[var(--exo-text)]">
          Jauges Civiques (Santé, Éducation, Loisirs, Pollution)
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {gauges.map((g) => {
            const Icon = g.icon;
            return (
              <div key={g.label} className="exo-surface-sub rounded-xl p-3 text-xs">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--exo-text)]">
                    <Icon className="h-3.5 w-3.5 exo-accent-text" />
                    {g.label}
                  </span>
                  <strong>{g.value}%</strong>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/20 dark:bg-white/10">
                  <div className={`h-full ${g.bar}`} style={{ width: `${g.value}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cultural-Origin Political Equilibrium */}
      <div className="exo-bento-card p-4">
        <h3 className="font-display text-sm font-bold text-[var(--exo-text)]">
          Origines Culturelles &amp; Courants Civiques
        </h3>
        <div className="mt-3 grid gap-2.5 md:grid-cols-2">
          {report.culturalOrigins.map((orig) => (
            <div
              key={orig.id}
              className="exo-surface-sub rounded-xl border exo-accent-border p-3 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display font-bold text-[var(--exo-text)]">{orig.label}</span>
                <span className="exo-accent-chip rounded px-2 py-0.5 font-mono text-[10px] font-bold">
                  {orig.sharePct}% pop.
                </span>
              </div>
              <div className="mt-1 text-[11px] exo-muted-text">
                Sensibilité : <strong className="text-[var(--exo-text)]">{orig.politicalLean}</strong>
              </div>
              <div className="mt-2 flex items-center justify-between font-mono text-[10.5px]">
                <span className="exo-muted-text">Adhésion</span>
                <strong className="text-emerald-600 dark:text-emerald-300">{orig.satisfactionPct}%</strong>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/20 dark:bg-white/10">
                <div
                  className="h-full bg-[var(--exo-accent)]"
                  style={{ width: `${orig.satisfactionPct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Colonist Arrival Prompt + Clickable Suggestion Bubbles */}
      <div className="exo-bento-card space-y-3 p-4 text-xs">
        <div className="flex items-center gap-1.5 font-display text-sm font-bold exo-accent-text">
          <Sparkles className="h-4 w-4" />
          <span>Cibler le Profil du Prochain Arrivant (Convoi Orbital)</span>
        </div>
        <p className="exo-muted-text">
          Décrivez la spécialité ou la sensibilité recherchée pour le prochain colon nommé, ou cliquez sur une bulle ci-dessous pour l’injecter instantanément.
        </p>

        <PromptSuggestionChips
          domain="ARRIVAL"
          onInject={(txt) => setArrivalPrompt(txt)}
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            data-testid="next-arrival-prompt-input"
            value={arrivalPrompt}
            onChange={(e) => setArrivalPrompt(e.target.value)}
            placeholder="Ex. Ingénieur atmosphérique spécialisé en capture carbone…"
            className="min-h-[42px] flex-1 rounded-xl border exo-accent-border bg-[var(--exo-surface)] px-3 text-xs text-[var(--exo-text)] focus:outline-none"
          />
          <button
            type="button"
            data-testid="submit-arrival-directive-btn"
            onClick={handleScheduleArrivalDirective}
            className="exo-accent-btn inline-flex min-h-[42px] items-center justify-center gap-1.5 px-4 font-mono text-xs font-bold"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Planifier Arrivant</span>
          </button>
        </div>

        {scheduledDirective && (
          <div className="rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-3 py-2 font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
            Directive active : « {scheduledDirective} »
          </div>
        )}
      </div>
    </div>
  );
}
