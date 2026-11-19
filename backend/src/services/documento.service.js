const path = require('path');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../lib/errors');

// Sin permiso dedicado de eliminación en el seed: puede borrar quien subió el archivo o quien rota módulos (jefatura).
const PERMISO_ADMIN = 'modulos:rotar';

class DocumentoService {
  constructor({ documentoRepository, moduloRepository, tareaRepository, auditoriaRepository, almacenamiento, archivoValidator }) {
    this.documentos = documentoRepository;
    this.modulos = moduloRepository;
    this.tareas = tareaRepository;
    this.auditoria = auditoriaRepository;
    this.almacen = almacenamiento;
    this.validador = archivoValidator;
  }

  async listar({ id_modulo, id_tarea, q, page, limit }) {
    const where = {
      ...(id_modulo && { id_modulo }),
      ...(id_tarea && { id_tarea }),
      ...(q && { nombre_original: { contains: q, mode: 'insensitive' } }),
    };
    const [data, total] = await Promise.all([
      this.documentos.findMany({ where, skip: (page - 1) * limit, take: limit }),
      this.documentos.count(where),
    ]);
    return { data, meta: { page, limit, total, total_pages: Math.ceil(total / limit) } };
  }

  async obtener(id) {
    const documento = await this.documentos.findPublicoById(id);
    if (!documento) throw new NotFoundError('Documento no encontrado');
    return documento;
  }

  // Si algo falla aquí, el middleware de ruta borra el archivo ya guardado en disco.
  async subir({ archivo, dto }, actor) {
    if (!archivo) throw new BadRequestError('Debes adjuntar un archivo en el campo "archivo"');
    await this.#validarDestino(dto);

    const extension = path.extname(archivo.filename).toLowerCase();
    const { tipo_mime } = await this.validador.inspeccionar(archivo.path, extension);

    const documento = await this.documentos.create({
      id_modulo: dto.id_modulo,
      id_tarea: dto.id_tarea ?? null,
      id_subido_por: actor.id_usuario,
      nombre_original: this.validador.nombreSeguro(archivo.originalname),
      nombre_almacenado: archivo.filename,
      ruta_archivo: archivo.path,
      tipo_mime,
      tamano_bytes: archivo.size,
    });

    await this.#auditar(actor, 'DOCUMENTO_SUBIDO', documento.id_documento, {
      nombre: documento.nombre_original, id_modulo: dto.id_modulo, id_tarea: dto.id_tarea ?? null, bytes: archivo.size,
    });
    return documento;
  }

  // Devuelve lo necesario para que la capa HTTP envíe el archivo (la ruta se arma con nombre_almacenado, no con la BD).
  async prepararDescarga(id, { enLinea }) {
    const doc = await this.documentos.findInternoById(id);
    if (!doc) throw new NotFoundError('Documento no encontrado');
    if (!(await this.almacen.existe(doc.nombre_almacenado))) {
      throw new NotFoundError('El archivo ya no está disponible en el servidor');
    }
    const extension = path.extname(doc.nombre_almacenado);
    return {
      raiz: this.almacen.directorio,
      nombre_almacenado: doc.nombre_almacenado,
      nombre_original: doc.nombre_original,
      tipo_mime: doc.tipo_mime ?? 'application/octet-stream',
      en_linea: Boolean(enLinea) && this.validador.admiteVistaPrevia(extension),
    };
  }

  async eliminar(id, actor) {
    const doc = await this.documentos.findInternoById(id);
    if (!doc) throw new NotFoundError('Documento no encontrado');

    const esAutor = doc.id_subido_por === actor.id_usuario;
    const esAdmin = actor.permisos.includes(PERMISO_ADMIN);
    if (!esAutor && !esAdmin) throw new ForbiddenError('Solo quien subió el documento o la jefatura pueden eliminarlo');

    // Primero la BD (fuente de verdad); si el archivo no se puede borrar queda un huérfano, pero nunca un registro roto.
    await this.documentos.delete(id);
    await this.almacen.eliminar(doc.nombre_almacenado).catch((e) =>
      console.error(`[documentos] No se pudo borrar ${doc.nombre_almacenado}:`, e.message));
    await this.#auditar(actor, 'DOCUMENTO_ELIMINADO', id, { nombre: doc.nombre_original, id_modulo: doc.id_modulo });
  }

  // ---- privados ----
  async #validarDestino({ id_modulo, id_tarea }) {
    const modulo = await this.modulos.findById(id_modulo);
    if (!modulo) throw new BadRequestError('El módulo indicado no existe');
    if (!modulo.activo) throw new BadRequestError('El módulo indicado está inactivo');

    if (id_tarea) {
      const tarea = await this.tareas.findById(id_tarea);
      if (!tarea) throw new BadRequestError('La tarea indicada no existe');
      if (tarea.id_modulo !== id_modulo) throw new BadRequestError('La tarea no pertenece al módulo indicado');
    }
  }

  #auditar(actor, accion, idEntidad, detalles) {
    return this.auditoria.registrar({
      id_usuario: actor.id_usuario, accion, entidad: 'Documento', id_entidad: idEntidad, detalles,
    });
  }
}

module.exports = DocumentoService;
