import type {
  DossierOption,
  OptionUnlockConditions,
} from '../../contracts/pa-dossiers.schema.ts';
import type { AtmosphereTier } from '../../contracts/render-bridge.schema.ts';
import type { Colonist, WorldState } from '../../contracts/world-state.schema.ts';
import { SHARED_TECHS_30 } from '../../data/v4-catalog.data.ts';
import { formatSpecialtyLabel } from '../economy-urban/workforce-assignments.ts';

/**
 * [L3] EXW.L3.MULTI_FACTOR_UNLOCK | v5.1.0 | SADT A2.1/A2.2
 * Pure deterministic Multi-Factor Conditional Unlock Evaluator:
 * - Teammate/Colonist specialty + minimum level + fatigue threshold
 * - Advisor + Assigned Colonist combined skill score
 * - Era, Atmosphere Tier (P1..P4), Tech unlock, Resource stocks & Super-Alliance Trust
 * Zero I/O, zero Math.random(), zero Z0/R-50 tokens.
 */
export type SkillAttribute = 'engineering' | 'diplomacy' | 'ecology' | 'strategy' | 'cyber';

export interface UnlockFactorCheck {
  readonly id: string;
  readonly label: string;
  readonly requiredLabel: string;
  readonly currentLabel: string;
  readonly met: boolean;
}

export interface OptionUnlockEvaluation {
  readonly unlocked: boolean;
  readonly factors: readonly UnlockFactorCheck[];
  readonly combinedSkillScore: number;
  readonly requiredColonistCount: number;
  readonly hasAnyEligibleColonistInColony: boolean;
}

const ATMO_RANK: Record<AtmosphereTier, number> = { P1: 1, P2: 2, P3: 3, P4: 4 };

const SPECIALTY_SKILL_AFFINITY: Record<Colonist['specialty'], SkillAttribute> = {
  ENGINEERING: 'engineering',
  AGRONOMY: 'ecology',
  CYBERNETICS: 'cyber',
  SECURITY: 'strategy',
  EXOBIOLOGY: 'ecology',
};

const SKILL_LABELS_FR: Record<SkillAttribute, string> = {
  engineering: 'Ingénierie',
  diplomacy: 'Diplomatie',
  ecology: 'Écologie',
  strategy: 'Stratégie',
  cyber: 'Cybernétique',
};

export function computeColonistSkillContribution(
  colonist: Colonist,
  attribute: SkillAttribute,
): number {
  const lvl = colonist.level ?? 1;
  const gearScore =
    ((colonist.gear?.toolTier ?? 1) - 1) +
    ((colonist.gear?.outfitTier ?? 1) - 1) +
    ((colonist.gear?.weaponTier ?? 1) - 1);
  const affinityBonus = SPECIALTY_SKILL_AFFINITY[colonist.specialty] === attribute ? 4 : 1;
  const diploBonus = attribute === 'diplomacy' && colonist.morale >= 75 ? 2 : 0;
  const fatiguePenalty = colonist.fatigue >= 80 ? -2 : 0;
  return Math.max(1, affinityBonus + lvl * 2 + gearScore + diploBonus + fatiguePenalty);
}

export function computeCombinedSkillScore(
  world: WorldState,
  advisorId: string,
  assignedColonistIds: readonly string[],
  attribute: SkillAttribute,
): number {
  const advisor = world.advisors.find((a) => a.id === advisorId) ?? world.advisors[0];
  const advisorBase = advisor ? advisor.attributeScore + advisor.traitBonus : 6;
  const assignedColonists = world.colonists.filter((c) => assignedColonistIds.includes(c.id));
  const colonistBoost = assignedColonists.reduce(
    (sum, col) => sum + Math.ceil(computeColonistSkillContribution(col, attribute) / 2),
    0,
  );
  return advisorBase + colonistBoost;
}

function formatTechTitle(techId: string): string {
  return SHARED_TECHS_30.find((t) => t.id === techId)?.name ?? techId;
}

export function isColonistEligibleForConditions(
  colonist: Colonist,
  cond: OptionUnlockConditions,
): boolean {
  if (colonist.fatigue >= 92) return false;
  if (cond.requiredColonistSpecialty && colonist.specialty !== cond.requiredColonistSpecialty) {
    return false;
  }
  if (cond.minColonistLevel && (colonist.level ?? 1) < cond.minColonistLevel) {
    return false;
  }
  return true;
}

export function findRecommendedColonistsForOption(
  world: WorldState,
  option: DossierOption,
  maxCount = 2,
): readonly string[] {
  const cond = option.unlockConditions;
  const attr: SkillAttribute =
    cond?.minSkillThreshold?.attribute ?? option.skillCheck?.attribute ?? 'engineering';
  const sorted = [...world.colonists]
    .filter((c) => c.fatigue < 92)
    .sort((a, b) => {
      const aElig = cond && isColonistEligibleForConditions(a, cond) ? 1 : 0;
      const bElig = cond && isColonistEligibleForConditions(b, cond) ? 1 : 0;
      if (aElig !== bElig) return bElig - aElig;
      return computeColonistSkillContribution(b, attr) - computeColonistSkillContribution(a, attr);
    });
  const count = Math.max(cond?.minColonistCount ?? 1, 1);
  return sorted.slice(0, Math.min(maxCount, count)).map((c) => c.id);
}

export function evaluateOptionUnlockFactors(
  world: WorldState,
  option: DossierOption,
  advisorId: string,
  assignedColonistIds: readonly string[],
): OptionUnlockEvaluation {
  const cond = option.unlockConditions;
  const attr: SkillAttribute =
    cond?.minSkillThreshold?.attribute ?? option.skillCheck?.attribute ?? 'engineering';
  const combinedSkillScore = computeCombinedSkillScore(world, advisorId, assignedColonistIds, attr);

  if (!cond) {
    return {
      unlocked: true,
      factors: [],
      combinedSkillScore,
      requiredColonistCount: 0,
      hasAnyEligibleColonistInColony: true,
    };
  }

  const factors: UnlockFactorCheck[] = [];
  const assignedColonists = world.colonists.filter((c) => assignedColonistIds.includes(c.id));
  const minColCount =
    cond.minColonistCount ?? (cond.requiredColonistSpecialty || cond.minColonistLevel ? 1 : 0);

  const matchingAssigned = assignedColonists.filter((c) => isColonistEligibleForConditions(c, cond));
  const eligibleInColony = world.colonists.filter((c) => isColonistEligibleForConditions(c, cond));

  if (minColCount > 0 || cond.requiredColonistSpecialty || cond.minColonistLevel) {
    const specTxt = cond.requiredColonistSpecialty
      ? formatSpecialtyLabel(cond.requiredColonistSpecialty)
      : 'Spécialiste';
    const lvlTxt = cond.minColonistLevel ? ` Niv.≥${cond.minColonistLevel}` : '';
    const countTxt = minColCount > 1 ? `${minColCount}× ` : '';
    const met = matchingAssigned.length >= Math.max(1, minColCount);
    factors.push({
      id: 'colonist',
      label: 'Coéquipier affecté',
      requiredLabel: `${countTxt}${specTxt}${lvlTxt}`,
      currentLabel:
        matchingAssigned.length > 0
          ? `${matchingAssigned[0]!.name} (Niv.${matchingAssigned[0]!.level ?? 1})`
          : assignedColonists.length > 0
            ? `${assignedColonists[0]!.name} incompatible`
            : 'Aucun affecté',
      met,
    });
  }

  if (cond.minSkillThreshold) {
    const sk = cond.minSkillThreshold;
    const score = computeCombinedSkillScore(world, advisorId, assignedColonistIds, sk.attribute);
    factors.push({
      id: 'skill',
      label: `Compétence ${SKILL_LABELS_FR[sk.attribute]}`,
      requiredLabel: `≥ ${sk.level}`,
      currentLabel: `${score}`,
      met: score >= sk.level,
    });
  }

  if (cond.minEra) {
    factors.push({
      id: 'era',
      label: 'Ère civilisationnelle',
      requiredLabel: `Ère ≥ ${cond.minEra}`,
      currentLabel: `Ère ${world.era}`,
      met: world.era >= cond.minEra,
    });
  }

  if (cond.minAtmosphereTier) {
    factors.push({
      id: 'atmo',
      label: 'Palier atmosphérique',
      requiredLabel: `≥ ${cond.minAtmosphereTier}`,
      currentLabel: world.atmosphereTier,
      met: ATMO_RANK[world.atmosphereTier] >= ATMO_RANK[cond.minAtmosphereTier],
    });
  }

  if (cond.requiredTechId) {
    const hasTech = world.hk?.unlockedTechIds.includes(cond.requiredTechId) ?? false;
    factors.push({
      id: 'tech',
      label: 'Technologie requise',
      requiredLabel: formatTechTitle(cond.requiredTechId),
      currentLabel: hasTech ? 'Débloquée' : 'Non recherchée',
      met: hasTech,
    });
  }

  if (cond.minResources?.credits !== undefined) {
    const req = cond.minResources.credits;
    factors.push({
      id: 'res-credits',
      label: 'Trésorerie',
      requiredLabel: `≥ ${req} Cr`,
      currentLabel: `${Math.round(world.resources.credits)} Cr`,
      met: world.resources.credits >= req,
    });
  }
  if (cond.minResources?.compute !== undefined) {
    const req = cond.minResources.compute;
    factors.push({
      id: 'res-compute',
      label: 'Capacité Calcul',
      requiredLabel: `≥ ${req}`,
      currentLabel: `${Math.round(world.resources.compute)}`,
      met: world.resources.compute >= req,
    });
  }
  if (cond.minResources?.materials !== undefined) {
    const req = cond.minResources.materials;
    factors.push({
      id: 'res-materials',
      label: 'Matériaux',
      requiredLabel: `≥ ${req}`,
      currentLabel: `${Math.round(world.resources.materials)}`,
      met: world.resources.materials >= req,
    });
  }
  if (cond.minResources?.energy !== undefined) {
    const req = cond.minResources.energy;
    factors.push({
      id: 'res-energy',
      label: 'Énergie',
      requiredLabel: `≥ ${req}`,
      currentLabel: `${Math.round(world.resources.energy)}`,
      met: world.resources.energy >= req,
    });
  }
  if (cond.minAllianceTrust !== undefined) {
    const req = cond.minAllianceTrust;
    factors.push({
      id: 'trust',
      label: 'Confiance Alliance',
      requiredLabel: `≥ ${req}%`,
      currentLabel: `${Math.round(world.superAllianceTrust)}%`,
      met: world.superAllianceTrust >= req,
    });
  }

  return {
    unlocked: factors.every((f) => f.met),
    factors,
    combinedSkillScore,
    requiredColonistCount: minColCount,
    hasAnyEligibleColonistInColony: eligibleInColony.length >= Math.max(1, minColCount),
  };
}

export {
  evaluateBudgetedSelection,
  resolveDossierSelectionBudget,
  type BudgetedSelectionEvaluation,
} from './budgeted-selection.engine.ts';
