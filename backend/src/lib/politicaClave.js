// Política única de contraseñas: la usan la API (cambio y administración) y los scripts de producción.
const MINIMO = 12;
const MAXIMO_BYTES = 72; // bcrypt ignora lo que exceda de 72 bytes: mejor rechazarlo que truncarlo en silencio.
const PROHIBIDAS = ['ApDemo2026!'];

/**
 * Devuelve el texto del problema o null si la clave es aceptable.
 * contexto: { email, claveActual } (opcionales) para impedir claves triviales respecto de la cuenta.
 */
function problemaClave(clave, { email, claveActual } = {}) {
  if (typeof clave !== 'string' || !clave) return 'La contraseña es obligatoria';
  if (PROHIBIDAS.includes(clave)) return 'No puedes usar la contraseña de demostración';
  if (clave.length < MINIMO) return `La contraseña debe tener al menos ${MINIMO} caracteres`;
  if (Buffer.byteLength(clave, 'utf8') > MAXIMO_BYTES) return `La contraseña es demasiado larga (máximo ${MAXIMO_BYTES} bytes)`;
  if (!/[A-Za-z]/.test(clave) || !/\d/.test(clave)) return 'La contraseña debe incluir letras y números';
  if (email && clave.toLowerCase() === String(email).toLowerCase()) return 'La contraseña no puede ser igual al correo';
  if (claveActual !== undefined && clave === claveActual) return 'La nueva contraseña debe ser distinta de la actual';
  return null;
}

module.exports = { problemaClave, MINIMO, MAXIMO_BYTES };
