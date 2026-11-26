// Cliente de la API para PREPARAR y LIMPIAR datos (no para probar la interfaz).
// Los tokens se guardan en memoria: un solo login por usuario durante toda la ejecución,
// porque el servidor limita los intentos de login por IP.
const { API_URL, PASSWORD_DEMO, USUARIOS } = require('../config');

const tokens = new Map();

async function llamar(metodo, ruta, { token, cuerpo, esperado } = {}) {
  const res = await fetch(`${API_URL}${ruta}`, {
    method: metodo,
    headers: { ...(cuerpo ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await res.text();
  let json = null;
  try { json = texto ? JSON.parse(texto) : null; } catch { /* respuesta sin JSON */ }
  const ok = esperado ? esperado.includes(res.status) : res.ok;
  if (!ok) {
    throw Object.assign(new Error(`${metodo} ${ruta} → ${res.status} ${json?.error?.message ?? texto}`), { status: res.status, cuerpo: json });
  }
  return { status: res.status, json };
}

async function tokenDe(email, password = PASSWORD_DEMO) {
  if (tokens.has(email)) return tokens.get(email);
  const { json } = await llamar('POST', '/auth/login', { cuerpo: { email, password } });
  tokens.set(email, json.data.token);
  return json.data.token;
}

const como = (clave) => USUARIOS[clave].email;

// Atajos autenticados (clave = 'jefatura' | 'analista' | 'analista2' | 'visor')
async function pedir(clave, metodo, ruta, opciones = {}) {
  return llamar(metodo, ruta, { ...opciones, token: await tokenDe(como(clave)) });
}

async function pedirConToken(token, metodo, ruta, opciones = {}) {
  return llamar(metodo, ruta, { ...opciones, token });
}

const modulos = async () => (await pedir('jefatura', 'GET', '/modulos')).json.data;
const perfil = async (clave) => (await pedir(clave, 'GET', '/auth/me')).json.data;

module.exports = { llamar, tokenDe, pedir, pedirConToken, modulos, perfil, como };
