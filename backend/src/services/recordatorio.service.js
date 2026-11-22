const { NotFoundError, BadRequestError } = require('../lib/errors');
const { sumarDias } = require('../lib/semana');

const MAX_DIAS_CALENDARIO = 92;

class RecordatorioService {
  constructor({ recordatorioRepository, tareaRepository, rotacionRepository, auditoriaRepository }) {
    this.recordatorios = recordatorioRepository;
    this.tareas = tareaRepository;
    this.rotaciones = rotacionRepository;
    this.auditoria = auditoriaRepository;
  }

  listar(actor, { desde, hasta, pendientes, limit }) {
    return this.recordatorios.findMany({ idUsuario: actor.id_usuario, desde, hasta, pendientes, limit });
  }

  async crear(dto, actor) {
    if (dto.id_tarea) await this.#validarTarea(dto.id_tarea);
    const recordatorio = await this.recordatorios.create({ ...dto, id_usuario: actor.id_usuario });
    await this.#auditar(actor, 'RECORDATORIO_CREADO', recordatorio.id_recordatorio, { fecha_evento: recordatorio.fecha_evento });
    return recordatorio;
  }

  async actualizar(id, dto, actor) {
    await this.#obtenerPropio(id, actor);
    if (dto.id_tarea) await this.#validarTarea(dto.id_tarea);

    const data = { ...dto };
    // Nueva fecha => debe poder enviarse de nuevo.
    if (dto.fecha_evento !== undefined) data.correo_enviado = false;

    const actualizado = await this.recordatorios.update(id, data);
    await this.#auditar(actor, 'RECORDATORIO_EDITADO', id, { campos: Object.keys(dto) });
    return actualizado;
  }

  async eliminar(id, actor) {
    await this.#obtenerPropio(id, actor);
    await this.recordatorios.delete(id);
    await this.#auditar(actor, 'RECORDATORIO_ELIMINADO', id, null);
  }

  // Vista unificada para la pestaña "Eventos": recordatorios + fechas límite + rotaciones del usuario.
  async calendario(actor, { desde, hasta }) {
    const inicio = desde ?? this.#inicioDeHoy();
    const fin = hasta ?? sumarDias(inicio, 30);
    if (inicio > fin) throw new BadRequestError('"desde" no puede ser posterior a "hasta"');
    if ((fin - inicio) / 86400000 > MAX_DIAS_CALENDARIO) {
      throw new BadRequestError(`El rango máximo es de ${MAX_DIAS_CALENDARIO} días`);
    }

    const idUsuario = actor.id_usuario;
    const [recordatorios, tareas, rotaciones] = await Promise.all([
      this.recordatorios.findMany({ idUsuario, desde: inicio, hasta: fin, limit: 500 }),
      this.tareas.findCalendario({ idUsuario, desde: inicio, hasta: fin }),
      this.rotaciones.findPorResponsable({ idUsuario, desde: inicio, hasta: fin }),
    ]);

    const eventos = [
      ...recordatorios.map((r) => ({
        tipo: 'RECORDATORIO', id: r.id_recordatorio, fecha: r.fecha_evento, titulo: r.titulo,
        detalle: r.descripcion, id_tarea: r.id_tarea, tarea: r.tarea, enviar_correo: r.enviar_correo, correo_enviado: r.correo_enviado,
      })),
      ...tareas.map((t) => ({
        tipo: 'TAREA_LIMITE', id: t.id_tarea, fecha: t.fecha_limite, titulo: t.titulo,
        detalle: t.modulo.nombre_modulo, estado: t.estado, prioridad: t.prioridad, id_modulo: t.id_modulo,
      })),
      ...rotaciones.map((r) => ({
        tipo: 'ROTACION', id: r.id_rotacion, fecha: r.fecha_inicio, fecha_fin: r.fecha_fin,
        titulo: `Responsable de ${r.modulo.nombre_modulo}`, id_modulo: r.id_modulo,
      })),
    ].sort((a, b) => a.fecha - b.fecha);

    return { desde: inicio, hasta: fin, eventos };
  }

  // ---- privados ----
  // Un recordatorio ajeno se trata como inexistente (no revela que existe).
  async #obtenerPropio(id, actor) {
    const r = await this.recordatorios.findById(id);
    if (!r || r.id_usuario !== actor.id_usuario) throw new NotFoundError('Recordatorio no encontrado');
    return r;
  }

  async #validarTarea(id) {
    if (!(await this.tareas.findById(id))) throw new BadRequestError('La tarea indicada no existe');
  }

  #inicioDeHoy() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  #auditar(actor, accion, idEntidad, detalles) {
    return this.auditoria.registrar({
      id_usuario: actor.id_usuario, accion, entidad: 'RecordatorioEvento', id_entidad: idEntidad, detalles,
    });
  }
}

module.exports = RecordatorioService;
