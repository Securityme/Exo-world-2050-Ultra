import * as THREE from 'three';
import type { CityDistrictPacket } from '../contracts/render-bridge.schema.ts';
import {
  createContactShadowTexture,
  createFacadeTextures,
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
 * Scale 3 Open-Sky Perimeter Stabilization Spires (ZERO glass dome overhead per R-16).
 */
export function buildOpenSkyPerimeterPylons(radius: number): THREE.Group {
  const group = new THREE.Group();
  const count = 8;

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
    color: 0xfb7185,
    emissive: 0xe11d48,
    emissiveIntensity: 0.95,
    roughness: 0.2,
    metalness: 0.3,
  });

  const baseGeo = new THREE.CylinderGeometry(0.28, 0.4, 0.28, 6);
  const shaftGeo = new THREE.CylinderGeometry(0.09, 0.2, 2.05, 6);
  const finGeo = new THREE.BoxGeometry(0.06, 1.45, 0.34);
  const emitterGeo = new THREE.OctahedronGeometry(0.15, 0);
  const ringGeo = new THREE.TorusGeometry(0.24, 0.024, 8, 24);

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.PI / 8;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const pylon = new THREE.Group();
    pylon.position.set(x, 0, z);
    pylon.rotation.y = -angle;

    const base = new THREE.Mesh(baseGeo, darkMetalMat);
    base.position.y = 0.14;
    pylon.add(base);

    const shaft = new THREE.Mesh(shaftGeo, pearlMat);
    shaft.position.y = 1.24;
    pylon.add(shaft);

    const fin = new THREE.Mesh(finGeo, roseGlowMat);
    fin.position.set(-0.14, 1.15, 0);
    pylon.add(fin);

    const emitter = new THREE.Mesh(emitterGeo, roseGlowMat);
    emitter.position.y = 2.48;
    pylon.add(emitter);

    const halo = new THREE.Mesh(ringGeo, roseGlowMat);
    halo.position.y = 2.48;
    halo.rotation.x = Math.PI / 2;
    pylon.add(halo);

    group.add(pylon);
  }

  // Open-sky ground perimeter energy trim ring (strictly open overhead)
  const perimeterRing = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.045, 8, 96),
    new THREE.MeshStandardMaterial({
      color: 0xfb7185,
      emissive: 0xe11d48,
      emissiveIntensity: 0.65,
      roughness: 0.3,
      metalness: 0.4,
    }),
  );
  perimeterRing.rotation.x = Math.PI / 2;
  perimeterRing.position.y = 0.07;
  group.add(perimeterRing);

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
  const { map: facadeMap, emissiveMap: facadeEmissive } = createFacadeTextures(
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
    emissive: 0xffffff,
    emissiveMap: facadeEmissive,
    emissiveIntensity: district.integrity < 30 ? 0.22 : 0.72,
    roughness: 0.32,
    metalness: 0.38,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: pal.glassHex,
    roughness: 0.16,
    metalness: 0.82,
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

  // 2-tier beveled hexagonal architectural plaza plinth
  const basePlinth = new THREE.Mesh(
    new THREE.CylinderGeometry(1.06, 1.18, 0.14, 6),
    plinthMat,
  );
  basePlinth.position.y = 0.07;
  basePlinth.receiveShadow = true;
  group.add(basePlinth);

  const upperPlinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.92, 1.0, 0.1, 6),
    pearlMat,
  );
  upperPlinth.position.y = 0.19;
  group.add(upperPlinth);

  const trimRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.99, 0.022, 6, 6),
    accentMat,
  );
  trimRing.rotation.x = Math.PI / 2;
  trimRing.rotation.z = Math.PI / 6;
  trimRing.position.y = 0.15;
  group.add(trimRing);

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

    const pondMat = new THREE.MeshStandardMaterial({
      color: 0x14b8a6,
      emissive: 0x0f766e,
      emissiveIntensity: 0.28,
      roughness: 0.14,
      metalness: 0.42,
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

/**
 * Scale 3 Winged Autonomous Shuttle / Drone (4-part composite)
 */
export function buildDroneUnit(): THREE.Group {
  const drone = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xfff5f8,
    roughness: 0.24,
    metalness: 0.62,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xfb7185,
    emissive: 0xe11d48,
    emissiveIntensity: 0.95,
    roughness: 0.2,
    metalness: 0.4,
  });

  const body = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.34, 6), hullMat);
  body.rotation.x = Math.PI / 2;
  drone.add(body);

  const wings = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.025, 0.11), hullMat);
  wings.position.z = 0.04;
  drone.add(wings);

  const engine = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), glowMat);
  engine.position.z = 0.18;
  drone.add(engine);

  return drone;
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
