import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';

function stampServiceWorker() {
  const buildId = (
    process.env.VERCEL_GIT_COMMIT_SHA ||
    Date.now().toString(36)
  ).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12);

  return {
    name: 'stamp-service-worker',
    apply: 'build',
    async closeBundle() {
      const serviceWorkerPath = fileURLToPath(
        new URL('./dist/service-worker.js', import.meta.url)
      );
      const source = await readFile(serviceWorkerPath, 'utf8');

      if (!source.includes('__BUILD_ID__')) {
        throw new Error('No se encontró el marcador de versión del Service Worker.');
      }

      await writeFile(
        serviceWorkerPath,
        source.replaceAll('__BUILD_ID__', buildId),
        'utf8'
      );
    }
  };
}

export default defineConfig({
  plugins: [stampServiceWorker()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 5174,
    strictPort: false,
  }
});
