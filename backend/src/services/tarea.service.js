const { NotFoundError, BadRequestError } = require('../lib/errors');
const { ESTADOS_TAREA, ESTADO_FINAL } = require('../constants/tarea.constants');

class TareaService {
  constructor({ tareaRepository, moduloRepository, usuarioRepository, auditoriaRepository }) {
    this.tareas = tareaRepository;
    this.modulos = moduloRepository;
    this.usuarios = usuarioRepository;
    this.auditoria = auditoriaRepository;
  }

  async listar(filtros) {
    const { page, limit, orden, direccion } = filtros;
    const where = this.#construirFiltro(filtros);

    const [data, total] = await Promise.all([
      this.tareas.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [orden]: direccion } }),
      this.tareas.count(where),
    ]);

    return { data, meta: { page, limit, total, total_pages: Math.ceil(total / limit) } };
  }

  async obtener(id) {
    const tarea = await this.tareas.findById(id);
    if (!tarea) throw new NotFoundError('Tarea no encontrada');
    return tarea;
  }

  async crear(dto, actor) {
    await this.#validarModulo(dto.id_modulo);
    if (dto.id_asignado) await this.#validarUsuario(dto.id_asignado);

    const tarea = await this.tareas.create({ ...dto, id_creador: actor.id_usuario });
    await this.#auditar(actor, 'TAREA_CREADA', tarea.id_tarea, { titulo: tarea.titulo, id_modulo: tarea.id_modulo });
    return tarea;
  }

  async actualizar(id, dto, actor) {
    const actual = await this.obtener(id);

    if (dto.id_modulo !== undefined && dto.id_modulo !== actual.id_modulo) await this.#validarModulo(dto.id_modulo);
    if (dto.id_asignado) await this.#validarUsuario(dto.id_asignado);

    const data = { ...dto };

    // Si cambia la fecha límite, el recordatorio automático debe poder dispararse de nuevo.
    if (dto.fecha_limite !== undefined) {
      const antes = actual.fecha_limite?.getTime() ?? null;
      const despues = dto.fecha_limite?.getTime() ?? null;
      if (antes !== despues) data.alerta_enviada = false;
    }

    const tarea = await this.tareas.update(id, data);

    const cambioEstado = dto.estado && dto.estado !== actual.estado;
    await this.#auditar(actor, cambioEstado ? 'TAREA_ESTADO_CAMBIADO' : 'TAREA_EDITADA', id, {
      campos: Object.keys(dto),
      ...(cambioEstado && { de: actual.estado, a: dto.estado }),
    });
    return tarea;
  }

  async eliminar(id, actor) {
    const tarea = await this.obtener(id);
    await this.tareas.delete(id);
    await this.#auditar(actor, 'TAREA_ELIMINADA', id, { titulo: tarea.titulo, id_modulo: tarea.id_modulo });
  }

  // Para el Inicio: totales por estado y desglose por módulo activo.
  async resumen({ id_asignado } = {}) {
    const where = id_asignado ? { id_asignado } : {};
    const [filas, modulos] = await Promise.all([this.tareas.contarPorModuloYEstado(where), this.modulos.listarActivos()]);

    const vacio = () => Object.fromEntries(ESTADOS_TAREA.map((e) => [e, 0]));
    const porEstado = vacio();
    const porModulo = new Map(
      modulos.map((m) => [m.id_modulo, {
        id_modulo: m.id_modulo,
        codigo_modulo: m.codigo_modulo,
        nombre_modulo: m.nombre_modulo,
        total: 0,
        por_estado: vacio(),
      }]),
    );

    for (const f of filas) {
      const n = f._count._all;
      if (f.estado in porEstado) porEstado[f.estado] += n;
      const m = porModulo.get(f.id_modulo);
      if (m) {
        m.total += n;
        if (f.estado in m.por_estado) m.por_estado[f.estado] += n;
      }
    }

    return {
      total: Object.values(porEstado).reduce((a, b) => a + b, 0),
      por_estado: porEstado,
      por_modulo: [...porModulo.values()],
    };
  }

  // ---- privados ----
  #construirFiltro({ id_modulo, estado, prioridad, id_asignado, q, vencidas }) {
    const where = {};
    if (id_modulo) where.id_modulo = id_modulo;
    if (estado) where.estado = estado;
    if (prioridad) where.prioridad = prioridad;
    if (id_asignado) where.id_asignado = id_asignado;
    if (q) {
      where.OR = [
        { titulo: { contains: q, mode: 'insensitive' } },
        { descripcion: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (vencidas) {
      where.fecha_limite = { lt: new Date() };
      where.estado = { not: ESTADO_FINAL };
    }
    return where;
  }

  async #validarModulo(id) {
    const modulo = await this.modulos.findById(id);
    if (!modulo) throw new BadRequestError('El módulo indicado no existe');
    if (!modulo.activo) throw new BadRequestError('El módulo indicado está inactivo');
  }

  async #validarUsuario(id) {
    const usuario = await this.usuarios.findById(id);
    if (!usuario) throw new BadRequestError('El usuario asignado no existe');
    if (!usuario.activo) throw new BadRequestError('El usuario asignado está inactivo');
  }

  #auditar(actor, accion, idEntidad, detalles) {
    return this.auditoria.registrar({
      id_usuario: actor.id_usuario, accion, entidad: 'Tarea', id_entidad: idEntidad, detalles,
    });
  }
}

module.exports = TareaService;
