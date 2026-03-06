import * as THREE from 'three';
import { CAMPUS_ROUTES, TREE_ZONES, getCampusPlaceById } from '../data/campus';
import { groundHeightAt } from './terrain';

export type CampusPropKind = 'sign' | 'bench' | 'hedge';

export interface CampusPropAnchor {
  kind: CampusPropKind;
  placeId: string;
  x: number;
  z: number;
  rotation?: number;
  length?: number;
}

function requirePlace(placeId: string) {
  const place = getCampusPlaceById(placeId);
  if (!place) {
    throw new Error(`Missing campus place for decoration anchor: ${placeId}`);
  }
  return place;
}

function buildCampusPropAnchors(): CampusPropAnchor[] {
  const saintMaryGarden = requirePlace('saint-mary-garden');
  const sacredHeartPlaza = requirePlace('sacred-heart-plaza');
  const andreaMaruPlaza = requirePlace('andrea-maru-plaza');
  const tennisCourt = requirePlace('tennis-court');
  const sacredHeartLawn = requirePlace('sacred-heart-lawn');

  return [
    {
      kind: 'sign',
      placeId: saintMaryGarden.id,
      x: saintMaryGarden.x - saintMaryGarden.bounds.width * 0.18,
      z: saintMaryGarden.z + saintMaryGarden.bounds.depth * 0.08,
      rotation: 0.12
    },
    {
      kind: 'bench',
      placeId: sacredHeartPlaza.id,
      x: sacredHeartPlaza.x - sacredHeartPlaza.bounds.width * 0.12,
      z: sacredHeartPlaza.z + sacredHeartPlaza.bounds.depth * 0.04,
      rotation: 0.08
    },
    {
      kind: 'bench',
      placeId: andreaMaruPlaza.id,
      x: andreaMaruPlaza.x - andreaMaruPlaza.bounds.width * 0.08,
      z: andreaMaruPlaza.z + andreaMaruPlaza.bounds.depth * 0.1,
      rotation: 0.12
    },
    {
      kind: 'hedge',
      placeId: tennisCourt.id,
      x: tennisCourt.x + tennisCourt.bounds.width * 0.06,
      z: tennisCourt.z,
      rotation: Math.PI / 2,
      length: tennisCourt.bounds.depth * 0.74
    },
    {
      kind: 'hedge',
      placeId: sacredHeartLawn.id,
      x: sacredHeartLawn.x + sacredHeartLawn.bounds.width * 0.16,
      z: sacredHeartLawn.z + sacredHeartLawn.bounds.depth * 0.12,
      rotation: 0.14,
      length: sacredHeartLawn.bounds.width * 0.42
    }
  ];
}

const CAMPUS_PROP_ANCHORS = buildCampusPropAnchors();

function buildLampPositions(): Array<[number, number]> {
  const truthRoad = CAMPUS_ROUTES.find((route) => route.id === 'truth-road');
  if (!truthRoad) {
    return [];
  }

  return truthRoad.points.slice(0, 7).map((point, index) => {
    const sideOffset = index % 2 === 0 ? 2.8 : -2.6;
    return [point.x + 2.1, point.z + sideOffset];
  });
}

const LAMP_POSITIONS = buildLampPositions();

export function getCampusPropAnchors(): CampusPropAnchor[] {
  return CAMPUS_PROP_ANCHORS.map((anchor) => ({ ...anchor }));
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function nearOfficialRoute(x: number, z: number): boolean {
  return CAMPUS_ROUTES.some((route) =>
    route.points.some((point) => {
      const distanceSq = (x - point.x) ** 2 + (z - point.z) ** 2;
      const radius = route.kind === 'main' ? 14 : route.kind === 'secondary' ? 11 : 8;
      return distanceSq < radius ** 2;
    })
  );
}

function createTree(x: number, z: number, scale: number): THREE.Group {
  const y = groundHeightAt(x, z);
  const group = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.BoxGeometry(0.7 * scale, 2 * scale, 0.7 * scale),
    new THREE.MeshStandardMaterial({ color: 0x6c5036, roughness: 1 })
  );
  trunk.position.set(x, y + 1 * scale, z);
  trunk.castShadow = true;
  group.add(trunk);

  const lowerCanopy = new THREE.Mesh(
    new THREE.BoxGeometry(2.6 * scale, 1.5 * scale, 2.6 * scale),
    new THREE.MeshStandardMaterial({ color: 0x527f47, roughness: 1 })
  );
  lowerCanopy.position.set(x, y + 2.35 * scale, z);
  lowerCanopy.castShadow = true;
  lowerCanopy.receiveShadow = true;

  const upperCanopy = new THREE.Mesh(
    new THREE.BoxGeometry(1.9 * scale, 1.5 * scale, 1.9 * scale),
    new THREE.MeshStandardMaterial({ color: 0x5f9153, roughness: 1 })
  );
  upperCanopy.position.set(x, y + 3.3 * scale, z);
  upperCanopy.castShadow = true;
  upperCanopy.receiveShadow = true;

  group.add(lowerCanopy, upperCanopy);
  return group;
}

function createLamp(x: number, z: number): THREE.Group {
  const y = groundHeightAt(x, z);
  const group = new THREE.Group();

  const pole = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 3.6, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x4d5761, roughness: 0.82 })
  );
  pole.position.set(x, y + 1.8, z);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.24, 0.6),
    new THREE.MeshStandardMaterial({ color: 0xe8debf, emissive: 0x19130b, emissiveIntensity: 0.55 })
  );
  head.position.set(x + 0.42, y + 3.4, z);

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.14, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x4d5761, roughness: 0.82 })
  );
  arm.position.set(x + 0.22, y + 3.45, z);

  group.add(pole, head, arm);
  return group;
}

function createSign(anchor: CampusPropAnchor): THREE.Group {
  const y = groundHeightAt(anchor.x, anchor.z);
  const group = new THREE.Group();

  const post = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 1.8, 0.26),
    new THREE.MeshStandardMaterial({ color: 0x56606c, roughness: 0.9 })
  );
  post.position.set(anchor.x, y + 0.9, anchor.z);

  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.7, 0.16),
    new THREE.MeshStandardMaterial({ color: 0xe1d5b8, roughness: 0.96 })
  );
  sign.position.set(anchor.x, y + 1.8, anchor.z);
  sign.rotation.y = anchor.rotation ?? 0;

  group.add(post, sign);
  return group;
}

function createBench(anchor: CampusPropAnchor): THREE.Group {
  const y = groundHeightAt(anchor.x, anchor.z);
  const group = new THREE.Group();
  group.position.set(anchor.x, y, anchor.z);
  group.rotation.y = anchor.rotation ?? 0;

  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.16, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x916b4b, roughness: 0.95 })
  );
  seat.position.set(0, 0.82, 0);

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.16, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x916b4b, roughness: 0.95 })
  );
  back.position.set(0, 1.16, -0.16);
  back.rotation.x = -0.35;

  const leftLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.72, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x4f5660, roughness: 0.85 })
  );
  leftLeg.position.set(-0.68, 0.36, 0);
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.68;

  group.add(seat, back, leftLeg, rightLeg);
  return group;
}

function createHedge(anchor: CampusPropAnchor): THREE.Group {
  const y = groundHeightAt(anchor.x, anchor.z);
  const group = new THREE.Group();
  const length = anchor.length ?? 8;

  const hedge = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.9, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x5f944a, roughness: 1 })
  );
  hedge.position.set(anchor.x, y + 0.45, anchor.z);
  hedge.rotation.y = anchor.rotation ?? 0;
  hedge.receiveShadow = true;
  group.add(hedge);
  return group;
}

function createCampusProp(anchor: CampusPropAnchor): THREE.Group {
  switch (anchor.kind) {
    case 'sign':
      return createSign(anchor);
    case 'bench':
      return createBench(anchor);
    case 'hedge':
      return createHedge(anchor);
  }
}

export function createDecorations(seed: number): THREE.Group {
  const random = mulberry32(seed);
  const group = new THREE.Group();
  group.name = 'decorations';

  for (const zone of TREE_ZONES) {
    for (let index = 0; index < zone.density; index += 1) {
      const angle = random() * Math.PI * 2;
      const radiusX = Math.sqrt(random()) * zone.radiusX;
      const radiusZ = Math.sqrt(random()) * zone.radiusZ;
      const x = zone.centerX + Math.cos(angle) * radiusX;
      const z = zone.centerZ + Math.sin(angle) * radiusZ;

      const placeCollision = CAMPUS_PROP_ANCHORS.some((anchor) => (x - anchor.x) ** 2 + (z - anchor.z) ** 2 < 18);
      const nearPlaceCenter = ['saint-mary-garden', 'sacred-heart-plaza', 'sacred-heart-lawn', 'tennis-court']
        .map((placeId) => getCampusPlaceById(placeId))
        .filter((place): place is NonNullable<typeof place> => place !== undefined)
        .some((place) => {
          const exclusionRadius = Math.max(place.bounds.width, place.bounds.depth) * 0.45;
          return (x - place.x) ** 2 + (z - place.z) ** 2 < exclusionRadius ** 2;
        });

      if (nearOfficialRoute(x, z) || placeCollision || nearPlaceCenter) {
        continue;
      }

      const scale = 0.8 + random() * 0.55;
      group.add(createTree(x, z, scale));
    }
  }

  for (const [x, z] of LAMP_POSITIONS) {
    group.add(createLamp(x, z));
  }

  for (const anchor of CAMPUS_PROP_ANCHORS) {
    group.add(createCampusProp(anchor));
  }

  return group;
}
