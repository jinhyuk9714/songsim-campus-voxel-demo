import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CAMPUS_WORLD_BOUNDS } from '../data/campus';

export type CameraMode = 'isometric' | 'free';
export type InteractionProfile = 'desktop' | 'touch';

export interface InteractionProfileSource {
  innerWidth: number;
  matchMedia?: (query: string) => { matches: boolean };
}

export interface FocusableTarget {
  x: number;
  z: number;
  height: number;
}

interface FocusFrame {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

interface GroundMovementBasis {
  forward: THREE.Vector3;
  right: THREE.Vector3;
}

interface CameraFlight {
  fromPosition: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toPosition: THREE.Vector3;
  toTarget: THREE.Vector3;
  progress: number;
  duration: number;
}

interface ResettableOrbitDomElement {
  hasPointerCapture(pointerId: number): boolean;
  releasePointerCapture(pointerId: number): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

export interface ResettableOrbitControlsLike {
  state: number;
  _controlActive?: boolean;
  _pointers: number[];
  _pointerPositions: Record<number, unknown>;
  _onPointerMove: EventListenerOrEventListenerObject;
  _onPointerUp: EventListenerOrEventListenerObject;
  dispatchEvent?: (event: { type: string }) => void;
  domElement: ResettableOrbitDomElement;
}

interface OrbitInteractionStateLike {
  state: number;
  _pointers: number[];
}

export interface SafariDesktopMouseAdapterSource {
  userAgent?: string;
  platform?: string;
  matchMedia?: (query: string) => { matches: boolean };
}

interface OrbitMouseButtonsLike {
  LEFT: number;
  MIDDLE: number;
  RIGHT: number;
}

interface OrbitMouseModifiersLike {
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
}

interface OrbitMouseEventLike extends OrbitMouseModifiersLike {
  button?: number;
  buttons?: number;
  pointerId?: number;
  clientX?: number;
  clientY?: number;
  pageX?: number;
  pageY?: number;
  isPrimary?: boolean;
  pointerType?: string;
  preventDefault?: () => void;
  stopImmediatePropagation?: () => void;
}

interface ListenerTargetLike {
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: EventListenerOptions | boolean
  ): void;
}

interface VisibilityListenerTargetLike extends ListenerTargetLike {
  hidden?: boolean;
}

export type OrbitMouseAction = 'none' | 'rotate' | 'dolly' | 'pan';

export interface SafariDesktopOrbitControlsLike extends ResettableOrbitControlsLike {
  enabled: boolean;
  enableZoom: boolean;
  enableRotate: boolean;
  enablePan: boolean;
  mouseButtons: OrbitMouseButtonsLike;
  _handleMouseDownRotate: (event: OrbitMouseEventLike) => void;
  _handleMouseDownDolly: (event: OrbitMouseEventLike) => void;
  _handleMouseDownPan: (event: OrbitMouseEventLike) => void;
  _handleMouseMoveRotate: (event: OrbitMouseEventLike) => void;
  _handleMouseMoveDolly: (event: OrbitMouseEventLike) => void;
  _handleMouseMovePan: (event: OrbitMouseEventLike) => void;
  dispatchEvent: (event: { type: string }) => void;
}

const TARGET_BOUNDS = {
  minX: CAMPUS_WORLD_BOUNDS.minX,
  maxX: CAMPUS_WORLD_BOUNDS.maxX,
  minZ: CAMPUS_WORLD_BOUNDS.minZ,
  maxZ: CAMPUS_WORLD_BOUNDS.maxZ
};

const CAMERA_BOUNDS = {
  minX: CAMPUS_WORLD_BOUNDS.minX - 24,
  maxX: CAMPUS_WORLD_BOUNDS.maxX + 26,
  minY: 16,
  maxY: 150,
  minZ: CAMPUS_WORLD_BOUNDS.minZ - 28,
  maxZ: CAMPUS_WORLD_BOUNDS.maxZ + 28
};

const HOME_FRAME: FocusFrame = {
  position: new THREE.Vector3(88, 98, 132),
  target: new THREE.Vector3(34, 12, 18)
};

const ORBIT_STATE_NONE = -1;
const ORBIT_STATE_ROTATE = 0;
const ORBIT_STATE_DOLLY = 1;
const ORBIT_STATE_PAN = 2;

function hasOrbitMouseModifier(modifiers: OrbitMouseModifiersLike): boolean {
  return Boolean(modifiers.ctrlKey || modifiers.metaKey || modifiers.shiftKey);
}

function applyOrbitMouseDownAction(
  controls: SafariDesktopOrbitControlsLike,
  action: Exclude<OrbitMouseAction, 'none'>,
  event: OrbitMouseEventLike
): void {
  switch (action) {
    case 'rotate':
      controls._handleMouseDownRotate(event);
      break;
    case 'dolly':
      controls._handleMouseDownDolly(event);
      break;
    case 'pan':
      controls._handleMouseDownPan(event);
      break;
  }
}

function applyOrbitMouseMoveAction(
  controls: SafariDesktopOrbitControlsLike,
  action: Exclude<OrbitMouseAction, 'none'>,
  event: OrbitMouseEventLike
): void {
  switch (action) {
    case 'rotate':
      controls._handleMouseMoveRotate(event);
      break;
    case 'dolly':
      controls._handleMouseMoveDolly(event);
      break;
    case 'pan':
      controls._handleMouseMovePan(event);
      break;
  }
}

export function shouldUseSafariDesktopMouseAdapter(source: SafariDesktopMouseAdapterSource): boolean {
  const hasCoarsePointer = source.matchMedia ? source.matchMedia('(pointer: coarse)').matches : false;
  const userAgent = source.userAgent ?? '';
  const platform = source.platform ?? '';
  const isMacDesktop = /Macintosh|Mac OS X/.test(userAgent) || /Mac/.test(platform);
  const isSafari =
    /Safari\//.test(userAgent) && !/(Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS|DuckDuckGo)/.test(userAgent);

  return isMacDesktop && isSafari && !hasCoarsePointer;
}

export function resolveOrbitMouseAction(
  button: number,
  modifiers: OrbitMouseModifiersLike,
  mouseButtons: OrbitMouseButtonsLike = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN
  }
): OrbitMouseAction {
  let mappedAction = -1;

  switch (button) {
    case 0:
      mappedAction = mouseButtons.LEFT;
      break;
    case 1:
      mappedAction = mouseButtons.MIDDLE;
      break;
    case 2:
      mappedAction = mouseButtons.RIGHT;
      break;
  }

  switch (mappedAction) {
    case THREE.MOUSE.DOLLY:
      return 'dolly';
    case THREE.MOUSE.ROTATE:
      return hasOrbitMouseModifier(modifiers) ? 'pan' : 'rotate';
    case THREE.MOUSE.PAN:
      return hasOrbitMouseModifier(modifiers) ? 'rotate' : 'pan';
    default:
      return 'none';
  }
}

export function getOrbitStateForMouseAction(action: OrbitMouseAction): number {
  switch (action) {
    case 'rotate':
      return ORBIT_STATE_ROTATE;
    case 'dolly':
      return ORBIT_STATE_DOLLY;
    case 'pan':
      return ORBIT_STATE_PAN;
    default:
      return ORBIT_STATE_NONE;
  }
}

export class SafariDesktopMouseAdapter {
  private session: { phase: 'armed' | 'dragging'; downEvent: OrbitMouseEventLike } | null = null;

  constructor(
    private readonly controls: SafariDesktopOrbitControlsLike,
    private readonly canvasTarget: ListenerTargetLike,
    private readonly documentTarget: VisibilityListenerTargetLike,
    private readonly windowTarget: ListenerTargetLike
  ) {}

  public connect(): void {
    this.canvasTarget.addEventListener('pointerdown', this.handlePointerDownCapture, true);
    this.canvasTarget.addEventListener('mousedown', this.handleMouseDown);
  }

  public disconnect(): void {
    this.canvasTarget.removeEventListener('pointerdown', this.handlePointerDownCapture, true);
    this.canvasTarget.removeEventListener('mousedown', this.handleMouseDown);
    this.forceEnd();
  }

  public isActive(): boolean {
    return this.session !== null;
  }

  public forceEnd(): boolean {
    if (this.session === null) {
      return false;
    }

    this.finishSession();
    return true;
  }

  private readonly handlePointerDownCapture = (event: Event): void => {
    const pointerEvent = event as unknown as OrbitMouseEventLike;
    if (!this.controls.enabled || pointerEvent.pointerType !== 'mouse' || pointerEvent.isPrimary === false) {
      return;
    }

    pointerEvent.stopImmediatePropagation?.();
  };

  private readonly handleMouseDown = (event: Event): void => {
    const mouseEvent = event as unknown as OrbitMouseEventLike;
    if (!this.controls.enabled) {
      return;
    }

    if ((mouseEvent.button ?? -1) !== 0 || !this.controls.enableRotate) {
      return;
    }

    this.beginSession({
      button: 0,
      buttons: mouseEvent.buttons,
      clientX: mouseEvent.clientX,
      clientY: mouseEvent.clientY,
      pageX: mouseEvent.pageX,
      pageY: mouseEvent.pageY
    });
  };

  private readonly handleMouseMove = (event: Event): void => {
    const mouseEvent = event as unknown as OrbitMouseEventLike;
    if (!this.session) {
      return;
    }

    if (((mouseEvent.buttons ?? 0) & 1) !== 1) {
      this.finishSession();
      return;
    }

    mouseEvent.preventDefault?.();

    if (this.session.phase === 'armed') {
      this.controls.state = ORBIT_STATE_ROTATE;
      applyOrbitMouseDownAction(this.controls, 'rotate', this.session.downEvent);
      this.session.phase = 'dragging';
      this.controls._controlActive = true;
      this.controls.dispatchEvent({ type: 'start' });
    }

    applyOrbitMouseMoveAction(this.controls, 'rotate', mouseEvent);
  };

  private readonly handleMouseUp = (event: Event): void => {
    const mouseEvent = event as unknown as OrbitMouseEventLike;
    if (!this.session) {
      return;
    }

    mouseEvent.preventDefault?.();
    this.finishSession();
  };

  private readonly handleVisibilityChange = (): void => {
    if (this.documentTarget.hidden) {
      this.finishSession();
    }
  };

  private readonly handleWindowBlur = (): void => {
    this.finishSession();
  };

  private beginSession(downEvent: OrbitMouseEventLike): void {
    if (this.session) {
      this.finishSession();
    }

    this.controls.state = ORBIT_STATE_NONE;
    this.controls._controlActive = false;
    this.session = { phase: 'armed', downEvent };
    this.documentTarget.addEventListener('mousemove', this.handleMouseMove);
    this.documentTarget.addEventListener('mouseup', this.handleMouseUp);
    this.documentTarget.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.windowTarget.addEventListener('blur', this.handleWindowBlur);
  }

  private finishSession(): void {
    const shouldDispatchEnd = this.session?.phase === 'dragging';
    this.removeRootListeners();
    this.session = null;
    this.controls._controlActive = false;
    this.controls.state = ORBIT_STATE_NONE;

    if (shouldDispatchEnd) {
      this.controls.dispatchEvent({ type: 'end' });
    }
  }

  private removeRootListeners(): void {
    this.documentTarget.removeEventListener('mousemove', this.handleMouseMove);
    this.documentTarget.removeEventListener('mouseup', this.handleMouseUp);
    this.documentTarget.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.windowTarget.removeEventListener('blur', this.handleWindowBlur);
  }
}

export function resolveInteractionProfile(source: InteractionProfileSource): InteractionProfile {
  const hasCoarsePointer = source.matchMedia ? source.matchMedia('(pointer: coarse)').matches : false;
  return hasCoarsePointer || source.innerWidth <= 820 ? 'touch' : 'desktop';
}

export function getPointerSelectionThreshold(profile: InteractionProfile): number {
  return profile === 'touch' ? 12 : 6;
}

export function getGroundMovementBasis(azimuth: number): GroundMovementBasis {
  const forward = new THREE.Vector3(-Math.sin(azimuth), 0, -Math.cos(azimuth)).normalize();
  const right = new THREE.Vector3(Math.cos(azimuth), 0, -Math.sin(azimuth)).normalize();
  return { forward, right };
}

export function isOrbitPointerInteractionActive(controls: OrbitInteractionStateLike): boolean {
  return controls.state !== ORBIT_STATE_NONE || controls._pointers.length > 0;
}

export function resetOrbitPointerInteraction(
  controls: ResettableOrbitControlsLike,
  pointerId: number | null = null
): void {
  const pointerIds = pointerId === null ? [...controls._pointers] : [pointerId];

  for (const activePointerId of pointerIds) {
    if (controls.domElement.hasPointerCapture(activePointerId)) {
      controls.domElement.releasePointerCapture(activePointerId);
    }
  }

  controls.domElement.removeEventListener('pointermove', controls._onPointerMove);
  controls.domElement.removeEventListener('pointerup', controls._onPointerUp);
  controls._pointers.length = 0;
  controls._pointerPositions = {};
  controls._controlActive = false;
  controls.state = ORBIT_STATE_NONE;
  controls.dispatchEvent?.({ type: 'end' });
}

export function clampToCampusBounds(target: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(
    THREE.MathUtils.clamp(target.x, TARGET_BOUNDS.minX, TARGET_BOUNDS.maxX),
    Math.max(6, target.y),
    THREE.MathUtils.clamp(target.z, TARGET_BOUNDS.minZ, TARGET_BOUNDS.maxZ)
  );
}

function clampCameraPosition(position: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(
    THREE.MathUtils.clamp(position.x, CAMERA_BOUNDS.minX, CAMERA_BOUNDS.maxX),
    THREE.MathUtils.clamp(position.y, CAMERA_BOUNDS.minY, CAMERA_BOUNDS.maxY),
    THREE.MathUtils.clamp(position.z, CAMERA_BOUNDS.minZ, CAMERA_BOUNDS.maxZ)
  );
}

export function buildFocusFrame(
  target: FocusableTarget,
  mode: CameraMode,
  interactionProfile: InteractionProfile = 'desktop'
): FocusFrame {
  const focusTarget = clampToCampusBounds(new THREE.Vector3(target.x, 8 + target.height * 0.24, target.z));
  const offset =
    mode === 'isometric'
      ? interactionProfile === 'touch'
        ? new THREE.Vector3(38, 36, 46)
        : new THREE.Vector3(34, 30, 36)
      : interactionProfile === 'touch'
        ? new THREE.Vector3(30, 26, 36)
        : new THREE.Vector3(24, 22, 28);
  const position = clampCameraPosition(focusTarget.clone().add(offset));
  return { position, target: focusTarget };
}

export class CameraRig {
  public readonly camera: THREE.PerspectiveCamera;
  public readonly controls: OrbitControls;

  private readonly keys = new Set<string>();
  private readonly safariDesktopMouseAdapter: SafariDesktopMouseAdapter | null;
  private mode: CameraMode = 'isometric';
  private interactionProfile: InteractionProfile = 'desktop';
  private flight: CameraFlight | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 600);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.maxDistance = 190;
    this.controls.minDistance = 18;
    this.controls.target.copy(HOME_FRAME.target);
    this.controls.touches.ONE = THREE.TOUCH.ROTATE;
    this.controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    const ownerDocument = canvas.ownerDocument ?? document;
    const ownerWindow = ownerDocument.defaultView ?? window;
    this.safariDesktopMouseAdapter = shouldUseSafariDesktopMouseAdapter({
      userAgent: ownerWindow.navigator.userAgent,
      platform: ownerWindow.navigator.platform,
      matchMedia: typeof ownerWindow.matchMedia === 'function' ? ownerWindow.matchMedia.bind(ownerWindow) : undefined
    })
      ? new SafariDesktopMouseAdapter(
          this.controls as unknown as SafariDesktopOrbitControlsLike,
          canvas,
          ownerDocument,
          ownerWindow
        )
      : null;
    this.safariDesktopMouseAdapter?.connect();

    this.setInteractionProfile('desktop');
    this.reset();

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  public getMode(): CameraMode {
    return this.mode;
  }

  public setInteractionProfile(profile: InteractionProfile): void {
    this.interactionProfile = profile;
    this.controls.dampingFactor = profile === 'touch' ? 0.12 : 0.08;
    this.controls.panSpeed = profile === 'touch' ? 0.82 : 1;
    this.controls.touches.ONE = THREE.TOUCH.ROTATE;
    this.controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    this.setMode(this.mode);
  }

  public setMode(mode: CameraMode): void {
    this.mode = mode;
    const isTouch = this.interactionProfile === 'touch';

    if (mode === 'isometric') {
      this.controls.minPolarAngle = 0.52;
      this.controls.maxPolarAngle = 1.22;
      this.controls.enablePan = isTouch;
      this.controls.rotateSpeed = isTouch ? 0.66 : 0.88;
      this.controls.zoomSpeed = isTouch ? 0.88 : 1.1;
    } else {
      this.controls.minPolarAngle = 0.18;
      this.controls.maxPolarAngle = Math.PI / 2.04;
      this.controls.enablePan = true;
      this.controls.rotateSpeed = isTouch ? 0.82 : 1;
      this.controls.zoomSpeed = isTouch ? 0.92 : 1.08;
    }
  }

  public toggleMode(): CameraMode {
    this.setMode(this.mode === 'isometric' ? 'free' : 'isometric');
    return this.mode;
  }

  public reset(): void {
    this.flight = null;
    this.camera.position.copy(HOME_FRAME.position);
    this.controls.target.copy(HOME_FRAME.target);
    this.setMode('isometric');
    this.controls.update();
  }

  public flyTo(target: FocusableTarget): void {
    const frame = buildFocusFrame(target, this.mode, this.interactionProfile);
    this.flight = {
      fromPosition: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      toPosition: frame.position,
      toTarget: frame.target,
      progress: 0,
      duration: 0.82
    };
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public forceEndPointerInteraction(pointerId: number | null = null): void {
    this.safariDesktopMouseAdapter?.forceEnd();

    if (isOrbitPointerInteractionActive(this.controls as unknown as ResettableOrbitControlsLike)) {
      resetOrbitPointerInteraction(this.controls as unknown as ResettableOrbitControlsLike, pointerId);
    }
  }

  public isOrbitPointerInteractionActive(): boolean {
    return (
      Boolean(this.safariDesktopMouseAdapter?.isActive())
      || isOrbitPointerInteractionActive(this.controls as unknown as ResettableOrbitControlsLike)
    );
  }

  public onInteractionStart(listener: () => void): void {
    this.controls.addEventListener('start', listener);
  }

  public onInteractionEnd(listener: () => void): void {
    this.controls.addEventListener('end', listener);
  }

  public offInteractionStart(listener: () => void): void {
    this.controls.removeEventListener('start', listener);
  }

  public offInteractionEnd(listener: () => void): void {
    this.controls.removeEventListener('end', listener);
  }

  public update(deltaSeconds: number): void {
    if (this.flight) {
      this.flight.progress = Math.min(1, this.flight.progress + deltaSeconds / this.flight.duration);
      const eased = this.flight.progress * this.flight.progress * (3 - 2 * this.flight.progress);
      this.camera.position.lerpVectors(this.flight.fromPosition, this.flight.toPosition, eased);
      this.controls.target.lerpVectors(this.flight.fromTarget, this.flight.toTarget, eased);

      if (this.flight.progress >= 1) {
        this.flight = null;
      }

      this.enforceBounds();
      this.controls.update();
    } else {
      this.controls.update();
      this.applyKeyboardMovement(deltaSeconds);
      this.enforceBounds();
    }
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.safariDesktopMouseAdapter?.disconnect();
    this.controls.dispose();
  }

  private applyKeyboardMovement(deltaSeconds: number): void {
    if (this.keys.size === 0) {
      return;
    }

    const speed = this.mode === 'free' ? 22 : 17;
    const distance = speed * deltaSeconds;
    const { forward, right } = getGroundMovementBasis(this.controls.getAzimuthalAngle());
    const move = new THREE.Vector3();

    if (this.keys.has('KeyW')) move.add(forward);
    if (this.keys.has('KeyS')) move.sub(forward);
    if (this.keys.has('KeyA')) move.sub(right);
    if (this.keys.has('KeyD')) move.add(right);

    if (move.lengthSq() === 0) {
      return;
    }

    move.normalize().multiplyScalar(distance);
    const previousTarget = this.controls.target.clone();
    const nextTarget = clampToCampusBounds(previousTarget.clone().add(move));
    const appliedMove = nextTarget.sub(previousTarget);
    this.controls.target.add(appliedMove);
    this.camera.position.add(appliedMove);
  }

  private enforceBounds(): void {
    const clampedTarget = clampToCampusBounds(this.controls.target.clone());
    const cameraOffset = this.camera.position.clone().sub(this.controls.target);
    this.controls.target.copy(clampedTarget);
    this.camera.position.copy(clampCameraPosition(clampedTarget.clone().add(cameraOffset)));
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'KeyR') {
      this.reset();
      return;
    }

    if (event.code === 'KeyW' || event.code === 'KeyA' || event.code === 'KeyS' || event.code === 'KeyD') {
      this.keys.add(event.code);
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
  };
}
