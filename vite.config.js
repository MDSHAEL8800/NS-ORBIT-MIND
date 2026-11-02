import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/NS-ORBIT-MIND10/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})