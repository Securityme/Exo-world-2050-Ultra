import { useSetAtom } from 'jotai';
import { Activity, BookOpenCheck, HeartPulse, ShieldAlert } from 'lucide-react';
import { handleGenerateActionEvent } from '../../pipelines/game-actions.pipeline.ts';
import { useExoStore } from '../../stores/game.store.ts';
import {
  activeDossierIdAtom,
  activeSubscreenAtom,
  toastNoticeAtom,
} from '../../stores/selection.atoms.ts';
import {
  formatScientificDivisionLabel,
  PEDAGOGICAL_SCALE_LABELS,
} from '../../systems/biosphere-cabinet/bioclimate-health.ts';

/**
 * [L7] Compact cards for:
 * - 5-Division Scientific BioHealth Monitor (FEAT-53/54)
 * - Ecclesia & Discernment Read-Only Onglet 6 + R-24 Subsidiarity Actions (FEAT-55/56, AR-17/18/19)
 */
export function BioHealth5DivCard() {
  const world = useExoStore((s) => s.world);
  const bh = world.bioHealth;
  if (!bh) return null;

  const metrics = [
    ['Air (25%)', bh.airScore, 'bg-cyan-500'],
    ['Sols (20%)', bh.soilFertility, 'bg-amber-500'],
    ['Hydro (20%)', bh.hydroScore, 'bg-sky-500'],
    ['Flore (20%)', bh.floraIndex, 'bg-emerald-500'],
    ['Faune (15%)', bh.faunaIndex, 'bg-teal-400'],
  ] as const;

  return (
    <div className="exo-bento-card space-y-3 p-4 text-xs" data-testid="biohealth-5div-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-display text-sm font-bold text-[var(--exo-text)]">
          <Activity className="h-4 w-4 text-emerald-400" />
          <span>Simulateur Bioclimatique BioHealth (FEAT-53 · 5 Divisions)</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
          <span className="exo-accent-chip rounded px-2 py-0.5 font-bold">
            {formatScientificDivisionLabel(bh.activeDivision)}
          </span>
          <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-500 dark:text-emerald-300">
            Composite : {bh.compositeBioHealth}%
          </span>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-5">
        {metrics.map(([label, val, cls]) => (
          <div key={label} className="exo-surface-sub rounded-xl p-2.5">
            <div className="flex justify-between font-mono text-[10.5px]">
              <span className="exo-muted-text">{label}</span>
              <strong>{Math.round(val)}%</strong>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-black/20 dark:bg-white/10">
              <div className={`h-1.5 rounded-full ${cls}`} style={{ width: `${Math.min(100, Math.max(0, val))}%` }} />
            </div>
          </div>
        ))}
      </div>

      {bh.catastropheDrag > 0 && (
        <div className="flex items-center gap-1.5 rounded-lg border border-rose-400/60 bg-rose-500/12 px-2.5 py-1.5 font-mono text-[11px] text-rose-400">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Frein catastrophe P0 actif (FEAT-54) : -{bh.catastropheDrag}% · Série Éden : {bh.edenStreak}</span>
        </div>
      )}
    </div>
  );
}

export function EcclesiaDiscernmentCard() {
  const world = useExoStore((s) => s.world);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
  const setActiveDossierId = useSetAtom(activeDossierIdAtom);
  const setToast = useSetAtom(toastNoticeAtom);
  const ecc = world.ecclesiaState;
  if (!ecc) return null;

  const launchDiscernment = (axis: 'PASTORAL' | 'CHARITY' | 'CONTEMPLATION' | 'DIALOGUE') => {
    const [err, dossier] = handleGenerateActionEvent({
      kind: 'ECCLESIA_DISCERNMENT',
      axis,
    });
    if (err || !dossier) {
      setToast({ id: Date.now(), tone: 'error', text: err?.message ?? 'Action indisponible.' });
      return;
    }
    setSubscreen('EVENTS_HUB');
    setActiveDossierId(dossier.id);
  };

  const gradeInfo =
    PEDAGOGICAL_SCALE_LABELS[ecc.lastDiscernmentGrade] ?? PEDAGOGICAL_SCALE_LABELS[2]!;

  return (
    <div className="exo-bento-card space-y-3 p-4 text-xs" data-testid="ecclesia-ar19-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-display text-sm font-bold text-[var(--exo-text)]">
          <BookOpenCheck className="h-4 w-4 exo-accent-2-text" />
          <span>Onglet 6 Lecture Seule · Église Catholique &amp; Discernement (FEAT-55/56 · AR-19)</span>
        </div>
        <span className="rounded border border-emerald-400/60 bg-emerald-500/15 px-2 py-0.5 font-mono text-[10.5px] font-bold text-emerald-500 dark:text-emerald-300">
          Liberté de Conscience : {ecc.freedomOfConscienceScore}% (AR-19)
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        {[
          ['Vie Pastorale', ecc.pastoralAxis, 'PASTORAL'],
          ['Œuvres Caritatives', ecc.charityAxis, 'CHARITY'],
          ['Contemplation', ecc.contemplationAxis, 'CONTEMPLATION'],
          ['Dialogue & Science', ecc.dialogueAxis, 'DIALOGUE'],
        ].map(([label, score, axis]) => (
          <div key={String(axis)} className="exo-surface-sub rounded-xl p-2.5">
            <div className="flex justify-between font-mono text-[10.5px]">
              <span className="exo-muted-text">{label}</span>
              <strong>{score}%</strong>
            </div>
            <button
              type="button"
              onClick={() => launchDiscernment(axis as 'PASTORAL' | 'CHARITY' | 'CONTEMPLATION' | 'DIALOGUE')}
              className="exo-accent-chip mt-2 inline-flex min-h-[30px] w-full items-center justify-center gap-1 rounded-lg px-2 font-mono text-[10px] font-bold"
            >
              <HeartPulse className="h-3 w-3 exo-accent-text" />
              <span>Discernement R-24</span>
            </button>
          </div>
        ))}
      </div>

      <div className="font-mono text-[10.5px] exo-muted-text">
        Dernier repère éthique (AR-18) : <strong className="exo-accent-2-text">{gradeInfo.label}</strong> ({gradeInfo.code}) · Observation non intrusive (AR-17).
      </div>
    </div>
  );
}
