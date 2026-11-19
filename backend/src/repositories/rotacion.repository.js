const include = {
  modulo: { select: { id_modulo: true, codigo_modulo: true, nombre_modulo: true } },
  responsable: { select: { id_usuario: true, nombre: true, email: true, activo: true } },
};

class RotacionRepository {
  constructor({ prisma }) {
    this.prisma = prisma;
  }

  findById(id) {
    return this.prisma.rotacionSemanal.findUnique({ where: { id_rotacion: id }, include });
  }

  // Rotaciones que cubren el instante `ahora` (más reciente primero).
  findVigentes(ahora, idModulo) {
    return this.prisma.rotacionSemanal.findMany({
      where: { ...(idModulo && { id_modulo: idModulo }), fecha_inicio: { lte: ahora }, fecha_fin: { gte: ahora } },
      orderBy: { fecha_inicio: 'desc' },
      include,
    });
  }

  findProxima(idModulo, ahora) {
    return this.prisma.rotacionSemanal.findFirst({
      where: { id_modulo: idModulo, fecha_inicio: { gt: ahora } },
      orderBy: { fecha_inicio: 'asc' },
      include,
    });
  }

  // Rotaciones cuyo rango se cruza con [inicio, fin]. idModulo opcional.
  findSolapadas(idModulo, inicio, fin) {
    return this.prisma.rotacionSemanal.findMany({
      where: { ...(idModulo && { id_modulo: idModulo }), fecha_inicio: { lte: fin }, fecha_fin: { gte: inicio } },
      include,
    });
  }

  findMany({ idModulo, desde, hasta, limit }) {
    return this.prisma.rotacionSemanal.findMany({
      where: {
        id_modulo: idModulo,
        ...(desde && { fecha_fin: { gte: desde } }),
        ...(hasta && { fecha_inicio: { lte: hasta } }),
      },
      orderBy: { fecha_inicio: 'desc' },
      take: limit,
      include,
    });
  }

  create(data) {
    return this.prisma.rotacionSemanal.create({ data, include });
  }

  // Atómico: o se crean todas o ninguna.
  crearVarias(lista) {
    return this.prisma.$transaction(lista.map((data) => this.prisma.rotacionSemanal.create({ data, include })));
  }

  update(id, data) {
    return this.prisma.rotacionSemanal.update({ where: { id_rotacion: id }, data, include });
  }

  delete(id) {
    return this.prisma.rotacionSemanal.delete({ where: { id_rotacion: id } });
  }
}

module.exports = RotacionRepository;
