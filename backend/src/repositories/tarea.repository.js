const usuarioSelect = { id_usuario: true, nombre: true, email: true }; // nunca exponer password

const include = {
  modulo: { select: { id_modulo: true, codigo_modulo: true, nombre_modulo: true } },
  creador: { select: usuarioSelect },
  asignado: { select: usuarioSelect },
  _count: { select: { documentos: true } },
};

class TareaRepository {
  constructor({ prisma }) {
    this.prisma = prisma;
  }

  findMany({ where, skip, take, orderBy }) {
    return this.prisma.tarea.findMany({ where, skip, take, orderBy, include });
  }

  count(where) {
    return this.prisma.tarea.count({ where });
  }

  findById(id) {
    return this.prisma.tarea.findUnique({ where: { id_tarea: id }, include });
  }

  create(data) {
    return this.prisma.tarea.create({ data, include });
  }

  update(id, data) {
    return this.prisma.tarea.update({ where: { id_tarea: id }, data, include });
  }

  delete(id) {
    return this.prisma.tarea.delete({ where: { id_tarea: id } });
  }

  contarPorModuloYEstado(where = {}) {
    return this.prisma.tarea.groupBy({ by: ['id_modulo', 'estado'], where, _count: { _all: true } });
  }

  // ---- Alertas y calendario ----
  findParaAlertaLimite({ hasta, estadoFinal, limit }) {
    return this.prisma.tarea.findMany({
      where: { alerta_enviada: false, estado: { not: estadoFinal }, fecha_limite: { lte: hasta } },
      orderBy: { fecha_limite: 'asc' },
      take: limit,
      include: {
        modulo: { select: { id_modulo: true, codigo_modulo: true, nombre_modulo: true } },
        asignado: { select: { id_usuario: true, nombre: true, email: true, activo: true } },
      },
    });
  }

  // Se reenvía fecha_actualizacion para que marcar la alerta no altere "última modificación" de la tarea.
  marcarAlertaEnviada(id, fechaActualizacion) {
    return this.prisma.tarea.update({
      where: { id_tarea: id },
      data: { alerta_enviada: true, fecha_actualizacion: fechaActualizacion },
      select: { id_tarea: true },
    });
  }

  findCalendario({ idUsuario, desde, hasta }) {
    return this.prisma.tarea.findMany({
      where: { id_asignado: idUsuario, fecha_limite: { gte: desde, lte: hasta } },
      orderBy: { fecha_limite: 'asc' },
      select: {
        id_tarea: true, titulo: true, estado: true, prioridad: true, fecha_limite: true, id_modulo: true,
        modulo: { select: { nombre_modulo: true } },
      },
    });
  }
}

module.exports = TareaRepository;
