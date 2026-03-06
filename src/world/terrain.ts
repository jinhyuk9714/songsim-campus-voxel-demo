import * as THREE from 'three';
import { CAMPUS_WORLD_BOUNDS, getCampusPlaceById } from '../data/campus';

export const CAMPUS_WIDTH = CAMPUS_WORLD_BOUNDS.maxX - CAMPUS_WORLD_BOUNDS.minX + 26;
export const CAMPUS_DEPTH = CAMPUS_WORLD_BOUNDS.maxZ - CAMPUS_WORLD_BOUNDS.minZ + 26;

interface PlateauSpec {
  centerX: number;
  centerZ: number;
  width: number;
  depth: number;
  height: number;
  color: number;
  thickness: number;
}

interface TerraceSeed {
  placeIds: string[];
  padX: number;
  padZ: number;
  height: number;
  color: number;
  thickness: number;
}

const TERRACE_SEEDS: TerraceSeed[] = [
  {
    placeIds: ['main-gate', 'incubator-center', 'kim-sou-hwan'],
    padX: 12,
    padZ: 10,
    height: 1.15,
    color: 0x6f915c,
    thickness: 1.9
  },
  {
    placeIds: ['stefano-dormitory', 'andrea-dormitory', 'andrea-maru-plaza', 'maria-hall', 'nichols-hall'],
    padX: 12,
    padZ: 12,
    height: 2.05,
    color: 0x769965,
    thickness: 1.8
  },
  {
    placeIds: ['dasol-hall', 'bambino-hall', 'future-talent-hall', 'saint-mary-garden'],
    padX: 14,
    padZ: 12,
    height: 3.15,
    color: 0x80a56c,
    thickness: 1.8
  },
  {
    placeIds: ['sacred-heart-chapel', 'sacred-heart-plaza', 'sacred-heart-lawn', 'paolo-hall', 'global-center'],
    padX: 10,
    padZ: 14,
    height: 2.7,
    color: 0x73985f,
    thickness: 1.7
  },
  {
    placeIds: ['michael-admin', 'michael-research', 'veritas-library', 'songsim-hall', 'pharmacy-hall'],
    padX: 16,
    padZ: 14,
    height: 4.45,
    color: 0x8ab275,
    thickness: 1.7
  },
  {
    placeIds: ['concert-hall', 'agora-field', 'tennis-court', 'back-gate'],
    padX: 18,
    padZ: 16,
    height: 5.3,
    color: 0x95bb7d,
    thickness: 1.6
  },
  {
    placeIds: ['francis-dormitory'],
    padX: 12,
    padZ: 8,
    height: 0.85,
    color: 0x688959,
    thickness: 1.5
  }
];

function buildTerrace(seed: TerraceSeed): PlateauSpec {
  const places = seed.placeIds
    .map((placeId) => getCampusPlaceById(placeId))
    .filter((place): place is NonNullable<typeof place> => place !== undefined);

  const minX = Math.min(...places.map((place) => place.x - place.bounds.width / 2)) - seed.padX;
  const maxX = Math.max(...places.map((place) => place.x + place.bounds.width / 2)) + seed.padX;
  const minZ = Math.min(...places.map((place) => place.z - place.bounds.depth / 2)) - seed.padZ;
  const maxZ = Math.max(...places.map((place) => place.z + place.bounds.depth / 2)) + seed.padZ;

  return {
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    width: maxX - minX,
    depth: maxZ - minZ,
    height: seed.height,
    color: seed.color,
    thickness: seed.thickness
  };
}

const TERRACES: PlateauSpec[] = TERRACE_SEEDS.map(buildTerrace);

function inRect(x: number, z: number, plateau: PlateauSpec): boolean {
  return Math.abs(x - plateau.centerX) <= plateau.width / 2 && Math.abs(z - plateau.centerZ) <= plateau.depth / 2;
}

export function groundHeightAt(x: number, z: number): number {
  const southGate = getCampusPlaceById('main-gate');
  let height = 0;

  if (southGate) {
    const northwardGrade = Math.max(0, ((southGate.z - z) / 26) * 0.56);
    const eastwardBias = Math.max(0, ((x - southGate.x) / 96) * 0.26);
    height += northwardGrade + eastwardBias;
  }

  for (const plateau of TERRACES) {
    if (inRect(x, z, plateau)) {
      height = Math.max(height, plateau.height);
    }
  }

  return Number(height.toFixed(2));
}

function createBlock(
  size: THREE.Vector3Like,
  position: THREE.Vector3Like,
  color: number
): THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial> {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size.x, size.y, size.z),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.96,
      metalness: 0.02
    })
  );
  mesh.position.set(position.x, position.y, position.z);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  return mesh;
}

function addPlateau(
  group: THREE.Group,
  sizeX: number,
  sizeZ: number,
  topY: number,
  centerX: number,
  centerZ: number,
  color: number,
  thickness = 1.8
): void {
  group.add(createBlock({ x: sizeX, y: thickness, z: sizeZ }, { x: centerX, y: topY - thickness / 2, z: centerZ }, color));
}

function addRetainingWall(
  group: THREE.Group,
  sizeX: number,
  sizeY: number,
  sizeZ: number,
  x: number,
  y: number,
  z: number,
  color: number
): void {
  group.add(createBlock({ x: sizeX, y: sizeY, z: sizeZ }, { x, y, z }, color));
}

export function createTerrain(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'terrain';

  const centerX = (CAMPUS_WORLD_BOUNDS.minX + CAMPUS_WORLD_BOUNDS.maxX) / 2;
  const centerZ = (CAMPUS_WORLD_BOUNDS.minZ + CAMPUS_WORLD_BOUNDS.maxZ) / 2;

  addPlateau(group, CAMPUS_WIDTH, CAMPUS_DEPTH, 0, centerX, centerZ, 0x5d8251, 4.2);

  for (const terrace of TERRACES) {
    addPlateau(
      group,
      terrace.width,
      terrace.depth,
      terrace.height,
      terrace.centerX,
      terrace.centerZ,
      terrace.color,
      terrace.thickness
    );
  }

  addRetainingWall(group, 92, 2, 2.8, -1, 1.15, 64, 0x62685d);
  addRetainingWall(group, 118, 2.1, 2.8, 4, 2.1, 38, 0x676d62);
  addRetainingWall(group, 124, 2.2, 2.8, 18, 3.15, 10, 0x6b7064);
  addRetainingWall(group, 88, 2.1, 2.8, 24, 4.35, -14, 0x6f7366);

  const saintMaryGarden = getCampusPlaceById('saint-mary-garden');
  const chapelPlaza = getCampusPlaceById('sacred-heart-plaza');
  const tennisCourt = getCampusPlaceById('tennis-court');
  if (saintMaryGarden) {
    addPlateau(
      group,
      saintMaryGarden.bounds.width * 0.92,
      saintMaryGarden.bounds.depth * 0.92,
      groundHeightAt(saintMaryGarden.x, saintMaryGarden.z) + 0.18,
      saintMaryGarden.x,
      saintMaryGarden.z,
      0x8ab56d,
      0.3
    );
  }
  if (chapelPlaza) {
    addPlateau(
      group,
      chapelPlaza.bounds.width * 0.92,
      chapelPlaza.bounds.depth * 0.88,
      groundHeightAt(chapelPlaza.x, chapelPlaza.z) + 0.14,
      chapelPlaza.x,
      chapelPlaza.z,
      0xd8ccb1,
      0.24
    );
  }
  if (tennisCourt) {
    addPlateau(
      group,
      tennisCourt.bounds.width * 0.98,
      tennisCourt.bounds.depth * 0.92,
      groundHeightAt(tennisCourt.x, tennisCourt.z) + 0.1,
      tennisCourt.x,
      tennisCourt.z,
      0xcfc2a4,
      0.18
    );
  }

  return group;
}
