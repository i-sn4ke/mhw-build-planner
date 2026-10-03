import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command, isPreview }) => ({
  // GitHub Pages serves this project under its repository name.
  base: command === 'build' || isPreview ? '/mhw-build-planner/' : '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
}))
