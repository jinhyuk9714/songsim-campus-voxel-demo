import * as THREE from 'three';
import type { CampusPlace } from '../data/campus';
import {
  CameraRig,
  getPointerSelectionThreshold,
  resolveInteractionProfile,
  type InteractionProfile
} from '../interaction/cameraRig';
import { createHud, type HudApi } from '../ui/hud';
import { buildCampus } from '../world/buildings';
import { createDecorations } from '../world/decorations';
import { createRoads } from '../world/roads';
import { createTerrain } from '../world/terrain';

interface PointerPoint {
  x: number;
  y: number;
}

export function didPointerStayWithinThreshold(start: PointerPoint, end: PointerPoint, threshold = 6): boolean {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  return deltaX * deltaX + deltaY * deltaY <= threshold * threshold;
}

export function shouldTrackHoverHighlight(profile: InteractionProfile): boolean {
  return profile === 'desktop';
}

export function shouldProcessMouseHover(
  profile: InteractionProfile,
  buttons: number,
  isOrbitInteracting: boolean
): boolean {
  return shouldTrackHoverHighlight(profile) && buttons === 0 && !isOrbitInteracting;
}

export function shouldIgnoreMouseClickAfterOrbit(didOrbitDuringMouseGesture: boolean): boolean {
  return didOrbitDuringMouseGesture;
}

function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  const materials = Array.isArray(material) ? material : [material];

  for (const item of materials) {
    const materialWithMaps = item as THREE.Material & Record<string, unknown>;
    for (const key of ['map', 'alphaMap', 'emissiveMap', 'roughnessMap', 'metalnessMap']) {
      const texture = materialWithMaps[key];
      if (texture instanceof THREE.Texture) {
        texture.dispose();
      }
    }
    item.dispose();
  }
}

function disposeObjectTree(root: THREE.Object3D): void {
  root.traverse((child: THREE.Object3D) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      disposeMaterial(child.material);
    }

    if (child instanceof THREE.Sprite) {
      child.material.map?.dispose();
      child.material.dispose();
    }
  });
}

export class SongsimExperience {
  private readonly scene = new THREE.Scene();
  private readonly renderer: THREE.WebGLRenderer;
  private readonly cameraRig: CameraRig;
  private readonly clock = new THREE.Clock();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();

  private readonly decorationsGroup = new THREE.Group();
  private readonly pickables: THREE.Object3D[] = [];
  private readonly labelSprites: THREE.Sprite[] = [];
  private readonly placeMeshes = new Map<string, THREE.Mesh[]>();
  private readonly hud: HudApi;

  private animationHandle = 0;
  private seed = 1;
  private showAllLabels = false;
  private interactionProfile: InteractionProfile = 'desktop';
  private selectedPlaceId: string | null = null;
  private hoveredPlaceId: string | null = null;
  private touchPointerDown: PointerPoint | null = null;
  private activeTouchPointerId: number | null = null;
  private isMouseGestureArmed = false;
  private didOrbitDuringMouseGesture = false;
  private isOrbitInteracting = false;

  constructor(private readonly container: HTMLElement) {
    const canvas = document.createElement('canvas');
    canvas.className = 'scene-canvas';
    this.container.append(canvas);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.cameraRig = new CameraRig(canvas);
    this.cameraRig.onInteractionStart(this.handleOrbitInteractionStart);
    this.cameraRig.onInteractionEnd(this.handleOrbitInteractionEnd);
    this.configureScene();
    this.composeWorld();
    this.hud = createHud({
      onResetCamera: () => this.cameraRig.reset(),
      onToggleMode: () => {
        const next = this.cameraRig.toggleMode();
        this.hud.setMode(next);
        return next;
      },
      onRegenerate: () => this.regenerateDecorations(),
      onToggleLabels: () => this.toggleLabels()
    });
    this.container.append(this.hud.element);
    this.hud.setMode(this.cameraRig.getMode());
    this.hud.setLabelsVisible(this.showAllLabels);

    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('blur', this.handleWindowBlur);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    canvas.addEventListener('mousedown', this.handleMouseDown);
    canvas.addEventListener('mouseup', this.handleMouseUp);
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointercancel', this.handlePointerCancel);
    canvas.addEventListener('pointerleave', this.handlePointerLeave);
    canvas.addEventListener('lostpointercapture', this.handleLostPointerCapture);
    canvas.addEventListener('click', this.handleCanvasClick);
  }

  public start(): void {
    this.animate();
  }

  public destroy(): void {
    cancelAnimationFrame(this.animationHandle);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('blur', this.handleWindowBlur);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.renderer.domElement.removeEventListener('mousedown', this.handleMouseDown);
    this.renderer.domElement.removeEventListener('mouseup', this.handleMouseUp);
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.removeEventListener('pointermove', this.handlePointerMove);
    this.renderer.domElement.removeEventListener('pointerup', this.handlePointerUp);
    this.renderer.domElement.removeEventListener('pointercancel', this.handlePointerCancel);
    this.renderer.domElement.removeEventListener('pointerleave', this.handlePointerLeave);
    this.renderer.domElement.removeEventListener('lostpointercapture', this.handleLostPointerCapture);
    this.renderer.domElement.removeEventListener('click', this.handleCanvasClick);
    this.cameraRig.offInteractionStart(this.handleOrbitInteractionStart);
    this.cameraRig.offInteractionEnd(this.handleOrbitInteractionEnd);
    disposeObjectTree(this.scene);
    this.cameraRig.dispose();
    this.renderer.dispose();
  }

  private configureScene(): void {
    this.scene.background = new THREE.Color(0xdde8f1);
    this.scene.fog = new THREE.Fog(0xdde8f1, 140, 320);

    const ambient = new THREE.HemisphereLight(0xf2f8ff, 0x708063, 1.18);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff0d6, 1.85);
    sun.position.set(88, 122, 54);
    sun.castShadow = true;
    sun.shadow.mapSize.setScalar(2048);
    sun.shadow.camera.left = -180;
    sun.shadow.camera.right = 180;
    sun.shadow.camera.top = 180;
    sun.shadow.camera.bottom = -180;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 320;
    this.scene.add(sun);
  }

  private composeWorld(): void {
    this.scene.add(createTerrain());
    this.scene.add(createRoads());

    const builtCampus = buildCampus();
    this.scene.add(builtCampus.group);
    this.pickables.push(...builtCampus.pickables);
    this.labelSprites.push(...builtCampus.labels);

    for (const object of builtCampus.pickables) {
      const place = object.userData.place as CampusPlace | undefined;
      if (!(object instanceof THREE.Mesh) || !place) {
        continue;
      }

      const existing = this.placeMeshes.get(place.id) ?? [];
      existing.push(object);
      this.placeMeshes.set(place.id, existing);
    }

    this.applyLabelVisibility();

    this.decorationsGroup.name = 'decoration-root';
    this.scene.add(this.decorationsGroup);
    this.regenerateDecorations();
  }

  private regenerateDecorations(): number {
    this.seed += 1;

    for (const child of [...this.decorationsGroup.children]) {
      disposeObjectTree(child);
      this.decorationsGroup.remove(child);
    }

    this.decorationsGroup.add(createDecorations(this.seed));
    this.hud?.setSeed(this.seed);
    return this.seed;
  }

  private toggleLabels(): boolean {
    this.showAllLabels = !this.showAllLabels;
    this.applyLabelVisibility();
    this.hud?.setLabelsVisible(this.showAllLabels);
    return this.showAllLabels;
  }

  private applyLabelVisibility(): void {
    for (const sprite of this.labelSprites) {
      const place = sprite.userData.place as CampusPlace | undefined;
      sprite.visible = this.showAllLabels || Boolean(place?.landmark);
    }
  }

  private animate = (): void => {
    this.animationHandle = requestAnimationFrame(this.animate);

    const deltaSeconds = this.clock.getDelta();
    this.cameraRig.update(deltaSeconds);
    this.renderer.render(this.scene, this.cameraRig.camera);
  };

  private readonly handleResize = (): void => {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer.setSize(width, height, false);
    this.cameraRig.resize(width, height);
    this.applyInteractionProfile(resolveInteractionProfile(window));
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (!event.isPrimary) {
      return;
    }

    if (event.pointerType === 'mouse') {
      if (event.button === 0) {
        this.isMouseGestureArmed = true;
        this.didOrbitDuringMouseGesture = false;
      }
      return;
    }

    this.activeTouchPointerId = event.pointerId;
    this.touchPointerDown = { x: event.clientX, y: event.clientY };
  };

  private readonly handleMouseDown = (event: MouseEvent): void => {
    if (event.button !== 0) {
      return;
    }

    this.isMouseGestureArmed = true;
    this.didOrbitDuringMouseGesture = false;
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') {
      return;
    }

    if (!shouldProcessMouseHover(this.interactionProfile, event.buttons, this.isOrbitInteracting)) {
      return;
    }

    this.setHoveredPlace(this.pickPlaceAtClient(event.clientX, event.clientY));
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (!event.isPrimary) {
      return;
    }

    if (event.pointerType === 'mouse') {
      if (event.button === 0) {
        this.isMouseGestureArmed = false;
      }
      return;
    }

    if (event.pointerId !== this.activeTouchPointerId || !this.touchPointerDown) {
      return;
    }

    const pointerUp = { x: event.clientX, y: event.clientY };
    if (
      didPointerStayWithinThreshold(
        this.touchPointerDown,
        pointerUp,
        getPointerSelectionThreshold(this.interactionProfile)
      )
      && !this.isOrbitInteracting
    ) {
      this.setSelectedPlace(this.pickPlaceAtClient(event.clientX, event.clientY));
    }

    this.resetTouchPointerState();
  };

  private readonly handleMouseUp = (event: MouseEvent): void => {
    if (event.button === 0) {
      this.isMouseGestureArmed = false;
    }
  };

  private readonly handlePointerCancel = (event: PointerEvent): void => {
    if (!event.isPrimary) {
      return;
    }

    if (event.pointerType === 'mouse') {
      this.isMouseGestureArmed = false;
      this.didOrbitDuringMouseGesture = false;
      return;
    }

    if (this.activeTouchPointerId === null || event.pointerId === this.activeTouchPointerId) {
      this.resetTouchPointerState();
    }
  };

  private readonly handlePointerLeave = (): void => {
    this.setHoveredPlace(null);
  };

  private readonly handleLostPointerCapture = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse' && this.activeTouchPointerId !== null && event.pointerId === this.activeTouchPointerId) {
      this.resetTouchPointerState();
    }
  };

  private readonly handleWindowBlur = (): void => {
    this.resetInteractionsForEmergency();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.resetInteractionsForEmergency();
    }
  };

  private readonly handleOrbitInteractionStart = (): void => {
    this.isOrbitInteracting = true;
    if (this.isMouseGestureArmed) {
      this.didOrbitDuringMouseGesture = true;
    }
  };

  private readonly handleOrbitInteractionEnd = (): void => {
    this.isOrbitInteracting = false;
  };

  private readonly handleCanvasClick = (event: MouseEvent): void => {
    if (this.interactionProfile !== 'desktop' || event.button !== 0) {
      return;
    }

    if (shouldIgnoreMouseClickAfterOrbit(this.didOrbitDuringMouseGesture) || this.isOrbitInteracting) {
      this.didOrbitDuringMouseGesture = false;
      return;
    }

    this.setSelectedPlace(this.pickPlaceAtClient(event.clientX, event.clientY));
    this.didOrbitDuringMouseGesture = false;
  };

  private pickPlaceAtClient(clientX: number, clientY: number): CampusPlace | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.cameraRig.camera);
    const hits = this.raycaster.intersectObjects(this.pickables, false);
    const selected = hits.find((hit: THREE.Intersection<THREE.Object3D>) => hit.object.userData.place) ?? null;
    return (selected?.object.userData.place as CampusPlace | undefined) ?? null;
  }

  private setHoveredPlace(place: CampusPlace | null): void {
    const nextId = place?.id ?? null;
    if (nextId === this.hoveredPlaceId) {
      return;
    }

    this.hoveredPlaceId = nextId;
    this.updatePlaceHighlights();
  }

  private setSelectedPlace(place: CampusPlace | null): void {
    this.selectedPlaceId = place?.id ?? null;
    this.hud.showPlace(place);

    if (place) {
      this.cameraRig.flyTo(place);
    }

    this.updatePlaceHighlights();
  }

  private applyInteractionProfile(profile: InteractionProfile): void {
    this.interactionProfile = profile;
    this.cameraRig.setInteractionProfile(profile);
    this.hud.setInteractionProfile(profile);

    if (!shouldTrackHoverHighlight(profile) && this.hoveredPlaceId !== null) {
      this.hoveredPlaceId = null;
      this.updatePlaceHighlights();
    }
  }

  private resetTouchPointerState(): void {
    this.activeTouchPointerId = null;
    this.touchPointerDown = null;
  }

  private resetInteractionsForEmergency(): void {
    this.resetTouchPointerState();
    this.isMouseGestureArmed = false;
    this.didOrbitDuringMouseGesture = false;
    this.isOrbitInteracting = false;
    this.setHoveredPlace(null);

    if (this.cameraRig.isOrbitPointerInteractionActive()) {
      this.cameraRig.forceEndPointerInteraction();
    }
  }

  private updatePlaceHighlights(): void {
    for (const [placeId, meshes] of this.placeMeshes) {
      const isSelected = this.selectedPlaceId === placeId;
      const isHovered = shouldTrackHoverHighlight(this.interactionProfile) && this.hoveredPlaceId === placeId;
      const selectedIntensity = this.interactionProfile === 'touch' ? 0.52 : 0.4;

      for (const mesh of meshes) {
        const material = mesh.material;
        if (!(material instanceof THREE.MeshStandardMaterial)) {
          continue;
        }

        material.emissive.setHex(isSelected ? 0x466582 : isHovered ? 0x274255 : 0x000000);
        material.emissiveIntensity = isSelected ? selectedIntensity : isHovered ? 0.24 : 0;
      }
    }
  }
}
