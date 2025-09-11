import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
const tailwindcss = (await import('@tailwindcss/vite')).default

export default defineConfig({
    plugins: [react(), tailwindcss()],
})