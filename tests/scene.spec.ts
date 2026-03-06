import { describe, expect, it } from 'vitest';
import { getPointerSelectionThreshold } from '../src/interaction/cameraRig';
import {
  didPointerStayWithinThreshold,
  shouldIgnoreMouseClickAfterOrbit,
  shouldProcessMouseHover,
  shouldTrackHoverHighlight
} from '../src/scene/SongsimExperience';

describe('scene click selection helpers', () => {
  it('treats small pointer movement as a click', () => {
    expect(didPointerStayWithinThreshold({ x: 100, y: 120 }, { x: 104, y: 123 })).toBe(true);
  });

  it('treats larger pointer movement as a drag', () => {
    expect(didPointerStayWithinThreshold({ x: 100, y: 120 }, { x: 112, y: 133 })).toBe(false);
  });

  it('disables hover highlights and allows a larger tap radius on touch', () => {
    const start = { x: 100, y: 120 };
    const end = { x: 108, y: 125 };

    expect(shouldTrackHoverHighlight('desktop')).toBe(true);
    expect(shouldTrackHoverHighlight('touch')).toBe(false);
    expect(didPointerStayWithinThreshold(start, end, getPointerSelectionThreshold('desktop'))).toBe(false);
    expect(didPointerStayWithinThreshold(start, end, getPointerSelectionThreshold('touch'))).toBe(true);
  });

  it('only updates mouse hover while orbit is idle and no buttons are pressed', () => {
    expect(shouldTrackHoverHighlight('desktop')).toBe(true);
    expect(shouldProcessMouseHover('desktop', 0, false)).toBe(true);
    expect(shouldProcessMouseHover('desktop', 1, false)).toBe(false);
    expect(shouldProcessMouseHover('desktop', 0, true)).toBe(false);
    expect(shouldProcessMouseHover('touch', 0, false)).toBe(false);
  });

  it('ignores the synthetic click that follows a mouse orbit drag', () => {
    expect(shouldIgnoreMouseClickAfterOrbit(true)).toBe(true);
    expect(shouldIgnoreMouseClickAfterOrbit(false)).toBe(false);
  });
});
