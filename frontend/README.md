# Dashboard AP · Frontend (SPA)

React + React Router + Tailwind CSS (Vite).

    copy .env.example .env      # (Mac/Linux: cp)
    npm install
    npm run dev                 # http://localhost:5173

Requiere el backend en `VITE_API_URL` (por defecto http://localhost:4000/api).

## Producción
`npm run build` genera `dist/` (archivos estáticos). El servidor web debe devolver `index.html`
para cualquier ruta que no sea un archivo (SPA fallback), por ejemplo en nginx:

    location / { try_files $uri /index.html; }

Y compilar con `VITE_MODO_PRUEBAS=false` para ocultar el menú "Cambiar vista".
