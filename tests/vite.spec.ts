import { describe, expect, it } from 'vitest';
import { getManualChunkName, songsimBuildConfig } from '../src/build/viteBuildConfig';

describe('vite chunk splitting', () => {
  it('classifies three and runtime modules into stable manual chunks', () => {
    expect(getManualChunkName('/workspace/node_modules/three/build/three.module.js')).toBe('three-vendor');
    expect(getManualChunkName('/workspace/node_modules/three/examples/jsm/controls/OrbitControls.js')).toBe(
      'three-extras'
    );
    expect(getManualChunkName('/workspace/src/scene/SongsimExperience.ts')).toBe('songsim-runtime');
    expect(getManualChunkName('/workspace/src/world/terrain.ts')).toBe('songsim-runtime');
    expect(getManualChunkName('/workspace/src/interaction/cameraRig.ts')).toBe('songsim-runtime');
    expect(getManualChunkName('/workspace/src/main.ts')).toBeUndefined();
  });

  it('wires the manual chunk classifier into the Vite build config', () => {
    const output = songsimBuildConfig.rollupOptions.output;

    expect(output).toBeDefined();
    expect(output?.manualChunks).toBeDefined();
    expect(output?.manualChunks?.('/workspace/node_modules/three/src/Three.js')).toBe('three-vendor');
    expect(output?.manualChunks?.('/workspace/node_modules/three/examples/jsm/controls/OrbitControls.js')).toBe(
      'three-extras'
    );
    expect(output?.manualChunks?.('/workspace/src/world/buildings.ts')).toBe('songsim-runtime');
  });
});
