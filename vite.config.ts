import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // @tailwindcss/vite scans all project files (including index.html) for class
  // names and registers them as CSS module dependencies via addWatchFile. Vite
  // then tries to load those files through the JS module pipeline, which fails
  // on HTML content. Treating *.html as assets short-circuits that path.
  assetsInclude: ['**/*.html'],
})
