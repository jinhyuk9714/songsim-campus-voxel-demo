import { describe, expect, it } from 'vitest';
import { CAMPUS_PLACES } from '../src/data/campus';
import { getPlaceProfile } from '../src/world/buildings';

describe('official place rendering profiles', () => {
  it('assigns distinct profiles to strong official footprints', () => {
    expect(getPlaceProfile('kim-sou-hwan').variant).toBe('multi-mass');
    expect(getPlaceProfile('andrea-dormitory').variant).toBe('curved-dorm');
    expect(getPlaceProfile('dasol-hall').variant).toBe('courtyard');
    expect(getPlaceProfile('agora-field').variant).toBe('track-field');
    expect(getPlaceProfile('sacred-heart-plaza').variant).toBe('plaza');
    expect(getPlaceProfile('tennis-court').variant).toBe('court');
  });

  it('uses polygon footprints for the official non-rectilinear map silhouettes', () => {
    const polygonIds = new Set(
      CAMPUS_PLACES.filter((place) => place.footprints.some((footprint) => footprint.kind === 'polygon')).map(
        (place) => place.id
      )
    );

    expect(polygonIds.has('kim-sou-hwan')).toBe(true);
    expect(polygonIds.has('andrea-dormitory')).toBe(true);
    expect(polygonIds.has('andrea-maru-plaza')).toBe(true);
    expect(polygonIds.has('dasol-hall')).toBe(true);
    expect(polygonIds.has('veritas-library')).toBe(true);
    expect(polygonIds.has('concert-hall')).toBe(true);
    expect(polygonIds.has('sacred-heart-chapel')).toBe(true);
  });

  it('keeps key official silhouettes at a higher polygon fidelity', () => {
    const kimSouHwan = CAMPUS_PLACES.find((place) => place.id === 'kim-sou-hwan');
    const concertHall = CAMPUS_PLACES.find((place) => place.id === 'concert-hall');
    const sacredHeartChapel = CAMPUS_PLACES.find((place) => place.id === 'sacred-heart-chapel');
    const andreaMaruPlaza = CAMPUS_PLACES.find((place) => place.id === 'andrea-maru-plaza');

    const kimSouHwanPolygon = kimSouHwan?.footprints.find((footprint) => footprint.kind === 'polygon');
    const concertHallPolygon = concertHall?.footprints.find((footprint) => footprint.kind === 'polygon');
    const chapelPolygon = sacredHeartChapel?.footprints.find((footprint) => footprint.kind === 'polygon');

    expect(andreaMaruPlaza?.footprints.some((footprint) => footprint.kind === 'polygon')).toBe(true);
    expect(kimSouHwanPolygon && 'points' in kimSouHwanPolygon ? kimSouHwanPolygon.points.length : 0).toBeGreaterThanOrEqual(7);
    expect(concertHallPolygon && 'points' in concertHallPolygon ? concertHallPolygon.points.length : 0).toBeGreaterThanOrEqual(7);
    expect(chapelPolygon && 'points' in chapelPolygon ? chapelPolygon.points.length : 0).toBeGreaterThanOrEqual(8);
  });
});
