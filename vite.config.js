import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base: './' makes asset paths relative so the same build works on any free host
// (Netlify root, GitHub Pages sub-path) AND inside the Capacitor native shell.
export default defineConfig({
  base: './',
  plugins: [react()],
})
