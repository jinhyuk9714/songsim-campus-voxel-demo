import * as THREE from 'three';
import { CAMPUS_PLACES, type CampusFootprint, type CampusPlace } from '../data/campus';
import { groundHeightAt } from './terrain';

export interface BuiltCampus {
  group: THREE.Group;
  pickables: THREE.Object3D[];
  labels: THREE.Sprite[];
}

export type PlaceVariant =
  | 'default'
  | 'multi-mass'
  | 'curved-dorm'
  | 'courtyard'
  | 'track-field'
  | 'plaza'
  | 'court'
  | 'chapel'
  | 'gate';

export interface PlaceProfile {
  variant: PlaceVariant;
  labelScale: number;
}

const PLACE_PROFILES: Record<string, PlaceProfile> = {
  'main-gate': { variant: 'gate', labelScale: 0.92 },
  'kim-sou-hwan': { variant: 'multi-mass', labelScale: 1.05 },
  'andrea-dormitory': { variant: 'curved-dorm', labelScale: 1 },
  'dasol-hall': { variant: 'courtyard', labelScale: 1.04 },
  'saint-mary-garden': { variant: 'plaza', labelScale: 0.92 },
  'agora-field': { variant: 'track-field', labelScale: 0.98 },
  'sacred-heart-chapel': { variant: 'chapel', labelScale: 1.05 },
  'sacred-heart-plaza': { variant: 'plaza', labelScale: 0.98 },
  'tennis-court': { variant: 'court', labelScale: 0.94 },
  'back-gate': { variant: 'gate', labelScale: 0.92 }
};

export function getPlaceProfile(id: string): PlaceProfile {
  return PLACE_PROFILES[id] ?? { variant: 'default', labelScale: 0.92 };
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function createTextSprite(place: CampusPlace, scale: number): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 148;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('2D canvas context not available.');
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(14, 21, 30, 0.85)';
  drawRoundedRect(context, 12, 12, canvas.width - 24, canvas.height - 24, 20);
  context.fill();

  context.strokeStyle = 'rgba(240, 236, 224, 0.16)';
  context.lineWidth = 4;
  context.stroke();

  context.fillStyle = '#d8c59d';
  context.font = 'bold 30px sans-serif';
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.fillText(place.mapIndex, 32, 42);

  context.fillStyle = '#f5f1e7';
  context.font = 'bold 32px sans-serif';
  context.fillText(place.nameKo, 96, 42);

  context.fillStyle = '#c8d4e0';
  context.font = '24px sans-serif';
  context.fillText(place.nameEn, 32, 100);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(14 * scale, 3.25 * scale, 1);
  sprite.userData.place = place;
  return sprite;
}

function createBaseMaterial(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.92,
    metalness: 0.03
  });
}

function markPlaceMesh(mesh: THREE.Mesh, place: CampusPlace): void {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.place = place;
}

function addOutline(target: THREE.Mesh, group: THREE.Group): void {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(target.geometry),
    new THREE.LineBasicMaterial({
      color: 0x18222e,
      transparent: true,
      opacity: 0.2
    })
  );
  edges.position.copy(target.position);
  edges.rotation.copy(target.rotation);
  group.add(edges);
}

function createRectMesh(place: CampusPlace, footprint: Extract<CampusFootprint, { kind: 'rect' }>, yBase: number): THREE.Mesh {
  const height = Math.max(0.3, place.height * (footprint.heightScale ?? 1));
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(footprint.width, height, footprint.depth),
    createBaseMaterial(footprint.color ?? place.color)
  );

  mesh.position.set(
    place.x + (footprint.offsetX ?? 0),
    yBase + (footprint.yOffset ?? 0) + height / 2,
    place.z + (footprint.offsetZ ?? 0)
  );
  mesh.rotation.y = place.rotation + (footprint.rotation ?? 0);
  markPlaceMesh(mesh, place);
  return mesh;
}

function createCircleMesh(place: CampusPlace, footprint: Extract<CampusFootprint, { kind: 'circle' }>, yBase: number): THREE.Mesh {
  const height = Math.max(0.25, place.height * (footprint.heightScale ?? 1));
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(footprint.radius, footprint.radius, height, 20),
    createBaseMaterial(footprint.color ?? place.color)
  );

  mesh.position.set(
    place.x + (footprint.offsetX ?? 0),
    yBase + (footprint.yOffset ?? 0) + height / 2,
    place.z + (footprint.offsetZ ?? 0)
  );
  mesh.rotation.y = place.rotation;
  markPlaceMesh(mesh, place);
  return mesh;
}

function createPolygonShape(points: Array<{ x: number; z: number }>): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(points[0].x, points[0].z);
  for (let index = 1; index < points.length; index += 1) {
    shape.lineTo(points[index].x, points[index].z);
  }
  shape.closePath();
  return shape;
}

function insetPolygonPoints(points: Array<{ x: number; z: number }>, scale: number): Array<{ x: number; z: number }> {
  const centroid = points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x,
      z: accumulator.z + point.z
    }),
    { x: 0, z: 0 }
  );
  const centerX = centroid.x / points.length;
  const centerZ = centroid.z / points.length;

  return points.map((point) => ({
    x: centerX + (point.x - centerX) * scale,
    z: centerZ + (point.z - centerZ) * scale
  }));
}

function createPolygonMesh(
  place: CampusPlace,
  footprint: Extract<CampusFootprint, { kind: 'polygon' }>,
  yBase: number
): THREE.Mesh {
  const height = Math.max(0.3, place.height * (footprint.heightScale ?? 1));
  const geometry = new THREE.ExtrudeGeometry(createPolygonShape(footprint.points), {
    depth: height,
    bevelEnabled: false
  });
  geometry.rotateX(-Math.PI / 2);

  const mesh = new THREE.Mesh(geometry, createBaseMaterial(footprint.color ?? place.color));
  mesh.position.set(
    place.x + (footprint.offsetX ?? 0),
    yBase + (footprint.yOffset ?? 0),
    place.z + (footprint.offsetZ ?? 0)
  );
  mesh.rotation.y = place.rotation + (footprint.rotation ?? 0);
  markPlaceMesh(mesh, place);
  return mesh;
}

function createTrackPlace(place: CampusPlace, footprint: Extract<CampusFootprint, { kind: 'track' }>, yBase: number): THREE.Group {
  const group = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.BoxGeometry(footprint.width, 0.7, footprint.depth),
    createBaseMaterial(place.color)
  );
  outer.position.set(place.x + (footprint.offsetX ?? 0), yBase + 0.35, place.z + (footprint.offsetZ ?? 0));
  outer.rotation.y = place.rotation + (footprint.rotation ?? 0);
  markPlaceMesh(outer, place);
  group.add(outer);
  addOutline(outer, group);

  const innerField = new THREE.Mesh(
    new THREE.BoxGeometry(
      footprint.width - (footprint.fieldInset ?? 4) * 2,
      0.16,
      footprint.depth - (footprint.fieldInset ?? 4) * 2
    ),
    createBaseMaterial(0xb58b58)
  );
  innerField.position.copy(outer.position);
  innerField.position.y = yBase + 0.52;
  innerField.rotation.copy(outer.rotation);
  markPlaceMesh(innerField, place);
  group.add(innerField);

  const bleacher = new THREE.Mesh(
    new THREE.BoxGeometry(footprint.width * 0.18, 1.8, footprint.depth * 0.92),
    createBaseMaterial(0x8b7b68)
  );
  bleacher.position.copy(outer.position);
  bleacher.position.x -= Math.cos(outer.rotation.y) * footprint.width * 0.4;
  bleacher.position.z += Math.sin(outer.rotation.y) * footprint.width * 0.4;
  bleacher.position.y = yBase + 0.9;
  bleacher.rotation.copy(outer.rotation);
  markPlaceMesh(bleacher, place);
  group.add(bleacher);

  return group;
}

function createCourtPlace(place: CampusPlace): THREE.Group {
  const group = new THREE.Group();
  const halfWidth = place.bounds.width / 2;
  const courtWidth = Math.max(halfWidth - 4, 2);
  const lateralOffset = Math.max(courtWidth * 0.3, 5.6);
  const offsetVector = new THREE.Vector3(Math.cos(place.rotation), 0, -Math.sin(place.rotation)).multiplyScalar(lateralOffset);
  const baseY = groundHeightAt(place.x, place.z);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(place.bounds.width, 0.28, place.bounds.depth),
    createBaseMaterial(0xddc5a1)
  );
  base.position.set(place.x, baseY + 0.14, place.z);
  base.rotation.y = place.rotation;
  markPlaceMesh(base, place);
  group.add(base);

  const leftCourt = new THREE.Mesh(
    new THREE.BoxGeometry(courtWidth, 0.22, place.bounds.depth - 2.8),
    createBaseMaterial(0xcfb07b)
  );
  leftCourt.position.set(place.x - offsetVector.x, baseY + 0.26, place.z - offsetVector.z);
  leftCourt.rotation.y = place.rotation;
  markPlaceMesh(leftCourt, place);

  const rightCourt = leftCourt.clone();
  rightCourt.position.set(place.x + offsetVector.x, baseY + 0.26, place.z + offsetVector.z);
  markPlaceMesh(rightCourt, place);

  const divider = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 1.5, place.bounds.depth - 1.2),
    createBaseMaterial(0x586169)
  );
  divider.position.set(place.x, baseY + 0.9, place.z);
  divider.rotation.y = place.rotation;
  markPlaceMesh(divider, place);

  group.add(leftCourt, rightCourt, divider);
  return group;
}

function createGate(place: CampusPlace, yBase: number): THREE.Group {
  const group = new THREE.Group();
  const material = createBaseMaterial(place.color);

  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(1.6, place.height, 1.6), material);
  leftPillar.position.set(place.x - place.bounds.width * 0.36, yBase + place.height / 2, place.z);
  leftPillar.rotation.y = place.rotation;
  markPlaceMesh(leftPillar, place);

  const rightPillar = leftPillar.clone();
  rightPillar.position.x = place.x + place.bounds.width * 0.36;
  markPlaceMesh(rightPillar, place);

  const beam = new THREE.Mesh(new THREE.BoxGeometry(place.bounds.width * 0.92, 1.2, 1.8), material);
  beam.position.set(place.x, yBase + place.height - 0.6, place.z);
  beam.rotation.y = place.rotation;
  markPlaceMesh(beam, place);

  const lintel = new THREE.Mesh(
    new THREE.BoxGeometry(place.bounds.width * 0.42, 0.7, 1.1),
    createBaseMaterial(place.accent ?? 0xa6b3c4)
  );
  lintel.position.set(place.x, yBase + place.height + 0.1, place.z);
  lintel.rotation.y = place.rotation;
  markPlaceMesh(lintel, place);

  group.add(leftPillar, rightPillar, beam, lintel);
  return group;
}

function createPlaceFromFootprints(place: CampusPlace, yBase: number): THREE.Group {
  const group = new THREE.Group();

  for (const footprint of place.footprints) {
    if (footprint.kind === 'track') {
      group.add(createTrackPlace(place, footprint, yBase));
      continue;
    }

    let mesh: THREE.Mesh;
    switch (footprint.kind) {
      case 'rect':
        mesh = createRectMesh(place, footprint, yBase);
        break;
      case 'circle':
        mesh = createCircleMesh(place, footprint, yBase);
        break;
      case 'polygon':
        mesh = createPolygonMesh(place, footprint, yBase);
        break;
    }
    group.add(mesh);

    if (place.height > 1.4) {
      addOutline(mesh, group);
    }

    if (place.category !== 'plaza' && place.category !== 'lawn' && place.category !== 'court' && place.category !== 'sports') {
      const roofHeight = 0.45;
      const roofColor = place.accent ?? 0x394958;
      let roof: THREE.Mesh | null = null;
      const solidHeight = place.height * (footprint.heightScale ?? 1);

      if (footprint.kind === 'rect') {
        roof = new THREE.Mesh(
          new THREE.BoxGeometry(Math.max(footprint.width - 0.6, 0.8), roofHeight, Math.max(footprint.depth - 0.6, 0.8)),
          createBaseMaterial(roofColor)
        );
        roof.position.set(mesh.position.x, mesh.position.y + solidHeight / 2 + roofHeight / 2, mesh.position.z);
        roof.rotation.y = mesh.rotation.y;
      } else if (footprint.kind === 'circle') {
        roof = new THREE.Mesh(
          new THREE.CylinderGeometry(Math.max(footprint.radius - 0.3, 0.6), Math.max(footprint.radius - 0.3, 0.6), roofHeight, 20),
          createBaseMaterial(roofColor)
        );
        roof.position.set(mesh.position.x, mesh.position.y + solidHeight / 2 + roofHeight / 2, mesh.position.z);
        roof.rotation.y = mesh.rotation.y;
      } else if (footprint.kind === 'polygon') {
        const roofGeometry = new THREE.ExtrudeGeometry(createPolygonShape(insetPolygonPoints(footprint.points, 0.92)), {
          depth: roofHeight,
          bevelEnabled: false
        });
        roofGeometry.rotateX(-Math.PI / 2);
        roof = new THREE.Mesh(roofGeometry, createBaseMaterial(roofColor));
        roof.position.set(
          place.x + (footprint.offsetX ?? 0),
          yBase + (footprint.yOffset ?? 0) + solidHeight,
          place.z + (footprint.offsetZ ?? 0)
        );
        roof.rotation.y = place.rotation + (footprint.rotation ?? 0);
      }

      if (roof) {
        roof.castShadow = true;
        roof.receiveShadow = true;
        group.add(roof);
      }
    }
  }

  return group;
}

function createPlace(place: CampusPlace, yBase: number): THREE.Group {
  const profile = getPlaceProfile(place.id);
  let group: THREE.Group;

  if (profile.variant === 'gate') {
    group = createGate(place, yBase);
  } else if (profile.variant === 'court') {
    group = createCourtPlace(place);
  } else {
    group = createPlaceFromFootprints(place, yBase);
  }

  if (profile.variant === 'chapel') {
    const cross = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 2.4, 0.18),
      createBaseMaterial(0xe7dbc1)
    );
    cross.position.set(place.x + 4, yBase + place.height + 3.4, place.z - 2);
    cross.rotation.y = place.rotation;
    cross.castShadow = true;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.18), createBaseMaterial(0xe7dbc1));
    arm.position.set(place.x + 4, yBase + place.height + 4, place.z - 2);
    arm.rotation.y = place.rotation;
    arm.castShadow = true;
    group.add(cross, arm);
  }

  const label = createTextSprite(place, profile.labelScale);
  label.position.set(place.x, yBase + Math.max(place.height + 5.4, 5.2), place.z);
  label.visible = place.landmark;
  group.add(label);

  return group;
}

export function buildCampus(): BuiltCampus {
  const group = new THREE.Group();
  group.name = 'campus-places';

  const pickables: THREE.Object3D[] = [];
  const labels: THREE.Sprite[] = [];

  for (const place of CAMPUS_PLACES) {
    const yBase = groundHeightAt(place.x, place.z);
    const built = createPlace(place, yBase);

    built.traverse((child: THREE.Object3D) => {
      const childPlace = child.userData.place as CampusPlace | undefined;
      if (childPlace && child instanceof THREE.Mesh) {
        pickables.push(child);
      }
      if (child instanceof THREE.Sprite) {
        labels.push(child);
      }
    });

    group.add(built);
  }

  return { group, pickables, labels };
}
