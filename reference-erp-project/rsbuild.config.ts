import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { publicVars } = loadEnv({ prefixes: ['REACT_APP_'] });

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    define: publicVars,
  },
  resolve: {
    alias: {
      '@docs': path.resolve(__dirname, 'docs'),
    },
  },
  server: {
    // Proxy para evitar problemas de CORS en desarrollo
    proxy: {
      '/api/nominatim': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        pathRewrite: {
          '^/api/nominatim': '',
        },
      },
    },
  },
  output: {
    copy: [
      {
        from: 'public/favicon.ico',
        to: 'favicon.ico',
      },
      {
        from: 'public/manifest.json',
        to: 'manifest.json',
      },
    ],
  },
  html: {
    title: 'LaIA',
    favicon: 'favicon.ico',
    meta: {
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no',
    },
  },
  tools: {
    rspack: (_config, { appendRules }) => {
      appendRules([
        {
          test: /\.md$/i,
          resourceQuery: /raw/,
          type: 'asset/source',
        },
      ]);
    },
  },
});
