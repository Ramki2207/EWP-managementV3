import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
    },
  },
  esbuild: {
    loader: 'tsx',
    include: /\.(tsx?|jsx?)$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
        '.ts': 'tsx',
        '.tsx': 'tsx'
      }
    }
  }
});