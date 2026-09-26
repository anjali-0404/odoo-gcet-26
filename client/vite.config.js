import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// No dev proxy: the client calls the API directly at VITE_API_URL and the
// server allows this origin through CORS (CLIENT_URL in server/.env).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
