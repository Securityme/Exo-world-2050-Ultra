import { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Flame,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';
import { useExoStore } from '../stores/game.store.ts';
import {
  activeDossierIdAtom,
  activeSubscreenAtom,
  toastNoticeAtom,
  tutorialOpenAtom,
  viewportOverlayModeAtom,
} from '../stores/selection.atoms.ts';

export const TUTORIAL_STORAGE_KEY = 'exo_world_2050_tutorial_seen_v1';

interface TutorialStep {
  readonly id: string;
  readonly badge: string;
  readonly title: string;
  readonly body: string;
  readonly tip: string;
  readonly icon: typeof Compass;
  readonly ctaLabel: string;
}

const STEPS: readonly TutorialStep[] = [
  {
    id: 'step-3d',
    badge: 'Étape 1/5 · Carte 3D & Entités',
    title: 'Explorez la 3D et cliquez sur chaque entité',
    body: 'Passez librement entre 1·Espace (planètes), 2·Planète (72 secteurs) et 3·Ville (quartiers, parcs, reliefs et faune). Cliquez sur n’importe quel bâtiment, secteur ou planète pour ouvrir sa fenêtre dédiée.',
    tip: 'Chaque fenêtre d’entité peut s’afficher en format fenêtre ou en plein écran selon votre préférence.',
    icon: Compass,
    ctaLabel: 'Passer en Vue Ville 3D',
  },
  {
    id: 'step-resources',
    badge: 'Étape 2/5 · Ressources & Usure',
    title: 'Suivez vos ressources et la maintenance par tour',
    body: 'La barre au-dessus du footer affiche vos 7 ressources vitales (Crédits, Énergie, Matériaux, Eau, Vivres, Calcul, Kits O₂) avec leur bilan net par tour (+Δ) et la charge de maintenance des quartiers.',
    tip: 'Cliquez une ressource pour voir sa source et son usage. Les Kits O₂ sont essentiels tant que l’air n’est pas pur (Éden).',
    icon: Flame,
    ctaLabel: 'Ouvrir le bilan dans Monde',
  },
  {
    id: 'step-events',
    badge: 'Étape 3/5 · Choix & Option 0-PA',
    title: 'Toutes vos actions créent un dossier stratégique',
    body: 'Chaque action (extension, emprunt, marché, drones, sécurité) ouvre un dossier avec des choix multiples, des sous-choix d’application et une option gratuite 0-PA garantie pour éviter tout blocage.',
    tip: 'Ouvrez l’Inspecteur 3D isolé d’un bâtiment ou le Hangar 3D directement depuis les badges d’un dossier ou l’onglet Monde.',
    icon: Sparkles,
    ctaLabel: 'Ouvrir le 1er événement',
  },
  {
    id: 'step-tabs',
    badge: 'Étape 4/5 · Navigation 3 Onglets',
    title: 'Tout est regroupé dans 3 onglets simples',
    body: 'En bas : Monde (villes 0-3D, climat, colons RPG, technologies, Hangar 3D), Événements (dossiers à traiter, opérations, diplomatie) et Journal (historique, sauvegardes et Atlas).',
    tip: 'En haut : ouvrez/fermez l’interface pour admirer la 3D, changez de station Radio FIP (6 flux) ou lancez la Fin de tour.',
    icon: Layers,
    ctaLabel: 'Ouvrir l’onglet Événements',
  },
  {
    id: 'step-loop',
    badge: 'Étape 5/5 · Tour par Tour Stratégique',
    title: 'Validez votre tour avec « Fin de tour »',
    body: 'Le temps n’avance jamais sans vous. Traitez tous vos dossiers actifs puis cliquez « Fin de tour » pour ouvrir le récapitulatif d’ère, récolter vos étoiles de Renommée et recevoir les prochains événements.',
    tip: 'Vous pouvez rouvrir ce guide à tout moment via le bouton Guide (?) dans la barre supérieure.',
    icon: BookOpen,
    ctaLabel: 'Compris, démarrer le tour',
  },
];

/**
 * [L7] Interactive Non-Blocking Guided Campaign Tutorial (Mobile-First + Desktop).
 */
export function CampaignTutorialOverlay() {
  const [open, setOpen] = useAtom(tutorialOpenAtom);
  const [stepIdx, setStepIdx] = useState(0);

  const world = useExoStore((s) => s.world);
  const setActiveScale = useExoStore((s) => s.setActiveScale);
  const setOverlayMode = useSetAtom(viewportOverlayModeAtom);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
  const setActiveDossierId = useSetAtom(activeDossierIdAtom);
  const setToast = useSetAtom(toastNoticeAtom);

  if (!open) return null;

  const step = STEPS[stepIdx] ?? STEPS[0]!;
  const Icon = step.icon;
  const isLast = stepIdx === STEPS.length - 1;

  const markSeenAndClose = () => {
    try {
      window.localStorage.setItem(TUTORIAL_STORAGE_KEY, '1');
    } catch {
      // ignore storage unavailability
    }
    setOpen(false);
  };

  const runStepAction = () => {
    if (step.id === 'step-3d') {
      setActiveScale(3);
      setOverlayMode('STANDARD');
      setToast({ id: Date.now(), tone: 'info', text: 'Vue Ville 3D activée : cliquez un quartier pour ouvrir sa fenêtre.' });
      setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
    } else if (step.id === 'step-resources') {
      setOverlayMode('STANDARD');
      setSubscreen('WORLDS_HUB');
      setOpen(false);
    } else if (step.id === 'step-events') {
      const first = world.activeDossiers[0];
      if (first) {
        setActiveDossierId(first.id);
        setOpen(false);
      } else {
        setSubscreen('EVENTS_HUB');
        setOpen(false);
      }
    } else if (step.id === 'step-tabs') {
      setSubscreen('EVENTS_HUB');
      setOpen(false);
    } else if (step.id === 'step-loop') {
      setToast({ id: Date.now(), tone: 'success', text: 'Prêt : traitez vos dossiers actifs puis cliquez « Fin de tour ».' });
      markSeenAndClose();
    }
  };

  return (
    <aside
      aria-label="Tutoriel de prise en main EXO WORLD 2050"
      className="pointer-events-auto fixed inset-x-2 top-[66px] z-40 mx-auto max-w-lg sm:inset-x-auto sm:right-4 sm:top-20"
    >
      <div className="exo-bento-card exo-astral-ticks rounded-2xl border-rose-400/80 p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-700 dark:bg-rose-500/25 dark:text-rose-200">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-300">
                {step.badge}
              </div>
              <h2 className="font-display text-sm font-bold text-[#1f1224] dark:text-rose-50 sm:text-base">
                {step.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={markSeenAndClose}
            aria-label="Fermer le tutoriel"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-white/90 text-rose-900 hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2.5 text-xs leading-relaxed text-[#1f1224] dark:text-rose-100 sm:text-[13px]">
          {step.body}
        </p>

        <div className="mt-2.5 rounded-xl border border-rose-200/80 bg-rose-50/80 px-3 py-2 text-[11.5px] leading-snug text-rose-950/85 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          <strong className="font-semibold text-rose-700 dark:text-rose-300">Astuce :</strong> {step.tip}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => void runStepAction()}
            className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-400/80 bg-gradient-to-r from-rose-600 to-pink-500 px-3.5 text-xs font-bold text-white shadow-sm hover:from-rose-500 hover:to-pink-400 sm:flex-initial"
          >
            <span>{step.ctaLabel}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={stepIdx === 0}
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
              aria-label="Étape précédente"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-white/90 text-rose-900 hover:border-rose-500 disabled:opacity-35 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {isLast ? (
              <button
                type="button"
                onClick={markSeenAndClose}
                className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-emerald-400 bg-emerald-500/15 px-3 text-xs font-bold text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-500/20 dark:text-emerald-200"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Terminer</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))}
                aria-label="Étape suivante"
                className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-rose-200 bg-white/90 px-3 text-xs font-semibold text-rose-900 hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100"
              >
                <span>Suivant</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Step progress indicators */}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-rose-200/70 pt-2 dark:border-rose-900/50">
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Aller à l'étape ${idx + 1}`}
                onClick={() => setStepIdx(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === stepIdx
                    ? 'w-6 bg-rose-600 dark:bg-rose-400'
                    : 'w-2 bg-rose-200 hover:bg-rose-300 dark:bg-rose-900'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={markSeenAndClose}
            className="font-mono text-[11px] font-medium text-rose-900/65 hover:text-rose-700 dark:text-rose-200/70 dark:hover:text-rose-100"
          >
            Passer le guide
          </button>
        </div>
      </div>
    </aside>
  );
}
