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
}

module.exports = TareaRepository;
