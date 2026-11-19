const tareaSelect = { select: { id_tarea: true, titulo: true } };

class RecordatorioRepository {
  constructor({ prisma }) {
    this.prisma = prisma;
  }

  findMany({ idUsuario, desde, hasta, pendientes, limit }) {
    return this.prisma.recordatorioEvento.findMany({
      where: {
        id_usuario: idUsuario,
        ...((desde || hasta) && { fecha_evento: { ...(desde && { gte: desde }), ...(hasta && { lte: hasta }) } }),
        ...(pendientes && { correo_enviado: false }),
      },
      orderBy: { fecha_evento: 'asc' },
      take: limit,
      include: { tarea: tareaSelect },
    });
  }

  findById(id) {
    return this.prisma.recordatorioEvento.findUnique({ where: { id_recordatorio: id }, include: { tarea: tareaSelect } });
  }

  create(data) {
    return this.prisma.recordatorioEvento.create({ data, include: { tarea: tareaSelect } });
  }

  update(id, data) {
    return this.prisma.recordatorioEvento.update({ where: { id_recordatorio: id }, data, include: { tarea: tareaSelect } });
  }

  delete(id) {
    return this.prisma.recordatorioEvento.delete({ where: { id_recordatorio: id } });
  }

  // Recordatorios cuya hora ya llegó, con correo habilitado, aún sin enviar y de usuarios activos.
  findPendientesDeEnvio(ahora, limit) {
    return this.prisma.recordatorioEvento.findMany({
      where: { enviar_correo: true, correo_enviado: false, fecha_evento: { lte: ahora }, usuario: { activo: true } },
      orderBy: { fecha_evento: 'asc' },
      take: limit,
      include: { usuario: { select: { id_usuario: true, nombre: true, email: true } }, tarea: tareaSelect },
    });
  }

  marcarEnviado(id) {
    return this.prisma.recordatorioEvento.update({
      where: { id_recordatorio: id }, data: { correo_enviado: true }, select: { id_recordatorio: true },
    });
  }
}

module.exports = RecordatorioRepository;
