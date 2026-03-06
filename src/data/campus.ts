export type CampusPlaceCategory =
  | 'gate'
  | 'academic'
  | 'dormitory'
  | 'library'
  | 'green'
  | 'performance'
  | 'sports'
  | 'religious'
  | 'support'
  | 'admin'
  | 'plaza'
  | 'lawn'
  | 'court';

export interface CampusBounds {
  width: number;
  depth: number;
}

export interface CampusMapPoint {
  x: number;
  y: number;
}

export interface CampusMapBounds {
  width: number;
  height: number;
}

export interface FootprintRect {
  kind: 'rect';
  width: number;
  depth: number;
  offsetX?: number;
  offsetZ?: number;
  rotation?: number;
  heightScale?: number;
  yOffset?: number;
  color?: number;
}

export interface FootprintCircle {
  kind: 'circle';
  radius: number;
  offsetX?: number;
  offsetZ?: number;
  heightScale?: number;
  yOffset?: number;
  color?: number;
}

export interface FootprintTrack {
  kind: 'track';
  width: number;
  depth: number;
  offsetX?: number;
  offsetZ?: number;
  rotation?: number;
  laneWidth?: number;
  fieldInset?: number;
  color?: number;
}

export interface FootprintPolygon {
  kind: 'polygon';
  points: Array<{ x: number; z: number }>;
  offsetX?: number;
  offsetZ?: number;
  rotation?: number;
  heightScale?: number;
  yOffset?: number;
  color?: number;
}

export type CampusFootprint = FootprintRect | FootprintCircle | FootprintTrack | FootprintPolygon;

export interface CampusPlace {
  mapIndex: string;
  sortOrder: number;
  id: string;
  code?: string;
  nameKo: string;
  nameEn: string;
  category: CampusPlaceCategory;
  mapPosition: CampusMapPoint;
  mapBounds: CampusMapBounds;
  x: number;
  z: number;
  rotation: number;
  bounds: CampusBounds;
  height: number;
  color: number;
  accent?: number;
  selectable: boolean;
  landmark: boolean;
  footprints: CampusFootprint[];
  note: string;
}

export interface CampusRoute {
  id: string;
  nameKo: string;
  width: number;
  kind: 'main' | 'secondary' | 'scenic';
  closed?: boolean;
  mapPoints: CampusMapPoint[];
  points: Array<{ x: number; z: number }>;
}

export interface TreeZone {
  id: string;
  centerX: number;
  centerZ: number;
  radiusX: number;
  radiusZ: number;
  density: number;
}

interface MapFootprintRect {
  kind: 'rect';
  width: number;
  depth: number;
  offsetX?: number;
  offsetZ?: number;
  rotation?: number;
  heightScale?: number;
  yOffset?: number;
  color?: number;
}

interface MapFootprintCircle {
  kind: 'circle';
  radius: number;
  offsetX?: number;
  offsetZ?: number;
  heightScale?: number;
  yOffset?: number;
  color?: number;
}

interface MapFootprintTrack {
  kind: 'track';
  width: number;
  depth: number;
  offsetX?: number;
  offsetZ?: number;
  rotation?: number;
  laneWidth?: number;
  fieldInset?: number;
  color?: number;
}

interface MapFootprintPolygon {
  kind: 'polygon';
  points: Array<{ x: number; z: number }>;
  offsetX?: number;
  offsetZ?: number;
  rotation?: number;
  heightScale?: number;
  yOffset?: number;
  color?: number;
}

type MapCampusFootprint = MapFootprintRect | MapFootprintCircle | MapFootprintTrack | MapFootprintPolygon;

interface RawCampusPlace {
  mapIndex: string;
  sortOrder: number;
  id: string;
  code?: string;
  nameKo: string;
  nameEn: string;
  category: CampusPlaceCategory;
  mapPosition: CampusMapPoint;
  mapBounds: CampusMapBounds;
  rotation: number;
  height: number;
  color: number;
  accent?: number;
  selectable: boolean;
  landmark: boolean;
  footprints: MapCampusFootprint[];
  note: string;
}

interface RawCampusRoute {
  id: string;
  nameKo: string;
  width: number;
  kind: 'main' | 'secondary' | 'scenic';
  closed?: boolean;
  mapPoints: CampusMapPoint[];
}

interface RawTreeZone {
  id: string;
  center: CampusMapPoint;
  radiusX: number;
  radiusY: number;
  density: number;
}

export const CAMPUS_WORLD_BOUNDS = {
  minX: -76,
  maxX: 122,
  minZ: -58,
  maxZ: 112
} as const;

export const OFFICIAL_MAP_FRAME = {
  width: 1000,
  height: 860
} as const;

const WORLD_WIDTH = CAMPUS_WORLD_BOUNDS.maxX - CAMPUS_WORLD_BOUNDS.minX;
const WORLD_DEPTH = CAMPUS_WORLD_BOUNDS.maxZ - CAMPUS_WORLD_BOUNDS.minZ;

function projectMapWidthToWorld(width: number): number {
  return (width / OFFICIAL_MAP_FRAME.width) * WORLD_WIDTH;
}

function projectMapHeightToWorld(height: number): number {
  return (height / OFFICIAL_MAP_FRAME.height) * WORLD_DEPTH;
}

export function projectMapPointToWorld(point: CampusMapPoint): { x: number; z: number } {
  return {
    x: CAMPUS_WORLD_BOUNDS.minX + projectMapWidthToWorld(point.x),
    z: CAMPUS_WORLD_BOUNDS.minZ + projectMapHeightToWorld(point.y)
  };
}

function projectMapBoundsToWorld(bounds: CampusMapBounds): CampusBounds {
  return {
    width: projectMapWidthToWorld(bounds.width),
    depth: projectMapHeightToWorld(bounds.height)
  };
}

function projectFootprintToWorld(footprint: MapCampusFootprint): CampusFootprint {
  switch (footprint.kind) {
    case 'rect':
      return {
        ...footprint,
        width: projectMapWidthToWorld(footprint.width),
        depth: projectMapHeightToWorld(footprint.depth),
        offsetX: footprint.offsetX ? projectMapWidthToWorld(footprint.offsetX) : undefined,
        offsetZ: footprint.offsetZ ? projectMapHeightToWorld(footprint.offsetZ) : undefined
      };
    case 'circle':
      return {
        ...footprint,
        radius: (projectMapWidthToWorld(footprint.radius * 2) + projectMapHeightToWorld(footprint.radius * 2)) / 4,
        offsetX: footprint.offsetX ? projectMapWidthToWorld(footprint.offsetX) : undefined,
        offsetZ: footprint.offsetZ ? projectMapHeightToWorld(footprint.offsetZ) : undefined
      };
    case 'track':
      return {
        ...footprint,
        width: projectMapWidthToWorld(footprint.width),
        depth: projectMapHeightToWorld(footprint.depth),
        offsetX: footprint.offsetX ? projectMapWidthToWorld(footprint.offsetX) : undefined,
        offsetZ: footprint.offsetZ ? projectMapHeightToWorld(footprint.offsetZ) : undefined,
        laneWidth: footprint.laneWidth ? projectMapWidthToWorld(footprint.laneWidth) : undefined,
        fieldInset: footprint.fieldInset ? projectMapWidthToWorld(footprint.fieldInset) : undefined
      };
    case 'polygon':
      return {
        ...footprint,
        offsetX: footprint.offsetX ? projectMapWidthToWorld(footprint.offsetX) : undefined,
        offsetZ: footprint.offsetZ ? projectMapHeightToWorld(footprint.offsetZ) : undefined,
        points: footprint.points.map((point) => ({
          x: projectMapWidthToWorld(point.x),
          z: projectMapHeightToWorld(point.z)
        }))
      };
  }
}

function polygonPoints(points: Array<[number, number]>): Array<{ x: number; z: number }> {
  return points.map(([x, z]) => ({ x, z }));
}

const RAW_CAMPUS_PLACES: RawCampusPlace[] = [
  {
    mapIndex: '1',
    sortOrder: 1,
    id: 'main-gate',
    nameKo: '정문',
    nameEn: 'Main Gate',
    category: 'gate',
    mapPosition: { x: 92, y: 772 },
    mapBounds: { width: 28, height: 18 },
    rotation: 0.12,
    height: 6,
    color: 0x5b6470,
    accent: 0xa6b3c4,
    selectable: true,
    landmark: true,
    footprints: [{ kind: 'rect', width: 24, depth: 8 }],
    note: 'Official main entry on the southern edge of Songsim Campus.'
  },
  {
    mapIndex: '2',
    sortOrder: 2,
    id: 'incubator-center',
    nameKo: '창업보육센터',
    nameEn: 'Business Incubator Center',
    category: 'support',
    mapPosition: { x: 102, y: 704 },
    mapBounds: { width: 24, height: 60 },
    rotation: 0.08,
    height: 10,
    color: 0xb7694d,
    accent: 0x344357,
    selectable: true,
    landmark: false,
    footprints: [{ kind: 'rect', width: 18, depth: 52 }],
    note: 'Support facility just inside the main gate approach.'
  },
  {
    mapIndex: '3',
    sortOrder: 3,
    id: 'kim-sou-hwan',
    code: 'K',
    nameKo: '김수환관',
    nameEn: 'Kim Sou Hwan Hall',
    category: 'academic',
    mapPosition: { x: 145, y: 694 },
    mapBounds: { width: 94, height: 108 },
    rotation: -0.05,
    height: 20,
    color: 0xc9734e,
    accent: 0x39414d,
    selectable: true,
    landmark: true,
    footprints: [
      {
        kind: 'polygon',
        points: polygonPoints([
          [-48, 46],
          [-48, 10],
          [-42, -18],
          [-20, -50],
          [14, -54],
          [40, -32],
          [48, 4],
          [40, 46]
        ]),
        heightScale: 0.92
      },
      { kind: 'rect', width: 32, depth: 30, offsetX: 18, offsetZ: 8, heightScale: 0.62, color: 0x8e563b }
    ],
    note: 'Primary lower-campus academic anchor shown north-west of the main gate.'
  },
  {
    mapIndex: '4',
    sortOrder: 4,
    id: 'stefano-dormitory',
    code: 'K',
    nameKo: '스테파노기숙사',
    nameEn: 'Stefano Dormitory',
    category: 'dormitory',
    mapPosition: { x: 148, y: 612 },
    mapBounds: { width: 80, height: 84 },
    rotation: -0.08,
    height: 16,
    color: 0xbf7c59,
    accent: 0x324150,
    selectable: true,
    landmark: true,
    footprints: [
      { kind: 'rect', width: 74, depth: 80 },
      { kind: 'rect', width: 24, depth: 22, offsetX: 18, offsetZ: -24, heightScale: 0.72, color: 0xa86549 }
    ],
    note: 'Dormitory mass west of Kim Sou Hwan Hall.'
  },
  {
    mapIndex: '5',
    sortOrder: 5,
    id: 'andrea-dormitory',
    code: 'A',
    nameKo: '안드레아관(기숙사)',
    nameEn: 'Andrea Hall Dormitory',
    category: 'dormitory',
    mapPosition: { x: 236, y: 612 },
    mapBounds: { width: 116, height: 70 },
    rotation: -0.02,
    height: 18,
    color: 0xd18b66,
    accent: 0x314054,
    selectable: true,
    landmark: true,
    footprints: [
      {
        kind: 'polygon',
        points: polygonPoints([
          [-56, 10],
          [-50, -12],
          [-30, -28],
          [10, -30],
          [42, -22],
          [58, -8],
          [58, 8],
          [44, 22],
          [8, 24],
          [-22, 22]
        ]),
        heightScale: 0.96
      },
      { kind: 'circle', radius: 12, offsetX: -40, offsetZ: -2, heightScale: 0.88, color: 0xca8562 }
    ],
    note: 'Curved dormitory volume beside Andrea Maru Plaza.'
  },
  {
    mapIndex: '5-1',
    sortOrder: 5.1,
    id: 'andrea-maru-plaza',
    nameKo: '안드레아 마루광장',
    nameEn: 'Andrea Maru Plaza',
    category: 'plaza',
    mapPosition: { x: 256, y: 664 },
    mapBounds: { width: 62, height: 42 },
    rotation: -0.08,
    height: 1.4,
    color: 0xd0c29f,
    accent: 0xb09670,
    selectable: true,
    landmark: true,
    footprints: [
      {
        kind: 'polygon',
        points: polygonPoints([
          [-30, 2],
          [-18, -18],
          [10, -20],
          [26, -10],
          [30, 10],
          [16, 20],
          [-10, 20],
          [-28, 12]
        ]),
        rotation: -0.08
      },
      {
        kind: 'polygon',
        points: polygonPoints([
          [8, -12],
          [28, -8],
          [28, 8],
          [12, 12]
        ]),
        offsetX: 10,
        offsetZ: -2,
        rotation: -0.08,
        color: 0xd6c6a5
      }
    ],
    note: 'Open plaza paired with Andrea Hall in the lower academic zone.'
  },
  {
    mapIndex: '6',
    sortOrder: 6,
    id: 'maria-hall',
    code: 'M',
    nameKo: '마리아관',
    nameEn: 'Maria Hall',
    category: 'academic',
    mapPosition: { x: 332, y: 610 },
    mapBounds: { width: 54, height: 140 },
    rotation: 0.06,
    height: 10,
    color: 0xaeb6c0,
    accent: 0x45596b,
    selectable: true,
    landmark: true,
    footprints: [{ kind: 'rect', width: 48, depth: 132 }],
    note: 'Linear academic block east of Andrea Hall.'
  },
  {
    mapIndex: '7',
    sortOrder: 7,
    id: 'nichols-hall',
    code: 'N',
    nameKo: '니콜스관',
    nameEn: 'Nichols Hall',
    category: 'academic',
    mapPosition: { x: 286, y: 538 },
    mapBounds: { width: 126, height: 44 },
    rotation: 0,
    height: 12,
    color: 0xa9b3be,
    accent: 0x496173,
    selectable: true,
    landmark: true,
    footprints: [{ kind: 'rect', width: 122, depth: 38 }],
    note: 'Main middle-campus bar facing the lower court.'
  },
  {
    mapIndex: '8',
    sortOrder: 8,
    id: 'bambino-hall',
    code: 'BA',
    nameKo: '밤비노관',
    nameEn: 'Bambino Hall',
    category: 'support',
    mapPosition: { x: 271, y: 504 },
    mapBounds: { width: 38, height: 40 },
    rotation: 0.16,
    height: 8,
    color: 0x6e8faf,
    accent: 0x314357,
    selectable: true,
    landmark: false,
    footprints: [{ kind: 'polygon', points: polygonPoints([[-16, 0], [0, -18], [18, -2], [4, 18]]) }],
    note: 'Small support building between Nichols Hall and the central court.'
  },
  {
    mapIndex: '9',
    sortOrder: 9,
    id: 'dasol-hall',
    code: 'D',
    nameKo: '다솔관',
    nameEn: 'Dasol Hall',
    category: 'academic',
    mapPosition: { x: 268, y: 428 },
    mapBounds: { width: 112, height: 102 },
    rotation: 0,
    height: 18,
    color: 0xc77956,
    accent: 0x344351,
    selectable: true,
    landmark: true,
    footprints: [
      {
        kind: 'polygon',
        points: polygonPoints([
          [-56, -50],
          [56, -50],
          [56, -24],
          [18, -24],
          [18, 50],
          [-20, 50],
          [-20, -16],
          [-56, -16]
        ])
      },
      { kind: 'rect', width: 28, depth: 102, offsetX: -40, color: 0xb66b4d },
      { kind: 'rect', width: 24, depth: 88, offsetX: 40, offsetZ: -10, color: 0xb66b4d }
    ],
    note: 'Courtyard-like academic mass in the western central zone.'
  },
  {
    mapIndex: '10',
    sortOrder: 10,
    id: 'virtus-hall',
    code: 'V',
    nameKo: '비르투스관',
    nameEn: 'Virtus Hall',
    category: 'academic',
    mapPosition: { x: 236, y: 514 },
    mapBounds: { width: 44, height: 56 },
    rotation: 0,
    height: 10,
    color: 0x7ea3b7,
    accent: 0x304050,
    selectable: true,
    landmark: false,
    footprints: [{ kind: 'rect', width: 40, depth: 50 }],
    note: 'Smaller hall south of Dasol Hall.'
  },
  {
    mapIndex: '11',
    sortOrder: 11,
    id: 'future-talent-hall',
    code: 'B',
    nameKo: '학생미래인재관',
    nameEn: 'Student Future Talent Hall',
    category: 'support',
    mapPosition: { x: 392, y: 470 },
    mapBounds: { width: 116, height: 72 },
    rotation: -0.04,
    height: 11,
    color: 0xbd7b52,
    accent: 0x344455,
    selectable: true,
    landmark: true,
    footprints: [
      { kind: 'polygon', points: polygonPoints([[-52, -22], [52, -22], [52, 22], [16, 22], [8, 34], [-52, 34]]) }
    ],
    note: 'Sophia Bara Hall cluster east of Dasol Hall.'
  },
  {
    mapIndex: '12',
    sortOrder: 12,
    id: 'saint-mary-garden',
    nameKo: '성모동산',
    nameEn: 'Saint Mary Garden',
    category: 'green',
    mapPosition: { x: 520, y: 548 },
    mapBounds: { width: 136, height: 124 },
    rotation: 0,
    height: 1.6,
    color: 0x88b46b,
    accent: 0x557b42,
    selectable: true,
    landmark: true,
    footprints: [
      {
        kind: 'polygon',
        points: polygonPoints([
          [-64, -24],
          [-48, -60],
          [24, -60],
          [62, -12],
          [56, 44],
          [12, 60],
          [-42, 54],
          [-64, 18]
        ])
      },
      {
        kind: 'polygon',
        points: polygonPoints([[-16, 4], [10, -18], [30, -2], [18, 22], [-8, 18]]),
        color: 0xceb483,
        heightScale: 0.55
      }
    ],
    note: 'Garden court and devotional green space east of the central academic blocks.'
  },
  {
    mapIndex: '13',
    sortOrder: 13,
    id: 'michael-admin',
    code: 'H',
    nameKo: '미카엘관(행정동)',
    nameEn: 'Michael Hall Administration',
    category: 'admin',
    mapPosition: { x: 404, y: 334 },
    mapBounds: { width: 84, height: 58 },
    rotation: 0.02,
    height: 16,
    color: 0xc57c54,
    accent: 0x33414d,
    selectable: true,
    landmark: true,
    footprints: [{ kind: 'rect', width: 78, depth: 52 }],
    note: 'Administrative Michael Hall block at the upper central shelf.'
  },
  {
    mapIndex: '14',
    sortOrder: 14,
    id: 'michael-research',
    code: 'T',
    nameKo: '미카엘관(교수연구동)',
    nameEn: 'Michael Hall Faculty Research Wing',
    category: 'academic',
    mapPosition: { x: 348, y: 300 },
    mapBounds: { width: 54, height: 66 },
    rotation: -0.03,
    height: 15,
    color: 0xb5c0cc,
    accent: 0x445a6d,
    selectable: true,
    landmark: true,
    footprints: [{ kind: 'rect', width: 50, depth: 60 }],
    note: 'Research wing west of the central library.'
  },
  {
    mapIndex: '15',
    sortOrder: 15,
    id: 'veritas-library',
    code: 'L',
    nameKo: '중앙도서관(베리타스관)',
    nameEn: 'Central Library Veritas Hall',
    category: 'library',
    mapPosition: { x: 494, y: 334 },
    mapBounds: { width: 118, height: 68 },
    rotation: 0,
    height: 14,
    color: 0x9cabbb,
    accent: 0x485d71,
    selectable: true,
    landmark: true,
    footprints: [
      {
        kind: 'polygon',
        points: polygonPoints([
          [-60, -30],
          [60, -30],
          [60, 32],
          [18, 32],
          [4, 18],
          [-22, 18],
          [-30, 10],
          [-60, 10]
        ])
      }
    ],
    note: 'Low broad library slab at the center of the upper academic ridge.'
  },
  {
    mapIndex: '16',
    sortOrder: 16,
    id: 'songsim-hall',
    code: 'SH',
    nameKo: '성심관',
    nameEn: 'Songsim Hall',
    category: 'academic',
    mapPosition: { x: 556, y: 186 },
    mapBounds: { width: 46, height: 86 },
    rotation: 0,
    height: 16,
    color: 0xadbac7,
    accent: 0x445c71,
    selectable: true,
    landmark: true,
    footprints: [{ kind: 'rect', width: 38, depth: 74 }],
    note: 'Upper academic tower north-east of the central library.'
  },
  {
    mapIndex: '17',
    sortOrder: 17,
    id: 'pharmacy-hall',
    code: 'NP',
    nameKo: '정진석 약학관',
    nameEn: 'Cardinal Cheong Pharmacy Hall',
    category: 'academic',
    mapPosition: { x: 490, y: 188 },
    mapBounds: { width: 50, height: 86 },
    rotation: 0,
    height: 18,
    color: 0xc46f4d,
    accent: 0x344455,
    selectable: true,
    landmark: true,
    footprints: [{ kind: 'rect', width: 44, depth: 76 }],
    note: 'Upper western tower block in the pharmacy cluster.'
  },
  {
    mapIndex: '18',
    sortOrder: 18,
    id: 'concert-hall',
    code: 'CH',
    nameKo: '콘서트홀',
    nameEn: 'Concert Hall',
    category: 'performance',
    mapPosition: { x: 654, y: 316 },
    mapBounds: { width: 112, height: 90 },
    rotation: -0.1,
    height: 12,
    color: 0xd28b60,
    accent: 0x314255,
    selectable: true,
    landmark: true,
    footprints: [
      {
        kind: 'polygon',
        points: polygonPoints([
          [-56, 18],
          [-38, -18],
          [-18, -38],
          [16, -48],
          [48, -28],
          [56, 2],
          [34, 34],
          [-6, 44]
        ])
      }
    ],
    note: 'Performance venue east of the library and south-west of the tennis courts.'
  },
  {
    mapIndex: '19',
    sortOrder: 19,
    id: 'agora-field',
    nameKo: '아고라 운동장',
    nameEn: 'Agora Sports Field',
    category: 'sports',
    mapPosition: { x: 596, y: 456 },
    mapBounds: { width: 140, height: 118 },
    rotation: -0.2,
    height: 1.2,
    color: 0xbe8b62,
    accent: 0x8d6a45,
    selectable: true,
    landmark: true,
    footprints: [{ kind: 'track', width: 128, depth: 102, laneWidth: 12, fieldInset: 18 }],
    note: 'Main sports field shown below the upper academic ridge.'
  },
  {
    mapIndex: '20',
    sortOrder: 20,
    id: 'paul-hall',
    code: 'P',
    nameKo: '바오로관',
    nameEn: 'Paul Hall',
    category: 'religious',
    mapPosition: { x: 124, y: 418 },
    mapBounds: { width: 36, height: 52 },
    rotation: 0,
    height: 8,
    color: 0xad815a,
    accent: 0x3b4d5e,
    selectable: true,
    landmark: false,
    footprints: [{ kind: 'rect', width: 32, depth: 46 }],
    note: 'Small west-side hall north of the chapel precinct.'
  },
  {
    mapIndex: '21',
    sortOrder: 21,
    id: 'international-center',
    code: 'I',
    nameKo: '국제교류관',
    nameEn: 'International Exchange Center',
    category: 'support',
    mapPosition: { x: 120, y: 356 },
    mapBounds: { width: 28, height: 42 },
    rotation: 0,
    height: 8,
    color: 0xa3acb8,
    accent: 0x405265,
    selectable: true,
    landmark: false,
    footprints: [{ kind: 'rect', width: 26, depth: 38 }],
    note: 'West-side support building above Paul Hall.'
  },
  {
    mapIndex: '22',
    sortOrder: 22,
    id: 'sacred-heart-chapel',
    code: 'C',
    nameKo: '예수성심성당',
    nameEn: 'Sacred Heart Chapel',
    category: 'religious',
    mapPosition: { x: 56, y: 662 },
    mapBounds: { width: 60, height: 58 },
    rotation: 0,
    height: 13,
    color: 0xd8d1bc,
    accent: 0x7d6f59,
    selectable: true,
    landmark: true,
    footprints: [
      {
        kind: 'polygon',
        points: polygonPoints([
          [-18, 14],
          [-24, -4],
          [-12, -20],
          [6, -24],
          [22, -14],
          [28, 2],
          [16, 20],
          [-2, 26]
        ]),
        heightScale: 0.92
      },
      { kind: 'rect', width: 10, depth: 12, offsetX: -16, offsetZ: 4, heightScale: 0.72, color: 0xcbbfa5 }
    ],
    note: 'Chapel anchoring the western sacred precinct of the campus.'
  },
  {
    mapIndex: '23',
    sortOrder: 23,
    id: 'sacred-heart-plaza',
    nameKo: '예수성심광장',
    nameEn: 'Sacred Heart Plaza',
    category: 'plaza',
    mapPosition: { x: 126, y: 658 },
    mapBounds: { width: 132, height: 84 },
    rotation: 0,
    height: 1.3,
    color: 0xd7cab0,
    accent: 0xb8996f,
    selectable: true,
    landmark: true,
    footprints: [
      {
        kind: 'polygon',
        points: polygonPoints([
          [-66, -30],
          [66, -30],
          [60, 12],
          [36, 30],
          [-42, 30],
          [-66, 8]
        ])
      }
    ],
    note: 'Open plaza immediately east of the chapel.'
  },
  {
    mapIndex: '24',
    sortOrder: 24,
    id: 'sacred-heart-lawn',
    nameKo: '예수성심 잔디밭',
    nameEn: 'Sacred Heart Lawn',
    category: 'lawn',
    mapPosition: { x: 92, y: 548 },
    mapBounds: { width: 168, height: 108 },
    rotation: 0,
    height: 0.8,
    color: 0x7eaf66,
    accent: 0x547d45,
    selectable: true,
    landmark: false,
    footprints: [
      {
        kind: 'polygon',
        points: polygonPoints([
          [-86, -36],
          [78, -36],
          [86, 18],
          [24, 48],
          [-26, 48],
          [-76, 44],
          [-88, 8]
        ])
      }
    ],
    note: 'Open lawn north of the chapel and plaza precinct.'
  },
  {
    mapIndex: '25',
    sortOrder: 25,
    id: 'tennis-court',
    nameKo: '테니스장',
    nameEn: 'Tennis Court',
    category: 'court',
    mapPosition: { x: 790, y: 252 },
    mapBounds: { width: 110, height: 78 },
    rotation: -0.18,
    height: 0.9,
    color: 0xc6a56f,
    accent: 0x8c6b43,
    selectable: true,
    landmark: true,
    footprints: [
      {
        kind: 'polygon',
        points: polygonPoints([
          [-56, -38],
          [56, -38],
          [56, 38],
          [-56, 38]
        ])
      }
    ],
    note: 'Twin tennis courts at the upper eastern ridge.'
  },
  {
    mapIndex: '26',
    sortOrder: 26,
    id: 'francis-dormitory',
    code: 'F',
    nameKo: '프란치스코관',
    nameEn: 'Francis Hall Dormitory',
    category: 'dormitory',
    mapPosition: { x: 468, y: 832 },
    mapBounds: { width: 60, height: 92 },
    rotation: 0,
    height: 22,
    color: 0xaab8c7,
    accent: 0x42596e,
    selectable: true,
    landmark: true,
    footprints: [{ kind: 'rect', width: 48, depth: 80 }],
    note: 'Isolated southern dormitory shown below the main gate forecourt.'
  },
  {
    mapIndex: '27',
    sortOrder: 27,
    id: 'back-gate',
    nameKo: '후문',
    nameEn: 'Back Gate',
    category: 'gate',
    mapPosition: { x: 398, y: 172 },
    mapBounds: { width: 26, height: 18 },
    rotation: -0.08,
    height: 5,
    color: 0x5f6873,
    accent: 0xa6b3c4,
    selectable: true,
    landmark: true,
    footprints: [{ kind: 'rect', width: 22, depth: 8 }],
    note: 'Official rear gate feeding the upper campus access road.'
  }
];

export const CAMPUS_PLACES: CampusPlace[] = RAW_CAMPUS_PLACES.map((place) => {
  const worldPoint = projectMapPointToWorld(place.mapPosition);

  return {
    ...place,
    x: worldPoint.x,
    z: worldPoint.z,
    bounds: projectMapBoundsToWorld(place.mapBounds),
    footprints: place.footprints.map(projectFootprintToWorld)
  };
});

const RAW_CAMPUS_ROUTES: RawCampusRoute[] = [
  {
    id: 'truth-road',
    nameKo: '진리의길',
    width: 5.8,
    kind: 'main',
    mapPoints: [
      { x: 92, y: 772 },
      { x: 124, y: 734 },
      { x: 160, y: 694 },
      { x: 202, y: 664 },
      { x: 248, y: 632 },
      { x: 300, y: 596 },
      { x: 350, y: 556 },
      { x: 404, y: 510 },
      { x: 462, y: 458 }
    ]
  },
  {
    id: 'faith-road',
    nameKo: '믿음의길',
    width: 4.4,
    kind: 'secondary',
    mapPoints: [
      { x: 154, y: 692 },
      { x: 196, y: 654 },
      { x: 240, y: 624 },
      { x: 284, y: 594 },
      { x: 330, y: 566 }
    ]
  },
  {
    id: 'dasol-road',
    nameKo: '다솔길',
    width: 4.2,
    kind: 'secondary',
    mapPoints: [
      { x: 142, y: 454 },
      { x: 214, y: 448 },
      { x: 290, y: 446 },
      { x: 370, y: 448 },
      { x: 448, y: 454 }
    ]
  },
  {
    id: 'wisdom-road',
    nameKo: '지혜의길',
    width: 4.4,
    kind: 'secondary',
    mapPoints: [
      { x: 346, y: 346 },
      { x: 418, y: 336 },
      { x: 494, y: 324 },
      { x: 556, y: 286 },
      { x: 548, y: 236 },
      { x: 514, y: 204 }
    ]
  },
  {
    id: 'raphael-road',
    nameKo: '라파엘길',
    width: 3.9,
    kind: 'scenic',
    mapPoints: [
      { x: 494, y: 324 },
      { x: 580, y: 318 },
      { x: 664, y: 304 },
      { x: 742, y: 274 },
      { x: 806, y: 246 }
    ]
  },
  {
    id: 'gabriel-road',
    nameKo: '가브리엘길',
    width: 3.2,
    kind: 'scenic',
    mapPoints: [
      { x: 400, y: 144 },
      { x: 520, y: 126 },
      { x: 650, y: 126 },
      { x: 786, y: 118 }
    ]
  },
  {
    id: 'jibong-road',
    nameKo: '지봉로',
    width: 5.2,
    kind: 'main',
    mapPoints: [
      { x: 64, y: 826 },
      { x: 174, y: 826 },
      { x: 302, y: 826 },
      { x: 430, y: 826 },
      { x: 512, y: 826 }
    ]
  },
  {
    id: 'rear-gate-link',
    nameKo: '후문 연결로',
    width: 3.8,
    kind: 'secondary',
    mapPoints: [
      { x: 514, y: 204 },
      { x: 474, y: 194 },
      { x: 436, y: 184 },
      { x: 398, y: 172 }
    ]
  },
  {
    id: 'chapel-precinct',
    nameKo: '성당 구역 보행로',
    width: 3.6,
    kind: 'secondary',
    mapPoints: [
      { x: 56, y: 662 },
      { x: 110, y: 664 },
      { x: 132, y: 626 },
      { x: 116, y: 584 },
      { x: 92, y: 540 }
    ]
  }
];

export const CAMPUS_ROUTES: CampusRoute[] = RAW_CAMPUS_ROUTES.map((route) => ({
  ...route,
  points: route.mapPoints.map(projectMapPointToWorld)
}));

const RAW_TREE_ZONES: RawTreeZone[] = [
  { id: 'chapel-grove', center: { x: 100, y: 592 }, radiusX: 92, radiusY: 108, density: 18 },
  { id: 'mary-garden-grove', center: { x: 486, y: 548 }, radiusX: 70, radiusY: 74, density: 10 },
  { id: 'rear-gate-woods', center: { x: 840, y: 236 }, radiusX: 176, radiusY: 148, density: 22 },
  { id: 'north-slope', center: { x: 764, y: 122 }, radiusX: 176, radiusY: 102, density: 18 }
];

export const TREE_ZONES: TreeZone[] = RAW_TREE_ZONES.map((zone) => {
  const center = projectMapPointToWorld(zone.center);
  return {
    id: zone.id,
    centerX: center.x,
    centerZ: center.z,
    radiusX: projectMapWidthToWorld(zone.radiusX),
    radiusZ: projectMapHeightToWorld(zone.radiusY),
    density: zone.density
  };
});

export function getCampusPlaceById(id: string): CampusPlace | undefined {
  return CAMPUS_PLACES.find((place) => place.id === id);
}

export const CAMPUS_SOURCE_NOTE = `
The official Songsim Campus map numbers the main points of interest as 1-27 with an additional 5-1 Andrea Maru Plaza.
This dataset uses official map-space coordinates first, then projects them into the current world-space so the rendered campus keeps the official numbering, adjacency, and open-space structure.
`;
