import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base so assets resolve under Capacitor's capacitor://localhost scheme.
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    // three.js + the 4.6 MB brain model are large; keep the chunk budget sane
    chunkSizeWarningLimit: 1600,
  },
});
