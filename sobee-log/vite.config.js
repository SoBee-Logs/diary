import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    basicSsl(), // 와이파이 환경에서 GPS 사용을 위한 가짜 HTTPS 인증서 적용
  ],
  server: {
    host: true,        // 같은 와이파이의 모바일 기기 접속 허용 (0.0.0.0 바인딩)
    allowedHosts: true,
    proxy: {
      // FastAPI — VLM 분석 전용 (반드시 /api보다 먼저 선언)
      '/api/vlm': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        // 외부 접속 시 Origin을 localhost로 교체 → Spring Boot CORS 통과
        headers: { origin: 'http://localhost:5173' },
      },
      // 나머지 /api → Spring Boot
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        // 외부 접속 시 Origin을 localhost로 교체 → Spring Boot CORS 통과
        headers: { origin: 'http://localhost:5173' },
      },
    },
  },
})
