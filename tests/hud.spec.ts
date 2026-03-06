import { describe, expect, it } from 'vitest';
import { describeCampusFocus, formatHudTag, getHudHelpItems } from '../src/ui/hud';

describe('official poi hud summaries', () => {
  it('formats numbered non-building POIs as first-class focus targets', () => {
    const summary = describeCampusFocus({
      mapIndex: '23',
      sortOrder: 23,
      id: 'sacred-heart-plaza',
      nameKo: '예수성심광장',
      nameEn: 'Sacred Heart Plaza',
      category: 'plaza',
      mapPosition: { x: 134, y: 650 },
      mapBounds: { width: 122, height: 78 },
      x: -44,
      z: 32,
      rotation: 0,
      bounds: { width: 16, depth: 12 },
      height: 1.2,
      color: 0,
      selectable: true,
      landmark: true,
      footprints: [{ kind: 'rect', width: 16, depth: 12 }],
      note: 'Chapel forecourt precinct west of the main academic cluster.'
    });

    expect(summary.title).toContain('23');
    expect(summary.title).toContain('예수성심광장');
    expect(summary.subtitle).toContain('Sacred Heart Plaza');
    expect(summary.meta).toContain('plaza');
  });

  it('condenses tag copy and help text for touch interaction', () => {
    expect(getHudHelpItems('touch')).toEqual(['드래그: 회전', '핀치: 확대/이동', '탭: 선택 + 이동']);
    expect(formatHudTag('touch', 'mode', 'isometric')).toBe('iso');
    expect(formatHudTag('touch', 'seed', 3)).toBe('s3');
    expect(formatHudTag('touch', 'labels', false)).toBe('core');
    expect(formatHudTag('desktop', 'labels', false)).toBe('core labels');
  });
});
