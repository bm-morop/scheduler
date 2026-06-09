import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/scheduler/',   // ← GitHubリポジトリ名に合わせてください
})
