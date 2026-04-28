import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3000,
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
  // css: {
  //   preprocessorOptions: {
  //     scss: {
  //       additionalData: `@use "@/styles/element/index.scss" as *;`
  //     }
  //   }
  // }
});
