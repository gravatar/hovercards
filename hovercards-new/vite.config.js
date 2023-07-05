import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        'wpcom': 'src/wpcom.ts',
        style: 'src/style.scss',
      },
      output: {
        entryFileNames: 'gprofiles.js',
        assetFileNames: 'hovercard.min.css',
      },
    },
  },
})