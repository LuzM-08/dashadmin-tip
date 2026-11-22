// Validaciones compartidas por los scripts de producción (misma política que la API).
const { problemaClave } = require('../src/lib/politicaClave');

function validarEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) throw new Error('EMAIL inválido');
  return email.trim().toLowerCase();
}

function validarClave(clave, contexto) {
  const problema = problemaClave(clave, contexto);
  if (problema) throw new Error(`PASSWORD: ${problema}`);
  return clave;
}

module.exports = { validarEmail, validarClave };
