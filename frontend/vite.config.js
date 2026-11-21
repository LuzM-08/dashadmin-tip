import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // strictPort: si 5173 está ocupado falla en vez de cambiar de puerto (el CORS del backend espera 5173).
  server: { host: true, port: 5173, strictPort: true },
});
