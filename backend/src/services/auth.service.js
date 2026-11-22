const { UnauthorizedError, BadRequestError } = require('../lib/errors');
const { huellaDeClave } = require('../lib/huella');
const { problemaClave } = require('../lib/politicaClave');

class AuthService {
  constructor({ usuarioRepository, auditoriaRepository, tokenService, passwordHasher, sesionCache }) {
    this.usuarios = usuarioRepository;
    this.auditoria = auditoriaRepository;
    this.tokens = tokenService;
    this.hasher = passwordHasher;
    this.cache = sesionCache;
  }

  async login({ email, password }) {
    const usuario = await this.usuarios.findByEmailConPermisos(email);

    // Siempre se compara (con hash señuelo si no existe) y el error es genérico.
    const coincide = await this.hasher.compare(password, usuario?.password ?? this.hasher.dummyHash);
    if (!usuario || !coincide || !usuario.activo) {
      await this.auditoria.registrar({ accion: 'LOGIN_FALLIDO', entidad: 'Usuario', detalles: { email } });
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const perfil = this.#perfil(usuario);
    const token = this.#emitirToken(usuario, perfil);
    await this.auditoria.registrar({
      id_usuario: usuario.id_usuario, accion: 'LOGIN', entidad: 'Usuario', id_entidad: usuario.id_usuario,
    });

    return { token, usuario: perfil };
  }

  // Perfil con permisos vigentes en BD (el token puede traerlos desactualizados).
  async me(idUsuario) {
    const usuario = await this.usuarios.findByIdConPermisos(idUsuario);
    if (!usuario || !usuario.activo) throw new UnauthorizedError('Sesión inválida');
    return this.#perfil(usuario);
  }

  // Cambio de contraseña propio (cualquier rol). Devuelve un token nuevo: las demás sesiones quedan cerradas.
  // Errores de validación son 400 (NO 401): un 401 haría que la SPA cierre la sesión.
  async cambiarClave(idUsuario, { clave_actual, clave_nueva }) {
    const usuario = await this.usuarios.findByIdConPermisos(idUsuario);
    if (!usuario || !usuario.activo) throw new UnauthorizedError('Sesión inválida');

    if (!(await this.hasher.compare(clave_actual, usuario.password))) {
      await this.auditoria.registrar({ id_usuario: idUsuario, accion: 'CLAVE_CAMBIO_FALLIDO', entidad: 'Usuario', id_entidad: idUsuario });
      throw new BadRequestError('La contraseña actual no es correcta', [{ campo: 'clave_actual', mensaje: 'No coincide' }]);
    }
    const problema = problemaClave(clave_nueva, { email: usuario.email, claveActual: clave_actual });
    if (problema) throw new BadRequestError(problema, [{ campo: 'clave_nueva', mensaje: problema }]);

    const hash = await this.hasher.hash(clave_nueva);
    await this.usuarios.actualizarClave(idUsuario, hash);
    this.cache.invalidar(idUsuario);
    await this.auditoria.registrar({ id_usuario: idUsuario, accion: 'CLAVE_CAMBIADA', entidad: 'Usuario', id_entidad: idUsuario });

    const perfil = this.#perfil(usuario);
    return { token: this.#emitirToken({ id_usuario: idUsuario, password: hash }, perfil), usuario: perfil };
  }

  #emitirToken(usuario, perfil) {
    return this.tokens.firmar({ ...perfil, huella: huellaDeClave(usuario.password) });
  }

  #perfil(usuario) {
    return {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol.nombre_rol,
      permisos: usuario.rol.permisos_rol.map((pr) => pr.permiso.codigo_permiso),
    };
  }
}

module.exports = AuthService;
