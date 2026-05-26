import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // FastAPI 엔드포인트 — VLM 분석만 직접 호출 (반드시 /api보다 먼저 선언)
      '/api/vlm': 'http://localhost:8000',
      // 나머지 /api (diary 포함) 는 모두 Spring Boot로 라우팅
      // Spring Boot DiaryController가 내부적으로 FastAPI 호출 처리
      '/api': 'http://localhost:8080',
    },
  },
})