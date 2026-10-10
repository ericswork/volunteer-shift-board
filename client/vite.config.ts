import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  test: {
    // A zone far from Manila proves formatting never depends on the device's time zone
    env: { TZ: 'America/Los_Angeles' },
  },
});
