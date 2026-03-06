import * as THREE from 'three';
import { CAMPUS_ROUTES, type CampusRoute } from '../data/campus';
import { groundHeightAt } from './terrain';

export interface RouteStyle {
  surfaceWidth: number;
  shoulderWidth: number;
  stripeMode: 'center' | 'edge' | 'none';
  surfaceColor: number;
  shoulderColor: number;
  stripeColor: number;
  surfaceHeight: number;
  shoulderHeight: number;
  stripeHeight: number;
  curbWidth: number;
  curbHeight: number;
  curbColor: number;
}

export interface RouteGeometryProfile {
  nodeKind: 'gateway' | 'frontage' | 'terrace' | 'ridge' | 'precinct';
  landingScale: number;
  internalLandings: 'ends' | 'bends' | 'all';
  stairCue: boolean;
  softenShoulders: boolean;
}

const ROUTE_STYLE_BY_KIND: Record<CampusRoute['kind'], Omit<RouteStyle, 'surfaceWidth' | 'shoulderWidth'>> = {
  main: {
    stripeMode: 'center',
    surfaceColor: 0x697177,
    shoulderColor: 0xd0c0a2,
    stripeColor: 0xf2ead8,
    surfaceHeight: 0.22,
    shoulderHeight: 0.16,
    stripeHeight: 0.04,
    curbWidth: 0.16,
    curbHeight: 0.09,
    curbColor: 0xe6dbc2
  },
  secondary: {
    stripeMode: 'edge',
    surfaceColor: 0x777d82,
    shoulderColor: 0xd4c7ac,
    stripeColor: 0xeee4d0,
    surfaceHeight: 0.18,
    shoulderHeight: 0.13,
    stripeHeight: 0.03,
    curbWidth: 0.08,
    curbHeight: 0.05,
    curbColor: 0xe9dfcb
  },
  scenic: {
    stripeMode: 'none',
    surfaceColor: 0xb89f78,
    shoulderColor: 0xd9caab,
    stripeColor: 0xe4d8c2,
    surfaceHeight: 0.14,
    shoulderHeight: 0.09,
    stripeHeight: 0.03,
    curbWidth: 0,
    curbHeight: 0,
    curbColor: 0xd9caab
  }
};

const ROUTE_STYLE_OVERRIDES: Partial<Record<string, Partial<Omit<RouteStyle, 'surfaceWidth' | 'shoulderWidth'>>>> = {
  'truth-road': {
    surfaceColor: 0x656d74,
    shoulderColor: 0xd2c3a5
  },
  'jibong-road': {
    stripeMode: 'none',
    surfaceColor: 0x62696f,
    shoulderColor: 0xcdbc9d,
    curbWidth: 0.14
  },
  'chapel-precinct': {
    stripeMode: 'none',
    surfaceColor: 0xc4ad86,
    shoulderColor: 0xe0d1b5,
    curbWidth: 0
  },
  'rear-gate-link': {
    stripeMode: 'edge',
    surfaceColor: 0x7d807b
  },
  'raphael-road': {
    surfaceColor: 0xb59a74,
    shoulderColor: 0xd9caab
  },
  'gabriel-road': {
    surfaceColor: 0xad936e,
    shoulderColor: 0xd3c09f
  }
};

const ROUTE_GEOMETRY_BY_KIND: Record<CampusRoute['kind'], RouteGeometryProfile> = {
  main: {
    nodeKind: 'frontage',
    landingScale: 2.2,
    internalLandings: 'bends',
    stairCue: false,
    softenShoulders: false
  },
  secondary: {
    nodeKind: 'terrace',
    landingScale: 1.9,
    internalLandings: 'bends',
    stairCue: false,
    softenShoulders: false
  },
  scenic: {
    nodeKind: 'ridge',
    landingScale: 1.45,
    internalLandings: 'ends',
    stairCue: false,
    softenShoulders: true
  }
};

const ROUTE_GEOMETRY_OVERRIDES: Partial<Record<string, Partial<RouteGeometryProfile>>> = {
  'truth-road': {
    nodeKind: 'gateway',
    landingScale: 2.85,
    internalLandings: 'bends',
    stairCue: true
  },
  'jibong-road': {
    nodeKind: 'frontage',
    landingScale: 2.35,
    internalLandings: 'bends'
  },
  'faith-road': {
    nodeKind: 'terrace',
    landingScale: 1.75,
    internalLandings: 'all'
  },
  'dasol-road': {
    nodeKind: 'terrace',
    landingScale: 1.95,
    internalLandings: 'all'
  },
  'wisdom-road': {
    nodeKind: 'terrace',
    landingScale: 2.25,
    internalLandings: 'all'
  },
  'rear-gate-link': {
    nodeKind: 'terrace',
    landingScale: 1.7,
    internalLandings: 'bends',
    stairCue: true
  },
  'chapel-precinct': {
    nodeKind: 'precinct',
    landingScale: 2.1,
    internalLandings: 'all',
    stairCue: true
  },
  'raphael-road': {
    nodeKind: 'ridge',
    landingScale: 1.6,
    internalLandings: 'ends',
    softenShoulders: true
  },
  'gabriel-road': {
    nodeKind: 'ridge',
    landingScale: 1.4,
    internalLandings: 'ends',
    softenShoulders: true
  }
};

function getRoute(routeId: string): CampusRoute | undefined {
  return CAMPUS_ROUTES.find((item) => item.id === routeId);
}

export function getRouteStyle(routeId: string): RouteStyle {
  const route = getRoute(routeId);
  if (!route) {
    return {
      ...ROUTE_STYLE_BY_KIND.secondary,
      surfaceWidth: 4.2,
      shoulderWidth: 0.63
    };
  }

  const template = ROUTE_STYLE_BY_KIND[route.kind];
  const override = ROUTE_STYLE_OVERRIDES[route.id] ?? {};
  const shoulderRatio = route.kind === 'main' ? 0.17 : route.kind === 'secondary' ? 0.15 : 0.1;

  return {
    ...template,
    ...override,
    surfaceWidth: route.width,
    shoulderWidth: Number((route.width * shoulderRatio).toFixed(2))
  };
}

export function getRouteGeometryProfile(routeId: string): RouteGeometryProfile {
  const route = getRoute(routeId);
  if (!route) {
    return ROUTE_GEOMETRY_BY_KIND.secondary;
  }

  return {
    ...ROUTE_GEOMETRY_BY_KIND[route.kind],
    ...(ROUTE_GEOMETRY_OVERRIDES[route.id] ?? {})
  };
}

function pathToVectors(path: CampusRoute): THREE.Vector3[] {
  return path.points.map((point) => new THREE.Vector3(point.x, groundHeightAt(point.x, point.z) + 0.16, point.z));
}

function createLinearStrip(
  start: THREE.Vector3,
  end: THREE.Vector3,
  width: number,
  height: number,
  color: number,
  yOffset = 0,
  lateralOffset = 0
): THREE.Mesh {
  const delta = end.clone().sub(start);
  const length = delta.length();
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, length),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 1,
      metalness: 0
    })
  );

  const center = start.clone().add(end).multiplyScalar(0.5);
  if (lateralOffset !== 0) {
    const normal = new THREE.Vector3(delta.z, 0, -delta.x).normalize().multiplyScalar(lateralOffset);
    center.add(normal);
  }

  mesh.position.copy(center);
  mesh.position.y += yOffset;
  mesh.rotation.y = Math.atan2(delta.x, delta.z);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  return mesh;
}

function createStairCue(start: THREE.Vector3, end: THREE.Vector3, style: RouteStyle): THREE.Group | null {
  const rise = Math.abs(end.y - start.y);
  const delta = end.clone().sub(start);
  const length = delta.length();
  if (rise < 0.45 || length < style.surfaceWidth * 1.3) {
    return null;
  }

  const group = new THREE.Group();
  const steps = THREE.MathUtils.clamp(Math.round(length / 2.2), 4, 8);
  const material = new THREE.MeshStandardMaterial({ color: style.stripeColor, roughness: 1, metalness: 0 });
  const angle = Math.atan2(delta.x, delta.z);

  for (let index = 1; index <= steps; index += 1) {
    const t = index / (steps + 1);
    const position = start.clone().lerp(end, t);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(style.surfaceWidth * 0.82, 0.035, 0.26), material);
    strip.position.copy(position);
    strip.position.y += 0.12;
    strip.rotation.y = angle;
    strip.receiveShadow = true;
    group.add(strip);
  }

  return group;
}

function createSegment(
  start: THREE.Vector3,
  end: THREE.Vector3,
  style: RouteStyle,
  profile: RouteGeometryProfile
): THREE.Group {
  const group = new THREE.Group();
  const shoulderHeight = profile.softenShoulders ? style.shoulderHeight * 0.72 : style.shoulderHeight;

  const shoulder = createLinearStrip(
    start,
    end,
    style.surfaceWidth + style.shoulderWidth * 2,
    shoulderHeight,
    style.shoulderColor,
    -0.05
  );
  group.add(shoulder);

  const surface = createLinearStrip(start, end, style.surfaceWidth, style.surfaceHeight, style.surfaceColor);
  group.add(surface);

  if (style.curbWidth > 0) {
    const curbOffset = style.surfaceWidth / 2 - style.curbWidth / 2;
    group.add(
      createLinearStrip(start, end, style.curbWidth, style.curbHeight, style.curbColor, style.surfaceHeight * 0.45, curbOffset)
    );
    group.add(
      createLinearStrip(start, end, style.curbWidth, style.curbHeight, style.curbColor, style.surfaceHeight * 0.45, -curbOffset)
    );
  }

  if (style.stripeMode === 'center') {
    group.add(
      createLinearStrip(start, end, style.surfaceWidth * 0.1, style.stripeHeight, style.stripeColor, style.surfaceHeight * 0.58)
    );
  }

  if (style.stripeMode === 'edge') {
    const stripeOffset = style.surfaceWidth * 0.34;
    group.add(
      createLinearStrip(start, end, style.surfaceWidth * 0.07, style.stripeHeight, style.stripeColor, style.surfaceHeight * 0.55, stripeOffset)
    );
    group.add(
      createLinearStrip(start, end, style.surfaceWidth * 0.07, style.stripeHeight, style.stripeColor, style.surfaceHeight * 0.55, -stripeOffset)
    );
  }

  if (profile.stairCue) {
    const stairs = createStairCue(start, end, style);
    if (stairs) {
      group.add(stairs);
    }
  }

  return group;
}

function getVertexTangent(vectors: THREE.Vector3[], index: number, closed = false): THREE.Vector3 {
  const previousIndex = index === 0 ? (closed ? vectors.length - 1 : 0) : index - 1;
  const nextIndex = index === vectors.length - 1 ? (closed ? 0 : vectors.length - 1) : index + 1;
  const previous = vectors[previousIndex];
  const next = vectors[nextIndex];

  if (nextIndex === index) {
    return vectors[index].clone().sub(previous).setY(0).normalize();
  }
  if (previousIndex === index) {
    return next.clone().sub(vectors[index]).setY(0).normalize();
  }

  return next.clone().sub(previous).setY(0).normalize();
}

function getTurnAmount(vectors: THREE.Vector3[], index: number): number {
  if (index === 0 || index === vectors.length - 1) {
    return Math.PI;
  }

  const incoming = vectors[index].clone().sub(vectors[index - 1]).setY(0).normalize();
  const outgoing = vectors[index + 1].clone().sub(vectors[index]).setY(0).normalize();
  return incoming.angleTo(outgoing);
}

function shouldPlaceLanding(vectors: THREE.Vector3[], index: number, profile: RouteGeometryProfile): boolean {
  if (index === 0 || index === vectors.length - 1) {
    return true;
  }

  if (profile.internalLandings === 'all') {
    return true;
  }

  if (profile.internalLandings === 'ends') {
    return false;
  }

  return getTurnAmount(vectors, index) > 0.24;
}

function createRectLanding(
  position: THREE.Vector3,
  angle: number,
  width: number,
  depth: number,
  style: RouteStyle,
  stripeMode: RouteStyle['stripeMode']
): THREE.Group {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(width, style.shoulderHeight + 0.03, depth),
    new THREE.MeshStandardMaterial({ color: style.shoulderColor, roughness: 1, metalness: 0 })
  );
  base.position.copy(position);
  base.position.y -= 0.01;
  base.rotation.y = angle;
  base.receiveShadow = true;

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.74, style.surfaceHeight, depth * 0.68),
    new THREE.MeshStandardMaterial({ color: style.surfaceColor, roughness: 1, metalness: 0 })
  );
  top.position.copy(position);
  top.position.y += 0.05;
  top.rotation.y = angle;
  top.receiveShadow = true;

  group.add(base, top);

  if (stripeMode === 'center') {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.1, style.stripeHeight, depth * 0.62),
      new THREE.MeshStandardMaterial({ color: style.stripeColor, roughness: 1, metalness: 0 })
    );
    stripe.position.copy(position);
    stripe.position.y += 0.12;
    stripe.rotation.y = angle;
    stripe.receiveShadow = true;
    group.add(stripe);
  }

  if (stripeMode === 'edge') {
    const offset = width * 0.27;
    for (const direction of [-1, 1] as const) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.06, style.stripeHeight, depth * 0.52),
        new THREE.MeshStandardMaterial({ color: style.stripeColor, roughness: 1, metalness: 0 })
      );
      const localOffset = new THREE.Vector3(direction * offset, 0.12, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      stripe.position.copy(position).add(localOffset);
      stripe.rotation.y = angle;
      stripe.receiveShadow = true;
      group.add(stripe);
    }
  }

  return group;
}

function createPrecinctLanding(position: THREE.Vector3, angle: number, width: number, style: RouteStyle): THREE.Group {
  const group = createRectLanding(position, angle, width, width * 0.88, style, 'none');

  const circle = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 0.16, width * 0.16, 0.05, 18),
    new THREE.MeshStandardMaterial({ color: style.stripeColor, roughness: 1, metalness: 0 })
  );
  circle.position.copy(position);
  circle.position.y += 0.12;
  group.add(circle);

  return group;
}

function createRidgeLanding(position: THREE.Vector3, angle: number, width: number, style: RouteStyle): THREE.Group {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 0.42, width * 0.42, 0.12, 18),
    new THREE.MeshStandardMaterial({ color: style.shoulderColor, roughness: 1, metalness: 0 })
  );
  base.position.copy(position);
  base.receiveShadow = true;

  const bar = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.62, 0.08, width * 1.2),
    new THREE.MeshStandardMaterial({ color: style.surfaceColor, roughness: 1, metalness: 0 })
  );
  bar.position.copy(position);
  bar.position.y += 0.05;
  bar.rotation.y = angle;
  bar.receiveShadow = true;

  group.add(base, bar);
  return group;
}

function createLanding(
  position: THREE.Vector3,
  tangent: THREE.Vector3,
  style: RouteStyle,
  profile: RouteGeometryProfile,
  emphasis: number
): THREE.Group {
  const angle = Math.atan2(tangent.x, tangent.z);
  const width = style.surfaceWidth * profile.landingScale * emphasis;

  switch (profile.nodeKind) {
    case 'gateway':
      return createRectLanding(position, angle, width, width * 0.78, style, 'center');
    case 'frontage':
      return createRectLanding(position, angle, width, width * 0.68, style, style.stripeMode);
    case 'terrace':
      return createRectLanding(position, angle, width, width * 0.72, style, 'edge');
    case 'precinct':
      return createPrecinctLanding(position, angle, width, style);
    case 'ridge':
      return createRidgeLanding(position, angle, width, style);
  }
}

export function createRoads(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'roads';

  for (const route of CAMPUS_ROUTES) {
    const vectors = pathToVectors(route);
    const style = getRouteStyle(route.id);
    const profile = getRouteGeometryProfile(route.id);

    for (let index = 0; index < vectors.length - 1; index += 1) {
      group.add(createSegment(vectors[index], vectors[index + 1], style, profile));
    }

    if (route.closed && vectors.length > 2) {
      group.add(createSegment(vectors[vectors.length - 1], vectors[0], style, profile));
    }

    for (let index = 0; index < vectors.length; index += 1) {
      if (!shouldPlaceLanding(vectors, index, profile)) {
        continue;
      }

      const tangent = getVertexTangent(vectors, index, Boolean(route.closed));
      const emphasis = index === 0 || index === vectors.length - 1 ? 1 : 0.84;
      group.add(createLanding(vectors[index], tangent, style, profile, emphasis));
    }
  }

  return group;
}
