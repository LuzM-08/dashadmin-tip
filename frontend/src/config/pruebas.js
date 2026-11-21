// Menú "Cambiar vista" (solo pruebas): inicia sesión con usuarios de demostración del seed.
// Se activa con VITE_MODO_PRUEBAS=true; en producción debe estar apagado.
export const MODO_PRUEBAS = import.meta.env.VITE_MODO_PRUEBAS === 'true';
export const PASSWORD_DEMO = import.meta.env.VITE_DEMO_PASSWORD || '';

export const USUARIOS_DEMO = [
  { email: 'jefatura.ap@empresa.local', rol: 'Jefatura', descripcion: 'Acceso completo y rotación de módulos' },
  { email: 'diego.fuentes@empresa.local', rol: 'Analista AP', descripcion: 'Gestiona tareas, eventos y documentos' },
  { email: 'rodrigo.paredes@empresa.local', rol: 'Visor', descripcion: 'Solo consulta módulos y tareas' },
];

export const NOMBRE_ROL = { jefatura: 'Jefatura', analista_ap: 'Analista AP', visor: 'Visor' };
