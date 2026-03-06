import { describe, expect, it } from 'vitest';
import { getCampusPlaceById } from '../src/data/campus';
import { getCampusPropAnchors } from '../src/world/decorations';

describe('official map decoration anchors', () => {
  it('anchors props around saint mary garden, chapel precinct, and tennis edge', () => {
    const anchors = getCampusPropAnchors();
    const saintMaryGarden = getCampusPlaceById('saint-mary-garden');
    const tennisCourt = getCampusPlaceById('tennis-court');
    const saintMarySign = anchors.find((anchor) => anchor.kind === 'sign' && anchor.placeId === 'saint-mary-garden');
    const tennisHedge = anchors.find((anchor) => anchor.kind === 'hedge' && anchor.placeId === 'tennis-court');

    expect(anchors.some((anchor) => anchor.kind === 'sign' && anchor.placeId === 'saint-mary-garden')).toBe(true);
    expect(anchors.some((anchor) => anchor.kind === 'bench' && anchor.placeId === 'sacred-heart-plaza')).toBe(true);
    expect(anchors.some((anchor) => anchor.kind === 'hedge' && anchor.placeId === 'tennis-court')).toBe(true);
    expect(saintMaryGarden).toBeDefined();
    expect(tennisCourt).toBeDefined();
    expect(saintMarySign).toBeDefined();
    expect(tennisHedge).toBeDefined();
    expect(Math.hypot(saintMarySign!.x - saintMaryGarden!.x, saintMarySign!.z - saintMaryGarden!.z)).toBeLessThanOrEqual(6.5);
    expect(Math.abs(tennisHedge!.x - tennisCourt!.x)).toBeLessThanOrEqual(4);
  });
});
