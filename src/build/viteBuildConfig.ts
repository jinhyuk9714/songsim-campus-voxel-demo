export function getManualChunkName(id: string): string | undefined {
  if (id.indexOf('/node_modules/three/examples/') !== -1) {
    return 'three-extras';
  }

  if (id.indexOf('/node_modules/three/') !== -1) {
    return 'three-vendor';
  }

  if (
    id.indexOf('/src/scene/') !== -1 ||
    id.indexOf('/src/world/') !== -1 ||
    id.indexOf('/src/interaction/') !== -1
  ) {
    return 'songsim-runtime';
  }

  return undefined;
}

export const songsimBuildConfig = {
  rollupOptions: {
    output: {
      manualChunks: getManualChunkName
    }
  }
};
