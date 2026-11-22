import type { WorldState } from '../../contracts/world-state.schema.ts';
import type { UnitClass, UnitLevel } from '../../contracts/combat-units.schema.ts';
import { type ExwResult, ok, err } from '../../contracts/trigger-bus.schema.ts';
import {
  COMBAT_CONSTANTS,
  ECONOMY_CONSTANTS,
} from '../../config/game.constants.ts';
import { ERAS_CATALOG } from '../../data/world.catalog.ts';
import { computeStateHash } from '../../core/hashing/state-hasher.ts';

/**
 * [L3] FUP-004 / FUP-008 | SM-03 / SM-04 | SADT A3.3, A3.4, A3.5
 * Pure Economy (Loans/Market/Anno Modules), Drones 4-Class Reassignment (R-41),
 * Cyber-Paralysis Operations (R-43/R-44), and Military Unit Production (L1–L5, R-04).
 */
export function takeBankLoan(state: WorldState, principal: number): ExwResult<WorldState> {
  if (principal < 100 || principal > 2500) {
    return err('EXW_ERR_FINANCE_LIMIT', 'Montant de prêt hors bornes (100–2500 Crédits).');
  }
  if (state.finance.loans.length >= 3) {
    return err('EXW_ERR_FINANCE_LIMIT', 'Maximum de 3 prêts actifs simultanés atteint.');
  }
  const rate = ECONOMY_CONSTANTS.SOLVENCY_INTEREST_RATES[state.finance.solvencyRating];
  const loan = {
    id: `loan-${state.cycle}-${state.finance.loans.length + 1}`,
    principal,
    remaining: Math.round(principal * (1 + rate)),
    interestRate: rate,
    cyclesLeft: 6,
  };
  const draft: WorldState = {
    ...state,
    resources: { ...state.resources, credits: state.resources.credits + principal },
    finance: { ...state.finance, loans: [...state.finance.loans, loan] },
    chronicle: [
      {
        id: `chr-loan-${state.tick}-${loan.id}`,
        cycle: state.cycle,
        tick: state.tick,
        category: 'FINANCE' as const,
        title: 'Emprunt Bancaire Fédéral',
        detail: `+${principal} Crédits contractés au taux ${(rate * 100).toFixed(0)}% (Cote ${state.finance.solvencyRating}).`,
        stateHash: state.stateHash,
      },
      ...state.chronicle,
    ].slice(0, 60),
  };
  return ok({ ...draft, stateHash: computeStateHash(draft) });
}

export function tradeResourceOnMarket(
  state: WorldState,
  resource: keyof WorldState['marketPrices'],
  action: 'BUY' | 'SELL',
  quantity: number
): ExwResult<WorldState> {
  if (quantity <= 0 || quantity > 200) {
    return err('EXW_ERR_FINANCE_LIMIT', 'Quantité d’échange invalide (1–200).');
  }
  if (resource === 'helium3' && state.era < 3) {
    return err('EXW_ERR_ERA_LOCKED', 'R-04 : L’Hélium-3 est débloqué à partir de l’Ère III.');
  }
  const unitPrice = state.marketPrices[resource];
  const totalCost = unitPrice * quantity;
  if (action === 'BUY') {
    if (state.resources.credits < totalCost) {
      return err('EXW_ERR_FINANCE_LIMIT', `Crédits insuffisants (${state.resources.credits}/${totalCost}).`);
    }
    const draft: WorldState = {
      ...state,
      resources: {
        ...state.resources,
        credits: state.resources.credits - totalCost,
        [resource]: state.resources[resource] + quantity,
      },
    };
    return ok({ ...draft, stateHash: computeStateHash(draft) });
  }
  if (state.resources[resource] < quantity) {
    return err('EXW_ERR_FINANCE_LIMIT', `Stock ${resource} insuffisant pour vente.`);
  }
  const draft: WorldState = {
    ...state,
    resources: {
      ...state.resources,
      credits: state.resources.credits + Math.round(totalCost * 0.92),
      [resource]: state.resources[resource] - quantity,
    },
  };
  return ok({ ...draft, stateHash: computeStateHash(draft) });
}

export function graftAnnoModule(state: WorldState, districtId: string): ExwResult<WorldState> {
  const target = state.districts.find((d) => d.id === districtId);
  if (!target) {
    return err('EXW_ERR_SCHEMA', 'District introuvable.');
  }
  if (target.modulesCount >= ECONOMY_CONSTANTS.MAX_MODULES_PER_BUILDING) {
    return err('EXW_ERR_FINANCE_LIMIT', 'R-36 : Maximum de 3 modules greffés atteint.');
  }
  if (state.resources.credits < 140 || state.resources.materials < 30) {
    return err('EXW_ERR_FINANCE_LIMIT', 'Ressources insuffisantes (140 Crédits + 30 Matériaux).');
  }
  const draft: WorldState = {
    ...state,
    resources: {
      ...state.resources,
      credits: state.resources.credits - 140,
      materials: state.resources.materials - 30,
    },
    districts: state.districts.map((d) =>
      d.id === districtId
        ? { ...d, modulesCount: d.modulesCount + 1, integrity: Math.min(100, d.integrity + 8) }
        : d
    ),
    xp: { ...state.xp, civilization: state.xp.civilization + 15 },
  };
  return ok({ ...draft, stateHash: computeStateHash(draft) });
}

export function reassignDroneRole(
  state: WorldState,
  fromRole: 'construction' | 'defense' | 'attack' | 'recon',
  toRole: 'construction' | 'defense' | 'attack' | 'recon'
): ExwResult<WorldState> {
  if (fromRole === toRole) return ok(state);
  if (state.drones.reassigningCooldown > 0) {
    return err('EXW_ERR_FINANCE_LIMIT', 'R-41 : Réaffectation de drones en délai de 1 cycle.');
  }
  if (state.drones[fromRole] <= 0) {
    return err('EXW_ERR_FINANCE_LIMIT', `Aucun drone disponible dans le rôle ${fromRole}.`);
  }
  const draft: WorldState = {
    ...state,
    drones: {
      ...state.drones,
      [fromRole]: state.drones[fromRole] - 1,
      [toRole]: state.drones[toRole] + 1,
      reassigningCooldown: 1,
    },
  };
  return ok({ ...draft, stateHash: computeStateHash(draft) });
}

export function launchCyberParalysis(state: WorldState, rivalId: string): ExwResult<WorldState> {
  const rival = state.rivals.find((r) => r.id === rivalId);
  if (!rival) return err('EXW_ERR_SCHEMA', 'Superpuissance cible introuvable.');
  const requiredCompute = Math.ceil(rival.computeDefense * COMBAT_CONSTANTS.CYBER_SURPLUS_RATIO_REQUIRED);
  if (state.resources.compute < requiredCompute) {
    return err(
      'EXW_ERR_CYBER_INSUFFICIENT',
      `R-43 : Surplus Compute 2× requis (${state.resources.compute}/${requiredCompute}).`
    );
  }
  const draft: WorldState = {
    ...state,
    resources: {
      ...state.resources,
      compute: state.resources.compute - Math.round(requiredCompute * 0.6),
    },
    rivals: state.rivals.map((r) =>
      r.id === rivalId
        ? {
            ...r,
            paralyzedCycles: COMBAT_CONSTANTS.CYBER_PARALYSIS_CYCLES,
            relationWithPlayer: Math.max(-100, r.relationWithPlayer - 18),
          }
        : r
    ),
    chronicle: [
      {
        id: `chr-cyb-${state.tick}-${rivalId}`,
        cycle: state.cycle,
        tick: state.tick,
        category: 'COMBAT' as const,
        title: `Cyber-Paralysie : ${rival.name}`,
        detail: `Intrusion réussie (R-44) : infrastructures rivales paralysées ${COMBAT_CONSTANTS.CYBER_PARALYSIS_CYCLES} cycles.`,
        stateHash: state.stateHash,
      },
      ...state.chronicle,
    ].slice(0, 60),
  };
  return ok({ ...draft, stateHash: computeStateHash(draft) });
}

export function recruitMilitaryUnit(
  state: WorldState,
  unitClass: UnitClass,
  level: UnitLevel
): ExwResult<WorldState> {
  const eraSpec = ERAS_CATALOG.find((e) => e.era === state.era) ?? ERAS_CATALOG[0]!;
  if (level > eraSpec.maxUnitLevel) {
    return err(
      'EXW_ERR_ERA_LOCKED',
      `R-04 : Les unités L${level} nécessitent une Ère supérieure (max actuel L${eraSpec.maxUnitLevel}).`
    );
  }
  const costCredits = 70 * level;
  const costMaterials = 15 * level;
  if (state.resources.credits < costCredits || state.resources.materials < costMaterials) {
    return err(
      'EXW_ERR_FINANCE_LIMIT',
      `Coût de recrutement L${level} : ${costCredits} Crédits + ${costMaterials} Matériaux.`
    );
  }

  const existing = state.militaryRoster.find((u) => u.unitClass === unitClass && u.level === level);
  const nextRoster = existing
    ? state.militaryRoster.map((u) =>
        u.id === existing.id ? { ...u, count: u.count + 3 } : u
      )
    : [
        ...state.militaryRoster,
        {
          id: `unit-${unitClass.toLowerCase()}-l${level}-${state.tick}`,
          unitClass,
          level,
          count: 3,
          basePower: COMBAT_CONSTANTS.UNIT_CLASS_BASE_POWER[unitClass],
          armor: Math.min(0.6, 0.12 + level * 0.06),
          supplyFactor: 1.0,
        },
      ];

  const draft: WorldState = {
    ...state,
    resources: {
      ...state.resources,
      credits: state.resources.credits - costCredits,
      materials: state.resources.materials - costMaterials,
    },
    militaryRoster: nextRoster,
  };
  return ok({ ...draft, stateHash: computeStateHash(draft) });
}
