import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Flame,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Radar,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useAtomValue, useSetAtom } from 'jotai';
import { ExoTooltip } from '../../components/bento/ExoTooltip.tsx';
import { ContextualMondeMicroModule } from '../../components/bento/ContextualMondeMicroModule.tsx';
import { NestedBadgeGroup } from '../../components/bento/NestedBadgeGroup.tsx';
import { RichEntityText } from '../../components/RichEntityText.tsx';
import type {
  DossierOption,
  DossierSubChoice,
  ExecutiveDossier,
  RefinementLevel,
} from '../../contracts/pa-dossiers.schema.ts';
import { handleExecuteDossier } from '../../pipelines/game-actions.pipeline.ts';
import { useOracleDossierMutation } from '../../hooks/use-oracle-query.ts';
import {
  activeInvestigationDossierIdAtom,
  activeSubscreenAtom,
  inspectedDossierIdsAtom,
  inspectedEntityAtom,
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
} from '../../systems/dossiers-pa/badge-taxonomy.ts';
import {
  getEffectiveOptionsForDossier,
  getSubChoicesForOption,
} from '../../systems/dossiers-pa/dossier-subchoices.ts';
import { resolveDossierContext } from '../../systems/dossiers-pa/entity-markup.ts';
import { calculateEffectivePaCosts } from '../../systems/dossiers-pa/pa-engine.ts';
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

function buildCombinedImpactChips(
  opt: DossierOption | undefined,
  sub: DossierSubChoice | undefined,
  refinement: RefinementLevel,
): readonly { label: string; positive: boolean }[] {
  if (!opt) return [];
  const mult = refinement === 2 ? 1.4 : refinement === 1 ? 1.2 : 1.0;
  const fx = opt.effects;
  const bx = sub?.bonusEffects;
  const scale = (v: number) => (v > 0 ? Math.round(v * mult) : v);

  const totals = [
    { key: 'Cr', val: scale(fx.credits) + (bx?.credits ?? 0) },
    { key: 'Énerg.', val: scale(fx.energy) + (bx?.energy ?? 0) },
    { key: 'Mat.', val: scale(fx.materials) + (bx?.materials ?? 0) },
    { key: 'Eau', val: scale(fx.water) + (bx?.water ?? 0) },
    { key: 'Vivres', val: scale(fx.food) + (bx?.food ?? 0) },
    { key: 'Calcul', val: scale(fx.compute) + (bx?.compute ?? 0) },
    { key: 'Kits O₂', val: scale(fx.breathingKits) + (bx?.breathingKits ?? 0) },
    { key: '% Air', val: scale(fx.atmosphereDelta) + (bx?.atmosphereDelta ?? 0) },
    { key: '% État', val: scale(fx.maintenanceDelta) + (bx?.maintenanceDelta ?? 0) },
    { key: '% Alliance', val: scale(fx.allianceTrustDelta) + (bx?.allianceTrustDelta ?? 0) },
  ];

  return totals
    .filter((t) => t.val !== 0)
    .map((t) => ({
      label: `${t.val > 0 ? '+' : ''}${t.val}${t.key.startsWith('%') ? t.key : ` ${t.key}`}`,
      positive: t.val > 0,
    }));
}

export function DossierWorkshopModal({ dossier, onClose }: DossierWorkshopModalProps) {
  const world = useExoStore((s) => s.world);
  const setActiveScale = useExoStore((s) => s.setActiveScale);
  const setToast = useSetAtom(toastNoticeAtom);
  const setOverlayMode = useSetAtom(viewportOverlayModeAtom);
  const setSelectedTile = useSetAtom(selectedTileAtom);
  const setSelectedDistrict = useSetAtom(selectedDistrictIdAtom);
  const setInspectedEntity = useSetAtom(inspectedEntityAtom);
  const setSubscreen = useSetAtom(activeSubscreenAtom);
  const setInvestigationDossierId = useSetAtom(activeInvestigationDossierIdAtom);
  const inspectedIds = useAtomValue(inspectedDossierIdsAtom);
  const philosophyCounters = useMetaHonorsStore((s) => s.philosophyCumulative);
  const oracleMutation = useOracleDossierMutation();

  const expandedOptions = useMemo(() => getEffectiveOptionsForDossier(dossier), [dossier]);
  const dossierContext = useMemo(() => resolveDossierContext(world, dossier), [world, dossier]);

  const [fullscreen, setFullscreen] = useState(false);
  const [optionId, setOptionId] = useState<string>(expandedOptions[0]?.id ?? '');
  const [subChoiceId, setSubChoiceId] = useState<string>('');
  const [refinement, setRefinement] = useState<RefinementLevel>(0);
  const [advisorId, setAdvisorId] = useState<string>(
    dossierContext.advisor?.id ?? world.advisors[0]?.id ?? '',
  );
  const [useGeneralFallback, setUseGeneralFallback] = useState<boolean>(true);
  const [moduleExt, setModuleExt] = useState<'NONE' | 'ENERGY_BOOST' | 'STORAGE_BAY' | 'OUTPUT_CORE'>('NONE');

  const selectedOption = expandedOptions.find((o) => o.id === optionId) ?? expandedOptions[0];
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

  const combinedImpactChips = useMemo(
    () => buildCombinedImpactChips(selectedOption, selectedSubChoice, refinement),
    [selectedOption, selectedSubChoice, refinement],
  );

  const baseCosts = selectedOption
    ? calculateEffectivePaCosts(selectedOption.paGeneralCost, selectedOption.subPaCost, refinement)
    : { generalCost: 0, subPaCost: 0 };
  const costs = {
    generalCost: baseCosts.generalCost + (selectedSubChoice?.extraPaGeneralCost ?? 0),
    subPaCost: baseCosts.subPaCost + (selectedSubChoice?.extraSubPaCost ?? 0),
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

  const handleSign = () => {
    if (!selectedOption) return;
    const [error, summary] = handleExecuteDossier({
      dossierId: dossier.id,
      optionId: selectedOption.id,
      subChoiceId: selectedSubChoice?.id,
      refinementLevel: refinement,
      assignedAdvisorId: advisorId,
      useGeneralPaFallback: useGeneralFallback,
      moduleExtensionTag: moduleExt,
    });
    if (error) {
      setToast({ id: Date.now(), tone: 'error', text: error.message });
      return;
    }
    setToast({ id: Date.now(), tone: 'success', text: summary ?? 'Décision validée.' });
    onClose();
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
        {/* Header with Window / Fullscreen Toggle */}
        <div className="flex items-start justify-between gap-3 border-b border-rose-200 px-4 py-3.5 dark:border-rose-900/60 sm:px-5 sm:py-4">
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
            <h2 className="mt-1.5 font-display text-lg font-bold text-[#1f1224] dark:text-rose-50 sm:text-xl">
              <RichEntityText text={dossier.title} interactive />
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
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

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {/* Astralis Entity Context Badges Bar */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => {
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
                  setSelectedDistrict(dossierContext.building!.id);
                  setSubscreen('NONE');
                  onClose();
                  setInspectedEntity({ kind: 'DISTRICT', districtId: dossierContext.building!.id });
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

          {/* 3-Level Stacked Badges: Provenance + Selected Option Philosophy/Ethics + (i) Color Legend */}
          <NestedBadgeGroup
            triplets={[
              buildProvenanceBadgeTriplet(dossier),
              ...(selectedOption
                ? [buildPhilosophyBadgeTriplet(selectedOption, philosophyCounters)]
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

          {/* STEP 1 — PRIMARY CHOICES (4+ options) */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider text-rose-900/70 dark:text-rose-200/75">
              <span>1 · Choix principal ({expandedOptions.length} options)</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-300">
                <Flame className="h-3 w-3" /> Effets directs affichés
              </span>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {expandedOptions.map((opt) => {
                const impactChips = buildOptionImpactChips(opt);
                const isSelected = opt.id === selectedOption?.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setOptionId(opt.id)}
                    className={`flex min-h-[44px] flex-col justify-between rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500/12 text-[#1f1224] shadow-sm dark:border-rose-400 dark:bg-rose-500/20 dark:text-rose-50'
                        : 'border-rose-200/90 bg-white/85 text-[#1f1224] hover:border-rose-400 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#1f1224] dark:text-rose-50">{opt.label}</span>
                        <span className="shrink-0 rounded bg-rose-100/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-rose-700 dark:bg-rose-900/50 dark:text-rose-200">
                          {formatOrientationTag(opt.doctrineTag)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-rose-950/80 dark:text-rose-100/80">
                        <RichEntityText text={opt.description} interactive={false} />
                      </p>
                    </div>

                    <div className="mt-2.5 space-y-1.5">
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
                          Bonus {formatSkillAttribute(opt.skillCheck.attribute)} ≥ {opt.skillCheck.threshold} · {opt.skillCheck.successBonusLabel}
                        </div>
                      )}
                    </div>
                  </button>
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
              <div className="grid gap-2 sm:grid-cols-3">
                {subChoices.map((sub) => {
                  const active = sub.id === selectedSubChoice?.id;
                  const chips = buildSubChoiceChips(sub);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSubChoiceId(sub.id)}
                      className={`flex flex-col justify-between rounded-xl border p-2.5 text-left transition ${
                        active
                          ? 'border-rose-500 bg-white text-[#1f1224] shadow-sm ring-1 ring-rose-400/50 dark:border-rose-400 dark:bg-[#190d1f] dark:text-rose-50'
                          : 'border-rose-200/80 bg-white/75 text-[#1f1224] hover:border-rose-400 dark:border-rose-900/60 dark:bg-[#190d1f]/60 dark:text-rose-100'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-[#1f1224] dark:text-rose-50">
                          {sub.label}
                        </div>
                        <p className="mt-1 text-[11px] leading-snug text-rose-950/80 dark:text-rose-100/80">
                          <RichEntityText text={sub.description} interactive={false} />
                        </p>
                      </div>
                      {chips.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {chips.map((c) => (
                            <span
                              key={c.label}
                              className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
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

          {/* STEP 3 — ADVISOR & EXECUTION INTENSITY */}
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block rounded-xl border border-rose-200/90 bg-white/85 p-3 text-xs text-[#1f1224] dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-50">
              <span className="font-mono text-[10px] uppercase text-rose-900/70 dark:text-rose-200/75">3 · Responsable</span>
              <select
                value={advisorId}
                onChange={(e) => setAdvisorId(e.target.value)}
                className="mt-1.5 min-h-[42px] w-full rounded-lg border border-rose-200 bg-rose-50/50 px-2.5 py-2 text-xs text-[#1f1224] dark:border-rose-800 dark:bg-[#190d1f] dark:text-rose-50"
              >
                {world.advisors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatSubPaDomain(a.domain)} · {a.attributeScore})
                  </option>
                ))}
              </select>
            </label>

            <label className="block rounded-xl border border-rose-200/90 bg-white/85 p-3 text-xs text-[#1f1224] dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-50">
              <span className="font-mono text-[10px] uppercase text-rose-900/70 dark:text-rose-200/75">Intensité</span>
              <select
                value={refinement}
                onChange={(e) => setRefinement(Number(e.target.value) as RefinementLevel)}
                className="mt-1.5 min-h-[42px] w-full rounded-lg border border-rose-200 bg-rose-50/50 px-2.5 py-2 text-xs text-[#1f1224] dark:border-rose-800 dark:bg-[#190d1f] dark:text-rose-50"
              >
                <option value={0}>Standard (×1.0 coût)</option>
                <option value={1}>Renforcé +1 (×1.5 coût, +20% effet)</option>
                <option value={2}>Prioritaire +2 (×2.0 coût, +40% effet)</option>
              </select>
            </label>

            <label className="block rounded-xl border border-rose-200/90 bg-white/85 p-3 text-xs text-[#1f1224] dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-50">
              <span className="font-mono text-[10px] uppercase text-rose-900/70 dark:text-rose-200/75">Équipement bonus</span>
              <select
                value={moduleExt}
                onChange={(e) => setModuleExt(e.target.value as typeof moduleExt)}
                className="mt-1.5 min-h-[42px] w-full rounded-lg border border-rose-200 bg-rose-50/50 px-2.5 py-2 text-xs text-[#1f1224] dark:border-rose-800 dark:bg-[#190d1f] dark:text-rose-50"
              >
                <option value="NONE">Aucun</option>
                <option value="ENERGY_BOOST">Panneaux solaires</option>
                <option value="STORAGE_BAY">Entrepôt</option>
                <option value="OUTPUT_CORE">Ligne de production</option>
              </select>
            </label>
          </div>

          {/* STEP 4 — CONTEXTUAL MONDE MICRO-MODULE (AI-assisted operational fine-tuning) */}
          <ContextualMondeMicroModule selectedOption={selectedOption ?? null} />

          {/* Combined Impact Preview & PA Cost */}
          <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50/75 px-4 py-3 text-xs dark:border-rose-900/60 dark:bg-rose-950/30">
            {combinedImpactChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10.5px] font-bold uppercase text-rose-900/70 dark:text-rose-200/75">
                  Bilan estimé :
                </span>
                {combinedImpactChips.map((chip) => (
                  <span
                    key={chip.label}
                    className={`rounded-md px-1.5 py-0.5 font-mono text-[10.5px] font-bold ${
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
                Coût : {costs.generalCost} PA · {costs.subPaCost} {formatSubPaDomain(selectedOption?.subPaDomain)}
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

          <button
            type="button"
            onClick={handleSign}
            className="min-h-[44px] w-full rounded-xl bg-rose-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-rose-500 sm:w-auto"
          >
            Valider la décision
          </button>
        </div>
      </div>
    </div>
  );
}
