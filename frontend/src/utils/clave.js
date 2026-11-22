// Misma política que el servidor (backend/src/lib/politicaClave.js). El servidor es quien decide;
// esto solo da retroalimentación inmediata al escribir.
export const MIN_CLAVE = 12;

export function problemaClave(clave, { email, claveActual } = {}) {
  if (!clave) return 'Indica la contraseña';
  if (clave === 'ApDemo2026!') return 'No puedes usar la contraseña de demostración';
  if (clave.length < MIN_CLAVE) return `Debe tener al menos ${MIN_CLAVE} caracteres`;
  if (new TextEncoder().encode(clave).length > 72) return 'Es demasiado larga (máximo 72 bytes)';
  if (!/[A-Za-z]/.test(clave) || !/\d/.test(clave)) return 'Debe incluir letras y números';
  if (email && clave.toLowerCase() === email.toLowerCase()) return 'No puede ser igual al correo';
  if (claveActual !== undefined && clave === claveActual) return 'Debe ser distinta de la actual';
  return null;
}

// Contraseña aleatoria legible (sin caracteres ambiguos como 0/O o 1/l) con el generador criptográfico del navegador.
export function generarClave(largo = 16) {
  const letras = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const numeros = '23456789';
  const todos = letras + numeros;
  const aleatorio = (max) => {
    // Rechazo de valores sesgados: reparto uniforme.
    const limite = Math.floor(0x100000000 / max) * max;
    const buf = new Uint32Array(1);
    do { crypto.getRandomValues(buf); } while (buf[0] >= limite);
    return buf[0] % max;
  };
  const caracteres = [letras[aleatorio(letras.length)], numeros[aleatorio(numeros.length)]];
  while (caracteres.length < largo) caracteres.push(todos[aleatorio(todos.length)]);
  for (let i = caracteres.length - 1; i > 0; i -= 1) { // mezcla Fisher–Yates
    const j = aleatorio(i + 1);
    [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
  }
  return caracteres.join('');
}
