import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [react() ],
  optimizeDeps: {
    exclude: ['deepar'],   // ← ne pas bundler deepar avec Vite
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  }
})