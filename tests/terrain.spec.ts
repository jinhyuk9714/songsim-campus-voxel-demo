import { describe, expect, it } from 'vitest';
import { CAMPUS_PLACES } from '../src/data/campus';
import { groundHeightAt } from '../src/world/terrain';

describe('official campus terrain grades', () => {
  it('keeps the entrance lower than the upper pharmacy and rear-gate zone', () => {
    const mainGate = CAMPUS_PLACES.find((place) => place.id === 'main-gate')!;
    const pharmacyHall = CAMPUS_PLACES.find((place) => place.id === 'pharmacy-hall')!;
    const backGate = CAMPUS_PLACES.find((place) => place.id === 'back-gate')!;

    expect(groundHeightAt(mainGate.x, mainGate.z)).toBeLessThan(groundHeightAt(pharmacyHall.x, pharmacyHall.z));
    expect(groundHeightAt(mainGate.x, mainGate.z)).toBeLessThan(groundHeightAt(backGate.x, backGate.z));
  });
});
