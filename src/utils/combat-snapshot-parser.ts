import {
  CombatReportSchema,
  type CombatPhaseLog,
  type CombatReport,
} from '../contracts/combat-units.schema.ts';

/**
 * [L5] EXW.L5.COMBAT_SNAPSHOT_PARSER | v4.0.0-rc.1 | SADT A3.6 / A5.1
 * Pure deterministic parser extracting 4-phase combat resolution timelines from `turn_snapshots`.
 * Supports native TurnSnapshot[], wrapped `{ turn_snapshots }`, snake_case SQL/Drizzle snapshot rows,
 * raw JSON strings, and deduplication across consecutive snapshots.
 */

export type CombatPhaseCode = CombatPhaseLog['phase'];

export interface CombatPhaseMeta {
  readonly phase: CombatPhaseCode;
  readonly stepNumber: 1 | 2 | 3 | 4;
  readonly shortLabel: string;
  readonly title: string;
  readonly domainTag: string;
}

export const COMBAT_PHASE_META: Record<CombatPhaseCode, CombatPhaseMeta> = {
  PHASE_1_CYBER_DRONES: {
    phase: 'PHASE_1_CYBER_DRONES',
    stepNumber: 1,
    shortLabel: 'P1 · Cyber',
    title: 'Phase 1 · Guerre Cyber & Drones',
    domainTag: 'CYBER / EW',
  },
  PHASE_2_ORBITAL_BOMBARDMENT: {
    phase: 'PHASE_2_ORBITAL_BOMBARDMENT',
    stepNumber: 2,
    shortLabel: 'P2 · Orbital',
    title: 'Phase 2 · Bombardement Orbital',
    domainTag: 'APPUI ORBITAL',
  },
  PHASE_3_COMBINED_ROUNDS: {
    phase: 'PHASE_3_COMBINED_ROUNDS',
    stepNumber: 3,
    shortLabel: 'P3 · Interarmes',
    title: 'Phase 3 · Assaut Interarmes',
    domainTag: 'FRONT TERRESTRE',
  },
  PHASE_4_CAPTURE_GARRISON: {
    phase: 'PHASE_4_CAPTURE_GARRISON',
    stepNumber: 4,
    shortLabel: 'P4 · Garnison',
    title: 'Phase 4 · Capture & Garnison',
    domainTag: 'OCCUPATION',
  },
};

export interface ParsedCombatPhaseStep {
  readonly phase: CombatPhaseCode;
  readonly stepNumber: 1 | 2 | 3 | 4;
  readonly shortLabel: string;
  readonly title: string;
  readonly domainTag: string;
  readonly summary: string;
  readonly attackerDamageDealt: number;
  readonly defenderDamageDealt: number;
  readonly attackerPowerBefore: number;
  readonly attackerPowerAfter: number;
  readonly defenderPowerBefore: number;
  readonly defenderPowerAfter: number;
  readonly attackerRetentionPct: number;
  readonly defenderRetentionPct: number;
  readonly netMomentum: number;
  readonly isDecisivePhase: boolean;
}

export interface ParsedCombatEngagement {
  readonly key: string;
  readonly orderId: string;
  readonly targetZoneId: string;
  readonly targetZoneName: string;
  readonly cycleResolved: number;
  readonly year: number | null;
  readonly season: string | null;
  readonly era: number | null;
  readonly snapshotId: string;
  readonly snapshotCycle: number;
  readonly snapshotHash: string;
  readonly outcome: CombatReport['outcome'];
  readonly cyberParalysisApplied: boolean;
  readonly attackerLosses: number;
  readonly defenderLosses: number;
  readonly garrisonStrength: number;
  readonly humankindMilitaryStars: number;
  readonly deterministicSeedHash: string;
  readonly initialAttackerPower: number;
  readonly initialDefenderPower: number;
  readonly finalAttackerPower: number;
  readonly finalDefenderPower: number;
  readonly totalAttackerDamage: number;
  readonly totalDefenderDamage: number;
  readonly decisivePhase: CombatPhaseCode;
  readonly steps: readonly ParsedCombatPhaseStep[];
}

export interface CombatHistoryMetrics {
  readonly snapshotsScanned: number;
  readonly totalBattles: number;
  readonly capturedCount: number;
  readonly repelledCount: number;
  readonly stalemateCount: number;
  readonly cyberParalysisCount: number;
  readonly totalAttackerLosses: number;
  readonly totalDefenderLosses: number;
  readonly totalMilitaryStars: number;
}

export interface ParsedCombatHistory {
  readonly engagements: readonly ParsedCombatEngagement[];
  readonly metrics: CombatHistoryMetrics;
  readonly parseError: string | null;
}

interface NormalizedSnapshotRow {
  readonly id: string;
  readonly cycle: number;
  readonly year: number | null;
  readonly season: string | null;
  readonly era: number | null;
  readonly stateHash: string;
  readonly rawReports: readonly unknown[];
}

export function formatCombatOutcomeLabel(outcome: CombatReport['outcome']): string {
  switch (outcome) {
    case 'CAPTURED':
      return 'Secteur conquis';
    case 'REPELLED':
      return 'Assaut repoussé';
    case 'STALEMATE':
      return 'Front stabilisé';
  }
}

function asRecord(val: unknown): Record<string, unknown> | null {
  return val && typeof val === 'object' && !Array.isArray(val) ? (val as Record<string, unknown>) : null;
}

function coercePhase(raw: unknown): CombatPhaseLog | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const phase = (rec.phase ?? rec.phase_code) as string | undefined;
  const summary = typeof rec.summary === 'string' ? rec.summary : '';
  const attackerDamageDealt = Number(rec.attackerDamageDealt ?? rec.attacker_damage_dealt ?? 0);
  const defenderDamageDealt = Number(rec.defenderDamageDealt ?? rec.defender_damage_dealt ?? 0);
  const attackerRemainingPower = Number(rec.attackerRemainingPower ?? rec.attacker_remaining_power ?? 0);
  const defenderRemainingPower = Number(rec.defenderRemainingPower ?? rec.defender_remaining_power ?? 0);
  if (
    phase !== 'PHASE_1_CYBER_DRONES' &&
    phase !== 'PHASE_2_ORBITAL_BOMBARDMENT' &&
    phase !== 'PHASE_3_COMBINED_ROUNDS' &&
    phase !== 'PHASE_4_CAPTURE_GARRISON'
  ) {
    return null;
  }
  return {
    phase,
    summary,
    attackerDamageDealt: Math.max(0, Number.isFinite(attackerDamageDealt) ? attackerDamageDealt : 0),
    defenderDamageDealt: Math.max(0, Number.isFinite(defenderDamageDealt) ? defenderDamageDealt : 0),
    attackerRemainingPower: Math.max(0, Number.isFinite(attackerRemainingPower) ? attackerRemainingPower : 0),
    defenderRemainingPower: Math.max(0, Number.isFinite(defenderRemainingPower) ? defenderRemainingPower : 0),
  };
}

function normalizeCombatReport(raw: unknown): CombatReport | null {
  const direct = CombatReportSchema.safeParse(raw);
  if (direct.success) return direct.data;

  const rec = asRecord(raw);
  if (!rec) return null;
  const rawPhases = Array.isArray(rec.phases) ? rec.phases : [];
  const phases = rawPhases.map(coercePhase).filter((p): p is CombatPhaseLog => p !== null);
  if (phases.length !== 4) return null;

  const candidate = {
    orderId: String(rec.orderId ?? rec.order_id ?? 'order-unknown'),
    targetZoneId: String(rec.targetZoneId ?? rec.target_zone_id ?? 'zone-0'),
    targetZoneName: String(rec.targetZoneName ?? rec.target_zone_name ?? 'Secteur inconnu'),
    cycleResolved: Math.max(0, Math.floor(Number(rec.cycleResolved ?? rec.cycle_resolved ?? 0) || 0)),
    outcome: rec.outcome,
    cyberParalysisApplied: Boolean(rec.cyberParalysisApplied ?? rec.cyber_paralysis_applied ?? false),
    attackerLosses: Math.max(0, Math.floor(Number(rec.attackerLosses ?? rec.attacker_losses ?? 0) || 0)),
    defenderLosses: Math.max(0, Math.floor(Number(rec.defenderLosses ?? rec.defender_losses ?? 0) || 0)),
    garrisonStrength: Math.max(0, Math.floor(Number(rec.garrisonStrength ?? rec.garrison_strength ?? 0) || 0)),
    humankindMilitaryStars: Math.min(
      2,
      Math.max(0, Math.floor(Number(rec.humankindMilitaryStars ?? rec.humankind_military_stars ?? 0) || 0)),
    ),
    phases,
    deterministicSeedHash: String(rec.deterministicSeedHash ?? rec.deterministic_seed_hash ?? '00000000'),
  };

  const validated = CombatReportSchema.safeParse(candidate);
  return validated.success ? validated.data : null;
}

function extractSnapshotRows(parsed: unknown): readonly NormalizedSnapshotRow[] {
  let list: unknown[] = [];
  if (Array.isArray(parsed)) {
    list = parsed;
  } else {
    const rec = asRecord(parsed);
    if (!rec) return [];
    const nested =
      rec.turn_snapshots ??
      rec.turnSnapshots ??
      rec.snapshots ??
      (Array.isArray(rec.combatReports) || Array.isArray(rec.combat_reports) ? [rec] : null);
    if (Array.isArray(nested)) {
      list = nested;
    }
  }

  return list
    .map((item, idx): NormalizedSnapshotRow | null => {
      const rec = asRecord(item);
      if (!rec) return null;
      const payload = asRecord(rec.payload) ?? asRecord(rec.worldState) ?? asRecord(rec.state) ?? rec;
      const rawReports =
        (Array.isArray(rec.combatReports) ? rec.combatReports : null) ??
        (Array.isArray(rec.combat_reports) ? rec.combat_reports : null) ??
        (Array.isArray(payload.combatReports) ? payload.combatReports : null) ??
        (Array.isArray(payload.combat_reports) ? payload.combat_reports : null) ??
        [];

      const cycleRaw = Number(rec.cycle ?? payload.cycle ?? 0);
      const yearRaw = Number(rec.year ?? payload.year);
      const eraRaw = Number(rec.era ?? payload.era);
      const seasonRaw = rec.season ?? payload.season;

      return {
        id: String(rec.id ?? rec.snapshot_id ?? `snap-${idx}`),
        cycle: Number.isFinite(cycleRaw) ? Math.max(0, Math.floor(cycleRaw)) : 0,
        year: Number.isFinite(yearRaw) && yearRaw > 0 ? Math.floor(yearRaw) : null,
        season: typeof seasonRaw === 'string' ? seasonRaw : null,
        era: Number.isFinite(eraRaw) && eraRaw > 0 ? Math.floor(eraRaw) : null,
        stateHash: String(rec.stateHash ?? rec.state_hash ?? payload.stateHash ?? 'n/a'),
        rawReports,
      };
    })
    .filter((row): row is NormalizedSnapshotRow => row !== null);
}

function buildEngagement(report: CombatReport, snap: NormalizedSnapshotRow): ParsedCombatEngagement {
  const orderedPhases = [...report.phases].sort(
    (a, b) => COMBAT_PHASE_META[a.phase].stepNumber - COMBAT_PHASE_META[b.phase].stepNumber,
  );
  const p1 = orderedPhases[0]!;
  const initialAttackerPower = Number((p1.attackerRemainingPower + p1.defenderDamageDealt).toFixed(2));
  const initialDefenderPower = Number((p1.defenderRemainingPower + p1.attackerDamageDealt).toFixed(2));

  let maxCombinedDamage = -1;
  let decisivePhase: CombatPhaseCode = orderedPhases[0]!.phase;
  for (const p of orderedPhases) {
    const combined = p.attackerDamageDealt + p.defenderDamageDealt;
    if (combined > maxCombinedDamage) {
      maxCombinedDamage = combined;
      decisivePhase = p.phase;
    }
  }

  let prevAtk = initialAttackerPower;
  let prevDef = initialDefenderPower;
  let totalAttackerDamage = 0;
  let totalDefenderDamage = 0;

  const steps: ParsedCombatPhaseStep[] = orderedPhases.map((p) => {
    const meta = COMBAT_PHASE_META[p.phase];
    const atkBefore = prevAtk;
    const defBefore = prevDef;
    const atkAfter = p.attackerRemainingPower;
    const defAfter = p.defenderRemainingPower;
    prevAtk = atkAfter;
    prevDef = defAfter;
    totalAttackerDamage += p.attackerDamageDealt;
    totalDefenderDamage += p.defenderDamageDealt;

    return {
      phase: p.phase,
      stepNumber: meta.stepNumber,
      shortLabel: meta.shortLabel,
      title: meta.title,
      domainTag: meta.domainTag,
      summary: p.summary,
      attackerDamageDealt: p.attackerDamageDealt,
      defenderDamageDealt: p.defenderDamageDealt,
      attackerPowerBefore: atkBefore,
      attackerPowerAfter: atkAfter,
      defenderPowerBefore: defBefore,
      defenderPowerAfter: defAfter,
      attackerRetentionPct: Math.min(100, Math.max(0, Math.round((atkAfter / Math.max(1, initialAttackerPower)) * 100))),
      defenderRetentionPct: Math.min(100, Math.max(0, Math.round((defAfter / Math.max(1, initialDefenderPower)) * 100))),
      netMomentum: Number((p.attackerDamageDealt - p.defenderDamageDealt).toFixed(2)),
      isDecisivePhase: p.phase === decisivePhase && maxCombinedDamage > 0,
    };
  });

  const last = steps[steps.length - 1]!;
  return {
    key: `${report.orderId}::${report.deterministicSeedHash}`,
    orderId: report.orderId,
    targetZoneId: report.targetZoneId,
    targetZoneName: report.targetZoneName,
    cycleResolved: report.cycleResolved,
    year: snap.year,
    season: snap.season,
    era: snap.era,
    snapshotId: snap.id,
    snapshotCycle: snap.cycle,
    snapshotHash: snap.stateHash,
    outcome: report.outcome,
    cyberParalysisApplied: report.cyberParalysisApplied,
    attackerLosses: report.attackerLosses,
    defenderLosses: report.defenderLosses,
    garrisonStrength: report.garrisonStrength,
    humankindMilitaryStars: report.humankindMilitaryStars,
    deterministicSeedHash: report.deterministicSeedHash,
    initialAttackerPower,
    initialDefenderPower,
    finalAttackerPower: last.attackerPowerAfter,
    finalDefenderPower: last.defenderPowerAfter,
    totalAttackerDamage: Number(totalAttackerDamage.toFixed(2)),
    totalDefenderDamage: Number(totalDefenderDamage.toFixed(2)),
    decisivePhase,
    steps,
  };
}

export function parseTurnSnapshotsForCombat(
  rawInput: unknown,
  fallbackReports: readonly CombatReport[] = [],
): ParsedCombatHistory {
  let decoded: unknown = rawInput;
  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return {
        engagements: [],
        metrics: {
          snapshotsScanned: 0,
          totalBattles: 0,
          capturedCount: 0,
          repelledCount: 0,
          stalemateCount: 0,
          cyberParalysisCount: 0,
          totalAttackerLosses: 0,
          totalDefenderLosses: 0,
          totalMilitaryStars: 0,
        },
        parseError: null,
      };
    }
    try {
      decoded = JSON.parse(trimmed);
    } catch {
      return {
        engagements: [],
        metrics: {
          snapshotsScanned: 0,
          totalBattles: 0,
          capturedCount: 0,
          repelledCount: 0,
          stalemateCount: 0,
          cyberParalysisCount: 0,
          totalAttackerLosses: 0,
          totalDefenderLosses: 0,
          totalMilitaryStars: 0,
        },
        parseError: 'JSON turn_snapshots invalide : vérifiez la syntaxe des crochets et guillemets.',
      };
    }
  }

  const rows = extractSnapshotRows(decoded);
  // Process snapshots in ascending cycle order so earliest snapshot capturing an engagement is preserved
  const sortedRows = [...rows].sort((a, b) => a.cycle - b.cycle);
  const deduped = new Map<string, ParsedCombatEngagement>();

  for (const row of sortedRows) {
    for (const rawReport of row.rawReports) {
      const report = normalizeCombatReport(rawReport);
      if (!report) continue;
      const key = `${report.orderId}::${report.deterministicSeedHash}`;
      if (!deduped.has(key)) {
        deduped.set(key, buildEngagement(report, row));
      }
    }
  }

  // Merge any live combatReports not yet persisted into a snapshot row
  for (const fallback of fallbackReports) {
    const key = `${fallback.orderId}::${fallback.deterministicSeedHash}`;
    if (!deduped.has(key)) {
      deduped.set(
        key,
        buildEngagement(fallback, {
          id: `live-c${fallback.cycleResolved}`,
          cycle: fallback.cycleResolved,
          year: null,
          season: null,
          era: null,
          stateHash: fallback.deterministicSeedHash,
          rawReports: [fallback],
        }),
      );
    }
  }

  const engagements = [...deduped.values()].sort(
    (a, b) => b.cycleResolved - a.cycleResolved || b.snapshotCycle - a.snapshotCycle || a.orderId.localeCompare(b.orderId),
  );

  const metrics: CombatHistoryMetrics = {
    snapshotsScanned: rows.length,
    totalBattles: engagements.length,
    capturedCount: engagements.filter((e) => e.outcome === 'CAPTURED').length,
    repelledCount: engagements.filter((e) => e.outcome === 'REPELLED').length,
    stalemateCount: engagements.filter((e) => e.outcome === 'STALEMATE').length,
    cyberParalysisCount: engagements.filter((e) => e.cyberParalysisApplied).length,
    totalAttackerLosses: engagements.reduce((sum, e) => sum + e.attackerLosses, 0),
    totalDefenderLosses: engagements.reduce((sum, e) => sum + e.defenderLosses, 0),
    totalMilitaryStars: engagements.reduce((sum, e) => sum + e.humankindMilitaryStars, 0),
  };

  return { engagements, metrics, parseError: null };
}
