import { describe, expect, it } from 'vitest';
import { CAMPUS_ROUTES, getCampusPlaceById } from '../src/data/campus';
import { getRouteGeometryProfile, getRouteStyle } from '../src/world/roads';

describe('official route styling', () => {
  it('gives truth road the strongest vehicular treatment and gabriel road the lightest scenic treatment', () => {
    const truthRoad = getRouteStyle('truth-road');
    const wisdomRoad = getRouteStyle('wisdom-road');
    const gabrielRoad = getRouteStyle('gabriel-road');

    expect(truthRoad.surfaceWidth).toBeGreaterThan(wisdomRoad.surfaceWidth);
    expect(wisdomRoad.surfaceWidth).toBeGreaterThan(gabrielRoad.surfaceWidth);
    expect(gabrielRoad.stripeMode).toBe('none');
  });

  it('keeps truth road as the lower-to-upper academic spine from the main gate', () => {
    const truthRoad = CAMPUS_ROUTES.find((route) => route.id === 'truth-road');
    const mainGate = getCampusPlaceById('main-gate');
    const futureTalent = getCampusPlaceById('future-talent-hall');
    const saintMaryGarden = getCampusPlaceById('saint-mary-garden');

    expect(truthRoad).toBeDefined();
    expect(mainGate).toBeDefined();
    expect(futureTalent).toBeDefined();
    expect(saintMaryGarden).toBeDefined();

    expect(truthRoad!.points[0]).toEqual({ x: mainGate!.x, z: mainGate!.z });
    expect(truthRoad!.points.at(-1)!.x).toBeGreaterThan(futureTalent!.x);
    expect(truthRoad!.points.at(-1)!.z).toBeLessThan(saintMaryGarden!.z);
  });

  it('keeps wisdom, raphael, and rear-gate routes as a connected upper terrace network', () => {
    const wisdomRoad = CAMPUS_ROUTES.find((route) => route.id === 'wisdom-road');
    const raphaelRoad = CAMPUS_ROUTES.find((route) => route.id === 'raphael-road');
    const rearGateLink = CAMPUS_ROUTES.find((route) => route.id === 'rear-gate-link');
    const veritasLibrary = getCampusPlaceById('veritas-library');
    const pharmacyHall = getCampusPlaceById('pharmacy-hall');
    const concertHall = getCampusPlaceById('concert-hall');
    const tennisCourt = getCampusPlaceById('tennis-court');
    const backGate = getCampusPlaceById('back-gate');

    expect(wisdomRoad).toBeDefined();
    expect(raphaelRoad).toBeDefined();
    expect(rearGateLink).toBeDefined();
    expect(veritasLibrary).toBeDefined();
    expect(pharmacyHall).toBeDefined();
    expect(concertHall).toBeDefined();
    expect(tennisCourt).toBeDefined();
    expect(backGate).toBeDefined();

    expect(Math.min(...wisdomRoad!.points.map((point) => point.x))).toBeLessThan(veritasLibrary!.x);
    expect(Math.max(...wisdomRoad!.points.map((point) => point.x))).toBeGreaterThan(pharmacyHall!.x);
    expect(rearGateLink!.points[0]).toEqual(wisdomRoad!.points.at(-1));
    expect(rearGateLink!.points.at(-1)).toEqual({ x: backGate!.x, z: backGate!.z });
    expect(raphaelRoad!.points[0]).toEqual(wisdomRoad!.points[2]);
    expect(raphaelRoad!.points.at(-1)!.x).toBeGreaterThan(concertHall!.x);
    expect(raphaelRoad!.points.at(-1)!.z).toBeLessThan(tennisCourt!.z + 3);
  });

  it('keeps chapel precinct west of the main academic network', () => {
    const chapelPrecinct = CAMPUS_ROUTES.find((route) => route.id === 'chapel-precinct');
    const chapel = getCampusPlaceById('sacred-heart-chapel');
    const mariaHall = getCampusPlaceById('maria-hall');

    expect(chapelPrecinct).toBeDefined();
    expect(chapel).toBeDefined();
    expect(mariaHall).toBeDefined();

    expect(chapelPrecinct!.points[0]).toEqual({ x: chapel!.x, z: chapel!.z });
    expect(Math.max(...chapelPrecinct!.points.map((point) => point.x))).toBeLessThan(mariaHall!.x - 20);
  });

  it('assigns route-aware geometry profiles for gate, terrace, and scenic paths', () => {
    const truthProfile = getRouteGeometryProfile('truth-road');
    const wisdomProfile = getRouteGeometryProfile('wisdom-road');
    const rearGateProfile = getRouteGeometryProfile('rear-gate-link');
    const chapelProfile = getRouteGeometryProfile('chapel-precinct');
    const raphaelProfile = getRouteGeometryProfile('raphael-road');

    expect(truthProfile.nodeKind).toBe('gateway');
    expect(wisdomProfile.nodeKind).toBe('terrace');
    expect(rearGateProfile.stairCue).toBe(true);
    expect(chapelProfile.nodeKind).toBe('precinct');
    expect(raphaelProfile.nodeKind).toBe('ridge');
    expect(truthProfile.landingScale).toBeGreaterThan(raphaelProfile.landingScale);
  });
});
