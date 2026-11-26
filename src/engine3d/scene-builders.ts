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
  buildCityLifeActors,
  buildCityUrbanProps,
} from './city-life.ts';
import {
  buildOpenSkyPerimeterPylons,
  buildOrbitalStation,
  buildPlanetarySatellite,
} from './procedural-models.ts';
import {
  createAtmosphereHaloMaterial,
  createAtmosphereLimbMaterial,
  createCityGroundTexture,
  createCityHorizonBumpTexture,
  createCityHorizonTexture,
  createHexPadPbrTextures,
  createMaglevRailEmissiveTexture,
  createOpenSkyDomeMaterial,
  createParticleGlowTexture,
  createPlanetCloudTexture,
  createPlanetSurfaceTextures,
  createWaterRippleNormalMap,
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
    map: createParticleGlowTexture(),
    size: 0.36,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    alphaTest: 0.03,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  return new THREE.Points(geo, mat);
}

export interface SpaceScaleNodes {
  readonly group: THREE.Group;
  readonly slotMeshes: THREE.Mesh[];
  readonly station: THREE.Group;
  readonly beltPoints: THREE.Points;
  readonly tradeShuttles: THREE.Group[];
}

/**
 * Scale 1 (Vue Espace) — Preserves iconic orbital silhouette while adding live trade shuttles.
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

  // Subtle animated orbital trade shuttles gliding between unlocked planetary orbits
  const tradeShuttles: THREE.Group[] = [];
  const shuttleHullMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.28,
    metalness: 0.72,
  });
  const shuttleGlowMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.9,
  });
  const shuttleHullGeo = new THREE.ConeGeometry(0.09, 0.34, 6);
  shuttleHullGeo.rotateX(Math.PI / 2);
  const shuttleTrailGeo = new THREE.ConeGeometry(0.055, 0.38, 6);
  shuttleTrailGeo.rotateX(-Math.PI / 2);

  const shuttleConfigs: readonly { r: number; speed: number; phase: number; yAmp: number }[] = [
    { r: 7.2, speed: 0.36, phase: 0.4, yAmp: 0.35 },
    { r: 10.6, speed: -0.25, phase: 2.1, yAmp: 0.48 },
    { r: 14.0, speed: 0.19, phase: 4.0, yAmp: 0.55 },
    { r: 17.5, speed: -0.15, phase: 5.2, yAmp: 0.62 },
  ];
  for (const cfg of shuttleConfigs) {
    const sh = new THREE.Group();
    const hull = new THREE.Mesh(shuttleHullGeo, shuttleHullMat);
    const trail = new THREE.Mesh(shuttleTrailGeo, shuttleGlowMat);
    trail.position.z = -0.32;
    sh.add(hull, trail);
    sh.userData = { orbitR: cfg.r, speed: cfg.speed, phase: cfg.phase, yAmp: cfg.yAmp };
    group.add(sh);
    tradeShuttles.push(sh);
  }

  return { group, slotMeshes, station, beltPoints, tradeShuttles };
}

export interface PlanetScaleNodes {
  readonly group: THREE.Group;
  readonly surfaceMesh: THREE.Mesh;
  readonly haloMesh: THREE.Mesh;
  readonly limbMesh: THREE.Mesh;
  readonly cloudsMesh: THREE.Mesh;
  readonly cirrusMesh: THREE.Mesh;
  readonly eclipticRing: THREE.Mesh;
  readonly polarRing: THREE.Mesh;
  readonly orbitalBeacons: THREE.Mesh[];
  readonly satellites: THREE.Group[];
  readonly tileMarkers: PlanetSectorMarker[];
  readonly pinGroup: THREE.Group;
  readonly tileDirections: THREE.Vector3[];
  readonly weatherFx: PlanetWeatherFxNodes;
}

export function buildPlanetScaleGroup(initialTier: AtmosphereTier): PlanetScaleNodes {
  const group = new THREE.Group();
  const radius = 3.2;

  // High-detail PBR Exo-Planet surface (96x64 smooth silhouette, albedo + normal + bump + ocean specular + night-terminator city lights)
  const { map, normalMap, bumpMap, roughnessMap, emissiveMap } = createPlanetSurfaceTextures(initialTier);
  const nightUniforms = {
    uSunDir: { value: new THREE.Vector3(17, 9, 11).normalize() },
  };
  const surfaceMat = new THREE.MeshStandardMaterial({
    map,
    normalMap,
    normalScale: new THREE.Vector2(1.05, 1.05),
    bumpMap,
    bumpScale: 0.2,
    roughnessMap,
    roughness: 1.0,
    metalness: 0.08,
    envMapIntensity: 0.64,
    emissive: new THREE.Color('#ffcf96'),
    emissiveMap,
    emissiveIntensity: 1.38,
  });
  surfaceMat.userData.nightUniforms = nightUniforms;
  surfaceMat.onBeforeCompile = (shader) => {
    shader.uniforms.uSunDir = nightUniforms.uSunDir;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vExoWorldNormal;',
      )
      .replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\nvExoWorldNormal = normalize(mat3(modelMatrix) * objectNormal);',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform vec3 uSunDir;\nvarying vec3 vExoWorldNormal;',
      )
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\nfloat exoNightFactor = smoothstep(0.16, -0.26, dot(normalize(vExoWorldNormal), normalize(uSunDir)));\ntotalEmissiveRadiance *= exoNightFactor;',
      );
  };
  const surfaceMesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 64), surfaceMat);
  group.add(surfaceMesh);

  // Primary swirling procedural alpha cloud deck + subtle upper jetstream cirrus shell (zero z-fighting)
  const cloudTex = createPlanetCloudTexture(initialTier);
  const cloudsMat = new THREE.MeshStandardMaterial({
    map: cloudTex,
    transparent: true,
    opacity: initialTier === 'P1' ? 0.52 : 0.88,
    roughness: 0.9,
    metalness: 0.0,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const cloudsMesh = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.024, 64, 48), cloudsMat);
  group.add(cloudsMesh);

  const cirrusMat = new THREE.MeshBasicMaterial({
    map: cloudTex,
    transparent: true,
    opacity: initialTier === 'P1' ? 0.16 : 0.24,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
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

  // Twin orbiting telemetry satellites + 3 luminous orbital relay pulse beacons
  const sat1 = buildPlanetarySatellite(0xf43f5e);
  const sat2 = buildPlanetarySatellite(0xe879f9);
  group.add(sat1, sat2);

  const orbitalBeacons: THREE.Mesh[] = [];
  const beaconGeo = new THREE.OctahedronGeometry(0.065, 0);
  const beaconColors = [0x38bdf8, 0xfb7185, 0x34d399];
  for (let i = 0; i < 3; i++) {
    const beacon = new THREE.Mesh(
      beaconGeo,
      new THREE.MeshBasicMaterial({
        color: beaconColors[i] ?? 0x38bdf8,
        transparent: true,
        opacity: 0.9,
      }),
    );
    beacon.userData = {
      orbitR: radius * (1.26 + i * 0.06),
      speed: (i % 2 === 0 ? 1 : -1) * (0.48 + i * 0.14),
      phase: i * 2.1,
      tilt: i === 1 ? 0.55 : -0.22,
    };
    group.add(beacon);
    orbitalBeacons.push(beacon);
  }

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
    eclipticRing,
    polarRing,
    orbitalBeacons,
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
  readonly waterBayMesh: THREE.Mesh;
  readonly horizonMesh: THREE.Mesh;
  readonly skyDomeMesh: THREE.Mesh;
  readonly districtsGroup: THREE.Group;
  readonly dronesGroup: THREE.Group;
  readonly shuttlesGroup: THREE.Group;
  readonly pedestriansGroup: THREE.Group;
  readonly wildlifeGroup: THREE.Group;
  readonly vesselsGroup: THREE.Group;
  readonly cloudLayer: THREE.Group;
  readonly windRotors: readonly THREE.Group[];
  readonly civilRailTex: THREE.CanvasTexture;
  readonly freightRailTex: THREE.CanvasTexture;
  readonly pondNormalMap: THREE.CanvasTexture;
  readonly streetlampMat: THREE.MeshStandardMaterial;
  readonly atmoMotes: THREE.Points;
  readonly harborBuoys: readonly THREE.Group[];
}

function sampleTerrainHeight(x: number, z: number): number {
  const maxAbs = Math.max(Math.abs(x), Math.abs(z));
  // Smooth coastal harbor basin in SE quadrant (+x, +z)
  if (x + z > 7.8 && maxAbs > 6.5) {
    const depth = Math.min(1, (x + z - 7.8) / 14);
    return -0.05 - depth * 0.45;
  }
  if (maxAbs <= 8.4) return -0.04;
  const t = Math.min(1, (maxAbs - 8.4) / 11.5);
  const smooth = t * t * (3 - 2 * t);
  const farBoost = Math.min(1, Math.max(0, (maxAbs - 18) / 26));
  const rolling =
    Math.sin(x * 0.14 + 0.9) * Math.cos(z * 0.13 - 0.6) * 1.35 +
    Math.sin((x - z) * 0.09 + 1.4) * 0.95 +
    Math.cos(x * 0.26 + z * 0.22) * 0.42;
  const ridgeLift = Math.max(-0.22, rolling + 0.55) * (0.75 + farBoost * 1.45);
  return -0.04 + ridgeLift * smooth;
}

export function buildCityScaleGroup(
  initialTier: AtmosphereTier,
  biomeProfile?: import('../contracts/render-bridge.schema.ts').PlanetBiomeProfile,
  hasOcean = true,
): CityScaleNodes {
  const group = new THREE.Group();

  // 1. Open-Sky Hemisphere Gradient Dome
  const skyDomeMat = createOpenSkyDomeMaterial(true, initialTier);
  const skyDomeMesh = new THREE.Mesh(new THREE.SphereGeometry(72, 32, 20), skyDomeMat);
  group.add(skyDomeMesh);

  // 2. Seamless Continuous Planetary Terrain Heightfield
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

  const horizonTex = createCityHorizonTexture(initialTier, biomeProfile);
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

  // 3. Non-Circular Coastal Waterfront City Ground (Orthogonal Avenues + Canal + SE Bay)
  const groundTex = createCityGroundTexture(initialTier, biomeProfile);
  const groundMat = new THREE.MeshStandardMaterial({
    map: groundTex,
    roughness: 0.72,
    metalness: 0.08,
    transparent: true,
    depthWrite: false,
  });
  const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(21.5, 21.5), groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = -0.015;
  groundMesh.receiveShadow = true;
  group.add(groundMesh);

  // 3b. SE Coastal Bay Specular Ocean Sheet
  const pondNormalMap = createWaterRippleNormalMap();
  const bayMat = new THREE.MeshPhysicalMaterial({
    color: 0x0284c7,
    emissive: 0x075985,
    emissiveIntensity: 0.22,
    roughness: 0.08,
    metalness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    ior: 1.333,
    normalMap: pondNormalMap,
    normalScale: new THREE.Vector2(0.55, 0.55),
    envMapIntensity: 1.4,
    transparent: true,
    opacity: 0.88,
  });
  const waterBayMesh = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), bayMat);
  waterBayMesh.rotation.x = -Math.PI / 2;
  waterBayMesh.position.set(17.5, -0.028, 17.5);
  waterBayMesh.visible = hasOcean;
  group.add(waterBayMesh);

  // 4. Organic Curving Maglev Transit Viaduct & Arched River Bridges (Neither circular nor rectilinear)
  const curbMat = new THREE.MeshStandardMaterial({
    color: 0x3b475c,
    roughness: 0.28,
    metalness: 0.72,
    envMapIntensity: 1.25,
  });
  const civilRailTex = createMaglevRailEmissiveTexture('#00f0ff');
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0xffffff,
    emissiveMap: civilRailTex,
    emissiveIntensity: 1.15,
    roughness: 0.26,
    metalness: 0.45,
  });

  // Sweeping S-curved elevated civil sky-rail gliding along the hillside contour
  const civilCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-10.2, 0.72, -4.4),
    new THREE.Vector3(-5.2, 0.78, -5.8),
    new THREE.Vector3(-0.4, 0.72, -4.9),
    new THREE.Vector3(4.8, 0.76, -6.1),
    new THREE.Vector3(10.2, 0.72, -4.7),
  ]);
  const viaductTrack = new THREE.Mesh(new THREE.TubeGeometry(civilCurve, 44, 0.14, 8, false), curbMat);
  viaductTrack.scale.set(1, 0.55, 1.15);
  viaductTrack.castShadow = true;
  viaductTrack.receiveShadow = true;
  group.add(viaductTrack);

  const viaductGlow = new THREE.Mesh(new THREE.TubeGeometry(civilCurve, 44, 0.045, 6, false), accentMat);
  viaductGlow.position.y = 0.09;
  group.add(viaductGlow);

  const pierGeo = new THREE.CylinderGeometry(0.08, 0.13, 0.76, 8);
  for (let i = 0; i <= 6; i++) {
    const pt = civilCurve.getPoint(i / 6);
    const pier = new THREE.Mesh(pierGeo, curbMat);
    pier.position.set(pt.x, pt.y * 0.5, pt.z);
    pier.castShadow = true;
    pier.receiveShadow = true;
    group.add(pier);
  }

  // Gently curving hillside freight connector on western ridge
  const freightRailTex = createMaglevRailEmissiveTexture('#ffb800');
  const freightAccentMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xffffff,
    emissiveMap: freightRailTex,
    emissiveIntensity: 1.12,
    roughness: 0.26,
    metalness: 0.5,
  });
  const freightCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-6.2, 1.05, -9.2),
    new THREE.Vector3(-5.4, 1.08, -3.5),
    new THREE.Vector3(-6.5, 1.04, 2.6),
    new THREE.Vector3(-5.3, 1.02, 8.8),
  ]);
  const freightTrack = new THREE.Mesh(new THREE.TubeGeometry(freightCurve, 36, 0.14, 8, false), curbMat);
  freightTrack.scale.set(1.1, 0.55, 1);
  freightTrack.castShadow = true;
  freightTrack.receiveShadow = true;
  group.add(freightTrack);

  const freightGlow = new THREE.Mesh(new THREE.TubeGeometry(freightCurve, 36, 0.042, 6, false), freightAccentMat);
  freightGlow.position.y = 0.09;
  group.add(freightGlow);

  const freightPierGeo = new THREE.CylinderGeometry(0.09, 0.14, 1.06, 8);
  for (let i = 0; i <= 5; i++) {
    const pt = freightCurve.getPoint(i / 5);
    const pier = new THREE.Mesh(freightPierGeo, curbMat);
    pier.position.set(pt.x, pt.y * 0.5, pt.z);
    pier.castShadow = true;
    pier.receiveShadow = true;
    group.add(pier);
  }

  // 4b. Arched Architectural Bridges Crossing the Meandering River Canal + Coastal Harbor Piers
  const bridgeStoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.58, metalness: 0.28 });
  const bridgePositions: readonly { x: number; z: number; rotY: number }[] = [
    { x: -3.2, z: 3.1, rotY: 0.16 },
    { x: 0.6, z: 4.35, rotY: -0.22 },
  ];
  for (const bp of bridgePositions) {
    const bridgeGroup = new THREE.Group();
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.08, 1.65), bridgeStoneMat);
    deck.position.y = 0.18;
    deck.castShadow = true;
    deck.receiveShadow = true;
    const archL = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.04, 6, 18, Math.PI), curbMat);
    archL.position.set(-0.36, 0.16, 0);
    archL.rotation.y = Math.PI / 2;
    const archR = archL.clone();
    archR.position.x = 0.36;
    bridgeGroup.add(deck, archL, archR);
    bridgeGroup.position.set(bp.x, 0, bp.z);
    bridgeGroup.rotation.y = bp.rotY;
    group.add(bridgeGroup);
  }

  // Coastal harbor piers jutting naturally into the SE bay
  const pierDeckMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.62, metalness: 0.32 });
  for (const [px, pz, rot] of [[4.7, 5.2, -0.58], [6.1, 3.8, -0.42]] as const) {
    const harborPier = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 2.35), pierDeckMat);
    harborPier.position.set(px, 0.05, pz);
    harborPier.rotation.y = rot;
    harborPier.receiveShadow = true;
    group.add(harborPier);
  }

  // 4c. Realistic Organic Urban Infill Fabric (Terraced mid-rise neighborhood blocks along natural topography)
  const infillPalettes = [
    new THREE.MeshStandardMaterial({ color: 0xd6cfc7, roughness: 0.64, metalness: 0.12 }), // Warm limestone
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.42, metalness: 0.48 }), // Slate glass
    new THREE.MeshStandardMaterial({ color: 0xb8a394, roughness: 0.68, metalness: 0.1 }),  // Terracotta stone
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.32, metalness: 0.62 }), // Obsidian solar glass
  ];
  const roofGardenMat = new THREE.MeshStandardMaterial({ color: 0x2a7a56, roughness: 0.82, metalness: 0.04 });
  const solarRoofMat = new THREE.MeshStandardMaterial({
    color: 0x0f2942,
    emissive: 0x0284c7,
    emissiveIntensity: 0.18,
    roughness: 0.22,
    metalness: 0.78,
  });

  const organicBlocks: readonly { x: number; z: number; w: number; d: number; h: number; rot: number; style: number }[] = [
    { x: -7.1, z: -2.4, w: 0.95, d: 0.68, h: 0.75, rot: 0.18, style: 0 },
    { x: -6.8, z: -0.9, w: 0.72, d: 1.05, h: 1.05, rot: -0.14, style: 1 },
    { x: -7.3, z: 1.1, w: 0.88, d: 0.74, h: 0.62, rot: 0.24, style: 2 },
    { x: -4.4, z: -6.9, w: 1.1, d: 0.66, h: 0.82, rot: -0.22, style: 3 },
    { x: -2.5, z: -7.1, w: 0.78, d: 0.92, h: 1.18, rot: 0.12, style: 0 },
    { x: -0.2, z: -6.8, w: 1.05, d: 0.7, h: 0.72, rot: -0.18, style: 1 },
    { x: 2.2, z: -7.2, w: 0.84, d: 0.88, h: 0.96, rot: 0.26, style: 2 },
    { x: 4.9, z: -6.9, w: 0.96, d: 0.68, h: 0.68, rot: -0.15, style: 0 },
    { x: 6.9, z: -4.2, w: 0.74, d: 1.08, h: 1.12, rot: 0.21, style: 3 },
    { x: 7.3, z: -2.1, w: 0.92, d: 0.76, h: 0.84, rot: -0.28, style: 1 },
    { x: 7.1, z: 0.4, w: 0.82, d: 0.85, h: 0.64, rot: 0.19, style: 2 },
    { x: 6.6, z: 2.1, w: 1.02, d: 0.64, h: 0.56, rot: -0.34, style: 0 },
    { x: -4.5, z: 5.5, w: 0.94, d: 0.72, h: 0.74, rot: 0.22, style: 0 },
    { x: -2.3, z: 6.2, w: 0.8, d: 0.96, h: 0.92, rot: -0.19, style: 1 },
    { x: 0.1, z: 6.6, w: 1.08, d: 0.68, h: 0.66, rot: 0.15, style: 2 },
    { x: 2.4, z: 6.3, w: 0.76, d: 0.84, h: 0.58, rot: -0.27, style: 3 },
    { x: -4.8, z: -1.8, w: 0.64, d: 0.58, h: 0.54, rot: 0.31, style: 2 },
    { x: 4.5, z: -2.4, w: 0.7, d: 0.62, h: 0.78, rot: -0.24, style: 1 },
    { x: 4.2, z: 1.4, w: 0.68, d: 0.64, h: 0.62, rot: 0.29, style: 0 },
    { x: -1.6, z: 1.6, w: 0.58, d: 0.64, h: 0.52, rot: -0.21, style: 3 },
  ];
  const hexPadTex = createHexPadPbrTextures('#00f0ff');
  const subtleAnchorMat = new THREE.MeshStandardMaterial({
    map: hexPadTex.map,
    roughness: 0.72,
    metalness: 0.28,
    transparent: true,
    opacity: 0.34,
  });
  for (const blk of organicBlocks) {
    const baseY = Math.max(0, sampleTerrainHeight(blk.x, blk.z));
    const bGroup = new THREE.Group();
    const mat = infillPalettes[blk.style % infillPalettes.length]!;
    const body = new THREE.Mesh(new THREE.BoxGeometry(blk.w, blk.h, blk.d), mat);
    body.position.y = blk.h * 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    bGroup.add(body);

    // Stepped upper terrace penthouse for realistic architectural silhouette
    if (blk.h >= 0.75) {
      const upperH = blk.h * 0.34;
      const upper = new THREE.Mesh(new THREE.BoxGeometry(blk.w * 0.64, upperH, blk.d * 0.68), infillPalettes[(blk.style + 1) % infillPalettes.length]!);
      upper.position.set(blk.w * 0.08, blk.h + upperH * 0.5, -blk.d * 0.06);
      upper.castShadow = true;
      bGroup.add(upper);
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(blk.w * 0.56, 0.04, blk.d * 0.58),
        blk.style % 2 === 0 ? roofGardenMat : solarRoofMat,
      );
      cap.position.set(blk.w * 0.08, blk.h + upperH + 0.02, -blk.d * 0.06);
      bGroup.add(cap);
    } else {
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(blk.w * 0.86, 0.04, blk.d * 0.86),
        blk.style % 2 === 0 ? roofGardenMat : solarRoofMat,
      );
      roof.position.y = blk.h + 0.02;
      bGroup.add(roof);
    }

    bGroup.position.set(blk.x, baseY, blk.z);
    bGroup.rotation.y = blk.rot;
    group.add(bGroup);
  }

  // Subtle ground shadow anchors under primary district areas (organic non-grid offsets)
  const anchorGeo = new THREE.CircleGeometry(1.15, 16);
  anchorGeo.rotateX(-Math.PI / 2);
  for (let gx = -1; gx <= 1; gx++) {
    for (let gz = -1; gz <= 1; gz++) {
      const jitterX = Math.sin(gx * 2.1 + gz * 1.7) * 0.38;
      const jitterZ = Math.cos(gx * 1.5 - gz * 2.3) * 0.38;
      const wx = gx * 3.05 - 0.55 + jitterX;
      const wz = gz * 3.05 - 0.55 + jitterZ;
      if (wx > 3.6 && wz > 3.2) continue;
      const pad = new THREE.Mesh(anchorGeo, subtleAnchorMat);
      pad.position.set(wx, 0.008, wz);
      pad.receiveShadow = true;
      group.add(pad);
    }
  }

  // 5. Open-Sky Coastal Boulevard Anchors
  group.add(buildOpenSkyPerimeterPylons(7.6));

  // 6. Living Flora (Trees, Cypresses & Garden Shrubs — deep solarpunk botanical contrast)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.92 });
  const leafMats = [
    new THREE.MeshStandardMaterial({ color: 0x1b6b4d, roughness: 0.76 }),
    new THREE.MeshStandardMaterial({ color: 0x2a855c, roughness: 0.72 }),
    new THREE.MeshStandardMaterial({ color: 0x3f9b6d, roughness: 0.68 }),
  ];
  const flowerMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    emissive: 0xbe185d,
    emissiveIntensity: 0.22,
    roughness: 0.58,
  });

  const trunkGeo = new THREE.CylinderGeometry(0.05, 0.085, 0.42, 6);
  const canopyGeo = new THREE.DodecahedronGeometry(0.32, 1);
  const cypressGeo = new THREE.ConeGeometry(0.18, 0.85, 7);
  const shrubGeo = new THREE.DodecahedronGeometry(0.18, 0);

  const floraCoords: readonly { x: number; z: number; scale: number; kind: 'TREE' | 'CYPRESS' | 'SHRUB' }[] = [
    // Avenue tree-lined rows & coastal park edges
    ...[-4.6, -1.8, 0.6, 3.6, 5.2].flatMap((x, i) => [
      { x, z: -6.8, scale: 0.95 + (i % 3) * 0.15, kind: (i % 2 === 0 ? 'TREE' : 'CYPRESS') as 'TREE' | 'CYPRESS' },
      { x: -6.9, z: x, scale: 0.9 + (i % 2) * 0.2, kind: (i % 3 === 0 ? 'SHRUB' : 'TREE') as 'SHRUB' | 'TREE' },
    ]),
    // Coastal & hillside woodland groves (avoid SE bay)
    ...Array.from({ length: 36 }, (_, i) => {
      const a = (i / 36) * Math.PI * 2 + 0.14;
      const dist = 10.2 + (i % 5) * 2.4;
      return {
        x: Math.cos(a) * dist,
        z: Math.sin(a) * dist,
        scale: 0.95 + (i % 4) * 0.24,
        kind: (i % 5 === 0 ? 'SHRUB' : i % 3 === 0 ? 'CYPRESS' : 'TREE') as 'TREE' | 'CYPRESS' | 'SHRUB',
      };
    }),
  ];

  floraCoords.forEach((item, idx) => {
    if (item.x > 4.2 && item.z > 3.8) return; // Never place trees underwater in SE bay
    const y = sampleTerrainHeight(item.x, item.z);
    const leafMat = leafMats[idx % leafMats.length]!;

    if (item.kind === 'SHRUB') {
      const bush = new THREE.Mesh(shrubGeo, leafMat);
      bush.scale.set(item.scale * 1.2, item.scale * 0.75, item.scale * 1.1);
      bush.position.set(item.x, y + 0.1 * item.scale, item.z);
      group.add(bush);
      if (idx % 2 === 0) {
        const bloom = new THREE.Mesh(shrubGeo, flowerMat);
        bloom.scale.setScalar(item.scale * 0.36);
        bloom.position.set(item.x + 0.08, y + 0.2 * item.scale, item.z + 0.05);
        group.add(bloom);
      }
    } else if (item.kind === 'CYPRESS') {
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.scale.setScalar(item.scale * 0.8);
      trunk.position.set(item.x, y + 0.16 * item.scale, item.z);
      const cone = new THREE.Mesh(cypressGeo, leafMat);
      cone.scale.setScalar(item.scale);
      cone.position.set(item.x, y + 0.62 * item.scale, item.z);
      group.add(trunk, cone);
    } else {
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.scale.setScalar(item.scale);
      trunk.position.set(item.x, y + 0.2 * item.scale, item.z);
      const crown1 = new THREE.Mesh(canopyGeo, leafMat);
      crown1.scale.set(item.scale * 1.05, item.scale * 0.9, item.scale * 1.05);
      crown1.position.set(item.x, y + 0.56 * item.scale, item.z);
      const crown2 = new THREE.Mesh(canopyGeo, leafMats[(idx + 1) % leafMats.length]!);
      crown2.scale.setScalar(item.scale * 0.68);
      crown2.position.set(item.x + 0.16 * item.scale, y + 0.7 * item.scale, item.z - 0.12 * item.scale);
      group.add(trunk, crown1, crown2);
    }
  });

  // 7. Natural Relief Decor: Coastal Cliffs, Rocks, Streetlamps & Wind Turbines
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x9b8b86,
    roughness: 0.92,
    metalness: 0.06,
  });
  const rockGeo = new THREE.DodecahedronGeometry(0.55, 0);
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2 + 0.31;
    const dist = 10.6 + (i % 5) * 3.2;
    const rx = Math.cos(a) * dist;
    const rz = Math.sin(a) * dist;
    if (rx > 5.0 && rz > 4.5) continue;
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

  // Orthogonal boulevard streetlamps
  const poleGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.52, 5);
  const bulbGeo = new THREE.SphereGeometry(0.055, 6, 6);
  const streetlampMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.85,
  });
  for (const x of [-4.2, -1.8, 0.8, 3.4]) {
    for (const z of [-2.35, 1.15]) {
      const pole = new THREE.Mesh(poleGeo, curbMat);
      pole.position.set(x, 0.24, z);
      const bulb = new THREE.Mesh(bulbGeo, streetlampMat);
      bulb.position.set(x, 0.52, z);
      group.add(pole, bulb);
    }
  }

  // Distant hillside eco wind turbines (NW/N/NE ridges)
  const windRotors: THREE.Group[] = [];
  const mastGeo = new THREE.CylinderGeometry(0.05, 0.11, 2.5, 8);
  const bladeGeo = new THREE.BoxGeometry(0.07, 0.95, 0.02);
  const turbineCoords: readonly [number, number][] = [
    [-19, -12],
    [-14, -22],
    [4, -21],
    [18, -16],
    [-21, 5],
    [-16, 16],
  ];
  turbineCoords.forEach(([tx, tz], i) => {
    const ty = sampleTerrainHeight(tx, tz);
    const mast = new THREE.Mesh(mastGeo, curbMat);
    mast.position.set(tx, ty + 1.2, tz);
    group.add(mast);

    const rotor = new THREE.Group();
    rotor.position.set(tx, ty + 2.42, tz);
    rotor.rotation.y = (i % 3) * 0.4;
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
  });

  // Coastal & hillside cottages/greenhouses
  const cottageMat = new THREE.MeshStandardMaterial({ color: 0xf1e7ec, roughness: 0.65 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3b8f72, roughness: 0.55 });
  const cottageGeo = new THREE.BoxGeometry(0.95, 0.42, 0.68);
  const roofGeo = new THREE.ConeGeometry(0.76, 0.28, 4);
  const cottageCoords: readonly [number, number][] = [
    [-11.5, -8.5],
    [-8.5, -11.5],
    [6.5, -10.5],
    [11.2, -5.5],
    [-12.2, 2.5],
    [-9.4, 9.6],
  ];
  cottageCoords.forEach(([hx, hz], i) => {
    const hy = sampleTerrainHeight(hx, hz);
    const house = new THREE.Mesh(cottageGeo, cottageMat);
    house.position.set(hx, hy + 0.18, hz);
    house.rotation.y = i * 0.5;
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(hx, hy + 0.51, hz);
    roof.rotation.y = i * 0.5 + Math.PI / 4;
    group.add(house, roof);
  });

  // 8. Grounded Urban Props (Benches, Canal Bridge, Harbor Piers, Orbital Anchor Spire)
  group.add(buildCityUrbanProps(sampleTerrainHeight, hasOcean));

  // 9. Living Metropolis Actors (Clickable Colonists, Linear Maglev, Seabirds, VTOL Shuttles, Clouds)
  const { shuttlesGroup, pedestriansGroup, wildlifeGroup, vesselsGroup, cloudLayer } =
    buildCityLifeActors();
  group.add(shuttlesGroup, pedestriansGroup, wildlifeGroup, vesselsGroup, cloudLayer);

  // 10. Environmental Solarpunk Floating Motes
  const moteCount = 120;
  const motePos = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    const angle = ((i * 137.5) * Math.PI) / 180;
    const radiusM = 2.0 + ((i * 29) % 100) * 0.12;
    motePos[i * 3] = Math.cos(angle) * radiusM;
    motePos[i * 3 + 1] = 0.65 + (i % 7) * 0.48;
    motePos[i * 3 + 2] = Math.sin(angle) * radiusM;
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const atmoMotes = new THREE.Points(
    moteGeo,
    new THREE.PointsMaterial({
      color: 0xa7f3d0,
      map: createParticleGlowTexture(),
      size: 0.14,
      transparent: true,
      opacity: 0.52,
      alphaTest: 0.02,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  group.add(atmoMotes);

  // 10b. Coastal Harbor Navigation Buoys bobbing gently in the SE Bay
  const harborBuoys: THREE.Group[] = [];
  if (hasOcean) {
    const buoyBaseGeo = new THREE.CylinderGeometry(0.11, 0.14, 0.16, 8);
    const buoyMastGeo = new THREE.CylinderGeometry(0.022, 0.032, 0.34, 6);
    const buoyTipGeo = new THREE.SphereGeometry(0.055, 8, 8);
    const buoyBaseMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.42, metalness: 0.45 });
    const buoyCoords: readonly [number, number, number][] = [
      [6.4, 6.2, 0x38bdf8],
      [8.2, 4.9, 0xf59e0b],
      [5.5, 8.1, 0x10b981],
      [8.9, 7.6, 0x38bdf8],
    ];
    buoyCoords.forEach(([bx, bz, tipHex], idx) => {
      const buoy = new THREE.Group();
      const base = new THREE.Mesh(buoyBaseGeo, buoyBaseMat);
      const mast = new THREE.Mesh(buoyMastGeo, curbMat);
      mast.position.y = 0.22;
      const tip = new THREE.Mesh(
        buoyTipGeo,
        new THREE.MeshStandardMaterial({
          color: tipHex,
          emissive: tipHex,
          emissiveIntensity: 1.15,
          roughness: 0.2,
        }),
      );
      tip.position.y = 0.41;
      buoy.add(base, mast, tip);
      buoy.position.set(bx, 0.02, bz);
      buoy.userData = { phase: idx * 1.45 };
      group.add(buoy);
      harborBuoys.push(buoy);
    });
  }

  const districtsGroup = new THREE.Group();
  const dronesGroup = new THREE.Group();
  group.add(districtsGroup, dronesGroup);

  return {
    group,
    groundMesh,
    waterBayMesh,
    horizonMesh,
    skyDomeMesh,
    districtsGroup,
    dronesGroup,
    shuttlesGroup,
    pedestriansGroup,
    wildlifeGroup,
    vesselsGroup,
    cloudLayer,
    windRotors,
    civilRailTex,
    freightRailTex,
    pondNormalMap,
    streetlampMat,
    atmoMotes,
    harborBuoys,
  };
}
