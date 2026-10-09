import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Dépôt GitHub Pages: https://imvot.github.io/temply/
  base: '/temply/',
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
