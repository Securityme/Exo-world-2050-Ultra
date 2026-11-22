import type { Advisor, WorldState } from '../../contracts/world-state.schema.ts';
import type { UnitLevel } from '../../contracts/combat-units.schema.ts';
import {
  ExecutiveDecisionIntentSchema,
  type DossierActionPayload,
  type ExecutiveDecisionIntent,
  type ExecutiveDossier,
  type PaBudget,
  type SubPaDomain,
} from '../../contracts/pa-dossiers.schema.ts';
import { type ExwResult, ok, err } from '../../contracts/trigger-bus.schema.ts';
import { PA_CONSTANTS } from '../../config/game.constants.ts';
import { Pcg32 } from '../../core/prng/pcg32.ts';
import { computeStateHash } from '../../core/hashing/state-hasher.ts';
import { enqueueTriggerEvent } from '../../core/bus/trigger-bus.ts';
import { resolveDeterministicCombat } from '../combat-conquest/combat-engine.ts';
import {
  graftAnnoModule,
  launchCyberParalysis,
  reassignDroneRole,
  recruitMilitaryUnit,
  takeBankLoan,
  tradeResourceOnMarket,
} from '../economy-urban/finance-actions.ts';
import {
  getEffectiveOptionsForDossier,
  getSubChoicesForOption,
} from './dossier-subchoices.ts';

function applyActionPayloadPure(
  state: WorldState,
  payload: DossierActionPayload,
): ExwResult<{ readonly nextState: WorldState; readonly note: string }> {
  switch (payload.kind) {
    case 'DEFER_ACTION':
      return ok({ nextState: state, note: 'Action ajournée sans dépense.' });
    case 'GRAFT_MODULE': {
      const [e, next] = graftAnnoModule(state, payload.districtId);
      if (e || !next) return err(e?.code ?? 'EXW_ERR_FINANCE_LIMIT', e?.message ?? 'Greffe impossible.');
      return ok({ nextState: next, note: 'Extension greffée sur le quartier.' });
    }
    case 'BANK_LOAN': {
      const [e, next] = takeBankLoan(state, payload.principal);
      if (e || !next) return err(e?.code ?? 'EXW_ERR_FINANCE_LIMIT', e?.message ?? 'Refus bancaire.');
      return ok({ nextState: next, note: `Emprunt +${payload.principal} Cr débloqué.` });
    }
    case 'MARKET_TRADE': {
      const [e, next] = tradeResourceOnMarket(state, payload.resource, payload.action, payload.quantity);
      if (e || !next) return err(e?.code ?? 'EXW_ERR_FINANCE_LIMIT', e?.message ?? 'Transaction refusée.');
      return ok({
        nextState: next,
        note: `${payload.action === 'BUY' ? 'Achat' : 'Vente'} de ${payload.quantity} ${payload.resource} exécuté.`,
      });
    }
    case 'REASSIGN_DRONE': {
      const [e, next] = reassignDroneRole(state, payload.fromRole, payload.toRole);
      if (e || !next) return err(e?.code ?? 'EXW_ERR_FINANCE_LIMIT', e?.message ?? 'Réaffectation refusée.');
      return ok({ nextState: next, note: `Drone réaffecté (${payload.fromRole} → ${payload.toRole}).` });
    }
    case 'CYBER_PARALYSIS': {
      const [e, next] = launchCyberParalysis(state, payload.rivalId);
      if (e || !next) return err(e?.code ?? 'EXW_ERR_CYBER_INSUFFICIENT', e?.message ?? 'Intrusion échouée.');
      return ok({ nextState: next, note: 'Cyber-paralysie exécutée (2 cycles).' });
    }
    case 'RECRUIT_UNIT': {
      const [e, next] = recruitMilitaryUnit(state, payload.unitClass, payload.level);
      if (e || !next) return err(e?.code ?? 'EXW_ERR_FINANCE_LIMIT', e?.message ?? 'Recrutement refusé.');
      return ok({ nextState: next, note: `+3 unités ${payload.unitClass} Niv.${payload.level} déployées.` });
    }
    case 'LAUNCH_COMBAT': {
      const rival = state.rivals[0];
      const [cErr, report] = resolveDeterministicCombat(
        {
          orderId: `ord-${state.cycle}-${payload.targetTileIndex}-${state.tick}`,
          targetZoneId: `tile-${payload.targetTileIndex}`,
          targetZoneName: `Secteur Géodésique #${payload.targetTileIndex}`,
          defenderFactionId: rival?.id ?? 'NEUTRAL',
          biome: state.atmosphereTier === 'P4' ? 'TEMPERATE' : 'BARREN',
          atmosphereTier: state.atmosphereTier,
          attackerComputeSurplus: state.resources.compute,
          defenderComputeDefense: rival?.computeDefense ?? 30,
          orbitalSupportLevel: Math.min(5, state.era),
          attackers: state.militaryRoster,
          defenders: [
            {
              id: 'def-garrison',
              unitClass: 'INFANTRY_EXO',
              level: Math.min(5, Math.max(1, state.era)) as UnitLevel,
              count: 4,
              basePower: 12,
              armor: 0.2,
              supplyFactor: 1,
            },
            {
              id: 'def-armor',
              unitClass: 'ARMOR_MECH',
              level: 1,
              count: 2,
              basePower: 22,
              armor: 0.3,
              supplyFactor: 1,
            },
          ],
        },
        state.prngState ^ state.tick,
        state.cycle,
      );
      if (cErr || !report) {
        return err(cErr?.code ?? 'EXW_ERR_COMBAT_INVALID', cErr?.message ?? 'Résolution du combat interrompue.');
      }
      const captured = report.outcome === 'CAPTURED';
      const alreadyCaptured = state.capturedTiles.includes(payload.targetTileIndex);
      const nextCaptured =
        captured && !alreadyCaptured ? [...state.capturedTiles, payload.targetTileIndex] : state.capturedTiles;
      const nextRivalTiles = captured
        ? state.rivalTiles.filter((t) => t !== payload.targetTileIndex)
        : state.rivalTiles;
      const lossPerStack = Math.max(
        0,
        Math.floor(report.attackerLosses / Math.max(1, state.militaryRoster.length)),
      );
      const updatedRoster = state.militaryRoster.map((unit) => ({
        ...unit,
        count: Math.max(1, unit.count - lossPerStack),
      }));
      const nextCombatReports = [report, ...state.combatReports].slice(0, 16);
      const combatSnapshot = {
        id: `snap-combat-c${state.cycle}-${report.orderId}`,
        campaignId: state.campaignId,
        cycle: state.cycle,
        year: state.year,
        season: state.season,
        era: state.era,
        stateHash: report.deterministicSeedHash,
        combatReports: nextCombatReports,
      };
      const combatState: WorldState = {
        ...state,
        capturedTiles: nextCaptured,
        rivalTiles: nextRivalTiles,
        militaryRoster: updatedRoster,
        eraStars: state.eraStars + report.humankindMilitaryStars,
        combatReports: nextCombatReports,
        turn_snapshots: [...(state.turn_snapshots ?? []), combatSnapshot].slice(-40),
        xp: {
          ...state.xp,
          civilization: state.xp.civilization + (captured ? 35 : 10),
        },
      };
      return ok({
        nextState: combatState,
        note: captured
          ? `Secteur #${payload.targetTileIndex} conquis (${report.outcome}).`
          : `Assaut ${report.outcome} sur Secteur #${payload.targetTileIndex}.`,
      });
    }
  }
}

/**
 * [L3] FUP-002 | SM-01 | SADT A2.1–A2.3
 * Pure Executive PA & Dossiers System (R-24, R-26, R-28, R-29, R-30, R-32, R-34, R-35).
 * Zero I/O, zero Math.random().
 */
export function computeAdvisorSubPaRegen(advisor: Advisor): number {
  const attrTerm = Math.floor((advisor.attributeScore + advisor.traitBonus) / 3);
  const xpTerm = Math.floor(advisor.xpLevel / 3);
  const fatiguePenalty = advisor.fatigue > PA_CONSTANTS.FATIGUE_PENALTY_THRESHOLD ? 1 : 0;
  return Math.max(1, 1 + attrTerm + xpTerm - fatiguePenalty);
}

export function regenerateCyclePa(pa: PaBudget, advisors: readonly Advisor[]): PaBudget {
  const nextSubRegen = { ...pa.subPaRegen };
  for (const advisor of advisors) {
    nextSubRegen[advisor.domain] = computeAdvisorSubPaRegen(advisor);
  }
  const cap = (regen: number) => Math.max(1, Math.floor(regen * PA_CONSTANTS.ACCUMULATION_CAP_FACTOR));

  return {
    general: Math.min(cap(pa.generalRegen), pa.general + pa.generalRegen),
    generalRegen: pa.generalRegen,
    generalCap: cap(pa.generalRegen),
    subPaRegen: nextSubRegen,
    subPa: {
      PA_GES: Math.min(cap(nextSubRegen.PA_GES), pa.subPa.PA_GES + nextSubRegen.PA_GES),
      PA_MNT: Math.min(cap(nextSubRegen.PA_MNT), pa.subPa.PA_MNT + nextSubRegen.PA_MNT),
      PA_BIO: Math.min(cap(nextSubRegen.PA_BIO), pa.subPa.PA_BIO + nextSubRegen.PA_BIO),
      PA_POL: Math.min(cap(nextSubRegen.PA_POL), pa.subPa.PA_POL + nextSubRegen.PA_POL),
    },
  };
}

export function calculateEffectivePaCosts(
  optionPaGeneral: number,
  optionSubPa: number,
  refinementLevel: 0 | 1 | 2
): { generalCost: number; subPaCost: number } {
  const multiplier = 1 + refinementLevel * PA_CONSTANTS.REFINEMENT_COST_STEP;
  return {
    generalCost: optionPaGeneral,
    subPaCost: Math.ceil(optionSubPa * multiplier),
  };
}

export interface DossierExecutionReport {
  readonly nextState: WorldState;
  readonly skillCheckPassed: boolean | null;
  readonly summary: string;
}

export function executeDossierDecision(
  state: WorldState,
  rawIntent: unknown
): ExwResult<DossierExecutionReport> {
  const parsed = ExecutiveDecisionIntentSchema.safeParse(rawIntent);
  if (!parsed.success) {
    return err('EXW_ERR_SCHEMA', 'Invalid ExecutiveDecisionIntent payload', parsed.error.message);
  }
  const intent: ExecutiveDecisionIntent = parsed.data;

  const dossier = state.activeDossiers.find((d) => d.id === intent.dossierId);
  if (!dossier) {
    return err('EXW_ERR_SCHEMA', 'Dossier introuvable ou déjà résolu.');
  }

  // R-32: Active P0 crisis blocks execution of C4 and C5 dossiers
  const hasActiveP0 = state.activeDossiers.some((d) => d.dossierClass === 'P0');
  if (hasActiveP0 && (dossier.dossierClass === 'C4' || dossier.dossierClass === 'C5')) {
    return err(
      'EXW_ERR_P0_BLOCK',
      'Règle R-32 : Une crise P0 active bloque les dossiers C4 et C5 jusqu’à résolution.'
    );
  }

  const effectiveOptions = getEffectiveOptionsForDossier(dossier);
  const option = effectiveOptions.find((o) => o.id === intent.optionId);
  if (!option) {
    return err('EXW_ERR_SCHEMA', 'Option de dossier introuvable.');
  }

  const availableSubChoices = getSubChoicesForOption(option, dossier.dossierClass);
  const selectedSubChoice = intent.subChoiceId
    ? availableSubChoices.find((sc) => sc.id === intent.subChoiceId) ?? availableSubChoices[0]
    : availableSubChoices[0];

  const baseCosts = calculateEffectivePaCosts(
    option.paGeneralCost,
    option.subPaCost,
    intent.refinementLevel
  );
  const generalCost = baseCosts.generalCost + (selectedSubChoice?.extraPaGeneralCost ?? 0);
  const subPaCost = baseCosts.subPaCost + (selectedSubChoice?.extraSubPaCost ?? 0);

  // R-26 Asymmetric Fungibility: PA General can pay anything; Sub-PA only pays its own domain
  const domain: SubPaDomain | null = dossier.dossierClass === 'P0' ? null : option.subPaDomain;
  let requiredGeneral = generalCost;
  let requiredSubPa = 0;

  if (dossier.dossierClass === 'P0' || domain === null) {
    requiredGeneral += subPaCost;
  } else if (intent.useGeneralPaFallback) {
    const availSub = state.pa.subPa[domain];
    const fromSub = Math.min(availSub, subPaCost);
    requiredSubPa = fromSub;
    requiredGeneral += subPaCost - fromSub;
  } else {
    requiredSubPa = subPaCost;
  }

  if (state.pa.general < requiredGeneral) {
    return err(
      'EXW_ERR_PA_INSUFFICIENT',
      `PA Général insuffisant (${state.pa.general}/${requiredGeneral}).`
    );
  }
  if (domain !== null && state.pa.subPa[domain] < requiredSubPa) {
    return err(
      'EXW_ERR_PA_INSUFFICIENT',
      `Sous-PA ${domain} insuffisant (${state.pa.subPa[domain]}/${requiredSubPa}). Activez la fongibilité PA Général (R-26).`
    );
  }

  // Execute embedded Action-Gateway payload FIRST so resource/era checks fail cleanly before PA spend
  let workingState: WorldState = state;
  let actionNote = '';
  if (option.actionPayload) {
    const [actErr, actRes] = applyActionPayloadPure(state, option.actionPayload);
    if (actErr || !actRes) {
      return err(actErr?.code ?? 'EXW_ERR_FINANCE_LIMIT', actErr?.message ?? 'Action refusée.');
    }
    workingState = actRes.nextState;
    actionNote = actRes.note;
  }

  const isDeferred = option.actionPayload?.kind === 'DEFER_ACTION';

  const advisor =
    workingState.advisors.find((a) => a.id === intent.assignedAdvisorId) ?? workingState.advisors[0]!;
  const prng = new Pcg32(workingState.prngState ^ (workingState.tick + 31));

  // New Vegas Deterministic Skill Check (R-28)
  let skillCheckPassed: boolean | null = null;
  let refinementMultiplier = 1 + intent.refinementLevel * 0.2;
  if (option.skillCheck) {
    const roll = advisor.attributeScore + advisor.traitBonus + intent.refinementLevel * 2 + prng.nextInt(0, 2);
    skillCheckPassed = roll >= option.skillCheck.threshold;
    refinementMultiplier *= skillCheckPassed ? 1.25 : 0.78;
  }

  const fx = option.effects;
  const subFx = selectedSubChoice?.bonusEffects;
  const nextPa: PaBudget = {
    ...workingState.pa,
    general: workingState.pa.general - requiredGeneral,
    subPa: {
      ...workingState.pa.subPa,
      ...(domain !== null ? { [domain]: workingState.pa.subPa[domain] - requiredSubPa } : {}),
    },
  };

  const nextResources = {
    ...workingState.resources,
    credits: Math.round(workingState.resources.credits + fx.credits + (subFx?.credits ?? 0)),
    energy: Math.max(0, Math.round(workingState.resources.energy + fx.energy * refinementMultiplier + (subFx?.energy ?? 0))),
    materials: Math.max(0, Math.round(workingState.resources.materials + fx.materials * refinementMultiplier + (subFx?.materials ?? 0))),
    water: Math.max(0, Math.round(workingState.resources.water + fx.water * refinementMultiplier + (subFx?.water ?? 0))),
    food: Math.max(0, Math.round(workingState.resources.food + fx.food * refinementMultiplier + (subFx?.food ?? 0))),
    electronics: Math.max(0, Math.round(workingState.resources.electronics + fx.electronics * refinementMultiplier + (subFx?.electronics ?? 0))),
    compute: Math.max(0, Math.round(workingState.resources.compute + fx.compute * refinementMultiplier + (subFx?.compute ?? 0))),
    breathingKits: Math.max(0, Math.round(workingState.resources.breathingKits + fx.breathingKits + (subFx?.breathingKits ?? 0))),
  };

  const totalMaintenanceDelta = fx.maintenanceDelta + (subFx?.maintenanceDelta ?? 0);
  const nextDistricts = workingState.districts.map((dist, idx) => {
    const integrity = Math.max(0, Math.min(100, dist.integrity + totalMaintenanceDelta));
    const addModule =
      !isDeferred && idx === 0 && intent.moduleExtensionTag !== 'NONE' && dist.modulesCount < 3 ? 1 : 0;
    return { ...dist, integrity, modulesCount: dist.modulesCount + addModule };
  });

  const nextAdvisors = isDeferred
    ? workingState.advisors
    : workingState.advisors.map((adv) =>
        adv.id === advisor.id
          ? {
              ...adv,
              fatigue: Math.min(100, adv.fatigue + 12 + intent.refinementLevel * 6),
              xpLevel: Math.min(20, adv.xpLevel + (fx.xpCabinet >= 25 ? 1 : 0)),
            }
          : adv,
      );

  let nextBus = workingState.triggerBus;
  if (fx.delayedEchoSummary) {
    const [, updatedBus] = enqueueTriggerEvent(
      nextBus,
      {
        id: `echo-${dossier.id}-c${workingState.cycle}`,
        tickIssued: workingState.tick,
        cycleIssued: workingState.cycle,
        dueCycle: workingState.cycle + 2,
        horizon: 'DELAYED_ECHO',
        severity: 'STANDARD',
        category: 'DELAYED_CONSEQUENCE',
        title: `Suite : ${dossier.title}`,
        summary: fx.delayedEchoSummary,
        sourceNode: 'A2.3',
        deltaModifier: fx.oracleImpactFactor,
        resolved: false,
      },
      workingState.cycle
    );
    if (updatedBus) nextBus = updatedBus;
  }

  const nextApproval = Math.max(0, Math.min(100, Math.round(workingState.approval + fx.approvalDelta)));
  const nextAtmo = Math.max(
    0,
    Math.min(100, Math.round(workingState.atmosphereProgress + fx.atmosphereDelta * refinementMultiplier + (subFx?.atmosphereDelta ?? 0))),
  );
  const nextTrust = Math.max(
    0,
    Math.min(100, Math.round(workingState.superAllianceTrust + fx.allianceTrustDelta + (subFx?.allianceTrustDelta ?? 0))),
  );

  const subTag = selectedSubChoice ? ` · ${selectedSubChoice.label}` : '';
  const baseStatus =
    skillCheckPassed === null
      ? 'Validé'
      : skillCheckPassed
        ? 'Bonus conseiller réussi'
        : 'Exécution standard';
  const summary = actionNote
    ? `${dossier.code} · ${actionNote}${subTag}`
    : `${dossier.code} validé (${option.label}${subTag}) · ${baseStatus}`;

  const draft: WorldState = {
    ...workingState,
    prngState: prng.getStateNumber(),
    pa: nextPa,
    resources: nextResources,
    districts: nextDistricts,
    advisors: nextAdvisors,
    approval: nextApproval,
    atmosphereProgress: nextAtmo,
    superAllianceTrust: nextTrust,
    eraStars: workingState.eraStars + fx.eraStarsDelta,
    activeDossiers: workingState.activeDossiers.filter((d) => d.id !== dossier.id),
    triggerBus: nextBus,
    xp: {
      civilization: workingState.xp.civilization + fx.xpCiv,
      cabinet: workingState.xp.cabinet + fx.xpCabinet,
      alliance: workingState.xp.alliance + fx.xpAlliance,
    },
    chronicle: isDeferred
      ? workingState.chronicle
      : [
          {
            id: `chr-${workingState.cycle}-${workingState.tick}-${dossier.code}`,
            cycle: workingState.cycle,
            tick: workingState.tick,
            category: option.actionPayload?.kind === 'LAUNCH_COMBAT' ? ('COMBAT' as const) : ('DOSSIER' as const),
            title: dossier.title,
            detail: summary,
            stateHash: workingState.stateHash,
          },
          ...workingState.chronicle,
        ].slice(0, 60),
  };

  const stateHash = computeStateHash(draft);
  return ok({ nextState: { ...draft, stateHash }, skillCheckPassed, summary });
}

export function createDirectInitiativeDossier(
  state: WorldState,
  dossierClass: 'C2' | 'C3' | 'C4' | 'C5'
): ExwResult<WorldState> {
  if (state.pa.general < PA_CONSTANTS.DIRECT_INITIATIVE_PA_COST) {
    return err(
      'EXW_ERR_PA_INSUFFICIENT',
      `Initiative Directe (R-33) requiert ${PA_CONSTANTS.DIRECT_INITIATIVE_PA_COST} PA Général.`
    );
  }
  const code = `EXW-DIR-${dossierClass}-${state.cycle}`;
  const subMap: Record<'C2' | 'C3' | 'C4' | 'C5', SubPaDomain> = {
    C2: 'PA_GES',
    C3: 'PA_MNT',
    C4: 'PA_BIO',
    C5: 'PA_POL',
  };
  const titles: Record<'C2' | 'C3' | 'C4' | 'C5', string> = {
    C2: 'Décret d’Expansion Industrielle Rapide',
    C3: 'Audit Préventif d’Urgence des Districts',
    C4: 'Programme d’Ensemencement Atmosphérique',
    C5: 'Sommation Diplomatique & Renfort Compute',
  };
  const newDossier: ExecutiveDossier = {
    id: `dir-${dossierClass}-${state.tick}-${state.activeDossiers.length}`,
    code,
    dossierClass,
    title: titles[dossierClass],
    briefing: 'Dossier émis par Initiative Directe du Commandant (R-33) hors tirage de l’Oracle.',
    source: 'DIRECT_INITIATIVE',
    slotIndex: state.activeSlotIndex,
    tileIndex: (state.tick + 17) % 72,
    expiresInCycles: 2,
    options: [
      {
        id: `opt-dir-${dossierClass}-a`,
        label: 'Exécution Prioritaire',
        doctrineTag: 'SOLARPUNK',
        description: 'Déploiement ciblé avec rendement accru.',
        paGeneralCost: 0,
        subPaDomain: subMap[dossierClass],
        subPaCost: 1,
        effects: {
          credits: dossierClass === 'C2' ? 220 : -90,
          energy: 15,
          materials: dossierClass === 'C2' ? 35 : 0,
          water: dossierClass === 'C4' ? 30 : 0,
          food: dossierClass === 'C4' ? 25 : 0,
          electronics: dossierClass === 'C2' ? 20 : 0,
          compute: dossierClass === 'C5' ? 30 : 0,
          breathingKits: dossierClass === 'C3' ? 15 : 0,
          approvalDelta: 3,
          atmosphereDelta: dossierClass === 'C4' ? 9 : 0,
          maintenanceDelta: dossierClass === 'C3' ? 25 : 0,
          allianceTrustDelta: dossierClass === 'C5' ? 10 : 2,
          eraStarsDelta: 1,
          xpCiv: 25,
          xpCabinet: 20,
          xpAlliance: 15,
          oracleImpactFactor: 0.05,
        },
      },
      {
        id: `opt-dir-${dossierClass}-b`,
        label: 'Exécution Économe',
        doctrineTag: 'CORPORATE',
        description: 'Impact mesuré sans tension budgétaire.',
        paGeneralCost: 0,
        subPaDomain: subMap[dossierClass],
        subPaCost: 1,
        effects: {
          credits: 60,
          energy: 10,
          materials: 10,
          water: 5,
          food: 5,
          electronics: 5,
          compute: 10,
          breathingKits: 5,
          approvalDelta: 1,
          atmosphereDelta: dossierClass === 'C4' ? 4 : 0,
          maintenanceDelta: dossierClass === 'C3' ? 12 : 0,
          allianceTrustDelta: 2,
          eraStarsDelta: 0,
          xpCiv: 10,
          xpCabinet: 10,
          xpAlliance: 5,
          oracleImpactFactor: 0.02,
        },
      },
    ],
  };

  const draft: WorldState = {
    ...state,
    pa: { ...state.pa, general: state.pa.general - PA_CONSTANTS.DIRECT_INITIATIVE_PA_COST },
    activeDossiers: [newDossier, ...state.activeDossiers],
  };
  return ok({ ...draft, stateHash: computeStateHash(draft) });
}
