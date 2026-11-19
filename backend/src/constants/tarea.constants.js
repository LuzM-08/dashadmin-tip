// Fuente única de valores de dominio (el schema los guarda como String).
const ESTADOS_TAREA = Object.freeze(['Sin iniciar', 'En progreso', 'Terminadas']);
const PRIORIDADES_TAREA = Object.freeze(['Baja', 'Media', 'Alta', 'Critica']);
const ESTADO_FINAL = 'Terminadas';

module.exports = { ESTADOS_TAREA, PRIORIDADES_TAREA, ESTADO_FINAL };
