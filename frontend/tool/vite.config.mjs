import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react(), {
        name: 'development-csp', apply: 'serve',
        transformIndexHtml: html => html.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'"),
    }], base: './', build: { outDir: 'build' },
    test: { include: ['src/**/*.test.ts'], globals: true },
});
