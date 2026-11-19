// Lo que se expone por API: nunca la ruta del servidor ni el nombre almacenado.
const publico = {
  id_documento: true,
  id_modulo: true,
  id_tarea: true,
  nombre_original: true,
  tipo_mime: true,
  tamano_bytes: true,
  fecha_subida: true,
  modulo: { select: { id_modulo: true, codigo_modulo: true, nombre_modulo: true } },
  tarea: { select: { id_tarea: true, titulo: true } },
  subido_por: { select: { id_usuario: true, nombre: true } },
};

class DocumentoRepository {
  constructor({ prisma }) {
    this.prisma = prisma;
  }

  findMany({ where, skip, take }) {
    return this.prisma.documento.findMany({ where, skip, take, orderBy: { fecha_subida: 'desc' }, select: publico });
  }

  count(where) {
    return this.prisma.documento.count({ where });
  }

  findPublicoById(id) {
    return this.prisma.documento.findUnique({ where: { id_documento: id }, select: publico });
  }

  // Fila completa, solo para uso interno (descarga y eliminación).
  findInternoById(id) {
    return this.prisma.documento.findUnique({ where: { id_documento: id } });
  }

  create(data) {
    return this.prisma.documento.create({ data, select: publico });
  }

  delete(id) {
    return this.prisma.documento.delete({ where: { id_documento: id } });
  }
}

module.exports = DocumentoRepository;
