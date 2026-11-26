module.exports = {
  spec: ['tests/**/*.test.js'],
  require: ['support/hooks.js'],
  timeout: 45000,      // una prueba E2E puede tardar: carga de página + API
  slow: 8000,
  // El orden de los archivos (01-, 02-…) es el orden de ejecución; cada prueba prepara sus propios datos.
  sort: true,
  color: true,
};
