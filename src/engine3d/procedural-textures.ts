import * as THREE from 'three';
import { resolveScientificAtmosphereDivision } from '../config/atmosphere.constants.ts';
import type {
  AtmosphereTier,
  PlanetBiomeProfile,
  PlanetClimatePreset,
  PlanetReliefPreset,
} from '../contracts/render-bridge.schema.ts';

/**
 * [L4] FUP-007 | SM-05 | SADT A5.3 | Three.js 0.187.0 PBR Upgrade
 * High-Detail Procedural CanvasTextures & Shaders for:
 * - Scale 2 Exo-Planet PBR maps (albedo, tangent normalMap, bumpMap, roughnessMap, night city lights emissiveMap, swirling clouds)
 * - Scale 2 Rayleigh/Mie Fresnel & Limb Atmospheric Shaders synced to EXOSPHERE..TROPOSPHERE
 * - Scale 3 Open-Sky Solarpunk Metropolis (Rayleigh+Mie Open-Sky Shader, hex pad PBR, Maglev pulse, water ripple normals, particle sprites)
 * - Isolated 3D Inspector 135-degree holographic turntable plinth texture
 * 100% deterministic seeded noise (zero Math.random).
 */

function hash2D(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function hash3D(ix: number, iy: number, iz: number, seed: number): number {
  let h = (ix * 374761393 + iy * 668265263 + iz * 2147483647 + seed * 1597334677) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

function noise3D(x: number, y: number, z: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);

  const n000 = hash3D(ix, iy, iz, seed);
  const n100 = hash3D(ix + 1, iy, iz, seed);
  const n010 = hash3D(ix, iy + 1, iz, seed);
  const n110 = hash3D(ix + 1, iy + 1, iz, seed);
  const n001 = hash3D(ix, iy, iz + 1, seed);
  const n101 = hash3D(ix + 1, iy, iz + 1, seed);
  const n011 = hash3D(ix, iy + 1, iz + 1, seed);
  const n111 = hash3D(ix + 1, iy + 1, iz + 1, seed);

  const nx00 = n000 + (n100 - n000) * ux;
  const nx10 = n010 + (n110 - n010) * ux;
  const nx01 = n001 + (n101 - n001) * ux;
  const nx11 = n011 + (n111 - n011) * ux;
  const nxy0 = nx00 + (nx10 - nx00) * uy;
  const nxy1 = nx01 + (nx11 - nx01) * uy;
  return nxy0 + (nxy1 - nxy0) * uz;
}

function fbm3D(x: number, y: number, z: number, seed: number, octaves = 5): number {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    value += noise3D(x * freq, y * freq, z * freq, seed + i * 31) * amp;
    freq *= 2.07;
    amp *= 0.5;
  }
  return value;
}

function ridge3D(x: number, y: number, z: number, seed: number): number {
  const n = fbm3D(x, y, z, seed, 4);
  const r = 1 - Math.abs(n * 2 - 1);
  return r * r;
}

function fbm(x: number, y: number, seed: number, octaves = 5): number {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    const ix = Math.floor(x * freq);
    const iy = Math.floor(y * freq);
    const fx = x * freq - ix;
    const fy = y * freq - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a = hash2D(ix, iy, seed);
    const b = hash2D(ix + 1, iy, seed);
    const c = hash2D(ix, iy + 1, seed);
    const d = hash2D(ix + 1, iy + 1, seed);
    const lerpX1 = a + (b - a) * ux;
    const lerpX2 = c + (d - c) * ux;
    value += (lerpX1 + (lerpX2 - lerpX1) * uy) * amp;
    freq *= 2.04;
    amp *= 0.5;
  }
  return value;
}

/**
 * Deterministic Sobel height-to-tangent-space NormalMap builder (linear space!).
 */
function createNormalMapFromHeight(
  heightBuf: Float32Array,
  width: number,
  height: number,
  strength: number,
  wrapS = true,
  wrapT = false,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(width, height);
    const sample = (sx: number, sy: number): number => {
      const wx = wrapS
        ? ((sx % width) + width) % width
        : Math.max(0, Math.min(width - 1, sx));
      const wy = wrapT
        ? ((sy % height) + height) % height
        : Math.max(0, Math.min(height - 1, sy));
      return heightBuf[wy * width + wx] ?? 0;
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tl = sample(x - 1, y - 1);
        const t = sample(x, y - 1);
        const tr = sample(x + 1, y - 1);
        const l = sample(x - 1, y);
        const r = sample(x + 1, y);
        const bl = sample(x - 1, y + 1);
        const b = sample(x, y + 1);
        const br = sample(x + 1, y + 1);

        const dX = tr + 2 * r + br - (tl + 2 * l + bl);
        const dY = bl + 2 * b + br - (tl + 2 * t + tr);

        let nx = -dX * strength;
        let ny = -dY * strength;
        let nz = 1.0;
        const invLen = 1 / Math.hypot(nx, ny, nz);
        nx *= invLen;
        ny *= invLen;
        nz *= invLen;

        const idx = (y * width + x) * 4;
        img.data[idx] = Math.round((nx * 0.5 + 0.5) * 255);
        img.data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
        img.data[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  const normalMap = new THREE.CanvasTexture(canvas);
  normalMap.colorSpace = THREE.NoColorSpace;
  normalMap.wrapS = wrapS ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  normalMap.wrapT = wrapT ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  normalMap.anisotropy = 4;
  normalMap.needsUpdate = true;
  return normalMap;
}

type Rgb = [number, number, number];

export interface PlanetTextureOptions {
  readonly tier: AtmosphereTier;
  readonly season?: 'PRINTEMPS' | 'ETE' | 'AUTOMNE' | 'HIVER';
  readonly weatherState?: 'CLEAR' | 'DUST_STORM' | 'SOLAR_FLARE' | 'RAIN' | 'CRYO_FRONT';
  readonly slotIndex?: number;
  readonly worldSeed?: number;
  readonly biomeProfile?: PlanetBiomeProfile;
  readonly oceanCoveragePct?: number;
  readonly planetRelief?: PlanetReliefPreset;
  readonly planetClimate?: PlanetClimatePreset;
}

function normalizeTextureOpts(input: AtmosphereTier | PlanetTextureOptions): {
  tier: AtmosphereTier;
  season: 'PRINTEMPS' | 'ETE' | 'AUTOMNE' | 'HIVER';
  weatherState: 'CLEAR' | 'DUST_STORM' | 'SOLAR_FLARE' | 'RAIN' | 'CRYO_FRONT';
  slotIndex: number;
  worldSeed: number;
  biomeProfile: PlanetBiomeProfile | undefined;
  oceanCoveragePct: number | undefined;
  planetRelief: PlanetReliefPreset;
  planetClimate: PlanetClimatePreset;
} {
  if (typeof input === 'string') {
    return {
      tier: input,
      season: 'PRINTEMPS',
      weatherState: 'CLEAR',
      slotIndex: 1,
      worldSeed: 2050,
      biomeProfile: undefined,
      oceanCoveragePct: undefined,
      planetRelief: 'EQUILIBRE',
      planetClimate: 'TEMPERE',
    };
  }
  return {
    tier: input.tier,
    season: input.season ?? 'PRINTEMPS',
    weatherState: input.weatherState ?? 'CLEAR',
    slotIndex: input.slotIndex ?? 1,
    worldSeed: input.worldSeed ?? 2050,
    biomeProfile: input.biomeProfile,
    oceanCoveragePct: input.oceanCoveragePct,
    planetRelief: input.planetRelief ?? 'EQUILIBRE',
    planetClimate: input.planetClimate ?? 'TEMPERE',
  };
}

interface PlanetPalette {
  deep: Rgb;
  shallow: Rgb;
  coast: Rgb;
  mid: Rgb;
  high: Rgb;
  peak: Rgb;
  seaLevel: number;
  cityTint: Rgb;
}

const BIOME_PLANET_PALETTES: Record<PlanetBiomeProfile, PlanetPalette> = {
  ARCHIPEL_EMERAUDE: {
    deep: [6, 64, 128],
    shallow: [14, 168, 196],
    coast: [222, 208, 158],
    mid: [22, 162, 102],
    high: [64, 178, 114],
    peak: [242, 248, 250],
    seaLevel: 0.54,
    cityTint: [103, 232, 249],
  },
  MONDE_OCEANIQUE: {
    deep: [5, 52, 114],
    shallow: [20, 184, 198],
    coast: [212, 236, 224],
    mid: [36, 174, 134],
    high: [96, 188, 148],
    peak: [246, 252, 255],
    seaLevel: 0.63,
    cityTint: [165, 243, 252],
  },
  PANGEE_TEMPEREE: {
    deep: [10, 62, 126],
    shallow: [28, 144, 184],
    coast: [206, 192, 146],
    mid: [42, 152, 92],
    high: [112, 162, 98],
    peak: [244, 248, 252],
    seaLevel: 0.48,
    cityTint: [186, 230, 253],
  },
  CRYO_OCEAN: {
    deep: [12, 54, 118],
    shallow: [56, 148, 206],
    coast: [192, 224, 244],
    mid: [142, 176, 198],
    high: [214, 234, 248],
    peak: [248, 252, 255],
    seaLevel: 0.51,
    cityTint: [125, 211, 252],
  },
  BIOSPHERE_FONGIQUE: {
    deep: [14, 72, 98],
    shallow: [24, 152, 136],
    coast: [152, 204, 172],
    mid: [118, 56, 168],
    high: [56, 176, 138],
    peak: [228, 212, 248],
    seaLevel: 0.47,
    cityTint: [192, 132, 252],
  },
  ALPIN_SAUVAGE: {
    deep: [10, 66, 128],
    shallow: [34, 142, 188],
    coast: [186, 184, 164],
    mid: [58, 138, 92],
    high: [128, 138, 148],
    peak: [248, 250, 255],
    seaLevel: 0.44,
    cityTint: [186, 230, 253],
  },
  VOLCANIQUE_BASALTE: {
    deep: [14, 74, 96],
    shallow: [32, 124, 144],
    coast: [96, 86, 82],
    mid: [78, 72, 70],
    high: [128, 92, 76],
    peak: [238, 128, 64],
    seaLevel: 0.37,
    cityTint: [251, 146, 60],
  },
  CANYONS_OCRES: {
    deep: [22, 82, 110],
    shallow: [48, 132, 156],
    coast: [198, 134, 86],
    mid: [188, 96, 54],
    high: [214, 136, 78],
    peak: [242, 208, 168],
    seaLevel: 0.28,
    cityTint: [253, 186, 116],
  },
};

const TIER_PALETTES: Record<AtmosphereTier, PlanetPalette> = {
  P1: {
    deep: [44, 22, 26],
    shallow: [84, 40, 32],
    coast: [128, 62, 42],
    mid: [162, 84, 52],
    high: [192, 118, 78],
    peak: [232, 196, 174],
    seaLevel: 0.34,
    cityTint: [255, 190, 128],
  },
  P2: {
    deep: [14, 44, 82],
    shallow: [32, 92, 138],
    coast: [146, 118, 86],
    mid: [142, 124, 86],
    high: [168, 148, 118],
    peak: [236, 236, 238],
    seaLevel: 0.44,
    cityTint: [255, 206, 148],
  },
  P3: {
    deep: [8, 56, 118],
    shallow: [20, 134, 168],
    coast: [202, 188, 142],
    mid: [38, 146, 98],
    high: [96, 158, 98],
    peak: [242, 248, 252],
    seaLevel: 0.48,
    cityTint: [175, 240, 255],
  },
  P4: {
    deep: [6, 68, 144],
    shallow: [18, 162, 194],
    coast: [218, 204, 158],
    mid: [24, 164, 106],
    high: [70, 182, 112],
    peak: [248, 250, 255],
    seaLevel: 0.5,
    cityTint: [167, 243, 208],
  },
};

function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  const c = Math.max(0, Math.min(1, t));
  return [
    a[0] + (b[0] - a[0]) * c,
    a[1] + (b[1] - a[1]) * c,
    a[2] + (b[2] - a[2]) * c,
  ];
}

function getSlotSeedOffset(slotIndex: number, worldSeed = 2050): number {
  return (slotIndex - 1) * 417 + (worldSeed % 791);
}

function getSeasonOffsets(season: 'PRINTEMPS' | 'ETE' | 'AUTOMNE' | 'HIVER'): {
  polarShift: number;
  foliageWarmth: number;
  frostLift: number;
} {
  switch (season) {
    case 'HIVER':
      return { polarShift: -0.14, foliageWarmth: -0.18, frostLift: 0.22 };
    case 'ETE':
      return { polarShift: 0.08, foliageWarmth: 0.14, frostLift: 0 };
    case 'AUTOMNE':
      return { polarShift: -0.02, foliageWarmth: 0.34, frostLift: 0.04 };
    default:
      return { polarShift: 0.02, foliageWarmth: 0.0, frostLift: 0 };
  }
}

export interface PlanetPbrTextures {
  readonly map: THREE.CanvasTexture;
  readonly normalMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
  readonly roughnessMap: THREE.CanvasTexture;
  readonly emissiveMap: THREE.CanvasTexture;
}

export function createPlanetSurfaceTextures(
  input: AtmosphereTier | PlanetTextureOptions,
): PlanetPbrTextures {
  const {
    tier,
    season,
    weatherState,
    slotIndex,
    worldSeed,
    biomeProfile,
    oceanCoveragePct,
    planetRelief,
    planetClimate,
  } = normalizeTextureOpts(input);
  const width = 1024;
  const height = 512;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = width;
  albedoCanvas.height = height;
  const aCtx = albedoCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d');

  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = width;
  emissiveCanvas.height = height;
  const eCtx = emissiveCanvas.getContext('2d');

  const heightBuf = new Float32Array(width * height);

  if (aCtx && bCtx && rCtx && eCtx) {
    const aImg = aCtx.createImageData(width, height);
    const bImg = bCtx.createImageData(width, height);
    const rImg = rCtx.createImageData(width, height);
    const eImg = eCtx.createImageData(width, height);

    const biomePal = biomeProfile ? BIOME_PLANET_PALETTES[biomeProfile] : null;
    const basePal = biomePal && slotIndex === 1 ? biomePal : TIER_PALETTES[tier];
    const seedShift = getSlotSeedOffset(slotIndex, worldSeed);
    const seasonCfg = getSeasonOffsets(season);

    const pal: PlanetPalette =
      slotIndex === 2
        ? {
            deep: [38, 44, 54],
            shallow: [64, 72, 86],
            coast: [108, 114, 128],
            mid: [144, 148, 158],
            high: [182, 186, 194],
            peak: [228, 232, 240],
            seaLevel: 0.36,
            cityTint: [186, 230, 253],
          }
        : slotIndex === 4
          ? {
              deep: [14, 52, 98],
              shallow: [48, 128, 178],
              coast: [184, 224, 244],
              mid: [204, 232, 248],
              high: [224, 242, 252],
              peak: [248, 252, 255],
              seaLevel: 0.44,
              cityTint: [125, 211, 252],
            }
          : slotIndex === 5
            ? {
                deep: [62, 42, 22],
                shallow: [122, 82, 34],
                coast: [194, 142, 68],
                mid: [212, 162, 84],
                high: [186, 128, 66],
                peak: [242, 222, 184],
                seaLevel: 0.41,
                cityTint: [253, 186, 116],
              }
            : slotIndex === 6
              ? {
                  deep: [22, 14, 48],
                  shallow: [52, 28, 96],
                  coast: [98, 56, 142],
                  mid: [58, 122, 134],
                  high: [112, 86, 168],
                  peak: [226, 214, 248],
                  seaLevel: 0.45,
                  cityTint: [232, 121, 249],
                }
              : { ...basePal };

    if (slotIndex === 1 && typeof oceanCoveragePct === 'number') {
      pal.seaLevel = oceanCoveragePct <= 3 ? 0.04 : 0.19 + (oceanCoveragePct / 100) * 0.56;
    }

    if (slotIndex === 1 || slotIndex === 3) {
      if (season === 'AUTOMNE' && (tier === 'P3' || tier === 'P4')) {
        pal.mid = lerpRgb(pal.mid, [184, 118, 54], 0.42);
        pal.high = lerpRgb(pal.high, [202, 142, 72], 0.36);
      } else if (season === 'HIVER' && tier !== 'P1') {
        pal.mid = lerpRgb(pal.mid, [154, 178, 188], 0.34);
        pal.high = lerpRgb(pal.high, [224, 236, 244], 0.48);
      } else if (season === 'ETE' && (tier === 'P3' || tier === 'P4')) {
        pal.mid = lerpRgb(pal.mid, [34, 172, 108], 0.28);
      }
    }

    const dryBasinWorld =
      (slotIndex === 1 && typeof oceanCoveragePct === 'number' && oceanCoveragePct <= 4) ||
      (slotIndex === 1 && !biomeProfile && tier === 'P1') ||
      slotIndex === 2;
    const ridgeWeight = planetRelief === 'ESCARPE' ? 0.4 : planetRelief === 'DOUX' ? 0.16 : 0.28;
    const climatePolarShift =
      planetClimate === 'POLAIRE' ? -0.22 : planetClimate === 'ARIDE' ? 0.12 : planetClimate === 'TROPICAL' ? 0.14 : 0;

    for (let y = 0; y < height; y++) {
      const v = y / height;
      const phi = v * Math.PI;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const lat = Math.abs(cosPhi);
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const lon = u * Math.PI * 2;
        const nx = sinPhi * Math.cos(lon) * 2.15;
        const ny = cosPhi * 2.15;
        const nz = sinPhi * Math.sin(lon) * 2.15;

        const wx = fbm3D(nx + 3.1, ny - 1.7, nz + 2.3, 101 + seedShift, 3) * 0.78;
        const wy = fbm3D(ny - 2.4, nz + 4.2, nx - 1.1, 202 + seedShift, 3) * 0.78;
        const wz = fbm3D(nz + 1.9, nx - 3.5, ny + 0.8, 303 + seedShift, 3) * 0.78;

        const baseH = fbm3D(nx + wx, ny + wy, nz + wz, 2050 + seedShift, 5);
        const ridges = ridge3D(nx * 2.35 + wx, ny * 2.35 + wy, nz * 2.35 + wz, 409 + seedShift);
        const microStrata = fbm3D(nx * 6.4, ny * 6.4, nz * 6.4, 709 + seedShift, 3);
        const craterRing =
          dryBasinWorld
            ? Math.max(0, 0.54 - Math.abs(fbm3D(nx * 4.6, ny * 4.6, nz * 4.6, 881 + seedShift, 2) - 0.5)) * 0.22
            : 0;

        const riftPenalty =
          (slotIndex === 3 || slotIndex === 6) && lat < 0.22
            ? Math.max(0, 0.24 - Math.abs(fbm3D(nx * 2.0, ny * 5.0, nz * 2.0, 1213, 2) - 0.5)) * 0.28
            : 0;

        const h = Math.max(
          0,
          Math.min(1, baseH * (0.96 - ridgeWeight) + ridges * ridgeWeight + microStrata * 0.11 - 0.05 - craterRing - riftPenalty),
        );

        const pixIdx = y * width + x;
        const idx = pixIdx * 4;
        const isWater = !dryBasinWorld && h < pal.seaLevel;

        let rgb: Rgb;
        let roughVal = 208;
        let bumpVal = Math.round(h * 255);
        let reliefNorm = h;

        if (isWater) {
          const depthT = Math.max(0, Math.min(1, (h - (pal.seaLevel - 0.26)) / 0.26));
          rgb = lerpRgb(pal.deep, pal.shallow, Math.pow(depthT, 1.45));
          if (depthT > 0.82) {
            const shelfT = (depthT - 0.82) / 0.18;
            rgb = lerpRgb(rgb, pal.coast, shelfT * 0.34);
          }
          roughVal = (season === 'HIVER' || planetClimate === 'POLAIRE') && lat > 0.58 ? 96 : 24;
          bumpVal = Math.round(pal.seaLevel * 185);
          reliefNorm = pal.seaLevel * 0.72 + microStrata * 0.014;
        } else {
          const landT = (h - pal.seaLevel) / Math.max(0.05, 1 - pal.seaLevel);
          if (dryBasinWorld && h < pal.seaLevel) {
            const basinT = Math.max(0, h / Math.max(0.05, pal.seaLevel));
            rgb = lerpRgb(pal.deep, pal.coast, basinT);
          } else if (landT < 0.11) {
            rgb = lerpRgb(pal.coast, pal.mid, landT / 0.11);
          } else if (landT < 0.56) {
            rgb = lerpRgb(
              pal.mid,
              pal.high,
              Math.min(1, (landT - 0.11) / 0.45 + (microStrata - 0.5) * 0.3),
            );
          } else {
            rgb = lerpRgb(pal.high, pal.peak, Math.min(1, (landT - 0.56) / 0.34));
          }
          roughVal = Math.round(188 + landT * 58);
          bumpVal = Math.min(255, Math.round(98 + landT * 138 + ridges * 52));
          reliefNorm = Math.min(1, pal.seaLevel * 0.72 + landT * 0.42 + ridges * 0.22 + microStrata * 0.08);
        }

        heightBuf[pixIdx] = reliefNorm;

        if (!isWater && !dryBasinWorld && (slotIndex === 1 || slotIndex === 3)) {
          const aridBelt = Math.max(0, 1 - Math.abs(lat - 0.32) / 0.16);
          const aridMult = planetClimate === 'ARIDE' ? 0.48 : planetClimate === 'TROPICAL' ? 0.12 : 0.26;
          if (aridBelt > 0.25 && microStrata > 0.45) {
            rgb = lerpRgb(rgb, [196, 162, 108], aridBelt * aridMult);
          }
        }

        const polarEdge = 0.8 + seasonCfg.polarShift + climatePolarShift - h * 0.1 + (wx - 0.35) * 0.06;
        const polarBlend = Math.max(0, Math.min(1, (lat - polarEdge) / 0.085));
        if (polarBlend > 0) {
          rgb = lerpRgb(rgb, pal.peak, polarBlend);
          roughVal = Math.round(roughVal * (1 - polarBlend) + 108 * polarBlend);
        }

        if (weatherState === 'DUST_STORM' && !isWater) {
          rgb = lerpRgb(rgb, [212, 142, 82], 0.24);
        } else if (weatherState === 'CRYO_FRONT' && seasonCfg.frostLift >= 0) {
          rgb = lerpRgb(rgb, [210, 234, 248], 0.16);
        } else if (weatherState === 'RAIN' && !isWater) {
          rgb = lerpRgb(rgb, [38, 108, 96], 0.14);
        }

        const shade = isWater
          ? 0.96 + h * 0.12
          : 0.76 + ridges * 0.4 + (microStrata - 0.5) * 0.2;
        aImg.data[idx] = Math.min(255, Math.round(rgb[0] * shade));
        aImg.data[idx + 1] = Math.min(255, Math.round(rgb[1] * shade));
        aImg.data[idx + 2] = Math.min(255, Math.round(rgb[2] * shade));
        aImg.data[idx + 3] = 255;

        bImg.data[idx] = bumpVal;
        bImg.data[idx + 1] = bumpVal;
        bImg.data[idx + 2] = bumpVal;
        bImg.data[idx + 3] = 255;

        rImg.data[idx] = roughVal;
        rImg.data[idx + 1] = roughVal;
        rImg.data[idx + 2] = roughVal;
        rImg.data[idx + 3] = 255;

        // Clustered coastal & canyon settlement webs (revealed crisply on night hemisphere via shader)
        let em = 0;
        if (!isWater && lat < 0.65 && h > pal.seaLevel + 0.01 && h < pal.seaLevel + 0.28) {
          const cluster = fbm3D(nx * 4.8, ny * 4.8, nz * 4.8, 991 + seedShift, 3);
          const coastBand = ridge3D(nx * 7.4, ny * 7.4, nz * 7.4, 997 + seedShift);
          const spark = hash2D(x * 0.7, y * 0.7, 77);
          if (cluster > 0.57 && coastBand > 0.39 && spark > 0.55) {
            em = Math.min(1, (cluster - 0.57) * 5.2 * (tier === 'P1' ? 0.68 : 1.0));
          }
        }
        eImg.data[idx] = Math.round(pal.cityTint[0] * em);
        eImg.data[idx + 1] = Math.round(pal.cityTint[1] * em);
        eImg.data[idx + 2] = Math.round(pal.cityTint[2] * em);
        eImg.data[idx + 3] = 255;
      }
    }

    aCtx.putImageData(aImg, 0, 0);
    bCtx.putImageData(bImg, 0, 0);
    rCtx.putImageData(rImg, 0, 0);
    eCtx.putImageData(eImg, 0, 0);
  }

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.anisotropy = 4;
  map.needsUpdate = true;

  const normalMap = createNormalMapFromHeight(heightBuf, width, height, 4.2, true, false);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.anisotropy = 4;
  bumpMap.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.anisotropy = 4;
  roughnessMap.needsUpdate = true;

  const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.wrapS = THREE.RepeatWrapping;
  emissiveMap.anisotropy = 4;
  emissiveMap.needsUpdate = true;

  return { map, normalMap, bumpMap, roughnessMap, emissiveMap };
}

export function createPlanetCloudTexture(
  input: AtmosphereTier | PlanetTextureOptions,
): THREE.CanvasTexture {
  const { tier, weatherState, slotIndex } = normalizeTextureOpts(input);
  const width = 768;
  const height = 384;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const img = ctx.createImageData(width, height);
    let threshold = tier === 'P1' ? 0.62 : tier === 'P2' ? 0.53 : tier === 'P3' ? 0.48 : 0.44;
    if (weatherState === 'DUST_STORM' || weatherState === 'RAIN') threshold -= 0.08;
    if (weatherState === 'CRYO_FRONT') threshold -= 0.05;

    const tint: Rgb =
      weatherState === 'DUST_STORM'
        ? [248, 178, 114]
        : weatherState === 'RAIN'
          ? [176, 206, 232]
          : weatherState === 'CRYO_FRONT'
            ? [216, 240, 255]
            : tier === 'P1'
              ? [238, 192, 162]
              : tier === 'P2'
                ? [242, 238, 242]
                : [254, 250, 254];
    const seedShift = getSlotSeedOffset(slotIndex);

    for (let y = 0; y < height; y++) {
      const v = y / height;
      const phi = v * Math.PI;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const lat = Math.abs(cosPhi);
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const lon = u * Math.PI * 2;
        const swirl =
          Math.sin(cosPhi * Math.PI * 3.0 + Math.cos(lon * 2.0) * 1.1) * 0.42;
        const nx = sinPhi * Math.cos(lon + swirl) * 2.5;
        const ny = cosPhi * 2.5;
        const nz = sinPhi * Math.sin(lon + swirl) * 2.5;

        const c1 = fbm3D(nx, ny, nz, 512 + seedShift, 4);
        const c2 = fbm3D(nx * 2.6 + c1, ny * 2.6, nz * 2.6 - c1, 619 + seedShift, 3);
        const wisp = ridge3D(nx * 3.4 - c2, ny * 3.4, nz * 3.4, 733 + seedShift);
        const density = c1 * 0.52 + c2 * 0.34 + wisp * 0.14;
        const polarFade = 1 - Math.max(0, (lat - 0.84) / 0.16);
        const alpha =
          density > threshold
            ? Math.min(1, ((density - threshold) / (1 - threshold)) * 1.5) * polarFade
            : 0;

        const idx = (y * width + x) * 4;
        img.data[idx] = tint[0];
        img.data[idx + 1] = tint[1];
        img.data[idx + 2] = tint[2];
        img.data[idx + 3] = Math.round(alpha * (tier === 'P1' ? 156 : 228));
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Inner Fresnel Atmospheric Halo Shader synced to the 5 scientific divisions (EXOSPHERE..TROPOSPHERE).
 */
export function createAtmosphereHaloMaterial(
  tier: AtmosphereTier,
  atmosphereProgress?: number,
): THREE.ShaderMaterial {
  const div = resolveScientificAtmosphereDivision(tier, atmosphereProgress);
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(div.haloHex) },
      uMieColor: { value: new THREE.Color(div.mieHex) },
      uSunDir: { value: new THREE.Vector3(0.65, 0.55, 0.52).normalize() },
      uIntensity: { value: 0.45 + div.scatteringDensity * 0.62 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldNormal;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform vec3 uMieColor;
      uniform vec3 uSunDir;
      uniform float uIntensity;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldNormal;
      void main() {
        float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 3.0);
        float sunLit = smoothstep(-0.25, 0.72, dot(vWorldNormal, normalize(uSunDir)));
        float terminator = pow(clamp(1.0 - abs(dot(vWorldNormal, normalize(uSunDir))), 0.0, 1.0), 2.5);
        vec3 col = mix(uColor, uMieColor, terminator * 0.45);
        float alpha = fresnel * uIntensity * (0.28 + 0.72 * sunLit);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });
}

/**
 * Outer Rayleigh/Mie Atmospheric Limb Halo Shader (BackSide scattering shell).
 */
export function createAtmosphereLimbMaterial(
  tier: AtmosphereTier,
  atmosphereProgress?: number,
): THREE.ShaderMaterial {
  const div = resolveScientificAtmosphereDivision(tier, atmosphereProgress);
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(div.haloHex) },
      uMieColor: { value: new THREE.Color(div.mieHex) },
      uSunDir: { value: new THREE.Vector3(17, 9, 11).normalize() },
      uOpacity: { value: 0.22 + div.scatteringDensity * 0.26 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldNormal;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform vec3 uMieColor;
      uniform vec3 uSunDir;
      uniform float uOpacity;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldNormal;
      void main() {
        float ndv = clamp(dot(-vNormal, vViewDir), 0.0, 1.0);
        float outerFeather = smoothstep(0.0, 0.44, ndv);
        float rim = pow(ndv, 3.4) * outerFeather;
        float sunDot = dot(vWorldNormal, normalize(uSunDir));
        float daySide = smoothstep(-0.28, 0.65, sunDot);
        float twilight = pow(clamp(1.0 - abs(sunDot), 0.0, 1.0), 2.8);
        vec3 scatterCol = mix(uColor, uMieColor, twilight * 0.48);
        gl_FragColor = vec4(scatterCol, rim * uOpacity * (0.14 + 0.86 * daySide));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  });
}

/**
 * Scale 3 Open-Sky Metropolis Coastal Waterfront Texture (1024x1024)
 * Non-circular organic orthogonal avenue blocks + diagonal river canal + SE harbor bay.
 */
export function createCityGroundTexture(
  tier: AtmosphereTier,
  biomeProfile?: PlanetBiomeProfile,
): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const biomeTint =
      biomeProfile === 'CANYONS_OCRES'
        ? '#d98a5f'
        : biomeProfile === 'VOLCANIQUE_BASALTE'
          ? '#635c5c'
          : biomeProfile === 'BIOSPHERE_FONGIQUE'
            ? '#6c5a98'
            : biomeProfile === 'CRYO_OCEAN'
              ? '#b9d4e8'
              : null;

    const stoneBase =
      tier === 'P1'
        ? '#8c7e74'
        : tier === 'P2'
          ? '#7f8791'
          : tier === 'P3'
            ? '#748c82'
            : '#6f8e80';
    const outerEarth =
      biomeTint ??
      (tier === 'P1'
        ? '#735847'
        : tier === 'P2'
          ? '#57626e'
          : tier === 'P3'
            ? '#46735b'
            : '#377355');
    const gardenColor =
      biomeProfile === 'BIOSPHERE_FONGIQUE'
        ? 'rgba(109, 76, 186, 0.56)'
        : biomeProfile === 'CANYONS_OCRES'
          ? 'rgba(146, 94, 48, 0.52)'
          : tier === 'P1'
            ? 'rgba(72, 108, 66, 0.58)'
            : 'rgba(28, 124, 78, 0.64)';

    // Organic coastal topography gradient (terrace hills NW -> urban basin -> SE harbor)
    const landGrad = ctx.createLinearGradient(0, 0, size, size);
    landGrad.addColorStop(0, outerEarth);
    landGrad.addColorStop(0.24, stoneBase);
    landGrad.addColorStop(0.68, stoneBase);
    landGrad.addColorStop(1, outerEarth);
    ctx.fillStyle = landGrad;
    ctx.fillRect(0, 0, size, size);

    // Subtle mineral / asphalt / travertine urban soil variation
    for (let i = 0; i < 950; i++) {
      const rx = hash2D(i * 1.7, 3.1, 41) * size;
      const ry = hash2D(5.3, i * 2.1, 97) * size;
      const rad = 3 + hash2D(i, i * 0.7, 13) * 8;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,248,240,0.06)' : 'rgba(22,26,38,0.09)';
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Organic neighborhood plazas & terraced parks (irregular polygons, neither circles nor grid squares)
    const parkPolygons: readonly (readonly [number, number])[][] = [
      [[110, 140], [295, 118], [320, 250], [160, 290]],
      [[380, 135], [585, 165], [540, 315], [365, 275]],
      [[635, 180], [820, 220], [790, 395], [610, 360]],
      [[145, 360], [335, 340], [360, 520], [180, 560]],
      [[420, 385], [610, 410], [570, 585], [395, 550]],
      [[240, 740], [490, 795], [460, 910], [190, 865]],
    ];
    for (const poly of parkPolygons) {
      ctx.fillStyle = gardenColor;
      ctx.beginPath();
      poly.forEach(([px, py], idx) => (idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(215, 206, 196, 0.35)';
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // Realistic organic curving arterial boulevards & hillside collector streets (dark slate asphalt + stone sidewalks)
    const drawCurvedRoad = (
      pts: readonly [number, number, number, number, number, number, number, number],
      width: number,
      laneAccent: string,
    ) => {
      const [x0, y0, cx1, cy1, cx2, cy2, x1, y1] = pts;
      ctx.save();
      ctx.lineCap = 'round';
      // Pale travertine pedestrian sidewalks
      ctx.strokeStyle = 'rgba(218, 210, 202, 0.78)';
      ctx.lineWidth = width + 14;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1);
      ctx.stroke();

      // Realistic urban slate asphalt roadway
      ctx.strokeStyle = '#333b48';
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1);
      ctx.stroke();

      // Subtle dashed lane divider / solar transit strip
      ctx.setLineDash([12, 14]);
      ctx.strokeStyle = laneAccent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1);
      ctx.stroke();
      ctx.restore();
    };

    // Main sweeping W-to-NE ridge arterial
    drawCurvedRoad([42, 335, 285, 275, 565, 375, 920, 290], 26, 'rgba(248, 250, 252, 0.55)');
    // Coastal waterfront corniche curving naturally above the bay
    drawCurvedRoad([85, 575, 345, 515, 585, 620, 885, 540], 24, 'rgba(56, 189, 248, 0.55)');
    // NNW-to-S valley avenue crossing the river via bridge
    drawCurvedRoad([350, 52, 395, 290, 320, 560, 425, 945], 24, 'rgba(248, 250, 252, 0.52)');
    // Eastern harbor connector avenue
    drawCurvedRoad([635, 65, 590, 285, 680, 480, 610, 745], 20, 'rgba(251, 191, 36, 0.5)');
    // Western neighborhood hillside street
    drawCurvedRoad([165, 110, 125, 310, 225, 495, 175, 815], 16, 'rgba(226, 232, 240, 0.42)');

    // Diagonal meandering urban river canal & landscaped stone embankments flowing into SE Harbor Bay
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(182, 175, 165, 0.92)';
    ctx.lineWidth = 62;
    ctx.beginPath();
    ctx.moveTo(48, 665);
    ctx.bezierCurveTo(265, 615, 465, 745, 795, 768);
    ctx.stroke();

    ctx.strokeStyle = biomeProfile === 'VOLCANIQUE_BASALTE' ? '#0e7490' : '#0369a1';
    ctx.lineWidth = 42;
    ctx.beginPath();
    ctx.moveTo(48, 665);
    ctx.bezierCurveTo(265, 615, 465, 745, 795, 768);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(125, 211, 252, 0.35)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(54, 662);
    ctx.bezierCurveTo(265, 612, 465, 742, 790, 765);
    ctx.stroke();
    ctx.restore();

    // SE Coastal Harbor Bay & Organic Granite Seawall Promenade
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(size, 595);
    ctx.bezierCurveTo(855, 625, 735, 730, 595, size);
    ctx.lineTo(size, size);
    ctx.closePath();
    const bayGrad = ctx.createLinearGradient(660, 660, size, size);
    bayGrad.addColorStop(0, '#0284c7');
    bayGrad.addColorStop(0.45, '#0369a1');
    bayGrad.addColorStop(1, '#082f49');
    ctx.fillStyle = bayGrad;
    ctx.fill();

    // Granite seawall quay & harbor promenade
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 24;
    ctx.beginPath();
    ctx.moveTo(size, 595);
    ctx.bezierCurveTo(855, 625, 735, 730, 595, size);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.52)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Rectangular central civic plaza pad at Command (0, 0 -> center-left block)
    ctx.fillStyle = '#fff5f7';
    ctx.fillRect(398, 398, 144, 144);
    ctx.strokeStyle = 'rgba(225, 29, 72, 0.55)';
    ctx.lineWidth = 3;
    ctx.strokeRect(398, 398, 144, 144);

    // Feathered rounded-square perimeter alpha mask (never circular bullseye)
    ctx.globalCompositeOperation = 'destination-in';
    const mask = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.34, size * 0.5, size * 0.5, size * 0.62);
    mask.addColorStop(0, 'rgba(0,0,0,1)');
    mask.addColorStop(0.76, 'rgba(0,0,0,0.95)');
    mask.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = 'source-over';
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Scale 3 Surrounding Planetary Horizon Terrain Texture (matches biome & SE coastal sea)
 */
export function createCityHorizonTexture(
  tier: AtmosphereTier,
  biomeProfile?: PlanetBiomeProfile,
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const img = ctx.createImageData(size, size);
    const palette: Record<
      AtmosphereTier,
      { valley: Rgb; soil: Rgb; meadow: Rgb; rock: Rgb; highlight: Rgb; water: Rgb }
    > = {
      P1: {
        valley: [134, 92, 74],
        soil: [168, 118, 92],
        meadow: [148, 128, 92],
        rock: [122, 92, 86],
        highlight: [212, 174, 152],
        water: [36, 134, 168],
      },
      P2: {
        valley: [112, 112, 116],
        soil: [146, 136, 138],
        meadow: [110, 146, 120],
        rock: [118, 110, 122],
        highlight: [196, 188, 192],
        water: [28, 144, 184],
      },
      P3: {
        valley: [68, 130, 102],
        soil: [118, 152, 118],
        meadow: [74, 162, 112],
        rock: [116, 124, 122],
        highlight: [184, 208, 192],
        water: [24, 156, 198],
      },
      P4: {
        valley: [48, 146, 104],
        soil: [92, 168, 122],
        meadow: [58, 182, 118],
        rock: [126, 138, 136],
        highlight: [204, 228, 212],
        water: [20, 168, 212],
      },
    };
    const pal = { ...palette[tier] };
    if (biomeProfile === 'CANYONS_OCRES') {
      pal.valley = [156, 84, 48];
      pal.soil = [194, 112, 66];
      pal.meadow = [174, 128, 72];
      pal.rock = [138, 74, 48];
    } else if (biomeProfile === 'CRYO_OCEAN') {
      pal.valley = [126, 156, 182];
      pal.soil = [164, 192, 214];
      pal.meadow = [192, 218, 236];
      pal.rock = [132, 148, 166];
    } else if (biomeProfile === 'BIOSPHERE_FONGIQUE') {
      pal.valley = [88, 72, 128];
      pal.soil = [118, 86, 156];
      pal.meadow = [52, 162, 136];
    } else if (biomeProfile === 'VOLCANIQUE_BASALTE') {
      pal.valley = [74, 68, 70];
      pal.soil = [98, 88, 84];
      pal.meadow = [116, 94, 78];
    }

    for (let y = 0; y < size; y++) {
      const ny = (y / size) * 2 - 1;
      for (let x = 0; x < size; x++) {
        const nx = (x / size) * 2 - 1;
        const dist = Math.hypot(nx, ny);
        const macro = fbm((x / size) * 6.5, (y / size) * 6.5, 808, 5);
        const detail = fbm((x / size) * 22, (y / size) * 22, 313, 3);
        const strata = Math.sin((macro * 14 + detail * 2.5) * Math.PI) * 0.08;
        const h = Math.max(0, Math.min(1, macro * 0.78 + detail * 0.22 + strata));

        // SE Coastal Ocean horizon matching city waterfront
        const seCoast = nx + ny + macro * 0.14;
        const isOceanBay = biomeProfile !== 'CANYONS_OCRES' && seCoast > 0.26;
        const creekWave = Math.sin(nx * 5.2 + macro * 2.1) * 0.18 + 0.14;
        const creekDist = Math.abs(ny - creekWave);
        const isCreek = !isOceanBay && dist > 0.17 && dist < 0.78 && creekDist < 0.02 && h < 0.56;

        let rgb: Rgb;
        if (isOceanBay) {
          const depth = Math.min(1, (seCoast - 0.26) / 0.55);
          rgb = lerpRgb(pal.water, [10, 68, 118], depth);
        } else if (isCreek) {
          rgb = lerpRgb(pal.water, pal.meadow, creekDist / 0.02);
        } else if (h < 0.35) {
          rgb = lerpRgb(pal.valley, pal.soil, h / 0.35);
        } else if (h < 0.62) {
          const meadowMix = fbm((x / size) * 11, (y / size) * 11, 515, 3);
          const base = lerpRgb(pal.soil, pal.meadow, meadowMix);
          rgb = lerpRgb(base, pal.highlight, ((h - 0.35) / 0.27) * 0.35);
        } else if (h < 0.82) {
          rgb = lerpRgb(pal.meadow, pal.rock, (h - 0.62) / 0.2);
        } else {
          rgb = lerpRgb(pal.rock, pal.highlight, (h - 0.82) / 0.18);
        }

        const idx = (y * size + x) * 4;
        img.data[idx] = Math.round(rgb[0]);
        img.data[idx + 1] = Math.round(rgb[1]);
        img.data[idx + 2] = Math.round(rgb[2]);
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

export function createCityHorizonBumpTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n = fbm((x / size) * 14, (y / size) * 14, 909, 4);
        const v = Math.round(Math.max(0, Math.min(255, n * 255)));
        const idx = (y * size + x) * 4;
        img.data[idx] = v;
        img.data[idx + 1] = v;
        img.data[idx + 2] = v;
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.needsUpdate = true;
  return tex;
}

export interface FacadePbrTextures {
  readonly map: THREE.CanvasTexture;
  readonly normalMap: THREE.CanvasTexture;
  readonly roughnessMap: THREE.CanvasTexture;
  readonly emissiveMap: THREE.CanvasTexture;
}

/**
 * Procedural Architectural Curtain-Wall Facade PBR Set (Albedo + Tangent NormalMap + RoughnessMap + Emissive Windows)
 */
export function createFacadeTextures(
  wallHex: string,
  glassHex: string,
  accentHex: string,
): FacadePbrTextures {
  const w = 256;
  const h = 512;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = w;
  albedoCanvas.height = h;
  const aCtx = albedoCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = w;
  roughCanvas.height = h;
  const rCtx = roughCanvas.getContext('2d');

  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = w;
  emissiveCanvas.height = h;
  const eCtx = emissiveCanvas.getContext('2d');

  const heightBuf = new Float32Array(w * h);
  heightBuf.fill(0.68);

  if (aCtx && rCtx && eCtx) {
    aCtx.fillStyle = wallHex;
    aCtx.fillRect(0, 0, w, h);

    // Matte composite architectural cladding base roughness (~0.62)
    rCtx.fillStyle = 'rgb(158, 158, 158)';
    rCtx.fillRect(0, 0, w, h);

    eCtx.fillStyle = '#000000';
    eCtx.fillRect(0, 0, w, h);

    const rows = 14;
    const cols = 6;
    const rowH = h / rows;
    const colW = w / cols;

    for (let r = 0; r < rows; r++) {
      const corniceY = Math.floor(r * rowH);
      aCtx.fillStyle = 'rgba(255,255,255,0.45)';
      aCtx.fillRect(0, corniceY, w, 4);
      rCtx.fillStyle = 'rgb(120, 120, 120)';
      rCtx.fillRect(0, corniceY, w, 4);

      for (let yy = corniceY; yy < Math.min(h, corniceY + 4); yy++) {
        for (let xx = 0; xx < w; xx++) {
          heightBuf[yy * w + xx] = 0.94;
        }
      }

      for (let c = 0; c < cols; c++) {
        const px = Math.floor(c * colW + 5);
        const py = Math.floor(r * rowH + 8);
        const pw = Math.floor(colW - 10);
        const ph = Math.floor(rowH - 13);

        aCtx.fillStyle = glassHex;
        aCtx.fillRect(px, py, pw, ph);

        aCtx.fillStyle = 'rgba(255,255,255,0.18)';
        aCtx.fillRect(px, py, pw * 0.35, ph);

        // Smooth recessed specular glass pane roughness (~0.16)
        rCtx.fillStyle = 'rgb(42, 42, 42)';
        rCtx.fillRect(px, py, pw, ph);

        for (let yy = py; yy < Math.min(h, py + ph); yy++) {
          for (let xx = px; xx < Math.min(w, px + pw); xx++) {
            heightBuf[yy * w + xx] = 0.18;
          }
        }

        const lit = hash2D(c * 3.1, r * 5.7, 2050);
        if (lit > 0.42) {
          const isAccent = lit > 0.84;
          eCtx.fillStyle = isAccent ? accentHex : '#fff1d6';
          eCtx.globalAlpha = isAccent ? 0.92 : 0.42 + (lit - 0.42) * 0.55;
          eCtx.fillRect(px + 1, py + 2, pw - 2, ph - 4);
          eCtx.globalAlpha = 1;
        }
      }
    }

    aCtx.fillStyle = accentHex;
    aCtx.fillRect(0, 10, w, 6);
    aCtx.fillRect(0, h * 0.5, w, 4);
    eCtx.fillStyle = accentHex;
    eCtx.fillRect(0, 10, w, 6);
  }

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 4;
  map.needsUpdate = true;

  const normalMap = createNormalMapFromHeight(heightBuf, w, h, 3.0, true, true);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = 4;
  roughnessMap.needsUpdate = true;

  const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.wrapS = THREE.RepeatWrapping;
  emissiveMap.wrapT = THREE.RepeatWrapping;
  emissiveMap.anisotropy = 4;
  emissiveMap.needsUpdate = true;

  return { map, normalMap, roughnessMap, emissiveMap };
}

/**
 * Procedural PBR Textures for the 24 Expandable City Footprint Hex Pads
 */
export function createHexPadPbrTextures(accentHex = '#00f0ff'): FacadePbrTextures {
  const size = 256;
  const cx = size / 2;
  const cy = size / 2;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const aCtx = albedoCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');

  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = size;
  emissiveCanvas.height = size;
  const eCtx = emissiveCanvas.getContext('2d');

  const heightBuf = new Float32Array(size * size);
  heightBuf.fill(0.5);

  if (aCtx && rCtx && eCtx) {
    aCtx.fillStyle = '#e7edf4';
    aCtx.fillRect(0, 0, size, size);

    rCtx.fillStyle = 'rgb(142, 142, 142)';
    rCtx.fillRect(0, 0, size, size);

    eCtx.fillStyle = '#000000';
    eCtx.fillRect(0, 0, size, size);

    // Metallic concentric hex bevel channels
    aCtx.strokeStyle = '#94a3b8';
    aCtx.lineWidth = 4;
    aCtx.beginPath();
    aCtx.arc(cx, cy, 98, 0, Math.PI * 2);
    aCtx.stroke();

    aCtx.strokeStyle = 'rgba(15, 23, 42, 0.24)';
    aCtx.lineWidth = 2;
    aCtx.beginPath();
    aCtx.arc(cx, cy, 62, 0, Math.PI * 2);
    aCtx.stroke();

    // Specular metallic groove in roughness map
    rCtx.strokeStyle = 'rgb(64, 64, 64)';
    rCtx.lineWidth = 6;
    rCtx.beginPath();
    rCtx.arc(cx, cy, 98, 0, Math.PI * 2);
    rCtx.stroke();

    // Emissive telemetry ticks
    eCtx.strokeStyle = accentHex;
    eCtx.lineWidth = 3;
    eCtx.setLineDash([14, 10]);
    eCtx.beginPath();
    eCtx.arc(cx, cy, 92, 0, Math.PI * 2);
    eCtx.stroke();
    eCtx.setLineDash([]);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const d = Math.hypot(x - cx, y - cy);
        const groove = Math.abs(d - 98) < 4 || Math.abs(d - 62) < 2.5 ? -0.32 : 0;
        const micro = (hash2D(x * 0.5, y * 0.5, 44) - 0.5) * 0.04;
        heightBuf[y * size + x] = 0.62 + groove + micro;
      }
    }
  }

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  map.needsUpdate = true;

  const normalMap = createNormalMapFromHeight(heightBuf, size, size, 2.8, false, false);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.anisotropy = 4;
  roughnessMap.needsUpdate = true;

  const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.anisotropy = 4;
  emissiveMap.needsUpdate = true;

  return { map, normalMap, roughnessMap, emissiveMap };
}

/**
 * Horizontally repeating Maglev Rail Energy Pulse Texture (animated via .offset.x).
 */
export function createMaglevRailEmissiveTexture(accentHex: string): THREE.CanvasTexture {
  const w = 256;
  const h = 32;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#140b18';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 4; i++) {
      const startX = i * 64;
      const grad = ctx.createLinearGradient(startX, 0, startX + 54, 0);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.55, accentHex);
      grad.addColorStop(0.85, '#ffffff');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(startX, 4, 54, h - 8);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 1);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Tileable Tangent-Space Water Ripple NormalMap (Linear ColorSpace).
 */
export function createWaterRippleNormalMap(): THREE.CanvasTexture {
  const size = 256;
  const buf = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const ny = (y / size) * Math.PI * 2;
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * Math.PI * 2;
      const w1 = Math.sin(nx * 4 + Math.cos(ny * 3) * 0.6) * 0.35;
      const w2 = Math.cos(ny * 5 - Math.sin(nx * 2) * 0.7) * 0.3;
      const fine = fbm((x / size) * 12, (y / size) * 12, 601, 3) * 0.35;
      buf[y * size + x] = 0.5 + (w1 + w2) * 0.28 + fine;
    }
  }
  const tex = createNormalMapFromHeight(buf, size, size, 2.2, true, true);
  tex.repeat.set(3, 3);
  return tex;
}

/**
 * Soft Radial Glowing Sprite Texture for Environmental Weather & Atmospheric Motes
 */
export function createParticleGlowTexture(): THREE.CanvasTexture {
  const size = 64;
  const cx = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(cx, cx, 1, cx, cx, cx);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.72)');
    grad.addColorStop(0.75, 'rgba(255,255,255,0.16)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 135-Degree Graduated Holographic Turntable Dial for the Isolated 3D Inspector
 */
export function createHolographic135PlinthTexture(lightTheme: boolean): THREE.CanvasTexture {
  const size = 1024;
  const cx = size / 2;
  const cy = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const bgGrad = ctx.createRadialGradient(cx, cy, 24, cx, cy, size * 0.49);
    if (lightTheme) {
      bgGrad.addColorStop(0, '#f8fafc');
      bgGrad.addColorStop(0.55, '#e2e8f0');
      bgGrad.addColorStop(0.92, '#cbd5e1');
      bgGrad.addColorStop(1, '#94a3b8');
    } else {
      bgGrad.addColorStop(0, '#0c162b');
      bgGrad.addColorStop(0.55, '#0a1222');
      bgGrad.addColorStop(0.92, '#070c18');
      bgGrad.addColorStop(1, '#04070f');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    const primaryStroke = lightTheme ? 'rgba(2, 132, 199, 0.58)' : 'rgba(0, 240, 255, 0.72)';
    const secondaryStroke = lightTheme ? 'rgba(5, 150, 105, 0.5)' : 'rgba(16, 185, 129, 0.58)';
    const subtleStroke = lightTheme ? 'rgba(15, 23, 42, 0.14)' : 'rgba(56, 189, 248, 0.16)';

    // Concentric calibration rings
    for (const r of [140, 260, 380, 462]) {
      ctx.strokeStyle = r === 462 ? primaryStroke : subtleStroke;
      ctx.lineWidth = r === 462 ? 3 : 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Highlighted 135-degree measurement sector arc (-112.5deg to +22.5deg -> exact 135deg sweep)
    const startRad = -Math.PI * 0.625;
    const endRad = startRad + (135 * Math.PI) / 180;
    ctx.strokeStyle = primaryStroke;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(cx, cy, 434, startRad, endRad);
    ctx.stroke();

    ctx.strokeStyle = secondaryStroke;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 412, startRad, endRad);
    ctx.stroke();

    // 72 circumference degree ticks (every 5 degrees), bold every 45 degrees
    for (let deg = 0; deg < 360; deg += 5) {
      const a = (deg * Math.PI) / 180;
      const isMajor = deg % 45 === 0;
      const isMid = deg % 15 === 0;
      const rIn = isMajor ? 430 : isMid ? 444 : 452;
      const rOut = 462;
      ctx.strokeStyle = isMajor ? secondaryStroke : primaryStroke;
      ctx.lineWidth = isMajor ? 3 : isMid ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * rIn, cy + Math.sin(a) * rIn);
      ctx.lineTo(cx + Math.cos(a) * rOut, cy + Math.sin(a) * rOut);
      ctx.stroke();
    }

    // 135deg radial boundary guides
    for (const boundaryAngle of [startRad, endRad]) {
      ctx.strokeStyle = secondaryStroke;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(boundaryAngle) * 140, cy + Math.sin(boundaryAngle) * 140);
      ctx.lineTo(cx + Math.cos(boundaryAngle) * 436, cy + Math.sin(boundaryAngle) * 436);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Center reticle crosshair & 135deg telemetry caption
    ctx.strokeStyle = primaryStroke;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 48, cy);
    ctx.lineTo(cx + 48, cy);
    ctx.moveTo(cx, cy - 48);
    ctx.lineTo(cx, cy + 48);
    ctx.stroke();

    ctx.fillStyle = primaryStroke;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('135° TELEMETRY STAGE', cx, cy + 320);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Scale 3 Open-Sky Rayleigh + Mie Atmospheric Scattering Shader
 * Synchronized to the 5 scientific divisions (EXOSPHERE -> THERMOSPHERE -> MESOSPHERE -> STRATOSPHERE -> TROPOSPHERE).
 * Never encloses settlements in a closed shell (sky sphere radius = 72).
 */
export function createOpenSkyDomeMaterial(
  isLightTheme: boolean,
  tier: AtmosphereTier,
  atmosphereProgress?: number,
): THREE.ShaderMaterial {
  const div = resolveScientificAtmosphereDivision(tier, atmosphereProgress);
  const zenith = isLightTheme
    ? new THREE.Color(div.rayleighHex).lerp(new THREE.Color('#93c5fd'), 0.42)
    : new THREE.Color(div.rayleighHex);
  const horizon = isLightTheme
    ? new THREE.Color(div.horizonHex).lerp(new THREE.Color('#fff5f7'), 0.56)
    : new THREE.Color(div.horizonHex).lerp(new THREE.Color('#1a1026'), 0.48);
  const groundBounce = isLightTheme ? new THREE.Color('#ead5dd') : new THREE.Color('#130b1c');
  const rayleighColor = new THREE.Color(div.haloHex);
  const mieColor = new THREE.Color(div.mieHex);

  return new THREE.ShaderMaterial({
    uniforms: {
      uZenith: { value: zenith },
      uHorizon: { value: horizon },
      uGround: { value: groundBounce },
      uRayleighColor: { value: rayleighColor },
      uMieColor: { value: mieColor },
      uSunDir: { value: new THREE.Vector3(0.58, 0.46, 0.52).normalize() },
      uScatteringDensity: { value: div.scatteringDensity },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vWorldDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uZenith;
      uniform vec3 uHorizon;
      uniform vec3 uGround;
      uniform vec3 uRayleighColor;
      uniform vec3 uMieColor;
      uniform vec3 uSunDir;
      uniform float uScatteringDensity;
      uniform float uTime;
      varying vec3 vWorldDir;

      void main() {
        vec3 dir = normalize(vWorldDir);
        vec3 sunDir = normalize(uSunDir);
        float h = dir.y;

        // Rayleigh vertical optical thickness gradient
        float upT = pow(clamp(h, 0.0, 1.0), 0.58);
        vec3 baseSky = mix(uHorizon, uZenith, upT);
        vec3 rayleighShift = uRayleighColor * (1.0 - upT) * 0.28 * uScatteringDensity;

        // Henyey-Greenstein Mie forward solar scattering & crisp solar corona
        float cosTheta = max(dot(dir, sunDir), 0.0);
        float g = 0.78;
        float g2 = g * g;
        float miePhase = (1.0 - g2) / max(0.08, pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
        float horizonBoost = 1.0 - clamp(abs(h) * 2.2, 0.0, 1.0);
        vec3 mieGlow = uMieColor * clamp(miePhase * 0.042 * (0.45 + uScatteringDensity * 0.75), 0.0, 0.95);
        float sunDisk = smoothstep(0.9965, 0.9994, cosTheta);

        // Subtle high-altitude cirrus iridescence waves
        float wave = sin(dir.x * 9.0 + uTime * 0.06) * cos(dir.z * 7.5 - uTime * 0.04);
        float mistBand = smoothstep(0.02, 0.34, h) * (1.0 - smoothstep(0.34, 0.85, h));
        vec3 cirrusTint = mix(uHorizon, uRayleighColor, 0.35) * max(0.0, wave) * 0.055 * mistBand * uScatteringDensity;

        vec3 skyCol = baseSky + rayleighShift + mieGlow + uMieColor * horizonBoost * 0.14 * uScatteringDensity + cirrusTint + vec3(1.0, 0.97, 0.9) * sunDisk;
        vec3 col = h >= 0.0 ? skyCol : mix(uHorizon, uGround, clamp(-h * 3.2, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });
}

/**
 * Procedural soft radial contact shadow disc for Scale 3 architectural grounding (zero external assets).
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cx = size / 2;
    const grad = ctx.createRadialGradient(cx, cx, size * 0.14, cx, cx, size * 0.5);
    grad.addColorStop(0, 'rgba(26, 12, 34, 0.52)');
    grad.addColorStop(0.55, 'rgba(26, 12, 34, 0.24)');
    grad.addColorStop(1, 'rgba(26, 12, 34, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Soft Sunlit Open-Sky Cloud Wisp Texture (Scale 3 drifting cirrus/cumulus ribbons, strictly open sky).
 */
export function createCityCloudWispTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      const ny = (y / h) * 2 - 1;
      for (let x = 0; x < w; x++) {
        const nx = (x / w) * 2 - 1;
        const radial = Math.hypot(nx * 0.92, ny * 1.15);
        const envelope = Math.max(0, 1 - Math.pow(Math.min(1, radial), 1.85));
        const n1 = fbm((x / w) * 4.5, (y / h) * 3.5, 412, 4);
        const n2 = fbm((x / w) * 9.0 + n1, (y / h) * 6.5, 719, 3);
        const density = Math.max(0, (n1 * 0.65 + n2 * 0.35 - 0.34) * 1.85) * envelope;
        const alpha = Math.min(1, density);
        const warmTint = 0.88 + n2 * 0.12;
        const idx = (y * w + x) * 4;
        img.data[idx] = Math.min(255, Math.round(255 * warmTint));
        img.data[idx + 1] = Math.min(255, Math.round(248 * warmTint));
        img.data[idx + 2] = Math.min(255, Math.round(252 * warmTint));
        img.data[idx + 3] = Math.round(alpha * 195);
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

