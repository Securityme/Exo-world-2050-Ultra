import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Cpu,
  Flame,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Package,
  Plus,
  Radar,
  Sparkles,
  User,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import { useAtomValue, useSetAtom } from 'jotai';
import { ExoTooltip } from '../../components/bento/ExoTooltip.tsx';
import { ContextualMondeMicroModule } from '../../components/bento/ContextualMondeMicroModule.tsx';
import { DossierBilanPolesPanel } from '../../components/bento/DossierBilanPolesPanel.tsx';
import { DossierMultiFactorPanel } from '../../components/bento/DossierMultiFactorPanel.tsx';
import { DossierOptionUnlockStrip } from '../../components/bento/DossierOptionUnlockStrip.tsx';
import { NestedBadgeGroup } from '../../components/bento/NestedBadgeGroup.tsx';
import { EventQuestImpactStrip } from '../../components/events/EventQuestImpactStrip.tsx';
import { PaTurnProgressHeader } from '../../components/events/PaTurnProgressHeader.tsx';
import { RichEntityText } from '../../components/RichEntityText.tsx';
import type {
  DossierOption,
  DossierSubChoice,
  ExecutiveDossier,
  RefinementLevel,
} from '../../contracts/pa-dossiers.schema.ts';
import {
  handleDrawAstralisBonusEvent,
  handleExecuteDossier,
  handleMagicWandResolveAndChain,
} from '../../pipelines/game-actions.pipeline.ts';
import { useOracleDossierMutation } from '../../hooks/use-oracle-query.ts';
import {
  activeDossierIdAtom,
  activeInvestigationDossierIdAtom,
  activeSubscreenAtom,
  cameraFocusTargetAtom,
  focusNonceAtom,
  inspectedDossierIdsAtom,
  inspectedEntityAtom,
  questUiMilestonesAtom,
  returnEventContextAtom,
  selectedDistrictIdAtom,
  selectedTileAtom,
  toastNoticeAtom,
  viewportOverlayModeAtom,
} from '../../stores/selection.atoms.ts';
import { useExoStore } from '../../stores/game.store.ts';
import { useMetaHonorsStore } from '../../stores/meta-honors.store.ts';
import {
  buildPhilosophyBadgeTriplet,
  buildProvenanceBadgeTriplet,
  buildSubChoiceBadgeTriplet,
  getSubChoiceBadgeMeta,
} from '../../systems/dossiers-pa/badge-taxonomy.ts';
import type { BadgeColorTone } from '../../contracts/nested-badges.schema.ts';
import {
  getEffectiveOptionsForDossier,
  getSubChoicesForOption,
} from '../../systems/dossiers-pa/dossier-subchoices.ts';
import { resolveDossierContext } from '../../systems/dossiers-pa/entity-markup.ts';
import {
  evaluateOptionUnlockFactors,
  findRecommendedColonistsForOption,
} from '../../systems/dossiers-pa/multi-factor-unlock.engine.ts';
import {
  evaluateBudgetedSelection,
  resolveDossierSelectionBudget,
} from '../../systems/dossiers-pa/budgeted-selection.engine.ts';
import { buildPartitionedEventBilan } from '../../systems/dossiers-pa/dossier-bilan-poles.ts';
import {
  findNextPlayableAstralisDossier,
  getAstralisEventHand,
} from '../../systems/dossiers-pa/magic-wand-astralis.ts';
import {
  formatDossierCategory,
  formatOrientationTag,
  formatSkillAttribute,
  formatSubPaDomain,
} from '../../utils/ui-labels.ts';

/**
 * [L7] Multi-Choice & Sub-Choice Event Decision Window (with Fenêtre / Plein écran toggle).
 * - Astralis entity context badges (Lieu/Secteur, Bâtiment, Personnage, Urgence)
 * - Rich inline entity highlighting (<RichEntityText />) in briefing, choices & sub-choices
 * - Guarantees 4+ clear primary choices and 3 selectable sub-choices per choice
 * - Live combined impact preview summing primary choice × intensity + selected sub-choice
 */
interface DossierWorkshopModalProps {
  readonly dossier: ExecutiveDossier;
  readonly onClose: () => void;
}

const SUBCHOICE_TONE_STYLE: Record<BadgeColorTone, string> = {
  GOLD: 'border-amber-400/90 bg-amber-500/15 text-amber-800 dark:text-amber-200',
  ROSE: 'border-rose-400/90 bg-rose-500/15 text-rose-800 dark:text-rose-200',
  EMERALD: 'border-emerald-400/90 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  INDIGO: 'border-indigo-400/90 bg-indigo-500/15 text-indigo-800 dark:text-indigo-200',
  VIOLET: 'border-violet-400/90 bg-violet-500/15 text-violet-800 dark:text-violet-200',
  AMBER: 'border-orange-400/90 bg-orange-500/15 text-orange-800 dark:text-orange-200',
  CORAL: 'border-red-400/90 bg-red-500/15 text-red-800 dark:text-red-200',
  SLATE: 'border-slate-400/80 bg-slate-500/15 text-slate-700 dark:text-slate-200',
};

function buildOptionImpactChips(opt: DossierOption): readonly { label: string; positive: boolean }[] {
  const chips: { label: string; positive: boolean }[] = [];
  const fx = opt.effects;
  if (fx.credits !== 0) chips.push({ label: `${fx.credits > 0 ? '+' : ''}${fx.credits} Cr`, positive: fx.credits > 0 });
  if (fx.energy !== 0) chips.push({ label: `${fx.energy > 0 ? '+' : ''}${fx.energy} Énerg.`, positive: fx.energy > 0 });
  if (fx.materials !== 0) chips.push({ label: `${fx.materials > 0 ? '+' : ''}${fx.materials} Mat.`, positive: fx.materials > 0 });
  if (fx.water !== 0) chips.push({ label: `${fx.water > 0 ? '+' : ''}${fx.water} Eau`, positive: fx.water > 0 });
  if (fx.food !== 0) chips.push({ label: `${fx.food > 0 ? '+' : ''}${fx.food} Vivres`, positive: fx.food > 0 });
  if (fx.electronics !== 0) chips.push({ label: `${fx.electronics > 0 ? '+' : ''}${fx.electronics} Élec.`, positive: fx.electronics > 0 });
  if (fx.compute !== 0) chips.push({ label: `${fx.compute > 0 ? '+' : ''}${fx.compute} Calcul`, positive: fx.compute > 0 });
  if (fx.breathingKits !== 0) chips.push({ label: `${fx.breathingKits > 0 ? '+' : ''}${fx.breathingKits} Kits O₂`, positive: fx.breathingKits > 0 });
  if (fx.atmosphereDelta !== 0) chips.push({ label: `${fx.atmosphereDelta > 0 ? '+' : ''}${fx.atmosphereDelta}% Air`, positive: fx.atmosphereDelta > 0 });
  if (fx.maintenanceDelta !== 0) chips.push({ label: `${fx.maintenanceDelta > 0 ? '+' : ''}${fx.maintenanceDelta}% État`, positive: fx.maintenanceDelta > 0 });
  if (fx.eraStarsDelta > 0) chips.push({ label: `+${fx.eraStarsDelta}★`, positive: true });
  return chips;
}

function buildSubChoiceChips(sub: DossierSubChoice): readonly { label: string; positive: boolean }[] {
  const fx = sub.bonusEffects;
  if (!fx) return [];
  const chips: { label: string; positive: boolean }[] = [];
  if (fx.credits !== 0) chips.push({ label: `${fx.credits > 0 ? '+' : ''}${fx.credits} Cr`, positive: fx.credits > 0 });
  if (fx.energy !== 0) chips.push({ label: `${fx.energy > 0 ? '+' : ''}${fx.energy} Énerg.`, positive: fx.energy > 0 });
  if (fx.materials !== 0) chips.push({ label: `${fx.materials > 0 ? '+' : ''}${fx.materials} Mat.`, positive: fx.materials > 0 });
  if (fx.water !== 0) chips.push({ label: `${fx.water > 0 ? '+' : ''}${fx.water} Eau`, positive: fx.water > 0 });
  if (fx.compute !== 0) chips.push({ label: `${fx.compute > 0 ? '+' : ''}${fx.compute} Calcul`, positive: fx.compute > 0 });
  if (fx.breathingKits !== 0) chips.push({ label: `${fx.breathingKits > 0 ? '+' : ''}${fx.breathingKits} Kits O₂`, positive: fx.breathingKits > 0 });
  if (fx.atmosphereDelta !== 0) chips.push({ label: `${fx.atmosphereDelta > 0 ? '+' : ''}${fx.atmosphereDelta}% Air`, positive: fx.atmosphereDelta > 0 });
  if (fx.maintenanceDelta !== 0) chips.push({ label: `${fx.maintenanceDelta > 0 ? '+' : ''}${fx.maintenanceDelta}% État`, positive: fx.maintenanceDelta > 0 });
  if (fx.allianceTrustDelta !== 0) chips.push({ label: `${fx.allianceTrustDelta > 0 ? '+' : ''}${fx.allianceTrustDelta}% Alliance`, positive: fx.allianceTrustDelta > 0 });
  return chips;
}

export function DossierWorkshopModal({ dossier, onClose }: DossierWorkshopModalProps) {
  const world = useExoStore((s) => s.world);
  const setActiveScale = useExoStore((s) => s.setActiveScale);
  const setToast = useSetAtom(toastNoticeAtom);
  const setActiveDossierId = useSetAtom(activeDossierIdAtom);
  const setOverlayMode = useSetAtom(viewportOverlayModeAtom);
  const setSelectedTile = useSetAtom(selectedTileAtom);
  const setSelectedDistrict = useSetAtom(selectedDistrictIdAtom);
  const setInspectedEntity = useSetAtom(inspectedEntityAtom);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
  const focusNonce = useAtomValue(focusNonceAtom);
  const setFocusNonce = useSetAtom(focusNonceAtom);
  const setCameraFocus = useSetAtom(cameraFocusTargetAtom);
  const setReturnContext = useSetAtom(returnEventContextAtom);
  const setInvestigationDossierId = useSetAtom(activeInvestigationDossierIdAtom);
  const inspectedIds = useAtomValue(inspectedDossierIdsAtom);
  const questUi = useAtomValue(questUiMilestonesAtom);
  const philosophyCounters = useMetaHonorsStore((s) => s.philosophyCumulative);
  const oracleMutation = useOracleDossierMutation();

  const expandedOptions = useMemo(() => getEffectiveOptionsForDossier(dossier), [dossier]);
  const dossierContext = useMemo(() => resolveDossierContext(world, dossier), [world, dossier]);
  const selectionBudget = useMemo(() => resolveDossierSelectionBudget(dossier), [dossier]);
  const astralisHand = useMemo(() => getAstralisEventHand(world), [world]);

  const [fullscreen, setFullscreen] = useState(false);
  const [wandSalt, setWandSalt] = useState(1);
  const [advisorId, setAdvisorId] = useState<string>(
    dossierContext.advisor?.id ?? world.advisors[0]?.id ?? '',
  );
  const [assignedColonistIds, setAssignedColonistIds] = useState<string[]>([]);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(() => {
    const firstUnlocked = expandedOptions.find(
      (o) => evaluateOptionUnlockFactors(world, o, dossierContext.advisor?.id ?? world.advisors[0]?.id ?? '', []).unlocked,
    );
    const initial = firstUnlocked ?? expandedOptions[0];
    return initial ? [initial.id] : [];
  });
  const [subChoiceId, setSubChoiceId] = useState<string>('');
  const [refinement, setRefinement] = useState<RefinementLevel>(0);
  const [useGeneralFallback, setUseGeneralFallback] = useState<boolean>(true);
  const [moduleExt, setModuleExt] = useState<'NONE' | 'ENERGY_BOOST' | 'STORAGE_BAY' | 'OUTPUT_CORE'>('NONE');

  // Re-initialize selections cleanly whenever direct Astralis chaining switches to a new card
  useEffect(() => {
    const nextAdvisor = dossierContext.advisor?.id ?? world.advisors[0]?.id ?? '';
    const firstUnlocked = expandedOptions.find(
      (o) => evaluateOptionUnlockFactors(world, o, nextAdvisor, []).unlocked,
    );
    const initial = firstUnlocked ?? expandedOptions[0];
    setAdvisorId(nextAdvisor);
    setAssignedColonistIds([]);
    setSelectedOptionIds(initial ? [initial.id] : []);
    setRefinement(0);
    setModuleExt('NONE');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossier.id]);

  const selectedOptions = useMemo(
    () =>
      selectedOptionIds
        .map((id) => expandedOptions.find((o) => o.id === id))
        .filter((o): o is DossierOption => Boolean(o)),
    [selectedOptionIds, expandedOptions],
  );
  const selectedOption = selectedOptions[0] ?? expandedOptions[0];
  const subChoices = useMemo(
    () => (selectedOption ? getSubChoicesForOption(selectedOption, dossier.dossierClass) : []),
    [selectedOption, dossier.dossierClass],
  );

  // Keep subChoiceId synchronized whenever user switches primary option
  useEffect(() => {
    if (!subChoices.some((sc) => sc.id === subChoiceId)) {
      setSubChoiceId(subChoices[0]?.id ?? '');
    }
  }, [subChoices, subChoiceId]);

  const selectedSubChoice = subChoices.find((sc) => sc.id === subChoiceId) ?? subChoices[0];
  const isInspected3D = inspectedIds.includes(dossier.id);

  const budgetEval = useMemo(
    () =>
      evaluateBudgetedSelection(
        world,
        dossier,
        expandedOptions,
        selectedOptionIds,
        selectedSubChoice,
        refinement,
        advisorId,
        assignedColonistIds,
      ),
    [world, dossier, expandedOptions, selectedOptionIds, selectedSubChoice, refinement, advisorId, assignedColonistIds],
  );

  const assignedColonists = useMemo(
    () => world.colonists.filter((c) => assignedColonistIds.includes(c.id)),
    [world.colonists, assignedColonistIds],
  );

  const partitionedBilan = useMemo(
    () =>
      buildPartitionedEventBilan(
        selectedOptions.length > 0 ? selectedOptions : selectedOption ? [selectedOption] : [],
        selectedSubChoice,
        refinement,
        moduleExt,
        assignedColonists,
      ),
    [selectedOptions, selectedOption, selectedSubChoice, refinement, moduleExt, assignedColonists],
  );

  const handleToggleColonist = (colonistId: string) => {
    setAssignedColonistIds((prev) => {
      if (prev.includes(colonistId)) {
        return prev.filter((id) => id !== colonistId);
      }
      if (prev.length >= 2) {
        return [...prev.slice(1), colonistId];
      }
      return [...prev, colonistId];
    });
  };

  const handleToggleOption = (opt: DossierOption) => {
    const evalRes = evaluateOptionUnlockFactors(world, opt, advisorId, assignedColonistIds);
    if (!evalRes.unlocked) return;

    if (selectionBudget.mode === 'SINGLE' || opt.actionPayload?.kind === 'DEFER_ACTION') {
      setSelectedOptionIds([opt.id]);
      return;
    }

    setSelectedOptionIds((prev) => {
      const cleaned = prev.filter((id) => {
        const found = expandedOptions.find((o) => o.id === id);
        return found?.actionPayload?.kind !== 'DEFER_ACTION';
      });
      if (cleaned.includes(opt.id)) {
        return cleaned.length > 1 ? cleaned.filter((id) => id !== opt.id) : cleaned;
      }
      if (cleaned.length >= selectionBudget.maxSelections) {
        return [...cleaned.slice(1), opt.id];
      }
      return [...cleaned, opt.id];
    });
  };

  const handleAutoAssignForOption = (opt: DossierOption) => {
    const recommended = findRecommendedColonistsForOption(world, opt, 2);
    if (recommended.length === 0) return;
    const merged = [...new Set([...recommended, ...assignedColonistIds])].slice(0, 2);
    setAssignedColonistIds(merged);
    if (evaluateOptionUnlockFactors(world, opt, advisorId, merged).unlocked) {
      setSelectedOptionIds((prev) => {
        if (selectionBudget.mode === 'SINGLE' || opt.actionPayload?.kind === 'DEFER_ACTION') {
          return [opt.id];
        }
        const cleaned = prev.filter((id) => expandedOptions.find((o) => o.id === id)?.actionPayload?.kind !== 'DEFER_ACTION');
        if (cleaned.includes(opt.id)) return cleaned;
        return cleaned.length >= selectionBudget.maxSelections
          ? [...cleaned.slice(1), opt.id]
          : [...cleaned, opt.id];
      });
    }
  };

  const handleLaunch3DProbe = () => {
    setSelectedTile(dossier.tileIndex);
    setOverlayMode('MAINTENANCE');
    setActiveScale(dossier.dossierClass === 'C2' || dossier.dossierClass === 'C3' ? 3 : 2);
    setSubscreen('NONE');
    setInvestigationDossierId(dossier.id);
    setToast({
      id: Date.now(),
      tone: 'info',
      text: `Inspection 3D centrée sur le Secteur #${dossier.tileIndex}.`,
    });
    onClose();
  };

  const handleSign = (chainToNext = false) => {
    const primary = selectedOptions[0] ?? selectedOption;
    if (!primary || !budgetEval.allowed) {
      setToast({ id: Date.now(), tone: 'error', text: budgetEval.reason });
      return;
    }
    const [error, summary] = handleExecuteDossier({
      dossierId: dossier.id,
      optionId: primary.id,
      extraOptionIds: selectedOptions.slice(1).map((o) => o.id),
      subChoiceId: selectedSubChoice?.id,
      refinementLevel: refinement,
      assignedAdvisorId: advisorId,
      assignedColonistIds,
      useGeneralPaFallback: useGeneralFallback,
      moduleExtensionTag: moduleExt,
    });
    if (error) {
      setToast({ id: Date.now(), tone: 'error', text: error.message });
      return;
    }
    if (chainToNext) {
      const updated = useExoStore.getState().world;
      const next = findNextPlayableAstralisDossier(updated, dossier.id);
      if (next) {
        setToast({
          id: Date.now(),
          tone: 'success',
          text: `${summary ?? 'Décision validée.'} → Suivant : « ${next.title} »`,
        });
        setActiveDossierId(next.id);
        return;
      }
    }
    setToast({ id: Date.now(), tone: 'success', text: summary ?? 'Décision validée.' });
    onClose();
  };

  const handleMagicWandChain = () => {
    const nextSalt = wandSalt + 1;
    setWandSalt(nextSalt);
    const [err, outcome] = handleMagicWandResolveAndChain(dossier.id, nextSalt);
    if (err || !outcome) {
      setToast({
        id: Date.now(),
        tone: 'warn',
        text: err?.message ?? 'Aucun arbitrage aléatoire finançable disponible.',
      });
      return;
    }
    if (outcome.nextDossier) {
      setToast({
        id: Date.now(),
        tone: 'success',
        text: outcome.autoDrawnBonus
          ? `Baguette Magique : ${outcome.pickedLabel} · Carte bonus piochée : « ${outcome.nextDossier.title} »`
          : `Baguette Magique : ${outcome.pickedLabel} → Suivant : « ${outcome.nextDossier.title} »`,
      });
      setActiveDossierId(outcome.nextDossier.id);
      return;
    }
    setToast({
      id: Date.now(),
      tone: 'success',
      text: `Baguette Magique : ${outcome.pickedLabel} · Tous les événements finançables du tour sont arbitrés.`,
    });
    onClose();
  };

  const handleDrawBonusCard = () => {
    const [err, drawn] = handleDrawAstralisBonusEvent();
    if (err || !drawn) {
      setToast({ id: Date.now(), tone: 'warn', text: err?.message ?? 'Pioche indisponible.' });
      return;
    }
    setToast({
      id: Date.now(),
      tone: 'info',
      text: `Événement bonus pioché (Main Astralis) : « ${drawn.title} ».`,
    });
    setActiveDossierId(drawn.id);
  };

  const handleGenerateEvent = async () => {
    try {
      const res = await oracleMutation.mutateAsync(dossier.dossierClass);
      setToast({
        id: Date.now(),
        tone: 'info',
        text: `Nouvel événement ajouté : « ${res.dossier.title} ».`,
      });
    } catch (e) {
      setToast({ id: Date.now(), tone: 'warn', text: e instanceof Error ? e.message : 'Générateur indisponible.' });
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-rose-950/35 dark:bg-[#0d0611]/85 ${
        fullscreen ? 'items-stretch p-0' : 'items-end p-0 sm:items-center sm:p-6'
      }`}
    >
      <div
        role="dialog"
        aria-label={`Dossier ${dossier.title}`}
        className={`exo-bento-card flex w-full flex-col ${
          fullscreen
            ? 'h-[100dvh] max-w-none rounded-none'
            : 'max-h-[94dvh] max-w-4xl rounded-t-2xl sm:max-h-[90vh] sm:rounded-2xl'
        }`}
      >
        {/* Header with Magic Wand + Astralis 7-Card Ribbon + Window / Fullscreen Toggle */}
        <div className="border-b border-rose-200 px-4 py-3 dark:border-rose-900/60 sm:px-5 sm:py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                <ExoTooltip
                  title={`Dossier Exécutif ${dossier.dossierClass} — Atelier 3 Étages`}
                  formula="ΔP_adapt ∈ [-0.15, +0.15] · Horizon DELAYED_ECHO · R-24 / R-26"
                  body="Toute mutation du monde passe par cet arbitrage : Étage 1 Skill-Check New Vegas, Étage 2 Modules Anno / Prêt Cities II, Étage 3 Audit & Preview 3D."
                  accent={dossier.dossierClass === 'P0' ? 'coral' : 'cyan'}
                  align="left"
                >
                  <span className="exo-accent-btn cursor-help rounded-md px-2 py-0.5 font-bold">
                    {formatDossierCategory(dossier.dossierClass)}
                  </span>
                </ExoTooltip>
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10.5px] font-semibold ${
                    dossierContext.urgency.level === 'CRITICAL'
                      ? 'border-rose-400 bg-rose-500/15 text-rose-800 dark:text-rose-200'
                      : dossierContext.urgency.level === 'HIGH'
                        ? 'border-amber-300 bg-amber-500/15 text-amber-900 dark:text-amber-200'
                        : 'border-rose-200 bg-rose-50/80 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
                  }`}
                >
                  {dossierContext.urgency.label}
                </span>
                {dossier.source === 'ACTION_GATEWAY' && (
                  <span className="rounded-md bg-pink-500/15 px-2 py-0.5 text-[10.5px] font-semibold text-pink-700 dark:bg-pink-500/25 dark:text-pink-200">
                    Opération directe
                  </span>
                )}
                <span className="text-[11px] text-rose-900/65 dark:text-rose-200/70">{dossier.code}</span>
              </div>
              <h2 className="mt-1 font-display text-lg font-bold text-[#1f1224] dark:text-rose-50 sm:text-xl">
                <RichEntityText text={dossier.title} interactive />
              </h2>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                data-testid="magic-wand-btn"
                onClick={handleMagicWandChain}
                title="Choisit un arbitrage aléatoire valide, signe et enchaîne directement vers la carte Astralis suivante (ou pioche une carte bonus si PA et ressources disponibles)"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-amber-500 px-3 font-mono text-[11px] font-bold text-slate-950 shadow-sm transition hover:bg-amber-400 whitespace-nowrap"
              >
                <Wand2 className="h-4 w-4 shrink-0" />
                <span>Baguette Magique</span>
              </button>
              <button
                type="button"
                onClick={() => setFullscreen((f) => !f)}
                aria-label={fullscreen ? 'Format fenêtre' : 'Passer en plein écran'}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-rose-200 bg-white/90 px-2.5 font-mono text-[11px] font-semibold text-rose-900 hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
              >
                {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                <span className="hidden sm:inline">{fullscreen ? 'Fenêtre' : 'Plein écran'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer la fenêtre dossier"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-white/90 text-rose-900 hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Astralis 7-Card Hand Switcher Strip */}
          <div
            data-testid="astralis-hand-strip"
            className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]"
          >
            <div className="flex flex-wrap items-center gap-1">
              <span className="mr-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Main Astralis ({astralisHand.cards.length}/{astralisHand.handLimit})
              </span>
              {astralisHand.cards.map((slot) => {
                const isCurrent = slot.dossier.id === dossier.id;
                return (
                  <button
                    key={slot.dossier.id}
                    type="button"
                    onClick={() => setActiveDossierId(slot.dossier.id)}
                    title={`${slot.dossier.title} (min ${slot.minPaCost} PA)`}
                    className={`inline-flex h-7 items-center gap-1 rounded-md border px-2 font-mono text-[10.5px] font-semibold tabular-nums transition whitespace-nowrap ${
                      isCurrent
                        ? 'border-amber-500 bg-amber-500/20 text-amber-950 dark:border-amber-400 dark:text-amber-100'
                        : slot.playable
                          ? 'border-slate-200 bg-white text-slate-700 hover:border-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                          : 'border-slate-200/60 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500'
                    }`}
                  >
                    <span>#{slot.slotNumber}</span>
                    {slot.dossier.dossierClass === 'P0' && (
                      <span className="text-[9.5px] font-bold text-rose-600 dark:text-rose-400">P0</span>
                    )}
                    <span className="opacity-70">{slot.minPaCost}PA</span>
                  </button>
                );
              })}
            </div>

            {astralisHand.canDrawBonusCard && (
              <button
                type="button"
                data-testid="modal-draw-bonus-btn"
                onClick={handleDrawBonusCard}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-sky-400/70 bg-sky-500/12 px-2.5 font-mono text-[10.5px] font-bold text-sky-900 hover:bg-sky-500/20 dark:border-sky-500/60 dark:text-sky-200 whitespace-nowrap"
              >
                <Plus className="h-3 w-3" />
                <span>Piocher bonus ({astralisHand.bonusDrawsRemaining} rest.)</span>
              </button>
            )}
          </div>

          {/* Live Header PA Progress (Current Event + Whole Turn) */}
          <div className="mt-2.5 space-y-2">
            <PaTurnProgressHeader
              mode="event"
              world={world}
              totalGeneralPa={budgetEval.totalGeneralPa}
              subDomain={selectedOption?.subPaDomain ?? null}
              totalSubPa={budgetEval.totalSubPa}
              useGeneralFallback={useGeneralFallback}
            />
            <EventQuestImpactStrip
              world={world}
              dossier={dossier}
              uiMilestones={questUi}
              onRewardClaimed={(msg) =>
                setToast({ id: Date.now(), tone: 'success', text: msg })
              }
            />
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {/* Astralis Entity Context Badges Bar */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => {
                const nextNonce = focusNonce + 1;
                setFocusNonce(nextNonce);
                setReturnContext({
                  dossierId: dossier.id,
                  title: dossier.title,
                  entityLabel: dossierContext.placeLabel,
                  returnSubscreen: 'EVENTS_HUB',
                });
                setActiveScale(2);
                setCameraFocus({
                  scale: 2,
                  targetType: 'TILE',
                  tileIndex: dossierContext.tileIndex,
                  focusNonce: nextNonce,
                });
                setSelectedTile(dossierContext.tileIndex);
                setSubscreen('NONE');
                onClose();
                setInspectedEntity({ kind: 'SECTOR', tileIndex: dossierContext.tileIndex });
              }}
              className="exo-accent-chip inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold"
            >
              <MapPin className="h-3.5 w-3.5 exo-accent-text" />
              <span>{dossierContext.placeLabel}</span>
            </button>

            {dossierContext.building && (
              <button
                type="button"
                onClick={() => {
                  const bId = dossierContext.building!.id;
                  const nextNonce = focusNonce + 1;
                  setFocusNonce(nextNonce);
                  setReturnContext({
                    dossierId: dossier.id,
                    title: dossier.title,
                    entityLabel: dossierContext.building!.name,
                    returnSubscreen: 'EVENTS_HUB',
                  });
                  setActiveScale(3);
                  setCameraFocus({
                    scale: 3,
                    targetType: 'DISTRICT',
                    districtId: bId,
                    focusNonce: nextNonce,
                  });
                  setSelectedDistrict(bId);
                  setSubscreen('NONE');
                  onClose();
                  setInspectedEntity({ kind: 'DISTRICT', districtId: bId });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/90 bg-emerald-500/12 px-2.5 py-1 font-semibold text-emerald-900 hover:bg-emerald-500/20 dark:border-emerald-700 dark:text-emerald-100"
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>{dossierContext.building.name} · État {dossierContext.building.integrity}%</span>
              </button>
            )}

            {dossierContext.advisor && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300/90 bg-rose-500/12 px-2.5 py-1 font-semibold text-rose-900 dark:border-rose-700 dark:text-rose-100">
                <User className="h-3.5 w-3.5" />
                <span>Référent : {dossierContext.advisor.name}</span>
              </span>
            )}

            {dossierContext.entityBadge && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/90 bg-amber-500/12 px-2.5 py-1 font-semibold text-amber-950 dark:border-amber-700 dark:text-amber-100">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{dossierContext.entityBadge}</span>
              </span>
            )}
          </div>

          {/* 3-Level Stacked Badges: Provenance + Selected Option Philosophy/Ethics + Active Sub-Choice Modality */}
          <NestedBadgeGroup
            triplets={[
              buildProvenanceBadgeTriplet(dossier),
              ...(selectedOption
                ? [buildPhilosophyBadgeTriplet(selectedOption, philosophyCounters)]
                : []),
              ...(selectedOption && selectedSubChoice
                ? [buildSubChoiceBadgeTriplet(selectedSubChoice, selectedOption, dossier.dossierClass)]
                : []),
            ]}
          />

          {/* Briefing with Inline Entity Balises */}
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-rose-200/80 bg-rose-50/75 p-3.5 dark:border-rose-900/60 dark:bg-rose-950/35">
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-[#1f1224] dark:text-rose-50">
              <RichEntityText text={dossier.briefing} interactive />
            </p>
            <button
              type="button"
              onClick={handleLaunch3DProbe}
              className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg border border-amber-400/80 bg-amber-500/15 px-3 font-mono text-[11px] font-bold text-amber-900 hover:bg-amber-500/25 dark:border-amber-500/60 dark:bg-amber-500/20 dark:text-amber-100 whitespace-nowrap"
            >
              <Radar className="h-3.5 w-3.5" />
              <span>Inspecter en 3D</span>
            </button>
          </div>

          {isInspected3D && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/70 bg-emerald-500/12 px-3.5 py-2.5 text-xs text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-500/20 dark:text-emerald-100">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
              <span>
                <strong>Inspection 3D validée (Secteur #{dossier.tileIndex}) :</strong> Relevé terrain et état de maintenance confirmés pour cette décision.
              </span>
            </div>
          )}

          {/* BUDGETED MULTI-CHOICE & TEAMMATE / SKILL ASSIGNMENT PANEL */}
          <DossierMultiFactorPanel
            world={world}
            options={expandedOptions}
            budget={selectionBudget}
            budgetEval={budgetEval}
            selectedOptionIds={selectedOptionIds}
            assignedColonistIds={assignedColonistIds}
            onToggleColonist={handleToggleColonist}
          />

          {/* STEP 1 — PRIMARY CHOICES (4 to 8+ options with Multi-Factor Unlocks) */}
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider text-rose-900/70 dark:text-rose-200/75">
              <span>
                1 · Choix principal ({expandedOptions.length} options
                {selectionBudget.mode === 'BUDGETED_MULTI' ? ` · jusqu’à ${selectionBudget.maxSelections} combinables` : ''})
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-300">
                <Flame className="h-3 w-3" /> Déblocage multi-factoriel actif
              </span>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {expandedOptions.map((opt) => {
                const impactChips = buildOptionImpactChips(opt);
                const isSelected = selectedOptionIds.includes(opt.id);
                const unlockEval = evaluateOptionUnlockFactors(world, opt, advisorId, assignedColonistIds);
                return (
                  <div
                    key={opt.id}
                    data-testid={`dossier-opt-${opt.id}`}
                    className={`flex min-h-[44px] flex-col justify-between rounded-xl border p-3 transition ${
                      !unlockEval.unlocked
                        ? 'border-rose-300/60 bg-slate-100/75 text-[#1f1224] opacity-90 dark:border-rose-900/45 dark:bg-[#140a1a]/80 dark:text-rose-100'
                        : isSelected
                          ? 'border-cyan-500 bg-cyan-500/12 text-[#1f1224] shadow-sm ring-1 ring-cyan-400/50 dark:border-cyan-400 dark:bg-cyan-500/15 dark:text-rose-50'
                          : 'border-rose-200/90 bg-white/85 text-[#1f1224] hover:border-rose-400 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-100'
                    }`}
                  >
                    <button
                      type="button"
                      disabled={!unlockEval.unlocked}
                      aria-pressed={isSelected}
                      onClick={() => handleToggleOption(opt)}
                      className="flex flex-1 flex-col justify-between text-left disabled:cursor-not-allowed"
                    >
                      <div className="w-full">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold text-[#1f1224] dark:text-rose-50">{opt.label}</span>
                          <div className="flex shrink-0 items-center gap-1 font-mono text-[10px] font-bold">
                            <span
                              className={`rounded px-1.5 py-0.5 ${
                                opt.paGeneralCost === 0 && opt.subPaCost === 0
                                  ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200'
                                  : 'bg-amber-500/15 text-amber-900 dark:text-amber-200'
                              }`}
                            >
                              {opt.paGeneralCost + opt.subPaCost} PA
                            </span>
                            <span className="rounded bg-rose-100/80 px-1.5 py-0.5 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200">
                              {formatOrientationTag(opt.doctrineTag)}
                            </span>
                          </div>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-rose-950/80 dark:text-rose-100/80">
                          <RichEntityText text={opt.description} interactive={false} />
                        </p>
                      </div>

                      <div className="mt-2.5 w-full space-y-1.5">
                        {impactChips.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {impactChips.map((chip) => (
                              <span
                                key={chip.label}
                                className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                                  chip.positive
                                    ? 'bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
                                    : 'bg-rose-500/15 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200'
                                }`}
                              >
                                {chip.label}
                              </span>
                            ))}
                          </div>
                        )}
                        {opt.skillCheck && (
                          <div className="rounded bg-fuchsia-500/12 px-2 py-1 font-mono text-[10px] font-semibold text-fuchsia-900 dark:bg-fuchsia-500/20 dark:text-fuchsia-200">
                            Test {formatSkillAttribute(opt.skillCheck.attribute)} ≥ {opt.skillCheck.threshold} (Score équipe : {unlockEval.combinedSkillScore}) · {opt.skillCheck.successBonusLabel}
                          </div>
                        )}
                      </div>
                    </button>

                    {unlockEval.factors.length > 0 && (
                      <div className="mt-2">
                        <DossierOptionUnlockStrip
                          evaluation={unlockEval}
                          canAutoAssignColonist={unlockEval.hasAnyEligibleColonistInColony}
                          onAutoAssignColonist={() => handleAutoAssignForOption(opt)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 2 — SUB-CHOICES FOR SELECTED CHOICE (3 execution variants) */}
          {subChoices.length > 0 && (
            <div className="rounded-xl border border-rose-200/90 bg-rose-50/55 p-3.5 dark:border-rose-900/60 dark:bg-rose-950/25">
              <div className="mb-2 flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider text-rose-800 dark:text-rose-200">
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-rose-600 dark:text-rose-300" />
                  <span>2 · Sous-choix d’application ({subChoices.length} modalités)</span>
                </span>
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-300">
                  Personnalise le choix sélectionné
                </span>
              </div>
              <div className="grid gap-2.5 md:grid-cols-3">
                {subChoices.map((sub, idx) => {
                  const active = sub.id === selectedSubChoice?.id;
                  const chips = buildSubChoiceChips(sub);
                  const badge = getSubChoiceBadgeMeta(sub);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      data-testid={`subchoice-card-${sub.id}`}
                      onClick={() => setSubChoiceId(sub.id)}
                      className={`flex min-w-0 flex-col justify-between rounded-xl border p-3 text-left transition ${
                        active
                          ? 'border-rose-500 bg-white text-[#1f1224] shadow-sm ring-1 ring-rose-400/50 dark:border-rose-400 dark:bg-[#190d1f] dark:text-rose-50'
                          : 'border-rose-200/80 bg-white/75 text-[#1f1224] hover:border-rose-400 dark:border-rose-900/60 dark:bg-[#190d1f]/60 dark:text-rose-100'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="mb-1.5 flex items-center justify-between gap-1.5 font-mono text-[9.5px] font-bold">
                          <span
                            className={`shrink-0 rounded border px-1.5 py-0.5 ${SUBCHOICE_TONE_STYLE[badge.tone]}`}
                          >
                            {idx + 1} · {badge.modeTag}
                          </span>
                          <span className="truncate text-[9.5px] font-semibold text-rose-900/70 dark:text-rose-200/75">
                            {badge.focusTag} · {badge.costTag}
                          </span>
                        </div>
                        <div className="text-xs font-bold leading-snug text-[#1f1224] dark:text-rose-50">
                          {sub.label}
                        </div>
                        <p className="mt-1 text-[11px] leading-snug text-rose-950/80 dark:text-rose-100/80">
                          <RichEntityText text={sub.description} interactive={false} />
                        </p>
                      </div>
                      {chips.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1 border-t border-rose-200/50 pt-2 dark:border-rose-900/40">
                          {chips.map((c) => (
                            <span
                              key={c.label}
                              className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums ${
                                c.positive
                                  ? 'bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
                                  : 'bg-rose-500/15 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200'
                              }`}
                            >
                              {c.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3 — ADVISOR, INTENSITY & REVISED CARD 3 (ÉQUIPEMENT BONUS) */}
          <div className="grid gap-3 lg:grid-cols-3">
            <label className="flex flex-col justify-between rounded-xl border border-rose-200/90 bg-white/90 p-3 text-xs text-[#1f1224] dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-50">
              <div>
                <div className="flex items-center justify-between font-mono text-[10px] uppercase text-rose-900/70 dark:text-rose-200/75">
                  <span>3A · Responsable</span>
                  <span>Skill-Check</span>
                </div>
                <select
                  value={advisorId}
                  onChange={(e) => setAdvisorId(e.target.value)}
                  className="mt-2 min-h-[42px] w-full rounded-lg border border-rose-200 bg-rose-50/50 px-2.5 py-2 text-xs text-[#1f1224] dark:border-rose-800 dark:bg-[#190d1f] dark:text-rose-50"
                >
                  {world.advisors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatSubPaDomain(a.domain)} · {a.attributeScore})
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-2 text-[11px] text-rose-900/70 dark:text-rose-200/70">
                Ajoute son score de domaine au test d’équipe.
              </p>
            </label>

            <div className="flex flex-col justify-between rounded-xl border border-rose-200/90 bg-white/90 p-3 text-xs text-[#1f1224] dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-50">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase text-rose-900/70 dark:text-rose-200/75">
                <span>3B · Intensité</span>
                <span className="tabular-nums">×{refinement === 0 ? '1.0' : refinement === 1 ? '1.5' : '2.0'} PA</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {([
                  { lvl: 0 as RefinementLevel, title: 'Std', hint: '×1.0' },
                  { lvl: 1 as RefinementLevel, title: '+1', hint: '+20%' },
                  { lvl: 2 as RefinementLevel, title: '+2', hint: '+40%' },
                ]).map((item) => {
                  const active = refinement === item.lvl;
                  return (
                    <button
                      key={item.lvl}
                      type="button"
                      onClick={() => setRefinement(item.lvl)}
                      className={`rounded-lg border px-2 py-2 text-center transition ${
                        active
                          ? 'border-amber-500 bg-amber-500/15 font-bold text-amber-950 dark:border-amber-400 dark:text-amber-100'
                          : 'border-rose-200/80 bg-rose-50/40 text-rose-900 hover:border-rose-400 dark:border-rose-900/50 dark:bg-[#190d1f] dark:text-rose-200'
                      }`}
                    >
                      <div className="font-mono text-xs font-bold">{item.title}</div>
                      <div className="font-mono text-[10px] opacity-75">{item.hint}</div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-rose-900/70 dark:text-rose-200/70">
                Amplifie les gains de ressources et d’atmosphère.
              </p>
            </div>

            {/* REVISED CARD 3: 3C · Équipement bonus (Interactive 4-module selector with live yield previews) */}
            <div
              data-testid="dossier-card3-equipment"
              className="flex flex-col justify-between rounded-xl border border-amber-300/80 bg-white/95 p-3 text-xs text-[#1f1224] dark:border-amber-700/60 dark:bg-rose-950/30 dark:text-rose-50"
            >
              <div className="flex items-center justify-between font-mono text-[10px] uppercase text-amber-800 dark:text-amber-300">
                <span>3C · Équipement bonus</span>
                <span>Module Anno</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {([
                  { id: 'NONE' as const, label: 'Standard', bonus: 'Aucun surcoût', Icon: Layers },
                  { id: 'ENERGY_BOOST' as const, label: 'Solaire', bonus: '+12 Énergie', Icon: Zap },
                  { id: 'STORAGE_BAY' as const, label: 'Entrepôt', bonus: '+12 Matériaux', Icon: Package },
                  { id: 'OUTPUT_CORE' as const, label: 'Production', bonus: '+8 Calcul/Élec', Icon: Cpu },
                ]).map(({ id, label, bonus, Icon }) => {
                  const active = moduleExt === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      data-testid={`equip-opt-${id.toLowerCase()}`}
                      onClick={() => setModuleExt(id)}
                      className={`flex flex-col rounded-lg border px-2 py-1.5 text-left transition ${
                        active
                          ? 'border-amber-500 bg-amber-500/15 text-amber-950 ring-1 ring-amber-400/40 dark:border-amber-400 dark:text-amber-100'
                          : 'border-rose-200/80 bg-rose-50/40 text-rose-900 hover:border-amber-400 dark:border-rose-900/50 dark:bg-[#190d1f] dark:text-rose-200'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1 font-semibold text-[11px]">
                        <Icon className="h-3 w-3 shrink-0" />
                        {label}
                      </span>
                      <span className="font-mono text-[9.5px] opacity-80">{bonus}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STEP 4 — CONTEXTUAL MONDE MICRO-MODULE (AI-assisted operational fine-tuning) */}
          <ContextualMondeMicroModule selectedOption={selectedOption ?? null} />

          {/* Combined 4-Pole Partitioned Bilan (Actions/Build, Economy, Biosphere, Human/Politics) & PA Cost */}
          <div className="space-y-2.5 rounded-xl border border-rose-200 bg-rose-50/75 px-4 py-3 text-xs dark:border-rose-900/60 dark:bg-rose-950/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-rose-900/80 dark:text-rose-200/85">
                Bilan partitionné par pôles (Actions · Économie · Biosphère · Humain)
              </span>
              <span className="font-mono text-[10px] text-rose-700/80 dark:text-rose-300/80">
                {partitionedBilan.actionsPole.length} action{partitionedBilan.actionsPole.length > 1 ? 's' : ''} engagée{partitionedBilan.actionsPole.length > 1 ? 's' : ''}
              </span>
            </div>
            <DossierBilanPolesPanel
              bilan={partitionedBilan}
              moduleExt={moduleExt}
              onQuickBuildModule={setModuleExt}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex min-h-[36px] items-center gap-2.5 text-[#1f1224] dark:text-rose-100">
                <input
                  type="checkbox"
                  checked={useGeneralFallback}
                  onChange={(e) => setUseGeneralFallback(e.target.checked)}
                  className="h-4.5 w-4.5 shrink-0 accent-rose-600"
                />
                <span>Compléter avec les PA généraux si besoin</span>
              </label>
              <div className="font-mono font-semibold text-rose-700 dark:text-rose-300">
                Coût total : {budgetEval.totalGeneralPa} PA · {budgetEval.totalSubPa} {formatSubPaDomain(selectedOption?.subPaDomain)}
                {selectedOptions.length > 1 ? ` (${selectedOptions.length} décisions)` : ''}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-rose-200 px-4 py-3.5 dark:border-rose-900/60 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5">
          <button
            type="button"
            disabled={oracleMutation.isPending}
            onClick={() => void handleGenerateEvent()}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3.5 text-xs font-semibold text-rose-800 hover:border-rose-500 disabled:opacity-50 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-100"
          >
            <Sparkles className="h-3.5 w-3.5 text-rose-600 dark:text-rose-300" />
            <span>{oracleMutation.isPending ? 'Création…' : 'Générer un autre événement'}</span>
          </button>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {astralisHand.playableCount > 1 && (
              <button
                type="button"
                data-testid="sign-and-next-btn"
                disabled={!budgetEval.allowed}
                onClick={() => handleSign(true)}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-amber-500/80 bg-amber-500/15 px-4 text-xs font-bold text-amber-950 hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50 dark:text-amber-100 whitespace-nowrap"
              >
                <span>Valider &amp; Suivant</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              disabled={!budgetEval.allowed}
              onClick={() => handleSign(false)}
              className="min-h-[44px] w-full rounded-xl bg-rose-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto whitespace-nowrap"
            >
              Valider la décision{selectedOptions.length > 1 ? ` (${selectedOptions.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
