import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base works for local preview and GitHub Pages project sites.
export default defineConfig({
  plugins: [react()],
  base: './',
})
