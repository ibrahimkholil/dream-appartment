import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const useMocks = env.VITE_USE_MOCKS === '1';

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    resolve: useMocks ? {
      alias: {
        'firebase/app': path.resolve(__dirname, 'src/mocks/firebase-app.mock.js'),
        'firebase/auth': path.resolve(__dirname, 'src/mocks/firebase-auth.mock.js'),
        'firebase/firestore': path.resolve(__dirname, 'src/mocks/firebase-firestore.mock.js'),
      },
    } : {},
  };
});
