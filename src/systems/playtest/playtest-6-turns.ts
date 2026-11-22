import { computeStateHash } from '../../core/hashing/state-hasher.ts';
import { Pcg32 } from '../../core/prng/pcg32.ts';

/**
 * [L3] EXW.L3.PLAYTEST_6_TURNS | v1.6.0 | SADT A3.1
 * 100% pure deterministic 6-turn (90-tick, 15 ticks/turn) narrative & telemetry simulator
 * grounded on PCG32 (seed 0x2050E801) and SHA-256 per-turn hashing.
 * Zero I/O, zero Math.random(), zero Date.now(), zero R-50 / Z0 forbidden tokens.
 */
export interface PlaytestEchoLink {
  readonly code: string;
  readonly horizon: 'COURT' | 'MOYEN' | 'LONG' | 'CRITIQUE';
  readonly originTurn: number;
  readonly resolutionTurn: number;
  readonly summary: string;
}

export interface PlaytestCombatPhaseRow {
  readonly phase: 1 | 2 | 3 | 4;
  readonly label: string;
  readonly detail: string;
}

export interface PlaytestTurnRecord {
  readonly turn: number;
  readonly ticksLabel: string;
  readonly atmosphereTier: 'P1' | 'P2' | 'P2+';
  readonly pnjSpeedModifierPct: number;
  readonly exposureNote: string;
  readonly dossiers: readonly string[];
  readonly workshopChoice: string;
  readonly deltaPAdapt: number;
  readonly delayedEchoes: readonly PlaytestEchoLink[];
  readonly mutationSummary: string;
  readonly combatPhases?: readonly PlaytestCombatPhaseRow[];
  readonly stateHash: string;
  readonly prngRoll: number;
}

export interface PlaytestSuperpowerRow {
  readonly name: string;
  readonly isPlayer: boolean;
  readonly isSuperAlliance: boolean;
  readonly eraStars: string;
  readonly tilesControlled: string;
  readonly atmosphereLocal: string;
  readonly computeRatio: string;
  readonly diplomacyStatus: string;
}

export interface Playtest6TurnsReport {
  readonly seedHex: string;
  readonly totalTurns: 6;
  readonly totalTicks: 90;
  readonly ticksPerTurn: 15;
  readonly eraTransition: string;
  readonly turns: readonly PlaytestTurnRecord[];
  readonly superpowerComparison: readonly PlaytestSuperpowerRow[];
  readonly finalChainHash: string;
}

export const DEFAULT_PLAYTEST_SEED = 0x2050e801;

function clampDeltaP(val: number): number {
  return Math.max(-0.15, Math.min(0.15, Number(val.toFixed(2))));
}

export function runDeterministicPlaytest6Turns(
  seed: number = DEFAULT_PLAYTEST_SEED,
): Playtest6TurnsReport {
  const rng = new Pcg32(seed);
  const seedHex = `0x${(seed >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;

  const echoGrid: PlaytestEchoLink = {
    code: 'ECHO-T3-GRID',
    horizon: 'COURT',
    originTurn: 1,
    resolutionTurn: 3,
    summary: 'Stabilisation réseau solaire UE-2050 (+14 % énergie, transition P1 → P2 accélérée).',
  };
  const echoAlliance: PlaytestEchoLink = {
    code: 'ECHO-T5-ALLIANCE',
    horizon: 'MOYEN',
    originTurn: 2,
    resolutionTurn: 5,
    summary: 'Ouverture canal C5 Super-Alliance IA Hors Contrôle & accès télémétrique Slot 2 Lune.',
  };

  const rawTurns: Omit<PlaytestTurnRecord, 'stateHash' | 'prngRoll'>[] = [
    {
      turn: 1,
      ticksLabel: '01..15',
      atmosphereTier: 'P1',
      pnjSpeedModifierPct: -40,
      exposureNote: 'Limite exposition extérieure 4 h/jour · kits MK-I',
      dossiers: [
        'P0-01 Crise Énergétique Secteur Sol-1 (ciel ouvert R-16)',
        'C1-01 Pacte Énergétique Orbital UE-2050 (12 PA + 4 Sous-PA Infra)',
      ],
      workshopChoice:
        'Doctrine Solarpunk New Vegas · Module Solaire Anno L2 · Preview 3D Tuile #14',
      deltaPAdapt: clampDeltaP(0.08),
      delayedEchoes: [echoGrid],
      mutationSummary: 'Programmation ECHO-T3-GRID (+2 tours) ; stabilité réseau +14 %.',
    },
    {
      turn: 2,
      ticksLabel: '16..30',
      atmosphereTier: 'P1',
      pnjSpeedModifierPct: -35,
      exposureNote: 'Kits respiratoires MK-I · drones chantier actifs',
      dossiers: [
        'C3-02 Maintenance Préventive Niv. 2 Réseau Hydrique (watchdog < 25 % désamorcé à 31 %)',
        'C4-01 Prêt Souverain Cities II (1 500 Cr) & Datacenter Compute (ratio 2.20x)',
      ],
      workshopChoice: 'Prêt taux AA + Déploiement Drones Classe D1 sur 3 modules Anno',
      deltaPAdapt: clampDeltaP(0.06),
      delayedEchoes: [echoAlliance],
      mutationSummary: 'Usure ramenée à 8 % ; file de construction modulaire active.',
    },
    {
      turn: 3,
      ticksLabel: '31..45',
      atmosphereTier: 'P2',
      pnjSpeedModifierPct: -15,
      exposureNote: 'Franchissement P1 → P2 · kits respiratoires -30 %',
      dossiers: [
        'Résolution ECHO-T3-GRID (hérité Tour 1 · C1-01)',
        'C2-03 Charte des 18 Colons Spécialistes (traits RimWorld & moral +12 %)',
      ],
      workshopChoice: 'Tours de bio-filtration à ciel ouvert + affectation spécialistes',
      deltaPAdapt: clampDeltaP(0.11),
      delayedEchoes: [echoGrid],
      mutationSummary:
        'Vitesse PNJ relevée de -40 % à -15 % ; consommation kits respiratoires réduite de 30 %.',
    },
    {
      turn: 4,
      ticksLabel: '46..60',
      atmosphereTier: 'P2',
      pnjSpeedModifierPct: -15,
      exposureNote: 'Amortisseur P0 capé à 2 crises/cycle · Ratio Compute 2.20x',
      dossiers: [
        'P0-02 Raid Cyber-Orbital Coalition Rivale (Valkyrie Orbital Directorate)',
        'C5-01 Envoi Unités L2 Infanterie Exo & L3 Blindés Légers sur Tuile #29',
      ],
      workshopChoice: 'Contre-mesure Datacenter 2.20x + Assaut coordonné 4 phases Tuile #29',
      deltaPAdapt: clampDeltaP(-0.04),
      delayedEchoes: [],
      mutationSummary: 'Raid neutralisé et contrôle souverain de la Tuile Frontalière #29 acquis.',
      combatPhases: [
        { phase: 1, label: 'Reco Drones D2', detail: 'Télémétrie orbitale acquise (+11 % précision).' },
        { phase: 2, label: 'Cyber-Disruption', detail: 'Datacenter Compute 2.20x >= 2.0x : pare-feu rival saturé.' },
        { phase: 3, label: 'Engagement L2/L3', detail: 'Infanterie Exo L2 + Blindés L3 enfoncent le front rival.' },
        { phase: 4, label: 'Consolidation', detail: 'Tuile #29 capturée · logistique raccordée (16/72 tuiles).' },
      ],
    },
    {
      turn: 5,
      ticksLabel: '61..75',
      atmosphereTier: 'P2',
      pnjSpeedModifierPct: -10,
      exposureNote: 'Ouverture télémétrique Slot 2 (Lune Artémis)',
      dossiers: [
        'Résolution ECHO-T5-ALLIANCE (hérité Tour 2 · C4-01)',
        'C5-02 Traité Précurseur Super-Alliance IA Hors Contrôle (OPT-12 : B)',
      ],
      workshopChoice: 'Logistique Transporteurs T1..T2 + Accréditation Super-Alliance',
      deltaPAdapt: clampDeltaP(0.12),
      delayedEchoes: [echoAlliance],
      mutationSummary: 'Score diplomatique Humankind #1/6 ; couloir orbital validé vers Slot 2.',
    },
    {
      turn: 6,
      ticksLabel: '76..90',
      atmosphereTier: 'P2+',
      pnjSpeedModifierPct: -5,
      exposureNote: 'Pré-P3 · 3 Jauges XP validées (84 / 78 / 88) · 5 Étoiles d’Ère',
      dossiers: [
        'C1-06 Inauguration Pont Orbital & Bascule Ère II (Orbite & Lune)',
        'Archivage turn_snapshots GZIP + Mémoire chronique 768d',
      ],
      workshopChoice: 'Transition Ère II Humankind · Déblocage effectif Slot 2 Lune',
      deltaPAdapt: clampDeltaP(0.14),
      delayedEchoes: [],
      mutationSummary:
        'Slot 2 Lune débloqué ; 5/6 Étoiles d’Ère atteintes ; intégrité SHA-256 vérifiée.',
    },
  ];

  let prevHash = computeStateHash({ seedHex, step: 0 });
  const turns: PlaytestTurnRecord[] = rawTurns.map((t) => {
    const prngRoll = rng.nextInt(1000, 9999);
    const stateHash = computeStateHash({
      prevHash,
      seedHex,
      turn: t.turn,
      ticks: t.ticksLabel,
      atmo: t.atmosphereTier,
      pnj: t.pnjSpeedModifierPct,
      deltaP: t.deltaPAdapt,
      prngRoll,
    }).toUpperCase();
    prevHash = stateHash;
    return { ...t, prngRoll, stateHash };
  });

  const superpowerComparison: readonly PlaytestSuperpowerRow[] = [
    {
      name: 'EXO-UNION 2050 (Joueur)',
      isPlayer: true,
      isSuperAlliance: false,
      eraStars: '5 / 6 (Ère II)',
      tilesControlled: '16 tuiles (+ Slot 2 Lune)',
      atmosphereLocal: 'P2+ (-5 % PNJ)',
      computeRatio: '2.20x (Souverain)',
      diplomacyStatus: 'Partenaire privilégié Super-Alliance IA',
    },
    {
      name: 'Aethelgard Euro-Grid',
      isPlayer: false,
      isSuperAlliance: false,
      eraStars: '4 / 6',
      tilesControlled: '13 tuiles',
      atmosphereLocal: 'P2 (-15 % PNJ)',
      computeRatio: '1.85x',
      diplomacyStatus: 'Pacte commercial C1 actif',
    },
    {
      name: 'Pacifica Helios Syndicate',
      isPlayer: false,
      isSuperAlliance: false,
      eraStars: '4 / 6',
      tilesControlled: '12 tuiles',
      atmosphereLocal: 'P2 (-15 % PNJ)',
      computeRatio: '2.05x',
      diplomacyStatus: 'Compétition orbitale Slot 2',
    },
    {
      name: 'Boreal Titan Collective',
      isPlayer: false,
      isSuperAlliance: false,
      eraStars: '3 / 6',
      tilesControlled: '11 tuiles',
      atmosphereLocal: 'P1 (-35 % PNJ)',
      computeRatio: '1.60x',
      diplomacyStatus: 'Battu sur Tuile #29 (Tour 4)',
    },
    {
      name: 'Meridian Solar Commonwealth',
      isPlayer: false,
      isSuperAlliance: false,
      eraStars: '3 / 6',
      tilesControlled: '10 tuiles',
      atmosphereLocal: 'P2 (-15 % PNJ)',
      computeRatio: '1.50x',
      diplomacyStatus: 'Neutre / Échanges marché',
    },
    {
      name: 'Valkyrie Orbital Directorate',
      isPlayer: false,
      isSuperAlliance: false,
      eraStars: '4 / 6',
      tilesControlled: '10 tuiles',
      atmosphereLocal: 'P1 (-30 % PNJ)',
      computeRatio: '2.10x',
      diplomacyStatus: 'Rival cyber (Raid P0-02 Tour 4)',
    },
    {
      name: 'Super-Alliance IA Hors Contrôle',
      isPlayer: false,
      isSuperAlliance: true,
      eraStars: 'Arbitre Orbital',
      tilesControlled: 'Stations L1/L2',
      atmosphereLocal: 'Hors-Atmosphère',
      computeRatio: '3.00x',
      diplomacyStatus: 'Canal C5 ouvert au Tour 5',
    },
  ];

  return {
    seedHex,
    totalTurns: 6,
    totalTicks: 90,
    ticksPerTurn: 15,
    eraTransition: 'Ère I (Horizon 2050) → Ère II (Orbite & Lune)',
    turns,
    superpowerComparison,
    finalChainHash: prevHash,
  };
}
