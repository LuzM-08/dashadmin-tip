// Cliente HTTP único de la SPA: agrega el token, normaliza errores y avisa cuando la sesión expira.
export const TOKEN_KEY = 'ap_token';
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(mensaje, status, codigo, detalles) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

let manejadorNoAutorizado = null;

// Registra qué hacer ante un 401 (la sesión expiró o el token no sirve). Devuelve la función para desregistrar.
export function alNoAutorizado(fn) {
  manejadorNoAutorizado = fn;
  return () => {
    if (manejadorNoAutorizado === fn) manejadorNoAutorizado = null;
  };
}

function armarQuery(consulta) {
  const params = new URLSearchParams();
  Object.entries(consulta ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, v);
  });
  const texto = params.toString();
  return texto ? `?${texto}` : '';
}

async function solicitar(metodo, ruta, { cuerpo, consulta, omitirAutenticacion = false } = {}) {
  const headers = {};
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && !omitirAutenticacion) headers.Authorization = `Bearer ${token}`;

  let body;
  if (cuerpo instanceof FormData) {
    body = cuerpo; // el navegador fija el Content-Type con su boundary
  } else if (cuerpo !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(cuerpo);
  }

  let respuesta;
  try {
    respuesta = await fetch(`${BASE}${ruta}${armarQuery(consulta)}`, { method: metodo, headers, body });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión.', 0, 'NETWORK');
  }

  if (respuesta.status === 204) return null;
  const json = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    if (respuesta.status === 401 && !omitirAutenticacion) manejadorNoAutorizado?.();
    const e = json?.error;
    throw new ApiError(e?.message || `Error ${respuesta.status}`, respuesta.status, e?.code, e?.details);
  }
  return json;
}

export const api = {
  get: (ruta, opciones) => solicitar('GET', ruta, opciones),
  post: (ruta, cuerpo, opciones) => solicitar('POST', ruta, { ...opciones, cuerpo }),
  patch: (ruta, cuerpo, opciones) => solicitar('PATCH', ruta, { ...opciones, cuerpo }),
  delete: (ruta, opciones) => solicitar('DELETE', ruta, opciones),
};
