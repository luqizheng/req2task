import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
  
    proxy: {
      // '/api/chat': {
      //   target: 'http://localhost:4001',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api\/chat/, '/api/ai/conversations')
      // },
      // '/api/ai/llm-configs': {
      //   target: 'http://localhost:4001',
      //   changeOrigin: true
      // },
      "/api/ai": {
        target: "http://localhost:4001",
        changeOrigin: true,
      },
      "/api": {
        // gateway api url
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
