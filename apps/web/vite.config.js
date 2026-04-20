import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },
    server: {
        port: 3000,
        proxy: {
            '/api/chat': {
                target: 'http://localhost:4001',
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/api\/chat/, '/api/ai/conversations'); }
            },
            '/api': {
                target: 'http://localhost:4000',
                changeOrigin: true
            }
        }
    },
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: "@use \"@/styles/element/index.scss\" as *;"
            }
        }
    }
});
