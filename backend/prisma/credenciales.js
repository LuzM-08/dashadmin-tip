// Validaciones compartidas por los scripts de producción.
const CLAVES_PROHIBIDAS = ['ApDemo2026!'];

function validarEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) throw new Error('EMAIL inválido');
  return email.trim().toLowerCase();
}

function validarClave(clave) {
  if (CLAVES_PROHIBIDAS.includes(clave)) throw new Error('PASSWORD no puede ser la contraseña de demostración');
  if (!clave || clave.length < 12) throw new Error('PASSWORD debe tener al menos 12 caracteres');
  return clave;
}

module.exports = { validarEmail, validarClave };
