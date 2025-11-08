import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/tournaments': 'http://localhost:3000',
            '/teams': 'http://localhost:3000',
            '/matches': 'http://localhost:3000',
            '/register': 'http://localhost:3000',
            '/match-result': 'http://localhost:3000',
            '/download': 'http://localhost:3000',
            '/export': 'http://localhost:3000'
        }
    },
    build: {
        outDir: 'dist'
    }
});