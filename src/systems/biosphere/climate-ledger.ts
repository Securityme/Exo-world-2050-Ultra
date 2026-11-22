import type { WorldState } from '../../contracts/world-state.schema.ts';
import {
  formatAtmosphereStageName,
  formatSeasonLabel,
  formatWeatherLabel,
} from '../../utils/atmosphere-labels.ts';

/**
 * [L3] EXW.L3.CLIMATE_LEDGER | v5.0.0 | SADT A4.1
 * Pure weather, air-quality criteria, 3-turn chronological forecast, and per-turn
 * catastrophe/damage computation feeding the Header Weather Super-Widget.
 */
export type WeatherCode = WorldState['weatherState'];
export type SeasonCode = WorldState['season'];

export interface ForecastTurnEntry {
  readonly offset: number;
  readonly turnNumber: number;
  readonly year: number;
  readonly seasonLabel: string;
  readonly weatherCode: WeatherCode;
  readonly weatherLabel: string;
  readonly confidencePct: number;
  readonly riskLevel: 'CALME' | 'VIGILANCE' | 'CRITIQUE';
}

export interface WeatherCriterionFactor {
  readonly id: string;
  readonly label: string;
  readonly impactSummary: string;
  readonly scoreDelta: number;
}

export interface DisasterTurnRecord {
  readonly turnNumber: number;
  readonly activeCount: number;
  readonly peakIntensityPct: number;
  readonly primaryLabel: string;
  readonly damageSummary: string;
  readonly mitigated: boolean;
}

export interface ClimateLedgerSnapshot {
  readonly currentTurn: number;
  readonly currentYear: number;
  readonly seasonLabel: string;
  readonly weatherCode: WeatherCode;
  readonly weatherLabel: string;
  readonly airQualityTitle: string;
  readonly airQualityDetail: string;
  readonly airTone: 'critical' | 'warning' | 'good';
  readonly forecasts: readonly ForecastTurnEntry[];
  readonly criteria: readonly WeatherCriterionFactor[];
  readonly activeDisasterCount: number;
  readonly activeIntensityPct: number;
  readonly disasterHistory: readonly DisasterTurnRecord[];
}

const SEASONS_ORDER: readonly SeasonCode[] = ['PRINTEMPS', 'ETE', 'AUTOMNE', 'HIVER'];

function projectNextWeather(
  seed: number,
  turnIndex: number,
  tier: WorldState['atmosphereTier'],
  industryLoad: number,
): WeatherCode {
  const hash = (seed + turnIndex * 37 + industryLoad * 11) % 100;
  if (tier === 'P1') {
    if (hash < 34) return 'DUST_STORM';
    if (hash < 58) return 'SOLAR_FLARE';
    if (hash < 76) return 'CRYO_FRONT';
    return 'CLEAR';
  }
  if (tier === 'P2') {
    if (hash < 22) return 'DUST_STORM';
    if (hash < 44) return 'RAIN';
    if (hash < 60) return 'SOLAR_FLARE';
    return 'CLEAR';
  }
  if (tier === 'P3') {
    if (hash < 32) return 'RAIN';
    if (hash < 45) return 'CRYO_FRONT';
    return 'CLEAR';
  }
  return hash < 24 ? 'RAIN' : 'CLEAR';
}

function describeAirQuality(world: WorldState): {
  readonly title: string;
  readonly detail: string;
  readonly tone: 'critical' | 'warning' | 'good';
} {
  const tierName = formatAtmosphereStageName(world.atmosphereTier);
  const o2Pct = Math.round(8 + ((world.terra?.atmo ?? (world.atmosphereTier === 'P1' ? 10 : 55)) / 100) * 14);
  if (world.atmosphereTier === 'P1') {
    return {
      title: `Air irrespirable — ${tierName}`,
      detail: `O₂ à ${o2Pct} % · Kits respiratoires indispensables hors quartiers pressurisés.`,
      tone: 'critical',
    };
  }
  if (world.atmosphereTier === 'P2') {
    return {
      title: `Air semi-filtré — ${tierName}`,
      detail: `O₂ à ${o2Pct} % · Filtration active requise lors des rafales minérales.`,
      tone: 'warning',
    };
  }
  if (world.atmosphereTier === 'P3') {
    return {
      title: `Air respirable — ${tierName}`,
      detail: `O₂ à ${o2Pct} % · Pression atmosphérique stabilisée dans les vallées habitées.`,
      tone: 'good',
    };
  }
  return {
    title: `Air pur — ${tierName}`,
    detail: `O₂ à ${o2Pct} % · Cycles hydriques et végétaux autonomes sans masques.`,
    tone: 'good',
  };
}

function summarizeDisasterImpact(weather: WeatherCode, avgIntegrity: number): {
  readonly count: number;
  readonly intensity: number;
  readonly label: string;
  readonly damage: string;
} {
  const wearPenalty = avgIntegrity < 65 ? 16 : 0;
  if (weather === 'DUST_STORM') {
    return {
      count: 1,
      intensity: Math.min(95, 68 + wearPenalty),
      label: 'Tempête de poussière abrasive',
      damage: '-4 % intégrité solaire · -8 Énergie/tour si non abrité',
    };
  }
  if (weather === 'SOLAR_FLARE') {
    return {
      count: 1,
      intensity: Math.min(98, 74 + wearPenalty),
      label: 'Éruption solaire ionisante',
      damage: '-10 Calcul réseau · usure capteurs orbitaux',
    };
  }
  if (weather === 'CRYO_FRONT') {
    return {
      count: 1,
      intensity: Math.min(90, 62 + wearPenalty),
      label: 'Front cryogénique polaire',
      damage: '+18 % consommation énergie · rendement cultures réduit',
    };
  }
  if (weather === 'RAIN') {
    return {
      count: 0,
      intensity: 28,
      label: 'Précipitations hydriques',
      damage: 'Aucun dégât · +6 Eau nette dans les bassins',
    };
  }
  return {
    count: 0,
    intensity: 12,
    label: 'Ciel stable',
    damage: 'Aucun dégât environnemental ce tour',
  };
}

export function computeClimateLedger(world: WorldState): ClimateLedgerSnapshot {
  const seasonIdx = Math.max(0, SEASONS_ORDER.indexOf(world.season));
  const industryCount = world.districts.filter((d) => d.kind === 'INDUSTRY').length;
  const bioparkCount = world.districts.filter((d) => d.kind === 'BIOPARK').length;
  const avgIntegrity =
    world.districts.length > 0
      ? Math.round(world.districts.reduce((acc, d) => acc + d.integrity, 0) / world.districts.length)
      : 100;

  const forecasts: ForecastTurnEntry[] = [1, 2, 3].map((step) => {
    const projectedTurn = world.cycle + step;
    const projectedSeason = SEASONS_ORDER[(seasonIdx + step) % SEASONS_ORDER.length]!;
    const projectedWeather = projectNextWeather(
      world.worldSeed,
      projectedTurn,
      world.atmosphereTier,
      industryCount,
    );
    const riskLevel: ForecastTurnEntry['riskLevel'] =
      projectedWeather === 'SOLAR_FLARE' || projectedWeather === 'DUST_STORM'
        ? 'CRITIQUE'
        : projectedWeather === 'CRYO_FRONT'
          ? 'VIGILANCE'
          : 'CALME';
    return {
      offset: step,
      turnNumber: projectedTurn,
      year: world.year + Math.floor((seasonIdx + step) / 4),
      seasonLabel: formatSeasonLabel(projectedSeason),
      weatherCode: projectedWeather,
      weatherLabel: formatWeatherLabel(projectedWeather),
      confidencePct: Math.max(62, 94 - step * 10),
      riskLevel,
    };
  });

  const air = describeAirQuality(world);
  const currentHazard = summarizeDisasterImpact(world.weatherState, avgIntegrity);

  const criteria: WeatherCriterionFactor[] = [
    {
      id: 'crit-biopark',
      label: 'Bio-Parcs & Canopée',
      impactSummary: `${bioparkCount} parc(s) filtrent les particules fines`,
      scoreDelta: bioparkCount * 12,
    },
    {
      id: 'crit-industry',
      label: 'Charge Industrielle',
      impactSummary: `${industryCount} pôle(s) d’extraction émettant des poussières`,
      scoreDelta: -(industryCount * 9),
    },
    {
      id: 'crit-terra',
      label: 'Progression Biosphère',
      impactSummary: `${Math.round(world.atmosphereProgress)} % du stade actuel stabilisé`,
      scoreDelta: Math.round(world.atmosphereProgress * 0.25),
    },
    {
      id: 'crit-integrity',
      label: 'État des dômes & filtres',
      impactSummary: `${avgIntegrity} % d’intégrité moyenne des quartiers`,
      scoreDelta: avgIntegrity >= 75 ? 10 : -14,
    },
  ];

  const disasterHistory: DisasterTurnRecord[] = [0, 1, 2]
    .map((back) => Math.max(0, world.cycle - back))
    .filter((t, idx, arr) => arr.indexOf(t) === idx)
    .map((turnNum) => {
      const wCode =
        turnNum === world.cycle
          ? world.weatherState
          : projectNextWeather(world.worldSeed, turnNum, world.atmosphereTier, industryCount);
      const info = summarizeDisasterImpact(wCode, avgIntegrity);
      return {
        turnNumber: turnNum,
        activeCount: info.count,
        peakIntensityPct: info.intensity,
        primaryLabel: info.label,
        damageSummary: info.damage,
        mitigated: avgIntegrity >= 80 || bioparkCount >= 2,
      };
    });

  return {
    currentTurn: world.cycle,
    currentYear: world.year,
    seasonLabel: formatSeasonLabel(world.season),
    weatherCode: world.weatherState,
    weatherLabel: formatWeatherLabel(world.weatherState),
    airQualityTitle: air.title,
    airQualityDetail: air.detail,
    airTone: air.tone,
    forecasts,
    criteria,
    activeDisasterCount: currentHazard.count,
    activeIntensityPct: currentHazard.intensity,
    disasterHistory,
  };
}
