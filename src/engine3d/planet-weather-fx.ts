import * as THREE from 'three';
import type { AtmosphereTier, ViewportOverlayMode } from '../contracts/render-bridge.schema.ts';
import type { WorldState } from '../contracts/world-state.schema.ts';
import { createParticleGlowTexture } from './procedural-textures.ts';

/**
 * [L4] EXW.L4.PLANET_WEATHER_FX | v5.1.0 | SADT A5.3
 * Scale 2 Dynamic Weather Particles, Polar Aurora Ribbons, Seasonal Frost Ring &
 * Geodesic Telemetry Overlays (Usure / Maintenance Stress & Flux Conduits).
 */
export interface PlanetWeatherFxNodes {
  readonly group: THREE.Group;
  readonly stormParticles: THREE.Points;
  readonly stormMat: THREE.PointsMaterial;
  readonly auroraNorth: THREE.Mesh;
  readonly auroraSouth: THREE.Mesh;
  readonly rainBands: THREE.Group;
  readonly overlayGroup: THREE.Group;
  readonly radius: number;
  lastOverlaySig: string;
}

export interface WeatherFxDiffInput {
  readonly weatherState: WorldState['weatherState'];
  readonly season: WorldState['season'];
  readonly atmosphereTier: AtmosphereTier;
  readonly overlayMode: ViewportOverlayMode;
  readonly capturedTiles: readonly number[];
  readonly rivalTiles: readonly number[];
  readonly tileDirections: readonly THREE.Vector3[];
}

export function buildPlanetWeatherFx(radius: number): PlanetWeatherFxNodes {
  const group = new THREE.Group();

  // Weather particle cloud shell (re-colored & re-sized per weather state)
  const count = 160;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const latBand = (((i * 37) % 100) / 100) * 1.4 - 0.7;
    const lon = ((i * 137.5) * Math.PI) / 180;
    const r = radius * (1.055 + (i % 5) * 0.011);
    const cosLat = Math.sqrt(Math.max(0.05, 1 - latBand * latBand));
    positions[i * 3] = Math.cos(lon) * cosLat * r;
    positions[i * 3 + 1] = latBand * r;
    positions[i * 3 + 2] = Math.sin(lon) * cosLat * r;
  }
  const stormGeo = new THREE.BufferGeometry();
  stormGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const stormMat = new THREE.PointsMaterial({
    color: 0xfbbf24,
    map: createParticleGlowTexture(),
    size: 0.11,
    transparent: true,
    opacity: 0,
    alphaTest: 0.03,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const stormParticles = new THREE.Points(stormGeo, stormMat);
  stormParticles.visible = false;
  group.add(stormParticles);

  // Polar aurora ribbons (SOLAR_FLARE / CRYO_FRONT)
  const auroraMatN = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const auroraNorth = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.56, 0.032, 8, 64),
    auroraMatN,
  );
  auroraNorth.rotation.x = Math.PI / 2;
  auroraNorth.position.y = radius * 0.87;
  auroraNorth.visible = false;
  group.add(auroraNorth);

  const auroraSouth = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.56, 0.032, 8, 64),
    auroraMatN.clone(),
  );
  auroraSouth.rotation.x = Math.PI / 2;
  auroraSouth.position.y = -radius * 0.87;
  auroraSouth.visible = false;
  group.add(auroraSouth);

  // Equatorial cyclonic / rain circulation bands
  const rainBands = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius * (1.06 + i * 0.018), 0.009, 6, 72, Math.PI * 0.85),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      }),
    );
    ring.rotation.x = Math.PI / 2 + (i - 1) * 0.34;
    ring.rotation.z = i * 1.1;
    rainBands.add(ring);
  }
  rainBands.visible = false;
  group.add(rainBands);

  const overlayGroup = new THREE.Group();
  group.add(overlayGroup);

  return {
    group,
    stormParticles,
    stormMat,
    auroraNorth,
    auroraSouth,
    rainBands,
    overlayGroup,
    radius,
    lastOverlaySig: '',
  };
}

function clearOverlayGroup(group: THREE.Group): void {
  while (group.children.length > 0) {
    const child = group.children[0];
    if (!child) break;
    group.remove(child);
    child.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) m.dispose();
      }
    });
  }
}

export function updatePlanetWeatherFx(
  nodes: PlanetWeatherFxNodes,
  input: WeatherFxDiffInput,
): void {
  const { weatherState, season, overlayMode, capturedTiles, rivalTiles, tileDirections } = input;

  // 1. Weather state particle & ribbon styling
  if (weatherState === 'DUST_STORM') {
    nodes.stormParticles.visible = true;
    nodes.stormMat.color.setHex(0xf59e0b);
    nodes.stormMat.size = 0.09;
    nodes.stormMat.opacity = 0.78;
    nodes.auroraNorth.visible = false;
    nodes.auroraSouth.visible = false;
    nodes.rainBands.visible = true;
    nodes.rainBands.children.forEach((c) => {
      if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshBasicMaterial) {
        c.material.color.setHex(0xfb923c);
        c.material.opacity = 0.42;
      }
    });
  } else if (weatherState === 'SOLAR_FLARE') {
    nodes.stormParticles.visible = true;
    nodes.stormMat.color.setHex(0xfde047);
    nodes.stormMat.size = 0.075;
    nodes.stormMat.opacity = 0.55;
    nodes.auroraNorth.visible = true;
    nodes.auroraSouth.visible = true;
    for (const a of [nodes.auroraNorth, nodes.auroraSouth]) {
      const m = a.material as THREE.MeshBasicMaterial;
      m.color.setHex(0xf43f5e);
      m.opacity = 0.62;
    }
    nodes.rainBands.visible = false;
  } else if (weatherState === 'CRYO_FRONT') {
    nodes.stormParticles.visible = true;
    nodes.stormMat.color.setHex(0xbae6fd);
    nodes.stormMat.size = 0.07;
    nodes.stormMat.opacity = 0.68;
    nodes.auroraNorth.visible = true;
    nodes.auroraSouth.visible = true;
    for (const a of [nodes.auroraNorth, nodes.auroraSouth]) {
      const m = a.material as THREE.MeshBasicMaterial;
      m.color.setHex(0x38bdf8);
      m.opacity = 0.52;
    }
    nodes.rainBands.visible = false;
  } else if (weatherState === 'RAIN') {
    nodes.stormParticles.visible = true;
    nodes.stormMat.color.setHex(0x38bdf8);
    nodes.stormMat.size = 0.06;
    nodes.stormMat.opacity = 0.56;
    nodes.auroraNorth.visible = false;
    nodes.auroraSouth.visible = false;
    nodes.rainBands.visible = true;
    nodes.rainBands.children.forEach((c) => {
      if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshBasicMaterial) {
        c.material.color.setHex(0x38bdf8);
        c.material.opacity = 0.46;
      }
    });
  } else {
    nodes.stormParticles.visible = false;
    nodes.rainBands.visible = false;
    const showWinterAurora = season === 'HIVER';
    nodes.auroraNorth.visible = showWinterAurora;
    nodes.auroraSouth.visible = showWinterAurora;
    if (showWinterAurora) {
      for (const a of [nodes.auroraNorth, nodes.auroraSouth]) {
        const m = a.material as THREE.MeshBasicMaterial;
        m.color.setHex(0x34d399);
        m.opacity = 0.28;
      }
    }
  }

  // 2. Telemetry Overlay 3D Arcs (LOGISTICS Flux conduits | MAINTENANCE Wear rings)
  const overlaySig = `${overlayMode}::${capturedTiles.join(',')}::${rivalTiles.join(',')}`;
  if (overlaySig === nodes.lastOverlaySig) return;
  nodes.lastOverlaySig = overlaySig;
  clearOverlayGroup(nodes.overlayGroup);

  if (overlayMode === 'LOGISTICS' && capturedTiles.length >= 2) {
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x2dd4bf,
      transparent: true,
      opacity: 0.72,
    });
    const hub = tileDirections[capturedTiles[0]!];
    if (hub) {
      const maxLinks = Math.min(capturedTiles.length, 12);
      for (let i = 1; i < maxLinks; i++) {
        const targetDir = tileDirections[capturedTiles[i]!];
        if (!targetDir) continue;
        const mid = hub.clone().add(targetDir).normalize().multiplyScalar(nodes.radius * 1.12);
        const start = hub.clone().multiplyScalar(nodes.radius * 1.025);
        const end = targetDir.clone().multiplyScalar(nodes.radius * 1.025);
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(16));
        nodes.overlayGroup.add(new THREE.Line(geo, lineMat.clone()));
      }
    }
    lineMat.dispose();
  } else if (overlayMode === 'MAINTENANCE') {
    const stressTargets = [...rivalTiles.slice(0, 6), ...capturedTiles.slice(0, 3)];
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < stressTargets.length; i++) {
      const idx = stressTargets[i]!;
      const dir = tileDirections[idx];
      if (!dir) continue;
      const isRivalHot = i < Math.min(6, rivalTiles.length);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(isRivalHot ? 0.17 : 0.14, 0.013, 6, 24),
        new THREE.MeshBasicMaterial({
          color: isRivalHot ? 0xf43f5e : 0xf59e0b,
          transparent: true,
          opacity: 0.78,
        }),
      );
      ring.position.copy(dir).multiplyScalar(nodes.radius + 0.04);
      ring.quaternion.setFromUnitVectors(up, dir);
      ring.rotateX(Math.PI / 2);
      nodes.overlayGroup.add(ring);
    }
  }
}

export function animatePlanetWeatherFx(
  nodes: PlanetWeatherFxNodes,
  elapsedSec: number,
): void {
  if (nodes.stormParticles.visible) {
    nodes.stormParticles.rotation.y = elapsedSec * 0.18;
    nodes.stormParticles.rotation.z = Math.sin(elapsedSec * 0.4) * 0.08;
  }
  if (nodes.rainBands.visible) {
    nodes.rainBands.rotation.y = -elapsedSec * 0.34;
  }
  if (nodes.auroraNorth.visible) {
    const pulse = 0.94 + Math.sin(elapsedSec * 2.2) * 0.06;
    nodes.auroraNorth.scale.set(pulse, pulse, 1);
    nodes.auroraSouth.scale.set(pulse, pulse, 1);
    nodes.auroraNorth.rotation.z = elapsedSec * 0.45;
  }
}
