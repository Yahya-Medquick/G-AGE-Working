import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const configuredAppEnv = process.env.VITE_APP_ENV || process.env.APP_ENV;
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'deployment-robots-meta',
        transformIndexHtml(html) {
          if (!configuredAppEnv || configuredAppEnv === 'production') return html;
          return html.replace(
            /<meta name="robots" content="[^"]*"\s*\/?>/i,
            '<meta name="robots" content="noindex, nofollow" />',
          );
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'esnext',
      minify: 'esbuild' as const,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
    },
    server: {
      allowedHosts: 'all' as any,
      host: true,
      port: 3000,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
