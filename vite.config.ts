import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3005,
    proxy: {
      '/api': {
        target: 'https://api-alfa-test.kassir.ru',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('Origin', 'https://alfa-test.kassir.ru');
            proxyReq.setHeader('Referer', 'https://alfa-test.kassir.ru/');
            
            // Добавляем все необходимые заголовки
            proxyReq.setHeader('Accept', '*/*');
            proxyReq.setHeader('Cache-Control', 'no-cache');
            proxyReq.setHeader('Pragma', 'no-cache');
            proxyReq.setHeader('DNT', '1');
            proxyReq.setHeader('sec-fetch-dest', 'empty');
            proxyReq.setHeader('sec-fetch-mode', 'cors');
            proxyReq.setHeader('sec-fetch-site', 'same-site');
          });
        }
      }
    }
  }
});
