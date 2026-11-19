class AuditoriaRepository {
  constructor({ prisma }) {
    this.prisma = prisma;
  }

  registrar({ id_usuario, accion, entidad, id_entidad, detalles }) {
    return this.prisma.logAuditoria.create({
      data: {
        id_usuario: id_usuario ?? null,
        accion,
        entidad,
        id_entidad: id_entidad ?? null,
        detalles: detalles ? JSON.stringify(detalles) : null,
      },
    });
  }
}

module.exports = AuditoriaRepository;
