import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps asset paths working on username.gitlab.io/project-name
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'public' }, // GitLab Pages serves the "public" folder
});
