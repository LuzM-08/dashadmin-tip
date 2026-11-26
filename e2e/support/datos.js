// Datos de prueba: todo lo que crea la suite lleva el prefijo "E2E" para poder limpiarlo sin tocar datos reales.
const api = require('./api');

const sello = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e3)}`;
const PREFIJO = 'E2E';
const nombreUnico = (base) => `${PREFIJO} ${base} ${sello()}`;

async function idModulo(nombre = 'Prioridad') {
  const m = (await api.modulos()).find((x) => x.nombre_modulo === nombre);
  if (!m) throw new Error(`No existe el módulo "${nombre}": ¿se ejecutó el seed?`);
  return m.id_modulo;
}

async function crearTarea(clave, parcial = {}) {
  const cuerpo = { id_modulo: await idModulo(), titulo: nombreUnico('tarea'), estado: 'Sin iniciar', prioridad: 'Media', ...parcial };
  return (await api.pedir(clave, 'POST', '/tareas', { cuerpo })).json.data;
}

async function limpiarTareas() {
  const lista = (await api.pedir('jefatura', 'GET', `/tareas?q=${PREFIJO}&limit=100`)).json.data;
  for (const t of lista.filter((x) => x.titulo.startsWith(PREFIJO))) {
    await api.pedir('jefatura', 'DELETE', `/tareas/${t.id_tarea}`, { esperado: [204, 404] });
  }
}

async function limpiarDocumentos(idMod) {
  const lista = (await api.pedir('jefatura', 'GET', `/documentos?id_modulo=${idMod}&limit=100`)).json.data;
  for (const d of lista.filter((x) => x.nombre_original.startsWith(PREFIJO.toLowerCase()) || x.nombre_original.startsWith(PREFIJO))) {
    await api.pedir('jefatura', 'DELETE', `/documentos/${d.id_documento}`, { esperado: [204, 404] });
  }
}

async function desactivarUsuariosE2E() {
  const lista = (await api.pedir('jefatura', 'GET', '/admin/usuarios')).json.data;
  for (const u of lista.filter((x) => x.email.startsWith('e2e.') && x.activo)) {
    await api.pedir('jefatura', 'PATCH', `/admin/usuarios/${u.id_usuario}`, { cuerpo: { activo: false } });
  }
}

module.exports = { PREFIJO, nombreUnico, sello, idModulo, crearTarea, limpiarTareas, limpiarDocumentos, desactivarUsuariosE2E };
