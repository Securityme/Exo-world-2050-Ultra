import type {
  EcclesiaDiscernmentGrade,
  EcclesiaState,
  PlanetaryDiplomacyState,
  PlanetaryTreaty,
  PlanetaryTreatyKind,
} from '../../contracts/skills-vcs.schema.ts';
import { err, ok, type ExwResult } from '../../contracts/trigger-bus.schema.ts';
import type { WorldState } from '../../contracts/world-state.schema.ts';

/**
 * [L3] EXW.L3.PLANETARY_DIPLOMACY | v5.1.0 | SADT A3.2
 * Planetary bilateral treaties, global influence (0..100),
 * Ecclesia & Thomistic Discernment (FEAT-55/56, AR-17/18/19) with absolute Freedom of Conscience.
 */

export interface TreatyCatalogSpec {
  readonly kind: PlanetaryTreatyKind;
  readonly label: string;
  readonly durationCycles: number;
  readonly creditsPerCycle: number;
  readonly scienceComputePerCycle: number;
  readonly influenceDelta: number;
  readonly relationDelta: number;
  readonly bonusLabel: string;
}

export const PLANETARY_TREATY_CATALOG: Readonly<Record<PlanetaryTreatyKind, TreatyCatalogSpec>> = {
  MARITIME_TRADE: {
    kind: 'MARITIME_TRADE',
    label: 'Route Commerciale Maritime',
    durationCycles: 6,
    creditsPerCycle: 38,
    scienceComputePerCycle: 0,
    influenceDelta: 4,
    relationDelta: 8,
    bonusLabel: '+38 Cr/cycle · +4 Influence · +8 Relation',
  },
  NON_AGGRESSION: {
    kind: 'NON_AGGRESSION',
    label: 'Pacte de Non-Agression Planétaire',
    durationCycles: 8,
    creditsPerCycle: 10,
    scienceComputePerCycle: 2,
    influenceDelta: 5,
    relationDelta: 12,
    bonusLabel: 'Trêve frontalière 8 cycles · +12 Relation',
  },
  SCIENCE_SHARE: {
    kind: 'SCIENCE_SHARE',
    label: 'Partage Scientifique & Biosphère',
    durationCycles: 6,
    creditsPerCycle: 0,
    scienceComputePerCycle: 12,
    influenceDelta: 6,
    relationDelta: 9,
    bonusLabel: '+12 Calcul/cycle · +6 Influence · +9 Relation',
  },
  ORBITAL_EMBARGO: {
    kind: 'ORBITAL_EMBARGO',
    label: 'Embargo Logistique Orbital',
    durationCycles: 4,
    creditsPerCycle: 0,
    scienceComputePerCycle: 0,
    influenceDelta: -3,
    relationDelta: -18,
    bonusLabel: 'Freine le rival ciblé · −18 Relation',
  },
  PLANETARY_SUMMIT: {
    kind: 'PLANETARY_SUMMIT',
    label: 'Sommet Planétaire de Paix',
    durationCycles: 5,
    creditsPerCycle: 20,
    scienceComputePerCycle: 6,
    influenceDelta: 10,
    relationDelta: 10,
    bonusLabel: '+10 Influence · +6 % Confiance Super-Alliance',
  },
};

export function formatTreatyKindLabel(kind: PlanetaryTreatyKind): string {
  return PLANETARY_TREATY_CATALOG[kind]?.label ?? kind;
}

export function createInitialPlanetaryDiplomacy(tension: 'DETENDUE' | 'EQUILIBREE' | 'TENDUE' = 'EQUILIBREE'): PlanetaryDiplomacyState {
  const baseInfluence = tension === 'DETENDUE' ? 42 : tension === 'TENDUE' ? 24 : 32;
  return {
    influenceScore: baseInfluence,
    treaties: [],
  };
}

export function createInitialEcclesiaState(): EcclesiaState {
  return {
    pastoralAxis: 52,
    charityAxis: 58,
    contemplationAxis: 48,
    dialogueAxis: 55,
    freedomOfConscienceScore: 100,
    lastDiscernmentGrade: 2,
  };
}

export function executeSignPlanetaryTreatyPure(
  state: WorldState,
  treatyKind: PlanetaryTreatyKind,
  rivalId?: string,
): ExwResult<{ readonly nextState: WorldState; readonly note: string }> {
  const spec = PLANETARY_TREATY_CATALOG[treatyKind];
  const sortedRivals = [...state.rivals].sort((a, b) => a.relationWithPlayer - b.relationWithPlayer);
  const partner =
    treatyKind === 'PLANETARY_SUMMIT'
      ? null
      : (rivalId ? state.rivals.find((r) => r.id === rivalId) : undefined) ?? sortedRivals[0] ?? null;

  if (treatyKind !== 'PLANETARY_SUMMIT' && !partner) {
    return err('EXW_ERR_SCHEMA', 'Aucun partenaire rival disponible pour ce traité.');
  }

  const currentDip = state.planetaryDiplomacy ?? createInitialPlanetaryDiplomacy();
  const duplicate = currentDip.treaties.some(
    (t) => t.kind === treatyKind && t.partnerRivalId === (partner?.id ?? null) && t.remainingCycles > 0,
  );
  if (duplicate) {
    return err('EXW_ERR_SCHEMA', `Un traité « ${spec.label} » est déjà actif avec ce partenaire.`);
  }

  const treaty: PlanetaryTreaty = {
    id: `trt-${treatyKind}-${partner?.id ?? 'global'}-c${state.cycle}`,
    kind: treatyKind,
    partnerRivalId: partner?.id ?? null,
    partnerName: partner?.name ?? state.superAllianceName,
    signedCycle: state.cycle,
    durationCycles: spec.durationCycles,
    remainingCycles: spec.durationCycles,
    bonusLabel: spec.bonusLabel,
  };

  const nextRivals = partner
    ? state.rivals.map((r) =>
        r.id === partner.id
          ? {
              ...r,
              relationWithPlayer: Math.max(-100, Math.min(100, r.relationWithPlayer + spec.relationDelta)),
              paralyzedCycles: treatyKind === 'ORBITAL_EMBARGO' ? Math.max(r.paralyzedCycles, 2) : r.paralyzedCycles,
            }
          : r,
      )
    : state.rivals.map((r) => ({
        ...r,
        relationWithPlayer: Math.min(100, r.relationWithPlayer + 6),
      }));

  const nextInfluence = Math.max(0, Math.min(100, currentDip.influenceScore + spec.influenceDelta));
  const nextTrust =
    treatyKind === 'PLANETARY_SUMMIT'
      ? Math.min(100, state.superAllianceTrust + 6)
      : treatyKind === 'ORBITAL_EMBARGO'
        ? state.superAllianceTrust
        : Math.min(100, state.superAllianceTrust + 2);

  const nextState: WorldState = {
    ...state,
    rivals: nextRivals,
    superAllianceTrust: nextTrust,
    planetaryDiplomacy: {
      influenceScore: nextInfluence,
      treaties: [treaty, ...currentDip.treaties].slice(0, 12),
    },
    resources: {
      ...state.resources,
      galacticInfluence: state.resources.galacticInfluence + (treatyKind === 'PLANETARY_SUMMIT' ? 8 : 3),
    },
    xp: {
      ...state.xp,
      alliance: state.xp.alliance + 18,
      civilization: state.xp.civilization + 12,
    },
  };

  return ok({
    nextState,
    note: `${spec.label} ratifié (${treaty.partnerName}) — Influence planétaire ${nextInfluence}/100.`,
  });
}

export function stepPlanetaryTreatiesPure(state: WorldState): {
  readonly planetaryDiplomacy: PlanetaryDiplomacyState;
  readonly treatyCreditsDelta: number;
  readonly treatyComputeDelta: number;
} {
  const current = state.planetaryDiplomacy ?? createInitialPlanetaryDiplomacy();
  let treatyCreditsDelta = 0;
  let treatyComputeDelta = 0;

  const active = current.treaties
    .map((t) => {
      const spec = PLANETARY_TREATY_CATALOG[t.kind];
      treatyCreditsDelta += spec.creditsPerCycle;
      treatyComputeDelta += spec.scienceComputePerCycle;
      return { ...t, remainingCycles: Math.max(0, t.remainingCycles - 1) };
    })
    .filter((t) => t.remainingCycles > 0);

  return {
    planetaryDiplomacy: {
      influenceScore: Math.max(0, Math.min(100, current.influenceScore + (active.length > 0 ? 1 : 0))),
      treaties: active,
    },
    treatyCreditsDelta,
    treatyComputeDelta,
  };
}

export function executeEcclesiaDiscernmentPure(
  state: WorldState,
  axis: 'PASTORAL' | 'CHARITY' | 'CONTEMPLATION' | 'DIALOGUE',
): ExwResult<{ readonly nextState: WorldState; readonly note: string }> {
  const current = state.ecclesiaState ?? createInitialEcclesiaState();
  const nextEcclesia: EcclesiaState = {
    pastoralAxis: axis === 'PASTORAL' ? Math.min(100, current.pastoralAxis + 8) : current.pastoralAxis,
    charityAxis: axis === 'CHARITY' ? Math.min(100, current.charityAxis + 8) : current.charityAxis,
    contemplationAxis: axis === 'CONTEMPLATION' ? Math.min(100, current.contemplationAxis + 8) : current.contemplationAxis,
    dialogueAxis: axis === 'DIALOGUE' ? Math.min(100, current.dialogueAxis + 8) : current.dialogueAxis,
    // AR-19: Absolute Freedom of Conscience invariant — never coerces citizens
    freedomOfConscienceScore: 100,
    lastDiscernmentGrade: 3 as EcclesiaDiscernmentGrade,
  };

  const nextColonists = state.colonists.map((c) => ({
    ...c,
    morale: Math.min(100, c.morale + 5),
    happiness: Math.min(100, (c.happiness ?? 72) + 6),
  }));

  const axisLabels: Record<typeof axis, string> = {
    PASTORAL: 'Accompagnement Pastoral & Paroisses',
    CHARITY: 'Œuvres Caritatives & Entraide Locale',
    CONTEMPLATION: 'Sanctuaires de Contemplation & Paix Intérieure',
    DIALOGUE: 'Dialogue Fraternel & Liberté de Conscience (AR-19)',
  };

  return ok({
    nextState: {
      ...state,
      ecclesiaState: nextEcclesia,
      colonists: nextColonists,
      approval: Math.min(100, state.approval + 3),
      xp: {
        ...state.xp,
        civilization: state.xp.civilization + 16,
      },
    },
    note: `${axisLabels[axis]} — Discernement +3 (Grâce) · Liberté de conscience 100 %.`,
  });
}
