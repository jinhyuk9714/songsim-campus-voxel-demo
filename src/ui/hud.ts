import type { CampusPlace } from '../data/campus';
import type { CameraMode, InteractionProfile } from '../interaction/cameraRig';

export interface HudHandlers {
  onResetCamera: () => void;
  onToggleMode: () => CameraMode;
  onRegenerate: () => number;
  onToggleLabels: () => boolean;
}

export interface HudApi {
  element: HTMLElement;
  setMode: (mode: CameraMode) => void;
  setSeed: (seed: number) => void;
  setLabelsVisible: (showAll: boolean) => void;
  setInteractionProfile: (profile: InteractionProfile) => void;
  showPlace: (place: CampusPlace | null) => void;
}

interface CampusSummary {
  title: string;
  subtitle: string;
  meta: string;
  note: string;
}

function formatCategory(category: CampusPlace['category']): string {
  return category.replace(/-/g, ' ');
}

export function getHudHelpItems(profile: InteractionProfile): string[] {
  if (profile === 'touch') {
    return ['드래그: 회전', '핀치: 확대/이동', '탭: 선택 + 이동'];
  }

  return [
    'Mouse drag: orbit',
    'Wheel: zoom',
    'W/A/S/D: move focus',
    'R: home view',
    'Hover: highlight POI',
    'Click: official detail + fly-to'
  ];
}

export function formatHudTag(
  profile: InteractionProfile,
  kind: 'mode' | 'seed' | 'labels',
  value: CameraMode | number | boolean
): string {
  if (kind === 'mode') {
    const mode = value as CameraMode;
    return profile === 'touch' ? (mode === 'isometric' ? 'iso' : 'free') : mode;
  }

  if (kind === 'seed') {
    const seed = value as number;
    return profile === 'touch' ? `s${seed}` : `seed ${seed}`;
  }

  const showAll = value as boolean;
  return profile === 'touch' ? (showAll ? 'all' : 'core') : showAll ? 'all labels' : 'core labels';
}

export function describeCampusFocus(place: CampusPlace): CampusSummary {
  return {
    title: `${place.mapIndex} ${place.nameKo}${place.code ? ` (${place.code})` : ''}`,
    subtitle: place.nameEn,
    meta: `${formatCategory(place.category)} · ${Math.round(place.height)}m voxel massing`,
    note: place.note
  };
}

function createEmptySummary(): CampusSummary {
  return {
    title: '성심교정 공식 캠퍼스맵',
    subtitle: 'Select any official map point of interest.',
    meta: 'Default labels show core landmarks · toggle to show all official map numbers',
    note: 'Click a building, plaza, lawn, court, or gate to update the panel and trigger a fly-to view.'
  };
}

export function createHud(handlers: HudHandlers): HudApi {
  const wrapper = document.createElement('div');
  wrapper.className = 'hud';
  let interactionProfile: InteractionProfile = 'desktop';
  let currentMode: CameraMode = 'isometric';
  let currentSeed = 1;
  let showAllLabels = false;

  const title = document.createElement('div');
  title.className = 'hud__title';
  title.innerHTML = `
    <strong>성심교정 Official Map Demo</strong>
    <span>Voxel reinterpretation aligned to the official campus map.</span>
  `;

  const controls = document.createElement('div');
  controls.className = 'hud__controls';

  const modeTag = tag(formatHudTag(interactionProfile, 'mode', currentMode));
  const seedTag = tag(formatHudTag(interactionProfile, 'seed', currentSeed));
  const labelsTag = tag(formatHudTag(interactionProfile, 'labels', showAllLabels));

  const resetButton = button('Reset Camera', () => handlers.onResetCamera());
  const modeButton = button('Toggle Free Camera', () => {
    const next = handlers.onToggleMode();
    currentMode = next;
    syncTags();
  });
  const regenerateButton = button('Refresh Props', () => {
    const nextSeed = handlers.onRegenerate();
    currentSeed = nextSeed;
    syncTags();
  });
  const labelsButton = button('Toggle All Labels', () => {
    showAllLabels = handlers.onToggleLabels();
    syncTags();
  });

  controls.append(resetButton, modeButton, regenerateButton, labelsButton);

  const meta = document.createElement('div');
  meta.className = 'hud__meta';
  meta.append(modeTag, seedTag, labelsTag);

  const help = document.createElement('div');
  help.className = 'hud__help';

  const panel = document.createElement('div');
  panel.className = 'hud__panel';

  const syncTags = (): void => {
    modeTag.textContent = formatHudTag(interactionProfile, 'mode', currentMode);
    seedTag.textContent = formatHudTag(interactionProfile, 'seed', currentSeed);
    labelsTag.textContent = formatHudTag(interactionProfile, 'labels', showAllLabels);
  };

  const renderHelp = (): void => {
    help.innerHTML = getHudHelpItems(interactionProfile).map((item) => `<span>${item}</span>`).join('');
  };

  const renderPanel = (summary: CampusSummary): void => {
    panel.innerHTML = `
      <h2>${summary.title}</h2>
      <p><strong>${summary.subtitle}</strong></p>
      <p>${summary.meta}</p>
      <p>${summary.note}</p>
    `;
  };

  renderHelp();
  renderPanel(createEmptySummary());

  wrapper.append(title, controls, meta, help, panel);

  return {
    element: wrapper,
    setMode(mode) {
      currentMode = mode;
      syncTags();
    },
    setSeed(seed) {
      currentSeed = seed;
      syncTags();
    },
    setLabelsVisible(showAll) {
      showAllLabels = showAll;
      syncTags();
    },
    setInteractionProfile(profile) {
      interactionProfile = profile;
      wrapper.classList.toggle('hud--touch', profile === 'touch');
      renderHelp();
      syncTags();
    },
    showPlace(place) {
      renderPanel(place ? describeCampusFocus(place) : createEmptySummary());
    }
  };
}

function button(label: string, onClick: () => void): HTMLButtonElement {
  const element = document.createElement('button');
  element.className = 'hud__button';
  element.type = 'button';
  element.textContent = label;
  element.addEventListener('click', onClick);
  return element;
}

function tag(text: string): HTMLSpanElement {
  const element = document.createElement('span');
  element.className = 'hud__tag';
  element.textContent = text;
  return element;
}
