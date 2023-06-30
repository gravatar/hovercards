import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        'vanilla-js': 'src/vanilla-js.ts',
        style: 'src/style.scss',
      },
      output: {
        entryFileNames: 'gprofiles.js',
        assetFileNames: 'hovercard.min.css',
      },
    },
  },
})