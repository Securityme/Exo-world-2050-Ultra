import * as THREE from 'three';
import type { CityColonistPacket, CityDistrictPacket } from '../contracts/render-bridge.schema.ts';
import {
  createContactShadowTexture,
  createFacadeTextures,
  createWaterRippleNormalMap,
} from './procedural-textures.ts';

/**
 * [L4] FUP-007 | SM-05 | SADT A5.3
 * Procedural Open-Sky Solarpunk 3D Architecture (R-16: ZERO closed domes overhead).
 * - Preserves buildOrbitalStation() for Scale 1 (Vue Espace) untouched.
 * - Dramatically upgrades Scale 3 Open-Sky City districts into 6-12 part composite
 *   Astralis Rose & Pearl Solarpunk landmarks with procedural facade textures,
 *   rooftop gardens, skybridges, energy collectors, docked shuttles, and sculpted perimeter spires.
 */

interface DistrictPalette {
  readonly wallHex: string;
  readonly glassHex: string;
  readonly accentHex: string;
  readonly accentNum: number;
  readonly plinthNum: number;
}

const KIND_PALETTES: Record<CityDistrictPacket['kind'], DistrictPalette> = {
  COMMAND: {
    wallHex: '#f8eff3',
    glassHex: '#2c1f38',
    accentHex: '#e11d48',
    accentNum: 0xe11d48,
    plinthNum: 0xe9dce2,
  },
  HABITAT: {
    wallHex: '#faf5f7',
    glassHex: '#334155',
    accentHex: '#10b981',
    accentNum: 0x10b981,
    plinthNum: 0xe7e1e6,
  },
  ENERGY: {
    wallHex: '#ece7ef',
    glassHex: '#1e293b',
    accentHex: '#f59e0b',
    accentNum: 0xf59e0b,
    plinthNum: 0xd9d2de,
  },
  INDUSTRY: {
    wallHex: '#e4ddd9',
    glassHex: '#292524',
    accentHex: '#f97316',
    accentNum: 0xf97316,
    plinthNum: 0xd4cbc6,
  },
  DATACENTER: {
    wallHex: '#2d223d',
    glassHex: '#130d24',
    accentHex: '#ec4899',
    accentNum: 0xec4899,
    plinthNum: 0x3f3154,
  },
  BIOPARK: {
    wallHex: '#eef5f1',
    glassHex: '#1e3a34',
    accentHex: '#10b981',
    accentNum: 0x10b981,
    plinthNum: 0xdceae2,
  },
  SPACEPORT: {
    wallHex: '#f2edf2',
    glassHex: '#1e293b',
    accentHex: '#f43f5e',
    accentNum: 0xf43f5e,
    plinthNum: 0xded9e3,
  },
};

/**
 * Scale 1 Orbital Station — preserved verbatim (Scale 1 approved by user).
 */
export function buildOrbitalStation(): THREE.Group {
  const station = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.32,
    metalness: 0.78,
  });
  const solarMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0369a1,
    emissiveIntensity: 0.35,
    roughness: 0.25,
    metalness: 0.6,
  });

  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.25, 12), hullMat);
  station.add(core);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.07, 10, 28), hullMat);
  ring.rotation.x = Math.PI / 2;
  station.add(ring);

  const wingGeo = new THREE.BoxGeometry(1.6, 0.04, 0.36);
  const wing = new THREE.Mesh(wingGeo, solarMat);
  station.add(wing);

  return station;
}

/**
 * Scale 2 Miniature Orbital Telemetry Satellite
 */
export function buildPlanetarySatellite(accentHex: number): THREE.Group {
  const sat = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.28,
    metalness: 0.78,
  });
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    emissive: accentHex,
    emissiveIntensity: 0.45,
    roughness: 0.25,
    metalness: 0.65,
  });

  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), bodyMat);
  sat.add(core);

  const panelL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.015, 0.09), panelMat);
  panelL.position.x = -0.18;
  sat.add(panelL);

  const panelR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.015, 0.09), panelMat);
  panelR.position.x = 0.18;
  sat.add(panelR);

  return sat;
}

/**
 * Scale 3 Open-Sky Coastal Promenade & Boulevard Anchors (ZERO glass dome overhead per R-16).
 */
export function buildOpenSkyPerimeterPylons(halfSpan: number): THREE.Group {
  const group = new THREE.Group();

  const pearlMat = new THREE.MeshStandardMaterial({
    color: 0xf7eef2,
    roughness: 0.34,
    metalness: 0.42,
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x3b263d,
    roughness: 0.42,
    metalness: 0.72,
  });
  const roseGlowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.3,
  });

  const baseGeo = new THREE.BoxGeometry(0.46, 0.26, 0.46);
  const shaftGeo = new THREE.CylinderGeometry(0.08, 0.16, 1.85, 6);
  const finGeo = new THREE.BoxGeometry(0.06, 1.25, 0.3);
  const emitterGeo = new THREE.OctahedronGeometry(0.14, 0);
  const ringGeo = new THREE.TorusGeometry(0.22, 0.022, 8, 20);

  // Place along orthogonal waterfront promenade corners & avenue gateways (never a closed bullseye circle)
  const anchorPositions: readonly [number, number, number][] = [
    [-halfSpan, -halfSpan * 0.88, Math.PI * 0.25],
    [0, -halfSpan * 0.92, Math.PI * 0.5],
    [halfSpan * 0.85, -halfSpan * 0.82, Math.PI * 0.75],
    [-halfSpan * 0.92, 0.4, 0],
    [halfSpan * 0.88, 0.2, Math.PI],
    [-halfSpan * 0.85, halfSpan * 0.78, -Math.PI * 0.25],
    [1.6, halfSpan * 0.74, -Math.PI * 0.5],
    [halfSpan * 0.42, halfSpan * 0.42, -Math.PI * 0.75],
  ];

  for (const [x, z, rotY] of anchorPositions) {
    const pylon = new THREE.Group();
    pylon.position.set(x, 0, z);
    pylon.rotation.y = rotY;

    const base = new THREE.Mesh(baseGeo, darkMetalMat);
    base.position.y = 0.13;
    pylon.add(base);

    const shaft = new THREE.Mesh(shaftGeo, pearlMat);
    shaft.position.y = 1.12;
    pylon.add(shaft);

    const fin = new THREE.Mesh(finGeo, roseGlowMat);
    fin.position.set(-0.12, 1.05, 0);
    pylon.add(fin);

    const emitter = new THREE.Mesh(emitterGeo, roseGlowMat);
    emitter.position.y = 2.24;
    pylon.add(emitter);

    const halo = new THREE.Mesh(ringGeo, roseGlowMat);
    halo.position.y = 2.24;
    halo.rotation.x = Math.PI / 2;
    pylon.add(halo);

    group.add(pylon);
  }

  return group;
}

function addSculptedTree(
  parent: THREE.Group,
  x: number,
  y: number,
  z: number,
  scale: number,
  trunkMat: THREE.Material,
  foliageMat: THREE.Material,
): void {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035 * scale, 0.055 * scale, 0.28 * scale, 6),
    trunkMat,
  );
  trunk.position.set(x, y + 0.14 * scale, z);
  parent.add(trunk);

  const lowerCrown = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.18 * scale, 1),
    foliageMat,
  );
  lowerCrown.position.set(x, y + 0.34 * scale, z);
  lowerCrown.scale.set(1.15, 0.85, 1.15);
  parent.add(lowerCrown);

  const upperCrown = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.12 * scale, 1),
    foliageMat,
  );
  upperCrown.position.set(x + 0.04 * scale, y + 0.47 * scale, z - 0.03 * scale);
  parent.add(upperCrown);
}

/**
 * Scale 3 Multi-Part Composite Solarpunk District Builder (6–12 architectural parts + 0..3 grafted modules)
 */
export function buildDistrictMesh(district: CityDistrictPacket): THREE.Group {
  const group = new THREE.Group();
  group.userData = { interactable: 'DISTRICT', districtId: district.id };

  const pal = KIND_PALETTES[district.kind];
  const {
    map: facadeMap,
    normalMap: facadeNormal,
    roughnessMap: facadeRoughness,
    emissiveMap: facadeEmissive,
  } = createFacadeTextures(
    pal.wallHex,
    pal.glassHex,
    pal.accentHex,
  );

  const plinthMat = new THREE.MeshStandardMaterial({
    color: pal.plinthNum,
    roughness: 0.58,
    metalness: 0.22,
  });
  const pearlMat = new THREE.MeshStandardMaterial({
    color: pal.wallHex,
    roughness: 0.36,
    metalness: 0.28,
  });
  const facadeMat = new THREE.MeshStandardMaterial({
    map: facadeMap,
    normalMap: facadeNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: facadeRoughness,
    emissive: 0xffffff,
    emissiveMap: facadeEmissive,
    emissiveIntensity: district.integrity < 30 ? 0.22 : 0.72,
    roughness: 1.0,
    metalness: 0.42,
    envMapIntensity: 1.15,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: pal.glassHex,
    roughness: 0.12,
    metalness: 0.65,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
    reflectivity: 0.95,
    envMapIntensity: 1.25,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: pal.accentNum,
    emissive: pal.accentNum,
    emissiveIntensity: district.integrity < 30 ? 0.2 : 0.85,
    roughness: 0.25,
    metalness: 0.45,
  });
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.78,
    metalness: 0.04,
  });
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x7c5338,
    roughness: 0.88,
    metalness: 0.02,
  });

  // Soft radial contact shadow flush on plaza (prevents floating appearance & Z-fighting)
  const contactShadowTex = createContactShadowTexture();
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.75, 2.75),
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.44,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.008;
  group.add(contactShadow);

  // 2-tier beveled rectangular architectural city-block plinth (non-circular alignment)
  const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.14, 2.14), plinthMat);
  basePlinth.position.y = 0.07;
  basePlinth.receiveShadow = true;
  group.add(basePlinth);

  const upperPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.1, 1.88), pearlMat);
  upperPlinth.position.y = 0.19;
  group.add(upperPlinth);

  const trimBand = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.032, 1.94), accentMat);
  trimBand.position.y = 0.145;
  group.add(trimBand);

  const h = 1.05 + district.level * 0.46;

  if (district.kind === 'COMMAND') {
    // Tiered Sovereign Rose & Pearl Citadel
    const lowerCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.64, h * 0.62, 6),
      facadeMat,
    );
    lowerCore.position.y = 0.24 + (h * 0.62) / 2;
    group.add(lowerCore);

    const upperSpire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.44, h * 0.65, 6),
      facadeMat,
    );
    upperSpire.position.y = 0.24 + h * 0.62 + (h * 0.65) / 2;
    group.add(upperSpire);

    // 3 architectural pearl buttress fins
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, h * 0.82, 0.44), pearlMat);
      fin.position.set(Math.cos(a) * 0.46, 0.24 + (h * 0.82) / 2, Math.sin(a) * 0.46);
      fin.rotation.y = -a + Math.PI / 2;
      group.add(fin);
    }

    // Observation deck ring + crystalline rose-gold beacon
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.34, 0.12, 12), glassMat);
    deck.position.y = 0.24 + h * 1.24;
    group.add(deck);

    const holoRing = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.03, 8, 32), accentMat);
    holoRing.rotation.x = Math.PI / 2;
    holoRing.position.y = 0.24 + h * 1.28;
    group.add(holoRing);

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.06, 0.55, 6), pearlMat);
    mast.position.y = 0.24 + h * 1.28 + 0.28;
    group.add(mast);

    const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.17, 0), accentMat);
    beacon.position.y = 0.24 + h * 1.28 + 0.62;
    group.add(beacon);
  } else if (district.kind === 'HABITAT') {
    // Twin Solarpunk cantilevered residential towers + skybridge + rooftop bio-gardens
    const t1H = h * 1.05;
    const t2H = h * 0.78;
    const tower1 = new THREE.Mesh(new THREE.BoxGeometry(0.54, t1H, 0.52), facadeMat);
    tower1.position.set(-0.28, 0.24 + t1H / 2, -0.14);
    group.add(tower1);

    const tower2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, t2H, 0.5), facadeMat);
    tower2.position.set(0.32, 0.24 + t2H / 2, 0.18);
    group.add(tower2);

    // Architectural white terrace bands & rooftop crowns
    const roof1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.58), pearlMat);
    roof1.position.set(-0.28, 0.24 + t1H + 0.04, -0.14);
    group.add(roof1);

    const roof2 = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.56), pearlMat);
    roof2.position.set(0.32, 0.24 + t2H + 0.04, 0.18);
    group.add(roof2);

    // Glass skybridge linking the twin towers
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.14, 0.22), glassMat);
    bridge.position.set(0.02, 0.24 + t2H * 0.72, 0.02);
    bridge.rotation.y = -0.45;
    group.add(bridge);

    const bridgeTrim = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.035, 0.25), accentMat);
    bridgeTrim.position.set(0.02, 0.24 + t2H * 0.72 - 0.08, 0.02);
    bridgeTrim.rotation.y = -0.45;
    group.add(bridgeTrim);

    // Rooftop emerald bio-gardens
    const garden1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.42), foliageMat);
    garden1.position.set(-0.28, 0.24 + t1H + 0.1, -0.14);
    group.add(garden1);

    addSculptedTree(group, 0.32, 0.24 + t2H + 0.08, 0.18, 0.75, trunkMat, foliageMat);
  } else if (district.kind === 'ENERGY') {
    // Helio-Fusion Core + Twin Plasma Containment Rings + Solar Collector Wings
    const reactor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.38, h * 0.88, 12),
      facadeMat,
    );
    reactor.position.y = 0.24 + (h * 0.88) / 2;
    group.add(reactor);

    const coreOrb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), accentMat);
    coreOrb.position.y = 0.24 + h * 0.88 + 0.18;
    group.add(coreOrb);

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.055, 10, 28), accentMat);
    ring1.position.y = 0.24 + h * 0.72;
    ring1.rotation.x = Math.PI / 3;
    group.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.04, 10, 28), pearlMat);
    ring2.position.y = 0.24 + h * 0.72;
    ring2.rotation.x = -Math.PI / 3;
    ring2.rotation.z = Math.PI / 4;
    group.add(ring2);

    // 4 angled photovoltaic collector wings around plinth
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.04, 0.28), glassMat);
      wing.position.set(Math.cos(a) * 0.64, 0.44, Math.sin(a) * 0.64);
      wing.rotation.y = -a;
      wing.rotation.z = 0.38;
      group.add(wing);
    }
  } else if (district.kind === 'INDUSTRY') {
    // Articulated Fabrication Hall + Dual Arched Gantries + 3 Silo Stacks
    const hall = new THREE.Mesh(new THREE.BoxGeometry(0.94, h * 0.52, 0.68), facadeMat);
    hall.position.set(-0.1, 0.24 + (h * 0.52) / 2, 0.1);
    group.add(hall);

    const roofBand = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.07, 0.72), pearlMat);
    roofBand.position.set(-0.1, 0.24 + h * 0.52 + 0.035, 0.1);
    group.add(roofBand);

    // 3 industrial silos with illuminated pressure rings
    for (let i = 0; i < 3; i++) {
      const sx = -0.34 + i * 0.34;
      const sh = h * (0.72 + (i % 2) * 0.18);
      const silo = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, sh, 10), pearlMat);
      silo.position.set(sx, 0.24 + sh / 2, -0.44);
      group.add(silo);

      const band = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.022, 6, 16), accentMat);
      band.rotation.x = Math.PI / 2;
      band.position.set(sx, 0.24 + sh * 0.78, -0.44);
      group.add(band);
    }

    // Crane gantry beam
    const crane = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.92), accentMat);
    crane.position.set(0.45, 0.24 + h * 0.66, 0.0);
    group.add(crane);
  } else if (district.kind === 'DATACENTER') {
    // Obsidian & Pearl Quantum Triad + Central Luminous Data Pillar
    const centralPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, h * 1.12, 8),
      accentMat,
    );
    centralPillar.position.y = 0.24 + (h * 1.12) / 2;
    group.add(centralPillar);

    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.32, h * 0.96, 0.52), facadeMat);
      blade.position.set(Math.cos(a) * 0.44, 0.24 + (h * 0.96) / 2, Math.sin(a) * 0.44);
      blade.rotation.y = -a;
      group.add(blade);
    }

    for (let r = 0; r < 2; r++) {
      const dataRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.68 - r * 0.14, 0.025, 8, 28),
        accentMat,
      );
      dataRing.rotation.x = Math.PI / 2;
      dataRing.position.y = 0.24 + h * (0.55 + r * 0.35);
      group.add(dataRing);
    }
  } else if (district.kind === 'BIOPARK') {
    // Terraced Hydro-Botanical Park + Reflection Pond + Sculpted Multi-Tier Trees
    const lawn = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.88, 0.09, 12), foliageMat);
    lawn.position.y = 0.28;
    group.add(lawn);

    const pondMat = new THREE.MeshPhysicalMaterial({
      color: 0x0ea5a0,
      emissive: 0x0f766e,
      emissiveIntensity: 0.2,
      roughness: 0.08,
      metalness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      ior: 1.333,
      normalMap: createWaterRippleNormalMap(),
      normalScale: new THREE.Vector2(0.42, 0.42),
      envMapIntensity: 1.35,
    });
    const pond = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 16), pondMat);
    pond.position.y = 0.32;
    group.add(pond);

    // Sculpted botanical pavilion arch (open-sky pergola)
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.04, 8, 20, Math.PI),
      pearlMat,
    );
    arch.position.y = 0.32;
    group.add(arch);

    const treeAngles = [0.2, 1.4, 2.6, 3.8, 5.1];
    for (let i = 0; i < treeAngles.length; i++) {
      const a = treeAngles[i] ?? 0;
      const dist = 0.56 + (i % 2) * 0.12;
      addSculptedTree(
        group,
        Math.cos(a) * dist,
        0.31,
        Math.sin(a) * dist,
        0.9 + (i % 3) * 0.22,
        trunkMat,
        foliageMat,
      );
    }
  } else {
    // SPACEPORT: Illuminated Landing Pad + Docked Orbital Shuttle + Control Spire
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.72, 0.08, 8), glassMat);
    pad.position.set(-0.12, 0.28, 0.06);
    group.add(pad);

    const padGlow = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.028, 6, 24), accentMat);
    padGlow.rotation.x = Math.PI / 2;
    padGlow.position.set(-0.12, 0.33, 0.06);
    group.add(padGlow);

    // Docked sleek white-and-rose shuttle
    const fuselage = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.68, 8), pearlMat);
    fuselage.rotation.x = Math.PI / 2;
    fuselage.position.set(-0.12, 0.46, 0.06);
    group.add(fuselage);

    const wings = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.04, 0.24), pearlMat);
    wings.position.set(-0.12, 0.43, 0.14);
    group.add(wings);

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.22), accentMat);
    canopy.position.set(-0.12, 0.54, -0.04);
    group.add(canopy);

    // ATC Radar Spire
    const atc = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, h * 0.85, 8), facadeMat);
    atc.position.set(0.62, 0.24 + (h * 0.85) / 2, -0.32);
    group.add(atc);

    const atcTop = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.16, 8), glassMat);
    atcTop.position.set(0.62, 0.24 + h * 0.85 + 0.08, -0.32);
    group.add(atcTop);
  }

  // Anno-style Grafted Modular Architectural Annexes (0..3) with connecting sky-bridges
  for (let m = 0; m < district.modulesCount; m++) {
    const angle = (m / 3) * Math.PI * 2 + 0.52;
    const mx = Math.cos(angle) * 0.92;
    const mz = Math.sin(angle) * 0.92;

    const annexPlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.16, 6), plinthMat);
    annexPlinth.position.set(mx, 0.08, mz);
    group.add(annexPlinth);

    const annexPod = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.32), facadeMat);
    annexPod.position.set(mx, 0.37, mz);
    annexPod.rotation.y = -angle;
    group.add(annexPod);

    const skylight = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.24), accentMat);
    skylight.position.set(mx, 0.61, mz);
    skylight.rotation.y = -angle;
    group.add(skylight);

    const skyBridge = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.12), pearlMat);
    skyBridge.position.set(mx * 0.62, 0.34, mz * 0.62);
    skyBridge.rotation.y = -angle;
    group.add(skyBridge);
  }

  // Enable subtle shadow casting on architectural structures
  group.traverse((child) => {
    if (child instanceof THREE.Mesh && child !== contactShadow) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

export type DroneVisualRole = 'RECON' | 'LOGISTICS' | 'PATROL';

const DRONE_ROLE_ACCENT: Record<DroneVisualRole, number> = {
  RECON: 0x06b6d4,
  LOGISTICS: 0xf59e0b,
  PATROL: 0xf43f5e,
};

/**
 * Scale 3 Articulated Quad-Tilt-Rotor Autonomous Solarpunk Drone (10+ parts, spinning rotors, optical gimbal)
 */
export function buildDroneUnit(role: DroneVisualRole = 'RECON'): THREE.Group {
  const drone = new THREE.Group();
  const accentHex = DRONE_ROLE_ACCENT[role];

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xf8f1f4,
    roughness: 0.24,
    metalness: 0.56,
  });
  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x2a1f33,
    roughness: 0.42,
    metalness: 0.78,
  });
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    roughness: 0.08,
    metalness: 0.72,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: 1.1,
    roughness: 0.18,
    metalness: 0.35,
  });
  const rotorDiscMat = new THREE.MeshBasicMaterial({
    color: 0xe2e8f0,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // 1. Sleek oval fuselage shell (nose pointing along -Z)
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.19, 6, 12), hullMat);
  hull.rotation.x = Math.PI / 2;
  hull.scale.set(1.25, 1.0, 0.68);
  drone.add(hull);

  // 2. Carbon dorsal avionics spine
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.036, 0.22), carbonMat);
  spine.position.set(0, 0.044, 0.01);
  drone.add(spine);

  // 3. Dorsal status beacon strip
  const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.018, 0.11), glowMat);
  beacon.position.set(0, 0.066, -0.02);
  drone.add(beacon);

  // 4. Underbelly optical sensor gimbal + sapphire lens
  const gimbal = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), carbonMat);
  gimbal.position.set(0, -0.056, -0.07);
  drone.add(gimbal);

  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.024, 10), lensMat);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, -0.058, -0.108);
  drone.add(lens);

  // 5. Twin rear micro-thruster glow cones
  const thrusterGeo = new THREE.ConeGeometry(0.022, 0.075, 8);
  for (const sx of [-0.042, 0.042]) {
    const thruster = new THREE.Mesh(thrusterGeo, glowMat);
    thruster.rotation.x = Math.PI / 2;
    thruster.position.set(sx, 0.005, 0.165);
    drone.add(thruster);
  }

  // 6. Four swept quad-tilt rotor arms, shrouds, and spinning blade hubs
  const armGeo = new THREE.BoxGeometry(0.024, 0.018, 0.19);
  const shroudGeo = new THREE.TorusGeometry(0.072, 0.011, 6, 16);
  const bladeGeo = new THREE.BoxGeometry(0.125, 0.006, 0.018);
  const discGeo = new THREE.CircleGeometry(0.066, 14);

  const mounts: readonly [number, number, number][] = [
    [-0.175, 0.032, -0.135],
    [0.175, 0.032, -0.135],
    [-0.175, 0.042, 0.135],
    [0.175, 0.042, 0.135],
  ];

  mounts.forEach(([mx, my, mz], idx) => {
    const arm = new THREE.Mesh(armGeo, carbonMat);
    arm.position.set(mx * 0.52, my * 0.7, mz * 0.52);
    arm.rotation.y = Math.atan2(mx, mz);
    drone.add(arm);

    const shroud = new THREE.Mesh(shroudGeo, hullMat);
    shroud.rotation.x = Math.PI / 2;
    shroud.position.set(mx, my, mz);
    drone.add(shroud);

    const rotorSpin = new THREE.Group();
    rotorSpin.name = `rotorRing${idx}`;
    rotorSpin.position.set(mx, my + 0.006, mz);

    const bladeA = new THREE.Mesh(bladeGeo, carbonMat);
    const bladeB = new THREE.Mesh(bladeGeo, carbonMat);
    bladeB.rotation.y = Math.PI / 2;
    const disc = new THREE.Mesh(discGeo, rotorDiscMat);
    disc.rotation.x = -Math.PI / 2;
    rotorSpin.add(bladeA, bladeB, disc);
    drone.add(rotorSpin);
  });

  drone.userData.role = role;
  return drone;
}

/**
 * Scale 3 Atmospheric VTOL Cargo / Passenger Shuttle Vessel (10 parts) cruising high-altitude skyline arcs.
 */
export function buildCityShuttleVessel(accentHex = 0x38bdf8): THREE.Group {
  const vessel = new THREE.Group();

  const pearlMat = new THREE.MeshStandardMaterial({
    color: 0xf8f3f6,
    roughness: 0.25,
    metalness: 0.52,
  });
  const hullDarkMat = new THREE.MeshStandardMaterial({
    color: 0x31233d,
    roughness: 0.42,
    metalness: 0.72,
  });
  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    roughness: 0.08,
    metalness: 0.65,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });
  const exhaustMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: 1.35,
    roughness: 0.15,
    metalness: 0.2,
  });

  // 1. Primary aerodynamic fuselage (nose oriented toward -Z)
  const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.68, 6, 14), pearlMat);
  fuselage.rotation.x = Math.PI / 2;
  fuselage.scale.set(1.15, 1.0, 0.76);
  vessel.add(fuselage);

  // 2. Tapered nose radome
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.115, 0.34, 12), pearlMat);
  nose.rotation.x = -Math.PI / 2;
  nose.scale.set(1.12, 1.0, 0.76);
  nose.position.set(0, -0.008, -0.54);
  vessel.add(nose);

  // 3. Smoked wrap-around cockpit canopy
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 8), canopyMat);
  canopy.scale.set(0.95, 0.52, 1.9);
  canopy.position.set(0, 0.072, -0.22);
  vessel.add(canopy);

  // 4. Dorsal aero fin + accent stripe
  const dorsalFin = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.19, 0.36), hullDarkMat);
  dorsalFin.position.set(0, 0.135, 0.24);
  vessel.add(dorsalFin);

  const dorsalTrim = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.025, 0.56), exhaustMat);
  dorsalTrim.position.set(0, 0.115, 0.02);
  vessel.add(dorsalTrim);

  // 5-6. Swept left and right delta wings
  const wingGeo = new THREE.BoxGeometry(0.56, 0.026, 0.28);
  const leftWing = new THREE.Mesh(wingGeo, pearlMat);
  leftWing.position.set(-0.34, -0.01, 0.06);
  leftWing.rotation.y = 0.26;
  leftWing.rotation.z = -0.06;
  vessel.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeo, pearlMat);
  rightWing.position.set(0.34, -0.01, 0.06);
  rightWing.rotation.y = -0.26;
  rightWing.rotation.z = 0.06;
  vessel.add(rightWing);

  // 7-8. Twin wingtip VTOL thruster pods + luminous exhaust plumes
  const nacelleGeo = new THREE.CylinderGeometry(0.056, 0.068, 0.38, 10);
  const plumeGeo = new THREE.ConeGeometry(0.044, 0.24, 10);
  for (const sx of [-0.56, 0.56]) {
    const nacelle = new THREE.Mesh(nacelleGeo, hullDarkMat);
    nacelle.rotation.x = Math.PI / 2;
    nacelle.position.set(sx, -0.015, 0.14);
    vessel.add(nacelle);

    const plume = new THREE.Mesh(plumeGeo, exhaustMat);
    plume.rotation.x = Math.PI / 2;
    plume.position.set(sx, -0.015, 0.43);
    vessel.add(plume);
  }

  // 9. Belly navigation strobe
  const bellyLight = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), exhaustMat);
  bellyLight.position.set(0, -0.105, -0.08);
  vessel.add(bellyLight);

  return vessel;
}

/**
 * Scale 3 Articulated Soaring Seabird / Crane (8 parts: body, head, beak, tail, 2-joint inner + outer wings)
 */
export function buildRealisticBird(scale = 1): THREE.Group {
  const bird = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfef2f8,
    emissiveIntensity: 0.18,
    roughness: 0.52,
    metalness: 0.05,
  });
  const wingTipMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.62,
    metalness: 0.08,
  });
  const beakMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.48,
    metalness: 0.05,
  });

  // 1. Streamlined avian fuselage (facing -Z)
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.13, 4, 8), bodyMat);
  body.rotation.x = Math.PI / 2;
  body.scale.set(1.0, 1.0, 0.78);
  bird.add(body);

  // 2. Neck & head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 6), bodyMat);
  head.position.set(0, 0.012, -0.105);
  bird.add(head);

  // 3. Tapered beak
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.048, 6), beakMat);
  beak.rotation.x = -Math.PI / 2;
  beak.position.set(0, 0.01, -0.145);
  bird.add(beak);

  // 4. Fanned tail feathers
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.044, 0.095, 4), bodyMat);
  tail.rotation.x = -Math.PI / 2;
  tail.scale.set(1.2, 1.0, 0.2);
  tail.position.set(0, 0.002, 0.125);
  bird.add(tail);

  // 5-6. Articulated Left Inner + Outer Wing (shoulder pivot -> elbow pivot)
  const leftInnerWing = new THREE.Group();
  leftInnerWing.name = 'leftInnerWing';
  leftInnerWing.position.set(-0.025, 0.008, -0.01);
  const lwInMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.078), bodyMat);
  lwInMesh.position.set(-0.08, 0, 0.008);
  leftInnerWing.add(lwInMesh);

  const leftOuterWing = new THREE.Group();
  leftOuterWing.name = 'leftOuterWing';
  leftOuterWing.position.set(-0.155, 0, 0.012);
  const lwOutMesh = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.009, 0.056), wingTipMat);
  lwOutMesh.position.set(-0.075, 0, 0.015);
  lwOutMesh.rotation.y = 0.22;
  leftOuterWing.add(lwOutMesh);
  leftInnerWing.add(leftOuterWing);
  bird.add(leftInnerWing);

  // 7-8. Articulated Right Inner + Outer Wing
  const rightInnerWing = new THREE.Group();
  rightInnerWing.name = 'rightInnerWing';
  rightInnerWing.position.set(0.025, 0.008, -0.01);
  const rwInMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.078), bodyMat);
  rwInMesh.position.set(0.08, 0, 0.008);
  rightInnerWing.add(rwInMesh);

  const rightOuterWing = new THREE.Group();
  rightOuterWing.name = 'rightOuterWing';
  rightOuterWing.position.set(0.155, 0, 0.012);
  const rwOutMesh = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.009, 0.056), wingTipMat);
  rwOutMesh.position.set(0.075, 0, 0.015);
  rwOutMesh.rotation.y = -0.22;
  rightOuterWing.add(rwOutMesh);
  rightInnerWing.add(rightOuterWing);
  bird.add(rightInnerWing);

  bird.scale.setScalar(scale);
  return bird;
}

const CITIZEN_TUNICS = [0xe11d48, 0x0d9488, 0xd97706, 0x4f46e5, 0x059669, 0xdb2777];
const SPECIALTY_TUNIC_COLOR: Record<CityColonistPacket['specialty'], number> = {
  ENGINEERING: 0xf59e0b,
  AGRONOMY: 0x10b981,
  CYBERNETICS: 0x06b6d4,
  SECURITY: 0xe11d48,
  EXOBIOLOGY: 0xa855f7,
};
const CITIZEN_SKINS = [0xf1c7a6, 0xd89f78, 0x9c6644, 0xf5d4ba];
const CITIZEN_HAIR = [0x1f1722, 0x4a2f22, 0xb45309, 0xe2e8f0];

/**
 * Scale 3 Articulated Solarpunk Human Citizen / Villager (9 parts, grounded bottom-center pivot y = 0).
 * Includes specialty-coded tunic + generous invisible raycast capsule for reliable 3D clicking.
 */
export function buildCitizenAgent(
  variantIdx = 0,
  spec?: { id?: string; specialty?: CityColonistPacket['specialty'] },
): THREE.Group {
  const citizen = new THREE.Group();
  const tunicColor = spec?.specialty
    ? SPECIALTY_TUNIC_COLOR[spec.specialty]
    : (CITIZEN_TUNICS[variantIdx % CITIZEN_TUNICS.length] ?? 0xe11d48);
  const skinColor = CITIZEN_SKINS[variantIdx % CITIZEN_SKINS.length] ?? 0xf1c7a6;
  const hairColor = CITIZEN_HAIR[(variantIdx * 3) % CITIZEN_HAIR.length] ?? 0x1f1722;

  const tunicMat = new THREE.MeshStandardMaterial({
    color: tunicColor,
    roughness: 0.56,
    metalness: 0.16,
  });
  const trouserMat = new THREE.MeshStandardMaterial({
    color: 0x2a2438,
    roughness: 0.78,
    metalness: 0.08,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.68,
    metalness: 0.02,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: hairColor,
    roughness: 0.72,
    metalness: 0.08,
  });
  const propMat = new THREE.MeshStandardMaterial({
    color: spec?.specialty ? tunicColor : variantIdx % 2 === 0 ? 0x38bdf8 : 0xfbbf24,
    emissive: spec?.specialty ? tunicColor : variantIdx % 2 === 0 ? 0x0284c7 : 0xb45309,
    emissiveIntensity: 0.55,
    roughness: 0.35,
    metalness: 0.3,
  });

  // 0. Generous invisible hit proxy capsule for effortless raycast clicking
  const hitProxy = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.52, 8),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  hitProxy.position.y = 0.26;
  hitProxy.name = 'citizenHitProxy';
  citizen.add(hitProxy);

  // 1. Grounded radial contact shadow disc (flush at y = 0.005)
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.092, 12),
    new THREE.MeshBasicMaterial({
      color: 0x1a0c22,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  citizen.add(shadow);

  // Subtle glowing base beacon for named clickable colonists
  if (spec?.id) {
    const beaconRing = new THREE.Mesh(
      new THREE.RingGeometry(0.09, 0.12, 16),
      new THREE.MeshBasicMaterial({
        color: tunicColor,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    beaconRing.rotation.x = -Math.PI / 2;
    beaconRing.position.y = 0.009;
    citizen.add(beaconRing);
  }

  // 2-3. Articulated Left & Right Legs (pivoted at hip y = 0.145)
  const legGeo = new THREE.CapsuleGeometry(0.02, 0.11, 4, 6);
  const leftLeg = new THREE.Group();
  leftLeg.name = 'leftLeg';
  leftLeg.position.set(-0.026, 0.155, 0);
  const leftLegMesh = new THREE.Mesh(legGeo, trouserMat);
  leftLegMesh.position.y = -0.072;
  leftLeg.add(leftLegMesh);
  citizen.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.name = 'rightLeg';
  rightLeg.position.set(0.026, 0.155, 0);
  const rightLegMesh = new THREE.Mesh(legGeo, trouserMat);
  rightLegMesh.position.y = -0.072;
  rightLeg.add(rightLegMesh);
  citizen.add(rightLeg);

  // 4. Sculpted Solarpunk Tunic Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.06, 0.155, 8), tunicMat);
  torso.position.y = 0.22;
  citizen.add(torso);

  // 5-6. Articulated Left & Right Arms (pivoted at shoulder y = 0.275)
  const armGeo = new THREE.CapsuleGeometry(0.015, 0.09, 4, 6);
  const leftArm = new THREE.Group();
  leftArm.name = 'leftArm';
  leftArm.position.set(-0.062, 0.275, 0);
  const leftArmMesh = new THREE.Mesh(armGeo, tunicMat);
  leftArmMesh.position.y = -0.052;
  leftArm.add(leftArmMesh);
  citizen.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.name = 'rightArm';
  rightArm.position.set(0.062, 0.275, 0);
  const rightArmMesh = new THREE.Mesh(armGeo, tunicMat);
  rightArmMesh.position.y = -0.052;
  rightArm.add(rightArmMesh);
  const prop = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.044, 0.038), propMat);
  prop.position.set(0.01, -0.095, -0.012);
  rightArm.add(prop);
  citizen.add(rightArm);

  // 7. Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), skinMat);
  head.position.y = 0.338;
  citizen.add(head);

  // 8. Stylized Hair / Solarpunk Sun-Visor Crown
  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(0.043, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hairMat,
  );
  crown.position.y = 0.344;
  citizen.add(crown);

  // Scale slightly taller so citizens read clearly in Scale 3
  citizen.scale.setScalar(1.22);
  return citizen;
}

/**
 * Scale 3 Composite Solarpunk Sky-Rail Maglev Shuttle (5 parts) gliding on the elevated viaduct.
 */
export function buildSkyRailShuttle(accentHex: number): THREE.Group {
  const shuttle = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xfdf4f7,
    roughness: 0.26,
    metalness: 0.52,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.14,
    metalness: 0.84,
  });
  const bogieMat = new THREE.MeshStandardMaterial({
    color: 0x3b263d,
    roughness: 0.58,
    metalness: 0.68,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: 0.95,
    roughness: 0.2,
    metalness: 0.35,
  });

  // 1. Sleek aerodynamic primary carriage body
  const cabin = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.44, 6, 12), hullMat);
  cabin.rotation.x = Math.PI / 2;
  cabin.scale.set(1.15, 1.0, 0.88);
  cabin.position.y = 0.12;
  shuttle.add(cabin);

  // 2. Panoramic smoked visor band
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.065, 0.42), glassMat);
  visor.position.set(0, 0.145, 0);
  shuttle.add(visor);

  // 3. Twin luminous speed trim strips
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.225, 0.022, 0.48), accentMat);
  strip.position.set(0, 0.095, 0);
  shuttle.add(strip);

  // 4. Magnetic rail undercarriage bogie
  const bogie = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.055, 0.36), bogieMat);
  bogie.position.set(0, 0.035, 0);
  shuttle.add(bogie);

  // 5. Front/rear photonic headlamps
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 6), accentMat);
  lamp.position.set(0, 0.11, -0.3);
  shuttle.add(lamp);

  return shuttle;
}
