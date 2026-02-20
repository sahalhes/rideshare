import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server : {
      host: true,
      watch: {
        usePolling: !isProduction,
      }
    },
    define: {
      'process.env.MAPBOX_ACCESS_TOKEN': JSON.stringify(env.MAPBOX_ACCESS_TOKEN),
      'process.env.API_URL': JSON.stringify(env.API_URL),
    }
  };
});
