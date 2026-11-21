// Las clases se escriben completas para que Tailwind las detecte.
export const ESTADOS = [
  { valor: 'Sin iniciar', chip: 'bg-slate-100 text-slate-700 ring-slate-200' },
  { valor: 'En progreso', chip: 'bg-blue-100 text-blue-800 ring-blue-200' },
  { valor: 'Terminadas', chip: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
];

export const PRIORIDADES = [
  { valor: 'Baja', chip: 'bg-slate-100 text-slate-600 ring-slate-200' },
  { valor: 'Media', chip: 'bg-sky-100 text-sky-800 ring-sky-200' },
  { valor: 'Alta', chip: 'bg-amber-100 text-amber-800 ring-amber-200' },
  { valor: 'Critica', chip: 'bg-red-100 text-red-800 ring-red-200' },
];

export const ORDENES = [
  { clave: 'limite_asc', texto: 'Fecha límite: próximas primero', orden: 'fecha_limite', direccion: 'asc' },
  { clave: 'limite_desc', texto: 'Fecha límite: lejanas primero', orden: 'fecha_limite', direccion: 'desc' },
  { clave: 'creacion_desc', texto: 'Más recientes', orden: 'fecha_creacion', direccion: 'desc' },
  { clave: 'actualizacion_desc', texto: 'Actualizadas recientemente', orden: 'fecha_actualizacion', direccion: 'desc' },
];

// El backend guarda "Critica" sin tilde; en pantalla se muestra con ella.
export const etiquetaPrioridad = (valor) => (valor === 'Critica' ? 'Crítica' : valor);
