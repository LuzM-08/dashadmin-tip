const conteoDocumentos = { _count: { select: { documentos: true } } };

class ModuloRepository {
  constructor({ prisma }) {
    this.prisma = prisma;
  }

  findById(id) {
    return this.prisma.modulo.findUnique({ where: { id_modulo: id } });
  }

  findDetalle(id) {
    return this.prisma.modulo.findUnique({ where: { id_modulo: id }, include: conteoDocumentos });
  }

  listarActivos() {
    return this.prisma.modulo.findMany({
      where: { activo: true },
      orderBy: { orden_visual: 'asc' },
      include: conteoDocumentos,
    });
  }
}

module.exports = ModuloRepository;
