import { describe, expect, it } from 'vitest';
import { CAMPUS_PLACES, CAMPUS_ROUTES, projectMapPointToWorld } from '../src/data/campus';

describe('official songsim campus data', () => {
  it('contains the official numbered places including 5-1', () => {
    const indexes = new Set(CAMPUS_PLACES.map((place) => place.mapIndex));

    expect(CAMPUS_PLACES).toHaveLength(28);
    expect(indexes.has('5-1')).toBe(true);
    expect(indexes.has('27')).toBe(true);
    expect(CAMPUS_PLACES.some((place) => place.nameKo === '성모동산')).toBe(true);
    expect(CAMPUS_PLACES.some((place) => place.nameKo === '예수성심광장')).toBe(true);
    expect(CAMPUS_PLACES.some((place) => place.nameKo === '예수성심 잔디밭')).toBe(true);
    expect(CAMPUS_PLACES.some((place) => place.nameKo === '테니스장')).toBe(true);
    expect(CAMPUS_PLACES.some((place) => place.nameKo === '프란치스코관')).toBe(true);
    expect(CAMPUS_PLACES.some((place) => place.nameKo === '후문')).toBe(true);
    expect(CAMPUS_PLACES.every((place) => place.mapPosition.x > 0 && place.mapPosition.y > 0)).toBe(true);
    expect(CAMPUS_PLACES.every((place) => place.mapBounds.width > 0 && place.mapBounds.height > 0)).toBe(true);
  });

  it('derives world positions from the official map-space coordinates', () => {
    const mainGate = CAMPUS_PLACES.find((place) => place.id === 'main-gate');
    const projected = projectMapPointToWorld(mainGate!.mapPosition);

    expect(mainGate).toBeDefined();
    expect(mainGate!.x).toBeCloseTo(projected.x, 6);
    expect(mainGate!.z).toBeCloseTo(projected.z, 6);
  });

  it('keeps the official spatial clusters in the right regions', () => {
    const mainGate = CAMPUS_PLACES.find((place) => place.id === 'main-gate');
    const backGate = CAMPUS_PLACES.find((place) => place.id === 'back-gate');
    const chapel = CAMPUS_PLACES.find((place) => place.id === 'sacred-heart-chapel');
    const plaza = CAMPUS_PLACES.find((place) => place.id === 'sacred-heart-plaza');
    const lawn = CAMPUS_PLACES.find((place) => place.id === 'sacred-heart-lawn');
    const futureTalent = CAMPUS_PLACES.find((place) => place.id === 'future-talent-hall');
    const saintMaryGarden = CAMPUS_PLACES.find((place) => place.id === 'saint-mary-garden');
    const veritasLibrary = CAMPUS_PLACES.find((place) => place.id === 'veritas-library');
    const songsimHall = CAMPUS_PLACES.find((place) => place.id === 'songsim-hall');
    const pharmacyHall = CAMPUS_PLACES.find((place) => place.id === 'pharmacy-hall');
    const concertHall = CAMPUS_PLACES.find((place) => place.id === 'concert-hall');
    const agoraField = CAMPUS_PLACES.find((place) => place.id === 'agora-field');
    const tennisCourt = CAMPUS_PLACES.find((place) => place.id === 'tennis-court');
    const francisDormitory = CAMPUS_PLACES.find((place) => place.id === 'francis-dormitory');

    expect(mainGate).toBeDefined();
    expect(backGate).toBeDefined();
    expect(chapel).toBeDefined();
    expect(plaza).toBeDefined();
    expect(lawn).toBeDefined();
    expect(futureTalent).toBeDefined();
    expect(saintMaryGarden).toBeDefined();
    expect(veritasLibrary).toBeDefined();
    expect(songsimHall).toBeDefined();
    expect(pharmacyHall).toBeDefined();
    expect(concertHall).toBeDefined();
    expect(agoraField).toBeDefined();
    expect(tennisCourt).toBeDefined();
    expect(francisDormitory).toBeDefined();

    expect(mainGate!.z).toBeGreaterThan(60);
    expect(backGate!.z).toBeLessThan(0);
    expect(chapel!.x).toBeLessThan(plaza!.x);
    expect(Math.abs(lawn!.x - chapel!.x)).toBeLessThan(30);
    expect(saintMaryGarden!.x - futureTalent!.x).toBeGreaterThanOrEqual(22);
    expect(saintMaryGarden!.z - futureTalent!.z).toBeGreaterThanOrEqual(6);
    expect(veritasLibrary!.z).toBeLessThan(futureTalent!.z);
    expect(pharmacyHall!.z).toBeLessThan(veritasLibrary!.z - 20);
    expect(songsimHall!.z).toBeLessThan(veritasLibrary!.z - 20);
    expect(backGate!.x).toBeLessThan(pharmacyHall!.x - 12);
    expect(backGate!.z).toBeLessThan(veritasLibrary!.z);
    expect(concertHall!.x - veritasLibrary!.x).toBeGreaterThanOrEqual(28);
    expect(tennisCourt!.x - concertHall!.x).toBeGreaterThanOrEqual(24);
    expect(tennisCourt!.z).toBeLessThan(concertHall!.z);
    expect(agoraField!.z).toBeGreaterThan(concertHall!.z);
    expect(francisDormitory!.z - mainGate!.z).toBeGreaterThan(10);
  });

  it('defines the official named path network from the main gate to the rear gate and upper ridge', () => {
    const routeIds = new Set(CAMPUS_ROUTES.map((route) => route.id));

    expect(routeIds.has('truth-road')).toBe(true);
    expect(routeIds.has('faith-road')).toBe(true);
    expect(routeIds.has('dasol-road')).toBe(true);
    expect(routeIds.has('wisdom-road')).toBe(true);
    expect(routeIds.has('raphael-road')).toBe(true);
    expect(routeIds.has('gabriel-road')).toBe(true);
    expect(routeIds.has('jibong-road')).toBe(true);
    expect(routeIds.has('rear-gate-link')).toBe(true);
  });

  it('preserves broad civic-space footprint ratios for key plaza, lawn, and court areas', () => {
    const andreaMaruPlaza = CAMPUS_PLACES.find((place) => place.id === 'andrea-maru-plaza');
    const sacredHeartPlaza = CAMPUS_PLACES.find((place) => place.id === 'sacred-heart-plaza');
    const sacredHeartLawn = CAMPUS_PLACES.find((place) => place.id === 'sacred-heart-lawn');
    const tennisCourt = CAMPUS_PLACES.find((place) => place.id === 'tennis-court');

    expect(andreaMaruPlaza).toBeDefined();
    expect(sacredHeartPlaza).toBeDefined();
    expect(sacredHeartLawn).toBeDefined();
    expect(tennisCourt).toBeDefined();

    expect(andreaMaruPlaza!.bounds.width).toBeGreaterThan(andreaMaruPlaza!.bounds.depth);
    expect(sacredHeartPlaza!.bounds.width).toBeGreaterThan(sacredHeartPlaza!.bounds.depth);
    expect(sacredHeartLawn!.bounds.width).toBeGreaterThan(sacredHeartPlaza!.bounds.width);
    expect(tennisCourt!.bounds.width).toBeGreaterThan(tennisCourt!.bounds.depth);
  });
});
