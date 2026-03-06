import { defineConfig } from 'vitest/config';
import { songsimBuildConfig } from './src/build/viteBuildConfig';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  build: songsimBuildConfig,
  test: {
    environment: 'node'
  }
});
