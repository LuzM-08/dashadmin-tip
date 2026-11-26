# Pruebas E2E con Selenium — Dashboard Admin V2

Suite de pruebas de extremo a extremo (navegador real) con **Selenium WebDriver + Mocha**, escrita en JavaScript.
Usa el patrón **Page Object**: `pages/` sabe *cómo* se ve la pantalla; `tests/` dice *qué* debe ocurrir.

## Requisitos
- Node 20 o superior y Google Chrome instalado (Selenium Manager descarga solo el chromedriver correcto).
- El sistema funcionando en **desarrollo**: backend en `http://localhost:4000`, frontend en `http://localhost:5173`.
- La base con los datos de `seed.js` (usuarios demo con la clave `ApDemo2026!`).

## Preparación (una sola vez)
1. **Subir el límite de intentos de login SOLO para las pruebas.** El servidor permite 10 intentos por IP cada 15 minutos
   y la suite hace más. En `docker-compose.yml`, servicio `app-node`, agrega en `environment`:
   ```yaml
   RATE_LIMIT_AUTH: "1000"
   ```
   y aplica con `docker compose up -d`. En producción esa variable **no** se define (el límite sigue en 10).
2. Instalar dependencias de la suite:
   ```powershell
   cd e2e
   npm install
   copy .env.example .env
   ```

## Ejecutar
```powershell
npm test                 # toda la suite, sin ventana (headless)
npm run test:humo        # solo los casos marcados @humo (prueba rápida)
npm run test:visible     # con el navegador a la vista (útil para depurar)
npm run test:informe     # genera informes/informe-e2e.html
npx mocha --grep "TAR-0"           # un grupo
npx mocha tests/03-tareas.test.js  # un archivo
```
Cuando una prueba falla se guarda una captura en `capturas/`.

## Estructura
```
e2e/
├── config.js            URLs, usuarios demo, pestañas esperadas por rol (todo sobrescribible por .env)
├── support/
│   ├── driver.js        crea Chrome (headless por defecto) y toma capturas
│   ├── api.js           cliente de la API para preparar/limpiar datos (token en memoria: 1 login por usuario)
│   ├── sesion.js        inicia sesión guardando el token, sin pasar por el formulario
│   ├── datos.js         datos "E2E …" y su limpieza
│   ├── esperas.js       esperas explícitas y utilidades (nunca sleep fijo)
│   └── hooks.js         captura de pantalla en cada fallo
├── pages/               Page Objects: Shell, Login, Tareas, Usuarios, Cuenta
└── tests/               01-login · 02-permisos · 03-tareas · 04-modulos-rotacion
                         05-documentos · 06-eventos-inicio · 07-usuarios-clave
```

## Reglas de la suite
- **Solo cuentas y datos propios**: todo lo que se crea empieza con `E2E` (tareas, recordatorios, documentos) o `e2e.` (usuarios)
  y se elimina al terminar. Los usuarios no se pueden borrar, por eso quedan **desactivados**.
- **Las cuentas demo no se modifican**: el cambio de contraseña se prueba con un usuario creado durante la prueba.
- La rotación se asigna en una semana **10 semanas hacia adelante** (módulo Corporativo) y se elimina al terminar.
- Cada prueba prepara sus datos por API cuando no es lo que se quiere probar; así falla por una sola razón.
- El formulario de login se prueba en `01-login`; el resto entra con el token (más rápido y más estable).

## Contra otro entorno
Ajusta `.env` (`BASE_URL`, `API_URL`). Con HTTPS de certificado interno agrega `ACEPTAR_CERT_INVALIDO=true`.
**No ejecutes la suite contra producción real**: crea usuarios, tareas y documentos de prueba.

## Si algo falla
| Síntoma | Causa probable |
| --- | --- |
| `Demasiados intentos` en el login | Falta `RATE_LIMIT_AUTH` (paso 1) o se ejecutó varias veces seguidas con el límite en 10. |
| `No existe el módulo "…"` | No se ejecutó `node prisma/seed.js`. |
| Timeout esperando la barra de pestañas | El frontend no está en `BASE_URL` o el backend no responde. |
| `DOC-01` falla al subir | El volumen `/uploads` no es escribible o el servidor rechazó el PDF de prueba. |
