import * as THREE from 'three';

/**
 * [L4] EXW.L4.SHOWCASE_3D_ASSETS | v5.1.0 | SADT A5.2
 * High-craft procedural PBR 3D asset library (Solarpunk 2050 / Astralis V7).
 * Every asset is a composite multi-part THREE.Group (6–14 meshes) using ExtrudeGeometry,
 * LatheGeometry, TorusGeometry & varied PBR roughness/metalness, with grounded bottom-center pivots.
 * Zero pressurized city domes (R-16), zero external network textures.
 */
export type ShowcaseAssetCategory = 'FLEET' | 'UNITS' | 'INFRASTRUCTURE' | 'ORBITAL';

export type ShowcaseAssetId =
  | 'COLONY_ARK'
  | 'FRIGATE_SOLAR'
  | 'CORVETTE_ORBITAL'
  | 'SCIENCE_PROBE'
  | 'ARMOR_MECH'
  | 'AERO_INTERCEPTOR'
  | 'ATMO_HARVESTER'
  | 'BIO_EDEN_TOWER'
  | 'QUANTUM_NEXUS'
  | 'ORBITAL_CITADEL';

export interface ShowcaseAssetSpec {
  readonly id: ShowcaseAssetId;
  readonly name: string;
  readonly subtitle: string;
  readonly category: ShowcaseAssetCategory;
  readonly tierLabel: string;
  readonly description: string;
  readonly unityPrefabId: string;
  readonly recommendedDistance: number;
  readonly targetY: number;
}

function makeMat(
  color: number,
  roughness: number,
  metalness: number,
  emissive = 0x000000,
  emissiveIntensity = 0,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    emissive,
    emissiveIntensity,
  });
}

function createExtrudedWing(points: readonly [number, number][], depth: number, bevel = 0.02): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  points.forEach(([x, y], idx) => {
    if (idx === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSegments: 2,
    steps: 1,
    bevelSize: bevel,
    bevelThickness: bevel,
  });
  geo.center();
  return geo;
}

export function buildColonyArkAsset(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'asset_colony_ark';

  const ceramicMat = makeMat(0xd6dee8, 0.38, 0.24);
  const hullShadeMat = makeMat(0x94a3b8, 0.42, 0.56);
  const titaniumMat = makeMat(0x334155, 0.34, 0.82);
  const goldMat = makeMat(0xd99b06, 0.28, 0.8);
  const solarMat = makeMat(0x0c243b, 0.26, 0.72, 0x0284c7, 0.14);
  const cyanGlowMat = makeMat(0x38bdf8, 0.2, 0.4, 0x00f0ff, 0.85);
  const amberGlowMat = makeMat(0xf59e0b, 0.22, 0.35, 0xffb800, 0.85);

  const yOff = 1.05;

  // Central spine fuselage
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.23, 2.45, 16), ceramicMat);
  spine.rotation.z = Math.PI / 2;
  spine.position.set(0, yOff, 0);
  root.add(spine);

  // Structural armored bulkhead collars along the spine
  for (const xPos of [-0.88, -0.35, 0.68, 1.02] as const) {
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.11, 16), titaniumMat);
    collar.rotation.z = Math.PI / 2;
    collar.position.set(xPos, yOff, 0);
    root.add(collar);
  }

  // Forward command prow (Lathe)
  const prowPts = [
    new THREE.Vector2(0.01, 0.44),
    new THREE.Vector2(0.13, 0.3),
    new THREE.Vector2(0.22, 0.08),
    new THREE.Vector2(0.17, 0),
  ];
  const prow = new THREE.Mesh(new THREE.LatheGeometry(prowPts, 16), hullShadeMat);
  prow.rotation.z = -Math.PI / 2;
  prow.position.set(1.2, yOff, 0);
  root.add(prow);

  // Bridge observation deck + armored brow
  const bridgeHousing = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.34), titaniumMat);
  bridgeHousing.position.set(0.95, yOff + 0.18, 0);
  root.add(bridgeHousing);

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.3), cyanGlowMat);
  bridge.position.set(1.06, yOff + 0.19, 0);
  root.add(bridge);

  // Counter-rotating habitation centrifuge torus + recessed window track
  const habRing = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.105, 14, 36), ceramicMat);
  habRing.rotation.y = Math.PI / 2;
  habRing.position.set(0.18, yOff, 0);
  root.add(habRing);

  const trimRingFront = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.028, 8, 36), goldMat);
  trimRingFront.rotation.y = Math.PI / 2;
  trimRingFront.position.set(0.27, yOff, 0);
  root.add(trimRingFront);

  const trimRingBack = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.028, 8, 36), titaniumMat);
  trimRingBack.rotation.y = Math.PI / 2;
  trimRingBack.position.set(0.09, yOff, 0);
  root.add(trimRingBack);

  // 4 centrifuge spokes + central hub sleeve
  const hubSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.28, 14), titaniumMat);
  hubSleeve.rotation.z = Math.PI / 2;
  hubSleeve.position.set(0.18, yOff, 0);
  root.add(hubSleeve);

  for (let i = 0; i < 4; i += 1) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.34, 0.08), titaniumMat);
    spoke.rotation.x = (i * Math.PI) / 4;
    spoke.position.set(0.18, yOff, 0);
    root.add(spoke);
  }

  // Twin beveled photovoltaic wings + frame struts
  const wingGeo = createExtrudedWing(
    [
      [-0.54, -0.2],
      [0.44, -0.1],
      [0.36, 0.18],
      [-0.6, 0.22],
    ],
    0.035,
    0.012,
  );
  for (const zSign of [-1, 1] as const) {
    const wing = new THREE.Mesh(wingGeo, solarMat);
    wing.rotation.x = Math.PI / 2;
    wing.position.set(-0.62, yOff, zSign * 0.86);
    root.add(wing);

    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.9), goldMat);
    strut.position.set(-0.62, yOff, zSign * 0.48);
    root.add(strut);
  }

  // Fusion drive bell (Lathe) + plasma core
  const bellPts = [
    new THREE.Vector2(0.18, 0.38),
    new THREE.Vector2(0.14, 0.22),
    new THREE.Vector2(0.34, 0.0),
  ];
  const driveBell = new THREE.Mesh(new THREE.LatheGeometry(bellPts, 18), titaniumMat);
  driveBell.rotation.z = Math.PI / 2;
  driveBell.position.set(-1.26, yOff, 0);
  root.add(driveBell);

  const plasmaCore = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 14), amberGlowMat);
  plasmaCore.position.set(-1.42, yOff, 0);
  root.add(plasmaCore);

  return root;
}

export function buildFrigateSolarAsset(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'asset_frigate_solar';

  const hullMat = makeMat(0xf1f5f9, 0.32, 0.45);
  const slateMat = makeMat(0x334155, 0.42, 0.72);
  const goldSailMat = makeMat(0xf59e0b, 0.24, 0.76, 0xb45309, 0.16);
  const cyanMat = makeMat(0x06b6d4, 0.2, 0.4, 0x00f0ff, 0.85);
  const yOff = 0.86;

  // Catamaran twin hulls
  const hullGeo = createExtrudedWing(
    [
      [-1.0, -0.14],
      [0.85, -0.12],
      [1.12, 0.0],
      [0.75, 0.14],
      [-0.95, 0.14],
    ],
    0.16,
    0.025,
  );
  for (const zSign of [-1, 1] as const) {
    const pontoon = new THREE.Mesh(hullGeo, hullMat);
    pontoon.position.set(0, yOff, zSign * 0.38);
    root.add(pontoon);

    const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.22, 10), cyanMat);
    thruster.rotation.z = Math.PI / 2;
    thruster.position.set(-1.08, yOff, zSign * 0.38);
    root.add(thruster);
  }

  // Central cross-bridge & command deck
  const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.2, 0.76), slateMat);
  bridgeDeck.position.set(-0.05, yOff + 0.08, 0);
  root.add(bridgeDeck);

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.44), cyanMat);
  canopy.position.set(0.32, yOff + 0.22, 0);
  root.add(canopy);

  // Dorsal & ventral gold solar collector sails
  const sailGeo = createExtrudedWing(
    [
      [-0.55, 0],
      [0.35, 0],
      [0.12, 0.65],
      [-0.45, 0.52],
    ],
    0.025,
    0.008,
  );
  const dorsalSail = new THREE.Mesh(sailGeo, goldSailMat);
  dorsalSail.position.set(-0.22, yOff + 0.48, 0);
  root.add(dorsalSail);

  // Sensor mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.55, 8), slateMat);
  mast.position.set(0.62, yOff + 0.34, 0);
  root.add(mast);

  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.07), cyanMat);
  beacon.position.set(0.62, yOff + 0.64, 0);
  root.add(beacon);

  return root;
}

export function buildCorvetteOrbitalAsset(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'asset_corvette_orbital';

  const bodyMat = makeMat(0xe2e8f0, 0.28, 0.65);
  const darkMat = makeMat(0x1e293b, 0.46, 0.75);
  const roseAccentMat = makeMat(0xe11d48, 0.25, 0.55, 0xf43f5e, 0.65);
  const glassMat = makeMat(0x0ea5e9, 0.15, 0.35, 0x38bdf8, 0.45);
  const yOff = 0.82;

  // Swept delta hull
  const deltaGeo = createExtrudedWing(
    [
      [-0.85, -0.82],
      [0.98, 0.0],
      [-0.85, 0.82],
      [-0.56, 0.0],
    ],
    0.12,
    0.02,
  );
  const deltaWing = new THREE.Mesh(deltaGeo, bodyMat);
  deltaWing.rotation.x = Math.PI / 2;
  deltaWing.position.set(0, yOff, 0);
  root.add(deltaWing);

  // Central fuselage spine
  const spine = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.22, 0.34), darkMat);
  spine.position.set(-0.08, yOff + 0.08, 0);
  root.add(spine);

  // Forward armored cockpit
  const cockpit = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 0.46, 6), glassMat);
  cockpit.rotation.z = Math.PI / 2;
  cockpit.position.set(0.55, yOff + 0.14, 0);
  root.add(cockpit);

  // Dorsal railgun turret + twin barrels
  const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.12, 8), darkMat);
  turretBase.position.set(-0.12, yOff + 0.24, 0);
  root.add(turretBase);

  for (const zOff of [-0.055, 0.055] as const) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.62, 6), bodyMat);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.18, yOff + 0.28, zOff);
    root.add(barrel);
  }

  // Triple thruster cluster
  for (const zOff of [-0.26, 0, 0.26] as const) {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.095, 0.18, 10), roseAccentMat);
    nozzle.rotation.z = Math.PI / 2;
    nozzle.position.set(-0.84, yOff + 0.04, zOff);
    root.add(nozzle);
  }

  return root;
}

export function buildScienceProbeAsset(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'asset_science_probe';

  const goldFoilMat = makeMat(0xf59e0b, 0.32, 0.84);
  const ceramicMat = makeMat(0xf8fafc, 0.35, 0.22);
  const solarMat = makeMat(0x0c4a6e, 0.22, 0.72, 0x0ea5e9, 0.22);
  const cyanGlowMat = makeMat(0x38bdf8, 0.2, 0.4, 0x00f0ff, 0.9);
  const yOff = 1.0;

  // Octagonal gold-foil bus core
  const bus = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.48, 8), goldFoilMat);
  bus.position.set(0, yOff, 0);
  root.add(bus);

  // High-gain parabolic dish via LatheGeometry
  const dishPts = [
    new THREE.Vector2(0.01, 0.0),
    new THREE.Vector2(0.18, 0.04),
    new THREE.Vector2(0.38, 0.14),
    new THREE.Vector2(0.52, 0.28),
  ];
  const dish = new THREE.Mesh(new THREE.LatheGeometry(dishPts, 20), ceramicMat);
  dish.position.set(0, yOff + 0.24, 0);
  root.add(dish);

  // Receiver tripod feed horn
  const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.34, 8), cyanGlowMat);
  horn.position.set(0, yOff + 0.46, 0);
  root.add(horn);

  // Quad deployed solar wings
  for (let i = 0; i < 4; i += 1) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.03, 0.24), solarMat);
    panel.position.set(Math.cos(angle) * 0.62, yOff, Math.sin(angle) * 0.62);
    panel.rotation.y = -angle;
    root.add(panel);
  }

  // Ventral magnetometer boom + sensor crystal
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.65, 8), ceramicMat);
  boom.position.set(0, yOff - 0.56, 0);
  root.add(boom);

  const sensorTip = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), cyanGlowMat);
  sensorTip.position.set(0, yOff - 0.88, 0);
  root.add(sensorTip);

  return root;
}

export function buildArmorMechAsset(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'asset_armor_mech';

  const armorMat = makeMat(0x334155, 0.38, 0.78);
  const ceramicPlateMat = makeMat(0xcbd5e1, 0.34, 0.38);
  const jointMat = makeMat(0x1e293b, 0.54, 0.68);
  const goldAccentMat = makeMat(0xd99b06, 0.28, 0.8);
  const visorMat = makeMat(0x00f0ff, 0.16, 0.4, 0x00f0ff, 0.9);
  const amberMat = makeMat(0xf59e0b, 0.26, 0.5, 0xffb800, 0.72);

  // Beveled armor plate shapes
  const torsoGeo = createExtrudedWing(
    [
      [-0.36, -0.26],
      [0.36, -0.26],
      [0.44, 0.18],
      [0.24, 0.34],
      [-0.24, 0.34],
      [-0.44, 0.18],
    ],
    0.42,
    0.04,
  );
  const pauldronGeo = createExtrudedWing(
    [
      [-0.18, -0.14],
      [0.2, -0.14],
      [0.24, 0.08],
      [0.06, 0.22],
      [-0.18, 0.16],
    ],
    0.34,
    0.03,
  );

  // Twin articulated bipedal legs (bottom pivot y = 0)
  for (const xSign of [-1, 1] as const) {
    // Articulated stabilizer foot + toe claw
    const heel = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.34), jointMat);
    heel.position.set(xSign * 0.36, 0.05, -0.04);
    root.add(heel);

    const toe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.22), ceramicPlateMat);
    toe.position.set(xSign * 0.36, 0.045, 0.2);
    root.add(toe);

    // Ankle & knee hydraulic drums
    const ankle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.24, 12), goldAccentMat);
    ankle.rotation.z = Math.PI / 2;
    ankle.position.set(xSign * 0.36, 0.16, 0);
    root.add(ankle);

    // Angled lower leg shin + front greave
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.54, 8), armorMat);
    shin.position.set(xSign * 0.36, 0.44, -0.02);
    shin.rotation.x = -0.14;
    root.add(shin);

    const greave = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.42, 0.12), ceramicPlateMat);
    greave.position.set(xSign * 0.36, 0.44, 0.09);
    greave.rotation.x = -0.14;
    root.add(greave);

    const knee = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.26, 12), jointMat);
    knee.rotation.z = Math.PI / 2;
    knee.position.set(xSign * 0.35, 0.72, 0.05);
    root.add(knee);

    // Forward-canting thigh armor
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.44, 8), ceramicPlateMat);
    thigh.position.set(xSign * 0.31, 0.94, 0.02);
    thigh.rotation.x = 0.18;
    root.add(thigh);
  }

  // Pelvis skirt & waist actuator gimbal
  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.22, 8), armorMat);
  pelvis.position.set(0, 1.12, 0);
  root.add(pelvis);

  const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.22, 10), jointMat);
  waist.position.set(0, 1.28, 0);
  root.add(waist);

  // Beveled trapezoidal chest torso + armored cockpit glacis
  const torso = new THREE.Mesh(torsoGeo, armorMat);
  torso.position.set(0, 1.62, 0);
  root.add(torso);

  const glacis = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.28, 0.14), ceramicPlateMat);
  glacis.position.set(0, 1.66, 0.25);
  glacis.rotation.x = -0.22;
  root.add(glacis);

  const coreSlit = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.05), visorMat);
  coreSlit.position.set(0, 1.68, 0.33);
  root.add(coreSlit);

  // Low-profile sensor head turret + cyan optical visor + antenna
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.19, 0.18, 8), armorMat);
  head.position.set(0, 2.02, 0.04);
  root.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.1), visorMat);
  visor.position.set(0, 2.02, 0.16);
  root.add(visor);

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.34, 6), goldAccentMat);
  antenna.position.set(0.14, 2.22, -0.02);
  antenna.rotation.z = -0.18;
  root.add(antenna);

  // Angled shoulder pauldrons, arms, forearm cannon (right) & composite buckler (left)
  for (const xSign of [-1, 1] as const) {
    const pauldron = new THREE.Mesh(pauldronGeo, ceramicPlateMat);
    pauldron.position.set(xSign * 0.56, 1.84, 0);
    pauldron.rotation.z = -xSign * 0.22;
    root.add(pauldron);

    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.38, 10), jointMat);
    upperArm.position.set(xSign * 0.58, 1.54, 0.02);
    root.add(upperArm);

    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), goldAccentMat);
    elbow.position.set(xSign * 0.58, 1.34, 0.04);
    root.add(elbow);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.38, 8), armorMat);
    forearm.position.set(xSign * 0.58, 1.24, 0.22);
    forearm.rotation.x = Math.PI / 2 - 0.35;
    root.add(forearm);
  }

  // Right-arm rail-autocannon barrel
  const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.048, 0.62, 8), jointMat);
  cannon.rotation.x = Math.PI / 2 - 0.35;
  cannon.position.set(0.58, 1.18, 0.48);
  root.add(cannon);

  // Left-arm angled composite shield
  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.54, 0.36), ceramicPlateMat);
  shield.position.set(-0.69, 1.26, 0.22);
  shield.rotation.y = 0.22;
  root.add(shield);

  // Dorsal fusion pack + twin jump-thruster nozzles
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.44, 0.24), armorMat);
  pack.position.set(0, 1.66, -0.34);
  root.add(pack);

  for (const xSign of [-1, 1] as const) {
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.18, 10), amberMat);
    vent.position.set(xSign * 0.14, 1.44, -0.4);
    vent.rotation.x = 0.25;
    root.add(vent);
  }

  return root;
}

export function buildAeroInterceptorAsset(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'asset_aero_interceptor';

  const ceramicMat = makeMat(0xf8fafc, 0.28, 0.35);
  const graphiteMat = makeMat(0x1e293b, 0.45, 0.72);
  const glassMat = makeMat(0x38bdf8, 0.14, 0.35, 0x0284c7, 0.5);
  const amberGlowMat = makeMat(0xf59e0b, 0.2, 0.4, 0xffb800, 0.85);
  const yOff = 0.74;

  // Sleek tapered fuselage
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.2, 1.85, 8), ceramicMat);
  body.rotation.z = Math.PI / 2;
  body.position.set(0, yOff, 0);
  root.add(body);

  // Forward canopy
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), glassMat);
  canopy.scale.set(2.1, 0.72, 0.85);
  canopy.position.set(0.32, yOff + 0.12, 0);
  root.add(canopy);

  // Forward-swept wings
  const wingGeo = createExtrudedWing(
    [
      [-0.5, -1.05],
      [0.12, -0.82],
      [0.34, 0.0],
      [0.12, 0.82],
      [-0.5, 1.05],
      [-0.22, 0.0],
    ],
    0.055,
    0.015,
  );
  const wings = new THREE.Mesh(wingGeo, graphiteMat);
  wings.rotation.x = Math.PI / 2;
  wings.position.set(-0.08, yOff - 0.02, 0);
  root.add(wings);

  // Twin articulated VTOL ducted fan nacelles
  for (const zSign of [-1, 1] as const) {
    const duct = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.048, 10, 20), ceramicMat);
    duct.rotation.x = Math.PI / 2;
    duct.position.set(-0.12, yOff, zSign * 0.68);
    root.add(duct);

    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 8), amberGlowMat);
    core.position.set(-0.12, yOff, zSign * 0.68);
    root.add(core);
  }

  // Twin canted tail stabilizers
  for (const zSign of [-1, 1] as const) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.04), ceramicMat);
    fin.position.set(-0.68, yOff + 0.18, zSign * 0.24);
    fin.rotation.x = zSign * 0.35;
    root.add(fin);
  }

  return root;
}

export function buildAtmoHarvesterAsset(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'asset_atmo_harvester';

  const concreteMat = makeMat(0x475569, 0.65, 0.25);
  const ivoryMat = makeMat(0xf1f5f9, 0.34, 0.22);
  const cyanMat = makeMat(0x06b6d4, 0.2, 0.45, 0x00f0ff, 0.85);
  const emeraldMat = makeMat(0x10b981, 0.35, 0.3, 0x10b981, 0.45);

  // Hexagonal foundation plinth (open sky — zero dome!)
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.98, 0.22, 6), concreteMat);
  plinth.position.y = 0.11;
  root.add(plinth);

  // Vortex atmospheric chimney via LatheGeometry
  const chimneyPts = [
    new THREE.Vector2(0.54, 0.0),
    new THREE.Vector2(0.42, 0.45),
    new THREE.Vector2(0.32, 1.15),
    new THREE.Vector2(0.38, 1.65),
    new THREE.Vector2(0.48, 1.95),
  ];
  const chimney = new THREE.Mesh(new THREE.LatheGeometry(chimneyPts, 18), ivoryMat);
  chimney.position.y = 0.22;
  root.add(chimney);

  // 3 radial atmospheric intake condenser fins
  for (let i = 0; i < 3; i += 1) {
    const angle = (i * Math.PI * 2) / 3;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.35, 0.1), concreteMat);
    fin.position.set(Math.cos(angle) * 0.52, 0.95, Math.sin(angle) * 0.52);
    fin.rotation.y = -angle;
    root.add(fin);
  }

  // Two ionized filtration rings
  for (const yPos of [0.95, 1.55] as const) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.04, 10, 28), cyanMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = yPos;
    root.add(ring);
  }

  // Top oxygen emission beacon
  const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.18, 12), emeraldMat);
  emitter.position.y = 2.18;
  root.add(emitter);

  return root;
}

export function buildBioEdenTowerAsset(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'asset_bio_eden_tower';

  const stoneMat = makeMat(0xf5f0e6, 0.48, 0.12);
  const foliageMat = makeMat(0x16a34a, 0.72, 0.05);
  const canopyAccentMat = makeMat(0x22c55e, 0.65, 0.08);
  const waterMat = makeMat(0x0ea5e9, 0.14, 0.3, 0x38bdf8, 0.55);
  const goldMat = makeMat(0xf59e0b, 0.26, 0.78);

  // Stepped Solarpunk vertical garden terraces
  const tiers = [
    { r: 0.92, y: 0.16, h: 0.32 },
    { r: 0.74, y: 0.62, h: 0.34 },
    { r: 0.58, y: 1.08, h: 0.34 },
    { r: 0.42, y: 1.54, h: 0.32 },
  ];
  tiers.forEach((t, idx) => {
    const slab = new THREE.Mesh(new THREE.CylinderGeometry(t.r, t.r * 1.04, t.h, 8), stoneMat);
    slab.position.y = t.y;
    root.add(slab);

    const greenery = new THREE.Mesh(
      new THREE.TorusGeometry(t.r * 0.88, 0.095, 8, 18),
      idx % 2 === 0 ? foliageMat : canopyAccentMat,
    );
    greenery.rotation.x = Math.PI / 2;
    greenery.position.y = t.y + t.h * 0.52;
    root.add(greenery);
  });

  // 3 exterior hydro-conduit glass columns
  for (let i = 0; i < 3; i += 1) {
    const angle = (i * Math.PI * 2) / 3 + 0.3;
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.75, 8), waterMat);
    pipe.position.set(Math.cos(angle) * 0.48, 0.92, Math.sin(angle) * 0.48);
    root.add(pipe);
  }

  // Solar photovoltaic crown
  const crown = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.045, 10, 24), goldMat);
  crown.rotation.x = Math.PI / 2;
  crown.position.y = 1.88;
  root.add(crown);

  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.46, 8), goldMat);
  spire.position.y = 2.08;
  root.add(spire);

  return root;
}

export function buildQuantumNexusAsset(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'asset_quantum_nexus';

  const obsidianMat = makeMat(0x111827, 0.36, 0.74);
  const titaniumMat = makeMat(0x64748b, 0.32, 0.82);
  const goldCoreMat = makeMat(0xf59e0b, 0.18, 0.86, 0xffb800, 0.75);
  const cyanMat = makeMat(0x00f0ff, 0.16, 0.4, 0x00f0ff, 0.95);

  // Hexagonal insulated plinth
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.96, 0.2, 6), titaniumMat);
  base.position.y = 0.1;
  root.add(base);

  // Central golden cryo-optical compute core
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.56, 12), goldCoreMat);
  core.position.y = 0.98;
  root.add(core);

  // 6 obsidian monolith cooling fin stacks around the core
  for (let i = 0; i < 6; i += 1) {
    const angle = (i * Math.PI) / 3;
    const monolith = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.38, 0.44), obsidianMat);
    monolith.position.set(Math.cos(angle) * 0.56, 0.9, Math.sin(angle) * 0.56);
    monolith.rotation.y = -angle;
    root.add(monolith);
  }

  // Dual holographic telemetry rings
  const ringLower = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.032, 10, 32), cyanMat);
  ringLower.rotation.x = Math.PI / 2;
  ringLower.position.y = 0.68;
  root.add(ringLower);

  const ringUpper = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.032, 10, 32), cyanMat);
  ringUpper.rotation.x = Math.PI / 2 + 0.24;
  ringUpper.position.y = 1.48;
  root.add(ringUpper);

  // Optical cap
  const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), cyanMat);
  cap.position.y = 1.98;
  root.add(cap);

  return root;
}

export function buildOrbitalCitadelAsset(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'asset_orbital_citadel';

  const ceramicMat = makeMat(0xf8fafc, 0.3, 0.32);
  const titaniumMat = makeMat(0x475569, 0.34, 0.82);
  const solarMat = makeMat(0x0c4a6e, 0.22, 0.72, 0x0284c7, 0.24);
  const goldMat = makeMat(0xf59e0b, 0.24, 0.8);
  const cyanGlowMat = makeMat(0x00f0ff, 0.18, 0.4, 0x00f0ff, 0.9);
  const yOff = 1.15;

  // Central orbital spire axis
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 2.05, 12), ceramicMat);
  spire.position.y = yOff;
  root.add(spire);

  // Upper & lower counter-rotating habitation rings
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.11, 14, 36), ceramicMat);
  outerRing.rotation.x = Math.PI / 2;
  outerRing.position.y = yOff + 0.16;
  root.add(outerRing);

  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.08, 12, 32), goldMat);
  innerRing.rotation.x = Math.PI / 2;
  innerRing.position.y = yOff - 0.24;
  root.add(innerRing);

  // 6 structural docking spokes
  for (let i = 0; i < 6; i += 1) {
    const angle = (i * Math.PI) / 3;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.06, 0.07), titaniumMat);
    spoke.position.set(Math.cos(angle) * 0.5, yOff + 0.16, Math.sin(angle) * 0.5);
    spoke.rotation.y = -angle;
    root.add(spoke);
  }

  // 4 cruciform solar array wings
  for (let i = 0; i < 4; i += 1) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.03, 0.28), solarMat);
    wing.position.set(Math.cos(angle) * 0.72, yOff + 0.66, Math.sin(angle) * 0.72);
    wing.rotation.y = -angle;
    root.add(wing);
  }

  // Zenith & nadir docking beacons
  const zenith = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), cyanGlowMat);
  zenith.position.y = yOff + 1.08;
  root.add(zenith);

  const nadir = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 0.24, 10), cyanGlowMat);
  nadir.position.y = yOff - 0.96;
  root.add(nadir);

  return root;
}

export const SHOWCASE_3D_ASSETS_CATALOG: readonly ShowcaseAssetSpec[] = Object.freeze([
  {
    id: 'COLONY_ARK',
    name: 'Arche Coloniale Aurore',
    subtitle: 'Vaisseau-Mère Interstellaire · Classe L5',
    category: 'FLEET',
    tierLabel: 'T5 · Flotte',
    description:
      'Centrifugeuse d’habitation rotative, ailes photovoltaïques biseautées et tuyère à fusion pour la colonisation multi-mondes.',
    unityPrefabId: 'Prefabs/Fleet/PF_ColonyArk_Aurore',
    recommendedDistance: 4.5,
    targetY: 1.0,
  },
  {
    id: 'FRIGATE_SOLAR',
    name: 'Frégate Solaire Hélios',
    subtitle: 'Escorteur Catamaran · Classe L3',
    category: 'FLEET',
    tierLabel: 'T3 · Flotte',
    description:
      'Double coque catamaran à voile solaire dorée, passerelle blindée et propulseurs ioniques à haute endurance.',
    unityPrefabId: 'Prefabs/Fleet/PF_FrigateSolar_Helios',
    recommendedDistance: 3.9,
    targetY: 0.9,
  },
  {
    id: 'CORVETTE_ORBITAL',
    name: 'Corvette Orbitale Valkyrie',
    subtitle: 'Patrouilleur Rapide · Classe L2',
    category: 'FLEET',
    tierLabel: 'T2 · Flotte',
    description:
      'Aile delta profilée, tourelle dorsale à double rail et grappe triple-tuyère dédiée à la supériorité orbitale.',
    unityPrefabId: 'Prefabs/Fleet/PF_Corvette_Valkyrie',
    recommendedDistance: 3.6,
    targetY: 0.85,
  },
  {
    id: 'SCIENCE_PROBE',
    name: 'Sonde Scientifique Kepler-Eye',
    subtitle: 'Cartographie & Télémétrie · Classe L1',
    category: 'FLEET',
    tierLabel: 'T1 · Flotte',
    description:
      'Antenne parabolique à haut gain, bus octogonal revêtu d’or, 4 pétales solaires et magnétomètre longue portée.',
    unityPrefabId: 'Prefabs/Fleet/PF_ScienceProbe_KeplerEye',
    recommendedDistance: 3.6,
    targetY: 1.0,
  },
  {
    id: 'ARMOR_MECH',
    name: 'Exosquelette Lourd Titan-L4',
    subtitle: 'Unité Terrestre Blindée · Théâtre Sol',
    category: 'UNITS',
    tierLabel: 'L4 · Terrestre',
    description:
      'Châssis bipède articulé, plaques céramiques composites, optique cyan et pods d’épaule pour la défense périmétrique.',
    unityPrefabId: 'Prefabs/Units/PF_ArmorMech_TitanL4',
    recommendedDistance: 3.9,
    targetY: 1.05,
  },
  {
    id: 'AERO_INTERCEPTOR',
    name: 'Intercepteur Zéphyr VTOL',
    subtitle: 'Supériorité Aérienne · Théâtre Ciel',
    category: 'UNITS',
    tierLabel: 'L3 · Aérien',
    description:
      'Ailes en flèche inversée et nacelles VTOL carénées opérant de la troposphère à la haute stratosphère.',
    unityPrefabId: 'Prefabs/Units/PF_AeroInterceptor_Zephyr',
    recommendedDistance: 3.7,
    targetY: 0.8,
  },
  {
    id: 'ATMO_HARVESTER',
    name: 'Moissonneur Atmosphérique Éole',
    subtitle: 'Ingénierie P1→P4 · Ciel Ouvert',
    category: 'INFRASTRUCTURE',
    tierLabel: 'P4 · Biosphère',
    description:
      'Tour vortex sans dôme à ailettes de condensation et anneaux d’ionisation pour purifier l’atmosphère planétaire.',
    unityPrefabId: 'Prefabs/Buildings/PF_AtmoHarvester_Eole',
    recommendedDistance: 4.3,
    targetY: 1.1,
  },
  {
    id: 'BIO_EDEN_TOWER',
    name: 'Tour Hydroponique Bio-Éden',
    subtitle: 'Architecture Solarpunk · Terrasses',
    category: 'INFRASTRUCTURE',
    tierLabel: 'Niv. 4 · Cité',
    description:
      'Terrasses végétalisées étagées, colonnes hydro-vitrées et couronne photovoltaïque au cœur des cités à ciel ouvert.',
    unityPrefabId: 'Prefabs/Buildings/PF_BioEdenTower',
    recommendedDistance: 4.3,
    targetY: 1.05,
  },
  {
    id: 'QUANTUM_NEXUS',
    name: 'Datacenter Quantique Silicium',
    subtitle: 'Calcul 2x & Gouvernance IA',
    category: 'INFRASTRUCTURE',
    tierLabel: 'Palier II · Calcul',
    description:
      'Six monolithes dissipateurs en obsidienne entourant un cœur cryo-optique doré et ses anneaux télémétriques.',
    unityPrefabId: 'Prefabs/Buildings/PF_QuantumNexus_Silicium',
    recommendedDistance: 4.2,
    targetY: 1.05,
  },
  {
    id: 'ORBITAL_CITADEL',
    name: 'Station Orbitale Astralis Prime',
    subtitle: 'Nœud Orbital · Échelle 1 Planétaire',
    category: 'ORBITAL',
    tierLabel: 'Échelle 1 · Orbital',
    description:
      'Double anneau d’habitation contre-rotatif, 6 bras d’amarrage et 4 ailes photovoltaïques en orbite géostationnaire.',
    unityPrefabId: 'Prefabs/Orbital/PF_OrbitalCitadel_Astralis',
    recommendedDistance: 4.6,
    targetY: 1.15,
  },
]);

export function buildShowcaseAssetById(assetId: ShowcaseAssetId): THREE.Group {
  switch (assetId) {
    case 'COLONY_ARK':
      return buildColonyArkAsset();
    case 'FRIGATE_SOLAR':
      return buildFrigateSolarAsset();
    case 'CORVETTE_ORBITAL':
      return buildCorvetteOrbitalAsset();
    case 'SCIENCE_PROBE':
      return buildScienceProbeAsset();
    case 'ARMOR_MECH':
      return buildArmorMechAsset();
    case 'AERO_INTERCEPTOR':
      return buildAeroInterceptorAsset();
    case 'ATMO_HARVESTER':
      return buildAtmoHarvesterAsset();
    case 'BIO_EDEN_TOWER':
      return buildBioEdenTowerAsset();
    case 'QUANTUM_NEXUS':
      return buildQuantumNexusAsset();
    case 'ORBITAL_CITADEL':
      return buildOrbitalCitadelAsset();
  }
}

export function countGroupGeometryStats(group: THREE.Object3D): {
  readonly meshCount: number;
  readonly triangleCount: number;
} {
  let meshCount = 0;
  let triangleCount = 0;
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      meshCount += 1;
      const geo = obj.geometry;
      if (geo.index) {
        triangleCount += Math.round(geo.index.count / 3);
      } else {
        const pos = geo.getAttribute('position');
        if (pos) triangleCount += Math.round(pos.count / 3);
      }
    }
  });
  return { meshCount, triangleCount };
}
