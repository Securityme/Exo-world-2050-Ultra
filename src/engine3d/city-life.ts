import * as THREE from 'three';
import type { CityColonistPacket } from '../contracts/render-bridge.schema.ts';
import {
  buildCitizenAgent,
  buildCityShuttleVessel,
  buildRealisticBird,
  buildSkyRailShuttle,
} from './procedural-models.ts';
import { createCityCloudWispTexture } from './procedural-textures.ts';

/**
 * [L4] EXW.L4.CITY_LIFE | v5.1.0 | SADT A5.3
 * Layered Open-Sky 3D Coastal Metropolis Life Choreography:
 * - Layer 1 (Ground): Clickable specialty-coded colonists + citizens strolling orthogonal avenues, canal footbridge & waterfront seawall
 * - Layer 2 (Viaduct): Linear East-West Civil & North-South Industrial Freight Maglev transit
 * - Layer 3 (District Airspace): Quad-tilt-rotor drones flying point-to-point between real built districts
 * - Layer 4 (Upper Sky): Articulated 2-joint soaring seabirds, atmospheric VTOL shuttles & drifting sunlit clouds
 * Zero per-frame allocations inside updateCityLifeFrame().
 */

export interface DistrictPatrolTarget {
  readonly id: string;
  readonly x: number;
  readonly z: number;
  readonly inspectY: number;
}

export interface CityLifeGroups {
  readonly shuttlesGroup: THREE.Group;
  readonly pedestriansGroup: THREE.Group;
  readonly wildlifeGroup: THREE.Group;
  readonly vesselsGroup: THREE.Group;
  readonly cloudLayer: THREE.Group;
}

export interface CityLifeUpdateInput {
  readonly dronesGroup: THREE.Group;
  readonly shuttlesGroup: THREE.Group;
  readonly pedestriansGroup: THREE.Group;
  readonly wildlifeGroup: THREE.Group;
  readonly vesselsGroup: THREE.Group;
  readonly cloudLayer: THREE.Group;
}

interface AvenueWaypoint {
  readonly x: number;
  readonly z: number;
}

const AVENUE_ROUTES: readonly (readonly AvenueWaypoint[])[] = [
  // Route 0: Central East-West Avenue (Command -> Habitat -> Waterfront Promenade)
  [
    { x: -4.2, z: -2.15 },
    { x: 3.6, z: -2.15 },
    { x: 4.1, z: 0.95 },
    { x: -4.2, z: 0.95 },
  ],
  // Route 1: Waterfront Seawall & Canal Footbridge Stroll
  [
    { x: -2.15, z: 3.85 },
    { x: 1.9, z: 4.15 },
    { x: 4.2, z: 2.3 },
    { x: 1.1, z: 0.95 },
    { x: -2.15, z: 0.95 },
  ],
  // Route 2: North-South Datacenter -> Command -> Industry Promenade
  [
    { x: -2.15, z: -4.4 },
    { x: 0.95, z: -4.4 },
    { x: 0.95, z: 3.2 },
    { x: -2.15, z: 3.2 },
  ],
  // Route 3: Harbor Quay & BioPark Coastal Loop
  [
    { x: 0.95, z: 0.95 },
    { x: 3.8, z: 0.95 },
    { x: 3.6, z: 3.2 },
    { x: 0.95, z: 3.4 },
  ],
];

/**
 * Grounded Solarpunk Urban Furniture, Harbor Piers, Canal Footbridge & Northern Orbital Anchor Spire
 */
export function buildCityUrbanProps(
  sampleTerrainHeight: (x: number, z: number) => number,
  hasOcean = true,
): THREE.Group {
  const propsGroup = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xf4eaee,
    roughness: 0.45,
    metalness: 0.22,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9a6b48,
    roughness: 0.78,
    metalness: 0.05,
  });
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a,
    roughness: 0.75,
    metalness: 0.04,
  });
  const holoMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.72,
    roughness: 0.2,
  });

  // 1. Orthogonal Avenue Benches & Botanical Planters along N-S / E-W boulevards
  const benchSeatGeo = new THREE.BoxGeometry(0.42, 0.04, 0.14);
  const benchLegGeo = new THREE.BoxGeometry(0.05, 0.11, 0.12);
  const planterGeo = new THREE.BoxGeometry(0.34, 0.18, 0.34);
  const bushGeo = new THREE.DodecahedronGeometry(0.15, 0);

  const boulevardSpots: readonly [number, number, number][] = [
    [-2.5, -2.35, 0],
    [0.2, -2.35, 0],
    [2.7, -2.35, 0],
    [-2.5, 1.15, 0],
    [0.4, 1.15, 0],
    [3.1, 1.15, 0],
    [-2.35, -3.4, Math.PI / 2],
    [-2.35, 2.2, Math.PI / 2],
    [1.15, -3.4, Math.PI / 2],
    [1.15, 2.1, Math.PI / 2],
  ];

  boulevardSpots.forEach(([bx, bz, rot], i) => {
    if (i % 2 === 0) {
      const bench = new THREE.Group();
      bench.position.set(bx, 0, bz);
      bench.rotation.y = rot;
      const seat = new THREE.Mesh(benchSeatGeo, woodMat);
      seat.position.y = 0.12;
      const legL = new THREE.Mesh(benchLegGeo, stoneMat);
      legL.position.set(-0.15, 0.055, 0);
      const legR = new THREE.Mesh(benchLegGeo, stoneMat);
      legR.position.set(0.15, 0.055, 0);
      bench.add(seat, legL, legR);
      propsGroup.add(bench);
    } else {
      const planter = new THREE.Mesh(planterGeo, stoneMat);
      planter.position.set(bx, 0.09, bz);
      const bush = new THREE.Mesh(bushGeo, foliageMat);
      bush.position.set(bx, 0.24, bz);
      bush.scale.set(1.1, 0.72, 1.1);
      propsGroup.add(planter, bush);
    }
  });

  // 2. Four Illuminated Civic Holo-Kiosks at orthogonal avenue crossroads
  const kioskBaseGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
  const kioskScreenGeo = new THREE.BoxGeometry(0.26, 0.22, 0.03);
  const intersections: readonly [number, number][] = [
    [-2.15, -2.15],
    [0.95, -2.15],
    [-2.15, 0.95],
    [0.95, 0.95],
  ];
  intersections.forEach(([kx, kz], i) => {
    const kiosk = new THREE.Group();
    kiosk.position.set(kx + 0.35, 0, kz - 0.35);
    kiosk.rotation.y = (i * Math.PI) / 2 + 0.4;
    const base = new THREE.Mesh(kioskBaseGeo, stoneMat);
    base.position.y = 0.12;
    const screen = new THREE.Mesh(kioskScreenGeo, holoMat);
    screen.position.y = 0.38;
    kiosk.add(base, screen);
    propsGroup.add(kiosk);
  });

  // 3. Arched Solarpunk Canal Footbridge & SE Coastal Timber Harbor Piers
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(-2.15, 0.04, 4.1);
  const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.08, 1.45), stoneMat);
  bridgeDeck.position.y = 0.12;
  const railL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 1.42), holoMat);
  railL.position.set(-0.29, 0.22, 0);
  const railR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 1.42), holoMat);
  railR.position.set(0.29, 0.22, 0);
  bridgeGroup.add(bridgeDeck, railL, railR);
  propsGroup.add(bridgeGroup);

  if (hasOcean) {
    const pierDeckGeo = new THREE.BoxGeometry(1.4, 0.06, 0.46);
    const pierPostGeo = new THREE.CylinderGeometry(0.04, 0.045, 0.28, 6);
    const piers: readonly [number, number, number][] = [
      [5.0, 4.3, -0.55],
      [4.1, 5.4, -0.95],
    ];
    for (const [px, pz, rot] of piers) {
      const pier = new THREE.Group();
      pier.position.set(px, 0.02, pz);
      pier.rotation.y = rot;
      const deck = new THREE.Mesh(pierDeckGeo, woodMat);
      deck.position.y = 0.08;
      pier.add(deck);
      for (const sx of [-0.52, 0.52]) {
        const post = new THREE.Mesh(pierPostGeo, stoneMat);
        post.position.set(sx, -0.02, 0);
        pier.add(post);
      }
      propsGroup.add(pier);
    }
  }

  // 4. Distant Northern Horizon Orbital Anchor Spire
  const spireX = -16;
  const spireZ = -34;
  const spireGroundY = sampleTerrainHeight(spireX, spireZ);
  const spireGroup = new THREE.Group();
  spireGroup.position.set(spireX, spireGroundY, spireZ);

  const spireMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.35,
    metalness: 0.6,
  });
  const spireBeamMat = new THREE.MeshBasicMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });

  const anchorBase = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 1.45, 4.2, 8), spireMat);
  anchorBase.position.y = 2.1;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.42, 18.5, 8), spireMat);
  mast.position.y = 13.0;
  const tetherBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 28, 6), spireBeamMat);
  tetherBeam.position.y = 26.0;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.08, 8, 24), holoMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 16.5;

  spireGroup.add(anchorBase, mast, tetherBeam, ring);
  propsGroup.add(spireGroup);

  return propsGroup;
}

/**
 * Builds the 4-layer living actor groups for Scale 3 (Citizens, Linear Maglev, Seabirds, VTOL Shuttles, Clouds)
 */
export function buildCityLifeActors(): CityLifeGroups {
  // 1. Living Transit — Linear Dual Maglev (3 Civil E-W along z = -5.4 + 2 Freight N-S along x = -5.6)
  const shuttlesGroup = new THREE.Group();
  const shuttleAccents = [0xf43f5e, 0x10b981, 0x38bdf8];
  for (let i = 0; i < 3; i++) {
    const shuttle = buildSkyRailShuttle(shuttleAccents[i] ?? 0xf43f5e);
    shuttle.userData = {
      axis: 'X',
      fixedCoord: -5.4,
      span: 9.5,
      fixedY: 0.76,
      phase: i * 2.1,
      speed: 0.42 + i * 0.05,
    };
    shuttlesGroup.add(shuttle);
  }
  for (let i = 0; i < 2; i++) {
    const freight = buildSkyRailShuttle(0xf59e0b);
    freight.scale.set(1.22, 1.1, 1.32);
    freight.userData = {
      axis: 'Z',
      fixedCoord: -5.6,
      span: 8.6,
      fixedY: 1.12,
      phase: i * Math.PI + 0.6,
      speed: 0.28 + i * 0.04,
    };
    shuttlesGroup.add(freight);
  }

  // 2. Articulated Solarpunk Citizens strolling orthogonal avenues & coastal promenade
  const pedestriansGroup = new THREE.Group();
  syncCityColonistActors(pedestriansGroup, []);

  // 3. Articulated Soaring Seabirds / Cranes sweeping over bay & parks
  const wildlifeGroup = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const bird = buildRealisticBird(0.92 + (i % 3) * 0.16);
    bird.userData = {
      orbitPhase: (i / 10) * Math.PI * 2 + (i % 3) * 0.28,
      centerX: i % 2 === 0 ? 3.2 : -1.4,
      centerZ: i % 2 === 0 ? 3.0 : -1.2,
      orbitR: 3.8 + (i % 4) * 1.95,
      orbitY: 3.1 + (i % 3) * 0.85,
      speed: (i % 4 === 0 ? -1 : 1) * (0.24 + (i % 3) * 0.065),
      flapFreq: 5.6 + (i % 4) * 0.55,
      glideOffset: i * 1.45,
    };
    wildlifeGroup.add(bird);
  }

  // 4. High-Altitude Atmospheric VTOL Transport Shuttles cruising skyline approach arcs
  const vesselsGroup = new THREE.Group();
  const vesselAccents = [0x38bdf8, 0xf43f5e, 0x10b981];
  for (let i = 0; i < 3; i++) {
    const vessel = buildCityShuttleVessel(vesselAccents[i] ?? 0x38bdf8);
    vessel.scale.setScalar(1.08 + i * 0.1);
    vessel.userData = {
      orbitPhase: (i / 3) * Math.PI * 2 + 0.5,
      rx: 10.5 + i * 2.6,
      rz: 8.2 + i * 2.1,
      baseY: 5.35 + i * 0.78,
      speed: (i % 2 === 0 ? 1 : -1) * (0.15 + i * 0.032),
    };
    vesselsGroup.add(vessel);
  }

  // 5. Sparse Open-Sky Drifting Sunlit Cloud Ribbons (strictly open overhead per R-16)
  const cloudLayer = new THREE.Group();
  const cloudTex = createCityCloudWispTexture();
  const cloudGeo = new THREE.PlaneGeometry(11.5, 5.8);
  for (let i = 0; i < 8; i++) {
    const mat = new THREE.MeshBasicMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.28 + (i % 3) * 0.08,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const wisp = new THREE.Mesh(cloudGeo, mat);
    wisp.rotation.x = Math.PI / 2;
    wisp.rotation.z = (i * 0.72) % Math.PI;
    const rad = 12 + (i % 4) * 7.5;
    const ang = (i / 8) * Math.PI * 2;
    wisp.position.set(Math.cos(ang) * rad, 14.8 + (i % 3) * 1.35, Math.sin(ang) * rad);
    const sc = 0.85 + (i % 3) * 0.35;
    wisp.scale.set(sc, sc * 0.85, 1);
    wisp.userData = {
      baseX: wisp.position.x,
      baseZ: wisp.position.z,
      driftSpeed: 0.32 + (i % 3) * 0.14,
      phase: i * 1.15,
    };
    cloudLayer.add(wisp);
  }

  return {
    shuttlesGroup,
    pedestriansGroup,
    wildlifeGroup,
    vesselsGroup,
    cloudLayer,
  };
}

/**
 * Syncs clickable 3D colonist actors in Scale 3 to canonical WorldState.colonists + background citizens.
 */
export function syncCityColonistActors(
  pedestriansGroup: THREE.Group,
  colonists: readonly CityColonistPacket[],
): void {
  const sig = colonists.map((c) => `${c.id}:${c.specialty}`).join('|');
  if (pedestriansGroup.userData.colonistSig === sig && pedestriansGroup.children.length > 0) {
    return;
  }
  pedestriansGroup.userData.colonistSig = sig;

  while (pedestriansGroup.children.length > 0) {
    const child = pedestriansGroup.children[0];
    if (!child) break;
    pedestriansGroup.remove(child);
    child.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) m.dispose();
      }
    });
  }

  // Named clickable colonists from WorldState
  colonists.forEach((c, idx) => {
    const actor = buildCitizenAgent(idx, { id: c.id, specialty: c.specialty });
    actor.userData = {
      interactable: 'COLONIST',
      colonistId: c.id,
      colonistName: c.name,
      specialty: c.specialty,
      routeIdx: idx % AVENUE_ROUTES.length,
      routeOffset: (idx * 0.27) % 1,
      speed: 0.036 + (idx % 3) * 0.006,
      strideFreq: 5.5 + (idx % 3) * 0.65,
      pauseOffset: idx * 1.91,
    };
    pedestriansGroup.add(actor);
  });

  // Ambient city citizens for living urban density
  const ambientCount = 12;
  for (let i = 0; i < ambientCount; i++) {
    const fallbackColonistId = colonists[i % Math.max(1, colonists.length)]?.id;
    const actor = buildCitizenAgent(i + colonists.length);
    actor.userData = {
      ...(fallbackColonistId ? { interactable: 'COLONIST', colonistId: fallbackColonistId } : {}),
      routeIdx: (i + 1) % AVENUE_ROUTES.length,
      routeOffset: (i / ambientCount + 0.13) % 1,
      speed: (i % 2 === 0 ? 1 : -1) * (0.028 + (i % 4) * 0.005),
      strideFreq: 5.2 + (i % 3) * 0.8,
      pauseOffset: (i + 4) * 1.47,
    };
    pedestriansGroup.add(actor);
  }
}

/**
 * Zero-allocation frame update for all Scale 3 urban life layers.
 */
export function updateCityLifeFrame(
  nodes: CityLifeUpdateInput,
  t: number,
  districtTargets: readonly DistrictPatrolTarget[],
): void {
  // 1. Quad-Tilt-Rotor Drones flying point-to-point between built districts with hover scans
  const targetCount = districtTargets.length;
  nodes.dronesGroup.children.forEach((drone, idx) => {
    for (let r = 0; r < 4; r++) {
      const rotor = drone.getObjectByName(`rotorRing${r}`);
      if (rotor) {
        rotor.rotation.y = (r % 2 === 0 ? 1 : -1) * (t * 24 + idx * 1.7);
      }
    }

    if (targetCount >= 2) {
      const legDuration = 6.2 + (idx % 3) * 1.4;
      const rawStep = t / legDuration + idx * 0.67;
      const legIndex = Math.floor(rawStep);
      const localPhase = rawStep - legIndex;

      const fromTarget = districtTargets[(legIndex + idx) % targetCount]!;
      const toTarget = districtTargets[(legIndex + idx + 1) % targetCount]!;

      const moveT = localPhase < 0.22 ? 0 : (localPhase - 0.22) / 0.78;
      const smooth = moveT * moveT * (3 - 2 * moveT);

      const dx = toTarget.x - fromTarget.x;
      const dz = toTarget.z - fromTarget.z;
      const arcLift = Math.sin(smooth * Math.PI) * 0.65;

      const px = fromTarget.x + dx * smooth + Math.cos(t * 1.4 + idx) * 0.28;
      const pz = fromTarget.z + dz * smooth + Math.sin(t * 1.4 + idx) * 0.28;
      const py =
        fromTarget.inspectY +
        (toTarget.inspectY - fromTarget.inspectY) * smooth +
        arcLift +
        Math.sin(t * 2.6 + idx) * 0.08;

      drone.position.set(px, py, pz);
      if (Math.hypot(dx, dz) > 0.05) {
        drone.rotation.y = Math.atan2(-dx, -dz);
      }
      const cruising = moveT > 0.04 && moveT < 0.96;
      drone.rotation.x = cruising ? -0.14 : Math.sin(t * 1.8 + idx) * 0.04;
      drone.rotation.z = Math.sin(t * 2.1 + idx) * 0.05;
    } else {
      const phase = Number(drone.userData.orbitPhase ?? 0);
      const r = Number(drone.userData.orbitR ?? 3.5);
      const baseY = Number(drone.userData.orbitY ?? 2.6);
      const a = t * 0.45 + phase;
      drone.position.set(
        Math.cos(a) * r,
        baseY + Math.sin(t * 1.8 + idx) * 0.16,
        Math.sin(a) * r,
      );
      drone.rotation.y = -a;
      drone.rotation.x = -0.1;
    }
  });

  // 2. Linear Dual Maglev Shuttles gliding along orthogonal viaducts
  nodes.shuttlesGroup.children.forEach((shuttle) => {
    const axis = shuttle.userData.axis === 'Z' ? 'Z' : 'X';
    const fixedCoord = Number(shuttle.userData.fixedCoord ?? -5.4);
    const span = Number(shuttle.userData.span ?? 9.5);
    const fixedY = Number(shuttle.userData.fixedY ?? 0.76);
    const phase = Number(shuttle.userData.phase ?? 0);
    const spd = Number(shuttle.userData.speed ?? 0.4);

    const wave = Math.sin(t * spd + phase);
    const vel = Math.cos(t * spd + phase);
    const posAlong = wave * span;

    if (axis === 'X') {
      shuttle.position.set(posAlong, fixedY, fixedCoord);
      shuttle.rotation.y = vel >= 0 ? -Math.PI / 2 : Math.PI / 2;
    } else {
      shuttle.position.set(fixedCoord, fixedY, posAlong);
      shuttle.rotation.y = vel >= 0 ? Math.PI : 0;
    }
  });

  // 3. Articulated Citizens strolling piecewise-linear avenues & waterfront quay
  nodes.pedestriansGroup.children.forEach((citizen, idx) => {
    const routeIdx = Number(citizen.userData.routeIdx ?? 0);
    const route = AVENUE_ROUTES[routeIdx % AVENUE_ROUTES.length] ?? AVENUE_ROUTES[0]!;
    const routeOffset = Number(citizen.userData.routeOffset ?? 0);
    const spd = Number(citizen.userData.speed ?? 0.032);
    const strideFreq = Number(citizen.userData.strideFreq ?? 5.6);
    const pauseOffset = Number(citizen.userData.pauseOffset ?? 0);

    const lingerWave = Math.sin(t * 0.34 + pauseOffset);
    const strideAmp = lingerWave > 0.8 ? 0.12 : 1.0;

    let rawU = (routeOffset + t * spd) % 1;
    if (rawU < 0) rawU += 1;

    const segCount = route.length;
    const scaled = rawU * segCount;
    const segIdx = Math.floor(scaled) % segCount;
    const segFrac = scaled - Math.floor(scaled);

    const p0 = route[segIdx]!;
    const p1 = route[(segIdx + 1) % segCount]!;
    const dx = p1.x - p0.x;
    const dz = p1.z - p0.z;
    const wx = p0.x + dx * segFrac;
    const wz = p0.z + dz * segFrac;

    citizen.position.set(
      wx,
      0.002 + Math.abs(Math.sin(t * strideFreq + idx)) * 0.012 * strideAmp,
      wz,
    );

    const dirSign = spd >= 0 ? 1 : -1;
    if (Math.hypot(dx, dz) > 0.01) {
      citizen.rotation.y = Math.atan2(-dx * dirSign, -dz * dirSign);
    }

    const swing = Math.sin(t * strideFreq + idx) * 0.48 * strideAmp;
    const leftLeg = citizen.getObjectByName('leftLeg');
    const rightLeg = citizen.getObjectByName('rightLeg');
    const leftArm = citizen.getObjectByName('leftArm');
    const rightArm = citizen.getObjectByName('rightArm');
    if (leftLeg) leftLeg.rotation.x = swing;
    if (rightLeg) rightLeg.rotation.x = -swing;
    if (leftArm) leftArm.rotation.x = -swing * 0.75;
    if (rightArm) rightArm.rotation.x = swing * 0.75;
  });

  // 4. Articulated Soaring Seabirds / Cranes circling over coastal bay & parks
  nodes.wildlifeGroup.children.forEach((bird, idx) => {
    const phase = Number(bird.userData.orbitPhase ?? 0);
    const cx = Number(bird.userData.centerX ?? 2.2);
    const cz = Number(bird.userData.centerZ ?? 2.2);
    const r = Number(bird.userData.orbitR ?? 5.2);
    const baseY = Number(bird.userData.orbitY ?? 3.3);
    const spd = Number(bird.userData.speed ?? 0.28);
    const flapFreq = Number(bird.userData.flapFreq ?? 6.0);
    const glideOffset = Number(bird.userData.glideOffset ?? 0);

    const a = t * spd + phase;
    const updraftWave = Math.sin(t * 0.9 + idx * 1.1);
    const currR = r + Math.cos(t * 0.45 + idx) * 0.75;

    bird.position.set(
      cx + Math.cos(a) * currR,
      baseY + updraftWave * 0.34,
      cz + Math.sin(a) * currR,
    );
    bird.rotation.y = spd >= 0 ? -a : -a + Math.PI;
    bird.rotation.z = (spd >= 0 ? -0.24 : 0.24) + updraftWave * 0.06;
    bird.rotation.x = Math.cos(t * 0.9 + idx * 1.1) * 0.08;

    const glideFactor = Math.sin(t * 0.55 + glideOffset) > 0.35 ? 0.14 : 1.0;
    const innerAngle = Math.sin(t * flapFreq + idx * 1.3) * 0.44 * glideFactor + 0.06;
    const outerAngle = Math.sin(t * flapFreq + idx * 1.3 - 0.65) * 0.36 * glideFactor;

    const lwIn = bird.getObjectByName('leftInnerWing');
    const lwOut = bird.getObjectByName('leftOuterWing');
    const rwIn = bird.getObjectByName('rightInnerWing');
    const rwOut = bird.getObjectByName('rightOuterWing');
    if (lwIn) lwIn.rotation.z = -innerAngle;
    if (lwOut) lwOut.rotation.z = -outerAngle;
    if (rwIn) rwIn.rotation.z = innerAngle;
    if (rwOut) rwOut.rotation.z = outerAngle;
  });

  // 5. High-Altitude Atmospheric VTOL Transport Shuttles sweeping elliptical skyline arcs
  nodes.vesselsGroup.children.forEach((vessel, idx) => {
    const phase = Number(vessel.userData.orbitPhase ?? 0);
    const rx = Number(vessel.userData.rx ?? 11.5);
    const rz = Number(vessel.userData.rz ?? 9.0);
    const baseY = Number(vessel.userData.baseY ?? 5.6);
    const spd = Number(vessel.userData.speed ?? 0.16);

    const a = t * spd + phase;
    const x = Math.cos(a) * rx;
    const z = Math.sin(a) * rz;
    const y = baseY + Math.sin(a * 2 + idx) * 0.42;

    const vx = -Math.sin(a) * rx * spd;
    const vz = Math.cos(a) * rz * spd;

    vessel.position.set(x, y, z);
    vessel.rotation.y = Math.atan2(-vx, -vz);
    vessel.rotation.z = spd >= 0 ? -0.22 : 0.22;
    vessel.rotation.x = Math.cos(a * 2 + idx) * 0.06;
  });

  // 6. Drifting Open-Sky Sunlit Cloud Ribbons
  nodes.cloudLayer.children.forEach((wisp) => {
    const baseX = Number(wisp.userData.baseX ?? 0);
    const baseZ = Number(wisp.userData.baseZ ?? 0);
    const driftSpeed = Number(wisp.userData.driftSpeed ?? 0.35);
    const phase = Number(wisp.userData.phase ?? 0);
    const wrappedX = ((baseX + t * driftSpeed + 26) % 52) - 26;
    wisp.position.x = wrappedX;
    wisp.position.z = baseZ + Math.sin(t * 0.12 + phase) * 1.4;
  });
}
