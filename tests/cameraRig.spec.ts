import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  CameraRig,
  SafariDesktopMouseAdapter,
  buildFocusFrame,
  clampToCampusBounds,
  getGroundMovementBasis,
  getOrbitStateForMouseAction,
  isOrbitPointerInteractionActive,
  getPointerSelectionThreshold,
  resolveOrbitMouseAction,
  resetOrbitPointerInteraction,
  resolveInteractionProfile,
  shouldUseSafariDesktopMouseAdapter
} from '../src/interaction/cameraRig';

class FakeListenerTarget {
  private readonly listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  public hidden = false;

  public addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    const listeners = this.listeners.get(type) ?? new Set<EventListenerOrEventListenerObject>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  public removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    this.listeners.get(type)?.delete(listener);
  }

  public dispatch(type: string, event: Event): void {
    for (const listener of this.listeners.get(type) ?? []) {
      if (typeof listener === 'function') {
        listener(event);
      } else {
        listener.handleEvent(event);
      }
    }
  }

  public listenerCount(type: string): number {
    return this.listeners.get(type)?.size ?? 0;
  }
}

describe('camera rig helpers', () => {
  it('clamps camera targets to the campus bounds', () => {
    const clamped = clampToCampusBounds(new THREE.Vector3(160, 8, 140));

    expect(clamped.x).toBe(122);
    expect(clamped.z).toBe(112);
  });

  it('builds an elevated fly-to frame around a selected landmark', () => {
    const frame = buildFocusFrame({ x: 64, z: -34, height: 18 }, 'isometric');

    expect(frame.target.x).toBe(64);
    expect(frame.target.z).toBe(-34);
    expect(frame.position.y).toBeGreaterThan(frame.target.y + 20);
    expect(frame.position.distanceTo(frame.target)).toBeGreaterThan(35);
  });

  it('switches to the touch profile for coarse pointers or narrow viewports', () => {
    expect(resolveInteractionProfile({ innerWidth: 1280, matchMedia: () => ({ matches: false }) })).toBe('desktop');
    expect(resolveInteractionProfile({ innerWidth: 760, matchMedia: () => ({ matches: false }) })).toBe('touch');
    expect(resolveInteractionProfile({ innerWidth: 1280, matchMedia: () => ({ matches: true }) })).toBe('touch');
  });

  it('enables the Safari desktop adapter only for macOS Safari with a fine pointer', () => {
    expect(
      shouldUseSafariDesktopMouseAdapter({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
        platform: 'MacIntel',
        matchMedia: () => ({ matches: false })
      })
    ).toBe(true);

    expect(
      shouldUseSafariDesktopMouseAdapter({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        platform: 'MacIntel',
        matchMedia: () => ({ matches: false })
      })
    ).toBe(false);

    expect(
      shouldUseSafariDesktopMouseAdapter({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
        platform: 'MacIntel',
        matchMedia: () => ({ matches: true })
      })
    ).toBe(false);
  });

  it('uses a larger touch fly-to frame and tap threshold on mobile', () => {
    const desktop = buildFocusFrame({ x: 64, z: -34, height: 18 }, 'isometric', 'desktop');
    const touch = buildFocusFrame({ x: 64, z: -34, height: 18 }, 'isometric', 'touch');

    expect(getPointerSelectionThreshold('touch')).toBeGreaterThan(getPointerSelectionThreshold('desktop'));
    expect(touch.position.y).toBeGreaterThan(desktop.position.y);
    expect(touch.position.distanceTo(touch.target)).toBeGreaterThan(desktop.position.distanceTo(desktop.target));
  });

  it('derives horizontal movement axes from the current azimuth', () => {
    const origin = getGroundMovementBasis(0);
    const quarterTurn = getGroundMovementBasis(Math.PI / 2);

    expect(origin.forward.x).toBeCloseTo(0, 6);
    expect(origin.forward.y).toBe(0);
    expect(origin.forward.z).toBeCloseTo(-1, 6);
    expect(origin.right.x).toBeCloseTo(1, 6);
    expect(origin.right.y).toBe(0);
    expect(origin.right.z).toBeCloseTo(0, 6);
    expect(origin.forward.dot(origin.right)).toBeCloseTo(0, 6);

    expect(quarterTurn.forward.x).toBeCloseTo(-1, 6);
    expect(quarterTurn.forward.z).toBeCloseTo(0, 6);
    expect(quarterTurn.right.x).toBeCloseTo(0, 6);
    expect(quarterTurn.right.z).toBeCloseTo(-1, 6);
  });

  it('force-resets orbit pointer state when pointer release is missed', () => {
    const removedListeners: string[] = [];
    const releasedPointerIds: number[] = [];
    const dispatchedEvents: string[] = [];
    const controls = {
      state: 0,
      _controlActive: true,
      _pointers: [7],
      _pointerPositions: { 7: { x: 120, y: 160 } },
      _onPointerMove: () => {},
      _onPointerUp: () => {},
      dispatchEvent: (event: { type: string }) => {
        dispatchedEvents.push(event.type);
      },
      domElement: {
        hasPointerCapture: (pointerId: number) => pointerId === 7,
        releasePointerCapture: (pointerId: number) => {
          releasedPointerIds.push(pointerId);
        },
        removeEventListener: (type: string) => {
          removedListeners.push(type);
        }
      }
    };

    resetOrbitPointerInteraction(controls, 7);

    expect(controls.state).toBe(-1);
    expect(controls._controlActive).toBe(false);
    expect(controls._pointers).toEqual([]);
    expect(controls._pointerPositions).toEqual({});
    expect(releasedPointerIds).toEqual([7]);
    expect(removedListeners).toContain('pointermove');
    expect(removedListeners).toContain('pointerup');
    expect(dispatchedEvents).toContain('end');
  });

  it('detects whether orbit pointer interaction is still active', () => {
    expect(isOrbitPointerInteractionActive({ state: -1, _pointers: [] })).toBe(false);
    expect(isOrbitPointerInteractionActive({ state: 0, _pointers: [] })).toBe(true);
    expect(isOrbitPointerInteractionActive({ state: -1, _pointers: [3] })).toBe(true);
  });

  it('maps mouse buttons and modifiers to the same orbit actions as OrbitControls', () => {
    expect(resolveOrbitMouseAction(0, { ctrlKey: false, metaKey: false, shiftKey: false })).toBe('rotate');
    expect(resolveOrbitMouseAction(0, { ctrlKey: true, metaKey: false, shiftKey: false })).toBe('pan');
    expect(resolveOrbitMouseAction(1, { ctrlKey: false, metaKey: false, shiftKey: false })).toBe('dolly');
    expect(resolveOrbitMouseAction(2, { ctrlKey: false, metaKey: false, shiftKey: false })).toBe('pan');
    expect(resolveOrbitMouseAction(2, { ctrlKey: false, metaKey: false, shiftKey: true })).toBe('rotate');
    expect(resolveOrbitMouseAction(4, { ctrlKey: false, metaKey: false, shiftKey: false })).toBe('none');
  });

  it('blocks the default Safari pointerdown path without arming a drag session yet', () => {
    const events: string[] = [];
    const canvas = new FakeListenerTarget();
    const doc = new FakeListenerTarget();
    const win = new FakeListenerTarget();
    const controls = {
      enabled: true,
      enableZoom: true,
      enableRotate: true,
      enablePan: true,
      mouseButtons: {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      },
      state: -1,
      _controlActive: false,
      _pointers: [],
      _pointerPositions: {},
      _onPointerMove: () => {},
      _onPointerUp: () => {},
      dispatchEvent: (event: { type: string }) => {
        events.push(event.type);
      },
      domElement: {
        hasPointerCapture: () => false,
        releasePointerCapture: () => {},
        removeEventListener: () => {}
      },
      _handleMouseDownRotate: () => {
        events.push('down:rotate');
      },
      _handleMouseDownDolly: () => {
        events.push('down:dolly');
      },
      _handleMouseDownPan: () => {
        events.push('down:pan');
      },
      _handleMouseMoveRotate: () => {
        events.push('move:rotate');
      },
      _handleMouseMoveDolly: () => {
        events.push('move:dolly');
      },
      _handleMouseMovePan: () => {
        events.push('move:pan');
      }
    };
    const adapter = new SafariDesktopMouseAdapter(controls, canvas, doc, win);
    const stopCalls: string[] = [];

    adapter.connect();
    canvas.dispatch(
      'pointerdown',
      {
        pointerType: 'mouse',
        isPrimary: true,
        pointerId: 6,
        button: 0,
        clientX: 48,
        clientY: 72,
        stopImmediatePropagation: () => stopCalls.push('stop')
      } as unknown as Event
    );

    expect(controls.enabled).toBe(true);
    expect(controls.state).toBe(-1);
    expect(events).not.toContain('down:rotate');
    expect(events).not.toContain('move:rotate');
    expect(events).not.toContain('start');
    expect(stopCalls).toEqual(['stop']);
    expect(doc.listenerCount('mousemove')).toBe(0);
    expect(doc.listenerCount('mouseup')).toBe(0);
  });

  it('arms on mousedown, starts on first mousemove, and cleans up on mouseup', () => {
    const events: string[] = [];
    const canvas = new FakeListenerTarget();
    const doc = new FakeListenerTarget();
    const win = new FakeListenerTarget();
    const controls = {
      enabled: true,
      enableZoom: true,
      enableRotate: true,
      enablePan: true,
      mouseButtons: {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      },
      state: -1,
      _controlActive: false,
      _pointers: [],
      _pointerPositions: {},
      _onPointerMove: () => {},
      _onPointerUp: () => {},
      dispatchEvent: (event: { type: string }) => {
        events.push(event.type);
      },
      domElement: {
        hasPointerCapture: () => false,
        releasePointerCapture: () => {},
        removeEventListener: () => {}
      },
      _handleMouseDownRotate: () => {
        events.push('down:rotate');
      },
      _handleMouseDownDolly: () => {
        events.push('down:dolly');
      },
      _handleMouseDownPan: () => {
        events.push('down:pan');
      },
      _handleMouseMoveRotate: () => {
        events.push('move:rotate');
      },
      _handleMouseMoveDolly: () => {
        events.push('move:dolly');
      },
      _handleMouseMovePan: () => {
        events.push('move:pan');
      }
    };
    const adapter = new SafariDesktopMouseAdapter(controls, canvas, doc, win);

    adapter.connect();
    canvas.dispatch(
      'pointerdown',
      {
        pointerType: 'mouse',
        isPrimary: true,
        pointerId: 11,
        button: 0,
        clientX: 48,
        clientY: 72
      } as unknown as Event
    );
    canvas.dispatch('mousedown', { button: 0, buttons: 1, clientX: 48, clientY: 72 } as unknown as Event);

    expect(doc.listenerCount('mousemove')).toBe(1);
    expect(doc.listenerCount('mouseup')).toBe(1);
    expect(win.listenerCount('blur')).toBe(1);
    expect(doc.listenerCount('visibilitychange')).toBe(1);
    expect(events).not.toContain('down:rotate');

    doc.dispatch(
      'mousemove',
      { button: 0, buttons: 1, clientX: 58, clientY: 86 } as unknown as Event
    );

    expect(events).toContain('down:rotate');
    expect(events).toContain('start');
    expect(events).toContain('move:rotate');
    expect(controls.state).toBe(getOrbitStateForMouseAction('rotate'));
    expect(controls._controlActive).toBe(true);

    doc.dispatch('mouseup', { button: 0, buttons: 0, clientX: 58, clientY: 86 } as unknown as Event);

    expect(events).toContain('end');
    expect(controls.state).toBe(-1);
    expect(controls._controlActive).toBe(false);
    expect(doc.listenerCount('mousemove')).toBe(0);
    expect(doc.listenerCount('mouseup')).toBe(0);
    expect(win.listenerCount('blur')).toBe(0);
    expect(doc.listenerCount('visibilitychange')).toBe(0);
  });

  it('ends a click-only armed session on mouseup without emitting start or end', () => {
    const events: string[] = [];
    const canvas = new FakeListenerTarget();
    const doc = new FakeListenerTarget();
    const win = new FakeListenerTarget();
    const controls = {
      enabled: true,
      enableZoom: true,
      enableRotate: true,
      enablePan: true,
      mouseButtons: {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      },
      state: -1,
      _controlActive: false,
      _pointers: [],
      _pointerPositions: {},
      _onPointerMove: () => {},
      _onPointerUp: () => {},
      dispatchEvent: (event: { type: string }) => {
        events.push(event.type);
      },
      domElement: {
        hasPointerCapture: () => false,
        releasePointerCapture: () => {},
        removeEventListener: () => {}
      },
      _handleMouseDownRotate: () => {
        events.push('down:rotate');
      },
      _handleMouseDownDolly: () => {},
      _handleMouseDownPan: () => {},
      _handleMouseMoveRotate: () => {},
      _handleMouseMoveDolly: () => {},
      _handleMouseMovePan: () => {}
    };
    const adapter = new SafariDesktopMouseAdapter(controls, canvas, doc, win);

    adapter.connect();
    canvas.dispatch(
      'pointerdown',
      {
        pointerType: 'mouse',
        isPrimary: true,
        pointerId: 7,
        button: 0,
        clientX: 48,
        clientY: 72
      } as unknown as Event
    );
    canvas.dispatch('mousedown', { button: 0, buttons: 1, clientX: 48, clientY: 72 } as unknown as Event);

    doc.dispatch('mouseup', { button: 0, buttons: 0, clientX: 48, clientY: 72 } as unknown as Event);

    expect(events).toEqual([]);
    expect(controls.state).toBe(-1);
    expect(doc.listenerCount('mousemove')).toBe(0);
  });

  it('ends a stuck Safari drag when mousemove reports no pressed left button', () => {
    const events: string[] = [];
    const canvas = new FakeListenerTarget();
    const doc = new FakeListenerTarget();
    const win = new FakeListenerTarget();
    const controls = {
      enabled: true,
      enableZoom: true,
      enableRotate: true,
      enablePan: true,
      mouseButtons: {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      },
      state: -1,
      _controlActive: false,
      _pointers: [],
      _pointerPositions: {},
      _onPointerMove: () => {},
      _onPointerUp: () => {},
      dispatchEvent: (event: { type: string }) => {
        events.push(event.type);
      },
      domElement: {
        hasPointerCapture: () => false,
        releasePointerCapture: () => {},
        removeEventListener: () => {}
      },
      _handleMouseDownRotate: () => {
        events.push('down:rotate');
      },
      _handleMouseDownDolly: () => {},
      _handleMouseDownPan: () => {},
      _handleMouseMoveRotate: () => {
        events.push('move:rotate');
      },
      _handleMouseMoveDolly: () => {},
      _handleMouseMovePan: () => {}
    };
    const adapter = new SafariDesktopMouseAdapter(controls, canvas, doc, win);

    adapter.connect();
    canvas.dispatch(
      'pointerdown',
      {
        pointerType: 'mouse',
        isPrimary: true,
        pointerId: 8,
        button: 0,
        clientX: 48,
        clientY: 72
      } as unknown as Event
    );
    canvas.dispatch('mousedown', { button: 0, buttons: 1, clientX: 48, clientY: 72 } as unknown as Event);
    doc.dispatch(
      'mousemove',
      { button: 0, buttons: 1, clientX: 58, clientY: 86 } as unknown as Event
    );
    doc.dispatch(
      'mousemove',
      { button: 0, buttons: 0, clientX: 60, clientY: 88 } as unknown as Event
    );

    expect(events).toContain('down:rotate');
    expect(events).toContain('start');
    expect(events).toContain('end');
    expect(controls.state).toBe(-1);
    expect(doc.listenerCount('mousemove')).toBe(0);
  });

  it('ends the Safari session on blur and allows the next drag to start cleanly', () => {
    const events: string[] = [];
    const canvas = new FakeListenerTarget();
    const doc = new FakeListenerTarget();
    const win = new FakeListenerTarget();
    const controls = {
      enabled: true,
      enableZoom: true,
      enableRotate: true,
      enablePan: true,
      mouseButtons: {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      },
      state: -1,
      _controlActive: false,
      _pointers: [],
      _pointerPositions: {},
      _onPointerMove: () => {},
      _onPointerUp: () => {},
      dispatchEvent: (event: { type: string }) => {
        events.push(event.type);
      },
      domElement: {
        hasPointerCapture: () => false,
        releasePointerCapture: () => {},
        removeEventListener: () => {}
      },
      _handleMouseDownRotate: () => {
        events.push('down:rotate');
      },
      _handleMouseDownDolly: () => {},
      _handleMouseDownPan: () => {},
      _handleMouseMoveRotate: () => {
        events.push('move:rotate');
      },
      _handleMouseMoveDolly: () => {},
      _handleMouseMovePan: () => {}
    };
    const adapter = new SafariDesktopMouseAdapter(controls, canvas, doc, win);

    adapter.connect();
    canvas.dispatch(
      'pointerdown',
      {
        pointerType: 'mouse',
        isPrimary: true,
        pointerId: 9,
        button: 0,
        clientX: 48,
        clientY: 72
      } as unknown as Event
    );
    canvas.dispatch('mousedown', { button: 0, buttons: 1, clientX: 48, clientY: 72 } as unknown as Event);
    doc.dispatch(
      'mousemove',
      { button: 0, buttons: 1, clientX: 58, clientY: 86 } as unknown as Event
    );

    win.dispatch('blur', {} as Event);
    expect(events).toContain('end');
    expect(controls.state).toBe(-1);

    canvas.dispatch(
      'pointerdown',
      {
        pointerType: 'mouse',
        isPrimary: true,
        pointerId: 10,
        button: 0,
        clientX: 64,
        clientY: 92
      } as unknown as Event
    );
    canvas.dispatch('mousedown', { button: 0, buttons: 1, clientX: 64, clientY: 92 } as unknown as Event);
    doc.dispatch(
      'mousemove',
      { button: 0, buttons: 1, clientX: 72, clientY: 104 } as unknown as Event
    );

    expect(events.filter((entry) => entry === 'start')).toHaveLength(2);
    expect(doc.listenerCount('mousemove')).toBe(1);
  });

  it('ends the Safari session when the document becomes hidden', () => {
    const events: string[] = [];
    const canvas = new FakeListenerTarget();
    const doc = new FakeListenerTarget();
    const win = new FakeListenerTarget();
    const controls = {
      enabled: true,
      enableZoom: true,
      enableRotate: true,
      enablePan: true,
      mouseButtons: {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      },
      state: -1,
      _controlActive: false,
      _pointers: [],
      _pointerPositions: {},
      _onPointerMove: () => {},
      _onPointerUp: () => {},
      dispatchEvent: (event: { type: string }) => {
        events.push(event.type);
      },
      domElement: {
        hasPointerCapture: () => false,
        releasePointerCapture: () => {},
        removeEventListener: () => {}
      },
      _handleMouseDownRotate: () => {
        events.push('down:rotate');
      },
      _handleMouseDownDolly: () => {},
      _handleMouseDownPan: () => {},
      _handleMouseMoveRotate: () => {
        events.push('move:rotate');
      },
      _handleMouseMoveDolly: () => {},
      _handleMouseMovePan: () => {}
    };
    const adapter = new SafariDesktopMouseAdapter(controls, canvas, doc, win);

    adapter.connect();
    canvas.dispatch(
      'pointerdown',
      {
        pointerType: 'mouse',
        isPrimary: true,
        pointerId: 12,
        button: 0,
        clientX: 48,
        clientY: 72
      } as unknown as Event
    );
    canvas.dispatch('mousedown', { button: 0, buttons: 1, clientX: 48, clientY: 72 } as unknown as Event);
    doc.dispatch(
      'mousemove',
      { button: 0, buttons: 1, clientX: 58, clientY: 86 } as unknown as Event
    );
    doc.hidden = true;
    doc.dispatch('visibilitychange', {} as Event);

    expect(events).toContain('end');
    expect(controls.state).toBe(-1);
  });

  it('restarts cleanly on a second left drag after the first mouseup', () => {
    const events: string[] = [];
    const canvas = new FakeListenerTarget();
    const doc = new FakeListenerTarget();
    const win = new FakeListenerTarget();
    const controls = {
      enabled: true,
      enableZoom: true,
      enableRotate: true,
      enablePan: true,
      mouseButtons: {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      },
      state: -1,
      _controlActive: false,
      _pointers: [],
      _pointerPositions: {},
      _onPointerMove: () => {},
      _onPointerUp: () => {},
      dispatchEvent: (event: { type: string }) => {
        events.push(event.type);
      },
      domElement: {
        hasPointerCapture: () => false,
        releasePointerCapture: () => {},
        removeEventListener: () => {}
      },
      _handleMouseDownRotate: () => {
        events.push('down:rotate');
      },
      _handleMouseDownDolly: () => {},
      _handleMouseDownPan: () => {},
      _handleMouseMoveRotate: () => {
        events.push('move:rotate');
      },
      _handleMouseMoveDolly: () => {},
      _handleMouseMovePan: () => {}
    };
    const adapter = new SafariDesktopMouseAdapter(controls, canvas, doc, win);

    adapter.connect();
    canvas.dispatch(
      'pointerdown',
      {
        pointerType: 'mouse',
        isPrimary: true,
        pointerId: 20,
        button: 0,
        clientX: 48,
        clientY: 72
      } as unknown as Event
    );
    canvas.dispatch('mousedown', { button: 0, buttons: 1, clientX: 48, clientY: 72 } as unknown as Event);
    doc.dispatch('mousemove', { button: 0, buttons: 1, clientX: 58, clientY: 86 } as unknown as Event);
    expect(events).toContain('down:rotate');
    expect(events).toContain('start');
    doc.dispatch('mouseup', { button: 0, buttons: 0, clientX: 58, clientY: 86 } as unknown as Event);
    expect(events).toContain('end');

    canvas.dispatch(
      'pointerdown',
      {
        pointerType: 'mouse',
        isPrimary: true,
        pointerId: 21,
        button: 0,
        clientX: 60,
        clientY: 90
      } as unknown as Event
    );
    canvas.dispatch('mousedown', { button: 0, buttons: 1, clientX: 60, clientY: 90 } as unknown as Event);
    doc.dispatch('mousemove', { button: 0, buttons: 1, clientX: 72, clientY: 104 } as unknown as Event);

    expect(events.filter((entry) => entry === 'start')).toHaveLength(2);
    expect(events.filter((entry) => entry === 'end')).toHaveLength(1);
    expect(controls.state).toBe(getOrbitStateForMouseAction('rotate'));
    expect(doc.listenerCount('mousemove')).toBe(1);

    doc.dispatch('mouseup', { button: 0, buttons: 0, clientX: 72, clientY: 104 } as unknown as Event);

    expect(events.filter((entry) => entry === 'end')).toHaveLength(2);
    expect(controls.state).toBe(-1);
    expect(doc.listenerCount('mousemove')).toBe(0);
  });

  it('ignores non-left Safari mouse buttons instead of starting a drag session', () => {
    const events: string[] = [];
    const canvas = new FakeListenerTarget();
    const doc = new FakeListenerTarget();
    const win = new FakeListenerTarget();
    const stopCalls: string[] = [];
    const controls = {
      enabled: true,
      enableZoom: true,
      enableRotate: true,
      enablePan: true,
      mouseButtons: {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      },
      state: -1,
      _controlActive: false,
      _pointers: [],
      _pointerPositions: {},
      _onPointerMove: () => {},
      _onPointerUp: () => {},
      dispatchEvent: (event: { type: string }) => {
        events.push(event.type);
      },
      domElement: {
        hasPointerCapture: () => false,
        releasePointerCapture: () => {},
        removeEventListener: () => {}
      },
      _handleMouseDownRotate: () => {
        events.push('down:rotate');
      },
      _handleMouseDownDolly: () => {
        events.push('down:dolly');
      },
      _handleMouseDownPan: () => {
        events.push('down:pan');
      },
      _handleMouseMoveRotate: () => {
        events.push('move:rotate');
      },
      _handleMouseMoveDolly: () => {
        events.push('move:dolly');
      },
      _handleMouseMovePan: () => {
        events.push('move:pan');
      }
    };
    const adapter = new SafariDesktopMouseAdapter(controls, canvas, doc, win);

    adapter.connect();
    canvas.dispatch(
      'pointerdown',
      {
        pointerType: 'mouse',
        isPrimary: true,
        pointerId: 21,
        button: 2,
        clientX: 48,
        clientY: 72,
        stopImmediatePropagation: () => stopCalls.push('stop')
      } as unknown as Event
    );
    canvas.dispatch('mousedown', { button: 2, buttons: 2, clientX: 48, clientY: 72 } as unknown as Event);

    expect(events).toEqual([]);
    expect(controls.state).toBe(-1);
    expect(doc.listenerCount('mousemove')).toBe(0);
    expect(stopCalls).toEqual(['stop']);
  });

  it('forceEndPointerInteraction also ends an active Safari desktop drag session', () => {
    const calls: string[] = [];
    const rigLike = {
      safariDesktopMouseAdapter: {
        forceEnd: () => {
          calls.push('adapter');
          return true;
        }
      },
      controls: {
        state: -1,
        _pointers: [],
        _pointerPositions: {},
        _onPointerMove: () => {},
        _onPointerUp: () => {},
        domElement: {
          hasPointerCapture: () => false,
          releasePointerCapture: () => {},
          removeEventListener: () => {}
        }
      }
    } as unknown as CameraRig;

    CameraRig.prototype.forceEndPointerInteraction.call(rigLike, null);

    expect(calls).toEqual(['adapter']);
  });

  it('forwards orbit start and end events through the camera rig API', () => {
    const events: string[] = [];
    const controls = {
      addEventListener: (type: string) => {
        events.push(`add:${type}`);
      },
      removeEventListener: (type: string) => {
        events.push(`remove:${type}`);
      }
    };
    const handleStart = () => {
      events.push('start');
    };
    const handleEnd = () => {
      events.push('end');
    };
    const rigLike = { controls } as unknown as CameraRig;

    CameraRig.prototype.onInteractionStart.call(rigLike, handleStart);
    CameraRig.prototype.onInteractionEnd.call(rigLike, handleEnd);
    handleStart();
    handleEnd();
    CameraRig.prototype.offInteractionStart.call(rigLike, handleStart);
    CameraRig.prototype.offInteractionEnd.call(rigLike, handleEnd);

    expect(events).toEqual(['add:start', 'add:end', 'start', 'end', 'remove:start', 'remove:end']);
  });
});
