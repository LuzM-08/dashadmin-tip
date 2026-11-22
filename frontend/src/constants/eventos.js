// Las clases se escriben completas para que Tailwind las detecte.
export const TIPOS_EVENTO = {
  RECORDATORIO: { etiqueta: 'Recordatorio', chip: 'bg-blue-100 text-blue-800', punto: 'bg-blue-500' },
  TAREA_LIMITE: { etiqueta: 'Fecha límite', chip: 'bg-amber-100 text-amber-800', punto: 'bg-amber-500' },
  ROTACION: { etiqueta: 'Rotación', chip: 'bg-indigo-100 text-indigo-800', punto: 'bg-indigo-500' },
};

// Una tarea terminada se ve en verde (ya no requiere atención).
export function estiloEvento(evento) {
  if (evento.tipo === 'TAREA_LIMITE' && evento.estado === 'Terminadas') {
    return { etiqueta: 'Fecha límite', chip: 'bg-emerald-100 text-emerald-800', punto: 'bg-emerald-500' };
  }
  return TIPOS_EVENTO[evento.tipo];
}

// Los eventos del calendario traen lo necesario para editar un recordatorio sin otra consulta.
export const recordatorioDesdeEvento = (e) => ({
  id_recordatorio: e.id,
  titulo: e.titulo,
  descripcion: e.detalle,
  fecha_evento: e.fecha,
  enviar_correo: e.enviar_correo,
  correo_enviado: e.correo_enviado,
  id_tarea: e.id_tarea,
  tarea: e.tarea,
});

export function estadoCorreo(r) {
  if (r.correo_enviado) return { texto: 'Correo enviado', clase: 'text-emerald-700' };
  if (r.enviar_correo) return { texto: 'Correo programado', clase: 'text-blue-700' };
  return { texto: 'Sin correo', clase: 'text-slate-400' };
}
