const { BadRequestError, ConflictError, NotFoundError } = require('../lib/errors');
const { problemaClave } = require('../lib/politicaClave');
const { PERMISO_ADMIN_USUARIOS } = require('../constants/usuario.constants');

// Administración de usuarios (solo jefatura, vía permiso usuarios:administrar).
class UsuarioAdminService {
  constructor({ usuarioRepository, auditoriaRepository, passwordHasher, sesionCache }) {
    this.usuarios = usuarioRepository;
    this.auditoria = auditoriaRepository;
    this.hasher = passwordHasher;
    this.cache = sesionCache;
  }

  listar() { return this.usuarios.listarTodos(); }

  listarRoles() { return this.usuarios.listarRoles(); }

  async crear({ nombre, email, rol, clave }, actor) {
    const problema = problemaClave(clave, { email });
    if (problema) throw new BadRequestError(problema, [{ campo: 'clave', mensaje: problema }]);

    const rolDb = await this.#rol(rol);
    if (await this.usuarios.findIdPorEmail(email)) throw new ConflictError('Ya existe un usuario con ese correo');

    const creado = await this.#conCorreoUnico(async () =>
      this.usuarios.crear({ nombre, email, password: await this.hasher.hash(clave), id_rol: rolDb.id_rol }));
    await this.#auditar(actor, 'USUARIO_CREADO', creado.id_usuario, { email, rol });
    return creado;
  }

  async actualizar(id, dto, actor) {
    const objetivo = await this.#obtener(id);
    const esYo = id === actor.id_usuario;
    const data = {};
    let rolNuevo = null;

    if (dto.nombre !== undefined) data.nombre = dto.nombre;

    if (dto.rol !== undefined && dto.rol !== objetivo.rol.nombre_rol) {
      if (esYo) throw new BadRequestError('No puedes cambiar tu propio rol');
      rolNuevo = await this.#rol(dto.rol);
      data.id_rol = rolNuevo.id_rol;
    }

    if (dto.activo !== undefined && dto.activo !== objetivo.activo) {
      if (esYo && !dto.activo) throw new BadRequestError('No puedes desactivar tu propia cuenta');
      data.activo = dto.activo;
    }

    if (Object.keys(data).length === 0) return objetivo;

    // Nunca dejar el sistema sin un administrador activo.
    const eraAdminActivo = objetivo.activo && (await this.#esAdmin(objetivo.rol.nombre_rol));
    const seguiraAdminActivo =
      (data.activo ?? objetivo.activo) &&
      (rolNuevo ? rolNuevo.permisos_rol.some((p) => p.permiso.codigo_permiso === PERMISO_ADMIN_USUARIOS) : await this.#esAdmin(objetivo.rol.nombre_rol));
    if (eraAdminActivo && !seguiraAdminActivo && (await this.usuarios.contarAdministradoresActivos()) <= 1) {
      throw new ConflictError('Debe quedar al menos una jefatura activa');
    }

    const actualizado = await this.usuarios.actualizar(id, data);
    this.cache.invalidar(id); // desactivación y cambio de rol rigen de inmediato
    await this.#auditar(actor, 'USUARIO_EDITADO', id, {
      campos: Object.keys(dto),
      ...(data.id_rol && { rol_anterior: objetivo.rol.nombre_rol, rol_nuevo: dto.rol }),
      ...(data.activo !== undefined && { activo: data.activo }),
    });
    return actualizado;
  }

  // La jefatura fija una contraseña nueva (p. ej. si alguien la olvidó). Las sesiones abiertas de esa persona se cierran.
  async restablecerClave(id, { clave }, actor) {
    const objetivo = await this.#obtener(id);
    if (id === actor.id_usuario) throw new BadRequestError('Para cambiar tu propia contraseña usa "Mi cuenta"');

    const problema = problemaClave(clave, { email: objetivo.email });
    if (problema) throw new BadRequestError(problema, [{ campo: 'clave', mensaje: problema }]);

    await this.usuarios.actualizarClave(id, await this.hasher.hash(clave));
    this.cache.invalidar(id);
    await this.#auditar(actor, 'USUARIO_CLAVE_RESTABLECIDA', id, { email: objetivo.email });
  }

  // ---- privados ----
  async #obtener(id) {
    const u = await this.usuarios.findAdminById(id);
    if (!u) throw new NotFoundError('Usuario no encontrado');
    return u;
  }

  async #rol(nombre) {
    const rol = await this.usuarios.findRolPorNombre(nombre);
    if (!rol) throw new BadRequestError('El rol indicado no existe en la base de datos (ejecuta el seed)');
    return rol;
  }

  async #esAdmin(nombreRol) {
    const rol = await this.usuarios.findRolPorNombre(nombreRol);
    return Boolean(rol?.permisos_rol.some((p) => p.permiso.codigo_permiso === PERMISO_ADMIN_USUARIOS));
  }

  // Dos altas simultáneas con el mismo correo: la restricción única de la BD gana y se traduce a 409.
  async #conCorreoUnico(fn) {
    try {
      return await fn();
    } catch (e) {
      if (e?.code === 'P2002') throw new ConflictError('Ya existe un usuario con ese correo');
      throw e;
    }
  }

  #auditar(actor, accion, idEntidad, detalles) {
    return this.auditoria.registrar({ id_usuario: actor.id_usuario, accion, entidad: 'Usuario', id_entidad: idEntidad, detalles });
  }
}

module.exports = UsuarioAdminService;
