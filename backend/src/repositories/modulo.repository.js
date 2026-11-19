class ModuloRepository {
  constructor({ prisma }) {
    this.prisma = prisma;
  }

  findById(id) {
    return this.prisma.modulo.findUnique({ where: { id_modulo: id } });
  }

  listarActivos() {
    return this.prisma.modulo.findMany({ where: { activo: true }, orderBy: { orden_visual: 'asc' } });
  }
}

module.exports = ModuloRepository;
