import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const frontendPackage = (name) => fileURLToPath(new URL(`node_modules/${name}`, import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Source files live in ../src, so point package imports back to this app's
    // dependencies instead of asking Node to look beside those shared files.
    alias: {
      react: frontendPackage('react'),
      'react-dom': frontendPackage('react-dom'),
      // React Router publishes a tree-shakeable ESM entry point.
      'react-router-dom': frontendPackage('react-router-dom/dist/index.mjs'),
      'lucide-react': frontendPackage('lucide-react'),
      'qrcode.react': frontendPackage('qrcode.react'),
      'html5-qrcode': frontendPackage('html5-qrcode'),
    },
  },
  server: {
    // The app entry point imports the existing shared source from ../src.
    fs: { allow: [projectRoot] },
  },
})
