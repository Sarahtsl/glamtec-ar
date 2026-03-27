import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['deepar'], // ne pas bundler deepar avec Vite
  },
  build: {
    chunkSizeWarningLimit: 1000, // limite d'avertissement pour les chunks volumineux
    rollupOptions: {
      output: {
        // Découper les grosses librairies en chunks séparés
        manualChunks: {
          three: ['three'],
          deepar: ['deepar'],
          react: ['react', 'react-dom']
        }
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  }
})