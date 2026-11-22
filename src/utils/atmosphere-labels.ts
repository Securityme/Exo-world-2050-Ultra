import { ATMOSPHERE_CONSTANTS } from '../config/atmosphere.constants.ts';
import type { AtmosphereTier } from '../contracts/render-bridge.schema.ts';
import type { WorldState } from '../contracts/world-state.schema.ts';

/**
 * [L5] Textual Global Atmosphere Quality Index & Climate State Formatter.
 * Pure, deterministic UI label derivation from canonical WorldState metrics.
 */
export type AtmosphereStatusTone = 'critical' | 'warning' | 'steady' | 'optimal';

export interface AtmosphereStatusBadge {
  readonly qualityLabel: string;
  readonly climateStateLabel: string;
  readonly climateShortLabel: string;
  readonly desktopLabel: string;
  readonly mobileLabel: string;
  readonly weatherLabel: string;
  readonly tone: AtmosphereStatusTone;
  readonly tooltipTitle: string;
  readonly tooltipFormula: string;
  readonly tooltipBody: string;
}

export interface AtmosphereStatusInput {
  readonly atmosphereTier: AtmosphereTier;
  readonly atmosphereProgress: number;
  readonly weatherState: WorldState['weatherState'];
  readonly biomeStabilityCycles: number;
  readonly hasEmergencyP0?: boolean;
}

const WEATHER_FR: Record<WorldState['weatherState'], string> = {
  CLEAR: 'Ciel dégagé',
  DUST_STORM: 'Tempête de poussière',
  SOLAR_FLARE: 'Éruption solaire',
  RAIN: 'Pluie fertilisante',
  CRYO_FRONT: 'Front polaire',
};

const SEASON_FR: Record<WorldState['season'], string> = {
  PRINTEMPS: 'Printemps',
  ETE: 'Été',
  AUTOMNE: 'Automne',
  HIVER: 'Hiver',
};

const STAGE_NAME_BY_TIER: Record<AtmosphereTier, string> = {
  P1: 'Atmosphère Hostile',
  P2: 'Atmosphère Stabilisée',
  P3: 'Atmosphère Respirable',
  P4: 'Atmosphère Éden',
};

const QUALITY_BY_TIER: Record<AtmosphereTier, string> = {
  P1: 'Air Toxique',
  P2: 'Air Filtré',
  P3: 'Air Respirable',
  P4: 'Air Pur',
};

export function formatAtmosphereStageName(tier: AtmosphereTier): string {
  return STAGE_NAME_BY_TIER[tier];
}

export function formatSeasonLabel(season: WorldState['season']): string {
  return SEASON_FR[season] ?? season;
}

export function formatWeatherLabel(weather: WorldState['weatherState']): string {
  return WEATHER_FR[weather] ?? weather;
}

export function formatAtmosphereStatusBadge(
  input: AtmosphereStatusInput,
): AtmosphereStatusBadge {
  const tier = input.atmosphereTier;
  const pct = Math.max(0, Math.min(100, Math.round(input.atmosphereProgress)));
  const weatherLabel = formatWeatherLabel(input.weatherState);
  const qualityLabel = QUALITY_BY_TIER[tier];
  const stageName = formatAtmosphereStageName(tier);

  const isSevereWeather =
    input.weatherState === 'DUST_STORM' ||
    input.weatherState === 'SOLAR_FLARE' ||
    input.weatherState === 'CRYO_FRONT';

  let climateStateLabel: string;
  let climateShortLabel: string;
  let tone: AtmosphereStatusTone;

  if (tier === 'P1' && (isSevereWeather || input.hasEmergencyP0)) {
    climateStateLabel = 'Climat Critique';
    climateShortLabel = 'Critique';
    tone = 'critical';
  } else if (isSevereWeather || input.hasEmergencyP0) {
    climateStateLabel = 'Climat Instable';
    climateShortLabel = 'Instable';
    tone = 'warning';
  } else if (tier === 'P1') {
    climateStateLabel = 'Climat Instable';
    climateShortLabel = 'Instable';
    tone = 'critical';
  } else if (tier === 'P2') {
    if (input.biomeStabilityCycles >= 2) {
      climateStateLabel = 'Climat Stabilisé';
      climateShortLabel = 'Stabilisé';
    } else {
      climateStateLabel = 'Climat Variable';
      climateShortLabel = 'Variable';
    }
    tone = 'warning';
  } else if (tier === 'P3') {
    if (input.biomeStabilityCycles >= 2) {
      climateStateLabel = 'Climat Tempéré';
      climateShortLabel = 'Tempéré';
    } else {
      climateStateLabel = 'Climat Stabilisé';
      climateShortLabel = 'Stabilisé';
    }
    tone = 'steady';
  } else {
    climateStateLabel = 'Climat Optimal';
    climateShortLabel = 'Optimal';
    tone = 'optimal';
  }

  const tierConst = ATMOSPHERE_CONSTANTS[tier];
  const speedPct = Math.round(tierConst.buildSpeedMod * 100);
  const speedStr = speedPct >= 0 ? `+${speedPct}%` : `${speedPct}%`;

  return {
    qualityLabel,
    climateStateLabel,
    climateShortLabel,
    desktopLabel: `${qualityLabel} · ${climateStateLabel}`,
    mobileLabel: `${qualityLabel} · ${climateShortLabel}`,
    weatherLabel,
    tone,
    tooltipTitle: `${qualityLabel} — ${climateStateLabel}`,
    tooltipFormula: `${stageName} (${pct}%) · Météo : ${weatherLabel} · PNJ ${speedStr} (${tierConst.maxExposureHours}h/j)`,
    tooltipBody:
      'Indice global combinant la qualité de l’air à ciel ouvert (Hostile → Stabilisée → Respirable → Éden) et la stabilité climatique actuelle (météo, cycles stables et alertes P0).',
  };
}
