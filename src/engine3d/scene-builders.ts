import * as THREE from 'three';
import type { AtmosphereTier, DossierPinPacket } from '../contracts/render-bridge.schema.ts';
import {
  buildPlanetSectorMarkers,
  type PlanetSectorMarker,
} from './planet-markers.ts';
import {
  buildPlanetWeatherFx,
  type PlanetWeatherFxNodes,
} from './planet-weather-fx.ts';
import {
  buildOpenSkyPerimeterPylons,
  buildOrbitalStation,
  buildPlanetarySatellite,
  buildSkyRailShuttle,
} from './procedural-models.ts';
import {
  createAtmosphereHaloMaterial,
  createAtmosphereLimbMaterial,
  createCityGroundTexture,
  createCityHorizonBumpTexture,
  createCityHorizonTexture,
  createOpenSkyDomeMaterial,
  createPlanetCloudTexture,
  createPlanetSurfaceTextures,
} from './procedural-textures.ts';

/**
 * [L4] FUP-007 | SM-05 | SADT A5.3
 * Scene sub-assemblers for the 3 seamless Exo-World camera scales:
 * - Scale 1: Orbital System (PRESERVED VERBATIM per user feedback)
 * - Scale 2: High-detail Geodesic Exo-Planet (96x64 PBR continents/oceans/night-lights,
 *   swirling dual-depth cloud deck, Fresnel/limb atmosphere, twin satellites, flush astrometric beacons)
 * - Scale 3: Open-Sky Astralis Solarpunk Metropolis (radial master plaza, recessed canal moat,
 *   sky-rail viaduct, sculpted perimeter spires, horizon landscape + distant skyline, open sky dome)
 */
const DOSSIER_PIN_COLORS: Record<DossierPinPacket['dossierClass'], number> = {
  P0: 0xf43f5e,
  C1: 0xe879f9,
  C2: 0xf59e0b,
  C3: 0xf97316,
  C4: 0x10b981,
  C5: 0xa855f7,
};

export function createStarfield(): THREE.Points {
  const count = 1100;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const cool = new THREE.Color(0xdbeafe);
  const warm = new THREE.Color(0xfef3c7);
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const radius = 58 + (i % 17) * 1.4;
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    const c = i % 5 === 0 ? warm : cool;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.28,
    vertexColors: true,
    transparent: true,
    opacity: 0.84,
    sizeAttenuation: true,
  });
  return new THREE.Points(geo, mat);
}

export interface SpaceScaleNodes {
  readonly group: THREE.Group;
  readonly slotMeshes: THREE.Mesh[];
  readonly station: THREE.Group;
}

/**
 * Scale 1 (Vue Espace) — Kept 100% intact per user preference.
 */
export function buildSpaceScaleGroup(): SpaceScaleNodes {
  const group = new THREE.Group();
  const slotMeshes: THREE.Mesh[] = [];
  const slotRadii = [0, 7.2, 10.6, 14.0, 17.5, 21.0];
  const slotColors = [0x22d3ee, 0x94a3b8, 0xd97706, 0x67e8f9, 0xf97316, 0xa855f7];
  const slotSizes = [1.45, 0.52, 0.68, 0.62, 0.58, 0.72];

  // Subtle ambient orbital dust belt between Slot 4 and Slot 5
  const beltCount = 260;
  const beltPositions = new Float32Array(beltCount * 3);
  for (let i = 0; i < beltCount; i++) {
    const a = (i / beltCount) * Math.PI * 2;
    const jitterR = 15.3 + ((i * 37) % 19) * 0.08;
    const jitterY = (((i * 53) % 13) - 6) * 0.045;
    beltPositions[i * 3] = Math.cos(a) * jitterR;
    beltPositions[i * 3 + 1] = jitterY;
    beltPositions[i * 3 + 2] = Math.sin(a) * jitterR;
  }
  const beltGeo = new THREE.BufferGeometry();
  beltGeo.setAttribute('position', new THREE.BufferAttribute(beltPositions, 3));
  const beltPoints = new THREE.Points(
    beltGeo,
    new THREE.PointsMaterial({
      color: 0xfda4af,
      size: 0.14,
      transparent: true,
      opacity: 0.52,
      sizeAttenuation: true,
    }),
  );
  group.add(beltPoints);

  for (let i = 0; i < 6; i++) {
    const orbitR = slotRadii[i] ?? 0;
    const angle = i * 1.12;
    if (orbitR > 0) {
      const orbitRing = new THREE.Mesh(
        new THREE.TorusGeometry(orbitR, 0.032, 8, 112),
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0xfb7185 : 0xe879f9,
          transparent: true,
          opacity: 0.26,
        }),
      );
      orbitRing.rotation.x = Math.PI / 2;
      group.add(orbitRing);
    }

    const size = slotSizes[i] ?? 0.6;
    const planetColor = slotColors[i] ?? 0x94a3b8;
    const planetoid = new THREE.Mesh(
      new THREE.SphereGeometry(size, 32, 24),
      new THREE.MeshStandardMaterial({
        color: planetColor,
        roughness: i === 0 ? 0.42 : 0.52,
        metalness: 0.24,
      }),
    );
    const px = Math.cos(angle) * orbitR;
    const pz = Math.sin(angle) * orbitR;
    planetoid.position.set(px, 0, pz);
    planetoid.userData = { interactable: 'SLOT', slotIndex: i + 1 };
    group.add(planetoid);
    slotMeshes.push(planetoid);

    // Subtle atmospheric rim aura around Slot 1 (Novaterra) & Slot 6 (Exo-Monde)
    if (i === 0 || i === 5) {
      const aura = new THREE.Mesh(
        new THREE.SphereGeometry(size * 1.16, 24, 18),
        new THREE.MeshBasicMaterial({
          color: i === 0 ? 0xfb7185 : 0xe879f9,
          transparent: true,
          opacity: 0.16,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      aura.position.set(px, 0, pz);
      group.add(aura);
    }

    // Sleek planetary ring on Slot 5 (Ceinture) & Slot 3 (Mars orbital beacon ring)
    if (i === 4 || i === 2) {
      const pRing = new THREE.Mesh(
        new THREE.RingGeometry(size * 1.38, size * 1.85, 36),
        new THREE.MeshBasicMaterial({
          color: i === 4 ? 0xfdba74 : 0xfda4af,
          transparent: true,
          opacity: 0.34,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      pRing.position.set(px, 0, pz);
      pRing.rotation.x = Math.PI / 2 - 0.35;
      group.add(pRing);
    }
  }

  const station = buildOrbitalStation();
  station.position.set(3.2, 1.1, 2.2);
  group.add(station);

  return { group, slotMeshes, station };
}

export interface PlanetScaleNodes {
  readonly group: THREE.Group;
  readonly surfaceMesh: THREE.Mesh;
  readonly haloMesh: THREE.Mesh;
  readonly limbMesh: THREE.Mesh;
  readonly cloudsMesh: THREE.Mesh;
  readonly cirrusMesh: THREE.Mesh;
  readonly satellites: THREE.Group[];
  readonly tileMarkers: PlanetSectorMarker[];
  readonly pinGroup: THREE.Group;
  readonly tileDirections: THREE.Vector3[];
  readonly weatherFx: PlanetWeatherFxNodes;
}

export function buildPlanetScaleGroup(initialTier: AtmosphereTier): PlanetScaleNodes {
  const group = new THREE.Group();
  const radius = 3.2;

  // High-detail PBR Exo-Planet surface (96x64 smooth silhouette, albedo + bump + ocean specular + city lights)
  const { map, bumpMap, roughnessMap, emissiveMap } = createPlanetSurfaceTextures(initialTier);
  const surfaceMat = new THREE.MeshStandardMaterial({
    map,
    bumpMap,
    bumpScale: 0.34,
    roughnessMap,
    roughness: 1.0,
    metalness: 0.04,
    envMapIntensity: 0.42,
    emissive: new THREE.Color('#ffd3a8'),
    emissiveMap,
    emissiveIntensity: 0.68,
  });
  const surfaceMesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 64), surfaceMat);
  group.add(surfaceMesh);

  // Primary swirling procedural alpha cloud deck + subtle upper jetstream cirrus shell
  const cloudTex = createPlanetCloudTexture(initialTier);
  const cloudsMat = new THREE.MeshStandardMaterial({
    map: cloudTex,
    transparent: true,
    opacity: initialTier === 'P1' ? 0.52 : 0.88,
    roughness: 0.9,
    metalness: 0.0,
    depthWrite: false,
  });
  const cloudsMesh = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.022, 64, 48), cloudsMat);
  group.add(cloudsMesh);

  const cirrusMat = new THREE.MeshBasicMaterial({
    map: cloudTex,
    transparent: true,
    opacity: initialTier === 'P1' ? 0.16 : 0.24,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const cirrusMesh = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.036, 48, 36), cirrusMat);
  cirrusMesh.rotation.y = 1.4;
  cirrusMesh.rotation.z = 0.14;
  group.add(cirrusMesh);

  // Dual-layer atmosphere: inner Fresnel sheen + outer atmospheric limb halo
  const haloMat = createAtmosphereHaloMaterial(initialTier);
  const haloMesh = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.062, 64, 48), haloMat);
  group.add(haloMesh);

  const limbMat = createAtmosphereLimbMaterial(initialTier);
  const limbMesh = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.155, 64, 48), limbMat);
  group.add(limbMesh);

  // Calibrated Astralis Rose-Gold & Cyan Orbital Telemetry Arcs + Degree Ticks
  const eclipticRing = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 1.38, 0.011, 8, 128),
    new THREE.MeshBasicMaterial({ color: 0xfb7185, transparent: true, opacity: 0.34 }),
  );
  eclipticRing.rotation.x = Math.PI / 2 - 0.18;
  group.add(eclipticRing);

  const innerOrbitRing = new THREE.Mesh(
    new THREE.RingGeometry(radius * 1.19, radius * 1.202, 128),
    new THREE.MeshBasicMaterial({
      color: 0xfb7185,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  innerOrbitRing.rotation.x = Math.PI / 2 - 0.18;
  group.add(innerOrbitRing);

  const polarRing = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 1.25, 0.0075, 6, 96),
    new THREE.MeshBasicMaterial({ color: 0xe879f9, transparent: true, opacity: 0.2 }),
  );
  polarRing.rotation.y = Math.PI / 4;
  polarRing.rotation.x = 0.45;
  group.add(polarRing);

  // Twin orbiting telemetry satellites
  const sat1 = buildPlanetarySatellite(0xf43f5e);
  const sat2 = buildPlanetarySatellite(0xe879f9);
  group.add(sat1, sat2);

  // 72 sleek flush Astrometric Geodesic Reticle Beacons (replaces chunky hexagons)
  const { tileMarkers, tileDirections } = buildPlanetSectorMarkers(group, radius);

  const pinGroup = new THREE.Group();
  group.add(pinGroup);

  const weatherFx = buildPlanetWeatherFx(radius);
  group.add(weatherFx.group);

  return {
    group,
    surfaceMesh,
    haloMesh,
    limbMesh,
    cloudsMesh,
    cirrusMesh,
    satellites: [sat1, sat2],
    tileMarkers,
    pinGroup,
    tileDirections,
    weatherFx,
  };
}

export function rebuildDossierPins(
  nodes: PlanetScaleNodes,
  pins: DossierPinPacket[],
): void {
  while (nodes.pinGroup.children.length > 0) {
    const child = nodes.pinGroup.children[0];
    if (!child) break;
    nodes.pinGroup.remove(child);
    child.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) m.dispose();
      }
    });
  }

  const radius = 3.2;
  const up = new THREE.Vector3(0, 1, 0);

  for (const pin of pins) {
    const dir = nodes.tileDirections[pin.tileIndex];
    if (!dir) continue;
    const hex = DOSSIER_PIN_COLORS[pin.dossierClass];
    const isP0 = pin.dossierClass === 'P0';

    const pinNode = new THREE.Group();
    pinNode.position.copy(dir).multiplyScalar(radius + 0.03);
    pinNode.quaternion.setFromUnitVectors(up, dir);
    pinNode.userData = { interactable: 'DOSSIER_PIN', dossierId: pin.dossierId };

    const glowMat = new THREE.MeshStandardMaterial({
      color: hex,
      emissive: hex,
      emissiveIntensity: isP0 ? 1.15 : 0.88,
      roughness: 0.2,
      metalness: 0.45,
    });

    // Grounded light beam stem
    const stemH = isP0 ? 0.48 : 0.34;
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.024, stemH, 6),
      new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.72 }),
    );
    stem.position.y = stemH / 2;
    pinNode.add(stem);

    // Surface signal ring
    const baseRing = new THREE.Mesh(
      new THREE.TorusGeometry(isP0 ? 0.17 : 0.12, 0.016, 6, 20),
      glowMat,
    );
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = 0.02;
    pinNode.add(baseRing);

    // Floating crystalline dossier diamond
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(isP0 ? 0.16 : 0.115, 0),
      glowMat,
    );
    core.position.y = stemH + 0.12;
    core.name = 'pinCore';
    pinNode.add(core);

    nodes.pinGroup.add(pinNode);
  }
}

export interface CityScaleNodes {
  readonly group: THREE.Group;
  readonly groundMesh: THREE.Mesh;
  readonly horizonMesh: THREE.Mesh;
  readonly skyDomeMesh: THREE.Mesh;
  readonly districtsGroup: THREE.Group;
  readonly dronesGroup: THREE.Group;
  readonly shuttlesGroup: THREE.Group;
  readonly pedestriansGroup: THREE.Group;
  readonly wildlifeGroup: THREE.Group;
  readonly windRotors: readonly THREE.Group[];
}

function sampleTerrainHeight(x: number, z: number): number {
  const r = Math.hypot(x, z);
  if (r <= 8.2) return -0.04;
  // Smooth cubic hermite ramp from city basin (r=8.2) into rolling foothills (r=18+)
  const t = Math.min(1, (r - 8.2) / 11.5);
  const smooth = t * t * (3 - 2 * t);
  const farBoost = Math.min(1, Math.max(0, (r - 18) / 26));
  const rolling =
    Math.sin(x * 0.14 + 0.9) * Math.cos(z * 0.13 - 0.6) * 1.35 +
    Math.sin((x - z) * 0.09 + 1.4) * 0.95 +
    Math.cos(x * 0.26 + z * 0.22) * 0.42;
  const ridgeLift = Math.max(-0.22, rolling + 0.55) * (0.75 + farBoost * 1.45);
  return -0.04 + ridgeLift * smooth;
}

export function buildCityScaleGroup(initialTier: AtmosphereTier): CityScaleNodes {
  const group = new THREE.Group();

  // 1. Open-Sky Hemisphere Gradient Dome
  const skyDomeMat = createOpenSkyDomeMaterial(true, initialTier);
  const skyDomeMesh = new THREE.Mesh(new THREE.SphereGeometry(72, 32, 20), skyDomeMat);
  group.add(skyDomeMesh);

  // 2. Seamless Continuous Planetary Terrain Heightfield (ZERO plateau step or seam)
  const horizonGeo = new THREE.PlaneGeometry(132, 132, 56, 56);
  horizonGeo.rotateX(-Math.PI / 2);
  const posAttr = horizonGeo.attributes.position;
  if (posAttr) {
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      posAttr.setY(i, sampleTerrainHeight(x, z));
    }
  }
  horizonGeo.computeVertexNormals();

  const horizonTex = createCityHorizonTexture(initialTier);
  const horizonBump = createCityHorizonBumpTexture();
  const horizonMat = new THREE.MeshStandardMaterial({
    map: horizonTex,
    bumpMap: horizonBump,
    bumpScale: 0.18,
    roughness: 0.9,
    metalness: 0.03,
  });
  const horizonMesh = new THREE.Mesh(horizonGeo, horizonMat);
  horizonMesh.receiveShadow = true;
  group.add(horizonMesh);

  // 3. Flush Feathered City Plaza (blends seamlessly into the surrounding natural landscape)
  const groundTex = createCityGroundTexture(initialTier);
  const groundMat = new THREE.MeshStandardMaterial({
    map: groundTex,
    roughness: 0.72,
    metalness: 0.08,
    transparent: true,
    depthWrite: false,
  });
  const groundMesh = new THREE.Mesh(new THREE.CircleGeometry(10.2, 64), groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = -0.015;
  groundMesh.receiveShadow = true;
  group.add(groundMesh);

  // 4. Refined Architectural Transit Ring & Subtle Light Piers
  const curbMat = new THREE.MeshStandardMaterial({
    color: 0xf8eef3,
    roughness: 0.38,
    metalness: 0.35,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xfb7185,
    emissive: 0xe11d48,
    emissiveIntensity: 0.38,
    roughness: 0.4,
    metalness: 0.25,
  });

  const viaductRadius = 6.2;
  const viaductTrack = new THREE.Mesh(
    new THREE.TorusGeometry(viaductRadius, 0.075, 8, 64),
    curbMat,
  );
  viaductTrack.rotation.x = Math.PI / 2;
  viaductTrack.position.y = 0.68;
  group.add(viaductTrack);

  const viaductGlow = new THREE.Mesh(
    new THREE.TorusGeometry(viaductRadius, 0.022, 6, 64),
    accentMat,
  );
  viaductGlow.rotation.x = Math.PI / 2;
  viaductGlow.position.y = 0.75;
  group.add(viaductGlow);

  const pierGeo = new THREE.CylinderGeometry(0.055, 0.085, 0.68, 6);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const pier = new THREE.Mesh(pierGeo, curbMat);
    pier.position.set(Math.cos(a) * viaductRadius, 0.34, Math.sin(a) * viaductRadius);
    group.add(pier);
  }

  // 4b. Dual Maglev — Outer Military & Industrial Freight Line (Amber/Gold, r = 8.4, y = 1.05)
  const freightRadius = 8.4;
  const freightAccentMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.45,
    roughness: 0.38,
    metalness: 0.42,
  });
  const freightTrack = new THREE.Mesh(
    new THREE.TorusGeometry(freightRadius, 0.068, 8, 72),
    curbMat,
  );
  freightTrack.rotation.x = Math.PI / 2;
  freightTrack.position.y = 1.05;
  group.add(freightTrack);

  const freightGlow = new THREE.Mesh(
    new THREE.TorusGeometry(freightRadius, 0.022, 6, 72),
    freightAccentMat,
  );
  freightGlow.rotation.x = Math.PI / 2;
  freightGlow.position.y = 1.12;
  group.add(freightGlow);

  // 4c. 24-Hex Expandable City Footprint Pads (8 inner + 16 outer hex slots)
  const hexPadGeo = new THREE.CylinderGeometry(0.82, 0.86, 0.04, 6);
  const hexPadMat = new THREE.MeshStandardMaterial({
    color: 0xfce7f3,
    roughness: 0.65,
    metalness: 0.15,
    transparent: true,
    opacity: 0.42,
  });
  for (let i = 0; i < 24; i++) {
    const isInner = i < 8;
    const count = isInner ? 8 : 16;
    const idx = isInner ? i : i - 8;
    const rad = isInner ? 3.55 : 7.25;
    const ang = (idx / count) * Math.PI * 2 + (isInner ? 0.2 : 0.1);
    const pad = new THREE.Mesh(hexPadGeo, hexPadMat);
    pad.position.set(Math.cos(ang) * rad, 0.01, Math.sin(ang) * rad);
    pad.rotation.y = ang;
    group.add(pad);
  }

  // 5. Open-Sky Perimeter Beacons (subtle, airy framing)
  group.add(buildOpenSkyPerimeterPylons(7.85));

  // 6. Living Flora (Trees, Cypresses & Garden Shrubs bridging City -> Countryside)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7c5c48, roughness: 0.9 });
  const leafMats = [
    new THREE.MeshStandardMaterial({ color: 0x2d8a64, roughness: 0.78 }),
    new THREE.MeshStandardMaterial({ color: 0x4ca678, roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: 0x67b37e, roughness: 0.72 }),
  ];
  const flowerMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    emissive: 0xbe185d,
    emissiveIntensity: 0.14,
    roughness: 0.65,
  });

  const trunkGeo = new THREE.CylinderGeometry(0.05, 0.085, 0.42, 6);
  const canopyGeo = new THREE.DodecahedronGeometry(0.32, 1);
  const cypressGeo = new THREE.ConeGeometry(0.18, 0.85, 7);
  const shrubGeo = new THREE.DodecahedronGeometry(0.18, 0);

  const floraSpecs: readonly { angle: number; radius: number; scale: number; kind: 'TREE' | 'CYPRESS' | 'SHRUB' }[] = [
    // Inner park ring & avenue borders (r = 5.4..8.6)
    ...Array.from({ length: 18 }, (_, i) => ({
      angle: (i / 18) * Math.PI * 2 + 0.17,
      radius: 7.0 + (i % 3) * 0.72,
      scale: 0.85 + (i % 3) * 0.18,
      kind: (i % 3 === 0 ? 'CYPRESS' : i % 4 === 1 ? 'SHRUB' : 'TREE') as 'TREE' | 'CYPRESS' | 'SHRUB',
    })),
    // Transition groves dissolving the city edge (r = 9.0..14.8)
    ...Array.from({ length: 28 }, (_, i) => ({
      angle: (i / 28) * Math.PI * 2 + (i % 2) * 0.08,
      radius: 9.2 + (i % 5) * 1.35,
      scale: 0.9 + (i % 4) * 0.24,
      kind: (i % 5 === 0 ? 'SHRUB' : i % 3 === 0 ? 'CYPRESS' : 'TREE') as 'TREE' | 'CYPRESS' | 'SHRUB',
    })),
    // Distant hillside woodland clusters (r = 16..26)
    ...Array.from({ length: 22 }, (_, i) => ({
      angle: (i / 22) * Math.PI * 2 + 0.25,
      radius: 16.5 + (i % 4) * 2.5,
      scale: 1.15 + (i % 3) * 0.3,
      kind: (i % 2 === 0 ? 'TREE' : 'CYPRESS') as 'TREE' | 'CYPRESS' | 'SHRUB',
    })),
  ];

  floraSpecs.forEach((item, idx) => {
    const x = Math.cos(item.angle) * item.radius;
    const z = Math.sin(item.angle) * item.radius;
    const y = sampleTerrainHeight(x, z);
    const leafMat = leafMats[idx % leafMats.length]!;

    if (item.kind === 'SHRUB') {
      const bush = new THREE.Mesh(shrubGeo, leafMat);
      bush.scale.set(item.scale * 1.2, item.scale * 0.75, item.scale * 1.1);
      bush.position.set(x, y + 0.1 * item.scale, z);
      group.add(bush);
      if (idx % 2 === 0) {
        const bloom = new THREE.Mesh(shrubGeo, flowerMat);
        bloom.scale.setScalar(item.scale * 0.36);
        bloom.position.set(x + 0.08, y + 0.2 * item.scale, z + 0.05);
        group.add(bloom);
      }
    } else if (item.kind === 'CYPRESS') {
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.scale.setScalar(item.scale * 0.8);
      trunk.position.set(x, y + 0.16 * item.scale, z);
      const cone = new THREE.Mesh(cypressGeo, leafMat);
      cone.scale.setScalar(item.scale);
      cone.position.set(x, y + 0.62 * item.scale, z);
      group.add(trunk, cone);
    } else {
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.scale.setScalar(item.scale);
      trunk.position.set(x, y + 0.2 * item.scale, z);
      const crown1 = new THREE.Mesh(canopyGeo, leafMat);
      crown1.scale.set(item.scale * 1.05, item.scale * 0.9, item.scale * 1.05);
      crown1.position.set(x, y + 0.56 * item.scale, z);
      const crown2 = new THREE.Mesh(canopyGeo, leafMats[(idx + 1) % leafMats.length]!);
      crown2.scale.setScalar(item.scale * 0.68);
      crown2.position.set(x + 0.16 * item.scale, y + 0.7 * item.scale, z - 0.12 * item.scale);
      group.add(trunk, crown1, crown2);
    }
  });

  // 7. Natural Relief Decor: Sculpted Rocks, Outcrops, Ponds, Streetlamps & Distant Wind Turbines
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x9b8b86,
    roughness: 0.92,
    metalness: 0.06,
  });
  const rockGeo = new THREE.DodecahedronGeometry(0.55, 0);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 + 0.31;
    const dist = 10.6 + (i % 5) * 3.4;
    const rx = Math.cos(a) * dist;
    const rz = Math.sin(a) * dist;
    const ry = sampleTerrainHeight(rx, rz);
    const rock = new THREE.Mesh(rockGeo, rockMat);
    const sx = 0.7 + (i % 3) * 0.55;
    const sy = 0.35 + (i % 4) * 0.25;
    const sz = 0.65 + ((i + 1) % 3) * 0.5;
    rock.scale.set(sx, sy, sz);
    rock.rotation.set((i % 3) * 0.3, a, (i % 2) * 0.2);
    rock.position.set(rx, ry + sy * 0.22, rz);
    group.add(rock);
  }

  // Natural reflective park ponds in outer gardens
  const pondMat = new THREE.MeshStandardMaterial({
    color: 0x14b8a6,
    emissive: 0x0f766e,
    emissiveIntensity: 0.16,
    roughness: 0.15,
    metalness: 0.38,
  });
  const pondGeo = new THREE.CircleGeometry(1.15, 20);
  for (let i = 0; i < 3; i++) {
    const a = i * ((Math.PI * 2) / 3) + 0.65;
    const px = Math.cos(a) * 10.2;
    const pz = Math.sin(a) * 10.2;
    const py = sampleTerrainHeight(px, pz);
    const pond = new THREE.Mesh(pondGeo, pondMat);
    pond.rotation.x = -Math.PI / 2;
    pond.scale.set(1.25, 0.85, 1);
    pond.position.set(px, py + 0.03, pz);
    group.add(pond);
  }

  // Warm avenue streetlamps along urban promenade
  const poleGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.52, 5);
  const bulbGeo = new THREE.SphereGeometry(0.055, 6, 6);
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.85,
  });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.19;
    const lx = Math.cos(a) * 4.55;
    const lz = Math.sin(a) * 4.55;
    const pole = new THREE.Mesh(poleGeo, curbMat);
    pole.position.set(lx, 0.24, lz);
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(lx, 0.52, lz);
    group.add(pole, bulb);
  }

  // Distant hillside eco wind turbines (animated rotors!) & low rural pavilions
  const windRotors: THREE.Group[] = [];
  const mastGeo = new THREE.CylinderGeometry(0.05, 0.11, 2.5, 8);
  const bladeGeo = new THREE.BoxGeometry(0.07, 0.95, 0.02);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.52;
    const dist = 19.5 + (i % 2) * 5.2;
    const tx = Math.cos(a) * dist;
    const tz = Math.sin(a) * dist;
    const ty = sampleTerrainHeight(tx, tz);

    const mast = new THREE.Mesh(mastGeo, curbMat);
    mast.position.set(tx, ty + 1.2, tz);
    group.add(mast);

    const rotor = new THREE.Group();
    rotor.position.set(tx, ty + 2.42, tz);
    rotor.rotation.y = -a + Math.PI / 2;
    for (let b = 0; b < 3; b++) {
      const bladeWrap = new THREE.Group();
      bladeWrap.rotation.z = (b * Math.PI * 2) / 3;
      const blade = new THREE.Mesh(bladeGeo, curbMat);
      blade.position.y = 0.48;
      bladeWrap.add(blade);
      rotor.add(bladeWrap);
    }
    group.add(rotor);
    windRotors.push(rotor);
  }

  // Subtle low countryside cottages/greenhouses nestled smoothly in the foothills
  const cottageMat = new THREE.MeshStandardMaterial({ color: 0xf1e7ec, roughness: 0.65 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3b8f72, roughness: 0.55 });
  const cottageGeo = new THREE.BoxGeometry(0.95, 0.42, 0.68);
  const roofGeo = new THREE.ConeGeometry(0.76, 0.28, 4);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.28;
    const dist = 12.6 + (i % 3) * 2.2;
    const hx = Math.cos(a) * dist;
    const hz = Math.sin(a) * dist;
    const hy = sampleTerrainHeight(hx, hz);
    const house = new THREE.Mesh(cottageGeo, cottageMat);
    house.position.set(hx, hy + 0.18, hz);
    house.rotation.y = -a;
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(hx, hy + 0.51, hz);
    roof.rotation.y = -a + Math.PI / 4;
    group.add(house, roof);
  }

  // 8. Living Fauna — Flocks of Soaring Birds circling above parks & hills
  const wildlifeGroup = new THREE.Group();
  const birdMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfce7f3,
    emissiveIntensity: 0.25,
    roughness: 0.5,
  });
  const wingGeo = new THREE.BoxGeometry(0.24, 0.02, 0.08);
  for (let i = 0; i < 10; i++) {
    const bird = new THREE.Group();
    const leftWing = new THREE.Mesh(wingGeo, birdMat);
    leftWing.position.set(-0.11, 0, 0);
    leftWing.name = 'leftWing';
    const rightWing = new THREE.Mesh(wingGeo, birdMat);
    rightWing.position.set(0.11, 0, 0);
    rightWing.name = 'rightWing';
    bird.add(leftWing, rightWing);
    bird.userData = {
      orbitPhase: (i / 10) * Math.PI * 2 + (i % 3) * 0.25,
      orbitR: 5.5 + (i % 4) * 2.4,
      orbitY: 2.9 + (i % 3) * 0.85,
      speed: 0.26 + (i % 3) * 0.07,
    };
    wildlifeGroup.add(bird);
  }
  group.add(wildlifeGroup);

  // 9. Living Transit — Dual Maglev (3 Civil Rose/Emerald + 2 Military Freight Amber Shuttles)
  const shuttlesGroup = new THREE.Group();
  const shuttleAccents = [0xf43f5e, 0x10b981, 0xfb7185];
  for (let i = 0; i < 3; i++) {
    const shuttle = buildSkyRailShuttle(shuttleAccents[i] ?? 0xf43f5e);
    shuttle.userData = {
      orbitPhase: (i / 3) * Math.PI * 2,
      orbitR: viaductRadius,
      orbitY: 0.74,
      speed: 0.36 + i * 0.04,
      lineType: 'CIVIL',
    };
    shuttlesGroup.add(shuttle);
  }
  for (let i = 0; i < 2; i++) {
    const freight = buildSkyRailShuttle(0xf59e0b);
    freight.scale.set(1.25, 1.12, 1.35);
    freight.userData = {
      orbitPhase: i * Math.PI + 0.4,
      orbitR: freightRadius,
      orbitY: 1.12,
      speed: -(0.24 + i * 0.03),
      lineType: 'MILITARY_FREIGHT',
    };
    shuttlesGroup.add(freight);
  }
  group.add(shuttlesGroup);

  // 10. OpenRW-style Citizen Waypoint Walkers strolling along urban promenades
  const pedestriansGroup = new THREE.Group();
  const walkerGeo = new THREE.CapsuleGeometry(0.055, 0.14, 4, 6);
  const walkerMats = [
    new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xbe123c, emissiveIntensity: 0.25 }),
    new THREE.MeshStandardMaterial({ color: 0x14b8a6, emissive: 0x0f766e, emissiveIntensity: 0.25 }),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 0.25 }),
  ];
  for (let i = 0; i < 18; i++) {
    const walker = new THREE.Mesh(walkerGeo, walkerMats[i % walkerMats.length]!);
    const ringR = i % 3 === 0 ? 3.85 : i % 3 === 1 ? 5.05 : 7.15;
    walker.userData = {
      orbitPhase: (i / 18) * Math.PI * 2,
      orbitR: ringR,
      speed: (i % 2 === 0 ? 1 : -1) * (0.14 + (i % 4) * 0.035),
    };
    pedestriansGroup.add(walker);
  }
  group.add(pedestriansGroup);

  const districtsGroup = new THREE.Group();
  const dronesGroup = new THREE.Group();
  group.add(districtsGroup, dronesGroup);

  return {
    group,
    groundMesh,
    horizonMesh,
    skyDomeMesh,
    districtsGroup,
    dronesGroup,
    shuttlesGroup,
    pedestriansGroup,
    wildlifeGroup,
    windRotors,
  };
}
